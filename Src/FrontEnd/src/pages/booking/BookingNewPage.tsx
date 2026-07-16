import { ArrowLeft, CalendarDays, Car, MapPin, TicketPercent, CreditCard, DollarSign, Settings, Info, PenLine } from "lucide-react";
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

export default function BookingNewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const vehicleId = Number(searchParams.get("vehicleId"));

  const [vehicle, setVehicle] = useState<{ pricePerDay: number; depositPercent: number; featuredImage?: string | null; images?: any[] } | null>(null);
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
          images: v.images
        });
        setVehicleName(`${v.brandName} ${v.modelName}`);
      })
      .catch((e) => {
        console.error("Error fetching vehicle:", e);
        setError("Không thể tải thông tin xe.");
      })
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
  const [promoCode, setPromoCode] = useState("");

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
            {/* Time */}
            <div>
              <p className="text-[14px] font-semibold mb-2 text-slate-800 dark:text-slate-200">Thời gian thuê</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-3.5 px-4 shadow-sm focus-within:ring-2 focus-within:ring-brand-300 dark:focus-within:ring-brand-500 transition-all border border-slate-200 dark:border-slate-800">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Nhận xe</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="datetime-local" 
                      value={startDate}
                      min={today + "T00:00"}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="bg-transparent text-[14px] w-full outline-none text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 [color-scheme:light] dark:[color-scheme:dark]" 
                    />
                  </div>
                </div>
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-3.5 px-4 shadow-sm focus-within:ring-2 focus-within:ring-brand-300 dark:focus-within:ring-brand-500 transition-all border border-slate-200 dark:border-slate-800">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Trả xe</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="datetime-local" 
                      value={endDate}
                      min={startDate ? startDate.slice(0, 10) + "T00:00" : today + "T00:00"}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="bg-transparent text-[14px] w-full outline-none text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 [color-scheme:light] dark:[color-scheme:dark]" 
                    />
                  </div>
                  {dateError && <p className="mt-1 text-xs text-red-500">{dateError}</p>}
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-[14px] font-semibold mb-2 text-slate-800 dark:text-slate-200 block">Địa chỉ nhận xe</label>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-brand-300 dark:focus-within:ring-brand-500 transition-all border border-slate-200 dark:border-slate-800">
                  <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="VD: 123 Nguyễn Huệ..." 
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    required
                    className="bg-transparent text-[14px] w-full outline-none text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[14px] font-semibold mb-2 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  Địa chỉ trả xe 
                  <span className="text-[11px] bg-[#fdf2d2] dark:bg-amber-900/40 text-[#c99527] dark:text-amber-400 px-2 py-0.5 rounded-md font-medium">Tùy chọn</span>
                </label>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-brand-300 dark:focus-within:ring-brand-500 transition-all border border-slate-200 dark:border-slate-800">
                  <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Để trống nếu trả cùng địa chỉ nhận" 
                    value={returnAddress}
                    onChange={(e) => setReturnAddress(e.target.value)}
                    className="bg-transparent text-[14px] w-full outline-none text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Promo & Note */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Left Side */}
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <label className="text-[14px] font-semibold mb-2 text-slate-800 dark:text-slate-200 block">Mã giảm giá (tuỳ chọn)</label>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-brand-300 dark:focus-within:ring-brand-500 transition-all border border-slate-200 dark:border-slate-800">
                    <TicketPercent className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Nhập mã" 
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="bg-transparent text-[14px] w-full outline-none text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                    />
                  </div>
                </div>

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
                  <span className="text-slate-600 dark:text-slate-400">Phí nền tảng (10%, đã gồm trong giá)</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{formatCurrency(pricePreview.fee)}</span>
                </div>
                {pricePreview.deposit > 0 && (
                  <div className="flex justify-between text-[14px] pt-2 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Tiền cọc ({pricePreview.depositPercent}%)</span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">{formatCurrency(pricePreview.deposit)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 rounded-xl bg-amber-50 px-3 py-2 text-[13px] dark:bg-amber-950/30">
                  <span className="text-amber-800 dark:text-amber-300">Còn lại trả chủ xe khi nhận xe</span>
                  <span className="shrink-0 font-semibold text-amber-900 dark:text-amber-200">{formatCurrency(pricePreview.remaining)}</span>
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
