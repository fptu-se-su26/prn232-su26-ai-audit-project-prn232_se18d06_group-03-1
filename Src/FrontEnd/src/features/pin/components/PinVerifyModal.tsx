import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/common/Button";
import type { PinDocumentType } from "@/features/pin/types";

export const PIN_DIGIT_COUNT = 6;

export interface PinVerifyModalProps {
  documentType: PinDocumentType;
  open: boolean;
  onClose: () => void;
  onVerified: (pinCode: string) => Promise<boolean>;
  onForgotPin?: () => void;
}

export default function PinVerifyModal({ documentType, open, onClose, onVerified, onForgotPin }: PinVerifyModalProps) {
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setErrorMessage(null);
      setLockMessage(null);
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pin.length !== PIN_DIGIT_COUNT) {
      setErrorMessage("Vui lòng nhập đủ 6 chữ số.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    setLockMessage(null);
    try {
      const ok = await onVerified(pin);
      if (!ok) {
        setErrorMessage("Mã PIN không chính xác.");
        setPin("");
      }
    } catch (error) {
      const message = (error as Error).message;
      if (message.toUpperCase().includes("LOCK")) {
        setLockMessage(message);
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-2 text-center text-lg font-semibold text-slate-900 dark:text-gray-100">
          Nhập mã PIN
        </h2>
        <p className="mb-4 text-center text-sm text-slate-500 dark:text-gray-400">
          Mã PIN dùng để hiển thị chi tiết giấy tờ {documentType === "CCCD" ? "Căn cước công dân" : "GPLX"}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center gap-2">
            {Array.from({ length: PIN_DIGIT_COUNT }).map((_, index) => (
              <div
                key={index}
                className={
                  "flex h-11 w-9 items-center justify-center rounded-lg border text-lg font-semibold " +
                  (index === pin.length
                    ? "border-brand-500 ring-2 ring-brand-500/30"
                    : "border-slate-300 dark:border-neutral-700")
                }
              >
                {index < pin.length ? "●" : ""}
              </div>
            ))}
          </div>

          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            autoFocus
            maxLength={PIN_DIGIT_COUNT}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, PIN_DIGIT_COUNT))}
            className="sr-only"
            aria-label="Mã PIN"
          />

          {errorMessage !== null && (
            <p className="text-center text-sm font-medium text-red-600">{errorMessage}</p>
          )}
          {lockMessage !== null && (
            <p className="text-center text-sm font-medium text-amber-600">{lockMessage}</p>
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
            <Button type="submit" isLoading={isSubmitting} disabled={pin.length !== PIN_DIGIT_COUNT}>
              Xác nhận
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
