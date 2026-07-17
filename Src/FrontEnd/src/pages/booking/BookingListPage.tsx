import { ArrowLeft, CalendarCheck, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { getMyBookings } from "@/features/booking/bookingService";
import type { BookingListRequest, BookingResponse } from "@/features/booking/types";

const PAGE_SIZE = 10;

const statusLabels: Record<string, string> = {
  Approved: "Đã duyệt",
  Cancelled: "Đã hủy",
  Completed: "Hoàn thành",
  Confirmed: "Đã xác nhận",
  InProgress: "Đang nhận xe",
  Pending: "Chờ duyệt",
  Rejected: "Đã từ chối",
};

const statusOptions = [
  { value: "", label: "Tất cả" },
  { value: "Pending", label: "Chờ duyệt" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Rejected", label: "Đã từ chối" },
  { value: "Cancelled", label: "Đã hủy" },
];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function getStatusTone(status: string) {
  if (status === "Completed") return "emerald" as const;
  if (["Approved", "Confirmed", "InProgress"].includes(status)) return "blue" as const;
  if (status === "Pending") return "amber" as const;
  if (["Rejected", "Cancelled"].includes(status)) return "rose" as const;
  return "slate" as const;
}

export default function BookingListPage() {
  const [items, setItems] = useState<BookingResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (nextPage: number, status: string) => {
    setIsLoading(true);
    try {
      const params: BookingListRequest = { page: nextPage, pageSize: PAGE_SIZE };
      if (status) params.status = status;
      const result = await getMyBookings(params);
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
    void load(1, statusFilter);
  }, [load, statusFilter]);

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    void load(nextPage, statusFilter);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <DashboardHeader
        eyebrow="Booking history"
        title="Lịch sử thuê xe"
        description="Theo dõi các booking của bạn theo trạng thái và mở chi tiết khi cần kiểm tra lịch trình."
        actions={
          <Link to="/customer">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Về dashboard
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-500">{totalCount} kết quả</span>
        </div>
      </div>

      <SectionPanel title="Danh sách booking" description="Các booking được sắp theo dữ liệu API hiện tại." contentClassName="p-0">
        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : items.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Chưa có booking nào" description="Bạn chưa đặt xe lần nào." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Mã booking</th>
                  <th className="px-5 py-4">Xe</th>
                  <th className="px-5 py-4">Ngày thuê</th>
                  <th className="px-5 py-4">Ngày trả</th>
                  <th className="px-5 py-4">Tổng tiền</th>
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
                        {item.vehicleImage ? (
                          <img src={item.vehicleImage} alt={item.vehicleName ?? "Xe"} className="h-10 w-14 rounded-md object-cover" />
                        ) : (
                          <span className="grid h-10 w-14 place-items-center rounded-md bg-slate-100 text-slate-500">
                            <CalendarCheck className="h-4 w-4" />
                          </span>
                        )}
                        <span className="font-semibold text-slate-950">{item.vehicleName ?? `Xe #${item.vehicleId}`}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(item.startDate)}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(item.endDate)}</td>
                    <td className="px-5 py-4 font-semibold text-slate-950">{formatCurrency(item.totalAmount)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={getStatusTone(item.status)}>{statusLabels[item.status] ?? item.status}</StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/booking/${item.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
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

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-24 text-center text-sm font-semibold text-slate-700">
            {page}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
