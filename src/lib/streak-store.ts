import { create } from "zustand";
import api from "@/lib/api";

interface StreakState {
  dailyStreak: number;
  activeToday: boolean;
  loaded: boolean;
  fetch: () => Promise<void>;
  markActive: () => void;
}

export const useStreakStore = create<StreakState>((set, get) => ({
  dailyStreak: 0,
  activeToday: false,
  loaded: false,

  fetch: async () => {
    if (get().loaded) return;
    try {
      const res = await api.get("/streak");
      const daily_streak: number = res.data?.daily_streak ?? 0;
      const active_today: boolean = res.data?.active_today ?? false;
      set({ dailyStreak: daily_streak, activeToday: active_today, loaded: true });

      // App Badging API — badge when player hasn't trained today
      if (typeof navigator !== "undefined" && daily_streak > 0) {
        try {
          if (!active_today) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigator as any).setAppBadge?.(1);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigator as any).clearAppBadge?.();
          }
        } catch { /* Badging API not supported */ }
      }
    } catch {
      set({ loaded: true });
    }
  },

  // Call after a qualifying activity to immediately reflect active state
  markActive: () => {
    set((s) => ({ ...s, activeToday: true }));
    if (typeof navigator !== "undefined") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any).clearAppBadge?.();
      } catch { /* ignore */ }
    }
  },
}));
