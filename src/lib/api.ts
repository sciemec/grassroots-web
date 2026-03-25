import axios from "axios";
import { useAuthStore } from "@/lib/auth-store";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  withCredentials: false,
  timeout: 15000, // 15 s — prevents infinite hang on Render free-tier cold starts
});

// Attach bearer token from auth store on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = useAuthStore.getState().user?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — clear session; let the layout's useEffect redirect via React router
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const state = useAuthStore.getState();
      // Only log out if there is an active stored session (don't fire for public endpoints)
      if (state.token) {
        state.logout();
        // Don't hard-navigate with window.location — that flashes a blank page.
        // The layout's useEffect watches user and will push to /login cleanly.
      }
    }
    return Promise.reject(error);
  }
);

export default api;
