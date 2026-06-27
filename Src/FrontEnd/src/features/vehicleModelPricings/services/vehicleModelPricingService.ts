import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type { CreateVehicleModelPricingRequest, UpdateVehicleModelPricingRequest, VehicleModelPricingResponse } from "@/features/vehicleModelPricings/types";

export async function getVehicleModelPricings(params: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<PagedResult<VehicleModelPricingResponse>>>(endpoints.admin.vehicleModelPricings, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function createVehicleModelPricing(data: CreateVehicleModelPricingRequest) {
  const res = await apiClient.post<ApiResponse<VehicleModelPricingResponse>>(endpoints.admin.vehicleModelPricings, data);
  return res.data.data;
}

export async function updateVehicleModelPricing(id: number, data: UpdateVehicleModelPricingRequest) {
  const res = await apiClient.put<ApiResponse<VehicleModelPricingResponse>>(`${endpoints.admin.vehicleModelPricings}/${id}`, data);
  return res.data.data;
}

export async function deleteVehicleModelPricing(id: number) {
  await apiClient.delete(`${endpoints.admin.vehicleModelPricings}/${id}`);
}
