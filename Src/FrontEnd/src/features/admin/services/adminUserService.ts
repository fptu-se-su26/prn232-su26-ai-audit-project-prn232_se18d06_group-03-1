import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { AdminUserListItem } from "@/features/admin/types";

export async function getAdminUsers(keyword?: string) {
  const res = await apiClient.get<ApiResponse<AdminUserListItem[]>>(endpoints.admin.users, {
    params: keyword ? { keyword } : undefined,
  });

  return res.data.data ?? [];
}
