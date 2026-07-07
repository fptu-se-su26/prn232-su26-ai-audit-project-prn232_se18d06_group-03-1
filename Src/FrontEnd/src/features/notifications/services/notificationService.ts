import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";
import type { MarkAllNotificationsReadResponse, NotificationItem, NotificationUnreadCountResponse } from "@/features/notifications/types";

export async function getNotifications(params: Record<string, string | number | boolean | undefined>) {
  const res = await apiClient.get<ApiResponse<PagedResult<NotificationItem>>>(endpoints.notifications.base, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getNotificationUnreadCount() {
  const res = await apiClient.get<ApiResponse<NotificationUnreadCountResponse>>(endpoints.notifications.unreadCount);
  return res.data.data ?? { unreadCount: 0 };
}

export async function markNotificationAsRead(id: number) {
  const res = await apiClient.put<ApiResponse<NotificationItem>>(endpoints.notifications.markRead(id));
  return res.data.data;
}

export async function markAllNotificationsAsRead() {
  const res = await apiClient.put<ApiResponse<MarkAllNotificationsReadResponse>>(endpoints.notifications.markAllRead);
  return res.data.data ?? { updatedCount: 0 };
}
