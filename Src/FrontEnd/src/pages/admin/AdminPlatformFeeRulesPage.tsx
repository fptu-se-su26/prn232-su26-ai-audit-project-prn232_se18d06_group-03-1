import { ChevronLeft, ChevronRight, Pencil, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormDropdown from "@/components/common/FormDropdown";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import { createPlatformFeeRule, deletePlatformFeeRule, getPlatformFeeRules, updatePlatformFeeRule } from "@/features/platformFeeRules/services/platformFeeRuleService";
import type { PlatformFeeRuleResponse } from "@/features/platformFeeRules/types";

const PAGE_SIZE = 10;

const TARGET_TYPE_OPTIONS = [
  { value: "Global", label: "Toàn bộ" },
  { value: "VehicleBrand", label: "Hãng xe" },
  { value: "VehicleModel", label: "Dòng xe" },
  { value: "PricingRegion", label: "Vùng giá" },
];

const FEE_TYPE_OPTIONS = [
  { value: "Percentage", label: "Phần trăm" },
  { value: "Fixed", label: "Cố định" },
];

export default function AdminPlatformFeeRulesPage() {
  const [items, setItems] = useState<PlatformFeeRuleResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [filterTargetType, setFilterTargetType] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PlatformFeeRuleResponse | null>(null);

  const [name, setName] = useState("");
  const [targetType, setTargetType] = useState("Global");
  const [targetId, setTargetId] = useState("");
  const [feeType, setFeeType] = useState("Percentage");
  const [feeValue, setFeeValue] = useState("");
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [priority, setPriority] = useState("100");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (nextPage = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean | undefined> = { page: nextPage, pageSize: PAGE_SIZE };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (filterTargetType) params.targetType = filterTargetType;
      if (filterActive === "true") params.isActive = true;
      else if (filterActive === "false") params.isActive = false;
      const result = await getPlatformFeeRules(params);
      setItems(result.items);
      setPage(result.page);
      setTotalPages(result.totalPages || 1);
    } catch {
      setError("Không thể tải danh sách phí nền tảng.");
    } finally {
      setIsLoading(false);
    }
  }, [keyword, filterTargetType, filterActive, page]);

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

  function resetFilters() {
    setKeyword("");
    setFilterTargetType("");
    setFilterActive("");
    setShowFilters(false);
  }

  function openCreate() {
    setEditItem(null);
    setName("");
    setTargetType("Global");
    setTargetId("");
    setFeeType("Percentage");
    setFeeValue("");
    setMinFee("");
    setMaxFee("");
    setPriority("100");
    setStartAt("");
    setEndAt("");
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item: PlatformFeeRuleResponse) {
    setEditItem(item);
    setName(item.name);
    setTargetType(item.targetType);
    setTargetId(item.targetId !== null ? String(item.targetId) : "");
    setFeeType(item.feeType);
    setFeeValue(String(item.feeValue));
    setMinFee(item.minFee !== null ? String(item.minFee) : "");
    setMaxFee(item.maxFee !== null ? String(item.maxFee) : "");
    setPriority(String(item.priority));
    setStartAt(item.startAt ?? "");
    setEndAt(item.endAt ?? "");
    setIsActive(item.isActive);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    const fv = Number(feeValue);
    const pri = Number(priority);
    const tid = targetId ? Number(targetId) : null;

    if (!name.trim() || isNaN(fv) || fv <= 0 || isNaN(pri) || pri < 0) {
      setFormError("Vui lòng nhập thông tin hợp lệ.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const data = {
        name: name.trim(),
        targetType,
        targetId: tid,
        feeType,
        feeValue: fv,
        minFee: minFee ? Number(minFee) : null,
        maxFee: maxFee ? Number(maxFee) : null,
        priority: pri,
        startAt: startAt || null,
        endAt: endAt || null,
      };
      if (editItem) await updatePlatformFeeRule(editItem.id, { ...data, isActive });
      else await createPlatformFeeRule(data);
      setModalOpen(false);
      void load(page);
    } catch {
      setFormError("Lưu phí nền tảng thất bại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: PlatformFeeRuleResponse) {
    if (!window.confirm(`Xóa phí "${item.name}"?`)) return;
    try {
      await deletePlatformFeeRule(item.id);
      void load(page);
    } catch {
      setError("Xóa phí nền tảng thất bại.");
    }
  }

  const targetTypeLabel = (v: string) => TARGET_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v;
  const feeTypeLabel = (v: string) => FEE_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Phí nền tảng</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý phí dịch vụ áp dụng cho các giao dịch trên nền tảng.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Thêm phí</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void load(1); }} placeholder="Tìm tên phí..." className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-brand-500" />
          </div>
          <Button onClick={() => { setShowFilters((p) => !p); }} variant="secondary"><SlidersHorizontal className="h-4 w-4" /> Bộ lọc</Button>
          <Button onClick={() => void load(1)}><Search className="h-4 w-4" /> Tìm</Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-end gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Loại áp dụng</label>
              <FormDropdown value={filterTargetType} onChange={setFilterTargetType} placeholder="Tất cả" options={[{ value: "", label: "Tất cả" }, ...TARGET_TYPE_OPTIONS]} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Trạng thái</label>
              <FormDropdown value={filterActive} onChange={setFilterActive} placeholder="Tất cả" options={[{ value: "", label: "Tất cả" }, { value: "true", label: "Hoạt động" }, { value: "false", label: "Đã tắt" }]} />
            </div>
            <Button variant="secondary" onClick={resetFilters}>Đặt lại</Button>
          </div>
        )}

        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Tên phí</th>
              <th className="px-4 py-3">Loại áp dụng</th>
              <th className="px-4 py-3">Đối tượng</th>
              <th className="px-4 py-3">Loại phí</th>
              <th className="px-4 py-3">Giá trị</th>
              <th className="px-4 py-3">Phí tối thiểu</th>
              <th className="px-4 py-3">Phí tối đa</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{targetTypeLabel(item.targetType)}</td>
                <td className="px-4 py-3 text-slate-600">{item.targetId ?? "*"}</td>
                <td className="px-4 py-3">{feeTypeLabel(item.feeType)}</td>
                <td className="px-4 py-3">{item.feeType === "Percentage" ? `${item.feeValue}%` : item.feeValue.toLocaleString("vi-VN")}</td>
                <td className="px-4 py-3 text-slate-600">{item.minFee !== null ? item.minFee.toLocaleString("vi-VN") : "-"}</td>
                <td className="px-4 py-3 text-slate-600">{item.maxFee !== null ? item.maxFee.toLocaleString("vi-VN") : "-"}</td>
                <td className="px-4 py-3">{item.startAt ?? "*"} - {item.endAt ?? "*"}</td>
                <td className="px-4 py-3">{item.isActive ? "Hoạt động" : "Đã tắt"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(item)} className="text-brand-700"><Pencil className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && items.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">Không có dữ liệu.</td></tr>}
          </tbody>
        </table>

        {isLoading && <div className="flex justify-center border-t border-slate-200 py-4"><LoadingSpinner className="h-5 w-5" /></div>}

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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Sửa phí nền tảng" : "Thêm phí nền tảng"}>
        <div className="hide-scrollbar max-h-[70vh] space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700">Tên phí</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Phí dịch vụ cơ bản" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Loại áp dụng</label>
              <FormDropdown value={targetType} onChange={setTargetType} options={TARGET_TYPE_OPTIONS} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">ID đối tượng</label>
              <input type="number" value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Để trống nếu áp dụng toàn bộ" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Loại phí</label>
              <FormDropdown value={feeType} onChange={setFeeType} options={FEE_TYPE_OPTIONS} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Giá trị {feeType === "Percentage" ? "(%)" : "(VNĐ)"}</label>
              <input type="number" step="any" value={feeValue} onChange={(e) => setFeeValue(e.target.value)} placeholder={feeType === "Percentage" ? "VD: 10" : "VD: 50000"} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Phí tối thiểu (VNĐ)</label>
              <input type="number" value={minFee} onChange={(e) => setMinFee(e.target.value)} placeholder="Không bắt buộc" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Phí tối đa (VNĐ)</label>
              <input type="number" value={maxFee} onChange={(e) => setMaxFee(e.target.value)} placeholder="Không bắt buộc" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Độ ưu tiên</label>
            <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="VD: 100" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            <span className="mt-1 block text-xs text-slate-500">Số nhỏ hơn sẽ được áp dụng trước.</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Từ ngày</label>
              <input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Đến ngày</label>
              <input type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
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
