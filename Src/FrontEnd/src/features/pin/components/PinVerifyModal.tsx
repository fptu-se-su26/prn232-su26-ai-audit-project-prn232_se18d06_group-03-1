import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import Button from "@/components/common/Button";
import PinDigitBoxes from "@/features/pin/components/PinDigitBoxes";
import {
  PIN_DIGIT_COUNT,
  PIN_LOCKED_CODE,
  type VerifyPinResult,
} from "@/features/pin/hooks/usePinReveal";
import type { PinDocumentType } from "@/features/pin/types";
import { getFriendlyPinMessage } from "@/features/pin/services/pinErrorMessage";

export interface PinVerifyModalProps {
  documentType: PinDocumentType;
  open: boolean;
  onClose: () => void;
  onVerified: (pinCode: string) => Promise<VerifyPinResult>;
  onForgotPin?: () => void;
  lockoutSeconds: number | null;
  remainingAttempts: number | null;
}

function formatCountdown(totalSeconds: number): string {
  const normalized = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(normalized / 60);
  const seconds = normalized % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function PinVerifyModal({
  documentType,
  open,
  onClose,
  onVerified,
  onForgotPin,
  lockoutSeconds,
  remainingAttempts,
}: PinVerifyModalProps) {
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const isLocked = lockoutSeconds !== null;
  const documentLabel = documentType === "CCCD" ? "Căn cước công dân" : "Giấy phép lái xe";
  const wasOpenRef = useRef(open);
  const wasLockedRef = useRef(isLocked);

  // Reset only on closed -> open transition. Must NOT depend on
  // remainingAttempts: the hook updates it after every failed verify and
  // re-running a reset here would wipe the error message just displayed.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setPin("");
      setErrorMessage(null);
      setAttemptsLeft(remainingAttempts);
    }
    wasOpenRef.current = open;
  }, [open, remainingAttempts]);

  // Clear stale input/error whenever the view switches locked <-> verify.
  useEffect(() => {
    if (wasLockedRef.current !== isLocked) {
      setPin("");
      setErrorMessage(null);
      setAttemptsLeft(null);
    }
    wasLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function handlePinChange(next: string) {
    setPin(next);
    if (errorMessage !== null) {
      setErrorMessage(null);
      setAttemptsLeft(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pin.length !== PIN_DIGIT_COUNT || isSubmitting || isLocked) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await onVerified(pin);
      if (result.ok) {
        setPin("");
        return;
      }
      setPin("");
      if (result.code === PIN_LOCKED_CODE) {
        return;
      }
      const remaining = result.remainingAttempts ?? remainingAttempts;
      setAttemptsLeft(remaining);
      setErrorMessage(
        remaining !== null && remaining > 0
          ? `${result.message ?? "Mã PIN không chính xác."} Còn ${remaining} lần thử.`
          : (result.message ?? "Mã PIN không chính xác."),
      );
    } catch (error) {
      setErrorMessage(getFriendlyPinMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        {isLocked ? (
          <div className="text-center">
            <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <Lock className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
              PIN đã bị khóa
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
              Bạn đã nhập sai PIN quá nhiều lần.
            </p>
            <p className="mt-4 text-sm font-medium text-slate-700 dark:text-gray-300">Thử lại sau</p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-gray-100">
              {formatCountdown(lockoutSeconds ?? 0)}
            </p>
            <div className="mt-6 flex justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Nhập mã PIN</h2>
            </div>
            <p className="mb-4 text-center text-sm text-slate-500 dark:text-gray-400">
              Mã PIN dùng để hiển thị chi tiết giấy tờ {documentLabel} của bạn.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <PinDigitBoxes
                label="Mã PIN"
                value={pin}
                onChange={handlePinChange}
                hasError={errorMessage !== null}
                autoFocusFirst={open}
                disabled={isSubmitting}
                boxClassName="h-11 w-9 shrink-0 rounded-lg border text-center text-lg font-semibold outline-none transition focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-950"
              />

              <p className="text-center text-xs tabular-nums text-slate-500 dark:text-gray-400">
                {pin.length} / {PIN_DIGIT_COUNT}
              </p>

              {errorMessage !== null && (
                <p className="text-center text-sm font-medium text-red-600" role="alert">
                  {errorMessage}
                </p>
              )}

              {attemptsLeft !== null && attemptsLeft > 0 && errorMessage === null && (
                <p className="text-center text-xs text-slate-500 dark:text-gray-400">
                  Còn {attemptsLeft} lần thử.
                </p>
              )}

              {onForgotPin !== undefined && (
                <p className="text-center">
                  <button
                    type="button"
                    onClick={onForgotPin}
                    className="text-sm text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Quên mã PIN?
                  </button>
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={pin.length !== PIN_DIGIT_COUNT}
                >
                  Xác nhận
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
