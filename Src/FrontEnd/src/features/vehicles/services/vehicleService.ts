import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type {
  VehicleListItemResponse,
  VehicleResponse,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  CatalogBrand,
  CatalogModel,
  CatalogVariant,
  CatalogFeature,
  CatalogArea,
  CatalogPricingRegion,
  PricingSuggestionResponse,
  VehiclePricingResponse,
  UpdateVehiclePricingRequest,
} from "@/features/vehicles/types";

export async function getMyVehicles(params: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<PagedResult<VehicleListItemResponse>>>(endpoints.vehicles.my, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getVehicleById(id: number) {
  const res = await apiClient.get<ApiResponse<VehicleResponse>>(endpoints.vehicles.byId(id));
  return res.data.data;
}

export async function createVehicle(data: CreateVehicleRequest) {
  const res = await apiClient.post<ApiResponse<VehicleResponse>>(endpoints.vehicles.base, data);
  return res.data.data;
}

export async function updateVehicle(id: number, data: UpdateVehicleRequest) {
  const res = await apiClient.put<ApiResponse<VehicleResponse>>(endpoints.vehicles.byId(id), data);
  return res.data.data;
}

export async function toggleVehicleStatus(id: number) {
  await apiClient.put(endpoints.vehicles.toggleStatus(id));
}

export async function getPricingSuggestion(modelId: number, areaId: number) {
  const res = await apiClient.get<ApiResponse<PricingSuggestionResponse>>(endpoints.vehicles.pricingSuggestion, {
    params: { modelId, areaId },
  });
  return res.data.data;
}

export async function getVehiclePricing(id: number) {
  const res = await apiClient.get<ApiResponse<VehiclePricingResponse>>(endpoints.vehicles.pricing(id));
  return res.data.data;
}

export async function updateVehiclePricing(id: number, data: UpdateVehiclePricingRequest) {
  const res = await apiClient.put<ApiResponse<VehiclePricingResponse>>(endpoints.vehicles.pricing(id), data);
  return res.data.data;
}

export async function getCatalogBrands(vehicleType?: string) {
  const params = vehicleType ? { vehicleType } : undefined;
  const res = await apiClient.get<ApiResponse<CatalogBrand[]>>(endpoints.catalog.brands, { params });
  return res.data.data ?? [];
}

export async function getCatalogModels(brandId?: number) {
  const params = brandId ? { brandId } : undefined;
  const res = await apiClient.get<ApiResponse<CatalogModel[]>>(endpoints.catalog.models, { params });
  return res.data.data ?? [];
}

export async function getCatalogVariants(modelId?: number, vehicleType?: string) {
  const params: Record<string, string | number> = {};
  if (modelId) params.modelId = modelId;
  if (vehicleType) params.vehicleType = vehicleType;
  const res = await apiClient.get<ApiResponse<CatalogVariant[]>>(endpoints.catalog.variants, { params });
  return res.data.data ?? [];
}

export async function getCatalogFeatures(vehicleType?: string) {
  const params = vehicleType ? { vehicleType } : undefined;
  const res = await apiClient.get<ApiResponse<CatalogFeature[]>>(endpoints.catalog.features, { params });
  return res.data.data ?? [];
}

export async function getCatalogAreas(params?: Record<string, string | number | undefined>) {
  const res = await apiClient.get<ApiResponse<CatalogArea[]>>(endpoints.catalog.areas, { params });
  return res.data.data ?? [];
}

export async function getCatalogPricingRegions() {
  const res = await apiClient.get<ApiResponse<CatalogPricingRegion[]>>(endpoints.catalog.pricingRegions);
  return res.data.data ?? [];
}
