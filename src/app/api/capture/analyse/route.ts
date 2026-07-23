/**
 * POST /api/capture/analyse
 *
 * THUTO (and AMARA for female players) analyses a skill clip using Gemini Vision.
 * Returns a drill score, qualitative coaching feedback, and a 3-exercise practice plan.
 *
 * Body:
 *   frame            — base64 JPEG (from canvas frame extraction)
 *   drill            — e.g. "First Touch & Control"
 *   focus            — drill-specific focus areas
 *   playerName       — player's first name
 *   position         — e.g. "striker" (optional)
 *   gender           — "male" | "female" (optional — activates AMARA layer for female)
 *   age_group        — e.g. "U17" (optional — age-appropriate coaching tone)
 *   videoUrl         — R2 public URL (optional — for record keeping)
 *
 * Returns:
 *   { drill_score, strength, correction, drillRecommendation, practice_plan }
 */

import { NextRequest, NextResponse } from "next/server";
import { geminiVision, geminiText } from "@/lib/gemini";

interface AnalyseBody {
  frame?:       string;
  drill:        string;
  focus?:       string;
  playerName?:  string;
  position?:    string;
  gender?:      string;
  age_group?:   string;
  videoUrl?:    string | null;
}

interface PracticeExercise {
  name:        string;
  duration:    string;
  reps:        string;
  description: string;
  why:         string;
}

interface FeedbackResult {
  drill_score:          number;
  strength:             string;
  correction:           string;
  drillRecommendation:  string;
  practice_plan: {
    title:     string;
    exercises: PracticeExercise[];
  };
}

export async function POST(req: NextRequest) {
  let body: AnalyseBody;
  try {
    body = (await req.json()) as AnalyseBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    frame,
    drill       = "Football skill",
    focus       = "technique, body position, movement",
    playerName  = "Player",
    position    = "footballer",
    gender      = "",
    age_group   = "",
  } = body;

  if (!drill) {
    return NextResponse.json({ error: "drill is required" }, { status: 400 });
  }

  const isFemalPlayer = gender === "female";

  // ── AMARA layer (injected for female players) ─────────────────────────────
  const amaraAddition = isFemalPlayer
    ? " You are also AMARA — the female coaching layer. For female players: " +
      "mention ACL prevention cues where relevant (hip position, knee tracking, landing mechanics). " +
      "Reference Zimbabwean female role models (Chido Dzingirai, Linda Mutsakani) when encouraging. " +
      "Acknowledge that female grassroots players often train with limited resources and support. " +
      "Always reinforce that elite female football is a real pathway — NCAA scholarships, WAFCON, Cosafa Women's."
    : "";

  // ── Age-group tone ────────────────────────────────────────────────────────
  const ageTone = age_group
    ? ` The player is in the ${age_group} age group — adjust complexity of feedback accordingly.`
    : "";

  // ── System prompt ─────────────────────────────────────────────────────────
  const systemPrompt =
    "You are THUTO — a personal football development AI for grassroots players in Zimbabwe. " +
    "You speak warmly, directly, and with belief in every player. " +
    "You know that this player might be training on a dirt pitch in Chitungwiza or Bulawayo " +
    "with no professional coaching. Your feedback can change their career. " +
    "Be specific — never generic. Always end with encouragement." +
    amaraAddition +
    ageTone;

  // ── User prompt ───────────────────────────────────────────────────────────
  const drillContext = frame
    ? `You are reviewing a video frame of ${playerName}, a ${position}${isFemalPlayer ? " (female)" : ""} from Zimbabwe, performing ${drill}.
The player wants specific feedback on: ${focus}.
Look carefully at the frame. Analyse their actual technique — not what you assume they did.`
    : `${playerName} is a ${position}${isFemalPlayer ? " (female)" : ""} from Zimbabwe. They have been practising ${drill}.
The technique focus areas for this skill are: ${focus}.
Without seeing their specific footage, give general THUTO coaching feedback.`;

  const responseFormat = `
Return a JSON object with EXACTLY these fields (no markdown, no extra text):
{
  "drill_score": <number 1.0–10.0 reflecting overall technique quality>,
  "strength": "One specific thing they did well${frame ? " — reference what you can see" : " for players practising this drill"}.",
  "correction": "One specific thing to improve — kind and precise. Tell them exactly what to change and why.",
  "drillRecommendation": "One concrete drill they can do alone, right now. Name it, explain in 2 sentences. Simple equipment.",
  "practice_plan": {
    "title": "Short encouraging title for this practice block",
    "exercises": [
      {
        "name": "Exercise name",
        "duration": "e.g. 10 min",
        "reps": "e.g. 3 sets of 20",
        "description": "How to do it — simple, clear, no jargon.",
        "why": "One sentence on why this fixes the correction above."
      }
    ]
  }
}
The practice_plan must have exactly 3 exercises, each directly targeting the correction you identified.`;

  const userPrompt = `${drillContext}\n${responseFormat}`;

  // ── Fallback when no API key ──────────────────────────────────────────────
  if (!process.env.GEMINI_API_KEY) {
    const fallback: FeedbackResult = {
      drill_score: 6.0,
      strength: `You showed up and put in the work on your ${drill.toLowerCase()}. That discipline is what separates players who improve.`,
      correction: `Focus on your body shape when performing ${drill.toLowerCase()}. Keep your knees slightly bent and your weight balanced — this gives you more control.`,
      drillRecommendation: `Wall pass drill: stand 3 metres from a wall. Pass the ball and control the return with your first touch, alternating feet. 3 sets of 20 reps daily.`,
      practice_plan: {
        title: `${drill} — Practice Block`,
        exercises: [
          {
            name: "Wall Pass Drill",
            duration: "10 min",
            reps: "3 sets of 20",
            description: "Stand 3 metres from a wall. Pass firmly and control the return with your first touch, alternating feet each rep.",
            why: "Builds the muscle memory for quick, balanced first touches under pressure.",
          },
          {
            name: "Cone Dribble Circuit",
            duration: "10 min",
            reps: "5 circuits",
            description: "Place 5 stones or cones 1 metre apart. Dribble through with the inside and outside of each foot. No stopping.",
            why: "Develops close ball control and the body shape you need for ${drill.toLowerCase()}.",
          },
          {
            name: "Shadow Technique",
            duration: "5 min",
            reps: "3 sets of 10",
            description: "Perform the ${drill.toLowerCase()} movement slowly without a ball at 50% speed. Focus on each body position.",
            why: "Slow repetition locks in correct mechanics before adding ball and speed.",
          },
        ],
      },
    };
    return NextResponse.json(fallback);
  }

  // ── Call Gemini ───────────────────────────────────────────────────────────
  try {
    const raw = frame
      ? await geminiVision(systemPrompt, [frame], userPrompt, { max_tokens: 1000 })
      : await geminiText(systemPrompt, [{ role: "user", content: userPrompt }], { max_tokens: 1000 });

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let feedback: FeedbackResult;
    try {
      feedback = JSON.parse(cleaned) as FeedbackResult;
    } catch {
      // Gemini returned narrative — wrap gracefully
      feedback = {
        drill_score: 6.0,
        strength: `Great work recording yourself — that alone shows commitment. ${raw.slice(0, 180)}`,
        correction: "Focus on your body position and balance throughout the movement.",
        drillRecommendation: "Slow-motion shadow drill: perform the skill at 50% speed, 3 sets of 5 reps, focusing on each body position.",
        practice_plan: {
          title: `${drill} — Practice Block`,
          exercises: [
            {
              name: "Shadow Technique",
              duration: "10 min",
              reps: "3 sets of 10",
              description: `Perform the ${drill.toLowerCase()} movement slowly without a ball at 50% speed. Focus on your body position at each stage.`,
              why: "Slow repetition locks in correct mechanics before adding speed.",
            },
            {
              name: "Wall Pass Drill",
              duration: "10 min",
              reps: "3 sets of 20",
              description: "Stand 3 metres from a wall. Pass the ball and control the return with your first touch, alternating feet.",
              why: "Builds the fundamental ball control that underpins all technique.",
            },
            {
              name: "Cone Dribble Circuit",
              duration: "5 min",
              reps: "5 circuits",
              description: "Place 5 stones 1 metre apart. Dribble through with inside and outside of each foot. No stopping.",
              why: "Develops close control and the body shape needed for this drill.",
            },
          ],
        },
      };
    }

    // Validate required fields
    if (
      feedback.drill_score === undefined ||
      !feedback.strength ||
      !feedback.correction ||
      !feedback.drillRecommendation ||
      !feedback.practice_plan?.exercises?.length
    ) {
      throw new Error("Incomplete feedback from Gemini");
    }

    // Clamp score to valid range
    feedback.drill_score = Math.max(1, Math.min(10, Number(feedback.drill_score) || 6));

    return NextResponse.json(feedback);

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    console.error("THUTO capture analyse error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
