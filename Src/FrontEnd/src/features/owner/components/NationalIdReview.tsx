import { AlertCircle } from "lucide-react";
import Button from "@/components/common/Button";

interface NationalIdReviewProps {
  fullName: string;
  nationalIdNumber: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  onRetake: () => void;
  onAccept: () => void;
}

export default function NationalIdReview({
  fullName,
  nationalIdNumber,
  frontImageUrl,
  backImageUrl,
  onRetake,
  onAccept,
}: NationalIdReviewProps) {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Xác nhận thông tin</h1>
      <p className="mb-6 text-zinc-600">Vui lòng kiểm tra thông tin được đọc từ CCCD.</p>

      <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="mb-4 grid gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500">Họ và tên</p>
            <p className="text-base font-medium text-zinc-900">{fullName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-500">Số CCCD</p>
            <p className="text-base font-medium text-zinc-900">{nationalIdNumber}</p>
          </div>
        </div>

        <div className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Nếu thông tin không chính xác, vui lòng chụp lại ảnh CCCD.</span>
        </div>
      </div>

      {frontImageUrl ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold text-zinc-500">Mặt trước</p>
            <img src={frontImageUrl} alt="Mặt trước CCCD" className="rounded-lg border border-zinc-200" />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-zinc-500">Mặt sau</p>
            <img src={backImageUrl} alt="Mặt sau CCCD" className="rounded-lg border border-zinc-200" />
          </div>
        </div>
      ) : null}

      <div className="flex gap-3">
        <Button className="flex-1" variant="secondary" onClick={onRetake}>
          Chụp lại
        </Button>
        <Button className="flex-1" onClick={onAccept}>
          Thông tin chính xác
        </Button>
      </div>
    </div>
  );
}
