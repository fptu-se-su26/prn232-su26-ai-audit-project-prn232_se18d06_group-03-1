import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormDropdown from "@/components/common/FormDropdown";
import Modal from "@/components/common/Modal";
import useClickOutside from "@/hooks/useClickOutside";
import { createArea, getAreaProvinces, getAreas, updateArea } from "@/features/areas/services/areaService";
import type { AreaResponse } from "@/features/areas/types";
import { getPricingRegions } from "@/features/pricingRegions/services/pricingRegionService";
import type { PricingRegionResponse } from "@/features/pricingRegions/types";

const PAGE_SIZE = 20;

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
          <button type="button" onClick={() => { onChange(""); setOpen(false); }}
            className={`flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors ${"" === value ? "bg-brand-100 font-medium text-brand-700" : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"}`}>Tất cả</button>
          {options.map((opt) => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors ${opt.value === value ? "bg-brand-100 font-medium text-brand-700" : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"}`}>{opt.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAreasPage() {
  const [items, setItems] = useState<AreaResponse[]>([]);
  const [regions, setRegions] = useState<PricingRegionResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [provinceFilter, setProvinceFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<AreaResponse | null>(null);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [pricingRegionId, setPricingRegionId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getPricingRegions({ pageSize: 500, isActive: true }).then((r) => setRegions(r.items)).catch(() => {}); }, []);
  const loadProvinces = useCallback(async () => {
    try {
      setProvinces(await getAreaProvinces());
    } catch {
      setProvinces([]);
    }
  }, []);

  useEffect(() => { void loadProvinces(); }, [loadProvinces]);

  const load = useCallback(async (nextPage = page) => {
    try {
      const result = await getAreas({ page: nextPage, pageSize: PAGE_SIZE, keyword: keyword || undefined, province: provinceFilter || undefined, pricingRegionId: regionFilter ? Number(regionFilter) : undefined });
      setItems(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages || 1);
      setTotalCount(result.totalCount ?? 0);
    } catch {
      setError("Không thể tải danh sách khu vực.");
    }
  }, [keyword, provinceFilter, regionFilter, page]);

  useEffect(() => { void load(1); }, []);
  useEffect(() => { void load(1); }, [keyword, provinceFilter, regionFilter]);

  function resetFilters() {
    setKeyword("");
    setProvinceFilter("");
    setRegionFilter("");
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
    setProvince("");
    setDistrict("");
    setPricingRegionId("");
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item: AreaResponse) {
    setEditItem(item);
    setProvince(item.province);
    setDistrict(item.district);
    setPricingRegionId(String(item.pricingRegionId));
    setIsActive(item.isActive);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!province.trim() || !district.trim() || !pricingRegionId) {
      setFormError("Vui lòng nhập đầy đủ tỉnh/thành, phường/xã và vùng giá.");
      return;
    }

    try {
      const data = { province: province.trim(), district: district.trim(), pricingRegionId: Number(pricingRegionId) };
      if (editItem) await updateArea(editItem.id, { ...data, isActive });
      else await createArea(data);
      setModalOpen(false);
      void loadProvinces();
      void load(page);
    } catch {
      setFormError("Lưu khu vực thất bại.");
    }
  }

  const hasActiveFilters = provinceFilter || regionFilter;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-slate-950">Khu vực</h1><p className="mt-1 text-sm text-slate-500">Map tỉnh/quận vào vùng giá.</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Thêm khu vực</Button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="rounded-md border border-slate-200 bg-white">
        <div className="space-y-3 border-b border-slate-200 p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input ref={searchRef} value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void load(1); }} placeholder="Tìm tỉnh/phường xã..." className="h-9 w-full rounded-md border border-slate-300 pl-8 pr-3 text-sm outline-none focus:border-brand-500" />
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <button type="button" onClick={() => setShowFilters((p) => !p)} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"><SlidersHorizontal className="h-4 w-4" /> Bộ lọc</button>
          </div>
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown value={provinceFilter} label="Tỉnh/Thành" onChange={setProvinceFilter} options={provinces.map((p) => ({ value: p, label: p }))} />
              <FilterDropdown value={regionFilter} label="Vùng giá" onChange={setRegionFilter} options={regions.map((r) => ({ value: String(r.id), label: r.code }))} />
              {hasActiveFilters && <button type="button" onClick={resetFilters} className="text-xs text-brand-700 hover:text-brand-800">Xóa bộ lọc</button>}
            </div>
          )}
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500"><tr><th className="w-10 px-4 py-3 text-center">#</th><th className="px-4 py-3">Tỉnh/TP</th><th className="px-4 py-3">Phường/Xã</th><th className="px-4 py-3">Vùng giá</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{items.map((item, idx) => <tr key={item.id}><td className="w-10 px-4 py-3 text-center text-slate-400">{(page - 1) * PAGE_SIZE + idx + 1}</td><td className="px-4 py-3 font-medium">{item.province}</td><td className="px-4 py-3">{item.district}</td><td className="px-4 py-3">{item.pricingRegionCode}</td><td className="px-4 py-3">{item.isActive ? "Hoạt động" : "Đã tắt"}</td><td className="px-4 py-3"><button onClick={() => openEdit(item)} className="text-brand-700"><Pencil className="h-4 w-4" /></button></td></tr>)}</tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <div className="text-sm text-slate-500">Trang {page} / {totalPages} ({totalCount} khu vực)</div>
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Sửa khu vực" : "Thêm khu vực"}>
        <div className="space-y-4">
          <input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Tỉnh/Thành phố" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
          <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Phường/Xã" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
          <FormDropdown value={pricingRegionId} onChange={setPricingRegionId} placeholder="Chọn vùng giá" options={regions.map((r) => ({ value: String(r.id), label: r.code }))} />
          {editItem && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Hoạt động</label>}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button><Button onClick={handleSave}>Lưu</Button></div>
        </div>
      </Modal>
    </div>
  );
}
