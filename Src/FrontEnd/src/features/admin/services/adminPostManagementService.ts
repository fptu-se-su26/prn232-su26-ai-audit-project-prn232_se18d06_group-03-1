import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type {
  AdminPostStatsResponse,
  AdminOwnerListItem,
  AdminOwnerVehicleListItem,
  CreateAdminVehicleRequest,
  AdminVehicleOcrPreviewResponse,
  PagedResult,
} from "@/features/admin/types";

export async function getAdminPostStats() {
  const res = await apiClient.get<ApiResponse<AdminPostStatsResponse>>(endpoints.admin.postStats);
  return res.data.data;
}

export async function previewAdminVehicleOcr(formData: FormData) {
  const res = await apiClient.post<ApiResponse<AdminVehicleOcrPreviewResponse>>(
    endpoints.admin.postOcrPreview,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data;
}

export async function createAdminVehicle(request: CreateAdminVehicleRequest) {
  const res = await apiClient.post<ApiResponse<unknown>>(endpoints.admin.postCreateVehicle, request);
  return res.data;
}

export async function getAdminOwnersWithVehicles(params: { keyword?: string; page?: number; pageSize?: number }) {
  const res = await apiClient.get<ApiResponse<PagedResult<AdminOwnerListItem>>>(endpoints.admin.postOwners, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getAdminOwnerVehicles(ownerId: number, params: { vehicleType?: string; page?: number; pageSize?: number }) {
  const res = await apiClient.get<ApiResponse<PagedResult<AdminOwnerVehicleListItem>>>(
    endpoints.admin.postOwnerVehicles(ownerId),
    { params }
  );
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}
