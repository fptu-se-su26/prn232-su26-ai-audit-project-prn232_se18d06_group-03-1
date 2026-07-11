import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type { DriverLicenseClassResponse, CreateDriverLicenseClassRequest, UpdateDriverLicenseClassRequest } from "@/features/driverLicenseClasses/types";

export async function getDriverLicenseClasses(params: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<PagedResult<DriverLicenseClassResponse>>>(endpoints.admin.driverLicenseClasses, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getDriverLicenseClassById(id: number) {
  const res = await apiClient.get<ApiResponse<DriverLicenseClassResponse>>(`${endpoints.admin.driverLicenseClasses}/${id}`);
  return res.data.data;
}

export async function getDriverLicenseClassCompatibleRequiredClasses(id: number) {
  const res = await apiClient.get<ApiResponse<DriverLicenseClassResponse[]>>(`${endpoints.admin.driverLicenseClasses}/${id}/compatible-required-classes`);
  return res.data.data ?? [];
}

export async function createDriverLicenseClass(data: CreateDriverLicenseClassRequest) {
  const res = await apiClient.post<ApiResponse<DriverLicenseClassResponse>>(endpoints.admin.driverLicenseClasses, data);
  return res.data.data;
}

export async function updateDriverLicenseClass(id: number, data: UpdateDriverLicenseClassRequest) {
  const res = await apiClient.put<ApiResponse<DriverLicenseClassResponse>>(`${endpoints.admin.driverLicenseClasses}/${id}`, data);
  return res.data.data;
}

export async function deleteDriverLicenseClass(id: number) {
  await apiClient.delete(`${endpoints.admin.driverLicenseClasses}/${id}`);
}

export async function getAllDriverLicenseClasses() {
  const res = await apiClient.get<ApiResponse<PagedResult<DriverLicenseClassResponse>>>(endpoints.admin.driverLicenseClasses, {
    params: { pageSize: 100 }
  });
  return res.data.data?.items ?? [];
}

export async function getCatalogDriverLicenseClasses() {
  const res = await apiClient.get<ApiResponse<DriverLicenseClassResponse[]>>(endpoints.catalog.driverLicenseClasses);
  return res.data.data ?? [];
}

export async function getCatalogDriverLicenseClassCompatibleRequiredClasses(id: number) {
  const res = await apiClient.get<ApiResponse<DriverLicenseClassResponse[]>>(`${endpoints.catalog.driverLicenseClasses}/${id}/compatible-required-classes`);
  return res.data.data ?? [];
}
