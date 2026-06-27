import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type { VehicleModelResponse, CreateVehicleModelRequest, UpdateVehicleModelRequest } from "@/features/vehicleModels/types";

export async function getVehicleModels(params: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<PagedResult<VehicleModelResponse>>>(endpoints.admin.vehicleModels, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getVehicleModelById(id: number) {
  const res = await apiClient.get<ApiResponse<VehicleModelResponse>>(`${endpoints.admin.vehicleModels}/${id}`);
  return res.data.data;
}

export async function getVehicleModelsByBrand(brandId: number) {
  const res = await apiClient.get<ApiResponse<VehicleModelResponse[]>>(`${endpoints.admin.vehicleModels}/by-brand/${brandId}`);
  return res.data.data ?? [];
}

export async function createVehicleModel(data: CreateVehicleModelRequest) {
  const res = await apiClient.post<ApiResponse<VehicleModelResponse>>(endpoints.admin.vehicleModels, data);
  return res.data.data;
}

export async function updateVehicleModel(id: number, data: UpdateVehicleModelRequest) {
  const res = await apiClient.put<ApiResponse<VehicleModelResponse>>(`${endpoints.admin.vehicleModels}/${id}`, data);
  return res.data.data;
}

export async function deleteVehicleModel(id: number) {
  await apiClient.delete(`${endpoints.admin.vehicleModels}/${id}`);
}

export async function getVehicleModelCascadeInfo(id: number) {
  const res = await apiClient.get<ApiResponse<{ affectedVariantCount: number }>>(`${endpoints.admin.vehicleModels}/${id}/cascade-info`);
  return res.data.data ?? { affectedVariantCount: 0 };
}
