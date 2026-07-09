import { CalendarCheck, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import { getMyBookings } from "@/features/booking/bookingService";
import type { BookingResponse, BookingListRequest } from "@/features/booking/types";

const PAGE_SIZE = 10;

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
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-blue-100 text-blue-700",
  Rejected: "bg-red-100 text-red-700",
  Cancelled: "bg-slate-100 text-slate-600",
  DepositPaid: "bg-violet-100 text-violet-700",
  Confirmed: "bg-green-100 text-green-700",
  Completed: "bg-emerald-100 text-emerald-700",
};

const statusOptions = [
  { value: "", label: "Tất cả" },
  { value: "Pending", label: "Chờ duyệt" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Rejected", label: "Đã từ chối" },
  { value: "DepositPaid", label: "Đã đặt cọc" },
  { value: "Cancelled", label: "Đã hủy" },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export default function BookingListPage() {
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
      const result = await getMyBookings(params);
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Customer</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Lịch sử thuê xe</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Theo dõi các chuyến đi và trạng thái đặt xe của bạn.</p>
      </section>

      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-8 appearance-none rounded-md border border-slate-300 bg-white px-3 pr-8 text-sm text-slate-700"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronLeft className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 -rotate-90 text-slate-400" />
        </div>
        <span className="text-sm text-slate-500">{totalCount} kết quả</span>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có booking nào" description="Bạn chưa đặt xe lần nào." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã booking</th>
                <th className="px-4 py-3">Xe</th>
                <th className="px-4 py-3">Ngày thuê</th>
                <th className="px-4 py-3">Ngày trả</th>
                <th className="px-4 py-3">Tổng tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.bookingCode}</td>
                  <td className="px-4 py-3 text-slate-700">{item.vehicleName ?? `Xe #${item.vehicleId}`}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(item.startDate)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(item.endDate)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(item.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[item.status] ?? "bg-slate-100 text-slate-700"}`}>
                      {statusLabels[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/booking/${item.id}`}>
                      <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /> Chi tiết</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
          ><ChevronLeft className="h-4 w-4" /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" onClick={() => goToPage(p)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${p === page ? "bg-brand-700 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}
            >{p}</button>
          ))}
          <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
          ><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
      </div>
    </div>
  );
}
