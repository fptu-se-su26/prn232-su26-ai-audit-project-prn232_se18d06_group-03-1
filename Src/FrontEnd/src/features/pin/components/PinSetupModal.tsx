import { createPortal } from "react-dom";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Button from "@/components/common/Button";
import { cn } from "@/utils/cn";
import { PIN_DIGIT_COUNT } from "@/features/pin/hooks/usePinReveal";
import { setupPin } from "@/features/pin/services/pinService";
import type { PinDocumentType } from "@/features/pin/types";

const PIN_BOX_CLASS =
  "h-12 w-10 shrink-0 rounded-lg border text-center text-lg font-semibold outline-none transition " +
  "focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/25 " +
  "dark:bg-neutral-950";

interface PinSetupModalProps {
  documentType: PinDocumentType;
  open: boolean;
  onClose: () => void;
  onSetupDone: () => void;
}

interface PinDigitGroupHandle {
  focusFirst: () => void;
}

interface PinDigitGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  showValue: boolean;
  hasError?: boolean;
  autoFocusFirst?: boolean;
}

const PinDigitGroup = forwardRef<PinDigitGroupHandle, PinDigitGroupProps>(function PinDigitGroup(
  { label, value, onChange, onComplete, showValue, hasError, autoFocusFirst },
  ref,
) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocusFirst) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocusFirst]);

  useImperativeHandle(ref, () => ({
    focusFirst: () => inputRefs.current[0]?.focus(),
  }));

  function placeDigit(index: number, digit: string) {
    const chars = value.split("");
    chars[index] = digit;
    const next = chars.join("");
    onChange(next);
    if (next.length === PIN_DIGIT_COUNT) {
      onComplete?.();
    }
  }

  function handleChange(index: number, digit: string) {
    if (digit.length === 0) {
      return;
    }
    placeDigit(index, digit);
    const nextFocus = index + 1;
    if (nextFocus < PIN_DIGIT_COUNT) {
      inputRefs.current[nextFocus]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      const chars = value.split("");
      chars[index] = "";
      onChange(chars.join(""));
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_DIGIT_COUNT);
    if (pasted.length > 0) {
      onChange(pasted);
      if (pasted.length === PIN_DIGIT_COUNT) {
        onComplete?.();
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">{label}</p>
      <div className="flex justify-center gap-2">
        {Array.from({ length: PIN_DIGIT_COUNT }).map((_, index) => (
          <input
            key={index}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            type={showValue ? "text" : "password"}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={value[index] ?? ""}
            onChange={(event) => handleChange(index, event.target.value.replace(/\D/g, "").slice(-1))}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            className={cn(
              PIN_BOX_CLASS,
              hasError
                ? "border-red-500 bg-red-50 ring-2 ring-red-500/20 dark:bg-red-950/20"
                : "border-slate-300 dark:border-neutral-700",
            )}
            aria-label={`${label} ô ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
});

export default function PinSetupModal({ documentType, open, onClose, onSetupDone }: PinSetupModalProps) {
  const [pinCode, setPinCode] = useState("");
  const [confirmPinCode, setConfirmPinCode] = useState("");
  const [showValue, setShowValue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const confirmGroupRef = useRef<PinDigitGroupHandle | null>(null);
  const [newGroupAutoFocus, setNewGroupAutoFocus] = useState(false);

  useEffect(() => {
    if (open) {
      setPinCode("");
      setConfirmPinCode("");
      setShowValue(false);
      setErrorMessage(null);
      setNewGroupAutoFocus(true);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const isFilled = pinCode.length === PIN_DIGIT_COUNT && confirmPinCode.length === PIN_DIGIT_COUNT;
  const hasMismatch =
    confirmPinCode.length > 0 &&
    pinCode.length === PIN_DIGIT_COUNT &&
    confirmPinCode !== pinCode.slice(0, confirmPinCode.length);

  function handleNewComplete() {
    confirmGroupRef.current?.focusFirst();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isFilled) {
      setErrorMessage("Vui lòng nhập đủ mã PIN 6 chữ số ở cả hai ô.");
      return;
    }
    if (pinCode !== confirmPinCode) {
      setErrorMessage("Mã PIN xác nhận không trùng khớp.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await setupPin({ pinCode, confirmPinCode });
      onSetupDone();
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Thiết lập mã PIN</h2>
          <button
            type="button"
            onClick={() => setShowValue((prev) => !prev)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800"
            aria-label={showValue ? "Ẩn mã PIN" : "Hiển thị mã PIN"}
          >
            {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500 dark:text-gray-400">
          Tạo mã PIN 6 chữ số để hiển thị chi tiết giấy tờ{" "}
          {documentType === "CCCD" ? "Căn cước công dân" : "Giấy phép lái xe"}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PinDigitGroup
            label="Mã PIN mới"
            value={pinCode}
            onChange={setPinCode}
            onComplete={handleNewComplete}
            showValue={showValue}
            autoFocusFirst={open && newGroupAutoFocus}
          />

          <PinDigitGroup
            ref={confirmGroupRef}
            label="Xác nhận mã PIN"
            value={confirmPinCode}
            onChange={setConfirmPinCode}
            showValue={showValue}
            hasError={hasMismatch}
          />

          {hasMismatch && (
            <p className="text-center text-sm font-medium text-red-600">
              Mã PIN xác nhận không trùng khớp.
            </p>
          )}
          {errorMessage !== null && (
            <p className="text-center text-sm font-medium text-red-600">{errorMessage}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!isFilled}
              className="bg-brand-600 font-medium text-white shadow-sm hover:bg-brand-700"
            >
              Tạo mã PIN
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}