import { useEffect, useState } from "react";
import Button from "@/components/common/Button";
import Card from "@/components/ui/Card";
import { approveVerification, getVerificationQueue, rejectVerification, type VerificationItem } from "@/services/staffService";

export default function VerificationQueuePage() {
  const [items, setItems] = useState<VerificationItem[]>([]);

  async function load() {
    const result = await getVerificationQueue();
    setItems(result.items);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Verification Queue</h1>
        <p className="mt-2 text-sm text-zinc-600">Review uploaded citizen ID and driving license documents.</p>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  User #{item.userId} • {item.type}
                </h2>
                <p className="text-sm text-zinc-500">Submitted at {new Date(item.createdAt).toLocaleString("vi-VN")}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    await approveVerification(item.id);
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
                    await rejectVerification(item.id, reason);
                    await load();
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <img src={item.frontImageUrl} alt="Front document" className="max-h-72 w-full rounded-lg border border-zinc-200 object-cover" />
              {item.backImageUrl ? (
                <img src={item.backImageUrl} alt="Back document" className="max-h-72 w-full rounded-lg border border-zinc-200 object-cover" />
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
