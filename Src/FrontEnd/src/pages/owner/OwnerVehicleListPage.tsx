import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Plus, Car, Bike, AlertCircle, MapPin } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getMyVehicles, getCatalogBrands, getCatalogModels, toggleVehicleStatus } from "@/features/vehicles/services/vehicleService";
import type { VehicleListItemResponse, CatalogBrand, CatalogModel } from "@/features/vehicles/types";
import { fuelTypeOptions, motorbikeTypeOptions } from "@/features/vehicleModelVariants/options";
import ActiveToggle from "@/components/common/ActiveToggle";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import useClickOutside from "@/hooks/useClickOutside";

function vehicleTypeLabel(value: string) {
  return value === "Car" ? "Ô tô" : "Xe máy";
}

function splitAreaName(areaName: string | null) {
  if (!areaName) return null;
  const [province, ...wardParts] = areaName.split(" - ");
  const ward = wardParts.join(" - ").trim();
  return {
    province: province?.trim() ?? "",
    ward,
  };
}

function FilterDropdown({ value, label, options, onChange }: { value: string; label: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((prev) => !prev)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50">
        <span className="text-xs text-slate-400">{label}:</span>
        <span className="font-medium">{current?.label ?? "Tất cả"}</span>
        <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
      </button>
      {open && (
        <div className="dropdown-scrollbar absolute left-0 top-full z-20 mt-1 max-h-72 w-44 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((opt) => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors ${opt.value === value ? "bg-brand-100 font-medium text-brand-700" : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"}`}>{opt.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

const statusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Hidden: "bg-slate-100 text-slate-500",
};

const statusLabels: Record<string, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Hidden: "Đã ẩn",
};

const carBodyTypes = ["Sedan", "SUV", "Hatchback", "Coupe", "Convertible", "Pickup", "MPV/Minivan", "Wagon"];
const seatCounts = ["2", "4", "5", "7", "8", "9", "16", "29", "30"];
const transmissionOptions = [
  { value: "Automatic", label: "Tự động" },
  { value: "Manual", label: "Số sàn" },
  { value: "CVT", label: "CVT" },
  { value: "DCT", label: "DCT" },
];

export default function OwnerVehicleListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const vehicleTypeParam = location.pathname.includes("/motorbike") ? "Motorbike" : location.pathname.includes("/car") ? "Car" : null;

  const [items, setItems] = useState<VehicleListItemResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [typeFilter, setTypeFilter] = useState(vehicleTypeParam ?? "");
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("");
  const [seatCountFilter, setSeatCountFilter] = useState("");
  const [transmissionFilter, setTransmissionFilter] = useState("");
  const [bodyTypeFilter, setBodyTypeFilter] = useState("");
  const [bikeTypeFilter, setBikeTypeFilter] = useState("");
  const [engineCapacityFilter, setEngineCapacityFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCatalogBrands().then(setBrands).catch(() => {});
  }, []);

  useEffect(() => {
    if (vehicleTypeParam) {
      setTypeFilter(vehicleTypeParam);
    } else {
      setTypeFilter("");
    }
  }, [vehicleTypeParam]);

  useEffect(() => {
    if (brandFilter) {
      getCatalogModels(Number(brandFilter)).then(setModels).catch(() => setModels([]));
      setModelFilter("");
    } else {
      setModels([]);
    }
  }, [brandFilter]);

  function buildParams(p?: number, kw?: string, sort?: string, vt?: string, bf?: string, mf?: string, st?: string, ft?: string, sc?: string, tr?: string, bt?: string, bkT?: string, ec?: string) {
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
    const searchStatus = st !== undefined ? st : statusFilter;
    if (searchStatus) params.status = searchStatus;
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

  const load = useCallback(async (p?: number, kw?: string, sort?: string, vt?: string, bf?: string, mf?: string, st?: string, ft?: string, sc?: string, tr?: string, bt?: string, bkT?: string, ec?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = buildParams(p, kw, sort, vt, bf, mf, st, ft, sc, tr, bt, bkT, ec);
      const result = await getMyVehicles(params);
      setItems(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch {
      setError("Không thể tải danh sách xe.");
    } finally {
      setIsLoading(false);
    }
  }, [page, keyword, sortBy, typeFilter, brandFilter, modelFilter, statusFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter]);

  useEffect(() => { void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, statusFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }, [typeFilter, load]);

  const visibleBrands = brands.filter((b) => !typeFilter || b.vehicleType === typeFilter);
  const hasActiveFilters = sortBy !== "" || typeFilter !== "" || brandFilter !== "" || modelFilter !== "" || statusFilter !== ""
    || fuelTypeFilter !== "" || seatCountFilter !== "" || transmissionFilter !== "" || bodyTypeFilter !== ""
    || bikeTypeFilter !== "" || engineCapacityFilter !== "";

  const handleSearch = () => {
    setPage(1);
    void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, statusFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearAllFilters = () => {
    setKeyword("");
    setSortBy("");
    setTypeFilter(vehicleTypeParam ?? "");
    setBrandFilter("");
    setModelFilter("");
    setStatusFilter("");
    setFuelTypeFilter("");
    setSeatCountFilter("");
    setTransmissionFilter("");
    setBodyTypeFilter("");
    setBikeTypeFilter("");
    setEngineCapacityFilter("");
    setPage(1);
    if (searchRef.current) searchRef.current.value = "";
    void load(1, "", "", vehicleTypeParam ?? "", "", "", "", "", "", "", "", "");
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    void load(p, keyword, sortBy, typeFilter, brandFilter, modelFilter, statusFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter);
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

  const handleToggleStatus = async (id: number) => {
    await toggleVehicleStatus(id);
    void load(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
  };

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <button type="button" onClick={() => void load(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined)} className="mt-3 rounded-md bg-brand-700 px-4 py-2 text-sm text-white hover:bg-brand-800">Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3">
          {vehicleTypeParam === "Car" && <Car className="h-6 w-6 text-brand-700" />}
          {vehicleTypeParam === "Motorbike" && <Bike className="h-6 w-6 text-brand-700" />}
          <h1 className="text-lg font-semibold text-slate-800">
            {vehicleTypeParam ? `Xe ${vehicleTypeLabel(vehicleTypeParam)}` : "Quản lý xe"}
          </h1>
        </div>
        <button type="button" onClick={() => navigate("/owner/vehicles/add")} className="inline-flex items-center gap-2 rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
          <Plus className="h-4 w-4" /> Thêm xe
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input ref={searchRef} type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={handleKeyDown} placeholder="Tìm biển số, mô tả..." className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
        </div>
        <button type="button" onClick={handleSearch} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-700 px-3 text-sm font-medium text-white hover:bg-brand-800">
          <Search className="h-4 w-4" /> Tìm
        </button>
        <button type="button" onClick={() => setShowFilters((prev) => !prev)} className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors ${showFilters || hasActiveFilters ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
          <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <FilterDropdown label="Sắp xếp" value={sortBy} onChange={(v) => { setSortBy(v); setPage(1); void load(1, keyword, v, typeFilter, brandFilter, modelFilter, statusFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }}
            options={[{ value: "", label: "Mới nhất" }, { value: "price_asc", label: "Giá tăng dần" }, { value: "price_desc", label: "Giá giảm dần" }]} />
          {!vehicleTypeParam && (
            <FilterDropdown label="Loại xe" value={typeFilter} onChange={(v) => { setTypeFilter(v); setBrandFilter(""); setModelFilter(""); setFuelTypeFilter(""); setSeatCountFilter(""); setTransmissionFilter(""); setBodyTypeFilter(""); setBikeTypeFilter(""); setEngineCapacityFilter(""); setPage(1); void load(1, keyword, sortBy, v, "", "", "", "", "", "", "", "", ""); }}
              options={[{ value: "", label: "Tất cả" }, { value: "Car", label: "Ô tô" }, { value: "Motorbike", label: "Xe máy" }]} />
          )}
          <FilterDropdown label="Hãng xe" value={brandFilter} onChange={(v) => { setBrandFilter(v); setModelFilter(""); setPage(1); void load(1, keyword, sortBy, typeFilter, v, "", statusFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }}
            options={[{ value: "", label: "Tất cả" }, ...visibleBrands.map((b) => ({ value: String(b.id), label: b.name }))]} />
          {brandFilter && (
            <FilterDropdown label="Dòng xe" value={modelFilter} onChange={(v) => { setModelFilter(v); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, v, statusFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }}
              options={[{ value: "", label: "Tất cả" }, ...models.map((m) => ({ value: String(m.id), label: m.name }))]} />
          )}
          {(!typeFilter || typeFilter === "Car") && (
            <>
              <FilterDropdown label="Số chỗ" value={seatCountFilter} onChange={(v) => { setSeatCountFilter(v); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, statusFilter, fuelTypeFilter, v, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }}
                options={[{ value: "", label: "Số chỗ" }, ...seatCounts.map((item) => ({ value: item, label: `${item} chỗ` }))]} />
              <FilterDropdown label="Truyền động" value={transmissionFilter} onChange={(v) => { setTransmissionFilter(v); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, statusFilter, fuelTypeFilter, seatCountFilter, v, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }}
                options={[{ value: "", label: "Truyền động" }, ...transmissionOptions]} />
              <FilterDropdown label="Kiểu thân" value={bodyTypeFilter} onChange={(v) => { setBodyTypeFilter(v); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, statusFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, v, bikeTypeFilter, engineCapacityFilter); }}
                options={[{ value: "", label: "Kiểu thân" }, ...carBodyTypes.map((item) => ({ value: item, label: item }))]} />
            </>
          )}
          {(!typeFilter || typeFilter === "Motorbike") && (
            <>
              <FilterDropdown label="Loại xe máy" value={bikeTypeFilter} onChange={(v) => { setBikeTypeFilter(v); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, statusFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, v, engineCapacityFilter); }}
                options={[{ value: "", label: "Loại xe máy" }, ...motorbikeTypeOptions]} />
              <input type="text" value={engineCapacityFilter} onChange={(e) => { setEngineCapacityFilter(e.target.value); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, statusFilter, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, e.target.value); }} placeholder="Dung tích, VD: 125cc" className="h-8 w-32 rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </>
          )}
          <FilterDropdown label="Nhiên liệu" value={fuelTypeFilter} onChange={(v) => { setFuelTypeFilter(v); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, statusFilter, v, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }}
            options={[{ value: "", label: "Nhiên liệu" }, ...fuelTypeOptions]} />
          <FilterDropdown label="Trạng thái" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); void load(1, keyword, sortBy, typeFilter, brandFilter, modelFilter, v, fuelTypeFilter, seatCountFilter, transmissionFilter, bodyTypeFilter, bikeTypeFilter, engineCapacityFilter); }}
            options={[{ value: "", label: "Tất cả" }, { value: "Pending", label: "Chờ duyệt" }, { value: "Approved", label: "Đã duyệt" }, { value: "Rejected", label: "Từ chối" }, { value: "Hidden", label: "Đã ẩn" }]} />
          {hasActiveFilters && <button type="button" onClick={clearAllFilters} className="text-xs font-medium text-brand-700 hover:text-brand-800">Xóa bộ lọc</button>}
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="text-sm font-medium text-slate-700">{totalCount} xe</div>
        {isLoading && <LoadingSpinner className="h-4 w-4" />}
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><LoadingSpinner className="h-8 w-8" /></div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <Car className="h-16 w-16 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">Chưa có xe nào</p>
            <button type="button" onClick={() => navigate("/owner/vehicles/add")} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800">
              <Plus className="h-4 w-4" /> Thêm xe
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((vehicle) => (
              <div key={vehicle.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
                <button type="button" onClick={() => navigate(`/owner/vehicles/${vehicle.id}`)} className="block w-full text-left">
                  <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                    {vehicle.featuredImage ? (
                      <img src={vehicle.featuredImage} alt={vehicle.licensePlate} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {vehicle.vehicleType === "Car" ? <Car className="h-12 w-12 text-slate-300" /> : <Bike className="h-12 w-12 text-slate-300" />}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">{vehicle.brandName} {vehicle.modelName}</span>
                      {vehicle.variantName && <span className="text-xs text-slate-400">- {vehicle.variantName}</span>}
                    </div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{vehicle.licensePlate}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColors[vehicle.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {statusLabels[vehicle.status] ?? vehicle.status}
                      </span>
                    </div>
                    {(() => {
                      const area = splitAreaName(vehicle.areaName);
                      if (!area) return null;
                      return (
                        <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{area.province}</span>
                          {area.ward && <span className="truncate text-slate-400">- {area.ward}</span>}
                        </div>
                      );
                    })()}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand-700">{vehicle.pricePerDay.toLocaleString("vi-VN")}đ/ngày</span>
                      <span className="text-xs text-slate-400">{vehicle.year}</span>
                    </div>
                  </div>
                </button>
                {(vehicle.status === "Approved" || vehicle.status === "Hidden") && (
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <ActiveToggle isActive={vehicle.status === "Approved"} itemName={vehicle.licensePlate} onToggle={() => handleToggleStatus(vehicle.id)} />
                  </div>
                )}
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
  );
}
