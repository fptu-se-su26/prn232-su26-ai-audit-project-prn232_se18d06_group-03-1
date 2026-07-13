import { ClipboardCheck, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "@/components/ui/Card";

export default function StaffHomePage() {
  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Staff</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Khu vực nhân viên</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Xử lý tác vụ vận hành và hỗ trợ người dùng MoveVN.</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-md">
          <ClipboardCheck className="h-6 w-6 text-brand-700" />
          <h2 className="mt-4 text-base font-bold text-slate-950">Tác vụ cần xử lý</h2>
          <p className="mt-2 text-sm text-slate-600">Các quy trình nghiệp vụ cho nhân viên sẽ được nối tại đây.</p>
        </Card>
        <Link to="/staff/support-tickets" className="block">
          <Card className="rounded-md transition hover:border-brand-200 hover:shadow-md">
            <Headphones className="h-6 w-6 text-brand-700" />
            <h2 className="mt-4 text-base font-bold text-slate-950">Hỗ trợ khách hàng</h2>
            <p className="mt-2 text-sm text-slate-600">Khu vực hỗ trợ và kiểm duyệt thông tin vận hành.</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
