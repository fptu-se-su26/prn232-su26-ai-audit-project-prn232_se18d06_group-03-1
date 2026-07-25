import { CheckCircle, XCircle, ArrowLeft, Tag, TicketPercent, DollarSign } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getPendingPromotions, approvePromotion, rejectPromotion } from "@/features/promotions/services/promotionService";
import type { Promotion } from "@/features/promotions/types";
import { showToast } from "@/components/common/toastStore";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function formatDiscount(p: Promotion) {
  return p.discountType === "Fixed" ? formatCurrency(p.discountValue) : `${p.discountValue}%`;
}

function formatVehicleType(t: string) {
  return t === "All" ? "Tất cả" : t === "Motorbike" ? "Xe máy" : "Ô tô";
}

export default function OwnerPromotionApprovalsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingPromotions();
      setPromotions(data);
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải danh sách." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = useCallback(async (id: number) => {
    setActionId(id);
    try {
      await approvePromotion(id);
      showToast({ type: "success", title: "Đã duyệt", message: "Mã khuyến mãi đã được chấp nhận." });
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message || "Lỗi duyệt.";
      showToast({ type: "error", title: "Lỗi", message: msg });
    } finally {
      setActionId(null);
    }
  }, []);

  const handleReject = useCallback(async (id: number) => {
    setActionId(id);
    try {
      await rejectPromotion(id);
      showToast({ type: "success", title: "Đã từ chối", message: "Mã khuyến mãi đã bị từ chối." });
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message || "Lỗi từ chối.";
      showToast({ type: "error", title: "Lỗi", message: msg });
    } finally {
      setActionId(null);
    }
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/owner/dashboard" className="inline-block group mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-700 transition-colors">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </div>
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Duyệt mã khuyến mãi</h1>
      <p className="text-sm text-slate-500 mb-6">Các mã khuyến mãi yêu cầu bạn duyệt trước khi áp dụng cho xe của bạn.</p>

      {loading ? (
        <LoadingSpinner />
      ) : promotions.length === 0 ? (
        <Alert variant="info" title="Không có mã chờ duyệt">
          Hiện tại không có mã khuyến mãi nào cần bạn duyệt.
        </Alert>
      ) : (
        <div className="space-y-4">
          {promotions.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                      <Tag className="h-3 w-3" />
                      {p.code}
                    </span>
                    <span className="font-semibold text-slate-900">{p.name}</span>
                  </div>

                  {p.description && <p className="text-sm text-slate-500">{p.description}</p>}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <TicketPercent className="h-3.5 w-3.5 text-green-600" />
                      Giảm {formatDiscount(p)}
                      {p.maxDiscountAmount && <span className="text-slate-400">(tối đa {formatCurrency(p.maxDiscountAmount)})</span>}
                    </span>
                    <span>Xe: {formatVehicleType(p.vehicleType)}</span>
                    {p.whoBears === "Shared" && p.ownerBearsPercent != null && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <DollarSign className="h-3.5 w-3.5" />
                        Bạn chịu {p.ownerBearsPercent}%
                      </span>
                    )}
                    {p.whoBears === "Owner" && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <DollarSign className="h-3.5 w-3.5" />
                        Bạn chịu toàn bộ
                      </span>
                    )}
                    {p.minOrderAmount && <span>Đơn tối thiểu: {formatCurrency(p.minOrderAmount)}</span>}
                    <span>Sử dụng: {p.usageCount}/{p.maxUsageCount}</span>
                    <span>Hiệu lực: {new Date(p.startAt).toLocaleDateString("vi-VN")}{p.endAt ? ` - ${new Date(p.endAt).toLocaleDateString("vi-VN")}` : " (không giới hạn)"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="primary"
                    isLoading={actionId === p.id}
                    onClick={() => handleApprove(p.id)}
                    className="flex items-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Duyệt
                  </Button>
                  <Button
                    variant="danger"
                    isLoading={actionId === p.id}
                    onClick={() => handleReject(p.id)}
                    className="flex items-center gap-1.5"
                  >
                    <XCircle className="h-4 w-4" />
                    Từ chối
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
