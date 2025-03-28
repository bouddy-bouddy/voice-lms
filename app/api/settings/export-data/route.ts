import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/db/connection";
import { models } from "@/db/models";
import { format } from "date-fns";

// Export license data as CSV
export async function GET(req: NextRequest) {
  try {
    // Check authentication - only admins can export data
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    await dbConnect();

    // Get all licenses
    const licenses = await models.License.find().sort({ createdAt: -1 });

    // Create CSV header
    const csvHeader = [
      "License Key",
      "Full Name",
      "CIN Number",
      "Email",
      "Phone",
      "Max Devices",
      "Status",
      "Created Date",
      "Expiry Date",
    ].join(",");

    // Create CSV rows
    const csvRows = licenses.map((license) => {
      return [
        license.licenseKey,
        `"${license.fullName.replace(/"/g, '""')}"`, // Handle quotes in names
        license.cinNumber,
        license.email,
        license.phoneNumber,
        license.maxDevices,
        license.status,
        format(new Date(license.createdAt), "yyyy-MM-dd"),
        format(new Date(license.expiresAt), "yyyy-MM-dd"),
      ].join(",");
    });

    // Combine header and rows
    const csv = [csvHeader, ...csvRows].join("\n");

    // Create filename with current date
    const filename = `voxmark-licenses-${format(new Date(), "yyyy-MM-dd")}.csv`;

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error("Error exporting license data:", error);
    return NextResponse.json(
      { error: "Failed to export license data" },
      { status: 500 }
    );
  }
}
