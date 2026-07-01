import { BadgeCheck, Landmark, AlertCircle, User, CreditCard } from "lucide-react";
import Button from "@/components/common/Button";
import type { OwnerApplicationDto } from "@/features/owner/types";

interface OwnerReviewSubmitProps {
  application: OwnerApplicationDto;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
}

export default function OwnerReviewSubmit({ application, onSubmit, isLoading }: OwnerReviewSubmitProps) {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Xem lại thông tin</h1>
      <p className="mb-6 text-zinc-600">Vui lòng kiểm tra lại thông tin trước khi gửi hồ sơ.</p>

      <div className="mb-6 space-y-4">
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="mb-3 flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-zinc-800">CCCD đã xác thực</span>
          </div>
          {application.nationalIdVerified && (
            <div className="ml-7 grid gap-1 text-sm text-zinc-600">
              <p>Họ và tên: {application.fullName}</p>
              <p>Số CCCD: {application.nationalIdNumber}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Landmark className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-zinc-800">Thông tin ngân hàng</span>
          </div>
          {application.bankInfoCompleted && (
            <div className="ml-7 space-y-2 text-sm text-zinc-600">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 shrink-0 text-zinc-400" />
                <span><span className="font-medium text-zinc-700">Ngân hàng:</span> {application.bankName}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 shrink-0 text-zinc-400" />
                <span><span className="font-medium text-zinc-700">Số tài khoản:</span> {application.bankAccountNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-zinc-400" />
                <span><span className="font-medium text-zinc-700">Chủ tài khoản:</span> {application.bankAccountHolderName}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Sau khi gửi, hồ sơ của bạn sẽ được xem xét. Chúng tôi sẽ thông báo kết quả qua email.</span>
        </div>
      </div>

      <Button className="w-full" size="lg" isLoading={isLoading} onClick={onSubmit}>
        Gửi hồ sơ
      </Button>
    </div>
  );
}
