import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Bike, Camera, Car, CheckCircle2, Clock, CloudUpload, FileBadge, Info, ListChecks, Upload, X } from "lucide-react";
import Button from "@/components/common/Button";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import { Skeleton } from "@/components/common/Skeleton";
import { showToast } from "@/components/common/toastStore";
import {
  driverLicenseStatusLabel,
  formatDriverLicenseFlags,
  translateDriverLicenseMessage,
} from "@/features/driverLicenses/driverLicenseDisplay";
import LicenseCompatibilityModal from "@/features/driverLicenseClasses/components/LicenseCompatibilityModal";
import { getCatalogDriverLicenseClasses, getCatalogDriverLicenseClassCompatibleRequiredClasses } from "@/features/driverLicenseClasses/services/driverLicenseClassService";
import type { DriverLicenseClassResponse } from "@/features/driverLicenseClasses/types";
import { getMyDriverLicense, submitDriverLicense } from "@/features/driverLicenses/services/driverLicenseService";
import type { DriverLicenseStatusResponse, DriverLicenseSubmitResponse } from "@/features/driverLicenses/types";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    timeZone: "Asia/Bangkok",
  });
}

function canUpdateAfter(value?: string | null) {
  if (!value) return true;
  return new Date(value).getTime() <= Date.now();
}

function vehicleTypeLabel(value?: string | null) {
  if (value === "Car") return "Ô tô";
  if (value === "Motorbike" || value === "Motorcycle") return "Xe máy";
  return value ?? "-";
}

export default function DriverLicenseVerificationPage() {
  const [status, setStatus] = useState<DriverLicenseStatusResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [result, setResult] = useState<DriverLicenseSubmitResponse | null>(null);
  const [requestedVehicleType, setRequestedVehicleType] = useState<"Motorbike" | "Car">("Motorbike");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<DriverLicenseClassResponse | null>(null);
  const [compatibleClasses, setCompatibleClasses] = useState<DriverLicenseClassResponse[]>([]);
  const [isCompatibilityLoading, setIsCompatibilityLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await getMyDriverLicense();
        if (!ignore) setStatus(data);
      } catch (error) {
        if (!ignore) {
          showToast({ type: "error", title: "Không tải được GPLX", message: error instanceof Error ? translateDriverLicenseMessage(error.message) : "Vui lòng thử lại." });
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    void load();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const hasPendingRequest = status?.latestRequest?.requestedVehicleType === requestedVehicleType
    && (status.latestRequest.status === "Pending" || status.latestRequest.status === "Processing");

  const uploadDisabledReason = useMemo(() => {
    const hasPendingForSelectedType = status?.latestRequest?.requestedVehicleType === requestedVehicleType
      && (status.latestRequest.status === "Pending" || status.latestRequest.status === "Processing");
    if (hasPendingForSelectedType) return "Hồ sơ GPLX đang chờ xử lý.";
    const selectedLicense = status?.licenses?.find((license) => license.vehicleType === requestedVehicleType);
    if (selectedLicense && !canUpdateAfter(selectedLicense.canUpdateAfter)) return `Có thể cập nhật lại sau ${formatDate(selectedLicense.canUpdateAfter)}.`;
    return null;
  }, [requestedVehicleType, status]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || uploadDisabledReason) return;

    const formData = new FormData();
    formData.append("frontImage", file);
    formData.append("requestedVehicleType", requestedVehicleType);
    setIsSubmitting(true);
    setResult(null);
    try {
      const data = await submitDriverLicense(formData);
      setResult(data);
      const refreshed = await getMyDriverLicense();
      setStatus(refreshed);
      setFile(null);
      showToast({
        type: data.verified ? "success" : data.status === "Pending" ? "info" : "error",
        title: data.verified ? "GPLX đã xác minh" : "Kết quả xác minh GPLX",
        message: translateDriverLicenseMessage(data.message, driverLicenseStatusLabel[data.status] ?? data.status),
      });
    } catch (error) {
      showToast({ type: "error", title: "Upload GPLX thất bại", message: error instanceof Error ? translateDriverLicenseMessage(error.message) : "Vui lòng thử lại." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-6">
        <Skeleton className="mb-4 h-4 w-24" />
        <Skeleton className="mx-auto mb-8 h-6 w-64" />
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-52 rounded-xl" />
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const resultFlags = formatDriverLicenseFlags(result?.flags);
  const selectedLicense = status?.licenses?.find((license) => license.vehicleType === requestedVehicleType) ?? null;
  const selectedTypeVerified = !!selectedLicense || (status?.verifiedVehicleTypes?.some((type) => type === requestedVehicleType) ?? false);
  const selectedTypeHasLatestRequest = status?.latestRequest?.requestedVehicleType === requestedVehicleType;
  const selectedStatus = selectedTypeHasLatestRequest
    ? status?.latestRequest?.status ?? "None"
    : selectedTypeVerified
      ? "Verified"
      : "None";
  const selectedVerified = selectedTypeVerified;
  const selectedConfidence = selectedLicense?.ocrConfidence ?? (selectedTypeHasLatestRequest ? status?.latestRequest?.confidence : null);
  const selectedDecisionReason = selectedTypeHasLatestRequest ? status?.latestRequest?.decisionReason : null;
  const selectedDriverLicenseNumber = selectedLicense?.driverLicenseNumber ?? (selectedTypeVerified ? status?.driverLicenseNumber : null);
  const selectedLicenseClass = selectedLicense?.licenseClass ?? (selectedTypeVerified ? status?.licenseClass : null);
  const selectedVerifiedAt = selectedLicense?.verifiedAt ?? (selectedTypeVerified ? status?.verifiedAt : null);
  const selectedCanUpdateAfter = selectedLicense?.canUpdateAfter ?? (selectedTypeVerified ? status?.canUpdateAfter : null);
  const savedImageUrl = selectedLicense?.frontImageUrl ?? (selectedTypeHasLatestRequest ? status?.latestRequest?.frontImageUrl ?? null : null);
  const displayImageUrl = previewUrl ?? savedImageUrl;
  const displayImageName = file?.name ?? (savedImageUrl ? "GPLX đã upload" : null);

  async function openCompatibility() {
    if (!selectedLicenseClass) {
      showToast({ type: "info", title: "Chưa có hạng GPLX", message: "Hệ thống chưa ghi nhận hạng GPLX để kiểm tra." });
      return;
    }

    setLicenseModalOpen(true);
    setIsCompatibilityLoading(true);
    try {
      const classes = await getCatalogDriverLicenseClasses();
      const current = classes.find((item) => item.code.toUpperCase() === selectedLicenseClass.toUpperCase()) ?? null;
      setLicenseInfo(current);
      if (current) {
        const compatible = await getCatalogDriverLicenseClassCompatibleRequiredClasses(current.id);
        setCompatibleClasses(compatible);
      } else {
        setCompatibleClasses([]);
      }
    } catch (error) {
      showToast({ type: "error", title: "Không tải được hạng GPLX", message: error instanceof Error ? error.message : "Vui lòng thử lại." });
    } finally {
      setIsCompatibilityLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Giấy phép lái xe</h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý xác minh GPLX dùng khi thuê xe trên MoveVN.</p>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-md ${selectedVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
            {selectedVerified ? <CheckCircle2 className="h-5 w-5" /> : selectedStatus === "Pending" ? <Clock className="h-5 w-5" /> : <FileBadge className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">{driverLicenseStatusLabel[selectedStatus] ?? selectedStatus}</p>
              {selectedConfidence != null && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">OCR {Math.round(selectedConfidence * 100)}%</span>}
            </div>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Số GPLX</dt><dd className="font-medium text-slate-900">{selectedDriverLicenseNumber ?? "-"}</dd></div>
              <div><dt className="text-slate-500">Hạng bằng</dt><dd className="font-medium text-slate-900">{selectedLicenseClass ?? "-"}</dd></div>
              <div><dt className="text-slate-500">Đang xem</dt><dd className="font-medium text-slate-900">{vehicleTypeLabel(requestedVehicleType)}</dd></div>
              <div><dt className="text-slate-500">Xác minh lúc</dt><dd className="font-medium text-slate-900">{formatDate(selectedVerifiedAt)}</dd></div>
              <div><dt className="text-slate-500">Cập nhật lại</dt><dd className="font-medium text-slate-900">{selectedVerified ? formatDate(selectedCanUpdateAfter) : "Có thể gửi ngay"}</dd></div>
            </dl>
            {selectedLicenseClass && (
              <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => void openCompatibility()}>
                <ListChecks className="h-4 w-4" />
                Xem GPLX này lái được hạng nào
              </Button>
            )}
            {selectedDecisionReason && <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{translateDriverLicenseMessage(selectedDecisionReason)}</p>}
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Upload mặt trước GPLX</h2>
            {uploadDisabledReason && <p className="mt-1 text-sm text-amber-700">{uploadDisabledReason}</p>}
          </div>
          <Button type="submit" isLoading={isSubmitting} disabled={!file || !!uploadDisabledReason}>
            <Upload className="h-4 w-4" />
            Gửi xác minh
          </Button>
        </div>

        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {[
            { value: "Motorbike" as const, label: "Xe máy", icon: Bike },
            { value: "Car" as const, label: "Ô tô", icon: Car },
          ].map((option) => {
            const Icon = option.icon;
            const active = requestedVehicleType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={hasPendingRequest}
                onClick={() => setRequestedVehicleType(option.value)}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition ${
                  active ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4" />
                  {option.label}
                </span>
                {active && <CheckCircle2 className="h-4 w-4" />}
              </button>
            );
          })}
        </div>

        <div className="group relative overflow-hidden rounded-xl border-2 border-dashed p-5 transition border-zinc-300 bg-white hover:border-purple-400">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-800">Mặt trước GPLX</h3>
            <Camera className="h-5 w-5 text-purple-700" />
          </div>
          {displayImageUrl ? (
            <div className="relative">
              <img src={displayImageUrl} alt="GPLX" className="h-48 w-full rounded-lg object-cover" />
              <button type="button" onClick={() => { setFile(null); setPreviewUrl(null); }} className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 transition hover:border-purple-400 hover:bg-purple-50" disabled={!!uploadDisabledReason}>
              <div className="scan-line" />
              <CloudUpload className="h-10 w-10 text-zinc-300 group-hover:text-purple-500" />
              <div className="text-center">
                <p className="text-sm font-semibold text-zinc-600">Nhấn để chọn ảnh</p>
                <p className="text-xs text-zinc-400">Hỗ trợ JPG, PNG (tối đa 5MB)</p>
              </div>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={!!uploadDisabledReason}
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              if (selected && selected.size > 5 * 1024 * 1024) {
                showToast({ type: "error", title: "File quá lớn", message: "Kích thước file tối đa là 5MB." });
                event.target.value = "";
                return;
              }
              setFile(selected);
            }}
          />
        </div>

        {result && !result.verified && result.status !== "Pending" && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" />{driverLicenseStatusLabel[result.status] ?? result.status}</div>
            <p className="mt-1">{translateDriverLicenseMessage(result.message)}</p>
            {resultFlags.length > 0 && <p className="mt-1 text-xs">Lý do: {resultFlags.join(", ")}</p>}
          </div>
        )}
      </form>

      {displayImageUrl && <ImagePreviewModal isOpen={previewOpen} src={displayImageUrl} title="GPLX" onClose={() => setPreviewOpen(false)} />}

      <style>{`
        .scan-line {
          position: absolute;
          inset: 0;
          height: 2px;
          background: #7c3aed;
          box-shadow: 0 0 8px #7c3aed;
          z-index: 10;
          opacity: 0;
          pointer-events: none;
        }
        .group:hover .scan-line,
        .group:focus-within .scan-line {
          opacity: 0.6;
          animation: scan 2s linear infinite;
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
      <LicenseCompatibilityModal
        isOpen={licenseModalOpen}
        license={licenseInfo}
        compatibleClasses={compatibleClasses}
        isLoading={isCompatibilityLoading}
        onClose={() => setLicenseModalOpen(false)}
      />
    </div>
  );
}
