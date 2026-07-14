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
  VehicleModerationListItem,
  VehicleModerationDetailResponse,
  VehicleModerationOverviewResponse,
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

export async function uploadVehicleDocument(id: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<ApiResponse<VehicleResponse>>(endpoints.vehicles.uploadDocument(id), formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function uploadVehicleImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<ApiResponse<{ url: string }>>(endpoints.vehicles.uploadImage, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data?.url ?? "";
}

export async function updateVehicle(id: number, data: UpdateVehicleRequest) {
  const res = await apiClient.put<ApiResponse<VehicleResponse>>(endpoints.vehicles.byId(id), data);
  return res.data.data;
}

export async function toggleVehicleStatus(id: number) {
  await apiClient.put(endpoints.vehicles.toggleStatus(id));
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function getPricingSuggestion(modelId: number, areaId: number, options?: { date?: string; vacantRate?: number }) {
  const res = await apiClient.get<ApiResponse<PricingSuggestionResponse>>(endpoints.vehicles.pricingSuggestion, {
    params: {
      modelId,
      areaId,
      date: options?.date ?? todayIsoDate(),
      vacantRate: options?.vacantRate ?? 1,
    },
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

export async function getModerationVehicles(
  role: "staff" | "admin",
  params: Record<string, string | number | undefined>,
) {
  const path = role === "staff" ? endpoints.staff.vehicles : endpoints.admin.vehicles;
  const res = await apiClient.get<ApiResponse<PagedResult<VehicleModerationListItem>>>(path, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getStaffVehicleModerationOverview() {
  const res = await apiClient.get<ApiResponse<VehicleModerationOverviewResponse>>(endpoints.staff.vehicleModerationOverview);
  return res.data.data;
}

export async function getAdminVehicleModerationOverview() {
  const res = await apiClient.get<ApiResponse<VehicleModerationOverviewResponse>>(endpoints.admin.vehicleModerationOverview);
  return res.data.data;
}

export async function getModerationVehicleById(role: "staff" | "admin", id: number) {
  const base = role === "staff" ? endpoints.staff.vehicles : endpoints.admin.vehicles;
  const res = await apiClient.get<ApiResponse<VehicleModerationDetailResponse>>(`${base}/${id}`);
  return res.data.data;
}

export async function approveVehicleDocument(role: "staff" | "admin", vehicleId: number, documentId: number) {
  const base = role === "staff" ? endpoints.staff.vehicles : endpoints.admin.vehicles;
  await apiClient.post(`${base}/${vehicleId}/documents/${documentId}/approve`);
}

export async function rejectVehicleDocument(role: "staff" | "admin", vehicleId: number, documentId: number, reason: string) {
  const base = role === "staff" ? endpoints.staff.vehicles : endpoints.admin.vehicles;
  await apiClient.post(`${base}/${vehicleId}/documents/${documentId}/reject`, { reason });
}

export async function requestVehicleDocumentMoreInfo(role: "staff" | "admin", vehicleId: number, documentId: number, reason: string) {
  const base = role === "staff" ? endpoints.staff.vehicles : endpoints.admin.vehicles;
  await apiClient.post(`${base}/${vehicleId}/documents/${documentId}/request-more-info`, { reason });
}

export async function approveVehicleListing(role: "staff" | "admin", vehicleId: number) {
  const base = role === "staff" ? endpoints.staff.vehicles : endpoints.admin.vehicles;
  await apiClient.post(`${base}/${vehicleId}/approve-listing`);
}

export async function rejectVehicleListing(role: "staff" | "admin", vehicleId: number, reason: string) {
  const base = role === "staff" ? endpoints.staff.vehicles : endpoints.admin.vehicles;
  await apiClient.post(`${base}/${vehicleId}/reject-listing`, { reason });
}

export type BlockedDateResponse = {
  id: number;
  vehicleId: number;
  startDate: string;
  endDate: string;
  reason: string | null;
};

export type BlockedDateRequest = {
  dateFrom: string;
  dateTo: string;
  reason?: string | null;
};

export async function getBlockedDates(vehicleId: number) {
  const res = await apiClient.get<ApiResponse<BlockedDateResponse[]>>(endpoints.vehicles.blockedDates(vehicleId));
  return res.data.data ?? [];
}

export async function createBlockedDate(vehicleId: number, data: BlockedDateRequest) {
  const res = await apiClient.post<ApiResponse<BlockedDateResponse>>(endpoints.vehicles.blockedDates(vehicleId), data);
  return res.data.data;
}

export async function deleteBlockedDate(blockedDateId: number) {
  await apiClient.delete(endpoints.vehicles.deleteBlockedDate(blockedDateId));
}
