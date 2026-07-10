import { ArrowLeft, BadgeCheck, Landmark, AlertCircle, User, CreditCard, Mail, FileBadge } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import type { OwnerApplicationDto } from "@/features/owner/types";

interface OwnerReviewSubmitProps {
  application: OwnerApplicationDto;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
}

function StatusBadge({ verified }: { verified: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      verified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
    }`}>
      <BadgeCheck className="h-3 w-3" />
      {verified ? "Đã xác minh" : "Chưa xác minh"}
    </span>
  );
}

export default function OwnerReviewSubmit({ application, onSubmit, isLoading }: OwnerReviewSubmitProps) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-lg">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>

      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Xem lại thông tin</h1>
      <p className="mb-6 text-zinc-600">Vui lòng kiểm tra lại thông tin trước khi gửi hồ sơ.</p>

      <div className="mb-6 space-y-4">
        {/* Email */}
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <span className="font-semibold text-zinc-800">Email</span>
            </div>
            <StatusBadge verified={application.emailVerified ?? false} />
          </div>
          {application.email && (
            <p className="ml-7 mt-2 text-sm text-zinc-600">{application.email}</p>
          )}
        </div>

        {/* CCCD */}
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-zinc-800">CCCD</span>
            </div>
            <StatusBadge verified={application.nationalIdVerified} />
          </div>
          {application.nationalIdVerified && (
            <div className="ml-7 mt-2 grid gap-1 text-sm text-zinc-600">
              <p>Họ và tên: {application.fullName}</p>
              <p>Số CCCD: {application.nationalIdNumber}</p>
            </div>
          )}
        </div>

        {/* GPLX */}
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileBadge className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-zinc-800">GPLX</span>
            </div>
            <StatusBadge verified={application.driverLicenseVerified ?? false} />
          </div>
        </div>

        {/* Ngân hàng */}
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-zinc-800">Ngân hàng</span>
            </div>
            <StatusBadge verified={application.bankInfoCompleted} />
          </div>
          {application.bankInfoCompleted && (
            <div className="ml-7 mt-2 space-y-2 text-sm text-zinc-600">
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
