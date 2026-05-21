import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;
let onAuthExpired: (() => void) | null = null;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const authApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setAuthExpiredHandler(handler: (() => void) | null) {
  onAuthExpired = handler;
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = authApi
      .post<{ accessToken: string }>('/auth/refresh', {})
      .then((response) => {
        setAccessToken(response.data.accessToken);
        return response.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url ?? '';

    if (!originalRequest || status !== 401 || originalRequest._retry || isAuthMutation(url)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const token = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      onAuthExpired?.();
      return Promise.reject(refreshError);
    }
  },
);

function isAuthMutation(url: string) {
  return ['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh'].some((path) =>
    url.includes(path),
  );
}
