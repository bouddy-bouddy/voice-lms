import { initEmailService } from "./email-service";

// This function checks for required environment variables
export function checkRequiredEnvVars() {
  const requiredEnvVars = [
    "MONGODB_URI",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "JWT_SECRET",
  ];

  const emailEnvVars = [
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_USER",
    "EMAIL_PASSWORD",
    "EMAIL_FROM",
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  const missingEmailVars = emailEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "❌ Missing required environment variables:"
    );
    missingEnvVars.forEach((envVar) => {
      console.error(`  - ${envVar}`);
    });
    console.error(
      "\x1b[33m%s\x1b[0m",
      "⚠️ Create a .env file with the required variables. See .env.example for reference."
    );

    // Don't exit in production to avoid crashes, but make it obvious there's an issue
    if (process.env.NODE_ENV === "development") {
      console.error(
        "\x1b[31m%s\x1b[0m",
        "Development server will continue, but application may not function correctly."
      );
    }
  } else {
    console.log(
      "\x1b[32m%s\x1b[0m",
      "✅ All required environment variables are set"
    );
  }

  if (missingEmailVars.length > 0) {
    console.warn(
      "\x1b[33m%s\x1b[0m",
      "⚠️ Some email service variables are missing:"
    );
    missingEmailVars.forEach((envVar) => {
      console.warn(`  - ${envVar}`);
    });
    console.warn(
      "\x1b[33m%s\x1b[0m",
      "⚠️ Email notifications will be disabled. Add these to your .env file if you want to enable email notifications."
    );
  } else {
    // Initialize email service if all required variables are present
    const emailInitialized = initEmailService();
    if (emailInitialized) {
      console.log(
        "\x1b[32m%s\x1b[0m",
        "✅ Email service initialized successfully"
      );
    } else {
      console.warn(
        "\x1b[33m%s\x1b[0m",
        "⚠️ Failed to initialize email service. Email notifications will be disabled."
      );
    }
  }
}
