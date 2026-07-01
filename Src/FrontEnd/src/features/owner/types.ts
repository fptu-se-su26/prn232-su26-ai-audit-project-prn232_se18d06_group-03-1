export type OwnerApplicationStatus =
  | "WaitingCccdVerification"
  | "WaitingBankInfo"
  | "ReadyToSubmit"
  | "Submitted"
  | "Approved"
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
