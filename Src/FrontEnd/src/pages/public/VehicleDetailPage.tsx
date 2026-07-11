import { ArrowLeft, Car, Bike, AlertCircle, MapPin, Gauge, BadgeInfo, Image as ImageIcon, CheckCircle, Phone, CalendarCheck, Star, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
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

const MONTHS = ["Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6", "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12"];
const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function AvailabilityCalendar({ busyPeriods, month, year, onPrev, onNext }: {
  busyPeriods: BusyPeriod[]; month: number; year: number;
  onPrev: () => void; onNext: () => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const days: React.ReactNode[] = [];

  for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} />);

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const date = new Date(year, month, d);
    const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isPast = date.getTime() < todayNorm.getTime();
    const isToday = date.getTime() === todayNorm.getTime();

    const isBusy = busyPeriods.some((bp) => dateStr >= bp.startDate && dateStr <= bp.endDate);

    let cls = "flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ";
    if (isToday) cls += "ring-2 ring-brand-500 font-bold ";
    if (isPast) cls += "text-slate-200 ";
    else if (isBusy) cls += "bg-red-100 text-red-700 font-medium ";
    else cls += "bg-emerald-100 text-emerald-700 ";

    days.push(<div key={d} className={cls + "mx-auto"}>{d}</div>);
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
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAYS.map((d) => <div key={d} className="text-xs font-medium text-slate-400 py-1">{d}</div>)}
        {days}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-emerald-100" /> Có thể thuê</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-full bg-red-100" /> Đã đặt/Chặn</span>
      </div>
    </div>
  );
}

function formatVnd(value: number | null | undefined) {
  return value != null ? `${value.toLocaleString("vi-VN")}đ` : "-";
}

function VehicleDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
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
              {Array.from({ length: 4 }).map((_, i) => (
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
          <Skeleton className="h-32 rounded-xl" />
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
  const [bookingStartDate, setBookingStartDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [busyPeriods, setBusyPeriods] = useState<BusyPeriod[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const todayStr = new Date().toISOString().slice(0, 10);

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

  if (isLoading) return <VehicleDetailSkeleton />;

  if (error || !vehicle) {
    return (
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
    );
  }

  const displayPrice = vehicle.currentPricePerDay ?? vehicle.pricePerDay;
  const vehicleImages = vehicle.images.map((img, idx) => ({
    url: img.imageUrl,
    label: img.isPrimary ? "Ảnh chính" : `Ảnh ${idx + 1}`,
  }));

  function openPreview(images: ImagePreviewItem[], index = 0) {
    setPreviewImages(images);
    setPreviewIndex(index);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate("/vehicle")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{vehicle.brandName} {vehicle.modelName}</h1>
          <p className="text-xs text-slate-500">{vehicle.licensePlate}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
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
              {vehicle.description && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400">Mô tả</label>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{vehicle.description}</p>
                </div>
              )}
            </div>
          </div>

          <AvailabilityCalendar
            busyPeriods={busyPeriods}
            month={calendarMonth}
            year={calendarYear}
            onPrev={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear((y) => y - 1); } else setCalendarMonth((m) => m - 1); }}
            onNext={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear((y) => y + 1); } else setCalendarMonth((m) => m + 1); }}
          />

          {vehicle.features.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <BadgeInfo className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Tính năng</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((f) => (
                  <span key={f.id} className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                    <CheckCircle className="h-3 w-3" /> {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Địa điểm</h2>
            </div>
            <p className="text-sm text-slate-800">{vehicle.address}</p>
            {vehicle.areaName && <p className="mt-1 text-xs text-slate-500">{vehicle.areaName}</p>}
          </div>

          {reviews.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <Star className="h-3.5 w-3.5 text-yellow-500" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Đánh giá ({reviews.length})</h2>
              </div>
              <div className="space-y-3">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Giá thuê</h2>
            <p className="mt-2 text-2xl font-bold text-brand-700">
              {displayPrice.toLocaleString("vi-VN")}đ<span className="text-sm font-normal text-slate-400">/ngày</span>
            </p>
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Thế chấp: </span>
              {vehicle.requiresDeposit ? `${(vehicle.depositAmount ?? 0).toLocaleString("vi-VN")}đ` : "Không yêu cầu"}
            </div>
            <div className="mt-3 flex items-center gap-2">
              {vehicle.vehicleType === "Car" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"><Car className="h-3 w-3" /> Ô tô</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"><Bike className="h-3 w-3" /> Xe máy</span>
              )}
              <span className="text-xs text-slate-400">{vehicle.year}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Đặt xe</h2>
            {token && user ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    <CalendarDays className="mr-1 inline h-3.5 w-3.5" />Nhận xe
                  </label>
                  <input type="date" value={bookingStartDate} min={todayStr}
                    onChange={(e) => setBookingStartDate(e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    <CalendarDays className="mr-1 inline h-3.5 w-3.5" />Trả xe
                  </label>
                  <input type="date" value={bookingEndDate} min={bookingStartDate || todayStr}
                    onChange={(e) => setBookingEndDate(e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-brand-500" />
                </div>
                <Button type="button" onClick={() => {
                  if (bookingStartDate && bookingEndDate && busyPeriods.length > 0) {
                    const overlap = busyPeriods.some((bp) => bookingStartDate <= bp.endDate && bookingEndDate >= bp.startDate);
                    if (overlap) {
                      showToast({ type: "error", title: "Xe không khả dụng", message: "Khoảng thời gian này xe đã có người đặt hoặc bị chặn." });
                      return;
                    }
                  }
                  const params = new URLSearchParams({ vehicleId: String(id) });
                  if (bookingStartDate) params.set("startDate", bookingStartDate);
                  if (bookingEndDate) params.set("endDate", bookingEndDate);
                  navigate(`/customer/bookings/new?${params.toString()}`);
                }}>
                  <CalendarCheck className="h-4 w-4" /> Đặt ngay
                </Button>
              </div>
            ) : (
              <>
                <p className="mt-2 text-xs text-slate-500">Vui lòng đăng nhập để đặt xe hoặc liên hệ chủ xe.</p>
                <div className="mt-4 flex flex-col gap-2">
                  <Button type="button" onClick={() => navigate("/login")}>
                    <Phone className="h-4 w-4" /> Đăng nhập để đặt xe
                  </Button>
                </div>
              </>
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
  );
}
