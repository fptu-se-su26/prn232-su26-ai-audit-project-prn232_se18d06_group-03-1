import { Pencil, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormDropdown from "@/components/common/FormDropdown";
import Modal from "@/components/common/Modal";
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

export default function AdminVehicleModelPricingsPage() {
  const [items, setItems] = useState<VehicleModelPricingResponse[]>([]);
  const [brands, setBrands] = useState<VehicleBrandResponse[]>([]);
  const [models, setModels] = useState<VehicleModelResponse[]>([]);
  const [regions, setRegions] = useState<PricingRegionResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<VehicleModelPricingResponse | null>(null);
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [pricingRegionId, setPricingRegionId] = useState("");
  const [suggestedMinPrice, setSuggestedMinPrice] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [suggestedMaxPrice, setSuggestedMaxPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    getVehicleBrands({ pageSize: 500 }).then((r) => setBrands(r.items)).catch(() => {});
    getPricingRegions({ pageSize: 500, isActive: true }).then((r) => setRegions(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!brandId) {
      setModels([]);
      setModelId("");
      return;
    }
    getVehicleModelsByBrand(Number(brandId)).then(setModels).catch(() => setModels([]));
  }, [brandId]);

  const load = useCallback(async (nextPage = page) => {
    try {
      const result = await getVehicleModelPricings({ page: nextPage, pageSize: PAGE_SIZE, keyword: keyword || undefined });
      setItems(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages || 1);
    } catch {
      setError("Khong the tai khung gia dong xe.");
    }
  }, [keyword, page]);

  useEffect(() => { void load(1); }, []);

  function openCreate() {
    setEditItem(null);
    setBrandId("");
    setModelId("");
    setPricingRegionId("");
    setSuggestedMinPrice("");
    setBasePrice("");
    setSuggestedMaxPrice("");
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item: VehicleModelPricingResponse) {
    setEditItem(item);
    setBrandId(String(item.brandId));
    setModelId(String(item.modelId));
    setPricingRegionId(String(item.pricingRegionId));
    setSuggestedMinPrice(String(item.suggestedMinPrice));
    setBasePrice(String(item.basePrice));
    setSuggestedMaxPrice(String(item.suggestedMaxPrice));
    setIsActive(item.isActive);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    const min = Number(suggestedMinPrice);
    const base = Number(basePrice);
    const max = Number(suggestedMaxPrice);
    if (!modelId || !pricingRegionId || min <= 0 || base <= 0 || max <= 0 || min > base || base > max) {
      setFormError("Vui long chon model/vung gia va nhap gia theo thu tu min <= base <= max.");
      return;
    }

    try {
      const data = { modelId: Number(modelId), pricingRegionId: Number(pricingRegionId), suggestedMinPrice: min, basePrice: base, suggestedMaxPrice: max };
      if (editItem) await updateVehicleModelPricing(editItem.id, { ...data, isActive });
      else await createVehicleModelPricing(data);
      setModalOpen(false);
      void load(page);
    } catch {
      setFormError("Luu khung gia that bai.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-slate-950">Khung gia dong xe</h1><p className="mt-1 text-sm text-slate-500">Gia goi y theo dong xe va vung gia.</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Them khung gia</Button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex gap-2 border-b border-slate-200 p-4"><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tim model/vung gia..." className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm" /><Button onClick={() => void load(1)}><Search className="h-4 w-4" /> Tim</Button></div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500"><tr><th className="px-4 py-3">Dong xe</th><th className="px-4 py-3">Vung gia</th><th className="px-4 py-3">Min</th><th className="px-4 py-3">Base</th><th className="px-4 py-3">Max</th><th className="px-4 py-3">Trang thai</th><th className="px-4 py-3">Thao tac</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id}><td className="px-4 py-3 font-medium">{item.brandName} {item.modelName}</td><td className="px-4 py-3">{item.pricingRegionCode}</td><td className="px-4 py-3">{money(item.suggestedMinPrice)}</td><td className="px-4 py-3">{money(item.basePrice)}</td><td className="px-4 py-3">{money(item.suggestedMaxPrice)}</td><td className="px-4 py-3">{item.isActive ? "Hoat dong" : "Da tat"}</td><td className="px-4 py-3"><button onClick={() => openEdit(item)} className="text-brand-700"><Pencil className="h-4 w-4" /></button></td></tr>)}</tbody>
        </table>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-4"><Button variant="secondary" disabled={page <= 1} onClick={() => void load(page - 1)}>Truoc</Button><Button variant="secondary" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Sau</Button></div>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Sua khung gia" : "Them khung gia"}>
        <div className="space-y-4">
          <FormDropdown value={brandId} onChange={setBrandId} placeholder="Chon hang xe" options={brands.map((b) => ({ value: String(b.id), label: `${b.name} - ${b.vehicleType}` }))} />
          <FormDropdown value={modelId} onChange={setModelId} placeholder="Chon dong xe" options={models.map((m) => ({ value: String(m.id), label: m.name }))} />
          <FormDropdown value={pricingRegionId} onChange={setPricingRegionId} placeholder="Chon vung gia" options={regions.map((r) => ({ value: String(r.id), label: r.code }))} />
          <div className="grid grid-cols-3 gap-3">
            <input type="number" value={suggestedMinPrice} onChange={(e) => setSuggestedMinPrice(e.target.value)} placeholder="Min" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
            <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="Base" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
            <input type="number" value={suggestedMaxPrice} onChange={(e) => setSuggestedMaxPrice(e.target.value)} placeholder="Max" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
          </div>
          {editItem && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Hoat dong</label>}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModalOpen(false)}>Huy</Button><Button onClick={handleSave}>Luu</Button></div>
        </div>
      </Modal>
    </div>
  );
}
