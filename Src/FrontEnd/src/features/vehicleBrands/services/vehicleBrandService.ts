import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type { VehicleBrandResponse, CreateVehicleBrandRequest, UpdateVehicleBrandRequest } from "@/features/vehicleBrands/types";

export async function getVehicleBrands(params: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<PagedResult<VehicleBrandResponse>>>(endpoints.admin.vehicleBrands, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getVehicleBrandById(id: number) {
  const res = await apiClient.get<ApiResponse<VehicleBrandResponse>>(`${endpoints.admin.vehicleBrands}/${id}`);
  return res.data.data;
}

export async function createVehicleBrand(data: CreateVehicleBrandRequest) {
  const res = await apiClient.post<ApiResponse<VehicleBrandResponse>>(endpoints.admin.vehicleBrands, data);
  return res.data.data;
}

export async function updateVehicleBrand(id: number, data: UpdateVehicleBrandRequest) {
  const res = await apiClient.put<ApiResponse<VehicleBrandResponse>>(`${endpoints.admin.vehicleBrands}/${id}`, data);
  return res.data.data;
}

export async function deleteVehicleBrand(id: number) {
  await apiClient.delete(`${endpoints.admin.vehicleBrands}/${id}`);
}
