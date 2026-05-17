export type AuthToken = string;

export type AuthState = {
  token: AuthToken | null;
  setToken: (token: AuthToken) => void;
  clearToken: () => void;
};

