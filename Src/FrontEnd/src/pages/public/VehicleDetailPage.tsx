import { ArrowLeft, Car, Bike, AlertCircle, MapPin, Gauge, BadgeInfo, Image as ImageIcon, CheckCircle, Phone, CalendarCheck, Star, CalendarDays, ChevronLeft, ChevronRight, User, Clock } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPublicVehicleById, getVehicleAvailability } from "@/features/vehicles/services/publicVehicleService";
import type { VehicleResponse, BusyPeriod } from "@/features/vehicles/types";
import { showToast } from "@/components/common/toastStore";
import { Skeleton } from "@/components/common/Skeleton";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import type { ImagePreviewItem } from "@/components/common/ImagePreviewModal";
import Button from "@/components/common/Button";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getVehicleReviews } from "@/features/review/reviewService";
import type { ReviewResponse } from "@/features/review/reviewService";
import ReviewCard from "@/features/review/components/ReviewCard";
import MapWithPin from "@/features/locations/components/MapWithPin";

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
    else cls += "text-slate-700 hover:bg-brand-50 hover:text-brand-700 cursor-pointer ";

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
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          <CalendarDays className="mr-1.5 inline h-4 w-4 text-brand-700" />
          Lịch khả dụng
        </h2>
      </div>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={onPrev} className="rounded p-1 text-slate-400 hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-medium text-slate-700">{MONTHS[month]} {year}</span>
        <button type="button" onClick={onNext} className="rounded p-1 text-slate-400 hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {DAYS.map((d) => <div key={d} className="text-xs font-medium text-slate-400 py-1">{d}</div>)}
        {days}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-brand-600" /> Ngày đã chọn</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-brand-100" /> Trong khoảng</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-red-100" /> Đã đặt/Chặn</span>
      </div>
    </div>
  );
}

function VehicleDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] pb-16 text-slate-900 transition-colors duration-300 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white">
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
            <div className="rounded-xl border border-slate-200 bg-white p-5">
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
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<ImagePreviewItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [busyPeriods, setBusyPeriods] = useState<BusyPeriod[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [selection, setSelection] = useState<SelectionState>({ start: null, end: null });

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    getPublicVehicleById(Number(id))
      .then((data) => setVehicle(data))
      .catch(() => setError("Không thể tải thông tin xe."))
      .finally(() => setIsLoading(false));
    getVehicleReviews(Number(id)).then(setReviews).catch(() => {});
    getVehicleAvailability(Number(id)).then((d) => d && setBusyPeriods(d.busyPeriods)).catch(() => {});
  }, [id]);

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

  function handleBooking() {
    if (!selection.start || !selection.end) {
      showToast({ type: "error", title: "Chưa chọn đủ ngày", message: "Vui lòng chọn ngày nhận và trả xe trên lịch." });
      return;
    }
    const params = new URLSearchParams({ vehicleId: String(id) });
    params.set("startDate", formatDate(selection.start));
    params.set("endDate", formatDate(selection.end));
    navigate(`/booking/new?${params.toString()}`);
  }

  if (isLoading) return <VehicleDetailSkeleton />;

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] pb-16 text-slate-900 transition-colors duration-300 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white">
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <p className="mt-4 text-sm text-red-600">{error ?? "Không tìm thấy xe."}</p>
              <button type="button" onClick={() => navigate("/vehicle")} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-800">
                <ArrowLeft className="h-4 w-4" /> Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayPrice = vehicle.currentPricePerDay ?? vehicle.pricePerDay;
  const vehicleImages = vehicle.images.map((img, idx) => ({
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
    <div className="min-h-screen bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] pb-16 text-slate-900 transition-colors duration-300 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white">
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate("/vehicle")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">{vehicle.brandName} {vehicle.modelName}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              <CheckCircle className="h-3 w-3" /> Đã xác minh
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
            <span>{vehicle.licensePlate}</span>
            <span className="text-slate-300">|</span>
            {avgRating != null && (
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400" /> {avgRating.toFixed(1)}
              </span>
            )}
            <span className="text-slate-300">|</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${vehicle.vehicleType === "Car" ? "bg-sky-50 text-sky-700" : "bg-violet-50 text-violet-700"}`}>
              {vehicle.vehicleType === "Car" ? <Car className="h-3 w-3" /> : <Bike className="h-3 w-3" />}
              {vehicle.vehicleType === "Car" ? "Ô tô" : "Xe máy"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {vehicle.images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => openPreview(vehicleImages, 0)}
                className="col-span-4 overflow-hidden rounded-xl bg-slate-100"
              >
                <img src={vehicle.images[0].imageUrl} alt="" className="aspect-[16/9] w-full object-cover transition-transform duration-300 hover:scale-105" />
              </button>
              {vehicle.images.slice(1, 5).map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => openPreview(vehicleImages, idx + 1)}
                  className="overflow-hidden rounded-lg bg-slate-100"
                >
                  <img src={img.imageUrl} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-slate-100">
              {vehicle.vehicleType === "Car" ? <Car className="h-16 w-16 text-slate-300" /> : <Bike className="h-16 w-16 text-slate-300" />}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                <Car className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Thông tin xe</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400">Biển số</label>
                <p className="mt-1 font-semibold text-slate-800">{vehicle.licensePlate}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">Dòng xe</label>
                <p className="mt-1 font-medium text-slate-800">{vehicle.brandName} {vehicle.modelName}</p>
                {vehicle.variantName && <p className="text-xs text-slate-400">{vehicle.variantName}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">Năm sản xuất</label>
                <p className="mt-1 font-medium text-slate-800">{vehicle.year}</p>
              </div>
              {vehicle.odometerKm != null && (
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-400"><Gauge className="h-3 w-3" /> Số km đã đi</label>
                  <p className="mt-1 font-medium text-slate-800">{vehicle.odometerKm.toLocaleString("vi-VN")} km</p>
                </div>
              )}
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-slate-400"><User className="h-3 w-3" /> Chủ xe</label>
                <p className="mt-1 font-medium text-slate-800">{vehicle.ownerName || `Chủ xe #${vehicle.ownerId}`}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">Loại xe</label>
                <p className="mt-1">
                  {vehicle.vehicleType === "Car" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"><Car className="h-3 w-3" /> Ô tô</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"><Bike className="h-3 w-3" /> Xe máy</span>
                  )}
                </p>
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-1 text-xs font-medium text-slate-400"><MapPin className="h-3 w-3" /> Địa điểm</label>
                <p className="mt-1 text-sm text-slate-800">{vehicle.address}</p>
                {vehicle.areaName && <p className="mt-0.5 text-xs text-slate-500">{vehicle.areaName}</p>}
              </div>
              {vehicle.description && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400">Mô tả</label>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{vehicle.description}</p>
                </div>
              )}
            </div>
            {vehicle.features.length > 0 && (
              <>
                <hr className="my-4 border-slate-100" />
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100">
                    <BadgeInfo className="h-3 w-3 text-slate-500" />
                  </div>
                  <span className="text-xs font-semibold text-slate-900">Tính năng ({vehicle.features.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((f) => (
                    <span key={f.id} className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                      <CheckCircle className="h-3 w-3" /> {f.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {vehicle.latitude != null && vehicle.longitude != null && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Vị trí</h2>
              </div>
              <p className="mb-3 text-sm text-slate-700">{vehicle.address}</p>
              <MapWithPin
                latitude={Number(vehicle.latitude)}
                longitude={Number(vehicle.longitude)}
                address={vehicle.address}
                className="h-56 w-full rounded-xl z-0"
              />
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                <Star className="h-3.5 w-3.5 text-yellow-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">
                Đánh giá khách hàng
                {avgRating != null && (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    <Star className="mr-0.5 inline h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {avgRating.toFixed(1)} ({reviews.length} đánh giá)
                  </span>
                )}
              </h2>
            </div>
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Chưa có đánh giá nào.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Giá thuê</h2>
              <p className="text-2xl font-bold text-brand-700">
                {displayPrice.toLocaleString("vi-VN")}đ<span className="text-sm font-normal text-slate-400">/ngày</span>
              </p>
            </div>
            <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Thế chấp: </span>
              {vehicle.depositPercent > 0 ? `${vehicle.depositPercent}%` : "Không yêu cầu"}
            </div>

            <hr className="my-4 border-slate-100" />

            <AvailabilityCalendar
              busyPeriods={busyPeriods}
              month={calendarMonth}
              year={calendarYear}
              onPrev={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear((y) => y - 1); } else setCalendarMonth((m) => m - 1); }}
              onNext={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear((y) => y + 1); } else setCalendarMonth((m) => m + 1); }}
              selection={selection}
              onSelect={handleSelectDate}
            />

            <hr className="my-4 border-slate-100" />

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ngày nhận xe</span>
                <span className="font-medium text-slate-800">
                  {selection.start ? formatShort(selection.start) : "Chưa chọn"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ngày trả xe</span>
                <span className="font-medium text-slate-800">
                  {selection.end ? formatShort(selection.end) : "Chưa chọn"}
                </span>
              </div>
              <hr className="border-slate-100" />
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Số ngày</span>
                <span className="font-medium text-slate-800">{totalDays > 0 ? `${totalDays} ngày` : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold text-brand-700">
                <span>Tổng</span>
                <span>{(displayPrice * totalDays).toLocaleString("vi-VN")}đ</span>
              </div>
            </div>

            <hr className="my-4 border-slate-100" />

            {token && user ? (
              <Button type="button" onClick={handleBooking} className="w-full">
                <CalendarCheck className="h-4 w-4" /> Đặt ngay
              </Button>
            ) : (
              <Button type="button" onClick={() => navigate("/login")} className="w-full">
                <Phone className="h-4 w-4" /> Đăng nhập để đặt xe
              </Button>
            )}
          </div>

          {vehicle.images.length > 1 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Tất cả ảnh ({vehicle.images.length})</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {vehicle.images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => openPreview(vehicleImages, idx)}
                    className="overflow-hidden rounded-lg bg-slate-100"
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