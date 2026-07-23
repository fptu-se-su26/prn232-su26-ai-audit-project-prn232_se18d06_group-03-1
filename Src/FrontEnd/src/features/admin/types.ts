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

export type UserManagementAuditLogItem = {
  id?: string;
  actorName: string;
  actorRole: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  timestamp: string;
};

export type AdminPostStatsResponse = {
  totalVehicles: number;
  pendingListings: number;
  approvedListings: number;
  rejectedListings: number;
  totalOwners: number;
  vehicleTypeChart: { label: string; value: number }[];
  monthlyPostStats: { month: string; count: number }[];
  recentPosts: AdminPostRecentItem[];
};

export type AdminPostRecentItem = {
  id: number;
  ownerName: string;
  vehicleType: string;
  brandName: string;
  modelName: string;
  licensePlate: string;
  pricePerDay: number;
  status: string;
  createdAt: string;
};

export type AdminOwnerListItem = {
  userId: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  totalVehicles: number;
  carCount: number;
  motorbikeCount: number;
};

export type AdminOwnerVehicleListItem = {
  id: number;
  ownerFullName: string;
  vehicleType: string;
  brandName: string;
  modelName: string;
  variantName: string;
  year: number;
  licensePlate: string;
  pricePerDay: number;
  status: string;
  featuredImage: string | null;
  createdAt: string;
};

export type CreateAdminVehicleRequest = {
  ownerId: number;
  brandId: number;
  modelId: number;
  variantId?: number | null;
  vehicleType: string;
  year: number;
  licensePlate: string;
  odometerKm?: number | null;
  description?: string | null;
  address: string;
  areaId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  pricePerDay: number;
  depositPercent: number;
  securityRequiresDeposit: boolean;
  securityDepositAmount: number;
  pricingMode?: string | null;
  fixedPricePerDay?: number | null;
  autoMinPrice?: number | null;
  autoMaxPrice?: number | null;
  featureIds: number[];
  imageUrls: string[];
  featuredImageIndex?: number | null;
  documentFileUrl?: string | null;
};

export type AdminVehicleOcrPreviewResponse = {
  success: boolean;
  licensePlate?: string | null;
  brand?: string | null;
  model?: string | null;
  engineNumber?: string | null;
  chassisNumber?: string | null;
  confidence?: number | null;
  recommendation?: string | null;
  flags: string[];
  message?: string | null;
};
