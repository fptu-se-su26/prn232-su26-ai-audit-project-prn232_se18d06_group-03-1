import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error";

type AlertProps = {
  children: ReactNode;
  title?: string;
  variant?: AlertVariant;
};

const styles: Record<AlertVariant, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
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
    <div className={["flex gap-3 rounded-md border px-4 py-3 text-sm", styles[variant]].join(" ")} role="alert">
      <Icon className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        {title ? <div className="font-semibold">{title}</div> : null}
        <div className={title ? "mt-1" : ""}>{children}</div>
      </div>
    </div>
  );
}
