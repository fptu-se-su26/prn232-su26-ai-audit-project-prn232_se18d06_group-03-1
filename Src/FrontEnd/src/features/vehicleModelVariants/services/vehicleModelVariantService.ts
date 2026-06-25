import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type { VehicleModelVariantResponse, CreateVehicleModelVariantRequest, UpdateVehicleModelVariantRequest } from "@/features/vehicleModelVariants/types";

export async function getVehicleModelVariants(params: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<PagedResult<VehicleModelVariantResponse>>>(endpoints.admin.vehicleModelVariants, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getVehicleModelVariantById(id: number) {
  const res = await apiClient.get<ApiResponse<VehicleModelVariantResponse>>(`${endpoints.admin.vehicleModelVariants}/${id}`);
  return res.data.data;
}

export async function createVehicleModelVariant(data: CreateVehicleModelVariantRequest) {
  const res = await apiClient.post<ApiResponse<VehicleModelVariantResponse>>(endpoints.admin.vehicleModelVariants, data);
  return res.data.data;
}

export async function updateVehicleModelVariant(id: number, data: UpdateVehicleModelVariantRequest) {
  const res = await apiClient.put<ApiResponse<VehicleModelVariantResponse>>(`${endpoints.admin.vehicleModelVariants}/${id}`, data);
  return res.data.data;
}

export async function deleteVehicleModelVariant(id: number) {
  await apiClient.delete(`${endpoints.admin.vehicleModelVariants}/${id}`);
}
