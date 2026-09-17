import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "@/utils/cn";
import { PIN_DIGIT_COUNT } from "@/features/pin/hooks/usePinReveal";

export interface PinDigitBoxesHandle {
  focusFirst: () => void;
}

interface PinDigitBoxesProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  showValue?: boolean;
  hasError?: boolean;
  autoFocusFirst?: boolean;
  disabled?: boolean;
  boxClassName?: string;
}

const DEFAULT_BOX_CLASS =
  "h-12 w-10 shrink-0 rounded-lg border text-center text-lg font-semibold outline-none transition " +
  "focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/25 " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "dark:bg-neutral-950";

const PinDigitBoxes = forwardRef<PinDigitBoxesHandle, PinDigitBoxesProps>(function PinDigitBoxes(
  {
    label,
    value,
    onChange,
    onComplete,
    showValue = false,
    hasError = false,
    autoFocusFirst = false,
    disabled = false,
    boxClassName,
  },
  ref,
) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocusFirst && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocusFirst, disabled]);

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
            disabled={disabled}
            value={value[index] ?? ""}
            onChange={(event) => handleChange(index, event.target.value.replace(/\D/g, "").slice(-1))}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            className={cn(
              boxClassName ?? DEFAULT_BOX_CLASS,
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

export default PinDigitBoxes;
