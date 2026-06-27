import { ChevronLeft, ChevronRight, Pencil, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import { createPricingRegion, getPricingRegions, updatePricingRegion } from "@/features/pricingRegions/services/pricingRegionService";
import type { PricingRegionResponse } from "@/features/pricingRegions/types";

const PAGE_SIZE = 10;

export default function AdminPricingRegionsPage() {
  const [items, setItems] = useState<PricingRegionResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PricingRegionResponse | null>(null);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [coefficient, setCoefficient] = useState("1.00");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  const load = useCallback(async (nextPage = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getPricingRegions({ page: nextPage, pageSize: PAGE_SIZE, keyword: keyword || undefined });
      setItems(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages || 1);
    } catch {
      setError("Không thể tải danh sách vùng giá.");
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page]);

  useEffect(() => { void load(1); }, []);

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
    setCode("");
    setDescription("");
    setCoefficient("1.00");
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item: PricingRegionResponse) {
    setEditItem(item);
    setCode(item.code);
    setDescription(item.description ?? "");
    setCoefficient(String(item.coefficient));
    setIsActive(item.isActive);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!/^[A-Za-z0-9_-]{1,50}$/.test(code.trim())) {
      setFormError("Code bắt buộc, tối đa 50 ký tự và chỉ gồm chữ, số, _ hoặc -.");
      return;
    }
    const coeff = Number(coefficient);
    if (isNaN(coeff) || coeff <= 0) {
      setFormError("Hệ số giá phải là số dương.");
      return;
    }

    try {
      if (editItem) {
        await updatePricingRegion(editItem.id, { code: code.trim(), description: description.trim() || null, coefficient: coeff, isActive });
      } else {
        await createPricingRegion({ code: code.trim(), description: description.trim() || null, coefficient: coeff });
      }
      setModalOpen(false);
      void load(page);
    } catch {
      setFormError("Lưu vùng giá thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Vùng giá</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý nhóm khu vực và hệ số giá.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Thêm vùng giá</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex gap-2 border-b border-slate-200 p-4">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void load(1); }} placeholder="Tìm code..." className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500" />
          <Button onClick={() => void load(1)}><Search className="h-4 w-4" /> Tìm</Button>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Mô tả</th><th className="px-4 py-3">Hệ số giá</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">{item.code}</td>
                <td className="px-4 py-3 text-slate-600">{item.description ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600">{item.coefficient.toFixed(2)}</td>
                <td className="px-4 py-3">{item.isActive ? "Hoạt động" : "Đã tắt"}</td>
                <td className="px-4 py-3"><button onClick={() => openEdit(item)} className="text-brand-700"><Pencil className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {!isLoading && items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Không có dữ liệu.</td></tr>}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <div className="text-sm text-slate-500">Trang {page} / {totalPages}</div>
            {isLoading && <LoadingSpinner className="h-4 w-4" />}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Sửa vùng giá" : "Thêm vùng giá"}>
        <div className="space-y-4">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code, VD: HCM_CENTER" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <div className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Hệ số giá</span>
            <input type="number" step="0.01" min="0" value={coefficient} onChange={(e) => setCoefficient(e.target.value)} placeholder="VD: 1.20" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
            <span className="text-xs text-slate-500">Giá vùng = Giá cơ sở × Hệ số. Mặc định 1.00.</span>
          </div>
          {editItem && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Hoạt động</label>}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button><Button onClick={handleSave}>Lưu</Button></div>
        </div>
      </Modal>
    </div>
  );
}
