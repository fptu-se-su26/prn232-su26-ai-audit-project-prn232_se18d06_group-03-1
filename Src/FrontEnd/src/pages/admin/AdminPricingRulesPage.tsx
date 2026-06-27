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
      setError("Không thể tải quy tắc giá.");
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
      setFormError("Vui lòng nhập rule hợp lệ.");
      return;
    }

    try {
      const data = { vehicleId: vehicle, ruleType, multiplier: ruleType === "Multiplier" ? mult : null, fixedPrice: ruleType === "FixedPrice" ? price : null, priority: pri, startDate: startDate || null, endDate: endDate || null };
      if (editItem) await updatePricingRule(editItem.id, { ...data, isActive });
      else await createPricingRule(data);
      setModalOpen(false);
      void load(page);
    } catch {
      setFormError("Lưu quy tắc giá thất bại.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-slate-950">Quy tắc giá</h1><p className="mt-1 text-sm text-slate-500">Điều chỉnh giá theo xe và khoảng ngày.</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Thêm rule</Button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex gap-2 border-b border-slate-200 p-4"><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm biển số..." className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm" /><Button onClick={() => void load(1)}><Search className="h-4 w-4" /> Tìm</Button></div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500"><tr><th className="px-4 py-3">Xe</th><th className="px-4 py-3">Loại</th><th className="px-4 py-3">Giá trị</th><th className="px-4 py-3">Ngày</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id}><td className="px-4 py-3 font-medium">#{item.vehicleId} {item.licensePlate}</td><td className="px-4 py-3">{item.ruleType}</td><td className="px-4 py-3">{item.ruleType === "Multiplier" ? item.multiplier : item.fixedPrice?.toLocaleString("vi-VN")}</td><td className="px-4 py-3">{item.startDate ?? "*"} - {item.endDate ?? "*"}</td><td className="px-4 py-3">{item.priority}</td><td className="px-4 py-3">{item.isActive ? "Hoạt động" : "Đã tắt"}</td><td className="px-4 py-3"><button onClick={() => openEdit(item)} className="text-brand-700"><Pencil className="h-4 w-4" /></button></td></tr>)}</tbody>
        </table>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-4"><Button variant="secondary" disabled={page <= 1} onClick={() => void load(page - 1)}>Trước</Button><Button variant="secondary" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Sau</Button></div>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Sửa rule giá" : "Thêm rule giá"}>
        <div className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Xe áp dụng</span>
            <input type="number" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} placeholder="Nhập ID xe, ví dụ: 12" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
            <span className="text-xs text-slate-500">Rule hiện đang áp dụng cho từng xe cụ thể.</span>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Cách tính giá</span>
            <FormDropdown value={ruleType} onChange={(v) => setRuleType(v as "Multiplier" | "FixedPrice")} placeholder="Chọn cách tính" options={[{ value: "Multiplier", label: "Nhân hệ số giá" }, { value: "FixedPrice", label: "Ghi đè giá cố định" }]} />
          </label>
          {ruleType === "Multiplier" ? (
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Hệ số nhân</span>
              <input type="number" step="0.01" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} placeholder="Ví dụ: 1.2 = tăng 20%, 0.9 = giảm 10%" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
            </label>
          ) : (
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Giá cố định</span>
              <input type="number" value={fixedPrice} onChange={(e) => setFixedPrice(e.target.value)} placeholder="Nhập giá/ngày, ví dụ: 850000" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
            </label>
          )}
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Độ ưu tiên</span>
            <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="Ví dụ: 100" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
            <span className="text-xs text-slate-500">Số nhỏ hơn sẽ được áp dụng trước khi có nhiều rule cùng hợp lệ.</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Từ ngày</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Đến ngày</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
            </label>
          </div>
          {editItem && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Hoạt động</label>}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button><Button onClick={handleSave}>Lưu</Button></div>
        </div>
      </Modal>
    </div>
  );
}
