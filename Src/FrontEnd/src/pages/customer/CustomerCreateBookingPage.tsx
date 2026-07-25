import { ArrowLeft, CalendarDays, Car, MapPin, TicketPercent, DollarSign, Tag, Loader2, X, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Card from "@/components/ui/Card";
import { createBooking } from "@/features/booking/bookingService";
import { getPublicVehicleById } from "@/features/vehicles/services/publicVehicleService";
import { getVoucherWallet } from "@/features/voucherClaims/services/voucherClaimService";
import type { VoucherClaimResponse } from "@/features/voucherClaims/types";
import { showToast } from "@/components/common/toastStore";
import AddressAutocomplete from "@/features/locations/components/AddressAutocomplete";

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

  const [vehicle, setVehicle] = useState<{ pricePerDay: number; depositPercent: number; platformFeeType?: string; platformFeeValue?: number; platformFeeMinFee?: number; platformFeeMaxFee?: number; securityRequiresDeposit?: boolean; securityDepositAmount?: number } | null>(null);
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

  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{ discountAmount: number; code: string; message?: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [walletVouchers, setWalletVouchers] = useState<VoucherClaimResponse[]>([]);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

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
        setVehicle({ pricePerDay: v.currentPricePerDay ?? v.pricePerDay, depositPercent: v.depositPercent, platformFeeType: v.platformFeeType, platformFeeValue: v.platformFeeValue, platformFeeMinFee: v.platformFeeMinFee, platformFeeMaxFee: v.platformFeeMaxFee, securityRequiresDeposit: v.securityRequiresDeposit, securityDepositAmount: v.securityDepositAmount });
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
    const promoAmt = promoResult?.discountAmount ?? 0;
    const total = Math.max(afterDisc - promoAmt, 0);
    const feeValue = vehicle.platformFeeValue ?? 10;
    const fee = vehicle.platformFeeType === "Fixed" ? Math.min(Math.max(feeValue, vehicle.platformFeeMinFee ?? 0), vehicle.platformFeeMaxFee ?? Infinity) : Math.round(Math.min(Math.max(total * feeValue / 100, vehicle.platformFeeMinFee ?? 0), vehicle.platformFeeMaxFee ?? total));
    const depositPercent = Math.max(20, vehicle.depositPercent || 0);
    const deposit = Math.round(total * depositPercent / 100);
    const remaining = Math.max(total - deposit, 0);
    return { base, discPct, discAmt, fee, deposit, depositPercent, remaining, total };
  }, [vehicle, totalDays, promoResult]);

  const handleValidatePromo = useCallback(async () => {
    if (!promoCode.trim() || !vehicleId || totalDays <= 0) return;
    setPromoLoading(true);
    setPromoError(null);
    setPromoResult(null);
    try {
      const { apiClient } = await import("@/services/apiClient");
      const base = pricePreview ? (pricePreview.base - pricePreview.discAmt + (promoResult?.discountAmount ?? 0)) : 0;
      const res = await apiClient.post("/api/promotions/validate", { code: promoCode.trim(), vehicleId, totalAmount: base });
      const payload = res.data;
      if (payload?.data?.success) {
        setPromoResult({ discountAmount: payload.data.discountAmount, code: payload.data.code });
      } else {
        setPromoError(payload?.data?.message || payload?.message || "Mã không hợp lệ.");
      }
    } catch (err: any) {
      console.error("Promo validate error:", err);
      const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message || "Không thể kiểm tra mã.";
      setPromoError(msg);
    } finally {
      setPromoLoading(false);
    }
  }, [promoCode, vehicleId, totalDays, pricePreview, promoResult]);

  const handleLoadWallet = useCallback(async () => {
    if (walletOpen) { setWalletOpen(false); return; }
    setWalletOpen(true);
    if (walletVouchers.length > 0) return;
    setWalletLoading(true);
    try {
      const data = await getVoucherWallet();
      setWalletVouchers(data.filter(v => !v.usedAt));
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải ví voucher." });
    } finally {
      setWalletLoading(false);
    }
  }, [walletOpen, walletVouchers.length]);

  function handleSelectVoucher(v: VoucherClaimResponse) {
    setPromoCode(v.code);
    setPromoResult(null);
    setPromoError(null);
    setWalletOpen(false);
    setTimeout(() => {
      if (v.code && vehicleId && totalDays > 0) {
        (async () => {
          setPromoLoading(true);
          setPromoError(null);
          setPromoResult(null);
          try {
            const { apiClient } = await import("@/services/apiClient");
            const res = await apiClient.post("/api/promotions/validate", { code: v.code, vehicleId, totalAmount: 0 });
            const payload = res.data;
            if (payload?.data?.success) {
              setPromoResult({ discountAmount: payload.data.discountAmount, code: payload.data.code });
            } else {
              setPromoError(payload?.data?.message || payload?.message || "Mã không hợp lệ.");
            }
          } catch (err: any) {
            const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message || "Không thể kiểm tra mã.";
            setPromoError(msg);
          } finally {
            setPromoLoading(false);
          }
        })();
      }
    }, 100);
  }

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
        promotionCode: promoResult ? promoCode.trim() : undefined,
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

          <AddressAutocomplete
            value={pickupAddress}
            onChange={setPickupAddress}
            onSelect={(addr) => setPickupAddress(addr.address)}
            label="Địa chỉ nhận xe"
            placeholder="Nhập địa chỉ nhận xe"
          />

          <AddressAutocomplete
            value={returnAddress}
            onChange={setReturnAddress}
            onSelect={(addr) => setReturnAddress(addr.address)}
            label="Địa chỉ trả xe (tuỳ chọn)"
            placeholder="Để trống nếu trả cùng địa chỉ nhận"
            resolveCoordinates={false}
          />

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

        <Card className="space-y-3 rounded-md p-5">
          <h2 className="text-sm font-bold text-slate-950">Mã khuyến mãi</h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); setPromoError(null); }}
                placeholder="Nhập mã..."
                className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm uppercase"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              isLoading={promoLoading}
              disabled={!promoCode.trim() || totalDays <= 0}
              onClick={handleValidatePromo}
              className="px-4"
            >
              Áp dụng
            </Button>
          </div>
          {promoError && <p className="text-xs text-red-500">{promoError}</p>}
          <button
            type="button"
            onClick={handleLoadWallet}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            <Wallet className="h-3.5 w-3.5" />
            Chọn từ ví voucher
          </button>
          {walletOpen && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2 max-h-48 overflow-y-auto">
              {walletLoading ? (
                <LoadingSpinner />
              ) : walletVouchers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">Ví voucher trống. <Link to="/customer/voucher-hunt" className="text-brand-600 font-medium">Đi săn mã!</Link></p>
              ) : (
                walletVouchers.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVoucher(v)}
                    className="w-full flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left hover:border-brand-300 hover:bg-brand-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <TicketPercent className="h-4 w-4 text-brand-600" />
                      <div>
                        <span className="text-xs font-bold text-slate-900">{v.code}</span>
                        <span className="ml-2 text-xs text-slate-500">{v.name}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand-700">
                      {v.discountType === "Fixed" ? formatCurrency(v.discountValue) : `-${v.discountValue}%`}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
          {promoResult && (
            <div className="flex items-center justify-between rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm">
              <span className="flex items-center gap-1 text-green-700 font-medium">
                <TicketPercent className="h-4 w-4" />
                {promoResult.code}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-700">-{formatCurrency(promoResult.discountAmount)}</span>
                <button type="button" onClick={() => { setPromoResult(null); setPromoCode(""); }} className="text-slate-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
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
                <span className="text-slate-600">Phí nền tảng ({vehicle?.platformFeeType === "Fixed" ? formatCurrency(vehicle.platformFeeValue ?? 0) : (vehicle?.platformFeeValue ?? 10) + "%"}, đã gồm trong giá)</span>
                <span className="font-medium text-slate-900">{formatCurrency(pricePreview.fee)}</span>
              </div>
              {promoResult && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-green-600">
                    <Tag className="h-3.5 w-3.5" />
                    Mã {promoResult.code}
                  </span>
                  <span className="font-medium text-green-600">-{formatCurrency(promoResult.discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                <span className="flex items-center gap-1 font-semibold text-slate-900">
                  <DollarSign className="h-4 w-4 text-brand-700" />
                  Tổng cộng
                </span>
                <span className="text-lg font-bold text-brand-700">{formatCurrency(pricePreview.total)}</span>
              </div>
            </div>

            <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 space-y-2">
              <h3 className="text-xs font-bold text-brand-800">Lịch thanh toán</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-700">Thanh toán ngay (đặt cọc {pricePreview.depositPercent}%)</span>
                <span className="font-bold text-brand-900">{formatCurrency(pricePreview.deposit)}</span>
              </div>
              {pricePreview.remaining > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-700">Trả khi nhận xe</span>
                  <span className="font-bold text-brand-900">{formatCurrency(pricePreview.remaining)}</span>
                </div>
              )}
              <p className="text-xs text-brand-600">
                Tiền cọc xác nhận đặt xe qua PayOS. Số còn lại thanh toán trực tiếp khi nhận xe.
              </p>
            </div>

            {vehicle?.securityRequiresDeposit && (vehicle.securityDepositAmount ?? 0) > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
                <h3 className="text-xs font-bold text-amber-800">Tiền thế chấp với chủ xe</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-700">Thế chấp khi nhận xe</span>
                  <span className="font-bold text-amber-900">{formatCurrency(vehicle.securityDepositAmount!)}</span>
                </div>
                <p className="text-xs text-amber-600">
                  Số tiền này được thỏa thuận trực tiếp giữa bạn và chủ xe. MoveVN không thu giữ tiền thế chấp.
                </p>
              </div>
            )}
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
