import { Outlet } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/features/auth/hooks/useAuth";

export default function PublicLayout() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (token && user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Header />
        <div className="flex">
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((prev) => !prev)} />
          <main className="min-h-[calc(100vh-3.5rem)] mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <main>
        <Outlet />
      </main>
    </div>
  );
}
