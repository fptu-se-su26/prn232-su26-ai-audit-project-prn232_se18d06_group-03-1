import { useState } from "react";
import { XCircle } from "lucide-react";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import Card from "@/components/ui/Card";
import { showToast } from "@/components/common/toastStore";
import { cancelBooking, getBookingCancellationQuote } from "@/features/booking/bookingService";
import type { BookingCancellationQuote, BookingResponse } from "@/features/booking/types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export default function BookingCancellationCard({ booking, onCancelled }: { booking: BookingResponse; onCancelled: (booking: BookingResponse) => void }) {
  const [quote, setQuote] = useState<BookingCancellationQuote | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [reason, setReason] = useState("");

  const canRequestCancellation = ["Pending", "Approved", "DepositPaid", "Confirmed"].includes(booking.status)
    && new Date(booking.startDate).getTime() > Date.now();
  if (!canRequestCancellation) return null;

  async function openModal() {
    setIsLoading(true);
    try {
      setQuote(await getBookingCancellationQuote(booking.id));
      setIsOpen(true);
    } catch {
      showToast({ type: "error", title: "Không thể hủy", message: "Không thể tải chính sách hủy booking lúc này." });
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmCancellation() {
    if (!quote?.canCancel) return;
    setIsCancelling(true);
    try {
      const updated = await cancelBooking(booking.id, reason.trim() || undefined);
      onCancelled(updated);
      setIsOpen(false);
      showToast({
        type: "success",
        title: "Đã hủy booking",
        message: quote.hasPaidDeposit ? `${formatCurrency(quote.refundAmount)} đã được hoàn vào ví.` : "Booking được hủy miễn phí.",
      });
    } catch (error: any) {
      const message = error?.response?.data?.errors?.[0] || error?.response?.data?.message || "Không thể hủy booking.";
      showToast({ type: "error", title: "Hủy thất bại", message });
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <>
      <Card className="flex flex-col gap-4 rounded-md border border-red-100 bg-red-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-950">Bạn muốn hủy chuyến?</h2>
          <p className="mt-1 text-sm text-slate-600">Kiểm tra số tiền cọc được hoàn trước khi xác nhận hủy.</p>
        </div>
        <Button variant="secondary" className="border-red-200 text-red-700 hover:bg-red-50" onClick={openModal} isLoading={isLoading}>
          <XCircle className="h-4 w-4" /> Hủy booking
        </Button>
      </Card>

      <Modal isOpen={isOpen} onClose={() => !isCancelling && setIsOpen(false)} title="Xác nhận hủy booking">
        {quote && (
          <div className="space-y-4">
            <div className={`rounded-lg border p-4 ${quote.refundPercent === 100 ? "border-emerald-200 bg-emerald-50" : quote.refundPercent === 50 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
              <p className="text-sm font-semibold text-slate-900">{quote.policyMessage}</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Tiền cọc đã thanh toán</span><strong>{formatCurrency(quote.paidDepositAmount)}</strong></div>
                <div className="flex justify-between"><span className="text-slate-600">Hoàn vào ví ({quote.refundPercent}%)</span><strong className="text-emerald-700">{formatCurrency(quote.refundAmount)}</strong></div>
                <div className="flex justify-between"><span className="text-slate-600">Tiền cọc bị khấu trừ</span><strong className="text-red-700">{formatCurrency(quote.forfeitedAmount)}</strong></div>
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              <p>• Từ 7 ngày trước giờ nhận xe: hoàn 100% cọc.</p>
              <p>• Từ 3 đến dưới 7 ngày: hoàn 50% cọc.</p>
              <p>• Dưới 3 ngày: không hoàn cọc.</p>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Lý do hủy <span className="font-normal text-slate-400">(không bắt buộc)</span></span>
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={500} placeholder="Nhập lý do để chủ xe biết..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isCancelling}>Quay lại</Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={confirmCancellation} isLoading={isCancelling} disabled={!quote.canCancel}>Xác nhận hủy</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
