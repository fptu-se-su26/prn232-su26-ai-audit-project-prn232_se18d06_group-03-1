import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
  Home,
  Eye,
  Compass,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getMyBookings } from "@/features/booking/bookingService";
import type { BookingResponse } from "@/features/booking/types";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
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

  // Compute Statistics
  const stats = useMemo(() => {
    let totalSpend = 0;
    let pendingCount = 0;
    let activeCount = 0;
    let completedCount = 0;

    bookings.forEach((b) => {
      if (["Completed", "Confirmed", "InProgress", "Approved", "DepositPaid"].includes(b.status)) {
        totalSpend += b.totalAmount;
      }
      if (b.status === "Pending") pendingCount++;
      if (["Confirmed", "InProgress", "Approved", "DepositPaid"].includes(b.status)) activeCount++;
      if (b.status === "Completed") completedCount++;
    });

    return {
      totalSpend,
      pendingCount,
      activeCount,
      completedCount,
      totalTrips: bookings.length,
    };
  }, [bookings]);

  // Compute Spend by month for the line/bar chart (SVG)
  const monthlySpendData = useMemo(() => {
    const monthNames = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    const monthStats = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        monthIndex: d.getMonth(),
        label: monthNames[d.getMonth()],
        value: 0,
      };
    });

    bookings.forEach((b) => {
      if (["Completed", "Confirmed", "InProgress", "Approved", "DepositPaid"].includes(b.status)) {
        const bDate = new Date(b.startDate);
        const match = monthStats.find((m) => m.monthIndex === bDate.getMonth());
        if (match) {
          match.value += b.totalAmount;
        }
      }
    });

    return monthStats;
  }, [bookings]);

  // Max value for spend scaling
  const maxSpendVal = Math.max(...monthlySpendData.map((d) => d.value), 500000);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const recentTrips = bookings.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header section */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-neutral-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">Customer Dashboard</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Khu vực khách hàng</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
            Quản lý chuyến đi của bạn, lịch sử thuê xe và chi tiêu của tài khoản.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/">
            <Button variant="secondary" className="inline-flex items-center gap-2 border border-slate-200">
              <Home className="h-4 w-4" /> Về trang chủ chính
            </Button>
          </Link>
          <Link to="/vehicle">
            <Button variant="primary" className="inline-flex items-center gap-2">
              <Compass className="h-4 w-4" /> Đặt xe ngay
            </Button>
          </Link>
        </div>
      </section>

      {/* Metrics Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Doanh thu */}
        <Card className="p-5 flex items-center justify-between border border-slate-100 dark:border-neutral-850 hover:shadow-md transition">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Tổng chi tiêu</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalSpend)}</h3>
            <p className="text-xs text-brand-600 font-medium inline-flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> Chi phí dịch vụ tích lũy
            </p>
          </div>
          <div className="p-3 bg-brand-50 rounded-xl dark:bg-brand-950/45">
            <DollarSign className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          </div>
        </Card>

        {/* Số chuyến đi */}
        <Card className="p-5 flex items-center justify-between border border-slate-100 dark:border-neutral-850 hover:shadow-md transition">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Chuyến xe đã đặt</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalTrips} chuyến</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
              Đã hoàn thành {stats.completedCount} chuyến
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl dark:bg-blue-950/45">
            <CalendarCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>

        {/* Đang đi */}
        <Card className="p-5 flex items-center justify-between border border-slate-100 dark:border-neutral-850 hover:shadow-md transition">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Chuyến đang chạy</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeCount} chuyến</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
              Chuyến đi đang trong hành trình
            </p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl dark:bg-indigo-950/45">
            <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </Card>

        {/* Chờ duyệt */}
        <Card className="p-5 flex items-center justify-between border border-slate-100 dark:border-neutral-850 hover:shadow-md transition">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Yêu cầu chờ duyệt</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingCount} yêu cầu</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
              Chờ phản hồi từ chủ xe
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl dark:bg-amber-950/45">
            <CalendarCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        </Card>
      </div>

      {/* SVG Charts Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Chi tiêu qua các tháng */}
        <Card className="p-6 border border-slate-100 dark:border-neutral-850 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thống kê chi tiêu</h3>
            <span className="text-xs font-medium text-slate-400">6 tháng gần nhất</span>
          </div>

          <div className="h-64 w-full pt-4">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              {/* Grid lines */}
              <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" className="dark:stroke-neutral-800" />
              <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeDasharray="4 4" className="dark:stroke-neutral-800" />
              <line x1="40" y1="130" x2="480" y2="130" stroke="#f1f5f9" strokeDasharray="4 4" className="dark:stroke-neutral-800" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" className="dark:stroke-neutral-700" />

              {/* Chart Bars Mapping */}
              {(() => {
                const barWidth = 36;
                return monthlySpendData.map((d, index) => {
                  const x = 50 + index * 75;
                  const barHeight = (d.value / maxSpendVal) * 120;
                  const y = 170 - barHeight;

                  return (
                    <g key={index} className="group/bar">
                      {/* Interactive Bar */}
                      <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 2)} rx="4" fill="#4f46e5" className="transition hover:fill-brand-700 cursor-pointer" />
                      
                      {/* Tooltip */}
                      <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="text-[10px] font-bold fill-slate-700 dark:fill-gray-300 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                        {d.value > 0 ? (d.value / 1000).toFixed(0) + "k" : "0"}
                      </text>

                      {/* X-axis label */}
                      <text x={x + barWidth / 2} y="190" textAnchor="middle" className="text-[10px] font-medium fill-slate-500 dark:fill-gray-400">
                        {d.label}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          </div>
        </Card>

        {/* Tỷ lệ chuyến xe */}
        <Card className="p-6 border border-slate-100 dark:border-neutral-850 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tỉ lệ hoàn thành</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Hành trình chuyến đi của bạn</p>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            {bookings.length > 0 ? (
              <>
                <svg width="150" height="150" viewBox="0 0 36 36" className="w-36 h-36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3.5" className="dark:stroke-neutral-850" />
                  {(() => {
                    const total = bookings.length;
                    const completedPct = (stats.completedCount / total) * 100;
                    return (
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.5"
                        strokeDasharray={`${completedPct} ${100 - completedPct}`} strokeDashoffset="0"
                        transform="rotate(-90 18 18)"
                        strokeLinecap="round"
                      />
                    );
                  })()}
                  <text x="18" y="20.5" textAnchor="middle" className="text-[8px] font-extrabold fill-slate-800 dark:fill-white">
                    {Math.round((stats.completedCount / bookings.length) * 100)}%
                  </text>
                </svg>

                <div className="mt-6 space-y-2 w-full text-xs">
                  <div className="flex justify-between font-medium text-slate-600 dark:text-gray-300">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Đã hoàn thành</span>
                    <span>{stats.completedCount} chuyến</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-600 dark:text-gray-300">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-neutral-800" /> Khác (đang chạy, chờ duyệt)</span>
                    <span>{bookings.length - stats.completedCount} chuyến</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 py-10">Chưa có thông tin chuyến đi.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Trips */}
      <Card className="border border-slate-100 dark:border-neutral-850 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-neutral-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lịch sử đặt xe gần đây</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Theo dõi trạng thái các chuyến xe bạn đã đặt.</p>
          </div>
          <Link to="/customer/bookings" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition">
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentTrips.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Chưa có chuyến đi nào được đặt.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-neutral-900 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4">Mã Code</th>
                  <th className="px-5 py-4">Ngày thuê</th>
                  <th className="px-5 py-4">Ngày trả</th>
                  <th className="px-5 py-4">Tổng chi phí</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
                {recentTrips.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-900/50 transition">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-900 dark:text-white">{b.bookingCode}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-gray-400">
                      {new Date(b.startDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-gray-400">
                      {new Date(b.endDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{formatCurrency(b.totalAmount)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-block rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-xs font-semibold dark:bg-indigo-950/40 dark:text-indigo-300">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/customer/bookings/${b.id}`}>
                        <Button variant="ghost" size="sm" className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Chi tiết</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
