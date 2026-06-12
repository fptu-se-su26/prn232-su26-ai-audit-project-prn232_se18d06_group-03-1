import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
};

type ToastState = {
  toasts: Toast[];
  dismissToast: (id: string) => void;
  showToast: (toast: Omit<Toast, "id">) => void;
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  showToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    window.setTimeout(() => get().dismissToast(id), 4200);
  },
}));

export function showToast(toast: Omit<Toast, "id">) {
  useToastStore.getState().showToast(toast);
}
