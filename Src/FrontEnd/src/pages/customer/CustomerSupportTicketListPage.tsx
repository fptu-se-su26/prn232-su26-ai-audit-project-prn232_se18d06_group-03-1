import { ChevronLeft, ChevronRight, Eye, MessageSquarePlus, Search, Send } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { showToast } from "@/components/common/toastStore";
import Card from "@/components/ui/Card";
import {
  supportTicketCategoryOptions,
  supportTicketPriorityColors,
  supportTicketPriorityLabels,
  supportTicketPriorityOptions,
  supportTicketStatusColors,
  supportTicketStatusLabels,
  supportTicketStatusOptions,
  formatSupportTicketDateTime,
} from "@/features/supportTickets/supportTicketConstants";
import { createSupportTicket, getMySupportTickets } from "@/features/supportTickets/supportTicketService";
import type { SupportTicketListItem, SupportTicketListRequest } from "@/features/supportTickets/types";

const PAGE_SIZE = 10;

const initialCreateForm = {
  category: "Booking",
  subject: "",
  message: "",
  priority: "Normal",
};

export default function CustomerSupportTicketListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SupportTicketListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [keywordDraft, setKeywordDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);

  const load = useCallback(async (nextPage: number, status: string, search: string) => {
    setIsLoading(true);
    try {
      const params: SupportTicketListRequest = { page: nextPage, pageSize: PAGE_SIZE };
      if (status) params.status = status;
      if (search) params.keyword = search;
      const result = await getMySupportTickets(params);
      setItems(result.items);
      setTotalCount(result.totalCount);
      setPage(result.page);
      setTotalPages(result.totalPages ?? Math.ceil(result.totalCount / PAGE_SIZE));
    } catch {
      setItems([]);
      setTotalCount(0);
      setTotalPages(0);
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải danh sách ticket." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1, statusFilter, keyword);
  }, [keyword, load, statusFilter]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setKeyword(keywordDraft.trim());
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    void load(nextPage, statusFilter, keyword);
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    try {
      const ticket = await createSupportTicket(createForm);
      setCreateForm(initialCreateForm);
      showToast({ type: "success", title: "Đã tạo ticket", message: "Ticket hỗ trợ đã được gửi đến staff." });
      navigate(`/customer/support-tickets/${ticket.id}`);
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tạo ticket hỗ trợ." });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Customer</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Hỗ trợ</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Theo dõi các yêu cầu hỗ trợ và phản hồi từ staff.</p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              {supportTicketStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-slate-500">{totalCount} ticket</span>
          </div>

          <form onSubmit={submitSearch} className="flex w-full gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={keywordDraft}
                onChange={(event) => setKeywordDraft(event.target.value)}
                placeholder="Tìm mã hoặc tiêu đề"
                className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">
              <Search className="h-4 w-4" /> Tìm
            </Button>
          </form>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <EmptyState title="Chưa có ticket" description="Các yêu cầu hỗ trợ của bạn sẽ xuất hiện tại đây." />
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Mã ticket</th>
                  <th className="px-4 py-3">Tiêu đề</th>
                  <th className="px-4 py-3">Ưu tiên</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Cập nhật</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.ticketNumber}</td>
                    <td className="min-w-56 px-4 py-3">
                      <p className="font-medium text-slate-900">{item.subject}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${supportTicketPriorityColors[item.priority] ?? "bg-slate-100 text-slate-600"}`}>
                        {supportTicketPriorityLabels[item.priority] ?? item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${supportTicketStatusColors[item.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {supportTicketStatusLabels[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatSupportTicketDateTime(item.lastMessageAt ?? item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/customer/support-tickets/${item.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" /> Chi tiết
                        </Button>
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
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-24 text-center text-sm font-medium text-slate-700">
              {page}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <Card className="h-fit rounded-md">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5 text-brand-700" />
          <h2 className="text-lg font-bold text-slate-950">Tạo ticket mới</h2>
        </div>
        <form onSubmit={submitCreate} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Nhóm hỗ trợ
            <select
              value={createForm.category}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, category: event.target.value }))}
              className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {supportTicketCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Mức ưu tiên
            <select
              value={createForm.priority}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, priority: event.target.value }))}
              className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {supportTicketPriorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Tiêu đề
            <input
              value={createForm.subject}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, subject: event.target.value }))}
              required
              maxLength={200}
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Nội dung
            <textarea
              value={createForm.message}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, message: event.target.value }))}
              required
              maxLength={4000}
              rows={6}
              className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <Button type="submit" className="w-full" isLoading={isCreating}>
            <Send className="h-4 w-4" /> Gửi ticket
          </Button>
        </form>
      </Card>
    </div>
  );
}
