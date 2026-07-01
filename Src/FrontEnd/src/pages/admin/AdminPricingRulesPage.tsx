import { ChevronLeft, ChevronRight, Pencil, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActiveToggle from "@/components/common/ActiveToggle";
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
import { createPricingRule, getPricingRules, updatePricingRule } from "@/features/pricingRules/services/pricingRuleService";
import type { PricingRuleResponse } from "@/features/pricingRules/types";

const PAGE_SIZE = 10;

export default function AdminPricingRulesPage() {
  const [items, setItems] = useState<PricingRuleResponse[]>([]);
  const [brands, setBrands] = useState<VehicleBrandResponse[]>([]);
  const [models, setModels] = useState<VehicleModelResponse[]>([]);
  const [regions, setRegions] = useState<PricingRegionResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PricingRuleResponse | null>(null);
  const [name, setName] = useState("");
  const [formBrandId, setFormBrandId] = useState("");
  const [formModelId, setFormModelId] = useState("");
  const [formRegionId, setFormRegionId] = useState("");
  const [ruleType, setRuleType] = useState<"Multiplier" | "FixedPrice">("Multiplier");
  const [multiplier, setMultiplier] = useState("");
  const [fixedPrice, setFixedPrice] = useState("");
  const [priority, setPriority] = useState("100");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getVehicleBrands({ pageSize: 500 }).then((r) => setBrands(r.items)).catch(() => {});
    getPricingRegions({ pageSize: 500, isActive: true }).then((r) => setRegions(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    const bid = Number(formBrandId);
    if (!bid) { setModels([]); return; }
    getVehicleModelsByBrand(bid).then(setModels).catch(() => setModels([]));
  }, [formBrandId]);

  const load = useCallback(async (nextPage = page) => {
    try {
      const result = await getPricingRules({ page: nextPage, pageSize: PAGE_SIZE, keyword: keyword || undefined });
      setItems(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages || 1);
    } catch {
      setError("Không thể tải quy tắc giá.");
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
    setName("");
    setFormBrandId("");
    setFormModelId("");
    setFormRegionId("");
    setRuleType("Multiplier");
    setMultiplier("");
    setFixedPrice("");
    setPriority("100");
    setStartDate("");
    setEndDate("");
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item: PricingRuleResponse) {
    setEditItem(item);
    setName(item.name);
    setFormBrandId(String(item.brandId ?? ""));
    setFormModelId(String(item.modelId ?? ""));
    setFormRegionId(String(item.pricingRegionId ?? ""));
    setRuleType(item.ruleType);
    setMultiplier(item.multiplier?.toString() ?? "");
    setFixedPrice(item.fixedPrice?.toString() ?? "");
    setPriority(String(item.priority));
    setStartDate(item.startDate ?? "");
    setEndDate(item.endDate ?? "");
    setIsActive(item.isActive);
    setFormError("");
    setModalOpen(true);
  }

  async function handleToggleActive(item: PricingRuleResponse) {
    await updatePricingRule(item.id, {
      name: item.name,
      ruleType: item.ruleType,
      multiplier: item.multiplier,
      fixedPrice: item.fixedPrice,
      brandId: item.brandId,
      modelId: item.modelId,
      pricingRegionId: item.pricingRegionId,
      priority: item.priority,
      startDate: item.startDate,
      endDate: item.endDate,
      isActive: !item.isActive,
    });
    void load(page);
  }

  async function handleSave() {
    const pri = Number(priority);
    const mult = multiplier ? Number(multiplier) : null;
    const price = fixedPrice ? Number(fixedPrice) : null;
    if (!name.trim() || pri < 0 || (ruleType === "Multiplier" && (!mult || mult <= 0)) || (ruleType === "FixedPrice" && (!price || price <= 0)) || (startDate && endDate && startDate > endDate)) {
      setFormError("Vui lòng nhập rule hợp lệ.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const data = {
        name: name.trim(),
        ruleType,
        multiplier: ruleType === "Multiplier" ? mult : null,
        fixedPrice: ruleType === "FixedPrice" ? price : null,
        brandId: formBrandId ? Number(formBrandId) : null,
        modelId: formModelId ? Number(formModelId) : null,
        pricingRegionId: formRegionId ? Number(formRegionId) : null,
        priority: pri,
        startDate: startDate || null,
        endDate: endDate || null,
      };
      if (editItem) await updatePricingRule(editItem.id, { ...data, isActive });
      else await createPricingRule(data);
      setModalOpen(false);
      void load(page);
    } catch {
      setFormError("Lưu quy tắc giá thất bại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-slate-950">Quy tắc giá</h1><p className="mt-1 text-sm text-slate-500">Điều chỉnh giá theo thương hiệu, dòng xe và vùng giá.</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Thêm rule</Button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex gap-2 border-b border-slate-200 p-4"><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm tên rule..." className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm" /><Button onClick={() => void load(1)}><Search className="h-4 w-4" /> Tìm</Button></div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500"><tr><th className="px-4 py-3">Tên rule</th><th className="px-4 py-3">Thương hiệu</th><th className="px-4 py-3">Dòng xe</th><th className="px-4 py-3">Vùng giá</th><th className="px-4 py-3">Loại</th><th className="px-4 py-3">Giá trị</th><th className="px-4 py-3">Ngày</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id}><td className="px-4 py-3 font-medium">{item.name}</td><td className="px-4 py-3">{item.brandName ?? "*"}</td><td className="px-4 py-3">{item.modelName ?? "*"}</td><td className="px-4 py-3">{item.pricingRegionCode ?? "*"}</td><td className="px-4 py-3">{item.ruleType === "Multiplier" ? "Hệ số" : "Giá cố định"}</td><td className="px-4 py-3">{item.ruleType === "Multiplier" ? item.multiplier : item.fixedPrice?.toLocaleString("vi-VN")}</td><td className="px-4 py-3">{item.startDate ?? "*"} - {item.endDate ?? "*"}</td><td className="px-4 py-3"><ActiveToggle isActive={item.isActive} itemName={item.name} onToggle={() => handleToggleActive(item)} /></td><td className="px-4 py-3"><button onClick={() => openEdit(item)} className="text-brand-700"><Pencil className="h-4 w-4" /></button></td></tr>)}</tbody>
        </table>
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Sửa rule giá" : "Thêm rule giá"}>
        <div className="hide-scrollbar max-h-[70vh] space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700">Tên rule</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Thương hiệu</label>
              <FormDropdown value={formBrandId} onChange={(v) => { setFormBrandId(v); setFormModelId(""); }} placeholder="Tất cả thương hiệu"
                options={[{ value: "", label: "Tất cả thương hiệu" }, ...brands.map((b) => ({ value: String(b.id), label: b.name }))]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Dòng xe</label>
              <FormDropdown value={formModelId} onChange={setFormModelId} placeholder="Tất cả dòng xe"
                options={[{ value: "", label: "Tất cả dòng xe" }, ...models.map((m) => ({ value: String(m.id), label: m.name }))]} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Vùng giá</label>
            <FormDropdown value={formRegionId} onChange={setFormRegionId} placeholder="Tất cả vùng giá"
              options={[{ value: "", label: "Tất cả vùng giá" }, ...regions.map((r) => ({ value: String(r.id), label: r.code }))]} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Cách tính giá</label>
            <FormDropdown value={ruleType} onChange={(v) => setRuleType(v as "Multiplier" | "FixedPrice")} placeholder="Chọn cách tính" options={[{ value: "Multiplier", label: "Nhân hệ số giá" }, { value: "FixedPrice", label: "Ghi đè giá cố định" }]} />
          </div>
          {ruleType === "Multiplier" ? (
            <div>
              <label className="block text-sm font-medium text-slate-700">Hệ số nhân</label>
              <input type="number" step="0.01" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} placeholder="Ví dụ: 1.2 = tăng 20%, 0.9 = giảm 10%" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700">Giá cố định</label>
              <input type="number" value={fixedPrice} onChange={(e) => setFixedPrice(e.target.value)} placeholder="Nhập giá/ngày, ví dụ: 850000" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700">Độ ưu tiên</label>
            <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="Ví dụ: 100" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            <span className="mt-1 block text-xs text-slate-500">Số nhỏ hơn sẽ được áp dụng trước khi có nhiều rule cùng hợp lệ.</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Từ ngày</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Đến ngày</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>
          {editItem && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Hoạt động</label>}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button><Button onClick={handleSave} isLoading={saving}>{editItem ? "Cập nhật" : "Thêm mới"}</Button></div>
        </div>
      </Modal>
    </div>
  );
}
