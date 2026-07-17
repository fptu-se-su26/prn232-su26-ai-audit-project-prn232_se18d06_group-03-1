import { X } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";

type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
  title: string;
  onClose: () => void;
  className?: string;
};

export default function Modal({ children, isOpen, onClose, title, className = "" }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center">
      <div className={cn("flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl shadow-slate-950/20", className)} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
