import { useEffect, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/common/Skeleton";
import { getAdminPostStats } from "@/features/admin/services/adminPostManagementService";
import type { AdminPostStatsResponse, AdminPostRecentItem } from "@/features/admin/types";
import {
  BarChart3, CheckCircle, Clock, ClipboardList, ArrowRight, Car, TrendingUp, XCircle, Users,
} from "lucide-react";

function compactNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function MetricCard({ label, value, tone, icon: Icon, subtitle, accent }: { label: string; value: number; tone: string; icon: ComponentType<{ className?: string }>; subtitle?: string; accent?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      {accent && <div className={`h-1 w-full ${accent}`} />}
      <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full opacity-[0.04]" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{compactNumber(value)}</p>
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone} transition-transform group-hover:scale-110`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  function chartColor(index: number) {
    return ["bg-brand-500", "bg-emerald-500", "bg-amber-500", "bg-blue-500", "bg-red-500", "bg-slate-500"][index % 6];
  }

  function dotColor(index: number) {
    return ["bg-brand-400", "bg-emerald-400", "bg-amber-400", "bg-blue-400", "bg-red-400", "bg-slate-400"][index % 6];
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-50 to-slate-100">
          <BarChart3 className="h-4.5 w-4.5 text-slate-500" />
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
                  <span className={`h-2 w-2 rounded-full ${dotColor(index)}`} />
                  <span className="text-xs font-medium text-slate-600">{item.label}</span>
                </div>
                <span className="text-xs font-semibold text-slate-800">{compactNumber(item.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${chartColor(index)} transition-all duration-500`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
        {data.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Chưa có dữ liệu.</p>}
      </div>
    </div>
  );
}

function MonthlyBarChart({ data }: { data: { month: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const maxBarHeight = 140;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100">
          <TrendingUp className="h-4.5 w-4.5 text-brand-500" />
        </div>
        <h2 className="text-sm font-semibold text-slate-900">Tin đăng theo tháng</h2>
      </div>
      <div className="flex items-end gap-2" style={{ height: maxBarHeight + 40 }}>
        {data.map((item) => {
          const barHeight = maxCount > 0 ? Math.max(4, Math.round((item.count / maxCount) * maxBarHeight)) : 0;
          return (
            <div key={item.month} className="flex flex-1 flex-col items-center justify-end" style={{ height: maxBarHeight + 30 }}>
              <span className="text-[10px] font-semibold text-slate-600 mb-1">{item.count}</span>
              <div className="w-full bg-brand-100 rounded-t-md" style={{ height: barHeight }}>
                <div className="w-full h-full bg-brand-500 rounded-t-md" />
              </div>
              <span className="text-[10px] text-slate-400 whitespace-nowrap mt-1">{item.month}</span>
            </div>
          );
        })}
        {data.length === 0 && <p className="py-6 text-center text-sm text-slate-400 w-full">Chưa có dữ liệu.</p>}
      </div>
    </div>
  );
}

function RecentPostsTable({ posts }: { posts: AdminPostRecentItem[] }) {
  const navigate = useNavigate();

  function statusBadge(status: string) {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      Pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Chờ duyệt" },
      Approved: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Đã duyệt" },
      Rejected: { bg: "bg-red-50", text: "text-red-700", label: "Từ chối" },
      Hidden: { bg: "bg-slate-100", text: "text-slate-600", label: "Đã ẩn" },
    };
    const s = map[status] ?? { bg: "bg-slate-100", text: "text-slate-600", label: status };
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-sm font-semibold text-slate-900">Tin đăng gần đây</h2>
        <button
          type="button"
          onClick={() => navigate("/admin/posts/owners")}
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Loại</th>
              <th className="px-5 py-3">Hãng / Dòng</th>
              <th className="px-5 py-3">Biển số</th>
              <th className="px-5 py-3 text-right">Giá/ngày</th>
              <th className="px-5 py-3">Trạng thái</th>
              <th className="px-5 py-3">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-800">#{post.id}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                    {post.vehicleType === "Car" ? <Car className="h-3.5 w-3.5" /> : null}
                    {post.vehicleType === "Car" ? "Ô tô" : "Xe máy"}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-700">{post.brandName} {post.modelName}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-600">{post.licensePlate}</td>
                <td className="px-5 py-3 text-right font-medium text-slate-800">{compactNumber(post.pricePerDay)}đ</td>
                <td className="px-5 py-3">{statusBadge(post.status)}</td>
                <td className="px-5 py-3 text-xs text-slate-500">{new Date(post.createdAt).toLocaleDateString("vi-VN")}</td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">Chưa có tin đăng nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminPostDashboardPage() {
  const [data, setData] = useState<AdminPostStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminPostStats()
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err?.message ?? "Lỗi tải dữ liệu"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-red-500">
        <XCircle className="mr-2 h-4 w-4" /> {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Thống kê tin</h1>
        <p className="text-sm text-slate-500">Tổng quan về các tin đăng xe trên nền tảng.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tổng xe" value={data.totalVehicles} tone="bg-brand-50 text-brand-600" icon={Car} accent="bg-brand-500" />
        <MetricCard label="Chờ duyệt" value={data.pendingListings} tone="bg-amber-50 text-amber-600" icon={Clock} accent="bg-amber-500" />
        <MetricCard label="Đã duyệt" value={data.approvedListings} tone="bg-emerald-50 text-emerald-600" icon={CheckCircle} accent="bg-emerald-500" />
        <MetricCard label="Chủ xe" value={data.totalOwners} tone="bg-sky-50 text-sky-600" icon={Users} accent="bg-sky-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MiniBarChart title="Phân loại xe" data={data.vehicleTypeChart} />
        <MonthlyBarChart data={data.monthlyPostStats} />
      </div>

      <RecentPostsTable posts={data.recentPosts} />
    </div>
  );
}
