import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { CmsPageResponse } from "@/features/cms/types";

export async function getCmsPageBySlug(slug: string) {
  const res = await apiClient.get<ApiResponse<CmsPageResponse | null>>(endpoints.publicCmsPages.bySlug(slug));
  return res.data.data;
}
