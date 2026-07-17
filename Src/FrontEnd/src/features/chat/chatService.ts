import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { ChatMessage, ChatRoom, PagedResult, SendChatMessageRequest } from "@/features/chat/types";

export async function getChatRooms(params: { page?: number; pageSize?: number } = {}): Promise<PagedResult<ChatRoom>> {
  const res = await apiClient.get<ApiResponse<PagedResult<ChatRoom>>>(endpoints.chats.rooms, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: params.pageSize ?? 20, totalPages: 0 };
}

export async function getOrCreateChatRoomByBooking(bookingId: number): Promise<ChatRoom> {
  const res = await apiClient.post<ApiResponse<ChatRoom>>(endpoints.chats.roomByBooking(bookingId));
  return res.data.data!;
}

export async function getChatMessages(roomId: string, params: { page?: number; pageSize?: number } = {}): Promise<PagedResult<ChatMessage>> {
  const res = await apiClient.get<ApiResponse<PagedResult<ChatMessage>>>(endpoints.chats.messages(roomId), { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: params.pageSize ?? 50, totalPages: 0 };
}

export async function sendChatMessage(roomId: string, data: SendChatMessageRequest): Promise<ChatMessage> {
  const res = await apiClient.post<ApiResponse<ChatMessage>>(endpoints.chats.messages(roomId), data);
  return res.data.data!;
}

export async function markChatRoomAsRead(roomId: string): Promise<ChatRoom> {
  const res = await apiClient.put<ApiResponse<ChatRoom>>(endpoints.chats.read(roomId));
  return res.data.data!;
}
