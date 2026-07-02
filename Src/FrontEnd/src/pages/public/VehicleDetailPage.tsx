import { ArrowLeft, Car, Bike, AlertCircle, MapPin, Gauge, BadgeInfo, Image as ImageIcon, CheckCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPublicVehicleById } from "@/features/vehicles/services/publicVehicleService";
import type { VehicleResponse } from "@/features/vehicles/types";
import { Skeleton } from "@/components/common/Skeleton";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import type { ImagePreviewItem } from "@/components/common/ImagePreviewModal";
import Button from "@/components/common/Button";

function formatVnd(value: number | null | undefined) {
  return value != null ? `${value.toLocaleString("vi-VN")}đ` : "-";
}

function VehicleDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Skeleton className="aspect-[16/9] w-full rounded-xl" />
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <Skeleton className="mb-4 h-5 w-28" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<ImagePreviewItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    getPublicVehicleById(Number(id))
      .then((data) => setVehicle(data))
      .catch(() => setError("Không thể tải thông tin xe."))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <VehicleDetailSkeleton />;

  if (error || !vehicle) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <p className="mt-4 text-sm text-red-600">{error ?? "Không tìm thấy xe."}</p>
          <button type="button" onClick={() => navigate("/xe")} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-800">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  const displayPrice = vehicle.currentPricePerDay ?? vehicle.pricePerDay;
  const vehicleImages = vehicle.images.map((img, idx) => ({
    url: img.imageUrl,
    label: img.isPrimary ? "Ảnh chính" : `Ảnh ${idx + 1}`,
  }));

  function openPreview(images: ImagePreviewItem[], index = 0) {
    setPreviewImages(images);
    setPreviewIndex(index);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate("/xe")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{vehicle.brandName} {vehicle.modelName}</h1>
          <p className="text-xs text-slate-500">{vehicle.licensePlate}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {vehicle.images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => openPreview(vehicleImages, 0)}
                className="col-span-4 overflow-hidden rounded-xl bg-slate-100"
              >
                <img src={vehicle.images[0].imageUrl} alt="" className="aspect-[16/9] w-full object-cover transition-transform duration-300 hover:scale-105" />
              </button>
              {vehicle.images.slice(1, 5).map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => openPreview(vehicleImages, idx + 1)}
                  className="overflow-hidden rounded-lg bg-slate-100"
                >
                  <img src={img.imageUrl} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-slate-100">
              {vehicle.vehicleType === "Car" ? <Car className="h-16 w-16 text-slate-300" /> : <Bike className="h-16 w-16 text-slate-300" />}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                <Car className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Thông tin xe</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400">Biển số</label>
                <p className="mt-1 font-semibold text-slate-800">{vehicle.licensePlate}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">Dòng xe</label>
                <p className="mt-1 font-medium text-slate-800">{vehicle.brandName} {vehicle.modelName}</p>
                {vehicle.variantName && <p className="text-xs text-slate-400">{vehicle.variantName}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">Năm sản xuất</label>
                <p className="mt-1 font-medium text-slate-800">{vehicle.year}</p>
              </div>
              {vehicle.odometerKm != null && (
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-400"><Gauge className="h-3 w-3" /> Số km đã đi</label>
                  <p className="mt-1 font-medium text-slate-800">{vehicle.odometerKm.toLocaleString("vi-VN")} km</p>
                </div>
              )}
              {vehicle.description && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400">Mô tả</label>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{vehicle.description}</p>
                </div>
              )}
            </div>
          </div>

          {vehicle.features.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <BadgeInfo className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Tính năng</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((f) => (
                  <span key={f.id} className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                    <CheckCircle className="h-3 w-3" /> {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Địa điểm</h2>
            </div>
            <p className="text-sm text-slate-800">{vehicle.address}</p>
            {vehicle.areaName && <p className="mt-1 text-xs text-slate-500">{vehicle.areaName}</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Giá thuê</h2>
            <p className="mt-2 text-2xl font-bold text-brand-700">
              {displayPrice.toLocaleString("vi-VN")}đ<span className="text-sm font-normal text-slate-400">/ngày</span>
            </p>
            <div className="mt-3 flex items-center gap-2">
              {vehicle.vehicleType === "Car" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"><Car className="h-3 w-3" /> Ô tô</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"><Bike className="h-3 w-3" /> Xe máy</span>
              )}
              <span className="text-xs text-slate-400">{vehicle.year}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Liên hệ</h2>
            <p className="mt-2 text-xs text-slate-500">Vui lòng đăng nhập để đặt xe hoặc liên hệ chủ xe.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button type="button" onClick={() => navigate("/login")}>
                <Phone className="h-4 w-4" /> Đăng nhập để đặt xe
              </Button>
            </div>
          </div>

          {vehicle.images.length > 1 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Tất cả ảnh ({vehicle.images.length})</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {vehicle.images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => openPreview(vehicleImages, idx)}
                    className="overflow-hidden rounded-lg bg-slate-100"
                  >
                    <img src={img.imageUrl} alt="" className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ImagePreviewModal
        images={previewImages}
        index={previewIndex}
        onIndexChange={setPreviewIndex}
        onClose={() => setPreviewImages([])}
      />
    </div>
  );
}