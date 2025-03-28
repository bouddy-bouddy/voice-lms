import mongoose from "mongoose";

// Enums
export enum Role {
  ADMIN = "ADMIN",
  SUPPORT = "SUPPORT",
}

export enum LicenseStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
}

export enum LogAction {
  ACTIVATE = "ACTIVATE",
  VALIDATE = "VALIDATE",
  DEACTIVATE = "DEACTIVATE",
  CHECK = "CHECK",
}

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), default: Role.ADMIN },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// Device Schema
const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    deviceName: { type: String },
    deviceType: { type: String },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
    licenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "License",
      required: true,
    },
  },
  {
    timestamps: false,
    collection: "devices",
  }
);

// Ensure uniqueness for deviceId and licenseId combination
deviceSchema.index({ deviceId: 1, licenseId: 1 }, { unique: true });

// Activation Log Schema
const activationLogSchema = new mongoose.Schema(
  {
    licenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "License",
      required: true,
    },
    deviceId: { type: String, required: true },
    ipAddress: { type: String },
    action: { type: String, enum: Object.values(LogAction), required: true },
    timestamp: { type: Date, default: Date.now },
    success: { type: Boolean, default: true },
    details: { type: String },
  },
  {
    timestamps: false,
    collection: "activation_logs",
  }
);

// License Schema
const licenseSchema = new mongoose.Schema(
  {
    licenseKey: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    cinNumber: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    maxDevices: { type: Number, default: 1 },
    status: {
      type: String,
      enum: Object.values(LicenseStatus),
      default: LicenseStatus.ACTIVE,
    },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "licenses",
  }
);

// Trial Usage Schema
const trialUsageSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true },
    deviceName: { type: String },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
    usageCount: { type: Number, default: 1 },
    trialStartedAt: { type: Date, default: Date.now },
    trialExpiresAt: { type: Date, required: true },
    converted: { type: Boolean, default: false },
    convertedAt: { type: Date },
  },
  {
    timestamps: false,
    collection: "trial_usage",
  }
);

// Create models if they don't exist
export const models = {
  User: mongoose.models.User || mongoose.model("User", userSchema),
  Device: mongoose.models.Device || mongoose.model("Device", deviceSchema),
  ActivationLog:
    mongoose.models.ActivationLog ||
    mongoose.model("ActivationLog", activationLogSchema),
  License: mongoose.models.License || mongoose.model("License", licenseSchema),
  TrialUsage:
    mongoose.models.TrialUsage ||
    mongoose.model("TrialUsage", trialUsageSchema),
};

export type UserDocument = mongoose.Document & {
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export type DeviceDocument = mongoose.Document & {
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  ipAddress?: string;
  licenseId: mongoose.Types.ObjectId;
};

export type ActivationLogDocument = mongoose.Document & {
  licenseId: mongoose.Types.ObjectId;
  deviceId: string;
  ipAddress?: string;
  action: LogAction;
  timestamp: Date;
  success: boolean;
  details?: string;
};

export type LicenseDocument = mongoose.Document & {
  licenseKey: string;
  fullName: string;
  cinNumber: string;
  email: string;
  phoneNumber: string;
  maxDevices: number;
  status: LicenseStatus;
  createdAt: Date;
  expiresAt: Date;
  updatedAt: Date;
};

export type TrialUsageDocument = mongoose.Document & {
  deviceId: string;
  deviceName?: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  ipAddress?: string;
  usageCount: number;
  trialStartedAt: Date;
  trialExpiresAt: Date;
  converted: boolean;
  convertedAt?: Date;
};
