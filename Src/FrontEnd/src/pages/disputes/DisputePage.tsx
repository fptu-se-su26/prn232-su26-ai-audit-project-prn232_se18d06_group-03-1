import { AlertTriangle, ChevronLeft, ChevronRight, Eye, FileImage, FileText, Gavel, Search, Send, ShieldAlert, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { showToast } from "@/components/common/toastStore";
import Card from "@/components/ui/Card";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import {
  adminCloseDispute,
  adminOverrideDispute,
  addDisputeEvidence,
  confirmExternalSettlement,
  createDispute,
  escalateDispute,
  getDisputeById,
  getMyDisputes,
  getStaffDisputes,
  investigateDispute,
  requestMoreDisputeEvidence,
  resolveDispute,
  uploadDisputeEvidenceImages,
} from "@/features/disputes/disputeService";
import type { CompensationDirection, DisputeDetailResponse, DisputeListItem, DisputeListRequest, DisputeSettlementMethod, EvidenceRequestedFrom } from "@/features/disputes/types";
import { getApiErrorMessage } from "@/services/apiClient";

const PAGE_SIZE = 10;
const MAX_EVIDENCE_IMAGES = 6;
const MAX_EVIDENCE_IMAGE_SIZE = 5 * 1024 * 1024;

type EvidenceImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const statusLabels: Record<string, string> = {
  Open: "Mới mở",
  Investigating: "Đang điều tra",
  Escalated: "Chuyển Admin",
  Resolved: "Đã xử lý",
};

const statusColors: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700 ring-blue-100",
  Investigating: "bg-amber-50 text-amber-700 ring-amber-100",
  Escalated: "bg-violet-50 text-violet-700 ring-violet-100",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

statusLabels.NeedMoreEvidence = "Cho bo sung";
statusColors.NeedMoreEvidence = "bg-orange-50 text-orange-700 ring-orange-100";
statusLabels.DecisionIssued = "Đã ra phán quyết";
statusLabels.AwaitingExternalSettlement = "Chờ xác nhận quyết toán";
statusColors.DecisionIssued = "bg-cyan-50 text-cyan-700 ring-cyan-100";
statusColors.AwaitingExternalSettlement = "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100";

const compensationDirectionLabels: Record<CompensationDirection, string> = {
  CustomerPaysOwner: "Khach boi thuong cho chu xe",
  OwnerRefundsCustomer: "Chu xe hoan/giam tien cho khach",
  NoCompensation: "Khong phat sinh boi thuong",
};

const settlementMethodLabels: Record<DisputeSettlementMethod, string> = {
  DepositThenExternal: "Trừ tiền cọc trước, thiếu thì thanh toán ngoài",
  ExternalOnly: "Hai bên tự thanh toán hoàn toàn bên ngoài",
};

const evidenceTargetLabels: Record<EvidenceRequestedFrom, string> = {
  Customer: "Khach thue",
  Owner: "Chu xe",
  Both: "Ca hai ben",
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function evidenceList(value?: string | null) {
  if (!value) return [];
  return value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
}

function formatCurrency(value?: number | null) {
  if (value == null) return "-";
  return value.toLocaleString("vi-VN") + "đ";
}

export default function DisputePage() {
  const [searchParams] = useSearchParams();
  const activeRole = useAuthStore((state) => state.activeRole);
  const user = useAuthStore((state) => state.user);
  const role = activeRole ?? user?.roles[0] ?? "Customer";
  const isStaff = role === "Staff";
  const isAdmin = role === "Admin";
  const canCreate = role === "Customer" || role === "Owner";

  const [items, setItems] = useState<DisputeListItem[]>([]);
  const [selected, setSelected] = useState<DisputeDetailResponse | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [keywordDraft, setKeywordDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createEvidenceImages, setCreateEvidenceImages] = useState<EvidenceImage[]>([]);

  const [createForm, setCreateForm] = useState({
    bookingId: searchParams.get("bookingId") ?? "",
    reportType: searchParams.get("reportType") ?? "Dispute",
    description: searchParams.get("description") ?? "",
    evidenceUrls: "",
  });
  const [actionForm, setActionForm] = useState({
    resolution: "",
    compensationDirection: "NoCompensation" as CompensationDirection,
    settlementMethod: "DepositThenExternal" as DisputeSettlementMethod,
    compensationAmount: "",
    evidenceRequestedFrom: "Customer" as EvidenceRequestedFrom,
    evidenceRequestMessage: "",
    evidenceMessage: "",
    evidenceUrls: "",
    adminCloseReason: "",
  });

  const title = useMemo(() => {
    if (isAdmin) return "Quản lý tranh chấp";
    if (isStaff) return "Xử lý tranh chấp";
    return "Tranh chấp của tôi";
  }, [isAdmin, isStaff]);

  const load = useCallback(async (nextPage: number, status: string, search: string) => {
    setIsLoading(true);
    try {
      const params: DisputeListRequest = { page: nextPage, pageSize: PAGE_SIZE };
      if (status) params.status = status;
      if (search) params.keyword = search;
      const result = isStaff || isAdmin ? await getStaffDisputes(params) : await getMyDisputes(params);
      setItems(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages ?? Math.ceil(result.totalCount / PAGE_SIZE));
      setPage(result.page);
    } catch {
      setItems([]);
      setTotalCount(0);
      setTotalPages(0);
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải danh sách tranh chấp." });
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, isStaff]);

  useEffect(() => {
    void load(1, statusFilter, keyword);
  }, [keyword, load, statusFilter]);

  useEffect(() => {
    const bookingId = searchParams.get("bookingId");
    if (!bookingId) return;
    setCreateForm((prev) => ({
      ...prev,
      bookingId,
      reportType: searchParams.get("reportType") ?? prev.reportType,
      description: searchParams.get("description") ?? prev.description,
    }));
  }, [searchParams]);

  async function openDetail(id: number) {
    try {
      const detail = await getDisputeById(id);
      setSelected(detail);
      setActionForm({
        resolution: detail.resolution ?? "",
        compensationDirection: detail.compensationDirection ?? "NoCompensation",
        settlementMethod: detail.settlementMethod ?? "DepositThenExternal",
        compensationAmount: detail.compensationAmount != null ? String(detail.compensationAmount) : "",
        evidenceRequestedFrom: "Customer",
        evidenceRequestMessage: detail.evidenceRequestMessage ?? "",
        evidenceMessage: "",
        evidenceUrls: "",
        adminCloseReason: "",
      });
    } catch (error) {
      showToast({ type: "error", title: "Lỗi", message: getApiErrorMessage(error, "Không thể tải chi tiết tranh chấp.") });
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setKeyword(keywordDraft.trim());
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    void load(nextPage, statusFilter, keyword);
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const uploadedUrls = createEvidenceImages.length > 0
        ? await uploadDisputeEvidenceImages(createEvidenceImages.map((image) => image.file))
        : [];
      const evidenceUrls = [...evidenceList(createForm.evidenceUrls), ...uploadedUrls].join("\n");
      const dispute = await createDispute({
        bookingId: Number(createForm.bookingId),
        reportType: createForm.reportType,
        description: createForm.description,
        evidenceUrls: evidenceUrls || null,
      });
      createEvidenceImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setCreateEvidenceImages([]);
      setCreateForm({ bookingId: "", reportType: "Dispute", description: "", evidenceUrls: "" });
      setSelected(dispute);
      showToast({ type: "success", title: "Đã tạo tranh chấp", message: "Hồ sơ đã được gửi đến staff." });
      await load(1, statusFilter, keyword);
    } catch (error) {
      showToast({ type: "error", title: "Lỗi", message: getApiErrorMessage(error, "Không thể tạo tranh chấp.") });
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectCreateEvidenceImages(files: FileList | null) {
    if (!files) return;

    const selectedFiles = Array.from(files);
    if (selectedFiles.length > MAX_EVIDENCE_IMAGES - createEvidenceImages.length) {
      showToast({ type: "error", title: "Quá nhiều ảnh", message: `Chỉ được chọn tối đa ${MAX_EVIDENCE_IMAGES} ảnh bằng chứng.` });
      return;
    }

    const invalidFile = selectedFiles.find((file) =>
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > MAX_EVIDENCE_IMAGE_SIZE,
    );
    if (invalidFile) {
      showToast({ type: "error", title: "Ảnh không hợp lệ", message: "Chỉ nhận JPG, PNG, WebP và mỗi ảnh phải dưới 5MB." });
      return;
    }

    setCreateEvidenceImages((current) => [
      ...current,
      ...selectedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeCreateEvidenceImage(id: string) {
    setCreateEvidenceImages((current) => {
      const removed = current.find((image) => image.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((image) => image.id !== id);
    });
  }

  async function runAction(action: "investigate" | "resolve" | "escalate" | "override") {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      const payload = {
        resolution: actionForm.resolution,
        compensationDirection: actionForm.compensationDirection,
        settlementMethod: actionForm.settlementMethod,
        compensationAmount: actionForm.compensationDirection === "NoCompensation" ? null : actionForm.compensationAmount ? Number(actionForm.compensationAmount) : null,
        updatedAt: selected.updatedAt,
      };
      const updated =
        action === "investigate" ? await investigateDispute(selected.id)
        : action === "resolve" ? await resolveDispute(selected.id, payload)
        : action === "escalate" ? await escalateDispute(selected.id, payload)
        : await adminOverrideDispute(selected.id, payload);

      setSelected(updated);
      showToast({ type: "success", title: "Đã cập nhật", message: "Trạng thái tranh chấp đã được cập nhật." });
      await load(page, statusFilter, keyword);
    } catch (error) {
      showToast({ type: "error", title: "Lỗi", message: getApiErrorMessage(error, "Không thể cập nhật tranh chấp.") });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestEvidence() {
    if (!selected || !actionForm.evidenceRequestMessage.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await requestMoreDisputeEvidence(selected.id, {
        requestedFrom: actionForm.evidenceRequestedFrom,
        message: actionForm.evidenceRequestMessage.trim(),
        updatedAt: selected.updatedAt,
      });
      setSelected(updated);
      showToast({ type: "success", title: "Da yeu cau", message: "Yeu cau bo sung bang chung da duoc gui." });
      await load(page, statusFilter, keyword);
    } catch (error) {
      showToast({ type: "error", title: "Lỗi", message: getApiErrorMessage(error, "Không thể yêu cầu bổ sung bằng chứng.") });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitEvidence() {
    if (!selected || !actionForm.evidenceMessage.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await addDisputeEvidence(selected.id, {
        message: actionForm.evidenceMessage.trim(),
        evidenceUrls: actionForm.evidenceUrls || null,
        updatedAt: selected.updatedAt,
      });
      setSelected(updated);
      setActionForm((prev) => ({ ...prev, evidenceMessage: "", evidenceUrls: "" }));
      showToast({ type: "success", title: "Da bo sung", message: "Bang chung da duoc gui lai cho staff." });
      await load(page, statusFilter, keyword);
    } catch (error) {
      showToast({ type: "error", title: "Lỗi", message: getApiErrorMessage(error, "Không thể bổ sung bằng chứng.") });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmExternal() {
    if (!selected) return;
    const confirmsPlatformPayout = role === "Customer"
      && selected.compensationDirection === "CustomerPaysOwner"
      && selected.platformSettledAmount > 0;
    setIsSubmitting(true);
    try {
      const updated = await confirmExternalSettlement(selected.id, selected.updatedAt);
      setSelected(updated);
      await load(page, statusFilter, keyword);
      showToast({
        type: "success",
        title: "Đã xác nhận",
        message: confirmsPlatformPayout
          ? "Bạn đã chấp nhận phán quyết. Khoản bồi thường nền tảng giữ đã được chuyển cho chủ xe."
          : "Đã ghi nhận xác nhận quyết toán của bạn.",
      });
    } catch (error) {
      showToast({ type: "error", title: "Lỗi", message: getApiErrorMessage(error, "Không thể xác nhận thanh toán.") });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function forceClose() {
    if (!selected || !actionForm.adminCloseReason.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await adminCloseDispute(selected.id, actionForm.adminCloseReason.trim(), selected.updatedAt);
      setSelected(updated);
      await load(page, statusFilter, keyword);
      showToast({ type: "success", title: "Đã đóng", message: "Admin đã đóng hồ sơ kèm lý do." });
    } catch (error) {
      showToast({ type: "error", title: "Lỗi", message: getApiErrorMessage(error, "Không thể đóng hồ sơ.") });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-700">{role}</p>
          <h1 className="mt-2 max-w-full truncate bg-gradient-to-r from-slate-950 via-brand-800 to-fuchsia-700 bg-clip-text text-3xl font-bold text-transparent">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-700">
            Theo dõi tranh chấp booking, bằng chứng và các phán quyết xử lý.
          </p>
        </section>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <span className="text-sm text-slate-500">{totalCount} tranh chấp</span>
          </div>

          <form onSubmit={submitSearch} className="flex w-full gap-2 lg:w-auto">
            <div className="relative min-w-0 flex-1 lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={keywordDraft}
                onChange={(event) => setKeywordDraft(event.target.value)}
                placeholder="Tìm booking, khách, chủ xe"
                className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">
              <Search className="h-4 w-4" /> Tìm
            </Button>
          </form>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <EmptyState title="Chưa có tranh chấp" description="Các hồ sơ phù hợp bộ lọc sẽ xuất hiện tại đây." />
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[38%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead className="border-b border-slate-200 bg-gradient-to-r from-brand-50 via-white to-sky-50 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
                <tr>
                  <th className="whitespace-nowrap px-3 py-3">Booking</th>
                  <th className="whitespace-nowrap px-3 py-3">Người mở</th>
                  <th className="whitespace-nowrap px-3 py-3">Nội dung</th>
                  <th className="whitespace-nowrap px-3 py-3">Trạng thái</th>
                  <th className="whitespace-nowrap px-3 py-3">Staff</th>
                  <th className="whitespace-nowrap px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-3 py-3 align-top">
                      <p className="truncate font-medium text-slate-950">{item.bookingCode}</p>
                      <p className="truncate text-xs text-slate-500">#{item.id} · {formatDateTime(item.createdAt)}</p>
                    </td>
                    <td className="px-3 py-3 align-top text-slate-700">
                      <p className="line-clamp-2">{item.openedByName}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="line-clamp-2 text-slate-700">{item.description}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span className={`inline-flex max-w-full whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusColors[item.status] ?? "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                        {statusLabels[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top text-slate-700">
                      <p className="line-clamp-2">{item.assignedStaffName ?? "Chưa nhận"}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <Button variant="ghost" size="sm" className="px-2" onClick={() => void openDetail(item.id)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Chi tiết</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-24 text-center text-sm font-medium text-slate-700">{page}/{totalPages}</span>
            <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {canCreate && (
          <Card className="rounded-md">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-brand-700" />
              <h2 className="text-lg font-bold text-slate-950">Tạo tranh chấp</h2>
            </div>
            <form onSubmit={submitCreate} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Booking ID
                <input
                  type="number"
                  min="1"
                  required
                  value={createForm.bookingId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, bookingId: event.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Loại tranh chấp
                <select
                  value={createForm.reportType}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, reportType: event.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="Dispute">Tranh chấp chung</option>
                  <option value="Damage">Hư hỏng xe</option>
                  <option value="Payment">Thanh toán/cọc</option>
                  <option value="NoShow">Không nhận xe</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Mô tả
                <textarea
                  required
                  rows={5}
                  value={createForm.description}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Ảnh bằng chứng</p>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-brand-300 bg-brand-50 px-4 py-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100">
                  <FileImage className="h-5 w-5" />
                  Chọn ảnh từ thiết bị ({createEvidenceImages.length}/{MAX_EVIDENCE_IMAGES})
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      selectCreateEvidenceImages(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>
                <p className="text-xs text-slate-500">Tối đa 6 ảnh JPG, PNG hoặc WebP; mỗi ảnh dưới 5MB.</p>
                {createEvidenceImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {createEvidenceImages.map((image) => (
                      <div key={image.id} className="relative overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        <img src={image.previewUrl} alt={image.file.name} className="h-24 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeCreateEvidenceImage(image.id)}
                          aria-label={`Xóa ${image.file.name}`}
                          className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/75 text-white hover:bg-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="block text-xs font-medium text-slate-600">
                  Hoặc dán link ảnh (không bắt buộc)
                  <textarea
                    rows={2}
                    value={createForm.evidenceUrls}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, evidenceUrls: event.target.value }))}
                    placeholder="Mỗi dòng hoặc cách nhau bằng dấu phẩy"
                    className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </label>
              </div>
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                <Send className="h-4 w-4" /> Gửi tranh chấp
              </Button>
            </form>
          </Card>
        )}

        <Card className="rounded-md">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-700" />
            <h2 className="text-lg font-bold text-slate-950">Chi tiết</h2>
          </div>
          {!selected ? (
            <p className="text-sm text-slate-500">Chọn một tranh chấp để xem bằng chứng, audit log và thao tác xử lý.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Booking</p>
                <p className="mt-1 font-bold text-slate-950">{selected.bookingCode}</p>
                <p className="text-sm text-slate-600">Khách: {selected.customerName}</p>
                <p className="text-sm text-slate-600">Chủ xe: {selected.ownerName}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Mô tả</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{selected.description}</p>
              </div>

              {evidenceList(selected.evidenceUrls).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Bằng chứng</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {evidenceList(selected.evidenceUrls).map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md border border-slate-200">
                        <img src={url} alt="Evidence" className="h-24 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selected.inspectionReports.length > 0 && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Bien ban giao/nhan xe</p>
                  {selected.inspectionReports.map((report) => (
                    <div key={report.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{report.type === "CheckIn" ? "Truoc khi giao xe" : "Sau khi nhan/tra xe"}</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                          Biên bản {report.type === "CheckIn" ? "check-in" : "check-out"}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
                        <p><span className="font-semibold">Km:</span> {report.odometerKm ?? "-"}</p>
                        <p><span className="font-semibold">Nhien lieu:</span> {report.fuelLevel || "-"}</p>
                        <p><span className="font-semibold">Tinh trang:</span> {report.damageNoted ? "Co ghi nhan hu hong" : "Khong ghi nhan hu hong"}</p>
                        <p><span className="font-semibold">Ngay lap:</span> {formatDateTime(report.createdAt)}</p>
                      </div>
                      {report.damageDescription && <p className="mt-2 whitespace-pre-line text-xs text-slate-700">{report.damageDescription}</p>}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {report.images.map((image) => (
                          <a key={image.id} href={image.imageUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md border border-slate-200 bg-white">
                            <img src={image.imageUrl} alt={report.type} className="h-24 w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selected.resolution && (
                <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                  <p className="font-bold">Phán quyết</p>
                  <p className="mt-1 whitespace-pre-line">{selected.resolution}</p>
                  <p className="mt-1">{compensationDirectionLabels[selected.compensationDirection]}</p>
                  {selected.compensationDirection === "CustomerPaysOwner" && (
                    <p className="mt-1">Cách xử lý: {settlementMethodLabels[selected.settlementMethod]}</p>
                  )}
                  {selected.finalCompensationAmount != null && <p className="mt-1">Boi thuong: {formatCurrency(selected.finalCompensationAmount)}</p>}
                  <p className="mt-1">Từ tiền cọc nền tảng giữ: {formatCurrency(selected.platformSettledAmount)}</p>
                  {selected.platformSettledAmount > 0 && (
                    <p className="mt-1">Trạng thái chuyển: {selected.platformSettlementCompletedAt ? `Đã chuyển lúc ${formatDateTime(selected.platformSettlementCompletedAt)}` : "Chờ khách chấp nhận"}</p>
                  )}
                  <p className="mt-1">Thanh toán ngoài: {formatCurrency(selected.externalSettlementAmount)}</p>
                </div>
              )}

              {selected.evidenceSubmissions.length > 0 && (
                <div className="space-y-2 rounded-md border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phản hồi bằng chứng</p>
                  {selected.evidenceSubmissions.map((submission) => (
                    <div key={submission.id} className="rounded-md bg-slate-50 p-2 text-sm text-slate-700">
                      <p className="font-semibold">{submission.submittedByName} · {submission.submittedRole}</p>
                      <p className="mt-1 whitespace-pre-line">{submission.message}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(submission.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}

              {canCreate && selected.status === "AwaitingExternalSettlement" && (
                <div className="space-y-2 rounded-md border border-fuchsia-200 bg-fuchsia-50 p-3 text-sm">
                  <p className="font-semibold text-fuchsia-900">Chờ xác nhận quyết toán</p>
                  {selected.compensationDirection === "CustomerPaysOwner" && role === "Customer" && !selected.customerExternalConfirmed && (
                    <p className="text-fuchsia-800">
                      {selected.settlementMethod === "ExternalOnly"
                        ? `Nền tảng không trừ tiền cọc. Toàn bộ ${formatCurrency(selected.externalSettlementAmount)} do hai bên tự thanh toán bên ngoài.`
                        : `Khi bạn xác nhận chấp nhận phán quyết, nền tảng sẽ chuyển ${formatCurrency(selected.platformSettledAmount)} từ khoản cọc đang giữ cho chủ xe.${selected.externalSettlementAmount > 0 ? ` Phần ${formatCurrency(selected.externalSettlementAmount)} còn thiếu do hai bên tự thanh toán.` : ""}`}
                    </p>
                  )}
                  {selected.platformSettlementCompletedAt && (
                    <p className="font-medium text-emerald-700">Nền tảng đã chuyển tiền: {formatDateTime(selected.platformSettlementCompletedAt)}</p>
                  )}
                  <p>Khách: {selected.customerExternalConfirmed ? "Đã xác nhận" : "Chưa xác nhận"}</p>
                  <p>Chủ xe: {selected.ownerExternalConfirmed ? "Đã xác nhận" : "Chưa xác nhận"}</p>
                  {!((role === "Customer" && selected.customerExternalConfirmed) || (role === "Owner" && selected.ownerExternalConfirmed)) && (
                    <Button type="button" size="sm" onClick={() => void confirmExternal()} isLoading={isSubmitting}>
                      {role === "Customer" && selected.compensationDirection === "CustomerPaysOwner"
                        ? "Chấp nhận phán quyết"
                        : "Xác nhận đã thanh toán/nhận tiền"}
                    </Button>
                  )}
                </div>
              )}

              {canCreate && selected.status === "NeedMoreEvidence" && (
                <div className="space-y-3 rounded-md border border-orange-200 bg-orange-50 p-3">
                  <div>
                    <p className="text-sm font-bold text-orange-900">Can bo sung bang chung</p>
                    {selected.evidenceRequestMessage && <p className="mt-1 whitespace-pre-line text-sm text-orange-800">{selected.evidenceRequestMessage}</p>}
                  </div>
                  <textarea
                    rows={3}
                    value={actionForm.evidenceMessage}
                    onChange={(event) => setActionForm((prev) => ({ ...prev, evidenceMessage: event.target.value }))}
                    placeholder="Noi dung phan hoi..."
                    className="w-full resize-y rounded-md border border-orange-200 px-3 py-2 text-sm"
                  />
                  <textarea
                    rows={2}
                    value={actionForm.evidenceUrls}
                    onChange={(event) => setActionForm((prev) => ({ ...prev, evidenceUrls: event.target.value }))}
                    placeholder="Link anh/hoa don, moi dong mot link"
                    className="w-full resize-y rounded-md border border-orange-200 px-3 py-2 text-sm"
                  />
                  <Button type="button" size="sm" onClick={() => void submitEvidence()} isLoading={isSubmitting} disabled={!actionForm.evidenceMessage.trim()}>
                    Gui bo sung
                  </Button>
                </div>
              )}

              {(isStaff || isAdmin) && ["Open", "Investigating", "NeedMoreEvidence", "Escalated"].includes(selected.status) && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Ghi chú / phán quyết
                    <textarea
                      rows={4}
                      value={actionForm.resolution}
                      onChange={(event) => setActionForm((prev) => ({ ...prev, resolution: event.target.value }))}
                      className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                  </label>
                  {actionForm.compensationDirection === "CustomerPaysOwner" && (
                    <label className="block text-sm font-medium text-slate-700">
                      Cách xử lý tiền bồi thường
                      <select
                        value={actionForm.settlementMethod}
                        onChange={(event) => setActionForm((prev) => ({ ...prev, settlementMethod: event.target.value as DisputeSettlementMethod }))}
                        className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                      >
                        {Object.entries(settlementMethodLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="block text-sm font-medium text-slate-700">
                    Huong boi thuong
                    <select
                      value={actionForm.compensationDirection}
                      onChange={(event) => setActionForm((prev) => ({ ...prev, compensationDirection: event.target.value as CompensationDirection, compensationAmount: event.target.value === "NoCompensation" ? "" : prev.compensationAmount }))}
                      className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    >
                      {Object.entries(compensationDirectionLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Số tiền bồi thường
                    <input
                      type="number"
                      min="0"
                      disabled={actionForm.compensationDirection === "NoCompensation"}
                      value={actionForm.compensationAmount}
                      onChange={(event) => setActionForm((prev) => ({ ...prev, compensationAmount: event.target.value }))}
                      className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                  </label>
                  <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">Yeu cau bo sung bang chung</p>
                    <select
                      value={actionForm.evidenceRequestedFrom}
                      onChange={(event) => setActionForm((prev) => ({ ...prev, evidenceRequestedFrom: event.target.value as EvidenceRequestedFrom }))}
                      className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                    >
                      {Object.entries(evidenceTargetLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <textarea
                      rows={2}
                      value={actionForm.evidenceRequestMessage}
                      onChange={(event) => setActionForm((prev) => ({ ...prev, evidenceRequestMessage: event.target.value }))}
                      placeholder="Can bo sung anh, hoa don hoac giai trinh..."
                      className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={() => void requestEvidence()} isLoading={isSubmitting} disabled={!actionForm.evidenceRequestMessage.trim()}>
                      Yeu cau bo sung
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Open", "Investigating"].includes(selected.status) && (
                      <Button type="button" variant="secondary" size="sm" onClick={() => void runAction("investigate")} isLoading={isSubmitting}>
                        <AlertTriangle className="h-4 w-4" /> Điều tra
                      </Button>
                    )}
                    {(isAdmin || selected.status !== "Escalated") && (
                      <Button type="button" size="sm" onClick={() => void runAction("resolve")} isLoading={isSubmitting} disabled={!actionForm.resolution.trim() || (selected.status === "NeedMoreEvidence" && !selected.evidenceRespondedAt)}>
                        <Gavel className="h-4 w-4" /> Resolve
                      </Button>
                    )}
                    {isStaff && ["Open", "Investigating"].includes(selected.status) && (
                      <Button type="button" variant="secondary" size="sm" onClick={() => void runAction("escalate")} isLoading={isSubmitting}>
                        Escalate
                      </Button>
                    )}
                    {isAdmin && (
                      <Button type="button" variant="secondary" size="sm" onClick={() => void runAction("override")} isLoading={isSubmitting} disabled={!actionForm.resolution.trim()}>
                        Admin override
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {isAdmin && selected.status === "AwaitingExternalSettlement" && (
                <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-semibold text-red-900">Admin cưỡng chế đóng hồ sơ</p>
                  <textarea rows={2} value={actionForm.adminCloseReason} onChange={(event) => setActionForm((prev) => ({ ...prev, adminCloseReason: event.target.value }))} placeholder="Lý do đóng hồ sơ..." className="w-full rounded-md border border-red-200 px-3 py-2 text-sm" />
                  <Button type="button" variant="secondary" size="sm" onClick={() => void forceClose()} isLoading={isSubmitting} disabled={!actionForm.adminCloseReason.trim()}>
                    Đóng hồ sơ
                  </Button>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Audit log</p>
                <div className="mt-2 space-y-2">
                  {selected.auditLogs.map((log) => (
                    <div key={log.id} className="rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">{log.action} · {log.actorName}</p>
                      <p>{formatDateTime(log.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
