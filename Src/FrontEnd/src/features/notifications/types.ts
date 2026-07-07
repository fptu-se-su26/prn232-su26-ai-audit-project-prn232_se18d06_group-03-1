export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string;
  dataJson?: string | null;
  channel: string;
  isRead: boolean;
  readAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
};

export type NotificationUnreadCountResponse = {
  unreadCount: number;
};

export type MarkAllNotificationsReadResponse = {
  updatedCount: number;
};

export type NotificationCreatedPayload = {
  notification: NotificationItem;
  unreadCount: number;
};

export type NotificationUnreadCountPayload = {
  unreadCount: number;
};
