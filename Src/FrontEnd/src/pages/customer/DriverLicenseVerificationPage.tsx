import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bike,
  Car,
  CheckCircle2,
  Clock,
  CloudUpload,
  Eye,
  FileBadge,
  Info,
  ListChecks,
  Upload,
  X,
} from "lucide-react";
import Button from "@/components/common/Button";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import { Skeleton } from "@/components/common/Skeleton";
import { showToast } from "@/components/common/toastStore";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import StatusBadge from "@/components/dashboard/StatusBadge";
import LicenseCompatibilityModal from "@/features/driverLicenseClasses/components/LicenseCompatibilityModal";
import {
  getCatalogDriverLicenseClasses,
  getCatalogDriverLicenseClassCompatibleRequiredClasses,
} from "@/features/driverLicenseClasses/services/driverLicenseClassService";
import type { DriverLicenseClassResponse } from "@/features/driverLicenseClasses/types";
import {
  driverLicenseStatusLabel,
  formatDriverLicenseFlags,
  translateDriverLicenseMessage,
} from "@/features/driverLicenses/driverLicenseDisplay";
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

function getStatusTone(status: string) {
  if (status === "Verified" || status === "Pass") return "emerald" as const;
  if (status === "Pending" || status === "Processing" || status === "ManualReview") return "amber" as const;
  if (status === "Rejected" || status === "Failed" || status === "Reject") return "rose" as const;
  return "slate" as const;
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
          showToast({
            type: "error",
            title: "Không tải được GPLX",
            message: error instanceof Error ? translateDriverLicenseMessage(error.message) : "Vui lòng thử lại.",
          });
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void load();
    return () => {
      ignore = true;
    };
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

  const hasPendingRequest =
    status?.latestRequest?.requestedVehicleType === requestedVehicleType &&
    (status.latestRequest.status === "Pending" || status.latestRequest.status === "Processing");

  const uploadDisabledReason = useMemo(() => {
    const hasPendingForSelectedType =
      status?.latestRequest?.requestedVehicleType === requestedVehicleType &&
      (status.latestRequest.status === "Pending" || status.latestRequest.status === "Processing");
    if (hasPendingForSelectedType) return "Hồ sơ GPLX đang chờ xử lý.";
    const selectedLicense = status?.licenses?.find((license) => license.vehicleType === requestedVehicleType);
    if (selectedLicense && !canUpdateAfter(selectedLicense.canUpdateAfter)) {
      return `Có thể cập nhật lại sau ${formatDate(selectedLicense.canUpdateAfter)}.`;
    }
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
      showToast({
        type: "error",
        title: "Upload GPLX thất bại",
        message: error instanceof Error ? translateDriverLicenseMessage(error.message) : "Vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-32 rounded-md" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-24 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-md" />
      </div>
    );
  }

  const resultFlags = formatDriverLicenseFlags(result?.flags);
  const selectedLicense = status?.licenses?.find((license) => license.vehicleType === requestedVehicleType) ?? null;
  const selectedTypeVerified =
    Boolean(selectedLicense) || (status?.verifiedVehicleTypes?.some((type) => type === requestedVehicleType) ?? false);
  const selectedTypeHasLatestRequest = status?.latestRequest?.requestedVehicleType === requestedVehicleType;
  const selectedStatus = selectedTypeHasLatestRequest
    ? status?.latestRequest?.status ?? "None"
    : selectedTypeVerified
      ? "Verified"
      : "None";
  const selectedConfidence = selectedLicense?.ocrConfidence ?? (selectedTypeHasLatestRequest ? status?.latestRequest?.confidence : null);
  const selectedDecisionReason = selectedTypeHasLatestRequest ? status?.latestRequest?.decisionReason : null;
  const selectedDriverLicenseNumber = selectedLicense?.driverLicenseNumber ?? (selectedTypeVerified ? status?.driverLicenseNumber : null);
  const selectedLicenseClass = selectedLicense?.licenseClass ?? (selectedTypeVerified ? status?.licenseClass : null);
  const selectedVerifiedAt = selectedLicense?.verifiedAt ?? (selectedTypeVerified ? status?.verifiedAt : null);
  const selectedCanUpdateAfter = selectedLicense?.canUpdateAfter ?? (selectedTypeVerified ? status?.canUpdateAfter : null);
  const savedImageUrl = selectedLicense?.frontImageUrl ?? (selectedTypeHasLatestRequest ? status?.latestRequest?.frontImageUrl ?? null : null);
  const displayImageUrl = previewUrl ?? savedImageUrl;

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
      showToast({
        type: "error",
        title: "Không tải được hạng GPLX",
        message: error instanceof Error ? error.message : "Vui lòng thử lại.",
      });
    } finally {
      setIsCompatibilityLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <DashboardHeader
        eyebrow="Driver license"
        title="Giấy phép lái xe"
        description="Xác minh GPLX theo từng loại xe để hệ thống biết bạn đủ điều kiện thuê xe máy hoặc ô tô."
        actions={<StatusBadge tone={getStatusTone(selectedStatus)}>{driverLicenseStatusLabel[selectedStatus] ?? selectedStatus}</StatusBadge>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Loại xe đang xem</p>
          <p className="mt-2 text-xl font-semibold text-slate-950">{vehicleTypeLabel(requestedVehicleType)}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Hạng GPLX</p>
          <p className="mt-2 text-xl font-semibold text-slate-950">{selectedLicenseClass ?? "-"}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Độ tin cậy OCR</p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {selectedConfidence != null ? `${Math.round(selectedConfidence * 100)}%` : "-"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <SectionPanel title="Trạng thái GPLX" description="Thông tin đã lưu cho loại xe đang chọn.">
            <div className="flex items-start gap-4">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ring-1 ${
                  selectedTypeVerified
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                    : selectedStatus === "Pending" || selectedStatus === "Processing"
                      ? "bg-amber-50 text-amber-700 ring-amber-100"
                      : "bg-slate-100 text-slate-700 ring-slate-200"
                }`}
              >
                {selectedTypeVerified ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : selectedStatus === "Pending" || selectedStatus === "Processing" ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  <FileBadge className="h-5 w-5" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={getStatusTone(selectedStatus)}>
                    {driverLicenseStatusLabel[selectedStatus] ?? selectedStatus}
                  </StatusBadge>
                  {selectedConfidence != null ? <StatusBadge>{`OCR ${Math.round(selectedConfidence * 100)}%`}</StatusBadge> : null}
                </div>

                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Số GPLX</dt>
                    <dd className="mt-1 font-semibold text-slate-950">{selectedDriverLicenseNumber ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Hạng bằng</dt>
                    <dd className="mt-1 font-semibold text-slate-950">{selectedLicenseClass ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Xác minh lúc</dt>
                    <dd className="mt-1 font-semibold text-slate-950">{formatDate(selectedVerifiedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Cập nhật lại</dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {selectedTypeVerified ? formatDate(selectedCanUpdateAfter) : "Có thể gửi ngay"}
                    </dd>
                  </div>
                </dl>

                {selectedLicenseClass ? (
                  <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => void openCompatibility()}>
                    <ListChecks className="h-4 w-4" />
                    Xem hạng GPLX tương thích
                  </Button>
                ) : null}

                {selectedDecisionReason ? (
                  <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                    {translateDriverLicenseMessage(selectedDecisionReason)}
                  </p>
                ) : null}
              </div>
            </div>
          </SectionPanel>

          <SectionPanel
            title="Upload mặt trước GPLX"
            description={uploadDisabledReason ?? "Chọn đúng loại xe cần xác minh trước khi gửi ảnh GPLX."}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
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
                      className={`flex items-center justify-between rounded-md border px-4 py-3 text-left transition ${
                        active
                          ? "border-brand-300 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </span>
                      {active ? <CheckCircle2 className="h-4 w-4" /> : null}
                    </button>
                  );
                })}
              </div>

              <div className="relative overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-brand-400 hover:bg-brand-50/30">
                {displayImageUrl ? (
                  <div className="relative">
                    <img src={displayImageUrl} alt="GPLX" className="h-[320px] w-full object-contain p-3" />
                    <div className="absolute right-3 top-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className="rounded-md bg-slate-950/70 p-2 text-white transition hover:bg-slate-950"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                        }}
                        className="rounded-md bg-slate-950/70 p-2 text-white transition hover:bg-slate-950"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="grid min-h-[300px] w-full place-items-center px-6 text-center disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={Boolean(uploadDisabledReason)}
                  >
                    <span>
                      <CloudUpload className="mx-auto h-12 w-12 text-slate-300" />
                      <span className="mt-4 block text-base font-semibold text-slate-700">Nhấn để chọn ảnh GPLX</span>
                      <span className="mt-1 block text-sm text-slate-500">Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB.</span>
                    </span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={Boolean(uploadDisabledReason)}
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

              {result && !result.verified && result.status !== "Pending" ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    {driverLicenseStatusLabel[result.status] ?? result.status}
                  </div>
                  <p className="mt-1 leading-6">{translateDriverLicenseMessage(result.message)}</p>
                  {resultFlags.length > 0 ? <p className="mt-1 text-xs">Lý do: {resultFlags.join(", ")}</p> : null}
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button type="submit" isLoading={isSubmitting} disabled={!file || Boolean(uploadDisabledReason)}>
                  <Upload className="h-4 w-4" />
                  Gửi xác minh
                </Button>
              </div>
            </form>
          </SectionPanel>
        </div>

        <SectionPanel title="Cách chụp ảnh GPLX" description="Ảnh rõ giúp AI đọc đúng số bằng, hạng bằng và tên trên giấy phép.">
          <div className="space-y-3">
            {[
              "Chụp mặt trước GPLX, không cắt mất góc.",
              "Đảm bảo số GPLX và hạng bằng đọc được rõ.",
              "Không dùng ảnh quá tối, quá sáng hoặc bị nhòe.",
              "Chọn đúng loại xe cần xác minh trước khi upload.",
            ].map((text) => (
              <div key={text} className="flex items-start gap-2">
                <span className="mt-0.5 rounded-full bg-emerald-50 p-1 text-emerald-700 ring-1 ring-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="flex items-start gap-2 text-sm leading-6 text-slate-600">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
              Nếu AI chưa chắc chắn, hồ sơ sẽ chuyển sang staff duyệt thủ công.
            </p>
          </div>
        </SectionPanel>
      </div>

      {displayImageUrl ? (
        <ImagePreviewModal isOpen={previewOpen} src={displayImageUrl} title="GPLX" onClose={() => setPreviewOpen(false)} />
      ) : null}

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
