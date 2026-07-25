import { ArrowLeft, Car, Bike, AlertCircle, MapPin, Gauge, BadgeInfo, Image as ImageIcon, CheckCircle, Phone, CalendarCheck, Star, CalendarDays, ChevronLeft, ChevronRight, User, Clock, ExternalLink, TicketPercent, Tag, X, Wallet, PenLine, CreditCard, DollarSign, Settings, Info } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { getPublicVehicleById, getPublicVehicleImages, getVehicleAvailability } from "@/features/vehicles/services/publicVehicleService";
import type { VehicleResponse, VehicleImageResponse, BusyPeriod } from "@/features/vehicles/types";
import { showToast } from "@/components/common/toastStore";
import { Skeleton } from "@/components/common/Skeleton";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import type { ImagePreviewItem } from "@/components/common/ImagePreviewModal";
import Button from "@/components/common/Button";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getVehicleReviews } from "@/features/review/reviewService";
import type { ReviewResponse } from "@/features/review/reviewService";
import ReviewCard from "@/features/review/components/ReviewCard";
import VehicleLocationMap from "@/features/locations/components/VehicleLocationMap";
import AddressAutocomplete from "@/features/locations/components/AddressAutocomplete";
import { createBooking } from "@/features/booking/bookingService";
import { getVoucherWallet } from "@/features/voucherClaims/services/voucherClaimService";
import type { VoucherClaimResponse } from "@/features/voucherClaims/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const MONTHS = ["Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6", "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12"];
const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatShort(date: Date): string {
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatCurrencyVND(n: number) {
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

type SelectionState = { start: Date | null; end: Date | null };

function AvailabilityCalendar({ busyPeriods, month, year, onPrev, onNext, selection, onSelect }: {
  busyPeriods: BusyPeriod[]; month: number; year: number;
  onPrev: () => void; onNext: () => void;
  selection: SelectionState;
  onSelect: (date: Date) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const busySet = useMemo(() => {
    const set = new Set<string>();
    for (const bp of busyPeriods) {
      const s = new Date(bp.startDate);
      const e = new Date(bp.endDate);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        set.add(formatDate(d));
      }
    }
    return set;
  }, [busyPeriods]);

  const days: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} />);

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = formatDate(date);
    const isPast = date.getTime() < todayNorm.getTime();
    const isToday = date.getTime() === todayNorm.getTime();
    const isBusy = busySet.has(dateStr);
    const isStart = selection.start && dateStr === formatDate(selection.start);
    const isEnd = selection.end && dateStr === formatDate(selection.end);
    const inRange = (() => {
      if (!selection.start || !selection.end) return false;
      const s = formatDate(selection.start);
      const e = formatDate(selection.end);
      return dateStr > s && dateStr < e;
    })();

    const selectable = !isPast && !isBusy;

    let cls = "relative flex h-9 w-9 items-center justify-center text-xs transition-colors ";
    if (isStart) cls += "bg-brand-600 text-white font-bold rounded-l-full ";
    else if (isEnd) cls += "bg-brand-600 text-white font-bold rounded-r-full ";
    else if (inRange) cls += "bg-brand-100 text-brand-800 ";
    else if (isToday) cls += "font-bold ";
    else if (isPast) cls += "text-slate-200 cursor-not-allowed ";
    else if (isBusy) cls += "text-red-400 cursor-not-allowed ";
    else cls += "text-slate-700 dark:text-gray-300 hover:bg-brand-50 dark:bg-brand-900/30 hover:text-brand-700 dark:text-brand-400 cursor-pointer ";

    if ((isStart || isEnd) && dateStr === formatDate(new Date())) cls += "ring-2 ring-white ";

    days.push(
      <div key={d} className="flex justify-center">
        {selectable ? (
          <button type="button" onClick={() => onSelect(date)} className={cls}>
            {isStart && selection.start && selection.end && (
              <span className="absolute inset-y-0 left-1/2 w-1/2 bg-brand-600 -z-10" />
            )}
            {isEnd && selection.start && selection.end && (
              <span className="absolute inset-y-0 right-1/2 w-1/2 bg-brand-600 -z-10" />
            )}
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

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          <CalendarDays className="mr-1.5 inline h-4 w-4 text-brand-700 dark:text-brand-400" />
          Lịch khả dụng
        </h2>
      </div>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={onPrev} className="rounded p-1 text-slate-400 dark:text-gray-500 hover:bg-slate-100 dark:bg-white/5"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{MONTHS[month]} {year}</span>
        <button type="button" onClick={onNext} className="rounded p-1 text-slate-400 dark:text-gray-500 hover:bg-slate-100 dark:bg-white/5"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {DAYS.map((d) => <div key={d} className="text-xs font-medium text-slate-400 dark:text-gray-500 py-1">{d}</div>)}
        {days}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-brand-600" /> Ngày đã chọn</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-brand-100" /> Trong khoảng</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-red-100" /> Đã đặt/Chặn</span>
      </div>
    </div>
  );
}

function VehicleDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] pb-16 text-slate-900 dark:text-white transition-colors duration-300 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 pt-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Skeleton className="aspect-[16/9] w-full rounded-xl" />
            <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5">
              <Skeleton className="mb-4 h-5 w-28" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [vehicleLoadError, setVehicleLoadError] = useState<string | null>(null);
  const [vehicleImages, setVehicleImages] = useState<VehicleImageResponse[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [previewImages, setPreviewImages] = useState<ImagePreviewItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [busyPeriods, setBusyPeriods] = useState<BusyPeriod[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [selection, setSelection] = useState<SelectionState>({ start: null, end: null });

  const [pickupAddress, setPickupAddress] = useState("");
  const [returnAddress, setReturnAddress] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [insurance, setInsurance] = useState(false);
  const [extraHelmet, setExtraHelmet] = useState(true);
  const [pickupHour, setPickupHour] = useState("08:00");
  const [returnHour, setReturnHour] = useState("08:00");

  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{ discountAmount: number; code: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [walletVouchers, setWalletVouchers] = useState<VoucherClaimResponse[]>([]);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setVehicleLoadError(null);
    getPublicVehicleById(Number(id))
      .then((data) => setVehicle(data))
      .catch(() => setVehicleLoadError("Không thể tải thông tin xe."));
    setImagesLoading(true);
    getPublicVehicleImages(Number(id)).then(setVehicleImages).catch(() => {}).finally(() => setImagesLoading(false));
    setReviewsLoading(true);
    getVehicleReviews(Number(id)).then(setReviews).catch(() => {}).finally(() => setReviewsLoading(false));
    setAvailabilityLoading(true);
    getVehicleAvailability(Number(id)).then((d) => d && setBusyPeriods(d.busyPeriods)).catch(() => {}).finally(() => setAvailabilityLoading(false));
  }, [id]);

  useEffect(() => {
    const sd = searchParams.get("startDate");
    const ed = searchParams.get("endDate");
    if (sd && ed) {
      const start = new Date(sd + "T00:00:00");
      const end = new Date(ed + "T00:00:00");
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        setSelection({ start, end });
        setCalendarMonth(start.getMonth());
        setCalendarYear(start.getFullYear());
      }
    }
  }, [searchParams]);

  const busySet = useMemo(() => {
    const set = new Set<string>();
    for (const bp of busyPeriods) {
      const s = new Date(bp.startDate);
      const e = new Date(bp.endDate);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        set.add(formatDate(d));
      }
    }
    return set;
  }, [busyPeriods]);

  const handleSelectDate = useCallback((date: Date) => {
    const dateStr = formatDate(date);
    if (busySet.has(dateStr)) {
      showToast({ type: "error", title: "Ngày không khả dụng", message: "Ngày này đã có người đặt hoặc bị chặn." });
      return;
    }

    setSelection((prev) => {
      if (prev.start && prev.end) {
        return { start: date, end: null };
      }
      if (prev.start && !prev.end) {
        if (formatDate(date) === formatDate(prev.start)) {
          return { start: null, end: null };
        }
        if (date < prev.start) {
          return { start: date, end: null };
        }
        const temp = new Date(prev.start);
        temp.setDate(temp.getDate() + 1);
        let conflictDate: string | null = null;
        while (temp <= date) {
          if (busySet.has(formatDate(temp))) {
            conflictDate = formatDate(temp);
            break;
          }
          temp.setDate(temp.getDate() + 1);
        }
        if (conflictDate) {
          const d = new Date(conflictDate);
          showToast({
            type: "error",
            title: "Khoảng thời gian không khả dụng",
            message: `Ngày ${d.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })} đã được đặt.`,
          });
          return prev;
        }
        return { start: prev.start, end: date };
      }
      return { start: date, end: null };
    });
  }, [busySet]);

  const totalDays = useMemo(() => {
    if (!selection.start || !selection.end) return 0;
    return Math.round((selection.end.getTime() - selection.start.getTime()) / (1000 * 60 * 60 * 24));
  }, [selection]);

  const startDateISO = useMemo(() => selection.start ? formatDate(selection.start) + "T" + pickupHour : "", [selection.start, pickupHour]);
  const endDateISO = useMemo(() => selection.end ? formatDate(selection.end) + "T" + returnHour : "", [selection.end, returnHour]);
  const dateError = startDateISO && endDateISO && new Date(endDateISO) <= new Date(startDateISO) ? "Ngày trả phải sau ngày nhận." : null;

  const pricePreview = useMemo(() => {
    if (!vehicle || totalDays <= 0) return null;
    const displayPrice = vehicle.currentPricePerDay ?? vehicle.pricePerDay;
    const base = displayPrice * totalDays;
    const discPct = getDiscountPercent(totalDays);
    const discAmt = Math.round(base * discPct / 100);
    const afterDisc = base - discAmt;
    const promoAmt = promoResult?.discountAmount ?? 0;
    const total = Math.max(afterDisc - promoAmt, 0);
    const feeValue = (vehicle as any).platformFeeValue ?? 10;
    const fee = (vehicle as any).platformFeeType === "Fixed"
      ? Math.min(Math.max(feeValue, (vehicle as any).platformFeeMinFee ?? 0), (vehicle as any).platformFeeMaxFee ?? Infinity)
      : Math.round(Math.min(Math.max(total * feeValue / 100, (vehicle as any).platformFeeMinFee ?? 0), (vehicle as any).platformFeeMaxFee ?? total));
    const depositPercent = Math.max(20, vehicle.depositPercent || 0);
    const deposit = Math.round(total * depositPercent / 100);
    const remaining = Math.max(total - deposit, 0);
    return { base, discPct, discAmt, fee, deposit, depositPercent, remaining, total, displayPrice };
  }, [vehicle, totalDays, promoResult]);

  const handleValidatePromo = useCallback(async () => {
    if (!promoCode.trim() || !id || totalDays <= 0) return;
    setPromoLoading(true);
    setPromoError(null);
    setPromoResult(null);
    try {
      const { apiClient } = await import("@/services/apiClient");
      const base = pricePreview ? (pricePreview.base - pricePreview.discAmt + (promoResult?.discountAmount ?? 0)) : 0;
      const res = await apiClient.post("/api/promotions/validate", { code: promoCode.trim(), vehicleId: Number(id), totalAmount: base });
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
  }, [promoCode, id, totalDays, pricePreview, promoResult]);

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
  }

  const handleSubmitBooking = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !startDateISO || !endDateISO || !pickupAddress.trim()) {
      setBookingError("Vui lòng chọn ngày và nhập địa chỉ nhận xe.");
      return;
    }
    if (new Date(endDateISO) <= new Date(startDateISO)) {
      setBookingError("Ngày trả phải sau ngày nhận.");
      return;
    }
    setIsSubmitting(true);
    setBookingError(null);
    try {
      const result = await createBooking({
        vehicleId: Number(id),
        startDate: startDateISO,
        endDate: endDateISO,
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
      setBookingError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [id, startDateISO, endDateISO, pickupAddress, returnAddress, customerNote, promoCode, promoResult, navigate]);

  if (!vehicle) {
    if (vehicleLoadError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] pb-16 text-slate-900 dark:text-white transition-colors duration-300 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white">
          <div className="mx-auto max-w-6xl px-4 pt-6">
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <p className="mt-4 text-sm text-red-600">{vehicleLoadError}</p>
                <button type="button" onClick={() => navigate("/vehicle")} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-800">
                  <ArrowLeft className="h-4 w-4" /> Quay lại
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return <VehicleDetailSkeleton />;
  }

  const displayPrice = vehicle.currentPricePerDay ?? vehicle.pricePerDay;
  const previewItems = vehicleImages.map((img, idx) => ({
    url: img.imageUrl,
    label: img.isPrimary ? "Ảnh chính" : `Ảnh ${idx + 1}`,
  }));
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  function openPreview(images: ImagePreviewItem[], index = 0) {
    setPreviewImages(images);
    setPreviewIndex(index);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] pb-16 text-slate-900 dark:text-white transition-colors duration-300 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white">
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate("/vehicle")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 transition-all hover:bg-slate-100 dark:bg-white/5 hover:text-slate-700 dark:text-gray-300">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{vehicle.brandName} {vehicle.modelName}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
              <CheckCircle className="h-3 w-3" /> Đã xác minh
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400">
            <span>{vehicle.licensePlate}</span>
            <span className="text-slate-300">|</span>
            {avgRating != null && (
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400" /> {avgRating.toFixed(1)}
              </span>
            )}
            <span className="text-slate-300">|</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${vehicle.vehicleType === "Car" ? "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400" : "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"}`}>
              {vehicle.vehicleType === "Car" ? <Car className="h-3 w-3" /> : <Bike className="h-3 w-3" />}
              {vehicle.vehicleType === "Car" ? "Ô tô" : "Xe máy"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {imagesLoading ? (
            <Skeleton className="aspect-[16/9] w-full rounded-xl" />
          ) : vehicleImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => openPreview(previewItems, 0)}
                className="col-span-4 overflow-hidden rounded-xl bg-slate-100 dark:bg-white/5"
              >
                <img src={vehicleImages[0].imageUrl} alt="" className="aspect-[16/9] w-full object-cover transition-transform duration-300 hover:scale-105" />
              </button>
              {vehicleImages.slice(1, 5).map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => openPreview(previewItems, idx + 1)}
                  className="overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5"
                >
                  <img src={img.imageUrl} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5">
              {vehicle.vehicleType === "Car" ? <Car className="h-16 w-16 text-slate-300" /> : <Bike className="h-16 w-16 text-slate-300" />}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5">
                <Car className="h-3.5 w-3.5 text-slate-500 dark:text-gray-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Thông tin xe</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 dark:text-gray-500">Biển số</label>
                <p className="mt-1 font-semibold text-slate-800 dark:text-gray-200">{vehicle.licensePlate}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 dark:text-gray-500">Dòng xe</label>
                <p className="mt-1 font-medium text-slate-800 dark:text-gray-200">{vehicle.brandName} {vehicle.modelName}</p>
                {vehicle.variantName && <p className="text-xs text-slate-400 dark:text-gray-500">{vehicle.variantName}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 dark:text-gray-500">Năm sản xuất</label>
                <p className="mt-1 font-medium text-slate-800 dark:text-gray-200">{vehicle.year}</p>
              </div>
              {vehicle.odometerKm != null && (
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-gray-500"><Gauge className="h-3 w-3" /> Số km đã đi</label>
                  <p className="mt-1 font-medium text-slate-800 dark:text-gray-200">{vehicle.odometerKm.toLocaleString("vi-VN")} km</p>
                </div>
              )}
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-gray-500"><User className="h-3 w-3" /> Chủ xe</label>
                <button type="button" onClick={() => navigate(`/users/${vehicle.ownerId}`)} className="mt-1 font-medium text-brand-700 hover:text-brand-800 hover:underline">{vehicle.ownerName || `Chủ xe #${vehicle.ownerId}`}</button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 dark:text-gray-500">Loại xe</label>
                <p className="mt-1">
                  {vehicle.vehicleType === "Car" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-900/30 px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-400"><Car className="h-3 w-3" /> Ô tô</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-900/30 px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-400"><Bike className="h-3 w-3" /> Xe máy</span>
                  )}
                </p>
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-gray-500"><MapPin className="h-3 w-3" /> Địa điểm</label>
                <p className="mt-1 text-sm text-slate-800 dark:text-gray-200">{vehicle.address}</p>
                {vehicle.areaName && <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">{vehicle.areaName}</p>}
              </div>
              {vehicle.description && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 dark:text-gray-500">Mô tả</label>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-gray-400">{vehicle.description}</p>
                </div>
              )}
            </div>
            {vehicle.features.length > 0 && (
              <>
                <hr className="my-4 border-slate-100 dark:border-white/5" />
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5">
                    <BadgeInfo className="h-3 w-3 text-slate-500 dark:text-gray-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Tính năng ({vehicle.features.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((f) => (
                    <span key={f.id} className="inline-flex items-center gap-1 rounded-full border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/30 px-3 py-1.5 text-xs font-medium text-brand-700 dark:text-brand-400">
                      <CheckCircle className="h-3 w-3" /> {f.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {vehicle.latitude != null && vehicle.longitude != null && (
            <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 dark:text-gray-400" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Vị trí</h2>
              </div>
              <p className="mb-3 text-sm text-slate-700 dark:text-gray-300">{vehicle.address}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vehicle.address)}`}
                target="_blank"
                rel="noreferrer"
                className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-xs font-medium text-slate-700 dark:text-gray-300 transition-colors hover:bg-slate-50 dark:bg-white/10 hover:text-slate-900 dark:text-white"
              >
                <MapPin className="h-3.5 w-3.5" />
                Mở Google Maps
                <ExternalLink className="h-3 w-3 text-slate-400 dark:text-gray-500" />
              </a>
              <VehicleLocationMap
                latitude={Number(vehicle.latitude)}
                longitude={Number(vehicle.longitude)}
                address={vehicle.address}
                title={`${vehicle.brandName} ${vehicle.modelName}`}
                className="h-80 w-full"
              />
            </div>
          )}

            <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5">
                <Star className="h-3.5 w-3.5 text-yellow-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Đánh giá khách hàng
                {!reviewsLoading && avgRating != null && (
                  <span className="ml-2 text-sm font-normal text-slate-500 dark:text-gray-400">
                    <Star className="mr-0.5 inline h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {avgRating.toFixed(1)} ({reviews.length} đánh giá)
                  </span>
                )}
              </h2>
            </div>
            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-2 rounded-lg bg-slate-50 dark:bg-white/10 p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-gray-400">Chưa có đánh giá nào.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Giá thuê</h2>
              <p className="text-2xl font-bold text-brand-700 dark:text-brand-400">
                {displayPrice.toLocaleString("vi-VN")}đ<span className="text-sm font-normal text-slate-400 dark:text-gray-500">/ngày</span>
              </p>
            </div>
            <p className="mt-1 text-xs text-emerald-700">Giá đã bao gồm phí nền tảng.</p>
            <div className="mt-2 rounded-lg bg-slate-50 dark:bg-white/10 p-3 text-xs text-slate-600 dark:text-gray-400 space-y-1.5">
              <div>
                <span className="font-semibold text-slate-700 dark:text-gray-300">Tiền cọc: </span>
                {vehicle.depositPercent > 0 ? `${vehicle.depositPercent}% tổng tiền thuê` : "Không yêu cầu"}
              </div>
              {vehicle.securityRequiresDeposit && (
                <div>
                  <span className="font-semibold text-slate-700 dark:text-gray-300">Thế chấp: </span>
                  {vehicle.securityDepositAmount > 0 ? `${vehicle.securityDepositAmount.toLocaleString("vi-VN")} VNĐ` : "Không yêu cầu"}
                </div>
              )}
            </div>

            <hr className="my-4 border-slate-100 dark:border-white/5" />

            {availabilityLoading ? (
              <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5">
                <Skeleton className="mb-3 h-5 w-28" />
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="mx-auto h-9 w-9 rounded" />
                  ))}
                </div>
              </div>
            ) : (
              <AvailabilityCalendar
                busyPeriods={busyPeriods}
                month={calendarMonth}
                year={calendarYear}
                onPrev={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear((y) => y - 1); } else setCalendarMonth((m) => m - 1); }}
                onNext={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear((y) => y + 1); } else setCalendarMonth((m) => m + 1); }}
                selection={selection}
                onSelect={handleSelectDate}
              />
            )}

            <hr className="my-4 border-slate-100 dark:border-white/5" />

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nhận xe</span>
                <span className="font-medium text-slate-800">
                  {selection.start ? `${formatShort(selection.start)} ${pickupHour}` : "Chưa chọn"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Trả xe</span>
                <span className="font-medium text-slate-800">
                  {selection.end ? `${formatShort(selection.end)} ${returnHour}` : "Chưa chọn"}
                </span>
              </div>
              <hr className="border-slate-100 dark:border-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-gray-400">Số ngày</span>
                <span className="font-medium text-slate-800 dark:text-gray-200">{totalDays > 0 ? `${totalDays} ngày` : "-"}</span>
              </div>
              {pricePreview ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{vehicle.brandName} {vehicle.modelName} ({totalDays} ngày)</span>
                    <span className="font-medium text-slate-800">{formatCurrencyVND(pricePreview.base)}</span>
                  </div>
                  {pricePreview.discPct > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Giảm giá ({pricePreview.discPct}%)</span>
                      <span className="font-medium text-green-600">-{formatCurrencyVND(pricePreview.discAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Phí nền tảng (đã gồm trong giá)</span>
                    <span className="text-slate-500">{formatCurrencyVND(pricePreview.fee)}</span>
                  </div>
                  {promoResult && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1 text-green-600">
                        <Tag className="h-3 w-3" /> {promoResult.code}
                      </span>
                      <span className="font-medium text-green-600">-{formatCurrencyVND(promoResult.discountAmount)}</span>
                    </div>
                  )}
                  <hr className="border-slate-100" />
                  <div className="flex items-center justify-between text-lg font-bold text-brand-700">
                    <span>Tổng cộng</span>
                    <span>{formatCurrencyVND(pricePreview.total)}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between text-lg font-bold text-brand-700 dark:text-brand-400">
                  <span>Tổng</span>
                  <span>{(displayPrice * totalDays).toLocaleString("vi-VN")}đ</span>
                </div>
              )}
            </div>

            <hr className="my-4 border-slate-100 dark:border-white/5" />

            {!token || !user ? (
              <Button type="button" onClick={() => navigate("/login")} className="w-full">
                <Phone className="h-4 w-4" /> Đăng nhập để đặt xe
              </Button>
            ) : !selection.start || !selection.end ? (
              <Button type="button" disabled className="w-full">
                <CalendarCheck className="h-4 w-4" /> Chọn ngày trên lịch
              </Button>
            ) : (
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                {bookingError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">{bookingError}</div>
                )}

                <div className="flex gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Giờ nhận xe</label>
                    <select
                      value={pickupHour}
                      onChange={(e) => setPickupHour(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    >
                      {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                        <option key={h} value={`${String(h).padStart(2, "0")}:00`}>{`${String(h).padStart(2, "0")}:00`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Giờ trả xe</label>
                    <select
                      value={returnHour}
                      onChange={(e) => setReturnHour(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    >
                      {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                        <option key={h} value={`${String(h).padStart(2, "0")}:00`}>{`${String(h).padStart(2, "0")}:00`}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <AddressAutocomplete
                    value={pickupAddress}
                    onChange={setPickupAddress}
                    onSelect={(addr) => setPickupAddress(addr.address)}
                    label="Địa chỉ nhận xe *"
                    placeholder="Nhập địa chỉ nhận xe"
                  />
                </div>
                <div className="space-y-1.5">
                  <AddressAutocomplete
                    value={returnAddress}
                    onChange={setReturnAddress}
                    onSelect={(addr) => setReturnAddress(addr.address)}
                    label="Địa chỉ trả xe"
                    placeholder="Trả cùng địa chỉ nhận"
                    resolveCoordinates={false}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Mã khuyến mãi</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); setPromoError(null); }}
                        placeholder="Nhập mã..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2 py-1.5 text-xs uppercase text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      isLoading={promoLoading}
                      disabled={!promoCode.trim() || totalDays <= 0}
                      onClick={handleValidatePromo}
                      className="px-3 py-1.5 text-xs rounded-lg"
                    >
                      Áp dụng
                    </Button>
                  </div>
                  {promoError && <p className="text-[11px] text-red-500">{promoError}</p>}
                  <button
                    type="button"
                    onClick={handleLoadWallet}
                    className="flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700"
                  >
                    <Wallet className="h-3 w-3" /> Chọn từ ví voucher
                  </button>
                  {walletOpen && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1.5 max-h-40 overflow-y-auto">
                      {walletLoading ? (
                        <LoadingSpinner />
                      ) : walletVouchers.length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-1">Ví trống. <Link to="/customer/voucher-hunt" className="text-brand-600 font-medium">Đi săn mã!</Link></p>
                      ) : (
                        walletVouchers.map(v => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectVoucher(v)}
                            className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px] hover:border-brand-300 hover:bg-brand-50 transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              <TicketPercent className="h-3 w-3 text-brand-600" />
                              <span className="font-bold text-slate-900">{v.code}</span>
                              <span className="text-slate-500">{v.name}</span>
                            </div>
                            <span className="font-bold text-brand-700">
                              {v.discountType === "Fixed" ? formatCurrencyVND(v.discountValue) : `-${v.discountValue}%`}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {promoResult && (
                    <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-2.5 py-1.5 text-xs">
                      <span className="flex items-center gap-1 text-green-700 font-medium">
                        <TicketPercent className="h-3 w-3" /> {promoResult.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-green-700">-{formatCurrencyVND(promoResult.discountAmount)}</span>
                        <button type="button" onClick={() => { setPromoResult(null); setPromoCode(""); }} className="text-slate-400 hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {pricePreview && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-1.5 text-xs">
                    <p className="font-bold text-blue-800">Lịch thanh toán</p>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Đặt cọc ({pricePreview.depositPercent}%)</span>
                      <span className="font-bold text-blue-900">{formatCurrencyVND(pricePreview.deposit)}</span>
                    </div>
                    {pricePreview.remaining > 0 && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">Thu khi giao xe</span>
                        <span className="font-bold text-blue-900">{formatCurrencyVND(pricePreview.remaining)}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-blue-600">Khách đặt cọc qua PayOS. Số còn lại thu khi giao xe.</p>
                  </div>
                )}

                {vehicle.securityRequiresDeposit && (vehicle.securityDepositAmount ?? 0) > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1 text-xs">
                    <p className="font-bold text-amber-800">Thế chấp với chủ xe</p>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Khi nhận xe</span>
                      <span className="font-bold text-amber-900">{formatCurrencyVND(vehicle.securityDepositAmount!)}</span>
                    </div>
                    <p className="text-[10px] text-amber-600">Thỏa thuận trực tiếp với chủ xe. MoveVN không thu giữ.</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Ghi chú (tuỳ chọn)</label>
                  <textarea
                    placeholder="Yêu cầu đặc biệt..."
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none resize-none h-16 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!!dateError || !pickupAddress.trim()}
                  isLoading={isSubmitting}
                  variant="primary"
                  className="w-full h-11 rounded-xl text-sm"
                >
                  <span className="flex items-center gap-2">
                    Hoàn tất đặt xe
                    {!isSubmitting && <CreditCard className="w-4 h-4" />}
                  </span>
                </Button>
              </form>
            )}
          </div>

          {vehicleImages.length > 1 && (
            <div className="rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5">
                  <ImageIcon className="h-3.5 w-3.5 text-slate-500 dark:text-gray-400" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Tất cả ảnh ({vehicleImages.length})</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {vehicleImages.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => openPreview(previewItems, idx)}
                    className="overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5"
                  >
                    <img src={img.imageUrl} alt="" className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ImagePreviewModal
        images={previewImages}
        index={previewIndex}
        onIndexChange={setPreviewIndex}
        onClose={() => setPreviewImages([])}
      />
    </div>
    </div>
  );
}
