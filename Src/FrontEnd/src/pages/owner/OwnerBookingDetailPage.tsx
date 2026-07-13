import { ArrowLeft, CalendarDays, Camera, Check, ClipboardCheck, DollarSign, MapPin, TicketPercent, CreditCard, X, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Card from "@/components/ui/Card";
import { getBookingById, approveBooking, rejectBooking, createCheckInReport, createCheckOutReport, getInspectionReports } from "@/features/booking/bookingService";
import type { BookingResponse, InspectionReportResponse } from "@/features/booking/types";
import { showToast } from "@/components/common/toastStore";
import RiskScoreBadge from "@/features/booking/components/RiskScoreBadge";
import { createOwnerReview, getBookingReviews, hasReviewed } from "@/features/review/reviewService";
import type { ReviewResponse } from "@/features/review/reviewService";
import StarRatingInput from "@/features/review/components/StarRatingInput";
import ReviewCard from "@/features/review/components/ReviewCard";

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

export default function OwnerBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [inspectionReports, setInspectionReports] = useState<InspectionReportResponse[]>([]);
  const [odometerKm, setOdometerKm] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [damageNoted, setDamageNoted] = useState(false);
  const [damageDescription, setDamageDescription] = useState("");
  const [inspectionImages, setInspectionImages] = useState<File[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const bookingId = Number(id);
      setBooking(await getBookingById(bookingId));
      const [reviewList, reviewed, reports] = await Promise.all([
        getBookingReviews(bookingId),
        hasReviewed(bookingId),
        getInspectionReports(bookingId).catch(() => []),
      ]);
      setReviews(reviewList);
      setAlreadyReviewed(reviewed);
      setInspectionReports(reports);
    } catch {
      setBooking(null);
      setInspectionReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function handleSubmitReview() {
    if (!booking || reviewRating === 0 || isSubmittingReview) return;
    setIsSubmittingReview(true);
    try {
      await createOwnerReview({
        bookingId: booking.id,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      showToast({ type: "success", title: "Thành công", message: "Đã gửi đánh giá khách hàng." });
      setShowReviewForm(false);
      setAlreadyReviewed(true);
      const updated = await getBookingReviews(booking.id);
      setReviews(updated);
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể gửi đánh giá." });
    } finally {
      setIsSubmittingReview(false);
    }
  }

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

  async function handleCreateInspectionReport(type: "CheckIn" | "CheckOut") {
    if (!booking || isProcessing || inspectionImages.length === 0) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      if (odometerKm) formData.append("odometerKm", odometerKm);
      if (fuelLevel) formData.append("fuelLevel", fuelLevel);
      formData.append("damageNoted", String(damageNoted));
      if (damageDescription) formData.append("damageDescription", damageDescription);
      inspectionImages.forEach((file) => formData.append("images", file));

      if (type === "CheckIn") {
        await createCheckInReport(booking.id, formData);
      } else {
        await createCheckOutReport(booking.id, formData);
      }

      setInspectionReports(await getInspectionReports(booking.id));
      setOdometerKm("");
      setFuelLevel("");
      setDamageNoted(false);
      setDamageDescription("");
      setInspectionImages([]);
      showToast({
        type: "success",
        title: "Da tao bien ban",
        message: type === "CheckIn" ? "Bien ban nhan xe dang cho khach xac nhan." : "Bien ban tra xe dang cho khach xac nhan.",
      });
    } catch {
      showToast({ type: "error", title: "Loi", message: "Khong the tao bien ban." });
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) return <LoadingSpinner />;
  if (!booking) return <p className="text-sm text-red-600">Không tìm thấy booking.</p>;
  const checkInReport = inspectionReports.find((report) => report.type === "CheckIn");
  const checkOutReport = inspectionReports.find((report) => report.type === "CheckOut");
  const canCreateCheckIn = (booking.status === "DepositPaid" || booking.status === "Confirmed") && !checkInReport;
  const canCreateCheckOut = booking.status === "InProgress" && !checkOutReport;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/owner/bookings">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Quay lại</Button>
        </Link>
      </div>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Owner</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Booking {booking.bookingCode}</h1>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[booking.status] ?? "bg-slate-100 text-slate-700"}`}>
            {statusLabels[booking.status] ?? booking.status}
          </span>
          <span className="mt-2">
            <RiskScoreBadge score={booking.riskScore} />
          </span>
        </div>
      </section>

      <Card className="rounded-md p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Đánh giá rủi ro</h2>
            <p className="mt-1 text-sm text-slate-600">
              Chỉ số tổng hợp giúp chủ xe nhận diện các yếu tố cần xem xét trước khi duyệt yêu cầu.
            </p>
          </div>
          <RiskScoreBadge score={booking.riskScore} />
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Yếu tố cần lưu ý</p>
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
              Chưa có yếu tố rủi ro chi tiết cho booking này.
            </p>
          )}
        </div>
      </Card>

      {booking.status === "Pending" && (
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

      <Card className="space-y-4 rounded-md p-5">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-5 w-5 text-brand-700" />
          <div>
            <h2 className="text-lg font-bold text-slate-950">Bien ban nhan/tra xe</h2>
            <p className="text-sm text-slate-600">Owner lap bien ban va khach xac nhan truoc khi doi trang thai booking.</p>
          </div>
        </div>

        {(checkInReport || checkOutReport) && (
          <div className="space-y-3">
            {[checkInReport, checkOutReport].filter(Boolean).map((report) => (
              <div key={report!.id} className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{report!.type === "CheckIn" ? "Check-in / nhan xe" : "Check-out / tra xe"}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                    {report!.isCustomerConfirmed ? "Khach da xac nhan" : "Cho khach xac nhan"}
                  </span>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <p><span className="font-semibold text-slate-700">Km:</span> {report!.odometerKm ?? "-"}</p>
                  <p><span className="font-semibold text-slate-700">Nhien lieu:</span> {report!.fuelLevel || "-"}</p>
                  <p><span className="font-semibold text-slate-700">Tinh trang:</span> {report!.damageNoted ? "Co ghi nhan hu hong" : "Khong ghi nhan hu hong"}</p>
                  <p><span className="font-semibold text-slate-700">Ngay lap:</span> {formatDateTime(report!.createdAt)}</p>
                </div>
                {report!.damageDescription && <p className="text-sm text-slate-700">{report!.damageDescription}</p>}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {report!.images.map((image) => (
                    <a key={image.id} href={image.imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-slate-200 bg-white">
                      <img src={image.imageUrl} alt={report!.type} className="aspect-square w-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {(canCreateCheckIn || canCreateCheckOut) && (
          <div className="space-y-4 rounded-md border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">
              {canCreateCheckIn ? "Tao bien ban check-in" : "Tao bien ban check-out"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" min="0" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} placeholder="So km hien tai" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
              <input type="text" value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)} placeholder="Muc nhien lieu" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={damageNoted} onChange={(e) => setDamageNoted(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
              Co ghi nhan hu hong/tinh trang can luu y
            </label>
            <textarea value={damageDescription} onChange={(e) => setDamageDescription(e.target.value)} rows={3} placeholder="Mo ta tinh trang xe, vet xuoc, phu kien di kem..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 hover:bg-slate-100">
              <Camera className="mb-2 h-6 w-6 text-brand-700" />
              <span className="font-semibold">{canCreateCheckIn ? "Chon anh before" : "Chon anh after"}</span>
              <span className="mt-1 text-xs">JPG, PNG, WebP - toi da 12 anh</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => setInspectionImages(Array.from(e.target.files ?? []).slice(0, 12))} />
            </label>
            {inspectionImages.length > 0 && <p className="text-xs font-medium text-slate-500">Da chon {inspectionImages.length} anh</p>}
            <Button variant="primary" onClick={() => handleCreateInspectionReport(canCreateCheckIn ? "CheckIn" : "CheckOut")} isLoading={isProcessing} disabled={inspectionImages.length === 0}>
              {canCreateCheckIn ? "Tao bien ban check-in" : "Tao bien ban check-out"}
            </Button>
          </div>
        )}
      </Card>

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
            <p className="text-xs text-slate-500">Ghi chú khách hàng</p>
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

      {booking.status === "Completed" && (
        <Card className="space-y-4 rounded-md p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Đánh giá khách hàng</h2>
            {!alreadyReviewed && !showReviewForm && (
              <Button variant="secondary" size="sm" onClick={() => setShowReviewForm(true)}>
                <Star className="h-4 w-4" /> Đánh giá khách
              </Button>
            )}
          </div>

          {showReviewForm && !alreadyReviewed && (
            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-800">Đánh giá khách hàng</h3>
              <StarRatingInput value={reviewRating} onChange={setReviewRating} label="Đánh giá" />
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">Nhận xét</p>
                <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3} placeholder="Nhận xét về khách hàng..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" onClick={handleSubmitReview} isLoading={isSubmittingReview} disabled={reviewRating === 0}>
                  Gửi đánh giá
                </Button>
                <Button variant="ghost" onClick={() => setShowReviewForm(false)}>Hủy</Button>
              </div>
            </div>
          )}

          {reviews.filter((r) => r.reviewType === "Owner").length > 0 && (
            <div className="space-y-3">
              {reviews.filter((r) => r.reviewType === "Owner").map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}
        </Card>
      )}

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
