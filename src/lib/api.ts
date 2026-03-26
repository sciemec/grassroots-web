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

// Do NOT auto-logout on 401.
// A Render cold-start or any single failing endpoint returns 401 and was wiping
// the session immediately after login — causing the black page.
// Pages handle 401s via .catch(() => null). Layouts redirect to /login when
// the user is genuinely unauthenticated (user === null in the store).
api.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error)
);

export default api;
