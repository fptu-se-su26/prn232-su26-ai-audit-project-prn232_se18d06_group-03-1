import { ShieldCheck, UsersRound } from "lucide-react";
import Card from "@/components/ui/Card";

export default function AdminHomePage() {
  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Khu vực quản trị</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Các trang quản trị hệ thống sẽ được phát triển trong khu vực này.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-md">
          <ShieldCheck className="h-6 w-6 text-brand-700" />
          <h2 className="mt-4 text-base font-bold text-slate-950">Quản lý hệ thống</h2>
          <p className="mt-2 text-sm text-slate-600">Theo dõi cấu hình, phân quyền và dữ liệu vận hành.</p>
        </Card>
        <Card className="rounded-md">
          <UsersRound className="h-6 w-6 text-brand-700" />
          <h2 className="mt-4 text-base font-bold text-slate-950">Người dùng</h2>
          <p className="mt-2 text-sm text-slate-600">Module quản lý người dùng sẽ nằm trong nhóm trang Admin.</p>
        </Card>
      </div>
    </div>
  );
}
