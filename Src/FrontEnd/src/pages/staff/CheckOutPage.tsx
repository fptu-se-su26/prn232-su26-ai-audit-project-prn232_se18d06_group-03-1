import { useState } from "react";
import Button from "@/components/common/Button";
import Card from "@/components/ui/Card";
import { getBookingDetail, getInspection, refundDeposit, submitInspection, type BookingDetail, type InspectionDetail } from "@/services/staffService";

export default function CheckOutPage() {
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [checkInReport, setCheckInReport] = useState<InspectionDetail | null>(null);
  const [odometerKm, setOdometerKm] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [damageNoted, setDamageNoted] = useState(false);
  const [damageDescription, setDamageDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [refundAction, setRefundAction] = useState<"FullRefund" | "PartialRefund" | "OpenDispute">("FullRefund");
  const [deductionAmount, setDeductionAmount] = useState("");

  async function loadBooking() {
    if (!bookingId.trim()) return;
    const [bookingResult, inspectionResult] = await Promise.all([
      getBookingDetail(Number(bookingId)),
      getInspection(Number(bookingId), "CheckIn").catch(() => null),
    ]);
    setBooking(bookingResult);
    setCheckInReport(inspectionResult);
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Check-out Flow</h1>
        <p className="mt-2 text-sm text-zinc-600">Complete post-trip inspection and decide how the deposit should be handled.</p>
      </div>

      <Card className="grid gap-4">
        <div className="flex gap-2">
          <input value={bookingId} onChange={(e) => setBookingId(e.target.value)} className="h-10 flex-1 rounded-md border border-zinc-200 px-3 text-sm" placeholder="Booking id" />
          <Button onClick={loadBooking}>Load booking</Button>
        </div>

        {booking ? (
          <div className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700">
            <div>Booking #{booking.bookingCode}</div>
            <div>Status: {booking.status}</div>
            <div>Deposit: {new Intl.NumberFormat("vi-VN").format(booking.depositAmount)} VND</div>
          </div>
        ) : null}

        {checkInReport ? (
          <div className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-700">
            <div className="font-medium text-zinc-900">Previous check-in</div>
            <div className="mt-2">Odometer: {checkInReport.odometerKm ?? "N/A"} km</div>
            <div>Fuel: {checkInReport.fuelLevel ?? "N/A"}</div>
            <div>Damage noted: {checkInReport.damageNoted ? "Yes" : "No"}</div>
          </div>
        ) : null}

        <input value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} className="h-10 rounded-md border border-zinc-200 px-3 text-sm" placeholder="Return odometer (km)" />
        <input value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)} className="h-10 rounded-md border border-zinc-200 px-3 text-sm" placeholder="Return fuel level" />
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" checked={damageNoted} onChange={(e) => setDamageNoted(e.target.checked)} />
          Damage found at check-out
        </label>
        <textarea value={damageDescription} onChange={(e) => setDamageDescription(e.target.value)} rows={4} className="rounded-md border border-zinc-200 px-3 py-2 text-sm" placeholder="Check-out notes" />
        <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} className="text-sm" />

        <select value={refundAction} onChange={(e) => setRefundAction(e.target.value as "FullRefund" | "PartialRefund" | "OpenDispute")} className="h-10 rounded-md border border-zinc-200 px-3 text-sm">
          <option value="FullRefund">Full refund</option>
          <option value="PartialRefund">Partial refund</option>
          <option value="OpenDispute">Open dispute</option>
        </select>

        {refundAction === "PartialRefund" ? (
          <input value={deductionAmount} onChange={(e) => setDeductionAmount(e.target.value)} className="h-10 rounded-md border border-zinc-200 px-3 text-sm" placeholder="Deduction amount" />
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              if (!bookingId.trim()) return;
              await submitInspection("check-out", {
                bookingId: Number(bookingId),
                odometerKm: odometerKm ? Number(odometerKm) : undefined,
                fuelLevel: fuelLevel || undefined,
                damageNoted,
                damageDescription: damageDescription || undefined,
                files,
              });
            }}
          >
            Save inspection
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              if (!bookingId.trim()) return;
              await refundDeposit(Number(bookingId), {
                action: refundAction,
                deductionAmount: deductionAmount ? Number(deductionAmount) : undefined,
                note: damageDescription || undefined,
                evidenceUrls: [],
              });
              await loadBooking();
            }}
          >
            Process refund outcome
          </Button>
        </div>
      </Card>
    </div>
  );
}
