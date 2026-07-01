import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, BadgeCheck, Landmark, PartyPopper } from "lucide-react";
import { useOwnerApplication } from "@/features/owner/hooks/useOwnerApplication";
import OwnerReviewSubmit from "@/features/owner/components/OwnerReviewSubmit";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Button from "@/components/common/Button";

export default function BecomeOwnerPage() {
  const navigate = useNavigate();
  const { application, wizardStep, isLoading, error, handleSubmit } =
    useOwnerApplication(null);

  useEffect(() => {
    if (wizardStep === "already-owner") {
      navigate("/account", { replace: true });
    } else if (wizardStep === "manual-review" || wizardStep === "pending") {
      navigate("/become-owner/pending", { replace: true });
    }
  }, [wizardStep, navigate]);

  if (isLoading && !application) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (wizardStep === "owner-success") {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <PartyPopper className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">Chúc mừng bạn đã trở thành chủ xe!</h2>
          <p className="text-zinc-500">Bạn đã đăng ký thành công. Hãy bắt đầu đăng tải xe cho thuê ngay!</p>
          <Button onClick={() => navigate("/account")} className="mt-4">
            Về trang tài khoản
          </Button>
        </div>
      </div>
    );
  }

  // Show review/submit when both are done
  if (wizardStep === "review-submit" && application) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        {error && (
          <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
        )}
        <OwnerReviewSubmit
          application={application}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    );
  }

  const needCccd = !application?.nationalIdVerified;
  const needBank = !application?.bankInfoCompleted;

  let title: string;
  let message: string;
  let buttons: { label: string; to?: string; primary?: boolean }[] = [];

  if (needCccd && needBank) {
    title = "Hoàn tất hồ sơ chủ xe";
    message = "Bạn cần hoàn thành các bước sau để trở thành chủ xe:";
    buttons = [
      { label: "Xác thực CCCD", to: "/become-owner/cccd", primary: true },
      { label: "Cập nhật ngân hàng", to: "/become-owner/bank" },
    ];
  } else {
    if (needCccd) buttons.push({ label: "Xác thực CCCD", to: "/become-owner/cccd", primary: !needBank });
    if (needBank) buttons.push({ label: "Cập nhật ngân hàng", to: "/become-owner/bank", primary: !needCccd });
    title = needCccd ? "Cần xác thực CCCD" : "Cần cập nhật thông tin ngân hàng";
    message = needCccd
      ? "Bạn cần xác thực căn cước công dân để hoàn tất hồ sơ."
      : "Bạn cần thêm thông tin ngân hàng để nhận thanh toán.";
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      {error && (
        <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>

        <h2 className="mb-2 text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="mb-6 text-sm text-zinc-600">{message}</p>

        <div className="flex flex-col gap-3">
          {buttons.map((btn) => (
            <button
              key={btn.label}
              onClick={() => btn.to && navigate(btn.to)}
              className={`flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition ${
                btn.primary
                  ? "bg-purple-700 text-white shadow hover:bg-purple-800"
                  : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {btn.label === "Xác thực CCCD" ? (
                <BadgeCheck className="h-5 w-5" />
              ) : btn.label === "Cập nhật ngân hàng" ? (
                <Landmark className="h-5 w-5" />
              ) : null}
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
