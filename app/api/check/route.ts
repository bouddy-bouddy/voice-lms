import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/db/connection";
import { models, LicenseStatus, LogAction } from "@/db/models";

// Input validation schema for license checking
const checkSchema = z.object({
  licenseKey: z.string().min(10),
  deviceId: z.string().min(8),
});

// Check and log IP address
function getIPAddress(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "unknown";
}

// Check if a license is valid for a specific device
export async function POST(req: NextRequest) {
  try {
    // Connect to MongoDB
    await dbConnect();

    // Validate input
    const body = await req.json();
    const validationResult = checkSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid input data",
        },
        { status: 400 }
      );
    }

    const { licenseKey, deviceId } = validationResult.data;

    // Get IP address
    const ipAddress = getIPAddress(req);

    // Find the license
    const license = await models.License.findOne({ licenseKey });

    // If license doesn't exist
    if (!license) {
      return NextResponse.json({
        valid: false,
        error: "Invalid license key",
      });
    }

    // Check if license is active
    if (license.status !== LicenseStatus.ACTIVE) {
      await models.ActivationLog.create({
        licenseId: license._id,
        deviceId,
        ipAddress,
        action: LogAction.CHECK,
        success: false,
        details: `License check failed. Status: ${license.status}`,
      });

      return NextResponse.json({
        valid: false,
        error: `License is not active (${license.status.toLowerCase()})`,
      });
    }

    // Check if license has expired
    if (license.expiresAt < new Date()) {
      // Update license status to EXPIRED
      await models.License.findByIdAndUpdate(license._id, {
        status: LicenseStatus.EXPIRED,
        updatedAt: new Date(),
      });

      await models.ActivationLog.create({
        licenseId: license._id,
        deviceId,
        ipAddress,
        action: LogAction.CHECK,
        success: false,
        details: "License has expired",
      });

      return NextResponse.json({
        valid: false,
        error: "License has expired",
        expiryDate: license.expiresAt.toISOString(),
      });
    }

    // Check if device is registered with this license
    const device = await models.Device.findOne({
      licenseId: license._id,
      deviceId,
    });

    if (!device) {
      await models.ActivationLog.create({
        licenseId: license._id,
        deviceId,
        ipAddress,
        action: LogAction.CHECK,
        success: false,
        details: "Device not registered with this license",
      });

      return NextResponse.json({
        valid: false,
        error: "This device is not registered with this license",
      });
    }

    // Update last seen timestamp
    await models.Device.findByIdAndUpdate(device._id, {
      lastSeenAt: new Date(),
      ipAddress,
    });

    await models.ActivationLog.create({
      licenseId: license._id,
      deviceId,
      ipAddress,
      action: LogAction.CHECK,
      success: true,
      details: "License check successful",
    });

    // Get device count
    const deviceCount = await models.Device.countDocuments({
      licenseId: license._id,
    });

    return NextResponse.json({
      valid: true,
      licenseInfo: {
        fullName: license.fullName,
        expiresAt: license.expiresAt.toISOString(),
        status: license.status,
        deviceCount: deviceCount,
        maxDevices: license.maxDevices,
        daysRemaining: Math.max(
          0,
          Math.ceil(
            (license.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        ),
      },
    });
  } catch (error) {
    console.error("Error checking license:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Failed to check license",
      },
      { status: 500 }
    );
  }
}
