import { ArrowLeft, BarChart3, Car, Check, ChevronDown, ClipboardList, Eye, FileBadge, FileText, Gauge, Image as ImageIcon, MapPin, Search, ShieldAlert, SlidersHorizontal, X, CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import type { ImagePreviewItem } from "@/components/common/ImagePreviewModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import { Skeleton } from "@/components/common/Skeleton";
import useClickOutside from "@/hooks/useClickOutside";
import {
  approveVehicleDocument,
  approveVehicleListing,
  getAdminVehicleModerationOverview,
  getCatalogBrands,
  getCatalogModels,
  getModerationVehicleById,
  getModerationVehicles,
  getStaffVehicleModerationOverview,
  rejectVehicleDocument,
  rejectVehicleListing,
  requestVehicleDocumentMoreInfo,
} from "@/features/vehicles/services/vehicleService";
import type { CatalogBrand, CatalogModel, VehicleModerationChartPoint, VehicleModerationDetailResponse, VehicleModerationListItem, VehicleModerationOverviewResponse } from "@/features/vehicles/types";

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
      documentStatus: "",
    };
  }

  if (mode === "listings") {
    return {
      title: "Duyệt bài đăng xe",
      description: "Duyệt bài đăng sau khi hồ sơ xe đã xác thực.",
      status: "",
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

const modeTheme = {
  documents: { gradient: "from-blue-50 to-white", border: "border-blue-200", icon: FileBadge, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  listings: { gradient: "from-orange-50 to-white", border: "border-orange-200", icon: ClipboardList, iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  undefined: { gradient: "from-white to-slate-50/50", border: "border-slate-200", icon: Car, iconBg: "bg-slate-100", iconColor: "text-slate-500" },
};

const stageCfg: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Documents: { label: "Chờ duyệt hồ sơ", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  Listings: { label: "Chờ duyệt bài đăng", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  Approved: { label: "Đã duyệt", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  Rejected: { label: "Từ chối", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
};

function getVehicleStage(item: VehicleModerationListItem) {
  if (item.status === "Approved") return "Approved";
  if (item.status === "Rejected") return "Rejected";
  if (item.documentStatus === "Verified") return "Listings";
  return "Documents";
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

function vehicleVerificationMessage(message?: string | null) {
  if (!message) return null;
  const normalized = message.toLowerCase();

  if (
    normalized.includes("target machine actively refused") ||
    normalized.includes("connection refused") ||
    normalized.includes("econnrefused") ||
    normalized.includes("127.0.0.1:8001")
  ) {
    return "Không kết nối được tới dịch vụ AI xác thực giấy tờ xe. Vui lòng kiểm tra AI service và thử lại.";
  }

  if (normalized.includes("timed out") || normalized.includes("timeout")) {
    return "Dịch vụ AI xác thực giấy tờ xe phản hồi quá lâu. Vui lòng thử lại sau.";
  }

  if (normalized.includes("ai vehicle verification returned http")) {
    return "Dịch vụ AI xác thực giấy tờ xe trả về lỗi. Vui lòng kiểm tra trạng thái AI service.";
  }

  return message;
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
  if (errorMessage) return vehicleVerificationMessage(errorMessage) ?? errorMessage;
  if (recommendation === "Pass") return "OCR đọc tốt, các thông tin chính đã khớp.";
  return vehicleVerificationMessage(message) ?? "-";
}

function statusLabel(label: string) {
  return vehicleStatusCfg[label]?.label ?? docStatusCfg[label]?.label ?? (label === "Car" ? "Ô tô" : label === "Motorbike" ? "Xe máy" : label);
}

function chartColor(index: number) {
  return ["bg-brand-500", "bg-emerald-500", "bg-amber-500", "bg-blue-500", "bg-red-500", "bg-slate-500"][index % 6];
}

function compactNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

const vehicleTypeOptions = [
  { value: "", label: "Tất cả" },
  { value: "Car", label: "Ô tô" },
  { value: "Motorbike", label: "Xe máy" },
];

const fuelTypeOptions = [
  { value: "", label: "Tất cả" },
  { value: "Gasoline", label: "Xăng" },
  { value: "Diesel", label: "Dầu" },
  { value: "Electric", label: "Điện" },
  { value: "Hybrid", label: "Hybrid" },
];

const seatCountOptions = [
  { value: "", label: "Tất cả" },
  ...[2, 4, 5, 7, 8, 9, 16, 29, 30].map((value) => ({ value: String(value), label: `${value} chỗ` })),
];

const transmissionOptions = [
  { value: "", label: "Tất cả" },
  { value: "Automatic", label: "Tự động" },
  { value: "Manual", label: "Số sàn" },
];

function FilterDropdown({ value, label, options, onChange }: { value: string; label: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const current = options.find((option) => option.value === value);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((prev) => !prev)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50">
        <span className="text-xs text-slate-400">{label}:</span>
        <span className="font-medium">{current?.label ?? "Tất cả"}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="dropdown-scrollbar absolute left-0 top-full z-20 mt-1 max-h-72 w-56 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors ${option.value === value ? "bg-brand-100 font-medium text-brand-700" : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

function OverviewMetricCard({ label, value, tone, icon: Icon }: { label: string; value: number; tone: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{compactNumber(value)}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-slate-800 ${mono ? "font-mono" : ""}`}>{value || "-"}</p>
    </div>
  );
}

function CavetReviewModal({
  vehicle,
  document,
  onClose,
}: {
  vehicle: VehicleModerationDetailResponse;
  document: VehicleModerationDetailResponse["documents"][number];
  onClose: () => void;
}) {
  const vehicleTypeLabel = vehicle.vehicleType === "Car" ? "Ô tô" : vehicle.vehicleType === "Motorbike" ? "Xe máy" : vehicle.vehicleType;
  const documentStatus = docStatusCfg[document.verificationStatus] ?? docStatusCfg.Pending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900">Xem cavet</h2>
            <p className="mt-0.5 text-sm text-slate-500">{vehicle.brandName} {vehicle.modelName} - {vehicle.licensePlate}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1.35fr)_380px]">
          <div className="min-h-[320px] overflow-auto bg-slate-950 p-4">
            <div className="flex min-h-full items-center justify-center">
              <img src={document.fileUrl} alt="Cavet xe" className="max-h-[76vh] max-w-full rounded-lg object-contain shadow-xl" />
            </div>
          </div>

          <div className="overflow-y-auto border-t border-slate-100 p-5 lg:border-l lg:border-t-0">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${documentStatus.bg} ${documentStatus.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${documentStatus.dot}`} />
                {documentStatus.label}
              </span>
              {document.isCurrent && (
                <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">Cavet hiện tại</span>
              )}
            </div>

            <div className="space-y-5">
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Car className="h-4 w-4 text-slate-400" /> Thông tin xe
                </h3>
                <div className="grid gap-3">
                  <InfoRow label="Loại xe" value={vehicleTypeLabel} />
                  <InfoRow label="Biển số xe" value={vehicle.licensePlate} mono />
                  <InfoRow label="Dòng xe" value={`${vehicle.brandName} ${vehicle.modelName}${vehicle.variantName ? ` - ${vehicle.variantName}` : ""}`} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FileText className="h-4 w-4 text-slate-400" /> Thông tin OCR
                </h3>
                <div className="grid gap-3">
                  <InfoRow label="Biển số OCR" value={document.ocrLicensePlate} mono />
                  <InfoRow label="Hãng OCR" value={document.ocrBrand} />
                  <InfoRow label="Dòng xe OCR" value={document.ocrModel} />
                  <InfoRow label="Số máy OCR" value={document.ocrEngineNumber} mono />
                  <InfoRow label="Số khung OCR" value={document.ocrChassisNumber} mono />
                  <InfoRow label="Độ tin cậy" value={document.ocrConfidence != null ? document.ocrConfidence : "-"} />
                  <InfoRow label="Nhà cung cấp" value={document.verificationProvider} />
                  <InfoRow label="Thời gian xử lý" value={document.processedAt ? new Date(document.processedAt).toLocaleString("vi-VN") : "-"} />
                </div>
              </section>

              {document.decisionReason && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-medium">Lý do xử lý</p>
                  <p className="mt-1">{vehicleVerificationMessage(document.decisionReason) ?? document.decisionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ title, data, onSelect }: { title: string; data: VehicleModerationChartPoint[]; onSelect?: (label: string) => void }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
          <BarChart3 className="h-4 w-4 text-slate-500" />
        </div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-3">
        {data.map((item, index) => {
          const percent = total > 0 ? Math.max(6, Math.round((item.value / total) * 100)) : 0;
          return (
            <button key={item.label} type="button" onClick={() => onSelect?.(item.label)} className="block w-full space-y-1.5 rounded-lg text-left transition-colors hover:bg-slate-50">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-slate-600">{statusLabel(item.label)}</span>
                <span className="font-semibold text-slate-800">{compactNumber(item.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${chartColor(index)}`} style={{ width: `${percent}%` }} />
              </div>
            </button>
          );
        })}
        {data.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Chưa có dữ liệu.</p>}
      </div>
    </div>
  );
}

function AdminModerationOverview({ overview, mode, onFilterOverride, onSelectChartStatus }: { overview: VehicleModerationOverviewResponse | null; mode?: ModerationMode; onFilterOverride: () => void; onSelectChartStatus: (label: string) => void }) {
  if (!overview) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const documentWorkload = overview.pendingDocuments + overview.manualReviewDocuments + overview.needMoreInfoDocuments + overview.failedDocuments;
  const listingWorkload = overview.pendingListings;
  const isDocuments = mode === "documents";
  const isListings = mode === "listings";

  return (
    <div className="space-y-4">
      {isDocuments ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewMetricCard label="Giấy tờ cần xử lý" value={documentWorkload} tone="bg-amber-50 text-amber-600" icon={FileText} />
          <OverviewMetricCard label="Đã xác thực" value={overview.verifiedDocuments} tone="bg-emerald-50 text-emerald-600" icon={CheckCircle} />
          <OverviewMetricCard label="Cần xem lại" value={overview.manualReviewDocuments} tone="bg-blue-50 text-blue-600" icon={AlertCircle} />
          <OverviewMetricCard label="Bị từ chối/lỗi" value={overview.rejectedDocuments + overview.failedDocuments} tone="bg-red-50 text-red-600" icon={XCircle} />
        </div>
      ) : isListings ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewMetricCard label="Tin đăng chờ duyệt" value={listingWorkload} tone="bg-blue-50 text-blue-600" icon={Clock} />
          <OverviewMetricCard label="Đã duyệt" value={overview.approvedListings} tone="bg-emerald-50 text-emerald-600" icon={CheckCircle} />
          <OverviewMetricCard label="Từ chối" value={overview.rejectedListings} tone="bg-red-50 text-red-600" icon={XCircle} />
          <OverviewMetricCard label="Cần can thiệp" value={overview.overrideCandidates} tone="bg-red-50 text-red-600" icon={ShieldAlert} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewMetricCard label="Tổng xe trong hệ thống" value={overview.totalVehicles} tone="bg-slate-100 text-slate-600" icon={Gauge} />
          <OverviewMetricCard label="Giấy tờ cần xử lý" value={documentWorkload} tone="bg-amber-50 text-amber-600" icon={FileText} />
          <OverviewMetricCard label="Tin đăng chờ duyệt" value={listingWorkload} tone="bg-blue-50 text-blue-600" icon={Clock} />
          <OverviewMetricCard label="Cần can thiệp" value={overview.overrideCandidates} tone="bg-red-50 text-red-600" icon={ShieldAlert} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <MiniBarChart title={isDocuments ? "Trạng thái giấy tờ" : "Trạng thái tin đăng"} data={isDocuments ? overview.documentStatusChart : overview.listingStatusChart} onSelect={onSelectChartStatus} />
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <ShieldAlert className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Can thiệp/override</h2>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Admin có thể duyệt tin đăng trong trường hợp cần override, hoặc thu hồi quyết định đã duyệt khi phát hiện sai lệch.
          </p>
          <button
            type="button"
            onClick={onFilterOverride}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            <ShieldAlert className="h-4 w-4" />
            Xem hồ sơ cần can thiệp
          </button>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            {isDocuments ? "Ưu tiên kiểm tra hồ sơ có OCR lỗi, cần xem lại hoặc thiếu thông tin." : "Ưu tiên tin đăng chưa đủ điều kiện duyệt tự động nhưng cần quyết định của quản trị."}
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffModerationOverview({ overview, mode, onSelectChartStatus }: { overview: VehicleModerationOverviewResponse | null; mode?: ModerationMode; onSelectChartStatus: (label: string) => void }) {
  if (!overview) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const documentWorkload = overview.pendingDocuments + overview.manualReviewDocuments + overview.needMoreInfoDocuments + overview.failedDocuments;
  const listingWorkload = overview.pendingListings;
  const isDocuments = mode === "documents";
  const isListings = mode === "listings";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {isDocuments ? (
          <>
            <OverviewMetricCard label="Giấy tờ cần xử lý" value={documentWorkload} tone="bg-amber-50 text-amber-600" icon={FileText} />
            <OverviewMetricCard label="Đã xác thực" value={overview.verifiedDocuments} tone="bg-emerald-50 text-emerald-600" icon={CheckCircle} />
            <OverviewMetricCard label="Cần xem lại" value={overview.manualReviewDocuments} tone="bg-blue-50 text-blue-600" icon={AlertCircle} />
          </>
        ) : isListings ? (
          <>
            <OverviewMetricCard label="Tin đăng chờ duyệt" value={listingWorkload} tone="bg-blue-50 text-blue-600" icon={Clock} />
            <OverviewMetricCard label="Đã duyệt" value={overview.approvedListings} tone="bg-emerald-50 text-emerald-600" icon={CheckCircle} />
            <OverviewMetricCard label="Từ chối" value={overview.rejectedListings} tone="bg-red-50 text-red-600" icon={XCircle} />
          </>
        ) : (
          <>
            <OverviewMetricCard label="Giấy tờ cần xử lý" value={documentWorkload} tone="bg-amber-50 text-amber-600" icon={FileText} />
            <OverviewMetricCard label="Tin đăng chờ duyệt" value={listingWorkload} tone="bg-blue-50 text-blue-600" icon={Clock} />
            <OverviewMetricCard label="Đã xác thực" value={overview.verifiedDocuments} tone="bg-emerald-50 text-emerald-600" icon={CheckCircle} />
          </>
        )}
      </div>
      <MiniBarChart
        title={isDocuments ? "Trạng thái giấy tờ" : "Trạng thái tin đăng"}
        data={isDocuments ? overview.documentStatusChart : overview.listingStatusChart}
        onSelect={onSelectChartStatus}
      />
    </div>
  );
}

function VehicleModerationList({ role, mode }: { role: Role; mode?: ModerationMode }) {
  const navigate = useNavigate();
  const defaults = getModeDefaults(mode);
  const [items, setItems] = useState<VehicleModerationListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState(defaults.status);
  const [documentStatus, setDocumentStatus] = useState(defaults.documentStatus);
  const [vehicleType, setVehicleType] = useState("");
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [seatCount, setSeatCount] = useState("");
  const [transmission, setTransmission] = useState("");
  const [quickFilter, setQuickFilter] = useState("");
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<VehicleModerationOverviewResponse | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    const nextDefaults = getModeDefaults(mode);
    setStatus(nextDefaults.status);
    setDocumentStatus(nextDefaults.documentStatus);
    setQuickFilter("");
  }, [mode]);

  useEffect(() => {
    getCatalogBrands(vehicleType || undefined)
      .then((data) => {
        setBrands(data);
        setBrandId((current) => (current && data.some((brand) => String(brand.id) === current) ? current : ""));
      })
      .catch(() => setBrands([]));
  }, [vehicleType]);

  useEffect(() => {
    if (!brandId) {
      setModels([]);
      setModelId("");
      return;
    }

    getCatalogModels(Number(brandId))
      .then((data) => {
        setModels(data);
        setModelId((current) => (current && data.some((modelItem) => String(modelItem.id) === current) ? current : ""));
      })
      .catch(() => setModels([]));
  }, [brandId]);

  const listParams = {
    keyword,
    status,
    documentStatus,
    vehicleType: vehicleType || undefined,
    brandId: brandId || undefined,
    modelId: modelId || undefined,
    fuelType: fuelType || undefined,
    seatCount: seatCount || undefined,
    transmission: transmission || undefined,
    page: 1,
    pageSize: 20,
  };

  useEffect(() => {
    setLoading(true);
    getModerationVehicles(role, listParams)
      .then((data) => {
        setItems(data.items);
        setTotalCount(data.totalCount);
      })
      .finally(() => setLoading(false));
  }, [role, keyword, status, documentStatus, vehicleType, brandId, modelId, fuelType, seatCount, transmission]);

  useEffect(() => {
    if (role === "admin") {
      getAdminVehicleModerationOverview().then((data) => setOverview(data ?? null));
    } else if (role === "staff") {
      getStaffVehicleModerationOverview().then((data) => setOverview(data ?? null));
    }
  }, [role]);

  async function reloadOverview() {
    if (role === "admin") {
      const data = await getAdminVehicleModerationOverview();
      setOverview(data ?? null);
    } else if (role === "staff") {
      const data = await getStaffVehicleModerationOverview();
      setOverview(data ?? null);
    }
  }

  function handleFilterOverride() {
    setQuickFilter("override");
    if (mode === "documents") {
      setStatus("");
      setDocumentStatus("Pending,ManualReview,NeedMoreInfo,Failed,Rejected");
      return;
    }

    setStatus("Pending");
    setDocumentStatus("");
  }

  function handleSelectChartStatus(label: string) {
    setQuickFilter("");
    if (mode === "documents") {
      setStatus("");
      setDocumentStatus(label);
      return;
    }

    setStatus(label);
    setDocumentStatus("");
  }

  async function handleApprove(vehicleId: number) {
    await approveVehicleListing(role, vehicleId);
    const data = await getModerationVehicles(role, listParams);
    setItems(data.items);
    setTotalCount(data.totalCount);
    await reloadOverview();
  }

  async function handleReject() {
    if (!rejectModal || !rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      await rejectVehicleListing(role, rejectModal.id, rejectReason.trim());
      setRejectModal(null);
      setRejectReason("");
      const data = await getModerationVehicles(role, listParams);
      setItems(data.items);
      setTotalCount(data.totalCount);
      await reloadOverview();
    } finally {
      setIsRejecting(false);
    }
  }

  function resetFilters() {
    setKeyword("");
    setStatus(defaults.status);
    setDocumentStatus(defaults.documentStatus);
    setVehicleType("");
    setBrandId("");
    setModelId("");
    setFuelType("");
    setSeatCount("");
    setTransmission("");
    setQuickFilter("");
  }

  function applyQuickFilter(value: string) {
    setQuickFilter(value);
    if (value === "ready") {
      setStatus("");
      setDocumentStatus("Verified");
      return;
    }

    if (value === "needs-review") {
      setStatus("");
      setDocumentStatus("Pending,ManualReview,NeedMoreInfo,Failed,Rejected");
      return;
    }

    if (value === "override") {
      setStatus("Pending");
      setDocumentStatus("");
      return;
    }

    resetFilters();
  }

  const brandOptions = [{ value: "", label: "Tất cả" }, ...brands.map((brand) => ({ value: String(brand.id), label: brand.name }))];
  const modelOptions = [{ value: "", label: "Tất cả" }, ...models.map((modelItem) => ({ value: String(modelItem.id), label: modelItem.name }))];
  const hasActiveFilters = Boolean(keyword || status !== defaults.status || documentStatus !== defaults.documentStatus || vehicleType || brandId || modelId || fuelType || seatCount || transmission || quickFilter);

  return (
    <div className="space-y-6">
      {(() => {
        const tm = mode ? modeTheme[mode] : modeTheme.undefined;
        const Icon = tm.icon;
        return (
          <div className={"rounded-xl border p-5 shadow-sm bg-gradient-to-r " + tm.gradient + " " + tm.border}>
            <div className="flex items-center gap-3">
              <div className={"flex h-10 w-10 items-center justify-center rounded-xl " + tm.iconBg}>
                <Icon className={"h-5 w-5 " + tm.iconColor} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{defaults.title}</h1>
                <p className="mt-0.5 text-sm text-slate-500">{defaults.description}</p>
              </div>
            </div>
          </div>
        );
      })()}
      {role === "admin" && (
        <AdminModerationOverview overview={overview} mode={mode} onFilterOverride={handleFilterOverride} onSelectChartStatus={handleSelectChartStatus} />
      )}
      {role === "staff" && (
        <StaffModerationOverview overview={overview} mode={mode} onSelectChartStatus={handleSelectChartStatus} />
      )}
      <div className="rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm biển số, mô tả..." className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors ${showFilters || hasActiveFilters ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <FilterDropdown
              label="Loại xe"
              value={vehicleType}
              onChange={(value) => {
                setVehicleType(value);
                setBrandId("");
                setModelId("");
                setQuickFilter("");
              }}
              options={vehicleTypeOptions}
            />
            <FilterDropdown
              label="Hãng"
              value={brandId}
              onChange={(value) => {
                setBrandId(value);
                setModelId("");
                setQuickFilter("");
              }}
              options={brandOptions}
            />
            <FilterDropdown
              label="Dòng"
              value={modelId}
              onChange={(value) => {
                setModelId(value);
                setQuickFilter("");
              }}
              options={modelOptions}
            />
            <FilterDropdown
              label="Nhiên liệu"
              value={fuelType}
              onChange={(value) => {
                setFuelType(value);
                setQuickFilter("");
              }}
              options={fuelTypeOptions}
            />
            <FilterDropdown
              label="Số chỗ"
              value={seatCount}
              onChange={(value) => {
                setSeatCount(value);
                setQuickFilter("");
              }}
              options={seatCountOptions}
            />
            <FilterDropdown
              label="Hộp số"
              value={transmission}
              onChange={(value) => {
                setTransmission(value);
                setQuickFilter("");
              }}
              options={transmissionOptions}
            />
            <FilterDropdown
              label="Bài đăng"
              value={status}
              onChange={(value) => {
                setStatus(value);
                setQuickFilter("");
              }}
              options={[
                { value: "", label: "Tất cả" },
                { value: "Pending,Approved,Rejected", label: "Chờ duyệt / Đã duyệt / Từ chối" },
                { value: "Pending", label: "Chờ duyệt" },
                { value: "Approved", label: "Đã duyệt" },
                { value: "Rejected", label: "Từ chối" },
                { value: "Hidden", label: "Đã ẩn" },
              ]}
            />
            <FilterDropdown
              label="Giấy tờ"
              value={documentStatus}
              onChange={(value) => {
                setDocumentStatus(value);
                setQuickFilter("");
              }}
              options={[
                { value: "", label: "Tất cả" },
                { value: "Pending,ManualReview,NeedMoreInfo,Failed,Rejected", label: "Cần xử lý / Từ chối" },
                { value: "Pending", label: "Chờ xử lý" },
                { value: "Verified", label: "Đã xác thực" },
                { value: "ManualReview", label: "Cần xem" },
                { value: "NeedMoreInfo", label: "Cần bổ sung" },
                { value: "Rejected", label: "Từ chối" },
                { value: "Failed", label: "Lỗi" },
              ]}
            />
            <FilterDropdown
              label="Điều kiện"
              value={quickFilter}
              onChange={applyQuickFilter}
              options={[
                { value: "", label: "Tất cả" },
                { value: "ready", label: "Đủ điều kiện duyệt" },
                { value: "needs-review", label: "Giấy tờ cần xử lý" },
                { value: "override", label: "Cần can thiệp" },
              ]}
            />
            {hasActiveFilters && <button type="button" onClick={resetFilters} className="text-xs font-medium text-brand-700 hover:text-brand-800">Xóa bộ lọc</button>}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-medium text-slate-700">{totalCount} xe</div>
          {loading && <LoadingSpinner className="h-4 w-4" />}
        </div>
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
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Giai đoạn</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Bài đăng</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Giấy tờ</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const canApproveListing = item.documentVerified && item.documentStatus === "Verified";
                const showListingActions = mode !== "documents";
                return (
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
                    {(() => {
                      const st = stageCfg[getVehicleStage(item)];
                      return (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${st.bg} ${st.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      );
                    })()}
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
                      {showListingActions && item.status === "Pending" && canApproveListing && (
                        <>
                          <button type="button" onClick={() => handleApprove(item.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow">
                            <Check className="h-3.5 w-3.5" /> Duyệt
                          </button>
                          <button type="button" onClick={() => { setRejectModal({ id: item.id, name: `${item.brandName} ${item.modelName}` }); setRejectReason(""); }} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-red-700 hover:shadow">
                            <X className="h-3.5 w-3.5" /> Từ chối
                          </button>
                        </>
                      )}
                      {showListingActions && item.status === "Pending" && !canApproveListing && (
                        <>
                          <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-400">
                            <AlertCircle className="h-3.5 w-3.5" /> Chưa đủ điều kiện
                          </button>
                          {role === "admin" && (
                            <button type="button" onClick={() => navigate(`${getModePath(role, mode)}/${item.id}`)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
                              <ShieldAlert className="h-3.5 w-3.5" /> Can thiệp
                            </button>
                          )}
                        </>
                      )}
                      {showListingActions && role === "admin" && item.status === "Approved" && (
                        <button type="button" onClick={() => { setRejectModal({ id: item.id, name: `${item.brandName} ${item.modelName}` }); setRejectReason(""); }} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
                          <X className="h-3.5 w-3.5" /> Thu hồi
                        </button>
                      )}
                      {showListingActions && role === "admin" && item.status === "Rejected" && canApproveListing && (
                        <button type="button" onClick={() => handleApprove(item.id)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
                          <Check className="h-3.5 w-3.5" /> Duyệt lại
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
              {items.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Không có xe nào.</td></tr>}
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
  const [showCavetModal, setShowCavetModal] = useState(false);
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
  const canApproveListing = currentDocument?.verified === true && currentDocument.verificationStatus === "Verified";

  function openPreview(images: ImagePreviewItem[], index = 0) {
    setPreviewImages(images);
    setPreviewIndex(index);
  }

  return (
    <div className="space-y-6">
      {(() => {
        const tm = mode ? modeTheme[mode] : modeTheme.undefined;
        return (
        <div className={"flex items-center gap-3 rounded-xl border p-4 shadow-sm bg-gradient-to-r " + tm.gradient + " " + tm.border}>
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
            {canApproveListing ? (
              <button type="button" onClick={async () => { await approveVehicleListing(role, vehicle.id); await reload(); }} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md">
                <Check className="h-4 w-4" /> Duyệt bài
              </button>
            ) : (
              <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-400">
                <AlertCircle className="h-4 w-4" /> Chưa đủ điều kiện
              </button>
            )}
            {role === "admin" && !canApproveListing && (
              <button type="button" onClick={async () => { await approveVehicleListing(role, vehicle.id); await reload(); }} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100">
                <ShieldAlert className="h-4 w-4" /> Duyệt override
              </button>
            )}
            <button type="button" onClick={() => setReasonModal({ title: "Từ chối bài đăng", confirmLabel: "Từ chối", confirmColor: "red", action: (reason) => rejectVehicleListing(role, vehicle.id, reason) })} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md">
              <X className="h-4 w-4" /> Từ chối bài
            </button>
          </div>
        )}
      </div>);
      })()}

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
                <span className="text-xs font-medium text-slate-400">Thế chấp</span>
                <p className="mt-1 font-medium text-slate-800">{vehicle.requiresDeposit ? `${(vehicle.depositAmount ?? 0).toLocaleString("vi-VN")}đ` : "Không yêu cầu"}</p>
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
                <CheckCircle className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Tính năng xe ({vehicle.features.length})</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {vehicle.features.map((feature) => (
                <span key={feature.id} className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {feature.name}
                </span>
              ))}
              {vehicle.features.length === 0 && (
                <p className="text-sm text-slate-400">Chưa chọn tính năng nào.</p>
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
                  <button type="button" onClick={() => setShowCavetModal(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100">
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
                    <p className="text-sm text-red-700">{vehicleVerificationMessage(currentDocument.decisionReason) ?? currentDocument.decisionReason}</p>
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

          {showCavetModal && currentDocument && (
            <CavetReviewModal vehicle={vehicle} document={currentDocument} onClose={() => setShowCavetModal(false)} />
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
