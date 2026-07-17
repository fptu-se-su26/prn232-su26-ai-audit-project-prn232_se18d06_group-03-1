import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToastStore, type ToastType } from "@/components/common/toastStore";
import { cn } from "@/utils/cn";

const styles: Record<ToastType, string> = {
  success: "border-emerald-200 bg-white text-emerald-900",
  error: "border-rose-200 bg-white text-rose-900",
  info: "border-sky-200 bg-white text-sky-900",
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
    <div className="fixed right-4 top-4 z-50 grid w-[calc(100vw-2rem)] max-w-sm gap-3" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={cn("flex gap-3 rounded-md border p-4 shadow-xl shadow-slate-950/10", styles[toast.type])}
          >
            <Icon className="mt-0.5 h-5 w-5 flex-none" />
            <div className="min-w-0 flex-1">
              {toast.title ? <div className="text-sm font-semibold">{toast.title}</div> : null}
              <div className="text-sm text-slate-700">{toast.message}</div>
            </div>
            <button
              type="button"
              aria-label="Đóng thông báo"
              className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
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
