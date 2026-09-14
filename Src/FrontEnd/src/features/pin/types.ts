export type PinDocumentType = "CCCD" | "GPLX";

export interface PinStatusResponse {
  isPinSet: boolean;
  failedPinAttempts: number;
  pinLockoutEnd: string | null;
  lockoutRemainingSeconds: number;
}

export interface PinSetupRequest {
  pinCode: string;
  confirmPinCode: string;
}

export interface PinChangeRequest {
  currentPinCode: string;
  newPinCode: string;
}

export interface PinVerifyViewDocumentRequest {
  pinCode: string;
  documentType: PinDocumentType;
}

export interface ViewDocumentPlaintextResponse {
  documentNumber: string;
  documentType: PinDocumentType;
}

export interface PinForgotRequestOtpRequest {
  email: string;
}

export interface PinForgotResetRequest {
  email: string;
  otpCode: string;
  newPinCode: string;
}
