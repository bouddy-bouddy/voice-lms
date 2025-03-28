import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/db/connection";
import { models, LicenseStatus } from "@/db/models";
import { sendLicenseEmailWithTextFallback } from "@/lib/email-service";
import crypto from "crypto";
import { z } from "zod";

// Input validation schema for creating a license
const licenseSchema = z.object({
  fullName: z.string().min(3),
  cinNumber: z.string().min(5),
  email: z.string().email(),
  phoneNumber: z.string().min(8),
  maxDevices: z.number().int().min(1).max(10),
  expiresAt: z.string().optional(),
  sendEmail: z.boolean().optional().default(true),
});

// Generate a secure license key
function generateLicenseKey() {
  const prefix = "VM-";
  const randomBytes = crypto.randomBytes(16).toString("hex").toUpperCase();

  // Format as: VM-XXXX-XXXX-XXXX-XXXX
  const key = `${prefix}${randomBytes.slice(0, 4)}-${randomBytes.slice(
    4,
    8
  )}-${randomBytes.slice(8, 12)}-${randomBytes.slice(12, 16)}`;
  return key;
}

// Create a new license
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    await dbConnect();

    // Validate input
    const body = await req.json();
    const validationResult = licenseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.format() },
        { status: 400 }
      );
    }

    const {
      fullName,
      cinNumber,
      email,
      phoneNumber,
      maxDevices,
      expiresAt,
      sendEmail,
    } = validationResult.data;

    // Generate license key
    const licenseKey = generateLicenseKey();

    // Default expiration to one year from now if not specified
    const expiration = expiresAt
      ? new Date(expiresAt)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Create the license
    const license = await models.License.create({
      licenseKey,
      fullName,
      cinNumber,
      email,
      phoneNumber,
      maxDevices: maxDevices || 1,
      expiresAt: expiration,
      status: LicenseStatus.ACTIVE,
    });

    // Send license details via email if sendEmail is true
    let emailSent = false;
    if (sendEmail !== false) {
      try {
        emailSent = await sendLicenseEmailWithTextFallback(license);
      } catch (emailError) {
        console.error("Failed to send license email:", emailError);
        // Continue with the response even if email fails
      }
    }

    return NextResponse.json(
      {
        message: "License created successfully",
        emailSent,
        license: {
          id: license._id.toString(),
          licenseKey: license.licenseKey,
          fullName: license.fullName,
          maxDevices: license.maxDevices,
          expiresAt: license.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating license:", error);
    return NextResponse.json(
      { error: "Failed to create license" },
      { status: 500 }
    );
  }
}

// Get all licenses with filtering options
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    await dbConnect();

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const name = searchParams.get("name");
    const cinNumber = searchParams.get("cinNumber");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};

    if (name) {
      filter.$or = [
        { fullName: { $regex: name, $options: "i" } },
        { cinNumber: { $regex: name, $options: "i" } },
      ];
    }

    if (cinNumber) {
      filter.cinNumber = { $regex: cinNumber, $options: "i" };
    }

    if (status) {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get total count for pagination
    const total = await models.License.countDocuments(filter);

    // Get licenses with pagination
    const licenses = await models.License.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Map licenses to response format and include device counts
    const mappedLicenses = await Promise.all(
      licenses.map(async (license) => {
        // Count devices for each license
        const deviceCount = await models.Device.countDocuments({
          licenseId: license._id,
        });

        return {
          id: license._id.toString(),
          licenseKey: license.licenseKey,
          fullName: license.fullName,
          cinNumber: license.cinNumber,
          email: license.email,
          maxDevices: license.maxDevices,
          status: license.status,
          createdAt: license.createdAt,
          expiresAt: license.expiresAt,
          _count: {
            devices: deviceCount,
          },
        };
      })
    );

    return NextResponse.json({
      licenses: mappedLicenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching licenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch licenses" },
      { status: 500 }
    );
  }
}
