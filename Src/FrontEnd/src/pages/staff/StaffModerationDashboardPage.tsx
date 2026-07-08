import { useEffect, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/common/Skeleton";
import { getStaffVehicleModerationOverview } from "@/features/vehicles/services/vehicleService";
import type { VehicleModerationChartPoint, VehicleModerationOverviewResponse } from "@/features/vehicles/types";
import {
  AlertCircle, BarChart3, CheckCircle, ClipboardList, Clock,
  FileText, Play, ShieldCheck, ArrowRight, ListChecks,
} from "lucide-react";

function compactNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function MetricCard({ label, value, tone, icon: Icon, subtitle }: { label: string; value: number; tone: string; icon: ComponentType<{ className?: string }>; subtitle?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full opacity-[0.07]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{compactNumber(value)}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone} transition-transform group-hover:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ title, data }: { title: string; data: VehicleModerationChartPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  function statusLabel(label: string) {
    const map: Record<string, string> = {
      Pending: "Chờ duyệt", Approved: "Đã duyệt", Rejected: "Từ chối",
      Hidden: "Đã ẩn", Verified: "Đã xác thực", NeedMoreInfo: "Cần bổ sung",
      ManualReview: "Cần xem", Failed: "Lỗi",
    };
    return map[label] ?? label;
  }

  function chartColor(index: number) {
    return ["bg-brand-500", "bg-emerald-500", "bg-amber-500", "bg-blue-500", "bg-red-500", "bg-slate-500"][index % 6];
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <BarChart3 className="h-4.5 w-4.5 text-orange-600" />
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
                  <span className={`h-2 w-2 rounded-full ${chartColor(index).replace("bg-", "bg-").replace("-500", "-400")}`} />
                  <span className="text-xs font-medium text-slate-600">{statusLabel(item.label)}</span>
                </div>
                <span className="text-xs font-semibold text-slate-800">{compactNumber(item.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${chartColor(index)} transition-all duration-500`}
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

export default function StaffModerationDashboardPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<VehicleModerationOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStaffVehicleModerationOverview()
      .then((data) => setOverview(data ?? null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-orange-50 to-white p-5 shadow-sm">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!overview) return null;

  const docPending = overview.pendingDocuments;
  const docManualReview = overview.manualReviewDocuments;
  const docNeedInfo = overview.needMoreInfoDocuments;
  const docFailed = overview.failedDocuments;
  const docVerified = overview.verifiedDocuments;
  const docRejected = overview.rejectedDocuments;
  const docWorkload = docPending + docManualReview + docNeedInfo + docFailed;

  const taskCards = [
    { label: "Hồ sơ chờ duyệt", value: docWorkload, tone: "bg-amber-50 text-amber-600", icon: FileText, subtitle: `${docManualReview} cần xem lại` },
    { label: "Tin đăng chờ duyệt", value: overview.pendingListings, tone: "bg-blue-50 text-blue-600", icon: Clock, subtitle: `${overview.approvedListings} đã duyệt` },
    { label: "Cần bổ sung", value: docNeedInfo, tone: "bg-orange-50 text-orange-600", icon: AlertCircle, subtitle: `${docFailed} lỗi` },
  ];

  const statsList = [
    { label: "Đã xác thực hồ sơ", value: docVerified, color: "text-emerald-700" },
    { label: "Đã duyệt tin đăng", value: overview.approvedListings, color: "text-emerald-700" },
    { label: "Hồ sơ cần bổ sung", value: docNeedInfo, color: "text-amber-700" },
    { label: "Từ chối / Lỗi", value: docRejected + docFailed + overview.rejectedListings, color: "text-red-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
            <ShieldCheck className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Kiểm duyệt</h1>
            <p className="mt-0.5 text-sm text-slate-500">Danh sách công việc cần xử lý.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {taskCards.map((s) => (
          <MetricCard key={s.label} label={s.label} value={s.value} tone={s.tone} icon={s.icon} subtitle={s.subtitle} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <MiniBarChart title="Trạng thái hồ sơ" data={overview.documentStatusChart} />

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100">
                <Play className="h-4.5 w-4.5 text-brand-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Bắt đầu duyệt</h2>
                <p className="text-xs text-slate-400">Chọn tác vụ cần xử lý</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate("/staff/vehicle-documents")}
                className="group inline-flex w-full items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-sm font-medium text-blue-700 shadow-sm transition-all hover:bg-blue-100 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm transition-transform group-hover:scale-110">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <span className="flex-1 text-left font-semibold">Duyệt hồ sơ xe</span>
                <ArrowRight className="h-4 w-4 text-blue-400 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/staff/vehicle-listings")}
                className="group inline-flex w-full items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-3 text-sm font-medium text-orange-700 shadow-sm transition-all hover:bg-orange-100 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm transition-transform group-hover:scale-110">
                  <ClipboardList className="h-4 w-4 text-orange-600" />
                </div>
                <span className="flex-1 text-left font-semibold">Duyệt bài đăng xe</span>
                <ArrowRight className="h-4 w-4 text-orange-400 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                <ListChecks className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Thống kê</h2>
                <p className="text-xs text-slate-400">Kết quả đã xử lý</p>
              </div>
            </div>
            <div className="space-y-1">
              {statsList.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-600">{s.label}</span>
                  <span className={`text-sm font-semibold ${s.color}`}>{compactNumber(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
