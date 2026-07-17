import { CalendarCheck, Eye } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { BookingListFilters, BookingPagination, type BookingFilters } from "@/features/booking/components/BookingListControls";
import RiskScoreBadge from "@/features/booking/components/RiskScoreBadge";
import { getOwnerBookings } from "@/features/booking/bookingService";
import type { BookingListRequest, BookingResponse } from "@/features/booking/types";

const PAGE_SIZE = 10;

const statusLabels: Record<string, string> = {
  Approved: "Đã duyệt",
  Cancelled: "Đã hủy",
  Completed: "Hoàn thành",
  Confirmed: "Đã xác nhận",
  DepositPaid: "Đã đặt cọc",
  InProgress: "Đang nhận xe",
  Pending: "Chờ thanh toán",
  Rejected: "Đã từ chối",
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

const emptyFilters: BookingFilters = { fromDate: "", keyword: "", status: "", toDate: "" };

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function getStatusTone(status: string) {
  if (status === "Completed") return "emerald" as const;
  if (["Approved", "Confirmed", "DepositPaid", "InProgress"].includes(status)) return "blue" as const;
  if (status === "Pending") return "amber" as const;
  if (["Rejected", "Cancelled"].includes(status)) return "rose" as const;
  return "slate" as const;
}

export default function OwnerBookingListPage() {
  const [items, setItems] = useState<BookingResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [draftFilters, setDraftFilters] = useState<BookingFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<BookingFilters>(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (nextPage: number, filters: BookingFilters) => {
    setIsLoading(true);
    try {
      const params: BookingListRequest = { page: nextPage, pageSize: PAGE_SIZE };
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

  useEffect(() => {
    void load(1, appliedFilters);
  }, [load, appliedFilters]);

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    void load(nextPage, appliedFilters);
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
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <DashboardHeader
        eyebrow="Owner bookings"
        title="Yêu cầu thuê xe"
        description="Quản lý yêu cầu thuê từ khách hàng, kiểm tra rủi ro và mở chi tiết để phản hồi booking."
        actions={<StatusBadge>{`${totalCount} yêu cầu`}</StatusBadge>}
      />

      <BookingListFilters
        value={draftFilters}
        statusOptions={statusOptions}
        resultCount={totalCount}
        searchPlaceholder="Mã booking, khách hàng, địa chỉ..."
        onChange={setDraftFilters}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      <SectionPanel
        title="Danh sách yêu cầu"
        description="Ưu tiên xử lý các yêu cầu đã đặt cọc hoặc có rủi ro cao."
        contentClassName="p-0"
      >
        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : items.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Chưa có yêu cầu nào" description="Các booking từ khách hàng sẽ xuất hiện tại đây." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Mã booking</th>
                  <th className="px-5 py-4">Khách hàng</th>
                  <th className="px-5 py-4">Ngày thuê</th>
                  <th className="px-5 py-4">Ngày trả</th>
                  <th className="px-5 py-4">Tổng tiền</th>
                  <th className="px-5 py-4">Rủi ro</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-950">{item.bookingCode}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 text-slate-500">
                          <CalendarCheck className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-slate-950">Khách #{item.customerId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(item.startDate)}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(item.endDate)}</td>
                    <td className="px-5 py-4 font-semibold text-slate-950">{formatCurrency(item.totalAmount)}</td>
                    <td className="px-5 py-4">
                      <RiskScoreBadge score={item.riskScore} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={getStatusTone(item.status)}>{statusLabels[item.status] ?? item.status}</StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/owner/bookings/${item.id}`}>
                        <Button variant="ghost" size="sm">
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

      <BookingPagination page={page} totalPages={totalPages} onPageChange={goToPage} />
    </div>
  );
}
