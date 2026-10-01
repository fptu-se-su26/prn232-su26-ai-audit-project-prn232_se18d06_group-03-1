import { TicketPercent, Clock, Sparkles, Loader2, Wallet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

function VoucherCard({ item, onClaim, highlighted, cardRef }: { item: VoucherHuntItem; onClaim: (id: number) => void; highlighted?: boolean; cardRef?: (el: HTMLDivElement | null) => void }) {
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
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
      const msg = response?.message || response?.errors?.[0] || "Không thể nhận voucher.";
      showToast({ type: "error", title: "Lỗi", message: msg });
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div
      ref={cardRef}
      className={`relative flex rounded-2xl border bg-white shadow-sm hover:shadow-lg transition-all overflow-hidden group dark:bg-neutral-900 ${
        highlighted ? "border-brand-500 ring-2 ring-brand-500/60 shadow-lg" : "border-slate-200 dark:border-neutral-800"
      }`}
    >
      <div className="relative flex w-28 shrink-0 flex-col items-center justify-center gap-0.5 overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 px-2 py-6 text-white sm:w-32">
        <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Giảm</span>
        <span className="text-3xl font-black tracking-tight drop-shadow-sm sm:text-4xl">
          {item.discountType === "Fixed" ? (
            <>{(item.discountValue / 1000).toFixed(0)}k</>
          ) : (
            <>{item.discountValue}%</>
          )}
        </span>
        <span className="mt-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
          Voucher
        </span>
      </div>

      <div aria-hidden="true" className="relative flex w-0 flex-col items-stretch justify-between py-2">
        <span className="absolute -top-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-b border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-950" />
        <span className="mx-auto w-px flex-1 border-l-2 border-dashed border-slate-200 dark:border-neutral-700" />
        <span className="absolute -bottom-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-t border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-950" />
      </div>

      <div className="flex-1 p-5 pl-4 space-y-3 min-w-0">
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

        {highlighted && (
          <p className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-700">
            <Sparkles className="h-3 w-3" />
            Voucher bạn đang tìm
          </p>
        )}

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
  const [searchParams] = useSearchParams();
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const cardRefs = useRef(new Map<number, HTMLDivElement>());
  const highlightTimer = useRef<number | null>(null);

  const deepPromotionId = (() => {
    const raw = searchParams.get("promotionId");
    if (!raw || !/^\d+$/.test(raw.trim())) return null;
    const id = Number(raw.trim());
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  })();

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

  useEffect(() => {
    if (loading || deepPromotionId === null) return;
    if (!vouchers.some((v) => v.promotionId === deepPromotionId)) return;
    const el = cardRefs.current.get(deepPromotionId);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(deepPromotionId);
    if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlightId(null), 2500);
    return () => {
      if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    };
  }, [loading, vouchers, deepPromotionId]);

  function handleClaimed(promotionId: number) {
    setVouchers(prev => prev.filter(v => v.promotionId !== promotionId));
  }

  function setCardRef(promotionId: number) {
    return (el: HTMLDivElement | null) => {
      if (el) cardRefs.current.set(promotionId, el);
      else cardRefs.current.delete(promotionId);
    };
  }

  const deepMissed = !loading && deepPromotionId !== null && !vouchers.some((v) => v.promotionId === deepPromotionId);

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

      {deepMissed && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Voucher này có thể bạn đã nhận hoặc hiện không còn khả dụng.{" "}
          <Link to="/customer/voucher-wallet" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">
            Xem voucher đã nhận
          </Link>
        </div>
      )}

      <SectionPanel title="Voucher khả dụng" description="Nhận voucher để sử dụng khi đặt xe.">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : vouchers.length === 0 && deepPromotionId === null ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TicketPercent className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">Tất cả voucher đã được nhận hết.</p>
            <p className="text-xs text-slate-400">Quay lại sau nhé!</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-slate-500">Hiện không có voucher nào khác để nhận.</p>
          </div>
        ) : (
          <div className="space-y-4 p-1">
            {vouchers.map((v) => (
              <VoucherCard
                key={v.promotionId}
                item={v}
                onClaim={handleClaimed}
                highlighted={v.promotionId === highlightId}
                cardRef={setCardRef(v.promotionId)}
              />
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
