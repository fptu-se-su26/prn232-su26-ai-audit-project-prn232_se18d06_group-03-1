import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/features/auth/types";
import type { OwnerApplicationDto, NationalIdOcrResult, BankInfoRequest, CreateOwnerResponse } from "@/features/owner/types";

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

export async function uploadNationalId(formData: FormData): Promise<NationalIdOcrResult> {
  const { data } = await apiClient.post<ApiResponse<NationalIdOcrResult>>("/api/owner-applications/me/national-id", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const result = unwrap(data) as NationalIdOcrResult & { status?: string; message?: string };
  if (result.status && result.status !== "Verified") {
    throw new Error(result.message || "Xác thực CCCD thất bại. Vui lòng thử lại.");
  }
  return result;
}

export async function updateBankInfo(body: BankInfoRequest): Promise<void> {
  const { data } = await apiClient.put<ApiResponse<null>>("/api/owner-applications/me/bank", body);
  unwrap(data);
}

export async function submitApplication(): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<null>>("/api/owner-applications/me/submit");
  unwrap(data);
}
