import { apiClient } from "@/services/apiClient";

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

export async function broadcastNotification(
  request: BroadcastNotificationRequest,
): Promise<BroadcastNotificationResponse> {
  const res = await apiClient.post<{ data: BroadcastNotificationResponse }>(
    "/api/notifications/broadcast",
    request,
  );
  return res.data.data;
}
