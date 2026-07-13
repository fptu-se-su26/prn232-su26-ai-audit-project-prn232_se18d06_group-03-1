import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, BarChart3, Check, CheckCircle, ChevronDown, Eye, FileText, RefreshCw, Search, ShieldAlert, X, XCircle } from "lucide-react";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import { Skeleton } from "@/components/common/Skeleton";
import { showToast } from "@/components/common/toastStore";
import useClickOutside from "@/hooks/useClickOutside";
import {
  getNationalIdVerifications,
  getNationalIdVerificationById,
  approveNationalIdVerification,
  rejectNationalIdVerification,
  requestMoreNationalIdInfo,
  type NationalIdVerificationListItem,
  type NationalIdVerificationDetailDto,
} from "@/features/owner/services/nationalIdReviewService";

type Scope = "staff" | "admin";

const statusOptions = [
  { value: "", label: "Tất cả" },
  { value: "Pending", label: "Chờ duyệt" },
  { value: "Verified", label: "Đã xác thực" },
  { value: "NeedMoreInfo", label: "Cần bổ sung" },
  { value: "Rejected", label: "Từ chối" },
  { value: "Failed", label: "Lỗi" },
];

const STATUS_LIST = ["Pending", "Verified", "NeedMoreInfo", "Rejected", "Failed"];

const statusBadge: Record<string, { bg: string; text: string; dot: string }> = {
  Pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  Verified: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  NeedMoreInfo: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  Rejected: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  Failed: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

const statusLabel: Record<string, string> = {
  Pending: "Chờ duyệt",
  Verified: "Đã xác thực",
  NeedMoreInfo: "Cần bổ sung",
  Rejected: "Từ chối",
  Failed: "Lỗi",
};

const chartColors = ["bg-amber-500", "bg-emerald-500", "bg-blue-500", "bg-red-500", "bg-slate-500"];

function compactNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" });
}

function FilterDropdown({ value, label, options, onChange }: { value: string; label: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const current = options.find((option) => option.value === value);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((prev) => !prev)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50">
        <span className="text-xs text-slate-400">{label}:</span>
        <span className="font-medium">{current?.label ?? "Tất cả"}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-72 w-56 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors ${option.value === value ? "bg-brand-100 font-medium text-brand-700" : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OverviewMetricCard({ label, value, tone, icon: Icon }: { label: string; value: number; tone: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{compactNumber(value)}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StatusChart({ overview }: { overview: { pending: number; verified: number; needMoreInfo: number; rejected: number; failed: number } }) {
  const entries = [
    { key: "pending", label: "Chờ duyệt", value: overview.pending },
    { key: "verified", label: "Đã xác thực", value: overview.verified },
    { key: "needMoreInfo", label: "Cần bổ sung", value: overview.needMoreInfo },
    { key: "rejected", label: "Từ chối", value: overview.rejected },
    { key: "failed", label: "Lỗi", value: overview.failed },
  ];
  const total = entries.reduce((s, e) => s + e.value, 0);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-50 to-amber-100">
          <BarChart3 className="h-4.5 w-4.5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Trạng thái CCCD</h2>
          <p className="text-xs text-slate-400">{compactNumber(total)} bản ghi</p>
        </div>
      </div>
      <div className="space-y-3.5">
        {entries.map((e, i) => {
          const pct = total > 0 ? Math.max(6, Math.round((e.value / total) * 100)) : 0;
          return (
            <div key={e.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${chartColors[i % chartColors.length].replace("-500", "-400")}`} />
                  <span className="text-xs font-medium text-slate-600">{e.label}</span>
                </div>
                <span className="text-xs font-semibold text-slate-800">{compactNumber(e.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${chartColors[i % chartColors.length]} transition-all duration-500`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value || "-"}</p>
    </div>
  );
}

export default function NationalIdModerationPage({ scope }: { scope: Scope }) {
  const [items, setItems] = useState<NationalIdVerificationListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("Pending");
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<NationalIdVerificationDetailDto | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [isActing, setIsActing] = useState(false);
  const [overview, setOverview] = useState<{ pending: number; verified: number; needMoreInfo: number; rejected: number; failed: number } | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      setOverviewLoading(true);
      try {
        const results = await Promise.all(
          STATUS_LIST.map((s) => getNationalIdVerifications(scope, { status: s, page: 1, pageSize: 1 }))
        );
        setOverview({
          pending: results[0].totalCount,
          verified: results[1].totalCount,
          needMoreInfo: results[2].totalCount,
          rejected: results[3].totalCount,
          failed: results[4].totalCount,
        });
      } catch {
        setOverview(null);
      } finally {
        setOverviewLoading(false);
      }
    }
    void loadOverview();
  }, [scope]);

  async function load(nextPage = page) {
    setIsLoading(true);
    try {
      const result = await getNationalIdVerifications(scope, {
        status: status || undefined,
        keyword: keyword || undefined,
        page: nextPage,
        pageSize: 10,
      });
      setItems(result.items);
      setTotalPages(result.totalPages || 1);
      setTotalCount(result.totalCount);
      setPage(result.page);
    } catch (error) {
      showToast({ type: "error", title: "Không tải được CCCD", message: error instanceof Error ? error.message : "Vui lòng thử lại." });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load(1);
  }, [scope, status]);

  async function openDetail(id: number) {
    try {
      const data = await getNationalIdVerificationById(scope, id);
      setDetail(data);
      setActionReason("");
    } catch (error) {
      showToast({ type: "error", title: "Không tải được chi tiết", message: error instanceof Error ? error.message : "Vui lòng thử lại." });
    }
  }

  async function runAction(kind: "approve" | "reject" | "more") {
    if (!detail) return;
    if (kind !== "approve" && !actionReason.trim()) {
      showToast({ type: "error", title: "Thiếu lý do", message: "Vui lòng nhập lý do xử lý." });
      return;
    }
    setIsActing(true);
    try {
      if (kind === "approve") await approveNationalIdVerification(scope, detail.id);
      if (kind === "reject") await rejectNationalIdVerification(scope, detail.id, actionReason);
      if (kind === "more") await requestMoreNationalIdInfo(scope, detail.id, actionReason);
      showToast({ type: "success", title: "Đã xử lý CCCD", message: "Trạng thái hồ sơ đã được cập nhật." });
      setDetail(null);
      await load();
    } catch (error) {
      showToast({ type: "error", title: "Xử lý thất bại", message: error instanceof Error ? error.message : "Vui lòng thử lại." });
    } finally {
      setIsActing(false);
    }
  }

  const rawJson = useMemo(() => {
    if (!detail?.externalResultJson) return null;
    try { return JSON.parse(detail.externalResultJson); } catch { return null; }
  }, [detail]);

  const aiFlags: string[] = rawJson?.flags ?? [];
  const workload = (overview?.pending ?? 0) + (overview?.needMoreInfo ?? 0) + (overview?.failed ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Xác minh CCCD</h1>
            <p className="mt-0.5 text-sm text-slate-500">Duyệt các hồ sơ CCCD cần xử lý.</p>
          </div>
        </div>
      </div>

      {/* Overview dashboard */}
      {overviewLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : overview && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewMetricCard label="Hồ sơ cần xử lý" value={workload} tone="bg-amber-50 text-amber-600" icon={FileText} />
          <OverviewMetricCard label="Đã xác thực" value={overview.verified} tone="bg-emerald-50 text-emerald-600" icon={CheckCircle} />
          <OverviewMetricCard label="Cần bổ sung" value={overview.needMoreInfo} tone="bg-blue-50 text-blue-600" icon={AlertCircle} />
          <OverviewMetricCard label="Từ chối / Lỗi" value={overview.rejected + overview.failed} tone="bg-red-50 text-red-600" icon={XCircle} />
        </div>
      )}

      {/* Status chart */}
      {overview && <StatusChart overview={overview} />}
 
      {/* Filter + table */}
      <div className="rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm tên hoặc email..."
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              onKeyDown={(e) => { if (e.key === "Enter") void load(1); }}
            />
          </div>
          <FilterDropdown label="Trạng thái" value={status} onChange={setStatus} options={statusOptions} />
          <Button type="button" variant="secondary" onClick={() => void load(1)}><RefreshCw className="h-4 w-4" />Lọc</Button>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <div className="text-sm font-medium text-slate-600">{totalCount} hồ sơ</div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <RefreshCw className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="Không có hồ sơ CCCD" description="Không tìm thấy hồ sơ phù hợp với bộ lọc hiện tại." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Người dùng</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">OCR</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày gửi</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const badge = statusBadge[item.status] ?? statusBadge.Pending;
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-900">{item.userFullName}</p>
                        <p className="text-xs text-slate-500">{item.userEmail}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge.bg} ${badge.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {statusLabel[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {item.confidence != null ? `${Math.round(item.confidence * 100)}%` : "-"}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button type="button" onClick={() => void openDetail(item.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50">
                          <Eye className="h-3.5 w-3.5" /> Xem
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-slate-500">Trang {page}/{totalPages}</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={() => void load(page - 1)}>Trước</Button>
            <Button type="button" variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Sau</Button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">CCCD #{detail.id}</h2>
                <p className="text-sm text-slate-500">{detail.userFullName} · {detail.userEmail}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[360px_1fr]">
              <div>
                {detail.frontImageUrl ? (
                  <button type="button" onClick={() => setImageOpen(true)} className="block overflow-hidden rounded-lg border border-slate-200">
                    <img src={detail.frontImageUrl} alt="CCCD" className="h-60 w-full object-cover" />
                  </button>
                ) : (
                  <div className="flex h-60 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
                    <FileText className="h-10 w-10" />
                  </div>
                )}
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
                    <dt className="text-slate-500">Trạng thái</dt>
                    <dd className="font-medium text-slate-900">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${(statusBadge[detail.status] ?? statusBadge.Pending).bg} ${(statusBadge[detail.status] ?? statusBadge.Pending).text}`}>
                        {statusLabel[detail.status] ?? detail.status}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
                    <dt className="text-slate-500">Ngày gửi</dt>
                    <dd className="font-medium text-slate-900">{formatDate(detail.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
                    <dt className="text-slate-500">OCR confidence</dt>
                    <dd className="font-medium text-slate-900">{detail.confidence != null ? `${Math.round(detail.confidence * 100)}%` : "-"}</dd>
                  </div>
                </dl>
              </div>
              <div className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Số CCCD" value={rawJson?.extracted?.nationalIdNumber} />
                  <Info label="Họ tên" value={rawJson?.extracted?.fullName} />
                  <Info label="Ngày sinh" value={rawJson?.extracted?.dateOfBirth} />
                  <Info label="Giới tính" value={rawJson?.extracted?.sex} />
                  <Info label="Quê quán" value={rawJson?.extracted?.placeOfOrigin} />
                  <Info label="Nơi thường trú" value={rawJson?.extracted?.placeOfResidence} />
                  <Info label="Quốc tịch" value={rawJson?.extracted?.nationality} />
                </div>
                {aiFlags.length > 0 && (
                  <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                    Lý do cần kiểm tra: {aiFlags.join(", ")}
                  </div>
                )}
                {detail.decisionReason && (
                  <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{detail.decisionReason}</div>
                )}
                <textarea
                  value={actionReason}
                  onChange={(event) => setActionReason(event.target.value)}
                  rows={3}
                  placeholder="Lý do nếu từ chối hoặc yêu cầu bổ sung"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
                {detail.status === "Pending" && (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="secondary" isLoading={isActing} onClick={() => void runAction("more")}>Yêu cầu bổ sung</Button>
                    <Button type="button" variant="secondary" isLoading={isActing} onClick={() => void runAction("reject")}><X className="h-4 w-4" />Từ chối</Button>
                    <Button type="button" isLoading={isActing} onClick={() => void runAction("approve")}><Check className="h-4 w-4" />Duyệt</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {detail.frontImageUrl && <ImagePreviewModal isOpen={imageOpen} src={detail.frontImageUrl} title="CCCD" onClose={() => setImageOpen(false)} />}
        </div>
      )}
    </div>
  );
}
