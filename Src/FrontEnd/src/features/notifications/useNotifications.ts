import { create } from "zustand";
import type { NotificationItem } from "@/features/notifications/types";

type NotificationState = {
  items: NotificationItem[];
  unreadCount: number;
  setItems: (items: NotificationItem[]) => void;
  setUnreadCount: (unreadCount: number) => void;
  prependNotification: (notification: NotificationItem, unreadCount: number) => void;
  markRead: (id: number) => void;
  markAllRead: () => void;
  reset: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,
  setItems: (items) => set({ items }),
  setUnreadCount: (unreadCount) => set({ unreadCount: Math.max(unreadCount, 0) }),
  prependNotification: (notification, unreadCount) =>
    set((state) => {
      const withoutDuplicate = state.items.filter((item) => item.id !== notification.id);
      return {
        items: [notification, ...withoutDuplicate].slice(0, 10),
        unreadCount: Math.max(unreadCount, 0),
      };
    }),
  markRead: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() } : item,
      ),
      unreadCount: Math.max(state.unreadCount - (state.items.find((item) => item.id === id && !item.isRead) ? 1 : 0), 0),
    })),
  markAllRead: () =>
    set((state) => ({
      items: state.items.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() })),
      unreadCount: 0,
    })),
  reset: () => set({ items: [], unreadCount: 0 }),
}));
