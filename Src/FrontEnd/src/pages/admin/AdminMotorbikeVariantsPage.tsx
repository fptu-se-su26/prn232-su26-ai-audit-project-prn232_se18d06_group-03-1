import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import useClickOutside from "@/hooks/useClickOutside";
import { getVehicleBrands } from "@/features/vehicleBrands/services/vehicleBrandService";
import { getVehicleModelsByBrand } from "@/features/vehicleModels/services/vehicleModelService";
import { getVehicleModelVariants, createVehicleModelVariant, updateVehicleModelVariant } from "@/features/vehicleModelVariants/services/vehicleModelVariantService";
import { getAllDriverLicenseClasses } from "@/features/driverLicenseClasses/services/driverLicenseClassService";
import { fuelTypeOptions, getFuelTypeLabel, getMotorbikeTypeLabel, motorbikeTypeOptions } from "@/features/vehicleModelVariants/options";
import type { VehicleModelVariantResponse } from "@/features/vehicleModelVariants/types";
import type { VehicleBrandResponse } from "@/features/vehicleBrands/types";
import type { VehicleModelResponse } from "@/features/vehicleModels/types";
import type { DriverLicenseClassResponse } from "@/features/driverLicenseClasses/types";

const PAGE_SIZE = 10;

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

export default function AdminMotorbikeVariantsPage() {
  const [items, setItems] = useState<VehicleModelVariantResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<VehicleModelVariantResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [brands, setBrands] = useState<VehicleBrandResponse[]>([]);
  const [licenseClasses, setLicenseClasses] = useState<DriverLicenseClassResponse[]>([]);
  const [models, setModels] = useState<VehicleModelResponse[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [filterModels, setFilterModels] = useState<VehicleModelResponse[]>([]);
  const [filterBrandId, setFilterBrandId] = useState("");
  const [filterModelId, setFilterModelId] = useState("");
  const [filterBikeType, setFilterBikeType] = useState("");
  const [filterFuelType, setFilterFuelType] = useState("");
  const [filterEngineCapacity, setFilterEngineCapacity] = useState("");
  const [filterRequiredLicenseClassId, setFilterRequiredLicenseClassId] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [formModelId, setFormModelId] = useState("");
  const [formName, setFormName] = useState("");
  const [formBikeType, setFormBikeType] = useState("");
  const [formEngineCapacity, setFormEngineCapacity] = useState("");
  const [formFuelType, setFormFuelType] = useState("");
  const [formRequiredLicenseClassId, setFormRequiredLicenseClassId] = useState("");

  useEffect(() => { getVehicleBrands({ pageSize: 100 }).then((r) => setBrands(r.items)).catch(() => {}); }, []);
  useEffect(() => { getAllDriverLicenseClasses().then(setLicenseClasses).catch(() => {}); }, []);

  useEffect(() => {
    if (!filterBrandId) {
      setFilterModels([]);
      setFilterModelId("");
      return;
    }

    getVehicleModelsByBrand(Number(filterBrandId)).then((data) => {
      setFilterModels(data);
      setFilterModelId((current) => data.some((model) => String(model.id) === current) ? current : "");
    }).catch(() => setFilterModels([]));
  }, [filterBrandId]);

  async function loadModelsByBrand(brandId: string, nextModelId = "") {
    setSelectedBrandId(brandId);
    if (!brandId) { setModels([]); setFormModelId(""); return; }
    const data = await getVehicleModelsByBrand(Number(brandId));
    setModels(data);
    setFormModelId(nextModelId);
  }

  const load = useCallback(async (p: number, kw = keyword) => {
    setIsLoading(true); setError(null);
    try {
      const result = await getVehicleModelVariants({
        page: p,
        pageSize: PAGE_SIZE,
        keyword: kw || undefined,
        vehicleType: "Motorbike",
        brandId: filterBrandId || undefined,
        modelId: filterModelId || undefined,
        bikeType: filterBikeType || undefined,
        fuelType: filterFuelType || undefined,
        engineCapacity: filterEngineCapacity || undefined,
        requiredLicenseClassId: filterRequiredLicenseClassId || undefined,
      });
      setItems(result.items); setTotalCount(result.totalCount); setPage(result.page); setTotalPages(result.totalPages);
    } catch { setError("Không thể tải danh sách phiên bản."); } finally { setIsLoading(false); }
  }, [keyword, filterBrandId, filterModelId, filterBikeType, filterFuelType, filterEngineCapacity, filterRequiredLicenseClassId]);

  useEffect(() => { void load(1); }, [load]);
  function handleSearch() { setPage(1); void load(1, keyword); }
  function handleKeyDown(e: React.KeyboardEvent) { if (e.key === "Enter") handleSearch(); }
  function goToPage(p: number) { if (p < 1 || p > totalPages) return; setPage(p); void load(p, keyword); }

  function resetFilters() {
    setFilterBrandId("");
    setFilterModelId("");
    setFilterBikeType("");
    setFilterFuelType("");
    setFilterEngineCapacity("");
    setFilterRequiredLicenseClassId("");
    setPage(1);
  }

  function openCreate() {
    setEditItem(null); setSelectedBrandId(""); setModels([]); setFormModelId(""); setFormName(""); setFormBikeType(""); setFormEngineCapacity(""); setFormFuelType(""); setFormRequiredLicenseClassId(""); setFormError(""); setModalOpen(true);
  }
  function openEdit(item: VehicleModelVariantResponse) {
    setEditItem(item); setFormModelId(String(item.modelId)); setFormName(item.name); setFormBikeType(item.bikeType ?? ""); setFormEngineCapacity(item.engineCapacity ?? ""); setFormFuelType(item.fuelType ?? ""); setFormRequiredLicenseClassId(item.requiredLicenseClassId != null ? String(item.requiredLicenseClassId) : ""); setFormError(""); setModalOpen(true);
    void loadModelsByBrand(String(item.brandId), String(item.modelId));
  }

  async function handleSave() {
    if (!formName.trim() || !formModelId) { setFormError("Vui lòng nhập đầy đủ thông tin."); return; }
    setSaving(true); setFormError("");
    try {
      const data = {
        modelId: Number(formModelId), name: formName.trim(), vehicleType: "Motorbike",
        seatCount: 2, transmission: null, fuelType: formFuelType || null, bodyType: null, drivetrain: null,
        bikeType: formBikeType || null, engineCapacity: formEngineCapacity || null,
        requiredLicenseClassId: formRequiredLicenseClassId ? Number(formRequiredLicenseClassId) : null,
      };
      if (editItem) { await updateVehicleModelVariant(editItem.id, { ...data, isActive: editItem.isActive }); }
      else { await createVehicleModelVariant(data); }
      setModalOpen(false); void load(page, keyword);
    } catch { setFormError("Có lỗi xảy ra."); } finally { setSaving(false); }
  }

  async function handleToggleActive(item: VehicleModelVariantResponse) {
    await updateVehicleModelVariant(item.id, {
      modelId: item.modelId, name: item.name, vehicleType: "Motorbike",
      seatCount: item.seatCount, transmission: item.transmission, fuelType: item.fuelType,
      bodyType: item.bodyType, drivetrain: item.drivetrain, bikeType: item.bikeType,
      engineCapacity: item.engineCapacity, requiredLicenseClassId: item.requiredLicenseClassId,
      isActive: !item.isActive,
    });
    void load(page, keyword);
  }

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1); if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("..."); pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);
  const hasActiveFilters = filterBrandId || filterModelId || filterBikeType || filterFuelType || filterEngineCapacity || filterRequiredLicenseClassId;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-semibold text-slate-950">Phiên bản xe máy</h1><p className="mt-1 text-sm text-slate-500">Quản lý các phiên bản xe máy theo dòng xe.</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Thêm phiên bản</Button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input ref={searchRef} type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={handleKeyDown} placeholder="Tìm tên phiên bản..." className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <button type="button" onClick={handleSearch} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"><Search className="h-4 w-4" /> Tìm</button>
          <button type="button" onClick={() => setShowFilters((prev) => !prev)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors ${showFilters || hasActiveFilters ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
            <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <FilterDropdown label="Hãng" value={filterBrandId} onChange={(v) => { setFilterBrandId(v); setFilterModelId(""); setPage(1); }}
              options={[{ value: "", label: "Tất cả hãng" }, ...brands.filter((b) => b.vehicleType === "Motorbike" || b.vehicleType === "Motorcycle").map((b) => ({ value: String(b.id), label: b.name }))]} />
            <FilterDropdown label="Dòng" value={filterModelId} onChange={(v) => { setFilterModelId(v); setPage(1); }}
              options={[{ value: "", label: !filterBrandId ? "Chọn hãng trước" : "Tất cả dòng" }, ...filterModels.map((m) => ({ value: String(m.id), label: m.name }))]} />
            <FilterDropdown label="Loại xe" value={filterBikeType} onChange={(v) => { setFilterBikeType(v); setPage(1); }}
              options={[{ value: "", label: "Loại xe máy" }, ...motorbikeTypeOptions]} />
            <FilterDropdown label="Nhiên liệu" value={filterFuelType} onChange={(v) => { setFilterFuelType(v); setPage(1); }}
              options={[{ value: "", label: "Nhiên liệu" }, ...fuelTypeOptions.filter((option) => option.value !== "Diesel" && option.value !== "Plug-in Hybrid")]} />
            <input type="text" value={filterEngineCapacity} onChange={(e) => { setFilterEngineCapacity(e.target.value); setPage(1); }} placeholder="Dung tích, VD: 125cc" className="h-8 w-32 rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            <FilterDropdown label="GPLX" value={filterRequiredLicenseClassId} onChange={(v) => { setFilterRequiredLicenseClassId(v); setPage(1); }}
              options={[{ value: "", label: "GPLX" }, ...licenseClasses.map((l) => ({ value: String(l.id), label: `${l.code} - ${l.displayName}` }))]} />
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
              <tr><th className="px-4 py-3">Tên</th><th className="px-4 py-3">Dòng xe</th><th className="px-4 py-3">Hãng</th><th className="px-4 py-3">Loại xe</th><th className="px-4 py-3">Dung tích</th><th className="px-4 py-3">Nhiên liệu</th><th className="px-4 py-3">GPLX</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.modelName}</td>
                  <td className="px-4 py-3 text-slate-600">{item.brandName}</td>
                  <td className="px-4 py-3 text-slate-600">{getMotorbikeTypeLabel(item.bikeType)}</td>
                  <td className="px-4 py-3 text-slate-600">{item.engineCapacity ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{getFuelTypeLabel(item.fuelType)}</td>
                  <td className="px-4 py-3 text-slate-600">{item.requiredLicenseClassCode ? `${item.requiredLicenseClassCode}${item.requiredLicenseClassSystemVersion === "LegacyBefore2025" ? " (cũ)" : ""}` : "-"}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => handleToggleActive(item)}
                      className={`rounded px-2 py-1 text-xs font-medium ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{item.isActive ? "Hoạt động" : "Đã tắt"}</button>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => openEdit(item)} title="Sửa" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-800">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">Không có phiên bản nào.</td></tr>}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Sửa phiên bản" : "Thêm phiên bản"}>
        <div className="popup-scrollbar max-h-[70vh] space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700">Hãng xe</label>
            <select value={selectedBrandId} onChange={(e) => void loadModelsByBrand(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
              <option value="">Chọn hãng</option>
              {brands.filter((b) => b.vehicleType === "Motorbike" || b.vehicleType === "Motorcycle").map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Dòng xe</label>
            <select value={formModelId} onChange={(e) => setFormModelId(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
              <option value="">Chọn dòng xe</option>
              {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Tên phiên bản</label>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Loại xe</label>
              <select value={formBikeType} onChange={(e) => setFormBikeType(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                <option value="">Chọn</option>{motorbikeTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Dung tích</label>
              <input type="text" value={formEngineCapacity} onChange={(e) => setFormEngineCapacity(e.target.value)} placeholder="VD: 150cc, 125cc" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Nhiên liệu</label>
              <select value={formFuelType} onChange={(e) => setFormFuelType(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                <option value="">Chọn</option>{fuelTypeOptions.filter((option) => option.value !== "Diesel" && option.value !== "Plug-in Hybrid").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">GPLX yêu cầu</label>
              <select value={formRequiredLicenseClassId} onChange={(e) => setFormRequiredLicenseClassId(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                <option value="">Không yêu cầu</option>
                {licenseClasses.map((l) => <option key={l.id} value={l.id}>{l.code} - {l.displayName}{l.systemVersion === "LegacyBefore2025" ? " (cũ)" : ""}</option>)}
              </select>
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} isLoading={saving}>{editItem ? "Cập nhật" : "Thêm mới"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
