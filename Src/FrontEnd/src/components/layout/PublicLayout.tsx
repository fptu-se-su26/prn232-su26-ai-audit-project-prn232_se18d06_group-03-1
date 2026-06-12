import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <main>
        <Outlet />
      </main>
    </div>
  );
}
