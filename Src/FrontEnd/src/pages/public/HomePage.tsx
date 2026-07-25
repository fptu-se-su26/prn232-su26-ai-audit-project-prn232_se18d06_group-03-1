import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Car,
  Bike,
  Search,
  Calendar,
  Smartphone,
  Star,
  X,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { getPublicVehicles } from "@/features/vehicles/services/publicVehicleService";
import { getCatalogAreas } from "@/features/vehicles/services/vehicleService";
import type { CatalogArea, VehicleListItemResponse } from "@/features/vehicles/types";
import { blogPosts } from "@/features/blog/blogPosts";
import heroBg from "@/assets/hero-movevn-light.png";
import heroAirportTransfer from "@/assets/hero-airport-transfer.png";
import heroCoastalSuv from "@/assets/hero-coastal-suv.png";
import heroMistyScooters from "@/assets/hero-misty-scooters.png";
import promotionEarlyBooking from "@/assets/promotion-early-booking.png";
import promotionWeekendRoadtrip from "@/assets/promotion-weekend-roadtrip.png";
import promotionScooterEscape from "@/assets/promotion-scooter-escape.png";
import featureSafety from "@/assets/feature-safety.png";
import featureBooking from "@/assets/feature-booking.png";
import featureDigitalPaperwork from "@/assets/feature-digital-paperwork.png";
import featurePayment from "@/assets/feature-payment.png";
import featureDelivery from "@/assets/feature-delivery.png";
import featureVehicleVariety from "@/assets/feature-vehicle-variety.png";

const promotions = [
  {
    image: promotionEarlyBooking,
    title: "Đặt sớm cho hành trình trọn vẹn",
    caption: "Lên lịch trước, nhận xe thật nhẹ nhàng",
  },
  {
    image: promotionWeekendRoadtrip,
    title: "Cuối tuần lên đường theo cách của bạn",
    caption: "Chọn chiếc xe phù hợp cho những cung đường xa",
  },
  {
    image: promotionScooterEscape,
    title: "Xe máy linh hoạt cho mọi điểm đến",
    caption: "Sẵn sàng cho chuyến đi ngắn đầy cảm hứng",
  },
];

const destinations = [
  {
    name: "Hà Nội",
    description: "Những chuyến đi qua phố cổ và ngoại ô xanh mát.",
    image: "https://images.unsplash.com/photo-1529369623266-f5264b696110?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "TP. Hồ Chí Minh",
    description: "Khám phá nhịp sống sôi động theo cách riêng của bạn.",
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "Đà Nẵng",
    description: "Từ biển xanh đến những cung đường quanh bán đảo.",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "Nha Trang",
    description: "Chủ động hành trình biển nắng cùng chiếc xe phù hợp.",
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "Đà Lạt",
    description: "Đón sương sớm và những cung đèo đầy cảm hứng.",
    image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=1400&q=85",
  },
  {
    name: "Phú Quốc",
    description: "Tự do đi dọc bờ biển và khám phá đảo ngọc.",
    image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=85",
  },
];

const features = [
  {
    image: featureSafety,
    title: "An Toàn Tuyệt Đối",
    text: "Xe được kiểm tra kỹ thuật và hỗ trợ bảo hiểm trước mỗi hành trình.",
  },
  {
    image: featurePayment,
    title: "Thanh Toán Đa Dạng",
    text: "Thanh toán rõ ràng, linh hoạt qua các phương thức bảo mật trên MoveVN.",
  },
  {
    image: featureDelivery,
    title: "Giao Xe Tận Nơi",
    text: "Chọn điểm nhận xe thuận tiện tại sân bay, nhà ga hoặc ngay tại nhà.",
  },
  {
    image: featureVehicleVariety,
    title: "Đa Dạng Dòng Xe",
    text: "Từ xe máy gọn nhẹ đến sedan và SUV cho mọi nhu cầu di chuyển.",
  },
  {
    image: featureDigitalPaperwork,
    title: "Thủ Tục Đơn Giản",
    text: "Xác thực nhanh, hợp đồng rõ ràng và mọi thông tin đều được lưu trên ứng dụng.",
  },
  {
    image: featureBooking,
    title: "Hỗ Trợ Trọn Hành Trình",
    text: "Theo dõi lịch nhận trả xe và nhận hỗ trợ xuyên suốt chuyến đi của bạn.",
  },
];

const steps = [
  {
    step: "01",
    title: "Đặt xe",
    desc: "Chọn dòng xe, điểm nhận và thời gian phù hợp với kế hoạch của bạn.",
    icon: Search,
  },
  {
    step: "02",
    title: "Nhận xe",
    desc: "Nhận xe tại điểm hẹn, kiểm tra xe và hoàn tất xác nhận nhanh chóng.",
    icon: Calendar,
  },
  {
    step: "03",
    title: "Di chuyển",
    desc: "Tận hưởng hành trình với chi phí minh bạch và hỗ trợ khi cần thiết.",
    icon: Car,
  },
  {
    step: "04",
    title: "Trả xe",
    desc: "Bàn giao xe theo lịch hẹn và khép lại chuyến đi thật nhẹ nhàng.",
    icon: CheckCircle2,
  },
];

const heroSlides = [
  { src: heroBg, position: "object-[62%_center]" },
  { src: heroCoastalSuv, position: "object-[70%_center]" },
  { src: heroMistyScooters, position: "object-[70%_center]" },
  { src: heroAirportTransfer, position: "object-[72%_center]" },
];

function toDateTimeLocalValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchTab, setSearchTab] = useState<"car" | "motorbike">("car");
  const [searchLoc, setSearchLoc] = useState("");
  const [searchAreaId, setSearchAreaId] = useState<number | null>(null);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [searchStartDate, setSearchStartDate] = useState(() => toDateTimeLocalValue(new Date()));
  const [searchEndDate, setSearchEndDate] = useState(() => toDateTimeLocalValue(new Date(Date.now() + 86_400_000)));
  const [searchError, setSearchError] = useState("");
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  const [vehicles, setVehicles] = useState<VehicleListItemResponse[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [areas, setAreas] = useState<CatalogArea[]>([]);

  const matchingAreas = useMemo(() => {
    const query = searchLoc.trim().toLocaleLowerCase("vi-VN");
    return areas
      .filter((area) => {
        if (!query) return true;
        return `${area.province} ${area.district}`.toLocaleLowerCase("vi-VN").includes(query);
      })
      .slice(0, 8);
  }, [areas, searchLoc]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveHeroIndex((index) => (index + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoadingVehicles(true);
        const data = await getPublicVehicles({ page: 1, pageSize: 6 });
        setVehicles(data.items || []);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
      } finally {
        setLoadingVehicles(false);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    getCatalogAreas().then(setAreas).catch(() => setAreas([]));
  }, []);

  const handleSearch = () => {
    const startDate = new Date(searchStartDate);
    const endDate = new Date(searchEndDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setSearchError("Vui lòng chọn đầy đủ thời gian nhận và trả xe.");
      return;
    }

    if (endDate <= startDate) {
      setSearchError("Thời gian trả xe phải sau thời gian nhận xe.");
      return;
    }

    const params = new URLSearchParams({
      type: searchTab === "car" ? "Car" : "Motorbike",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (searchAreaId) {
      params.set("areaId", String(searchAreaId));
    } else if (searchLoc.trim()) {
      params.set("keyword", searchLoc.trim());
    }

    setSearchError("");
    navigate(`/vehicle?${params.toString()}`);
  };

  return (
    <div className="bg-slate-50 dark:bg-[#0e0e0e] text-slate-800 dark:text-neutral-200 transition-colors duration-300 font-sans selection:bg-brand-500 selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[440px] md:min-h-[490px] lg:min-h-[520px] flex flex-col justify-center overflow-hidden bg-neutral-900 pb-24 pt-12 md:pb-28">
        {/* Background slider with polite scrim overlay */}
        <div className="absolute inset-0 z-0">
          {heroSlides.map((slide, index) => (
            <img
              key={slide.src}
              src={slide.src}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                index === activeHeroIndex ? "opacity-100 scale-[1.01]" : "opacity-0 scale-100"
              } transition-all duration-700 pointer-events-none ${slide.position}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/80 pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full mt-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto drop-shadow-md">
            <span className="text-brand-400">MoveVN</span> — Cùng Bạn Trên <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-purple-300 to-white">Mọi Hành Trình</span>
          </h1>
          <p className="mt-3.5 text-sm sm:text-base text-gray-200 max-w-xl mx-auto font-normal leading-relaxed drop-shadow-sm">
            Trải nghiệm dịch vụ thuê xe <span className="text-white font-semibold">tự lái</span> và <span className="text-white font-semibold">có tài xế</span> <span className="text-brand-300 font-semibold">nhanh chóng</span>, <span className="text-brand-300 font-semibold">minh bạch</span> và <span className="text-brand-300 font-semibold">tiện lợi</span>.
          </p>
        </div>
      </section>

      {/* OVERLAPPING SEARCH BOX (Half on Banner, Half on Page Background) */}
      <div className="relative z-20 max-w-[1280px] xl:max-w-[1360px] w-[96%] sm:w-[94%] mx-auto -mt-20 md:-mt-24 mb-8">
        <div className="rounded-3xl bg-white/95 dark:bg-[#181818]/95 backdrop-blur-2xl p-5 md:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-neutral-800 text-left">
          {/* Type Selector Tabs */}
          <div className="flex max-w-xs mx-auto sm:mx-0 gap-1.5 p-1 bg-slate-100 dark:bg-neutral-900 rounded-2xl mb-5 shadow-inner">
            <button
              type="button"
              onClick={() => setSearchTab("car")}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                searchTab === "car"
                  ? "bg-gradient-to-r from-brand-500 to-purple-600 text-white shadow-md shadow-brand-500/35"
                  : "text-gray-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Car className="w-4 h-4" /> Ô tô
            </button>
            <button
              type="button"
              onClick={() => setSearchTab("motorbike")}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                searchTab === "motorbike"
                  ? "bg-gradient-to-r from-brand-500 to-purple-600 text-white shadow-md shadow-brand-500/35"
                  : "text-gray-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Bike className="w-4 h-4" /> Xe máy
            </button>
          </div>

          {/* Inputs Grid (Explicit single-row horizontal distribution on Desktop) */}
          <form
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.35fr_1.35fr_180px] gap-3 sm:gap-4 items-stretch"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            {/* Location Input */}
            <div className="relative group">
              <label className="block text-[11px] font-bold text-brand-400 dark:text-brand-300 absolute top-1.5 left-10 z-10 pointer-events-none">
                Địa điểm nhận xe
              </label>
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-brand-500 transition-colors z-10 pointer-events-none" />
              <input
                type="text"
                value={searchLoc}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchLoc(value);
                  setSearchAreaId(null);
                  setSearchError("");
                  setLocationMenuOpen(value.trim().length >= 2);
                }}
                onFocus={() => setLocationMenuOpen(searchLoc.trim().length >= 2)}
                onBlur={() => setLocationMenuOpen(false)}
                placeholder="Nhập thành phố, quận/huyện..."
                className="w-full bg-slate-50/90 dark:bg-neutral-900/90 hover:bg-slate-100 dark:hover:bg-neutral-800/80 border border-slate-200/80 dark:border-neutral-800 rounded-2xl h-14 pl-10 pr-10 pt-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-400 focus:bg-white dark:focus:bg-neutral-900 outline-none transition-all truncate"
              />
              {searchLoc && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setSearchLoc("");
                    setSearchAreaId(null);
                    setLocationMenuOpen(false);
                  }}
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-neutral-700 dark:hover:text-white"
                  aria-label="Xóa địa điểm"
                  title="Xóa địa điểm"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {locationMenuOpen && searchLoc.trim().length >= 2 && areas.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10 dark:border-neutral-700 dark:bg-neutral-900">
                  {matchingAreas.length > 0 ? (
                    matchingAreas.map((area) => {
                      const label = `${area.province} - ${area.district}`;
                      return (
                        <button
                          key={area.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setSearchLoc(label);
                            setSearchAreaId(area.id);
                            setLocationMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-brand-50 hover:text-brand-700 dark:text-gray-200 dark:hover:bg-brand-900/30 dark:hover:text-brand-300"
                        >
                          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{label}</span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="px-3 py-2.5 text-sm text-slate-500 dark:text-gray-400">Không tìm thấy khu vực phù hợp.</p>
                  )}
                </div>
              )}
            </div>

            {/* Start Date */}
            <div className="relative group">
              <label className="block text-[11px] font-bold text-brand-400 dark:text-brand-300 absolute top-1.5 left-10 z-10 pointer-events-none">
                Ngày nhận xe
              </label>
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-brand-500 transition-colors z-10 pointer-events-none" />
              <input
                type="datetime-local"
                value={searchStartDate}
                onChange={(event) => {
                  setSearchStartDate(event.target.value);
                  setSearchError("");
                }}
                className="w-full bg-slate-50/90 dark:bg-neutral-900/90 hover:bg-slate-100 dark:hover:bg-neutral-800/80 border border-slate-200/80 dark:border-neutral-800 rounded-2xl h-14 pl-10 pr-3 pt-3.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-400 focus:bg-white dark:focus:bg-neutral-900 outline-none transition-all cursor-pointer"
              />
            </div>

            {/* End Date */}
            <div className="relative group">
              <label className="block text-[11px] font-bold text-brand-400 dark:text-brand-300 absolute top-1.5 left-10 z-10 pointer-events-none">
                Ngày trả xe
              </label>
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-brand-500 transition-colors z-10 pointer-events-none" />
              <input
                type="datetime-local"
                min={searchStartDate || undefined}
                value={searchEndDate}
                onChange={(event) => {
                  setSearchEndDate(event.target.value);
                  setSearchError("");
                }}
                className="w-full bg-slate-50/90 dark:bg-neutral-900/90 hover:bg-slate-100 dark:hover:bg-neutral-800/80 border border-slate-200/80 dark:border-neutral-800 rounded-2xl h-14 pl-10 pr-3 pt-3.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-400 focus:bg-white dark:focus:bg-neutral-900 outline-none transition-all cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <div className="flex">
              <button
                type="submit"
                className="w-full h-14 px-6 rounded-2xl bg-gradient-to-r from-brand-500 via-purple-500 to-fuchsia-500 hover:from-brand-400 hover:via-purple-400 hover:to-fuchsia-400 text-white font-black text-sm tracking-wide shadow-xl shadow-brand-500/40 transition-all hover:scale-[1.01] active:scale-95 flex justify-center items-center gap-2 cursor-pointer"
              >
                <Search className="h-4 w-4 stroke-[2.5]" /> TÌM XE
              </button>
            </div>
            {searchError && (
              <p className="sm:col-span-2 lg:col-span-4 -mt-1 text-sm font-medium text-rose-600" role="alert">
                {searchError}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* 2. PROMOTIONS CAROUSEL */}
      <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Chương Trình Khuyến Mãi
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto font-normal">
            Khám phá các ưu đãi đặc quyền từ MoveVN cho chuyến đi sắp tới.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo) => (
            <div
              key={promo.title}
              className="group relative aspect-[16/10] min-w-0 overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm transition-transform duration-300 hover:-translate-y-1 dark:border-neutral-800"
            >
              <img
                src={promo.image}
                alt={promo.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/85 via-black/25 to-transparent p-5">
                <div>
                  <span className="block text-base font-bold tracking-tight text-white sm:text-lg">
                    {promo.title}
                  </span>
                  <span className="mt-0.5 inline-block text-[11px] font-bold uppercase tracking-wider text-brand-300">
                    {promo.caption}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. DESTINATIONS */}
      <section className="border-y border-slate-200/70 bg-white py-20 dark:border-neutral-800/80 dark:bg-[#121212]">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-500 dark:text-brand-400">
                Khám Phá Điểm Đến
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Địa Điểm Nổi Bật
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-neutral-400">
                Chọn điểm đến, tìm chiếc xe phù hợp và bắt đầu hành trình theo nhịp của riêng bạn.
              </p>
            </div>
            <Link
              to="/vehicle"
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 transition hover:text-brand-500 dark:text-brand-400"
            >
              Xem tất cả xe
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {destinations.map((dest) => (
            <Link
              key={dest.name}
              to={`/vehicle?keyword=${encodeURIComponent(dest.name)}`}
              className="group relative aspect-[16/10] overflow-hidden rounded-lg border border-slate-200/70 bg-slate-950 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800"
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-200">
                    <MapPin className="h-3.5 w-3.5" />
                    Điểm đến được yêu thích
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-white">{dest.name}</h3>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-200">{dest.description}</p>
                </div>
                <span className="mb-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition group-hover:bg-brand-500 group-hover:border-brand-500">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURES */}
      <section className="relative overflow-hidden bg-[#f5f3ff] py-20 transition-colors dark:bg-[#17121f] sm:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-brand-200 dark:bg-brand-900" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center sm:mb-16">
            <span className="text-[11px] font-black tracking-widest text-brand-500 dark:text-brand-400 uppercase block mb-1">
              Tiêu Chuẩn MoveVN
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Sự Khác Biệt Cho Trải Nghiệm Thuê Xe
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-neutral-300 sm:text-base">
              Cung cấp giải pháp di chuyển minh bạch, chuyên nghiệp và đáng tin cậy trên nền tảng công nghệ tối ưu.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item) => (
              <article key={item.title} className="group flex flex-col items-center text-center">
                <div className="relative aspect-square w-full max-w-[235px] sm:max-w-[250px]">
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-5 bottom-3 top-9 rounded-lg border border-white/80 bg-white/70 shadow-[0_20px_35px_-28px_rgba(76,29,149,0.55)] dark:border-white/10 dark:bg-white/5"
                  />
                  <img
                    src={item.image}
                    alt=""
                    className="relative h-full w-full rounded-lg object-cover shadow-[0_26px_38px_-28px_rgba(76,29,149,0.6)] transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_30px_45px_-28px_rgba(76,29,149,0.7)]"
                  />
                </div>
                <div className="max-w-[300px] px-2 pt-5">
                  <h3 className="text-lg font-extrabold tracking-tight text-slate-950 transition-colors group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-neutral-300">
                    {item.text}
                  </p>
                  <div className="mx-auto mt-4 h-0.5 w-11 bg-brand-500 transition-all duration-300 group-hover:w-20" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SERVICES (Self-Drive vs Chauffeur) */}
      <section className="py-16 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dịch Vụ Nổi Bật Của MoveVN
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-neutral-400 max-w-md mx-auto">
            Linh hoạt lựa chọn theo đúng nhu cầu cho công việc hoặc du lịch cá nhân.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Service 1: Tự lái */}
          <div className="relative rounded-3xl overflow-hidden h-72 sm:h-80 md:h-96 group shadow-md border border-slate-200/50 dark:border-neutral-800">
            <img
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"
              alt="Thuê Xe Tự Lái"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8 text-white">
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2 text-brand-300">
                Thuê Xe Tự Lái
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 max-w-sm font-normal leading-relaxed mb-6">
                Tự do điều khiển hành trình riêng tư bên gia đình, phong cách, tiện dụng với kho xe đa dạng.
              </p>
              <div>
                <Link
                  to="/vehicle?type=car"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white font-black text-xs tracking-wider uppercase shadow-lg shadow-brand-500/40 transition-all"
                >
                  Tìm xe tự lái
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Service 2: Có Tài xế */}
          <div className="relative rounded-3xl overflow-hidden h-72 sm:h-80 md:h-96 group shadow-md border border-slate-200/50 dark:border-neutral-800">
            <img
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80"
              alt="Thuê Xe Có Tài Xế"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8 text-white">
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2 text-brand-300">
                Thuê Xe Có Tài Xế
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 max-w-sm font-normal leading-relaxed mb-6">
                Tài xế chuyên nghiệp, lịch sự, phục vụ nhu cầu đưa đón đối tác quan trọng, công tác hoặc đường dài.
              </p>
              <div>
                <Link
                  to="/vehicle?type=car"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-black text-xs tracking-wider uppercase shadow-lg transition-all"
                >
                  Đặt xe tài xế
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS */}
      <section className="border-y border-slate-200/80 bg-[#f7f5ff] py-20 transition-colors dark:border-neutral-800 dark:bg-[#121212] sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-14">
            <span className="text-[11px] font-black tracking-widest text-brand-500 dark:text-brand-400 uppercase block mb-1">
              Quy Trình Hoạt Động
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Hướng Dẫn Đặt Xe Đơn Giản
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-neutral-300 sm:text-base">
              Bắt đầu hành trình của bạn chỉ với bốn bước rõ ràng, minh bạch và dễ theo dõi.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_22px_40px_-34px_rgba(76,29,149,0.45)] dark:border-neutral-800 dark:bg-[#17131e]">
            <div className="grid grid-cols-1 divide-y divide-slate-200 dark:divide-neutral-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              {steps.map((s) => {
                const IconComponent = s.icon;

                return (
                  <article key={s.step} className="group relative min-h-[218px] overflow-hidden p-7 sm:p-8">
                    <div className="relative z-10 mb-7 flex items-center justify-between">
                      <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-brand-600 px-2 text-xs font-black text-white shadow-[0_10px_18px_-12px_rgba(109,40,217,0.9)]">
                        {s.step}
                      </span>
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-600 transition-transform duration-300 group-hover:-translate-y-1 dark:border-brand-900/60 dark:bg-brand-950/30 dark:text-brand-300">
                        <IconComponent className="h-5 w-5 stroke-[2]" />
                      </div>
                    </div>
                    <h3 className="relative z-10 text-lg font-extrabold tracking-tight text-slate-950 dark:text-white">
                      {s.title}
                    </h3>
                    <p className="relative z-10 mt-2 text-sm leading-6 text-slate-600 dark:text-neutral-300">
                      {s.desc}
                    </p>
                    <div className="absolute bottom-0 left-0 h-1 w-0 bg-brand-500 transition-all duration-300 group-hover:w-full" />
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 8. FEATURED VEHICLES */}
      <section className="py-16 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Xe Nổi Bật Gợi Ý Cho Bạn
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
              Danh sách các mẫu xe được yêu thích và đánh giá cao nhất trong tuần.
            </p>
          </div>
          <Link
            to="/vehicle"
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors group"
          >
            Xem tất cả xe
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingVehicles ? (
            <div className="col-span-full flex justify-center py-16">
              <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
            </div>
          ) : vehicles.length === 0 ? (
            [1, 2, 3].map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-[#151515] p-5 shadow-sm">
                <div className="aspect-[16/10] bg-slate-100 dark:bg-neutral-800 rounded-xl overflow-hidden relative mb-4">
                  <img src={`https://images.unsplash.com/photo-${idx === 0 ? '1549317661-bd32c8ce0db2' : idx === 1 ? '1502877338535-766e1452684a' : '1541899481282-d53bffe3c35d'}?auto=format&fit=crop&w=600&q=80`} alt="Car" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-neutral-400 mb-2">
                  <span>TP. Hồ Chí Minh</span>
                  <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 5.0
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">VinFast VF8 2026</h3>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between">
                  <span className="text-base font-black text-brand-600 dark:text-brand-400">
                    1.200.000đ<span className="text-xs font-normal text-gray-500"> /ngày</span>
                  </span>
                  <Link to="/vehicle" className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black hover:bg-brand-500 dark:hover:bg-brand-400 dark:hover:text-slate-950 transition-colors">
                    Thuê Ngay
                  </Link>
                </div>
              </div>
            ))
          ) : (
            vehicles.map((v) => (
              <div
                key={v.id}
                className="group rounded-2xl border border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-[#151515] p-5 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/10] bg-slate-100 dark:bg-neutral-800 rounded-xl overflow-hidden relative mb-4">
                    <img
                      src={v.featuredImage || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80"}
                      alt={`${v.brandName} ${v.modelName}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md text-brand-600 dark:text-brand-400 text-[11px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                      {v.vehicleType?.toLowerCase() === "motorbike" ? "Xe Máy" : "Ô tô"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-neutral-400 mb-2">
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                      {v.areaName || "TP. Hồ Chí Minh"}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {v.averageRating || "5.0"}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {v.brandName} {v.modelName} {v.variantName || ""}
                  </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between">
                  <span className="text-base font-black text-brand-600 dark:text-brand-400">
                    {(v.pricePerDay || 0).toLocaleString("vi-VN")}đ<span className="text-xs font-normal text-gray-500"> /ngày</span>
                  </span>
                  <Link
                    to={`/vehicle/${v.id}`}
                    className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black hover:bg-brand-500 dark:hover:bg-brand-400 dark:hover:text-slate-950 transition-all active:scale-95"
                  >
                    Thuê Ngay
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 9. DUAL CTA BANNERS */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="group overflow-hidden rounded-lg border border-brand-100 bg-[#fbf9ff] shadow-[0_20px_45px_-32px_rgba(109,40,217,0.38)] transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_24px_52px_-30px_rgba(109,40,217,0.46)] dark:border-brand-900/60 dark:bg-[#17131f]">
            <div className="grid min-h-[300px] sm:grid-cols-[minmax(0,1fr)_220px]">
              <div className="flex flex-col justify-center px-7 py-8 sm:px-9 sm:py-10">
                <span className="text-[11px] font-black uppercase tracking-widest text-brand-700 dark:text-brand-300">
                  Dành Cho Người Thuê
                </span>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  Hiểu rõ mọi bước trước khi bắt đầu hành trình.
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-gray-300">
                  Giá thuê minh bạch, quy trình dễ theo dõi và hỗ trợ luôn sẵn sàng trong suốt chuyến đi.
                </p>
                <Link
                  to="/how-it-works"
                  className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
                >
                  Khám Phá Quy Trình
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="relative min-h-56 overflow-hidden border-t border-brand-100 bg-brand-50 sm:min-h-0 sm:border-l sm:border-t-0 dark:border-brand-900/60 dark:bg-brand-950/30">
                <img
                  src={featureBooking}
                  alt="Đặt xe nhanh chóng trên MoveVN"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </article>

          <article className="group overflow-hidden rounded-lg border border-fuchsia-100 bg-[#f7f2ff] shadow-[0_20px_45px_-32px_rgba(192,38,211,0.34)] transition hover:-translate-y-0.5 hover:border-fuchsia-200 hover:shadow-[0_24px_52px_-30px_rgba(192,38,211,0.42)] dark:border-fuchsia-900/50 dark:bg-[#1d1426]">
            <div className="grid min-h-[300px] sm:grid-cols-[minmax(0,1fr)_220px]">
              <div className="flex flex-col justify-center px-7 py-8 sm:px-9 sm:py-10">
                <span className="text-[11px] font-black uppercase tracking-widest text-fuchsia-700 dark:text-fuchsia-300">
                  Dành Cho Chủ Xe
                </span>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  Biến chiếc xe nhàn rỗi thành nguồn thu chủ động.
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-gray-300">
                  Niêm yết xe nhanh, chủ động lựa chọn khách và quản lý thu nhập trên một nền tảng duy nhất.
                </p>
                <Link
                  to="/how-it-works"
                  className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg border border-brand-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-brand-800 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200 dark:hover:bg-brand-950/70"
                >
                  Đăng Ký Cho Thuê
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="relative min-h-56 overflow-hidden border-t border-fuchsia-100 bg-fuchsia-50 sm:min-h-0 sm:border-l sm:border-t-0 dark:border-fuchsia-900/50 dark:bg-fuchsia-950/20">
                <img
                  src={featureVehicleVariety}
                  alt="Đăng xe và quản lý thu nhập trên MoveVN"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* 10. APP DOWNLOAD BANNER */}
      <section className="mx-auto mb-14 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border border-brand-100 bg-[#f5f2ff] shadow-[0_24px_54px_-36px_rgba(109,40,217,0.46)] dark:border-brand-900/60 dark:bg-[#17131f]">
          <div className="grid items-center gap-10 px-7 py-10 sm:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-14 lg:py-12">
            <div className="max-w-xl text-center lg:text-left">
              <span className="text-[11px] font-black uppercase tracking-widest text-brand-700 dark:text-brand-300">
                Ứng Dụng Di Động
              </span>
              <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                MoveVN đồng hành trong từng chặng đường.
              </h3>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-gray-300 sm:text-base">
                Quản lý lịch thuê, theo dõi xác thực giấy tờ và trò chuyện trực tiếp với chủ xe ngay trong tầm tay.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-bold text-slate-600 dark:text-gray-300 lg:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Quản lý chuyến đi
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Nhắn tin realtime
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Thông báo tức thời
                </span>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <button
                  type="button"
                  onClick={() => alert("Ứng dụng App Store đang trong quá trình phát hành!")}
                  className="flex items-center gap-3 rounded-lg border border-brand-200 bg-white px-4 py-3 text-left text-slate-900 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 dark:border-[#4a4058] dark:bg-[#211b2b] dark:text-white dark:hover:border-brand-700 dark:hover:bg-[#2a2236]"
                >
                  <Smartphone className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-300" />
                  <span>
                    <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-gray-400">Tải trên</span>
                    <span className="block text-sm font-black">App Store</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("Ứng dụng Google Play đang trong quá trình phát hành!")}
                  className="flex items-center gap-3 rounded-lg border border-brand-200 bg-white px-4 py-3 text-left text-slate-900 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 dark:border-[#4a4058] dark:bg-[#211b2b] dark:text-white dark:hover:border-brand-700 dark:hover:bg-[#2a2236]"
                >
                  <Smartphone className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-300" />
                  <span>
                    <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-gray-400">Tải trên</span>
                    <span className="block text-sm font-black">Google Play</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-[220px] overflow-hidden rounded-[28px] border-[7px] border-brand-200 bg-white shadow-[0_24px_50px_-24px_rgba(109,40,217,0.55)] dark:border-brand-800 dark:bg-[#211b2b] sm:w-[240px]">
                <div className="mx-auto h-5 w-24 rounded-b-xl bg-brand-200 dark:bg-brand-800" />
                <img
                  src={featureDigitalPaperwork}
                  alt="Giao diện ứng dụng MoveVN"
                  className="aspect-square w-full object-cover"
                />
                <div className="flex items-center justify-between border-t border-brand-100 px-4 py-3 text-[10px] font-bold text-slate-500 dark:border-brand-900/60 dark:text-gray-400">
                  <span className="text-slate-700 dark:text-gray-200">MoveVN</span>
                  <span className="text-brand-700 dark:text-brand-300">Sẵn sàng đồng hành</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. BLOG */}
      <section className="border-t border-slate-200/70 bg-slate-50 py-16 dark:border-neutral-800/80 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
                Góc hỏi đáp & cẩm nang
              </span>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Kinh nghiệm cho hành trình trọn vẹn
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-neutral-300">
                Những hướng dẫn thực tế về chọn xe, nhận xe và chuẩn bị chuyến đi
                từ MoveVN.
              </p>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-brand-700 transition hover:text-brand-800 dark:text-brand-300"
            >
              Xem tất cả bài viết
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-700"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-neutral-800">
                  <img
                    src={post.heroImage}
                    alt={post.heroAlt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-3 text-[11px] font-extrabold">
                    <span className="uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">
                      {post.category}
                    </span>
                    <span className="text-slate-500 dark:text-neutral-400">
                      {post.publishedAt}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-black leading-snug text-slate-900 transition-colors group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                    {post.title}
                  </h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-neutral-300">
                    {post.excerpt}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-extrabold text-brand-700 dark:text-brand-300">
                    Đọc bài viết
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
