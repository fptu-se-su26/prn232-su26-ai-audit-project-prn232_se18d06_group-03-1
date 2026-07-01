import { useState, useEffect } from "react";
import Button from "@/components/common/Button";
import FormField from "@/components/common/FormField";
import { VIETNAM_BANKS } from "@/features/owner/data/banks";

interface BankInfoFormProps {
  onSave: (bankName: string, bankAccountNumber: string, bankAccountHolderName: string) => Promise<void>;
  isLoading: boolean;
  initialBankName?: string;
  initialAccountNumber?: string;
  initialHolderName?: string;
}

export default function BankInfoForm({
  onSave,
  isLoading,
  initialBankName = "",
  initialAccountNumber = "",
  initialHolderName = "",
}: BankInfoFormProps) {
  const [selectedBank, setSelectedBank] = useState(initialBankName);
  const [accountNumber, setAccountNumber] = useState(initialAccountNumber);
  const [accountHolderName, setAccountHolderName] = useState(initialHolderName);

  useEffect(() => {
    setSelectedBank(initialBankName);
    setAccountNumber(initialAccountNumber);
    setAccountHolderName(initialHolderName);
  }, [initialBankName, initialAccountNumber, initialHolderName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBank || !accountNumber.trim() || !accountHolderName.trim()) return;
    await onSave(selectedBank, accountNumber.trim(), accountHolderName.trim());
  }

  const isValid = selectedBank && accountNumber.trim() && accountHolderName.trim();

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Thông tin ngân hàng</h2>
      <p className="mb-5 text-sm text-zinc-600">
        Nhập thông tin tài khoản ngân hàng để nhận thanh toán.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="bank" className="mb-1.5 block text-sm font-semibold text-zinc-800">
            Ngân hàng thụ hưởng
          </label>
          <select
            id="bank"
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">-- Chọn ngân hàng --</option>
            {VIETNAM_BANKS.map((bank) => (
              <option key={bank.code} value={bank.name}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>

        <FormField
          label="Số tài khoản"
          name="accountNumber"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Nhập số tài khoản ngân hàng"
        />

        <FormField
          label="Chủ tài khoản"
          name="accountHolderName"
          value={accountHolderName}
          onChange={(e) => setAccountHolderName(e.target.value)}
          placeholder="Nhập tên chủ tài khoản"
        />

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={!isValid} isLoading={isLoading}>
            Lưu thông tin
          </Button>
        </div>
      </form>
    </div>
  );
}
