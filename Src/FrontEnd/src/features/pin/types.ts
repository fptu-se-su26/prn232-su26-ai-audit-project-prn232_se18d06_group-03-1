export type PinDocumentType = "CCCD" | "GPLX";

export type PinVehicleType = "Motorbike" | "Car";

export interface PinStatusResponse {
  isPinSet: boolean;
  failedPinAttempts: number;
  pinLockoutEnd: string | null;
  lockoutRemainingSeconds: number | null;
}

export interface PinSetupRequest {
  pinCode: string;
  otp: string;
}

export interface PinChangeRequest {
  currentPinCode: string;
  newPinCode: string;
}

export interface PinVerifyViewDocumentRequest {
  pinCode: string;
  documentType: PinDocumentType;
  vehicleType?: PinVehicleType;
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
