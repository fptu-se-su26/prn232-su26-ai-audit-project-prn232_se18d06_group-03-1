import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type { AreaResponse, CreateAreaRequest, UpdateAreaRequest } from "@/features/areas/types";

export async function getAreas(params: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<PagedResult<AreaResponse>>>(endpoints.admin.areas, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getAreaProvinces() {
  const res = await apiClient.get<ApiResponse<string[]>>(`${endpoints.admin.areas}/provinces`);
  return res.data.data ?? [];
}

export async function createArea(data: CreateAreaRequest) {
  const res = await apiClient.post<ApiResponse<AreaResponse>>(endpoints.admin.areas, data);
  return res.data.data;
}

export async function updateArea(id: number, data: UpdateAreaRequest) {
  const res = await apiClient.put<ApiResponse<AreaResponse>>(`${endpoints.admin.areas}/${id}`, data);
  return res.data.data;
}

export async function deleteArea(id: number) {
  await apiClient.delete(`${endpoints.admin.areas}/${id}`);
}
