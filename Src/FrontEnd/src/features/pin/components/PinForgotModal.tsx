import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/common/Button";
import { PIN_DIGIT_COUNT } from "@/features/pin/hooks/usePinReveal";
import { requestPinForgotOtp, resetPinForgot } from "@/features/pin/services/pinService";
import { getAuthUser } from "@/features/auth/hooks/useAuth";

interface PinForgotModalProps {
  open: boolean;
  onClose: () => void;
  onResetDone: () => void;
}

type Step = "request-otp" | "enter-otp";

function DigitInput({
  value,
  onChange,
  label,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      <p className="mb-2 text-center text-sm font-medium text-slate-700 dark:text-gray-300">{label}</p>
      <div
        className="flex cursor-pointer justify-center gap-2"
        onClick={() => inputRef.current?.focus()}
      >
        {Array.from({ length: PIN_DIGIT_COUNT }).map((_, index) => (
          <div
            key={index}
            className={
              "flex h-11 w-9 items-center justify-center rounded-lg border text-lg font-semibold " +
              (index === value.length
                ? "border-brand-500 ring-2 ring-brand-500/30"
                : "border-slate-300 dark:border-neutral-700")
            }
          >
            {index < value.length ? "\u25cf" : ""}
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        autoFocus={autoFocus}
        maxLength={PIN_DIGIT_COUNT}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, PIN_DIGIT_COUNT))}
        className="sr-only"
        aria-label={label}
      />
    </div>
  );
}

export default function PinForgotModal({ open, onClose, onResetDone }: PinForgotModalProps) {
  const [step, setStep] = useState<Step>("request-otp");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const email = getAuthUser()?.email ?? "";

  useEffect(() => {
    if (open) {
      setStep("request-otp");
      setOtp("");
      setNewPin("");
      setConfirmPin("");
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleRequestOtp() {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await requestPinForgotOtp({ email });
      setStep("enter-otp");
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    if (otp.length !== PIN_DIGIT_COUNT) {
      setErrorMessage("Vui lòng nhập mã OTP 6 chữ số.");
      return;
    }
    if (newPin.length !== PIN_DIGIT_COUNT || confirmPin.length !== PIN_DIGIT_COUNT) {
      setErrorMessage("Vui lòng nhập và xác nhận mã PIN mới 6 chữ số.");
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMessage("Mã PIN xác nhận không khớp.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await resetPinForgot({ email, otpCode: otp, newPinCode: newPin });
      setSuccessMessage("Đặt lại mã PIN thành công!");
      setTimeout(() => onResetDone(), 1200);
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 text-center text-lg font-semibold text-slate-900 dark:text-gray-100">
          Quên mã PIN
        </h2>
        <p className="mb-4 text-center text-sm text-slate-500 dark:text-gray-400">
          {step === "request-otp"
            ? "Mã OTP sẽ được gửi đến email của bạn để đặt lại mã PIN."
            : "Nhập mã OTP và mã PIN mới bên dưới."}
        </p>

        {step === "request-otp" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-center text-sm text-slate-700 dark:bg-neutral-800 dark:text-gray-300">
              {email}
            </div>

            {errorMessage !== null && (
              <p className="text-center text-sm font-medium text-red-600">{errorMessage}</p>
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
            <DigitInput value={otp} onChange={setOtp} label="Mã OTP" autoFocus />

            <DigitInput value={newPin} onChange={setNewPin} label="Mã PIN mới" />

            <DigitInput value={confirmPin} onChange={setConfirmPin} label="Xác nhận mã PIN" />

            {errorMessage !== null && (
              <p className="text-center text-sm font-medium text-red-600">{errorMessage}</p>
            )}
            {successMessage !== null && (
              <p className="text-center text-sm font-medium text-green-600">{successMessage}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Hủy
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={otp.length !== PIN_DIGIT_COUNT || newPin.length !== PIN_DIGIT_COUNT || confirmPin.length !== PIN_DIGIT_COUNT}
              >
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
