import { NextRequest, NextResponse } from "next/server";
import { liveCommentaryPrompt } from "@/config/prompts";

/**
 * POST /api/commentary
 *
 * Generates a single Zimbabwean-style commentary line for a match event.
 * Called by the useCommentary hook on the live match page.
 *
 * Body: {
 *   event:     { type, minute, player, team }
 *   homeTeam:  string
 *   awayTeam:  string
 *   homeScore: number
 *   awayScore: number
 *   sport:     string
 * }
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured." }, { status: 503 });
  }

  let body: {
    event?: { type: string; minute: number; player?: string; team: string };
    homeTeam?: string;
    awayTeam?: string;
    homeScore?: number;
    awayScore?: number;
    sport?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { event, homeTeam = "Home", awayTeam = "Away", homeScore = 0, awayScore = 0, sport = "football" } = body;

  if (!event) {
    return NextResponse.json({ error: "event is required." }, { status: 400 });
  }

  // Build a human-readable event description for Claude
  const teamName  = event.team === "home" ? homeTeam : awayTeam;
  const playerStr = event.player ? `${event.player} (${teamName})` : teamName;
  const scoreStr  = `${homeTeam} ${homeScore}–${awayScore} ${awayTeam}`;

  const eventDescriptions: Record<string, string> = {
    goal:           `GOAL! ${playerStr} scores! ${scoreStr} — Minute ${event.minute}`,
    shot_on_target: `Shot on target by ${playerStr} — Minute ${event.minute}. Score: ${scoreStr}`,
    yellow_card:    `Yellow card for ${playerStr} — Minute ${event.minute}`,
    red_card:       `RED CARD! ${playerStr} is sent off — Minute ${event.minute}`,
    foul:           `Foul committed by ${playerStr} — Minute ${event.minute}`,
    sub:            `Substitution for ${teamName} — Minute ${event.minute}`,
    injury:         `Player down — ${playerStr} — Minute ${event.minute}`,
    assist:         `Assist by ${playerStr} — Minute ${event.minute}`,
  };

  const eventDesc = eventDescriptions[event.type] ?? `${event.type} by ${playerStr} — Minute ${event.minute}`;

  const userMessage = `Sport: ${sport}\nMatch: ${homeTeam} vs ${awayTeam}\nCurrent score: ${scoreStr}\nEvent: ${eventDesc}\n\nGenerate commentary for this moment.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 100,
        system: liveCommentaryPrompt(),
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Commentary API error", res.status, err);
      return NextResponse.json({ error: `AI error (${res.status})` }, { status: res.status });
    }

    const data = await res.json();
    const commentary: string = data?.content?.[0]?.text ?? "";
    return NextResponse.json({ commentary });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Commentary request failed";
    console.error("Commentary exception", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
