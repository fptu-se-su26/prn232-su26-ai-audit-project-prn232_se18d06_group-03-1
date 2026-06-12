import { Car, ClipboardList } from "lucide-react";
import Card from "@/components/ui/Card";

export default function OwnerHomePage() {
  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Owner</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Khu vực chủ xe</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Quản lý xe, lịch thuê và hồ sơ kinh doanh.</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-md">
          <Car className="h-6 w-6 text-brand-700" />
          <h2 className="mt-4 text-base font-bold text-slate-950">Xe của tôi</h2>
          <p className="mt-2 text-sm text-slate-600">Danh sách và trạng thái xe của chủ xe sẽ nằm ở đây.</p>
        </Card>
        <Card className="rounded-md">
          <ClipboardList className="h-6 w-6 text-brand-700" />
          <h2 className="mt-4 text-base font-bold text-slate-950">Yêu cầu thuê</h2>
          <p className="mt-2 text-sm text-slate-600">Theo dõi yêu cầu thuê xe và xử lý lịch giao nhận.</p>
        </Card>
      </div>
    </div>
  );
}
