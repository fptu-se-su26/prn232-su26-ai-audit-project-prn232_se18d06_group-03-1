import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Wallet, 
  Banknote, 
  CheckSquare, 
  RefreshCw, 
  Clock, 
  ArrowRight,
  Percent
} from "lucide-react";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getDashboardStats, type DashboardStats } from "@/features/admin/services/adminDashboardService";
import { showToast } from "@/components/common/toastStore";
import { Link } from "react-router-dom";

export default function AdminHomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadStats(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải số liệu thống kê doanh thu." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  const statusLabels: Record<string, string> = {
    Pending: "Chờ duyệt",
    Approved: "Đã duyệt",
    Rejected: "Đã từ chối",
    Cancelled: "Đã hủy",
    DepositPaid: "Đã đặt cọc",
    Confirmed: "Đã xác nhận",
    Completed: "Hoàn thành",
  };

  const statusColors: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Approved: "bg-sky-50 text-sky-700 border-sky-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200",
    Cancelled: "bg-slate-50 text-slate-700 border-slate-200",
    DepositPaid: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Confirmed: "bg-teal-50 text-teal-700 border-teal-200",
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Hệ Thống Quản Trị</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            Bảng điều khiển doanh thu
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Theo dõi dòng tiền cọc, phí nền tảng hệ thống thu được và các lệnh rút tiền.
          </p>
        </div>
        <button
          onClick={() => loadStats(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 transition-all duration-200"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Đang làm mới..." : "Làm mới"}
        </button>
      </div>

      {stats && (
        <>
          {/* Metrics Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Revenue */}
            <Card className="relative overflow-hidden border border-slate-100 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-white shadow-xl rounded-2xl">
              <div className="absolute right-4 top-4 rounded-xl bg-white/10 p-2.5 backdrop-blur-md">
                <TrendingUp className="h-5 w-5 text-brand-400" />
              </div>
              <p className="text-sm font-medium text-slate-400">Doanh thu Hệ thống (Phí 10%)</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight">{formatCurrency(stats.totalRevenue)}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-brand-400">
                <Percent className="h-3.5 w-3.5" />
                <span>Từ các booking đã hoàn thành</span>
              </div>
            </Card>

            {/* Total Deposits */}
            <Card className="relative overflow-hidden border border-slate-100 bg-white p-6 shadow-md rounded-2xl">
              <div className="absolute right-4 top-4 rounded-xl bg-slate-50 p-2.5">
                <Wallet className="h-5 w-5 text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-500">Tổng tiền cọc đã thu (PayOS)</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{formatCurrency(stats.totalDeposit)}</p>
              <p className="mt-4 text-xs text-slate-400">
                Nhận trực tiếp về tài khoản ngân hàng Admin
              </p>
            </Card>

            {/* Total Completed Values */}
            <Card className="relative overflow-hidden border border-slate-100 bg-white p-6 shadow-md rounded-2xl">
              <div className="absolute right-4 top-4 rounded-xl bg-slate-50 p-2.5">
                <Banknote className="h-5 w-5 text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-500">Tổng giá trị chuyến hoàn thành</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{formatCurrency(stats.totalBookingValue)}</p>
              <p className="mt-4 text-xs text-slate-400">
                Trị giá giao dịch hoàn tất dịch vụ
              </p>
            </Card>

            {/* Completed Bookings Count */}
            <Card className="relative overflow-hidden border border-slate-100 bg-white p-6 shadow-md rounded-2xl">
              <div className="absolute right-4 top-4 rounded-xl bg-slate-50 p-2.5">
                <CheckSquare className="h-5 w-5 text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-500">Số chuyến đã hoàn thành</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{stats.totalCompletedBookings} chuyến</p>
              <p className="mt-4 text-xs text-slate-400">
                Đã kết toán tiền về ví ảo chủ xe
              </p>
            </Card>
          </div>

          {/* Action Alerts */}
          {stats.pendingWithdrawalCount > 0 && (
            <div className="flex flex-col gap-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-rose-600" />
                <div>
                  <h3 className="font-bold text-rose-950">Yêu cầu rút tiền đang chờ xử lý</h3>
                  <p className="mt-1 text-sm text-rose-700">
                    Hiện có <span className="font-semibold">{stats.pendingWithdrawalCount} yêu cầu</span> rút tiền với tổng số tiền là{" "}
                    <span className="font-semibold">{formatCurrency(stats.pendingWithdrawalAmount)}</span> cần duyệt.
                  </p>
                </div>
              </div>
              <Link
                to="/admin/withdrawals"
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition-colors duration-200 self-start sm:self-auto"
              >
                Xử lý rút tiền <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* Table & Operations Area */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Recent Bookings Table */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Lịch sử giao dịch & Booking gần đây</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-150 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-3.5">Mã Booking</th>
                        <th className="px-5 py-3.5">Trạng thái</th>
                        <th className="px-5 py-3.5 text-right">Tổng tiền cọc</th>
                        <th className="px-5 py-3.5 text-right">Phí nền tảng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.recentBookings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                            Chưa có booking nào được ghi nhận.
                          </td>
                        </tr>
                      ) : (
                        stats.recentBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              <Link to={`/booking/${b.id}`} className="hover:underline text-brand-600">
                                {b.bookingCode}
                              </Link>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColors[b.status] || "bg-slate-50 text-slate-700"}`}>
                                {statusLabels[b.status] || b.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-medium text-slate-900">
                              {formatCurrency(b.depositAmount)}
                            </td>
                            <td className="px-5 py-4 text-right font-bold text-emerald-600">
                              {b.status === "Completed" ? `+${formatCurrency(b.platformFee)}` : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick links & Config */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Tính năng quản trị nhanh</h2>
              <div className="grid gap-3">
                <Link
                  to="/admin/wallets"
                  className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-brand-500 hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">Ví & Số dư thành viên</h3>
                    <p className="mt-1 text-xs text-slate-500">Xem tất cả ví ảo, nạp/trừ tiền thủ công</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-500 transition-colors" />
                </Link>

                <Link
                  to="/admin/withdrawals"
                  className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-brand-500 hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">Danh sách yêu cầu rút</h3>
                    <p className="mt-1 text-xs text-slate-500">Xem yêu cầu của chủ xe, duyệt chi hộ PayOS</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-500 transition-colors" />
                </Link>

                <Link
                  to="/admin/platform-fee-rules"
                  className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-brand-500 hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">Cấu hình phí dịch vụ</h3>
                    <p className="mt-1 text-xs text-slate-500">Thay đổi % phí nền tảng (Platform Fee)</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-500 transition-colors" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
