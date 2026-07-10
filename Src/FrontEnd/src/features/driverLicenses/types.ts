export type DriverLicenseVerificationRequestDto = {
  id: number;
  userId: number;
  userFullName?: string | null;
  userEmail?: string | null;
  type: string;
  status: string;
  frontImageUrl?: string | null;
  requestedVehicleType?: string | null;
  externalProvider?: string | null;
  externalResultJson?: string | null;
  confidence?: number | null;
  decisionReason?: string | null;
  processedAt?: string | null;
  reviewedBy?: number | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
};

export type DriverLicenseStatusResponse = {
  verified: boolean;
  status: string;
  driverLicenseNumber?: string | null;
  licenseClass?: string | null;
  verifiedVehicleTypes: string[];
  verifiedAt?: string | null;
  canUpdateAfter?: string | null;
  latestRequest?: DriverLicenseVerificationRequestDto | null;
};

export type DriverLicenseSubmitResponse = {
  status: string;
  verified: boolean;
  message?: string | null;
  driverLicenseNumber?: string | null;
  licenseClass?: string | null;
  requestedVehicleType?: string | null;
  verifiedVehicleTypes: string[];
  ocrConfidence?: number | null;
  flags: string[];
};

export type DriverLicenseVerificationListItem = {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  status: string;
  confidence?: number | null;
  decisionReason?: string | null;
  licenseClass?: string | null;
  requestedVehicleType?: string | null;
  createdAt: string;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type DriverLicenseAiResult = {
  valid?: boolean;
  recommendation?: string;
  ocrConfidence?: number;
  extracted?: {
    fullName?: string | null;
    driverLicenseNumber?: string | null;
    dateOfBirth?: string | null;
    licenseClass?: string | null;
    issueDate?: string | null;
    expiryDate?: string | null;
    expiryStatus?: string | null;
    rawText?: string[];
  };
  nameMatch?: {
    provided?: boolean;
    matched?: boolean | null;
    score?: number | null;
  };
  flags?: string[];
  message?: string | null;
};
