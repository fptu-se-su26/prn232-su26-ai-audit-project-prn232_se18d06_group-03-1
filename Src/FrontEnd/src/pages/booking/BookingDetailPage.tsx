import { ArrowLeft, CalendarDays, Camera, Check, Clock, ClipboardCheck, DollarSign, MapPin, TicketPercent, CreditCard, X, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Card from "@/components/ui/Card";
import { getBookingById, approveBooking, rejectBooking, ownerCompleteBooking, createCheckInReport, getInspectionReports } from "@/features/booking/bookingService";
import { createPaymentLink } from "@/features/payments/services/paymentService";
import type { BookingResponse, InspectionReportResponse } from "@/features/booking/types";
import { showToast } from "@/components/common/toastStore";
import RiskScoreBadge from "@/features/booking/components/RiskScoreBadge";
import { useAuthStore } from "@/features/auth/hooks/useAuth";

const statusLabels: Record<string, string> = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Đã từ chối",
  Cancelled: "Đã hủy",
  DepositPaid: "Đã đặt cọc",
  Confirmed: "Đã xác nhận",
  InProgress: "Đang nhận xe",
  Completed: "Hoàn thành",
};

const statusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-blue-100 text-blue-700",
  Rejected: "bg-red-100 text-red-700",
  Cancelled: "bg-slate-100 text-slate-600",
  DepositPaid: "bg-violet-100 text-violet-700",
  Confirmed: "bg-green-100 text-green-700",
  InProgress: "bg-cyan-100 text-cyan-700",
  Completed: "bg-emerald-100 text-emerald-700",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const primaryRole = user?.roles[0] ?? "Customer";
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [inspectionReports, setInspectionReports] = useState<InspectionReportResponse[]>([]);
  const [odometerKm, setOdometerKm] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [damageNoted, setDamageNoted] = useState(false);
  const [damageDescription, setDamageDescription] = useState("");
  const [checkInImages, setCheckInImages] = useState<File[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const bookingId = Number(id);
      const result = await getBookingById(bookingId);
      setBooking(result);
      if (user) {
        const reports = await getInspectionReports(bookingId).catch(() => []);
        setInspectionReports(reports);
      }
    } catch {
      setBooking(null);
      setInspectionReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [id, user]);

  useEffect(() => { void load(); }, [load]);

  async function handleApprove() {
    if (!booking || isProcessing) return;
    setIsProcessing(true);
    try {
      const updated = await approveBooking(booking.id);
      setBooking(updated);
      showToast({ type: "success", title: "Đã duyệt", message: "Booking đã được duyệt thành công." });
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể duyệt booking." });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReject() {
    if (!booking || isProcessing || !rejectReason.trim()) return;
    setIsProcessing(true);
    try {
      const updated = await rejectBooking(booking.id, { reason: rejectReason.trim() });
      setBooking(updated);
      showToast({ type: "success", title: "Đã từ chối", message: "Booking đã bị từ chối." });
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể từ chối booking." });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handlePayDeposit() {
    if (!booking || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await createPaymentLink(booking.id, window.location.href);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        showToast({ type: "error", title: "Lá»—i", message: "KhÃ´ng nháº­n Ä‘Æ°á»£c Ä‘Æ°á»ng dáº«n thanh toÃ¡n." });
      }
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tạo liên kết thanh toán." });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleComplete() {
    if (!booking || isProcessing) return;
    setIsProcessing(true);
    try {
      const updated = await ownerCompleteBooking(booking.id);
      setBooking(updated);
      showToast({ type: "success", title: "HoÃ n thÃ nh chuyáº¿n Ä‘i", message: "XÃ¡c nháº­n chuyáº¿n Ä‘i hoÃ n thÃ nh thÃ nh cÃ´ng." });
    } catch {
      showToast({ type: "error", title: "Lá»—i", message: "KhÃ´ng thá»ƒ hoÃ n thÃ nh chuyáº¿n Ä‘i." });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCreateCheckInReport() {
    if (!booking || isProcessing || checkInImages.length === 0) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      if (odometerKm) formData.append("odometerKm", odometerKm);
      if (fuelLevel) formData.append("fuelLevel", fuelLevel);
      formData.append("damageNoted", String(damageNoted));
      if (damageDescription) formData.append("damageDescription", damageDescription);
      checkInImages.forEach((file) => formData.append("images", file));

      await createCheckInReport(booking.id, formData);
      const reports = await getInspectionReports(booking.id);
      setInspectionReports(reports);
      setOdometerKm("");
      setFuelLevel("");
      setDamageNoted(false);
      setDamageDescription("");
      setCheckInImages([]);
      showToast({ type: "success", title: "Đã tạo biên bản", message: "Biên bản check-in đang chờ khách xác nhận." });
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tạo biên bản check-in." });
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) return <LoadingSpinner />;
  if (!booking) return <p className="text-sm text-red-600">Không tìm thấy booking.</p>;
  const checkInReport = inspectionReports.find((report) => report.type === "CheckIn");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /> Quay lại</Button>
      </div>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">{primaryRole}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Booking {booking.bookingCode}</h1>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[booking.status] ?? "bg-slate-100 text-slate-700"}`}>
            {statusLabels[booking.status] ?? booking.status}
          </span>
          {primaryRole === "Owner" && (
            <span className="mt-2">
              <RiskScoreBadge score={booking.riskScore} />
            </span>
          )}
        </div>
      </section>

      {primaryRole === "Owner" && (
        <Card className="rounded-md p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Đánh giá rủi ro</h2>
              <p className="mt-1 text-sm text-slate-600">
                Điểm rule-based hỗ trợ chủ xe cân nhắc trước khi duyệt booking.
              </p>
            </div>
            <RiskScoreBadge score={booking.riskScore} />
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Tín hiệu ghi nhận</p>
            {booking.riskFactors && booking.riskFactors.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {booking.riskFactors.map((factor) => (
                  <span
                    key={factor}
                    className="rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                API chưa trả chi tiết rule cho booking này. Hãy restart backend để dùng response riskFactors mới.
              </p>
            )}
          </div>
        </Card>
      )}

      {primaryRole === "Owner" && booking.status === "Pending" && (
        <Card className="space-y-4 rounded-md p-5">
          <h2 className="text-lg font-bold text-slate-950">Xử lý yêu cầu</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={handleApprove} isLoading={isProcessing}>
              <Check className="h-4 w-4" /> Duyệt booking
            </Button>
            <div className="flex flex-1 items-center gap-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm"
              />
              <Button variant="secondary" onClick={handleReject} isLoading={isProcessing} disabled={!rejectReason.trim()}>
                <X className="h-4 w-4" /> Từ chối
              </Button>
            </div>
          </div>
        </Card>
      )}

      {primaryRole === "Owner" && (
        <Card className="space-y-4 rounded-md p-5">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 text-brand-700" />
            <div>
              <h2 className="text-lg font-bold text-slate-950">Biên bản check-in</h2>
              <p className="text-sm text-slate-600">Ghi nhận tình trạng xe và ảnh trước khi bàn giao.</p>
            </div>
          </div>

          {checkInReport ? (
            <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p><span className="font-semibold text-slate-700">Km:</span> {checkInReport.odometerKm ?? "-"}</p>
                <p><span className="font-semibold text-slate-700">Nhiên liệu:</span> {checkInReport.fuelLevel || "-"}</p>
                <p><span className="font-semibold text-slate-700">Tình trạng:</span> {checkInReport.damageNoted ? "Có ghi nhận hư hỏng" : "Không ghi nhận hư hỏng"}</p>
                <p><span className="font-semibold text-slate-700">Xác nhận khách:</span> {checkInReport.isCustomerConfirmed ? "Đã xác nhận" : "Chờ xác nhận"}</p>
              </div>
              {checkInReport.damageDescription && <p className="text-sm text-slate-700">{checkInReport.damageDescription}</p>}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {checkInReport.images.map((image) => (
                  <a key={image.id} href={image.imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-slate-200 bg-white">
                    <img src={image.imageUrl} alt="Check-in" className="aspect-square w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          ) : booking.status === "DepositPaid" || booking.status === "Confirmed" ? (
            <div className="space-y-4 rounded-md border border-slate-200 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input type="number" min="0" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} placeholder="Số km hiện tại" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
                <input type="text" value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)} placeholder="Mức nhiên liệu" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={damageNoted} onChange={(e) => setDamageNoted(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                Có ghi nhận hư hỏng/tình trạng cần lưu ý
              </label>
              <textarea value={damageDescription} onChange={(e) => setDamageDescription(e.target.value)} rows={3} placeholder="Mô tả tình trạng xe, vết xước, phụ kiện đi kèm..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 hover:bg-slate-100">
                <Camera className="mb-2 h-6 w-6 text-brand-700" />
                <span className="font-semibold">Chọn ảnh before</span>
                <span className="mt-1 text-xs">JPG, PNG, WebP - tối đa 12 ảnh</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => setCheckInImages(Array.from(e.target.files ?? []).slice(0, 12))} />
              </label>
              {checkInImages.length > 0 && <p className="text-xs font-medium text-slate-500">Đã chọn {checkInImages.length} ảnh</p>}
              <Button variant="primary" onClick={handleCreateCheckInReport} isLoading={isProcessing} disabled={checkInImages.length === 0}>
                Tạo biên bản check-in
              </Button>
            </div>
          ) : (
            <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Booking chưa ở trạng thái có thể check-in.</p>
          )}
        </Card>
      )}

      {primaryRole === "Customer" && booking.status === "Approved" && (
        <Card className="space-y-4 rounded-md p-5">
          <h2 className="text-lg font-bold text-slate-950">Thanh toán đặt cọc</h2>
          <p className="text-sm text-slate-600">
            Chủ xe đã duyệt booking của bạn. Vui lòng thanh toán cọc{" "}
            <span className="font-semibold text-slate-900">{formatCurrency(booking.depositAmount)}</span>{" "}
            qua PayOS để xác nhận đặt xe.
          </p>
          <Button variant="primary" onClick={handlePayDeposit} isLoading={isProcessing}>
            <ExternalLink className="h-4 w-4" /> Thanh toán cọc qua PayOS
          </Button>
        </Card>
      )}

      {primaryRole === "Owner" && booking.status === "DepositPaid" && (
        <Card className="space-y-4 rounded-md p-5">
          <h2 className="text-lg font-bold text-slate-950">HoÃ n thÃ nh chuyáº¿n Ä‘i</h2>
          <p className="text-sm text-slate-600">
            KhÃ¡ch hÃ ng Ä‘Ã£ thanh toÃ¡n cá»c <span className="font-semibold text-slate-900">{formatCurrency(booking.depositAmount)}</span>.
            XÃ¡c nháº­n hoÃ n thÃ nh Ä‘á»ƒ há»‡ thá»‘ng káº¿t toÃ¡n sá»‘ dÆ° vÃ­.
          </p>
          <Button variant="primary" onClick={handleComplete} isLoading={isProcessing}>
            <Check className="h-4 w-4" /> XÃ¡c nháº­n hoÃ n thÃ nh chuyáº¿n Ä‘i
          </Button>
        </Card>
      )}

      {booking.cancelReason && (
        <Alert variant="warning" title="Lý do từ chối / hủy">{booking.cancelReason}</Alert>
      )}

      <Card className="space-y-4 rounded-md p-5">
        <h2 className="text-lg font-bold text-slate-950">Thông tin thuê xe</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-brand-700" />
            <div>
              <p className="text-xs text-slate-500">Ngày nhận xe</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(booking.startDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-brand-700" />
            <div>
              <p className="text-xs text-slate-500">Ngày trả xe</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(booking.endDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-brand-700" />
            <div>
              <p className="text-xs text-slate-500">Địa chỉ nhận xe</p>
              <p className="text-sm font-medium text-slate-900">{booking.pickupAddress}</p>
            </div>
          </div>
          {booking.returnAddress && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-brand-700" />
              <div>
                <p className="text-xs text-slate-500">Địa chỉ trả xe</p>
                <p className="text-sm font-medium text-slate-900">{booking.returnAddress}</p>
              </div>
            </div>
          )}
        </div>
        {booking.customerNote && (
          <div>
            <p className="text-xs text-slate-500">Ghi chú</p>
            <p className="text-sm text-slate-700">{booking.customerNote}</p>
          </div>
        )}
      </Card>

      <Card className="space-y-4 rounded-md p-5">
        <h2 className="text-lg font-bold text-slate-950">Chi tiết giá</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Giá cơ bản ({booking.totalDays} ngày)</span>
            <span className="font-medium text-slate-900">{formatCurrency(booking.basePrice)}</span>
          </div>
          {booking.discountPercent > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-slate-600">
                <TicketPercent className="h-4 w-4 text-green-600" />
                Giảm giá ({booking.discountPercent}%)
              </span>
              <span className="font-medium text-green-600">-{formatCurrency(booking.discountAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Phí nền tảng</span>
            <span className="font-medium text-slate-900">{formatCurrency(booking.platformFee)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm">
            <span className="flex items-center gap-1 text-slate-600">
              <CreditCard className="h-4 w-4 text-brand-700" />
              Tiền cọc
            </span>
            <span className="font-medium text-slate-900">{formatCurrency(booking.depositAmount)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="flex items-center gap-1 font-semibold text-slate-900">
              <DollarSign className="h-5 w-5 text-brand-700" />
              Tổng cộng
            </span>
            <span className="text-xl font-bold text-brand-700">{formatCurrency(booking.totalAmount)}</span>
          </div>
        </div>
      </Card>

      <Card className="rounded-md p-5">
        <h2 className="mb-3 text-lg font-bold text-slate-950">Lịch sử trạng thái</h2>
        <div className="space-y-3">
          {booking.statusHistory.map((h, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-brand-700" />
                {i < booking.statusHistory.length - 1 && <div className="h-full w-px bg-slate-200" />}
              </div>
              <div className="pb-3">
                <p className="text-sm font-medium text-slate-900">
                  {h.fromStatus ? `${statusLabels[h.fromStatus] ?? h.fromStatus} → ${statusLabels[h.toStatus] ?? h.toStatus}` : statusLabels[h.toStatus] ?? h.toStatus}
                </p>
                <p className="text-xs text-slate-500">{formatDateTime(h.createdAt)}</p>
                {h.note && <p className="text-xs text-slate-500">{h.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
