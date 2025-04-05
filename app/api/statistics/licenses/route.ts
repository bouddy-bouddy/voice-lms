import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/db/connection";
import { models, LicenseStatus } from "@/db/models";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    await dbConnect();

    // Get total licenses count
    const totalLicenses = await models.License.countDocuments();

    // Count licenses by status
    const activeLicenses = await models.License.countDocuments({
      status: LicenseStatus.ACTIVE,
    });

    const expiredLicenses = await models.License.countDocuments({
      status: LicenseStatus.EXPIRED,
    });

    const revokedLicenses = await models.License.countDocuments({
      status: LicenseStatus.REVOKED,
    });

    // Count total devices
    const totalDevices = await models.Device.countDocuments();

    // Get recently activated licenses
    const recentActivations = await models.ActivationLog.find({
      action: "ACTIVATE",
      success: true,
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .populate("licenseId", "licenseKey fullName");

    // Format recent activations
    const recentActivationsList = recentActivations.map((log) => ({
      id: log._id.toString(),
      licenseKey: log.licenseId ? (log.licenseId as any).licenseKey : "Unknown",
      fullName: log.licenseId ? (log.licenseId as any).fullName : "Unknown",
      deviceId: log.deviceId,
      timestamp: log.timestamp,
    }));

    // Return statistics
    return NextResponse.json({
      totalLicenses,
      activeLicenses,
      expiredLicenses,
      revokedLicenses,
      totalDevices,
      recentActivations: recentActivationsList,
    });
  } catch (error) {
    console.error("Error fetching license statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch license statistics" },
      { status: 500 }
    );
  }
}
