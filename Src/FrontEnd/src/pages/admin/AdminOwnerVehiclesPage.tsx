import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/common/Skeleton";
import { getAdminOwnersWithVehicles } from "@/features/admin/services/adminPostManagementService";
import type { AdminOwnerListItem, PagedResult } from "@/features/admin/types";
import { Search, Car, Bike, ChevronLeft, ChevronRight, ShieldCheck, Eye } from "lucide-react";

export default function AdminOwnerVehiclesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PagedResult<AdminOwnerListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminOwnersWithVehicles({ keyword: keyword || undefined, page, pageSize })
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [keyword, page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Xe của chủ xe</h1>
        <p className="text-sm text-slate-500">Quản lý xe theo từng chủ xe. Nhấn vào chủ xe để xem danh sách xe.</p>
      </div>

      <form onSubmit={handleSearch} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </form>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                  <th className="px-5 py-3">Chủ xe</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Số điện thoại</th>
                  <th className="px-5 py-3 text-center">Xác thực</th>
                  <th className="px-5 py-3 text-center">Tổng xe</th>
                  <th className="px-5 py-3 text-center">Ô tô</th>
                  <th className="px-5 py-3 text-center">Xe máy</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data?.items ?? []).map((owner) => (
                  <tr
                    key={owner.userId}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/posts/owners/${owner.userId}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {owner.avatarUrl ? (
                          <img src={owner.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                            {owner.fullName.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-slate-800">{owner.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{owner.email ?? "-"}</td>
                    <td className="px-5 py-3 text-slate-600">{owner.phone ?? "-"}</td>
                    <td className="px-5 py-3 text-center">
                      {owner.isVerified ? (
                        <ShieldCheck className="mx-auto h-4 w-4 text-emerald-500" />
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center font-semibold text-slate-800">{owner.totalVehicles}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                        <Car className="h-3.5 w-3.5" /> {owner.carCount}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                        <Bike className="h-3.5 w-3.5" /> {owner.motorbikeCount}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/posts/owners/${owner.userId}`); }}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> Xem xe
                      </button>
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">Không tìm thấy chủ xe nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Hiển thị {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, data.totalCount)} / {data.totalCount}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Trước
                </button>
                <span className="text-xs text-slate-500">{page} / {data.totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Sau <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
