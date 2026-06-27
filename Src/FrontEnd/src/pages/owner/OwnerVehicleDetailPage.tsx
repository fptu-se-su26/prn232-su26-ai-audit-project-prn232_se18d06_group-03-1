import { ArrowLeft, Car, Bike, Pencil, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVehicleById, toggleVehicleStatus } from "@/features/vehicles/services/vehicleService";
import type { VehicleResponse } from "@/features/vehicles/types";
import ActiveToggle from "@/components/common/ActiveToggle";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function vehicleTypeLabel(value: string) {
  return value === "Car" ? "Ô tô" : "Xe máy";
}

const statusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Hidden: "bg-slate-100 text-slate-500",
};

const statusLabels: Record<string, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Hidden: "Đã ẩn",
};

export default function OwnerVehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    getVehicleById(Number(id))
      .then((data) => setVehicle(data))
      .catch(() => setError("Không thể tải thông tin xe."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleToggleStatus = async () => {
    if (!vehicle) return;
    await toggleVehicleStatus(vehicle.id);
    const updated = await getVehicleById(vehicle.id);
    setVehicle(updated);
  };

  if (isLoading) return <LoadingSpinner />;

  if (error || !vehicle) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-3 text-sm text-red-600">{error ?? "Không tìm thấy xe."}</p>
          <button type="button" onClick={() => navigate("/owner/vehicles")} className="mt-3 rounded-md bg-brand-700 px-4 py-2 text-sm text-white hover:bg-brand-800">Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <button type="button" onClick={() => navigate("/owner/vehicles")} className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-slate-800">Chi tiết xe</h1>
          <p className="text-xs text-slate-500">{vehicle.licensePlate}</p>
        </div>
        {(vehicle.status === "Approved" || vehicle.status === "Hidden") && (
          <ActiveToggle isActive={vehicle.status === "Approved"} itemName={vehicle.licensePlate} onToggle={handleToggleStatus} />
        )}
        <button type="button" onClick={() => navigate(`/owner/vehicles/${vehicle.id}/edit`)} className="inline-flex items-center gap-1.5 rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800">
          <Pencil className="h-4 w-4" /> Sửa
        </button>
      </div>

      <div className="space-y-6 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400">Trạng thái</label>
            <p><span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[vehicle.status] ?? "bg-slate-100 text-slate-600"}`}>{statusLabels[vehicle.status] ?? vehicle.status}</span></p>
          </div>
          {vehicle.rejectionReason && (
            <div className="col-span-2 rounded-md bg-red-50 p-3">
              <label className="text-xs font-medium text-red-600">Lý do từ chối</label>
              <p className="text-sm text-red-700">{vehicle.rejectionReason}</p>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400">Loại xe</label>
            <p className="text-sm font-medium text-slate-800">{vehicleTypeLabel(vehicle.vehicleType)}</p>
          </div>
          <div>
            <label className="text-xs text-slate-400">Năm sản xuất</label>
            <p className="text-sm font-medium text-slate-800">{vehicle.year}</p>
          </div>
          <div>
            <label className="text-xs text-slate-400">Hãng</label>
            <p className="text-sm font-medium text-slate-800">{vehicle.brandName}</p>
          </div>
          <div>
            <label className="text-xs text-slate-400">Dòng xe</label>
            <p className="text-sm font-medium text-slate-800">{vehicle.modelName}</p>
          </div>
          {vehicle.variantName && (
            <div>
              <label className="text-xs text-slate-400">Phiên bản</label>
              <p className="text-sm font-medium text-slate-800">{vehicle.variantName}</p>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400">Biển số</label>
            <p className="text-sm font-medium text-slate-800">{vehicle.licensePlate}</p>
          </div>
          {vehicle.odometerKm != null && (
            <div>
              <label className="text-xs text-slate-400">Số km đã đi</label>
              <p className="text-sm font-medium text-slate-800">{vehicle.odometerKm.toLocaleString("vi-VN")} km</p>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400">Giá thuê</label>
            <p className="text-sm font-semibold text-brand-700">{vehicle.pricePerDay.toLocaleString("vi-VN")}đ/ngày</p>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-400">Địa chỉ</label>
            <p className="text-sm text-slate-800">{vehicle.address}</p>
          </div>
          {vehicle.description && (
            <div className="col-span-2">
              <label className="text-xs text-slate-400">Mô tả</label>
              <p className="text-sm text-slate-600">{vehicle.description}</p>
            </div>
          )}
        </div>

        {vehicle.features.length > 0 && (
          <div>
            <label className="text-xs text-slate-400">Tính năng</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {vehicle.features.map((f) => (
                <span key={f.id} className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{f.name}</span>
              ))}
            </div>
          </div>
        )}

        {vehicle.images.length > 0 && (
          <div>
            <label className="text-xs text-slate-400">Hình ảnh</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {vehicle.images.map((img) => (
                <div key={img.id} className={`relative overflow-hidden rounded-lg border ${img.isPrimary ? "border-brand-500 ring-2 ring-brand-200" : "border-slate-200"}`}>
                  <img src={img.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                  {img.isPrimary && <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Ảnh chính</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
