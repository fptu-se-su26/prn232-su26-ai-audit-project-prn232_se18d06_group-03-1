import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, Inbox, ListFilter, RotateCcw, Search } from "lucide-react";
import type { ComponentType, FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { showToast } from "@/components/common/toastStore";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import StatusBadge from "@/components/dashboard/StatusBadge";
import {
  formatSupportTicketDateTime,
  supportTicketCategoryOptions,
  supportTicketPriorityLabels,
  supportTicketPriorityOptions,
  supportTicketStatusLabels,
  supportTicketStatusOptions,
} from "@/features/supportTickets/supportTicketConstants";
import { getStaffSupportTickets } from "@/features/supportTickets/supportTicketService";
import type { SupportTicketListItem, SupportTicketListRequest } from "@/features/supportTickets/types";

const PAGE_SIZE = 10;

const emptyStats = {
  all: 0,
  Closed: 0,
  InProgress: 0,
  Open: 0,
  Resolved: 0,
};

type StaffTicketStats = typeof emptyStats;
type StaffTicketStatsKey = keyof StaffTicketStats;

const statusSummaryCards: Array<{
  description: string;
  icon: ComponentType<{ className?: string }>;
  key: StaffTicketStatsKey;
  label: string;
  status: string;
  tone: "amber" | "blue" | "brand" | "emerald" | "slate";
}> = [
  { key: "all", status: "", label: "Tất cả", description: "Toàn bộ ticket", icon: ListFilter, tone: "slate" },
  { key: "Open", status: "Open", label: "Cần xử lý", description: "Ticket mới mở", icon: Inbox, tone: "amber" },
  { key: "InProgress", status: "InProgress", label: "Đang xử lý", description: "Đã có staff nhận", icon: Clock3, tone: "blue" },
  { key: "Resolved", status: "Resolved", label: "Đã xử lý", description: "Chờ đóng hoặc xác nhận", icon: CheckCircle2, tone: "emerald" },
  { key: "Closed", status: "Closed", label: "Đã đóng", description: "Hoàn tất hỗ trợ", icon: CheckCircle2, tone: "slate" },
];

const supportTicketCategoryLabels = supportTicketCategoryOptions.reduce<Record<string, string>>((labels, option) => {
  labels[option.value] = option.label;
  return labels;
}, {});

function getStatusTone(status: string) {
  if (["Resolved", "Closed"].includes(status)) return "emerald" as const;
  if (status === "InProgress") return "blue" as const;
  if (status === "Open") return "amber" as const;
  return "slate" as const;
}

function getPriorityTone(priority: string) {
  if (priority === "Urgent" || priority === "High") return "rose" as const;
  if (priority === "Normal") return "blue" as const;
  return "slate" as const;
}

const toneClasses = {
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

export default function StaffSupportTicketListPage() {
  const [items, setItems] = useState<SupportTicketListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [keywordDraft, setKeywordDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [stats, setStats] = useState<StaffTicketStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const load = useCallback(async (nextPage: number, status: string, priority: string, category: string, search: string) => {
    setIsLoading(true);
    try {
      const params: SupportTicketListRequest = { page: nextPage, pageSize: PAGE_SIZE };
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (category) params.category = category;
      if (search) params.keyword = search;
      const result = await getStaffSupportTickets(params);
      setItems(result.items);
      setTotalCount(result.totalCount);
      setPage(result.page);
      setTotalPages(result.totalPages ?? Math.ceil(result.totalCount / PAGE_SIZE));
    } catch {
      setItems([]);
      setTotalCount(0);
      setTotalPages(0);
      showToast({ type: "error", title: "Không thể tải ticket", message: "Vui lòng thử lại sau vài giây." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1, statusFilter, priorityFilter, categoryFilter, keyword);
  }, [categoryFilter, keyword, load, priorityFilter, statusFilter]);

  const loadStats = useCallback(async (priority: string, category: string, search: string) => {
    setIsStatsLoading(true);
    try {
      const baseParams: SupportTicketListRequest = { page: 1, pageSize: 1 };
      if (priority) baseParams.priority = priority;
      if (category) baseParams.category = category;
      if (search) baseParams.keyword = search;

      const [all, open, inProgress, resolved, closed] = await Promise.all([
        getStaffSupportTickets(baseParams),
        getStaffSupportTickets({ ...baseParams, status: "Open" }),
        getStaffSupportTickets({ ...baseParams, status: "InProgress" }),
        getStaffSupportTickets({ ...baseParams, status: "Resolved" }),
        getStaffSupportTickets({ ...baseParams, status: "Closed" }),
      ]);

      setStats({
        all: all.totalCount,
        Closed: closed.totalCount,
        InProgress: inProgress.totalCount,
        Open: open.totalCount,
        Resolved: resolved.totalCount,
      });
    } catch {
      setStats(emptyStats);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats(priorityFilter, categoryFilter, keyword);
  }, [categoryFilter, keyword, loadStats, priorityFilter]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setKeyword(keywordDraft.trim());
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    void load(nextPage, statusFilter, priorityFilter, categoryFilter, keyword);
  }

  function resetFilters() {
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
    setKeywordDraft("");
    setKeyword("");
    setPage(1);
  }

  const hasActiveFilters = Boolean(statusFilter || priorityFilter || categoryFilter || keyword);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <DashboardHeader
        eyebrow="Staff support"
        title="Ticket hỗ trợ"
        description="Tiếp nhận, phân loại và xử lý yêu cầu hỗ trợ từ khách hàng trong một bảng làm việc dành cho staff."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {statusSummaryCards.map((card) => {
          const Icon = card.icon;
          const isActive = statusFilter === card.status;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => {
                setStatusFilter(card.status);
                setPage(1);
              }}
              className={[
                "rounded-md border bg-white p-4 text-left shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5",
                isActive ? "border-brand-300 ring-2 ring-brand-100" : "border-slate-200 hover:border-slate-300 hover:shadow-md",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-md ring-1 ${toneClasses[card.tone]}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-2xl font-semibold tracking-tight text-slate-950">{isStatsLoading ? "..." : stats[card.key]}</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-950">{card.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{card.description}</p>
            </button>
          );
        })}
      </div>

      <SectionPanel
        title="Danh sách ticket"
        description="Kết hợp bộ lọc trạng thái, danh mục, ưu tiên và từ khóa để tìm đúng ticket cần xử lý."
        action={<span className="text-sm font-semibold text-slate-500">{totalCount} ticket</span>}
        contentClassName="space-y-4"
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {supportTicketStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Tất cả danh mục</option>
              {supportTicketCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(event) => {
                setPriorityFilter(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Tất cả ưu tiên</option>
              {supportTicketPriorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={submitSearch} className="flex w-full gap-2 xl:w-auto">
            <div className="relative min-w-0 flex-1 xl:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={keywordDraft}
                onChange={(event) => setKeywordDraft(event.target.value)}
                placeholder="Tìm mã, tiêu đề, khách hàng"
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
              Tìm
            </Button>
            <Button type="button" variant="ghost" disabled={!hasActiveFilters} onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" />
              Xóa lọc
            </Button>
          </form>
        </div>

        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="Không có ticket" description="Ticket phù hợp bộ lọc sẽ xuất hiện tại đây." />
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[25%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
                <col className="w-[5%]" />
                <col className="w-[5%]" />
              </colgroup>
              <thead className="bg-gradient-to-r from-brand-50 via-white to-sky-50 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
                <tr>
                  <th className="whitespace-nowrap px-3 py-4">Mã ticket</th>
                  <th className="whitespace-nowrap px-3 py-4">Khách hàng</th>
                  <th className="whitespace-nowrap px-3 py-4">Tiêu đề</th>
                  <th className="whitespace-nowrap px-3 py-4">Danh mục</th>
                  <th className="whitespace-nowrap px-3 py-4">Ưu tiên</th>
                  <th className="whitespace-nowrap px-3 py-4">Trạng thái</th>
                  <th className="whitespace-nowrap px-3 py-4">Staff</th>
                  <th className="whitespace-nowrap px-3 py-4 text-center">Tin</th>
                  <th className="whitespace-nowrap px-3 py-4 text-right">Xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/70">
                    <td className="px-3 py-4 align-top font-mono text-xs font-bold text-slate-950">
                      <p className="truncate">{item.ticketNumber}</p>
                    </td>
                    <td className="px-3 py-4 align-top text-slate-700">
                      <p className="line-clamp-2">{item.customerName}</p>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <p className="line-clamp-2 font-semibold text-slate-950">{item.subject}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatSupportTicketDateTime(item.lastMessageAt ?? item.createdAt)}</p>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <StatusBadge>{supportTicketCategoryLabels[item.category] ?? item.category}</StatusBadge>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <StatusBadge tone={getPriorityTone(item.priority)}>
                        {supportTicketPriorityLabels[item.priority] ?? item.priority}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <StatusBadge tone={getStatusTone(item.status)}>{supportTicketStatusLabels[item.status] ?? item.status}</StatusBadge>
                    </td>
                    <td className="px-3 py-4 align-top text-slate-700">
                      <p className="line-clamp-2">{item.assignedStaffName ?? "Chưa nhận"}</p>
                    </td>
                    <td className="px-3 py-4 text-center align-top text-slate-700">{item.messageCount}</td>
                    <td className="px-3 py-4 text-right align-top">
                      <Link to={`/staff/support-tickets/${item.id}`}>
                        <Button variant="ghost" size="sm" className="px-2" title="Xử lý ticket">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Xử lý</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </SectionPanel>
    </div>
  );
}
