import { useEffect, useState } from "react";
import { 
  getAdminWallets, 
  getAdminWalletDetail, 
  adjustWalletBalance 
} from "@/features/wallets/services/walletService";
import type { 
  AdminWalletListItem, 
  AdminWalletDetail, 
  WalletTransactionDto 
} from "@/features/wallets/types";
import Card from "@/components/ui/Card";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { showToast } from "@/components/common/toastStore";
import { 
  Search, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  Calendar, 
  FileText, 
  Info, 
  Edit3, 
  X 
} from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function getTransactionLabel(type: string) {
  const map: Record<string, string> = {
    TopUp: "Nạp tiền",
    BookingEarning: "Thu nhập cho thuê",
    Refund: "Hoàn tiền",
    PayoutReversal: "Hủy rút tiền",
    AdminAdjust: "Điều chỉnh hệ thống",
    BookingPayment: "Thanh toán cọc",
    Withdrawal: "Rút tiền",
    Penalty: "Phí phạt",
    PlatformFee: "Phí nền tảng",
    PlatformFeeRevenue: "Doanh thu phí nền tảng",
    BookingEarningReversal: "Thu hồi khoản giải ngân trùng",
  };
  return map[type] || type;
}

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<AdminWalletListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selected wallet detail
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminWalletDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Adjustment state
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<number | "">("");
  const [adjustNote, setAdjustNote] = useState("");
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const res = await getAdminWallets({
        page,
        pageSize,
        keyword: searchTerm || undefined
      });
      setWallets(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      console.error("Error loading wallets:", err);
      setError("Không thể tải danh sách ví của hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchWallets();
  };

  const fetchDetail = async (userId: number) => {
    try {
      setLoadingDetail(true);
      const res = await getAdminWalletDetail(userId, { txPage: 1, txPageSize: 20 });
      setDetail(res);
      setSelectedUserId(userId);
    } catch (err: any) {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải chi tiết ví." });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAdjustWalletBalance = async () => {
    if (!selectedUserId || !adjustAmount || !adjustNote.trim()) {
      showToast({ type: "error", title: "Lỗi", message: "Vui lòng điền đầy đủ số tiền điều chỉnh và lý do." });
      return;
    }

    try {
      setIsSubmittingAdjustment(true);
      await adjustWalletBalance(selectedUserId, {
        amount: Number(adjustAmount),
        note: adjustNote
      });
      showToast({ type: "success", title: "Thành công", message: "Điều chỉnh số dư ví thành công." });
      setIsAdjusting(false);
      setAdjustAmount("");
      setAdjustNote("");
      // Reload detail and list
      await fetchDetail(selectedUserId);
      await fetchWallets();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Điều chỉnh số dư thất bại.";
      showToast({ type: "error", title: "Lỗi", message: errMsg });
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Quản lý ví tài khoản</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Theo dõi số dư ví, xem lịch sử giao dịch và thực hiện điều chỉnh số dư của người dùng hệ thống.
        </p>
      </div>

      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email chủ ví..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
            />
          </div>
          <Button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl px-5 text-sm">
            Tìm kiếm
          </Button>
        </form>
      </Card>

      {error && <Alert variant="error" title="Lỗi">{error}</Alert>}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800 overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Ví ID</th>
                  <th className="p-4">Chủ sở hữu</th>
                  <th className="p-4">Số dư hiện tại</th>
                  <th className="p-4">Tổng thu nhập</th>
                  <th className="p-4">Tổng chi tiêu</th>
                  <th className="p-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                {wallets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400">
                      Không tìm thấy ví nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  wallets.map((item) => (
                    <tr key={item.walletId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                        #{item.walletId}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{item.userFullName || "N/A"}</p>
                        <p className="text-xs text-slate-400">{item.userEmail}</p>
                      </td>
                      <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(item.balance)}
                      </td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatCurrency(item.totalEarned)}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-semibold">
                        {formatCurrency(item.totalSpent)}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          onClick={() => fetchDetail(item.userId)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                        >
                          <Info className="w-3.5 h-3.5 mr-1 inline-block" />
                          Chi tiết & Giao dịch
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500">Hiển thị trang {page}/{totalPages}</span>
              <div className="flex gap-2">
                <Button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 text-xs border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Trước
                </Button>
                <Button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 text-xs border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Wallet detail modal */}
      {selectedUserId && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl bg-white dark:bg-slate-900 shadow-xl border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-brand-600" />
                  Chi tiết ví #{detail.wallet.id}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Chủ ví: <span className="font-semibold text-slate-800 dark:text-slate-200">{detail.userFullName}</span> ({detail.userEmail})
                </p>
              </div>
              <button 
                onClick={() => { setSelectedUserId(null); setDetail(null); setIsAdjusting(false); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Số dư khả dụng</p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {formatCurrency(detail.wallet.balance)}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-medium">Tổng thu nhập</p>
                  <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(detail.wallet.totalEarned)}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Tổng đã rút / chi tiêu</p>
                  <p className="text-xl font-extrabold text-slate-950 dark:text-slate-200 mt-1">
                    {formatCurrency(detail.wallet.totalSpent)}
                  </p>
                </div>
              </div>

              {/* Adjust Balance section */}
              {isAdjusting ? (
                <div className="p-4 rounded-xl border border-brand-200 dark:border-brand-900/30 bg-brand-50/20 dark:bg-brand-950/10 space-y-4">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                    <Edit3 className="w-4 h-4 text-brand-600" />
                    Điều chỉnh số dư ví
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                        Số tiền thay đổi (Cộng/trừ số dư) *
                      </label>
                      <input
                        type="number"
                        placeholder="VD: 100000 (cộng) hoặc -50000 (trừ)"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value ? Number(e.target.value) : "")}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                        Lý do điều chỉnh (Audit Log) *
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Điều chỉnh do giao dịch hoàn tiền bị lỗi..."
                        value={adjustNote}
                        onChange={(e) => setAdjustNote(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsAdjusting(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      onClick={handleAdjustWalletBalance}
                      isLoading={isSubmittingAdjustment}
                      disabled={!adjustAmount || !adjustNote.trim()}
                      className="px-4 py-1.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg"
                    >
                      Lưu thay đổi
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsAdjusting(true)}
                    className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Điều chỉnh số dư
                  </Button>
                </div>
              )}

              {/* Transactions list */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1">
                  <ArrowUpDown className="w-4 h-4 text-slate-400" />
                  Giao dịch ví gần đây
                </h4>
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                  {detail.transactions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      Chưa có giao dịch nào được ghi nhận.
                    </div>
                  ) : (
                    detail.transactions.map((tx) => {
                      const isPositive = tx.type === "TopUp" || tx.type === "BookingEarning" || tx.type === "Refund" || tx.type === "PayoutReversal" || tx.type === "DisputeCompensation" || tx.type === "PlatformFeeRevenue";
                      return (
                        <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors text-xs sm:text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">{getTransactionLabel(tx.type)}</span>
                              <span className="text-[10px] text-slate-400">•</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">ID: #{tx.id}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(tx.createdAt).toLocaleString('vi-VN')}</span>
                              {tx.note && (
                                <>
                                  <span>•</span>
                                  <span className="italic max-w-[300px] truncate">{tx.note}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                              {isPositive ? '+' : '-'}{formatCurrency(tx.amount)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
