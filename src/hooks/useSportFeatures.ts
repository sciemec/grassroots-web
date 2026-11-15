// src/hooks/useSportFeatures.ts
// Returns feature flags for the authenticated player's primary sport.
// Use this hook anywhere you need to gate football-only UI for multi-sport players.

import { useAuthStore } from "@/lib/auth-store";
import { getSportFeatures, SportFeatures } from "@/config/sports";

export interface UseSportFeaturesResult {
  sport:      string;
  features:   SportFeatures;
  hasFeature: (key: keyof SportFeatures) => boolean;
}

export function useSportFeatures(): UseSportFeaturesResult {
  const user     = useAuthStore((s) => s.user);
  const sport    = (user as { sport?: string } | null)?.sport ?? "football";
  const features = getSportFeatures(sport);
  return {
    sport,
    features,
    hasFeature: (key) => features[key],
  };
}
