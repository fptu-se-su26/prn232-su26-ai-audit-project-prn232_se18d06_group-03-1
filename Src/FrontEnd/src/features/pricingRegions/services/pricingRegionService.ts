import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type { CreatePricingRegionRequest, PricingRegionResponse, UpdatePricingRegionRequest } from "@/features/pricingRegions/types";

export async function getPricingRegions(params: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<PagedResult<PricingRegionResponse>>>(endpoints.admin.pricingRegions, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function createPricingRegion(data: CreatePricingRegionRequest) {
  const res = await apiClient.post<ApiResponse<PricingRegionResponse>>(endpoints.admin.pricingRegions, data);
  return res.data.data;
}

export async function updatePricingRegion(id: number, data: UpdatePricingRegionRequest) {
  const res = await apiClient.put<ApiResponse<PricingRegionResponse>>(`${endpoints.admin.pricingRegions}/${id}`, data);
  return res.data.data;
}

export async function deletePricingRegion(id: number) {
  await apiClient.delete(`${endpoints.admin.pricingRegions}/${id}`);
}
