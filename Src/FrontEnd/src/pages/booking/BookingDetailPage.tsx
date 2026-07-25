import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Check,
  ClipboardCheck,
  Clock,
  DollarSign,
  MapPin,
  TicketPercent,
  X,
  ExternalLink,
  Car,
  User,
  History,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  Tag
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Card from "@/components/ui/Card";
import { getBookingById, approveBooking, rejectBooking, ownerCompleteBooking, createCheckInReport, getInspectionReports } from "@/features/booking/bookingService";
import { createPaymentLink, checkPaymentStatus } from "@/features/payments/services/paymentService";
import type { BookingResponse, InspectionReportResponse } from "@/features/booking/types";
import { showToast } from "@/components/common/toastStore";
import RiskScoreBadge from "@/features/booking/components/RiskScoreBadge";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import BookingCancellationCard from "@/features/booking/components/BookingCancellationCard";

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
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Approved: "border-blue-200 bg-blue-50 text-blue-700",
  Rejected: "border-rose-200 bg-rose-50 text-rose-750",
  Cancelled: "border-slate-200 bg-slate-50 text-slate-655",
  DepositPaid: "border-violet-200 bg-violet-50 text-violet-750",
  Confirmed: "border-emerald-250 bg-emerald-50 text-emerald-800",
  InProgress: "border-cyan-200 bg-cyan-50 text-cyan-755",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-850",
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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

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

  useEffect(() => {
    const orderCodeStr = searchParams.get("orderCode");
    const status = searchParams.get("status");
    const cancel = searchParams.get("cancel");

    if (orderCodeStr && !isVerifyingPayment) {
      const orderCode = Number(orderCodeStr);
      let cancelled = false;
      let attempt = 0;
      const maxAttempts = 10;
      const intervalMs = 3000;

      const cleanup = () => {
        setIsVerifyingPayment(false);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("orderCode");
        newParams.delete("status");
        newParams.delete("cancel");
        newParams.delete("id");
        newParams.delete("code");
        setSearchParams(newParams, { replace: true });
      };

      const handleVerifyPayment = async () => {
        setIsVerifyingPayment(true);
        showToast({ type: "info", title: "Xác nhận", message: "Đang kiểm tra kết quả thanh toán từ PayOS..." });
        try {
          const poll = async (): Promise<void> => {
            if (cancelled) return;
            attempt++;
            try {
              const res = await checkPaymentStatus(orderCode);
              if (res.isConfirmed) {
                showToast({ type: "success", title: "Thành công", message: "Thanh toán cọc thành công!" });
                void load();
                cleanup();
                return;
              }
              if (res.status === "Cancelled" || cancel === "true" || status === "CANCELLED") {
                showToast({ type: "info", title: "Thông báo", message: "Giao dịch thanh toán đã bị hủy." });
                void load();
                cleanup();
                return;
              }
              if (res.status === "Expired" || res.status === "Failed") {
                showToast({ type: "info", title: "Thông báo", message: "Giao dịch đã hết hạn hoặc thất bại." });
                void load();
                cleanup();
                return;
              }
              if (attempt >= maxAttempts) {
                showToast({ type: "info", title: "Hết thời gian", message: "Không nhận được xác nhận. Vui lòng kiểm tra lại sau." });
                void load();
                cleanup();
                return;
              }
              setTimeout(poll, intervalMs);
            } catch {
              if (attempt >= maxAttempts) {
                showToast({ type: "error", title: "Lỗi", message: "Không thể kiểm tra trạng thái thanh toán." });
                cleanup();
                return;
              }
              setTimeout(poll, intervalMs);
            }
          };

          await poll();
        } catch {
          showToast({ type: "error", title: "Lỗi", message: "Không thể kiểm tra trạng thái thanh toán." });
          cleanup();
        }
      };

      void handleVerifyPayment();

      return () => { cancelled = true; };
    }
  }, [searchParams, setSearchParams, load, isVerifyingPayment]);

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
        showToast({ type: "error", title: "Lỗi", message: "Không nhận được đường dẫn thanh toán từ PayOS." });
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
      showToast({ type: "success", title: "Hoàn thành chuyến đi", message: "Xác nhận chuyến đi hoàn thành thành công." });
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể hoàn thành chuyến đi." });
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Navigation Top */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="hover:bg-slate-100 text-slate-600 font-medium">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Quay lại
        </Button>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
          Phân hệ: {primaryRole === "Owner" ? "Chủ xe" : primaryRole === "Customer" ? "Khách thuê" : "Nhân viên"}
        </span>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5">
        <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-brand-50/50 blur-xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-16 w-16 rounded-full bg-violet-50/50 blur-lg" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Chi tiết yêu cầu thuê xe</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex flex-wrap items-center gap-3">
              Booking <span className="font-mono text-brand-600 select-all">{booking.bookingCode}</span>
            </h1>
            <p className="mt-1.5 text-xs text-slate-400">Ngày yêu cầu: {formatDateTime(booking.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-semibold shadow-sm ${statusColors[booking.status] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {statusLabels[booking.status] ?? booking.status}
            </span>
            {primaryRole === "Owner" && (
              <RiskScoreBadge score={booking.riskScore} />
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column - Main Content (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Vehicle Information */}
          <Card className="overflow-hidden p-0 border border-slate-200 shadow-sm rounded-xl">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Car className="h-5 w-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">Thông tin phương tiện</h2>
            </div>
            <div className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              {booking.vehicleImage ? (
                <div className="relative group overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shrink-0">
                  <img
                    src={booking.vehicleImage}
                    alt={booking.vehicleName ?? "Phương tiện"}
                    className="h-24 w-36 object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="h-24 w-36 rounded-lg bg-gradient-to-br from-brand-50 to-violet-50 border border-brand-100 flex flex-col items-center justify-center shrink-0 text-brand-400">
                  <Car className="h-8 w-8 mb-1" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-brand-600">MoveVN</span>
                </div>
              )}
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {booking.vehicleName ?? `Phương tiện #${booking.vehicleId}`}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>Mã chủ xe: <span className="font-semibold text-slate-700">{booking.ownerId}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-355" />
                    <span>Mã khách: <span className="font-semibold text-slate-700">{booking.customerId}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Schedule & Pickup/Return Address */}
          <Card className="overflow-hidden p-0 border border-slate-200 shadow-sm rounded-xl">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">Lịch trình & Địa điểm</h2>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="grid gap-6 sm:grid-cols-2 relative">
                {/* Pick up */}
                <div className="relative pl-5 border-l-2 border-brand-500 space-y-1">
                  <div className="absolute -left-[6px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-brand-100" />
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Nhận xe</p>
                  <p className="text-lg font-extrabold text-slate-900">{formatDate(booking.startDate)}</p>
                  <div className="flex items-start gap-1 text-sm text-slate-600 pt-0.5">
                    <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{booking.pickupAddress}</span>
                  </div>
                </div>

                {/* Return */}
                <div className="relative pl-5 border-l-2 border-emerald-500 space-y-1">
                  <div className="absolute -left-[6px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Trả xe</p>
                  <p className="text-lg font-extrabold text-slate-900">{formatDate(booking.endDate)}</p>
                  <div className="flex items-start gap-1 text-sm text-slate-600 pt-0.5">
                    <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{booking.returnAddress || booking.pickupAddress}</span>
                  </div>
                </div>
              </div>

              {booking.customerNote && (
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                    <span>Ghi chú thuê xe</span>
                  </div>
                  <p className="text-sm text-slate-700 italic">"{booking.customerNote}"</p>
                </div>
              )}
            </div>
          </Card>

          {/* Owner Risk Scoring detail */}
          {primaryRole === "Owner" && (
            <Card className="overflow-hidden p-0 border border-slate-200 shadow-sm rounded-xl">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h2 className="text-base font-bold text-slate-900">Đánh giá rủi ro</h2>
                </div>
                <RiskScoreBadge score={booking.riskScore} />
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-600">
                  Điểm đánh giá tự động dựa trên lịch sử thuê xe và hồ sơ của khách hàng để hỗ trợ chủ xe duyệt yêu cầu.
                </p>
                
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Các tín hiệu ghi nhận</p>
                  {booking.riskFactors && booking.riskFactors.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {booking.riskFactors.map((factor) => (
                        <span
                          key={factor}
                          className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500 italic">
                      Không phát hiện tín hiệu bất thường. Khách hàng có điểm tín nhiệm tốt.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Inspection & Check-in Details */}
          {primaryRole === "Owner" && (
            <Card className="overflow-hidden p-0 border border-slate-200 shadow-sm rounded-xl">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-brand-600" />
                <h2 className="text-base font-bold text-slate-900">Biên bản bàn giao xe (Check-in)</h2>
              </div>
              
              <div className="p-5 space-y-4">
                {checkInReport ? (
                  <div className="space-y-4 rounded-xl border border-slate-150 bg-slate-50/60 p-4">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-bold text-slate-900">Biên bản check-in của xe</span>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm border ${checkInReport.isCustomerConfirmed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {checkInReport.isCustomerConfirmed ? "Khách đã xác nhận" : "Chờ khách xác nhận"}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Odometer</p>
                        <p className="text-base font-bold text-slate-800 mt-0.5">{checkInReport.odometerKm !== undefined ? `${checkInReport.odometerKm} km` : "-"}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Nhiên liệu</p>
                        <p className="text-base font-bold text-slate-800 mt-0.5">{checkInReport.fuelLevel || "-"}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Trạng thái hư hại</p>
                        <p className={`text-base font-bold mt-0.5 ${checkInReport.damageNoted ? "text-rose-600" : "text-emerald-600"}`}>
                          {checkInReport.damageNoted ? "Có ghi nhận" : "Không hư hại"}
                        </p>
                      </div>
                    </div>

                    {checkInReport.damageDescription && (
                      <div className="bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Mô tả tình trạng</p>
                        <p className="text-sm text-slate-700">{checkInReport.damageDescription}</p>
                      </div>
                    )}

                    {checkInReport.images && checkInReport.images.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ảnh hiện trạng bàn giao</p>
                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                          {checkInReport.images.map((image) => (
                            <a
                              key={image.id}
                              href={image.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="group block relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white"
                            >
                              <img
                                src={image.imageUrl}
                                alt="Check-in photo"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <ExternalLink className="h-4 w-4 text-white" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : booking.status === "DepositPaid" || booking.status === "Confirmed" ? (
                  <div className="space-y-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/10 p-5">
                    <div className="flex gap-2.5 items-start">
                      <Info className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Tạo biên bản check-in xe</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Vui lòng cập nhật hình ảnh và các thông số hiện tại của phương tiện trước khi chính thức giao xe cho khách hàng.</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Chỉ số Odometer (Km)</label>
                        <input
                          type="number"
                          min="0"
                          value={odometerKm}
                          onChange={(e) => setOdometerKm(e.target.value)}
                          placeholder="Ví dụ: 15400"
                          className="h-10 w-full rounded-lg border border-slate-305 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Mức nhiên liệu hiện tại</label>
                        <input
                          type="text"
                          value={fuelLevel}
                          onChange={(e) => setFuelLevel(e.target.value)}
                          placeholder="Ví dụ: Đầy bình, 4/5 vạch..."
                          className="h-10 w-full rounded-lg border border-slate-305 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={damageNoted}
                          onChange={(e) => setDamageNoted(e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-slate-305 text-brand-600 focus:ring-brand-500"
                        />
                        <span>Có trầy xước / vết móp méo bên ngoài cần ghi nhận</span>
                      </label>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Chi tiết mô tả hiện trạng</label>
                        <textarea
                          value={damageDescription}
                          onChange={(e) => setDamageDescription(e.target.value)}
                          rows={3}
                          placeholder="Mô tả cụ thể vị trí trầy xước hoặc các phụ kiện đi kèm để đối chiếu..."
                          className="w-full rounded-lg border border-slate-305 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700">Ảnh hiện trạng bàn bàn giao (Bắt buộc)</label>
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-650 hover:bg-slate-50 transition">
                        <Camera className="mb-2 h-7 w-7 text-brand-600" />
                        <span className="font-semibold text-brand-600">Tải lên các hình ảnh xe</span>
                        <span className="mt-1 text-xs text-slate-400">Được tải tối đa 12 hình ảnh (định dạng JPG, PNG, WebP)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          className="hidden"
                          onChange={(e) => setCheckInImages(Array.from(e.target.files ?? []).slice(0, 12))}
                        />
                      </label>
                      {checkInImages.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <p className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 rounded px-2.5 py-1">
                            Đã chọn {checkInImages.length} hình ảnh
                          </p>
                          <button
                            type="button"
                            onClick={() => setCheckInImages([])}
                            className="text-xs text-rose-600 hover:underline font-bold"
                          >
                            Xóa hết chọn lại
                          </button>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleCreateCheckInReport}
                      isLoading={isProcessing}
                      disabled={checkInImages.length === 0}
                      className="w-full shadow-md font-bold"
                    >
                      Xác nhận tạo biên bản Check-in
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2.5 items-center rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <Lock className="h-5 w-5 text-slate-400 shrink-0" />
                    <p className="text-sm text-slate-500">
                      Chỉ có thể check-in sau khi khách thuê đã thanh toán đặt cọc thành công.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Status Transitions Timeline */}
          <Card className="overflow-hidden p-0 border border-slate-200 shadow-sm rounded-xl">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <History className="h-5 w-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">Lịch sử giao dịch & Trạng thái</h2>
            </div>
            <div className="p-5">
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 ml-2.5">
                {booking.statusHistory.map((h, i) => (
                  <div key={i} className="relative group">
                    {/* Circle dot timeline point */}
                    <div className="absolute -left-[32.5px] top-1.5 h-3 w-3 rounded-full border-2 border-brand-500 bg-white ring-4 ring-white flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-500 group-hover:scale-125 transition" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <p className="text-sm font-bold text-slate-800">
                          {h.fromStatus ? (
                            <span className="flex items-center gap-2 flex-wrap">
                              <span className="text-slate-400 font-medium text-xs">{statusLabels[h.fromStatus] ?? h.fromStatus}</span>
                              <span className="text-slate-350 text-xs">→</span>
                              <span className="text-brand-600 font-extrabold">{statusLabels[h.toStatus] ?? h.toStatus}</span>
                            </span>
                          ) : (
                            <span className="text-brand-600 font-extrabold">{statusLabels[h.toStatus] ?? h.toStatus}</span>
                          )}
                        </p>
                        <p className="text-xs font-medium text-slate-400">{formatDateTime(h.createdAt)}</p>
                      </div>
                      {h.note && (
                        <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 border border-slate-100/60 mt-1 italic leading-relaxed">
                          Nội dung: "{h.note}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

        </div>

        {/* Right Column - Sidebar Panels (lg:col-span-1) */}
        <div className="space-y-6">
          
          {/* Context Actions Sidebar Panel */}
          {((primaryRole === "Owner" && booking.status === "Pending") || 
            (primaryRole === "Customer" && booking.status === "Approved") ||
            (primaryRole === "Owner" && booking.status === "DepositPaid") ||
            booking.cancelReason) && (
            <Card className="border border-brand-100 bg-brand-50/10 p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Hành động khả dụng</h3>

              {/* Owner decision form */}
              {primaryRole === "Owner" && booking.status === "Pending" && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-amber-55 border border-amber-200 p-3.5 text-xs text-amber-800 leading-relaxed flex gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                    <span>
                      Vui lòng phản hồi trước <strong>{formatDateTime(new Date(new Date(booking.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString())}</strong>. Quá 24 giờ hệ thống sẽ tự động từ chối.
                    </span>
                  </div>
                  <Button variant="primary" onClick={handleApprove} isLoading={isProcessing} className="w-full font-bold shadow-md">
                    <Check className="h-4.5 w-4.5 mr-1" /> Duyệt booking này
                  </Button>
                  
                  <div className="border-t border-slate-200/60 pt-3.5 space-y-2">
                    <p className="text-xs font-bold text-slate-700">Từ chối yêu cầu thuê xe:</p>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Ghi rõ lý do từ chối..."
                      rows={2.5}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                    />
                    <Button
                      variant="danger"
                      onClick={handleReject}
                      isLoading={isProcessing}
                      disabled={!rejectReason.trim()}
                      className="w-full font-bold shadow-sm"
                    >
                      <X className="h-4 w-4 mr-1" /> Xác nhận từ chối
                    </Button>
                  </div>
                </div>
              )}

              {/* Customer Payment Form */}
              {primaryRole === "Customer" && booking.status === "Approved" && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Chủ xe đã duyệt yêu cầu thuê xe. Bạn cần đặt cọc khoản tiền <span className="font-bold text-slate-900">{formatCurrency(booking.depositAmount)}</span> qua cổng thanh toán PayOS để xác nhận đặt xe.
                  </p>
                  {booking.paymentDueAt && (
                    <div className="rounded-lg bg-amber-50 border border-amber-250 p-3 text-xs font-medium text-amber-700 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>Hạn thanh toán: {new Date(booking.paymentDueAt).toLocaleString("vi-VN")}</span>
                    </div>
                  )}
                  <Button variant="primary" onClick={handlePayDeposit} isLoading={isProcessing} className="w-full font-bold shadow-md">
                    <ExternalLink className="h-4 w-4 mr-1.5" /> Thanh toán qua PayOS
                  </Button>
                </div>
              )}

              {/* Owner Complete Trip Button */}
              {primaryRole === "Owner" && booking.status === "DepositPaid" && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-650 leading-relaxed">
                    Khách đã thanh toán cọc <span className="font-semibold text-slate-900">{formatCurrency(booking.depositAmount)}</span>. Sau khi bàn giao xe và hành trình kết thúc, hãy xác nhận hoàn tất để giải ngân ví.
                  </p>
                  <Button variant="primary" onClick={handleComplete} isLoading={isProcessing} className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 border-none shadow-md shadow-emerald-600/10">
                    <Check className="h-4.5 w-4.5 mr-1" /> Xác nhận hoàn thành chuyến đi
                  </Button>
                </div>
              )}

              {/* Alert Cancellation Reason */}
              {booking.cancelReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 space-y-1">
                  <p className="font-bold">Lý do từ chối / hủy chuyến:</p>
                  <p className="italic">"{booking.cancelReason}"</p>
                </div>
              )}
            </Card>
          )}

          {/* Customer Cancellation Request */}
          {primaryRole === "Customer" && (
            <div className="w-full">
              <BookingCancellationCard booking={booking} onCancelled={setBooking} />
            </div>
          )}

          {/* Cost Details Breakdown */}
          <Card className="overflow-hidden p-0 border border-slate-200 shadow-sm rounded-xl">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">Chi tiết chi phí</h2>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Payment Schedule / Deposit Summary at the top */}
              <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-brand-100 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Lịch thanh toán thực tế</span>
                  {["DepositPaid", "Confirmed", "InProgress", "Completed"].includes(booking.status) ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> Đã đặt cọc
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                      Chờ thanh toán cọc
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Milestones */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-brand-100 shadow-sm relative overflow-hidden">
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        {["DepositPaid", "Confirmed", "InProgress", "Completed"].includes(booking.status)
                          ? "Số tiền đã chuyển cọc"
                          : "Số tiền cần chuyển cọc"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">Thanh toán đặt cọc qua cổng PayOS</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-brand-600 block leading-tight">
                        {formatCurrency(booking.depositAmount)}
                      </span>
                    </div>
                  </div>

                  {booking.totalAmount > booking.depositAmount && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Còn lại trả khi nhận xe</p>
                        <p className="text-[10px] text-slate-400">Trả trực tiếp cho chủ xe khi nhận bàn giao</p>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-800 block leading-tight">
                          {formatCurrency(booking.totalAmount - booking.depositAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 items-start text-[10px] text-brand-700 leading-relaxed pt-2 border-t border-brand-100/50">
                  <Info className="h-3.5 w-3.5 shrink-0 text-brand-650 mt-0.5" />
                  <span>
                    {["DepositPaid", "Confirmed", "InProgress", "Completed"].includes(booking.status)
                      ? "Khách thuê đã thanh toán cọc thành công qua cổng PayOS. Khoản tiền còn lại sẽ thanh toán trực tiếp khi nhận bàn giao xe."
                      : "Khách thuê thanh toán khoản cọc trực tuyến ở trên để hoàn tất giữ xe. Số còn lại sẽ trả trực tiếp cho chủ xe."}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 my-4" />

              {/* Price details breakdown */}
              <div className="space-y-3 pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Chi tiết tính giá</h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Giá thuê xe</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(booking.basePrice)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Thời gian thuê</span>
                  <span className="font-bold text-slate-800">{booking.totalDays} ngày</span>
                </div>
                {booking.discountPercent > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-1 text-slate-500">
                      <TicketPercent className="h-4.5 w-4.5 text-emerald-650 animate-bounce" />
                      Giảm giá ({booking.discountPercent}%)
                    </span>
                    <span className="font-bold text-emerald-650">-{formatCurrency(booking.discountAmount)}</span>
                  </div>
                )}
                {(booking as any).promotionDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <Tag className="h-4 w-4" />
                      Mã {(booking as any).promotionCode}
                    </span>
                    <span className="font-bold text-green-600">-{formatCurrency((booking as any).promotionDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-2.5">
                  <span className="text-slate-400 text-xs">Phí nền tảng (Đã gồm trong tổng)</span>
                  <span className="text-xs font-medium text-slate-500">{formatCurrency(booking.platformFee)}</span>
                </div>
              </div>

              {/* Total amount bold row */}
              <div className="border-t-2 border-dashed border-slate-200 pt-4 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-950">Tổng cộng toàn bộ</span>
                <span className="text-lg font-extrabold text-slate-950">{formatCurrency(booking.totalAmount)}</span>
              </div>

              {(booking.securityDepositAmount ?? 0) > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Thế chấp với chủ xe</span>
                    <span className="text-base font-extrabold text-amber-800">{formatCurrency(booking.securityDepositAmount)}</span>
                  </div>
                  <p className="text-[10px] text-amber-600 leading-relaxed">
                    Số tiền này được thỏa thuận trực tiếp giữa khách thuê và chủ xe. MoveVN không thu giữ tiền thế chấp.
                  </p>
                </div>
              )}
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
}
