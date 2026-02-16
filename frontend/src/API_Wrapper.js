// src/api.js
import axios from "axios";

const envBaseUrl = (process.env.REACT_APP_API_URL || "").trim();
const isLocalFrontend =
  typeof window !== "undefined" &&
  (window.location.origin.includes("localhost:3000") ||
    window.location.origin.includes("127.0.0.1:3000"));
const fallbackBaseUrl = isLocalFrontend ? "http://127.0.0.1:8000" : "";

export const API_BASE_URL = (envBaseUrl || fallbackBaseUrl).replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: true, // always send cookies!
});

let isRefreshing = false;
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    const url = String(originalRequest?.url || "");

    if (
      status === 401 &&
      !originalRequest._retry &&
      !url.includes("/api/v1/auth/login") &&
      !url.includes("/api/v1/auth/refresh")
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = api
          .post("/api/v1/auth/refresh")
          .finally(() => {
            isRefreshing = false;
          });
      }

      try {
        await refreshPromise;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
