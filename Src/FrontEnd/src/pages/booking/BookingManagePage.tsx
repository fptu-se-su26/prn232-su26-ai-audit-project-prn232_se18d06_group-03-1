import { ChevronLeft, ChevronRight, Eye, ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import { getOwnerBookings } from "@/features/booking/bookingService";
import type { BookingResponse, BookingListRequest } from "@/features/booking/types";
import RiskScoreBadge from "@/features/booking/components/RiskScoreBadge";

const PAGE_SIZE = 10;

const statusLabels: Record<string, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Đã từ chối",
  Cancelled: "Đã hủy",
  Confirmed: "Đã xác nhận",
  InProgress: "Đang nhận xe",
  Completed: "Hoàn thành",
};

const statusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-blue-100 text-blue-700",
  Rejected: "bg-red-100 text-red-700",
  Cancelled: "bg-slate-100 text-slate-600",
  Confirmed: "bg-green-100 text-green-700",
  InProgress: "bg-cyan-100 text-cyan-700",
  Completed: "bg-emerald-100 text-emerald-700",
};

const statusOptions = [
  { value: "", label: "Tất cả" },
  { value: "Pending", label: "Chờ duyệt" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Rejected", label: "Đã từ chối" },
  { value: "Cancelled", label: "Đã hủy" },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export default function BookingManagePage() {
  const [items, setItems] = useState<BookingResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (p: number, status: string) => {
    setIsLoading(true);
    try {
      const params: BookingListRequest = { page: p, pageSize: PAGE_SIZE };
      if (status) params.status = status;
      const result = await getOwnerBookings(params);
      setItems(result.items);
      setTotalCount(result.totalCount);
      setPage(result.page);
      setTotalPages(Math.ceil(result.totalCount / PAGE_SIZE));
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(1, statusFilter); }, [load, statusFilter]);

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    void load(p, statusFilter);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6">
        <section className="border-b border-slate-100 pb-4 dark:border-neutral-800 flex flex-wrap justify-between items-end gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">Owner Dashboard</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Yêu cầu thuê xe</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">Quản lý yêu cầu thuê xe từ khách hàng.</p>
          </div>
          <Link to="/owner">
            <Button variant="secondary" className="text-xs font-semibold border border-slate-200 inline-flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-lg">
              <ArrowLeft className="h-4 w-4" /> Quay lại Dashboard
            </Button>
          </Link>
        </section>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="h-9 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-gray-300"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronLeft className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 -rotate-90 text-slate-400" />
            </div>
            <span className="text-xs font-medium text-slate-400 dark:text-gray-500">{totalCount} kết quả</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center"><LoadingSpinner /></div>
        ) : items.length === 0 ? (
          <EmptyState title="Chưa có yêu cầu nào" description="Chưa có khách hàng nào đặt xe của bạn." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-150 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-150 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-neutral-900 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4">Mã booking</th>
                  <th className="px-5 py-4">Khách hàng</th>
                  <th className="px-5 py-4">Ngày thuê</th>
                  <th className="px-5 py-4">Ngày trả</th>
                  <th className="px-5 py-4">Tổng tiền</th>
                  <th className="px-5 py-4">Rủi ro</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-900">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-neutral-900/50">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-900 dark:text-white">{item.bookingCode}</td>
                    <td className="px-5 py-4 text-slate-700 dark:text-gray-300">Khách hàng #{item.customerId}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-gray-400">{formatDate(item.startDate)}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-gray-400">{formatDate(item.endDate)}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{formatCurrency(item.totalAmount)}</td>
                    <td className="px-5 py-4">
                      <RiskScoreBadge score={item.riskScore} />
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${statusColors[item.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {statusLabels[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/booking/${item.id}`}>
                        <Button variant="ghost" size="sm" className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" /> Chi tiết</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-neutral-800 dark:text-gray-400 dark:hover:bg-neutral-900"
            ><ChevronLeft className="h-4 w-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} type="button" onClick={() => goToPage(p)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition-colors ${p === page ? "bg-brand-600 text-white shadow-md shadow-brand-600/20" : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-neutral-800 dark:text-gray-400 dark:hover:bg-neutral-900"}`}
              >{p}</button>
            ))}
            <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-neutral-800 dark:text-gray-400 dark:hover:bg-neutral-900"
            ><ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
