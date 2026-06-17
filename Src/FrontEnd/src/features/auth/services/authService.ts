import { AxiosError } from "axios";
import { apiClient, bareApiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiErrorPayload, ApiResponse, AuthResponse, AuthUser, OtpPurpose, UserRole } from "@/features/auth/types";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: Extract<UserRole, "Customer" | "Owner">;
};

export type VerifyOtpPayload = {
  email: string;
  otp: string;
  purpose: OtpPurpose;
};

export type ResendOtpPayload = {
  email: string;
  purpose: OtpPurpose;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export class AppApiError extends Error {
  code: string;
  errors: string[];

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "AppApiError";
    this.code = payload.code;
    this.errors = payload.errors ?? [];
  }
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.status) {
    throw new AppApiError({ code: response.code, message: response.message, errors: response.errors });
  }

  return response.data as T;
}

export function toApiError(error: unknown): AppApiError {
  if (error instanceof AppApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const data = error.response?.data as any;
    const code = data?.code ?? data?.Code;
    const message = data?.message ?? data?.Message;
    const errors = data?.errors ?? data?.Errors ?? [];

    if (code || message) {
      return new AppApiError({
        code: code ?? "UNKNOWN",
        message: message ?? "Yêu cầu không thành công.",
        errors: Array.isArray(errors) ? errors : [],
      });
    }

    if (error.code === "ERR_NETWORK") {
      return new AppApiError({ code: "NETWORK", message: "Không thể kết nối đến máy chủ." });
    }
  }

  return new AppApiError({ code: "UNKNOWN", message: "Đã có lỗi xảy ra. Vui lòng thử lại." });
}

export async function login(payload: LoginPayload) {
  const res = await apiClient.post<ApiResponse<AuthResponse>>(endpoints.auth.login, payload);
  return unwrap(res.data);
}

export async function register(payload: RegisterPayload) {
  const res = await apiClient.post<ApiResponse<AuthResponse>>(endpoints.auth.register, payload);
  return unwrap(res.data);
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const res = await apiClient.post<ApiResponse<null>>(endpoints.auth.verifyOtp, payload);
  return unwrap(res.data);
}

export async function resendOtp(payload: ResendOtpPayload) {
  const res = await apiClient.post<ApiResponse<null>>(endpoints.auth.resendOtp, payload);
  return unwrap(res.data);
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  const res = await apiClient.post<ApiResponse<null>>(endpoints.auth.forgotPassword, payload);
  return unwrap(res.data);
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const res = await apiClient.post<ApiResponse<null>>(endpoints.auth.resetPassword, payload);
  return unwrap(res.data);
}

export async function changePassword(payload: ChangePasswordPayload) {
  const res = await apiClient.post<ApiResponse<null>>(endpoints.auth.changePassword, payload);
  return unwrap(res.data);
}

export async function getCurrentUser() {
  const res = await apiClient.get<ApiResponse<AuthUser>>(endpoints.auth.me);
  return unwrap(res.data);
}

export async function refreshSession(refreshToken: string) {
  const res = await bareApiClient.post<ApiResponse<AuthResponse>>(endpoints.auth.refreshToken, { refreshToken });
  return unwrap(res.data);
}

export async function logout(refreshToken: string) {
  const res = await apiClient.post<ApiResponse<null>>(endpoints.auth.logout, { refreshToken });
  return unwrap(res.data);
}
