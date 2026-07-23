import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/common/Skeleton";
import { getAdminOwnerVehicles } from "@/features/admin/services/adminPostManagementService";
import { getAdminUserById } from "@/features/admin/services/adminUserService";
import type { AdminOwnerVehicleListItem, PagedResult } from "@/features/admin/types";
import CreateVehicleModal from "@/features/admin/components/CreateVehicleModal";
import { ChevronLeft, ChevronRight, Plus, Car, Bike, ArrowLeft } from "lucide-react";
import fallbackImg from "../../../Logo/logo.png";

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

function compactNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

export default function AdminOwnerVehicleListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ownerId } = useParams<{ ownerId: string }>();
  const numericOwnerId = Number(ownerId);

  const [data, setData] = useState<PagedResult<AdminOwnerVehicleListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(true);
  const [vehicleType, setVehicleType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    if (!numericOwnerId) return;
    let cancelled = false;
    setOwnerLoading(true);
    getAdminUserById(numericOwnerId)
      .then((user) => { if (!cancelled && user) setOwnerName(user.fullName); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setOwnerLoading(false); });
    return () => { cancelled = true; };
  }, [numericOwnerId]);

  useEffect(() => {
    if (!numericOwnerId) return;
    let cancelled = false;
    setLoading(true);
    getAdminOwnerVehicles(numericOwnerId, { vehicleType: vehicleType || undefined, page, pageSize })
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [numericOwnerId, vehicleType, page]);

  const displayName = ownerName || `chủ xe #${numericOwnerId}`;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/posts/owners")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {ownerLoading ? (
                <Skeleton className="inline-block h-7 w-48 align-middle" />
              ) : (
                `Xe của ${displayName}`
              )}
            </h1>
            <p className="text-sm text-slate-500">Danh sách xe. Nhấn &ldquo;Thêm xe&rdquo; để tạo tin đăng mới.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Thêm xe
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1">
          {[
            { value: "", label: "Tất cả" },
            { value: "Car", label: "Ô tô" },
            { value: "Motorbike", label: "Xe máy" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setVehicleType(opt.value); setPage(1); }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                vehicleType === opt.value ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {opt.value === "Car" && <Car className="h-3.5 w-3.5" />}
              {opt.value === "Motorbike" && <Bike className="h-3.5 w-3.5" />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.items ?? []).map((vehicle) => (
              <div
                key={vehicle.id}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                onClick={() => navigate(`/admin/vehicle-listings/${vehicle.id}`, { state: { from: location.pathname } })}
              >
                {vehicle.featuredImage ? (
                  <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                    <img src={vehicle.featuredImage} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" onError={(e) => { e.currentTarget.src = fallbackImg; }} />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center bg-slate-50">
                    {vehicle.vehicleType === "Car" ? <Car className="h-10 w-10 text-slate-300" /> : <Bike className="h-10 w-10 text-slate-300" />}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{vehicle.brandName} {vehicle.modelName}</h3>
                      {vehicle.variantName && <p className="text-xs text-slate-500 truncate">{vehicle.variantName}</p>}
                    </div>
                    {statusBadge(vehicle.status)}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono">{vehicle.licensePlate}</span>
                    <span>{vehicle.year}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-brand-700">{compactNumber(vehicle.pricePerDay)}đ/ngày</span>
                    <span className="text-xs text-slate-400">{new Date(vehicle.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              </div>
            ))}
            {data?.items.length === 0 && (
              <div className="col-span-full py-10 text-center text-sm text-slate-400">Chủ xe chưa có xe nào.</div>
            )}
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

      {showCreateModal && (
        <CreateVehicleModal
          ownerId={numericOwnerId}
          ownerName={displayName}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); setPage(1); }}
        />
      )}
    </div>
  );
}
