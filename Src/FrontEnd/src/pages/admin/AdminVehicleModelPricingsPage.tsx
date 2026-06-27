import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import useClickOutside from "@/hooks/useClickOutside";
import { getVehicleBrands } from "@/features/vehicleBrands/services/vehicleBrandService";
import type { VehicleBrandResponse } from "@/features/vehicleBrands/types";
import { getVehicleModelsByBrand } from "@/features/vehicleModels/services/vehicleModelService";
import type { VehicleModelResponse } from "@/features/vehicleModels/types";
import { getPricingRegions } from "@/features/pricingRegions/services/pricingRegionService";
import type { PricingRegionResponse } from "@/features/pricingRegions/types";
import { createVehicleModelPricing, getVehicleModelPricings, updateVehicleModelPricing } from "@/features/vehicleModelPricings/services/vehicleModelPricingService";
import type { VehicleModelPricingResponse } from "@/features/vehicleModelPricings/types";

const PAGE_SIZE = 10;

function money(value: number) {
  return value.toLocaleString("vi-VN");
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

function normalizeVehicleType(value: string) {
  return value === "Motorcycle" ? "Motorbike" : value;
}

export default function AdminVehicleModelPricingsPage() {
  const [items, setItems] = useState<VehicleModelPricingResponse[]>([]);
  const [brands, setBrands] = useState<VehicleBrandResponse[]>([]);
  const [models, setModels] = useState<VehicleModelResponse[]>([]);
  const [regions, setRegions] = useState<PricingRegionResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [pricingRegionId, setPricingRegionId] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<VehicleModelPricingResponse | null>(null);
  const [formBrandId, setFormBrandId] = useState("");
  const [formModelId, setFormModelId] = useState("");
  const [formPricingRegionId, setFormPricingRegionId] = useState("");
  const [suggestedMinPrice, setSuggestedMinPrice] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [suggestedMaxPrice, setSuggestedMaxPrice] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getVehicleBrands({ pageSize: 500 }).then((r) => setBrands(r.items)).catch(() => {});
    getPricingRegions({ pageSize: 500, isActive: true }).then((r) => setRegions(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    const bid = Number(brandId || formBrandId);
    if (!bid) {
      setModels([]);
      return;
    }
    getVehicleModelsByBrand(bid).then(setModels).catch(() => setModels([]));
  }, [brandId, formBrandId]);

  useEffect(() => {
    if (!brandId) setModelId("");
  }, [brandId]);

  const visibleBrands = brands.filter((b) => !vehicleType || normalizeVehicleType(b.vehicleType) === vehicleType);
  const hasActiveFilters = sortBy || vehicleType || brandId || modelId || pricingRegionId || isActiveFilter || minPrice || maxPrice;

  const load = useCallback(async (nextPage = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getVehicleModelPricings({
        page: nextPage,
        pageSize: PAGE_SIZE,
        keyword: keyword || undefined,
        sortBy: sortBy || undefined,
        vehicleType: vehicleType || undefined,
        brandId: brandId || undefined,
        modelId: modelId || undefined,
        pricingRegionId: pricingRegionId || undefined,
        isActive: isActiveFilter || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
      });
      setItems(result.items);
      setTotalCount(result.totalCount);
      setPage(result.page);
      setTotalPages(result.totalPages || 1);
    } catch {
      setError("Không thể tải khung giá dòng xe.");
    } finally {
      setIsLoading(false);
    }
  }, [keyword, sortBy, vehicleType, brandId, modelId, pricingRegionId, isActiveFilter, minPrice, maxPrice, page]);

  useEffect(() => { void load(1); }, []);

  function resetFilters() {
    setKeyword("");
    setSortBy("");
    setVehicleType("");
    setBrandId("");
    setModelId("");
    setPricingRegionId("");
    setIsActiveFilter("");
    setMinPrice("");
    setMaxPrice("");
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

  function openCreate() {
    setEditItem(null);
    setFormBrandId("");
    setFormModelId("");
    setFormPricingRegionId("");
    setSuggestedMinPrice("");
    setBasePrice("");
    setSuggestedMaxPrice("");
    setFormIsActive(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item: VehicleModelPricingResponse) {
    setEditItem(item);
    setFormBrandId(String(item.brandId));
    setFormModelId(String(item.modelId));
    setFormPricingRegionId(String(item.pricingRegionId));
    setSuggestedMinPrice(String(item.suggestedMinPrice));
    setBasePrice(String(item.basePrice));
    setSuggestedMaxPrice(String(item.suggestedMaxPrice));
    setFormIsActive(item.isActive);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    const min = Number(suggestedMinPrice);
    const base = Number(basePrice);
    const max = Number(suggestedMaxPrice);
    if (!formModelId || !formPricingRegionId || min <= 0 || base <= 0 || max <= 0 || min > base || base > max) {
      setFormError("Vui lòng chọn dòng xe/vùng giá và nhập giá theo thứ tự min <= base <= max.");
      return;
    }

    try {
      const data = { modelId: Number(formModelId), pricingRegionId: Number(formPricingRegionId), suggestedMinPrice: min, basePrice: base, suggestedMaxPrice: max };
      if (editItem) await updateVehicleModelPricing(editItem.id, { ...data, isActive: formIsActive });
      else await createVehicleModelPricing(data);
      setModalOpen(false);
      void load(page);
    } catch {
      setFormError("Lưu khung giá thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-slate-950">Khung giá dòng xe</h1><p className="mt-1 text-sm text-slate-500">Giá gợi ý theo dòng xe và vùng giá.</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Thêm khung giá</Button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input ref={searchRef} type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} placeholder="Tìm dòng xe, vùng giá..." className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <button type="button" onClick={() => setShowFilters((prev) => !prev)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors ${showFilters || hasActiveFilters ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
            <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <FilterDropdown label="Sắp xếp" value={sortBy} onChange={(v) => { setSortBy(v); setPage(1); }} options={[{ value: "", label: "Mới nhất" }, { value: "price_asc", label: "Giá tăng dần" }, { value: "price_desc", label: "Giá giảm dần" }]} />
            <FilterDropdown label="Loại xe" value={vehicleType} onChange={(v) => { setVehicleType(v); setBrandId(""); setModelId(""); setPage(1); }} options={[{ value: "", label: "Tất cả" }, { value: "Car", label: "Ô tô" }, { value: "Motorbike", label: "Xe máy" }]} />
            <FilterDropdown label="Hãng" value={brandId} onChange={(v) => { setBrandId(v); setModelId(""); setPage(1); }} options={[{ value: "", label: "Tất cả" }, ...visibleBrands.map((b) => ({ value: String(b.id), label: b.name }))]} />
            <FilterDropdown label="Dòng xe" value={modelId} onChange={(v) => { setModelId(v); setPage(1); }} options={[{ value: "", label: "Tất cả" }, ...models.map((m) => ({ value: String(m.id), label: m.name }))]} />
            <FilterDropdown label="Vùng giá" value={pricingRegionId} onChange={(v) => { setPricingRegionId(v); setPage(1); }} options={[{ value: "", label: "Tất cả" }, ...regions.map((r) => ({ value: String(r.id), label: r.code }))]} />
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">Giá:</span>
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Từ" className="h-8 w-24 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-brand-500" />
              <span className="text-xs text-slate-400">-</span>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Đến" className="h-8 w-24 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-brand-500" />
            </div>
            <FilterDropdown label="Trạng thái" value={isActiveFilter} onChange={(v) => { setIsActiveFilter(v); setPage(1); }} options={[{ value: "", label: "Tất cả" }, { value: "true", label: "Hoạt động" }, { value: "false", label: "Đã tắt" }]} />
            {hasActiveFilters && <button type="button" onClick={resetFilters} className="text-xs font-medium text-brand-700 hover:text-brand-800">Xóa bộ lọc</button>}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-medium text-slate-700">{totalCount} khung giá</div>
          {isLoading && <LoadingSpinner className="h-4 w-4" />}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Dòng xe</th>
                <th className="px-4 py-3">Vùng giá</th>
                <th className="px-4 py-3">Min</th>
                <th className="px-4 py-3">Base</th>
                <th className="px-4 py-3">Max</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.brandName} {item.modelName}</td>
                  <td className="px-4 py-3 text-slate-600">{item.pricingRegionCode}</td>
                  <td className="px-4 py-3 text-slate-600">{money(item.suggestedMinPrice)}</td>
                  <td className="px-4 py-3 text-slate-600">{money(item.basePrice)}</td>
                  <td className="px-4 py-3 text-slate-600">{money(item.suggestedMaxPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{item.isActive ? "Hoạt động" : "Đã tắt"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(item)} className="flex h-8 w-8 items-center justify-center rounded-md text-brand-700 transition-colors hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">Không có khung giá nào.</td></tr>}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Sửa khung giá" : "Thêm khung giá"}>
        <div className="space-y-4">
          <select value={formBrandId} onChange={(e) => { setFormBrandId(e.target.value); setFormModelId(""); }} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm">
            <option value="">Chọn hãng xe</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name} - {b.vehicleType === "Car" ? "Ô tô" : "Xe máy"}</option>)}
          </select>
          <select value={formModelId} onChange={(e) => setFormModelId(e.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm">
            <option value="">Chọn dòng xe</option>
            {models.filter((m) => !formBrandId || brands.some((b) => b.id === Number(formBrandId))).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={formPricingRegionId} onChange={(e) => setFormPricingRegionId(e.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm">
            <option value="">Chọn vùng giá</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.code}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" value={suggestedMinPrice} onChange={(e) => setSuggestedMinPrice(e.target.value)} placeholder="Min" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
            <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="Base" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
            <input type="number" value={suggestedMaxPrice} onChange={(e) => setSuggestedMaxPrice(e.target.value)} placeholder="Max" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
          </div>
          {editItem && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} /> Hoạt động</label>}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button><Button onClick={handleSave}>Lưu</Button></div>
        </div>
      </Modal>
    </div>
  );
}
