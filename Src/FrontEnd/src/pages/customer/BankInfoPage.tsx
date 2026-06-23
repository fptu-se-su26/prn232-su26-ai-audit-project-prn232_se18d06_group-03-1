import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Building, CreditCard, User, ArrowLeft, CheckCircle } from "lucide-react";
import Button from "@/components/common/Button";
import FormField from "@/components/common/FormField";
import { Skeleton } from "@/components/common/Skeleton";
import { useOwnerApplication } from "@/features/owner/hooks/useOwnerApplication";
import { VIETNAM_BANKS } from "@/features/owner/data/banks";

export default function BankInfoPage() {
  const navigate = useNavigate();
  const { application, handleBankUpdate, isLoading, error, setError, refetch } = useOwnerApplication("bank");

  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (application) {
      setInitialLoading(false);
      setSelectedBank(application.bankName ?? "");
      setAccountNumber(application.bankAccountNumber ?? "");
      setAccountHolderName(application.bankAccountHolderName ?? "");
    }
  }, [application]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBank || !accountNumber.trim() || !accountHolderName.trim()) return;
    try {
      setSuccess(false);
      setError(null);
      await handleBankUpdate(selectedBank, accountNumber.trim(), accountHolderName.trim());
      await refetch();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // error handled by hook
    }
  }

  const isValid = selectedBank && accountNumber.trim() && accountHolderName.trim();

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

      {error && (
        <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
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

        <div className="mt-6">
          <Button className="w-full" size="lg" disabled={!isValid} isLoading={isLoading}>
            <Landmark className="h-5 w-5" />
            Lưu thông tin ngân hàng
          </Button>
        </div>
      </form>
    </div>
  );
}
