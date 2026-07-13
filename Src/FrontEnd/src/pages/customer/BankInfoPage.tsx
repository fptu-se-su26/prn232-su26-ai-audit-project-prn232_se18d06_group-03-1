import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Building, CreditCard, User, ArrowLeft, CheckCircle, Mail } from "lucide-react";
import Button from "@/components/common/Button";
import FormField from "@/components/common/FormField";
import { Skeleton } from "@/components/common/Skeleton";
import { useOwnerApplication } from "@/features/owner/hooks/useOwnerApplication";
import { VIETNAM_BANKS } from "@/features/owner/data/banks";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { showToast } from "@/components/common/toastStore";
import { 
  getBankAccountDetails, 
  requestBankAccountOtp, 
  verifyBankAccountOtp 
} from "@/features/wallets/services/walletService";

export default function BankInfoPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.roles?.includes("Owner") ?? false;

  const { application, handleBankUpdate, isLoading: wizardLoading, error: wizardError, refetch } = useOwnerApplication(isOwner ? null : "bank");

  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  
  // OTP state for Owner
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        if (isOwner) {
          const bankDetails = await getBankAccountDetails();
          if (bankDetails) {
            setSelectedBank(bankDetails.bankName ?? "");
            setAccountNumber(bankDetails.bankAccountNumber ?? "");
            setAccountHolderName(bankDetails.bankAccountHolderName ?? "");
          }
        } else if (application) {
          setSelectedBank(application.bankName ?? "");
          setAccountNumber(application.bankAccountNumber ?? "");
          setAccountHolderName(application.bankAccountHolderName ?? "");
        }
      } catch (err) {
        console.error("Failed to load bank info", err);
      } finally {
        setInitialLoading(false);
      }
    }

    if (isOwner || application) {
      loadData();
    }
  }, [isOwner, application]);

  const handleSendOtp = async () => {
    if (!selectedBank || !accountNumber.trim() || !accountHolderName.trim()) {
      showToast({ type: "error", title: "Lỗi", message: "Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng." });
      return;
    }
    try {
      setIsSendingOtp(true);
      setLocalError(null);
      await requestBankAccountOtp();
      setOtpSent(true);
      showToast({ type: "success", title: "Đã gửi OTP", message: "Mã OTP đã được gửi về email của bạn." });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Không thể gửi OTP. Vui lòng thử lại.";
      setLocalError(errMsg);
      showToast({ type: "error", title: "Lỗi gửi OTP", message: errMsg });
    } finally {
      setIsSendingOtp(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBank || !accountNumber.trim() || !accountHolderName.trim()) return;

    if (isOwner) {
      if (!otp) {
        showToast({ type: "error", title: "Lỗi", message: "Vui lòng nhập mã OTP." });
        return;
      }
      try {
        setIsSaving(true);
        setLocalError(null);
        setSuccess(false);
        const bankBin = VIETNAM_BANKS.find(b => b.name === selectedBank)?.code || "";
        await verifyBankAccountOtp({
          otp,
          bankName: selectedBank,
          bankAccountNumber: accountNumber.trim(),
          bankAccountHolderName: accountHolderName.trim(),
          bankBin: bankBin || undefined
        });
        setSuccess(true);
        setOtp("");
        setOtpSent(false);
        showToast({ type: "success", title: "Thành công", message: "Đã cập nhật thông tin tài khoản nhận tiền." });
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
        const errMsg = err.response?.data?.message || "Xác thực OTP thất bại.";
        setLocalError(errMsg);
        showToast({ type: "error", title: "Lỗi", message: errMsg });
      } finally {
        setIsSaving(false);
      }
    } else {
      try {
        setIsSaving(true);
        setLocalError(null);
        setSuccess(false);
        await handleBankUpdate(selectedBank, accountNumber.trim(), accountHolderName.trim());
        await refetch();
        setSuccess(true);
        showToast({ type: "success", title: "Thành công", message: "Cập nhật thông tin ngân hàng thành công." });
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
        const errMsg = err.message || "Cập nhật thông tin ngân hàng thất bại.";
        setLocalError(errMsg);
      } finally {
        setIsSaving(false);
      }
    }
  }

  const isValid = selectedBank && accountNumber.trim() && accountHolderName.trim() && (!isOwner || otp.trim());

  if (initialLoading) {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="mb-8 text-center">
          <Skeleton className="mx-auto mb-4 size-14 rounded-full" />
          <Skeleton className="mx-auto mb-2 h-7 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const displayError = localError || (isOwner ? null : wizardError);

  return (
    <div className="mx-auto max-w-2xl py-6">
      <button
        onClick={() => navigate("/account")}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
          <Landmark className="h-7 w-7 text-purple-700" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Thông tin ngân hàng</h1>
        <p className="mt-1 text-zinc-600">
          Nhập thông tin tài khoản ngân hàng để nhận thanh toán từ việc cho thuê xe.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          { icon: Building, label: "Chọn ngân hàng", desc: "Ngân hàng thụ hưởng" },
          { icon: CreditCard, label: "Số tài khoản", desc: "Nhập số tài khoản" },
          { icon: User, label: "Chủ tài khoản", desc: "Xác nhận tên" },
        ].map((step) => (
          <div key={step.label} className="flex flex-col items-center gap-2 rounded-lg border border-zinc-100 bg-white p-4 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
              <step.icon className="h-4 w-4 text-purple-700" />
            </div>
            <span className="text-sm font-semibold text-zinc-800">{step.label}</span>
            <span className="text-xs text-zinc-500">{step.desc}</span>
          </div>
        ))}
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Cập nhật thông tin ngân hàng thành công.
        </div>
      )}

      {displayError && (
        <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{displayError}</div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6">
        {/* Bank selection */}
        <div className="mb-5">
          <label htmlFor="bank" className="mb-1.5 block text-sm font-semibold text-zinc-800">
            Ngân hàng thụ hưởng
          </label>
          <div className="relative">
            <Building className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <select
              id="bank"
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="h-11 w-full rounded-md border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
            >
              <option value="">-- Chọn ngân hàng --</option>
              {VIETNAM_BANKS.map((bank) => (
                <option key={bank.code} value={bank.name}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <FormField
          label="Số tài khoản"
          name="accountNumber"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Nhập số tài khoản ngân hàng"
          leftIcon={<CreditCard className="h-4 w-4" />}
        />

        <FormField
          label="Chủ tài khoản"
          name="accountHolderName"
          value={accountHolderName}
          onChange={(e) => setAccountHolderName(e.target.value)}
          placeholder="Nhập tên chủ tài khoản"
          leftIcon={<User className="h-4 w-4" />}
        />

        {/* OTP Input for Owner */}
        {isOwner && (
          <div className="mb-5 border-t border-zinc-100 pt-5">
            <label className="mb-1.5 block text-sm font-semibold text-zinc-800">
              Xác thực OTP (Bắt buộc để bảo mật tài khoản nhận tiền)
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Nhập mã OTP từ email"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={!otpSent}
                  className="h-11 w-full rounded-md border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:bg-zinc-50 disabled:text-zinc-400"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSendOtp}
                isLoading={isSendingOtp}
                disabled={!selectedBank || !accountNumber || !accountHolderName}
                className="h-11 shrink-0 px-4 !bg-purple-50 hover:!bg-purple-100 !text-purple-700 font-semibold border-none rounded-md"
              >
                {otpSent ? "Gửi lại OTP" : "Gửi mã OTP"}
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              Mã OTP sẽ được gửi tới email liên kết với tài khoản của bạn để xác thực thông tin thay đổi.
            </p>
          </div>
        )}

        <div className="mt-6">
          <Button className="w-full" size="lg" disabled={!isValid} isLoading={isSaving}>
            <Landmark className="h-5 w-5" />
            Lưu thông tin ngân hàng
          </Button>
        </div>
      </form>
    </div>
  );
}
