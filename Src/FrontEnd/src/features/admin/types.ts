import type { UserRole } from "@/features/auth/types";

export type AdminUserListItem = {
  userId: number;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  roles: UserRole[];
};

export type AdminUserDetail = {
  userId: number;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status: string;
  isEmailVerified: boolean;
  isOnline: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: UserRole[];
  customerProfile?: {
    dateOfBirth?: string | null;
    address?: string | null;
    nationalIdMasked?: string | null;
    nationalIdVerified: boolean;
    driverLicenseVerified: boolean;
    preferredVehicleType?: string | null;
  } | null;
  ownerProfile?: {
    tier: string;
    commissionRate: number;
    totalTrips: number;
    averageRating?: number | null;
    isVerified: boolean;
    verifiedAt?: string | null;
    bankName?: string | null;
    bankAccountHolderName?: string | null;
  } | null;
  staffProfile?: {
    employeeCode: string;
    department?: string | null;
  } | null;
  verificationHistory: {
    id: number;
    type: string;
    status: string;
    confidence?: number | null;
    rejectionReason?: string | null;
    createdAt: string;
    reviewedAt?: string | null;
  }[];
};

export type AdminUserListParams = {
  keyword?: string;
  sortBy?: string;
  role?: string;
  status?: string;
  isOnline?: boolean;
  page?: number;
  pageSize?: number;
};

export type AdminUpdateUserRequest = {
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
};

export type UpdateUserRoleRequest = {
  role: string;
  assigned: boolean;
};

export type UpdateUserStatusRequest = {
  status: string;
};

export type AdminLoginSession = {
  sessionId: string;
  deviceType?: string | null;
  ipAddress?: string | null;
  signedInAt: string;
  expiresAt: string;
  isActive: boolean;
};

export type CreateStaffRequest = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  employeeCode: string;
  department?: string | null;
};

export type CreateCustomerRequest = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type CreateOwnerRequest = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  useOcr: boolean;
  nationalId: string;
  dateOfBirth?: string | null;
  address?: string | null;
  nationalIdFrontImage: File;
  driverLicenseNumber: string;
  driverLicenseClass: string;
  driverLicenseVehicleType: "Car" | "Motorbike";
  driverLicenseFrontImage: File;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolderName: string;
};

export type OwnerOcrPreview = {
  nationalId?: {
    success: boolean;
    nationalId?: string | null;
    fullName?: string | null;
    dateOfBirth?: string | null;
    address?: string | null;
    confidence?: number | null;
    recommendation?: string | null;
    flags: string[];
  } | null;
  driverLicense?: {
    success: boolean;
    fullName?: string | null;
    driverLicenseNumber?: string | null;
    licenseClass?: string | null;
    confidence?: number | null;
    recommendation?: string | null;
    flags: string[];
  } | null;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
