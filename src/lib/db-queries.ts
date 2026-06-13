const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

export interface MatchRow {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  pitchSponsorName: string | null;
  pitchLogoLeftUrl: string | null;
  pitchLogoRightUrl: string | null;
  sponsorTargetUrl: string | null;
}

export async function getTodayMatches(): Promise<MatchRow[]> {
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const res = await fetch(`${API_BASE}/matches?date=${todayStr}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];

    const json = await res.json();
    const raw: unknown = json?.data ?? json;
    const rows = Array.isArray(raw) ? raw : [];

    return rows.map((match: Record<string, unknown>) => ({
      id:               String(match.id ?? ""),
      homeTeam:         String(match.home_team ?? ""),
      awayTeam:         String(match.away_team ?? ""),
      date:             String(match.date ?? ""),
      pitchSponsorName: (match.pitch_sponsor_name as string | null) ?? null,
      pitchLogoLeftUrl: (match.pitch_logo_left_url as string | null) ?? null,
      pitchLogoRightUrl:(match.pitch_logo_right_url as string | null) ?? null,
      sponsorTargetUrl: (match.sponsor_target_url as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}