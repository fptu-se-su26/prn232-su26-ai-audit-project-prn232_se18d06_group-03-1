import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import Button from "@/components/common/Button";
import PinDigitBoxes, { type PinDigitBoxesHandle } from "@/features/pin/components/PinDigitBoxes";
import { PIN_DIGIT_COUNT, type VerifyPinResult } from "@/features/pin/hooks/usePinReveal";
import { requestSetupPinOtp, setupPin } from "@/features/pin/services/pinService";
import { getFriendlyPinMessage, getPinErrorCode, isOtpErrorCode } from "@/features/pin/services/pinErrorMessage";
import { maskEmail } from "@/features/pin/utils/maskEmail";
import { getAuthUser } from "@/features/auth/hooks/useAuth";
import type { PinDocumentType } from "@/features/pin/types";

interface PinSetupModalProps {
  documentType: PinDocumentType;
  open: boolean;
  onClose: () => void;
  onSetupDone: (pinCode: string) => Promise<VerifyPinResult>;
}

type SetupStep = "pin" | "otp";

const RESEND_COUNTDOWN_SECONDS = 60;

export default function PinSetupModal({ documentType, open, onClose, onSetupDone }: PinSetupModalProps) {
  const [step, setStep] = useState<SetupStep>("pin");
  const [pinCode, setPinCode] = useState("");
  const [confirmPinCode, setConfirmPinCode] = useState("");
  const [otp, setOtp] = useState("");
  const [showValue, setShowValue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpHasError, setOtpHasError] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const confirmGroupRef = useRef<PinDigitBoxesHandle | null>(null);
  const [newGroupAutoFocus, setNewGroupAutoFocus] = useState(false);

  const email = getAuthUser()?.email ?? "";
  const documentLabel = documentType === "CCCD" ? "Căn cước công dân" : "Giấy phép lái xe";

  useEffect(() => {
    if (open) {
      setStep("pin");
      setPinCode("");
      setConfirmPinCode("");
      setOtp("");
      setShowValue(false);
      setErrorMessage(null);
      setOtpHasError(false);
      setInfoMessage(null);
      setResendSeconds(0);
      setNewGroupAutoFocus(true);
    }
  }, [open]);

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

  useEffect(() => {
    if (step !== "otp" || resendSeconds <= 0) {
      return;
    }
    const id = window.setTimeout(() => {
      setResendSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [step, resendSeconds]);

  if (!open) {
    return null;
  }

  const isPinFilled = pinCode.length === PIN_DIGIT_COUNT && confirmPinCode.length === PIN_DIGIT_COUNT;
  const hasMismatch =
    confirmPinCode.length > 0 &&
    pinCode.length === PIN_DIGIT_COUNT &&
    confirmPinCode !== pinCode.slice(0, confirmPinCode.length);

  function handleNewComplete() {
    confirmGroupRef.current?.focusFirst();
  }

  function handlePinChange(next: string) {
    setPinCode(next);
    if (errorMessage !== null && step === "pin") {
      setErrorMessage(null);
    }
  }

  function handleOtpChange(next: string) {
    setOtp(next);
    if (otpHasError) {
      setOtpHasError(false);
      setErrorMessage(null);
    }
  }

  async function handleContinue(event: React.FormEvent) {
    event.preventDefault();
    if (!isPinFilled || isSubmitting) {
      if (!isPinFilled) {
        setErrorMessage("Vui lòng nhập đủ mã PIN 6 chữ số ở cả hai ô.");
      }
      return;
    }
    if (pinCode !== confirmPinCode) {
      setErrorMessage("Mã PIN xác nhận không trùng khớp.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await requestSetupPinOtp();
      setStep("otp");
      setResendSeconds(RESEND_COUNTDOWN_SECONDS);
    } catch (error) {
      setErrorMessage(getFriendlyPinMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (isResending || resendSeconds > 0) {
      return;
    }
    setIsResending(true);
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      await requestSetupPinOtp();
      setResendSeconds(RESEND_COUNTDOWN_SECONDS);
      setInfoMessage("Đã gửi lại mã OTP. Mã có hiệu lực trong 10 phút.");
    } catch (error) {
      setErrorMessage(getFriendlyPinMessage(error));
    } finally {
      setIsResending(false);
    }
  }

  async function handleConfirm(event: React.FormEvent) {
    event.preventDefault();
    if (otp.length !== PIN_DIGIT_COUNT || isSubmitting) {
      if (otp.length !== PIN_DIGIT_COUNT) {
        setErrorMessage("Vui lòng nhập mã OTP 6 chữ số.");
      }
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    setOtpHasError(false);
    try {
      await setupPin({ pinCode, otp });
      await onSetupDone(pinCode);
    } catch (error) {
      setErrorMessage(getFriendlyPinMessage(error));
      if (isOtpErrorCode(getPinErrorCode(error))) {
        setOtpHasError(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Thiết lập mã PIN</h2>
          </div>
          {step === "pin" && (
            <button
              type="button"
              onClick={() => setShowValue((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800"
              aria-label={showValue ? "Ẩn mã PIN" : "Hiển thị mã PIN"}
              title={showValue ? "Ẩn mã PIN" : "Hiển thị mã PIN"}
            >
              {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>

        {step === "pin" && (
          <>
            <p className="mb-4 text-sm text-slate-500 dark:text-gray-400">
              Tạo mã PIN 6 chữ số để hiển thị chi tiết giấy tờ {documentLabel}.
            </p>

            <form onSubmit={handleContinue} className="space-y-5">
              <PinDigitBoxes
                label="Mã PIN mới"
                value={pinCode}
                onChange={handlePinChange}
                onComplete={handleNewComplete}
                showValue={showValue}
                autoFocusFirst={open && newGroupAutoFocus}
                disabled={isSubmitting}
              />

              <PinDigitBoxes
                ref={confirmGroupRef}
                label="Xác nhận mã PIN"
                value={confirmPinCode}
                onChange={setConfirmPinCode}
                showValue={showValue}
                hasError={hasMismatch}
                disabled={isSubmitting}
              />

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

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!isPinFilled}>
                  Tiếp tục
                </Button>
              </div>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <p className="mb-4 text-center text-sm text-slate-500 dark:text-gray-400">
              Mã OTP đã được gửi về email {maskEmail(email)}.
            </p>

            <form onSubmit={handleConfirm} className="space-y-4">
              <PinDigitBoxes
                label="Mã OTP"
                value={otp}
                onChange={handleOtpChange}
                hasError={otpHasError}
                autoFocusFirst={open}
                disabled={isSubmitting}
              />
              <p className="-mt-2 text-center text-xs text-slate-500 dark:text-gray-400">
                Mã OTP có hiệu lực trong 10 phút.{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || isSubmitting || resendSeconds > 0}
                  className="font-medium text-brand-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-brand-400"
                >
                  {isResending
                    ? "Đang gửi..."
                    : resendSeconds > 0
                      ? `Gửi lại mã (${resendSeconds}s)`
                      : "Gửi lại mã"}
                </button>
              </p>

              {infoMessage !== null && (
                <p className="text-center text-sm text-slate-600 dark:text-gray-300">{infoMessage}</p>
              )}
              {errorMessage !== null && (
                <p className="text-center text-sm font-medium text-red-600" role="alert">
                  {errorMessage}
                </p>
              )}

              <p className="text-center text-xs tabular-nums text-slate-500 dark:text-gray-400">
                {otp.length} / {PIN_DIGIT_COUNT}
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={otp.length !== PIN_DIGIT_COUNT}
                >
                  Xác nhận &amp; Tạo PIN
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
