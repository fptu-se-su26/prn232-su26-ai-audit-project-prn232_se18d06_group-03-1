import { ArrowLeftRight, Bell, CheckCheck, ChevronDown, LogOut, Menu, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_NAME } from "@/constants/appConstants";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getNotificationUnreadCount, getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/features/notifications/services/notificationService";
import type { NotificationItem } from "@/features/notifications/types";
import { useNotificationStore } from "@/features/notifications/useNotifications";
import { usePresenceStore } from "@/features/presence/usePresence";
import { getDashboardPath } from "@/features/auth/utils/roleRedirect";
import useClickOutside from "@/hooks/useClickOutside";
import type { UserRole } from "@/features/auth/types";
import logoUrl from "../../../Logo/movevn_horizontal_light.png";

const roleSwitchLabels: Record<UserRole, string> = {
  Admin: "Quản trị",
  Staff: "Nhân viên",
  Owner: "Chủ xe",
  Customer: "Khách hàng",
};

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

function getNotificationTargetPath(notification: NotificationItem) {
  if (!notification.dataJson) return null;

  try {
    const data = JSON.parse(notification.dataJson) as { targetPath?: unknown };
    return typeof data.targetPath === "string" && data.targetPath.startsWith("/") ? data.targetPath : null;
  } catch {
    return null;
  }
}

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const activeRole = useAuthStore((state) => state.activeRole);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const notifications = useNotificationStore((state) => state.items);
  const notificationUnreadCount = useNotificationStore((state) => state.unreadCount);
  const setNotifications = useNotificationStore((state) => state.setItems);
  const setNotificationUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const markNotificationReadLocal = useNotificationStore((state) => state.markRead);
  const markAllNotificationsReadLocal = useNotificationStore((state) => state.markAllRead);
  const selfOnline = usePresenceStore((state) => state.selfOnline);
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useClickOutside(dropdownRef, () => setOpen(false));
  useClickOutside(notificationRef, () => setNotificationsOpen(false));

  const loadNotificationSummary = useCallback(async () => {
    if (!user) return;

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
  }, [setNotificationUnreadCount, setNotifications, user]);

  useEffect(() => {
    if (!user) return;
    void getNotificationUnreadCount()
      .then((result) => setNotificationUnreadCount(result.unreadCount))
      .catch(() => undefined);
  }, [setNotificationUnreadCount, user]);

  const initials = user?.fullName
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase() ?? "U";

  const otherRole = user?.roles.find((r) => r !== activeRole) ?? null;

  function handleSwitchRole() {
    if (!otherRole) return;
    setActiveRole(otherRole);
    setOpen(false);
    navigate(getDashboardPath([otherRole]));
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
    const targetPath = getNotificationTargetPath(notification);

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

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-14 items-center">
        <div className="flex w-56 shrink-0 items-center px-4">
          <Link to="/" className="flex items-center">
            <img alt={APP_NAME} className="h-[4.5rem] w-auto" src={logoUrl} />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 px-4 sm:px-6">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className={`hidden items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors sm:flex ${open ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-brand-700 text-xs font-semibold text-white">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
                {selfOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                )}
              </span>
              <span className="max-w-32 truncate">{user?.fullName ?? "Tài khoản"}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1 w-56 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                <Link
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <UserRound className="h-4 w-4" />
                  Hồ sơ
                </Link>

                {otherRole && (
                  <button
                    type="button"
                    onClick={handleSwitchRole}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    Chuyển đến {roleSwitchLabels[otherRole]?.toLowerCase() ?? otherRole}
                  </button>
                )}

                <span className="my-1 block border-t border-slate-100" />
                <Link
                  to="/logout"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </Link>
              </div>
            )}
          </div>

          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              aria-label="Thông báo"
              onClick={toggleNotifications}
              className={`relative grid h-10 w-10 place-items-center rounded-md transition-colors ${notificationsOpen ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Bell className="h-5 w-5" />
              {notificationUnreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
                  {notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-1 w-[22rem] overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Thông báo</p>
                    <p className="text-xs text-slate-500">{notificationUnreadCount} chưa đọc</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={notificationUnreadCount === 0}
                    className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Đọc hết
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading && (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">Đang tải thông báo...</div>
                  )}

                  {!notificationsLoading && notificationError && (
                    <div className="px-4 py-8 text-center text-sm text-red-600">{notificationError}</div>
                  )}

                  {!notificationsLoading && !notificationError && notifications.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">Chưa có thông báo.</div>
                  )}

                  {!notificationsLoading && !notificationError && notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => void handleNotificationClick(notification)}
                      className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 ${notification.isRead ? "bg-white" : "bg-brand-50/60"}`}
                    >
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-slate-200" : "bg-brand-600"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">{notification.title}</span>
                        <span className="mt-0.5 block text-sm leading-5 text-slate-600">{notification.body}</span>
                        <span className="mt-1 block text-xs text-slate-400">{formatNotificationTime(notification.createdAt)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Mở menu"
            className="grid h-10 w-10 place-items-center rounded-md text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
