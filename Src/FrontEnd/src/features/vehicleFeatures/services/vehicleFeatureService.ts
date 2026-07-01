import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type { VehicleFeatureResponse, CreateVehicleFeatureRequest, UpdateVehicleFeatureRequest } from "@/features/vehicleFeatures/types";

export async function getVehicleFeatures(params: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<PagedResult<VehicleFeatureResponse>>>(endpoints.admin.vehicleFeatures, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getVehicleFeatureById(id: number) {
  const res = await apiClient.get<ApiResponse<VehicleFeatureResponse>>(`${endpoints.admin.vehicleFeatures}/${id}`);
  return res.data.data;
}

export async function createVehicleFeature(data: CreateVehicleFeatureRequest) {
  const res = await apiClient.post<ApiResponse<VehicleFeatureResponse>>(endpoints.admin.vehicleFeatures, data);
  return res.data.data;
}

export async function updateVehicleFeature(id: number, data: UpdateVehicleFeatureRequest) {
  const res = await apiClient.put<ApiResponse<VehicleFeatureResponse>>(`${endpoints.admin.vehicleFeatures}/${id}`, data);
  return res.data.data;
}

export async function deleteVehicleFeature(id: number) {
  await apiClient.delete(`${endpoints.admin.vehicleFeatures}/${id}`);
}
