import { NextRequest, NextResponse } from "next/server";

// This route is just for debugging environment variables and configuration
export async function GET(req: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Debug endpoint only available in development mode" },
      { status: 403 }
    );
  }

  // Return relevant configuration information
  return NextResponse.json({
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? "Set (value hidden)" : "Not set",
  });
}
