import { ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Alert from "@/components/common/Alert";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import useClickOutside from "@/hooks/useClickOutside";
import { getVehicleBrands } from "@/features/vehicleBrands/services/vehicleBrandService";
import { getVehicleModelsByBrand } from "@/features/vehicleModels/services/vehicleModelService";
import { getVehicleModelVariants } from "@/features/vehicleModelVariants/services/vehicleModelVariantService";
import { getAllDriverLicenseClasses } from "@/features/driverLicenseClasses/services/driverLicenseClassService";
import { fuelTypeOptions, getFuelTypeLabel, getMotorbikeTypeLabel, motorbikeTypeOptions } from "@/features/vehicleModelVariants/options";
import type { VehicleBrandResponse } from "@/features/vehicleBrands/types";
import type { VehicleModelResponse } from "@/features/vehicleModels/types";
import type { VehicleModelVariantResponse } from "@/features/vehicleModelVariants/types";
import type { DriverLicenseClassResponse } from "@/features/driverLicenseClasses/types";

const PAGE_SIZE = 10;

const carBodyTypes = ["Sedan", "SUV", "Hatchback", "Coupe", "Convertible", "Pickup", "MPV/Minivan", "Wagon"];
const seatCounts = ["2", "4", "5", "7", "8", "9", "16", "29", "30"];

function normalizeVehicleType(value: string) {
  return value === "Motorcycle" ? "Motorbike" : value;
}

function vehicleTypeLabel(value: string) {
  return normalizeVehicleType(value) === "Car" ? "Ô tô" : "Xe máy";
}

function licenseLabel(item: VehicleModelVariantResponse) {
  if (!item.requiredLicenseClassCode) return "-";
  return `${item.requiredLicenseClassCode}${item.requiredLicenseClassSystemVersion === "LegacyBefore2025" ? " (cũ)" : ""}`;
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
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="dropdown-scrollbar absolute left-0 top-full z-20 mt-1 max-h-72 w-52 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((opt) => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors ${opt.value === value ? "bg-brand-100 font-medium text-brand-700" : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"}`}>{opt.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminVehicleCatalogPage() {
  const [items, setItems] = useState<VehicleModelVariantResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [seatCount, setSeatCount] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [bikeType, setBikeType] = useState("");
  const [requiredLicenseClassId, setRequiredLicenseClassId] = useState("");
  const [licenseSystemVersion, setLicenseSystemVersion] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<VehicleBrandResponse[]>([]);
  const [models, setModels] = useState<VehicleModelResponse[]>([]);
  const [licenseClasses, setLicenseClasses] = useState<DriverLicenseClassResponse[]>([]);
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getVehicleBrands({ pageSize: 500 }).then((r) => setBrands(r.items)).catch(() => {});
    getAllDriverLicenseClasses().then(setLicenseClasses).catch(() => {});
  }, []);

  useEffect(() => {
    if (!brandId) {
      setModels([]);
      setModelId("");
      return;
    }

    getVehicleModelsByBrand(Number(brandId)).then((data) => {
      setModels(data);
      setModelId((current) => data.some((model) => String(model.id) === current) ? current : "");
    }).catch(() => setModels([]));
  }, [brandId]);

  const visibleBrands = brands.filter((brand) => !vehicleType || normalizeVehicleType(brand.vehicleType) === vehicleType);
  const visibleLicenses = licenseClasses.filter((license) => !licenseSystemVersion || license.systemVersion === licenseSystemVersion);
  const hasActiveFilters = sortBy || vehicleType || brandId || modelId || bodyType || seatCount || fuelType || bikeType || requiredLicenseClassId || licenseSystemVersion || isActiveFilter;

  const load = useCallback(async (nextPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getVehicleModelVariants({
        page: nextPage,
        pageSize: PAGE_SIZE,
        keyword: keyword || undefined,
        sortBy: sortBy || undefined,
        vehicleType: vehicleType || undefined,
        brandId: brandId || undefined,
        modelId: modelId || undefined,
        bodyType: bodyType || undefined,
        seatCount: seatCount || undefined,
        fuelType: fuelType || undefined,
        bikeType: bikeType || undefined,
        requiredLicenseClassId: requiredLicenseClassId || undefined,
        licenseSystemVersion: licenseSystemVersion || undefined,
        isActive: isActiveFilter || undefined,
      });
      setItems(result.items);
      setTotalCount(result.totalCount);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch {
      setError("Không thể tải danh mục phương tiện.");
    } finally {
      setIsLoading(false);
    }
  }, [keyword, sortBy, vehicleType, brandId, modelId, bodyType, seatCount, fuelType, bikeType, requiredLicenseClassId, licenseSystemVersion, isActiveFilter]);

  useEffect(() => { void load(1); }, [load]);

  function resetFilters() {
    setKeyword("");
    setSortBy("");
    setVehicleType("");
    setBrandId("");
    setModelId("");
    setBodyType("");
    setSeatCount("");
    setFuelType("");
    setBikeType("");
    setRequiredLicenseClassId("");
    setLicenseSystemVersion("");
    setIsActiveFilter("");
    setPage(1);
    if (searchRef.current) searchRef.current.value = "";
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    void load(nextPage);
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Phương tiện</h1>
        <p className="mt-1 text-sm text-slate-500">Danh sách tổng hợp phiên bản xe, hỗ trợ lọc theo ô tô hoặc xe máy.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input ref={searchRef} type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} placeholder="Tìm phiên bản, dòng xe, hãng..." className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <button type="button" onClick={() => setShowFilters((prev) => !prev)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors ${showFilters || hasActiveFilters ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
            <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <FilterDropdown label="Sắp xếp" value={sortBy} onChange={(v) => { setSortBy(v); setPage(1); }} options={[{ value: "", label: "Mới nhất" }, { value: "name_asc", label: "Tên A-Z" }, { value: "name_desc", label: "Tên Z-A" }]} />
            <FilterDropdown label="Loại xe" value={vehicleType} onChange={(v) => { setVehicleType(v); setBrandId(""); setModelId(""); setBodyType(""); setSeatCount(""); setBikeType(""); setPage(1); }} options={[{ value: "", label: "Tất cả" }, { value: "Car", label: "Ô tô" }, { value: "Motorbike", label: "Xe máy" }]} />
            <FilterDropdown label="Hãng" value={brandId} onChange={(v) => { setBrandId(v); setModelId(""); setPage(1); }} options={[{ value: "", label: "Tất cả" }, ...visibleBrands.map((brand) => ({ value: String(brand.id), label: brand.name }))]} />
            <FilterDropdown label="Dòng" value={modelId} onChange={(v) => { setModelId(v); setPage(1); }} options={[{ value: "", label: "Tất cả" }, ...models.map((model) => ({ value: String(model.id), label: model.name }))]} />
            <FilterDropdown label="Nhiên liệu" value={fuelType} onChange={(v) => { setFuelType(v); setPage(1); }} options={[{ value: "", label: "Tất cả" }, ...fuelTypeOptions]} />
            {(vehicleType === "" || vehicleType === "Car") && (
              <>
                <FilterDropdown label="Kiểu dáng" value={bodyType} onChange={(v) => { setBodyType(v); setPage(1); }} options={[{ value: "", label: "Tất cả" }, ...carBodyTypes.map((item) => ({ value: item, label: item }))]} />
                <FilterDropdown label="Số chỗ" value={seatCount} onChange={(v) => { setSeatCount(v); setPage(1); }} options={[{ value: "", label: "Tất cả" }, ...seatCounts.map((item) => ({ value: item, label: item }))]} />
              </>
            )}
            {(vehicleType === "" || vehicleType === "Motorbike") && (
              <FilterDropdown label="Loại xe máy" value={bikeType} onChange={(v) => { setBikeType(v); setPage(1); }} options={[{ value: "", label: "Tất cả" }, ...motorbikeTypeOptions]} />
            )}
            <FilterDropdown label="Hệ GPLX" value={licenseSystemVersion} onChange={(v) => { setLicenseSystemVersion(v); setRequiredLicenseClassId(""); setPage(1); }} options={[{ value: "", label: "Tất cả" }, { value: "Current", label: "Hiện hành" }, { value: "LegacyBefore2025", label: "Cũ" }]} />
            <FilterDropdown label="GPLX" value={requiredLicenseClassId} onChange={(v) => { setRequiredLicenseClassId(v); setPage(1); }} options={[{ value: "", label: "Tất cả" }, ...visibleLicenses.map((license) => ({ value: String(license.id), label: `${license.code} - ${license.displayName}` }))]} />
            <FilterDropdown label="Trạng thái" value={isActiveFilter} onChange={(v) => { setIsActiveFilter(v); setPage(1); }} options={[{ value: "", label: "Tất cả" }, { value: "true", label: "Hoạt động" }, { value: "false", label: "Đã tắt" }]} />
            {hasActiveFilters && <button type="button" onClick={resetFilters} className="text-xs font-medium text-brand-700 hover:text-brand-800">Xóa bộ lọc</button>}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-medium text-slate-700">{totalCount} phiên bản</div>
          {isLoading && <LoadingSpinner className="h-4 w-4" />}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Phiên bản</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Hãng</th>
                <th className="px-4 py-3">Dòng</th>
                <th className="px-4 py-3">Kiểu/Loại</th>
                <th className="px-4 py-3">Số chỗ</th>
                <th className="px-4 py-3">Nhiên liệu</th>
                <th className="px-4 py-3">Động cơ</th>
                <th className="px-4 py-3">GPLX</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600">{vehicleTypeLabel(item.vehicleType)}</td>
                  <td className="px-4 py-3 text-slate-600">{item.brandName}</td>
                  <td className="px-4 py-3 text-slate-600">{item.modelName}</td>
                  <td className="px-4 py-3 text-slate-600">{normalizeVehicleType(item.vehicleType) === "Car" ? item.bodyType ?? "-" : getMotorbikeTypeLabel(item.bikeType)}</td>
                  <td className="px-4 py-3 text-slate-600">{item.seatCount ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{getFuelTypeLabel(item.fuelType)}</td>
                  <td className="px-4 py-3 text-slate-600">{item.engineCapacity ?? item.drivetrain ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{licenseLabel(item)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{item.isActive ? "Hoạt động" : "Đã tắt"}</span>
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">Không có phương tiện nào.</td></tr>}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <div className="text-sm text-slate-500">Trang {page} / {totalPages}</div>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              {pageNumbers.map((p, i) => p === "..." ? <span key={`e-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-slate-400">...</span> : (
                <button key={p} type="button" onClick={() => goToPage(p as number)} className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${p === page ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{p}</button>
              ))}
              <button type="button" disabled={page >= totalPages} onClick={() => goToPage(page + 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
