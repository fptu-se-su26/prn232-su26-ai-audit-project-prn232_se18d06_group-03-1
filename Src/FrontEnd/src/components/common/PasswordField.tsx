import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  helperText?: string;
  label: string;
  labelHidden?: boolean;
  leftIcon?: ReactNode;
};

export default function PasswordField({
  className = "",
  error,
  helperText,
  id,
  label,
  labelHidden = false,
  leftIcon,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? props.name;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="grid gap-1.5">
      <label className={labelHidden ? "sr-only" : "text-sm font-semibold text-slate-800"} htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        {leftIcon ? <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-600">{leftIcon}</div> : null}
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
          aria-invalid={Boolean(error)}
          className={[
            "h-11 w-full rounded-md border bg-white px-3 pr-11 text-sm text-slate-950 outline-none transition",
            leftIcon ? "pl-10" : "",
            "placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100",
            "focus:border-brand-500 focus:ring-4 focus:ring-brand-100",
            error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200",
            className,
          ].join(" ")}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {helperText ? (
        <p id={helperId} className="text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
