import { create } from "zustand";
import type { AuthState, AuthToken } from "@/features/auth/types";

const storageKey = "cc_token";

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(storageKey),
  setToken: (token: AuthToken) => {
    localStorage.setItem(storageKey, token);
    set({ token });
  },
  clearToken: () => {
    localStorage.removeItem(storageKey);
    set({ token: null });
  },
}));

export function getToken() {
  return useAuthStore.getState().token;
}

export function setToken(token: AuthToken) {
  useAuthStore.getState().setToken(token);
}

export function clearToken() {
  useAuthStore.getState().clearToken();
}

export function useAuth() {
  return useAuthStore((s) => s);
}

