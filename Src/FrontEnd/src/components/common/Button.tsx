import type { ButtonHTMLAttributes, ReactNode } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "destructive" | "success" | "warning" | "link";
type ButtonSize = "sm" | "md" | "lg" | "xl" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  isLoading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-500 text-white shadow-lg shadow-brand-600/20 hover:from-brand-700 hover:via-brand-600 hover:to-fuchsia-600 disabled:border-slate-200 disabled:bg-none disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none",
  secondary: "border border-slate-200 bg-white text-slate-800 shadow-sm shadow-slate-950/5 hover:border-slate-300 hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 dark:border-ui-border dark:bg-surface-elevated dark:text-gray-100 dark:hover:border-brand-700 dark:hover:bg-app-dark-hover dark:disabled:border-neutral-800 dark:disabled:bg-neutral-900 dark:disabled:text-gray-500",
  outline: "border border-ui-border bg-transparent text-text-secondary hover:border-ui-border-strong hover:bg-surface-hover hover:text-text-primary",
  ghost: "border border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950 disabled:text-slate-400 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white dark:disabled:text-gray-600",
  danger: "border border-rose-600 bg-rose-600 text-white shadow-sm shadow-rose-900/10 hover:border-rose-700 hover:bg-rose-700 disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500",
  destructive: "border border-danger bg-danger text-white shadow-sm hover:brightness-95 disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500",
  success: "border border-success bg-success text-white shadow-sm hover:brightness-95 disabled:opacity-50",
  warning: "border border-warning bg-warning text-white shadow-sm hover:brightness-95 disabled:opacity-50",
  link: "border border-transparent bg-transparent px-0 text-brand-700 underline-offset-4 shadow-none hover:underline dark:text-brand-300",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-sm",
  md: "min-h-10 px-4 py-2 text-sm",
  lg: "min-h-11 px-5 py-2 text-base",
  xl: "min-h-12 px-6 py-2.5 text-base",
  icon: "h-10 w-10 p-0",
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
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold shadow-xs transition-[color,background-color,border-color,box-shadow,transform,opacity,filter] duration-fast ease-standard active:translate-y-px",
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
