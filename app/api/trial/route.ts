import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { UAParser } from "ua-parser-js";
import dbConnect from "@/db/connection";
import { models } from "@/db/models";

// Input validation schema for trial registration/check
const trialSchema = z.object({
  deviceId: z.string().min(8),
  deviceName: z.string().optional(),
});

// Check and log IP address
function getIPAddress(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "unknown";
}

// Get device info from user agent
function getDeviceInfo(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "";
  const parser = new UAParser(userAgent);

  const device = parser.getDevice();
  const os = parser.getOS();
  const browser = parser.getBrowser();

  return {
    type: device.type || "unknown",
    name: [device.vendor, device.model, os.name, os.version, browser.name]
      .filter(Boolean)
      .join(" - "),
  };
}

// Register or validate a trial
export async function POST(req: NextRequest) {
  try {
    // Validate input
    const body = await req.json();
    const validationResult = trialSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid input data",
        },
        { status: 400 }
      );
    }

    const { deviceId, deviceName } = validationResult.data;

    // Connect to MongoDB
    await dbConnect();

    // Get IP address and device info
    const ipAddress = getIPAddress(req);
    const deviceInfo = getDeviceInfo(req);
    const finalDeviceName = deviceName || deviceInfo.name;

    // Get trial period duration from env
    const trialPeriodDays = process.env.TRIAL_PERIOD_DAYS
      ? parseInt(process.env.TRIAL_PERIOD_DAYS)
      : 7;

    // Find existing trial for this device
    const existingTrial = await models.TrialUsage.findOne({ deviceId });

    if (existingTrial) {
      // Update last seen and increment usage count
      await models.TrialUsage.findByIdAndUpdate(existingTrial._id, {
        lastSeenAt: new Date(),
        ipAddress,
        $inc: { usageCount: 1 },
      });

      // Check if trial has expired
      if (existingTrial.trialExpiresAt < new Date()) {
        return NextResponse.json({
          valid: false,
          trialExpired: true,
          message: "Your trial period has ended",
          trialInfo: {
            startedAt: existingTrial.trialStartedAt.toISOString(),
            expiredAt: existingTrial.trialExpiresAt.toISOString(),
            daysUsed: trialPeriodDays,
          },
        });
      }

      // Calculate days remaining
      const daysRemaining = Math.max(
        0,
        Math.ceil(
          (existingTrial.trialExpiresAt.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      );

      return NextResponse.json({
        valid: true,
        message: "Trial is active",
        trialInfo: {
          startedAt: existingTrial.trialStartedAt.toISOString(),
          expiresAt: existingTrial.trialExpiresAt.toISOString(),
          daysRemaining,
          daysTotal: trialPeriodDays,
          usageCount: existingTrial.usageCount,
        },
      });
    }

    // Create new trial
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + trialPeriodDays);

    const newTrial = await models.TrialUsage.create({
      deviceId,
      deviceName: finalDeviceName,
      ipAddress,
      trialExpiresAt,
    });

    return NextResponse.json({
      valid: true,
      message: "Trial started successfully",
      trialInfo: {
        startedAt: newTrial.trialStartedAt.toISOString(),
        expiresAt: newTrial.trialExpiresAt.toISOString(),
        daysRemaining: trialPeriodDays,
        daysTotal: trialPeriodDays,
        usageCount: 1,
      },
    });
  } catch (error) {
    console.error("Error managing trial:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Failed to register trial",
      },
      { status: 500 }
    );
  }
}

// Get trial statistics for admin
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    await dbConnect();

    // Count active trials
    const now = new Date();
    const activeTrials = await models.TrialUsage.countDocuments({
      trialExpiresAt: {
        $gte: now,
      },
      converted: false,
    });

    // Count expired trials
    const expiredTrials = await models.TrialUsage.countDocuments({
      trialExpiresAt: {
        $lt: now,
      },
      converted: false,
    });

    // Count converted trials
    const convertedTrials = await models.TrialUsage.countDocuments({
      converted: true,
    });

    // Get recent trial usage
    const recentTrials = await models.TrialUsage.find()
      .sort({ lastSeenAt: -1 })
      .limit(10);

    // Calculate total trials
    const totalTrials = activeTrials + expiredTrials + convertedTrials;

    // Calculate conversion rate
    const conversionRate =
      totalTrials > 0
        ? ((convertedTrials / totalTrials) * 100).toFixed(2) + "%"
        : "0%";

    return NextResponse.json({
      stats: {
        activeTrials,
        expiredTrials,
        convertedTrials,
        totalTrials,
        conversionRate,
      },
      recentTrials: recentTrials.map((trial) => ({
        id: trial._id.toString(),
        deviceId: trial.deviceId,
        deviceName: trial.deviceName,
        trialStartedAt: trial.trialStartedAt,
        trialExpiresAt: trial.trialExpiresAt,
        lastSeenAt: trial.lastSeenAt,
        converted: trial.converted,
        usageCount: trial.usageCount,
      })),
    });
  } catch (error) {
    console.error("Error fetching trial statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch trial statistics" },
      { status: 500 }
    );
  }
}
