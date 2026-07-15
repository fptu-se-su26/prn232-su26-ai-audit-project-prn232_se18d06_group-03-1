import { Eye } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import { getOwnerBookings } from "@/features/booking/bookingService";
import type { BookingResponse, BookingListRequest } from "@/features/booking/types";
import RiskScoreBadge from "@/features/booking/components/RiskScoreBadge";
import { BookingListFilters, BookingPagination, type BookingFilters } from "@/features/booking/components/BookingListControls";

const PAGE_SIZE = 10;

const statusLabels: Record<string, string> = {
  Pending: "Chờ thanh toán",
  DepositPaid: "Đã đặt cọc",
  Approved: "Đã duyệt",
  Rejected: "Đã từ chối",
  Cancelled: "Đã hủy",
  Confirmed: "Đã xác nhận",
  InProgress: "Đang nhận xe",
  Completed: "Hoàn thành",
};

const statusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  DepositPaid: "bg-violet-100 text-violet-700",
  Approved: "bg-blue-100 text-blue-700",
  Rejected: "bg-red-100 text-red-700",
  Cancelled: "bg-slate-100 text-slate-600",
  Confirmed: "bg-green-100 text-green-700",
  InProgress: "bg-cyan-100 text-cyan-700",
  Completed: "bg-emerald-100 text-emerald-700",
};

const statusOptions = [
  { value: "", label: "Tất cả" },
  { value: "DepositPaid", label: "Đã đặt cọc" },
  { value: "Pending", label: "Chờ thanh toán" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "InProgress", label: "Đang nhận xe" },
  { value: "Completed", label: "Hoàn thành" },
  { value: "Rejected", label: "Đã từ chối" },
  { value: "Cancelled", label: "Đã hủy" },
];

const emptyFilters: BookingFilters = { status: "", keyword: "", fromDate: "", toDate: "" };

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export default function OwnerBookingListPage() {
  const [items, setItems] = useState<BookingResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [draftFilters, setDraftFilters] = useState<BookingFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<BookingFilters>(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (p: number, filters: BookingFilters) => {
    setIsLoading(true);
    try {
      const params: BookingListRequest = { page: p, pageSize: PAGE_SIZE };
      if (filters.status) params.status = filters.status;
      if (filters.keyword.trim()) params.keyword = filters.keyword.trim();
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      const result = await getOwnerBookings(params);
      setItems(result.items);
      setTotalCount(result.totalCount);
      setPage(result.page);
      setTotalPages(Math.ceil(result.totalCount / PAGE_SIZE));
    } catch {
      setItems([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(1, appliedFilters); }, [load, appliedFilters]);

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    void load(p, appliedFilters);
  }

  function applyFilters() {
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  }

  function clearFilters() {
    setPage(1);
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Owner</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Yêu cầu thuê xe</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Quản lý yêu cầu thuê xe từ khách hàng.</p>
      </section>

      <BookingListFilters
        value={draftFilters}
        statusOptions={statusOptions}
        resultCount={totalCount}
        searchPlaceholder="Mã booking, khách hàng, địa chỉ..."
        onChange={setDraftFilters}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có yêu cầu nào" description="Chưa có khách hàng nào đặt xe của bạn." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã booking</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Ngày thuê</th>
                <th className="px-4 py-3">Ngày trả</th>
                <th className="px-4 py-3">Tổng tiền</th>
                <th className="px-4 py-3">Rủi ro</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.bookingCode}</td>
                  <td className="px-4 py-3 text-slate-700">#{item.customerId}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(item.startDate)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(item.endDate)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(item.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <RiskScoreBadge score={item.riskScore} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[item.status] ?? "bg-slate-100 text-slate-700"}`}>
                      {statusLabels[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/owner/bookings/${item.id}`}>
                      <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /> Chi tiết</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BookingPagination page={page} totalPages={totalPages} onPageChange={goToPage} />
    </div>
  );
}
