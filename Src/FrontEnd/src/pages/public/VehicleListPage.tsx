import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Car, Bike, MapPin, CalendarCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCatalogBrands, getCatalogModels } from "@/features/vehicles/services/vehicleService";
import { getPublicVehicles } from "@/features/vehicles/services/publicVehicleService";
import type { VehicleListItemResponse, CatalogBrand, CatalogModel } from "@/features/vehicles/types";
import { fuelTypeOptions, motorbikeTypeOptions } from "@/features/vehicleModelVariants/options";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import useClickOutside from "@/hooks/useClickOutside";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import Button from "@/components/common/Button";

const carBodyTypes = [
  { value: "Sedan", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "Hatchback", label: "Hatchback" },
  { value: "Coupe", label: "Coupe" },
  { value: "Convertible", label: "Mui trần" },
  { value: "Pickup", label: "Bán tải" },
  { value: "MPV/Minivan", label: "MPV / Minivan" },
  { value: "Wagon", label: "Wagon" },
];
const seatCounts = ["2", "4", "5", "7", "8", "9", "16", "29", "30"];
const transmissionOptions = [
  { value: "Automatic", label: "Tự động" },
  { value: "Manual", label: "Số sàn" },
  { value: "CVT", label: "CVT" },
  { value: "DCT", label: "DCT" },
];

function FilterDropdown({ value, label, options, onChange }: { value: string; label: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 w-full items-center justify-between rounded border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-neutral-855 dark:bg-neutral-900 dark:text-gray-200 dark:hover:bg-neutral-800"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 dark:text-gray-500">{label}:</span>
          <span className="font-bold text-brand-600 dark:text-brand-400">{current?.label ?? "Tất cả"}</span>
        </div>
        <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="dropdown-scrollbar absolute left-0 top-full z-20 mt-1 max-h-72 w-full overflow-auto rounded border border-slate-200/85 bg-white py-1.5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 animate-fadeIn">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center px-4 py-2.5 text-left text-xs font-semibold transition-colors ${
                opt.value === value
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 font-bold"
                  : "text-slate-700 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-neutral-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function splitAreaName(areaName: string | null) {
  if (!areaName) return null;
  const [province, ...wardParts] = areaName.split(" - ");
  const ward = wardParts.join(" - ").trim();
  return { province: province?.trim() ?? "", ward };
}

export default function VehicleListPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<VehicleListItemResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [fuelTypeFilter, setFuelTypeFilter] = useState("");
  const [seatCountFilter, setSeatCountFilter] = useState("");
  const [transmissionFilter, setTransmissionFilter] = useState("");
  const [bodyTypeFilter, setBodyTypeFilter] = useState("");
  const [bikeTypeFilter, setBikeTypeFilter] = useState("");
  const [engineCapacityFilter, setEngineCapacityFilter] = useState("");
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCatalogBrands().then(setBrands).catch(() => {});
  }, []);

  useEffect(() => {
    if (brandFilter) {
      getCatalogModels(Number(brandFilter)).then(setModels).catch(() => setModels([]));
      setModelFilter("");
    } else {
      setModels([]);
    }
  }, [brandFilter]);

  function buildParams(p?: number, kw?: string, sort?: string, vt?: string, bf?: string, mf?: string, ft?: string, sc?: string, tr?: string, bt?: string, bkT?: string, ec?: string) {
    const params: Record<string, string | number | boolean | undefined> = { page: p ?? page, pageSize: 12 };
    const effectiveType = vt !== undefined ? vt : typeFilter;
    if (effectiveType) params.type = effectiveType;
    const searchKw = kw !== undefined ? kw : keyword;
    if (searchKw) params.keyword = searchKw;
    const searchSort = sort !== undefined ? sort : sortBy;
    if (searchSort) params.sortBy = searchSort;
    const searchBrand = bf !== undefined ? bf : brandFilter;
    if (searchBrand) params.brandId = Number(searchBrand);
    const searchModel = mf !== undefined ? mf : modelFilter;
    if (searchModel) params.modelId = Number(searchModel);
    const searchFuelType = ft !== undefined ? ft : fuelTypeFilter;
    if (searchFuelType) params.fuelType = searchFuelType;
    const searchSeatCount = sc !== undefined ? sc : seatCountFilter;
    if (searchSeatCount) params.seatCount = searchSeatCount;
    const searchTransmission = tr !== undefined ? tr : transmissionFilter;
    if (searchTransmission) params.transmission = searchTransmission;
    const searchBodyType = bt !== undefined ? bt : bodyTypeFilter;
    if (searchBodyType) params.bodyType = searchBodyType;
    const searchBikeType = bkT !== undefined ? bkT : bikeTypeFilter;
    if (searchBikeType) params.bikeType = searchBikeType;
    const searchEngineCapacity = ec !== undefined ? ec : engineCapacityFilter;
    if (searchEngineCapacity) params.engineCapacity = searchEngineCapacity;
    return params;
  }

  const load = useCallback(async (p?: number, kw?: string, sort?: string, vt?: string, bf?: string, mf?: string, ft?: string, sc?: string, tr?: string, bt?: string, bkT?: string, ec?: string) => {
    setIsLoading(true);
    try {
      const params = buildParams(p, kw, sort, vt, bf, mf, ft, sc, tr, bt, bkT, ec);
      const result = await getPublicVehicles(params);
      setItems(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, keyword, sortBy, typeFilter, brandFilter, modelFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter]);

  useEffect(() => { void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }, [typeFilter, load]);

  const visibleBrands = brands.filter((b) => !typeFilter || b.vehicleType === typeFilter);
  const hasActiveFilters = sortBy !== "" || typeFilter !== "" || brandFilter !== "" || modelFilter !== ""
    || fuelTypeFilter !== "" || seatCountFilter !== "" || transmissionFilter !== "" || bodyTypeFilter !== ""
    || bikeTypeFilter !== "" || engineCapacityFilter !== "";

  const handleSearch = () => {
    setPage(1);
    void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearAllFilters = () => {
    setKeyword("");
    setSortBy("");
    setTypeFilter("");
    setBrandFilter("");
    setModelFilter("");
    setFuelTypeFilter("");
    setSeatCountFilter("");
    setTransmissionFilter("");
    setBodyTypeFilter("");
    setBikeTypeFilter("");
    setEngineCapacityFilter("");
    setPage(1);
    if (searchRef.current) searchRef.current.value = "";
    void load(1, "", "", "", "", "", "", "", "", "", "", "");
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    void load(p, keyword, sortBy, typeFilter, brandFilter, modelFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter);
  };

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] text-slate-900 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white min-h-screen transition-colors duration-300 pb-16">
      {/* Premium Header Banner */}
      <div className="relative py-16 sm:py-20 px-4 text-center overflow-hidden border-b border-slate-100 dark:border-neutral-900 bg-white/40 dark:bg-black/25 backdrop-blur-md shadow-md">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-brand-500/10 to-transparent blur-3xl pointer-events-none" />
        <span className="text-sm sm:text-base font-extrabold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Hành trình phía trước</span>
        <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">
          Tìm chiếc xe{" "}
          <span className="italic lowercase text-brand-600 dark:text-brand-400">
            phù hợp
          </span>
        </h1>
      </div>

      {/* Two Column Layout Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: sticky filter sidebar */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="sticky top-24 bg-white border border-slate-300 dark:border-neutral-700 dark:bg-neutral-950/70 rounded shadow-[0_12px_40px_-4px_rgba(124,58,237,0.18)] dark:shadow-[0_12px_40px_-4px_rgba(139,92,246,0.25)] p-5 transition-colors space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="h-4.5 w-4.5 text-brand-600" />
                <span>Bộ lọc tìm kiếm</span>
              </h2>
              {hasActiveFilters && (
                <button type="button" onClick={clearAllFilters} className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider">
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Keyword Search */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Từ khóa</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                <input
                  ref={searchRef}
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hãng, dòng xe, biển số..."
                  className="h-10 w-full rounded border border-slate-200 bg-slate-50/50 dark:bg-neutral-900/50 dark:border-neutral-800 pl-9 pr-3 text-xs font-semibold outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white transition-all placeholder:text-slate-400/80"
                />
              </div>
            </div>

            {/* Filter Dropdowns arranged vertically */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Sắp xếp</label>
                <FilterDropdown label="Sắp xếp" value={sortBy} onChange={(v) => { setSortBy(v); setPage(1); void load(1, keyword, v, typeFilter, brandFilter, modelFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }}
                  options={[{ value: "", label: "Mới nhất" }, { value: "price_asc", label: "Giá tăng dần" }, { value: "price_desc", label: "Giá giảm dần" }]} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Loại xe</label>
                <FilterDropdown label="Loại xe" value={typeFilter} onChange={(v) => { setTypeFilter(v); setBrandFilter(""); setModelFilter(""); setFuelTypeFilter(""); setSeatCountFilter(""); setTransmissionFilter(""); setBodyTypeFilter(""); setBikeTypeFilter(""); setPage(1); void load(1, keyword, sortBy, v, "", "", "", "", "", "", "", ""); }}
                  options={[{ value: "", label: "Tất cả" }, { value: "Car", label: "Ô tô" }, { value: "Motorbike", label: "Xe máy" }]} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Hãng xe</label>
                <FilterDropdown label="Hãng xe" value={brandFilter} onChange={(v) => { setBrandFilter(v); setModelFilter(""); setPage(1); void load(1, keyword, sortBy, typeFilter, v, "", fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }}
                  options={[{ value: "", label: "Tất cả" }, ...visibleBrands.map((b) => ({ value: String(b.id), label: b.name }))]} />
              </div>

              {brandFilter && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Dòng xe</label>
                  <FilterDropdown label="Dòng xe" value={modelFilter} onChange={(v) => { setModelFilter(v); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, v, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }}
                    options={[{ value: "", label: "Tất cả" }, ...models.map((m) => ({ value: String(m.id), label: m.name }))]} />
                </div>
              )}

              {(!typeFilter || typeFilter === "Car") && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Số chỗ</label>
                    <FilterDropdown label="Số chỗ" value={seatCountFilter} onChange={(v) => { setSeatCountFilter(v); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, fuelTypeFilter, v, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }}
                      options={[{ value: "", label: "Tất cả" }, ...seatCounts.map((item) => ({ value: item, label: `${item} chỗ` }))]} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Truyền động</label>
                    <FilterDropdown label="Truyền động" value={transmissionFilter} onChange={(v) => { setTransmissionFilter(v); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, fuelTypeFilter, seatCountFilter, v, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }}
                      options={[{ value: "", label: "Tất cả" }, ...transmissionOptions]} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Kiểu thân</label>
                    <FilterDropdown label="Kiểu thân" value={bodyTypeFilter} onChange={(v) => { setBodyTypeFilter(v); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, v, bikeTypeFilter, engineCapacityFilter); }}
                      options={[{ value: "", label: "Tất cả" }, ...carBodyTypes]} />
                  </div>
                </>
              )}

              {(!typeFilter || typeFilter === "Motorbike") && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Loại xe máy</label>
                    <FilterDropdown label="Loại xe" value={bikeTypeFilter} onChange={(v) => { setBikeTypeFilter(v); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, v, engineCapacityFilter); }}
                      options={[{ value: "", label: "Tất cả" }, ...motorbikeTypeOptions]} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Dung tích</label>
                    <input type="text" value={engineCapacityFilter} onChange={(e) => { setEngineCapacityFilter(e.target.value); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, e.target.value); }} placeholder="VD: 125cc" className="h-10 w-full rounded border border-slate-200 bg-white px-3 text-xs outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white font-semibold" />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Nhiên liệu</label>
                <FilterDropdown label="Nhiên liệu" value={fuelTypeFilter} onChange={(v) => { setFuelTypeFilter(v); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, v, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }}
                  options={[{ value: "", label: "Tất cả" }, ...fuelTypeOptions]} />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-brand-600/15 transition-all active:scale-[0.98]"
            >
              <Search className="h-4 w-4" /> Áp dụng bộ lọc
            </button>
          </div>
        </aside>

        {/* Right Column: Vehicle Results Grid */}
        <main className="flex-grow">
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="text-sm font-semibold text-slate-700 dark:text-gray-300">
              Tìm thấy <span className="text-brand-600 dark:text-brand-400 font-extrabold">{totalCount}</span> xe sẵn sàng
            </div>
            {isLoading && <LoadingSpinner className="h-5 w-5 text-brand-600" />}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20"><LoadingSpinner className="h-10 w-10 text-brand-600" /></div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center text-center bg-white/40 dark:bg-neutral-950/40 backdrop-blur-sm border border-slate-300 dark:border-neutral-700 rounded-2xl p-12 shadow-sm">
              <Car className="h-16 w-16 text-slate-300 dark:text-neutral-700 animate-pulse" />
              <p className="mt-4 text-base font-bold text-slate-700 dark:text-gray-300">Chưa có xe nào đang cho thuê</p>
              <p className="mt-2 text-xs text-slate-400">Hãy điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
              <button type="button" onClick={clearAllFilters} className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-brand-600 text-white px-5 text-xs font-bold uppercase tracking-wider transition-all hover:bg-brand-700 shadow-md">Xóa bộ lọc</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {items.map((vehicle) => {
                const area = splitAreaName(vehicle.areaName);
                return (
                  <div key={vehicle.id} className="group relative flex flex-col justify-between overflow-hidden rounded border border-slate-300 bg-white dark:border-neutral-700 dark:bg-neutral-950/70 shadow-[0_12px_40px_-4px_rgba(124,58,237,0.18)] dark:shadow-[0_12px_40px_-4px_rgba(139,92,246,0.25)] transition-all duration-300 hover:shadow-[0_18px_48px_-4px_rgba(124,58,237,0.24)] dark:hover:shadow-[0_18px_48px_-4px_rgba(139,92,246,0.35)] hover:-translate-y-1">
                    <div>
                      {/* Image Box */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-neutral-900">
                        {vehicle.featuredImage ? (
                          <img src={vehicle.featuredImage} alt={vehicle.licensePlate} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            {vehicle.vehicleType === "Car" ? <Car className="h-12 w-12 text-slate-300 dark:text-neutral-700" /> : <Bike className="h-12 w-12 text-slate-300 dark:text-neutral-700" />}
                          </div>
                        )}
                        
                        {/* Vehicle Type Badges */}
                        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                          {vehicle.vehicleType === "Car" ? <Car className="h-3.5 w-3.5" /> : <Bike className="h-3.5 w-3.5" />}
                          <span>{vehicle.vehicleType === "Car" ? "Ô tô" : "Xe máy"}</span>
                        </span>
                        
                        {/* Year badge */}
                        <span className="absolute top-4 right-4 inline-flex items-center rounded-xl bg-brand-600/90 backdrop-blur-sm px-2.5 py-1 text-[9px] font-extrabold tracking-wider text-white">
                          Đời {vehicle.year}
                        </span>
                      </div>

                      {/* Metadata Content */}
                      <div className="p-5">
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">
                          <span>{vehicle.brandName}</span>
                          <span>•</span>
                          <span>{vehicle.modelName}</span>
                        </div>
                        
                        <h3 className="mt-2 text-base font-extrabold text-slate-900 dark:text-white truncate">
                          {vehicle.variantName || `${vehicle.brandName} ${vehicle.modelName}`}
                        </h3>

                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-850 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-gray-400">
                          {vehicle.licensePlate}
                        </div>

                        {area && (
                          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
                            <MapPin className="h-4.5 w-4.5 shrink-0 text-brand-500" />
                            <span className="truncate">{area.province}</span>
                            {area.ward && <span className="truncate text-slate-400 dark:text-gray-500"> - {area.ward}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing and Action buttons */}
                    <div className="p-5 pt-0">
                      <div className="border-t border-slate-100 dark:border-neutral-900 pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">Giá thuê</span>
                            <span className="text-base font-black text-brand-600 dark:text-brand-400">
                              {vehicle.pricePerDay.toLocaleString("vi-VN")}đ
                              <span className="text-xs font-normal text-slate-400 dark:text-gray-500">/ngày</span>
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                            className="inline-flex h-9 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 px-3 text-xs font-bold text-slate-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
                          >
                            Chi tiết
                          </button>
                          {token && user ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/customer/bookings/new?vehicleId=${vehicle.id}`)}
                              className="inline-flex h-9 items-center justify-center rounded bg-brand-600 hover:bg-brand-700 px-3 text-xs font-bold text-white shadow-md shadow-brand-600/10 transition-colors whitespace-nowrap"
                            >
                              Đặt ngay
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                              className="inline-flex h-9 items-center justify-center rounded bg-brand-600 hover:bg-brand-700 px-3 text-xs font-bold text-white shadow-md shadow-brand-600/10 transition-colors whitespace-nowrap"
                            >
                              Thuê ngay
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-neutral-800 mt-10 pt-6 px-1">
              <div className="text-xs font-semibold text-slate-500 dark:text-gray-400">Trang {page} / {totalPages}</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 dark:border-neutral-800 text-slate-500 transition-colors hover:bg-slate-50 dark:hover:bg-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                {pageNumbers.map((p, i) => p === "..." ? (
                  <span key={`e-${i}`} className="inline-flex h-9 w-9 items-center justify-center text-xs text-slate-400">...</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p as number)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded text-xs font-bold transition-all ${
                      p === page
                        ? "bg-brand-600 text-white shadow-md shadow-brand-600/15"
                        : "border border-slate-200 dark:border-neutral-855 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-neutral-900"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 dark:border-neutral-800 text-slate-500 transition-colors hover:bg-slate-50 dark:hover:bg-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
