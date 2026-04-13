// THUTO Conditioning — localStorage persistence layer

import type { ConditioningSession } from "./types";

const SESSIONS_KEY = "gs_conditioning_sessions";

export function getSessions(): ConditioningSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveSession(session: ConditioningSession): void {
  if (typeof window === "undefined") return;
  const sessions = getSessions();
  sessions.unshift(session); // newest first
  // Keep last 100 sessions
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, 100)));
}

export function getSessionCount(): number {
  return getSessions().length;
}

export function getTotalMinutes(): number {
  return getSessions().reduce((sum, s) => sum + s.duration_actual, 0);
}

export function getLastSession(): ConditioningSession | null {
  const sessions = getSessions();
  return sessions[0] ?? null;
}
