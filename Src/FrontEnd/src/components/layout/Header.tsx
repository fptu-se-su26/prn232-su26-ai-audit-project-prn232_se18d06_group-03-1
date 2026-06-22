import { LogOut, Menu, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import { APP_NAME } from "@/constants/appConstants";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import logoUrl from "../../../Logo/movevn_horizontal_light.png";

export default function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img alt={APP_NAME} className="h-[4.5rem] w-auto" src={logoUrl} />
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
            <UserRound className="h-4 w-4" />
            <span className="max-w-40 truncate">{user?.fullName ?? "Tài khoản"}</span>
          </div>
          <Link to="/logout">
            <Button type="button" variant="ghost" className="gap-2">
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </Link>
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
