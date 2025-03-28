import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/db/connection";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { z } from "zod";

// Input validation schema
const testEmailSchema = z.object({
  email: z.string().email(),
});

// Get the Settings model
const Settings = mongoose.models.Settings;

// Send test email to verify email configuration
export async function POST(req: NextRequest) {
  try {
    // Check authentication - only admins can send test emails
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    await dbConnect();

    // Validate input
    const body = await req.json();
    const validationResult = testEmailSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Get settings
    const settings = await Settings.findOne();
    if (!settings) {
      return NextResponse.json(
        { error: "Email settings not configured" },
        { status: 400 }
      );
    }

    // Check if email notifications are enabled
    if (!settings.emailNotificationsEnabled) {
      return NextResponse.json(
        { error: "Email notifications are disabled" },
        { status: 400 }
      );
    }

    // Check for required email settings
    if (
      !settings.emailHost ||
      !settings.emailPort ||
      !settings.emailUser ||
      !settings.emailPassword
    ) {
      return NextResponse.json(
        { error: "Email configuration is incomplete" },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settings.emailHost,
      port: settings.emailPort,
      secure: settings.emailPort === 465,
      auth: {
        user: settings.emailUser,
        pass: settings.emailPassword,
      },
    });

    // Send test email
    await transporter.sendMail({
      from: settings.emailFrom || settings.emailUser,
      to: email,
      subject: "VoxMark Email Test",
      text: "This is a test email from VoxMark License Management System.",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>VoxMark Email Test</h2>
          <p>This is a test email from the VoxMark License Management System.</p>
          <p>If you received this email, it means that your email configuration is working correctly.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
