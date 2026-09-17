import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Button from "@/components/common/Button";
import PinSetupModal from "@/features/pin/components/PinSetupModal";
import PinVerifyModal from "@/features/pin/components/PinVerifyModal";
import PinForgotModal from "@/features/pin/components/PinForgotModal";
import { usePinReveal } from "@/features/pin/hooks/usePinReveal";
import type { PinDocumentType, PinVehicleType } from "@/features/pin/types";

interface MaskedDocumentValueProps {
  documentType: PinDocumentType;
  value: string | null;
  vehicleType?: PinVehicleType;
  revealDisabled?: boolean;
  revealDisabledHint?: string;
}

export default function MaskedDocumentValue({
  documentType,
  value,
  vehicleType,
  revealDisabled = false,
  revealDisabledHint,
}: MaskedDocumentValueProps) {
  const [showForgot, setShowForgot] = useState(false);
  const {
    plaintext,
    isRevealed,
    secondsLeft,
    isModalOpen,
    isPinSet,
    mode,
    lockoutSeconds,
    remainingAttempts,
    openModal,
    closeModal,
    handleVerified,
    handleSetupDone,
    hide,
  } = usePinReveal(documentType, vehicleType);

  const eyeTitle = revealDisabled
    ? (revealDisabledHint ?? "Chưa có dữ liệu để hiển thị.")
    : (isPinSet ? "Hiển thị bằng mã PIN" : "Thiết lập mã PIN để hiển thị");

  return (
    <span className="inline-flex items-center gap-2">
      {isRevealed && plaintext !== null ? (
        <>
          <span className="font-mono font-semibold text-slate-900 dark:text-gray-100">{plaintext}</span>
          <span className="text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
            Đang hiển thị · {secondsLeft}s
          </span>
          <Button variant="ghost" size="sm" onClick={hide} title="Ẩn" className="h-6 w-6 p-0">
            <EyeOff className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <>
          <span className="font-mono text-slate-700 dark:text-gray-300">{value ?? "••••••"}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={openModal}
            disabled={revealDisabled}
            title={eyeTitle}
            className="h-6 w-6 p-0"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </>
      )}

      {mode === "setup" ? (
        <PinSetupModal
          documentType={documentType}
          open={isModalOpen}
          onClose={closeModal}
          onSetupDone={handleSetupDone}
        />
      ) : (
        <PinVerifyModal
          documentType={documentType}
          open={isModalOpen && !showForgot}
          onClose={closeModal}
          onVerified={handleVerified}
          onForgotPin={() => setShowForgot(true)}
          lockoutSeconds={lockoutSeconds}
          remainingAttempts={remainingAttempts}
        />
      )}

      <PinForgotModal
        open={showForgot}
        onClose={() => setShowForgot(false)}
        onResetDone={() => {
          setShowForgot(false);
          openModal();
        }}
      />
    </span>
  );
}
