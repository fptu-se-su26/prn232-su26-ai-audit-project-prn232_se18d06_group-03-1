import { ArrowLeftFromLine, BadgeCheck, Car, ChevronLeft, ChevronRight, ClipboardList, Home, KeyRound, Landmark, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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

const ownerVerificationItems = [
  { to: "/become-owner/cccd", label: "Xác thực CCCD", icon: BadgeCheck },
  { to: "/become-owner/bank", label: "Thông tin ngân hàng", icon: Landmark },
];

function NavItem({ to, label, icon: Icon, collapsed }: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex h-10 items-center rounded-md text-sm font-medium transition-colors",
          collapsed ? "justify-center" : "gap-3 px-3",
          isActive ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-brand-50 hover:text-brand-700",
        ].join(" ")
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && label}
    </NavLink>
  );
}

function SectionHeading({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  return collapsed ? null : <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</span>;
}

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const primaryRole = user?.roles[0] ?? "Customer";
  const RoleIcon = roleIcons[primaryRole] ?? Home;
  const isProfileSection = location.pathname === "/account" || location.pathname === "/change-password";

  const mainItems = [
    { to: getDashboardPath(user?.roles ?? []), label: roleLabels[primaryRole] ?? "Khu vực của tôi", icon: RoleIcon },
  ];

  if (primaryRole === "Admin") {
    mainItems.push({ to: "/admin/users", label: "Người dùng", icon: UsersRound });
  }

  const profileItems = [
    { to: "/account", label: "Tài khoản", icon: UserRound },
    { to: "/change-password", label: "Đổi mật khẩu", icon: KeyRound },
  ];

  const showOwnerVerification = user?.roles.some((r) => r === "Customer" || r === "Owner") ?? false;
  const isBecomeOwnerPage = location.pathname.startsWith("/become-owner");
  const isOwnerVerificationSection = isProfileSection || isBecomeOwnerPage;

  let items = isOwnerVerificationSection ? profileItems : mainItems;
  if (isOwnerVerificationSection && showOwnerVerification) {
    items = [...items, ...ownerVerificationItems];
  }
  const backItem = isOwnerVerificationSection
    ? { to: getDashboardPath(user?.roles ?? []), label: roleLabels[primaryRole] ?? "Khu vực của tôi", icon: ArrowLeftFromLine }
    : null;

  return (
    <aside
      className={`hidden min-h-[calc(100vh-3.5rem)] border-r border-slate-200 bg-white transition-all duration-200 md:flex md:flex-col ${collapsed ? "w-16" : "w-56"}`}
    >
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <div className="flex-1 space-y-1">
          {isOwnerVerificationSection && (
            <>
              <NavItem collapsed={collapsed} to={backItem!.to} label={backItem!.label} icon={backItem!.icon} />
              {!collapsed && <span className="my-1 block border-t border-slate-100" />}
              {!collapsed && <SectionHeading collapsed={collapsed}>Hồ sơ</SectionHeading>}
            </>
          )}

          {items.map((item) => (
            <NavItem key={item.to} collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
          ))}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-full items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </nav>
    </aside>
  );
}
