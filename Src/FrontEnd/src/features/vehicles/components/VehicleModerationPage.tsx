import { ArrowLeft, Check, Eye, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "@/components/common/LoadingSpinner";
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
      status: "Pending,Rejected",
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
  return flags.filter((flag) => !(recommendation === "Pass" && flag === "IMAGE_TOO_BLURRY"));
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
          <option value="Pending,Rejected">Chờ duyệt / Từ chối</option>
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
  const currentDocument = vehicle?.documents.find((doc) => doc.isCurrent) ?? vehicle?.documents[0];

  async function reload() {
    setLoading(true);
    const data = await getModerationVehicleById(role, id);
    setVehicle(data ?? null);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, [role, id]);

  async function withReason(action: (reason: string) => Promise<void>) {
    const reason = window.prompt("Nhập lý do");
    if (!reason) return;
    await action(reason);
    await reload();
  }

  if (loading) return <LoadingSpinner />;
  if (!vehicle) return null;

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
        <button type="button" onClick={async () => { await approveVehicleListing(role, vehicle.id); await reload(); }} className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
          <Check className="h-4 w-4" /> Duyệt bài
        </button>
        <button type="button" onClick={() => withReason((reason) => rejectVehicleListing(role, vehicle.id, reason))} className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
          <X className="h-4 w-4" /> Từ chối bài
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">Thông tin xe</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-xs text-slate-400">Trạng thái</span><p>{vehicleStatusLabels[vehicle.status] ?? vehicle.status}</p></div>
              <div><span className="text-xs text-slate-400">Loại xe</span><p>{vehicle.vehicleType}</p></div>
              <div><span className="text-xs text-slate-400">Giá</span><p>{vehicle.pricePerDay.toLocaleString("vi-VN")}đ/ngày</p></div>
              <div><span className="text-xs text-slate-400">Chủ xe</span><p>#{vehicle.ownerId}</p></div>
              <div className="col-span-2"><span className="text-xs text-slate-400">Địa chỉ</span><p>{vehicle.address}</p></div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">Ảnh xe</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {vehicle.images.map((image) => <img key={image.id} src={image.imageUrl} alt="" className="aspect-[4/3] rounded-md object-cover" />)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">Hồ sơ xe</h2>
            {currentDocument ? (
              <div className="mt-3 space-y-3 text-sm">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(currentDocument.verificationStatus)}`}>{documentStatusLabels[currentDocument.verificationStatus] ?? currentDocument.verificationStatus}</span>
                <a href={currentDocument.fileUrl} target="_blank" rel="noreferrer" className="block text-brand-700 hover:text-brand-800">Xem cavet</a>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-xs text-slate-400">Biển số</span><p>{currentDocument.ocrLicensePlate ?? "-"}</p></div>
                  <div><span className="text-xs text-slate-400">Hãng</span><p>{currentDocument.ocrBrand ?? "-"}</p></div>
                  <div><span className="text-xs text-slate-400">Dòng</span><p>{currentDocument.ocrModel ?? "-"}</p></div>
                  <div><span className="text-xs text-slate-400">Confidence</span><p>{currentDocument.ocrConfidence ?? "-"}</p></div>
                </div>
                {currentDocument.decisionReason && <p className="rounded-md bg-red-50 p-2 text-red-700">{currentDocument.decisionReason}</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={async () => { await approveVehicleDocument(role, vehicle.id, currentDocument.id); await reload(); }} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">Duyệt hồ sơ</button>
                  <button type="button" onClick={() => withReason((reason) => rejectVehicleDocument(role, vehicle.id, currentDocument.id, reason))} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">Từ chối</button>
                  <button type="button" onClick={() => withReason((reason) => requestVehicleDocumentMoreInfo(role, vehicle.id, currentDocument.id, reason))} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Bổ sung</button>
                </div>
              </div>
            ) : <p className="mt-3 text-sm text-slate-400">Chưa có cavet.</p>}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">Log AI</h2>
            <div className="mt-3 space-y-2">
              {vehicle.verificationLogs.map((log) => (
                <div key={log.id ?? log.createdAt} className="rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                  <p className="font-medium text-slate-800">{recommendationLabels[log.recommendation ?? ""] ?? log.recommendation ?? "Log"}</p>
                  <p>{logText(log.recommendation, log.flags, log.message, log.errorMessage)}</p>
                </div>
              ))}
              {vehicle.verificationLogs.length === 0 && <p className="text-sm text-slate-400">Chưa có log.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
