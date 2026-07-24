import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { CmsPageResponse } from "@/features/cms/types";

export type CmsPageListItem = CmsPageResponse;

export type CreateCmsPagePayload = {
  slug: string;
  title: string;
  content: string;
};

export type UpdateCmsPagePayload = {
  title: string;
  content: string;
  isActive: boolean;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminCmsPages(keyword?: string, page = 1, pageSize = 10) {
  const res = await apiClient.get<ApiResponse<PagedResult<CmsPageListItem>>>(endpoints.admin.cmsPages, {
    params: { keyword, page, pageSize },
  });
  return res.data.data!;
}

export async function getAdminCmsPageById(id: number) {
  const res = await apiClient.get<ApiResponse<CmsPageResponse>>(endpoints.admin.cmsPageById(id));
  return res.data.data!;
}

export async function createAdminCmsPage(payload: CreateCmsPagePayload) {
  const res = await apiClient.post<ApiResponse<CmsPageResponse>>(endpoints.admin.cmsPages, payload);
  return res.data.data!;
}

export async function updateAdminCmsPage(id: number, payload: UpdateCmsPagePayload) {
  const res = await apiClient.put<ApiResponse<CmsPageResponse>>(endpoints.admin.cmsPageById(id), payload);
  return res.data.data!;
}

export async function deleteAdminCmsPage(id: number) {
  await apiClient.delete(endpoints.admin.cmsPageById(id));
}
