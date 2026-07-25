import { Wallet, TicketPercent, Clock, CheckCircle, Copy, Check, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import { getVoucherWallet } from "@/features/voucherClaims/services/voucherClaimService";
import type { VoucherClaimResponse } from "@/features/voucherClaims/types";
import { showToast } from "@/components/common/toastStore";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function formatVehicleType(t: string) {
  return t === "All" ? "Tất cả xe" : t === "Motorbike" ? "Xe máy" : "Ô tô";
}

function WalletCard({ voucher }: { voucher: VoucherClaimResponse }) {
  const [copied, setCopied] = useState(false);

  const daysLeft = voucher.endAt
    ? Math.max(0, Math.ceil((new Date(voucher.endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const isUsed = !!voucher.usedAt;

  function handleCopy() {
    navigator.clipboard.writeText(voucher.code).then(() => {
      setCopied(true);
      showToast({ type: "success", title: "Đã copy mã!", message: `${voucher.code}` });
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={`relative flex rounded-2xl border bg-white shadow-sm overflow-hidden ${
      isUsed ? "border-slate-200 opacity-60" : "border-brand-200"
    }`}>
      <div className="flex flex-col items-center justify-center px-5 py-5 bg-gradient-to-b from-brand-50 to-brand-100/50 min-w-[110px]">
        <TicketPercent className="h-6 w-6 text-brand-600 mb-1.5" />
        <span className="text-xl font-extrabold text-brand-700 leading-tight">
          {voucher.discountType === "Fixed" ? (
            <>{(voucher.discountValue / 1000).toFixed(0)}k</>
          ) : (
            <>{voucher.discountValue}%</>
          )}
        </span>
      </div>

      <div className="absolute left-[101px] top-0 bottom-0 w-px border-l-2 border-dashed border-slate-200" />

      <div className="flex-1 p-4 pl-6 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">{voucher.name}</h3>
            {voucher.description && <p className="text-xs text-slate-500 mt-0.5">{voucher.description}</p>}
          </div>
          {isUsed ? (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
              <CheckCircle className="h-3 w-3" />
              Đã dùng
            </span>
          ) : daysLeft !== null ? (
            <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              daysLeft <= 3 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}>
              <Clock className="h-3 w-3" />
              {daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Hết hôm nay!"}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
          <span>{formatVehicleType(voucher.vehicleType)}</span>
          {voucher.minOrderAmount && (
            <span className="text-amber-600">Đơn từ {formatCurrency(voucher.minOrderAmount)}</span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-800 tracking-wider">
            {voucher.code}
          </div>
          {!isUsed && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              {copied ? "Đã copy!" : "Copy"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerVoucherWalletPage() {
  const [vouchers, setVouchers] = useState<VoucherClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"available" | "used">("available");

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVoucherWallet();
      setVouchers(data);
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải ví voucher." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const available = vouchers.filter(v => !v.usedAt);
  const used = vouchers.filter(v => !!v.usedAt);
  const displayed = tab === "available" ? available : used;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <DashboardHeader
        eyebrow="Voucher wallet"
        title="Ví voucher"
        description="Quản lý voucher đã nhận và sử dụng khi đặt xe."
        actions={
          <Link to="/customer/voucher-hunt" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-colors">
            <Sparkles className="h-4 w-4" />
            Săn mã
          </Link>
        }
      />

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 max-w-xs">
        <button
          type="button"
          onClick={() => setTab("available")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "available" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Chưa dùng ({available.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("used")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "used" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Đã dùng ({used.length})
        </button>
      </div>

      <SectionPanel title={tab === "available" ? "Voucher chưa dùng" : "Voucher đã dùng"}>
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              {tab === "available" ? "Chưa có voucher nào." : "Chưa sử dụng voucher nào."}
            </p>
            {tab === "available" && (
              <Link to="/customer/voucher-hunt" className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700">
                Đi săn mã ngay!
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-1">
            {displayed.map((v) => (
              <WalletCard key={v.id} voucher={v} />
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
