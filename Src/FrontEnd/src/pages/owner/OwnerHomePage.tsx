import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Car,
  DollarSign,
  Eye,
  Plus,
  TrendingUp,
} from "lucide-react";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { getOwnerBookings } from "@/features/booking/bookingService";
import type { BookingResponse } from "@/features/booking/types";
import { getMyVehicles } from "@/features/vehicles/services/vehicleService";
import type { VehicleListItemResponse } from "@/features/vehicles/types";

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

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let pendingCount = 0;
    let activeCount = 0;
    let completedCount = 0;

    bookings.forEach((booking) => {
      if (["Completed", "Confirmed", "InProgress", "Approved", "DepositPaid"].includes(booking.status)) {
        totalRevenue += booking.totalAmount;
      }
      if (booking.status === "Pending") pendingCount++;
      if (["Confirmed", "InProgress", "Approved", "DepositPaid"].includes(booking.status)) activeCount++;
      if (booking.status === "Completed") completedCount++;
    });

    return {
      activeCount,
      approvedVehicles: vehicles.filter((vehicle) => vehicle.status === "Approved").length,
      completedCount,
      pendingCount,
      totalRevenue,
      totalVehicles: vehicles.length,
    };
  }, [bookings, vehicles]);

  const monthlyRevenueData = useMemo(() => {
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

  const maxRevenueValue = Math.max(...monthlyRevenueData.map((item) => item.value), 1000000);
  const recentBookings = bookings.slice(0, 5);

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
        eyebrow="Owner cockpit"
        title="Khu vực chủ xe"
        description="Theo dõi doanh thu, đội xe và yêu cầu thuê mới để bạn xử lý booking nhanh hơn mà không phải nhảy qua nhiều màn hình."
        actions={
          <Link to="/owner/vehicles/add">
            <Button variant="primary" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm xe mới
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Doanh thu tạm tính"
          tone="brand"
          value={formatCurrency(stats.totalRevenue)}
          description={
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Từ booking đã xác nhận
            </span>
          }
        />
        <StatCard
          icon={Car}
          label="Đội xe"
          tone="blue"
          value={`${stats.totalVehicles} xe`}
          description={`${stats.approvedVehicles} xe đang hoạt động`}
        />
        <StatCard
          icon={Activity}
          label="Đang vận hành"
          tone="emerald"
          value={`${stats.activeCount} chuyến`}
          description="Đang thuê hoặc chờ nhận xe"
        />
        <StatCard
          icon={CalendarCheck}
          label="Cần phản hồi"
          tone="amber"
          value={`${stats.pendingCount} yêu cầu`}
          description={
            stats.pendingCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Cần xử lý sớm
              </span>
            ) : (
              "Không có yêu cầu chờ duyệt"
            )
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <SectionPanel
          title="Xu hướng doanh thu"
          description="Doanh thu theo tháng từ các booking có giá trị giao dịch."
          action={<span className="text-xs font-semibold text-slate-500">6 tháng gần nhất</span>}
          contentClassName="pt-6"
        >
          <div className="h-72 w-full">
            <svg viewBox="0 0 520 220" className="h-full w-full" role="img" aria-label="Biểu đồ doanh thu theo tháng">
              <defs>
                <linearGradient id="ownerRevenueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="44" y1="36" x2="500" y2="36" stroke="#e2e8f0" strokeDasharray="5 5" />
              <line x1="44" y1="88" x2="500" y2="88" stroke="#e2e8f0" strokeDasharray="5 5" />
              <line x1="44" y1="140" x2="500" y2="140" stroke="#e2e8f0" strokeDasharray="5 5" />
              <line x1="44" y1="178" x2="500" y2="178" stroke="#cbd5e1" />
              {(() => {
                const points = monthlyRevenueData.map((item, index) => ({
                  label: item.label,
                  value: item.value,
                  x: 58 + index * 78,
                  y: 178 - (item.value / maxRevenueValue) * 126,
                }));
                const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
                const areaPath = `M ${points[0].x} 178 ${points.map((point) => `L ${point.x} ${point.y}`).join(" ")} L ${
                  points[points.length - 1].x
                } 178 Z`;

                return (
                  <>
                    <path d={areaPath} fill="url(#ownerRevenueArea)" />
                    <path d={linePath} fill="none" stroke="#6d28d9" strokeLinecap="round" strokeWidth="3" />
                    {points.map((point) => (
                      <g key={point.label}>
                        <circle cx={point.x} cy={point.y} r="5" fill="#ffffff" stroke="#6d28d9" strokeWidth="3" />
                        <text x={point.x} y={point.y - 12} textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">
                          {point.value > 0 ? `${(point.value / 1000000).toFixed(1)}M` : "0"}
                        </text>
                        <text x={point.x} y="202" textAnchor="middle" className="fill-slate-500 text-[11px] font-semibold">
                          {point.label}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </SectionPanel>

        <SectionPanel title="Phân bổ booking" description="Tỉ trọng các yêu cầu thuê theo trạng thái hiện tại.">
          <div className="grid min-h-[272px] content-center gap-3 text-sm">
            {[
              { label: "Hoàn thành", tone: "emerald" as const, value: stats.completedCount },
              { label: "Đang vận hành", tone: "blue" as const, value: stats.activeCount },
              { label: "Chờ duyệt", tone: "amber" as const, value: stats.pendingCount },
              {
                label: "Khác",
                tone: "slate" as const,
                value: bookings.length - stats.completedCount - stats.activeCount - stats.pendingCount,
              },
            ].map((item) => {
              const percent = bookings.length > 0 ? Math.round((item.value / bookings.length) * 100) : 0;

              return (
                <div key={item.label} className="rounded-md border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge tone={item.tone}>{item.label}</StatusBadge>
                    <span className="font-semibold text-slate-950">{item.value} chuyến</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-brand-700" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionPanel>
      </div>

      <SectionPanel
        title="Yêu cầu đặt xe gần đây"
        description="Mở chi tiết để phản hồi, xác nhận hoặc theo dõi tiến độ giao xe."
        action={
          <Link to="/owner/bookings" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
        contentClassName="p-0"
      >
        {recentBookings.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">Chưa có yêu cầu đặt xe nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Mã booking</th>
                  <th className="px-5 py-4">Ngày nhận</th>
                  <th className="px-5 py-4">Ngày trả</th>
                  <th className="px-5 py-4">Tổng tiền</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-950">{booking.bookingCode}</td>
                    <td className="px-5 py-4 text-slate-600">{new Date(booking.startDate).toLocaleDateString("vi-VN")}</td>
                    <td className="px-5 py-4 text-slate-600">{new Date(booking.endDate).toLocaleDateString("vi-VN")}</td>
                    <td className="px-5 py-4 font-semibold text-slate-950">{formatCurrency(booking.totalAmount)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={getBookingTone(booking.status)}>{booking.status}</StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/booking/${booking.id}`}>
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
