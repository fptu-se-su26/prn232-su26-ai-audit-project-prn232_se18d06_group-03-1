import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import Button from "@/components/common/Button";
import PinDigitBoxes, { type PinDigitBoxesHandle } from "@/features/pin/components/PinDigitBoxes";
import { PIN_DIGIT_COUNT } from "@/features/pin/hooks/usePinReveal";
import { requestPinForgotOtp, resetPinForgot } from "@/features/pin/services/pinService";
import { getFriendlyPinMessage, getPinErrorCode, isOtpErrorCode } from "@/features/pin/services/pinErrorMessage";
import { maskEmail } from "@/features/pin/utils/maskEmail";
import { getAuthUser } from "@/features/auth/hooks/useAuth";

interface PinForgotModalProps {
  open: boolean;
  onClose: () => void;
  onResetDone: () => void;
}

type Step = "request-otp" | "enter-otp";

export default function PinForgotModal({ open, onClose, onResetDone }: PinForgotModalProps) {
  const [step, setStep] = useState<Step>("request-otp");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpHasError, setOtpHasError] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const newPinGroupRef = useRef<PinDigitBoxesHandle | null>(null);
  const confirmPinGroupRef = useRef<PinDigitBoxesHandle | null>(null);

  const email = getAuthUser()?.email ?? "";

  useEffect(() => {
    if (open) {
      setStep("request-otp");
      setOtp("");
      setNewPin("");
      setConfirmPin("");
      setErrorMessage(null);
      setOtpHasError(false);
      setInfoMessage(null);
      setSuccessMessage(null);
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

  if (!open) {
    return null;
  }

  const isResetFilled =
    otp.length === PIN_DIGIT_COUNT &&
    newPin.length === PIN_DIGIT_COUNT &&
    confirmPin.length === PIN_DIGIT_COUNT;

  async function handleRequestOtp() {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await requestPinForgotOtp({ email });
      setStep("enter-otp");
    } catch (error) {
      setErrorMessage(getFriendlyPinMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (isResending) {
      return;
    }
    setIsResending(true);
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      await requestPinForgotOtp({ email });
      setInfoMessage("Đã gửi lại mã OTP. Mã có hiệu lực trong 10 phút.");
    } catch (error) {
      setErrorMessage(getFriendlyPinMessage(error));
    } finally {
      setIsResending(false);
    }
  }

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    if (!isResetFilled || isSubmitting) {
      if (!isResetFilled) {
        if (otp.length !== PIN_DIGIT_COUNT) {
          setErrorMessage("Vui lòng nhập mã OTP 6 chữ số.");
          return;
        }
        setErrorMessage("Vui lòng nhập và xác nhận mã PIN mới 6 chữ số.");
      }
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMessage("Mã PIN xác nhận không khớp.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    setOtpHasError(false);
    try {
      await resetPinForgot({ email, otpCode: otp, newPinCode: newPin });
      setSuccessMessage("Đặt lại mã PIN thành công!");
      setTimeout(() => onResetDone(), 1200);
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
        <div className="mb-1 flex items-center justify-center gap-2">
          <KeyRound className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Quên mã PIN</h2>
        </div>
        <p className="mb-4 text-center text-sm text-slate-500 dark:text-gray-400">
          {step === "request-otp"
            ? "Mã OTP sẽ được gửi đến email của tài khoản của bạn."
            : "Nhập mã OTP và mã PIN mới bên dưới."}
        </p>

        {step === "request-otp" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-center text-sm text-slate-700 dark:bg-neutral-800 dark:text-gray-300">
              {maskEmail(email)}
            </div>

            {errorMessage !== null && (
              <p className="text-center text-sm font-medium text-red-600" role="alert">
                {errorMessage}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Hủy
              </Button>
              <Button type="button" isLoading={isSubmitting} onClick={handleRequestOtp}>
                Gửi mã OTP
              </Button>
            </div>
          </div>
        )}

        {step === "enter-otp" && (
          <form onSubmit={handleReset} className="space-y-4">
            <PinDigitBoxes
              label="Mã OTP"
              value={otp}
              onChange={setOtp}
              onComplete={() => newPinGroupRef.current?.focusFirst()}
              hasError={otpHasError}
              autoFocusFirst={open}
              disabled={isSubmitting}
            />
            <p className="-mt-2 text-center text-xs text-slate-500 dark:text-gray-400">
              Mã OTP có hiệu lực trong 10 phút.{" "}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending || isSubmitting}
                className="font-medium text-brand-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-brand-400"
              >
                {isResending ? "Đang gửi..." : "Gửi lại mã"}
              </button>
            </p>

            <PinDigitBoxes
              ref={newPinGroupRef}
              label="Mã PIN mới"
              value={newPin}
              onChange={setNewPin}
              onComplete={() => confirmPinGroupRef.current?.focusFirst()}
              disabled={isSubmitting}
            />

            <PinDigitBoxes
              ref={confirmPinGroupRef}
              label="Xác nhận mã PIN"
              value={confirmPin}
              onChange={setConfirmPin}
              hasError={newPin.length === PIN_DIGIT_COUNT && confirmPin.length > 0 && newPin !== confirmPin}
              disabled={isSubmitting}
            />

            {newPin.length === PIN_DIGIT_COUNT &&
              confirmPin.length > 0 &&
              newPin !== confirmPin && (
                <p className="text-center text-sm font-medium text-red-600" role="alert">
                  Mã PIN xác nhận không khớp.
                </p>
              )}
            {infoMessage !== null && (
              <p className="text-center text-sm text-slate-600 dark:text-gray-300">{infoMessage}</p>
            )}
            {errorMessage !== null && (
              <p className="text-center text-sm font-medium text-red-600" role="alert">
                {errorMessage}
              </p>
            )}
            {successMessage !== null && (
              <p className="text-center text-sm font-medium text-green-600" role="status">
                {successMessage}
              </p>
            )}

            <p className="text-center text-xs tabular-nums text-slate-500 dark:text-gray-400">
              {otp.length} / {PIN_DIGIT_COUNT} OTP · {newPin.length} / {PIN_DIGIT_COUNT} PIN mới ·{" "}
              {confirmPin.length} / {PIN_DIGIT_COUNT} xác nhận
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" isLoading={isSubmitting} disabled={!isResetFilled}>
                Đặt lại mã PIN
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
