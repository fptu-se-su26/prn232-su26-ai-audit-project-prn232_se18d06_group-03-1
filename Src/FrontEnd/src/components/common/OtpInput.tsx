import { useRef } from "react";

type OtpInputProps = {
  disabled?: boolean;
  error?: string;
  id?: string;
  label?: string;
  length?: number;
  onChange: (value: string) => void;
  value: string;
};

export default function OtpInput({
  disabled = false,
  error,
  id = "otp",
  label = "Mã OTP",
  length = 6,
  onChange,
  value,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  function commit(nextDigits: string[], focusIndex?: number) {
    onChange(nextDigits.join("").slice(0, length));
    if (typeof focusIndex === "number") {
      window.requestAnimationFrame(() => refs.current[focusIndex]?.focus());
    }
  }

  return (
    <fieldset className="grid gap-2" disabled={disabled}>
      <legend className="text-sm font-semibold text-slate-800">{label}</legend>
      <div className="flex gap-2" id={id}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            aria-label={`Ký tự OTP ${index + 1}`}
            aria-invalid={Boolean(error)}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            className={[
              "h-12 w-11 rounded-md border bg-white text-center text-lg font-semibold text-slate-950 outline-none transition",
              "focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100",
              error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200",
            ].join(" ")}
            inputMode="numeric"
            maxLength={1}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/\D/g, "");
              const nextDigits = [...digits];
              nextDigits[index] = nextValue.slice(-1);
              commit(nextDigits, nextValue && index < length - 1 ? index + 1 : index);
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digits[index] && index > 0) {
                refs.current[index - 1]?.focus();
              }
            }}
            onPaste={(event) => {
              event.preventDefault();
              const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
              if (!pasted) {
                return;
              }
              const nextDigits = Array.from({ length }, (_, pasteIndex) => pasted[pasteIndex] ?? "");
              commit(nextDigits, Math.min(pasted.length, length) - 1);
            }}
            value={digit}
          />
        ))}
      </div>
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </fieldset>
  );
}
