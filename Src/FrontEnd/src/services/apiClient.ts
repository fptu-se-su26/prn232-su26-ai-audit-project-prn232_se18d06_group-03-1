import axios, { AxiosHeaders } from "axios";
import { DEFAULT_API_BASE_URL } from "@/constants/appConstants";
import { getToken } from "@/features/auth/hooks/useAuth";

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL);
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (!token) {
    return config;
  }

  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${token}`);
  config.headers = headers;

  return config;
});

export async function requestJson<T>(path: string) {
  const res = await apiClient.get<T>(path);
  return res.data;
}
