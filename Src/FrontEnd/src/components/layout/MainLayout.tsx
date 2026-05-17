import { Outlet } from "react-router-dom";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Header />
      <div className="mx-auto flex max-w-6xl">
        <Sidebar />
        <main className="min-h-[calc(100vh-7rem)] flex-1 px-4 py-8">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
