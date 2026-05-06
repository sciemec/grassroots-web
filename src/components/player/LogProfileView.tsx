"use client";

import { useEffect } from "react";

interface LogProfileViewProps {
  playerId: string;
}

/**
 * Fire-and-forget: logs a scout view when the public profile page loads.
 * Rendered inside the server component — this is the client boundary.
 * Never throws — silently fails so the profile page always loads correctly.
 */
export function LogProfileView({ playerId }: LogProfileViewProps) {
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token && token !== "dev-token") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/view`,
      { method: "POST", headers }
    ).catch(() => {});
  }, [playerId]);

  return null;
}
