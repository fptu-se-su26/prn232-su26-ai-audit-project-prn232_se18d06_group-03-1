import { create } from "zustand";
import type { AuthSession, AuthState, AuthUser, UserRole } from "@/features/auth/types";

const storageKey = "movevn_auth_session";
const legacyTokenKey = "cc_token";

function readStoredSession(): AuthSession {
  const raw = localStorage.getItem(storageKey);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AuthSession;
      return {
        token: parsed.token ?? null,
        user: parsed.user ?? null,
      };
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  const legacyToken = localStorage.getItem(legacyTokenKey);
  if (!legacyToken) {
    return { token: null, user: null };
  }

  return {
    token: {
      accessToken: legacyToken,
      accessTokenJti: "",
      accessTokenExpiresAt: "",
      refreshToken: "",
      refreshTokenExpiresAt: "",
    },
    user: null,
  };
}

function persistSession(session: AuthSession) {
  if (!session.token) {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(legacyTokenKey);
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(session));
  localStorage.removeItem(legacyTokenKey);
}

const initialSession = readStoredSession();

export const useAuthStore = create<AuthState>((set) => ({
  token: initialSession.token,
  user: initialSession.user,
  isHydrated: true,
  setSession: (session: AuthSession) => {
    persistSession(session);
    set(session);
  },
  updateUser: (user: AuthUser | null) => {
    set((state) => {
      const next = { token: state.token, user };
      persistSession(next);
      return { user };
    });
  },
  clearSession: () => {
    persistSession({ token: null, user: null });
    set({ token: null, user: null });
  },
}));

export function getToken() {
  return useAuthStore.getState().token?.accessToken ?? null;
}

export function getRefreshToken() {
  return useAuthStore.getState().token?.refreshToken ?? null;
}

export function getAuthUser() {
  return useAuthStore.getState().user;
}

export function setSession(session: AuthSession) {
  useAuthStore.getState().setSession(session);
}

export function updateUser(user: AuthUser | null) {
  useAuthStore.getState().updateUser(user);
}

export function clearSession() {
  useAuthStore.getState().clearSession();
}

export function useAuth() {
  return useAuthStore((s) => s);
}

export function hasRole(user: AuthUser | null, roles: UserRole[]) {
  return Boolean(user?.roles.some((role) => roles.includes(role)));
}
