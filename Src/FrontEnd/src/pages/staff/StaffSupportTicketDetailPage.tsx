import { ArrowLeft, Save, Send, UserRound } from "lucide-react";
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
  supportTicketEditableStatusOptions,
  supportTicketPriorityLabels,
  supportTicketStatusLabels,
} from "@/features/supportTickets/supportTicketConstants";
import { addSupportTicketMessage, getSupportTicketById, updateSupportTicketStatus } from "@/features/supportTickets/supportTicketService";
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
      showToast({ type: "error", title: "Không thể tải ticket", message: "Vui lòng thử lại sau vài giây." });
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
      showToast({ type: "error", title: "Không thể cập nhật", message: "Vui lòng thử lại sau." });
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
        attachmentUrls: serializeSupportTicketAttachmentUrls(replyAttachmentUrls),
        message: message.trim(),
      });
      setTicket(updated);
      setSelectedStatus(updated.status);
      setMessage("");
      setReplyAttachmentUrls([]);
      showToast({ type: "success", title: "Đã gửi phản hồi", message: "Nội dung đã được gửi đến customer." });
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
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Link to="/staff/support-tickets">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      </Link>

      <DashboardHeader
        eyebrow="Staff support"
        title={`${ticket.ticketNumber} · ${ticket.subject}`}
        description="Xem trao đổi với khách hàng, cập nhật trạng thái xử lý và gửi phản hồi từ phía staff."
        actions={
          <>
            <StatusBadge tone={getStatusTone(ticket.status)}>{supportTicketStatusLabels[ticket.status] ?? ticket.status}</StatusBadge>
            <StatusBadge tone={getPriorityTone(ticket.priority)}>{supportTicketPriorityLabels[ticket.priority] ?? ticket.priority}</StatusBadge>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <SectionPanel title="Trao đổi" description="Tin nhắn của staff nằm bên phải, tin nhắn khách hàng nằm bên trái.">
            <div className="space-y-4">
              {ticket.messages.map((item) => {
                const fromStaff = isStaffMessage(item);
                return (
                  <div key={item.id} className={`flex gap-3 ${fromStaff ? "justify-end" : "justify-start"}`}>
                    {!fromStaff ? (
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                        <UserRound className="h-4 w-4" />
                      </div>
                    ) : null}
                    <div
                      className={
                        fromStaff
                          ? "max-w-[min(42rem,100%)] rounded-md bg-brand-700 px-4 py-3 text-white shadow-sm shadow-brand-950/20"
                          : "max-w-[min(42rem,100%)] rounded-md bg-slate-100 px-4 py-3 text-slate-800"
                      }
                    >
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
          </SectionPanel>

          <SectionPanel
            title="Phản hồi customer"
            description={isClosed ? "Ticket đã kết thúc. Chuyển trạng thái về đang xử lý nếu cần phản hồi thêm." : "Gửi phản hồi rõ ràng, kèm ảnh nếu cần hướng dẫn khách hàng."}
          >
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
                  placeholder="Nhập phản hồi cho customer..."
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

        <div className="space-y-6">
          <SectionPanel title="Xử lý ticket" description="Cập nhật trạng thái để khách hàng biết tiến độ.">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Trạng thái
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  {supportTicketEditableStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="button" className="w-full" onClick={saveStatus} isLoading={isSavingStatus}>
                <Save className="h-4 w-4" />
                Lưu trạng thái
              </Button>
            </div>
          </SectionPanel>

          <SectionPanel title="Thông tin" contentClassName="space-y-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Khách hàng</p>
              <p className="mt-1 font-semibold text-slate-950">{ticket.customerName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Nhóm</p>
              <p className="mt-1 font-semibold text-slate-950">{ticket.category}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Staff phụ trách</p>
              <p className="mt-1 font-semibold text-slate-950">{ticket.assignedStaffName ?? "Chưa nhận"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Tạo lúc</p>
              <p className="mt-1 font-semibold text-slate-950">{formatSupportTicketDateTime(ticket.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Cập nhật</p>
              <p className="mt-1 font-semibold text-slate-950">{formatSupportTicketDateTime(ticket.lastMessageAt ?? ticket.createdAt)}</p>
            </div>
          </SectionPanel>
        </div>
      </div>
    </div>
  );
}
