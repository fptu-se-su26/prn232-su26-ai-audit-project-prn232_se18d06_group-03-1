import { useEffect, useState } from "react";
import { 
  getAllWithdrawals, 
  approveWithdrawal, 
  completeWithdrawal, 
  rejectWithdrawal 
} from "@/features/wallets/services/walletService";
import type { WithdrawalRequestDto, WithdrawalListRequest } from "@/features/wallets/types";
import Card from "@/components/ui/Card";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import { showToast } from "@/components/common/toastStore";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Filter, 
  FileText, 
  AlertCircle 
} from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Actions state
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequestDto | null>(null);
  const [actionType, setActionType] = useState<"approve" | "complete" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const params: WithdrawalListRequest = {
        page,
        pageSize,
        status: status || undefined
      };
      const res = await getAllWithdrawals(params);
      setWithdrawals(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      console.error("Error loading withdrawals:", err);
      setError("Không thể tải danh sách yêu cầu rút tiền.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [page, status]);

  const handleActionSubmit = async () => {
    if (!selectedRequest || !actionType) return;
    if (actionType === "reject" && !note.trim()) {
      showToast({ type: "error", title: "Lỗi", message: "Vui lòng nhập lý do từ chối." });
      return;
    }
    if (actionType === "complete" && !externalRef.trim()) {
      showToast({ type: "error", title: "Lỗi", message: "Vui lòng nhập mã giao dịch ngân hàng." });
      return;
    }

    try {
      setIsSubmitting(true);
      if (actionType === "approve") {
        await approveWithdrawal(selectedRequest.id, { note });
        showToast({ type: "success", title: "Thành công", message: `Đã duyệt yêu cầu #${selectedRequest.id}` });
      } else if (actionType === "complete") {
        await completeWithdrawal(selectedRequest.id, { note, externalTransactionRef: externalRef });
        showToast({ type: "success", title: "Thành công", message: `Đã xác nhận thanh toán yêu cầu #${selectedRequest.id}` });
      } else if (actionType === "reject") {
        await rejectWithdrawal(selectedRequest.id, { reason: note });
        showToast({ type: "success", title: "Thành công", message: `Đã từ chối yêu cầu #${selectedRequest.id}` });
      }
      setSelectedRequest(null);
      setActionType(null);
      setNote("");
      setExternalRef("");
      await fetchWithdrawals();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Thao tác thất bại.";
      showToast({ type: "error", title: "Lỗi", message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 flex items-center gap-1 w-max"><Clock className="w-3.5 h-3.5" /> Chờ xử lý</span>;
      case "Approved":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 flex items-center gap-1 w-max"><CheckCircle className="w-3.5 h-3.5" /> Đã duyệt</span>;
      case "Completed":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 flex items-center gap-1 w-max"><CheckCircle className="w-3.5 h-3.5" /> Thành công</span>;
      case "Rejected":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 flex items-center gap-1 w-max"><XCircle className="w-3.5 h-3.5" /> Bị từ chối</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 w-max">{status}</span>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Yêu cầu rút tiền</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Duyệt, thực hiện chuyển tiền thủ công và từ chối các yêu cầu rút tiền của chủ xe.</p>
        </div>
      </div>

      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
          <Filter className="w-4 h-4" />
          <span>Bộ lọc trạng thái:</span>
        </div>
        <div className="flex gap-2">
          {[
            { value: "", label: "Tất cả" },
            { value: "Pending", label: "Chờ xử lý" },
            { value: "Approved", label: "Đã duyệt" },
            { value: "Completed", label: "Thành công" },
            { value: "Rejected", label: "Bị từ chối" }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${status === f.value ? 'bg-brand-600 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
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
                  <th className="p-4">Yêu cầu</th>
                  <th className="p-4">Chủ xe</th>
                  <th className="p-4">Số tiền</th>
                  <th className="p-4">Tài khoản nhận</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Người xử lý</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      Chưa có yêu cầu rút tiền nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 dark:text-white">#{w.id}</span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {new Date(w.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{w.userFullName || "N/A"}</p>
                        <p className="text-xs text-slate-400">{w.userEmail}</p>
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(w.amount)}
                      </td>
                      <td className="p-4 text-xs space-y-0.5">
                        <p className="font-bold uppercase text-slate-800 dark:text-slate-200">{w.bankName}</p>
                        <p className="font-mono text-slate-900 dark:text-white">{w.bankAccountNumber}</p>
                        <p className="uppercase text-slate-500">{w.bankAccountHolderName}</p>
                      </td>
                      <td className="p-4">{getStatusBadge(w.status)}</td>
                      <td className="p-4 text-xs">
                        {w.processedByName ? (
                          <>
                            <p className="font-semibold">{w.processedByName}</p>
                            {w.processedAt && (
                              <p className="text-slate-400 mt-0.5">{new Date(w.processedAt).toLocaleString('vi-VN')}</p>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {w.status === "Pending" && (
                            <>
                              <button
                                onClick={() => { setSelectedRequest(w); setActionType("approve"); }}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => { setSelectedRequest(w); setActionType("reject"); }}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 transition-colors"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                          {w.status === "Approved" && (
                            <>
                              <button
                                onClick={() => { setSelectedRequest(w); setActionType("complete"); }}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 transition-colors"
                              >
                                Đã chuyển khoản
                              </button>
                              <button
                                onClick={() => { setSelectedRequest(w); setActionType("reject"); }}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 transition-colors"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                          {(w.status === "Completed" || w.status === "Rejected") && (
                            <div className="text-xs text-slate-400 italic">
                              {w.processNote ? `"${w.processNote}"` : "Không có ghi chú"}
                            </div>
                          )}
                        </div>
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

      {/* Action modal */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {actionType === "approve" && <CheckCircle className="w-5 h-5 text-blue-600" />}
                {actionType === "complete" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                {actionType === "reject" && <XCircle className="w-5 h-5 text-rose-600" />}
                {actionType === "approve" && "Duyệt yêu cầu rút tiền"}
                {actionType === "complete" && "Xác nhận chuyển khoản"}
                {actionType === "reject" && "Từ chối yêu cầu rút tiền"}
              </h3>
              <button onClick={() => { setSelectedRequest(null); setActionType(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-sm">
                <p>Mã yêu cầu: <span className="font-bold text-slate-900 dark:text-white">#{selectedRequest.id}</span></p>
                <p>Chủ xe: <span className="font-semibold text-slate-900 dark:text-white">{selectedRequest.userFullName}</span></p>
                <p>Số tiền rút: <span className="font-bold text-rose-500">{formatCurrency(selectedRequest.amount)}</span></p>
                <p className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-xs">
                  NH: {selectedRequest.bankName} - STK: {selectedRequest.bankAccountNumber}
                </p>
              </div>

              {actionType === "complete" && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Mã giao dịch ngân hàng (External Transaction Ref) *</label>
                  <input
                    type="text"
                    placeholder="Nhập mã giao dịch của ngân hàng chuyển tiền..."
                    value={externalRef}
                    onChange={(e) => setExternalRef(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  {actionType === "reject" ? "Lý do từ chối *" : "Ghi chú xử lý (Tùy chọn)"}
                </label>
                <textarea
                  placeholder={actionType === "reject" ? "Nhập lý do từ chối chi tiết..." : "Nhập ghi chú lưu lại hệ thống..."}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 h-24 resize-none"
                />
              </div>

              {actionType === "complete" && (
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs p-3 rounded-lg flex gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Chủ xe sẽ nhận được thông báo về việc rút tiền thành công cùng thông tin chi tiết tài khoản nhận.</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => { setSelectedRequest(null); setActionType(null); }}
                  className="flex-1 h-12 rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={handleActionSubmit}
                  isLoading={isSubmitting}
                  className={`flex-1 h-12 rounded-xl text-[15px] font-bold text-white ${
                    actionType === "reject" ? "bg-rose-600 hover:bg-rose-700" :
                    actionType === "complete" ? "bg-emerald-600 hover:bg-emerald-700" :
                    "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
