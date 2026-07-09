import { Link, Outlet } from "react-router-dom";
import {
  CalendarDays,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getDashboardPath } from "@/features/auth/utils/roleRedirect";
import useClickOutside from "@/hooks/useClickOutside";
import logoDark from "../../../Logo/movevn_horizontal_dark.png";
import logoLight from "../../../Logo/movevn_horizontal_light.png";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/vehicle", label: "Thuê xe" },
  { href: "/how-it-works", label: "Cách hoạt động" },
  { href: "/for-owners", label: "Chủ xe" },
  { href: "/support", label: "Hỗ trợ" },
];

export default function PublicLayout() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const dashboardPath = getDashboardPath(user?.roles ?? []);

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
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="transition hover:text-brand-600 dark:hover:text-brand-300"
                >
                  {item.label}
                </Link>
              ))}
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
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-brand-950/40 dark:hover:text-brand-200"
                  >
                    {item.label}
                  </Link>
                ))}
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
                <Link to="/about" className="hover:text-brand-600 dark:hover:text-brand-300">
                  Giới thiệu
                </Link>
                <Link to="/how-it-works" className="hover:text-brand-600 dark:hover:text-brand-300">
                  Cách hoạt động
                </Link>
                <Link to="/for-owners" className="hover:text-brand-600 dark:hover:text-brand-300">
                  Dành cho chủ xe
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Ho tro
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link to="/support" className="hover:text-brand-600 dark:hover:text-brand-300">
                  Trung tâm hỗ trợ
                </Link>
                <Link to="/terms" className="hover:text-brand-600 dark:hover:text-brand-300">
                  Điều khoản sử dụng
                </Link>
                <Link to="/privacy" className="hover:text-brand-600 dark:hover:text-brand-300">
                  Chính sách bảo mật
                </Link>
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
