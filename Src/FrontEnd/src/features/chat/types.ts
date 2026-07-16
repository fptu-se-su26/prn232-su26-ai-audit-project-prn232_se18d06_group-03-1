export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

export interface ChatParticipant {
  userId: number;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
}

export interface ChatLastMessage {
  text: string;
  senderId: number;
  sentAt: string;
}

export interface ChatRoom {
  id: string;
  bookingId: number;
  bookingCode: string;
  customerId: number;
  customerName: string;
  ownerId: number;
  ownerName: string;
  vehicleId: number;
  vehicleName?: string | null;
  participants: ChatParticipant[];
  lastMessage?: ChatLastMessage | null;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  bookingId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  messageType: string;
  content: string;
  isRead: boolean;
  sentAt: string;
}

export interface ChatMessageCreatedPayload {
  message: ChatMessage;
  room: ChatRoom;
}

export interface SendChatMessageRequest {
  content: string;
}
