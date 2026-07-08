export interface SupportTicketListRequest {
  category?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
  priority?: string;
  status?: string;
}

export interface CreateSupportTicketRequest {
  category: string;
  subject: string;
  message: string;
  priority: string;
  attachmentUrls?: string;
}

export interface AddTicketMessageRequest {
  message: string;
  attachmentUrls?: string;
}

export interface UpdateSupportTicketStatusRequest {
  status: string;
}

export interface SupportTicketListItem {
  id: number;
  userId: number;
  customerName: string;
  ticketNumber: string;
  category: string;
  subject: string;
  status: string;
  assignedStaffId?: number | null;
  assignedStaffName?: string | null;
  priority: string;
  messageCount: number;
  lastMessageAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface TicketMessageResponse {
  id: number;
  ticketId: number;
  senderId: number;
  senderName: string;
  senderRoles: string[];
  message: string;
  attachmentUrls?: string | null;
  createdAt: string;
}

export interface SupportTicketDetailResponse extends SupportTicketListItem {
  messages: TicketMessageResponse[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}
