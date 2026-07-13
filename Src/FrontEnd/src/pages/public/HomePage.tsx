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
  ArrowUpRight
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
    name: "TP. Hồ Chí Minh",
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=600&q=80",
    count: "500+ xe sẵn sàng"
  },
  {
    name: "Hà Nội",
    image: "https://images.unsplash.com/photo-1509060464153-4466739f76d0?auto=format&fit=crop&w=600&q=80",
    count: "400+ xe sẵn sàng"
  },
  {
    name: "Đà Nẵng",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
    count: "300+ xe sẵn sàng"
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
    getPublicVehicles({ page: 1, pageSize: 6, type })
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
      {/* Hero Section - Redesigned with Custom Background Image */}
      <section 
        className="relative min-h-[750px] lg:min-h-[850px] py-32 flex items-center bg-cover text-white"
        style={{ backgroundImage: `url(${heroBg})`, backgroundPosition: '30% center' }}
      >
        {/* Stronger dark gradient overlay to ensure absolute text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 via-black/40 to-transparent z-0" />
        
        {/* Ambient Purple glow matching the Sian color */}
        <div className="absolute left-[60%] top-[45%] h-80 w-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <h1 className="text-[38px] font-black uppercase leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[62px] drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              CHỌN CHIẾC XE.<br />
              <span className="italic lowercase text-brand-400 normal-case">
                bắt đầu hành trình
              </span><br />
              CỦA RIÊNG BẠN.
            </h1>
            
            <p className="mt-6 max-w-lg text-xs leading-relaxed tracking-wider text-slate-200 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Tìm và thuê chiếc xe phù hợp theo cách của bạn. MoveVN kết nối các chủ xe uy tín cùng quy trình an toàn, bảo đảm nhất.
            </p>

            {/* Wide Horizontal Search Bar Widget */}
            <div className="mt-8 w-full max-w-2xl bg-[#07020d]/70 backdrop-blur-md border border-violet-950/40 p-2.5 flex flex-col sm:flex-row items-center gap-3 rounded">
              {/* Vehicle Type Toggles */}
              <div className="flex bg-[#07020d]/50 p-1 border border-violet-950/20 shrink-0 w-full sm:w-auto rounded">
                <button
                  type="button"
                  onClick={() => setSearchTab("car")}
                  className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all rounded-sm ${
                    searchTab === "car"
                      ? "bg-brand-600 text-white"
                      : "text-violet-300 hover:text-white"
                  }`}
                >
                  Ô tô
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTab("motorbike")}
                  className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all rounded-sm ${
                    searchTab === "motorbike"
                      ? "bg-brand-600 text-white"
                      : "text-violet-300 hover:text-white"
                  }`}
                >
                  Xe máy
                </button>
              </div>

              {/* Location Input */}
              <div className="relative flex-1 w-full">
                <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
                <input
                  type="text"
                  value={searchLoc}
                  onChange={(e) => setSearchLoc(e.target.value)}
                  placeholder="Nhập địa điểm, thành phố..."
                  className="h-11 w-full border border-violet-900/50 bg-[#07020d]/50 pl-10 pr-4 text-xs font-semibold text-white placeholder-violet-400/60 outline-none focus:border-brand-500 rounded"
                />
              </div>

              {/* Search Action Button */}
              <button
                type="button"
                onClick={handleSearch}
                className="w-full sm:w-auto h-11 bg-brand-600 hover:bg-brand-700 text-white px-8 text-xs font-bold uppercase tracking-widest transition-all shrink-0 rounded"
              >
                TÌM XE
              </button>
            </div>

            {/* Trust Points */}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                <span>500+ Xe có sẵn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                <span>Xác minh chủ xe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                <span>Đặt xe nhanh chóng</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: WHERE PERFORMANCE MEETS LUXURY */}
      <section className="bg-white py-24 transition-colors duration-300 dark:bg-[#000000]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">Trải nghiệm MoveVN</span>
            <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              SỰ BỀN BỈ HÒA CÙNG SANG TRỌNG
            </h2>
            <div className="mx-auto mt-4 h-[1px] w-16 bg-brand-600 dark:bg-brand-400" />
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {reasons.map((reason) => {
              const Icon = reason.icon;
              return (
                <div
                  key={reason.title}
                  className="group flex flex-col items-start rounded border border-slate-200 bg-[#fafafa] p-8 shadow-sm transition-all hover:shadow-md dark:border-neutral-800/80 dark:bg-[#0f0f0f]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded bg-[#07020d] text-white dark:bg-white dark:text-black transition-all group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {reason.title}
                  </h3>
                  <p className="mt-3.5 text-xs leading-relaxed text-slate-500 dark:text-violet-300/60">
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
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">Quy trình</span>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            HÀNH TRÌNH TỐI GIẢN
          </h2>
          <div className="mx-auto mt-4 h-[1px] w-16 bg-brand-600 dark:bg-brand-400" />
        </div>

        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          
          {/* Desktop Curved Dashed Line Connectors */}
          <div className="absolute left-[26%] top-[30%] w-[15%] hidden md:block z-0">
            <svg viewBox="0 0 100 20" fill="none" className="w-full">
              <path d="M0,10 Q50,0 100,10" strokeWidth="2.5" strokeDasharray="6,6" fill="none" className="stroke-brand-500 dark:stroke-brand-400 opacity-80" />
            </svg>
          </div>
          <div className="absolute left-[59%] top-[30%] w-[15%] hidden md:block z-0">
            <svg viewBox="0 0 100 20" fill="none" className="w-full">
              <path d="M0,10 Q50,20 100,10" strokeWidth="2.5" strokeDasharray="6,6" fill="none" className="stroke-brand-500 dark:stroke-brand-400 opacity-80" />
            </svg>
          </div>

          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative z-10 flex flex-col items-center text-center rounded border border-slate-200 bg-white p-8 transition-all duration-300 hover:shadow-md dark:border-neutral-800/80 dark:bg-[#0f0f0f]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-900 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-neutral-800 dark:text-violet-300">
                {step.number}
              </div>
              <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-violet-300/60">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Cars: Xe nổi bật cho hôm nay */}
      <section id="vehicles" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">Hôm nay</span>
            <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              BỘ SƯU TẬP XE NỔI BẬT
            </h2>
          </div>
          <Link
            to="/vehicle"
            className="inline-flex h-11 items-center gap-2 rounded border border-slate-200 bg-white px-5 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-violet-200 dark:hover:bg-neutral-800"
          >
            Xem tất cả xe
            <ArrowRight className="h-4 w-4 text-slate-400 dark:text-violet-400" />
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="mt-8 flex border-b border-slate-200 dark:border-neutral-900 gap-6">
          {[
            { id: "all", label: "Tất cả" },
            { id: "car", label: "Ô tô" },
            { id: "motorbike", label: "Xe máy" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setVehicleFilter(tab.id as any)}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative ${
                vehicleFilter === tab.id
                  ? "text-brand-600 dark:text-brand-400 font-extrabold"
                  : "text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 font-bold"
              }`}
            >
              {tab.label}
              {vehicleFilter === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-600 dark:bg-brand-400" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-12">
        {loadingVehicles ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <Car className="h-16 w-16 text-slate-300 dark:text-gray-700" />
            <p className="mt-3 text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Hiện tại chưa có phương tiện nào thuộc nhóm này.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => {
              const tagLabel = `Đời ${vehicle.year}`;
              const typeLabel = vehicle.vehicleType === "Car" ? "Ô tô" : "Xe máy";
              return (
                <div
                  key={vehicle.id}
                  className="group overflow-hidden rounded border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:border-neutral-800/90 dark:bg-[#0f0f0f]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-neutral-900">
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
                    <span className="absolute left-4 top-4 rounded bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm dark:bg-white dark:text-black">
                      {tagLabel}
                    </span>
                  </div>
                  
                  <div className="p-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-brand-400">
                      {typeLabel} {vehicle.variantName ? `• ${vehicle.variantName}` : ""}
                    </span>
                    <h3 className="mt-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white truncate">
                      {vehicle.brandName} {vehicle.modelName}
                    </h3>
                    
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-neutral-900">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">Giá thuê</span>
                        <span className="text-base font-black text-brand-600 dark:text-brand-400">{vehicle.pricePerDay.toLocaleString("vi-VN")}đ/ngày</span>
                      </div>
                      <Link
                        to={`/vehicle/${vehicle.id}`}
                        className="inline-flex h-9 items-center justify-center rounded bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-brand-700 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                      >
                        Thuê ngay
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
      <section className="bg-[#fafafa] py-24 transition-colors duration-300 dark:bg-[#000000]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">Bản đồ dịch chuyển</span>
            <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              ĐỊA ĐIỂM PHỔ BIẾN
            </h2>
            <div className="mx-auto mt-4 h-[1px] w-16 bg-brand-600 dark:bg-brand-400" />
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {destinations.map((dest) => (
              <div
                key={dest.name}
                className="group relative aspect-[4/3] overflow-hidden rounded shadow-md transition-all hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent z-10" />
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-5 left-5 z-20">
                  <h3 className="text-base font-bold uppercase tracking-wider text-white">
                    {dest.name}
                  </h3>
                  <span className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-200">
                    <Compass className="h-3.5 w-3.5 text-violet-300" />
                    {dest.count}
                  </span>
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
        <div className="relative overflow-hidden rounded bg-[#07020d] p-8 text-white shadow-xl dark:bg-[#0f0f0f] md:p-12">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Cam kết từ MoveVN
              </span>
              <h2 className="mt-4 text-2xl font-black uppercase tracking-tight sm:text-4xl">
                HÀNH TRÌNH KHÔNG RỦI RO
              </h2>
              <p className="mt-3.5 max-w-2xl text-xs leading-relaxed text-violet-100/80">
                Quy trình kiểm định xe chặt chẽ, bảo hiểm toàn diện cùng dịch vụ hỗ trợ sự cố 24/7 giúp hành trình của bạn và những người thân yêu luôn được bảo đảm an toàn.
              </p>
            </div>
            <Link
              to="/vehicle"
              className="inline-flex h-12 items-center justify-center gap-2 rounded bg-white px-6 text-xs font-bold uppercase tracking-widest text-[#07020d] shadow-lg transition-all hover:bg-slate-200"
            >
              Tìm hiểu quy trình
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Blog/Guides: Cẩm nang dịch chuyển */}
      <section className="bg-[#fafafa] py-24 transition-colors duration-300 dark:bg-[#000000]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">Kiến thức hành trình</span>
            <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              CẨM NANG DỊCH CHUYỂN
            </h2>
            <div className="mx-auto mt-4 h-[1px] w-16 bg-brand-600 dark:bg-brand-400" />
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {guides.map((guide) => (
              <article
                key={guide.title}
                className="flex flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-neutral-800/90 dark:bg-[#0f0f0f]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={guide.image}
                    alt={guide.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <time className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-violet-400">
                    {guide.date}
                  </time>
                  <h3 className="mt-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {guide.title}
                  </h3>
                  <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-500 dark:text-violet-300/60">
                    {guide.desc}
                  </p>
                  <div className="mt-6 border-t border-slate-100 pt-4 dark:border-violet-950/20">
                    <Link
                      to="/vehicle"
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-brand-600 transition-colors hover:text-brand-700 dark:text-violet-300"
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
        <div className="relative overflow-hidden rounded bg-[#07020d] py-16 text-center shadow-xl dark:bg-[#0f0f0f]">
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
          <div className="relative z-10 mx-auto max-w-xl px-4">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
              SẴN SÀNG CHO CHUYẾN ĐI TIẾP THEO?
            </h2>
            <p className="mt-4 text-xs leading-relaxed text-violet-200/80 uppercase tracking-widest">
              Tìm ô tô/MoveVN, đặt ngay để nhận ưu đãi hấp dẫn và khám phá mọi miền đất hứa.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to="/vehicle"
                className="inline-flex h-12 items-center justify-center gap-2 rounded bg-white px-8 text-xs font-bold uppercase tracking-widest text-[#07020d] shadow-xl transition-all hover:bg-slate-200"
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
