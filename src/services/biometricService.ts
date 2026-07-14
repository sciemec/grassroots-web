// src/services/biometricService.ts
// Provides biometric data fetching and helper utilities.
// Falls back to localStorage / sensible defaults when the backend is unavailable.

import { BiometricData } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_token") ?? "";
}

const EMPTY: BiometricData = {
  overallForm: 0,
  explosivePower: 0,
  symmetryScore: 0,
  fatigueIndex: 0,
  hasData: false,
  lastScanDate: null,
};

export const biometricService = {
  /** Fetch biometric data for a player from the backend. */
  async getBiometricData(playerId: string): Promise<BiometricData> {
    try {
      const res = await fetch(`${BASE}/players/${playerId}/biomechanics`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data ?? json;
    } catch {
      // Fallback: localStorage cache
      try {
        const cached = localStorage.getItem(`biometric_${playerId}`);
        return cached ? JSON.parse(cached) : { ...EMPTY };
      } catch {
        return { ...EMPTY };
      }
    }
  },

  /** Persist partial updates to the backend and local cache. */
  async updateBiometricData(
    playerId: string,
    updates: Partial<BiometricData>
  ): Promise<void> {
    // Optimistically update localStorage first
    try {
      const cached = localStorage.getItem(`biometric_${playerId}`);
      const current: BiometricData = cached ? JSON.parse(cached) : { ...EMPTY };
      const merged = { ...current, ...updates };
      localStorage.setItem(`biometric_${playerId}`, JSON.stringify(merged));
    } catch {
      // ignore storage errors
    }

    try {
      await fetch(`${BASE}/players/${playerId}/biomechanics`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(updates),
      });
    } catch {
      // Fire-and-forget — local cache already updated
    }
  },

  /**
   * Returns a human-readable fatigue status label.
   * fatigueIndex: 0–100 (0 = fully rested, 100 = severely fatigued)
   */
  getFatigueStatus(fatigueIndex: number): string {
    if (fatigueIndex < 20) return "Fully Rested";
    if (fatigueIndex < 40) return "Low Fatigue";
    if (fatigueIndex < 60) return "Moderate Fatigue";
    if (fatigueIndex < 80) return "High Fatigue";
    return "Severe Fatigue";
  },

  /**
   * Returns a short recovery recommendation based on fatigue level.
   */
  getRecoveryRecommendation(fatigueIndex: number): string {
    if (fatigueIndex < 20) return "Ready for full training load.";
    if (fatigueIndex < 40) return "Light warm-up recommended before session.";
    if (fatigueIndex < 60) return "Reduce intensity — focus on technical drills only.";
    if (fatigueIndex < 80) return "Rest day advised. Active recovery only.";
    return "Complete rest required. Do not train today.";
  },
};
