import { useEffect, useState } from "react";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  History, 
  Plus, 
  Wallet as WalletIcon, 
  XCircle, 
  CreditCard, 
  ChevronRight, 
  Building2, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  Send 
} from "lucide-react";
import { 
  getMyWallet, 
  getMyTransactions, 
  getBankAccountDetails, 
  requestBankAccountOtp, 
  verifyBankAccountOtp, 
  createWithdrawal, 
  getMyWithdrawals 
} from "@/features/wallets/services/walletService";
import type { 
  WalletDto, 
  WalletTransactionDto, 
  OwnerBankDetailsDto, 
  WithdrawalRequestDto 
} from "@/features/wallets/types";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Card from "@/components/ui/Card";
import { showToast } from "@/components/common/toastStore";
import { useSearchParams } from "react-router-dom";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function isCreditTransaction(type: string) {
  return ["TopUp", "BookingEarning", "Refund", "PayoutReversal", "DisputeCompensation", "PlatformFeeRevenue"].includes(type);
}

function getTransactionIcon(type: string) {
  if (isCreditTransaction(type)) {
    return <ArrowDownLeft className="h-5 w-5 text-emerald-500" />;
  }
  return <ArrowUpRight className="h-5 w-5 text-rose-500" />;
}

function getTransactionLabel(type: string) {
  const map: Record<string, string> = {
    TopUp: "Nạp tiền",
    BookingEarning: "Thu nhập cho thuê",
    Refund: "Hoàn tiền",
    PayoutReversal: "Hủy rút tiền",
    DisputeCompensation: "Bồi thường tranh chấp",
    PlatformFeeRevenue: "Doanh thu phí nền tảng",
    AdminAdjust: "Điều chỉnh hệ thống",
    BookingPayment: "Thanh toán cọc",
    Withdrawal: "Rút tiền",
    Penalty: "Phí phạt",
    PlatformFee: "Phí nền tảng",
    BookingEarningReversal: "Thu hồi khoản giải ngân trùng",
  };
  return map[type] || type;
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Pending":
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300";
    case "Approved":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
    case "Completed":
      return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300";
    case "Rejected":
      return "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300";
    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "Pending": return "Chờ xử lý";
    case "Approved": return "Đã duyệt";
    case "Completed": return "Thành công";
    case "Rejected": return "Đã từ chối";
    default: return status;
  }
}

export default function WalletPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRole = useAuthStore((state) => state.activeRole);
  const isOwner = activeRole === "Owner";

  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [bankDetails, setBankDetails] = useState<OwnerBankDetailsDto | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<"transactions" | "withdrawals">("transactions");

  useEffect(() => {
    setActiveTab(searchParams.get("tab") === "withdrawals" && isOwner ? "withdrawals" : "transactions");
  }, [searchParams, isOwner]);

  // Top Up Modal
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number | "">("");
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState(false);

  // Withdrawal Modal
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Bank Account Modal
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolderName, setBankAccountHolderName] = useState("");
  const [bankBin, setBankBin] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletData, txData] = await Promise.all([
        getMyWallet(),
        getMyTransactions({ page: 1, pageSize: 20 })
      ]);
      setWallet(walletData);
      setTransactions(txData.items);

      if (isOwner) {
        const bankData = await getBankAccountDetails();
        setBankDetails(bankData);
        
        const wData = await getMyWithdrawals({ page: 1, pageSize: 20 });
        setWithdrawals(wData.items);
      }
    } catch (err: any) {
      console.error("Wallet error:", err);
      setError("Không thể tải thông tin ví. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isOwner]);

  const handleTopUp = async () => {
    if (!topUpAmount || Number(topUpAmount) < 10000) {
      showToast({ type: "error", title: "Lỗi", message: "Số tiền nạp tối thiểu là 10.000đ" });
      return;
    }
    try {
      setIsSubmittingTopUp(true);
      const { createTopUpPaymentLink } = await import("@/features/payments/services/paymentService");
      const res = await createTopUpPaymentLink(Number(topUpAmount));
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (err) {
      showToast({ type: "error", title: "Lỗi thanh toán", message: "Không thể tạo liên kết thanh toán lúc này." });
    } finally {
      setIsSubmittingTopUp(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) < 50000) {
      showToast({ type: "error", title: "Lỗi rút tiền", message: "Số tiền rút tối thiểu là 50.000đ." });
      return;
    }
    if (wallet && wallet.balance < Number(withdrawAmount)) {
      showToast({ type: "error", title: "Lỗi rút tiền", message: "Số dư khả dụng không đủ." });
      return;
    }
    try {
      setIsSubmittingWithdraw(true);
      await createWithdrawal(Number(withdrawAmount));
      showToast({ type: "success", title: "Thành công", message: "Yêu cầu rút tiền đã được gửi. Vui lòng chờ nhân viên duyệt." });
      setIsWithdrawOpen(false);
      setWithdrawAmount("");
      await loadData();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Tạo yêu cầu rút tiền thất bại.";
      showToast({ type: "error", title: "Lỗi", message: errMsg });
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleSendOtp = async () => {
    if (!bankName || !bankAccountNumber || !bankAccountHolderName) {
      showToast({ type: "error", title: "Lỗi", message: "Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng." });
      return;
    }
    try {
      setIsSendingOtp(true);
      await requestBankAccountOtp();
      setOtpSent(true);
      showToast({ type: "success", title: "Đã gửi OTP", message: "Mã OTP đã được gửi về email của bạn." });
    } catch (err: any) {
      showToast({ type: "error", title: "Lỗi gửi OTP", message: "Không thể gửi OTP. Vui lòng thử lại." });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSaveBank = async () => {
    if (!otp) {
      showToast({ type: "error", title: "Lỗi", message: "Vui lòng nhập mã OTP." });
      return;
    }
    try {
      setIsSavingBank(true);
      await verifyBankAccountOtp({
        otp,
        bankName,
        bankAccountNumber,
        bankAccountHolderName,
        bankBin: bankBin || undefined
      });
      showToast({ type: "success", title: "Thành công", message: "Đã cập nhật thông tin tài khoản nhận tiền." });
      setIsBankModalOpen(false);
      setOtp("");
      setOtpSent(false);
      await loadData();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Xác thực OTP thất bại.";
      showToast({ type: "error", title: "Lỗi", message: errMsg });
    } finally {
      setIsSavingBank(false);
    }
  };

  const openBankModal = () => {
    if (bankDetails) {
      setBankName(bankDetails.bankName || "");
      setBankAccountNumber(bankDetails.bankAccountNumber || "");
      setBankAccountHolderName(bankDetails.bankAccountHolderName || "");
      setBankBin(bankDetails.bankBin || "");
    }
    setOtp("");
    setOtpSent(false);
    setIsBankModalOpen(true);
  };

  if (loading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <div className="mx-auto max-w-lg pt-10">
        <Alert variant="error" title="Lỗi">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Ví của tôi</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý số dư, thực hiện nạp rút và quản lý tài khoản ngân hàng liên kết.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 relative overflow-hidden !bg-brand-600 !border-none !p-0">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <WalletIcon className="w-48 h-48 text-white -rotate-12" />
          </div>
          <div className="relative z-10 p-8 flex flex-col h-full justify-between">
            <div>
              <p className="text-brand-100 font-medium text-sm mb-1">Số dư khả dụng</p>
              <h2 className="text-4xl font-bold text-white tracking-tight">
                {formatCurrency(wallet?.balance || 0)}
              </h2>
            </div>
            <div className="flex gap-4 mt-8">
              <Button 
                onClick={() => setIsTopUpOpen(true)} 
                variant="secondary"
                className="!bg-white !text-brand-700 hover:!bg-brand-50 border-none font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nạp tiền
              </Button>
              {isOwner && (
                <Button 
                  onClick={() => setIsWithdrawOpen(true)} 
                  disabled={!bankDetails?.bankAccountNumber}
                  className="bg-transparent text-white border border-white/30 hover:bg-white/10 font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Rút tiền
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-center gap-6 p-8 bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng đã rút / đã tiêu</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(wallet?.totalSpent || 0)}</p>
          </div>
          <div className="h-px bg-slate-100 dark:bg-slate-800" />
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng doanh thu nhận được</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(wallet?.totalEarned || 0)}</p>
          </div>
        </Card>
      </div>

      {isOwner && (
        <Card className="p-6 bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-lg">Tài khoản ngân hàng liên kết</h4>
                {bankDetails?.bankAccountNumber ? (
                  <div className="mt-1 text-slate-600 dark:text-slate-300 space-y-0.5">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      Ngân hàng: <span className="font-bold uppercase">{bankDetails.bankName}</span>
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Số tài khoản: <span className="font-mono text-slate-900 dark:text-white font-bold">{bankDetails.bankAccountNumber}</span>
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Chủ tài khoản: <span className="uppercase font-semibold text-slate-800 dark:text-slate-200">{bankDetails.bankAccountHolderName}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-rose-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Chưa thiết lập tài khoản nhận tiền. Bạn cần cập nhật để rút tiền về.
                  </p>
                )}
              </div>
            </div>
            <Button 
              onClick={openBankModal} 
              variant="secondary"
              className="shrink-0 !bg-slate-100 hover:!bg-slate-200 !text-slate-700 dark:!bg-slate-800 dark:hover:!bg-slate-700 dark:!text-slate-200 font-semibold px-4 py-2 rounded-xl border-none"
            >
              {bankDetails?.bankAccountNumber ? "Cập nhật ngân hàng" : "Thiết lập ngay"}
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs / lists */}
      <div className="space-y-4">
        {isOwner && (
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setSearchParams({ tab: "transactions" })}
              className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 -mb-[2px] ${activeTab === "transactions" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}`}
            >
              Lịch sử giao dịch
            </button>
            <button 
              onClick={() => setSearchParams({ tab: "withdrawals" })}
              className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 -mb-[2px] ${activeTab === "withdrawals" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}`}
            >
              Yêu cầu rút tiền
            </button>
          </div>
        )}

        {activeTab === "transactions" ? (
          <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800 overflow-hidden !p-0">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-brand-600" />
                Lịch sử giao dịch ví
              </h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Chưa có giao dịch nào.</p>
                </div>
              ) : (
                transactions.map((tx) => {
                  const isPositive = isCreditTransaction(tx.type);
                  return (
                    <div key={tx.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-[15px]">
                            {getTransactionLabel(tx.type)}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(tx.createdAt).toLocaleString('vi-VN')}
                            </span>
                            {tx.note && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{tx.note}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-[15px] ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {isPositive ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        ) : (
          <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800 overflow-hidden !p-0">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" />
                Lịch sử yêu cầu rút tiền
              </h3>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {withdrawals.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Chưa có yêu cầu rút tiền nào.</p>
                </div>
              ) : (
                withdrawals.map((w) => (
                  <div key={w.id} className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">#{w.id}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Yêu cầu lúc: {new Date(w.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadgeClass(w.status)}`}>
                        {getStatusText(w.status)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm">
                          Đến tài khoản: <span className="font-bold">{w.bankAccountNumber}</span> ({w.bankName})
                        </p>
                        {w.processNote && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                            Ghi chú: {w.processNote}
                          </p>
                        )}
                        {w.externalTransactionRef && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                            Mã giao dịch ngân hàng: <span className="font-mono font-semibold">{w.externalTransactionRef}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-slate-900 dark:text-white text-lg">
                          -{formatCurrency(w.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>

      {/* TopUp Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-600" />
                Nạp tiền vào ví
              </h3>
              <button onClick={() => setIsTopUpOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Số tiền cần nạp (VNĐ)</label>
                <input 
                  type="number" 
                  placeholder="VD: 500000" 
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[100000, 200000, 500000].map(amt => (
                  <button 
                    key={amt} 
                    onClick={() => setTopUpAmount(amt)}
                    className="py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm p-3 rounded-lg flex gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Thanh toán an toàn qua cổng PayOS bằng tính năng quét mã QR của mọi ứng dụng ngân hàng.</span>
              </div>
              
              <Button 
                onClick={handleTopUp}
                isLoading={isSubmittingTopUp}
                disabled={!topUpAmount || Number(topUpAmount) < 10000}
                className="w-full h-12 rounded-xl text-[15px] font-bold mt-4 shadow-md"
              >
                Tiếp tục thanh toán
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Withdraw Modal */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-600" />
                Yêu cầu rút tiền
              </h3>
              <button onClick={() => setIsWithdrawOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {bankDetails?.bankAccountNumber && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-2 border border-slate-100 dark:border-slate-700 text-sm">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Rút về tài khoản nhận tiền:</p>
                  <p>Ngân hàng: <span className="font-bold uppercase text-slate-900 dark:text-white">{bankDetails.bankName}</span></p>
                  <p>Số tài khoản: <span className="font-mono font-bold text-slate-900 dark:text-white">{bankDetails.bankAccountNumber}</span></p>
                  <p>Chủ tài khoản: <span className="uppercase text-slate-900 dark:text-white">{bankDetails.bankAccountHolderName}</span></p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Số tiền rút (VNĐ)</label>
                <input 
                  type="number" 
                  placeholder="Số tiền cần rút, tối thiểu 50.000đ" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[100000, 500000, 1000000].map(amt => (
                  <button 
                    key={amt} 
                    onClick={() => setWithdrawAmount(amt)}
                    className="py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>

              <Button 
                onClick={handleWithdraw}
                isLoading={isSubmittingWithdraw}
                disabled={!withdrawAmount || Number(withdrawAmount) < 50000 || (wallet?.balance || 0) < Number(withdrawAmount)}
                className="w-full h-12 rounded-xl text-[15px] font-bold mt-4 shadow-md"
              >
                Gửi yêu cầu rút tiền
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Bank Info Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-600" />
                Cập nhật tài khoản nhận tiền
              </h3>
              <button onClick={() => setIsBankModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Tên ngân hàng</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: MB Bank, Vietcombank..." 
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  disabled={otpSent}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Số tài khoản</label>
                <input 
                  type="text" 
                  placeholder="Nhập số tài khoản ngân hàng" 
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  disabled={otpSent}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Tên chủ tài khoản (Không dấu)</label>
                <input 
                  type="text" 
                  placeholder="VD: NGUYEN VAN A" 
                  value={bankAccountHolderName}
                  onChange={(e) => setBankAccountHolderName(e.target.value)}
                  disabled={otpSent}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Mã BIN ngân hàng (Tùy chọn)</label>
                <input 
                  type="text" 
                  placeholder="VD: 970422" 
                  value={bankBin}
                  onChange={(e) => setBankBin(e.target.value)}
                  disabled={otpSent}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
                />
              </div>

              {!otpSent ? (
                <Button 
                  onClick={handleSendOtp}
                  isLoading={isSendingOtp}
                  disabled={!bankName || !bankAccountNumber || !bankAccountHolderName}
                  className="w-full h-12 rounded-xl text-[15px] font-bold mt-4 shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Gửi mã OTP xác thực
                </Button>
              ) : (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-sm p-3 rounded-lg flex gap-2">
                    <UserCheck className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Hệ thống đã gửi một mã OTP gồm 6 chữ số vào email của bạn. Vui lòng kiểm tra và nhập bên dưới để hoàn tất cập nhật.</span>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Mã xác thực OTP</label>
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="Nhập mã OTP 6 số" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center tracking-[0.5em] font-mono text-xl text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="ghost"
                      onClick={() => setOtpSent(false)}
                      className="flex-1 h-12 rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      Quay lại
                    </Button>
                    <Button 
                      onClick={handleSaveBank}
                      isLoading={isSavingBank}
                      disabled={!otp || otp.length < 4}
                      className="flex-1 h-12 rounded-xl text-[15px] font-bold"
                    >
                      Xác nhận lưu
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
