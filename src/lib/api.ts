import axios from "axios";
import { useAuthStore } from "@/lib/auth-store";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  withCredentials: false,
});

// Attach bearer token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — but only force-logout for real expired tokens.
// Dev-bypass uses token "dev-token" which the backend always rejects with 401.
// Redirecting in that case boots the admin out on every API call, so we skip
// the redirect when the stored token is the local dev-only value.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      const isDevBypass = !token || token === "dev-token";

      if (!isDevBypass) {
        // Real token rejected — clear session and send to login
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
      // Dev bypass: silently reject so the dashboard shows empty/error states
      // without redirecting the user
    }
    return Promise.reject(error);
  }
);

export default api;
