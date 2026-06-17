import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "@/components/ui/Card";
import {
  getDisputes,
  getPendingVehicleQueue,
  getSupportTicketQueue,
  getVerificationQueue,
} from "@/services/staffService";

type QueueSummary = {
  vehicles: number;
  verifications: number;
  tickets: number;
  disputes: number;
};

export default function StaffQueuePage() {
  const [summary, setSummary] = useState<QueueSummary | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      const [vehicles, verifications, tickets, disputes] = await Promise.all([
        getPendingVehicleQueue(1, 1),
        getVerificationQueue(1, 1),
        getSupportTicketQueue(1, 1),
        getDisputes(undefined, 1, 1),
      ]);

      if (!active) return;
      setSummary({
        vehicles: vehicles.totalCount,
        verifications: verifications.totalCount,
        tickets: tickets.totalCount,
        disputes: disputes.totalCount,
      });
    })();

    return () => {
      active = false;
    };
  }, []);

  const items = [
    { title: "Vehicle Queue", value: summary?.vehicles, to: "/staff/vehicles" },
    { title: "Verification Queue", value: summary?.verifications, to: "/staff/verifications" },
    { title: "Support Tickets", value: summary?.tickets, to: "/staff/tickets" },
    { title: "Disputes", value: summary?.disputes, to: "/staff/disputes" },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Staff Queue</h1>
        <p className="mt-2 text-sm text-zinc-600">A single place to triage verification, vehicle, ticket, and dispute work.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Card key={item.title} className="grid gap-4">
            <div>
              <div className="text-sm font-medium text-zinc-500">{item.title}</div>
              <div className="mt-2 text-3xl font-semibold text-zinc-950">{item.value ?? "..."}</div>
            </div>
            <Link className="text-sm font-medium text-zinc-900 underline" to={item.to}>
              Open queue
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
