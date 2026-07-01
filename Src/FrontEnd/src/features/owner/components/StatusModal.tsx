import { AlertTriangle, BadgeCheck, Landmark } from "lucide-react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import type { OwnerApplicationDto } from "@/features/owner/types";

interface StatusModalProps {
  isOpen: boolean;
  application: OwnerApplicationDto | null;
  onGoCccd: () => void;
  onGoBank: () => void;
  onClose: () => void;
}

export default function StatusModal({ isOpen, application, onGoCccd, onGoBank, onClose }: StatusModalProps) {
  if (!application) return null;

  const needCccd = !application.nationalIdVerified;
  const needBank = !application.bankInfoCompleted;

  if (!needCccd && !needBank) return null;

  let title: string;
  let message: string;
  let actions: { label: string; onClick: () => void; icon: React.ComponentType<{ className?: string }> }[] = [];

  if (needCccd && needBank) {
    title = "Hoàn tất hồ sơ chủ xe";
    message = "Bạn cần hoàn thành các bước sau để trở thành chủ xe:";
    actions = [
      { label: "Xác thực CCCD", onClick: onGoCccd, icon: BadgeCheck },
      { label: "Cập nhật ngân hàng", onClick: onGoBank, icon: Landmark },
    ];
  } else {
    if (needCccd) actions.push({ label: "Xác thực CCCD", onClick: onGoCccd, icon: BadgeCheck });
    if (needBank) actions.push({ label: "Cập nhật ngân hàng", onClick: onGoBank, icon: Landmark });
    title = needCccd ? "Cần xác thực CCCD" : "Cần cập nhật thông tin ngân hàng";
    message = needCccd
      ? "Bạn cần xác thực căn cước công dân để hoàn tất hồ sơ."
      : "Bạn cần thêm thông tin ngân hàng để nhận thanh toán.";
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <p className="text-sm text-zinc-600">{message}</p>
        <div className="mt-4 flex w-full flex-col gap-3">
          {actions.map((action) => (
            <Button key={action.label} className="w-full" size="md" onClick={action.onClick}>
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
