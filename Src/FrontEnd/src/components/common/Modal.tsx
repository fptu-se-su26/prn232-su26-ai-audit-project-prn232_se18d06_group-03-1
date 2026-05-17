import type { ReactNode } from "react";
import Button from "@/components/common/Button";

type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
  title: string;
  onClose: () => void;
};

export default function Modal({ children, isOpen, onClose, title }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
