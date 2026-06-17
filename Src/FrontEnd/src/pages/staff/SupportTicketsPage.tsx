import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "@/components/ui/Card";
import { getSupportTicketQueue, type SupportTicket } from "@/services/staffService";

export default function SupportTicketsPage() {
  const [items, setItems] = useState<SupportTicket[]>([]);

  useEffect(() => {
    void (async () => {
      const result = await getSupportTicketQueue();
      setItems(result.items);
    })();
  }, []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Support Tickets</h1>
        <p className="mt-2 text-sm text-zinc-600">Reply to customer issues and close tickets once resolved.</p>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{item.subject}</h2>
              <p className="text-sm text-zinc-600">
                {item.ticketNumber} • {item.category} • {item.status}
              </p>
            </div>
            <Link className="text-sm font-medium text-zinc-900 underline" to={`/staff/tickets/${item.id}`}>
              View conversation
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
