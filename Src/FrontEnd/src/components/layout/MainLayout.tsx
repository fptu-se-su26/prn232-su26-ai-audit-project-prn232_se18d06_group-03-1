import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { usePresenceConnection } from "@/features/presence/usePresenceConnection";

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  usePresenceConnection();

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="dashboard-shell min-h-screen bg-slate-100/70 text-slate-950 transition-colors duration-300 dark:bg-[#0d0b14] dark:text-gray-100">
        <Header darkMode={darkMode} onToggleTheme={() => setDarkMode((current) => !current)} />
        <div className="flex">
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((prev) => !prev)} />
          <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
