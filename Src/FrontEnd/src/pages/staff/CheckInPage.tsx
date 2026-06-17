import { useState } from "react";
import Button from "@/components/common/Button";
import Card from "@/components/ui/Card";
import { getBookingDetail, submitInspection, type BookingDetail } from "@/services/staffService";

export default function CheckInPage() {
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [odometerKm, setOdometerKm] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [damageNoted, setDamageNoted] = useState(false);
  const [damageDescription, setDamageDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Check-in Flow</h1>
        <p className="mt-2 text-sm text-zinc-600">Create a handover inspection before the trip starts.</p>
      </div>

      <Card className="grid gap-4">
        <div className="flex gap-2">
          <input
            value={bookingId}
            onChange={(event) => setBookingId(event.target.value)}
            className="h-10 flex-1 rounded-md border border-zinc-200 px-3 text-sm"
            placeholder="Booking id"
          />
          <Button
            onClick={async () => {
              if (!bookingId.trim()) return;
              const result = await getBookingDetail(Number(bookingId));
              setBooking(result);
            }}
          >
            Load booking
          </Button>
        </div>

        {booking ? (
          <div className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700">
            <div>Booking #{booking.bookingCode}</div>
            <div>Vehicle: {booking.vehicleName || `#${booking.vehicleId}`}</div>
            <div>Status: {booking.status}</div>
            <div>Deposit: {new Intl.NumberFormat("vi-VN").format(booking.depositAmount)} VND</div>
          </div>
        ) : null}

        <input value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} className="h-10 rounded-md border border-zinc-200 px-3 text-sm" placeholder="Odometer (km)" />
        <input value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)} className="h-10 rounded-md border border-zinc-200 px-3 text-sm" placeholder="Fuel level" />
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" checked={damageNoted} onChange={(e) => setDamageNoted(e.target.checked)} />
          Damage noted at check-in
        </label>
        <textarea value={damageDescription} onChange={(e) => setDamageDescription(e.target.value)} rows={4} className="rounded-md border border-zinc-200 px-3 py-2 text-sm" placeholder="Vehicle condition notes" />
        <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} className="text-sm" />

        <Button
          onClick={async () => {
            if (!bookingId.trim()) return;
            await submitInspection("check-in", {
              bookingId: Number(bookingId),
              odometerKm: odometerKm ? Number(odometerKm) : undefined,
              fuelLevel: fuelLevel || undefined,
              damageNoted,
              damageDescription: damageDescription || undefined,
              files,
            });
            setDamageDescription("");
            setFiles([]);
          }}
        >
          Submit check-in
        </Button>
      </Card>
    </div>
  );
}
