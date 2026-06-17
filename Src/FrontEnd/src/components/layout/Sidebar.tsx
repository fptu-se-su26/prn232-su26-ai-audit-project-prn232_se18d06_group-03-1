import { CarFront, ClipboardCheck, FileWarning, Home, LayoutDashboard, ShieldCheck, Ticket } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/features/auth/hooks/useAuth";

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("Admin");
  const isStaff = roles.includes("Staff") || isAdmin;

  const navItems = [
    { to: "/", label: "Home", icon: Home, visible: true },
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, visible: isAdmin },
    { to: "/staff", label: "Staff Queue", icon: ClipboardCheck, visible: isStaff },
    { to: "/staff/vehicles", label: "Vehicle Queue", icon: CarFront, visible: isStaff },
    { to: "/staff/verifications", label: "Verify Queue", icon: ShieldCheck, visible: isStaff },
    { to: "/staff/tickets", label: "Support Tickets", icon: Ticket, visible: isStaff },
    { to: "/staff/disputes", label: "Disputes", icon: FileWarning, visible: isStaff },
  ].filter((item) => item.visible);

  return (
    <aside className="hidden w-60 border-r border-zinc-200 bg-white p-4 md:block">
      <nav className="grid gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                  isActive ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100",
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
