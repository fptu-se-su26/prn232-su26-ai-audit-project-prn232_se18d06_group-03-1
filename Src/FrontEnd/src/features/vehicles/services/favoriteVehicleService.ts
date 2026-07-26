import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type { VehicleListItemResponse } from "@/features/vehicles/types";

export async function getFavoriteVehicleIds() {
  const response = await apiClient.get<ApiResponse<number[]>>(endpoints.favoriteVehicles.ids);
  return response.data.data ?? [];
}

export async function getFavoriteVehicles(page = 1, pageSize = 12) {
  const response = await apiClient.get<ApiResponse<PagedResult<VehicleListItemResponse>>>(
    endpoints.favoriteVehicles.list,
    { params: { page, pageSize } },
  );
  return response.data.data ?? { items: [], totalCount: 0, page: 1, pageSize, totalPages: 0 };
}

export async function addFavoriteVehicle(vehicleId: number) {
  await apiClient.put(endpoints.favoriteVehicles.byVehicle(vehicleId));
}

export async function removeFavoriteVehicle(vehicleId: number) {
  await apiClient.delete(endpoints.favoriteVehicles.byVehicle(vehicleId));
}
