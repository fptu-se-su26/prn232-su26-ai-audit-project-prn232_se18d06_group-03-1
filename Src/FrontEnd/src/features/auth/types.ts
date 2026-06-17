export type AuthToken = string;

export type AuthUser = {
  userId: string;
  domainUserId: number;
  fullName: string;
  email?: string | null;
  roles: string[];
  isEmailVerified: boolean;
};

export type AuthState = {
  token: AuthToken | null;
  user: AuthUser | null;
  setToken: (token: AuthToken) => void;
  setUser: (user: AuthUser | null) => void;
  clearToken: () => void;
};
