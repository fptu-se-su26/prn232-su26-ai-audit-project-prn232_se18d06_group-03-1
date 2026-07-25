import { ArrowLeft, CalendarDays, Car, MapPin, TicketPercent, CreditCard, DollarSign, Settings, Info, PenLine, ChevronLeft, ChevronRight, Tag, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Card from "@/components/ui/Card";
import { createBooking } from "@/features/booking/bookingService";
import { getPublicVehicleById, getVehicleAvailability } from "@/features/vehicles/services/publicVehicleService";
import type { BusyPeriod } from "@/features/vehicles/types";
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

export default function BookingNewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const vehicleId = Number(searchParams.get("vehicleId"));

  const [vehicle, setVehicle] = useState<{ pricePerDay: number; depositPercent: number; featuredImage?: string | null; images?: any[]; platformFeeType?: string; platformFeeValue?: number; platformFeeMinFee?: number; platformFeeMaxFee?: number } | null>(null);
  const [vehicleName, setVehicleName] = useState("");
  const [loadingVehicle, setLoadingVehicle] = useState(true);

  const [startDate, setStartDate] = useState(() => {
    const d = searchParams.get("startDate");
    return d ? d + "T00:00" : "";
  });
  const [endDate, setEndDate] = useState(() => {
    const d = searchParams.get("endDate");
    return d ? d + "T00:00" : "";
  });
  const [pickupAddress, setPickupAddress] = useState("");
  const [returnAddress, setReturnAddress] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [busyPeriods, setBusyPeriods] = useState<BusyPeriod[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calSelection, setCalSelection] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const dateError = startDate && endDate && new Date(endDate) <= new Date(startDate) ? "Ngày trả phải sau ngày nhận." : null;
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!vehicleId) { setLoadingVehicle(false); return; }
    getPublicVehicleById(vehicleId)
      .then((v) => {
        if (!v) {
          setError("Không tìm thấy thông tin xe.");
          return;
        }
        setVehicle({ 
          pricePerDay: v.currentPricePerDay ?? v.pricePerDay, 
          depositPercent: v.depositPercent,
          featuredImage: v.featuredImage,
          images: v.images,
          platformFeeType: v.platformFeeType,
          platformFeeValue: v.platformFeeValue,
          platformFeeMinFee: v.platformFeeMinFee,
          platformFeeMaxFee: v.platformFeeMaxFee
        });
        setVehicleName(`${v.brandName} ${v.modelName}`);
      })
      .catch((e) => {
        console.error("Error fetching vehicle:", e);
        setError("Không thể tải thông tin xe.");
      })
      .finally(() => setLoadingVehicle(false));
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicleId) return;
    getVehicleAvailability(vehicleId).then((d) => { if (d) setBusyPeriods(d.busyPeriods); }).catch(() => {});
  }, [vehicleId]);

  const MONTHS = ["Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6", "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12"];
  const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  function fmtDate(d: Date): string {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const busySet = useMemo(() => {
    const set = new Set<string>();
    for (const bp of busyPeriods) {
      const s = new Date(bp.startDate); const e = new Date(bp.endDate);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) set.add(fmtDate(d));
    }
    return set;
  }, [busyPeriods]);

  function handleCalSelect(date: Date) {
    const ds = fmtDate(date);
    const todayNorm = new Date(); todayNorm.setHours(0, 0, 0, 0);
    if (date.getTime() < todayNorm.getTime()) return;
    if (busySet.has(ds)) return;

    setCalSelection((prev) => {
      if (!prev.start || (prev.start && prev.end)) {
        return { start: date, end: null };
      }
      if (date.getTime() <= prev.start.getTime()) {
        return { start: date, end: null };
      }
      const s = new Date(prev.start); const e = new Date(date);
      for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
        if (busySet.has(fmtDate(d))) {
          showToast({ type: "error", title: "Trùng lịch", message: "Khoảng ngày bạn chọn bị trùng với booking hoặc ngày chặn khác." });
          return { start: date, end: null };
        }
      }
      return { start: prev.start, end: date };
    });
  }

  useEffect(() => {
    if (calSelection.start && calSelection.end) {
      const s = new Date(calSelection.start); s.setHours(0, 0, 0, 0);
      const e = new Date(calSelection.end); e.setHours(23, 59, 0, 0);
      setStartDate(fmtDate(s) + "T08:00");
      setEndDate(fmtDate(e) + "T08:00");
    } else if (calSelection.start && !calSelection.end) {
      const s = new Date(calSelection.start); s.setHours(0, 0, 0, 0);
      setStartDate(fmtDate(s) + "T08:00");
      setEndDate("");
    }
  }, [calSelection]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffMs = e.getTime() - s.getTime();
    if (diffMs <= 0) return 0;
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{ discountAmount: number; code: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

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
      
      showToast({ type: "success", title: "Đặt xe thành công", message: "Vui lòng thanh toán cọc để hoàn tất." });
      navigate(`/booking/${result.id}`);
      
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.errors?.length ? data.errors.join(", ") : data?.message || err?.message || "Không thể tạo booking.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [vehicleId, startDate, endDate, pickupAddress, returnAddress, customerNote, navigate]);

  const [insurance, setInsurance] = useState(false);
  const [extraHelmet, setExtraHelmet] = useState(true);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-10 flex justify-center items-start font-sans text-slate-800 dark:text-slate-100">
      <div className="max-w-[1200px] w-full flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Vehicle Info */}
        <div className="w-full lg:w-[320px] flex flex-col gap-4">
          <Link to="/booking/list" className="inline-block group self-start lg:mt-1">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-700 dark:hover:text-brand-400 transition-colors">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
              Quay lại danh sách
            </div>
          </Link>

          <div className="bg-white dark:bg-slate-900 rounded-3xl flex flex-col items-center shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden w-full">
            
            <div className="w-full h-64 overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img 
                src={vehicle?.featuredImage || (vehicle?.images && vehicle.images.length > 0 ? vehicle.images[0].imageUrl : "https://placehold.co/400x300/f8fafc/94a3b8?text=No+Image")} 
                alt={vehicleName || "Vehicle"} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                onError={(e) => { e.currentTarget.src = "https://placehold.co/400x300/f8fafc/94a3b8?text=Image+Error" }}
              />
            </div>
            
            <div className="p-6 w-full flex flex-col items-center">
              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-5 w-full mb-4 border border-slate-100 dark:border-slate-700">
                <h3 className="text-[15px] font-semibold mb-4 text-slate-800 dark:text-slate-100 text-center">{vehicleName || `Xe #${vehicleId}`}</h3>
                <div className="flex justify-between text-center px-1">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-slate-600 dark:text-slate-400">
                      <Settings className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <span className="text-[13px] text-slate-600 dark:text-slate-400 font-medium">125cc</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-slate-600 dark:text-slate-400">
                      <Car className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <span className="text-[13px] text-slate-600 dark:text-slate-400 font-medium">Automatic</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-slate-600 dark:text-slate-400">
                      <Info className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <span className="text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-tight">Underseat<br/>Storage</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-4 w-full flex items-center gap-4 border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xl shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider mb-0.5">price</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{vehicle ? formatCurrency(vehicle.pricePerDay) : "---"}</span>
                    <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">/ ngày</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Booking Form */}
        <div className="flex-1 flex flex-col gap-6 lg:pl-4">
          <div className="mb-2">
            <h1 className="text-[28px] font-semibold text-slate-800 dark:text-slate-50 mb-1 tracking-tight">Đặt xe</h1>
            <p className="text-[15px] text-slate-600 dark:text-slate-400">Điền thông tin để gửi yêu cầu thuê xe.</p>
          </div>

          {error && (
            <Alert variant="error" title="Lỗi">{error}</Alert>
          )}

          <form id="booking-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Time - Calendar */}
            <div>
              <p className="text-[14px] font-semibold mb-2 text-slate-800 dark:text-slate-200">Thời gian thuê</p>
              {(startDate || endDate) && (
                <div className="mb-3 flex items-center gap-2 text-[13px] text-slate-600 dark:text-slate-400">
                  <CalendarDays className="h-4 w-4 text-brand-600" />
                  <span>
                    {startDate && <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(startDate).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}</span>}
                    {startDate && endDate && <span> → </span>}
                    {endDate && <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(endDate).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}</span>}
                  </span>
                </div>
              )}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); } else setCalendarMonth(calendarMonth - 1); }} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{MONTHS[calendarMonth]} {calendarYear}</span>
                  <button type="button" onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); } else setCalendarMonth(calendarMonth + 1); }} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-center">
                  {DAYS.map((d) => <div key={d} className="text-xs font-medium text-slate-400 py-1">{d}</div>)}
                  {(() => {
                    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                    const todayN = new Date(); const todayNorm = new Date(todayN.getFullYear(), todayN.getMonth(), todayN.getDate());
                    const days: React.ReactNode[] = [];
                    for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} />);
                    for (let d = 1; d <= daysInMonth; d++) {
                      const date = new Date(calendarYear, calendarMonth, d);
                      const ds = fmtDate(date);
                      const isPast = date.getTime() < todayNorm.getTime();
                      const isBusy = busySet.has(ds);
                      const isStart = calSelection.start && ds === fmtDate(calSelection.start);
                      const isEnd = calSelection.end && ds === fmtDate(calSelection.end);
                      const inRange = (() => {
                        if (!calSelection.start || !calSelection.end) return false;
                        const s = fmtDate(calSelection.start); const e = fmtDate(calSelection.end);
                        return ds > s && ds < e;
                      })();
                      const selectable = !isPast && !isBusy;
                      let cls = "relative flex h-8 w-8 items-center justify-center text-xs transition-colors ";
                      if (isStart) cls += "bg-brand-600 text-white font-bold rounded-l-full ";
                      else if (isEnd) cls += "bg-brand-600 text-white font-bold rounded-r-full ";
                      else if (inRange) cls += "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300 ";
                      else if (isPast) cls += "text-slate-200 dark:text-slate-700 cursor-not-allowed ";
                      else if (isBusy) cls += "text-red-400 cursor-not-allowed ";
                      else cls += "text-slate-700 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-700 cursor-pointer ";
                      days.push(
                        <div key={d} className="flex justify-center">
                          {selectable ? (
                            <button type="button" onClick={() => handleCalSelect(date)} className={cls}>
                              {isStart && calSelection.start && calSelection.end && <span className="absolute inset-y-0 left-1/2 w-1/2 bg-brand-600 -z-10" />}
                              {isEnd && calSelection.start && calSelection.end && <span className="absolute inset-y-0 right-1/2 w-1/2 bg-brand-600 -z-10" />}
                              {d}
                            </button>
                          ) : (
                            <span className={cls}>
                              {d}
                              {isBusy && !isPast && <span className="absolute -top-0.5 right-0.5 text-[8px] text-red-400">●</span>}
                            </span>
                          )}
                        </div>
                      );
                    }
                    return days;
                  })()}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-brand-600" /> Đã chọn</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-brand-100 dark:bg-brand-900/40" /> Trong khoảng</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-red-100" /> Đã đặt/Chặn</span>
                </div>
              </div>
              {dateError && <p className="mt-1 text-xs text-red-500">{dateError}</p>}
            </div>

            {/* Addresses */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <AddressAutocomplete
                  value={pickupAddress}
                  onChange={setPickupAddress}
                  onSelect={(addr) => setPickupAddress(addr.address)}
                  label="Địa chỉ nhận xe"
                  placeholder="Nhập địa chỉ nhận xe"
                />
              </div>
              <div className="flex-1">
                <AddressAutocomplete
                  value={returnAddress}
                  onChange={setReturnAddress}
                  onSelect={(addr) => setReturnAddress(addr.address)}
                  label="Địa chỉ trả xe"
                  placeholder="Để trống nếu trả cùng địa chỉ nhận"
                  resolveCoordinates={false}
                />
              </div>
            </div>

            {/* Row 3: Note */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Left Side */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Service Options */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
                  <label className="text-[15px] font-semibold mb-4 text-slate-800 dark:text-slate-100 block">Tùy chọn dịch vụ</label>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[14px] text-slate-700 dark:text-slate-300 font-medium">Bảo hiểm</span>
                    <button 
                      type="button"
                      onClick={() => setInsurance(!insurance)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out flex items-center ${insurance ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${insurance ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[14px] text-slate-700 dark:text-slate-300 font-medium">Mũ bảo hiểm phụ</span>
                    <button 
                      type="button"
                      onClick={() => setExtraHelmet(!extraHelmet)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out flex items-center ${extraHelmet ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${extraHelmet ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex-1 flex flex-col h-full">
                <label className="text-[14px] font-semibold mb-2 text-slate-800 dark:text-slate-200 block">Ghi chú (tuỳ chọn)</label>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-start gap-3 shadow-sm h-full min-h-[150px] focus-within:ring-2 focus-within:ring-brand-300 dark:focus-within:ring-brand-500 transition-all border border-slate-200 dark:border-slate-800">
                  <PenLine className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  <textarea 
                    placeholder="Thêm yêu cầu đặc biệt..."
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="bg-transparent text-[14px] w-full outline-none resize-none h-full text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                  ></textarea>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Cost Summary */}
        <div className="w-full lg:w-[320px] flex flex-col gap-4 lg:pt-16">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-[15px] mb-3 text-slate-800 dark:text-slate-100">Mã khuyến mãi</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); setPromoError(null); }}
                  placeholder="Nhập mã..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-[14px] uppercase text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                isLoading={promoLoading}
                disabled={!promoCode.trim() || totalDays <= 0}
                onClick={handleValidatePromo}
                className="px-4 rounded-xl"
              >
                Áp dụng
              </Button>
            </div>
            {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
            {promoResult && (
              <div className="flex items-center justify-between rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2 text-sm mt-2">
                <span className="flex items-center gap-1 text-green-700 dark:text-green-300 font-medium">
                  <TicketPercent className="h-4 w-4" />
                  {promoResult.code}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-700 dark:text-green-300">-{formatCurrency(promoResult.discountAmount)}</span>
                  <button type="button" onClick={() => { setPromoResult(null); setPromoCode(""); }} className="text-slate-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-[15px] mb-5 text-slate-800 dark:text-slate-100">Tóm tắt chi phí</h3>
            
            {pricePreview ? (
              <div className="space-y-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="flex justify-between text-[14px]">
                  <span className="text-slate-600 dark:text-slate-400 leading-snug">{vehicleName || 'Xe'}<br/>({totalDays} ngày)</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{formatCurrency(pricePreview.base)}</span>
                </div>
                {pricePreview.discPct > 0 && (
                  <div className="flex justify-between text-[14px]">
                    <span className="text-slate-600 dark:text-slate-400">Giảm giá ({pricePreview.discPct}%)</span>
                    <span className="font-medium text-green-600 dark:text-green-400">-{formatCurrency(pricePreview.discAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[14px]">
                  <span className="text-slate-600 dark:text-slate-400">Phí nền tảng ({vehicle?.platformFeeType === "Fixed" ? formatCurrency(vehicle.platformFeeValue ?? 0) : (vehicle?.platformFeeValue ?? 10) + "%"}, đã gồm trong giá)</span>
                   <span className="font-medium text-slate-900 dark:text-slate-50">{formatCurrency(pricePreview.fee)}</span>
                </div>
                {promoResult && (
                  <div className="flex justify-between text-[14px]">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Tag className="h-3.5 w-3.5" />
                      {"Mã "}{promoResult.code}
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">{"-"}{formatCurrency(promoResult.discountAmount)}</span>
                  </div>
                )}
                {pricePreview.deposit > 0 && (
                  <div className="flex justify-between text-[14px] pt-2 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Tổng cộng</span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">{formatCurrency(pricePreview.total)}</span>
                  </div>
                )}

                <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 space-y-2 dark:border-brand-800 dark:bg-brand-950/30">
                  <h3 className="text-xs font-bold text-brand-800 dark:text-brand-300">Lịch thanh toán</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-700 dark:text-brand-400">Khách đặt cọc ({pricePreview.depositPercent}%)</span>
                    <span className="font-bold text-brand-900 dark:text-brand-200">{formatCurrency(pricePreview.deposit)}</span>
                  </div>
                  {pricePreview.remaining > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-700 dark:text-brand-400">Thu khi giao xe</span>
                      <span className="font-bold text-brand-900 dark:text-brand-200">{formatCurrency(pricePreview.remaining)}</span>
                    </div>
                  )}
                  <p className="text-xs text-brand-600 dark:text-brand-400">
                    Khách thanh toán đặt cọc qua PayOS. Số còn lại thu khi giao xe.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-5 text-[14px] text-slate-500 dark:text-slate-500 italic text-center">
                Vui lòng chọn ngày để xem chi phí
              </div>
            )}

            <div className="flex justify-between items-center font-bold">
              <span className="text-[14px] text-slate-800 dark:text-slate-100">Tổng cộng</span>
              <span className="text-brand-700 dark:text-brand-400 text-[22px] font-bold">
                {pricePreview ? formatCurrency(pricePreview.total) : "0đ"}
              </span>
            </div>
          </div>

          <Button 
            type="submit"
            form="booking-form"
            disabled={!!dateError}
            isLoading={isSubmitting}
            variant="primary"
            className="w-full h-14 rounded-2xl text-[15px] group shadow-md"
          >
            <span className="flex items-center gap-2">
              Hoàn tất đặt xe
              {!isSubmitting && <CreditCard className="w-5 h-5 text-brand-50 group-hover:scale-110 transition-transform" />}
            </span>
          </Button>
        </div>

      </div>
    </div>
  );
}
