import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/features/auth/types";
import type { OwnerApplicationDto, NationalIdOcrResult, BankInfoRequest, CreateOwnerResponse, SubmitOwnerApplicationResponse, OwnerOnboardingRegisterRequest, OwnerOnboardingRegisterResponse } from "@/features/owner/types";

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.status) {
    throw new Error(response.message || "Request failed.");
  }
  return response.data as T;
}

export async function createApplication(): Promise<CreateOwnerResponse> {
  const { data } = await apiClient.post<ApiResponse<CreateOwnerResponse>>("/api/owner-applications");
  return unwrap(data);
}

export async function getMyApplication(): Promise<OwnerApplicationDto> {
  const { data } = await apiClient.get<ApiResponse<OwnerApplicationDto>>("/api/owner-applications/me");
  return unwrap(data);
}

export async function uploadNationalId(formData: FormData): Promise<NationalIdOcrResult & { status: string; message?: string }> {
  const { data } = await apiClient.post<ApiResponse<NationalIdOcrResult>>("/api/owner-applications/me/national-id", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const result = unwrap(data) as NationalIdOcrResult & { status?: string; message?: string };
  if (!result.status) {
    throw new Error("Xác thực CCCD thất bại. Vui lòng thử lại.");
  }
  return result as NationalIdOcrResult & { status: string; message?: string };
}

export async function updateBankInfo(body: BankInfoRequest): Promise<OwnerApplicationDto> {
  const { data } = await apiClient.put<ApiResponse<OwnerApplicationDto>>("/api/owner-applications/me/bank", body);
  return unwrap(data);
}

export async function registerOwnerOnboarding(body: OwnerOnboardingRegisterRequest): Promise<OwnerOnboardingRegisterResponse> {
  const { data } = await apiClient.post<ApiResponse<OwnerOnboardingRegisterResponse>>("/api/owner-onboarding/register", body);
  return unwrap(data);
}

export async function submitApplication(): Promise<SubmitOwnerApplicationResponse> {
  const { data } = await apiClient.post<ApiResponse<SubmitOwnerApplicationResponse>>("/api/owner-applications/me/submit");
  return unwrap(data);
}
