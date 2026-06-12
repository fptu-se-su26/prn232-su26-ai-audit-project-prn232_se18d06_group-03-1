import { CalendarCheck, CarFront } from "lucide-react";
import Card from "@/components/ui/Card";

export default function CustomerHomePage() {
  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Customer</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Khu vực khách hàng</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Quản lý chuyến đi, đặt xe và thông tin cá nhân.</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-md">
          <CarFront className="h-6 w-6 text-brand-700" />
          <h2 className="mt-4 text-base font-bold text-slate-950">Tìm và đặt xe</h2>
          <p className="mt-2 text-sm text-slate-600">Nội dung đặt xe của khách hàng sẽ được đặt tại đây.</p>
        </Card>
        <Card className="rounded-md">
          <CalendarCheck className="h-6 w-6 text-brand-700" />
          <h2 className="mt-4 text-base font-bold text-slate-950">Lịch sử thuê xe</h2>
          <p className="mt-2 text-sm text-slate-600">Theo dõi các chuyến đi và trạng thái đặt xe.</p>
        </Card>
      </div>
    </div>
  );
}
