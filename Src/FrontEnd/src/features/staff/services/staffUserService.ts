import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type {
  AdminUserListParams,
  AdminUserListItem,
  AdminUserDetail,
  AdminUpdateUserRequest,
  UpdateUserStatusRequest,
  AdminLoginSession,
  PagedResult,
} from "@/features/admin/types";

export async function getStaffUsers(params: AdminUserListParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<AdminUserListItem>>>(endpoints.staff.users, {
    params,
  });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getStaffUserById(id: number) {
  const res = await apiClient.get<ApiResponse<AdminUserDetail>>(endpoints.staff.userById(id));
  return res.data.data;
}

export async function updateStaffUser(id: number, request: AdminUpdateUserRequest) {
  const res = await apiClient.put<ApiResponse<null>>(endpoints.staff.userById(id), request);
  return res.data;
}

export async function updateStaffUserStatus(id: number, request: UpdateUserStatusRequest) {
  const res = await apiClient.patch<ApiResponse<null>>(endpoints.staff.userById(id) + "/status", request);
  return res.data;
}

export async function getStaffUserSessions(id: number) {
  const res = await apiClient.get<ApiResponse<AdminLoginSession[]>>(endpoints.staff.userSessions(id));
  return res.data.data ?? [];
}

export async function revokeStaffUserSession(userId: number, sessionId: string) {
  await apiClient.delete(`${endpoints.staff.userSessions(userId)}/${encodeURIComponent(sessionId)}`);
}
