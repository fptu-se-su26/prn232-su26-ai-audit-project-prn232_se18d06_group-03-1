import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";

export type LoginSession = {
  sessionId: string;
  deviceType?: string | null;
  ipAddress?: string | null;
  signedInAt: string;
  expiresAt: string;
  isActive: boolean;
};

export async function getLoginSessions() {
  const response = await apiClient.get<ApiResponse<LoginSession[]>>(endpoints.auth.sessions);
  return response.data.data ?? [];
}

export async function revokeLoginSession(sessionId: string) {
  await apiClient.delete(`${endpoints.auth.sessions}/${encodeURIComponent(sessionId)}`);
}

export async function revokeOtherLoginSessions(currentSessionId: string) {
  await apiClient.delete(`${endpoints.auth.sessions}/others`, { params: { currentSessionId } });
}
