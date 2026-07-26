import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info" | "outline";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: "border-ui-border bg-surface-subtle text-text-secondary",
  primary: "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300",
  success: "border-success-border bg-success-surface text-success-foreground",
  warning: "border-warning-border bg-warning-surface text-warning-foreground",
  danger: "border-danger-border bg-danger-surface text-danger-foreground",
  info: "border-info-border bg-info-surface text-info-foreground",
  outline: "border-ui-border bg-transparent text-text-secondary",
};

export default function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex min-h-6 items-center gap-1 rounded-full border px-2.5 py-0.5 text-caption font-semibold leading-none", variants[variant], className)}
      {...props}
    />
  );
}
