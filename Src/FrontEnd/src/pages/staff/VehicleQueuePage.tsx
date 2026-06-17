import { useEffect, useState } from "react";
import Button from "@/components/common/Button";
import Card from "@/components/ui/Card";
import { getPendingVehicleQueue, reviewVehicle, type VehicleQueueItem } from "@/services/staffService";

export default function VehicleQueuePage() {
  const [items, setItems] = useState<VehicleQueueItem[]>([]);

  async function load() {
    const result = await getPendingVehicleQueue();
    setItems(result.items);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Pending Vehicles</h1>
        <p className="mt-2 text-sm text-zinc-600">Review owner vehicles before they become available for booking.</p>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{item.licensePlate}</h2>
                <p className="text-sm text-zinc-600">{item.address}</p>
                <p className="mt-2 text-sm text-zinc-500">
                  Vehicle #{item.id} • {new Intl.NumberFormat("vi-VN").format(item.pricePerDay)} VND/day
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    await reviewVehicle(item.id, true);
                    await load();
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const reason = window.prompt("Reason for rejection")?.trim();
                    if (!reason) return;
                    await reviewVehicle(item.id, false, reason);
                    await load();
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
