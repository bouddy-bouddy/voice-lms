import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/db/connection";
import { models } from "@/db/models";
import { z } from "zod";
import mongoose from "mongoose";

// Input validation schema for updating a license
const licenseUpdateSchema = z.object({
  fullName: z.string().min(3).optional(),
  cinNumber: z.string().min(5).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().min(8).optional(),
  institution: z.string().min(2).optional(),
  maxDevices: z.number().int().min(1).max(10).optional(),
  expiresAt: z.string().optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "REVOKED"]).optional(),
});

// Get a single license by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    await dbConnect();

    const id = (await params).id;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid license ID" },
        { status: 400 }
      );
    }

    // Fetch the license
    const license = await models.License.findById(id);

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    // Fetch related devices
    const devices = await models.Device.find({ licenseId: license._id });

    // Fetch related activation logs (latest 20)
    const activationLogs = await models.ActivationLog.find({
      licenseId: license._id,
    })
      .sort({ timestamp: -1 })
      .limit(20);

    // Format the license data for the response
    const licenseData = {
      id: license._id.toString(),
      licenseKey: license.licenseKey,
      fullName: license.fullName,
      cinNumber: license.cinNumber,
      email: license.email,
      phoneNumber: license.phoneNumber,
      institution: license.institution,
      maxDevices: license.maxDevices,
      status: license.status,
      createdAt: license.createdAt,
      expiresAt: license.expiresAt,
      updatedAt: license.updatedAt,
      devices: devices.map((device) => ({
        id: device._id.toString(),
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        firstSeenAt: device.firstSeenAt,
        lastSeenAt: device.lastSeenAt,
        ipAddress: device.ipAddress,
      })),
      activationLogs: activationLogs.map((log) => ({
        id: log._id.toString(),
        deviceId: log.deviceId,
        ipAddress: log.ipAddress,
        action: log.action,
        timestamp: log.timestamp,
        success: log.success,
        details: log.details,
      })),
    };

    return NextResponse.json({ license: licenseData });
  } catch (error) {
    console.error("Error fetching license:", error);
    return NextResponse.json(
      { error: "Failed to fetch license" },
      { status: 500 }
    );
  }
}

// Update a license
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    await dbConnect();

    const id = (await params).id;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid license ID" },
        { status: 400 }
      );
    }

    // Validate input
    const body = await request.json();
    const validationResult = licenseUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.format() },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // If expiration date is provided, convert to Date
    if (updateData.expiresAt) {
      // Create an explicit updateObject to maintain type safety
      const updateObject: any = { ...updateData };
      updateObject.expiresAt = new Date(updateData.expiresAt);

      // Update the license with the properly typed object
      const license = await models.License.findByIdAndUpdate(
        id,
        {
          ...updateObject,
          updatedAt: new Date(),
        },
        { new: true } // Return the updated document
      );

      if (!license) {
        return NextResponse.json(
          { error: "License not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: "License updated successfully",
        license: {
          id: license._id.toString(),
          licenseKey: license.licenseKey,
          fullName: license.fullName,
          email: license.email,
          status: license.status,
          expiresAt: license.expiresAt,
        },
      });
    } else {
      // If no expiration date is provided, just update with the data as is
      const license = await models.License.findByIdAndUpdate(
        id,
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true } // Return the updated document
      );

      if (!license) {
        return NextResponse.json(
          { error: "License not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: "License updated successfully",
        license: {
          id: license._id.toString(),
          licenseKey: license.licenseKey,
          fullName: license.fullName,
          email: license.email,
          status: license.status,
          expiresAt: license.expiresAt,
        },
      });
    }
  } catch (error) {
    console.error("Error updating license:", error);

    if (error instanceof mongoose.Error.DocumentNotFoundError) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update license" },
      { status: 500 }
    );
  }
}

// Delete a license
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    await dbConnect();

    const id = (await params).id;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid license ID" },
        { status: 400 }
      );
    }

    // First check if license exists
    const licenseExists = await models.License.findById(id);
    if (!licenseExists) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    // Delete related records without using a session
    // Since Mongoose 6+, we don't need to use a session for basic operations
    // Delete activation logs
    await models.ActivationLog.deleteMany({ licenseId: id });

    // Delete devices
    await models.Device.deleteMany({ licenseId: id });

    // Delete the license
    await models.License.findByIdAndDelete(id);

    return NextResponse.json({
      message: "License deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting license:", error);

    if (error instanceof mongoose.Error.DocumentNotFoundError) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete license" },
      { status: 500 }
    );
  }
}
