import { ArrowLeft, CalendarDays, Check, Clock, DollarSign, MapPin, TicketPercent, CreditCard, X, ExternalLink, Banknote } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Card from "@/components/ui/Card";
import { getBookingById, approveBooking, rejectBooking, ownerCompleteBooking } from "@/features/booking/bookingService";
import { createPaymentLink } from "@/features/payments/services/paymentService";
import type { BookingResponse } from "@/features/booking/types";
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
  Completed: "Hoàn thành",
};

const statusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-blue-100 text-blue-700",
  Rejected: "bg-red-100 text-red-700",
  Cancelled: "bg-slate-100 text-slate-600",
  DepositPaid: "bg-violet-100 text-violet-700",
  Confirmed: "bg-green-100 text-green-700",
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
  const user = useAuthStore((state) => state.user);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      setBooking(await getBookingById(Number(id)));
    } catch {
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

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
        showToast({ type: "error", title: "Lỗi", message: "Không nhận được đường dẫn thanh toán." });
      }
    } catch {
      showToast({ type: "error", title: "Lỗi thanh toán", message: "Không thể tạo liên kết thanh toán." });
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
      showToast({ type: "success", title: "Hoàn thành chuyến đi", message: "Xác nhận chuyến đi hoàn thành thành công." });
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể hoàn thành chuyến đi." });
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) return <LoadingSpinner />;
  if (!booking) return <p className="text-sm text-red-600">Không tìm thấy booking.</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link to={booking?.ownerId === user?.userId ? "/booking/manage" : "/booking/list"}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Quay lại</Button>
        </Link>
      </div>

      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Booking {booking.bookingCode}</h1>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[booking.status] ?? "bg-slate-100 text-slate-700"}`}>
            {statusLabels[booking.status] ?? booking.status}
          </span>
          {booking?.ownerId === user?.userId && (
            <span className="mt-2">
              <RiskScoreBadge score={booking.riskScore} />
            </span>
          )}
        </div>
      </section>

      {booking?.ownerId === user?.userId && (
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

      {booking?.customerId === user?.userId && booking.status === "Pending" && (
        <Alert variant="info" title="Đang chờ chủ xe duyệt">
          Yêu cầu thuê xe của bạn đã được gửi đến chủ xe. Vui lòng chờ chủ xe xác nhận. Bạn sẽ nhận được thông báo và có thể tiến hành thanh toán cọc sau khi chủ xe đồng ý.
        </Alert>
      )}

      {booking?.ownerId === user?.userId && booking.status === "Pending" && (
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

      {booking?.customerId === user?.userId && booking.status === "Approved" && booking.depositAmount > 0 && (
        <Card className="space-y-4 rounded-md p-5">
          <h2 className="text-lg font-bold text-slate-950">Đặt cọc</h2>
          <p className="text-sm text-slate-600">
            Vui lòng thanh toán cọc{" "}
            <span className="font-semibold text-slate-900">{formatCurrency(booking.depositAmount)}</span>{" "}
            để xác nhận đặt xe.
          </p>
          <Button variant="primary" onClick={handlePayDeposit} isLoading={isProcessing}>
            <ExternalLink className="h-4 w-4" /> Thanh toán cọc qua PayOS
          </Button>
        </Card>
      )}

      {booking?.customerId === user?.userId && booking.status === "DepositPaid" && (
        <Card className="rounded-md p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5"><Clock className="h-5 w-5 text-slate-400" /></div>
            <div>
              <h2 className="font-bold text-slate-950">Đã đặt cọc thành công</h2>
              <p className="mt-1 text-sm text-slate-600">
                Bạn đã đặt cọc <span className="font-semibold">{formatCurrency(booking.depositAmount)}</span>.
                Vui lòng chờ chủ xe bàn giao xe và hoàn thành chuyến đi.
              </p>
            </div>
          </div>
        </Card>
      )}

      {booking?.ownerId === user?.userId && booking.status === "DepositPaid" && (
        <Card className="space-y-4 rounded-md p-5">
          <h2 className="text-lg font-bold text-slate-950">Hoàn thành chuyến đi</h2>
          <p className="text-sm text-slate-600">
            Khách hàng đã thanh toán cọc <span className="font-semibold text-slate-900">{formatCurrency(booking.depositAmount)}</span>.
            Sau khi khách hàng nhận xe, đi và trả xe, vui lòng xác nhận hoàn thành chuyến đi để hệ thống kết toán số dư ví.
          </p>
          <Button variant="primary" onClick={handleComplete} isLoading={isProcessing}>
            <Check className="h-4 w-4" /> Xác nhận hoàn thành chuyến đi
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
              Tiền cọc (Thanh toán qua PayOS)
            </span>
            <span className="font-medium text-slate-900">{formatCurrency(booking.depositAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-slate-600">
              <Banknote className="h-4 w-4 text-emerald-600" />
              Số tiền còn lại (Thanh toán trực tiếp cho chủ xe khi nhận xe)
            </span>
            <span className="font-semibold text-emerald-600">{formatCurrency(booking.totalAmount - booking.depositAmount)}</span>
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
