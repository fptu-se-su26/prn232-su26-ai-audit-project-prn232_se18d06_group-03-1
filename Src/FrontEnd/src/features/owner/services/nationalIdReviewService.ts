import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";

export type NationalIdVerificationListItem = {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  status: string;
  confidence?: number | null;
  decisionReason?: string | null;
  createdAt: string;
};

export type NationalIdVerificationDetailDto = {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  status: string;
  frontImageUrl?: string | null;
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

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.status) {
    throw new Error(response.message || "Request failed.");
  }
  return response.data as T;
}

function baseUrl(scope: "staff" | "admin"): string {
  return scope === "admin" ? endpoints.admin.nationalIdVerifications : endpoints.staff.nationalIdVerifications;
}

export async function getNationalIdVerifications(
  scope: "staff" | "admin",
  params: Record<string, string | number | undefined>,
): Promise<PagedResult<NationalIdVerificationListItem>> {
  const { data } = await apiClient.get<ApiResponse<PagedResult<NationalIdVerificationListItem>>>(baseUrl(scope), { params });
  return unwrap(data);
}

export async function getNationalIdVerificationById(
  scope: "staff" | "admin",
  id: number,
): Promise<NationalIdVerificationDetailDto> {
  const { data } = await apiClient.get<ApiResponse<NationalIdVerificationDetailDto>>(`${baseUrl(scope)}/${id}`);
  return unwrap(data);
}

export async function approveNationalIdVerification(scope: "staff" | "admin", id: number): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<object>>(`${baseUrl(scope)}/${id}/approve`);
  unwrap(data);
}

export async function rejectNationalIdVerification(scope: "staff" | "admin", id: number, reason: string): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<object>>(`${baseUrl(scope)}/${id}/reject`, { reason });
  unwrap(data);
}

export async function requestMoreNationalIdInfo(scope: "staff" | "admin", id: number, reason: string): Promise<void> {
  const { data } = await apiClient.post<ApiResponse<object>>(`${baseUrl(scope)}/${id}/request-more-info`, { reason });
  unwrap(data);
}
