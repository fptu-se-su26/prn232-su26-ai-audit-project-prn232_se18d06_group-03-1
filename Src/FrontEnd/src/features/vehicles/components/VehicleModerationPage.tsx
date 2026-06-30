import { ArrowLeft, Car, Check, Eye, FileText, Image as ImageIcon, MapPin, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import type { ImagePreviewItem } from "@/components/common/ImagePreviewModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
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

const vehicleStatusLabels: Record<string, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Hidden: "Đã ẩn",
};

const documentStatusLabels: Record<string, string> = {
  Pending: "Chờ xử lý",
  Verified: "Đã xác thực",
  NeedMoreInfo: "Cần bổ sung",
  ManualReview: "Cần xem",
  Rejected: "Từ chối",
  Failed: "Lỗi",
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

function badgeClass(value?: string | null) {
  if (value === "Approved" || value === "Verified") return "bg-green-100 text-green-700";
  if (value === "Rejected") return "bg-red-100 text-red-700";
  if (value === "ManualReview") return "bg-blue-100 text-blue-700";
  if (value === "NeedMoreInfo") return "bg-orange-100 text-orange-700";
  return "bg-amber-100 text-amber-700";
}

export default function VehicleModerationPage({ role, mode }: { role: Role; mode?: ModerationMode }) {
  const { id } = useParams();
  return id ? <VehicleModerationDetail role={role} mode={mode} id={Number(id)} /> : <VehicleModerationList role={role} mode={mode} />;
}

function VehicleModerationList({ role, mode }: { role: Role; mode?: ModerationMode }) {
  const navigate = useNavigate();
  const defaults = getModeDefaults(mode);
  const [items, setItems] = useState<VehicleModerationListItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState(defaults.status);
  const [documentStatus, setDocumentStatus] = useState(defaults.documentStatus);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{defaults.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{defaults.description}</p>
      </div>
      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm biển số, mô tả..." className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-brand-500" />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500">
          <option value="">Tất cả bài đăng</option>
          <option value="Pending,Approved,Rejected">Chờ duyệt / Đã duyệt / Từ chối</option>
          <option value="Pending">Chờ duyệt</option>
          <option value="Approved">Đã duyệt</option>
          <option value="Rejected">Từ chối</option>
        </select>
        <select value={documentStatus} onChange={(event) => setDocumentStatus(event.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500">
          <option value="">Tất cả giấy tờ</option>
          <option value="Pending,ManualReview,NeedMoreInfo,Failed,Rejected">Cần xử lý / Từ chối</option>
          <option value="Verified">Đã xác thực</option>
          <option value="ManualReview">Cần xem</option>
          <option value="NeedMoreInfo">Cần bổ sung</option>
          <option value="Rejected">Từ chối</option>
          <option value="Failed">Lỗi</option>
        </select>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Xe</th>
                <th className="px-4 py-3">Biển số</th>
                <th className="px-4 py-3">Bài đăng</th>
                <th className="px-4 py-3">Giấy tờ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.brandName} {item.modelName}</td>
                  <td className="px-4 py-3 text-slate-600">{item.licensePlate}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${badgeClass(item.status)}`}>{vehicleStatusLabels[item.status] ?? item.status}</span></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${badgeClass(item.documentStatus)}`}>{documentStatusLabels[item.documentStatus ?? ""] ?? item.documentStatus ?? "Chưa có"}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => navigate(`${getModePath(role, mode)}/${item.id}`)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                      <Eye className="h-4 w-4" /> Xem
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Không có xe nào.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
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

  if (loading) return <LoadingSpinner />;
  if (!vehicle) return null;

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
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(getModePath(role, mode))} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{vehicle.brandName} {vehicle.modelName}</h1>
          <p className="text-sm text-slate-500">{vehicle.licensePlate}</p>
        </div>
        {vehicle.status === "Approved" ? (
          <button type="button" onClick={() => setReasonModal({ title: "Thu hồi duyệt bài", confirmLabel: "Xác nhận thu hồi", confirmColor: "red", action: (reason) => rejectVehicleListing(role, vehicle.id, reason) })} className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
            <X className="h-4 w-4" /> Thu hồi duyệt
          </button>
        ) : (
          <>
            <button type="button" onClick={async () => { await approveVehicleListing(role, vehicle.id); await reload(); }} className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
              <Check className="h-4 w-4" /> Duyệt bài
            </button>
            <button type="button" onClick={() => setReasonModal({ title: "Từ chối bài đăng", confirmLabel: "Từ chối", confirmColor: "red", action: (reason) => rejectVehicleListing(role, vehicle.id, reason) })} className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
              <X className="h-4 w-4" /> Từ chối bài
            </button>
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Car className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Thông tin xe</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-4 text-sm">
              <div>
                <span className="text-xs text-slate-400">Trạng thái</span>
                <p className="mt-0.5"><span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(vehicle.status)}`}>{vehicleStatusLabels[vehicle.status] ?? vehicle.status}</span></p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Loại xe</span>
                <p className="mt-0.5 font-medium text-slate-800">{vehicle.vehicleType}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Giá thuê</span>
                <p className="mt-0.5 font-semibold text-brand-700">{vehicle.pricePerDay.toLocaleString("vi-VN")}đ/ngày</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Chủ xe</span>
                <p className="mt-0.5 font-medium text-slate-800">{vehicle.ownerName || `#${vehicle.ownerId}`}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Tỉnh/Thành phố</span>
                <p className="mt-0.5 font-medium text-slate-800">{vehicleArea.province}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Phường/Xã</span>
                <p className="mt-0.5 font-medium text-slate-800">
                  {vehicleArea.ward}
                  {vehicle.pricingRegionCode && <span className="ml-1 text-xs font-normal text-slate-400">({vehicle.pricingRegionCode})</span>}
                </p>
              </div>
              <div className="col-span-2">
                <span className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" /> Địa chỉ</span>
                <p className="mt-0.5 text-slate-800">{vehicle.address}</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-400">Mô tả xe</span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-800">{vehicle.description || "-"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <ImageIcon className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Ảnh xe ({vehicle.images.length})</h2>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {vehicle.images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => openPreview(vehicleImages, index)}
                  className="overflow-hidden rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <img src={image.imageUrl} alt="" className="aspect-[4/3] w-full object-cover transition-transform hover:scale-105" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900">Hồ sơ xe</h2>
              </div>
              <button type="button" onClick={() => setShowLogModal(true)} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
                <FileText className="h-4 w-4" /> Log duyệt ({vehicle.verificationLogs.length})
              </button>
            </div>
            {currentDocument ? (
              <div className="space-y-4 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(currentDocument.verificationStatus)}`}>{documentStatusLabels[currentDocument.verificationStatus] ?? currentDocument.verificationStatus}</span>
                  <button type="button" onClick={() => openPreview(documentImages, Math.max(0, documentImages.findIndex((image) => image.url === currentDocument.fileUrl)))} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
                    <ImageIcon className="h-4 w-4" /> Xem cavet
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3">
                  <div><span className="text-xs text-slate-400">Biển số OCR</span><p className="mt-0.5 font-medium text-slate-800">{currentDocument.ocrLicensePlate ?? "-"}</p></div>
                  <div><span className="text-xs text-slate-400">Hãng OCR</span><p className="mt-0.5 font-medium text-slate-800">{currentDocument.ocrBrand ?? "-"}</p></div>
                  <div><span className="text-xs text-slate-400">Dòng xe OCR</span><p className="mt-0.5 font-medium text-slate-800">{currentDocument.ocrModel ?? "-"}</p></div>
                  <div><span className="text-xs text-slate-400">Độ tin cậy</span><p className="mt-0.5 font-medium text-slate-800">{currentDocument.ocrConfidence ?? "-"}</p></div>
                </div>
                {currentDocument.verificationStatus !== "Verified" && currentDocument.decisionReason && (
                  <div className="flex items-start gap-2 rounded-md bg-red-50 p-3">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-sm text-red-700">{currentDocument.decisionReason}</p>
                  </div>
                )}
                {currentDocument.verificationStatus !== "Verified" && latestLog && (
                  <div className="flex items-start gap-2 rounded-md bg-red-50 p-3">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-xs text-red-700">{logText(latestLog.recommendation, latestLog.flags, latestLog.message, latestLog.errorMessage)}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {currentDocument.verificationStatus === "Verified" ? (
                    <button type="button" onClick={() => setReasonModal({ title: "Thu hồi xác thực cavet", confirmLabel: "Xác nhận thu hồi", confirmColor: "red", action: (reason) => rejectVehicleDocument(role, vehicle.id, currentDocument.id, reason) })} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">Thu hồi xác thực</button>
                  ) : (
                    <>
                      <button type="button" onClick={async () => { await approveVehicleDocument(role, vehicle.id, currentDocument.id); await reload(); }} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">Duyệt hồ sơ</button>
                      <button type="button" onClick={() => setReasonModal({ title: "Từ chối hồ sơ", confirmLabel: "Từ chối", confirmColor: "red", action: (reason) => rejectVehicleDocument(role, vehicle.id, currentDocument.id, reason) })} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">Từ chối</button>
                      <button type="button" onClick={() => setReasonModal({ title: "Yêu cầu bổ sung", confirmLabel: "Gửi yêu cầu", confirmColor: "orange", action: (reason) => requestVehicleDocumentMoreInfo(role, vehicle.id, currentDocument.id, reason) })} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Bổ sung</button>
                    </>
                  )}
                </div>
              </div>
            ) : <p className="mt-3 text-sm text-slate-400">Chưa có cavet.</p>}
          </div>
          {showLogModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowLogModal(false)}>
              <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Lịch sử duyệt</h2>
                  <button type="button" onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-2">
                  {vehicle.verificationLogs.map((log) => (
                    <div key={log.id ?? log.createdAt} className="rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-800">{recommendationLabels[log.recommendation ?? ""] ?? log.recommendation ?? "Log"}</p>
                        <span className="shrink-0 text-slate-400">{new Date(log.createdAt).toLocaleString("vi-VN")}</span>
                      </div>
                      <p className="mt-0.5">{logText(log.recommendation, log.flags, log.message, log.errorMessage)}</p>
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
                  className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setReasonModal(null); setReasonText(""); }} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
                <button
                  type="button"
                  disabled={!reasonText.trim() || isSubmittingReason}
                  onClick={handleConfirmReason}
                  className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${reasonModal?.confirmColor === "red" ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}`}
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
