import { CheckCircle } from "lucide-react";
import Button from "@/components/common/Button";

interface NationalIdSuccessProps {
  onNext: () => void;
}

export default function NationalIdSuccess({ onNext }: NationalIdSuccessProps) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>

      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Xác thực CCCD thành công</h1>
      <p className="mb-8 text-zinc-600">
        CCCD của bạn đã được xác thực thành công. Bạn có thể tiếp tục cập nhật thông tin ngân hàng.
      </p>

      <Button className="w-full" size="lg" onClick={onNext}>
        Tiếp tục
      </Button>
    </div>
  );
}
