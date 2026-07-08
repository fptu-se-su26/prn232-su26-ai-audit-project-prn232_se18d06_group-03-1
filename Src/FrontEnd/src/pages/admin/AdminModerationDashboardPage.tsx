import { useEffect, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/common/Skeleton";
import { getAdminVehicleModerationOverview } from "@/features/vehicles/services/vehicleService";
import type { VehicleModerationChartPoint, VehicleModerationOverviewResponse } from "@/features/vehicles/types";
import {
  BarChart3, CheckCircle, Clock, FileText, ShieldAlert,
  ClipboardList, ArrowRight, Car, TrendingUp,
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
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100">
          <BarChart3 className="h-4.5 w-4.5 text-brand-600" />
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

export default function AdminModerationDashboardPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<VehicleModerationOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminVehicleModerationOverview()
      .then((data) => setOverview(data ?? null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
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
  const listingWorkload = overview.pendingListings;

  const stats = [
    { label: "Giấy tờ cần xử lý", value: docWorkload, tone: "bg-amber-50 text-amber-600", icon: FileText, subtitle: `${docPending} chờ, ${docManualReview} cần xem` },
    { label: "Tin đăng chờ duyệt", value: listingWorkload, tone: "bg-blue-50 text-blue-600", icon: Clock, subtitle: overview.approvedListings > 0 ? `${overview.approvedListings} đã duyệt` : undefined },
    { label: "Cần can thiệp", value: overview.overrideCandidates, tone: "bg-red-50 text-red-600", icon: ShieldAlert, subtitle: `${overview.rejectedListings} từ chối` },
    { label: "Đã xử lý", value: docVerified + overview.approvedListings, tone: "bg-emerald-50 text-emerald-600", icon: CheckCircle, subtitle: `${docVerified} hồ sơ + ${overview.approvedListings} tin` },
  ];

  const summaryItems = [
    { label: "Tổng số xe", value: overview.totalVehicles, color: "text-slate-800", icon: Car },
    { label: "Giấy tờ chờ xử lý", value: docPending, color: "text-amber-700", icon: null },
    { label: "Cần xem lại", value: docManualReview, color: "text-orange-700", icon: null },
    { label: "Cần bổ sung", value: docNeedInfo, color: "text-amber-700", icon: null },
    { label: "Lỗi / Từ chối hồ sơ", value: docFailed + docRejected, color: "text-red-700", icon: null },
    { label: "Đã xác thực", value: docVerified, color: "text-emerald-700", icon: null },
    { label: "Tin chờ duyệt", value: listingWorkload, color: "text-blue-700", icon: null },
    { label: "Đã duyệt tin", value: overview.approvedListings, color: "text-emerald-700", icon: null },
    { label: "Từ chối tin", value: overview.rejectedListings, color: "text-red-700", icon: null },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <ShieldAlert className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Giám sát kiểm duyệt</h1>
            <p className="mt-0.5 text-sm text-slate-500">Theo dõi hồ sơ xe, tin đăng và các trường hợp cần can thiệp.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <MetricCard key={s.label} label={s.label} value={s.value} tone={s.tone} icon={s.icon} subtitle={s.subtitle} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <MiniBarChart title="Trạng thái giấy tờ" data={overview.documentStatusChart} />
          <MiniBarChart title="Trạng thái tin đăng" data={overview.listingStatusChart} />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-50 to-slate-100">
                <TrendingUp className="h-4.5 w-4.5 text-slate-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Chi tiết</h2>
                <p className="text-xs text-slate-400">Tổng quan các chỉ số</p>
              </div>
            </div>
            <div className="space-y-1">
              {summaryItems.map((item, idx) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-slate-50 ${idx === 0 ? "bg-slate-50" : ""}`}
                >
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    {item.icon && <item.icon className="h-3.5 w-3.5 text-slate-400" />}
                    {item.label}
                  </span>
                  <span className={`text-sm font-semibold ${item.color}`}>{compactNumber(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100">
                <ArrowRight className="h-4.5 w-4.5 text-brand-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Đi nhanh</h2>
                <p className="text-xs text-slate-400">Chuyển đến trang xử lý</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <NavButton
                icon={FileText}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                label="Giấy tờ xe"
                onClick={() => navigate("/admin/vehicle-documents")}
              />
              <NavButton
                icon={ClipboardList}
                iconBg="bg-orange-50"
                iconColor="text-orange-600"
                label="Tin đăng xe"
                onClick={() => navigate("/admin/vehicle-listings")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, iconBg, iconColor, label, onClick }: { icon: ComponentType<{ className?: string }>; iconBg: string; iconColor: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} transition-transform group-hover:scale-110`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <span className="flex-1 text-left">{label}</span>
      <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
