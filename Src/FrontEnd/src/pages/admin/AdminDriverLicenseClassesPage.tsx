import { ChevronDown, ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormDropdown from "@/components/common/FormDropdown";
import ActiveToggle from "@/components/common/ActiveToggle";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import useClickOutside from "@/hooks/useClickOutside";
import LicenseCompatibilityModal from "@/features/driverLicenseClasses/components/LicenseCompatibilityModal";
import { getDriverLicenseClasses, createDriverLicenseClass, updateDriverLicenseClass, deleteDriverLicenseClass, getDriverLicenseClassCompatibleRequiredClasses } from "@/features/driverLicenseClasses/services/driverLicenseClassService";
import type { DriverLicenseClassResponse } from "@/features/driverLicenseClasses/types";

const PAGE_SIZE = 10;

const systemVersionOptions = ["Current", "LegacyBefore2025"];

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

export default function AdminDriverLicenseClassesPage() {
  const [items, setItems] = useState<DriverLicenseClassResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [systemVersion, setSystemVersion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<DriverLicenseClassResponse | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSystemVersion, setFormSystemVersion] = useState("Current");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [compatibilityModalOpen, setCompatibilityModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<DriverLicenseClassResponse | null>(null);
  const [compatibleLicenses, setCompatibleLicenses] = useState<DriverLicenseClassResponse[]>([]);
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);

  const load = useCallback(async (p: number, kw: string, sort: string, sv: string) => {
    setIsLoading(true); setError(null);
    try {
      const result = await getDriverLicenseClasses({ page: p, pageSize: PAGE_SIZE, keyword: kw || undefined, sortBy: sort || undefined, systemVersion: sv || undefined });
      setItems(result.items); setTotalCount(result.totalCount); setPage(result.page); setTotalPages(result.totalPages);
    } catch { setError("Không thể tải danh sách GPLX."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void load(1, "", "", ""); }, [load]);

  function handleSearch() { setPage(1); void load(1, keyword, sortBy, systemVersion); }
  function handleKeyDown(e: React.KeyboardEvent) { if (e.key === "Enter") handleSearch(); }

  function goToPage(p: number) { if (p < 1 || p > totalPages) return; setPage(p); void load(p, keyword, sortBy, systemVersion); }

  function openCreate() { setEditItem(null); setFormCode(""); setFormDisplayName(""); setFormDescription(""); setFormSystemVersion("Current"); setFormError(""); setModalOpen(true); }
  function openEdit(item: DriverLicenseClassResponse) { setEditItem(item); setFormCode(item.code); setFormDisplayName(item.displayName); setFormDescription(item.description); setFormSystemVersion(item.systemVersion); setFormError(""); setModalOpen(true); }

  async function openCompatibility(item: DriverLicenseClassResponse) {
    setSelectedLicense(item);
    setCompatibleLicenses([]);
    setCompatibilityLoading(true);
    setCompatibilityModalOpen(true);
    try {
      setCompatibleLicenses(await getDriverLicenseClassCompatibleRequiredClasses(item.id));
    } finally {
      setCompatibilityLoading(false);
    }
  }

  async function handleSave() {
    if (!formCode.trim() || !formDisplayName.trim()) { setFormError("Vui lòng nhập mã và tên GPLX."); return; }
    setSaving(true); setFormError("");
    try {
      if (editItem) {
        await updateDriverLicenseClass(editItem.id, { code: formCode.trim(), displayName: formDisplayName.trim(), description: formDescription.trim(), systemVersion: formSystemVersion, isActive: editItem.isActive });
      } else {
        await createDriverLicenseClass({ code: formCode.trim(), displayName: formDisplayName.trim(), description: formDescription.trim(), systemVersion: formSystemVersion });
      }
      setModalOpen(false); void load(page, keyword, sortBy, systemVersion);
    } catch { setFormError("Có lỗi xảy ra, vui lòng thử lại."); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(item: DriverLicenseClassResponse) {
    await updateDriverLicenseClass(item.id, { code: item.code, displayName: item.displayName, description: item.description, systemVersion: item.systemVersion, isActive: !item.isActive });
    void load(page, keyword, sortBy, systemVersion);
  }

  const hasActiveFilters = sortBy || systemVersion;
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
          <h1 className="text-2xl font-semibold text-slate-950">Giấy phép lái xe (GPLX)</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý danh sách hạng giấy phép lái xe.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Thêm GPLX</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input ref={searchRef} type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Tìm mã hoặc tên GPLX..." className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
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
            <FilterDropdown label="Sắp xếp" value={sortBy} onChange={(v) => { setSortBy(v); setPage(1); void load(1, keyword, v, systemVersion); }}
              options={[{ value: "", label: "Mới nhất" }, { value: "code_asc", label: "Mã A-Z" }, { value: "code_desc", label: "Mã Z-A" }]} />
            <FilterDropdown label="Phiên bản" value={systemVersion} onChange={(v) => { setSystemVersion(v); setPage(1); void load(1, keyword, sortBy, v); }}
              options={[{ value: "", label: "Tất cả" }, { value: "Current", label: "Hiện hành" }, { value: "LegacyBefore2025", label: "Cũ" }]} />
            {hasActiveFilters && <button type="button" onClick={() => { setKeyword(""); setSortBy(""); setSystemVersion(""); setPage(1); if (searchRef.current) searchRef.current.value = ""; void load(1, "", "", ""); }} className="text-xs font-medium text-brand-700 hover:text-brand-800">Xóa bộ lọc</button>}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-medium text-slate-700">{totalCount} GPLX</div>
          {isLoading && <LoadingSpinner className="h-4 w-4" />}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr><th className="px-4 py-3">Mã</th><th className="px-4 py-3">Tên hiển thị</th><th className="px-4 py-3">Mô tả</th><th className="px-4 py-3">Phiên bản</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.code}</td>
                  <td className="px-4 py-3 text-slate-600">{item.displayName}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{item.description || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                      {item.systemVersion === "Current" ? "Hiện hành" : "Cũ"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ActiveToggle isActive={item.isActive} itemName={item.displayName}
                      onToggle={() => handleToggleActive(item)} />
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => void openCompatibility(item)} title="Xem hạng xe được phép lái" className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-800">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => openEdit(item)} title="Sửa" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-800">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">Không có GPLX nào.</td></tr>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Sửa GPLX" : "Thêm GPLX"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Mã GPLX</label>
            <input type="text" value={formCode} onChange={(e) => setFormCode(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Tên hiển thị</label>
            <input type="text" value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Mô tả</label>
            <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Phiên bản</label>
            <FormDropdown value={formSystemVersion} onChange={setFormSystemVersion}
              options={[{value: "Current", label: "Hiện hành"}, {value: "LegacyBefore2025", label: "Cũ"}]} />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} isLoading={saving}>{editItem ? "Cập nhật" : "Thêm mới"}</Button>
          </div>
        </div>
      </Modal>
      <LicenseCompatibilityModal
        isOpen={compatibilityModalOpen}
        license={selectedLicense}
        compatibleClasses={compatibleLicenses}
        isLoading={compatibilityLoading}
        onClose={() => setCompatibilityModalOpen(false)}
      />
    </div>
  );
}
