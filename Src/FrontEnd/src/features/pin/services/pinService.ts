import type { AxiosError } from "axios";
import { apiClient } from "@/services/apiClient";
import { toApiError } from "@/features/auth/services/authService";
import type { ApiResponse } from "@/features/auth/types";
import type {
  PinChangeRequest,
  PinForgotResetRequest,
  PinSetupRequest,
  PinStatusResponse,
  PinVerifyViewDocumentRequest,
  ViewDocumentPlaintextResponse,
} from "@/features/pin/types";

const PIN_STATUS_URL = "/api/v1/user/pin/status";
const PIN_SETUP_URL = "/api/v1/user/pin/setup";
const PIN_CHANGE_URL = "/api/v1/user/pin/change";
const PIN_VERIFY_VIEW_URL = "/api/v1/user/pin/verify-view-document";
const PIN_FORGOT_OTP_URL = "/api/v1/user/pin/forgot/request-otp";
const PIN_FORGOT_RESET_URL = "/api/v1/user/pin/forgot/reset";

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.status) {
    throw new Error(response.message || "Request failed.");
  }
  return response.data as T;
}

export async function getPinStatus(): Promise<PinStatusResponse> {
  try {
    const { data } = await apiClient.get<ApiResponse<PinStatusResponse>>(PIN_STATUS_URL);
    return unwrap(data);
  } catch (error) {
    throw toApiError(error as AxiosError);
  }
}

export async function setupPin(payload: PinSetupRequest): Promise<void> {
  try {
    const { data } = await apiClient.post<ApiResponse<null>>(PIN_SETUP_URL, payload);
    unwrap(data);
  } catch (error) {
    throw toApiError(error as AxiosError);
  }
}

export async function changePin(payload: PinChangeRequest): Promise<void> {
  try {
    const { data } = await apiClient.post<ApiResponse<null>>(PIN_CHANGE_URL, payload);
    unwrap(data);
  } catch (error) {
    throw toApiError(error as AxiosError);
  }
}

export async function verifyPinViewDocument(payload: PinVerifyViewDocumentRequest): Promise<ViewDocumentPlaintextResponse> {
  try {
    const { data } = await apiClient.post<ApiResponse<ViewDocumentPlaintextResponse>>(PIN_VERIFY_VIEW_URL, payload);
    return unwrap(data);
  } catch (error) {
    throw toApiError(error as AxiosError);
  }
}

export async function requestPinForgotOtp(payload: { email: string }): Promise<void> {
  try {
    const { data } = await apiClient.post<ApiResponse<null>>(PIN_FORGOT_OTP_URL, payload);
    unwrap(data);
  } catch (error) {
    throw toApiError(error as AxiosError);
  }
}

export async function resetPinForgot(payload: PinForgotResetRequest): Promise<void> {
  try {
    const { data } = await apiClient.post<ApiResponse<null>>(PIN_FORGOT_RESET_URL, payload);
    unwrap(data);
  } catch (error) {
    throw toApiError(error as AxiosError);
  }
}
