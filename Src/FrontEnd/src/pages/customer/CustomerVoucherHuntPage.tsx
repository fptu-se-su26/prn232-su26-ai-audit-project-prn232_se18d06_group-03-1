import { TicketPercent, Clock, Sparkles, Loader2, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import { getVoucherHunt, claimVoucher } from "@/features/voucherClaims/services/voucherClaimService";
import type { VoucherHuntItem } from "@/features/voucherClaims/types";
import { showToast } from "@/components/common/toastStore";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function formatVehicleType(t: string) {
  return t === "All" ? "Tất cả xe" : t === "Motorbike" ? "Xe máy" : "Ô tô";
}

function VoucherCard({ item, onClaim }: { item: VoucherHuntItem; onClaim: (id: number) => void }) {
  const [claiming, setClaiming] = useState(false);

  const daysLeft = item.endAt
    ? Math.max(0, Math.ceil((new Date(item.endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const usagePercent = item.maxUsageCount > 0 ? Math.min(100, (item.usageCount / item.maxUsageCount) * 100) : 0;
  const almostGone = usagePercent >= 80;
  const remaining = item.maxUsageCount - item.usageCount;

  async function handleClaim() {
    setClaiming(true);
    try {
      await claimVoucher(item.promotionId);
      showToast({ type: "success", title: "Nhận thành công!", message: `${item.name} đã thêm vào ví voucher.` });
      onClaim(item.promotionId);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0] || "Không thể nhận voucher.";
      showToast({ type: "error", title: "Lỗi", message: msg });
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="relative flex rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all overflow-hidden group">
      <div className="flex flex-col items-center justify-center px-5 py-6 bg-gradient-to-b from-brand-50 to-brand-100/50 min-w-[130px]">
        <TicketPercent className="h-7 w-7 text-brand-600 mb-2" />
        <span className="text-2xl font-extrabold text-brand-700 leading-tight">
          {item.discountType === "Fixed" ? (
            <>{(item.discountValue / 1000).toFixed(0)}k</>
          ) : (
            <>{item.discountValue}%</>
          )}
        </span>
        <span className="text-xs font-medium text-brand-600 mt-0.5">giảm giá</span>
      </div>

      <div className="absolute left-[121px] top-0 bottom-0 w-px border-l-2 border-dashed border-slate-200" />

      <div className="flex-1 p-5 pl-7 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">{item.name}</h3>
            {item.description && <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>}
          </div>
          {daysLeft !== null && (
            <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              daysLeft <= 3 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
            }`}>
              <Clock className="h-3 w-3" />
              {daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Hôm nay!"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          <span>{formatVehicleType(item.vehicleType)}</span>
          {item.minOrderAmount && (
            <span className="text-amber-600">Đơn từ {formatCurrency(item.minOrderAmount)}</span>
          )}
          {item.maxDiscountAmount && (
            <span className="text-slate-500">Tối đa {formatCurrency(item.maxDiscountAmount)}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${almostGone ? "bg-red-400" : "bg-brand-400"}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <span className={`text-xs font-medium ${almostGone ? "text-red-600" : "text-slate-500"}`}>
            {almostGone && <Sparkles className="inline h-3 w-3 mr-0.5" />}
            Còn {remaining} lượt
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-sm font-bold text-slate-800 tracking-wider">
            {item.code}
          </div>
          <button
            type="button"
            onClick={handleClaim}
            disabled={claiming}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Nhận voucher
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerVoucherHuntPage() {
  const [vouchers, setVouchers] = useState<VoucherHuntItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVoucherHunt();
      setVouchers(data);
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải danh sách voucher." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  function handleClaimed(promotionId: number) {
    setVouchers(prev => prev.filter(v => v.promotionId !== promotionId));
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <DashboardHeader
        eyebrow="Voucher hunt"
        title="Săn voucher"
        description="Nhận voucher và lưu vào ví để dùng khi đặt xe."
        actions={
          <Link to="/customer/voucher-wallet" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-colors">
            <Wallet className="h-4 w-4" />
            Ví voucher
          </Link>
        }
      />

      <SectionPanel title="Voucher khả dụng" description="Nhận voucher để sử dụng khi đặt xe.">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TicketPercent className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">Tất cả voucher đã được nhận hết.</p>
            <p className="text-xs text-slate-400">Quay lại sau nhé!</p>
          </div>
        ) : (
          <div className="space-y-4 p-1">
            {vouchers.map((v) => (
              <VoucherCard key={v.promotionId} item={v} onClaim={handleClaimed} />
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
