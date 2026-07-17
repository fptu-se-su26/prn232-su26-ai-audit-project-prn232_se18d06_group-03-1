import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  helperText?: string;
  label: string;
  labelHidden?: boolean;
  leftIcon?: ReactNode;
};

export default function FormField({
  className = "",
  error,
  helperText,
  id,
  label,
  labelHidden = false,
  leftIcon,
  ...props
}: FormFieldProps) {
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
          aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 w-full rounded-md border bg-white px-3 text-sm text-slate-950 outline-none transition",
            leftIcon ? "pl-10" : "",
            "placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100",
            "focus:border-brand-500 focus:ring-4 focus:ring-brand-100",
            error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200",
            className,
          )}
          {...props}
        />
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
