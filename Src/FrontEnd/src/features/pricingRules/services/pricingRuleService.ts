import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type { CreatePricingRuleRequest, PricingRuleResponse, UpdatePricingRuleRequest } from "@/features/pricingRules/types";

export async function getPricingRules(params: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<PagedResult<PricingRuleResponse>>>(endpoints.admin.pricingRules, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function createPricingRule(data: CreatePricingRuleRequest) {
  const res = await apiClient.post<ApiResponse<PricingRuleResponse>>(endpoints.admin.pricingRules, data);
  return res.data.data;
}

export async function updatePricingRule(id: number, data: UpdatePricingRuleRequest) {
  const res = await apiClient.put<ApiResponse<PricingRuleResponse>>(`${endpoints.admin.pricingRules}/${id}`, data);
  return res.data.data;
}

export async function deletePricingRule(id: number) {
  await apiClient.delete(`${endpoints.admin.pricingRules}/${id}`);
}
