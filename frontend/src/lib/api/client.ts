import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../../store/authStore";

export const apiClient = axios.create({
  // Relative URL → same-origin through the Vite dev proxy (or nginx in prod).
  // This is what makes SameSite=Lax cookies work on cross-origin setups:
  // the browser sees all requests as coming from/going to the same origin.
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push((token) => {
            if (!token) return reject(error);
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await apiClient.post("/auth/refresh");
        useAuthStore.getState().setAccessToken(data.accessToken);
        queue.forEach((cb) => cb(data.accessToken));
        queue = [];
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        queue.forEach((cb) => cb(null));
        queue = [];
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
