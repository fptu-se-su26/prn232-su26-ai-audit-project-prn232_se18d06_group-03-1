import { ArrowLeft, Send, UserRound } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { showToast } from "@/components/common/toastStore";
import Card from "@/components/ui/Card";
import {
  formatSupportTicketDateTime,
  supportTicketPriorityColors,
  supportTicketPriorityLabels,
  supportTicketStatusColors,
  supportTicketStatusLabels,
} from "@/features/supportTickets/supportTicketConstants";
import { addSupportTicketMessage, getSupportTicketById } from "@/features/supportTickets/supportTicketService";
import type { SupportTicketDetailResponse, TicketMessageResponse } from "@/features/supportTickets/types";

function isStaffMessage(message: TicketMessageResponse) {
  return message.senderRoles.some((role) => role === "Staff" || role === "Admin");
}

export default function CustomerSupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<SupportTicketDetailResponse | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const result = await getSupportTicketById(Number(id));
      setTicket(result);
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

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket || !message.trim()) return;

    setIsSending(true);
    try {
      const updated = await addSupportTicketMessage(ticket.id, { message: message.trim() });
      setTicket(updated);
      setMessage("");
      showToast({ type: "success", title: "Đã gửi", message: "Phản hồi của bạn đã được ghi nhận." });
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
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/customer/support-tickets">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
      </Link>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Customer</p>
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

      <Card className="grid gap-4 rounded-md sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Nhóm</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{ticket.category}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Staff phụ trách</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{ticket.assignedStaffName ?? "Chưa phân công"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Tạo lúc</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatSupportTicketDateTime(ticket.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Cập nhật</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatSupportTicketDateTime(ticket.lastMessageAt ?? ticket.createdAt)}</p>
        </div>
      </Card>

      <Card className="rounded-md">
        <h2 className="mb-4 text-lg font-bold text-slate-950">Trao đổi</h2>
        <div className="space-y-4">
          {ticket.messages.map((item) => {
            const fromStaff = isStaffMessage(item);
            return (
              <div key={item.id} className={`flex gap-3 ${fromStaff ? "justify-start" : "justify-end"}`}>
                {fromStaff && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <UserRound className="h-4 w-4" />
                  </div>
                )}
                <div className={`max-w-[min(36rem,100%)] rounded-md px-4 py-3 ${fromStaff ? "bg-slate-100 text-slate-800" : "bg-brand-700 text-white"}`}>
                  <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className="font-semibold">{item.senderName}</span>
                    <span className={fromStaff ? "text-slate-500" : "text-brand-100"}>{formatSupportTicketDateTime(item.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{item.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="rounded-md">
        <h2 className="mb-4 text-lg font-bold text-slate-950">Phản hồi</h2>
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
              className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={isSending}>
                <Send className="h-4 w-4" /> Gửi phản hồi
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
