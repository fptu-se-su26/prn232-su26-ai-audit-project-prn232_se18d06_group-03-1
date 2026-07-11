import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Car, Bike, MapPin, CalendarCheck, Star, X, Clock } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCatalogBrands, getCatalogModels, getCatalogFeatures } from "@/features/vehicles/services/vehicleService";
import { getPublicVehicles } from "@/features/vehicles/services/publicVehicleService";
import type { VehicleListItemResponse, CatalogBrand, CatalogModel, CatalogFeature } from "@/features/vehicles/types";
import { fuelTypeOptions, motorbikeTypeOptions } from "@/features/vehicleModelVariants/options";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import useClickOutside from "@/hooks/useClickOutside";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import Button from "@/components/common/Button";

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
      {label}
      <button type="button" onClick={onRemove} className="ml-0.5 rounded-full p-0.5 hover:bg-brand-200"><X className="h-3 w-3" /></button>
    </span>
  );
}

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
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((prev) => !prev)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 w-full">
        <span className="text-xs text-slate-400">{label}:</span>
        <span className="font-medium truncate">{current?.label ?? "Tất cả"}</span>
        <svg className={`h-3.5 w-3.5 text-slate-400 ml-auto transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
      </button>
      {open && (
        <div className="dropdown-scrollbar absolute left-0 top-full z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((opt) => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors ${opt.value === value ? "bg-brand-100 font-medium text-brand-700" : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"}`}>{opt.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-1 text-xs text-slate-500">
      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
      <span className="font-medium text-slate-700">{rating.toFixed(1)}</span>
      <span>({count})</span>
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
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [searchStartDate, setSearchStartDate] = useState("");
  const [searchEndDate, setSearchEndDate] = useState("");
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>([]);
  const [features, setFeatures] = useState<CatalogFeature[]>([]);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  useClickOutside(sidebarRef, () => { if (showFilters && window.innerWidth < 768) setShowFilters(false); });

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

  useEffect(() => {
    getCatalogFeatures(typeFilter || undefined).then(setFeatures).catch(() => setFeatures([]));
  }, [typeFilter]);

  function buildParams() {
    const params: Record<string, string | number | boolean | undefined> = { page, pageSize: 12 };
    if (typeFilter) params.type = typeFilter;
    if (keyword) params.keyword = keyword;
    if (sortBy) params.sortBy = sortBy;
    if (brandFilter) params.brandId = Number(brandFilter);
    if (modelFilter) params.modelId = Number(modelFilter);
    if (fuelTypeFilter) params.fuelType = fuelTypeFilter;
    if (seatCountFilter) params.seatCount = seatCountFilter;
    if (transmissionFilter) params.transmission = transmissionFilter;
    if (bodyTypeFilter) params.bodyType = bodyTypeFilter;
    if (bikeTypeFilter) params.bikeType = bikeTypeFilter;
    if (engineCapacityFilter) params.engineCapacity = engineCapacityFilter;
    if (priceFrom) params.priceFrom = Number(priceFrom);
    if (priceTo) params.priceTo = Number(priceTo);
    if (selectedFeatureIds.length > 0) params.featureIds = selectedFeatureIds.join(",");
    if (searchStartDate) params.searchStartDate = searchStartDate;
    if (searchEndDate) params.searchEndDate = searchEndDate;
    return params;
  }

  const load = useCallback(async (p?: number) => {
    setIsLoading(true);
    try {
      const effectivePage = p ?? page;
      const params: Record<string, string | number | boolean | undefined> = { page: effectivePage, pageSize: 12 };
      if (typeFilter) params.type = typeFilter;
      if (keyword) params.keyword = keyword;
      if (sortBy) params.sortBy = sortBy;
      if (brandFilter) params.brandId = Number(brandFilter);
      if (modelFilter) params.modelId = Number(modelFilter);
      if (fuelTypeFilter) params.fuelType = fuelTypeFilter;
      if (seatCountFilter) params.seatCount = seatCountFilter;
      if (transmissionFilter) params.transmission = transmissionFilter;
      if (bodyTypeFilter) params.bodyType = bodyTypeFilter;
      if (bikeTypeFilter) params.bikeType = bikeTypeFilter;
      if (engineCapacityFilter) params.engineCapacity = engineCapacityFilter;
      if (priceFrom) params.priceFrom = Number(priceFrom);
      if (priceTo) params.priceTo = Number(priceTo);
      if (selectedFeatureIds.length > 0) params.featureIds = selectedFeatureIds.join(",");
      if (searchStartDate) params.searchStartDate = searchStartDate;
      if (searchEndDate) params.searchEndDate = searchEndDate;
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
  }, [page, keyword, sortBy, typeFilter, brandFilter, modelFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter, priceFrom, priceTo, selectedFeatureIds, searchStartDate, searchEndDate]);

  useEffect(() => { void load(1); }, [typeFilter, load]);

  const visibleBrands = brands.filter((b) => !typeFilter || b.vehicleType === typeFilter);
  const hasActiveFilters = sortBy !== "" || typeFilter !== "" || brandFilter !== "" || modelFilter !== ""
    || fuelTypeFilter !== "" || seatCountFilter !== "" || transmissionFilter !== "" || bodyTypeFilter !== ""
    || bikeTypeFilter !== "" || engineCapacityFilter !== "" || priceFrom !== "" || priceTo !== ""
    || selectedFeatureIds.length > 0 || searchStartDate !== "" || searchEndDate !== "";

  const handleSearch = () => {
    setPage(1);
    void load(1);
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
    setPriceFrom("");
    setPriceTo("");
    setSearchStartDate("");
    setSearchEndDate("");
    setSelectedFeatureIds([]);
    setPage(1);
    if (searchRef.current) searchRef.current.value = "";
    void load(1);
  };

  const toggleFeature = (featureId: number) => {
    setSelectedFeatureIds((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
    );
    setPage(1);
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    void load(p);
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

  const sidebar = (
    <div className="space-y-5">
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Sắp xếp</h4>
        <FilterDropdown label="Sắp xếp" value={sortBy} onChange={(v) => { setSortBy(v); setPage(1); }}
          options={[
            { value: "", label: "Mới nhất" },
            { value: "price_asc", label: "Giá tăng dần" },
            { value: "price_desc", label: "Giá giảm dần" },
            { value: "rating_desc", label: "Đánh giá cao nhất" },
          ]} />
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày thuê</h4>
        <div className="space-y-2">
          <input type="date" value={searchStartDate} onChange={(e) => { setSearchStartDate(e.target.value); setPage(1); }} min={new Date().toISOString().slice(0, 10)} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          <input type="date" value={searchEndDate} onChange={(e) => { setSearchEndDate(e.target.value); setPage(1); }} min={searchStartDate || new Date().toISOString().slice(0, 10)} className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Loại xe</h4>
        <div className="space-y-1">
          {[
            { value: "", label: "Tất cả" },
            { value: "Car", label: "Ô tô" },
            { value: "Motorbike", label: "Xe máy" },
          ].map((opt) => (
            <button key={opt.value} type="button" onClick={() => { setTypeFilter(opt.value); setBrandFilter(""); setModelFilter(""); setFuelTypeFilter(""); setSeatCountFilter(""); setTransmissionFilter(""); setBodyTypeFilter(""); setBikeTypeFilter(""); setEngineCapacityFilter(""); setPage(1); }}
              className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${opt.value === typeFilter ? "bg-brand-100 font-medium text-brand-700" : "text-slate-600 hover:bg-slate-100"}`}>{opt.label}</button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Hãng xe</h4>
        <FilterDropdown label="Hãng xe" value={brandFilter} onChange={(v) => { setBrandFilter(v); setModelFilter(""); setPage(1); }}
          options={[{ value: "", label: "Tất cả" }, ...visibleBrands.map((b) => ({ value: String(b.id), label: b.name }))]} />
      </div>

      {brandFilter && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Dòng xe</h4>
          <FilterDropdown label="Dòng xe" value={modelFilter} onChange={(v) => { setModelFilter(v); setPage(1); }}
            options={[{ value: "", label: "Tất cả" }, ...models.map((m) => ({ value: String(m.id), label: m.name }))]} />
        </div>
      )}

      {(!typeFilter || typeFilter === "Car") && (
        <>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Số chỗ</h4>
            <FilterDropdown label="Số chỗ" value={seatCountFilter} onChange={(v) => { setSeatCountFilter(v); setPage(1); }}
              options={[{ value: "", label: "Tất cả" }, ...seatCounts.map((item) => ({ value: item, label: `${item} chỗ` }))]} />
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Truyền động</h4>
            <FilterDropdown label="Truyền động" value={transmissionFilter} onChange={(v) => { setTransmissionFilter(v); setPage(1); }}
              options={[{ value: "", label: "Tất cả" }, ...transmissionOptions]} />
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Kiểu thân</h4>
            <FilterDropdown label="Kiểu thân" value={bodyTypeFilter} onChange={(v) => { setBodyTypeFilter(v); setPage(1); }}
              options={[{ value: "", label: "Tất cả" }, ...carBodyTypes]} />
          </div>
        </>
      )}

      {(!typeFilter || typeFilter === "Motorbike") && (
        <>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Loại xe máy</h4>
            <FilterDropdown label="Loại xe máy" value={bikeTypeFilter} onChange={(v) => { setBikeTypeFilter(v); setPage(1); }}
              options={[{ value: "", label: "Tất cả" }, ...motorbikeTypeOptions]} />
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Dung tích</h4>
            <input type="text" value={engineCapacityFilter} onChange={(e) => { setEngineCapacityFilter(e.target.value); setPage(1); }} placeholder="VD: 125cc" className="h-8 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
        </>
      )}

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Nhiên liệu</h4>
        <FilterDropdown label="Nhiên liệu" value={fuelTypeFilter} onChange={(v) => { setFuelTypeFilter(v); setPage(1); }}
          options={[{ value: "", label: "Tất cả" }, ...fuelTypeOptions]} />
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Khoảng giá</h4>
        <div className="flex items-center gap-2">
          <input type="number" value={priceFrom} onChange={(e) => { setPriceFrom(e.target.value); setPage(1); }} placeholder="Từ" min="0" className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          <span className="text-slate-400">-</span>
          <input type="number" value={priceTo} onChange={(e) => { setPriceTo(e.target.value); setPage(1); }} placeholder="Đến" min="0" className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
        </div>
      </div>

      {features.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Tiện ích</h4>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {features.map((f) => (
              <label key={f.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                <input type="checkbox" checked={selectedFeatureIds.includes(f.id)} onChange={() => toggleFeature(f.id)} className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500" />
                {f.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <button type="button" onClick={clearAllFilters} className="flex w-full items-center justify-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
          <X className="h-4 w-4" /> Xóa bộ lọc
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="border-b border-slate-200 px-4 py-4">
        <h1 className="text-lg font-semibold text-slate-800">Thuê xe</h1>
        <p className="mt-1 text-sm text-slate-500">Tìm xe phù hợp với nhu cầu của bạn</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3 md:hidden">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input ref={searchRef} type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={handleKeyDown} placeholder="Tìm theo tên xe, biển số..." className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
        </div>
        <button type="button" onClick={handleSearch} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800">
          <Search className="h-4 w-4" /> Tìm
        </button>
        <button type="button" onClick={() => setShowFilters((prev) => !prev)} className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors ${showFilters || hasActiveFilters ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
          <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
        </button>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-40 flex md:hidden" ref={sidebarRef}>
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowFilters(false)} />
          <div className="relative ml-auto h-full w-72 overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Bộ lọc</h3>
              <button type="button" onClick={() => setShowFilters(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex">
        <div className="hidden w-60 shrink-0 border-r border-slate-200 p-4 md:block">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Bộ lọc</h3>
            {hasActiveFilters && (
              <button type="button" onClick={clearAllFilters} className="text-xs text-brand-600 hover:text-brand-700">Xóa tất cả</button>
            )}
          </div>
          {sidebar}
        </div>

        <div className="min-w-0 flex-1">
          <div className="hidden items-center gap-2 border-b border-slate-200 px-4 py-3 md:flex">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input ref={searchRef} type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={handleKeyDown} placeholder="Tìm theo tên xe, biển số..." className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
            <button type="button" onClick={handleSearch} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800">
              <Search className="h-4 w-4" /> Tìm
            </button>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="text-sm font-medium text-slate-700">Tìm thấy {totalCount} xe</div>
            {isLoading && <LoadingSpinner className="h-4 w-4" />}
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 px-4 py-2">
              {typeFilter && <FilterChip label={typeFilter === "Car" ? "Ô tô" : "Xe máy"} onRemove={() => { setTypeFilter(""); setBrandFilter(""); setModelFilter(""); setFuelTypeFilter(""); setSeatCountFilter(""); setTransmissionFilter(""); setBodyTypeFilter(""); setBikeTypeFilter(""); setEngineCapacityFilter(""); setPage(1); }} />}
              {brandFilter && (() => { const b = brands.find((br) => String(br.id) === brandFilter); return b ? <FilterChip label={b.name} onRemove={() => { setBrandFilter(""); setModelFilter(""); setPage(1); }} /> : null; })()}
              {modelFilter && (() => { const m = models.find((md) => String(md.id) === modelFilter); return m ? <FilterChip label={m.name} onRemove={() => { setModelFilter(""); setPage(1); }} /> : null; })()}
              {transmissionFilter && <FilterChip label={transmissionOptions.find((o) => o.value === transmissionFilter)?.label ?? transmissionFilter} onRemove={() => { setTransmissionFilter(""); setPage(1); }} />}
              {fuelTypeFilter && <FilterChip label={fuelTypeOptions.find((o) => o.value === fuelTypeFilter)?.label ?? fuelTypeFilter} onRemove={() => { setFuelTypeFilter(""); setPage(1); }} />}
              {bodyTypeFilter && <FilterChip label={carBodyTypes.find((o) => o.value === bodyTypeFilter)?.label ?? bodyTypeFilter} onRemove={() => { setBodyTypeFilter(""); setPage(1); }} />}
              {bikeTypeFilter && <FilterChip label={motorbikeTypeOptions.find((o) => o.value === bikeTypeFilter)?.label ?? bikeTypeFilter} onRemove={() => { setBikeTypeFilter(""); setPage(1); }} />}
              {seatCountFilter && <FilterChip label={`${seatCountFilter} chỗ`} onRemove={() => { setSeatCountFilter(""); setPage(1); }} />}
              {engineCapacityFilter && <FilterChip label={engineCapacityFilter} onRemove={() => { setEngineCapacityFilter(""); setPage(1); }} />}
              {(priceFrom || priceTo) && <FilterChip label={`${priceFrom ? Number(priceFrom).toLocaleString("vi-VN") : "0"}đ - ${priceTo ? Number(priceTo).toLocaleString("vi-VN") : "∞"}đ`} onRemove={() => { setPriceFrom(""); setPriceTo(""); setPage(1); }} />}
              {selectedFeatureIds.map((fid) => { const feat = features.find((f) => f.id === fid); return feat ? <FilterChip key={`feat-${fid}`} label={feat.name} onRemove={() => toggleFeature(fid)} /> : null; })}
              {keyword && <FilterChip label={`"${keyword}"`} onRemove={() => { setKeyword(""); setPage(1); if (searchRef.current) searchRef.current.value = ""; }} />}
              {(searchStartDate || searchEndDate) && <FilterChip label={`${searchStartDate || "?"} → ${searchEndDate || "?"}`} onRemove={() => { setSearchStartDate(""); setSearchEndDate(""); setPage(1); }} />}
              <button type="button" onClick={clearAllFilters} className="text-xs font-medium text-slate-400 hover:text-slate-600 ml-1">Xoá tất cả</button>
            </div>
          )}

          <div className="p-4">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="aspect-[16/9] bg-slate-100 animate-pulse" />
                    <div className="space-y-3 p-4">
                      <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
                      <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
                      <div className="h-5 w-1/3 rounded bg-slate-100 animate-pulse" />
                      <div className="h-3 w-2/3 rounded bg-slate-100 animate-pulse" />
                      <div className="h-9 w-full rounded-lg bg-slate-100 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                <Car className="h-16 w-16 text-slate-200" />
                <p className="mt-4 text-lg font-medium text-slate-600">Không tìm thấy xe phù hợp</p>
                <p className="mt-1 text-sm text-slate-400">Hãy thử:</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-500">
                  <li>• Đổi ngày thuê</li>
                  <li>• Bỏ bớt bộ lọc</li>
                  <li>• Tăng khoảng giá</li>
                </ul>
                {hasActiveFilters && (
                  <button type="button" onClick={clearAllFilters} className="mt-4 text-sm font-medium text-brand-700 underline hover:text-brand-800">Xoá tất cả bộ lọc</button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((vehicle) => (
                  <div key={vehicle.id} className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
                    <button type="button" onClick={() => navigate(`/vehicle/${vehicle.id}`)} className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                      {vehicle.featuredImage ? (
                        <img src={vehicle.featuredImage} alt={vehicle.licensePlate} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          {vehicle.vehicleType === "Car" ? <Car className="h-12 w-12 text-slate-300" /> : <Bike className="h-12 w-12 text-slate-300" />}
                        </div>
                      )}
                      <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">{vehicle.year}</span>
                      {vehicle.averageRating >= 4.5 && vehicle.reviewCount > 0 && (
                        <span className="absolute right-2 top-2 rounded-md bg-yellow-400/90 px-2 py-0.5 text-xs font-semibold text-yellow-900 shadow-sm">Top Rated</span>
                      )}
                    </button>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-semibold text-slate-900">{vehicle.brandName} {vehicle.modelName}</h3>
                          {vehicle.variantName && <p className="truncate text-xs text-slate-400">{vehicle.variantName}</p>}
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">{vehicle.licensePlate}</span>
                      </div>

                      <div className="mb-2 mt-1 flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-slate-700">{vehicle.averageRating.toFixed(1)}</span>
                          <span className="text-slate-400">({vehicle.reviewCount})</span>
                        </div>
                        {(() => {
                          const area = splitAreaName(vehicle.areaName);
                          if (!area) return null;
                          return (
                            <div className="flex items-center gap-1 text-slate-400">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{area.province}</span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="mb-2 text-xs text-slate-400">
                        {vehicle.vehicleType === "Car" ? "Ô tô" : "Xe máy"}
                      </div>

                      <div className="mt-auto space-y-3">
                        <div className="text-lg font-bold text-brand-700">
                          {vehicle.pricePerDay.toLocaleString("vi-VN")}đ
                          <span className="text-sm font-normal text-slate-400">/ngày</span>
                        </div>

                        {vehicle.nextAvailableDate ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <Clock className="h-3 w-3" />
                            Trống từ {new Date(vehicle.nextAvailableDate).toLocaleDateString("vi-VN")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Sẵn sàng hôm nay
                          </span>
                        )}

                        {token && user ? (
                          <div className="flex gap-2">
                            <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={() => navigate(`/vehicle/${vehicle.id}`)}>
                              Xem chi tiết
                            </Button>
                            <Button type="button" variant="primary" size="sm" className="flex-[2]" onClick={() => navigate(`/customer/bookings/new?vehicleId=${vehicle.id}`)}>
                              <CalendarCheck className="h-3.5 w-3.5" /> Đặt ngay
                            </Button>
                          </div>
                        ) : (
                          <Button type="button" variant="primary" size="sm" className="w-full" onClick={() => navigate(`/vehicle/${vehicle.id}`)}>
                            Xem chi tiết
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <div className="text-sm text-slate-500">Trang {page} / {totalPages}</div>
              <div className="flex items-center gap-1">
                <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageNumbers.map((p, i) => p === "..." ? <span key={`e-${i}`} className="inline-flex h-8 w-8 items-center justify-center text-xs text-slate-400">...</span> : (
                  <button key={p} type="button" onClick={() => goToPage(p as number)} className={`inline-flex h-8 w-8 items-center justify-center rounded text-sm transition-colors ${p === page ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{p}</button>
                ))}
                <button type="button" disabled={page >= totalPages} onClick={() => goToPage(page + 1)} className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}