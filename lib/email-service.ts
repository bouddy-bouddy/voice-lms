import nodemailer from "nodemailer";
import { LicenseDocument } from "@/db/models";
import { format } from "date-fns";

// Email configuration
let transporter: nodemailer.Transporter;

// Initialize the email transporter
export function initEmailService() {
  // Check if required environment variables are set
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_PORT ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASSWORD
  ) {
    console.warn(
      "Email service configuration is incomplete. Email notifications will be disabled."
    );
    return false;
  }

  try {
    // Log email configuration (omit password)
    console.log("Initializing email service with config:", {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      user: process.env.EMAIL_USER,
      from: process.env.EMAIL_FROM,
    });

    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      debug: true, // Enable debug output
      logger: true, // Log to console
    });

    // Test connection
    console.log("Testing SMTP connection...");
    return true;
  } catch (error) {
    console.error("Failed to initialize email service:", error);
    return false;
  }
}

// Send license details to user email with text fallback and detailed logging
export async function sendLicenseEmailWithTextFallback(
  license: LicenseDocument
): Promise<boolean> {
  if (!transporter) {
    console.warn("Email service not initialized. Cannot send license email.");
    return false;
  }

  const textContent =
    `Your VoxMark License Information\n\n` +
    `Dear ${license.fullName},\n\n` +
    `Your VoxMark license has been successfully created. Below are your license details:\n\n` +
    `License Key: ${license.licenseKey}\n` +
    `Full Name: ${license.fullName}\n` +
    `Email: ${license.email}\n` +
    `Maximum Devices: ${license.maxDevices}\n` +
    `Expiration Date: ${format(license.expiresAt, "MMMM d, yyyy")}\n` +
    `Status: ${license.status}\n\n` +
    `How to Activate Your License:\n\n` +
    `1. Download and install the VoxMark software from our website\n` +
    `2. Launch the application and click on "Activate License"\n` +
    `3. Enter your license key exactly as shown above\n` +
    `4. Click "Activate" to complete the process\n\n` +
    `If you encounter any issues during activation, please contact our support team at support@voxmark.com.\n\n` +
    `Thank you for choosing VoxMark!\n\n` +
    `This is an automated message. Please do not reply to this email.`;

  const htmlContent = formatLicenseDetails(license);

  try {
    console.log(`Attempting to send email to: ${license.email}`);

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@voxmark.com",
      to: license.email,
      subject: "Your VoxMark License Information",
      text: textContent,
      html: htmlContent,
    };

    console.log("Mail options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully:`, {
      messageId: info.messageId,
      envelope: info.envelope,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });

    return true;
  } catch (error) {
    console.error("Failed to send license email:", error);

    // Try to determine if it's a connection error
    if (error.code === "ECONNREFUSED") {
      console.error(
        "Connection to SMTP server refused. Check your EMAIL_HOST and EMAIL_PORT settings."
      );
    } else if (error.code === "ETIMEDOUT") {
      console.error(
        "Connection to SMTP server timed out. Check your network and firewall settings."
      );
    } else if (error.code === "EAUTH") {
      console.error(
        "Authentication failed. Check your EMAIL_USER and EMAIL_PASSWORD settings."
      );
    }

    return false;
  }
}

// Format license data for email
function formatLicenseDetails(license: LicenseDocument): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Your VoxMark License Information</h2>
      
      <p>Dear ${license.fullName},</p>
      
      <p>Your VoxMark license has been successfully created. Below are your license details:</p>
      
      <div style="background-color: #f9f9f9; border-left: 4px solid #4a90e2; padding: 15px; margin: 20px 0;">
        <p><strong>License Key:</strong> ${license.licenseKey}</p>
        <p><strong>Full Name:</strong> ${license.fullName}</p>
        <p><strong>Email:</strong> ${license.email}</p>
        <p><strong>Maximum Devices:</strong> ${license.maxDevices}</p>
        <p><strong>Expiration Date:</strong> ${format(
          license.expiresAt,
          "MMMM d, yyyy"
        )}</p>
        <p><strong>Status:</strong> ${license.status}</p>
      </div>
      
      <h3>How to Activate Your License</h3>
      
      <ol>
        <li>Download and install the VoxMark software from our website</li>
        <li>Launch the application and click on "Activate License"</li>
        <li>Enter your license key exactly as shown above</li>
        <li>Click "Activate" to complete the process</li>
      </ol>
      
      <p>If you encounter any issues during activation, please contact our support team at support@voxmark.com.</p>
      
      <p>Thank you for choosing VoxMark!</p>
      
      <p style="margin-top: 30px; font-size: 12px; color: #777;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;
}

// Add a direct test function to verify connection
export async function testEmailConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!transporter) {
    return {
      success: false,
      message: "Email service not initialized. Check configuration.",
    };
  }

  try {
    // Verify connection configuration
    await transporter.verify();
    return {
      success: true,
      message: "SMTP connection successful",
    };
  } catch (error) {
    return {
      success: false,
      message: `SMTP connection failed: ${error.message}`,
    };
  }
}
