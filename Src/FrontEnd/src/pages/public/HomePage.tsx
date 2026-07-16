import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CarFront,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Car,
  Bike,
  Compass,
  ArrowUpRight,
  Star
} from "lucide-react";
import { useState, useEffect } from "react";
import { getPublicVehicles } from "@/features/vehicles/services/publicVehicleService";
import type { VehicleListItemResponse } from "@/features/vehicles/types";
import heroBg from "@/assets/hero-bg.jpg";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const steps = [
  { 
    number: "01",
    title: "Cách chọn xe", 
    text: "Lọc theo khu vực, ngày thuê, loại xe và ngân sách nhanh chóng." 
  },
  { 
    number: "02",
    title: "Hạch toán rõ hơn", 
    text: "MoveVN giúp hiển thị giá và tiền cọc một cách minh bạch." 
  },
  { 
    number: "03",
    title: "Tiện ích đa dạng", 
    text: "Trải nghiệm các tiện ích tiện lợi, nhanh chóng cho mọi hành trình." 
  },
];

const reasons = [
  {
    icon: ShieldCheck,
    title: "An toàn tuyệt đối",
    text: "Xe được kiểm định nghiêm ngặt, hỗ trợ bảo hiểm đầy đủ và cứu hộ 24/7 trên mọi nẻo đường.",
  },
  {
    icon: CarFront,
    title: "Đa dạng lựa chọn",
    text: "Đầy đủ các dòng xe từ ô tô tự lái tiện nghi đến xe máy linh hoạt, đáp ứng mọi ngân sách.",
  },
  {
    icon: CheckCircle2,
    title: "Minh bạch giá cả",
    text: "Cam kết giá hiển thị là trọn gói, không phát sinh chi phí ẩn hay phụ phí bất thường.",
  },
];

const destinations = [
  {
    name: "Hà Nội",
    image: "https://images.unsplash.com/photo-1509060464153-4466739f76d0?auto=format&fit=crop&w=600&q=80",
    count: "300+ xe",
    time: "Tại thời điểm tháng 07/2026"
  },
  {
    name: "TP Hồ Chí Minh",
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=600&q=80",
    count: "700+ xe",
    time: "Tại thời điểm tháng 07/2026"
  },
  {
    name: "Đà Nẵng",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    count: "30+ xe",
    time: "Tại thời điểm tháng 07/2026"
  },
  {
    name: "Nha Trang",
    image: "https://images.unsplash.com/photo-1571401888144-17f1053c0765?auto=format&fit=crop&w=600&q=80",
    count: "40+ xe",
    time: "Tại thời điểm tháng 07/2026"
  },
  {
    name: "Đà Lạt",
    image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=600&q=80",
    count: "20+ xe",
    time: "Tại thời điểm tháng 07/2026"
  },
  {
    name: "Vũng Tàu",
    image: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c27e?auto=format&fit=crop&w=600&q=80",
    count: "40+ xe",
    time: "Tại thời điểm tháng 07/2026"
  }
];

const guides = [
  {
    title: "Trải nghiệm thuê xe tự lái 4 chỗ cho người mới",
    desc: "Chia sẻ kinh nghiệm hữu ích từ khâu kiểm tra xe, giấy tờ cần thiết đến các lưu ý khi đi đường dài.",
    image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80",
    date: "05/07/2026"
  },
  {
    title: "Tập hợp các cung đường phượt tuyệt đẹp bằng xe máy",
    desc: "Những hành trình ven biển lý tưởng và các đèo dốc thử thách cho dân đam mê dịch chuyển tự do.",
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80",
    date: "02/07/2026"
  },
  {
    title: "Kinh nghiệm du lịch xe tự lái an toàn cùng cả gia đình",
    desc: "Cách chuẩn bị hành lý, tối ưu không gian ghế ngồi và lên lộ trình trạm dừng nghỉ phù hợp nhất.",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80",
    date: "28/06/2026"
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchTab, setSearchTab] = useState<"car" | "motorbike">("car");
  const [searchLoc, setSearchLoc] = useState("TP. Hồ Chí Minh");
  const [vehicleFilter, setVehicleFilter] = useState<"all" | "car" | "motorbike">("all");

  const [vehicles, setVehicles] = useState<VehicleListItemResponse[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    setLoadingVehicles(true);
    const type = vehicleFilter === "all" ? undefined : (vehicleFilter === "car" ? "Car" : "Motorbike");
    getPublicVehicles({ page: 1, pageSize: 12, type })
      .then((res) => {
        setVehicles(res.items);
      })
      .catch(() => {
        setVehicles([]);
      })
      .finally(() => {
        setLoadingVehicles(false);
      });
  }, [vehicleFilter]);

  const handleSearch = () => {
    navigate(`/vehicle?type=${searchTab}&location=${encodeURIComponent(searchLoc)}`);
  };

  return (
    <>
      {/* Hero Section - Redesigned with Dynamic Background Image and Elegant Overlays */}
      <section 
        className="relative min-h-[780px] lg:min-h-[900px] py-32 flex items-center bg-cover text-white overflow-hidden animate-gradient-bg"
        style={{ backgroundImage: `url(${heroBg})`, backgroundPosition: '30% center' }}
      >
        {/* Animated dynamic gradient background to replace the static solid feel */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 via-purple-950/20 to-transparent z-0" />
        
        {/* Soft, modern radial color flares matching premium UI styles */}
        <div className="absolute -left-10 top-1/4 h-[500px] w-[500px] rounded-full bg-brand-500/20 blur-[120px] pointer-events-none animate-pulse-glow" />
        <div className="absolute right-10 bottom-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[100px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            {/* Tagline styling with refined text-shadow and premium typography structure */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold tracking-wider text-brand-300 backdrop-blur-md mb-6 uppercase shadow-lg shadow-black/20 animate-float">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-ping" />
              Nền tảng thuê xe tự lái hàng đầu
            </div>

            <h1 className="text-[44px] font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[76px] drop-shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
              CHỌN CHIẾC XE.<br />
              <span className="italic font-light lowercase text-brand-400 normal-case bg-gradient-to-r from-brand-300 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                bắt đầu hành trình
              </span><br />
              CỦA RIÊNG BẠN.
            </h1>
            
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-slate-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              Tìm và thuê chiếc xe phù hợp theo cách của bạn. MoveVN kết nối các chủ xe uy tín cùng quy trình an toàn, bảo đảm nhất.
            </p>

            {/* Glassmorphism Horizontal Search Bar Widget */}
            <div className="mt-10 w-full max-w-3xl bg-slate-950/60 backdrop-blur-xl border border-white/20 p-3.5 flex flex-col md:flex-row items-center gap-3.5 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
              {/* Vehicle Type Toggles - Sliding indicators simulation */}
              <div className="relative flex bg-slate-900/90 p-1 border border-white/10 shrink-0 w-full md:w-auto rounded-xl">
                <button
                  type="button"
                  onClick={() => setSearchTab("car")}
                  className={`relative z-10 flex-1 md:flex-none px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-lg ${
                    searchTab === "car"
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-600/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Ô tô
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTab("motorbike")}
                  className={`relative z-10 flex-1 md:flex-none px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-lg ${
                    searchTab === "motorbike"
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-600/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Xe máy
                </button>
              </div>

              {/* Location Input */}
              <div className="relative flex-1 w-full">
                <MapPin className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-brand-400" />
                <input
                  type="text"
                  value={searchLoc}
                  onChange={(e) => setSearchLoc(e.target.value)}
                  placeholder="Nhập địa điểm, thành phố..."
                  className="h-12 w-full border border-white/10 bg-slate-900/50 pl-12 pr-4 text-sm font-medium text-white placeholder-slate-500 outline-none focus:border-brand-500/70 focus:bg-slate-900/70 transition-all rounded-xl focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Search Action Button */}
              <button
                type="button"
                onClick={handleSearch}
                className="w-full md:w-auto h-12 bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-700 hover:from-brand-700 hover:to-indigo-800 text-white px-8 text-xs font-bold uppercase tracking-widest transition-all shrink-0 rounded-xl shadow-lg shadow-brand-600/30 active:scale-95 duration-300 hover:shadow-indigo-600/25"
              >
                TÌM XE
              </button>
            </div>

            {/* Trust Points */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-500 shadow-md shadow-brand-500/40 animate-pulse" />
                <span>500+ Xe có sẵn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-500 shadow-md shadow-brand-500/40 animate-pulse" />
                <span>Xác minh chủ xe</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-500 shadow-md shadow-brand-500/40 animate-pulse" />
                <span>Đặt xe nhanh chóng</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: WHERE PERFORMANCE MEETS LUXURY */}
      <section className="bg-slate-50 py-24 dark:bg-[#030303] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">Trải nghiệm MoveVN</span>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              SỰ BỀN BỈ HÒA CÙNG SANG TRỌNG
            </h2>
            <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-brand-600 dark:bg-brand-400" />
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {reasons.map((reason) => {
              const Icon = reason.icon;
              return (
                <div
                  key={reason.title}
                  className="group flex flex-col items-start rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-brand-400 hover:shadow-[0_20px_40px_rgba(124,58,237,0.08)] dark:border-neutral-800/80 dark:bg-[#0a0a0a] dark:hover:border-brand-500/40 dark:hover:shadow-[0_20px_40px_rgba(124,58,237,0.12)] hover-glow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="h-5.5 w-5.5 transition-transform duration-500 group-hover:rotate-12" />
                  </div>
                  <h3 className="mt-6 text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {reason.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-neutral-400">
                    {reason.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Steps section: Cách MoveVN giúp chuyến đi nhẹ hơn with Curved Dashed Line Connectors */}
      <section id="process" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">Quy trình</span>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            HÀNH TRÌNH TỐI GIẢN
          </h2>
          <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-brand-600 dark:bg-brand-400" />
        </div>

        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          {/* Desktop Curved Dashed Line Connectors */}
          <div className="absolute left-[26%] top-[30%] w-[15%] hidden md:block z-0 pointer-events-none">
            <svg viewBox="0 0 100 20" fill="none" className="w-full">
              <path d="M0,10 Q50,0 100,10" strokeWidth="2" strokeDasharray="5,5" fill="none" className="stroke-slate-300 dark:stroke-neutral-800" />
            </svg>
          </div>
          <div className="absolute left-[59%] top-[30%] w-[15%] hidden md:block z-0 pointer-events-none">
            <svg viewBox="0 0 100 20" fill="none" className="w-full">
              <path d="M0,10 Q50,20 100,10" strokeWidth="2" strokeDasharray="5,5" fill="none" className="stroke-slate-300 dark:stroke-neutral-800" />
            </svg>
          </div>

          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative z-10 flex flex-col items-center text-center rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-brand-400 hover:shadow-[0_20px_40px_rgba(124,58,237,0.08)] dark:border-neutral-800/80 dark:bg-[#0a0a0a] dark:hover:border-brand-500/40 hover-glow"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-sm font-extrabold text-slate-900 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white dark:bg-neutral-900 dark:text-neutral-300">
                {step.number}
              </div>
              <h3 className="mt-6 text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-neutral-400">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Cars: Xe nổi bật cho hôm nay */}
      <section id="vehicles" className="mx-auto max-w-[1720px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            Xe gợi ý cho bạn
          </h2>
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-neutral-400">
            Để mỗi chuyến đi là một hành trình truyền cảm hứng, mỗi chuyến xe là một trải nghiệm thú vị
          </p>
        </div>

        <div className="mt-12">
          {loadingVehicles ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner className="h-8 w-8 text-brand-600" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-slate-200 dark:border-neutral-950 rounded-2xl">
              <Car className="h-16 w-16 text-slate-300 dark:text-neutral-800" />
              <p className="mt-4 text-sm uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Hiện tại chưa có phương tiện nào.
              </p>
            </div>
          ) : (
            <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {vehicles.map((vehicle) => {
                const tagLabel = `Đời ${vehicle.year}`;
                const title = `${vehicle.brandName} ${vehicle.modelName} ${vehicle.year}`;
                return (
                  <div
                    key={vehicle.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-400 hover:shadow-md dark:border-neutral-800/90 dark:bg-[#0a0a0a]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 dark:bg-neutral-900">
                      {vehicle.featuredImage ? (
                        <img
                          src={vehicle.featuredImage}
                          alt={vehicle.licensePlate}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          {vehicle.vehicleType === "Car" ? <Car className="h-12 w-12 text-slate-400" /> : <Bike className="h-12 w-12 text-slate-400" />}
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded bg-slate-900/90 px-3 py-1 text-[9px] font-bold tracking-wider text-white shadow-sm">
                        {tagLabel.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-semibold tracking-wider text-slate-400 dark:text-neutral-500">
                          {vehicle.vehicleType === "Car" ? "Ô TÔ" : "XE MÁY"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 dark:text-neutral-400">
                          <Star className="h-3 w-3 fill-current text-slate-900 dark:text-white" />
                          Mới
                        </span>
                      </div>

                      <h3 className="mt-1 text-sm font-bold text-slate-950 dark:text-white truncate">
                        {title}
                      </h3>

                      <div className="mt-1.5 text-[10px] font-medium text-slate-400">
                        <p className="truncate">{vehicle.areaName || "Đà Nẵng"}</p>
                        <p>Cách 0.0km</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-neutral-900 flex items-center justify-between gap-1.5">
                        <p className="text-xs font-extrabold text-slate-950 dark:text-white truncate">
                          {vehicle.pricePerDay.toLocaleString("vi-VN")}đ/ngày
                        </p>
                        <Link
                          to={`/vehicle/${vehicle.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-lg bg-[#07020d] px-3.5 text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:bg-slate-800 active:scale-95 shadow-sm"
                        >
                          THUÊ NGAY
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Destinations: Địa điểm thuê xe phổ biến */}
      <section className="bg-slate-50 py-16 dark:bg-[#080808] transition-colors duration-300">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Địa điểm phổ biến
            </h2>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-6 lg:overflow-x-visible hide-scrollbar">
            {destinations.map((dest) => (
              <div
                key={dest.name}
                className="group relative flex-none w-[200px] lg:w-auto rounded-2xl bg-white border border-slate-100 p-3 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md dark:bg-neutral-900 dark:border-neutral-800"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="mt-3.5 px-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {dest.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-neutral-300">
                    {dest.count}
                  </p>
                  <p className="mt-0.5 text-[9px] font-medium text-slate-400 dark:text-neutral-500">
                    {dest.time}
                  </p>
                </div>
                <Link
                  to={`/vehicle?location=${encodeURIComponent(dest.name)}`}
                  className="absolute inset-0 z-30"
                  aria-label={`Thuê xe tại ${dest.name}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Control Banner */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 text-white shadow-xl dark:bg-[#0a0a0a] md:p-14">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-brand-500/10 blur-[100px]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-300 backdrop-blur-md">
                <ShieldCheck className="h-4 w-4" />
                Cam kết từ MoveVN
              </span>
              <h2 className="mt-5 text-3xl font-black uppercase tracking-tight sm:text-4xl">
                HÀNH TRÌNH KHÔNG RỦI RO
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
                Quy trình kiểm định xe chặt chẽ, bảo hiểm toàn diện cùng dịch vụ hỗ trợ sự cố 24/7 giúp hành trình của bạn và những người thân yêu luôn được bảo đảm an toàn.
              </p>
            </div>
            <Link
              to="/vehicle"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-xs font-bold uppercase tracking-widest text-slate-950 shadow-lg transition-all hover:bg-slate-100 active:scale-95"
            >
              Tìm hiểu quy trình
              <ArrowUpRight className="h-4.5 w-4.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Blog/Guides: Cẩm nang dịch chuyển */}
      <section className="bg-slate-50 py-24 dark:bg-[#030303] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">Kiến thức hành trình</span>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              CẨM NANG DỊCH CHUYỂN
            </h2>
            <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-brand-600 dark:bg-brand-400" />
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {guides.map((guide) => (
              <article
                key={guide.title}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md dark:border-neutral-800/90 dark:bg-[#0a0a0a]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 rounded-t-2xl">
                  <img
                    src={guide.image}
                    alt={guide.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <time className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-brand-400">
                    {guide.date}
                  </time>
                  <h3 className="mt-2 text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-500 dark:text-neutral-400">
                    {guide.desc}
                  </p>
                  <div className="mt-6 border-t border-slate-100 pt-4 dark:border-neutral-900">
                    <Link
                      to="/vehicle"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-300"
                    >
                      Đọc bài viết
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner: Sẵn sàng cho chuyến đi tiếp theo? */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 py-20 text-center shadow-xl dark:bg-[#0a0a0a]">
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-600/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-xl px-4">
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              SẴN SÀNG CHO CHUYẾN ĐI TIẾP THEO?
            </h2>
            <p className="mt-4 text-xs leading-relaxed text-slate-300 uppercase tracking-widest">
              Tìm ô tô/MoveVN, đặt ngay để nhận ưu đãi hấp dẫn và khám phá mọi miền đất hứa.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to="/vehicle"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-8 text-xs font-bold uppercase tracking-widest text-slate-950 shadow-xl transition-all hover:bg-slate-100 active:scale-95"
              >
                Tìm xe ngay
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
