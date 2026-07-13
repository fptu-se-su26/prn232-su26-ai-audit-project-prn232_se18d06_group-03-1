import {
  Bike,
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Gauge,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { fuelTypeOptions, motorbikeTypeOptions } from "@/features/vehicleModelVariants/options";
import { getCatalogAreas, getCatalogBrands, getCatalogModels } from "@/features/vehicles/services/vehicleService";
import { getPublicVehicles } from "@/features/vehicles/services/publicVehicleService";
import type { CatalogArea, CatalogBrand, CatalogModel, VehicleListItemResponse } from "@/features/vehicles/types";

const PAGE_SIZE = 12;
const MIN_PRICE_LIMIT = 0;
const MAX_PRICE_LIMIT = 2_000_000;
const PRICE_STEP = 50_000;

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

const sortOptions = [
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
  { value: "rating_desc", label: "Đánh giá tốt nhất" },
];

function splitAreaName(areaName: string | null) {
  if (!areaName) return null;
  const [province, ...wardParts] = areaName.split(" - ");
  return { province: province?.trim() ?? "", ward: wardParts.join(" - ").trim() };
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-xs font-medium text-slate-500">{children}</label>;
}

function FilterGroup({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0 dark:border-neutral-900">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
        <span className="text-brand-600 dark:text-brand-400">{icon}</span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function SelectField({
  value,
  options,
  onChange,
  placeholder = "Tất cả",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={[
        "h-10 w-full rounded-md border bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:bg-neutral-950 dark:text-white",
        value
          ? "border-brand-400 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-950/25"
          : "border-slate-200 dark:border-neutral-800",
      ].join(" ")}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default function VehicleListPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const searchRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<VehicleListItemResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [areas, setAreas] = useState<CatalogArea[]>([]);

  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("");
  const [seatCountFilter, setSeatCountFilter] = useState("");
  const [transmissionFilter, setTransmissionFilter] = useState("");
  const [bodyTypeFilter, setBodyTypeFilter] = useState("");
  const [bikeTypeFilter, setBikeTypeFilter] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    getCatalogBrands().then(setBrands).catch(() => setBrands([]));
    getCatalogAreas().then(setAreas).catch(() => setAreas([]));
  }, []);

  useEffect(() => {
    if (!brandFilter) {
      setModels([]);
      setModelFilter("");
      return;
    }

    getCatalogModels(Number(brandFilter)).then(setModels).catch(() => setModels([]));
    setModelFilter("");
  }, [brandFilter]);

  const visibleBrands = useMemo(
    () => brands.filter((brand) => !typeFilter || brand.vehicleType === typeFilter),
    [brands, typeFilter],
  );

  const hasActiveFilters = Boolean(
    keyword ||
      sortBy ||
      typeFilter ||
      brandFilter ||
      modelFilter ||
      areaFilter ||
      minPrice ||
      maxPrice ||
      pickupDate ||
      returnDate ||
      fuelTypeFilter ||
      seatCountFilter ||
      transmissionFilter ||
      bodyTypeFilter ||
      bikeTypeFilter,
  );

  const activeFilterCount = [
    keyword,
    sortBy,
    typeFilter,
    brandFilter,
    modelFilter,
    areaFilter,
    minPrice,
    maxPrice,
    pickupDate,
    returnDate,
    fuelTypeFilter,
    seatCountFilter,
    transmissionFilter,
    bodyTypeFilter,
    bikeTypeFilter,
  ].filter(Boolean).length;

  const formatPrice = (value: string) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

  const getOptionLabel = (options: { value: string; label: string }[], value: string) =>
    options.find((option) => option.value === value)?.label ?? value;

  const activeChips = [
    keyword ? { key: "keyword", label: keyword, clear: () => setKeyword("") } : null,
    areaFilter ? { key: "area", label: getOptionLabel(areas.map((area) => ({ value: String(area.id), label: area.province })), areaFilter), clear: () => setAreaFilter("") } : null,
    typeFilter ? { key: "type", label: typeFilter === "Car" ? "Ô tô" : "Xe máy", clear: () => setTypeFilter("") } : null,
    brandFilter ? { key: "brand", label: getOptionLabel(visibleBrands.map((brand) => ({ value: String(brand.id), label: brand.name })), brandFilter), clear: () => setBrandFilter("") } : null,
    modelFilter ? { key: "model", label: getOptionLabel(models.map((model) => ({ value: String(model.id), label: model.name })), modelFilter), clear: () => setModelFilter("") } : null,
    minPrice || maxPrice ? { key: "price", label: `${formatPrice(minPrice)} - ${formatPrice(maxPrice || String(MAX_PRICE_LIMIT))}`, clear: () => { setMinPrice(""); setMaxPrice(""); } } : null,
    pickupDate || returnDate ? { key: "date", label: `${pickupDate || "..."} → ${returnDate || "..."}`, clear: () => { setPickupDate(""); setReturnDate(""); } } : null,
  ].filter((chip): chip is { key: string; label: string; clear: () => void } => Boolean(chip));

  const buildParams = useCallback(
    (targetPage: number) => {
      const params: Record<string, string | number | boolean | undefined> = {
        page: targetPage,
        pageSize: PAGE_SIZE,
      };

      if (keyword.trim()) params.keyword = keyword.trim();
      if (sortBy) params.sortBy = sortBy;
      if (typeFilter) params.type = typeFilter;
      if (brandFilter) params.brandId = Number(brandFilter);
      if (modelFilter) params.modelId = Number(modelFilter);
      if (areaFilter) params.areaId = Number(areaFilter);
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);
      if (pickupDate) params.startDate = pickupDate;
      if (returnDate) params.endDate = returnDate;
      if (fuelTypeFilter) params.fuelType = fuelTypeFilter;
      if (seatCountFilter) params.seatCount = seatCountFilter;
      if (transmissionFilter) params.transmission = transmissionFilter;
      if (bodyTypeFilter) params.bodyType = bodyTypeFilter;
      if (bikeTypeFilter) params.bikeType = bikeTypeFilter;

      return params;
    },
    [
      areaFilter,
      bikeTypeFilter,
      bodyTypeFilter,
      brandFilter,
      fuelTypeFilter,
      keyword,
      maxPrice,
      minPrice,
      modelFilter,
      pickupDate,
      returnDate,
      seatCountFilter,
      sortBy,
      transmissionFilter,
      typeFilter,
    ],
  );

  const load = useCallback(
    async (targetPage = page) => {
      setIsLoading(true);
      try {
        const result = await getPublicVehicles(buildParams(targetPage));
        setItems(result.items);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
        setPage(result.page);
      } catch {
        setItems([]);
        setTotalCount(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    },
    [buildParams, page],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function handleSearch() {
    setPage(1);
    void load(1);
  }

  function clearAllFilters() {
    setKeyword("");
    setSortBy("");
    setTypeFilter("");
    setBrandFilter("");
    setModelFilter("");
    setAreaFilter("");
    setMinPrice("");
    setMaxPrice("");
    setPickupDate("");
    setReturnDate("");
    setFuelTypeFilter("");
    setSeatCountFilter("");
    setTransmissionFilter("");
    setBodyTypeFilter("");
    setBikeTypeFilter("");
    setPage(1);
    if (searchRef.current) searchRef.current.value = "";
  }

  function goToPage(targetPage: number) {
    if (targetPage < 1 || targetPage > totalPages) return;
    setPage(targetPage);
    void load(targetPage);
  }

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
    <div className="min-h-screen bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] pb-16 text-slate-900 transition-colors duration-300 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white">
      <div className="relative overflow-hidden border-b border-slate-100 bg-white/40 px-5 py-14 text-left shadow-md backdrop-blur-md dark:border-neutral-900 dark:bg-black/25 sm:px-6 sm:py-[4.5rem] lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-brand-500/10 to-transparent blur-3xl" />
        <div className="relative max-w-4xl">
          <h1 className="mt-2 text-lg font-semibold text-slate-800 dark:text-white">
            Thuê xe linh hoạt
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-gray-400 sm:text-base">
            So sánh xe còn trống theo thời gian nhận trả, khu vực và mức giá để đặt chuyến đi gọn hơn.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 px-5 py-8 sm:px-6 lg:flex-row lg:gap-8 lg:px-8">
        <aside className="w-full shrink-0 lg:w-[360px]">
          <section className="sticky top-24 rounded-md border border-slate-300 bg-white p-5 shadow-[0_12px_40px_-4px_rgba(124,58,237,0.18)] transition-colors dark:border-neutral-700 dark:bg-neutral-950/70 dark:shadow-[0_12px_40px_-4px_rgba(139,92,246,0.25)]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-neutral-900">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                  <SlidersHorizontal className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-950 dark:text-white">
                    Bộ lọc{activeFilterCount ? ` (${activeFilterCount})` : ""}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {activeFilterCount ? `Đang áp dụng ${activeFilterCount} bộ lọc` : "Chọn các tiêu chí phổ biến trước."}
                  </p>
                </div>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.clear}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/60 dark:bg-brand-950/40 dark:text-brand-300"
                  >
                    <span className="truncate">{chip.label}</span>
                    <X className="h-3 w-3 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 space-y-5">
              <FilterGroup icon={<Search className="h-4 w-4" />} title="Từ khóa">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={keyword}
                    onChange={(event) => updateFilter(setKeyword, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleSearch();
                    }}
                    placeholder="Tìm theo xe, hãng..."
                    className={[
                      "h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:bg-neutral-950 dark:text-white",
                      keyword ? "border-brand-400 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-950/25" : "border-slate-200 dark:border-neutral-800",
                    ].join(" ")}
                  />
                </div>
              </FilterGroup>

              <FilterGroup icon={<CalendarDays className="h-4 w-4" />} title="Thời gian">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(event) => updateFilter(setPickupDate, event.target.value)}
                    className={[
                      "h-10 min-w-0 rounded-md border bg-white px-2 text-xs font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:bg-neutral-950 dark:text-white",
                      pickupDate ? "border-brand-400 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-950/25" : "border-slate-200 dark:border-neutral-800",
                    ].join(" ")}
                  />
                  <span className="text-xs font-medium text-slate-400">→</span>
                  <input
                    type="date"
                    min={pickupDate || undefined}
                    value={returnDate}
                    onChange={(event) => updateFilter(setReturnDate, event.target.value)}
                    className={[
                      "h-10 min-w-0 rounded-md border bg-white px-2 text-xs font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:bg-neutral-950 dark:text-white",
                      returnDate ? "border-brand-400 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-950/25" : "border-slate-200 dark:border-neutral-800",
                    ].join(" ")}
                  />
                </div>
              </FilterGroup>

              <FilterGroup icon={<DollarSign className="h-4 w-4" />} title="Giá">
                <div className="space-y-3">
                  <div className="relative h-7">
                    <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-neutral-800" />
                    <input
                      type="range"
                      min={MIN_PRICE_LIMIT}
                      max={MAX_PRICE_LIMIT}
                      step={PRICE_STEP}
                      value={Number(minPrice || MIN_PRICE_LIMIT)}
                      onChange={(event) => {
                        const next = Math.min(Number(event.target.value), Number(maxPrice || MAX_PRICE_LIMIT) - PRICE_STEP);
                        updateFilter(setMinPrice, String(Math.max(MIN_PRICE_LIMIT, next)));
                      }}
                      className="pointer-events-none absolute inset-x-0 top-0 h-7 w-full appearance-none bg-transparent accent-brand-600 [&::-webkit-slider-thumb]:pointer-events-auto"
                    />
                    <input
                      type="range"
                      min={MIN_PRICE_LIMIT}
                      max={MAX_PRICE_LIMIT}
                      step={PRICE_STEP}
                      value={Number(maxPrice || MAX_PRICE_LIMIT)}
                      onChange={(event) => {
                        const next = Math.max(Number(event.target.value), Number(minPrice || MIN_PRICE_LIMIT) + PRICE_STEP);
                        updateFilter(setMaxPrice, String(Math.min(MAX_PRICE_LIMIT, next)));
                      }}
                      className="pointer-events-none absolute inset-x-0 top-0 h-7 w-full appearance-none bg-transparent accent-brand-600 [&::-webkit-slider-thumb]:pointer-events-auto"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>{formatPrice(minPrice)}</span>
                    <span>{formatPrice(maxPrice || String(MAX_PRICE_LIMIT))}</span>
                  </div>
                </div>
              </FilterGroup>

              <FilterGroup icon={<Car className="h-4 w-4" />} title="Thông tin xe">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <FieldLabel>Địa điểm</FieldLabel>
                    <SelectField
                      value={areaFilter}
                      onChange={(value) => updateFilter(setAreaFilter, value)}
                      options={areas.map((area) => ({ value: String(area.id), label: `${area.province} - ${area.district}` }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Loại xe</FieldLabel>
                    <SelectField
                      value={typeFilter}
                      onChange={(value) => {
                        updateFilter(setTypeFilter, value);
                        setBrandFilter("");
                        setModelFilter("");
                        setBodyTypeFilter("");
                        setBikeTypeFilter("");
                      }}
                      options={[
                        { value: "Car", label: "Ô tô" },
                        { value: "Motorbike", label: "Xe máy" },
                      ]}
                    />
                  </div>
                </div>
              </FilterGroup>

              <div className="border-t border-slate-100 pt-4 dark:border-neutral-900">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((value) => !value)}
                  className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-950 transition hover:text-brand-700 dark:text-white dark:hover:text-brand-300"
                >
                  <span className="inline-flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    Bộ lọc nâng cao
                  </span>
                  <span className={`text-xs transition-transform ${advancedOpen ? "rotate-180" : ""}`}>▼</span>
                </button>

                {advancedOpen && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-1.5">
                      <FieldLabel>Hãng xe</FieldLabel>
                      <SelectField
                        value={brandFilter}
                        onChange={(value) => updateFilter(setBrandFilter, value)}
                        options={visibleBrands.map((brand) => ({ value: String(brand.id), label: brand.name }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel>Dòng xe</FieldLabel>
                      <SelectField
                        value={modelFilter}
                        onChange={(value) => updateFilter(setModelFilter, value)}
                        options={models.map((model) => ({ value: String(model.id), label: model.name }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel>Số ghế</FieldLabel>
                      <SelectField
                        value={seatCountFilter}
                        onChange={(value) => updateFilter(setSeatCountFilter, value)}
                        options={seatCounts.map((count) => ({ value: count, label: `${count} chỗ` }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel>Nhiên liệu</FieldLabel>
                      <SelectField
                        value={fuelTypeFilter}
                        onChange={(value) => updateFilter(setFuelTypeFilter, value)}
                        options={fuelTypeOptions}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel>Sắp xếp</FieldLabel>
                      <SelectField
                        value={sortBy}
                        onChange={(value) => updateFilter(setSortBy, value)}
                        placeholder="Mới nhất"
                        options={sortOptions}
                      />
                    </div>

                    {(!typeFilter || typeFilter === "Car") && (
                      <>
                        <div className="space-y-1.5">
                          <FieldLabel>Truyền động</FieldLabel>
                          <SelectField
                            value={transmissionFilter}
                            onChange={(value) => updateFilter(setTransmissionFilter, value)}
                            options={transmissionOptions}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel>Kiểu thân</FieldLabel>
                          <SelectField
                            value={bodyTypeFilter}
                            onChange={(value) => updateFilter(setBodyTypeFilter, value)}
                            options={carBodyTypes}
                          />
                        </div>
                      </>
                    )}

                    {(!typeFilter || typeFilter === "Motorbike") && (
                      <div className="space-y-1.5">
                        <FieldLabel>Loại xe máy</FieldLabel>
                        <SelectField
                          value={bikeTypeFilter}
                          onChange={(value) => updateFilter(setBikeTypeFilter, value)}
                          options={motorbikeTypeOptions}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-[auto_1fr] gap-2 border-t border-slate-100 pt-4 dark:border-neutral-900">
              <button
                type="button"
                onClick={clearAllFilters}
                disabled={!hasActiveFilters}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-900"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Reset
              </button>
              <Button type="button" variant="primary" onClick={handleSearch} className="h-10">
                <Search className="h-4 w-4" />
                Áp dụng
              </Button>
            </div>
          </section>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between px-1">
            <div className="text-sm font-medium text-slate-700 dark:text-gray-300">
              Tìm thấy <span className="font-semibold text-brand-600 dark:text-brand-400">{totalCount}</span> xe sẵn sàng
            </div>
            {isLoading && <LoadingSpinner className="h-5 w-5 text-brand-600" />}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner className="h-10 w-10 text-brand-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-md border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
              <Car className="h-16 w-16 text-slate-300 dark:text-neutral-700" />
              <p className="mt-4 text-sm font-medium text-slate-500">Chưa có xe nào</p>
              <p className="mt-2 text-xs text-slate-400">Hãy điều chỉnh bộ lọc hoặc mở rộng khoảng giá/ngày thuê.</p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-5 text-xs font-medium text-white shadow-md transition hover:bg-brand-700"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {items.map((vehicle) => {
                const area = splitAreaName(vehicle.areaName);
                return (
                  <article
                    key={vehicle.id}
                    className="group relative flex min-h-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
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
                          {vehicle.vehicleType === "Car" ? (
                            <Car className="h-12 w-12 text-slate-300 dark:text-neutral-700" />
                          ) : (
                            <Bike className="h-12 w-12 text-slate-300 dark:text-neutral-700" />
                          )}
                        </div>
                      )}

                      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-slate-950/85 px-2.5 py-1 text-[10px] font-medium text-white">
                        {vehicle.vehicleType === "Car" ? <Car className="h-3.5 w-3.5" /> : <Bike className="h-3.5 w-3.5" />}
                        {vehicle.vehicleType === "Car" ? "Ô tô" : "Xe máy"}
                      </span>
                      <span className="absolute right-3 top-3 rounded-md bg-brand-600/95 px-2.5 py-1 text-[10px] font-medium text-white">
                        Đời {vehicle.year}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">{vehicle.brandName} {vehicle.modelName}</span>
                        {vehicle.variantName && <span className="text-xs text-slate-400">- {vehicle.variantName}</span>}
                      </div>
                      <h3 className="mt-2 truncate font-semibold text-slate-800 dark:text-white">
                        {vehicle.variantName || `${vehicle.brandName} ${vehicle.modelName}`}
                      </h3>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-neutral-900 dark:text-gray-300 dark:ring-neutral-800">
                          {vehicle.licensePlate}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-100">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          Đánh giá
                        </span>
                      </div>

                      {area && (
                        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
                          <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
                          <span className="truncate">{area.province}</span>
                          {area.ward && <span className="truncate text-slate-400"> - {area.ward}</span>}
                        </div>
                      )}

                      <div className="mt-auto border-t border-slate-100 pt-4 dark:border-neutral-900">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <span className="text-sm font-semibold text-brand-700">
                              {vehicle.pricePerDay.toLocaleString("vi-VN")}đ/ngày
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300 dark:hover:bg-neutral-800"
                          >
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(token && user ? `/booking/new?vehicleId=${vehicle.id}` : `/vehicle/${vehicle.id}`)}
                            className="inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-3 text-xs font-medium text-white shadow-md shadow-brand-600/10 transition hover:bg-brand-700"
                          >
                            {token && user ? "Đặt ngay" : "Thuê ngay"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-between border-t border-slate-200 px-1 pt-6 dark:border-neutral-800">
              <div className="text-xs font-medium text-slate-500 dark:text-gray-400">
                Trang {page} / {totalPages}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                {pageNumbers.map((item, index) =>
                  item === "..." ? (
                    <span key={`ellipsis-${index}`} className="inline-flex h-9 w-9 items-center justify-center text-xs text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => goToPage(item)}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-xs font-medium transition ${
                        item === page
                          ? "bg-brand-600 text-white shadow-md shadow-brand-600/15"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-900"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 dark:border-neutral-800 dark:hover:bg-neutral-900"
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
