import { LogOut } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import Button from "@/components/common/Button";
import { APP_NAME } from "@/constants/appConstants";
import { useAuthStore } from "@/features/auth/hooks/useAuth";

function TopLink(props: { to: string; label: string }) {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        [
          "rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
        ].join(" ")
      }
    >
      {props.label}
    </NavLink>
  );
}

export default function Header() {
  const token = useAuthStore((state) => state.token);
  const clearToken = useAuthStore((state) => state.clearToken);

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-zinc-900 text-sm font-semibold text-white">
            CC
          </div>
          <div className="text-sm font-semibold">{APP_NAME}</div>
        </Link>

        <nav className="flex items-center gap-1">
          <TopLink to="/" label="Home" />
          <TopLink to="/login" label={token ? "Token" : "Login"} />
          <TopLink to="/register" label="Register" />
        </nav>

        <div className="flex items-center gap-1">
          {token ? (
            <Button type="button" onClick={clearToken} variant="ghost" className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
