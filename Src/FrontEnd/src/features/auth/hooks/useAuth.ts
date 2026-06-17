import { create } from "zustand";
import type { AuthState, AuthToken, AuthUser } from "@/features/auth/types";

const storageKey = "cc_token";

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(storageKey),
  user: null,
  setToken: (token: AuthToken) => {
    localStorage.setItem(storageKey, token);
    set({ token });
  },
  setUser: (user: AuthUser | null) => {
    set({ user });
  },
  clearToken: () => {
    localStorage.removeItem(storageKey);
    set({ token: null, user: null });
  },
}));

export function getToken() {
  return useAuthStore.getState().token;
}

export function setToken(token: AuthToken) {
  useAuthStore.getState().setToken(token);
}

export function setUser(user: AuthUser | null) {
  useAuthStore.getState().setUser(user);
}

export function clearToken() {
  useAuthStore.getState().clearToken();
}

export function useAuth() {
  return useAuthStore((s) => s);
}
