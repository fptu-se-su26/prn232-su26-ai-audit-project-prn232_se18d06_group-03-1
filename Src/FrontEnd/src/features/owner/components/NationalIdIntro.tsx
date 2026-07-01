import { Shield, Camera, CheckCircle } from "lucide-react";
import Button from "@/components/common/Button";

interface NationalIdIntroProps {
  onNext: () => void;
}

export default function NationalIdIntro({ onNext }: NationalIdIntroProps) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
        <Shield className="h-8 w-8 text-brand-700" />
      </div>

      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Xác thực CCCD</h1>
      <p className="mb-8 text-zinc-600">
        Để trở thành chủ xe, bạn cần xác thực căn cước công dân (CCCD) của mình. Quá trình này chỉ mất vài phút.
      </p>

      <div className="mb-8 space-y-4 text-left">
        <div className="flex items-start gap-3">
          <Camera className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="font-medium text-zinc-800">Chụp ảnh CCCD</p>
            <p className="text-sm text-zinc-500">Chụp rõ mặt trước và mặt sau của CCCD.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="font-medium text-zinc-800">Xác thực tự động</p>
            <p className="text-sm text-zinc-500">Hệ thống sẽ tự động đọc thông tin từ ảnh CCCD.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="font-medium text-zinc-800">Bảo mật thông tin</p>
            <p className="text-sm text-zinc-500">Thông tin của bạn được bảo vệ an toàn tuyệt đối.</p>
          </div>
        </div>
      </div>

      <Button className="w-full" size="lg" onClick={onNext}>
        Bắt đầu xác thực
      </Button>
    </div>
  );
}
