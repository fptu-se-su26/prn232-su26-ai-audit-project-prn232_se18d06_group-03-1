import { apiClient } from "@/services/apiClient";
import type { AuthToken, AuthUser } from "@/features/auth/types";
import type { ApiEnvelope } from "@/services/httpTypes";

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  accessToken: AuthToken;
  refreshToken: string;
  accessTokenExpiry: string;
  token: AuthToken;
  user: AuthUser;
};

export async function login(payload: LoginPayload) {
  const res = await apiClient.post<ApiEnvelope<LoginResponse>>("/auth/login", payload);
  return res.data.data;
}

export async function pingSwagger() {
  const res = await apiClient.get("/swagger/v1/swagger.json");
  return res.data as unknown;
}

export async function getCurrentUser() {
  const res = await apiClient.get<ApiEnvelope<AuthUser>>("/auth/me");
  return res.data.data;
}
