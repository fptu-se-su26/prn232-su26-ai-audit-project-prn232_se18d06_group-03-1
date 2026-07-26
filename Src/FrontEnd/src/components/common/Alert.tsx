import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/utils/cn";

type AlertVariant = "info" | "success" | "warning" | "error";

type AlertProps = {
  children: ReactNode;
  title?: string;
  variant?: AlertVariant;
};

const styles: Record<AlertVariant, string> = {
  info: "border-info-border bg-info-surface text-info-foreground",
  success: "border-success-border bg-success-surface text-success-foreground",
  warning: "border-warning-border bg-warning-surface text-warning-foreground",
  error: "border-danger-border bg-danger-surface text-danger-foreground",
};

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
};

export default function Alert({ children, title, variant = "info" }: AlertProps) {
  const Icon = icons[variant];

  return (
    <div className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm shadow-xs", styles[variant])} role="alert">
      <Icon className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        {title ? <div className="font-semibold">{title}</div> : null}
        <div className={title ? "mt-1" : ""}>{children}</div>
      </div>
    </div>
  );
}
