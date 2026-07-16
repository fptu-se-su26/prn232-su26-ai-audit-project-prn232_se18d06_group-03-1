import { ArrowLeft, Car, Bike, Pencil, AlertCircle, UploadCloud, MapPin, Gauge, FileText, Image as ImageIcon, CheckCircle, XCircle, Eye, Clock, CalendarOff, Plus, Trash2, Loader2, ChevronLeft, ChevronRight, BadgeInfo } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVehicleById, toggleVehicleStatus, uploadVehicleDocument, getBlockedDates, createBlockedDate, deleteBlockedDate, deleteVehicle } from "@/features/vehicles/services/vehicleService";
import { getVehicleAvailability } from "@/features/vehicles/services/publicVehicleService";
import type { VehicleResponse } from "@/features/vehicles/types";
import type { BlockedDateResponse } from "@/features/vehicles/services/vehicleService";
import type { BusyPeriod } from "@/features/vehicles/types";
import ActiveToggle from "@/components/common/ActiveToggle";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import type { ImagePreviewItem } from "@/components/common/ImagePreviewModal";
import Button from "@/components/common/Button";
import { showToast } from "@/components/common/toastStore";
import { Skeleton } from "@/components/common/Skeleton";
import { getVehicleErrorMessage } from "@/features/vehicles/vehicleDisplay";
import MapWithPin from "@/features/locations/components/MapWithPin";

const MONTHS = ["Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6", "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12"];

function splitAreaName(areaName: string | null) {
  if (!areaName) return { province: "-", ward: "-" };
  const [province, ...wardParts] = areaName.split(" - ");
  return {
    province: province?.trim() || "-",
    ward: wardParts.join(" - ").trim() || "-",
  };
}

function formatVnd(value: number | null | undefined) {
  return value != null ? `${value.toLocaleString("vi-VN")}đ` : "-";
}

function vehicleVerificationMessage(message?: string | null) {
  if (!message) return null;
  const normalized = message.toLowerCase();

  if (
    normalized.includes("target machine actively refused") ||
    normalized.includes("connection refused") ||
    normalized.includes("econnrefused") ||
    normalized.includes("127.0.0.1:8001")
  ) {
    return "Không kết nối được tới dịch vụ AI xác thực giấy tờ xe. Vui lòng thử lại sau.";
  }

  if (normalized.includes("timed out") || normalized.includes("timeout")) {
    return "Dịch vụ AI xác thực giấy tờ xe phản hồi quá lâu. Vui lòng thử lại sau.";
  }

  if (normalized.includes("ai vehicle verification returned http")) {
    return "Dịch vụ AI xác thực giấy tờ xe trả về lỗi. Vui lòng thử lại sau.";
  }

  return message;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Pending: { label: "Chờ duyệt", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  Approved: { label: "Đã duyệt", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  Rejected: { label: "Từ chối", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  Hidden: { label: "Đã ẩn", bg: "bg-slate-50", text: "text-slate-500", dot: "bg-slate-400" },
};

const docStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Pending: { label: "Chờ xử lý", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  Verified: { label: "Đã xác thực", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  NeedMoreInfo: { label: "Cần bổ sung", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  ManualReview: { label: "Chờ nhân viên xem", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  Rejected: { label: "Từ chối", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  Failed: { label: "Lỗi xử lý", bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
};

function OwnerVehicleDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={index === 5 ? "col-span-2 space-y-2" : "space-y-2"}>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full max-w-44" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-8 w-44" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-7 w-32 rounded-full" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OwnerVehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedDates, setBlockedDates] = useState<BlockedDateResponse[]>([]);
  const [blockedDatesLoading, setBlockedDatesLoading] = useState(false);
  const [busyPeriods, setBusyPeriods] = useState<BusyPeriod[]>([]);
  const [showAddBlocked, setShowAddBlocked] = useState(false);
  const [newDateFrom, setNewDateFrom] = useState("");
  const [newDateTo, setNewDateTo] = useState("");
  const [newReason, setNewReason] = useState("");
  const [savingBlocked, setSavingBlocked] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [previewImages, setPreviewImages] = useState<ImagePreviewItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    getVehicleById(Number(id))
      .then((data) => {
        setVehicle(data);
        setBlockedDatesLoading(true);
        getBlockedDates(Number(id))
          .then(setBlockedDates)
          .catch(() => {})
          .finally(() => setBlockedDatesLoading(false));
        getVehicleAvailability(Number(id))
          .then((data) => setBusyPeriods(data?.busyPeriods ?? []))
          .catch(() => {});
      })
      .catch(() => setError("Không thể tải thông tin xe."))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleAddBlockedDate() {
    if (!vehicle || !newDateFrom || !newDateTo) return;
    setSavingBlocked(true);
    try {
      const result = await createBlockedDate(vehicle.id, {
        dateFrom: newDateFrom,
        dateTo: newDateTo,
        reason: newReason.trim() || null,
      });
      if (result) setBlockedDates((prev) => [result, ...prev]);
      setShowAddBlocked(false);
      setNewDateFrom("");
      setNewDateTo("");
      setNewReason("");
      showToast({ type: "success", title: "Đã chặn", message: "Ngày đã được chặn thành công." });
    } catch (err: any) {
      showToast({ type: "error", title: "Lỗi", message: err?.response?.data?.message || "Không thể chặn ngày." });
    } finally {
      setSavingBlocked(false);
    }
  }

  async function handleDeleteBlockedDate(blockedDateId: number) {
    try {
      await deleteBlockedDate(blockedDateId);
      setBlockedDates((prev) => prev.filter((b) => b.id !== blockedDateId));
      showToast({ type: "success", title: "Đã xóa", message: "Đã bỏ chặn ngày này." });
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể xóa ngày chặn." });
    }
  }

  const handleToggleStatus = async () => {
    if (!vehicle) return;
    await toggleVehicleStatus(vehicle.id);
    const updated = await getVehicleById(vehicle.id);
    setVehicle(updated);
  };

  const handleDeleteDetail = async () => {
    if (!vehicle) return;
    setDeleting(true);
    try {
      await deleteVehicle(vehicle.id);
      showToast({ type: "success", title: "Đã xóa", message: "Xe đã được xóa thành công." });
      navigate("/owner/vehicles");
    } catch (err: any) {
      showToast({ type: "error", title: "Lỗi", message: err?.response?.data?.message || "Không thể xóa xe." });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const currentDocument = vehicle?.documents.find((doc) => doc.isCurrent) ?? vehicle?.documents[0];
  const canUploadReplacementDocument = !currentDocument
    || ["NeedMoreInfo", "Rejected", "Failed"].includes(currentDocument.verificationStatus);

  const handleDocumentUpload = async () => {
    if (!vehicle || !documentFile) return;
    setIsUploadingDocument(true);
    setDocumentError(null);
    try {
      const updated = await uploadVehicleDocument(vehicle.id, documentFile);
      setVehicle(updated ?? await getVehicleById(vehicle.id));
      setDocumentFile(null);
    } catch (error) {
      setDocumentError(getVehicleErrorMessage(error));
    } finally {
      setIsUploadingDocument(false);
    }
  };

  if (isLoading) return <OwnerVehicleDetailSkeleton />;

  if (error || !vehicle) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <p className="mt-4 text-sm text-red-600">{error ?? "Không tìm thấy xe."}</p>
          <button type="button" onClick={() => navigate("/owner/vehicles")} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-800 hover:shadow-md">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  const sc = statusConfig[vehicle.status] ?? statusConfig.Pending;
  const vehicleArea = splitAreaName(vehicle.areaName);
  const displayPrice = vehicle.currentPricePerDay ?? vehicle.pricePerDay;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vehicle.address)}`;
  const vehicleImages = vehicle.images.map((image, index) => ({
    url: image.imageUrl,
    label: image.isPrimary ? "Ảnh chính" : `Ảnh xe ${index + 1}`,
  }));
  const documentImages = vehicle.documents.map((document, index) => ({
    url: document.fileUrl,
    label: document.isCurrent ? "Cavet hiện tại" : `Cavet ${index + 1}`,
  }));

  function openPreview(images: ImagePreviewItem[], index = 0) {
    setPreviewImages(images);
    setPreviewIndex(index);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button type="button" onClick={() => navigate("/owner/vehicles")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 truncate">{vehicle.brandName} {vehicle.modelName}</h1>
            <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
          </div>
          <p className="text-xs text-slate-500">{vehicle.licensePlate}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(vehicle.status === "Approved" || vehicle.status === "Hidden") && (
            <ActiveToggle isActive={vehicle.status === "Approved"} itemName={vehicle.licensePlate} onToggle={handleToggleStatus} />
          )}
          <button type="button" onClick={() => navigate(`/owner/vehicles/${vehicle.id}/edit`)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm transition-all hover:bg-brand-800 hover:shadow-md" title="Sửa xe">
            <Pencil className="h-4 w-4" />
          </button>
          {vehicle.status !== "Approved" && (
            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500" title="Xóa xe">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {vehicle.rejectionReason && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">Xe đã bị từ chối</p>
            <p className="mt-1 text-sm text-red-600">{vehicle.rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="rounded-xl border border-brand-100 bg-white p-5 shadow-sm shadow-brand-900/5">
            <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50">
                  <Car className="h-3.5 w-3.5 text-brand-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Thông tin xe</h2>
              </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-400">Biển số</label>
                <p className="mt-1 font-semibold text-slate-800">{vehicle.licensePlate}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
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
            {vehicle.features.length > 0 && (
              <>
                <hr className="my-4 border-slate-100" />
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100">
                    <BadgeInfo className="h-3 w-3 text-slate-500" />
                  </div>
                  <span className="text-xs font-semibold text-slate-900">Tính năng ({vehicle.features.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((f) => (
                    <span key={f.id} className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                      <CheckCircle className="h-3 w-3" /> {f.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Địa chỉ</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-800">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <span>{vehicle.address}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{vehicleArea.province}</span>
                {vehicleArea.ward !== "-" && <span>- {vehicleArea.ward}</span>}
                {vehicle.pricingRegionCode && <span className="rounded bg-slate-100 px-2 py-0.5">Mã vùng: {vehicle.pricingRegionCode}</span>}
              </div>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <MapPin className="h-3.5 w-3.5" />
                Mở Google Maps
              </a>
              {vehicle.latitude != null && vehicle.longitude != null && (
                <MapWithPin
                  latitude={Number(vehicle.latitude)}
                  longitude={Number(vehicle.longitude)}
                  address={vehicle.address}
                  className="h-60 w-full rounded-xl z-0"
                />
              )}
            </div>
          </div>

          {showAddBlocked && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50">
                  <Plus className="h-3.5 w-3.5 text-brand-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Chặn ngày mới</h2>
                <button type="button" onClick={() => { setShowAddBlocked(false); setNewDateFrom(""); setNewDateTo(""); setNewReason(""); }} className="ml-auto text-xs text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Từ</label>
                    <input type="date" value={newDateFrom} onChange={(e) => setNewDateFrom(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Đến</label>
                    <input type="date" value={newDateTo} onChange={(e) => setNewDateTo(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Lý do (không bắt buộc)</label>
                  <input type="text" value={newReason} onChange={(e) => setNewReason(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="VD: Bảo dưỡng, đi chơi..." />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => { setShowAddBlocked(false); setNewDateFrom(""); setNewDateTo(""); setNewReason(""); }}>Hủy</Button>
                  <Button type="button" size="sm" onClick={handleAddBlockedDate} disabled={savingBlocked || !newDateFrom || !newDateTo}>
                    {savingBlocked ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang lưu...</> : "Xác nhận chặn"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <CalendarOff className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Các ngày đã chặn</h2>
              </div>
              {!showAddBlocked && (
                <button type="button" onClick={() => setShowAddBlocked(true)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <Plus className="h-3.5 w-3.5" /> Thêm ngày
                </button>
              )}
            </div>

            <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1); }} className="rounded p-0.5 text-slate-400 hover:bg-slate-200"><ChevronLeft className="h-3.5 w-3.5" /></button>
                <span className="text-xs font-semibold text-slate-700">{MONTHS[calMonth]} {calYear}</span>
                <button type="button" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1); }} className="rounded p-0.5 text-slate-400 hover:bg-slate-200"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
                  <div key={d} className="text-[10px] font-medium text-slate-400 py-1">{d}</div>
                ))}
                {(() => {
                  const firstDay = new Date(calYear, calMonth, 1).getDay();
                  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const blockedSet = new Set(blockedDates.flatMap((bd) => {
                    const dates: string[] = [];
                    const start = bd.startDate.slice(0, 10);
                    const end = bd.endDate.slice(0, 10);
                    let [y, m, d] = start.split("-").map(Number);
                    const endStr = end;
                    while (true) {
                      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                      dates.push(dateStr);
                      if (dateStr >= endStr) break;
                      d++;
                      const daysInMonth = new Date(y, m, 0).getDate();
                      if (d > daysInMonth) { d = 1; m++; if (m > 12) { m = 1; y++; } }
                    }
                    return dates;
                  }));
                  const bookedSet = new Set(busyPeriods.filter((bp) => bp.type === "booking").flatMap((bp) => {
                    const dates: string[] = [];
                    const start = bp.startDate.slice(0, 10);
                    const end = bp.endDate.slice(0, 10);
                    let [y, m, d] = start.split("-").map(Number);
                    const endStr = end;
                    while (true) {
                      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                      dates.push(dateStr);
                      if (dateStr >= endStr) break;
                      d++;
                      const daysInMonth = new Date(y, m, 0).getDate();
                      if (d > daysInMonth) { d = 1; m++; if (m > 12) { m = 1; y++; } }
                    }
                    return dates;
                  }));
                  const cells: React.ReactNode[] = [];
                  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} />);
                  for (let d = 1; d <= daysInMonth; d++) {
                    const date = new Date(Date.UTC(calYear, calMonth, d));
                    const dateStr = date.toISOString().slice(0, 10);
                    const isBlocked = blockedSet.has(dateStr);
                    const isBooked = bookedSet.has(dateStr);
                    const isPast = dateStr < todayStr;
                    let cls = "text-slate-600";
                    if (isBlocked) cls = "bg-red-100 text-red-700 font-semibold";
                    else if (isBooked) cls = "bg-amber-100 text-amber-700 font-semibold";
                    else if (isPast) cls = "text-slate-300";
                    cells.push(
                      <div key={d} className={`flex items-center justify-center h-6 text-[11px] rounded ${cls}`}>
                        {d}
                      </div>
                    );
                  }
                  return cells;
                })()}
              </div>
              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-red-100 border border-red-200" /> Đã chặn</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-amber-100 border border-amber-200" /> Đã đặt</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-slate-100 border border-slate-200" /> Còn trống</span>
              </div>
            </div>

            {blockedDatesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : blockedDates.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có ngày chặn nào.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {blockedDates.map((bd) => (
                  <div key={bd.id} className="relative flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-3 pl-4 hover:border-slate-200 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {new Date(bd.startDate).toLocaleDateString("vi-VN")} - {new Date(bd.endDate).toLocaleDateString("vi-VN")}
                      </p>
                      {bd.reason && <p className="mt-0.5 text-xs text-slate-400">{bd.reason}</p>}
                    </div>
                    <button type="button" onClick={() => handleDeleteBlockedDate(bd.id)} className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors" title="Bỏ chặn">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {vehicle.images.length > 0 && (
            <div className="rounded-xl border border-slate-100 bg-[#FAFAFA] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">Hình ảnh ({vehicle.images.length})</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {vehicle.images.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => openPreview(vehicleImages, index)}
                    className={`group relative overflow-hidden rounded-xl border-2 text-left transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${img.isPrimary ? "border-brand-500 ring-2 ring-brand-100" : "border-slate-200"}`}
                  >
                    <img src={img.imageUrl} alt="" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105" />
                    {img.isPrimary && <span className="absolute left-2 top-2 rounded-lg bg-brand-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">Ảnh chính</span>}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                      <Eye className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5 lg:sticky lg:top-5 lg:self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-brand-900/5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Giá thuê</h2>
            <p className="text-2xl font-bold text-brand-700">{displayPrice.toLocaleString("vi-VN")}đ<span className="text-sm font-normal text-slate-400">/ngày</span></p>
            <hr className="my-3 border-slate-100" />
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Thế chấp</span>
                <span className="font-medium text-slate-700">{vehicle.depositPercent > 0 ? `${vehicle.depositPercent}%` : "Không yêu cầu"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Loại xe</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {vehicle.vehicleType === "Car" ? <Car className="h-3 w-3" /> : <Bike className="h-3 w-3" />}
                  {vehicle.vehicleType === "Car" ? "Ô tô" : "Xe máy"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Năm sản xuất</span>
                <span className="font-medium text-slate-700">{vehicle.year}</span>
              </div>
            </div>
            {vehicle.pricingMode === "Auto" ? (
              <div className="mt-3 rounded-lg bg-violet-50 p-3 text-xs text-violet-800">
                <div className="font-semibold">Giá tự động</div>
                <div className="mt-1">Khung owner đặt: {formatVnd(vehicle.autoMinPrice)} - {formatVnd(vehicle.autoMaxPrice)}/ngày</div>
                <div className="mt-1 text-violet-600">Base gợi ý: {formatVnd(vehicle.suggestedBasePrice)} | Gợi ý: {formatVnd(vehicle.suggestedMinPrice)} - {formatVnd(vehicle.suggestedMaxPrice)}</div>
              </div>
            ) : (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                Giá cố định: {formatVnd(vehicle.fixedPricePerDay ?? vehicle.pricePerDay)}/ngày
              </div>
            )}
          </div>

          {currentDocument && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Giấy tờ xe</h2>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${(docStatusConfig[currentDocument.verificationStatus] ?? docStatusConfig.Pending).bg} ${(docStatusConfig[currentDocument.verificationStatus] ?? docStatusConfig.Pending).text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${(docStatusConfig[currentDocument.verificationStatus] ?? docStatusConfig.Pending).dot}`} />
                  {(docStatusConfig[currentDocument.verificationStatus] ?? docStatusConfig.Pending).label}
                </span>
                <button type="button" onClick={() => openPreview(documentImages, Math.max(0, documentImages.findIndex((image) => image.url === currentDocument.fileUrl)))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
                  <Eye className="h-3.5 w-3.5" /> Xem cavet
                </button>
              </div>
              <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Biển số OCR</span>
                  <span className="font-medium text-slate-800">{currentDocument.ocrLicensePlate ?? "-"}</span>
                </div>
                <hr className="border-slate-200" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Hãng</span>
                  <span className="font-medium text-slate-800">{currentDocument.ocrBrand ?? "-"}</span>
                </div>
                <hr className="border-slate-200" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Dòng xe</span>
                  <span className="font-medium text-slate-800">{currentDocument.ocrModel ?? "-"}</span>
                </div>
                <hr className="border-slate-200" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Độ tin cậy</span>
                  <span className="font-medium text-slate-800">{currentDocument.ocrConfidence ?? "-"}</span>
                </div>
              </div>
              {currentDocument.verificationStatus !== "Verified" && currentDocument.decisionReason && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-xs text-red-700">{vehicleVerificationMessage(currentDocument.decisionReason) ?? currentDocument.decisionReason}</p>
                </div>
              )}
            </div>
          )}

          {canUploadReplacementDocument && (
            <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
                  <UploadCloud className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-orange-900">Bổ sung lại giấy tờ xe</h2>
                  <p className="mt-1 text-xs text-orange-700">
                    Hồ sơ hiện tại cần bổ sung hoặc đã bị từ chối. Chọn ảnh cà vẹt mới để hệ thống xác thực lại.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer rounded-lg border border-orange-200 bg-white px-3 py-2 text-xs font-medium text-orange-700 shadow-sm transition-colors hover:bg-orange-50">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          setDocumentFile(event.target.files?.[0] ?? null);
                          setDocumentError(null);
                        }}
                        className="hidden"
                      />
                      Chọn ảnh
                    </label>
                    <button
                      type="button"
                      disabled={!documentFile || isUploadingDocument}
                      onClick={handleDocumentUpload}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-orange-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      {isUploadingDocument ? "Đang gửi..." : "Gửi xác thực lại"}
                    </button>
                  </div>
                  {documentFile && <p className="mt-2 text-xs text-orange-700">Đã chọn: {documentFile.name}</p>}
                  {documentError && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 p-2.5">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                      <p className="text-xs text-red-700">{documentError}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {vehicle.documents.length > 1 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200">
                  <Clock className="h-3 w-3 text-slate-500" />
                </div>
                <h2 className="text-xs font-semibold text-slate-700">Lịch sử giấy tờ</h2>
              </div>
              <div className="space-y-2">
                {vehicle.documents
                  .sort((a, b) => (a.isCurrent ? -1 : b.isCurrent ? 1 : 0))
                  .slice(1).map((doc, index) => {
                    const dc = docStatusConfig[doc.verificationStatus] ?? docStatusConfig.Pending;
                    return (
                      <div key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs text-slate-600">Lần {index + 2}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${dc.bg} ${dc.text}`}>{dc.label}</span>
                        </div>
                        <button type="button" onClick={() => openPreview(documentImages, Math.max(0, documentImages.findIndex((image) => image.url === doc.fileUrl)))} className="text-xs font-medium text-brand-700 hover:text-brand-800">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Xóa xe</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Hủy</button>
              <button type="button" onClick={handleDeleteDetail} disabled={deleting} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
