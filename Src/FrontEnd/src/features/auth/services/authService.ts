import { apiClient } from "@/services/apiClient";
import type { AuthToken } from "@/features/auth/types";

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  token: AuthToken;
};

export async function login(payload: LoginPayload) {
  const res = await apiClient.post<LoginResponse>("/auth/login", payload);
  return res.data;
}

export async function pingSwagger() {
  const res = await apiClient.get("/swagger/v1/swagger.json");
  return res.data as unknown;
}
