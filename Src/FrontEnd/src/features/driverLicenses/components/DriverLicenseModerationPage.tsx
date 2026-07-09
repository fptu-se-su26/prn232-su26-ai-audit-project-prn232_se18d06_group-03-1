import { useEffect, useMemo, useState } from "react";
import { Check, Eye, FileBadge, RefreshCw, Search, X } from "lucide-react";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import ImagePreviewModal from "@/components/common/ImagePreviewModal";
import PageLoader from "@/components/common/PageLoader";
import { showToast } from "@/components/common/toastStore";
import {
  driverLicenseStatusLabel,
  formatDriverLicenseFlags,
  translateDriverLicenseMessage,
} from "@/features/driverLicenses/driverLicenseDisplay";
import {
  approveDriverLicenseVerification,
  getDriverLicenseVerificationById,
  getDriverLicenseVerifications,
  rejectDriverLicenseVerification,
  requestMoreDriverLicenseInfo,
} from "@/features/driverLicenses/services/driverLicenseService";
import type { DriverLicenseAiResult, DriverLicenseVerificationListItem, DriverLicenseVerificationRequestDto } from "@/features/driverLicenses/types";

type Scope = "staff" | "admin";

const statusOptions = ["Pending", "Verified", "NeedMoreInfo", "Rejected", "Failed"];

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

function parseAiResult(raw?: string | null): DriverLicenseAiResult | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DriverLicenseAiResult;
  } catch {
    return null;
  }
}

export default function DriverLicenseModerationPage({ scope }: { scope: Scope }) {
  const [items, setItems] = useState<DriverLicenseVerificationListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("Pending");
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<DriverLicenseVerificationRequestDto | null>(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [isActing, setIsActing] = useState(false);

  async function load(nextPage = page) {
    setIsLoading(true);
    try {
      const result = await getDriverLicenseVerifications(scope, {
        status: status || undefined,
        keyword: keyword || undefined,
        page: nextPage,
        pageSize: 10,
      });
      setItems(result.items);
      setTotalPages(result.totalPages || 1);
      setPage(result.page);
    } catch (error) {
      showToast({ type: "error", title: "Không tải được GPLX", message: error instanceof Error ? translateDriverLicenseMessage(error.message) : "Vui lòng thử lại." });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, status]);

  async function openDetail(id: number) {
    try {
      const data = await getDriverLicenseVerificationById(scope, id);
      setDetail(data);
      setActionReason("");
    } catch (error) {
      showToast({ type: "error", title: "Không tải được chi tiết", message: error instanceof Error ? translateDriverLicenseMessage(error.message) : "Vui lòng thử lại." });
    }
  }

  async function runAction(kind: "approve" | "reject" | "more") {
    if (!detail) return;
    if (kind !== "approve" && !actionReason.trim()) {
      showToast({ type: "error", title: "Thiếu lý do", message: "Vui lòng nhập lý do xử lý." });
      return;
    }

    setIsActing(true);
    try {
      if (kind === "approve") await approveDriverLicenseVerification(scope, detail.id);
      if (kind === "reject") await rejectDriverLicenseVerification(scope, detail.id, actionReason);
      if (kind === "more") await requestMoreDriverLicenseInfo(scope, detail.id, actionReason);
      showToast({ type: "success", title: "Đã xử lý GPLX", message: "Trạng thái hồ sơ đã được cập nhật." });
      setDetail(null);
      await load();
    } catch (error) {
      showToast({ type: "error", title: "Xử lý thất bại", message: error instanceof Error ? translateDriverLicenseMessage(error.message) : "Vui lòng thử lại." });
    } finally {
      setIsActing(false);
    }
  }

  const ai = useMemo(() => parseAiResult(detail?.externalResultJson), [detail]);
  const aiFlags = formatDriverLicenseFlags(ai?.flags);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Xác minh GPLX</h1>
          <p className="mt-1 text-sm text-slate-500">Duyệt các hồ sơ GPLX cần nhân viên kiểm tra.</p>
        </div>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void load(1);
          }}
        >
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
            <option value="">Tất cả</option>
            {statusOptions.map((option) => <option key={option} value={option}>{driverLicenseStatusLabel[option] ?? option}</option>)}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tên hoặc email" className="h-10 w-56 rounded-md border border-slate-200 pl-9 pr-3 text-sm" />
          </div>
          <Button type="submit" variant="secondary"><RefreshCw className="h-4 w-4" />Lọc</Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {isLoading ? (
          <PageLoader label="Đang tải..." />
        ) : items.length === 0 ? (
          <EmptyState title="Không có hồ sơ GPLX" description="Không tìm thấy hồ sơ phù hợp với bộ lọc hiện tại." />
        ) : (
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">OCR</th>
                <th className="px-4 py-3">Ngày gửi</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{item.userFullName}</p>
                    <p className="text-xs text-slate-500">{item.userEmail}</p>
                  </td>
                  <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{driverLicenseStatusLabel[item.status] ?? item.status}</span></td>
                  <td className="px-4 py-3">{item.confidence != null ? `${Math.round(item.confidence * 100)}%` : "-"}</td>
                  <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button type="button" variant="secondary" size="sm" onClick={() => void openDetail(item.id)}><Eye className="h-4 w-4" />Xem</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={() => void load(page - 1)}>Trước</Button>
        <span className="text-sm text-slate-500">{page}/{totalPages}</span>
        <Button type="button" variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Sau</Button>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">GPLX #{detail.id}</h2>
                <p className="text-sm text-slate-500">{detail.userFullName} · {detail.userEmail}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[360px_1fr]">
              <div>
                {detail.frontImageUrl ? (
                  <button type="button" onClick={() => setImageOpen(true)} className="block overflow-hidden rounded-md border border-slate-200">
                    <img src={detail.frontImageUrl} alt="GPLX" className="h-60 w-full object-cover" />
                  </button>
                ) : (
                  <div className="flex h-60 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400"><FileBadge className="h-10 w-10" /></div>
                )}
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Trạng thái</dt><dd className="font-medium text-slate-900">{driverLicenseStatusLabel[detail.status] ?? detail.status}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">Ngày gửi</dt><dd className="font-medium text-slate-900">{formatDate(detail.createdAt)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">OCR</dt><dd className="font-medium text-slate-900">{detail.confidence != null ? `${Math.round(detail.confidence * 100)}%` : "-"}</dd></div>
                </dl>
              </div>
              <div className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Tên OCR" value={ai?.extracted?.fullName} />
                  <Info label="Số GPLX" value={ai?.extracted?.driverLicenseNumber} />
                  <Info label="Hạng bằng" value={ai?.extracted?.licenseClass} />
                  <Info label="Hết hạn" value={ai?.extracted?.expiryDate} />
                  <Info label="Khớp tên" value={ai?.nameMatch?.matched == null ? "-" : ai.nameMatch.matched ? "Khớp" : "Không khớp"} />
                  <Info label="Điểm tên" value={ai?.nameMatch?.score?.toString()} />
                </div>
                {aiFlags.length > 0 && <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">Lý do cần kiểm tra: {aiFlags.join(", ")}</div>}
                {detail.decisionReason && <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{translateDriverLicenseMessage(detail.decisionReason)}</div>}
                <textarea value={actionReason} onChange={(event) => setActionReason(event.target.value)} rows={3} placeholder="Lý do nếu từ chối hoặc yêu cầu bổ sung" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
                {detail.status === "Pending" && (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="secondary" isLoading={isActing} onClick={() => void runAction("more")}>Yêu cầu bổ sung</Button>
                    <Button type="button" variant="secondary" isLoading={isActing} onClick={() => void runAction("reject")}><X className="h-4 w-4" />Từ chối</Button>
                    <Button type="button" isLoading={isActing} onClick={() => void runAction("approve")}><Check className="h-4 w-4" />Duyệt</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {detail.frontImageUrl && <ImagePreviewModal isOpen={imageOpen} src={detail.frontImageUrl} title="GPLX" onClose={() => setImageOpen(false)} />}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value || "-"}</p>
    </div>
  );
}
