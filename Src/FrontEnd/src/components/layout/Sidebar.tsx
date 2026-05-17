import { Home, LayoutDashboard } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
];

export default function Sidebar() {
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
