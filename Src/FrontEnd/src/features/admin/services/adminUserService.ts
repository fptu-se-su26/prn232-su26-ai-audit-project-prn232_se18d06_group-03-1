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
  CreateCustomerRequest,
  CreateOwnerRequest,
  OwnerOcrPreview,
  PagedResult,
  AdminLoginSession,
  UserManagementAuditLogItem,
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

export async function getAdminUserSessions(id: number) {
  const res = await apiClient.get<ApiResponse<AdminLoginSession[]>>(endpoints.admin.userSessions(id));
  return res.data.data ?? [];
}

export async function revokeAdminUserSession(userId: number, sessionId: string) {
  await apiClient.delete(`${endpoints.admin.userSessions(userId)}/${encodeURIComponent(sessionId)}`);
}

export async function createStaff(request: CreateStaffRequest) {
  const res = await apiClient.post<ApiResponse<unknown>>(endpoints.admin.createStaff, request);
  return res.data;
}

export async function createCustomer(request: CreateCustomerRequest) {
  const res = await apiClient.post<ApiResponse<unknown>>(endpoints.admin.createCustomer, request);
  return res.data;
}

export async function createOwner(request: CreateOwnerRequest) {
  const formData = new FormData();
  Object.entries(request).forEach(([key, value]) => {
    if (value !== null && value !== undefined) formData.append(key, value instanceof File ? value : String(value));
  });
  const res = await apiClient.post<ApiResponse<unknown>>(endpoints.admin.createOwner, formData);
  return res.data;
}

export async function previewOwnerOcr(fullName: string, nationalIdFrontImage?: File | null, driverLicenseFrontImage?: File | null) {
  const formData = new FormData();
  formData.append("fullName", fullName);
  if (nationalIdFrontImage) formData.append("nationalIdFrontImage", nationalIdFrontImage);
  if (driverLicenseFrontImage) formData.append("driverLicenseFrontImage", driverLicenseFrontImage);
  const res = await apiClient.post<ApiResponse<OwnerOcrPreview>>(endpoints.admin.previewOwnerOcr, formData);
  if (!res.data.data) throw new Error("OCR response is empty.");
  return res.data.data;
}

export async function getAdminUserAuditLogs(id: number) {
  const res = await apiClient.get<ApiResponse<UserManagementAuditLogItem[]>>(endpoints.admin.userLogs(id));
  return res.data.data ?? [];
}
