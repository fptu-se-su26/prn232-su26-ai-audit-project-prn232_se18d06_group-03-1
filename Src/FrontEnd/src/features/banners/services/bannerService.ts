import type { ApiResponse } from "@/features/auth/types";
import { apiClient } from "@/services/apiClient";
import type {
  Banner,
  BannerUploadResult,
  CreateBannerPayload,
  HomepageBanner,
  UpdateBannerPayload,
} from "../types";

const ADMIN_BASE = "/api/admin/banners";
const PUBLIC_BASE = "/api/banners";

type BannerPage = {
  items: Banner[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getBanners(params: { keyword?: string; isActive?: boolean; page?: number; pageSize?: number }) {
  const res = await apiClient.get<ApiResponse<BannerPage>>(ADMIN_BASE, { params });
  return res.data.data as BannerPage;
}

export async function getBanner(id: number) {
  const res = await apiClient.get<ApiResponse<Banner>>(`${ADMIN_BASE}/${id}`);
  return res.data.data as Banner;
}

export async function createBanner(payload: CreateBannerPayload) {
  const res = await apiClient.post<ApiResponse<Banner>>(ADMIN_BASE, payload);
  return res.data.data as Banner;
}

export async function updateBanner(id: number, payload: UpdateBannerPayload) {
  const res = await apiClient.put<ApiResponse<Banner>>(`${ADMIN_BASE}/${id}`, payload);
  return res.data.data as Banner;
}

export async function deleteBanner(id: number) {
  await apiClient.delete(`${ADMIN_BASE}/${id}`);
}

export async function toggleBanner(id: number) {
  const res = await apiClient.patch<ApiResponse<{ isActive: boolean }>>(`${ADMIN_BASE}/${id}/toggle`);
  return res.data.data as { isActive: boolean };
}

export async function uploadBannerImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<ApiResponse<BannerUploadResult>>(`${ADMIN_BASE}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data as BannerUploadResult;
}

export async function getHomepageBanners() {
  const res = await apiClient.get<ApiResponse<HomepageBanner[]>>(`${PUBLIC_BASE}/homepage`);
  return res.data.data as HomepageBanner[];
}
