import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { getCmsPageNavigation } from "@/features/cms/services/cmsService";
import type { CmsPageNavigationItem } from "@/features/cms/types";
import {
  CalendarDays,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserRound,
  X,
  Wallet,
  TicketPercent,
} from "lucide-react";
import NotificationMenu from "@/components/layout/NotificationMenu";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getDashboardPath } from "@/features/auth/utils/roleRedirect";
import useClickOutside from "@/hooks/useClickOutside";
import { usePresenceConnection } from "@/features/presence/usePresenceConnection";
import moveVnLogo from "../../../Logo/movevn_wordmark.svg";


export default function PublicLayout() {
  usePresenceConnection();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cmsNav, setCmsNav] = useState<CmsPageNavigationItem[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const navItems = [
    { href: "/", label: "Trang chủ" },
    { href: "/vehicle", label: "Thuê xe" },
    { href: "/how-it-works", label: "Cách hoạt động" },
    { href: "/for-owners", label: "Chủ xe" },
    { href: "/support", label: "Hỗ trợ" },
  ];

  useEffect(() => {
    getCmsPageNavigation().then(setCmsNav).catch(() => {});

    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const accountRef = useRef<HTMLDivElement>(null);
  const dashboardPath = getDashboardPath(user?.roles ?? []);
  const isSignedIn = Boolean(token && user);

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
      ? [{ to: "/booking/list", label: "Lịch sử thuê xe", icon: CalendarDays }]
      : []),
    ...(user?.roles.includes("Customer")
      ? [{ to: "/customer/voucher-wallet", label: "Ví voucher", icon: TicketPercent }]
      : []),
    ...(user?.roles.includes("Owner")
      ? [{ to: "/booking/manage", label: "Yêu cầu thuê", icon: CalendarDays }]
      : []),
    { to: "/account/wallet", label: "Ví của tôi", icon: Wallet },
    { to: "/account", label: "Hồ sơ tài khoản", icon: UserRound },
  ];

  useClickOutside(accountRef, () => setAccountOpen(false));

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex min-h-screen flex-col bg-white text-slate-900 transition-colors duration-300 dark:bg-surface-base dark:text-text-primary">
        <nav className={`sticky top-0 z-40 h-16 border-b transition-all duration-300 transform-gpu ${
          isScrolled
            ? "border-slate-200/80 bg-white/95 shadow-md backdrop-blur-xl dark:border-ui-border dark:bg-surface-base"
            : "border-slate-100 bg-white/90 backdrop-blur-md dark:border-ui-border dark:bg-surface-base"
        }`}>
          <div className="mx-auto flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-12 2xl:px-16">
            <Link to="/" className="flex shrink-0 items-center" aria-label="MoveVN">
              <img
                src={darkMode ? `${moveVnLogo}#dark` : moveVnLogo}
                alt="MoveVN"
                className="h-7 w-auto origin-left object-contain"
              />
            </Link>

            <div className="hidden translate-x-10 items-center gap-6 text-sm font-medium text-slate-700 dark:text-gray-300 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === "/"}
                  className={({ isActive }) =>
                    `relative rounded-md px-2.5 py-2 transition ${
                      isActive
                        ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-200"
                        : "hover:bg-slate-50 hover:text-brand-600 dark:hover:bg-white/5 dark:hover:text-brand-300"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="hidden items-center gap-2.5 lg:flex">
              <button
                type="button"
                onClick={() => setDarkMode((value) => !value)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-neutral-800 dark:text-gray-300 dark:hover:border-brand-600 dark:hover:text-brand-200"
                aria-label={darkMode ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {isSignedIn ? (
                <>
                  <NotificationMenu variant="public" />

                  <div ref={accountRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setAccountOpen((value) => !value)}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-brand-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-gray-100 dark:hover:border-brand-600"
                    >
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="h-7 w-7 rounded-md object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
                          {initials}
                        </span>
                      )}
                      <span className="max-w-32 truncate">{user?.fullName}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    {accountOpen ? (
                      <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
                        <div className="px-3 py-3">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {user?.fullName}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-gray-400">
                            {user?.email}
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
                  className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-500 px-4 text-sm font-bold text-white shadow-md shadow-brand-600/20 transition hover:from-brand-700 hover:via-brand-600 hover:to-fuchsia-600"
                >
                  Đăng nhập
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              {isSignedIn ? <NotificationMenu variant="public" /> : null}
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-800 dark:border-neutral-800 dark:text-gray-100"
                aria-label="Mở menu"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {menuOpen ? (
            <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg dark:border-neutral-800 dark:bg-surface-base lg:hidden">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === "/"}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }: { isActive: boolean }) =>
                      `rounded-md px-4 py-2.5 text-sm font-bold transition ${
                        isActive
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200"
                          : "text-slate-700 hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-brand-950/40 dark:hover:text-brand-200"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
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
                {isSignedIn ? (
                  <Link
                    to={dashboardPath}
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-500 text-sm font-bold text-white hover:from-brand-700 hover:via-brand-600 hover:to-fuchsia-600"
                  >
                    Khu vực của tôi
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-500 text-sm font-bold text-white hover:from-brand-700 hover:via-brand-600 hover:to-fuchsia-600"
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
          className="border-t border-slate-100 bg-white py-12 text-slate-600 transition-colors duration-300 dark:border-ui-border dark:bg-surface-subtle dark:text-text-secondary dark:shadow-[0_-16px_40px_rgba(0,0,0,0.18)]"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-3 lg:grid-cols-5 lg:px-8">
            <div>
              <img
                src={darkMode ? `${moveVnLogo}#dark` : moveVnLogo}
                alt="MoveVN"
                className="h-8 w-auto origin-left object-contain"
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
                <Link to="/for-owners" className="hover:text-brand-600 dark:hover:text-brand-300">
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
                Chính Sách
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                {cmsNav.map((item) => (
                  <Link key={item.slug} to={`/policies/${item.slug}`} className="hover:text-brand-600 dark:hover:text-brand-300">
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Hỗ trợ
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link to="/support" className="hover:text-brand-600 dark:hover:text-brand-300">
                  Trung tâm hỗ trợ
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


        </footer>
      </div>
    </div>
  );
}
