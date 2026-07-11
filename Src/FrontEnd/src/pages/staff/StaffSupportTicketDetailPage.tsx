import { ArrowLeft, Save, Send, UserRound } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { showToast } from "@/components/common/toastStore";
import Card from "@/components/ui/Card";
import {
  formatSupportTicketDateTime,
  supportTicketEditableStatusOptions,
  supportTicketPriorityColors,
  supportTicketPriorityLabels,
  supportTicketStatusColors,
  supportTicketStatusLabels,
} from "@/features/supportTickets/supportTicketConstants";
import SupportTicketAttachmentGallery from "@/features/supportTickets/components/SupportTicketAttachmentGallery";
import SupportTicketAttachmentInput from "@/features/supportTickets/components/SupportTicketAttachmentInput";
import { serializeSupportTicketAttachmentUrls } from "@/features/supportTickets/supportTicketAttachments";
import { addSupportTicketMessage, getSupportTicketById, updateSupportTicketStatus } from "@/features/supportTickets/supportTicketService";
import type { SupportTicketDetailResponse, TicketMessageResponse } from "@/features/supportTickets/types";

function isStaffMessage(message: TicketMessageResponse) {
  return message.senderRoles.some((role) => role === "Staff" || role === "Admin");
}

export default function StaffSupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<SupportTicketDetailResponse | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("Open");
  const [message, setMessage] = useState("");
  const [replyAttachmentUrls, setReplyAttachmentUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const result = await getSupportTicketById(Number(id));
      setTicket(result);
      setSelectedStatus(result.status);
    } catch {
      setTicket(null);
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải ticket hỗ trợ." });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveStatus() {
    if (!ticket) return;
    setIsSavingStatus(true);
    try {
      const updated = await updateSupportTicketStatus(ticket.id, { status: selectedStatus });
      setTicket(updated);
      setSelectedStatus(updated.status);
      showToast({ type: "success", title: "Đã cập nhật", message: "Trạng thái ticket đã được lưu." });
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể cập nhật trạng thái." });
    } finally {
      setIsSavingStatus(false);
    }
  }

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket || !message.trim()) return;

    setIsSending(true);
    try {
      const updated = await addSupportTicketMessage(ticket.id, {
        message: message.trim(),
        attachmentUrls: serializeSupportTicketAttachmentUrls(replyAttachmentUrls),
      });
      setTicket(updated);
      setSelectedStatus(updated.status);
      setMessage("");
      setReplyAttachmentUrls([]);
      showToast({ type: "success", title: "Đã gửi", message: "Phản hồi đã được gửi đến customer." });
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể gửi phản hồi." });
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) return <LoadingSpinner />;
  if (!ticket) return <p className="text-sm text-red-600">Không tìm thấy ticket hỗ trợ.</p>;

  const isClosed = ticket.status === "Closed" || ticket.status === "Resolved";

  return (
    <div className="space-y-6">
      <Link to="/staff/support-tickets">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
      </Link>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Staff</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-950">{ticket.ticketNumber}</h1>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${supportTicketStatusColors[ticket.status] ?? "bg-slate-100 text-slate-600"}`}>
            {supportTicketStatusLabels[ticket.status] ?? ticket.status}
          </span>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${supportTicketPriorityColors[ticket.priority] ?? "bg-slate-100 text-slate-600"}`}>
            {supportTicketPriorityLabels[ticket.priority] ?? ticket.priority}
          </span>
        </div>
        <p className="mt-2 text-lg font-semibold text-slate-900">{ticket.subject}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="rounded-md">
            <h2 className="mb-4 text-lg font-bold text-slate-950">Trao đổi</h2>
            <div className="space-y-4">
              {ticket.messages.map((item) => {
                const fromStaff = isStaffMessage(item);
                return (
                  <div key={item.id} className={`flex gap-3 ${fromStaff ? "justify-end" : "justify-start"}`}>
                    {!fromStaff && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <UserRound className="h-4 w-4" />
                      </div>
                    )}
                    <div className={`max-w-[min(40rem,100%)] rounded-md px-4 py-3 ${fromStaff ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-800"}`}>
                      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="font-semibold">{item.senderName}</span>
                        <span className={fromStaff ? "text-brand-100" : "text-slate-500"}>{formatSupportTicketDateTime(item.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6">{item.message}</p>
                      <SupportTicketAttachmentGallery attachmentUrls={item.attachmentUrls} contrast={fromStaff ? "dark" : "light"} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="rounded-md">
            <h2 className="mb-4 text-lg font-bold text-slate-950">Phản hồi customer</h2>
            {isClosed ? (
              <p className="text-sm text-slate-600">Ticket này đã kết thúc. Chuyển trạng thái về đang xử lý nếu cần phản hồi thêm.</p>
            ) : (
              <form onSubmit={submitReply} className="space-y-3">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  maxLength={4000}
                  rows={5}
                  className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <SupportTicketAttachmentInput
                  value={replyAttachmentUrls}
                  onChange={setReplyAttachmentUrls}
                  disabled={isSending}
                  onUploadingChange={setIsUploadingAttachment}
                />
                <div className="flex justify-end">
                  <Button type="submit" isLoading={isSending} disabled={isUploadingAttachment}>
                    <Send className="h-4 w-4" /> Gửi phản hồi
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-md">
            <h2 className="mb-4 text-lg font-bold text-slate-950">Xử lý ticket</h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Trạng thái
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  {supportTicketEditableStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="button" className="w-full" onClick={saveStatus} isLoading={isSavingStatus}>
                <Save className="h-4 w-4" /> Lưu trạng thái
              </Button>
            </div>
          </Card>

          <Card className="rounded-md">
            <h2 className="mb-4 text-lg font-bold text-slate-950">Thông tin</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Khách hàng</dt>
                <dd className="mt-1 font-semibold text-slate-900">{ticket.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Nhóm</dt>
                <dd className="mt-1 font-semibold text-slate-900">{ticket.category}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Staff phụ trách</dt>
                <dd className="mt-1 font-semibold text-slate-900">{ticket.assignedStaffName ?? "Chưa nhận"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Tạo lúc</dt>
                <dd className="mt-1 font-semibold text-slate-900">{formatSupportTicketDateTime(ticket.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">Cập nhật</dt>
                <dd className="mt-1 font-semibold text-slate-900">{formatSupportTicketDateTime(ticket.lastMessageAt ?? ticket.createdAt)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
