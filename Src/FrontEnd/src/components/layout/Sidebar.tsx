import { Car, ClipboardList, Home, KeyRound, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getDashboardPath } from "@/features/auth/utils/roleRedirect";
import type { UserRole } from "@/features/auth/types";

const roleLabels: Record<UserRole, string> = {
  Admin: "Quản trị",
  Staff: "Nhân viên",
  Owner: "Chủ xe",
  Customer: "Khách hàng",
};

const roleIcons = {
  Admin: ShieldCheck,
  Staff: ClipboardList,
  Owner: Car,
  Customer: Home,
};

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const primaryRole = user?.roles[0] ?? "Customer";
  const RoleIcon = roleIcons[primaryRole] ?? Home;
  const navItems = [
    { to: getDashboardPath(user?.roles ?? []), label: roleLabels[primaryRole] ?? "Khu vực của tôi", icon: RoleIcon },
    { to: "/account", label: "Tài khoản", icon: UserRound },
    { to: "/change-password", label: "Đổi mật khẩu", icon: KeyRound },
  ];

  if (primaryRole === "Admin") {
    navItems.splice(1, 0, { to: "/admin/users", label: "Người dùng", icon: UsersRound });
  }

  return (
    <aside className="hidden min-h-[calc(100vh-3.5rem)] w-64 border-r border-slate-200 bg-white p-4 md:block">
      <nav className="grid gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "inline-flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors",
                  isActive ? "bg-brand-700 text-white shadow-sm" : "text-slate-700 hover:bg-brand-50 hover:text-brand-800",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
