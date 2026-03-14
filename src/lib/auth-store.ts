import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "admin" | "coach" | "scout" | "player" | "fan";

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case "admin":  return "/dashboard";
    case "coach":  return "/coach";
    case "scout":  return "/scout";
    case "player": return "/player";
    case "fan":    return "/fan";
  }
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

interface AuthState {
  user: AuthUser | null;
  /** Admin-only: which hub is currently being previewed */
  adminHub: UserRole;
  login: (user: AuthUser) => void;
  logout: () => void;
  setAdminHub: (hub: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      adminHub: "admin",
      login: (user) => {
        localStorage.setItem("auth_token", user.token);
        set({ user, adminHub: "admin" });
      },
      logout: () => {
        localStorage.removeItem("auth_token");
        set({ user: null, adminHub: "admin" });
      },
      setAdminHub: (hub) => set({ adminHub: hub }),
    }),
    { name: "grassroots-auth" }
  )
);

/**
 * Returns the effective role for nav/routing purposes.
 * Admin can preview any hub — this returns the hub they're currently viewing.
 */
export function useEffectiveRole(): UserRole | null {
  const user = useAuthStore((s) => s.user);
  const adminHub = useAuthStore((s) => s.adminHub);
  if (!user) return null;
  if (user.role === "admin") return adminHub;
  return user.role;
}
