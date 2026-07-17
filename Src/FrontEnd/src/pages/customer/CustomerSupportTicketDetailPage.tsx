import { ArrowLeft, Send, UserRound } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { showToast } from "@/components/common/toastStore";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import StatusBadge from "@/components/dashboard/StatusBadge";
import SupportTicketAttachmentGallery from "@/features/supportTickets/components/SupportTicketAttachmentGallery";
import SupportTicketAttachmentInput from "@/features/supportTickets/components/SupportTicketAttachmentInput";
import { serializeSupportTicketAttachmentUrls } from "@/features/supportTickets/supportTicketAttachments";
import {
  formatSupportTicketDateTime,
  supportTicketPriorityLabels,
  supportTicketStatusLabels,
} from "@/features/supportTickets/supportTicketConstants";
import { addSupportTicketMessage, getSupportTicketById } from "@/features/supportTickets/supportTicketService";
import type { SupportTicketDetailResponse, TicketMessageResponse } from "@/features/supportTickets/types";

function isStaffMessage(message: TicketMessageResponse) {
  return message.senderRoles.some((role) => role === "Staff" || role === "Admin");
}

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

export default function CustomerSupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<SupportTicketDetailResponse | null>(null);
  const [message, setMessage] = useState("");
  const [replyAttachmentUrls, setReplyAttachmentUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const result = await getSupportTicketById(Number(id));
      setTicket(result);
    } catch {
      setTicket(null);
      showToast({ type: "error", title: "Không thể tải ticket", message: "Vui lòng thử lại sau vài giây." });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket || !message.trim()) return;

    setIsSending(true);
    try {
      const updated = await addSupportTicketMessage(ticket.id, {
        attachmentUrls: serializeSupportTicketAttachmentUrls(replyAttachmentUrls),
        message: message.trim(),
      });
      setTicket(updated);
      setMessage("");
      setReplyAttachmentUrls([]);
      showToast({ type: "success", title: "Đã gửi phản hồi", message: "Nội dung của bạn đã được ghi nhận." });
    } catch {
      showToast({ type: "error", title: "Không thể gửi phản hồi", message: "Vui lòng thử lại sau." });
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!ticket) return <p className="text-sm text-red-600">Không tìm thấy ticket hỗ trợ.</p>;

  const isClosed = ticket.status === "Closed" || ticket.status === "Resolved";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Link to="/customer/support-tickets">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      </Link>

      <DashboardHeader
        eyebrow="Customer support"
        title={`${ticket.ticketNumber} · ${ticket.subject}`}
        description="Theo dõi toàn bộ trao đổi với staff, trạng thái xử lý và ảnh đính kèm của ticket."
        actions={
          <>
            <StatusBadge tone={getStatusTone(ticket.status)}>{supportTicketStatusLabels[ticket.status] ?? ticket.status}</StatusBadge>
            <StatusBadge tone={getPriorityTone(ticket.priority)}>{supportTicketPriorityLabels[ticket.priority] ?? ticket.priority}</StatusBadge>
          </>
        }
      />

      <SectionPanel title="Thông tin ticket" contentClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Nhóm</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{ticket.category}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Staff phụ trách</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{ticket.assignedStaffName ?? "Chưa phân công"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Tạo lúc</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{formatSupportTicketDateTime(ticket.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Cập nhật</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{formatSupportTicketDateTime(ticket.lastMessageAt ?? ticket.createdAt)}</p>
        </div>
      </SectionPanel>

      <SectionPanel title="Trao đổi" description="Tin nhắn mới nhất nằm ở cuối cuộc trò chuyện.">
        <div className="space-y-4">
          {ticket.messages.map((item) => {
            const fromStaff = isStaffMessage(item);
            return (
              <div key={item.id} className={`flex gap-3 ${fromStaff ? "justify-start" : "justify-end"}`}>
                {fromStaff ? (
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                    <UserRound className="h-4 w-4" />
                  </div>
                ) : null}
                <div
                  className={
                    fromStaff
                      ? "max-w-[min(40rem,100%)] rounded-md bg-slate-100 px-4 py-3 text-slate-800"
                      : "max-w-[min(40rem,100%)] rounded-md bg-brand-700 px-4 py-3 text-white shadow-sm shadow-brand-950/20"
                  }
                >
                  <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className="font-semibold">{item.senderName}</span>
                    <span className={fromStaff ? "text-slate-500" : "text-brand-100"}>{formatSupportTicketDateTime(item.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{item.message}</p>
                  <SupportTicketAttachmentGallery attachmentUrls={item.attachmentUrls} contrast={fromStaff ? "light" : "dark"} />
                </div>
              </div>
            );
          })}
        </div>
      </SectionPanel>

      <SectionPanel title="Phản hồi" description={isClosed ? "Ticket đã kết thúc nên không thể gửi thêm phản hồi." : "Gửi thêm thông tin để staff xử lý chính xác hơn."}>
        {isClosed ? (
          <p className="text-sm text-slate-600">Ticket này đã kết thúc.</p>
        ) : (
          <form onSubmit={submitReply} className="space-y-3">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              maxLength={4000}
              rows={5}
              placeholder="Nhập phản hồi của bạn..."
              className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <SupportTicketAttachmentInput
              value={replyAttachmentUrls}
              onChange={setReplyAttachmentUrls}
              disabled={isSending}
              onUploadingChange={setIsUploadingAttachment}
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={isSending} disabled={isUploadingAttachment}>
                <Send className="h-4 w-4" />
                Gửi phản hồi
              </Button>
            </div>
          </form>
        )}
      </SectionPanel>
    </div>
  );
}
