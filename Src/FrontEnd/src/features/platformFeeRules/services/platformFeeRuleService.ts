import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type { CreatePlatformFeeRuleRequest, PlatformFeeRuleResponse, UpdatePlatformFeeRuleRequest } from "@/features/platformFeeRules/types";

export async function getPlatformFeeRules(params: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<PagedResult<PlatformFeeRuleResponse>>>(endpoints.admin.platformFeeRules, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function createPlatformFeeRule(data: CreatePlatformFeeRuleRequest) {
  const res = await apiClient.post<ApiResponse<PlatformFeeRuleResponse>>(endpoints.admin.platformFeeRules, data);
  return res.data.data;
}

export async function updatePlatformFeeRule(id: number, data: UpdatePlatformFeeRuleRequest) {
  const res = await apiClient.put<ApiResponse<PlatformFeeRuleResponse>>(`${endpoints.admin.platformFeeRules}/${id}`, data);
  return res.data.data;
}

export async function deletePlatformFeeRule(id: number) {
  await apiClient.delete(`${endpoints.admin.platformFeeRules}/${id}`);
}
