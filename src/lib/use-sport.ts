"use client";

import { useState, useEffect } from "react";

export const ALL_SPORTS = [
  { id: "football",   label: "Football",   emoji: "⚽" },
  { id: "rugby",      label: "Rugby",      emoji: "🏉" },
  { id: "netball",    label: "Netball",    emoji: "🏐" },
  { id: "athletics",  label: "Athletics",  emoji: "🏃" },
  { id: "basketball", label: "Basketball", emoji: "🏀" },
  { id: "cricket",    label: "Cricket",    emoji: "🏏" },
  { id: "swimming",   label: "Swimming",   emoji: "🏊" },
  { id: "tennis",     label: "Tennis",     emoji: "🎾" },
  { id: "volleyball", label: "Volleyball", emoji: "🏐" },
  { id: "hockey",     label: "Hockey",     emoji: "🏑" },
] as const;

export type SportId = (typeof ALL_SPORTS)[number]["id"];

export function useSport() {
  const [activeSport, setActiveSportState] = useState<string>("football");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored =
      localStorage.getItem("grs_active_sport") ??
      localStorage.getItem("player_sport");
    if (stored) setActiveSportState(stored);
  }, []);

  const setActiveSport = (sport: string) => {
    setActiveSportState(sport);
    if (typeof window !== "undefined") {
      localStorage.setItem("grs_active_sport", sport);
      localStorage.setItem("player_sport", sport); // backward compat
    }
  };

  return { activeSport, setActiveSport, sports: ALL_SPORTS };
}
