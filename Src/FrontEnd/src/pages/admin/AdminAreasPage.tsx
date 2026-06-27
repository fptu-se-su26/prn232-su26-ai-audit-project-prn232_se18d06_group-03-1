import { Pencil, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormDropdown from "@/components/common/FormDropdown";
import Modal from "@/components/common/Modal";
import { createArea, getAreas, updateArea } from "@/features/areas/services/areaService";
import type { AreaResponse } from "@/features/areas/types";
import { getPricingRegions } from "@/features/pricingRegions/services/pricingRegionService";
import type { PricingRegionResponse } from "@/features/pricingRegions/types";

const PAGE_SIZE = 10;

export default function AdminAreasPage() {
  const [items, setItems] = useState<AreaResponse[]>([]);
  const [regions, setRegions] = useState<PricingRegionResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<AreaResponse | null>(null);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [pricingRegionId, setPricingRegionId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  useEffect(() => { getPricingRegions({ pageSize: 500, isActive: true }).then((r) => setRegions(r.items)).catch(() => {}); }, []);

  const load = useCallback(async (nextPage = page) => {
    try {
      const result = await getAreas({ page: nextPage, pageSize: PAGE_SIZE, keyword: keyword || undefined });
      setItems(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages || 1);
    } catch {
      setError("Không thể tải danh sách khu vực.");
    }
  }, [keyword, page]);

  useEffect(() => { void load(1); }, []);

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
      setFormError("Vui lòng nhập đầy đủ tỉnh/thành, quận/huyện và vùng giá.");
      return;
    }

    try {
      const data = { province: province.trim(), district: district.trim(), pricingRegionId: Number(pricingRegionId) };
      if (editItem) await updateArea(editItem.id, { ...data, isActive });
      else await createArea(data);
      setModalOpen(false);
      void load(page);
    } catch {
      setFormError("Lưu khu vực thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-slate-950">Khu vực</h1><p className="mt-1 text-sm text-slate-500">Map tỉnh/quận vào vùng giá.</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Thêm khu vực</Button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex gap-2 border-b border-slate-200 p-4"><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm khu vực..." className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm" /><Button onClick={() => void load(1)}><Search className="h-4 w-4" /> Tìm</Button></div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500"><tr><th className="px-4 py-3">Tỉnh/TP</th><th className="px-4 py-3">Quận/Huyện</th><th className="px-4 py-3">Vùng giá</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id}><td className="px-4 py-3 font-medium">{item.province}</td><td className="px-4 py-3">{item.district}</td><td className="px-4 py-3">{item.pricingRegionCode}</td><td className="px-4 py-3">{item.isActive ? "Hoạt động" : "Đã tắt"}</td><td className="px-4 py-3"><button onClick={() => openEdit(item)} className="text-brand-700"><Pencil className="h-4 w-4" /></button></td></tr>)}</tbody>
        </table>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-4"><Button variant="secondary" disabled={page <= 1} onClick={() => void load(page - 1)}>Trước</Button><Button variant="secondary" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Sau</Button></div>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Sửa khu vực" : "Thêm khu vực"}>
        <div className="space-y-4">
          <input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Tỉnh/Thành phố" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
          <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Quận/Huyện" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
          <FormDropdown value={pricingRegionId} onChange={setPricingRegionId} placeholder="Chọn vùng giá" options={regions.map((r) => ({ value: String(r.id), label: r.code }))} />
          {editItem && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Hoạt động</label>}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button><Button onClick={handleSave}>Lưu</Button></div>
        </div>
      </Modal>
    </div>
  );
}
