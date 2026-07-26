import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToastStore, type ToastType } from "@/components/common/toastStore";
import { cn } from "@/utils/cn";

const styles: Record<ToastType, string> = {
  success: "border-success-border bg-surface-elevated text-success-foreground",
  error: "border-danger-border bg-surface-elevated text-danger-foreground",
  info: "border-info-border bg-surface-elevated text-info-foreground",
};

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export default function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  return (
    <div className="fixed right-4 top-4 z-toast grid w-[calc(100vw-2rem)] max-w-sm gap-3" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={cn("flex gap-3 rounded-lg border p-4 shadow-xl", styles[toast.type])}
          >
            <Icon className="mt-0.5 h-5 w-5 flex-none" />
            <div className="min-w-0 flex-1">
              {toast.title ? <div className="text-sm font-semibold">{toast.title}</div> : null}
              <div className="text-sm text-text-secondary">{toast.message}</div>
            </div>
            <button
              type="button"
              aria-label="Đóng thông báo"
              className="grid h-7 w-7 place-items-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text-primary"
              onClick={() => dismissToast(toast.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
