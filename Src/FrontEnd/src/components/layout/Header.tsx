import { ArrowLeftRight, ChevronDown, LogOut, Menu, Moon, Sun, UserRound, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_NAME } from "@/constants/appConstants";
import type { UserRole } from "@/features/auth/types";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getDashboardPath } from "@/features/auth/utils/roleRedirect";
import { usePresenceStore } from "@/features/presence/usePresence";
import useClickOutside from "@/hooks/useClickOutside";
import NotificationMenu from "@/components/layout/NotificationMenu";
import { getMyWallet } from "@/features/wallets/services/walletService";
import moveVnLogo from "../../../Logo/movevn_wordmark.svg";

const roleSwitchLabels: Record<UserRole, string> = {
  Admin: "Quản trị",
  Staff: "Nhân viên",
  Owner: "Chủ xe",
  Customer: "Khách hàng",
};

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export default function Header({ darkMode, onToggleTheme }: HeaderProps) {
  const user = useAuthStore((state) => state.user);
  const activeRole = useAuthStore((state) => state.activeRole);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const selfOnline = usePresenceStore((state) => state.selfOnline);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useClickOutside(dropdownRef, () => setOpen(false));

  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    getMyWallet()
      .then((w) => setWalletBalance(w.balance))
      .catch(() => {}); // Silently ignore — wallet might not exist yet
  }, [user]);

  const initials = user?.fullName
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase() ?? "U";

  const otherRole = user?.roles.find((role) => role !== activeRole) ?? null;

  function handleSwitchRole() {
    if (!otherRole) return;
    setActiveRole(otherRole);
    setOpen(false);
    navigate(getDashboardPath([otherRole]));
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 shadow-sm shadow-slate-950/5 backdrop-blur transition-colors duration-300 dark:border-ui-border dark:bg-surface-subtle dark:shadow-sm">
      <div className="flex h-16 items-center">
        <div className="flex w-60 shrink-0 items-center px-4">
          <Link to="/" className="flex items-center">
            <img
              alt={APP_NAME}
              className="h-7 w-auto origin-left object-contain"
              src={darkMode ? `${moveVnLogo}#dark` : moveVnLogo}
            />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 px-4 sm:px-6">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={darkMode ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            title={darkMode ? "Giao diện sáng" : "Giao diện tối"}
            className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-ui-border dark:text-gray-300 dark:hover:border-brand-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className={`hidden h-10 items-center gap-2 rounded-md border px-2.5 text-sm transition-colors sm:flex ${
                open
                  ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200"
                  : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950 dark:text-gray-300 dark:hover:border-ui-border dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              <span className="relative inline-flex shrink-0">
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-brand-700 text-xs font-semibold text-white">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </span>
                {selfOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-surface-base" />
                )}
              </span>
              <span className="max-w-32 truncate">{user?.fullName ?? "Tài khoản"}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-xl shadow-slate-950/10 dark:border-ui-border dark:bg-surface-card dark:shadow-black/30">
                <Link
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-brand-950/40 dark:hover:text-brand-200"
                >
                  <UserRound className="h-4 w-4" />
                  Hồ sơ
                </Link>

                {otherRole && (
                  <button
                    type="button"
                    onClick={handleSwitchRole}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-brand-950/40 dark:hover:text-brand-200"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    Chuyển đến {roleSwitchLabels[otherRole]?.toLowerCase() ?? otherRole}
                  </button>
                )}

                <span className="my-1 block border-t border-slate-100 dark:border-ui-border" />
                <Link
                  to="/logout"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </Link>
              </div>
            )}
          </div>

          {walletBalance !== null && (
            <Link
              to="/account/wallet"
              className="hidden items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 dark:border-ui-border dark:bg-surface-card dark:text-emerald-400 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 sm:inline-flex"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>{new Intl.NumberFormat("vi-VN").format(walletBalance)}đ</span>
            </Link>
          )}
          <NotificationMenu variant="dashboard" />

          <button
            type="button"
            aria-label="Mở menu"
            className="grid h-10 w-10 place-items-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/10 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
