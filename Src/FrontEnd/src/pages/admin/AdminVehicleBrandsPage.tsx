import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import useClickOutside from "@/hooks/useClickOutside";
import { getVehicleBrands, createVehicleBrand, updateVehicleBrand, deleteVehicleBrand } from "@/features/vehicleBrands/services/vehicleBrandService";
import type { VehicleBrandResponse } from "@/features/vehicleBrands/types";

const PAGE_SIZE = 10;

const vehicleTypeOptions = ["Car", "Motorbike"];

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
              className={`flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors ${opt.value === value ? "bg-brand-100 text-brand-700 font-medium" : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminVehicleBrandsPage() {
  const [items, setItems] = useState<VehicleBrandResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<VehicleBrandResponse | null>(null);
  const [formName, setFormName] = useState("");
  const [formVehicleType, setFormVehicleType] = useState("Car");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (p: number, kw: string, sort: string, vt: string) => {
    setIsLoading(true); setError(null);
    try {
      const result = await getVehicleBrands({ page: p, pageSize: PAGE_SIZE, keyword: kw || undefined, sortBy: sort || undefined, vehicleType: vt || undefined });
      setItems(result.items); setTotalCount(result.totalCount); setPage(result.page); setTotalPages(result.totalPages);
    } catch { setError("Không thể tải danh sách hãng xe."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void load(1, "", "", ""); }, [load]);

  function handleSearch() { setPage(1); void load(1, keyword, sortBy, vehicleType); }
  function handleKeyDown(e: React.KeyboardEvent) { if (e.key === "Enter") handleSearch(); }

  function goToPage(p: number) { if (p < 1 || p > totalPages) return; setPage(p); void load(p, keyword, sortBy, vehicleType); }

  function openCreate() { setEditItem(null); setFormName(""); setFormVehicleType("Car"); setFormError(""); setModalOpen(true); }
  function openEdit(item: VehicleBrandResponse) { setEditItem(item); setFormName(item.name); setFormVehicleType(item.vehicleType === "Motorcycle" ? "Motorbike" : item.vehicleType); setFormError(""); setModalOpen(true); }

  async function handleSave() {
    if (!formName.trim()) { setFormError("Vui lòng nhập tên hãng xe."); return; }
    setSaving(true); setFormError("");
    try {
      if (editItem) {
        await updateVehicleBrand(editItem.id, { name: formName.trim(), vehicleType: formVehicleType, isActive: editItem.isActive });
      } else {
        await createVehicleBrand({ name: formName.trim(), vehicleType: formVehicleType });
      }
      setModalOpen(false); void load(page, keyword, sortBy, vehicleType);
    } catch { setFormError("Có lỗi xảy ra, vui lòng thử lại."); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(item: VehicleBrandResponse) {
    await updateVehicleBrand(item.id, { name: item.name, vehicleType: item.vehicleType, isActive: !item.isActive });
    void load(page, keyword, sortBy, vehicleType);
  }

  const hasActiveFilters = sortBy || vehicleType;
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Hãng xe</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý danh sách hãng xe ô tô và xe máy.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Thêm hãng xe</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input ref={searchRef} type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Tìm tên hãng xe..." className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <button type="button" onClick={handleSearch} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800">
            <Search className="h-4 w-4" /> Tìm
          </button>
          <button type="button" onClick={() => setShowFilters((prev) => !prev)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors ${showFilters || hasActiveFilters ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
            <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <FilterDropdown label="Sắp xếp" value={sortBy} onChange={(v) => { setSortBy(v); setPage(1); void load(1, keyword, v, vehicleType); }}
              options={[{ value: "", label: "Mới nhất" }, { value: "name_asc", label: "Tên A-Z" }, { value: "name_desc", label: "Tên Z-A" }]} />
            <FilterDropdown label="Loại xe" value={vehicleType} onChange={(v) => { setVehicleType(v); setPage(1); void load(1, keyword, sortBy, v); }}
              options={[{ value: "", label: "Tất cả" }, { value: "Car", label: "Ô tô" }, { value: "Motorbike", label: "Xe máy" }]} />
            {hasActiveFilters && <button type="button" onClick={() => { setKeyword(""); setSortBy(""); setVehicleType(""); setPage(1); if (searchRef.current) searchRef.current.value = ""; void load(1, "", "", ""); }} className="text-xs font-medium text-brand-700 hover:text-brand-800">Xoá bộ lọc</button>}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-medium text-slate-700">{totalCount} hãng xe</div>
          {isLoading && <LoadingSpinner className="h-4 w-4" />}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr><th className="px-4 py-3">Tên hãng</th><th className="px-4 py-3">Loại xe</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">
                      {item.vehicleType === "Car" ? "Ô tô" : "Xe máy"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => handleToggleActive(item)}
                      className={`rounded px-2 py-1 text-xs font-medium ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                      {item.isActive ? "Hoạt động" : "Đã tắt"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(item)} title="Sửa" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-800">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">Không có hãng xe nào.</td></tr>
              )}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Sửa hãng xe" : "Thêm hãng xe"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Tên hãng xe</label>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Loại xe</label>
            <select value={formVehicleType} onChange={(e) => setFormVehicleType(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
              <option value="Car">Ô tô</option>
              <option value="Motorbike">Xe máy</option>
            </select>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Huỷ</Button>
            <Button onClick={handleSave} isLoading={saving}>{editItem ? "Cập nhật" : "Thêm mới"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
