import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ActiveToggle from "@/components/common/ActiveToggle";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormDropdown from "@/components/common/FormDropdown";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import { showToast } from "@/components/common/toastStore";
import {
  createBanner,
  deleteBanner,
  getBanners,
  toggleBanner,
  updateBanner,
  uploadBannerImage,
} from "@/features/banners/services/bannerService";
import type { Banner } from "@/features/banners/types";
import { getPromotions } from "@/features/promotions/services/promotionService";
import type { Promotion } from "@/features/promotions/types";

const PAGE_SIZE = 10;
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
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

function formatDateTime(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getApiMessage(err: unknown, fallback: string) {
  const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
  return data?.message || fallback;
}

export default function AdminBannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Banner | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");
  const [imageTouched, setImageTouched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [promotionId, setPromotionId] = useState("");
  const [approvedPromos, setApprovedPromos] = useState<Promotion[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupDescription, setPopupDescription] = useState("");
  const [popupCtaLabel, setPopupCtaLabel] = useState("Nhận voucher");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

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
        const result = await getBanners(params);
        setItems(result.items);
        setPage(result.page);
        setTotalPages(result.totalPages || Math.max(1, Math.ceil(result.totalCount / PAGE_SIZE)));
      } catch {
        setError("Không thể tải danh sách banner.");
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

  async function loadApprovedPromos() {
    setLoadingPromos(true);
    try {
      const result = await getPromotions({ page: 1, pageSize: 100, isActive: true });
      setApprovedPromos(result.items.filter((p) => p.approvalStatus === "Approved"));
    } catch {
      setApprovedPromos([]);
    } finally {
      setLoadingPromos(false);
    }
  }

  function resetForm() {
    setTitle("");
    setImageUrl("");
    setImagePublicId("");
    setImageTouched(false);
    setUploadError("");
    setPromotionId("");
    setPopupTitle("");
    setPopupDescription("");
    setPopupCtaLabel("Nhận voucher");
    setDisplayOrder("0");
    setStartAt("");
    setEndAt("");
    setIsActive(true);
    setFormError("");
  }

  function openCreate() {
    setEditItem(null);
    resetForm();
    setModalOpen(true);
    void loadApprovedPromos();
  }

  const selectedPromo = useMemo(
    () => approvedPromos.find((p) => String(p.id) === promotionId),
    [approvedPromos, promotionId],
  );

  function handlePromotionChange(value: string) {
    setPromotionId(value);
    const promo = approvedPromos.find((p) => String(p.id) === value);
    if (promo) {
      // Đồng bộ một lần từ Promotion (submit sẽ dùng Promotion làm source of truth).
      setPopupTitle(promo.name);
      setPopupDescription(promo.description ?? "");
    } else {
      setPopupTitle("");
      setPopupDescription("");
    }
  }

  function openEdit(item: Banner) {
    setEditItem(item);
    setTitle(item.title);
    setImageUrl(item.imageUrl);
    setImagePublicId(item.imagePublicId ?? "");
    setImageTouched(false);
    setUploadError("");
    setPromotionId(item.promotionId != null ? String(item.promotionId) : "");
    setPopupTitle(item.popupTitle ?? "");
    setPopupDescription(item.popupDescription ?? "");
    setPopupCtaLabel(item.popupCtaLabel || "Nhận voucher");
    setDisplayOrder(String(item.displayOrder));
    setStartAt(toDatetimeLocal(item.startAt));
    setEndAt(toDatetimeLocal(item.endAt));
    setIsActive(item.isActive);
    setFormError("");
    setModalOpen(true);
    void loadApprovedPromos();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    void handleImageFile(file);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setDragActive(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragActive(false);
    if (uploading) return;
    void handleImageFile(e.dataTransfer.files?.[0]);
  }

  async function handleImageFile(file: File | undefined) {
    if (!file) return;

    const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError("Chỉ chấp nhận ảnh JPG/PNG/WebP.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError("Ảnh phải dưới 5MB.");
      return;
    }

    setUploading(true);
    setUploadError("");
    try {
      const result = await uploadBannerImage(file);
      setImageUrl(result.imageUrl);
      setImagePublicId(result.imagePublicId);
      setImageTouched(true);
    } catch (err) {
      setUploadError(getApiMessage(err, "Tải ảnh thất bại."));
    } finally {
      setUploading(false);
    }
  }

  function validateForm() {
    if (!title.trim()) return "Vui lòng nhập tiêu đề banner.";
    if (title.trim().length > 200) return "Tiêu đề tối đa 200 ký tự.";
    if (!editItem && !imageUrl) return "Vui lòng tải ảnh banner.";
    if (selectedPromo && !selectedPromo.description?.trim())
      return "Promotion đã chọn chưa có mô tả. Vui lòng bổ sung mô tả ở trang Khuyến mãi trước.";
    if (!selectedPromo && !popupTitle.trim()) return "Vui lòng nhập tiêu đề popup.";
    if (popupTitle.trim().length > 200) return "Tiêu đề popup tối đa 200 ký tự.";
    if (!popupDescription.trim()) return "Vui lòng nhập nội dung popup.";
    if (popupDescription.trim().length > 2000) return "Nội dung popup tối đa 2000 ký tự.";
    if (!popupCtaLabel.trim()) return "Vui lòng nhập tên nút.";
    if (popupCtaLabel.trim().length > 100) return "Tên nút tối đa 100 ký tự.";
    const order = Number(displayOrder);
    if (!Number.isInteger(order) || order < 0) return "Thứ tự hiển thị phải là số nguyên ≥ 0.";
    if (startAt && endAt && new Date(startAt) >= new Date(endAt)) return "Ngày bắt đầu phải trước ngày kết thúc.";
    return "";
  }

  async function handleSave() {
    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      // Banner gắn Promotion: nội dung popup lấy tự động từ Promotion (source of truth).
      const effectiveTitle = selectedPromo ? selectedPromo.name : popupTitle.trim();
      const effectiveDescription = selectedPromo
        ? (selectedPromo.description?.trim() || selectedPromo.name)
        : popupDescription.trim();
      if (editItem) {
        const payload: Parameters<typeof updateBanner>[1] = {
          title: title.trim(),
          popupTitle: effectiveTitle,
          popupDescription: effectiveDescription,
          popupCtaLabel: popupCtaLabel.trim(),
          displayOrder: Number(displayOrder),
          isActive,
        };
        if (imageTouched) {
          payload.imageUrl = imageUrl;
          payload.imagePublicId = imagePublicId || undefined;
        }
        if (promotionId) payload.promotionId = Number(promotionId);
        else if (editItem.promotionId != null) payload.clearPromotion = true;
        if (startAt) payload.startAt = toUtcIso(startAt);
        else if (editItem.startAt) payload.clearStartAt = true;
        if (endAt) payload.endAt = toUtcIso(endAt);
        else if (editItem.endAt) payload.clearEndAt = true;
        await updateBanner(editItem.id, payload);
        showToast({ type: "success", title: "Thành công", message: "Đã cập nhật banner." });
      } else {
        await createBanner({
          title: title.trim(),
          imageUrl,
          imagePublicId: imagePublicId || undefined,
          promotionId: promotionId ? Number(promotionId) : undefined,
          popupTitle: effectiveTitle,
          popupDescription: effectiveDescription,
          popupCtaLabel: popupCtaLabel.trim(),
          displayOrder: Number(displayOrder),
          isActive,
          startAt: toUtcIso(startAt),
          endAt: toUtcIso(endAt),
        });
        showToast({ type: "success", title: "Thành công", message: "Đã tạo banner." });
      }
      setModalOpen(false);
      void load(page);
    } catch (err) {
      setFormError(getApiMessage(err, editItem ? "Cập nhật banner thất bại." : "Tạo banner thất bại."));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: Banner) {
    try {
      await toggleBanner(item.id);
      void load(page);
    } catch {
      setError("Cập nhật trạng thái banner thất bại.");
    }
  }

  function openDeleteConfirm(item: Banner) {
    setDeleteTarget(item);
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteBanner(deleteTarget.id);
      setDeleteTarget(null);
      showToast({ type: "success", title: "Thành công", message: "Đã xóa banner." });
      void load(page);
    } catch (err) {
      setDeleteError(getApiMessage(err, "Xóa banner thất bại."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Banners</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý banner quảng bá trên trang chủ.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Thêm banner
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
              placeholder="Tìm tiêu đề, target URL..."
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

        <div className="overflow-x-hidden">
          <table className="w-full table-fixed divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="w-16 px-3 py-3">Ảnh</th>
                <th className="w-1/6 px-3 py-3">Tiêu đề</th>
                <th className="w-28 px-3 py-3">Promotion</th>
                <th className="w-1/4 px-3 py-3">Nội dung popup</th>
                <th className="w-14 px-2 py-3 text-center">Thứ tự</th>
                <th className="w-36 px-3 py-3">Lịch hiển thị</th>
                <th className="w-20 px-2 py-3">Trạng thái</th>
                <th className="w-20 px-2 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const startLabel = formatDateTime(item.startAt);
                const endLabel = formatDateTime(item.endAt);
                return (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3">
                    <button type="button" onClick={() => setPreviewSrc(item.imageUrl)} title="Xem ảnh">
                      <img src={item.imageUrl} alt={item.title} loading="lazy" className="h-12 w-12 rounded-lg border border-slate-200 object-cover" />
                    </button>
                  </td>
                  <td className="px-3 py-3 font-medium">
                    <span className="block truncate" title={item.title}>{item.title}</span>
                  </td>
                  <td className="px-3 py-3">
                    {item.promotionCode
                      ? <span className="inline-block max-w-full truncate rounded-md bg-brand-50 px-2 py-0.5 font-mono text-xs font-semibold text-brand-700" title={item.promotionCode}>{item.promotionCode}</span>
                      : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <span className="block truncate font-medium" title={item.popupTitle}>{item.popupTitle}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500" title={item.popupDescription ?? undefined}>
                      {item.popupDescription || <span className="text-slate-400">—</span>}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums">{item.displayOrder}</td>
                  <td className="px-3 py-3 text-xs leading-5 text-slate-600">
                    {startLabel ? <span className="block truncate" title={`Từ ${startLabel}`}>Từ: {startLabel}</span> : null}
                    {endLabel ? <span className="block truncate" title={`Đến ${endLabel}`}>Đến: {endLabel}</span> : null}
                    {!startLabel && !endLabel && <span className="text-slate-400">Luôn hiển thị</span>}
                  </td>
                  <td className="px-2 py-3">
                    <ActiveToggle isActive={item.isActive} itemName={item.title} onToggle={() => handleToggle(item)} />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        title="Sửa"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-brand-700 hover:bg-brand-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteConfirm(item)}
                        title="Xóa"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
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
        title={editItem ? "Sửa banner" : "Thêm banner"}
      >
        <div className="hide-scrollbar max-h-[70vh] space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Ưu đãi hè 2026"
              maxLength={200}
              className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Ảnh banner {!editItem && <span className="text-red-500">*</span>}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`mt-1 flex items-start gap-3 rounded-md border border-dashed p-3 transition-colors ${
                dragActive ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50/50"
              }`}
            >
              {imageUrl ? (
                <button type="button" onClick={() => setPreviewSrc(imageUrl)} title="Xem ảnh">
                  <img src={imageUrl} alt="Banner preview" className="h-20 w-36 rounded-md border border-slate-200 bg-white object-cover" />
                </button>
              ) : (
                <div className="flex h-20 w-36 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-2 text-center text-xs text-slate-400">
                  {dragActive ? "Thả ảnh vào đây" : "Chưa có ảnh"}
                </div>
              )}
              <div>
                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {uploading ? "Đang tải..." : imageUrl ? "Đổi ảnh" : "Tải ảnh"}
                </Button>
                <p className="mt-1.5 text-xs text-slate-500">hoặc kéo-thả ảnh vào khung này</p>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">JPG/PNG/WebP, tối đa 5MB.</p>
            {uploadError && <p className="mt-1 text-xs font-medium text-rose-600">{uploadError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Promotion (tùy chọn)</label>
            <FormDropdown
              value={promotionId}
              onChange={handlePromotionChange}
              placeholder={loadingPromos ? "Đang tải..." : "Không gắn promotion"}
              disabled={loadingPromos}
              options={[
                { value: "", label: "Không gắn promotion" },
                ...approvedPromos.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` })),
              ]}
            />
            <p className="mt-1 text-xs text-slate-500">Chỉ hiển thị promotion đã được duyệt.</p>
            {selectedPromo && (
              <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <p className="font-bold">✓ Đã gắn promotion</p>
                <p className="mt-1"><span className="font-semibold">Mã:</span> {selectedPromo.code}</p>
                <p className="mt-0.5"><span className="font-semibold">Tên:</span> {selectedPromo.name}</p>
                <p className="mt-0.5">
                  <span className="font-semibold">Giảm:</span>{" "}
                  {selectedPromo.discountType === "Fixed"
                    ? `${Number(selectedPromo.discountValue).toLocaleString("vi-VN")}đ`
                    : `${selectedPromo.discountValue}%`}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-sm font-semibold text-slate-800">Nội dung popup</p>
            <p className="mt-1 text-xs text-slate-500">
              Khi khách hàng bấm vào banner, hệ thống sẽ hiển thị popup này.
            </p>
            {selectedPromo ? (
              <div className="mt-3 space-y-3 rounded-md border border-brand-200 bg-brand-50/50 p-3">
                <p className="text-xs font-semibold text-brand-800">
                  Nội dung popup được lấy tự động từ Promotion đã chọn.
                </p>
                <div>
                  <p className="text-xs font-medium text-slate-500">Tiêu đề:</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-800">{selectedPromo.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Nội dung:</p>
                  <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">
                    {selectedPromo.description?.trim() || selectedPromo.name}
                  </p>
                </div>
              </div>
            ) : (
            <div className="mt-3 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Tiêu đề popup <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={popupTitle}
                  onChange={(e) => setPopupTitle(e.target.value)}
                  placeholder="VD: FPT Student Deal - Giảm 50%"
                  maxLength={200}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Nội dung popup <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={popupDescription}
                  onChange={(e) => setPopupDescription(e.target.value)}
                  placeholder={"VD:\nƯu đãi đặc biệt dành cho sinh viên FPT.\nGiảm 50% khi sử dụng dịch vụ Ride và Rent."}
                  rows={5}
                  maxLength={2000}
                  className="mt-1 min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
                <p className="mt-1 text-xs text-slate-500">Văn bản thường, xuống dòng được giữ nguyên khi hiển thị.</p>
              </div>
            </div>
            )}
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700">
                  Tên nút <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={popupCtaLabel}
                  onChange={(e) => setPopupCtaLabel(e.target.value)}
                  placeholder="VD: Nhận voucher"
                  maxLength={100}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500"
                />
                <p className="mt-1 text-xs text-slate-500">Nút này sẽ đưa khách hàng đến khu vực săn voucher.</p>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Thứ tự hiển thị</label>
              <input
                type="number"
                min={0}
                step={1}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 accent-brand-600"
                />
                Đang hoạt động
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Bắt đầu hiển thị</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Kết thúc hiển thị</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">Bỏ trống cả hai để banner luôn hiển thị khi đang hoạt động.</p>

          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={handleSave} isLoading={saving}>
              {editItem ? "Lưu thay đổi" : "Tạo banner"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Xóa banner"
      >
        <p className="text-sm text-slate-600">
          Bạn có chắc muốn xóa banner <strong>"{deleteTarget?.title}"</strong>? Ảnh trên Cloudinary cũng sẽ được dọn dẹp.
        </p>
        {deleteError && (
          <div className="mt-3">
            <Alert variant="error">{deleteError}</Alert>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} isLoading={deleting}>
            Xóa
          </Button>
        </div>
      </Modal>

      {previewSrc && (
        <ImagePreviewModal src={previewSrc} title="Ảnh banner" onClose={() => setPreviewSrc(null)} />
      )}
    </div>
  );
}
