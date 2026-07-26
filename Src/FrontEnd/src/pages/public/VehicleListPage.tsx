import {
  CalendarDays,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import HomeChatWidget from "@/components/chat/HomeChatWidget";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { fuelTypeOptions, motorbikeTypeOptions } from "@/features/vehicleModelVariants/options";
import { getCatalogAreas, getCatalogBrands, getCatalogModels } from "@/features/vehicles/services/vehicleService";
import { getPublicVehicles } from "@/features/vehicles/services/publicVehicleService";
import type { CatalogArea, CatalogBrand, CatalogModel, VehicleListItemResponse } from "@/features/vehicles/types";

import { useRef } from "react";
import useClickOutside from "@/hooks/useClickOutside";

const PAGE_SIZE = 20;
const MIN_PRICE_LIMIT = 0;
const MAX_PRICE_LIMIT = 2_000_000;
const PRICE_STEP = 50_000;

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function FilterDropdown({
  value,
  label,
  options,
  onChange,
  className,
  isMinimal = false,
}: {
  value: string;
  label: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  className?: string;
  isMinimal?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const current = options.find((o) => o.value === value);
  const searchable = isMinimal && options.length > 8;
  const normalizedQuery = normalizeSearchText(query);
  const visibleOptions = normalizedQuery
    ? options.filter((option) => normalizeSearchText(option.label).includes(normalizedQuery))
    : options;

  return (
    <div className={cx("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setQuery("");
        }}
        className={
          isMinimal
            ? "flex w-full items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-gray-300 dark:hover:text-white"
            : cx(
                "inline-flex h-10 items-center gap-1.5 rounded-full border bg-white px-4 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20",
                value ? "border-brand-300 bg-brand-50/80 text-brand-800 dark:bg-brand-900/30 dark:text-brand-400" : "border-slate-300"
              )
        }
      >
        {label && <span className="text-xs text-slate-400">{label}:</span>}
        <span className={isMinimal ? "" : "font-semibold"}>{current?.label ?? "Đà Nẵng"}</span>
        <ChevronDown className="h-4 w-4 text-slate-400 dark:text-gray-500" />
      </button>
      {open && (
        <div className={cx(
          "absolute left-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/70 backdrop-blur-xl dark:border-white/10 dark:bg-surface-elevated/95 dark:ring-white/10",
          searchable ? "w-[min(20rem,calc(100vw-2rem))]" : "w-60",
        )}>
          {searchable ? (
            <div className="border-b border-slate-200/80 p-2.5 dark:border-white/10">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm tỉnh, quận hoặc phường..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white/80 pl-9 pr-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                />
              </div>
              <p className="mt-1.5 px-1 text-xs text-slate-400">Có thể tìm không dấu, ví dụ “Da Nang”.</p>
            </div>
          ) : null}

          <div className="dropdown-scrollbar max-h-64 overflow-auto py-1.5">
            {visibleOptions.length > 0 ? visibleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setQuery("");
                }}
                className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                  opt.value === value
                    ? "bg-brand-100/80 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                    : "text-slate-700 hover:bg-brand-50/80 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-white/[0.07] dark:hover:text-white"
                }`}
              >
                <span className="truncate">{opt.label}</span>
              </button>
            )) : (
              <div className="px-4 py-8 text-center">
                <MapPin className="mx-auto h-5 w-5 text-slate-300 dark:text-gray-600" />
                <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">Không tìm thấy khu vực phù hợp.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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
  { value: "Automatic", label: "Số tự động" },
  { value: "Manual", label: "Số sàn" },
  { value: "CVT", label: "CVT" },
  { value: "DCT", label: "DCT" },
];

const sortOptions = [
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
  { value: "rating_desc", label: "Đánh giá tốt nhất" },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeVehicleType(value: string | null) {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  if (normalized === "car" || normalized === "oto" || normalized === "ô tô") return "Car";
  if (normalized === "motorbike" || normalized === "bike" || normalized === "xe may" || normalized === "xe máy") return "Motorbike";
  return "";
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-xs font-semibold text-slate-600 dark:text-gray-300">{children}</label>;
}

function PanelSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Tất cả",
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cx(
          "h-10 w-full rounded-md border bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white",
          value ? "border-brand-300 bg-brand-50/70 dark:bg-brand-900/30 dark:border-brand-700" : "border-slate-200",
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function VehicleListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [items, setItems] = useState<VehicleListItemResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [areas, setAreas] = useState<CatalogArea[]>([]);

  const [keyword, setKeyword] = useState(() => searchParams.get("keyword")?.trim() ?? "");
  const [sortBy, setSortBy] = useState("");
  const [typeFilter, setTypeFilter] = useState(() => normalizeVehicleType(searchParams.get("type")));
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState(() => searchParams.get("areaId") ?? "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [pickupDate, setPickupDate] = useState(() => toDateTimeLocalValue(searchParams.get("startDate")));
  const [returnDate, setReturnDate] = useState(() => toDateTimeLocalValue(searchParams.get("endDate")));
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
    setKeyword(searchParams.get("keyword")?.trim() ?? "");
    setTypeFilter(normalizeVehicleType(searchParams.get("type")));
    setAreaFilter(searchParams.get("areaId") ?? "");
    setPickupDate(toDateTimeLocalValue(searchParams.get("startDate")));
    setReturnDate(toDateTimeLocalValue(searchParams.get("endDate")));
    setPage(1);
  }, [searchParams]);

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

  const selectedAreaLabel = useMemo(() => {
    const area = areas.find((item) => String(item.id) === areaFilter);
    return area ? area.province : "Đà Nẵng";
  }, [areaFilter, areas]);

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
    areaFilter
      ? {
          key: "area",
          label: getOptionLabel(
            areas.map((area) => ({ value: String(area.id), label: `${area.province} - ${area.district}` })),
            areaFilter,
          ),
          clear: () => setAreaFilter(""),
        }
      : null,
    typeFilter ? { key: "type", label: typeFilter === "Car" ? "Ô tô" : "Xe máy", clear: () => setTypeFilter("") } : null,
    brandFilter
      ? {
          key: "brand",
          label: getOptionLabel(visibleBrands.map((brand) => ({ value: String(brand.id), label: brand.name })), brandFilter),
          clear: () => setBrandFilter(""),
        }
      : null,
    modelFilter
      ? {
          key: "model",
          label: getOptionLabel(models.map((model) => ({ value: String(model.id), label: model.name })), modelFilter),
          clear: () => setModelFilter(""),
        }
      : null,
    minPrice || maxPrice
      ? {
          key: "price",
          label: `${formatPrice(minPrice)} - ${formatPrice(maxPrice || String(MAX_PRICE_LIMIT))}`,
          clear: () => {
            setMinPrice("");
            setMaxPrice("");
          },
        }
      : null,
    pickupDate || returnDate
      ? {
          key: "date",
          label: `${pickupDate || "..."} -> ${returnDate || "..."}`,
          clear: () => {
            setPickupDate("");
            setReturnDate("");
          },
        }
      : null,
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
    <div className="min-h-screen bg-slate-50/80 pb-16 text-slate-950 dark:bg-surface-base dark:text-gray-100">
      <section className="relative z-30 border-b border-brand-100/80 bg-[radial-gradient(circle_at_18%_10%,rgba(196,181,253,0.28),transparent_34%),linear-gradient(110deg,rgba(250,245,255,0.98),rgba(245,243,255,0.92),rgba(253,244,255,0.82))] px-4 pb-4 pt-3 shadow-[0_8px_28px_rgba(109,40,217,0.06)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_18%_10%,rgba(124,58,237,0.16),transparent_34%),linear-gradient(110deg,#111116,#15121d,#111116)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="mx-auto flex max-w-[1120px] items-center rounded-xl border border-white/90 bg-white/72 shadow-[0_14px_34px_rgba(91,33,182,0.11)] ring-1 ring-brand-100/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:ring-brand-500/15">
            <div className="flex min-w-0 flex-[1.2] items-center gap-3 border-r border-brand-100/80 px-4 py-2.5 transition-colors hover:bg-white/45 dark:border-white/10 dark:hover:bg-white/[0.035] md:min-w-[230px]">
              <MapPin className="h-5 w-5 shrink-0 text-brand-500 dark:text-brand-300" />
              <span className="min-w-0 flex-1">
                <span className="block whitespace-nowrap text-xs font-semibold text-slate-900 dark:text-white">
                  Địa điểm nhận xe
                </span>
                <FilterDropdown
                  label=""
                  value={areaFilter}
                  onChange={(value) => updateFilter(setAreaFilter, value)}
                  className="mt-0.5 !border-0 !p-0 !bg-transparent !shadow-none w-full"
                  isMinimal
                  options={[
                    { value: "", label: "Đà Nẵng" },
                    ...areas.map((area) => ({
                      value: String(area.id),
                      label: `${area.province} - ${area.district}`,
                    })),
                  ]}
                />
              </span>
            </div>

            <label className="hidden min-w-[210px] items-center gap-3 border-r border-brand-100/80 px-4 py-2.5 transition-colors hover:bg-white/45 md:flex dark:border-white/10 dark:hover:bg-white/[0.035]">
              <CalendarDays className="h-5 w-5 shrink-0 text-violet-500 dark:text-violet-300" />
              <span className="min-w-0">
                <span className="block whitespace-nowrap text-xs font-semibold text-slate-900 dark:text-white">
                  Ngày nhận xe
                </span>
                <input
                  type="datetime-local"
                  value={pickupDate}
                  onChange={(event) => updateFilter(setPickupDate, event.target.value)}
                  className="mt-0.5 w-full min-w-0 bg-transparent text-sm font-medium text-slate-500 outline-none dark:text-gray-300 dark:[color-scheme:dark]"
                />
              </span>
            </label>

            <label className="hidden min-w-[210px] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/45 md:flex dark:hover:bg-white/[0.035]">
              <CalendarDays className="h-5 w-5 shrink-0 text-fuchsia-500 dark:text-fuchsia-300" />
              <span className="min-w-0">
                <span className="block whitespace-nowrap text-xs font-semibold text-slate-900 dark:text-white">
                  Ngày trả xe
                </span>
                <input
                  type="datetime-local"
                  min={pickupDate || undefined}
                  value={returnDate}
                  onChange={(event) => updateFilter(setReturnDate, event.target.value)}
                  className="mt-0.5 w-full min-w-0 bg-transparent text-sm font-medium text-slate-500 outline-none dark:text-gray-300 dark:[color-scheme:dark]"
                />
              </span>
            </label>

            <button
              type="button"
              onClick={handleSearch}
              className="m-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-fuchsia-500 text-white shadow-lg shadow-brand-600/25 transition hover:from-brand-700 hover:to-fuchsia-600 hover:shadow-xl active:scale-[0.98]"
              aria-label="Tìm xe"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/70 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-ui-border dark:bg-surface-base/85 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 overflow-visible rounded-xl border border-white/80 bg-white/55 p-1.5 shadow-sm ring-1 ring-inset ring-slate-200/60 backdrop-blur-lg dark:border-white/[0.06] dark:bg-white/[0.035] dark:ring-white/10">
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              title="Xóa toàn bộ bộ lọc"
              className="inline-flex h-10 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
              aria-label="Xóa bộ lọc"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <FilterDropdown
              label="Loại xe"
              value={typeFilter}
              onChange={(value) => {
                updateFilter(setTypeFilter, value);
                setBrandFilter("");
                setModelFilter("");
                setBodyTypeFilter("");
                setBikeTypeFilter("");
              }}
              options={[
                { value: "", label: "Tất cả" },
                { value: "Car", label: "Ô tô" },
                { value: "Motorbike", label: "Xe máy" },
              ]}
            />
            <FilterDropdown
              label="Hãng xe"
              value={brandFilter}
              onChange={(value) => updateFilter(setBrandFilter, value)}
              options={[{ value: "", label: "Tất cả" }, ...visibleBrands.map((brand) => ({ value: String(brand.id), label: brand.name }))]}
            />
            <FilterDropdown
              label="Nhiên liệu"
              value={fuelTypeFilter}
              onChange={(value) => updateFilter(setFuelTypeFilter, value)}
              options={[{ value: "", label: "Tất cả" }, ...fuelTypeOptions]}
            />
            <FilterDropdown
              label="Hộp số"
              value={transmissionFilter}
              onChange={(value) => updateFilter(setTransmissionFilter, value)}
              options={[{ value: "", label: "Tất cả" }, ...transmissionOptions]}
            />
            <FilterDropdown
              label="Số chỗ"
              value={seatCountFilter}
              onChange={(value) => updateFilter(setSeatCountFilter, value)}
              options={[{ value: "", label: "Tất cả" }, ...seatCounts.map((count) => ({ value: count, label: `${count} chỗ` }))]}
            />

            <button
              type="button"
              onClick={() => setAdvancedOpen((value) => !value)}
              className={cx(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium shadow-sm transition",
                advancedOpen || activeFilterCount > 0
                  ? "border-brand-300 bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-400"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Bộ lọc
              {activeFilterCount > 0 ? <span className="text-xs">({activeFilterCount})</span> : null}
              <ChevronDown className={cx("h-4 w-4 transition", advancedOpen && "rotate-180")} />
            </button>


          </div>

          {activeChips.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                >
                  <span className="truncate">{chip.label}</span>
                  <X className="h-3 w-3 shrink-0" />
                </button>
              ))}
            </div>
          ) : null}

          {advancedOpen ? (
            <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-transparent sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              <div className="space-y-1.5 sm:col-span-2">
                <FieldLabel>Từ khóa</FieldLabel>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(event) => updateFilter(setKeyword, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleSearch();
                    }}
                    placeholder="Tìm theo tên xe, hãng xe..."
                    className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-white/20 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </div>

              <PanelSelect
                label="Dòng xe"
                value={modelFilter}
                onChange={(value) => updateFilter(setModelFilter, value)}
                placeholder={!brandFilter ? "Chọn hãng trước" : "Tất cả dòng xe"}
                options={models.map((model) => ({ value: String(model.id), label: model.name }))}
              />
              {(!typeFilter || typeFilter === "Car") && (
                <PanelSelect
                  label="Kiểu thân"
                  value={bodyTypeFilter}
                  onChange={(value) => updateFilter(setBodyTypeFilter, value)}
                  options={carBodyTypes}
                />
              )}

              {(!typeFilter || typeFilter === "Motorbike") && (
                <PanelSelect
                  label="Loại xe máy"
                  value={bikeTypeFilter}
                  onChange={(value) => updateFilter(setBikeTypeFilter, value)}
                  options={motorbikeTypeOptions}
                />
              )}

              <div className="space-y-1.5">
                <FieldLabel>Giá từ</FieldLabel>
                <input
                  type="number"
                  min={MIN_PRICE_LIMIT}
                  max={MAX_PRICE_LIMIT}
                  step={PRICE_STEP}
                  value={minPrice}
                  onChange={(event) => updateFilter(setMinPrice, event.target.value)}
                  placeholder="0"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-white/20 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Giá đến</FieldLabel>
                <input
                  type="number"
                  min={MIN_PRICE_LIMIT}
                  max={MAX_PRICE_LIMIT}
                  step={PRICE_STEP}
                  value={maxPrice}
                  onChange={(event) => updateFilter(setMaxPrice, event.target.value)}
                  placeholder={String(MAX_PRICE_LIMIT)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-white/20 dark:bg-white/5 dark:text-white"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  disabled={!hasActiveFilters}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20 dark:text-gray-400 dark:hover:bg-white/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-app-blue px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/15 transition hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" />
                  Áp dụng
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
              Danh sách phương tiện
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              Xe phù hợp tại {selectedAreaLabel || "Đà Nẵng"}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-gray-400">
              Tìm thấy {totalCount} xe sẵn có
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLoading ? <LoadingSpinner className="h-5 w-5 text-brand-600" /> : null}
            <label className="flex w-full items-center gap-2 text-sm font-medium text-slate-500 dark:text-gray-400 sm:w-auto">
              <span className="hidden sm:inline">Sắp xếp</span>
              <select
                value={sortBy}
                onChange={(event) => updateFilter(setSortBy, event.target.value)}
                className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 sm:flex-none"
              >
                <option value="">Mới nhất</option>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[4/3] rounded-md bg-slate-100 dark:bg-white/10" />
                <div className="mt-3 h-4 w-2/3 rounded bg-slate-100 dark:bg-white/10" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-100 dark:bg-white/10" />
                <div className="mt-2 h-3 w-1/3 rounded bg-slate-100 dark:bg-white/10" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-md border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
            <Car className="h-16 w-16 text-slate-300 dark:text-neutral-600" />
            <p className="mt-4 text-sm font-semibold text-slate-600">Chưa có xe phù hợp</p>
            <p className="mt-2 text-xs text-slate-400">Hãy điều chỉnh bộ lọc hoặc mở rộng khoảng giá/ngày thuê.</p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-app-blue px-5 text-xs font-semibold text-white shadow-md transition hover:bg-blue-700"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((vehicle) => {
              const bookingTarget = token && user ? `/booking/new?vehicleId=${vehicle.id}` : `/vehicle/${vehicle.id}`;

              return (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onOpen={() => navigate(`/vehicle/${vehicle.id}`)}
                  onBook={() => navigate(bookingTarget)}
                  bookLabel={token && user ? "Đặt ngay" : "Thuê ngay"}
                />
              );
            })}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-10 flex items-center justify-between border-t border-slate-200 px-1 pt-6 dark:border-white/10">
            <div className="text-xs font-medium text-slate-500 dark:text-gray-400">
              Trang {page} / {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 dark:border-white/20 dark:text-gray-400 dark:hover:bg-white/10"
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
                    className={cx(
                      "inline-flex h-9 w-9 items-center justify-center rounded-md text-xs font-medium transition",
                      item === page
                        ? "bg-app-blue text-white shadow-md shadow-blue-600/15"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/20 dark:text-gray-400 dark:hover:bg-white/10",
                    )}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 dark:border-white/20 dark:text-gray-400 dark:hover:bg-white/10"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        ) : null}
      </main>
      <HomeChatWidget />
    </div>
  );
}
