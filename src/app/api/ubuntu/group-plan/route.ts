/**
 * POST /api/ubuntu/group-plan
 *
 * THUTO generates a 4-drill group coaching plan for two Ubuntu partners.
 * Returns role assignments (demonstrator / observer) per drill so players
 * alternate leadership throughout the session.
 *
 * Body:
 *   sessionId    — unique session key
 *   playerA      — name of the player who created the session
 *   playerB      — name of the partner who joined
 *   focus        — training focus area (e.g. "Dribbling", "Shooting")
 *
 * Returns:
 *   { sessionId, focus, drills: GroupDrill[], generatedAt }
 */

import { NextRequest, NextResponse } from "next/server";

export interface GroupDrill {
  order:        number;
  name:         string;
  duration:     number;        // seconds
  instructions: string;
  demonstrator: "A" | "B";    // who shows the skill first
  observer:     "A" | "B";    // who watches, mirrors, gives feedback
  coaching_cue: string;       // what THUTO says to the observer
  rest_seconds: number;
}

interface GroupPlan {
  sessionId:    string;
  focus:        string;
  drills:       GroupDrill[];
  generatedAt:  string;
}

interface PlanBody {
  sessionId: string;
  playerA:   string;
  playerB:   string;
  focus:     string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  let body: PlanBody;
  try {
    body = (await req.json()) as PlanBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sessionId, playerA = "Player A", playerB = "Player B", focus = "Football skills" } = body;

  // ── Fallback plan (no API key or Claude unavailable) ──────────────────────
  const fallback: GroupPlan = {
    sessionId,
    focus,
    generatedAt: new Date().toISOString(),
    drills: [
      {
        order: 1,
        name: "Touch & Control",
        duration: 120,
        instructions: `${playerA} juggles the ball 10 times then passes to ${playerB}. ${playerB} controls with one touch and juggles back. Repeat for the full drill time.`,
        demonstrator: "A",
        observer: "B",
        coaching_cue: `Watch ${playerA}'s foot angle when they receive the ball. Try to copy the same shape with your own foot.`,
        rest_seconds: 30,
      },
      {
        order: 2,
        name: "Wall Pass Relay",
        duration: 90,
        instructions: `${playerB} stands 3 metres from a wall and plays a firm pass. ${playerA} makes a run to collect the rebound and passes back. Switch every 5 passes.`,
        demonstrator: "B",
        observer: "A",
        coaching_cue: `Study ${playerB}'s body position before the pass. Notice how they open their hips to set the direction.`,
        rest_seconds: 30,
      },
      {
        order: 3,
        name: "1v1 Shadow Dribble",
        duration: 90,
        instructions: `${playerA} dribbles slowly through 4 cone gates. ${playerB} follows 1 metre behind, mirroring every move without touching the ball. Switch roles after each run.`,
        demonstrator: "A",
        observer: "B",
        coaching_cue: `As you shadow ${playerA}, feel how your weight shifts. Use this awareness in your own dribbling to stay balanced.`,
        rest_seconds: 20,
      },
      {
        order: 4,
        name: "Combination Finish",
        duration: 120,
        instructions: `${playerB} rolls the ball. ${playerA} takes one touch and shoots at a target (stone marker or post). ${playerB} comments on the follow-through. Switch every 3 shots.`,
        demonstrator: "B",
        observer: "A",
        coaching_cue: `Tell ${playerB} one specific thing you noticed about their shooting stance. Be kind and exact.`,
        rest_seconds: 0,
      },
    ],
  };

  if (!apiKey) {
    return NextResponse.json(fallback);
  }

  // ── Ask Claude to build the plan ──────────────────────────────────────────
  const systemPrompt =
    "You are THUTO — a personal football development AI for grassroots players in Zimbabwe. " +
    "You believe that players learn faster when they train together and teach each other. " +
    "You design group sessions where players alternate as demonstrator and observer, " +
    "building both technical skill and leadership confidence. " +
    "Be specific, practical, and inspiring. Use first names. Keep language simple.";

  const userPrompt = `Design a 4-drill Ubuntu partner training session for ${playerA} and ${playerB}.
Focus area: ${focus}.

Rules:
- Each drill: one player is DEMONSTRATOR (shows the skill), the other is OBSERVER (watches, mirrors, gives feedback)
- Roles must alternate — A demonstrates drills 1 & 3, B demonstrates drills 2 & 4
- Duration: drills 1 & 4 = 120 seconds, drills 2 & 3 = 90 seconds
- rest_seconds: 30 after drill 1 & 2, 20 after drill 3, 0 after drill 4 (session ends)
- coaching_cue: one sentence THUTO speaks to the OBSERVER — what to watch for
- instructions: 2 sentences, uses both player names, describes exactly what to do

Return ONLY a valid JSON array with EXACTLY 4 objects. No markdown. No extra text.
Each object must have exactly these fields:
[
  {
    "order": 1,
    "name": "drill name",
    "duration": 120,
    "instructions": "...",
    "demonstrator": "A",
    "observer": "B",
    "coaching_cue": "...",
    "rest_seconds": 30
  },
  ...
]`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: 1200,
        system:     systemPrompt,
        messages:   [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) throw new Error(`Claude error ${res.status}`);

    const data = await res.json();
    const raw  = (data?.content?.[0]?.text ?? "").trim();

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const drills = JSON.parse(cleaned) as GroupDrill[];

    if (!Array.isArray(drills) || drills.length < 2) {
      return NextResponse.json(fallback);
    }

    const plan: GroupPlan = {
      sessionId,
      focus,
      drills,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(plan);

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Plan generation failed";
    console.error("Ubuntu group-plan error:", msg);
    // Return fallback — never break the live session startup
    return NextResponse.json(fallback);
  }
}
