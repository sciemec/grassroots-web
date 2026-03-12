import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "admin" | "coach" | "scout" | "player";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

interface AuthState {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => {
        localStorage.setItem("auth_token", user.token);
        set({ user });
      },
      logout: () => {
        localStorage.removeItem("auth_token");
        set({ user: null });
      },
    }),
    { name: "grassroots-auth" }
  )
);
