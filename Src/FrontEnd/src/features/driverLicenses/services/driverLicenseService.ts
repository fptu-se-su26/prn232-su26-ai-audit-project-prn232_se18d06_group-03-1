import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import { AxiosError } from "axios";
import type { ApiErrorPayload, ApiResponse } from "@/features/auth/types";
import type {
  DriverLicenseStatusResponse,
  DriverLicenseSubmitResponse,
  DriverLicenseVerificationListItem,
  DriverLicenseVerificationRequestDto,
  PagedResult,
} from "@/features/driverLicenses/types";

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.status) {
    throw new Error(response.message || "Request failed.");
  }
  return response.data as T;
}

function normalizeApiError(error: unknown): Error {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    const detail = payload?.errors?.find((item) => item?.trim()) ?? payload?.message;
    if (detail) {
      return new Error(detail);
    }
  }

  return error instanceof Error ? error : new Error("Request failed.");
}

export async function getMyDriverLicense(): Promise<DriverLicenseStatusResponse> {
  const { data } = await apiClient.get<ApiResponse<DriverLicenseStatusResponse>>(endpoints.driverLicenses.me);
  return unwrap(data);
}

export async function submitDriverLicense(formData: FormData): Promise<DriverLicenseSubmitResponse> {
  try {
    const { data } = await apiClient.post<ApiResponse<DriverLicenseSubmitResponse>>(endpoints.driverLicenses.submit, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function getDriverLicenseVerifications(
  scope: "staff" | "admin",
  params: Record<string, string | number | undefined>,
): Promise<PagedResult<DriverLicenseVerificationListItem>> {
  const url = scope === "admin" ? endpoints.admin.driverLicenseVerifications : endpoints.staff.driverLicenseVerifications;
  const { data } = await apiClient.get<ApiResponse<PagedResult<DriverLicenseVerificationListItem>>>(url, { params });
  return unwrap(data);
}

export async function getDriverLicenseVerificationById(
  scope: "staff" | "admin",
  id: number,
): Promise<DriverLicenseVerificationRequestDto> {
  const base = scope === "admin" ? endpoints.admin.driverLicenseVerifications : endpoints.staff.driverLicenseVerifications;
  const { data } = await apiClient.get<ApiResponse<DriverLicenseVerificationRequestDto>>(`${base}/${id}`);
  return unwrap(data);
}

export async function approveDriverLicenseVerification(scope: "staff" | "admin", id: number): Promise<void> {
  const base = scope === "admin" ? endpoints.admin.driverLicenseVerifications : endpoints.staff.driverLicenseVerifications;
  const { data } = await apiClient.post<ApiResponse<object>>(`${base}/${id}/approve`);
  unwrap(data);
}

export async function rejectDriverLicenseVerification(scope: "staff" | "admin", id: number, reason: string): Promise<void> {
  const base = scope === "admin" ? endpoints.admin.driverLicenseVerifications : endpoints.staff.driverLicenseVerifications;
  const { data } = await apiClient.post<ApiResponse<object>>(`${base}/${id}/reject`, { reason });
  unwrap(data);
}

export async function requestMoreDriverLicenseInfo(scope: "staff" | "admin", id: number, reason: string): Promise<void> {
  const base = scope === "admin" ? endpoints.admin.driverLicenseVerifications : endpoints.staff.driverLicenseVerifications;
  const { data } = await apiClient.post<ApiResponse<object>>(`${base}/${id}/request-more-info`, { reason });
  unwrap(data);
}
