import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/db/connection";
import mongoose from "mongoose";
import { z } from "zod";

// Define a schema for settings
const SettingsSchema = new mongoose.Schema({
  emailNotificationsEnabled: { type: Boolean, default: true },
  emailHost: { type: String, default: "" },
  emailPort: { type: Number, default: 587 },
  emailUser: { type: String, default: "" },
  emailPassword: { type: String, default: "" },
  emailFrom: { type: String, default: "" },
  defaultLicenseDuration: { type: Number, default: 365 },
  defaultMaxDevices: { type: Number, default: 1 },
  trialPeriodDays: { type: Number, default: 7 },
  lastUpdated: { type: Date, default: Date.now },
});

// Create the model if it doesn't exist
const Settings =
  mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

// Input validation schema
const settingsUpdateSchema = z.object({
  emailNotificationsEnabled: z.boolean().optional(),
  emailHost: z.string().optional(),
  emailPort: z.number().min(1).max(65535).optional(),
  emailUser: z.string().optional(),
  emailPassword: z.string().optional(),
  emailFrom: z.string().email().optional(),
  defaultLicenseDuration: z.number().min(1).max(3650).optional(),
  defaultMaxDevices: z.number().min(1).max(10).optional(),
  trialPeriodDays: z.number().min(1).max(30).optional(),
});

// Get settings
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    await dbConnect();

    // Get settings, create default if not exists
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    // Remove sensitive data
    const safeSettings = {
      emailNotificationsEnabled: settings.emailNotificationsEnabled,
      emailHost: settings.emailHost,
      emailPort: settings.emailPort,
      emailUser: settings.emailUser,
      emailFrom: settings.emailFrom,
      defaultLicenseDuration: settings.defaultLicenseDuration,
      defaultMaxDevices: settings.defaultMaxDevices,
      trialPeriodDays: settings.trialPeriodDays,
      lastUpdated: settings.lastUpdated,
    };

    return NextResponse.json({ settings: safeSettings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// Update settings
export async function PUT(req: NextRequest) {
  try {
    // Check authentication - only admins can update settings
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    await dbConnect();

    // Validate input
    const body = await req.json();
    const validationResult = settingsUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid settings data" },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Get current settings
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    // Update settings
    Object.keys(updateData).forEach((key) => {
      if (key !== "emailPassword" || updateData.emailPassword) {
        settings[key] = updateData[key];
      }
    });

    // Update last updated timestamp
    settings.lastUpdated = new Date();

    await settings.save();

    // Return updated settings without sensitive data
    const safeSettings = {
      emailNotificationsEnabled: settings.emailNotificationsEnabled,
      emailHost: settings.emailHost,
      emailPort: settings.emailPort,
      emailUser: settings.emailUser,
      emailFrom: settings.emailFrom,
      defaultLicenseDuration: settings.defaultLicenseDuration,
      defaultMaxDevices: settings.defaultMaxDevices,
      trialPeriodDays: settings.trialPeriodDays,
      lastUpdated: settings.lastUpdated,
    };

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: safeSettings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
