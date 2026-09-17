import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import Button from "@/components/common/Button";
import PinDigitBoxes, { type PinDigitBoxesHandle } from "@/features/pin/components/PinDigitBoxes";
import { MAX_PIN_ATTEMPTS, PIN_DIGIT_COUNT } from "@/features/pin/hooks/usePinReveal";
import { changePin, getPinStatus } from "@/features/pin/services/pinService";
import { getFriendlyPinMessage, getPinErrorCode } from "@/features/pin/services/pinErrorMessage";
import { showToast } from "@/components/common/toastStore";

interface PinChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PIN_INVALID_CODE = "PIN_1103";

export default function PinChangeModal({ isOpen, onClose, onSuccess }: PinChangeModalProps) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentHasError, setCurrentHasError] = useState(false);
  const newPinGroupRef = useRef<PinDigitBoxesHandle | null>(null);
  const confirmPinGroupRef = useRef<PinDigitBoxesHandle | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setErrorMessage(null);
      setCurrentHasError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isSameAsCurrent =
    newPin.length === PIN_DIGIT_COUNT &&
    currentPin.length === PIN_DIGIT_COUNT &&
    newPin === currentPin;
  const hasMismatch =
    confirmPin.length > 0 &&
    newPin.length === PIN_DIGIT_COUNT &&
    confirmPin !== newPin.slice(0, confirmPin.length);
  const isFilledAll =
    currentPin.length === PIN_DIGIT_COUNT &&
    newPin.length === PIN_DIGIT_COUNT &&
    confirmPin.length === PIN_DIGIT_COUNT;
  const canSubmit = isFilledAll && !isSameAsCurrent && newPin === confirmPin;

  function handleCurrentChange(next: string) {
    setCurrentPin(next);
    if (currentHasError) {
      setCurrentHasError(false);
      setErrorMessage(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || isSubmitting) {
      if (!isFilledAll) {
        setErrorMessage("Vui lòng nhập đủ mã PIN 6 chữ số ở cả ba ô.");
      } else if (isSameAsCurrent) {
        setErrorMessage("Mã PIN mới không được trùng với mã PIN hiện tại.");
      } else if (newPin !== confirmPin) {
        setErrorMessage("Mã PIN xác nhận không trùng khớp.");
      }
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    setCurrentHasError(false);
    try {
      await changePin({ currentPinCode: currentPin, newPinCode: newPin });
      showToast({
        type: "success",
        title: "Đổi mã PIN thành công!",
        message: "Mã PIN của bạn đã được cập nhật.",
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      const code = getPinErrorCode(error);
      if (code === PIN_INVALID_CODE) {
        let remaining: number | null = null;
        try {
          const status = await getPinStatus();
          remaining =
            status.failedPinAttempts > 0
              ? Math.max(0, MAX_PIN_ATTEMPTS - status.failedPinAttempts)
              : null;
        } catch {
          remaining = null;
        }
        setCurrentHasError(true);
        setErrorMessage(
          remaining !== null && remaining > 0
            ? `Mã PIN hiện tại không chính xác. Còn ${remaining} lần thử.`
            : getFriendlyPinMessage(error),
        );
      } else {
        setErrorMessage(getFriendlyPinMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-1 flex items-center justify-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Đổi mã PIN</h2>
        </div>
        <p className="mb-4 text-center text-sm text-slate-500 dark:text-gray-400">
          Nhập mã PIN hiện tại và mã PIN mới gồm 6 chữ số.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PinDigitBoxes
            label="Mã PIN hiện tại"
            value={currentPin}
            onChange={handleCurrentChange}
            onComplete={() => newPinGroupRef.current?.focusFirst()}
            hasError={currentHasError}
            autoFocusFirst={isOpen}
            disabled={isSubmitting}
          />

          <PinDigitBoxes
            ref={newPinGroupRef}
            label="Mã PIN mới"
            value={newPin}
            onChange={setNewPin}
            onComplete={() => confirmPinGroupRef.current?.focusFirst()}
            hasError={isSameAsCurrent}
            disabled={isSubmitting}
          />

          <PinDigitBoxes
            ref={confirmPinGroupRef}
            label="Xác nhận mã PIN mới"
            value={confirmPin}
            onChange={setConfirmPin}
            hasError={hasMismatch}
            disabled={isSubmitting}
          />

          {isSameAsCurrent && (
            <p className="text-center text-sm font-medium text-red-600" role="alert">
              Mã PIN mới không được trùng với mã PIN hiện tại.
            </p>
          )}
          {hasMismatch && (
            <p className="text-center text-sm font-medium text-red-600" role="alert">
              Mã PIN xác nhận không trùng khớp.
            </p>
          )}
          {errorMessage !== null && (
            <p className="text-center text-sm font-medium text-red-600" role="alert">
              {errorMessage}
            </p>
          )}

          <p className="text-center text-xs tabular-nums text-slate-500 dark:text-gray-400">
            {currentPin.length} / {PIN_DIGIT_COUNT} hiện tại · {newPin.length} / {PIN_DIGIT_COUNT}{" "}
            mới · {confirmPin.length} / {PIN_DIGIT_COUNT} xác nhận
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!canSubmit}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
