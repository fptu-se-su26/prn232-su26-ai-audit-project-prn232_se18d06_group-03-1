import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { AlertCircle, BarChart3, Check, CheckCircle, ChevronDown, Clock, Eye, FileBadge, FileText, RefreshCw, Search, ShieldAlert, ThumbsUp, ThumbsDown, X, XCircle } from "lucide-react";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import { Skeleton } from "@/components/common/Skeleton";
import { showToast } from "@/components/common/toastStore";
import useClickOutside from "@/hooks/useClickOutside";
import {
  driverLicenseStatusLabel,
  formatDriverLicenseFlags,
  translateDriverLicenseMessage,
} from "@/features/driverLicenses/driverLicenseDisplay";
import {
  approveDriverLicenseVerification,
  getDriverLicenseVerificationById,
  getDriverLicenseVerifications,
  rejectDriverLicenseVerification,
  requestMoreDriverLicenseInfo,
} from "@/features/driverLicenses/services/driverLicenseService";
import type { DriverLicenseAiResult, DriverLicenseVerificationListItem, DriverLicenseVerificationRequestDto } from "@/features/driverLicenses/types";

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

const chartColors = ["bg-amber-500", "bg-emerald-500", "bg-blue-500", "bg-red-500", "bg-slate-500"];

function compactNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    timeZone: "Asia/Bangkok",
  });
}

function vehicleTypeLabel(value?: string | null) {
  if (value === "Car") return "Ô tô";
  if (value === "Motorbike" || value === "Motorcycle") return "Xe máy";
  return value ?? "-";
}

function parseAiResult(raw?: string | null): DriverLicenseAiResult | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DriverLicenseAiResult;
  } catch {
    return null;
  }
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
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
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

function OverviewMetricCard({ label, value, tone, icon: Icon }: { label: string; value: number; tone: string; icon: ComponentType<{ className?: string }> }) {
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

function MiniBarChart({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  function statusLabel(label: string) {
    return driverLicenseStatusLabel[label] ?? label;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-50 to-amber-100">
          <BarChart3 className="h-4.5 w-4.5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-400">{compactNumber(total)} bản ghi</p>
        </div>
      </div>
      <div className="space-y-3.5">
        {data.map((item, index) => {
          const percent = total > 0 ? Math.max(6, Math.round((item.value / total) * 100)) : 0;
          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${chartColors[index % chartColors.length].replace("bg-", "bg-").replace("-500", "-400")}`} />
                  <span className="text-xs font-medium text-slate-600">{statusLabel(item.label)}</span>
                </div>
                <span className="text-xs font-semibold text-slate-800">{compactNumber(item.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${chartColors[index % chartColors.length]} transition-all duration-500`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
        {data.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Chưa có dữ liệu.</p>}
      </div>
    </div>
  );
}

function LogItem({ action, user, licenseClass, time, reason }: { action: "approve" | "reject" | "more"; user: string; licenseClass?: string | null; time: string; reason?: string | null }) {
  const cfg = {
    approve: { icon: ThumbsUp, bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", label: "Đã duyệt" },
    reject: { icon: ThumbsDown, bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400", label: "Từ chối" },
    more: { icon: AlertCircle, bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400", label: "Yêu cầu bổ sung" },
  }[action];
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
        <Icon className={`h-3.5 w-3.5 ${cfg.text}`} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{user}</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          {licenseClass && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{licenseClass}</span>}
        </div>
        {reason && <p className="mt-0.5 text-xs text-slate-500">{reason}</p>}
        <p className="mt-0.5 text-xs text-slate-400">{time}</p>
      </div>
    </div>
  );
}

export default function DriverLicenseModerationPage({ scope }: { scope: Scope }) {
  const [items, setItems] = useState<DriverLicenseVerificationListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("Pending");
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<DriverLicenseVerificationRequestDto | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [isActing, setIsActing] = useState(false);
  const [overview, setOverview] = useState<{ pending: number; verified: number; needMoreInfo: number; rejected: number; failed: number } | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [allItems, setAllItems] = useState<DriverLicenseVerificationListItem[]>([]);
  const [logLoading, setLogLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      setOverviewLoading(true);
      try {
        const results = await Promise.all(
          STATUS_LIST.map((s) => getDriverLicenseVerifications(scope, { status: s, page: 1, pageSize: 1 }))
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
      const [result, allResult] = await Promise.all([
        getDriverLicenseVerifications(scope, {
          status: status || undefined,
          keyword: keyword || undefined,
          page: nextPage,
          pageSize: 10,
        }),
        getDriverLicenseVerifications(scope, { page: 1, pageSize: 50 }),
      ]);
      setItems(result.items);
      setAllItems(allResult.items);
      setTotalPages(result.totalPages || 1);
      setTotalCount(result.totalCount);
      setPage(result.page);
      setLogLoading(false);
    } catch (error) {
      showToast({ type: "error", title: "Không tải được GPLX", message: error instanceof Error ? translateDriverLicenseMessage(error.message) : "Vui lòng thử lại." });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, status]);

  async function openDetail(id: number) {
    try {
      const data = await getDriverLicenseVerificationById(scope, id);
      setDetail(data);
      setActionReason("");
    } catch (error) {
      showToast({ type: "error", title: "Không tải được chi tiết", message: error instanceof Error ? translateDriverLicenseMessage(error.message) : "Vui lòng thử lại." });
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
      if (kind === "approve") await approveDriverLicenseVerification(scope, detail.id);
      if (kind === "reject") await rejectDriverLicenseVerification(scope, detail.id, actionReason);
      if (kind === "more") await requestMoreDriverLicenseInfo(scope, detail.id, actionReason);
      showToast({ type: "success", title: "Đã xử lý GPLX", message: "Trạng thái hồ sơ đã được cập nhật." });
      setDetail(null);
      await load();
    } catch (error) {
      showToast({ type: "error", title: "Xử lý thất bại", message: error instanceof Error ? translateDriverLicenseMessage(error.message) : "Vui lòng thử lại." });
    } finally {
      setIsActing(false);
    }
  }

  const ai = useMemo(() => parseAiResult(detail?.externalResultJson), [detail]);
  const aiFlags = formatDriverLicenseFlags(ai?.flags);

  const workload = (overview?.pending ?? 0) + (overview?.needMoreInfo ?? 0) + (overview?.failed ?? 0);

  // Compute approval rate by license class
  const classStats = useMemo(() => {
    const map = new Map<string, { total: number; approved: number }>();
    for (const item of allItems) {
      const cls = item.licenseClass || "Không rõ";
      if (!map.has(cls)) map.set(cls, { total: 0, approved: 0 });
      const s = map.get(cls)!;
      s.total++;
      if (item.status === "Verified") s.approved++;
    }
    return Array.from(map.entries())
      .map(([cls, stats]) => ({ cls, ...stats, rate: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [allItems]);

  // Recent activity log
  const recentLog = useMemo(() => {
    return allItems
      .filter((item) => item.status === "Verified" || item.status === "Rejected" || item.status === "NeedMoreInfo")
      .slice(0, 20);
  }, [allItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Xác minh GPLX</h1>
            <p className="mt-0.5 text-sm text-slate-500">Duyệt các hồ sơ GPLX cần xử lý.</p>
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

      {/* Dashboard charts row */}
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* Status chart */}
        {overview && (
          <MiniBarChart
            title="Trạng thái GPLX"
            data={[
              { label: "Pending", value: overview.pending },
              { label: "Verified", value: overview.verified },
              { label: "NeedMoreInfo", value: overview.needMoreInfo },
              { label: "Rejected", value: overview.rejected },
              { label: "Failed", value: overview.failed },
            ]}
          />
        )}

        {/* Approval rate by license class */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
              <ThumbsUp className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Tỉ lệ duyệt theo hạng</h2>
              <p className="text-xs text-slate-400">{classStats.length} hạng</p>
            </div>
          </div>
          {logLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : classStats.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Chưa có dữ liệu.</p>
          ) : (
            <div className="space-y-2">
              {classStats.map((stat) => (
                <div key={stat.cls} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{stat.cls}</span>
                    <span className="text-xs text-slate-400">({stat.total} hồ sơ)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${stat.rate}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${stat.rate >= 70 ? "text-emerald-700" : stat.rate >= 40 ? "text-amber-700" : "text-red-700"}`}>
                      {stat.rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter bar + table */}
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
          <EmptyState title="Không có hồ sơ GPLX" description="Không tìm thấy hồ sơ phù hợp với bộ lọc hiện tại." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Người dùng</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Hạng</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Loại xe</th>
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
                        {item.licenseClass ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{item.licenseClass}</span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{vehicleTypeLabel(item.requestedVehicleType)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge.bg} ${badge.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {driverLicenseStatusLabel[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{item.confidence != null ? `${Math.round(item.confidence * 100)}%` : "-"}</td>
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

      {/* Recent activity log */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-50 to-slate-100">
            <Clock className="h-4.5 w-4.5 text-slate-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Nhật ký duyệt gần đây</h2>
            <p className="text-xs text-slate-400">Các hồ sơ đã được xử lý</p>
          </div>
        </div>
        {logLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : recentLog.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Chưa có hồ sơ nào được xử lý.</p>
        ) : (
          <div className="space-y-2">
            {recentLog.map((item) => (
              <LogItem
                key={item.id}
                action={item.status === "Verified" ? "approve" : item.status === "Rejected" ? "reject" : "more"}
                user={item.userFullName}
                licenseClass={item.licenseClass}
                time={formatDate(item.createdAt)}
                reason={item.decisionReason}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">GPLX #{detail.id}</h2>
                <p className="text-sm text-slate-500">{detail.userFullName} · {detail.userEmail}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[360px_1fr]">
              <div>
                {detail.frontImageUrl ? (
                  <button type="button" onClick={() => setImageOpen(true)} className="block overflow-hidden rounded-lg border border-slate-200">
                    <img src={detail.frontImageUrl} alt="GPLX" className="h-60 w-full object-cover" />
                  </button>
                ) : (
                  <div className="flex h-60 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400"><FileBadge className="h-10 w-10" /></div>
                )}
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3 rounded-md bg-slate-50 px-3 py-2"><dt className="text-slate-500">Trạng thái</dt><dd className="font-medium text-slate-900"><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${(statusBadge[detail.status] ?? statusBadge.Pending).bg} ${(statusBadge[detail.status] ?? statusBadge.Pending).text}`}>{driverLicenseStatusLabel[detail.status] ?? detail.status}</span></dd></div>
                  <div className="flex justify-between gap-3 rounded-md bg-slate-50 px-3 py-2"><dt className="text-slate-500">Ngày gửi</dt><dd className="font-medium text-slate-900">{formatDate(detail.createdAt)}</dd></div>
                  <div className="flex justify-between gap-3 rounded-md bg-slate-50 px-3 py-2"><dt className="text-slate-500">OCR</dt><dd className="font-medium text-slate-900">{detail.confidence != null ? `${Math.round(detail.confidence * 100)}%` : "-"}</dd></div>
                </dl>
              </div>
              <div className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Tên OCR" value={ai?.extracted?.fullName} />
                  <Info label="Số GPLX" value={ai?.extracted?.driverLicenseNumber} />
                  <Info label="Hạng bằng" value={ai?.extracted?.licenseClass} />
                  <Info label="Xác minh cho" value={vehicleTypeLabel(detail.requestedVehicleType)} />
                  <Info label="Hết hạn" value={ai?.extracted?.expiryDate} />
                  <Info label="Khớp tên" value={ai?.nameMatch?.matched == null ? "-" : ai.nameMatch.matched ? "Khớp" : "Không khớp"} />
                  <Info label="Điểm tên" value={ai?.nameMatch?.score?.toString()} />
                </div>
                {aiFlags.length > 0 && <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">Lý do cần kiểm tra: {aiFlags.join(", ")}</div>}
                {detail.decisionReason && <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{translateDriverLicenseMessage(detail.decisionReason)}</div>}
                <textarea value={actionReason} onChange={(event) => setActionReason(event.target.value)} rows={3} placeholder="Lý do nếu từ chối hoặc yêu cầu bổ sung" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
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
          {detail.frontImageUrl && <ImagePreviewModal isOpen={imageOpen} src={detail.frontImageUrl} title="GPLX" onClose={() => setImageOpen(false)} />}
        </div>
      )}
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
