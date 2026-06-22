import { ChevronDown, LogOut, Menu, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { APP_NAME } from "@/constants/appConstants";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import useClickOutside from "@/hooks/useClickOutside";
import logoUrl from "../../../Logo/movevn_horizontal_light.png";

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setOpen(false));

  const initials = user?.fullName
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase() ?? "U";

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
              className="hidden items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 sm:flex"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="max-w-32 truncate">{user?.fullName ?? "Tài khoản"}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                <Link
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <UserRound className="h-4 w-4" />
                  Hồ sơ
                </Link>
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
