import { AlertTriangle, ChevronLeft, ChevronRight, Eye, FileText, Gavel, Search, Send, ShieldAlert } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { showToast } from "@/components/common/toastStore";
import Card from "@/components/ui/Card";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import {
  adminOverrideDispute,
  createDispute,
  escalateDispute,
  getDisputeById,
  getMyDisputes,
  getStaffDisputes,
  investigateDispute,
  resolveDispute,
} from "@/features/disputes/disputeService";
import type { DisputeDetailResponse, DisputeListItem, DisputeListRequest } from "@/features/disputes/types";

const PAGE_SIZE = 10;

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

export default function DisputePage() {
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

  const [createForm, setCreateForm] = useState({
    bookingId: "",
    reportType: "Dispute",
    description: "",
    evidenceUrls: "",
  });
  const [actionForm, setActionForm] = useState({
    resolution: "",
    compensationAmount: "",
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

  async function openDetail(id: number) {
    try {
      const detail = await getDisputeById(id);
      setSelected(detail);
      setActionForm({
        resolution: detail.resolution ?? "",
        compensationAmount: detail.compensationAmount != null ? String(detail.compensationAmount) : "",
      });
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải chi tiết tranh chấp." });
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
      const dispute = await createDispute({
        bookingId: Number(createForm.bookingId),
        reportType: createForm.reportType,
        description: createForm.description,
        evidenceUrls: createForm.evidenceUrls || null,
      });
      setCreateForm({ bookingId: "", reportType: "Dispute", description: "", evidenceUrls: "" });
      setSelected(dispute);
      showToast({ type: "success", title: "Đã tạo tranh chấp", message: "Hồ sơ đã được gửi đến staff." });
      await load(1, statusFilter, keyword);
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tạo tranh chấp. Kiểm tra mã booking và quyền truy cập." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runAction(action: "investigate" | "resolve" | "escalate" | "override") {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      const payload = {
        resolution: actionForm.resolution,
        compensationAmount: actionForm.compensationAmount ? Number(actionForm.compensationAmount) : null,
      };
      const updated =
        action === "investigate" ? await investigateDispute(selected.id)
        : action === "resolve" ? await resolveDispute(selected.id, payload)
        : action === "escalate" ? await escalateDispute(selected.id, payload)
        : await adminOverrideDispute(selected.id, payload);

      setSelected(updated);
      showToast({ type: "success", title: "Đã cập nhật", message: "Trạng thái tranh chấp đã được cập nhật." });
      await load(page, statusFilter, keyword);
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể cập nhật tranh chấp." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">{role}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
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
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Người mở</th>
                  <th className="px-4 py-3">Nội dung</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Staff</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-950">{item.bookingCode}</p>
                      <p className="text-xs text-slate-500">#{item.id} · {formatDateTime(item.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.openedByName}</td>
                    <td className="min-w-72 px-4 py-3">
                      <p className="line-clamp-2 text-slate-700">{item.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusColors[item.status] ?? "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                        {statusLabels[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.assignedStaffName ?? "Chưa nhận"}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => void openDetail(item.id)}>
                        <Eye className="h-4 w-4" /> Chi tiết
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
                  <option value="LateReturn">Trả xe trễ</option>
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
              <label className="block text-sm font-medium text-slate-700">
                Link ảnh bằng chứng
                <textarea
                  rows={3}
                  value={createForm.evidenceUrls}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, evidenceUrls: event.target.value }))}
                  placeholder="Mỗi dòng hoặc cách nhau bằng dấu phẩy"
                  className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>
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

              {selected.resolution && (
                <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                  <p className="font-bold">Phán quyết</p>
                  <p className="mt-1 whitespace-pre-line">{selected.resolution}</p>
                  {selected.compensationAmount != null && <p className="mt-1">Bồi thường: {selected.compensationAmount.toLocaleString("vi-VN")}đ</p>}
                </div>
              )}

              {(isStaff || isAdmin) && selected.status !== "Resolved" && (
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
                  <label className="block text-sm font-medium text-slate-700">
                    Số tiền bồi thường
                    <input
                      type="number"
                      min="0"
                      value={actionForm.compensationAmount}
                      onChange={(event) => setActionForm((prev) => ({ ...prev, compensationAmount: event.target.value }))}
                      className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => void runAction("investigate")} isLoading={isSubmitting}>
                      <AlertTriangle className="h-4 w-4" /> Điều tra
                    </Button>
                    <Button type="button" size="sm" onClick={() => void runAction("resolve")} isLoading={isSubmitting} disabled={!actionForm.resolution.trim()}>
                      <Gavel className="h-4 w-4" /> Resolve
                    </Button>
                    {isStaff && (
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
