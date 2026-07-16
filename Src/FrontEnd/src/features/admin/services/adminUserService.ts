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
  CreateStaffRequest,
  CreateOwnerRequest,
  PagedResult,
} from "@/features/admin/types";

export async function getAdminUsers(params: AdminUserListParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<AdminUserListItem>>>(endpoints.admin.users, {
    params,
  });

  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getAdminUserById(id: number) {
  const res = await apiClient.get<ApiResponse<AdminUserDetail>>(endpoints.admin.userById(id));
  return res.data.data;
}

export async function updateAdminUser(id: number, request: AdminUpdateUserRequest) {
  const res = await apiClient.put<ApiResponse<null>>(endpoints.admin.userById(id), request);
  return res.data;
}

export async function updateUserRole(id: number, request: UpdateUserRoleRequest) {
  const res = await apiClient.patch<ApiResponse<null>>(endpoints.admin.userRoles(id), request);
  return res.data;
}

export async function updateUserStatus(id: number, request: UpdateUserStatusRequest) {
  const res = await apiClient.patch<ApiResponse<null>>(endpoints.admin.userStatus(id), request);
  return res.data;
}

export async function createStaff(request: CreateStaffRequest) {
  const res = await apiClient.post<ApiResponse<unknown>>(endpoints.admin.createStaff, request);
  return res.data;
}

export async function createOwner(request: CreateOwnerRequest) {
  const res = await apiClient.post<ApiResponse<unknown>>(endpoints.admin.createOwner, request);
  return res.data;
}
