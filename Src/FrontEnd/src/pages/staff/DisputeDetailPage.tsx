import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "@/components/common/Button";
import Card from "@/components/ui/Card";
import { escalateDispute, getDisputeDetail, resolveDispute, type Dispute } from "@/services/staffService";

export default function DisputeDetailPage() {
  const params = useParams();
  const disputeId = Number(params.disputeId);
  const [detail, setDetail] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState("");
  const [compensationAmount, setCompensationAmount] = useState("");

  async function load() {
    if (!disputeId) return;
    const result = await getDisputeDetail(disputeId);
    setDetail(result);
  }

  useEffect(() => {
    void load();
  }, [disputeId]);

  if (!disputeId) {
    return <div className="text-sm text-red-600">Invalid dispute id.</div>;
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dispute #{detail?.id ?? disputeId}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Booking #{detail?.bookingId} • {detail?.status}
        </p>
      </div>

      <Card className="grid gap-4">
        <div className="grid gap-2 text-sm text-zinc-700">
          <div>Opened by user #{detail?.openedBy}</div>
          <div>Resolution: {detail?.resolution ?? "Pending"}</div>
          <div>Evidence count: {detail?.evidenceUrls.length ?? 0}</div>
        </div>

        {detail?.evidenceUrls.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {detail.evidenceUrls.map((url) => (
              <img key={url} src={url} alt="Dispute evidence" className="max-h-72 w-full rounded-lg border border-zinc-200 object-cover" />
            ))}
          </div>
        ) : null}

        <div className="rounded-lg bg-zinc-50 p-4">
          <div className="text-sm font-medium text-zinc-700">Timeline</div>
          <div className="mt-2 grid gap-2 text-sm text-zinc-600">
            {detail?.timeline.map((item) => (
              <div key={item}>{item}</div>
            ))}
          </div>
        </div>

        <textarea
          value={resolution}
          onChange={(event) => setResolution(event.target.value)}
          rows={4}
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
          placeholder="Write your resolution..."
        />

        <input
          value={compensationAmount}
          onChange={(event) => setCompensationAmount(event.target.value)}
          className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
          placeholder="Compensation amount (optional)"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              await resolveDispute(disputeId, resolution || "Resolved by staff review.", compensationAmount ? Number(compensationAmount) : undefined);
              setResolution("");
              setCompensationAmount("");
              await load();
            }}
          >
            Resolve dispute
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await escalateDispute(disputeId);
              await load();
            }}
          >
            Escalate to admin
          </Button>
        </div>
      </Card>
    </div>
  );
}
