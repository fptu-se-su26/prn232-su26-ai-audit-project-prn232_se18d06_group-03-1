import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Pencil, Plus, Search, SlidersHorizontal, Trash2, UsersRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActiveToggle from "@/components/common/ActiveToggle";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormDropdown from "@/components/common/FormDropdown";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import { getAdminUsers } from "@/features/admin/services/adminUserService";
import type { AdminUserListItem } from "@/features/admin/types";
import { createPlatformFeeRule, deletePlatformFeeRule, getPlatformFeeRules, updatePlatformFeeRule } from "@/features/platformFeeRules/services/platformFeeRuleService";
import type { PlatformFeeRuleResponse } from "@/features/platformFeeRules/types";

const PAGE_SIZE = 10;
const OWNER_PAGE_SIZE = 100;

const TARGET_TYPE_OPTIONS = [
  { value: "All", label: "Toàn bộ" },
  { value: "Owner", label: "Chủ xe" },
  { value: "VehicleBrand", label: "Hãng xe" },
  { value: "VehicleModel", label: "Dòng xe" },
  { value: "PricingRegion", label: "Vùng giá" },
];

const FEE_TYPE_OPTIONS = [
  { value: "Percentage", label: "Phần trăm" },
  { value: "Fixed", label: "Cố định" },
];

function formatFee(rule?: PlatformFeeRuleResponse) {
  if (!rule) return "Chưa set";
  return rule.feeType === "Percentage" ? `${rule.feeValue}%` : `${rule.feeValue.toLocaleString("vi-VN")} VNĐ`;
}

function getActiveOwnerRule(ownerId: number, rules: PlatformFeeRuleResponse[]) {
  return rules
    .filter((rule) => rule.targetType === "Owner" && rule.targetId === ownerId && rule.isActive)
    .sort((a, b) => a.priority - b.priority || a.id - b.id)[0];
}

function getActiveGlobalRule(rules: PlatformFeeRuleResponse[]) {
  return rules
    .filter((rule) => (rule.targetType === "All" || rule.targetType === "Global") && rule.isActive)
    .sort((a, b) => a.priority - b.priority || a.id - b.id)[0];
}

export default function AdminPlatformFeeRulesPage() {
  const [items, setItems] = useState<PlatformFeeRuleResponse[]>([]);
  const [ownerRules, setOwnerRules] = useState<PlatformFeeRuleResponse[]>([]);
  const [globalRules, setGlobalRules] = useState<PlatformFeeRuleResponse[]>([]);
  const [owners, setOwners] = useState<AdminUserListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [ownerKeyword, setOwnerKeyword] = useState("");
  const [filterTargetType, setFilterTargetType] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlatformFeeRuleResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<PlatformFeeRuleResponse | null>(null);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<number[]>([]);

  const [name, setName] = useState("");
  const [targetType, setTargetType] = useState("All");
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

  const load = useCallback(async (nextPage = 1) => {
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
  }, [keyword, filterTargetType, filterActive]);

  const loadOwnerRules = useCallback(async () => {
    try {
      const result = await getPlatformFeeRules({ targetType: "Owner", isActive: true, page: 1, pageSize: 1000 });
      setOwnerRules(result.items);
    } catch {
      setError("Không thể tải phí theo chủ xe.");
    }
  }, []);

  const loadGlobalRules = useCallback(async () => {
    try {
      const result = await getPlatformFeeRules({ targetType: "All", isActive: true, page: 1, pageSize: 100 });
      setGlobalRules(result.items);
    } catch {
      setError("Không thể tải phí mặc định.");
    }
  }, []);

  const loadOwners = useCallback(async () => {
    setOwnersLoading(true);
    try {
      const result = await getAdminUsers({
        role: "Owner",
        keyword: ownerKeyword.trim() || undefined,
        page: 1,
        pageSize: OWNER_PAGE_SIZE,
      });
      setOwners(result.items);
    } catch {
      setError("Không thể tải danh sách chủ xe.");
    } finally {
      setOwnersLoading(false);
    }
  }, [ownerKeyword]);

  useEffect(() => {
    void load(1);
    void loadOwners();
    void loadOwnerRules();
    void loadGlobalRules();
  }, [load, loadOwners, loadOwnerRules, loadGlobalRules]);

  const ownerOptions = useMemo(
    () => owners.map((owner) => ({ value: String(owner.userId), label: `${owner.fullName} - ${owner.email}` })),
    [owners],
  );

  const ownerRuleById = useMemo(() => {
    const globalRule = getActiveGlobalRule(globalRules);
    const map = new Map<number, { rule?: PlatformFeeRuleResponse; inherited: boolean }>();
    owners.forEach((owner) => {
      const ownerRule = getActiveOwnerRule(owner.userId, ownerRules);
      map.set(owner.userId, { rule: ownerRule ?? globalRule, inherited: !ownerRule && !!globalRule });
    });
    return map;
  }, [globalRules, ownerRules, owners]);

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

  function refreshFeeData() {
    void load(page);
    void loadOwnerRules();
    void loadGlobalRules();
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    void load(nextPage);
  }

  function resetFilters() {
    setKeyword("");
    setFilterTargetType("");
    setFilterActive("");
    setShowFilters(false);
  }

  function resetForm() {
    setName("");
    setTargetType("All");
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
  }

  function openCreate() {
    setEditItem(null);
    resetForm();
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
    setStartAt(item.startAt?.slice(0, 10) ?? "");
    setEndAt(item.endAt?.slice(0, 10) ?? "");
    setIsActive(item.isActive);
    setFormError("");
    setModalOpen(true);
  }

  function openOwnerEdit(owner: AdminUserListItem) {
    const effectiveFee = ownerRuleById.get(owner.userId);
    if (effectiveFee?.rule && !effectiveFee.inherited) {
      openEdit(effectiveFee.rule);
      return;
    }

    setEditItem(null);
    resetForm();
    setName(`Phí chủ xe - ${owner.fullName}`);
    setTargetType("Owner");
    setTargetId(String(owner.userId));
    setFeeType("Percentage");
    setFeeValue("10");
    setPriority("10");
    setModalOpen(true);
  }

  async function saveRuleForOwner(owner: AdminUserListItem, existingRule?: PlatformFeeRuleResponse) {
    const fv = Number(feeValue);
    const pri = Number(priority);
    const data = {
      name: existingRule?.name || `Phí chủ xe - ${owner.fullName}`,
      targetType: "Owner",
      targetId: owner.userId,
      feeType,
      feeValue: fv,
      minFee: minFee ? Number(minFee) : null,
      maxFee: maxFee ? Number(maxFee) : null,
      priority: pri,
      startAt: startAt || null,
      endAt: endAt || null,
    };

    if (existingRule) await updatePlatformFeeRule(existingRule.id, { ...data, isActive: true });
    else await createPlatformFeeRule(data);
  }

  async function handleSave() {
    const fv = Number(feeValue);
    const pri = Number(priority);
    const tid = targetId ? Number(targetId) : null;

    if (isNaN(fv) || fv <= 0 || isNaN(pri) || pri < 0) {
      setFormError("Vui lòng nhập thông tin hợp lệ.");
      return;
    }

    if (selectedOwnerIds.length === 0 && (!name.trim() || (targetType === "Owner" && !tid))) {
      setFormError("Vui lòng chọn đầy đủ đối tượng áp dụng.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      if (selectedOwnerIds.length > 0) {
        const selectedOwners = owners.filter((owner) => selectedOwnerIds.includes(owner.userId));
        await Promise.all(selectedOwners.map((owner) => {
          const effectiveFee = ownerRuleById.get(owner.userId);
          return saveRuleForOwner(owner, effectiveFee?.inherited ? undefined : effectiveFee?.rule);
        }));
        setSelectedOwnerIds([]);
      } else {
        const data = {
          name: name.trim(),
          targetType,
          targetId: targetType === "All" || targetType === "Global" ? null : tid,
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
      }

      setModalOpen(false);
      refreshFeeData();
    } catch {
      setFormError("Lưu phí nền tảng thất bại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: PlatformFeeRuleResponse) {
    try {
      await updatePlatformFeeRule(item.id, {
        name: item.name,
        targetType: item.targetType,
        targetId: item.targetId,
        feeType: item.feeType,
        feeValue: item.feeValue,
        minFee: item.minFee,
        maxFee: item.maxFee,
        priority: item.priority,
        startAt: item.startAt,
        endAt: item.endAt,
        isActive: !item.isActive,
      });
      refreshFeeData();
    } catch {
      setError("Cập nhật trạng thái phí thất bại.");
    }
  }

  function openDeleteConfirm(item: PlatformFeeRuleResponse) {
    setDeleteTarget(item);
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePlatformFeeRule(deleteTarget.id);
      setDeleteTarget(null);
      refreshFeeData();
    } catch {
      setDeleteError("Xóa phí nền tảng thất bại.");
    } finally {
      setDeleting(false);
    }
  }

  function openBulkOwnerFee() {
    if (selectedOwnerIds.length === 0) return;
    setEditItem(null);
    resetForm();
    setName(`Áp phí cho ${selectedOwnerIds.length} chủ xe`);
    setTargetType("Owner");
    setFeeType("Percentage");
    setFeeValue("10");
    setPriority("10");
    setModalOpen(true);
  }

  function toggleOwner(ownerId: number) {
    setSelectedOwnerIds((current) =>
      current.includes(ownerId) ? current.filter((id) => id !== ownerId) : [...current, ownerId],
    );
  }

  function toggleAllOwners() {
    setSelectedOwnerIds((current) => current.length === owners.length ? [] : owners.map((owner) => owner.userId));
  }

  const targetTypeLabel = (v: string) => (v === "Global" ? "Toàn bộ" : TARGET_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v);
  const feeTypeLabel = (v: string) => FEE_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Phí nền tảng</h1>
          <p className="mt-1 text-sm text-slate-500">Set phí chung, phí theo chủ xe và theo dõi mức phí đang áp dụng.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Thêm phí</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        <section className="rounded-md border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void load(1); }} placeholder="Tìm tên phí..." className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-brand-500" />
            </div>
            <Button onClick={() => { setShowFilters((p) => !p); }} variant="secondary"><SlidersHorizontal className="h-4 w-4" /> Bộ lọc</Button>
            <Button onClick={() => void load(1)}><Search className="h-4 w-4" /> Tìm</Button>
          </div>

          {showFilters && (
            <div className="relative z-20 flex flex-wrap items-end gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="w-48">
                <label className="mb-1 block text-xs font-medium text-slate-600">Loại áp dụng</label>
                <FormDropdown value={filterTargetType} onChange={setFilterTargetType} placeholder="Tất cả" options={[{ value: "", label: "Tất cả" }, ...TARGET_TYPE_OPTIONS]} />
              </div>
              <div className="w-44">
                <label className="mb-1 block text-xs font-medium text-slate-600">Trạng thái</label>
                <FormDropdown value={filterActive} onChange={setFilterActive} placeholder="Tất cả" options={[{ value: "", label: "Tất cả" }, { value: "true", label: "Hoạt động" }, { value: "false", label: "Đã tắt" }]} />
              </div>
              <Button variant="secondary" onClick={resetFilters}>Đặt lại</Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tên phí</th>
                  <th className="px-4 py-3">Loại áp dụng</th>
                  <th className="px-4 py-3">Đối tượng</th>
                  <th className="px-4 py-3">Loại phí</th>
                  <th className="px-4 py-3">Giá trị</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">{targetTypeLabel(item.targetType)}</td>
                    <td className="px-4 py-3 text-slate-600">{item.targetId ?? "*"}</td>
                    <td className="px-4 py-3">{feeTypeLabel(item.feeType)}</td>
                    <td className="px-4 py-3">{formatFee(item)}</td>
                    <td className="px-4 py-3">
                      <ActiveToggle isActive={item.isActive} itemName={item.name} onToggle={() => handleToggleActive(item)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => openEdit(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-700 hover:bg-brand-50">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => openDeleteConfirm(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && items.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Không có dữ liệu.</td></tr>}
              </tbody>
            </table>
          </div>

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
        </section>

        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <UsersRound className="h-4 w-4 text-brand-700" />
                Danh sách chủ xe
              </div>
              <Button variant="secondary" onClick={openBulkOwnerFee} disabled={selectedOwnerIds.length === 0}>
                Set chung ({selectedOwnerIds.length})
              </Button>
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={ownerKeyword} onChange={(e) => setOwnerKeyword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void loadOwners(); }} placeholder="Tìm chủ xe..." className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-brand-500" />
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={owners.length > 0 && selectedOwnerIds.length === owners.length} onChange={toggleAllOwners} />
              Chọn tất cả
            </label>
            <button type="button" onClick={() => void loadOwners()} className="text-sm font-medium text-brand-700 hover:text-brand-800">Tải lại</button>
          </div>

          <div className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto">
            {owners.map((owner) => {
              const effectiveFee = ownerRuleById.get(owner.userId);
              const rule = effectiveFee?.rule;
              return (
                <div key={owner.userId} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <input type="checkbox" checked={selectedOwnerIds.includes(owner.userId)} onChange={() => toggleOwner(owner.userId)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{owner.fullName}</div>
                    <div className="truncate text-xs text-slate-500">{owner.email}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Phí hiện tại: <span className={rule ? "font-medium text-brand-700" : "font-medium text-slate-500"}>{formatFee(rule)}</span>
                      {effectiveFee?.inherited && <span className="text-slate-400"> mặc định</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => openOwnerEdit(owner)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-700 hover:bg-brand-50">
                      <Pencil className="h-4 w-4" />
                    </button>
                    {rule && !effectiveFee?.inherited && (
                      <button type="button" onClick={() => openDeleteConfirm(rule)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {!ownersLoading && owners.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-500">Không có chủ xe phù hợp.</div>}
            {ownersLoading && <div className="flex justify-center px-4 py-6"><LoadingSpinner className="h-5 w-5" /></div>}
          </div>
        </section>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedOwnerIds.length > 0 ? "Set phí cho nhiều chủ xe" : editItem ? "Sửa phí nền tảng" : "Thêm phí nền tảng"}>
        <div className="hide-scrollbar max-h-[70vh] space-y-4 overflow-y-auto">
          {selectedOwnerIds.length === 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Tên phí</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Phí dịch vụ cơ bản" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
          )}

          {selectedOwnerIds.length > 0 && (
            <div className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800">
              Đang áp dụng cho {selectedOwnerIds.length} chủ xe đã chọn.
            </div>
          )}

          {selectedOwnerIds.length === 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Loại áp dụng</label>
                <FormDropdown value={targetType} onChange={(value) => { setTargetType(value); setTargetId(""); }} options={TARGET_TYPE_OPTIONS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Đối tượng</label>
                {targetType === "Owner" ? (
                  <FormDropdown value={targetId} onChange={setTargetId} placeholder="Chọn chủ xe" options={ownerOptions} />
                ) : (
                  <input type="number" value={targetId} onChange={(e) => setTargetId(e.target.value)} disabled={targetType === "All" || targetType === "Global"} placeholder="Để trống nếu áp dụng toàn bộ" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400" />
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Loại phí</label>
              <FormDropdown value={feeType} onChange={setFeeType} options={FEE_TYPE_OPTIONS} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Giá trị {feeType === "Percentage" ? "(%)" : "(VNĐ)"}</label>
              <input type="number" step="any" value={feeValue} onChange={(e) => setFeeValue(e.target.value)} placeholder={feeType === "Percentage" ? "VD: 10" : "VD: 50000"} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Từ ngày</label>
              <input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Đến ngày</label>
              <input type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>

          {editItem && selectedOwnerIds.length === 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Hoạt động</label>}
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button><Button onClick={handleSave} isLoading={saving}>{editItem ? "Cập nhật" : "Lưu phí"}</Button></div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} title="">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">Xóa phí nền tảng</p>
            <p className="mt-1 text-sm text-slate-500">
              Bạn có chắc muốn xóa <strong>"{deleteTarget?.name}"</strong>? Hành động này không thể hoàn tác.
            </p>
            {deleteError && (
              <div className="mt-2 flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="flex-1">{deleteError}</span>
                <button type="button" onClick={() => setDeleteError(null)} className="shrink-0 text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Hủy</Button>
          <Button onClick={() => void handleConfirmDelete()} isLoading={deleting} className="bg-red-600 hover:bg-red-700">
            <CheckCircle className="h-4 w-4" />
            Xác nhận xóa
          </Button>
        </div>
      </Modal>
    </div>
  );
}
