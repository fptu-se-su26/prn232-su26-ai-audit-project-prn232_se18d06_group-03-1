import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  Bell,
  CarFront,
  CheckSquare,
  Clock,
  LifeBuoy,
  Percent,
  RefreshCw,
  Settings,
  ShieldAlert,
  TrendingUp,
  UsersRound,
  Wallet,
} from "lucide-react";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { showToast } from "@/components/common/toastStore";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { getDashboardStats, type DashboardStats } from "@/features/admin/services/adminDashboardService";

const statusLabels: Record<string, string> = {
  Approved: "Đã duyệt",
  Cancelled: "Đã hủy",
  Completed: "Hoàn thành",
  Confirmed: "Đã xác nhận",
  DepositPaid: "Đã đặt cọc",
  InProgress: "Đang chạy",
  Pending: "Chờ duyệt",
  Rejected: "Đã từ chối",
};

function getStatusTone(status: string) {
  if (status === "Completed") return "emerald" as const;
  if (["Approved", "Confirmed", "DepositPaid", "InProgress"].includes(status)) return "blue" as const;
  if (status === "Pending") return "amber" as const;
  if (["Rejected", "Cancelled"].includes(status)) return "rose" as const;
  return "slate" as const;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { currency: "VND", maximumFractionDigits: 0, style: "currency" }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function TrendBars({
  items,
  maxValue,
  valueKey,
}: {
  items: Array<Record<string, number | string>>;
  maxValue: number;
  valueKey: string;
}) {
  return (
    <div className="flex h-40 items-end gap-2">
      {items.map((item) => {
        const value = Number(item[valueKey] ?? 0);
        const height = maxValue === 0 ? 4 : Math.max(4, Math.round((value / maxValue) * 100));
        const label = String(item.date ?? item.month ?? "");

        return (
          <div key={label} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-28 w-full items-end rounded-md bg-slate-50 px-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-brand-700 via-violet-500 to-fuchsia-400 shadow-sm shadow-brand-900/10 transition group-hover:from-brand-800"
                style={{ height: `${height}%` }}
                title={`${label}: ${formatNumber(value)}`}
              />
            </div>
            <span className="max-w-full truncate text-[11px] font-medium text-slate-500">
              {label.includes("-") ? formatShortDate(label) : label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadStats(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch {
      showToast({ type: "error", title: "Không thể tải dashboard", message: "Vui lòng kiểm tra backend hoặc thử làm mới lại." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadStats();
  }, []);

  const maxBookingTrend = useMemo(
    () => Math.max(0, ...(stats?.bookingTrend.map((item) => item.count) ?? [])),
    [stats],
  );

  const maxRevenueTrend = useMemo(
    () => Math.max(0, ...(stats?.revenueTrend.map((item) => item.revenue) ?? [])),
    [stats],
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
      <DashboardHeader
        eyebrow="Admin dashboard"
        title="Bảng điều khiển hệ thống"
        description="Theo dõi doanh thu, booking, người dùng, phương tiện, tranh chấp và các job vận hành quan trọng của MoveVN."
        actions={
          <Button
            type="button"
            variant="secondary"
            isLoading={refreshing}
            onClick={() => void loadStats(true)}
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Làm mới
          </Button>
        }
      />

      {stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={TrendingUp}
              label="Doanh thu hệ thống"
              tone="brand"
              value={formatCurrency(stats.totalRevenue)}
              description={
                <span className="inline-flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5" />
                  Tháng này {formatCurrency(stats.monthlyRevenue)}
                </span>
              }
            />
            <StatCard
              icon={CheckSquare}
              label="Booking"
              tone="blue"
              value={`${formatNumber(stats.totalBookings)} chuyến`}
              description={`${stats.activeBookings} đang xử lý · ${stats.todayBookings} tạo hôm nay`}
            />
            <StatCard
              icon={UsersRound}
              label="Người dùng"
              tone="emerald"
              value={formatNumber(stats.totalUsers)}
              description={`${stats.activeUsers} active · ${stats.onlineUsers} online`}
            />
            <StatCard
              icon={CarFront}
              label="Phương tiện"
              tone="amber"
              value={formatNumber(stats.totalVehicles)}
              description={`${stats.approvedVehicles} đã duyệt · ${stats.pendingVehicles} chờ duyệt`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Wallet}
              label="Tiền cọc đã thu"
              tone="slate"
              value={formatCurrency(stats.totalDeposit)}
              description="Ghi nhận từ booking hoàn thành"
            />
            <StatCard
              icon={Banknote}
              label="Giá trị booking"
              tone="emerald"
              value={formatCurrency(stats.totalBookingValue)}
              description={`Tháng này ${formatCurrency(stats.monthlyBookingValue)}`}
            />
            <StatCard
              icon={LifeBuoy}
              label="Ticket mở"
              tone="blue"
              value={formatNumber(stats.supportTicketsOpen)}
              description="Yêu cầu hỗ trợ cần theo dõi"
            />
            <StatCard
              icon={ShieldAlert}
              label="Tranh chấp"
              tone={stats.openDisputes > 0 ? "rose" : "slate"}
              value={formatNumber(stats.openDisputes)}
              description={`${stats.disputeRate}% booking có tranh chấp`}
            />
          </div>

          {stats.pendingWithdrawalCount > 0 ? (
            <section className="rounded-md border border-amber-200 bg-amber-50 p-5 shadow-sm shadow-amber-950/5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="rounded-md bg-white p-2 text-amber-700 ring-1 ring-amber-200">
                    <Clock className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-semibold text-amber-950">Có yêu cầu rút tiền đang chờ xử lý</h2>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      {stats.pendingWithdrawalCount} yêu cầu với tổng giá trị {formatCurrency(stats.pendingWithdrawalAmount)} cần được duyệt.
                    </p>
                  </div>
                </div>
                <Link to="/admin/withdrawals">
                  <Button variant="primary" className="inline-flex items-center gap-2">
                    Xử lý rút tiền
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </section>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionPanel title="Booking 14 ngày gần nhất" description="Số booking mới theo ngày.">
              <TrendBars items={stats.bookingTrend} maxValue={maxBookingTrend} valueKey="count" />
            </SectionPanel>

            <SectionPanel title="Doanh thu 6 tháng" description="Phí nền tảng ghi nhận từ booking hoàn thành.">
              <TrendBars items={stats.revenueTrend} maxValue={maxRevenueTrend} valueKey="revenue" />
            </SectionPanel>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <SectionPanel
              title="Booking và giao dịch gần đây"
              description="Theo dõi trạng thái booking, tiền cọc và phí nền tảng phát sinh."
              contentClassName="p-0"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gradient-to-r from-brand-50 via-fuchsia-50 to-sky-50 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                    <tr>
                      <th className="px-5 py-4">Mã booking</th>
                      <th className="px-5 py-4">Trạng thái</th>
                      <th className="px-5 py-4 text-right">Tiền cọc</th>
                      <th className="px-5 py-4 text-right">Phí nền tảng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recentBookings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                          Chưa có booking nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      stats.recentBookings.map((booking) => (
                        <tr key={booking.id} className="transition hover:bg-slate-50/70">
                          <td className="px-5 py-4 font-semibold text-slate-950">
                            <Link to={`/booking/${booking.id}`} className="text-brand-700 hover:text-brand-800 hover:underline">
                              {booking.bookingCode}
                            </Link>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge tone={getStatusTone(booking.status)}>{statusLabels[booking.status] || booking.status}</StatusBadge>
                          </td>
                          <td className="px-5 py-4 text-right font-medium text-slate-950">{formatCurrency(booking.depositAmount)}</td>
                          <td className="px-5 py-4 text-right font-semibold text-emerald-700">
                            {booking.status === "Completed" ? `+${formatCurrency(booking.platformFee)}` : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SectionPanel>

            <div className="space-y-6">
              <SectionPanel title="Trạng thái hệ thống" description="Các nhóm cần theo dõi trong demo.">
                <div className="space-y-3">
                  {[
                    { icon: CheckSquare, label: "Booking chờ duyệt", value: stats.pendingBookings, tone: "text-amber-700" },
                    { icon: ShieldAlert, label: "Tranh chấp mở", value: stats.openDisputes, tone: "text-rose-700" },
                    { icon: LifeBuoy, label: "Ticket hỗ trợ mở", value: stats.supportTicketsOpen, tone: "text-blue-700" },
                    { icon: Bell, label: "Thông báo chưa đọc", value: stats.unreadNotifications, tone: "text-brand-700" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-white p-2 text-slate-700 ring-1 ring-slate-200">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-slate-800">{item.label}</span>
                      </div>
                      <span className={`text-lg font-bold ${item.tone}`}>{formatNumber(item.value)}</span>
                    </div>
                  ))}
                </div>
              </SectionPanel>

              <SectionPanel title="Quản trị nhanh" description="Các màn hình vận hành thường dùng.">
                <div className="grid gap-3">
                  {[
                    {
                      description: "Bật/tắt auto-cancel, reminder check-in/out và email notification.",
                      href: "/admin/system-config",
                      icon: Settings,
                      label: "Cấu hình hệ thống",
                    },
                    {
                      description: "Duyệt yêu cầu rút tiền và đối soát chi hộ.",
                      href: "/admin/withdrawals",
                      icon: Banknote,
                      label: "Yêu cầu rút tiền",
                    },
                    {
                      description: "Xem ví ảo, số dư và giao dịch thành viên.",
                      href: "/admin/wallets",
                      icon: Wallet,
                      label: "Ví thành viên",
                    },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="group flex items-start justify-between gap-4 rounded-md border border-slate-200 bg-slate-50/60 p-4 transition hover:border-brand-200 hover:bg-white hover:shadow-md hover:shadow-slate-950/10"
                    >
                      <div className="flex gap-3">
                        <span className="rounded-md bg-white p-2 text-brand-700 ring-1 ring-slate-200 transition group-hover:ring-brand-200">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <h3 className="font-semibold text-slate-950">{item.label}</h3>
                          <p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700" />
                    </Link>
                  ))}
                </div>
              </SectionPanel>
            </div>
          </div>
        </>
      ) : (
        <SectionPanel title="Chưa có dữ liệu" description="Backend chưa trả về số liệu dashboard.">
          <p className="text-sm text-slate-600">Hãy kiểm tra API admin dashboard rồi làm mới lại trang.</p>
        </SectionPanel>
      )}
    </div>
  );
}
