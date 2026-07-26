import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/features/auth/types";
import type { PagedResult } from "@/features/admin/types";

export interface BroadcastNotificationRequest {
  title: string;
  body: string;
  /** "InApp" | "Email" | "Both" */
  channel: string;
  /** "All" | "ByRole" | "ByUser" */
  targetType: string;
  targetRoles: string[];
  targetUserIds: number[];
}

export interface BroadcastNotificationResponse {
  totalTargeted: number;
  successCount: number;
  failedCount: number;
  errors: string[];
}

export interface BroadcastNotificationLog {
  id: string;
  senderId: number;
  senderName: string;
  senderRole: string;
  title: string;
  body: string;
  channel: string;
  targetType: string;
  targetRoles: string[];
  targetUserIds: number[];
  totalTargeted: number;
  successCount: number;
  failedCount: number;
  status: "Completed" | "Partial" | "Failed";
  errors: string[];
  timestamp: string;
  completedAt: string | null;
}

export async function broadcastNotification(
  request: BroadcastNotificationRequest,
): Promise<BroadcastNotificationResponse> {
  const res = await apiClient.post<{ data: BroadcastNotificationResponse }>(
    "/api/notifications/broadcast",
    request,
  );
  return res.data.data;
}

export async function getBroadcastNotificationLogs(params: {
  keyword?: string;
  channel?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
}) {
  const res = await apiClient.get<ApiResponse<PagedResult<BroadcastNotificationLog>>>(
    "/api/notifications/broadcast/logs",
    { params },
  );
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: params.pageSize, totalPages: 0 };
}
