import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Eye, FileImage, FileText, Gavel, Search, Send, ShieldAlert, X } from "lucide-react";
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

statusLabels.NeedMoreEvidence = "Chờ bổ sung";
statusColors.NeedMoreEvidence = "bg-orange-50 text-orange-700 ring-orange-100";
statusLabels.DecisionIssued = "Đã ra phán quyết";
statusLabels.AwaitingExternalSettlement = "Chờ xác nhận quyết toán";
statusColors.DecisionIssued = "bg-cyan-50 text-cyan-700 ring-cyan-100";
statusColors.AwaitingExternalSettlement = "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100";

const compensationDirectionLabels: Record<CompensationDirection, string> = {
  CustomerPaysOwner: "Khách bồi thường cho chủ xe",
  OwnerRefundsCustomer: "Chủ xe hoàn/giảm tiền cho khách",
  NoCompensation: "Không phát sinh bồi thường",
};

const settlementMethodLabels: Record<DisputeSettlementMethod, string> = {
  ExternalOnly: "Hai bên tự thanh toán hoàn toàn bên ngoài",
  DepositThenExternal: "Nền tảng giữ tiền đặt cọc, bồi thường bên ngoài",
};

const evidenceTargetLabels: Record<EvidenceRequestedFrom, string> = {
  Customer: "Khách thuê",
  Owner: "Chủ xe",
  Both: "Cả hai bên",
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
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showCreateFormModal, setShowCreateFormModal] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["info"]));

  const [createForm, setCreateForm] = useState({
    bookingId: searchParams.get("bookingId") ?? "",
    reportType: searchParams.get("reportType") ?? "Dispute",
    description: searchParams.get("description") ?? "",
    evidenceUrls: "",
  });
  const [actionForm, setActionForm] = useState({
    resolution: "",
    compensationDirection: "NoCompensation" as CompensationDirection,
    settlementMethod: "ExternalOnly" as DisputeSettlementMethod,
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

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
        settlementMethod: detail.settlementMethod ?? "ExternalOnly",
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

  function handleCreateClick(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowCreateConfirm(true);
  }

  async function confirmCreateDispute() {
    setShowCreateConfirm(false);
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
      showToast({ type: "success", title: "Đã yêu cầu", message: "Yêu cầu bổ sung bằng chứng đã được gửi." });
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
      showToast({ type: "success", title: "Đã bổ sung", message: "Bằng chứng đã được gửi lại cho staff." });
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
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
      <section className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-700">{role}</p>
          <h1 className="mt-1 max-w-full truncate bg-gradient-to-r from-slate-950 via-brand-800 to-fuchsia-700 bg-clip-text text-3xl font-bold text-transparent">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-700">
            Theo dõi tranh chấp booking, bằng chứng và các phán quyết xử lý.
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="md" onClick={() => setShowCreateFormModal(true)} className="sm:self-center shrink-0">
            <ShieldAlert className="h-4 w-4" /> Tạo tranh chấp
          </Button>
        )}
      </section>

      <div className="space-y-6">
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
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="w-full min-w-[800px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[16%]" />
                <col className="w-[34%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[4%]" />
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

      {/* Right Drawer for Dispute Details */}
      {selected && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelected(null)}
          />

          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-brand-700" />
                  <h2 className="text-lg font-bold text-slate-950">Chi tiết tranh chấp</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-2">
                  {/* --- Thông tin cơ bản --- */}
                  <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                    <button type="button" onClick={() => toggleSection("info")} className="flex w-full items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50 px-5 py-3 text-left transition hover:bg-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-slate-950">{selected.bookingCode}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusColors[selected.status] ?? ""}`}>
                          {statusLabels[selected.status] ?? selected.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">#{selected.id} · {formatDateTime(selected.createdAt)}</span>
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${openSections.has("info") ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {openSections.has("info") && (
                      <div className="border-t border-slate-100 p-5 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Khách hàng</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{selected.customerName}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Chủ xe</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{selected.ownerName}</p>
                          </div>
                        </div>
                        <div className="border-t border-slate-100 pt-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Mô tả</p>
                          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{selected.description}</p>
                        </div>
                      </div>
                    )}
                  </div>

            {/* --- Bằng chứng ban đầu --- */}
            {evidenceList(selected.evidenceUrls).length > 0 && (
              <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <button type="button" onClick={() => toggleSection("evidence")} className="flex w-full items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50 px-5 py-3 text-left transition hover:bg-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Bằng chứng ban đầu</h3>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${openSections.has("evidence") ? "rotate-180" : ""}`} />
                </button>
                {openSections.has("evidence") && (
                  <div className="border-t border-slate-100 p-5">
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                      {evidenceList(selected.evidenceUrls).map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg border border-slate-200">
                          <img src={url} alt="Evidence" className="h-28 w-full object-cover transition group-hover:scale-105" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- Biên bản giao/nận xe --- */}
            {selected.inspectionReports.length > 0 && (
              <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <button type="button" onClick={() => toggleSection("reports")} className="flex w-full items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50 px-5 py-3 text-left transition hover:bg-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Biên bản giao/nận xe</h3>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${openSections.has("reports") ? "rotate-180" : ""}`} />
                </button>
                {openSections.has("reports") && (
                  <div className="border-t border-slate-100 p-5 space-y-4">
                    {selected.inspectionReports.map((report) => (
                      <div key={report.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">{report.type === "CheckIn" ? "Trước khi giao xe" : "Sau khi nhận/trả xe"}</p>
                          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                            {report.type === "CheckIn" ? "Check-in" : "Check-out"}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                          <p><span className="font-semibold text-slate-700">Km:</span> {report.odometerKm ?? "-"}</p>
                          <p><span className="font-semibold text-slate-700">Nhiên liệu:</span> {report.fuelLevel || "-"}</p>
                          <p><span className="font-semibold text-slate-700">Tình trạng:</span> {report.damageNoted ? "Có ghi nhận hư hỏng" : "Không ghi nhận hư hỏng"}</p>
                          <p><span className="font-semibold text-slate-700">Ngày lập:</span> {formatDateTime(report.createdAt)}</p>
                        </div>
                        {report.damageDescription && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{report.damageDescription}</p>}
                        {report.images.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {report.images.map((image) => (
                              <a key={image.id} href={image.imageUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md border border-slate-200 bg-white">
                                <img src={image.imageUrl} alt={report.type} className="h-24 w-full object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- Phán quyết --- */}
            {selected.resolution && (
              <div className="overflow-hidden rounded-md border border-emerald-200 bg-white">
                <button type="button" onClick={() => toggleSection("resolution")} className="flex w-full items-center justify-between bg-gradient-to-r from-emerald-50 to-emerald-100/50 px-5 py-3 text-left transition hover:bg-emerald-100/50">
                  <h3 className="text-sm font-bold text-emerald-900">Phán quyết</h3>
                  <ChevronDown className={`h-4 w-4 text-emerald-400 transition-transform duration-200 ${openSections.has("resolution") ? "rotate-180" : ""}`} />
                </button>
                {openSections.has("resolution") && (
                  <div className="border-t border-emerald-100 p-5 space-y-2 text-sm">
                    <p className="whitespace-pre-line text-slate-700">{selected.resolution}</p>
                    <p className="font-medium text-slate-800">{compensationDirectionLabels[selected.compensationDirection]}</p>
                    <p className="text-lg font-bold text-slate-950">Bồi thường: {formatCurrency(selected.finalCompensationAmount)}</p>
                    <p className="text-slate-600">Thanh toán ngoài: {formatCurrency(selected.externalSettlementAmount)}</p>
                  </div>
                )}
              </div>
            )}

            {/* --- Phản hồi bằng chứng --- */}
            {selected.evidenceSubmissions.length > 0 && (
              <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <button type="button" onClick={() => toggleSection("submissions")} className="flex w-full items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50 px-5 py-3 text-left transition hover:bg-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Phản hồi bằng chứng</h3>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${openSections.has("submissions") ? "rotate-180" : ""}`} />
                </button>
                {openSections.has("submissions") && (
                  <div className="border-t border-slate-100 p-5 space-y-3">
                    {selected.evidenceSubmissions.map((submission) => (
                      <div key={submission.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900">{submission.submittedByName}</p>
                          <span className="text-xs text-slate-400">{submission.submittedRole}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-line text-slate-700">{submission.message}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(submission.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- Thao tác xử lý (Staff/Admin) --- */}
            {(isStaff || isAdmin) && ["Open", "Investigating", "NeedMoreEvidence", "Escalated"].includes(selected.status) && (
              <div className="overflow-hidden rounded-md border border-amber-200 bg-white">
                <button type="button" onClick={() => toggleSection("actions")} className="flex w-full items-center justify-between bg-gradient-to-r from-amber-50 to-amber-100/50 px-5 py-3 text-left transition hover:bg-amber-100/50">
                  <h3 className="text-sm font-bold text-amber-900">Thao tác xử lý</h3>
                  <ChevronDown className={`h-4 w-4 text-amber-400 transition-transform duration-200 ${openSections.has("actions") ? "rotate-180" : ""}`} />
                </button>
                {openSections.has("actions") && (
                  <div className="border-t border-amber-100 p-5 space-y-4">
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
                    <p className="text-sm text-slate-600">Hai bên tự thanh toán bên ngoài hệ thống.</p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Hướng bồi thường
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
                  </div>
                  <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">Yêu cầu bổ sung bằng chứng</p>
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
                      placeholder="Cần bổ sung ảnh, hóa đơn hoặc giải trình..."
                      className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={() => void requestEvidence()} isLoading={isSubmitting} disabled={!actionForm.evidenceRequestMessage.trim()}>
                      Yêu cầu bổ sung
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
              </div>
            )}

            {/* --- Khách: Xác nhận quyết toán --- */}
            {canCreate && selected.status === "AwaitingExternalSettlement" && (
              <div className="overflow-hidden rounded-md border border-fuchsia-200 bg-white">
                <button type="button" onClick={() => toggleSection("settlement")} className="flex w-full items-center justify-between bg-gradient-to-r from-fuchsia-50 to-fuchsia-100/50 px-5 py-3 text-left transition hover:bg-fuchsia-100/50">
                  <h3 className="text-sm font-bold text-fuchsia-900">Chờ xác nhận quyết toán</h3>
                  <ChevronDown className={`h-4 w-4 text-fuchsia-400 transition-transform duration-200 ${openSections.has("settlement") ? "rotate-180" : ""}`} />
                </button>
                {openSections.has("settlement") && (
                  <div className="border-t border-fuchsia-100 p-5 space-y-2 text-sm">
                    {selected.compensationDirection === "CustomerPaysOwner" && role === "Customer" && !selected.customerExternalConfirmed && (
                      <p className="text-fuchsia-800">
                        Toàn bộ {formatCurrency(selected.externalSettlementAmount)} do hai bên tự thanh toán bên ngoài hệ thống.
                      </p>
                    )}
                    {selected.platformSettlementCompletedAt && (
                      <p className="font-medium text-emerald-700">Nền tảng đã chuyển tiền: {formatDateTime(selected.platformSettlementCompletedAt)}</p>
                    )}
                    <p>Khách: {selected.customerExternalConfirmed ? "Đã xác nhận" : "Chưa xác nhận"}</p>
                    <p>Chủ xe: {selected.ownerExternalConfirmed ? "Đã xác nhận" : "Chưa xác nhận"}</p>
                    {!((role === "Customer" && selected.customerExternalConfirmed) || (role === "Owner" && selected.ownerExternalConfirmed)) && (
                      <Button type="button" size="sm" onClick={() => void confirmExternal()} isLoading={isSubmitting} className="mt-2">
                        {role === "Customer" && selected.compensationDirection === "CustomerPaysOwner"
                          ? "Chấp nhận phán quyết"
                          : "Xác nhận đã thanh toán/nhận tiền"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* --- Khách: Bổ sung bằng chứng --- */}
            {canCreate && selected.status === "NeedMoreEvidence" && (
              <div className="overflow-hidden rounded-md border border-orange-200 bg-white">
                <button type="button" onClick={() => toggleSection("evidenceRequest")} className="flex w-full items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100/50 px-5 py-3 text-left transition hover:bg-orange-100/50">
                  <h3 className="text-sm font-bold text-orange-900">Cần bổ sung bằng chứng</h3>
                  <ChevronDown className={`h-4 w-4 text-orange-400 transition-transform duration-200 ${openSections.has("evidenceRequest") ? "rotate-180" : ""}`} />
                </button>
                {openSections.has("evidenceRequest") && (
                  <div className="border-t border-orange-100 p-5 space-y-3">
                    {selected.evidenceRequestMessage && <p className="whitespace-pre-line text-sm text-orange-800">{selected.evidenceRequestMessage}</p>}
                    <textarea
                      rows={3}
                      value={actionForm.evidenceMessage}
                      onChange={(event) => setActionForm((prev) => ({ ...prev, evidenceMessage: event.target.value }))}
                      placeholder="Nội dung phản hồi..."
                      className="w-full resize-y rounded-md border border-orange-200 px-3 py-2 text-sm"
                    />
                    <textarea
                      rows={2}
                      value={actionForm.evidenceUrls}
                      onChange={(event) => setActionForm((prev) => ({ ...prev, evidenceUrls: event.target.value }))}
                      placeholder="Link ảnh/hóa đơn, mỗi dòng một link"
                      className="w-full resize-y rounded-md border border-orange-200 px-3 py-2 text-sm"
                    />
                    <Button type="button" size="sm" onClick={() => void submitEvidence()} isLoading={isSubmitting} disabled={!actionForm.evidenceMessage.trim()}>
                      Gửi bổ sung
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* --- Admin: Cưỡng chế đóng --- */}
            {isAdmin && selected.status === "AwaitingExternalSettlement" && (
              <div className="overflow-hidden rounded-md border border-red-200 bg-white">
                <button type="button" onClick={() => toggleSection("adminClose")} className="flex w-full items-center justify-between bg-gradient-to-r from-red-50 to-red-100/50 px-5 py-3 text-left transition hover:bg-red-100/50">
                  <h3 className="text-sm font-bold text-red-900">Admin cưỡng chế đóng hồ sơ</h3>
                  <ChevronDown className={`h-4 w-4 text-red-400 transition-transform duration-200 ${openSections.has("adminClose") ? "rotate-180" : ""}`} />
                </button>
                {openSections.has("adminClose") && (
                  <div className="border-t border-red-100 p-5 space-y-3">
                    <textarea rows={2} value={actionForm.adminCloseReason} onChange={(event) => setActionForm((prev) => ({ ...prev, adminCloseReason: event.target.value }))} placeholder="Lý do đóng hồ sơ..." className="w-full rounded-md border border-red-200 px-3 py-2 text-sm" />
                    <Button type="button" variant="secondary" size="sm" onClick={() => void forceClose()} isLoading={isSubmitting} disabled={!actionForm.adminCloseReason.trim()}>
                      Đóng hồ sơ
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* --- Audit log --- */}
            {selected.auditLogs.length > 0 && (
              <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <button type="button" onClick={() => toggleSection("audit")} className="flex w-full items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/50 px-5 py-3 text-left transition hover:bg-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Lịch sử thao tác</h3>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${openSections.has("audit") ? "rotate-180" : ""}`} />
                </button>
                {openSections.has("audit") && (
                  <div className="border-t border-slate-100 p-5">
                    <div className="relative pl-6 border-l-2 border-slate-200 space-y-4 ml-1">
                      {selected.auditLogs.map((log) => (
                        <div key={log.id} className="relative group">
                          <div className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-brand-500 bg-white" />
                          <p className="text-sm font-medium text-slate-800">{log.action}</p>
                          <p className="text-xs text-slate-500">{log.actorName} · {formatDateTime(log.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">Tạo tranh chấp mới</h3>
              <button type="button" onClick={() => setShowCreateFormModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClick} className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Mã booking
                <input
                  required
                  type="number"
                  min="1"
                  value={createForm.bookingId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, bookingId: event.target.value }))}
                  placeholder="Nhập mã booking..."
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Loại báo cáo
                <select
                  value={createForm.reportType}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, reportType: event.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="Dispute">Tranh chấp</option>
                  <option value="Damage">Hư hỏng</option>
                  <option value="LateReturn">Trả xe muộn</option>
                  <option value="Other">Khác</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Mô tả sự việc
                <textarea
                  required
                  rows={4}
                  value={createForm.description}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Mô tả chi tiết sự việc..."
                  className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Ảnh bằng chứng ({createEvidenceImages.length}/{MAX_EVIDENCE_IMAGES})</p>
                <div className="flex flex-wrap gap-2">
                  {createEvidenceImages.map((image) => (
                    <div key={image.id} className="group relative h-20 w-20 overflow-hidden rounded-md border border-slate-200">
                      <img src={image.previewUrl} alt="Evidence" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeCreateEvidenceImage(image.id)}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {createEvidenceImages.length < MAX_EVIDENCE_IMAGES && (
                    <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-brand-400 hover:text-brand-500">
                      <FileImage className="h-5 w-5" />
                      <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => selectCreateEvidenceImages(event.target.files)} />
                    </label>
                  )}
                </div>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Link bằng chứng (mỗi dòng một link)
                <textarea
                  rows={2}
                  value={createForm.evidenceUrls}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, evidenceUrls: event.target.value }))}
                  placeholder="https://..."
                  className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowCreateFormModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" isLoading={isSubmitting} disabled={!createForm.bookingId || !createForm.description.trim()}>
                  <Send className="h-4 w-4" /> Gửi tranh chấp
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-950">Trước khi tạo tranh chấp</h3>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              Vui lòng liên hệ trực tiếp với bên kia để giải quyết vấn đề. Nếu không thể thống nhất, hãy tiếp tục tạo tranh chấp trên hệ thống.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowCreateConfirm(false)}>
                Hủy
              </Button>
              <Button variant="primary" onClick={() => void confirmCreateDispute()} isLoading={isSubmitting}>
                Tiếp tục tạo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
