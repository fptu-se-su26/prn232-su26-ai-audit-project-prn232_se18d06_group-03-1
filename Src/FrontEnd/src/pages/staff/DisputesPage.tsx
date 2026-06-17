import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "@/components/ui/Card";
import { getDisputes, type Dispute } from "@/services/staffService";

export default function DisputesPage() {
  const [items, setItems] = useState<Dispute[]>([]);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    void (async () => {
      const result = await getDisputes(status || undefined);
      setItems(result.items);
    })();
  }, [status]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Disputes</h1>
          <p className="mt-2 text-sm text-zinc-600">Investigate and resolve post-trip issues or escalate them.</p>
        </div>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="Open">Open</option>
          <option value="Resolved">Resolved</option>
          <option value="Escalated">Escalated</option>
        </select>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Dispute #{item.id}</h2>
              <p className="text-sm text-zinc-600">
                Booking #{item.bookingId} • {item.status}
              </p>
            </div>
            <Link className="text-sm font-medium text-zinc-900 underline" to={`/staff/disputes/${item.id}`}>
              Open dispute
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
