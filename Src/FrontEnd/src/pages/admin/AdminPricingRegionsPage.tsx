import { Pencil, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
      setError("Khong the tai danh sach vung gia.");
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page]);

  useEffect(() => { void load(1); }, []);

  function openCreate() {
    setEditItem(null);
    setCode("");
    setDescription("");
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item: PricingRegionResponse) {
    setEditItem(item);
    setCode(item.code);
    setDescription(item.description ?? "");
    setIsActive(item.isActive);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!/^[A-Za-z0-9_-]{1,50}$/.test(code.trim())) {
      setFormError("Code bat buoc, toi da 50 ky tu va chi gom chu, so, _ hoac -.");
      return;
    }

    try {
      if (editItem) {
        await updatePricingRegion(editItem.id, { code: code.trim(), description: description.trim() || null, isActive });
      } else {
        await createPricingRegion({ code: code.trim(), description: description.trim() || null });
      }
      setModalOpen(false);
      void load(page);
    } catch {
      setFormError("Luu vung gia that bai.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Vung gia</h1>
          <p className="mt-1 text-sm text-slate-500">Quan ly nhom khu vuc dung de goi y gia xe.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Them vung gia</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex gap-2 border-b border-slate-200 p-4">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void load(1); }} placeholder="Tim code..." className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500" />
          <Button onClick={() => void load(1)}><Search className="h-4 w-4" /> Tim</Button>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Mo ta</th><th className="px-4 py-3">Trang thai</th><th className="px-4 py-3">Thao tac</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">{item.code}</td>
                <td className="px-4 py-3 text-slate-600">{item.description ?? "-"}</td>
                <td className="px-4 py-3">{item.isActive ? "Hoat dong" : "Da tat"}</td>
                <td className="px-4 py-3"><button onClick={() => openEdit(item)} className="text-brand-700"><Pencil className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {!isLoading && items.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Khong co du lieu.</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm">
          <span>Trang {page}/{totalPages}</span>
          {isLoading && <LoadingSpinner className="h-4 w-4" />}
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => void load(page - 1)}>Truoc</Button>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Sau</Button>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Sua vung gia" : "Them vung gia"}>
        <div className="space-y-4">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code, VD: HCM_CENTER" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mo ta" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {editItem && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Hoat dong</label>}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModalOpen(false)}>Huy</Button><Button onClick={handleSave}>Luu</Button></div>
        </div>
      </Modal>
    </div>
  );
}
