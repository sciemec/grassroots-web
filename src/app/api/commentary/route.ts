import { NextRequest, NextResponse } from "next/server";
import { liveCommentaryPrompt } from "@/config/prompts";
import { groqText } from "@/lib/groq";

/**
 * POST /api/commentary
 *
 * Generates a single Zimbabwean-style commentary line for a match event.
 * Called by the useCommentary hook on the live match page.
 */
export async function POST(req: NextRequest) {
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

  const eventDesc  = eventDescriptions[event.type] ?? `${event.type} by ${playerStr} — Minute ${event.minute}`;
  const userMessage = `Sport: ${sport}\nMatch: ${homeTeam} vs ${awayTeam}\nCurrent score: ${scoreStr}\nEvent: ${eventDesc}\n\nGenerate commentary for this moment.`;

  try {
    const commentary = await groqText(
      liveCommentaryPrompt(),
      [{ role: "user", content: userMessage }],
      { max_tokens: 100, temperature: 0.9 },
    );
    return NextResponse.json({ commentary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Commentary request failed";
    console.error("Commentary exception", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
