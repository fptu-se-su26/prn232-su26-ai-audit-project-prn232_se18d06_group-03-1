export type OwnerApplicationStatus =
  | "WaitingCccdVerification"
  | "WaitingBankInfo"
  | "ReadyToSubmit"
  | "Submitted"
  | "Approved"
  | "ManualReview"
  | "NeedMoreInfo"
  | "Rejected"
  | "Cancelled";

export type OwnerNextStep =
  | "VerifyEmail"
  | "UploadNationalId"
  | "BankInfo"
  | "ReviewSubmit"
  | "ManualReview"
  | "OwnerDashboard";

export type OwnerWizardStep =
  | "check-status"
  | "intro"
  | "upload"
  | "review"
  | "success"
  | "bank-info"
  | "review-submit"
  | "manual-review"
  | "pending"
  | "owner-success"
  | "already-owner";

export type NationalIdSide = "front" | "back";

export interface OwnerApplicationDto {
  id: number;
  status: OwnerApplicationStatus;
  nationalIdVerified: boolean;
  bankInfoCompleted: boolean;
  isOwner: boolean;
  nextStep: OwnerNextStep;
  frontImageUrl?: string;
  backImageUrl?: string;
  fullName?: string;
  nationalIdNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolderName?: string;
  rejectReason?: string;
  email?: string;
  emailVerified?: boolean;
  driverLicenseVerified?: boolean;
  createdAt: string;
}

export interface NationalIdUploadRequest {
  frontImage: File;
  backImage: File;
}

export interface NationalIdOcrResult {
  fullName: string;
  nationalIdNumber: string;
  frontImageUrl: string;
  backImageUrl: string;
}

export interface BankInfoRequest {
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolderName: string;
}

export interface CreateOwnerResponse {
  id: number;
  status: string;
  nextStep: OwnerNextStep;
}

export interface SubmitApplicationRequest {
  fullName: string;
  nationalIdNumber: string;
  bankName: string;
}

export interface SubmitOwnerApplicationResponse {
  status: string;
  isOwner: boolean;
  requiresTokenRefresh: boolean;
  nextStep: OwnerNextStep;
}

export interface OwnerOnboardingRegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface OwnerOnboardingRegisterResponse {
  userId: number;
  ownerApplicationId: number;
  nextStep: string;
}
