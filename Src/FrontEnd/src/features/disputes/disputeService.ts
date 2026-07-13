import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type {
  CreateDisputeRequest,
  DisputeDetailResponse,
  DisputeListItem,
  DisputeListRequest,
  ResolveDisputeRequest,
} from "@/features/disputes/types";

const emptyPage = { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };

export async function createDispute(data: CreateDisputeRequest) {
  const res = await apiClient.post<ApiResponse<DisputeDetailResponse>>(endpoints.disputes.base, data);
  return res.data.data!;
}

export async function getMyDisputes(params: DisputeListRequest) {
  const res = await apiClient.get<ApiResponse<PagedResult<DisputeListItem>>>(endpoints.disputes.my, { params });
  return res.data.data ?? emptyPage;
}

export async function getStaffDisputes(params: DisputeListRequest) {
  const res = await apiClient.get<ApiResponse<PagedResult<DisputeListItem>>>(endpoints.disputes.staff, { params });
  return res.data.data ?? emptyPage;
}

export async function getDisputeById(id: number) {
  const res = await apiClient.get<ApiResponse<DisputeDetailResponse>>(endpoints.disputes.byId(id));
  return res.data.data!;
}

export async function investigateDispute(id: number) {
  const res = await apiClient.put<ApiResponse<DisputeDetailResponse>>(endpoints.disputes.investigate(id));
  return res.data.data!;
}

export async function resolveDispute(id: number, data: ResolveDisputeRequest) {
  const res = await apiClient.put<ApiResponse<DisputeDetailResponse>>(endpoints.disputes.resolve(id), data);
  return res.data.data!;
}

export async function escalateDispute(id: number, data: ResolveDisputeRequest) {
  const res = await apiClient.put<ApiResponse<DisputeDetailResponse>>(endpoints.disputes.escalate(id), data);
  return res.data.data!;
}

export async function adminOverrideDispute(id: number, data: ResolveDisputeRequest) {
  const res = await apiClient.put<ApiResponse<DisputeDetailResponse>>(endpoints.disputes.adminOverride(id), data);
  return res.data.data!;
}
