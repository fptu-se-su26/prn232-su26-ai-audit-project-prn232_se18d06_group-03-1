import { ArrowLeft, Car, Bike, Pencil, AlertCircle, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVehicleById, toggleVehicleStatus, uploadVehicleDocument } from "@/features/vehicles/services/vehicleService";
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

const documentStatusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Verified: "bg-green-100 text-green-700",
  NeedMoreInfo: "bg-orange-100 text-orange-700",
  ManualReview: "bg-blue-100 text-blue-700",
  Rejected: "bg-red-100 text-red-700",
  Failed: "bg-slate-100 text-slate-600",
};

const documentStatusLabels: Record<string, string> = {
  Pending: "Chờ xử lý",
  Verified: "Đã xác thực",
  NeedMoreInfo: "Cần bổ sung",
  ManualReview: "Chờ nhân viên xem",
  Rejected: "Từ chối",
  Failed: "Lỗi xử lý",
};

export default function OwnerVehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

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
    } catch {
      setDocumentError("Không thể gửi lại giấy tờ xe. Vui lòng thử lại.");
    } finally {
      setIsUploadingDocument(false);
    }
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

        {vehicle.documents.length > 0 && (
          <div>
            <label className="text-xs text-slate-400">Giấy tờ xe</label>
            <div className="mt-2 space-y-3">
              {vehicle.documents.map((doc) => (
                <div key={doc.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${documentStatusColors[doc.verificationStatus] ?? "bg-slate-100 text-slate-600"}`}>
                      {documentStatusLabels[doc.verificationStatus] ?? doc.verificationStatus}
                    </span>
                    {doc.isCurrent && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">Hiện tại</span>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-xs text-slate-400">Biển số OCR</span><p className="font-medium text-slate-800">{doc.ocrLicensePlate ?? "-"}</p></div>
                    <div><span className="text-xs text-slate-400">Hãng OCR</span><p className="font-medium text-slate-800">{doc.ocrBrand ?? "-"}</p></div>
                    <div><span className="text-xs text-slate-400">Dòng xe OCR</span><p className="font-medium text-slate-800">{doc.ocrModel ?? "-"}</p></div>
                    <div><span className="text-xs text-slate-400">Độ tin cậy</span><p className="font-medium text-slate-800">{doc.ocrConfidence != null ? `${doc.ocrConfidence}` : "-"}</p></div>
                  </div>
                  {doc.decisionReason && <p className="mt-2 text-sm text-red-600">{doc.decisionReason}</p>}
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-medium text-brand-700 hover:text-brand-800">Xem cavet</a>
                </div>
              ))}
            </div>
          </div>
        )}

        {canUploadReplacementDocument && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-3">
              <UploadCloud className="mt-0.5 h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-orange-900">Bổ sung lại giấy tờ xe</h2>
                <p className="mt-1 text-sm text-orange-700">
                  Hồ sơ hiện tại cần bổ sung hoặc đã bị từ chối. Chọn ảnh cà vẹt mới để hệ thống xác thực lại.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      setDocumentFile(event.target.files?.[0] ?? null);
                      setDocumentError(null);
                    }}
                    className="block text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-orange-700 hover:file:bg-orange-100"
                  />
                  <button
                    type="button"
                    disabled={!documentFile || isUploadingDocument}
                    onClick={handleDocumentUpload}
                    className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UploadCloud className="h-4 w-4" />
                    {isUploadingDocument ? "Đang gửi..." : "Gửi xác thực lại"}
                  </button>
                </div>
                {documentFile && <p className="mt-2 text-xs text-orange-700">Đã chọn: {documentFile.name}</p>}
                {documentError && <p className="mt-2 text-sm text-red-600">{documentError}</p>}
              </div>
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
