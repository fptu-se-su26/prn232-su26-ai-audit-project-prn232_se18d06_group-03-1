import { bareApiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type { VehicleListItemResponse, VehicleResponse, VehicleAvailabilityResponse, VehicleImageResponse } from "@/features/vehicles/types";

export async function getPublicVehicles(params: Record<string, string | number | boolean | undefined>) {
  const res = await bareApiClient.get<ApiResponse<PagedResult<VehicleListItemResponse>>>(endpoints.publicVehicles.list, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 12, totalPages: 0 };
}

export async function getVehicleAvailability(id: number) {
  const res = await bareApiClient.get<ApiResponse<VehicleAvailabilityResponse>>(endpoints.publicVehicles.availability(id));
  return res.data.data;
}

export async function getPublicVehicleById(id: number) {
  const res = await bareApiClient.get<ApiResponse<VehicleResponse>>(endpoints.publicVehicles.byId(id));
  return res.data.data;
}

export async function getPublicVehicleImages(id: number) {
  const res = await bareApiClient.get<ApiResponse<VehicleImageResponse[]>>(endpoints.publicVehicles.images(id));
  return res.data.data ?? [];
}