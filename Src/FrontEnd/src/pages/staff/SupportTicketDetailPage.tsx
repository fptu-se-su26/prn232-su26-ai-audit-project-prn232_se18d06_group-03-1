import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "@/components/common/Button";
import Card from "@/components/ui/Card";
import { closeSupportTicket, getSupportTicketDetail, replySupportTicket, type SupportTicketDetail } from "@/services/staffService";

export default function SupportTicketDetailPage() {
  const params = useParams();
  const ticketId = Number(params.ticketId);
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    if (!ticketId) return;
    const result = await getSupportTicketDetail(ticketId);
    setDetail(result);
  }

  useEffect(() => {
    void load();
  }, [ticketId]);

  if (!ticketId) {
    return <div className="text-sm text-red-600">Invalid ticket id.</div>;
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{detail?.subject ?? "Ticket detail"}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {detail?.ticketNumber} • {detail?.status}
        </p>
      </div>

      <Card className="grid gap-4">
        <div className="grid gap-3">
          {detail?.messages.map((item) => (
            <div key={item.id} className="rounded-lg border border-zinc-200 p-3">
              <div className="text-xs text-zinc-500">
                Sender #{item.senderId} • {new Date(item.createdAt).toLocaleString("vi-VN")}
              </div>
              <p className="mt-2 text-sm text-zinc-800">{item.message}</p>
            </div>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
          placeholder="Reply to this ticket..."
        />

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              if (!message.trim()) return;
              await replySupportTicket(ticketId, message.trim());
              setMessage("");
              await load();
            }}
          >
            Send reply
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await closeSupportTicket(ticketId);
              await load();
            }}
          >
            Close ticket
          </Button>
        </div>
      </Card>
    </div>
  );
}
