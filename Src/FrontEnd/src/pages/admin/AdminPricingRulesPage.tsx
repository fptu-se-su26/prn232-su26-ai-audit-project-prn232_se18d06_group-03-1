import { Pencil, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormDropdown from "@/components/common/FormDropdown";
import Modal from "@/components/common/Modal";
import { createPricingRule, getPricingRules, updatePricingRule } from "@/features/pricingRules/services/pricingRuleService";
import type { PricingRuleResponse } from "@/features/pricingRules/types";

const PAGE_SIZE = 10;

export default function AdminPricingRulesPage() {
  const [items, setItems] = useState<PricingRuleResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PricingRuleResponse | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [ruleType, setRuleType] = useState<"Multiplier" | "FixedPrice">("Multiplier");
  const [multiplier, setMultiplier] = useState("");
  const [fixedPrice, setFixedPrice] = useState("");
  const [priority, setPriority] = useState("100");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  const load = useCallback(async (nextPage = page) => {
    try {
      const result = await getPricingRules({ page: nextPage, pageSize: PAGE_SIZE, keyword: keyword || undefined });
      setItems(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages || 1);
    } catch {
      setError("Khong the tai quy tac gia.");
    }
  }, [keyword, page]);

  useEffect(() => { void load(1); }, []);

  function openCreate() {
    setEditItem(null);
    setVehicleId("");
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
    setVehicleId(String(item.vehicleId));
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

  async function handleSave() {
    const vehicle = Number(vehicleId);
    const pri = Number(priority);
    const mult = multiplier ? Number(multiplier) : null;
    const price = fixedPrice ? Number(fixedPrice) : null;
    if (!vehicle || pri < 0 || (ruleType === "Multiplier" && (!mult || mult <= 0)) || (ruleType === "FixedPrice" && (!price || price <= 0)) || (startDate && endDate && startDate > endDate)) {
      setFormError("Vui long nhap rule hop le.");
      return;
    }

    try {
      const data = { vehicleId: vehicle, ruleType, multiplier: ruleType === "Multiplier" ? mult : null, fixedPrice: ruleType === "FixedPrice" ? price : null, priority: pri, startDate: startDate || null, endDate: endDate || null };
      if (editItem) await updatePricingRule(editItem.id, { ...data, isActive });
      else await createPricingRule(data);
      setModalOpen(false);
      void load(page);
    } catch {
      setFormError("Luu quy tac gia that bai.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-slate-950">Quy tac gia</h1><p className="mt-1 text-sm text-slate-500">Dieu chinh gia theo xe va khoang ngay.</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Them rule</Button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex gap-2 border-b border-slate-200 p-4"><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tim bien so..." className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm" /><Button onClick={() => void load(1)}><Search className="h-4 w-4" /> Tim</Button></div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500"><tr><th className="px-4 py-3">Xe</th><th className="px-4 py-3">Loai</th><th className="px-4 py-3">Gia tri</th><th className="px-4 py-3">Ngay</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Trang thai</th><th className="px-4 py-3">Thao tac</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id}><td className="px-4 py-3 font-medium">#{item.vehicleId} {item.licensePlate}</td><td className="px-4 py-3">{item.ruleType}</td><td className="px-4 py-3">{item.ruleType === "Multiplier" ? item.multiplier : item.fixedPrice?.toLocaleString("vi-VN")}</td><td className="px-4 py-3">{item.startDate ?? "*"} - {item.endDate ?? "*"}</td><td className="px-4 py-3">{item.priority}</td><td className="px-4 py-3">{item.isActive ? "Hoat dong" : "Da tat"}</td><td className="px-4 py-3"><button onClick={() => openEdit(item)} className="text-brand-700"><Pencil className="h-4 w-4" /></button></td></tr>)}</tbody>
        </table>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-4"><Button variant="secondary" disabled={page <= 1} onClick={() => void load(page - 1)}>Truoc</Button><Button variant="secondary" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Sau</Button></div>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Sua rule gia" : "Them rule gia"}>
        <div className="space-y-4">
          <input type="number" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} placeholder="Vehicle ID" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
          <FormDropdown value={ruleType} onChange={(v) => setRuleType(v as "Multiplier" | "FixedPrice")} placeholder="Loai rule" options={[{ value: "Multiplier", label: "Multiplier" }, { value: "FixedPrice", label: "Fixed price" }]} />
          {ruleType === "Multiplier" ? <input type="number" step="0.01" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} placeholder="He so, VD: 1.2" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /> : <input type="number" value={fixedPrice} onChange={(e) => setFixedPrice(e.target.value)} placeholder="Gia co dinh" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />}
          <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="Priority" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
          <div className="grid grid-cols-2 gap-3"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm" /><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm" /></div>
          {editItem && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Hoat dong</label>}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModalOpen(false)}>Huy</Button><Button onClick={handleSave}>Luu</Button></div>
        </div>
      </Modal>
    </div>
  );
}
