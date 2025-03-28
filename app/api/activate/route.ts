import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UAParser } from "ua-parser-js";
import dbConnect from "@/db/connection";
import { models, LicenseStatus, LogAction } from "@/db/models";

// Input validation schema for license activation
const activationSchema = z.object({
  licenseKey: z.string().min(10),
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

// Activate a license for a specific device
export async function POST(req: NextRequest) {
  try {
    // Connect to MongoDB
    await dbConnect();

    // Validate input
    const body = await req.json();
    const validationResult = activationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
        },
        { status: 400 }
      );
    }

    const { licenseKey, deviceId, deviceName } = validationResult.data;

    // Get IP address
    const ipAddress = getIPAddress(req);

    // Get device info
    const deviceInfo = getDeviceInfo(req);
    const finalDeviceName = deviceName || deviceInfo.name;

    // Find the license
    const license = await models.License.findOne({ licenseKey });

    // If license doesn't exist
    if (!license) {
      // Log the failed activation attempt
      await models.ActivationLog.create({
        licenseId: "unknown",
        deviceId,
        ipAddress,
        action: LogAction.ACTIVATE,
        success: false,
        details: `Invalid license key: ${licenseKey}`,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Invalid license key",
        },
        { status: 400 }
      );
    }

    // Check if license is active
    if (license.status !== LicenseStatus.ACTIVE) {
      await models.ActivationLog.create({
        licenseId: license._id,
        deviceId,
        ipAddress,
        action: LogAction.ACTIVATE,
        success: false,
        details: `License is not active. Current status: ${license.status}`,
      });

      return NextResponse.json(
        {
          success: false,
          error: `License is not active (${license.status.toLowerCase()})`,
        },
        { status: 403 }
      );
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
        action: LogAction.ACTIVATE,
        success: false,
        details: "License has expired",
      });

      return NextResponse.json(
        {
          success: false,
          error: "License has expired",
          expiryDate: license.expiresAt.toISOString(),
        },
        { status: 403 }
      );
    }

    // Find all devices for this license
    const devices = await models.Device.find({ licenseId: license._id });

    // Check if device is already registered
    const existingDevice = devices.find((d) => d.deviceId === deviceId);

    if (existingDevice) {
      // Update last seen
      await models.Device.findByIdAndUpdate(existingDevice._id, {
        lastSeenAt: new Date(),
        ipAddress,
      });

      await models.ActivationLog.create({
        licenseId: license._id,
        deviceId,
        ipAddress,
        action: LogAction.VALIDATE,
        success: true,
        details: "Device already activated",
      });

      return NextResponse.json({
        success: true,
        message: "License is valid",
        licenseInfo: {
          fullName: license.fullName,
          expiresAt: license.expiresAt.toISOString(),
          status: license.status,
        },
      });
    }

    // Check if max devices limit reached
    if (devices.length >= license.maxDevices) {
      await models.ActivationLog.create({
        licenseId: license._id,
        deviceId,
        ipAddress,
        action: LogAction.ACTIVATE,
        success: false,
        details: `Max device limit reached. Current: ${devices.length}, Max: ${license.maxDevices}`,
      });

      return NextResponse.json(
        {
          success: false,
          error: "License is already activated on maximum number of devices",
          currentDevices: devices.length,
          maxDevices: license.maxDevices,
        },
        { status: 403 }
      );
    }

    // Register the new device
    await models.Device.create({
      deviceId,
      deviceName: finalDeviceName,
      deviceType: deviceInfo.type,
      ipAddress,
      licenseId: license._id,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    });

    await models.ActivationLog.create({
      licenseId: license._id,
      deviceId,
      ipAddress,
      action: LogAction.ACTIVATE,
      success: true,
      details: `Device successfully activated. Device ${
        devices.length + 1
      } of ${license.maxDevices}`,
    });

    return NextResponse.json({
      success: true,
      message: "License activated successfully",
      licenseInfo: {
        fullName: license.fullName,
        expiresAt: license.expiresAt.toISOString(),
        status: license.status,
        deviceCount: devices.length + 1,
        maxDevices: license.maxDevices,
      },
    });
  } catch (error) {
    console.error("Error activating license:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to activate license",
      },
      { status: 500 }
    );
  }
}
