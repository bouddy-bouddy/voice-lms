import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/db/connection";
import mongoose from "mongoose";
import { models } from "@/db/models";

// Purge expired trial data
export async function POST(req: NextRequest) {
  try {
    // Check authentication - only admins can purge data
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    await dbConnect();

    // Calculate cutoff date (90 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    // Find expired trials older than cutoff date
    const purgeResult = await models.TrialUsage.deleteMany({
      trialExpiresAt: { $lt: cutoffDate },
      converted: false,
    });

    // Return success with count of purged records
    return NextResponse.json({
      success: true,
      message: "Expired trial data purged successfully",
      purgedCount: purgeResult.deletedCount || 0,
    });
  } catch (error) {
    console.error("Error purging trial data:", error);
    return NextResponse.json(
      { error: "Failed to purge trial data" },
      { status: 500 }
    );
  }
}
