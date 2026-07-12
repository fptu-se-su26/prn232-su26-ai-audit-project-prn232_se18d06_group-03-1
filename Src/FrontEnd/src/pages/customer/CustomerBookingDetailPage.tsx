import { ArrowLeft, CalendarDays, DollarSign, MapPin, TicketPercent, CreditCard, Banknote, CheckCircle, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Card from "@/components/ui/Card";
import { getBookingById, confirmDeposit, confirmCheckIn, confirmCheckOut, getInspectionReports } from "@/features/booking/bookingService";
import type { BookingResponse, InspectionReportResponse } from "@/features/booking/types";
import { showToast } from "@/components/common/toastStore";
import { createCustomerReview, getBookingReviews, hasReviewed } from "@/features/review/reviewService";
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

export default function CustomerBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewCleanliness, setReviewCleanliness] = useState(0);
  const [reviewAccuracy, setReviewAccuracy] = useState(0);
  const [reviewSupport, setReviewSupport] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [inspectionReports, setInspectionReports] = useState<InspectionReportResponse[]>([]);
  const [isConfirmingCheckIn, setIsConfirmingCheckIn] = useState(false);
  const [isConfirmingCheckOut, setIsConfirmingCheckOut] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const bookingId = Number(id);
      const result = await getBookingById(bookingId);
      setBooking(result);
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

  async function handleConfirmCheckOut() {
    if (!booking || isConfirmingCheckOut) return;
    setIsConfirmingCheckOut(true);
    try {
      const updated = await confirmCheckOut(booking.id);
      setBooking(updated);
      const reports = await getInspectionReports(booking.id);
      setInspectionReports(reports);
      showToast({ type: "success", title: "Thành công", message: "Chuyến đi đã hoàn tất." });
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể hoàn tất chuyến đi." });
    } finally {
      setIsConfirmingCheckOut(false);
    }
  }

  async function handleConfirmCheckIn() {
    if (!booking || isConfirmingCheckIn) return;
    setIsConfirmingCheckIn(true);
    try {
      const updated = await confirmCheckIn(booking.id);
      setBooking(updated);
      const reports = await getInspectionReports(booking.id);
      setInspectionReports(reports);
      showToast({ type: "success", title: "Đã xác nhận", message: "Bạn đã xác nhận nhận xe." });
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể xác nhận nhận xe." });
    } finally {
      setIsConfirmingCheckIn(false);
    }
  }

  async function handleSubmitReview() {
    if (!booking || reviewRating === 0 || isSubmittingReview) return;
    setIsSubmittingReview(true);
    try {
      await createCustomerReview({
        bookingId: booking.id,
        rating: reviewRating,
        cleanlinessScore: reviewCleanliness || undefined,
        accuracyScore: reviewAccuracy || undefined,
        supportScore: reviewSupport || undefined,
        comment: reviewComment || undefined,
      });
      showToast({ type: "success", title: "Thành công", message: "Đã gửi đánh giá." });
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

  if (isLoading) return <LoadingSpinner />;
  if (!booking) return <p className="text-sm text-red-600">Không tìm thấy booking.</p>;
  const checkInReport = inspectionReports.find((report) => report.type === "CheckIn");
  const checkOutReport = inspectionReports.find((report) => report.type === "CheckOut");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/customer/bookings">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Quay lại</Button>
        </Link>
      </div>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Customer</p>
        <div className="flex items-center gap-3">
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Booking {booking.bookingCode}</h1>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[booking.status] ?? "bg-slate-100 text-slate-700"}`}>
            {statusLabels[booking.status] ?? booking.status}
          </span>
        </div>
      </section>

      {checkInReport && (booking.status === "DepositPaid" || booking.status === "Confirmed") && (
        <Card className="space-y-4 rounded-md border-2 border-cyan-200 bg-cyan-50 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-cyan-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-950">Xác nhận nhận xe</h2>
              <p className="text-sm text-slate-600">Vui lòng kiểm tra biên bản check-in và ảnh xe trước khi xác nhận.</p>
            </div>
          </div>
          <div className="grid gap-3 rounded-md bg-white/70 p-3 text-sm sm:grid-cols-2">
            <p><span className="font-semibold text-slate-700">Km:</span> {checkInReport.odometerKm ?? "-"}</p>
            <p><span className="font-semibold text-slate-700">Nhiên liệu:</span> {checkInReport.fuelLevel || "-"}</p>
            <p><span className="font-semibold text-slate-700">Tình trạng:</span> {checkInReport.damageNoted ? "Có ghi nhận hư hỏng" : "Không ghi nhận hư hỏng"}</p>
            <p><span className="font-semibold text-slate-700">Ngày lập:</span> {formatDateTime(checkInReport.createdAt)}</p>
          </div>
          {checkInReport.damageDescription && <p className="text-sm text-slate-700">{checkInReport.damageDescription}</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {checkInReport.images.map((image) => (
              <a key={image.id} href={image.imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-cyan-100 bg-white">
                <img src={image.imageUrl} alt="Check-in" className="aspect-square w-full object-cover" />
              </a>
            ))}
          </div>
          <Button variant="primary" className="bg-cyan-700 hover:bg-cyan-800" onClick={handleConfirmCheckIn} isLoading={isConfirmingCheckIn}>
            <CheckCircle className="h-4 w-4" /> Xác nhận nhận xe
          </Button>
        </Card>
      )}

      {checkOutReport && booking.status === "InProgress" && (
        <Card className="space-y-4 rounded-md border-2 border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-950">Kết thúc chuyến đi</h2>
              <p className="text-sm text-slate-600">Xác nhận bạn đã trả xe và hoàn tất chuyến thuê.</p>
            </div>
          </div>
          <div className="grid gap-3 rounded-md bg-white/70 p-3 text-sm sm:grid-cols-2">
            <p><span className="font-semibold text-slate-700">Km:</span> {checkOutReport.odometerKm ?? "-"}</p>
            <p><span className="font-semibold text-slate-700">Nhien lieu:</span> {checkOutReport.fuelLevel || "-"}</p>
            <p><span className="font-semibold text-slate-700">Tinh trang:</span> {checkOutReport.damageNoted ? "Co ghi nhan hu hong" : "Khong ghi nhan hu hong"}</p>
            <p><span className="font-semibold text-slate-700">Ngay lap:</span> {formatDateTime(checkOutReport.createdAt)}</p>
          </div>
          {checkOutReport.damageDescription && <p className="text-sm text-slate-700">{checkOutReport.damageDescription}</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {checkOutReport.images.map((image) => (
              <a key={image.id} href={image.imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-emerald-100 bg-white">
                <img src={image.imageUrl} alt="Check-out" className="aspect-square w-full object-cover" />
              </a>
            ))}
          </div>
          <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleConfirmCheckOut} isLoading={isConfirmingCheckOut}>
            <CheckCircle className="h-4 w-4" /> Xác nhận hoàn tất chuyến đi
          </Button>
        </Card>
      )}

      {booking.status === "Approved" && (
        <Card className="space-y-4 rounded-md p-5">
          <h2 className="text-lg font-bold text-slate-950">Xác nhận đặt cọc</h2>
          <p className="text-sm text-slate-600">
            Chủ xe đã duyệt booking của bạn. Vui lòng chuyển tiền cọc{" "}
            <span className="font-semibold text-slate-900">{formatCurrency(booking.depositAmount)}</span>{" "}
            vào tài khoản sau và xác nhận để hoàn tất.
          </p>
          <div className="rounded-md bg-slate-50 p-3 text-sm">
            <p className="text-slate-500">Thông tin tài khoản ngân hàng:</p>
            <p className="mt-1 font-medium text-slate-900">Ngân hàng: Vietcombank</p>
            <p className="font-medium text-slate-900">Số TK: 1234567890</p>
            <p className="font-medium text-slate-900">Chủ TK: MoveVN Platform</p>
            <p className="mt-1 text-xs text-slate-500">Nội dung chuyển khoản: {booking.bookingCode}</p>
          </div>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                const updated = await confirmDeposit(booking.id);
                setBooking(updated);
                showToast({ type: "success", title: "Thành công", message: "Đã xác nhận đặt cọc." });
              } catch {
                showToast({ type: "error", title: "Lỗi", message: "Không thể xác nhận cọc." });
              }
            }}
          >
            <Banknote className="h-4 w-4" /> Xác nhận đã chuyển cọc
          </Button>
        </Card>
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

      {booking.status === "Completed" && (
        <Card className="space-y-4 rounded-md p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Đánh giá chuyến đi</h2>
            {!alreadyReviewed && !showReviewForm && (
              <Button variant="secondary" size="sm" onClick={() => setShowReviewForm(true)}>
                <Star className="h-4 w-4" /> Viết đánh giá
              </Button>
            )}
          </div>

          {showReviewForm && !alreadyReviewed && (
            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-800">Đánh giá xe và chủ xe</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <StarRatingInput value={reviewRating} onChange={setReviewRating} label="Đánh giá tổng quan" />
                <StarRatingInput value={reviewCleanliness} onChange={setReviewCleanliness} label="Vệ sinh" />
                <StarRatingInput value={reviewAccuracy} onChange={setReviewAccuracy} label="Chính xác mô tả" />
                <StarRatingInput value={reviewSupport} onChange={setReviewSupport} label="Hỗ trợ" />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">Nhận xét</p>
                <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3} placeholder="Chia sẻ trải nghiệm của bạn..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" onClick={handleSubmitReview} isLoading={isSubmittingReview} disabled={reviewRating === 0}>
                  Gửi đánh giá
                </Button>
                <Button variant="ghost" onClick={() => setShowReviewForm(false)}>Hủy</Button>
              </div>
            </div>
          )}

          {alreadyReviewed && reviews.filter((r) => r.reviewType === "Customer").length === 0 && (
            <p className="text-sm text-slate-500">Bạn đã gửi đánh giá cho chuyến đi này.</p>
          )}

          {reviews.filter((r) => r.reviewType === "Customer").length > 0 && (
            <div className="space-y-3">
              {reviews.filter((r) => r.reviewType === "Customer").map((r) => (
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
