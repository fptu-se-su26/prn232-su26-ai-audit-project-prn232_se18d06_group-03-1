export type UserRole = "Admin" | "Owner" | "Customer" | "Staff";

export type UserStatus = "Pending" | "Active" | "Suspended" | "Deleted";

export type OtpPurpose = "Register" | "ForgotPassword" | "VerifyEmail";

export type AuthToken = {
  accessToken: string;
  accessTokenJti: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type AuthUser = {
  userId: number;
  fullName: string;
  email: string;
  status: UserStatus | string;
  isEmailVerified: boolean;
  roles: UserRole[];
};

export type AuthResponse = {
  token: AuthToken;
  user: AuthUser;
};

export type AuthSession = {
  token: AuthToken | null;
  user: AuthUser | null;
};

export type AuthState = AuthSession & {
  isHydrated: boolean;
  activeRole: UserRole | null;
  setSession: (session: AuthSession) => void;
  updateUser: (user: AuthUser | null) => void;
  setActiveRole: (role: UserRole) => void;
  clearSession: () => void;
};

export type ApiResponse<T> = {
  status: boolean;
  code: string;
  message: string;
  data: T | null;
  errors?: string[] | null;
};

export type ApiErrorPayload = {
  code: string;
  message: string;
  errors?: string[] | null;
};
