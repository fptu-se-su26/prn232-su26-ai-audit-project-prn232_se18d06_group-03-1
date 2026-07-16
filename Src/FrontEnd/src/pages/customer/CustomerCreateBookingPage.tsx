import { ArrowLeft, CalendarDays, Car, MapPin, TicketPercent, CreditCard, DollarSign } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Card from "@/components/ui/Card";
import { createBooking } from "@/features/booking/bookingService";
import { getPublicVehicleById } from "@/features/vehicles/services/publicVehicleService";
import { showToast } from "@/components/common/toastStore";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

const discountTiers: { min: number; max: number; pct: number }[] = [
  { min: 3, max: 3, pct: 5 },
  { min: 5, max: 6, pct: 10 },
  { min: 7, max: 29, pct: 15 },
  { min: 30, max: Infinity, pct: 25 },
];

function getDiscountPercent(days: number) {
  for (const t of discountTiers) {
    if (days >= t.min && days <= t.max) return t.pct;
  }
  return 0;
}

export default function CustomerCreateBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const vehicleId = Number(searchParams.get("vehicleId"));

  const [vehicle, setVehicle] = useState<{ pricePerDay: number; depositPercent: number } | null>(null);
  const [vehicleName, setVehicleName] = useState("");
  const [loadingVehicle, setLoadingVehicle] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [returnAddress, setReturnAddress] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextAvailableDate, setNextAvailableDate] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const qStart = searchParams.get("startDate");
    const qEnd = searchParams.get("endDate");
    if (qStart) setStartDate(qStart + "T00:00");
    if (qEnd) setEndDate(qEnd + "T00:00");
  }, [searchParams]);

  useEffect(() => {
    if (!vehicleId) { setLoadingVehicle(false); return; }
    getPublicVehicleById(vehicleId)
      .then((v) => {
        setVehicle({ pricePerDay: v.currentPricePerDay ?? v.pricePerDay, depositPercent: v.depositPercent });
        setVehicleName(`${v.brandName} ${v.modelName}`);
      })
      .catch(() => setError("Không thể tải thông tin xe."))
      .finally(() => setLoadingVehicle(false));
  }, [vehicleId]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffMs = e.getTime() - s.getTime();
    if (diffMs <= 0) return 0;
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const pricePreview = useMemo(() => {
    if (!vehicle || totalDays <= 0) return null;
    const base = vehicle.pricePerDay * totalDays;
    const discPct = getDiscountPercent(totalDays);
    const discAmt = Math.round(base * discPct / 100);
    const afterDisc = base - discAmt;
    const total = afterDisc;
    const fee = Math.round(total * 10 / 100);
    const depositPercent = Math.max(20, vehicle.depositPercent || 0);
    const deposit = Math.round(total * depositPercent / 100);
    const remaining = Math.max(total - deposit, 0);
    return { base, discPct, discAmt, fee, deposit, depositPercent, remaining, total };
  }, [vehicle, totalDays]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !startDate || !endDate || !pickupAddress.trim()) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError("Ngày trả phải sau ngày nhận.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createBooking({
        vehicleId,
        startDate,
        endDate,
        pickupAddress: pickupAddress.trim(),
        returnAddress: returnAddress.trim() || undefined,
        customerNote: customerNote.trim() || undefined,
      });
      showToast({ type: "success", title: "Đặt xe thành công", message: `Mã booking: ${result.bookingCode}` });
      navigate(`/customer/bookings/${result.id}`);
    } catch (err: any) {
      const data = err?.response?.data;
      const nextAvail = data?.data?.nextAvailable;
      var msg = data?.errors?.length ? data.errors.join(", ") : data?.message || err?.message || "Không thể tạo booking.";
      if (nextAvail && !msg.includes("ngày")) {
        const fmtStart = new Date(startDate).toLocaleDateString("vi-VN");
        const fmtEnd = new Date(endDate).toLocaleDateString("vi-VN");
        msg = `Khoảng thời gian ${fmtStart} - ${fmtEnd} không trống.`;
      }
      setError(msg);
      if (nextAvail) {
        setNextAvailableDate(nextAvail);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [vehicleId, startDate, endDate, pickupAddress, returnAddress, customerNote, navigate]);

  if (!vehicleId) {
    return (
      <div className="mx-auto max-w-lg pt-10">
        <Alert variant="error" title="Thiếu thông tin">
          Vui lòng chọn xe trước khi đặt. <Link to="/vehicle" className="underline">Quay lại danh sách xe</Link>
        </Alert>
      </div>
    );
  }

  if (loadingVehicle) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/customer/bookings">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Quay lại</Button>
        </Link>
      </div>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Customer</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Đặt xe</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Điền thông tin để gửi yêu cầu thuê xe.</p>
      </section>

      {error && (
        <Alert variant="error" title="Lỗi">
          {error}
          {nextAvailableDate && (
            <div className="mt-2 text-sm">
              Xe có thể thuê từ ngày <strong>{new Date(nextAvailableDate).toLocaleDateString("vi-VN")}</strong>.
              <button type="button" onClick={() => {
                setStartDate(nextAvailableDate + "T00:00");
                setEndDate("");
                setNextAvailableDate(null);
                setError(null);
              }} className="ml-2 font-medium text-brand-700 underline hover:text-brand-800">Chọn ngày này</button>
            </div>
          )}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="space-y-4 rounded-md p-5">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-brand-700" />
            <div>
              <span className="font-medium text-slate-900">{vehicleName || `Xe #${vehicleId}`}</span>
              {vehicle && (
                <p className="text-xs text-slate-500">{formatCurrency(vehicle.pricePerDay)}/ngày</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                <CalendarDays className="mr-1 inline h-3.5 w-3.5" />Nhận xe lúc
              </label>
              <input
                type="datetime-local"
                value={startDate}
                min={today + "T00:00"}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                <CalendarDays className="mr-1 inline h-3.5 w-3.5" />Trả xe lúc
              </label>
              <input
                type="datetime-local"
                value={endDate}
                min={startDate ? startDate.slice(0, 10) + "T00:00" : today + "T00:00"}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              <MapPin className="mr-1 inline h-3.5 w-3.5" />Địa chỉ nhận xe
            </label>
            <input
              type="text"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="VD: 123 Nguyễn Huệ, Quận 1"
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              <MapPin className="mr-1 inline h-3.5 w-3.5" />Địa chỉ trả xe <span className="text-slate-400">(tuỳ chọn)</span>
            </label>
            <input
              type="text"
              value={returnAddress}
              onChange={(e) => setReturnAddress(e.target.value)}
              placeholder="Để trống nếu trả cùng địa chỉ nhận"
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Ghi chú <span className="text-slate-400">(tuỳ chọn)</span></label>
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Yêu cầu đặc biệt..."
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </Card>

        {pricePreview && (
          <Card className="space-y-3 rounded-md p-5">
            <h2 className="text-sm font-bold text-slate-950">Dự kiến chi phí</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">{vehicleName && `${vehicleName} · `}{totalDays} ngày</span>
                <span className="font-medium text-slate-900">{formatCurrency(pricePreview.base)}</span>
              </div>
              {pricePreview.discPct > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-600">
                    <TicketPercent className="h-3.5 w-3.5 text-green-600" />
                    Giảm giá ({pricePreview.discPct}%)
                  </span>
                  <span className="font-medium text-green-600">-{formatCurrency(pricePreview.discAmt)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Phí nền tảng (10%, đã gồm trong giá)</span>
                <span className="font-medium text-slate-900">{formatCurrency(pricePreview.fee)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                <span className="flex items-center gap-1 text-slate-600">
                  <CreditCard className="h-3.5 w-3.5 text-brand-700" />
                  Tiền cọc ({pricePreview.depositPercent}%)
                </span>
                <span className="font-medium text-slate-900">{formatCurrency(pricePreview.deposit)}</span>
              </div>
              <div className="flex items-start justify-between gap-4 rounded-md bg-amber-50 px-3 py-2 text-sm">
                <span className="text-amber-800">Còn lại trả cho chủ xe khi nhận xe</span>
                <span className="shrink-0 font-semibold text-amber-900">{formatCurrency(pricePreview.remaining)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                <span className="flex items-center gap-1 font-semibold text-slate-900">
                  <DollarSign className="h-4 w-4 text-brand-700" />
                  Tổng cộng
                </span>
                <span className="text-lg font-bold text-brand-700">{formatCurrency(pricePreview.total)}</span>
              </div>
            </div>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Gửi yêu cầu đặt xe
          </Button>
        </div>
      </form>
    </div>
  );
}
