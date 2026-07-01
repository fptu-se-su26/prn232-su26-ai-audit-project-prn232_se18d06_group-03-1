import { PartyPopper, ArrowRight } from "lucide-react";
import Button from "@/components/common/Button";

interface OwnerSuccessProps {
  isApproved: boolean;
}

export default function OwnerSuccess({ isApproved }: OwnerSuccessProps) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <PartyPopper className="h-8 w-8 text-green-600" />
      </div>

      {isApproved ? (
        <>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">Chúc mừng bạn đã trở thành chủ xe!</h1>
          <p className="mb-8 text-zinc-600">
            Bạn đã đăng ký thành công. Hãy bắt đầu đăng tải xe cho thuê ngay!
          </p>
          <Button className="w-full" size="lg" onClick={() => (window.location.href = "/owner")}>
            <ArrowRight className="h-5 w-5" />
            Vào trang chủ xe
          </Button>
        </>
      ) : (
        <>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">Đã gửi hồ sơ thành công!</h1>
          <p className="mb-8 text-zinc-600">
            Hồ sơ của bạn đã được gửi đi. Chúng tôi sẽ xem xét và thông báo kết quả qua email trong thời gian sớm nhất.
          </p>
          <Button className="w-full" size="lg" variant="secondary" onClick={() => (window.location.href = "/customer")}>
            Quay lại trang chủ
          </Button>
        </>
      )}
    </div>
  );
}
