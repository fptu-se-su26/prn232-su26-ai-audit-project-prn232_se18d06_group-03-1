import { ChevronLeft, ChevronRight, Eye, MessageSquarePlus, Search, Send } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { showToast } from "@/components/common/toastStore";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import StatusBadge from "@/components/dashboard/StatusBadge";
import SupportTicketAttachmentInput from "@/features/supportTickets/components/SupportTicketAttachmentInput";
import { serializeSupportTicketAttachmentUrls } from "@/features/supportTickets/supportTicketAttachments";
import {
  formatSupportTicketDateTime,
  supportTicketCategoryOptions,
  supportTicketPriorityLabels,
  supportTicketPriorityOptions,
  supportTicketStatusLabels,
  supportTicketStatusOptions,
} from "@/features/supportTickets/supportTicketConstants";
import { createSupportTicket, getMySupportTickets } from "@/features/supportTickets/supportTicketService";
import type { SupportTicketListItem, SupportTicketListRequest } from "@/features/supportTickets/types";

const PAGE_SIZE = 10;

const initialCreateForm = {
  category: "Booking",
  message: "",
  priority: "Normal",
  subject: "",
};

const fieldClassName =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function getStatusTone(status: string) {
  if (["Resolved", "Closed"].includes(status)) return "emerald" as const;
  if (status === "InProgress") return "blue" as const;
  if (status === "Open") return "amber" as const;
  return "slate" as const;
}

function getPriorityTone(priority: string) {
  if (priority === "Urgent" || priority === "High") return "rose" as const;
  if (priority === "Normal") return "blue" as const;
  if (priority === "Low") return "slate" as const;
  return "brand" as const;
}

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
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createAttachmentUrls, setCreateAttachmentUrls] = useState<string[]>([]);

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
      showToast({ type: "error", title: "Không thể tải ticket", message: "Vui lòng thử lại sau vài giây." });
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
      const ticket = await createSupportTicket({
        ...createForm,
        attachmentUrls: serializeSupportTicketAttachmentUrls(createAttachmentUrls),
      });
      setCreateForm(initialCreateForm);
      setCreateAttachmentUrls([]);
      showToast({ type: "success", title: "Đã tạo ticket", message: "Yêu cầu hỗ trợ đã được gửi đến staff." });
      navigate(`/customer/support-tickets/${ticket.id}`);
    } catch {
      showToast({ type: "error", title: "Không thể tạo ticket", message: "Vui lòng kiểm tra nội dung và thử lại." });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <DashboardHeader
        eyebrow="Customer support"
        title="Trung tâm hỗ trợ"
        description="Tạo yêu cầu mới, theo dõi phản hồi từ staff và giữ toàn bộ trao đổi hỗ trợ trong một nơi."
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <SectionPanel
          title="Ticket của tôi"
          description="Lọc theo trạng thái hoặc tìm nhanh bằng mã ticket, tiêu đề."
          action={<span className="text-sm font-semibold text-slate-500">{totalCount} ticket</span>}
          contentClassName="space-y-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

            <form onSubmit={submitSearch} className="flex w-full gap-2 lg:w-auto">
              <div className="relative min-w-0 flex-1 lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={keywordDraft}
                  onChange={(event) => setKeywordDraft(event.target.value)}
                  placeholder="Tìm mã hoặc tiêu đề"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4" />
                Tìm
              </Button>
            </form>
          </div>

          {isLoading ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <EmptyState title="Chưa có ticket" description="Các yêu cầu hỗ trợ của bạn sẽ xuất hiện tại đây." />
          ) : (
            <div className="overflow-hidden rounded-md border border-slate-200">
              <table className="w-full table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[19%]" />
                  <col className="w-[31%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[16%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead className="bg-gradient-to-r from-brand-50 via-white to-sky-50 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-4">Mã ticket</th>
                    <th className="whitespace-nowrap px-3 py-4">Tiêu đề</th>
                    <th className="whitespace-nowrap px-3 py-4">Ưu tiên</th>
                    <th className="whitespace-nowrap px-3 py-4">Trạng thái</th>
                    <th className="whitespace-nowrap px-3 py-4">Cập nhật</th>
                    <th className="whitespace-nowrap px-3 py-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/70">
                      <td className="px-3 py-4 align-top font-mono text-xs font-bold text-slate-950">
                        <p className="truncate" title={item.ticketNumber}>{item.ticketNumber}</p>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <p className="line-clamp-2 font-semibold text-slate-950">{item.subject}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{item.category}</p>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <StatusBadge tone={getPriorityTone(item.priority)}>
                          {supportTicketPriorityLabels[item.priority] ?? item.priority}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <StatusBadge tone={getStatusTone(item.status)}>{supportTicketStatusLabels[item.status] ?? item.status}</StatusBadge>
                      </td>
                      <td className="px-3 py-4 align-top text-slate-600">
                        <span className="block truncate" title={formatSupportTicketDateTime(item.lastMessageAt ?? item.createdAt)}>
                          {formatSupportTicketDateTime(item.lastMessageAt ?? item.createdAt)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right align-top">
                        <Link to={`/customer/support-tickets/${item.id}`}>
                          <Button variant="ghost" size="sm" className="px-2" title="Chi tiết ticket">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Chi tiết</span>
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

        <SectionPanel
          title="Tạo ticket mới"
          description="Mô tả rõ vấn đề và đính kèm ảnh để staff xử lý nhanh hơn."
          action={<MessageSquarePlus className="h-5 w-5 text-brand-700" />}
        >
          <form onSubmit={submitCreate} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Nhóm hỗ trợ
              <select
                value={createForm.category}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, category: event.target.value }))}
                className={`${fieldClassName} h-10`}
              >
                {supportTicketCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Mức ưu tiên
              <select
                value={createForm.priority}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, priority: event.target.value }))}
                className={`${fieldClassName} h-10`}
              >
                {supportTicketPriorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Tiêu đề
              <input
                value={createForm.subject}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, subject: event.target.value }))}
                required
                maxLength={200}
                className={`${fieldClassName} h-10`}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Nội dung
              <textarea
                value={createForm.message}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, message: event.target.value }))}
                required
                maxLength={4000}
                rows={6}
                className={`${fieldClassName} resize-y py-2 leading-6`}
              />
            </label>

            <div>
              <p className="mb-1 text-sm font-semibold text-slate-700">Ảnh đính kèm</p>
              <SupportTicketAttachmentInput
                value={createAttachmentUrls}
                onChange={setCreateAttachmentUrls}
                disabled={isCreating}
                onUploadingChange={setIsUploadingAttachment}
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isCreating} disabled={isUploadingAttachment}>
              <Send className="h-4 w-4" />
              Gửi ticket
            </Button>
          </form>
        </SectionPanel>
      </div>
    </div>
  );
}
