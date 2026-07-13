import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
  Plus,
  Eye,
  AlertTriangle,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getOwnerBookings } from "@/features/booking/bookingService";
import { getMyVehicles } from "@/features/vehicles/services/vehicleService";
import type { BookingResponse } from "@/features/booking/types";
import type { VehicleListItemResponse } from "@/features/vehicles/types";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export default function OwnerHomePage() {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [vehicles, setVehicles] = useState<VehicleListItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [bookingsRes, vehiclesRes] = await Promise.all([
          getOwnerBookings({ page: 1, pageSize: 100 }),
          getMyVehicles({ page: 1, pageSize: 100 }),
        ]);
        setBookings(bookingsRes.items ?? []);
        setVehicles(vehiclesRes.items ?? []);
      } catch (err) {
        console.error("Failed to load owner data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    void loadData();
  }, []);

  // Compute Statistics
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let pendingCount = 0;
    let activeCount = 0;
    let completedCount = 0;

    bookings.forEach((b) => {
      // Completed, Confirmed, InProgress can be counted towards total revenue
      if (["Completed", "Confirmed", "InProgress", "Approved", "DepositPaid"].includes(b.status)) {
        totalRevenue += b.totalAmount;
      }
      if (b.status === "Pending") pendingCount++;
      if (["Confirmed", "InProgress", "Approved", "DepositPaid"].includes(b.status)) activeCount++;
      if (b.status === "Completed") completedCount++;
    });

    return {
      totalRevenue,
      pendingCount,
      activeCount,
      completedCount,
      totalVehicles: vehicles.length,
      approvedVehicles: vehicles.filter((v) => v.status === "Approved").length,
    };
  }, [bookings, vehicles]);

  // Compute Revenue by month for the line chart (SVG)
  const monthlyRevenueData = useMemo(() => {
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

  // Max value for revenue scaling
  const maxRevenueVal = Math.max(...monthlyRevenueData.map((d) => d.value), 1000000);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Get recent 5 bookings
  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header section */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-neutral-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">Owner Dashboard</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Khu vực chủ xe</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
            Theo dõi hiệu suất kinh doanh, doanh thu và yêu cầu đặt xe của bạn.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/owner/vehicles/add">
            <Button variant="primary" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Thêm xe mới
            </Button>
          </Link>
        </div>
      </section>

      {/* Metrics Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Doanh thu */}
        <Card className="p-5 flex items-center justify-between border border-slate-100 dark:border-neutral-850 hover:shadow-md transition">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Doanh thu tạm tính</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</h3>
            <p className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> +12.4% tháng này
            </p>
          </div>
          <div className="p-3 bg-brand-50 rounded-xl dark:bg-brand-950/45">
            <DollarSign className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          </div>
        </Card>

        {/* Số lượng xe */}
        <Card className="p-5 flex items-center justify-between border border-slate-100 dark:border-neutral-850 hover:shadow-md transition">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Tổng số xe</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalVehicles} xe</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
              {stats.approvedVehicles} xe hoạt động
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl dark:bg-blue-950/45">
            <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>

        {/* Chuyến xe đang chạy */}
        <Card className="p-5 flex items-center justify-between border border-slate-100 dark:border-neutral-850 hover:shadow-md transition">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Đang hoạt động</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeCount} chuyến</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
              Đang thuê hoặc chờ nhận xe
            </p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl dark:bg-indigo-950/45">
            <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </Card>

        {/* Chờ phê duyệt */}
        <Card className="p-5 flex items-center justify-between border border-slate-100 dark:border-neutral-850 hover:shadow-md transition">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Yêu cầu chờ duyệt</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingCount} yêu cầu</h3>
            {stats.pendingCount > 0 ? (
              <p className="text-xs text-amber-600 font-medium inline-flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 animate-pulse" /> Cần xử lý ngay
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Không có yêu cầu chờ duyệt</p>
            )}
          </div>
          <div className="p-3 bg-amber-50 rounded-xl dark:bg-amber-950/45">
            <CalendarCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        </Card>
      </div>

      {/* SVG Charts Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Doanh thu qua các tháng */}
        <Card className="p-6 border border-slate-100 dark:border-neutral-850 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Xu hướng doanh thu</h3>
            <span className="text-xs font-medium text-slate-400">6 tháng gần nhất</span>
          </div>

          <div className="h-64 w-full pt-4">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" className="dark:stroke-neutral-800" />
              <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeDasharray="4 4" className="dark:stroke-neutral-800" />
              <line x1="40" y1="130" x2="480" y2="130" stroke="#f1f5f9" strokeDasharray="4 4" className="dark:stroke-neutral-800" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" className="dark:stroke-neutral-700" />

              {/* Chart Points Mapping */}
              {(() => {
                const points = monthlyRevenueData.map((d, index) => {
                  const x = 40 + index * 85;
                  const y = 170 - (d.value / maxRevenueVal) * 120;
                  return { x, y, label: d.label, val: d.value };
                });

                const pathD = points.reduce((acc, p, i) => {
                  return acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
                }, "");

                const areaD = points.reduce((acc, p, i) => {
                  return acc + (i === 0 ? `M ${p.x} 170 L ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
                }, "") + ` L ${points[points.length - 1].x} 170 Z`;

                return (
                  <>
                    {/* Area fill */}
                    <path d={areaD} fill="url(#revenueGrad)" />

                    {/* Line path */}
                    <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3" />

                    {/* Nodes and tooltip helpers */}
                    {points.map((p, idx) => (
                      <g key={idx} className="group/node">
                        <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#4f46e5" strokeWidth="3" className="cursor-pointer transition hover:r-7" />
                        <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[9px] font-bold fill-slate-700 dark:fill-gray-300 opacity-0 group-hover/node:opacity-100 transition-opacity">
                          {p.val > 0 ? (p.val / 1000000).toFixed(1) + "M" : "0"}
                        </text>
                        {/* X-axis labels */}
                        <text x={p.x} y="190" textAnchor="middle" className="text-[10px] font-medium fill-slate-500 dark:fill-gray-400">
                          {p.label}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </Card>

        {/* Tỷ lệ trạng thái booking */}
        <Card className="p-6 border border-slate-100 dark:border-neutral-850 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Trạng thái đặt xe</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Phân bố trạng thái yêu cầu thuê</p>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            {bookings.length > 0 ? (
              <>
                <svg width="150" height="150" viewBox="0 0 36 36" className="w-36 h-36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3.5" className="dark:stroke-neutral-850" />
                  {(() => {
                    const total = bookings.length;
                    const pendingPct = (stats.pendingCount / total) * 100;
                    const activePct = (stats.activeCount / total) * 100;
                    const completedPct = (stats.completedCount / total) * 100;
                    const othersPct = 100 - (pendingPct + activePct + completedPct);

                    let offset = 0;
                    const strokeDash = (pct: number) => `${pct} ${100 - pct}`;

                    return (
                      <>
                        {/* Completed segment (emerald) */}
                        {completedPct > 0 && (
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.5"
                            strokeDasharray={strokeDash(completedPct)} strokeDashoffset={offset}
                            transform="rotate(-90 18 18)"
                          />
                        )}
                        {/* Active segment (indigo) */}
                        {(() => {
                          if (completedPct > 0) offset -= completedPct;
                          return activePct > 0 ? (
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6366f1" strokeWidth="3.5"
                              strokeDasharray={strokeDash(activePct)} strokeDashoffset={offset}
                              transform="rotate(-90 18 18)"
                            />
                          ) : null;
                        })()}
                        {/* Pending segment (amber) */}
                        {(() => {
                          if (activePct > 0) offset -= activePct;
                          return stats.pendingCount > 0 ? (
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3.5"
                              strokeDasharray={strokeDash(pendingPct)} strokeDashoffset={offset}
                              transform="rotate(-90 18 18)"
                            />
                          ) : null;
                        })()}
                        {/* Rejected/Cancelled/Others segment (slate) */}
                        {(() => {
                          if (pendingPct > 0) offset -= pendingPct;
                          return othersPct > 0 ? (
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#94a3b8" strokeWidth="3.5"
                              strokeDasharray={strokeDash(othersPct)} strokeDashoffset={offset}
                              transform="rotate(-90 18 18)"
                            />
                          ) : null;
                        })()}
                      </>
                    );
                  })()}
                </svg>

                {/* Status legends */}
                <div className="grid grid-cols-2 gap-4 mt-6 w-full text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-gray-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span>Hoàn thành ({stats.completedCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-gray-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    <span>Hoạt động ({stats.activeCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-gray-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span>Chờ duyệt ({stats.pendingCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-gray-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                    <span>Khác ({bookings.length - stats.completedCount - stats.activeCount - stats.pendingCount})</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 py-10">Chưa có thông tin đặt xe.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Booking Requests */}
      <Card className="border border-slate-100 dark:border-neutral-850 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-neutral-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yêu cầu đặt xe gần đây</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Xử lý hoặc kiểm tra thông tin đặt xe mới nhất.</p>
          </div>
          <Link to="/owner/bookings" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition">
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Chưa có yêu cầu đặt xe nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-neutral-900 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4">Mã Code</th>
                  <th className="px-5 py-4">Ngày thuê</th>
                  <th className="px-5 py-4">Ngày trả</th>
                  <th className="px-5 py-4">Tổng tiền</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
                {recentBookings.map((b) => (
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
                      <span className="inline-block rounded-full bg-brand-50 text-brand-700 px-2.5 py-0.5 text-xs font-semibold dark:bg-brand-950/40 dark:text-brand-300">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/booking/${b.id}`}>
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
