import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Pencil, Plus, Search, SlidersHorizontal, Trash2, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActiveToggle from "@/components/common/ActiveToggle";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormDropdown from "@/components/common/FormDropdown";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import { createPromotion, deletePromotion, getPromotions, togglePromotion, updatePromotion, adminApprovePromotion, adminRejectPromotion } from "@/features/promotions/services/promotionService";
import type { Promotion } from "@/features/promotions/types";

const PAGE_SIZE = 10;

const DISCOUNT_TYPE_OPTIONS = [
  { value: "Fixed", label: "Cố định" },
  { value: "Percentage", label: "Phần trăm" },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: "All", label: "Tất cả" },
  { value: "Motorbike", label: "Xe máy" },
  { value: "Car", label: "Ô tô" },
];

const WHO_BEAR_OPTIONS = [
  { value: "System", label: "Hệ thống" },
  { value: "Owner", label: "Chủ xe" },
  { value: "Shared", label: "Chia sẻ" },
];

function formatDiscount(item: Promotion) {
  const value =
    item.discountType === "Fixed"
      ? `${item.discountValue.toLocaleString("vi-VN")}đ`
      : `${item.discountValue}%`;
  return `${value} (${item.discountType})`;
}

function formatWhoBears(item: Promotion) {
  if (item.whoBears === "System") return "Hệ thống";
  if (item.whoBears === "Owner") return "Chủ xe";
  if (item.whoBears === "Shared" && item.ownerBearsPercent != null) {
    const sys = 100 - item.ownerBearsPercent;
    return `Chia sẻ (${sys}/${item.ownerBearsPercent})`;
  }
  return "Chia sẻ";
}

function formatVehicleType(v: string) {
  if (v === "Motorbike") return "Xe máy";
  if (v === "Car") return "Ô tô";
  return "Tất cả";
}

function toDatetimeLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 16);
  const offset = -d.getTimezoneOffset();
  const local = new Date(d.getTime() + offset * 60000);
  return local.toISOString().slice(0, 16);
}

function toUtcIso(datetimeLocal?: string) {
  if (!datetimeLocal) return undefined;
  const d = new Date(datetimeLocal);
  if (isNaN(d.getTime())) return datetimeLocal;
  return d.toISOString();
}

export default function AdminPromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Promotion | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("Fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [vehicleType, setVehicleType] = useState("All");
  const [whoBears, setWhoBears] = useState("System");
  const [ownerBearsPercent, setOwnerBearsPercent] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [sendToAllOwners, setSendToAllOwners] = useState(false);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [maxUsageCount, setMaxUsageCount] = useState("100");

  const load = useCallback(
    async (nextPage = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number | boolean | undefined> = {
          page: nextPage,
          pageSize: PAGE_SIZE,
        };
        if (keyword.trim()) params.keyword = keyword.trim();
        if (filterActive === "true") params.isActive = true;
        else if (filterActive === "false") params.isActive = false;
        const result = await getPromotions(params);
        setItems(result.items);
        setPage(result.page);
        setTotalPages(Math.max(1, Math.ceil(result.total / PAGE_SIZE)));
      } catch {
        setError("Không thể tải danh sách khuyến mãi.");
      } finally {
        setIsLoading(false);
      }
    },
    [keyword, filterActive],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

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

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    void load(nextPage);
  }

  function resetFilters() {
    setKeyword("");
    setFilterActive("");
    setShowFilters(false);
  }

  function resetForm() {
    setCode("");
    setName("");
    setDescription("");
    setDiscountType("Fixed");
    setDiscountValue("");
    setMaxDiscountAmount("");
    setMinOrderAmount("");
    setVehicleType("All");
    setWhoBears("System");
    setOwnerBearsPercent("");
    setStartAt("");
    setEndAt("");
    setMaxUsageCount("100");
    setFormError("");
  }

  function openCreate() {
    setEditItem(null);
    resetForm();
    setModalOpen(true);
  }

  function openEdit(item: Promotion) {
    setEditItem(item);
    setCode(item.code);
    setName(item.name);
    setDescription(item.description ?? "");
    setDiscountType(item.discountType);
    setDiscountValue(String(item.discountValue));
    setMaxDiscountAmount(item.maxDiscountAmount != null ? String(item.maxDiscountAmount) : "");
    setMinOrderAmount(item.minOrderAmount != null ? String(item.minOrderAmount) : "");
    setVehicleType(item.vehicleType);
    setWhoBears(item.whoBears);
    setOwnerBearsPercent(item.ownerBearsPercent != null ? String(item.ownerBearsPercent) : "");
    setOwnerId(item.ownerId != null ? String(item.ownerId) : "");
    setSendToAllOwners(item.ownerId == null && item.whoBears !== "System");
    setStartAt(toDatetimeLocal(item.startAt));
    setEndAt(toDatetimeLocal(item.endAt));
    setMaxUsageCount(String(item.maxUsageCount));
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    const dv = Number(discountValue);
    const muc = Number(maxUsageCount);

    if (!code.trim() || !name.trim()) {
      setFormError("Vui lòng nhập mã và tên khuyến mãi.");
      return;
    }
    if (isNaN(dv) || dv <= 0) {
      setFormError("Giá trị giảm giá phải lớn hơn 0.");
      return;
    }
    if (discountType === "Percentage" && dv > 100) {
      setFormError("Phần trăm giảm giá không được vượt quá 100%.");
      return;
    }
    if (isNaN(muc) || muc < 1) {
      setFormError("Số lần sử dụng tối thiểu phải là 1.");
      return;
    }
    if (!startAt) {
      setFormError("Vui lòng chọn ngày bắt đầu.");
      return;
    }
    if (whoBears === "Shared") {
      const obp = Number(ownerBearsPercent);
      if (isNaN(obp) || obp <= 0 || obp >= 100) {
        setFormError("Phần trăm chủ xe chịu phải lớn hơn 0 và nhỏ hơn 100.");
        return;
      }
    }
    if (whoBears !== "System" && !sendToAllOwners && !ownerId.trim()) {
      setFormError("Vui lòng nhập ID chủ xe hoặc chọn 'Gửi tất cả chủ xe'.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      if (editItem) {
        await updatePromotion(editItem.id, {
          name: name.trim(),
          description: description.trim(),
          discountValue: dv,
          maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : 0,
          minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
          vehicleType,
          whoBears,
          ownerBearsPercent: whoBears === "Shared" ? Number(ownerBearsPercent) : 0,
          startAt: toUtcIso(startAt) || startAt,
          endAt: toUtcIso(endAt) || "",
          maxUsageCount: muc,
        });
      } else {
        await createPromotion({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || undefined,
          discountType,
          discountValue: dv,
          maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
          minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
          vehicleType,
          whoBears,
          ownerBearsPercent: whoBears === "Shared" ? Number(ownerBearsPercent) : undefined,
          ownerId: whoBears !== "System" && !sendToAllOwners && ownerId ? Number(ownerId) : undefined,
          startAt: toUtcIso(startAt) || startAt,
          endAt: toUtcIso(endAt) || undefined,
          maxUsageCount: muc,
        });
      }
      setModalOpen(false);
      void load(page);
    } catch {
      setFormError(editItem ? "Cập nhật khuyến mãi thất bại." : "Tạo khuyến mãi thất bại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: Promotion) {
    try {
      await togglePromotion(item.id);
      void load(page);
    } catch {
      setError("Cập nhật trạng thái khuyến mãi thất bại.");
    }
  }

  async function handleAdminApprove(item: Promotion) {
    try {
      await adminApprovePromotion(item.id);
      void load(page);
    } catch {
      setError("Duyệt thất bại.");
    }
  }

  async function handleAdminReject(item: Promotion) {
    try {
      await adminRejectPromotion(item.id);
      void load(page);
    } catch {
      setError("Từ chối thất bại.");
    }
  }

  function openDeleteConfirm(item: Promotion) {
    setDeleteTarget(item);
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePromotion(deleteTarget.id);
      setDeleteTarget(null);
      void load(page);
    } catch {
      setDeleteError("Xóa khuyến mãi thất bại.");
    } finally {
      setDeleting(false);
    }
  }

  const showMaxDiscount = discountType === "Percentage";
  const showOwnerPercent = whoBears === "Shared";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Khuyến mãi</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý mã giảm giá và chương trình khuyến mãi.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Thêm khuyến mãi
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <section className="rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void load(1);
              }}
              placeholder="Tìm mã, tên khuyến mãi..."
              className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <Button onClick={() => setShowFilters((p) => !p)} variant="secondary">
            <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
          </Button>
          <Button onClick={() => void load(1)}>
            <Search className="h-4 w-4" /> Tìm
          </Button>
        </div>

        {showFilters && (
          <div className="relative z-20 flex flex-wrap items-end gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="w-44">
              <label className="mb-1 block text-xs font-medium text-slate-600">Trạng thái</label>
              <FormDropdown
                value={filterActive}
                onChange={setFilterActive}
                placeholder="Tất cả"
                options={[
                  { value: "", label: "Tất cả" },
                  { value: "true", label: "Hoạt động" },
                  { value: "false", label: "Đã tắt" },
                ]}
              />
            </div>
            <Button variant="secondary" onClick={resetFilters}>
              Đặt lại
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Giảm giá</th>
                <th className="px-4 py-3">Ai chịu</th>
                <th className="px-4 py-3">Loại xe</th>
                <th className="px-4 py-3">Sử dụng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Duyệt</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-700">{item.code}</td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{formatDiscount(item)}</td>
                  <td className="px-4 py-3">{formatWhoBears(item)}</td>
                  <td className="px-4 py-3">{formatVehicleType(item.vehicleType)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {item.usageCount}/{item.maxUsageCount}
                  </td>
                  <td className="px-4 py-3">
                    <ActiveToggle isActive={item.isActive} itemName={item.name} onToggle={() => handleToggle(item)} />
                  </td>
                  <td className="px-4 py-3">
                    {item.approvalStatus === "Approved" && <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><CheckCircle className="h-3 w-3" />Đã duyệt</span>}
                    {item.approvalStatus === "Pending" && item.createdByRole === "Owner" && (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Chờ duyệt</span>
                        <button type="button" onClick={() => handleAdminApprove(item)} title="Duyệt" className="inline-flex h-6 w-6 items-center justify-center rounded-md text-green-600 hover:bg-green-50"><CheckCircle className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => handleAdminReject(item)} title="Từ chối" className="inline-flex h-6 w-6 items-center justify-center rounded-md text-red-600 hover:bg-red-50"><XCircle className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                    {item.approvalStatus === "Pending" && item.createdByRole !== "Owner" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Chờ chủ xe duyệt</span>
                    )}
                    {item.approvalStatus === "Rejected" && <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Từ chối</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-700 hover:bg-brand-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteConfirm(item)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Không có dữ liệu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="flex justify-center border-t border-slate-200 py-4">
            <LoadingSpinner className="h-5 w-5" />
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <div className="text-sm text-slate-500">
              Trang {page} / {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p as number)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${p === page ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Sửa khuyến mãi" : "Thêm khuyến mãi"}
      >
        <div className="hide-scrollbar max-h-[70vh] space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Mã khuyến mãi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={!!editItem}
              placeholder="VD: SUMMER2024"
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm uppercase outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tên khuyến mãi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Giảm giá mùa hè"
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả chi tiết về chương trình khuyến mãi..."
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Loại giảm giá <span className="text-red-500">*</span>
              </label>
              <FormDropdown value={discountType} onChange={setDiscountType} options={DISCOUNT_TYPE_OPTIONS} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Giá trị giảm {discountType === "Percentage" ? "(%)" : "(VNĐ)"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "Percentage" ? "VD: 10" : "VD: 50000"}
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {showMaxDiscount && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Giảm tối đa (VNĐ)</label>
              <input
                type="number"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="Không bắt buộc"
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">Đơn tối thiểu (VNĐ)</label>
            <input
              type="number"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              placeholder="Không bắt buộc"
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Loại xe <span className="text-red-500">*</span>
              </label>
              <FormDropdown value={vehicleType} onChange={setVehicleType} options={VEHICLE_TYPE_OPTIONS} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Ai chịu chi phí <span className="text-red-500">*</span>
              </label>
              <FormDropdown
                value={whoBears}
                onChange={(v) => {
                  setWhoBears(v);
    setOwnerBearsPercent("");
    setOwnerId("");
    setSendToAllOwners(false);
                }}
                options={WHO_BEAR_OPTIONS}
              />
            </div>
          </div>

          {showOwnerPercent && (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Chủ xe chịu (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={ownerBearsPercent}
                onChange={(e) => setOwnerBearsPercent(e.target.value)}
                placeholder="VD: 60"
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <span className="mt-1 block text-xs text-slate-500">
                Hệ thống sẽ chịu phần còn lại ({ownerBearsPercent ? 100 - Number(ownerBearsPercent) : "—"}%).
              </span>
            </div>
          )}

          {whoBears !== "System" && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendAllOwners"
                  checked={sendToAllOwners}
                  onChange={(e) => {
                    setSendToAllOwners(e.target.checked);
                    if (e.target.checked) setOwnerId("");
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="sendAllOwners" className="text-sm font-medium text-slate-700">
                  Gửi tất cả chủ xe
                </label>
              </div>

              {!sendToAllOwners && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    ID Chủ xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    placeholder="VD: 5"
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    Nhập ID chủ xe để mã áp dụng cho xe của họ.
                  </span>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Ngày kết thúc</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <span className="mt-1 block text-xs text-slate-500">Để trống nếu không giới hạn.</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Số lần sử dụng tối đa <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={maxUsageCount}
              onChange={(e) => setMaxUsageCount(e.target.value)}
              placeholder="100"
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} isLoading={saving}>
              {editItem ? "Cập nhật" : "Tạo khuyến mãi"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} title="">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">Xóa khuyến mãi</p>
            <p className="mt-1 text-sm text-slate-500">
              Bạn có chắc muốn xóa mã <strong>"{deleteTarget?.code}"</strong>? Hành động này không thể hoàn tác.
            </p>
            {deleteError && (
              <div className="mt-2 flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="flex-1">{deleteError}</span>
                <button type="button" onClick={() => setDeleteError(null)} className="shrink-0 text-red-400 hover:text-red-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Hủy
          </Button>
          <Button onClick={() => void handleConfirmDelete()} isLoading={deleting} className="bg-red-600 hover:bg-red-700">
            <CheckCircle className="h-4 w-4" />
            Xác nhận xóa
          </Button>
        </div>
      </Modal>
    </div>
  );
}
