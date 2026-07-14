// src/services/api.ts
// Thin wrapper around the Laravel backend API for scouting-related endpoints.
// Falls back to localStorage when the backend is unavailable (no internet / cold start).

import { AttributeScore, PositionType, ScoutingProfile } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_token") ?? "";
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
        ...options.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text || `HTTP ${res.status}` };
    }
    const json = await res.json();
    return { success: true, data: json.data ?? json };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export const api = {
  /** Fetch the last N scouting profiles for a player. */
  async getScoutingHistory(
    playerId: string,
    limit = 5
  ): Promise<{ success: boolean; data?: { items: ScoutingProfile[] }; error?: string }> {
    const res = await request<{ items: ScoutingProfile[] }>(
      `/scout/profiles/${playerId}?limit=${limit}`
    );
    if (!res.success) {
      // Fallback: read from localStorage
      try {
        const stored = localStorage.getItem(`scout_history_${playerId}`);
        const items: ScoutingProfile[] = stored ? JSON.parse(stored) : [];
        return { success: true, data: { items: items.slice(0, limit) } };
      } catch {
        return { success: true, data: { items: [] } };
      }
    }
    return res;
  },

  /** Fetch average attribute scores for a given position across the platform. */
  async getTeamAverages(
    position: PositionType
  ): Promise<{ success: boolean; data?: AttributeScore; error?: string }> {
    const res = await request<AttributeScore>(`/scout/averages?position=${position}`);
    if (!res.success) {
      // Sensible defaults when offline
      const defaults: Record<PositionType, AttributeScore> = {
        FW:  { pace: 75, technical: 70, tactical: 65, physical: 72, scanning: 60 },
        MID: { pace: 68, technical: 72, tactical: 74, physical: 68, scanning: 70 },
        DEF: { pace: 65, technical: 62, tactical: 74, physical: 76, scanning: 68 },
        GK:  { pace: 55, technical: 65, tactical: 72, physical: 70, scanning: 72 },
      };
      return { success: true, data: defaults[position] };
    }
    return res;
  },

  /** Save a scouting profile to the backend (and localStorage for offline access). */
  async saveScoutingProfile(
    profile: Omit<ScoutingProfile, "id">
  ): Promise<{ success: boolean; data?: ScoutingProfile; error?: string }> {
    const res = await request<ScoutingProfile>("/scout/profiles", {
      method: "POST",
      body: JSON.stringify(profile),
    });

    // Always persist locally so the data survives offline / cold starts
    try {
      const key = `scout_history_${profile.playerId}`;
      const stored = localStorage.getItem(key);
      const existing: ScoutingProfile[] = stored ? JSON.parse(stored) : [];
      const saved: ScoutingProfile = res.data ?? {
        ...profile,
        id: `local_${Date.now()}`,
      } as ScoutingProfile;
      localStorage.setItem(key, JSON.stringify([saved, ...existing].slice(0, 20)));
      return { success: true, data: saved };
    } catch {
      return res;
    }
  },
};
