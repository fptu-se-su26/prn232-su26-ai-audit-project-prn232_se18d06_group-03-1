import { Bell, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import type { UserRole } from "@/features/auth/types";
import { getNotificationUnreadCount, getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/features/notifications/services/notificationService";
import type { NotificationItem } from "@/features/notifications/types";
import { useNotificationConnection } from "@/features/notifications/useNotificationConnection";
import { useNotificationStore } from "@/features/notifications/useNotifications";
import useClickOutside from "@/hooks/useClickOutside";

type NotificationMenuVariant = "dashboard" | "public";

type NotificationMenuProps = {
  variant?: NotificationMenuVariant;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type NotificationData = {
  targetPath?: unknown;
  ticketId?: unknown;
};

function getNumericId(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function getNotificationTargetPath(notification: NotificationItem, activeRole: UserRole | null) {
  if (!notification.dataJson) return null;

  try {
    const data = JSON.parse(notification.dataJson) as NotificationData;
    if (typeof data.targetPath === "string" && data.targetPath.startsWith("/")) {
      if (notification.type === "SupportTicket" && activeRole === "Admin" && data.targetPath.startsWith("/staff/support-tickets")) {
        return data.targetPath.replace("/staff/support-tickets", "/admin/support-tickets");
      }

      return data.targetPath;
    }

    const ticketId = getNumericId(data.ticketId);
    if (notification.type === "SupportTicket" && ticketId) {
      if (activeRole === "Customer") return `/customer/support-tickets/${ticketId}`;
      if (activeRole === "Admin") return `/admin/support-tickets/${ticketId}`;
      return `/staff/support-tickets/${ticketId}`;
    }

    return null;
  } catch {
    return null;
  }
}

export default function NotificationMenu({ variant = "dashboard" }: NotificationMenuProps) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const activeRole = useAuthStore((state) => state.activeRole);
  const notifications = useNotificationStore((state) => state.items);
  const notificationUnreadCount = useNotificationStore((state) => state.unreadCount);
  const setNotifications = useNotificationStore((state) => state.setItems);
  const setNotificationUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const markNotificationReadLocal = useNotificationStore((state) => state.markRead);
  const markAllNotificationsReadLocal = useNotificationStore((state) => state.markAllRead);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useNotificationConnection();
  useClickOutside(notificationRef, () => setNotificationsOpen(false));

  const loadNotificationSummary = useCallback(async () => {
    if (!token || !user) return;

    setNotificationsLoading(true);
    setNotificationError(null);
    try {
      const [list, unread] = await Promise.all([
        getNotifications({ page: 1, pageSize: 10 }),
        getNotificationUnreadCount(),
      ]);
      setNotifications(list.items);
      setNotificationUnreadCount(unread.unreadCount);
    } catch {
      setNotificationError("Không thể tải thông báo.");
    } finally {
      setNotificationsLoading(false);
    }
  }, [setNotificationUnreadCount, setNotifications, token, user]);

  useEffect(() => {
    if (!token || !user) return;
    void getNotificationUnreadCount()
      .then((result) => setNotificationUnreadCount(result.unreadCount))
      .catch(() => undefined);
  }, [setNotificationUnreadCount, token, user]);

  if (!token || !user) {
    return null;
  }

  function toggleNotifications() {
    setNotificationsOpen((prev) => {
      const next = !prev;
      if (next) {
        void loadNotificationSummary();
      }
      return next;
    });
  }

  async function handleNotificationClick(notification: NotificationItem) {
    const targetPath = getNotificationTargetPath(notification, activeRole);

    if (!notification.isRead) {
      markNotificationReadLocal(notification.id);
      try {
        await markNotificationAsRead(notification.id);
        const result = await getNotificationUnreadCount();
        setNotificationUnreadCount(result.unreadCount);
      } catch {
        void loadNotificationSummary();
      }
    }

    if (targetPath) {
      setNotificationsOpen(false);
      navigate(targetPath);
    }
  }

  async function handleMarkAllRead() {
    if (notificationUnreadCount === 0) return;
    markAllNotificationsReadLocal();
    try {
      await markAllNotificationsAsRead();
    } catch {
      void loadNotificationSummary();
    }
  }

  const isPublic = variant === "public";

  return (
    <div className="relative" ref={notificationRef}>
      <button
        type="button"
        aria-label="Thông báo"
        onClick={toggleNotifications}
        className={
          isPublic
            ? cx(
                "relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition",
                notificationsOpen
                  ? "border-brand-300 text-brand-700 dark:border-brand-600 dark:text-brand-200"
                  : "border-slate-200 text-slate-700 hover:border-brand-300 hover:text-brand-700 dark:border-neutral-800 dark:text-gray-300 dark:hover:border-brand-600 dark:hover:text-brand-200",
              )
            : cx(
                "relative grid h-10 w-10 place-items-center rounded-md transition-colors",
                notificationsOpen ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-slate-100",
              )
        }
      >
        <Bell className="h-5 w-5" />
        {notificationUnreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
            {notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}
          </span>
        )}
      </button>

      {notificationsOpen && (
        <div
          className={cx(
            "absolute right-0 z-50 w-[22rem] overflow-hidden border border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950",
            isPublic ? "mt-3 rounded-2xl" : "top-full mt-1 rounded-md",
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-neutral-800">
            <div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">Thông báo</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">{notificationUnreadCount} chưa đọc</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={notificationUnreadCount === 0}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent dark:text-brand-200 dark:hover:bg-brand-950/40 dark:disabled:text-neutral-600"
            >
              <CheckCheck className="h-4 w-4" />
              Đọc hết
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificationsLoading && (
              <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-gray-400">Đang tải thông báo...</div>
            )}

            {!notificationsLoading && notificationError && (
              <div className="px-4 py-8 text-center text-sm text-red-600 dark:text-red-400">{notificationError}</div>
            )}

            {!notificationsLoading && !notificationError && notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-gray-400">Chưa có thông báo.</div>
            )}

            {!notificationsLoading && !notificationError && notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => void handleNotificationClick(notification)}
                className={cx(
                  "flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 dark:border-neutral-800 dark:hover:bg-neutral-900/80",
                  notification.isRead ? "bg-white dark:bg-neutral-950" : "bg-brand-50/60 dark:bg-brand-950/30",
                )}
              >
                <span className={cx("mt-1 h-2 w-2 shrink-0 rounded-full", notification.isRead ? "bg-slate-200 dark:bg-neutral-700" : "bg-brand-600")} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{notification.title}</span>
                  <span className="mt-0.5 block text-sm leading-5 text-slate-600 dark:text-gray-300">{notification.body}</span>
                  <span className="mt-1 block text-xs text-slate-400 dark:text-gray-500">{formatNotificationTime(notification.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
