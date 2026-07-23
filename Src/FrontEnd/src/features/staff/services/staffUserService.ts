import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type {
  AdminUserListParams,
  AdminUserListItem,
  AdminUserDetail,
  AdminUpdateUserRequest,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
  AdminLoginSession,
  PagedResult,
  UserManagementAuditLogItem,
  CreateCustomerRequest,
  CreateOwnerRequest,
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

export async function updateStaffUserRole(id: number, request: UpdateUserRoleRequest) {
  const res = await apiClient.patch<ApiResponse<null>>(endpoints.staff.userById(id) + "/roles", request);
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

export async function getStaffUserAuditLogs(id: number) {
  const res = await apiClient.get<ApiResponse<UserManagementAuditLogItem[]>>(endpoints.staff.userLogs(id));
  return res.data.data ?? [];
}

export async function createStaffCustomer(request: CreateCustomerRequest) {
  const res = await apiClient.post<ApiResponse<unknown>>(endpoints.staff.users + "/customers", request);
  return res.data;
}

export async function createStaffOwner(request: CreateOwnerRequest) {
  const formData = new FormData();
  Object.entries(request).forEach(([key, value]) => {
    if (value !== null && value !== undefined) formData.append(key, value instanceof File ? value : String(value));
  });
  const res = await apiClient.post<ApiResponse<unknown>>(endpoints.staff.users + "/owners", formData);
  return res.data;
}