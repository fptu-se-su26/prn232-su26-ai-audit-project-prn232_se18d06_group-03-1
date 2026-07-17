import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  Compass,
  DollarSign,
  Eye,
  Home,
  TrendingUp,
} from "lucide-react";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { getMyBookings } from "@/features/booking/bookingService";
import type { BookingResponse } from "@/features/booking/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function getBookingTone(status: string) {
  if (status === "Completed") return "emerald" as const;
  if (["Confirmed", "InProgress", "Approved", "DepositPaid"].includes(status)) return "blue" as const;
  if (status === "Pending") return "amber" as const;
  if (["Rejected", "Cancelled"].includes(status)) return "rose" as const;
  return "slate" as const;
}

export default function CustomerHomePage() {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const bookingsRes = await getMyBookings({ page: 1, pageSize: 100 });
        setBookings(bookingsRes.items ?? []);
      } catch (err) {
        console.error("Failed to load customer bookings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  const stats = useMemo(() => {
    let totalSpend = 0;
    let pendingCount = 0;
    let activeCount = 0;
    let completedCount = 0;

    bookings.forEach((booking) => {
      if (["Completed", "Confirmed", "InProgress", "Approved", "DepositPaid"].includes(booking.status)) {
        totalSpend += booking.totalAmount;
      }
      if (booking.status === "Pending") pendingCount++;
      if (["Confirmed", "InProgress", "Approved", "DepositPaid"].includes(booking.status)) activeCount++;
      if (booking.status === "Completed") completedCount++;
    });

    return {
      activeCount,
      completedCount,
      pendingCount,
      totalSpend,
      totalTrips: bookings.length,
    };
  }, [bookings]);

  const monthlySpendData = useMemo(() => {
    const monthNames = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    const monthStats = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        label: monthNames[date.getMonth()],
        monthIndex: date.getMonth(),
        value: 0,
      };
    });

    bookings.forEach((booking) => {
      if (["Completed", "Confirmed", "InProgress", "Approved", "DepositPaid"].includes(booking.status)) {
        const bookingDate = new Date(booking.startDate);
        const match = monthStats.find((month) => month.monthIndex === bookingDate.getMonth());
        if (match) match.value += booking.totalAmount;
      }
    });

    return monthStats;
  }, [bookings]);

  const maxSpendValue = Math.max(...monthlySpendData.map((item) => item.value), 500000);
  const completionRate = bookings.length > 0 ? Math.round((stats.completedCount / bookings.length) * 100) : 0;
  const recentTrips = bookings.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <DashboardHeader
        eyebrow="Customer cockpit"
        title="Khu vực khách hàng"
        description="Theo dõi lịch thuê, chi phí và trạng thái từng chuyến xe trong một màn hình gọn để bạn luôn biết chuyến đi tiếp theo đang ở đâu."
        actions={
          <>
            <Link to="/">
              <Button variant="secondary" className="inline-flex items-center gap-2">
                <Home className="h-4 w-4" />
                Về trang chủ
              </Button>
            </Link>
            <Link to="/vehicle">
              <Button variant="primary" className="inline-flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Tìm xe
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Tổng chi tiêu"
          tone="brand"
          value={formatCurrency(stats.totalSpend)}
          description={
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Chi phí dịch vụ đã ghi nhận
            </span>
          }
        />
        <StatCard
          icon={CalendarCheck}
          label="Chuyến đã đặt"
          tone="blue"
          value={`${stats.totalTrips} chuyến`}
          description={`Đã hoàn thành ${stats.completedCount} chuyến`}
        />
        <StatCard
          icon={Activity}
          label="Đang hoạt động"
          tone="emerald"
          value={`${stats.activeCount} chuyến`}
          description="Đã xác nhận, đã cọc hoặc đang chạy"
        />
        <StatCard
          icon={CalendarCheck}
          label="Chờ phản hồi"
          tone="amber"
          value={`${stats.pendingCount} yêu cầu`}
          description="Đang chờ chủ xe xác nhận"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <SectionPanel
          title="Dòng chi tiêu"
          description="Tổng chi phí theo tháng, tính trên các booking đã có giá trị giao dịch."
          action={<span className="text-xs font-semibold text-slate-500">6 tháng gần nhất</span>}
          contentClassName="pt-6"
        >
          <div className="h-72 w-full">
            <svg viewBox="0 0 520 220" className="h-full w-full" role="img" aria-label="Biểu đồ chi tiêu theo tháng">
              <line x1="44" y1="36" x2="500" y2="36" stroke="#e2e8f0" strokeDasharray="5 5" />
              <line x1="44" y1="88" x2="500" y2="88" stroke="#e2e8f0" strokeDasharray="5 5" />
              <line x1="44" y1="140" x2="500" y2="140" stroke="#e2e8f0" strokeDasharray="5 5" />
              <line x1="44" y1="178" x2="500" y2="178" stroke="#cbd5e1" />
              {monthlySpendData.map((item, index) => {
                const barWidth = 38;
                const x = 58 + index * 76;
                const barHeight = Math.max((item.value / maxSpendValue) * 126, 4);
                const y = 178 - barHeight;

                return (
                  <g key={item.label}>
                    <rect x={x} y={y} width={barWidth} height={barHeight} rx="6" fill="#6d28d9" />
                    <text x={x + barWidth / 2} y={y - 9} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">
                      {item.value > 0 ? `${Math.round(item.value / 1000)}k` : "0"}
                    </text>
                    <text x={x + barWidth / 2} y="202" textAnchor="middle" className="fill-slate-500 text-[11px] font-semibold">
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </SectionPanel>

        <SectionPanel title="Tỉ lệ hoàn thành" description="Tình trạng hoàn tất các chuyến xe của bạn.">
          <div className="flex min-h-[272px] flex-col items-center justify-center">
            {bookings.length > 0 ? (
              <>
                <div className="relative grid h-40 w-40 place-items-center rounded-full bg-slate-50 ring-1 ring-slate-100">
                  <svg width="150" height="150" viewBox="0 0 36 36" className="absolute inset-1/2 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3.8" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#059669"
                      strokeDasharray={`${completionRate} ${100 - completionRate}`}
                      strokeLinecap="round"
                      strokeWidth="3.8"
                      transform="rotate(-90 18 18)"
                    />
                  </svg>
                  <div className="text-center">
                    <p className="text-3xl font-semibold tracking-tight text-slate-950">{completionRate}%</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Hoàn tất</p>
                  </div>
                </div>
                <div className="mt-5 grid w-full gap-2 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Đã hoàn thành</span>
                    <span className="font-semibold text-slate-950">{stats.completedCount} chuyến</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Còn lại</span>
                    <span className="font-semibold text-slate-950">{bookings.length - stats.completedCount} chuyến</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Chưa có dữ liệu chuyến đi.</p>
            )}
          </div>
        </SectionPanel>
      </div>

      <SectionPanel
        title="Lịch sử đặt xe gần đây"
        description="Theo dõi nhanh những booking mới nhất và mở chi tiết khi cần xử lý."
        action={
          <Link to="/customer/bookings" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
        contentClassName="p-0"
      >
        {recentTrips.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">Chưa có chuyến đi nào được đặt.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Mã booking</th>
                  <th className="px-5 py-4">Ngày nhận</th>
                  <th className="px-5 py-4">Ngày trả</th>
                  <th className="px-5 py-4">Tổng chi phí</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTrips.map((booking) => (
                  <tr key={booking.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-950">{booking.bookingCode}</td>
                    <td className="px-5 py-4 text-slate-600">{new Date(booking.startDate).toLocaleDateString("vi-VN")}</td>
                    <td className="px-5 py-4 text-slate-600">{new Date(booking.endDate).toLocaleDateString("vi-VN")}</td>
                    <td className="px-5 py-4 font-semibold text-slate-950">{formatCurrency(booking.totalAmount)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={getBookingTone(booking.status)}>{booking.status}</StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/customer/bookings/${booking.id}`}>
                        <Button variant="ghost" size="sm" className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          Chi tiết
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
