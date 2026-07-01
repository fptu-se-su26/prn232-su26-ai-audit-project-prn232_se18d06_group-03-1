import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { AdminUserListParams, AdminUserListItem, PagedResult } from "@/features/admin/types";

export async function getAdminUsers(params: AdminUserListParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<AdminUserListItem>>>(endpoints.admin.users, {
    params,
  });

  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}
