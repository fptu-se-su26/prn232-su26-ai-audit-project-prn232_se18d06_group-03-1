import { Link } from "react-router-dom";
import { CarFront, ShieldCheck, UserRound, Search } from "lucide-react";
import Button from "@/components/common/Button";
import Card from "@/components/ui/Card";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getDashboardPath } from "@/features/auth/utils/roleRedirect";
import logoUrl from "../../../Logo/movevn_horizontal_light.png";

export default function HomePage() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f7f0ff,transparent_34%),#f8fafc] px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-10">
        <header className="flex items-center justify-between gap-4">
          <img alt="MoveVN" className="h-11 w-auto" src={logoUrl} />
          <div className="flex gap-2">
            {token ? (
              <Link to={getDashboardPath(user?.roles ?? [])}>
                <Button type="button">Vào khu vực của tôi</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button type="button" variant="secondary">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register" className="hidden sm:inline-flex">
                  <Button type="button">Đăng ký</Button>
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="grid gap-4 py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">MoveVN</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950">
            Di chuyển thông minh, trải nghiệm trọn vẹn.
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            Đăng nhập để vào đúng khu vực làm việc theo vai trò của bạn trong hệ thống MoveVN.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Đăng nhập an toàn", text: "Token và phiên đăng nhập được xử lý theo API backend." },
            { icon: UserRound, title: "Phân quyền rõ ràng", text: "Mỗi role đi vào đúng khu vực riêng sau khi đăng nhập." },
            { icon: CarFront, title: "Sẵn sàng mở rộng", text: "Các module xe, đặt thuê và vận hành có thể đặt đúng nhóm page." },
          ].map((item) => (
            <Card key={item.title} className="rounded-md">
              <item.icon className="h-6 w-6 text-brand-700" />
              <h2 className="mt-4 text-base font-bold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.text}</p>
            </Card>
          ))}
        </div>

        <section className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100">
              <Search className="h-7 w-7 text-brand-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-950">Tìm xe cho thuê</h2>
              <p className="mt-1 text-slate-600">Duyệt qua hàng ngàn xe ô tô và xe máy sẵn sàng cho thuê trên toàn quốc.</p>
            </div>
            <Link to="/xe">
              <Button type="button" size="lg">Xem danh sách xe</Button>
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-brand-100 bg-brand-50 p-8 text-center">
          <h2 className="text-xl font-bold text-slate-950">Bạn muốn cho thuê xe?</h2>
          <p className="mt-2 text-slate-600">Đăng ký làm chủ xe ngay để bắt đầu đăng tải xe cho thuê trên MoveVN.</p>
          <Link to="/register-owner" className="mt-4 inline-block">
            <Button type="button" size="lg">Đăng ký làm chủ xe</Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
