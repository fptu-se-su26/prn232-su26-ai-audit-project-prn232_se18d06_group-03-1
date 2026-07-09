import { Link, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getDashboardPath } from "@/features/auth/utils/roleRedirect";
import { getNotificationUnreadCount, getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/features/notifications/services/notificationService";
import type { NotificationItem } from "@/features/notifications/types";
import { useNotificationConnection } from "@/features/notifications/useNotificationConnection";
import { useNotificationStore } from "@/features/notifications/useNotifications";
import useClickOutside from "@/hooks/useClickOutside";
import logoDark from "../../../Logo/movevn_horizontal_dark.png";
import logoLight from "../../../Logo/movevn_horizontal_light.png";

const navItems = [
  { href: "/", label: "TRANG CHỦ" },
  { href: "/vehicle", label: "THUÊ XE" },
  { href: "/#process", label: "QUY TRÌNH" },
  { href: "/#contact", label: "LIÊN HỆ" },
];

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

export default function PublicLayout() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const notifications = useNotificationStore((state) => state.items);
  const notificationUnreadCount = useNotificationStore((state) => state.unreadCount);
  const setNotifications = useNotificationStore((state) => state.setItems);
  const setNotificationUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const markNotificationReadLocal = useNotificationStore((state) => state.markRead);
  const markAllNotificationsReadLocal = useNotificationStore((state) => state.markAllRead);
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dashboardPath = getDashboardPath(user?.roles ?? []);

  useNotificationConnection();

  const initials =
    user?.fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ?? "U";

  const accountLinks = [
    { to: dashboardPath, label: "Khu vực của tôi", icon: UserRound },
    ...(user?.roles.includes("Customer")
      ? [{ to: "/customer/bookings", label: "Lịch sử thuê xe", icon: CalendarDays }]
      : []),
    ...(user?.roles.includes("Owner")
      ? [{ to: "/owner/bookings", label: "Yêu cầu thuê", icon: CalendarDays }]
      : []),
    { to: "/account", label: "Hồ sơ tài khoản", icon: UserRound },
  ];

  useClickOutside(accountRef, () => setAccountOpen(false));
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
    <div className={darkMode ? "dark" : ""}>
      <div className="flex min-h-screen flex-col bg-white text-slate-900 transition-colors duration-300 dark:bg-black dark:text-gray-100">
        <nav className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md transition-colors duration-300 dark:border-neutral-900 dark:bg-black/95">
          <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center" aria-label="MoveVN">
              <img
                src={darkMode ? logoDark : logoLight}
                alt="MoveVN"
                className="h-10 w-auto object-contain"
              />
            </Link>

            <div className="hidden items-center gap-8 text-sm font-semibold text-slate-700 dark:text-gray-300 lg:flex">
              {navItems.map((item) => {
                const isHash = item.href.includes("#");
                if (isHash) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className="transition hover:text-brand-600 dark:hover:text-brand-350"
                    >
                      {item.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="transition hover:text-brand-600 dark:hover:text-brand-350"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-neutral-800 dark:text-gray-300 dark:hover:border-brand-600 dark:hover:text-brand-200"
                aria-label="Ngôn ngữ"
              >
                <Globe className="h-4 w-4" />
                VI
              </button>

              <button
                type="button"
                onClick={() => setDarkMode((value) => !value)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-neutral-800 dark:text-gray-300 dark:hover:border-brand-600 dark:hover:text-brand-200"
                aria-label={darkMode ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {token && user ? (
                <>
                <div ref={notificationRef} className="relative">
                  <button
                    type="button"
                    aria-label="Thông báo"
                    onClick={toggleNotifications}
                    className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
                      notificationsOpen
                        ? "border-brand-300 text-brand-700 dark:border-brand-600 dark:text-brand-200"
                        : "border-slate-200 text-slate-700 hover:border-brand-300 hover:text-brand-700 dark:border-neutral-800 dark:text-gray-300 dark:hover:border-brand-600 dark:hover:text-brand-200"
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    {notificationUnreadCount > 0 && (
                      <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
                        {notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen ? (
                    <div className="absolute right-0 mt-3 w-[22rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
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
                            className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 dark:border-neutral-800 dark:hover:bg-neutral-900/80 ${notification.isRead ? "bg-white dark:bg-neutral-950" : "bg-brand-50/60 dark:bg-brand-950/30"}`}
                          >
                            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-slate-200 dark:bg-neutral-700" : "bg-brand-600"}`} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{notification.title}</span>
                              <span className="mt-0.5 block text-sm leading-5 text-slate-600 dark:text-gray-300">{notification.body}</span>
                              <span className="mt-1 block text-xs text-slate-400 dark:text-gray-500">{formatNotificationTime(notification.createdAt)}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div ref={accountRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((value) => !value)}
                    className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-brand-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-gray-100 dark:hover:border-brand-600"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                        {initials}
                      </span>
                    )}
                    <span className="max-w-32 truncate">{user.fullName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {accountOpen ? (
                    <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
                      <div className="px-3 py-3">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {user.fullName}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                      <div className="h-px bg-slate-100 dark:bg-neutral-800" />
                      {accountLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setAccountOpen(false)}
                            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-brand-950/40 dark:hover:text-brand-200"
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        );
                      })}
                      <Link
                        to="/logout"
                        onClick={() => setAccountOpen(false)}
                        className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </Link>
                    </div>
                  ) : null}
                </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex h-11 items-center rounded-full bg-brand-600 px-5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
                >
                  Đăng nhập
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-800 lg:hidden dark:border-neutral-800 dark:text-gray-100"
              aria-label="Mở menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {menuOpen ? (
            <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg dark:border-neutral-900 dark:bg-black lg:hidden">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const isHash = item.href.includes("#");
                  if (isHash) {
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-brand-950/40 dark:hover:text-brand-200"
                      >
                        {item.label}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-brand-950/40 dark:hover:text-brand-200"
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDarkMode((value) => !value)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-bold text-slate-700 dark:border-neutral-800 dark:text-gray-200"
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {darkMode ? "Sáng" : "Tối"}
                </button>
                {token && user ? (
                  <Link
                    to={dashboardPath}
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white hover:bg-brand-700"
                  >
                    Khu vực của tôi
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white hover:bg-brand-700"
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>
            </div>
          ) : null}
        </nav>

        <main className="flex-grow">
          <Outlet />
        </main>

        <footer
          id="contact"
          className="border-t border-slate-100 bg-white py-12 text-slate-600 transition-colors duration-300 dark:border-neutral-900 dark:bg-black dark:text-gray-400"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
            <div className="md:col-span-1">
              <img
                src={darkMode ? logoDark : logoLight}
                alt="MoveVN"
                className="h-10 w-auto object-contain"
              />
              <p className="mt-4 text-sm leading-6">
                Nền tảng thuê xe giúp kết nối khách hàng và chủ xe minh bạch, nhanh gọn.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Dịch vụ
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link to="/vehicle?type=car" className="hover:text-brand-600 dark:hover:text-brand-300">
                  Thuê ô tô
                </Link>
                <Link to="/vehicle?type=motorbike" className="hover:text-brand-600 dark:hover:text-brand-300">
                  Thuê xe máy
                </Link>
                <Link to="/register-owner" className="hover:text-brand-600 dark:hover:text-brand-300">
                  Đăng ký chủ xe
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                MoveVN
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link to="/#process" className="hover:text-brand-600 dark:hover:text-brand-300">
                  Quy trình
                </Link>
                <Link to="/#vehicles" className="hover:text-brand-600 dark:hover:text-brand-300">
                  Xe nổi bật
                </Link>
                <Link to="/#contact" className="hover:text-brand-600 dark:hover:text-brand-300">
                  Liên hệ
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Hỗ trợ
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <a href="mailto:support@movevn.com" className="hover:text-brand-600 dark:hover:text-brand-300">
                  support@movevn.com
                </a>
                <a href="tel:19006868" className="hover:text-brand-600 dark:hover:text-brand-300">
                  1900 6868
                </a>
                <span>TP. Hồ Chí Minh, Việt Nam</span>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-10 w-full max-w-7xl px-4 text-sm text-slate-500 sm:px-6 lg:px-8">
            © 2026 MoveVN. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
