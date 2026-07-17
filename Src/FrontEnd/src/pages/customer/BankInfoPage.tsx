import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building, CheckCircle, CreditCard, Landmark, Mail, ShieldCheck, User } from "lucide-react";
import Button from "@/components/common/Button";
import FormField from "@/components/common/FormField";
import { Skeleton } from "@/components/common/Skeleton";
import { showToast } from "@/components/common/toastStore";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { VIETNAM_BANKS } from "@/features/owner/data/banks";
import { useOwnerApplication } from "@/features/owner/hooks/useOwnerApplication";
import {
  getBankAccountDetails,
  requestBankAccountOtp,
  verifyBankAccountOtp,
} from "@/features/wallets/services/walletService";

type ApiErrorLike = {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiErrorLike;
  return apiError.response?.data?.message ?? apiError.message ?? fallback;
}

const inputClassName =
  "mt-1 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400";

export default function BankInfoPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.roles?.includes("Owner") ?? false;

  const { application, handleBankUpdate, error: wizardError, refetch } = useOwnerApplication(isOwner ? null : "bank");

  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
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
      void loadData();
    }
  }, [isOwner, application]);

  async function handleSendOtp() {
    if (!selectedBank || !accountNumber.trim() || !accountHolderName.trim()) {
      showToast({ type: "error", title: "Thiếu thông tin", message: "Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng." });
      return;
    }

    try {
      setIsSendingOtp(true);
      setLocalError(null);
      await requestBankAccountOtp();
      setOtpSent(true);
      showToast({ type: "success", title: "Đã gửi OTP", message: "Mã OTP đã được gửi về email của bạn." });
    } catch (err) {
      const errMsg = getErrorMessage(err, "Không thể gửi OTP. Vui lòng thử lại.");
      setLocalError(errMsg);
      showToast({ type: "error", title: "Lỗi gửi OTP", message: errMsg });
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedBank || !accountNumber.trim() || !accountHolderName.trim()) return;

    if (isOwner) {
      if (!otp.trim()) {
        showToast({ type: "error", title: "Thiếu OTP", message: "Vui lòng nhập mã OTP." });
        return;
      }

      try {
        setIsSaving(true);
        setLocalError(null);
        setSuccess(false);
        const bankBin = VIETNAM_BANKS.find((bank) => bank.name === selectedBank)?.code || "";
        await verifyBankAccountOtp({
          bankAccountHolderName: accountHolderName.trim(),
          bankAccountNumber: accountNumber.trim(),
          bankBin: bankBin || undefined,
          bankName: selectedBank,
          otp,
        });
        setSuccess(true);
        setOtp("");
        setOtpSent(false);
        showToast({ type: "success", title: "Đã lưu ngân hàng", message: "Thông tin tài khoản nhận tiền đã được cập nhật." });
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        const errMsg = getErrorMessage(err, "Xác thực OTP thất bại.");
        setLocalError(errMsg);
        showToast({ type: "error", title: "Không thể lưu", message: errMsg });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    try {
      setIsSaving(true);
      setLocalError(null);
      setSuccess(false);
      await handleBankUpdate(selectedBank, accountNumber.trim(), accountHolderName.trim());
      await refetch();
      setSuccess(true);
      showToast({ type: "success", title: "Đã lưu ngân hàng", message: "Thông tin ngân hàng đã được cập nhật." });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setLocalError(getErrorMessage(err, "Cập nhật thông tin ngân hàng thất bại."));
    } finally {
      setIsSaving(false);
    }
  }

  const isValid = Boolean(selectedBank && accountNumber.trim() && accountHolderName.trim() && (!isOwner || otp.trim()));
  const displayError = localError || (isOwner ? null : wizardError);

  if (initialLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-32 rounded-md" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-28 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-md" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <button
        type="button"
        onClick={() => navigate("/account")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>

      <DashboardHeader
        eyebrow="Payout account"
        title="Thông tin ngân hàng"
        description="Cập nhật tài khoản thụ hưởng để nhận thanh toán, hoàn tiền hoặc đối soát ví trong hệ thống MoveVN."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { desc: "Chọn ngân hàng thụ hưởng", icon: Building, label: "Ngân hàng" },
          { desc: "Nhập đúng số tài khoản", icon: CreditCard, label: "Số tài khoản" },
          { desc: "Trùng tên chủ tài khoản", icon: User, label: "Chủ tài khoản" },
        ].map((step) => (
          <div key={step.label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-brand-50 p-2 text-brand-700 ring-1 ring-brand-100">
                <step.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-950">{step.label}</p>
                <p className="mt-1 text-sm text-slate-500">{step.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {success ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Cập nhật thông tin ngân hàng thành công.
        </div>
      ) : null}

      {displayError ? <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{displayError}</div> : null}

      <SectionPanel
        title="Tài khoản nhận tiền"
        description={isOwner ? "Chủ xe cần xác thực OTP trước khi thay đổi tài khoản nhận tiền." : "Thông tin này được dùng trong quy trình đăng ký làm chủ xe."}
        action={<Landmark className="h-5 w-5 text-brand-700" />}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <label htmlFor="bank" className="block text-sm font-semibold text-slate-700">
            Ngân hàng thụ hưởng
            <div className="relative">
              <Building className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                id="bank"
                value={selectedBank}
                onChange={(event) => setSelectedBank(event.target.value)}
                className="mt-1 h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">-- Chọn ngân hàng --</option>
                {VIETNAM_BANKS.map((bank) => (
                  <option key={bank.code} value={bank.name}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Số tài khoản"
              name="accountNumber"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              placeholder="Nhập số tài khoản ngân hàng"
              leftIcon={<CreditCard className="h-4 w-4" />}
            />

            <FormField
              label="Chủ tài khoản"
              name="accountHolderName"
              value={accountHolderName}
              onChange={(event) => setAccountHolderName(event.target.value)}
              placeholder="Nhập tên chủ tài khoản"
              leftIcon={<User className="h-4 w-4" />}
            />
          </div>

          {isOwner ? (
            <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-start gap-3">
                <span className="rounded-md bg-white p-2 text-brand-700 ring-1 ring-slate-200">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-950">Xác thực thay đổi bằng OTP</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    Mã OTP sẽ được gửi tới email liên kết với tài khoản để bảo vệ tài khoản nhận tiền.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nhập mã OTP từ email"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    disabled={!otpSent}
                    className={`${inputClassName} mt-0 pl-10`}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleSendOtp()}
                  isLoading={isSendingOtp}
                  disabled={!selectedBank || !accountNumber || !accountHolderName}
                  className="h-11 shrink-0"
                >
                  {otpSent ? "Gửi lại OTP" : "Gửi mã OTP"}
                </Button>
              </div>
            </div>
          ) : null}

          <Button className="w-full" size="lg" disabled={!isValid} isLoading={isSaving}>
            <Landmark className="h-5 w-5" />
            Lưu thông tin ngân hàng
          </Button>
        </form>
      </SectionPanel>
    </div>
  );
}
