import { X } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

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
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4">
      <div className={`w-full rounded-lg bg-white p-5 shadow-xl ${className || "max-w-lg"}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
