import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { DEFAULT_API_BASE_URL } from "@/constants/appConstants";
import { clearSession, getRefreshToken, getToken, setSession } from "@/features/auth/hooks/useAuth";
import type { ApiResponse, AuthResponse } from "@/features/auth/types";
import { endpoints } from "@/services/endpoints";

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

export const bareApiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: "application/json",
  },
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<AuthResponse> | null = null;

function shouldAttemptRefresh(error: AxiosError) {
  const config = error.config as RetryableRequestConfig | undefined;
  const requestUrl = config?.url ?? "";

  return (
    error.response?.status === 401 &&
    Boolean(config) &&
    !config?._retry &&
    !requestUrl.includes(endpoints.auth.refreshToken) &&
    !requestUrl.includes(endpoints.auth.login)
  );
}

async function refreshAuthSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Missing refresh token.");
  }

  if (!refreshPromise) {
    refreshPromise = bareApiClient
      .post<ApiResponse<AuthResponse>>(endpoints.auth.refreshToken, { refreshToken })
      .then((res) => {
        if (!res.data.status || !res.data.data) {
          throw new Error("Refresh token failed.");
        }

        setSession({ token: res.data.data.token, user: res.data.data.user });
        return res.data.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!shouldAttemptRefresh(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig;
    originalRequest._retry = true;

    try {
      const refreshed = await refreshAuthSession();
      const headers = AxiosHeaders.from(originalRequest.headers);
      headers.set("Authorization", `Bearer ${refreshed.token.accessToken}`);
      originalRequest.headers = headers;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.assign(`/login?expired=1&from=${encodeURIComponent(window.location.pathname)}`);
      }
      return Promise.reject(refreshError);
    }
  },
);

export async function requestJson<T>(path: string) {
  const res = await apiClient.get<T>(path);
  return res.data;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as Partial<ApiResponse<unknown>> | undefined;
    return payload?.errors?.filter(Boolean).join(" ") || payload?.message || fallback;
  }
  return fallback;
}
