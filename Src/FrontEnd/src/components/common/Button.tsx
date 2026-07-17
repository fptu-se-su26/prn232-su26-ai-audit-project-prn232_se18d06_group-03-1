import type { ButtonHTMLAttributes, ReactNode } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  isLoading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-500 text-white shadow-lg shadow-brand-600/20 hover:from-brand-700 hover:via-brand-600 hover:to-fuchsia-600 disabled:border-slate-200 disabled:bg-none disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none",
  secondary: "border border-slate-200 bg-white text-slate-800 shadow-sm shadow-slate-950/5 hover:border-slate-300 hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400",
  ghost: "border border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950 disabled:text-slate-400",
  danger: "border border-rose-600 bg-rose-600 text-white shadow-sm shadow-rose-900/10 hover:border-rose-700 hover:bg-rose-700 disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export default function Button({
  children,
  className = "",
  disabled,
  isLoading = false,
  size = "md",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
        "disabled:cursor-not-allowed",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <LoadingSpinner className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}
