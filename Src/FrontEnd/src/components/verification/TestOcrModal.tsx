import { useEffect, useRef, useState } from "react";
import { FileBadge, FlaskConical, ImagePlus, X } from "lucide-react";
import Button from "@/components/common/Button";
import { getApiErrorMessage } from "@/services/apiClient";
import type { DriverLicenseOcrTestResult } from "@/features/driverLicenses/services/driverLicenseService";
import type { NationalIdOcrTestResult } from "@/features/owner/services/nationalIdReviewService";
import {
  driverLicenseStatusLabel,
  formatDriverLicenseFlags,
} from "@/features/driverLicenses/driverLicenseDisplay";

export type TestOcrMode = "cccd" | "gplx";

type OcrUploadResult = DriverLicenseOcrTestResult | NationalIdOcrTestResult;

interface TestOcrModalProps {
  open: boolean;
  onClose: () => void;
  mode: TestOcrMode;
  title: string;
  runTest: (file: File, fullName?: string) => Promise<OcrUploadResult>;
}

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE = 5 * 1024 * 1024;

type CccdRawExtracted = {
  nationalIdNumber?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  sex?: string | null;
  placeOfOrigin?: string | null;
  placeOfResidence?: string | null;
  nationality?: string | null;
};

function parseCccdRaw(rawResponse?: string | null): CccdRawExtracted | null {
  if (!rawResponse) return null;
  try {
    const parsed = JSON.parse(rawResponse) as { extracted?: CccdRawExtracted | null };
    return parsed?.extracted ?? null;
  } catch {
    return null;
  }
}

function vehicleTypeLabel(value?: string | null) {
  if (!value) return "-";
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.toLowerCase() === "car") return "Ô tô";
      if (part.toLowerCase() === "motorbike" || part.toLowerCase() === "motorcycle") return "Xe máy";
      return part;
    })
    .join(" / ") || "-";
}

function confidenceOf(mode: TestOcrMode, result: OcrUploadResult): number | null {
  if (mode === "gplx") {
    const value = (result as DriverLicenseOcrTestResult).ocrConfidence;
    return typeof value === "number" ? value : null;
  }
  const value = (result as NationalIdOcrTestResult).confidence;
  return typeof value === "number" ? value : null;
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value || "-"}</p>
    </div>
  );
}

export default function TestOcrModal({ open, onClose, mode, title, runTest }: TestOcrModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<OcrUploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setFullName("");
      setResult(null);
      setErrorMessage(null);
      setIsDragging(false);
    }
  }, [open ]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function pickFile(next: File | undefined) {
    if (!next) return;
    const ext = `.${next.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setErrorMessage("Chỉ chấp nhận file JPG, PNG hoặc WebP.");
      return;
    }
    if (next.size > MAX_SIZE) {
      setErrorMessage("Kích thước file tối đa là 5MB.");
      return;
    }
    setErrorMessage(null);
    setResult(null);
    setFile(next);
  }

  async function handleRun() {
    if (!file || isTesting) return;
    setIsTesting(true);
    setErrorMessage(null);
    try {
      const data = await runTest(file, mode === "gplx" ? fullName : undefined);
      setResult(data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Test OCR thất bại. Vui lòng thử lại."));
    } finally {
      setIsTesting(false);
    }
  }

  const confidence = result ? confidenceOf(mode, result) : null;
  const cccdExtracted = mode === "cccd" && result ? parseCccdRaw((result as NationalIdOcrTestResult).rawResponse) : null;
  const gplx = mode === "gplx" ? (result as DriverLicenseOcrTestResult | null) : null;
  const resultFlags = result?.flags ?? [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-brand-600" />
            <h2 className="font-semibold text-slate-900">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[360px_1fr]">
          <div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                pickFile(event.dataTransfer.files?.[0]);
              }}
              className={`flex h-60 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
                isDragging ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
              }`}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Ảnh test OCR" className="h-full w-full object-contain" />
              ) : (
                <>
                  <ImagePlus className="h-10 w-10 text-slate-400" />
                  <p className="px-4 text-center text-sm text-slate-500">Kéo thả ảnh vào đây hoặc bấm để chọn file</p>
                  <p className="text-xs text-slate-400">JPG, PNG hoặc WebP · tối đa 5MB</p>
                </>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(event) => {
                pickFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            {file && (
              <p className="mt-2 truncate text-xs text-slate-500" title={file.name}>
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            )}
            {mode === "gplx" && (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-500">Tên cần so khớp (không bắt buộc)</label>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nhập họ tên để kiểm tra khớp tên..."
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
                <dt className="text-slate-500">OCR confidence</dt>
                <dd className="font-medium text-slate-900">{confidence != null ? `${Math.round(confidence * 100)}%` : "-"}</dd>
              </div>
            </dl>
            <Button type="button" isLoading={isTesting} disabled={!file} onClick={() => void handleRun()} className="mt-3 w-full">
              <FlaskConical className="h-4 w-4" />Chạy OCR
            </Button>
            {errorMessage && (
              <p className="mt-2 text-center text-sm font-medium text-red-600" role="alert">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {!result ? (
              <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-md border border-slate-100 bg-slate-50/50 text-slate-400">
                <FileBadge className="h-8 w-8" />
                <p className="text-sm">Thả ảnh và bấm Chạy OCR để xem kết quả.</p>
              </div>
            ) : mode === "cccd" ? (
              <div className="space-y-3 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Số CCCD" value={cccdExtracted?.nationalIdNumber} />
                  <Info label="Họ tên" value={cccdExtracted?.fullName} />
                  <Info label="Ngày sinh" value={cccdExtracted?.dateOfBirth} />
                  <Info label="Giới tính" value={cccdExtracted?.sex} />
                  <Info label="Quê quán" value={cccdExtracted?.placeOfOrigin} />
                  <Info label="Nơi thường trú" value={cccdExtracted?.placeOfResidence} />
                  <Info label="Quốc tịch" value={cccdExtracted?.nationality} />
                </div>
                {result.recommendation && (
                  <p className="text-xs text-slate-500">Đánh giá AI: {driverLicenseStatusLabel[result.recommendation] ?? result.recommendation}</p>
                )}
                {resultFlags.length > 0 && (
                  <p className="text-xs text-amber-800">Cảnh báo: {formatDriverLicenseFlags(resultFlags).join(", ")}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Tên OCR" value={gplx?.extracted?.fullName} />
                  <Info label="Số GPLX" value={gplx?.extracted?.driverLicenseNumber} />
                  <Info label="Hạng bằng" value={gplx?.extracted?.licenseClass} />
                  <Info label="Xác minh cho" value={vehicleTypeLabel(gplx?.licenseVehicleType)} />
                  <Info label="Hết hạn" value={gplx?.extracted?.expiryDate} />
                  <Info label="Khớp tên" value={gplx?.nameMatch?.matched == null ? "-" : gplx.nameMatch.matched ? "Khớp" : "Không khớp"} />
                  <Info label="Điểm tên" value={gplx?.nameMatch?.score?.toString()} />
                </div>
                {gplx?.recommendation && (
                  <p className="text-xs text-slate-500">Đánh giá AI: {driverLicenseStatusLabel[gplx.recommendation] ?? gplx.recommendation}</p>
                )}
                {(gplx?.flags?.length ?? 0) > 0 && (
                  <p className="text-xs text-amber-800">Cảnh báo: {formatDriverLicenseFlags(gplx?.flags ?? []).join(", ")}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
