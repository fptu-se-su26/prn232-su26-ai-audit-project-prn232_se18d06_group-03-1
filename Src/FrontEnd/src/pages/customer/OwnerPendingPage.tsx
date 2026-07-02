import { Clock, ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import { useOwnerApplication } from "@/features/owner/hooks/useOwnerApplication";

export default function OwnerPendingPage() {
  const navigate = useNavigate();
  const { application, isLoading, error } = useOwnerApplication(null);

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-700 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Có lỗi xảy ra</h2>
          <p className="text-zinc-500">{error}</p>
          <Button variant="secondary" onClick={() => navigate("/account")}>
            Về trang tài khoản
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Hồ sơ đang chờ xét duyệt</h1>
          <p className="max-w-sm text-zinc-500">
            Thông tin của bạn đang được đội ngũ MoveVN xem xét. Quá trình này thường mất 1-2 ngày làm việc.
            Chúng tôi sẽ thông báo kết quả qua email khi có kết quả.
          </p>
          {application?.rejectReason && (
            <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
              <p className="text-sm font-semibold text-amber-800">Yêu cầu bổ sung thông tin</p>
              <p className="mt-1 text-sm text-amber-700">{application.rejectReason}</p>
            </div>
          )}
          <Button onClick={() => navigate("/account")} className="mt-4">
            Về trang tài khoản
          </Button>
        </div>
      )}
    </div>
  );
}