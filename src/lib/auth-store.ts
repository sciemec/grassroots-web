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
  // Profile fields — populated after registration/login
  sport?: string;
  position?: string;
  age_group?: string;
  province?: string;
}

interface AuthState {
  user: AuthUser | null;
  /** Admin-only: which hub is currently being previewed */
  adminHub: UserRole;
  /** True once Zustand has rehydrated from localStorage — prevents premature redirects */
  _hasHydrated: boolean;
  login: (user: AuthUser) => void;
  /** Merge profile fields into the stored user (called after /profile fetch) */
  updateUser: (fields: Partial<AuthUser>) => void;
  logout: () => void;
  setAdminHub: (hub: UserRole) => void;
  setHasHydrated: (val: boolean) => void;
}

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      adminHub: "admin",
      _hasHydrated: false,
      login: (user) => {
        setCookie("gs_token", user.token);
        setCookie("gs_role", user.role);
        set({ user, adminHub: "admin" });
      },
      updateUser: (fields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...fields } : state.user,
        })),
      logout: () => {
        clearCookie("gs_token");
        clearCookie("gs_role");
        set({ user: null, adminHub: "admin" });
      },
      setAdminHub: (hub) => set({ adminHub: hub }),
      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: "grassroots-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
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
