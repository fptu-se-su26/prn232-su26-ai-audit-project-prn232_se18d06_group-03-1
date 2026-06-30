import { ArrowLeft, Car, Check, Eye, FileText, Image as ImageIcon, MapPin, Search, X, CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import type { ImagePreviewItem } from "@/components/common/ImagePreviewModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import { Skeleton } from "@/components/common/Skeleton";
import {
  approveVehicleDocument,
  approveVehicleListing,
  getModerationVehicleById,
  getModerationVehicles,
  rejectVehicleDocument,
  rejectVehicleListing,
  requestVehicleDocumentMoreInfo,
} from "@/features/vehicles/services/vehicleService";
import type { VehicleModerationDetailResponse, VehicleModerationListItem } from "@/features/vehicles/types";

type Role = "staff" | "admin";
type ModerationMode = "documents" | "listings";

function getModePath(role: Role, mode?: ModerationMode) {
  if (mode === "documents") return `/${role}/vehicle-documents`;
  if (mode === "listings") return `/${role}/vehicle-listings`;
  return `/${role}/vehicles`;
}

function getModeDefaults(mode?: ModerationMode) {
  if (mode === "documents") {
    return {
      title: "Duyệt hồ sơ xe",
      description: "Kiểm tra cà vẹt, OCR và kết quả xác thực AI.",
      status: "",
      documentStatus: "Pending,ManualReview,NeedMoreInfo,Failed,Rejected",
    };
  }

  if (mode === "listings") {
    return {
      title: "Duyệt bài đăng xe",
      description: "Duyệt bài đăng sau khi hồ sơ xe đã xác thực.",
      status: "Pending,Approved,Rejected",
      documentStatus: "Verified",
    };
  }

  return {
    title: "Duyệt xe",
    description: "Kiểm tra hồ sơ xe và bài đăng trước khi hiển thị.",
    status: "",
    documentStatus: "",
  };
}

const vehicleStatusCfg: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Pending: { label: "Chờ duyệt", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  Approved: { label: "Đã duyệt", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  Rejected: { label: "Từ chối", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  Hidden: { label: "Đã ẩn", bg: "bg-slate-50", text: "text-slate-500", dot: "bg-slate-400" },
};

const docStatusCfg: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Pending: { label: "Chờ xử lý", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  Verified: { label: "Đã xác thực", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  NeedMoreInfo: { label: "Cần bổ sung", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  ManualReview: { label: "Cần xem", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  Rejected: { label: "Từ chối", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  Failed: { label: "Lỗi", bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
};

const recommendationLabels: Record<string, string> = {
  Pass: "Đã xác thực tự động",
  NeedMoreInfo: "Cần bổ sung",
  ManualReview: "Cần nhân viên xem",
  Reject: "Từ chối tự động",
};

const flagLabels: Record<string, string> = {
  IMAGE_TOO_BLURRY: "Ảnh hơi mờ",
  IMAGE_TOO_SMALL: "Ảnh quá nhỏ",
  DOCUMENT_NOT_READABLE: "Không đọc rõ giấy tờ",
  NO_TEXT_DETECTED: "Không phát hiện chữ",
  OCR_ENGINE_UNAVAILABLE: "Máy OCR không khả dụng",
  OCR_PROCESSING_FAILED: "Lỗi xử lý OCR",
  LOW_OCR_CONFIDENCE: "Độ tin cậy OCR thấp",
  LICENSE_PLATE_NOT_FOUND: "Không tìm thấy biển số",
  LICENSE_PLATE_MISMATCH_CLEAR: "Biển số không khớp",
  BRAND_NOT_FOUND: "Không tìm thấy hãng xe",
  BRAND_MISMATCH_CLEAR: "Hãng xe không khớp",
  MODEL_NOT_FOUND: "Không tìm thấy dòng xe",
  MODEL_MISMATCH_CLEAR: "Dòng xe không khớp",
  VEHICLE_TYPE_UNCERTAIN: "Loại xe chưa chắc chắn",
  VEHICLE_TYPE_MISMATCH_SIGNAL: "Tín hiệu loại xe chưa khớp",
};

function visibleLogFlags(recommendation?: string | null, flags: string[] = []) {
  if (recommendation === "Pass") return [];
  return flags;
}

function splitAreaName(areaName: string | null) {
  if (!areaName) return { province: "-", ward: "-" };
  const [province, ...wardParts] = areaName.split(" - ");
  return {
    province: province?.trim() || "-",
    ward: wardParts.join(" - ").trim() || "-",
  };
}

function logText(recommendation?: string | null, flags: string[] = [], message?: string | null, errorMessage?: string | null) {
  const translatedFlags = visibleLogFlags(recommendation, flags).map((flag) => flagLabels[flag] ?? flag);
  if (translatedFlags.length > 0) return translatedFlags.join(", ");
  if (errorMessage) return errorMessage;
  if (recommendation === "Pass") return "OCR đọc tốt, các thông tin chính đã khớp.";
  return message ?? "-";
}

export default function VehicleModerationPage({ role, mode }: { role: Role; mode?: ModerationMode }) {
  const { id } = useParams();
  return id ? <VehicleModerationDetail role={role} mode={mode} id={Number(id)} /> : <VehicleModerationList role={role} mode={mode} />;
}

function VehicleModerationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50/50 p-4 shadow-sm">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className={index === 6 ? "col-span-2 space-y-2" : "space-y-2"}>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full max-w-44" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
            <div className="space-y-4 p-5">
              <div className="flex gap-2">
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-14 w-full rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleModerationList({ role, mode }: { role: Role; mode?: ModerationMode }) {
  const navigate = useNavigate();
  const defaults = getModeDefaults(mode);
  const [items, setItems] = useState<VehicleModerationListItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState(defaults.status);
  const [documentStatus, setDocumentStatus] = useState(defaults.documentStatus);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    const nextDefaults = getModeDefaults(mode);
    setStatus(nextDefaults.status);
    setDocumentStatus(nextDefaults.documentStatus);
  }, [mode]);

  useEffect(() => {
    setLoading(true);
    getModerationVehicles(role, { keyword, status, documentStatus, page: 1, pageSize: 20 })
      .then((data) => setItems(data.items))
      .finally(() => setLoading(false));
  }, [role, keyword, status, documentStatus]);

  async function handleApprove(vehicleId: number) {
    await approveVehicleListing(role, vehicleId);
    const data = await getModerationVehicles(role, { keyword, status, documentStatus, page: 1, pageSize: 20 });
    setItems(data.items);
  }

  async function handleReject() {
    if (!rejectModal || !rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      await rejectVehicleListing(role, rejectModal.id, rejectReason.trim());
      setRejectModal(null);
      setRejectReason("");
      const data = await getModerationVehicles(role, { keyword, status, documentStatus, page: 1, pageSize: 20 });
      setItems(data.items);
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50/50 p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">{defaults.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{defaults.description}</p>
      </div>
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm biển số, mô tả..." className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100" />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100">
          <option value="">Tất cả bài đăng</option>
          <option value="Pending,Approved,Rejected">Chờ duyệt / Đã duyệt / Từ chối</option>
          <option value="Pending">Chờ duyệt</option>
          <option value="Approved">Đã duyệt</option>
          <option value="Rejected">Từ chối</option>
        </select>
        <select value={documentStatus} onChange={(event) => setDocumentStatus(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100">
          <option value="">Tất cả giấy tờ</option>
          <option value="Pending,ManualReview,NeedMoreInfo,Failed,Rejected">Cần xử lý / Từ chối</option>
          <option value="Verified">Đã xác thực</option>
          <option value="ManualReview">Cần xem</option>
          <option value="NeedMoreInfo">Cần bổ sung</option>
          <option value="Rejected">Từ chối</option>
          <option value="Failed">Lỗi</option>
        </select>
      </div>
      {loading ? (
        <div className="flex min-h-[calc(100vh-260px)] items-center justify-center">
          <LoadingSpinner className="h-8 w-8 text-violet-300" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Xe</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Biển số</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Bài đăng</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Giấy tờ</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                        <Car className="h-4 w-4 text-slate-500" />
                      </div>
                      <span className="font-medium text-slate-800">{item.brandName} {item.modelName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-sm font-medium text-slate-600">{item.licensePlate}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${(vehicleStatusCfg[item.status] ?? vehicleStatusCfg.Pending).bg} ${(vehicleStatusCfg[item.status] ?? vehicleStatusCfg.Pending).text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${(vehicleStatusCfg[item.status] ?? vehicleStatusCfg.Pending).dot}`} />
                      {(vehicleStatusCfg[item.status] ?? vehicleStatusCfg.Pending).label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {item.documentStatus ? (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${(docStatusCfg[item.documentStatus] ?? docStatusCfg.Pending).bg} ${(docStatusCfg[item.documentStatus] ?? docStatusCfg.Pending).text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${(docStatusCfg[item.documentStatus] ?? docStatusCfg.Pending).dot}`} />
                        {(docStatusCfg[item.documentStatus] ?? docStatusCfg.Pending).label}
                      </span>
                    ) : <span className="text-xs text-slate-400">Chưa có</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => navigate(`${getModePath(role, mode)}/${item.id}`)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50">
                        <Eye className="h-3.5 w-3.5" /> Xem
                      </button>
                      {item.status === "Pending" && (
                        <>
                          <button type="button" onClick={() => handleApprove(item.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow">
                            <Check className="h-3.5 w-3.5" /> Duyệt
                          </button>
                          <button type="button" onClick={() => { setRejectModal({ id: item.id, name: `${item.brandName} ${item.modelName}` }); setRejectReason(""); }} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-red-700 hover:shadow">
                            <X className="h-3.5 w-3.5" /> Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Không có xe nào.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!rejectModal} title="Từ chối bài đăng" onClose={() => { setRejectModal(null); setRejectReason(""); }}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Nhập lý do từ chối bài đăng <strong>{rejectModal?.name}</strong>:</p>
          <div>
            <label className="text-sm font-medium text-slate-700">Lý do <span className="text-red-500">*</span></label>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Nhập lý do từ chối..."
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm outline-none transition-all focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setRejectModal(null); setRejectReason(""); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">Hủy</button>
            <button
              type="button"
              disabled={!rejectReason.trim() || isRejecting}
              onClick={handleReject}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRejecting ? "Đang xử lý..." : "Xác nhận từ chối"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function VehicleModerationDetail({ role, mode, id }: { role: Role; mode?: ModerationMode; id: number }) {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleModerationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [previewImages, setPreviewImages] = useState<ImagePreviewItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [reasonModal, setReasonModal] = useState<{ title: string; confirmLabel: string; confirmColor: "red" | "orange"; action: (reason: string) => Promise<void> } | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [isSubmittingReason, setIsSubmittingReason] = useState(false);
  const currentDocument = vehicle?.documents.find((doc) => doc.isCurrent) ?? vehicle?.documents[0];
  const latestLog = vehicle?.verificationLogs[vehicle?.verificationLogs.length - 1];

  async function reload() {
    setLoading(true);
    const data = await getModerationVehicleById(role, id);
    setVehicle(data ?? null);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, [role, id]);

  async function handleConfirmReason() {
    if (!reasonModal || !reasonText.trim()) return;
    setIsSubmittingReason(true);
    try {
      await reasonModal.action(reasonText.trim());
      setReasonModal(null);
      setReasonText("");
      await reload();
    } finally {
      setIsSubmittingReason(false);
    }
  }

  if (loading) return <VehicleModerationDetailSkeleton />;
  if (!vehicle) return null;

  const sc = vehicleStatusCfg[vehicle.status] ?? vehicleStatusCfg.Pending;
  const vehicleArea = splitAreaName(vehicle.areaName);
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
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50/50 p-4 shadow-sm">
        <button type="button" onClick={() => navigate(getModePath(role, mode))} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900 truncate">{vehicle.brandName} {vehicle.modelName}</h1>
          <p className="text-sm text-slate-500">{vehicle.licensePlate}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
          {sc.label}
        </span>
        {vehicle.status === "Approved" ? (
          <button type="button" onClick={() => setReasonModal({ title: "Thu hồi duyệt bài", confirmLabel: "Xác nhận thu hồi", confirmColor: "red", action: (reason) => rejectVehicleListing(role, vehicle.id, reason) })} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md">
            <X className="h-4 w-4" /> Thu hồi duyệt
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={async () => { await approveVehicleListing(role, vehicle.id); await reload(); }} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md">
              <Check className="h-4 w-4" /> Duyệt bài
            </button>
            <button type="button" onClick={() => setReasonModal({ title: "Từ chối bài đăng", confirmLabel: "Từ chối", confirmColor: "red", action: (reason) => rejectVehicleListing(role, vehicle.id, reason) })} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md">
              <X className="h-4 w-4" /> Từ chối bài
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                <Car className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Thông tin xe</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 text-sm">
              <div>
                <span className="text-xs font-medium text-slate-400">Loại xe</span>
                <p className="mt-1 font-medium text-slate-800">{vehicle.vehicleType === "Car" ? "Ô tô" : "Xe máy"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400">Chủ xe</span>
                <p className="mt-1 font-medium text-slate-800">{vehicle.ownerName || `#${vehicle.ownerId}`}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400">Giá thuê</span>
                <p className="mt-1 font-semibold text-brand-700">{vehicle.pricePerDay.toLocaleString("vi-VN")}đ/ngày</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400">Tỉnh/Thành phố</span>
                <p className="mt-1 font-medium text-slate-800">{vehicleArea.province}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400">Phường/Xã</span>
                <p className="mt-1 font-medium text-slate-800">
                  {vehicleArea.ward}
                  {vehicle.pricingRegionCode && <span className="ml-1 text-xs font-normal text-slate-400">({vehicle.pricingRegionCode})</span>}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400">Biển số</span>
                <p className="mt-1 font-mono font-medium text-slate-800">{vehicle.licensePlate}</p>
              </div>
              <div className="col-span-2">
                <span className="flex items-center gap-1 text-xs font-medium text-slate-400"><MapPin className="h-3 w-3" /> Địa chỉ</span>
                <p className="mt-1 text-slate-800">{vehicle.address}</p>
              </div>
              {vehicle.description && (
                <div className="col-span-2">
                  <span className="text-xs font-medium text-slate-400">Mô tả xe</span>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{vehicle.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Ảnh xe ({vehicle.images.length})</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {vehicle.images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => openPreview(vehicleImages, index)}
                  className="group relative overflow-hidden rounded-xl border border-slate-200 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <img src={image.imageUrl} alt="" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                    <Eye className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Hồ sơ xe</h2>
              </div>
              <button type="button" onClick={() => setShowLogModal(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100">
                <Clock className="h-3.5 w-3.5" /> Log ({vehicle.verificationLogs.length})
              </button>
            </div>
            {currentDocument ? (
              <div className="space-y-4 p-5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${(docStatusCfg[currentDocument.verificationStatus] ?? docStatusCfg.Pending).bg} ${(docStatusCfg[currentDocument.verificationStatus] ?? docStatusCfg.Pending).text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${(docStatusCfg[currentDocument.verificationStatus] ?? docStatusCfg.Pending).dot}`} />
                    {(docStatusCfg[currentDocument.verificationStatus] ?? docStatusCfg.Pending).label}
                  </span>
                  <button type="button" onClick={() => openPreview(documentImages, Math.max(0, documentImages.findIndex((image) => image.url === currentDocument.fileUrl)))} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100">
                    <Eye className="h-3.5 w-3.5" /> Xem cavet
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                  <div><span className="text-xs font-medium text-slate-400">Biển số OCR</span><p className="mt-0.5 font-medium text-slate-800">{currentDocument.ocrLicensePlate ?? "-"}</p></div>
                  <div><span className="text-xs font-medium text-slate-400">Hãng OCR</span><p className="mt-0.5 font-medium text-slate-800">{currentDocument.ocrBrand ?? "-"}</p></div>
                  <div><span className="text-xs font-medium text-slate-400">Dòng xe OCR</span><p className="mt-0.5 font-medium text-slate-800">{currentDocument.ocrModel ?? "-"}</p></div>
                  <div><span className="text-xs font-medium text-slate-400">Độ tin cậy</span><p className="mt-0.5 font-medium text-slate-800">{currentDocument.ocrConfidence ?? "-"}</p></div>
                </div>
                {currentDocument.verificationStatus !== "Verified" && currentDocument.decisionReason && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-sm text-red-700">{currentDocument.decisionReason}</p>
                  </div>
                )}
                {currentDocument.verificationStatus !== "Verified" && latestLog && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <p className="text-xs text-amber-700">{logText(latestLog.recommendation, latestLog.flags, latestLog.message, latestLog.errorMessage)}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {currentDocument.verificationStatus === "Verified" ? (
                    <button type="button" onClick={() => setReasonModal({ title: "Thu hồi xác thực cavet", confirmLabel: "Xác nhận thu hồi", confirmColor: "red", action: (reason) => rejectVehicleDocument(role, vehicle.id, currentDocument.id, reason) })} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 hover:shadow">Thu hồi xác thực</button>
                  ) : (
                    <>
                      <button type="button" onClick={async () => { await approveVehicleDocument(role, vehicle.id, currentDocument.id); await reload(); }} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow">Duyệt hồ sơ</button>
                      <button type="button" onClick={() => setReasonModal({ title: "Từ chối hồ sơ", confirmLabel: "Từ chối", confirmColor: "red", action: (reason) => rejectVehicleDocument(role, vehicle.id, currentDocument.id, reason) })} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 hover:shadow">Từ chối</button>
                      <button type="button" onClick={() => setReasonModal({ title: "Yêu cầu bổ sung", confirmLabel: "Gửi yêu cầu", confirmColor: "orange", action: (reason) => requestVehicleDocumentMoreInfo(role, vehicle.id, currentDocument.id, reason) })} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">Bổ sung</button>
                    </>
                  )}
                </div>
              </div>
            ) : <p className="p-5 text-sm text-slate-400">Chưa có cavet.</p>}
          </div>

          {showLogModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowLogModal(false)}>
              <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <Clock className="h-4 w-4 text-slate-400" /> Lịch sử duyệt
                  </h2>
                  <button type="button" onClick={() => setShowLogModal(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-2">
                  {[...vehicle.verificationLogs].reverse().map((log) => (
                    <div key={log.id ?? log.createdAt} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">{recommendationLabels[log.recommendation ?? ""] ?? log.recommendation ?? "Log"}</p>
                        <span className="shrink-0 text-slate-400">{new Date(log.createdAt).toLocaleString("vi-VN")}</span>
                      </div>
                      <p className="mt-1">{logText(log.recommendation, log.flags, log.message, log.errorMessage)}</p>
                    </div>
                  ))}
                  {vehicle.verificationLogs.length === 0 && <p className="text-sm text-slate-400">Chưa có lịch sử.</p>}
                </div>
              </div>
            </div>
          )}

          <Modal isOpen={!!reasonModal} title={reasonModal?.title ?? ""} onClose={() => { setReasonModal(null); setReasonText(""); }}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Lý do <span className="text-red-500">*</span></label>
                <textarea
                  value={reasonText}
                  onChange={(event) => setReasonText(event.target.value)}
                  placeholder="Nhập lý do..."
                  rows={3}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setReasonModal(null); setReasonText(""); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">Hủy</button>
                <button
                  type="button"
                  disabled={!reasonText.trim() || isSubmittingReason}
                  onClick={handleConfirmReason}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow disabled:cursor-not-allowed disabled:opacity-50 ${reasonModal?.confirmColor === "red" ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}`}
                >
                  {isSubmittingReason ? "Đang xử lý..." : reasonModal?.confirmLabel}
                </button>
              </div>
            </div>
          </Modal>

          <ImagePreviewModal
            images={previewImages}
            index={previewIndex}
            onIndexChange={setPreviewIndex}
            onClose={() => setPreviewImages([])}
          />
        </div>
      </div>
    </div>
  );
}
