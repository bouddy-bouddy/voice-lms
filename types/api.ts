import { Role, LicenseStatus, LogAction } from "@/db/models";

// License types
export interface License {
  id: string;
  licenseKey: string;
  fullName: string;
  cinNumber: string;
  email: string;
  phoneNumber: string;
  institution: string;
  maxDevices: number;
  status: LicenseStatus;
  createdAt: string;
  expiresAt: string;
  devices?: Device[];
  activationLogs?: ActivationLog[];
  _count?: {
    devices: number;
  };
}

export interface Device {
  id: string;
  deviceId: string;
  deviceName: string | null;
  deviceType: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  ipAddress: string | null;
}

export interface ActivationLog {
  id: string;
  deviceId: string;
  ipAddress: string | null;
  action: LogAction;
  timestamp: string;
  success: boolean;
  details: string | null;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  revokedLicenses: number;
  totalDevices: number;
  activeTrials: number;
  expiredTrials: number;
  conversionRate: string;
}

// Pagination
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API responses
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface LicenseListResponse {
  licenses: License[];
  pagination: Pagination;
}

export interface LicenseResponse {
  license: License;
}
