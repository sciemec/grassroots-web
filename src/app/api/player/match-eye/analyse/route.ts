import { NextRequest } from "next/server";
import { waitForGeminiFile, callGemini, deleteGeminiFile } from "@/lib/gemini-api";
import { FOOTBALL_DRILLS } from "@/config/gemini-drills";
import { TACTICAL_PRINCIPLES } from "@/lib/thuto-tactics-knowledge";

// Compact catalog injected into the Gemini prompt so it recommends real drill IDs.
// Uses fb_* IDs from gemini-drills.ts — these have analysis pages at /player/drills.
const DRILL_CATALOG = FOOTBALL_DRILLS.map((d) => ({
  id:        d.id,
  name:      d.name,
  positions: d.positions,
  benefit:   d.description.split(".")[0].slice(0, 100),
}));

// Compact tactics catalog — injected so Gemini can link turnovers to Tactical Academy principles
const TACTICS_CATALOG = TACTICAL_PRINCIPLES.map((p) => ({
  id:       p.id,
  title:    p.title,
  category: p.category,
  summary:  p.summary.split(".")[0].slice(0, 100),
}));

export const maxDuration = 600;
export const runtime = "nodejs";

// ── MediaPipe / YOLO optional pipeline ───────────────────────────────────────

interface PoseLandmark {
  name: string;
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

interface MediaPipeData {
  landmarks?: PoseLandmark[];
  angles?: Record<string, number>; // e.g. { knee_left: 145, hip_right: 162 }
  confidence?: number;
  frame_count?: number;
}

interface YoloResult {
  player_count?: number;
  ball_detected?: boolean;
  field_zones?: Record<string, number>; // zone → player count
  target_jersey_visible?: boolean;
}

// Call the Python AI microservice for YOLOv8 detection — skip gracefully if absent
async function tryYoloDetection(
  fileUri: string,
  fileName: string,
  jersey: string,
  geminiApiKey: string,
): Promise<YoloResult | null> {
  const aiServiceUrl = process.env.AI_SERVICE_URL;
  if (!aiServiceUrl) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(`${aiServiceUrl}/yolo/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_uri: fileUri, file_name: fileName, jersey, gemini_key: geminiApiKey }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json() as YoloResult;
  } catch {
    return null; // service unavailable — skip gracefully
  }
}

function buildPoseContext(poseData: MediaPipeData): string {
  const lines: string[] = ["\n\nMEDIAPIPE BIOMECHANICS DATA (client-side pose estimation):"];
  if (poseData.confidence != null)
    lines.push(`Detection confidence: ${(poseData.confidence * 100).toFixed(0)}%`);
  if (poseData.frame_count != null)
    lines.push(`Frames analysed: ${poseData.frame_count}`);
  if (poseData.angles && Object.keys(poseData.angles).length > 0) {
    lines.push("Joint angles (degrees):");
    for (const [joint, angle] of Object.entries(poseData.angles)) {
      lines.push(`  ${joint.replace(/_/g, " ")}: ${angle.toFixed(1)}°`);
    }
  }
  if (poseData.landmarks && poseData.landmarks.length > 0) {
    const visible = poseData.landmarks.filter((l) => (l.visibility ?? 1) > 0.5);
    lines.push(`Visible landmarks: ${visible.map((l) => l.name).join(", ")}`);
  }
  lines.push("Use this biomechanics data to add specific observations about body mechanics, posture, and movement efficiency.");
  return lines.join("\n");
}

function buildYoloContext(yolo: YoloResult, jersey: string): string {
  const lines: string[] = ["\n\nYOLOv8 COMPUTER VISION DATA (server-side object detection):"];
  if (yolo.player_count != null) lines.push(`Players detected in frame: ${yolo.player_count}`);
  if (yolo.ball_detected != null) lines.push(`Ball detected: ${yolo.ball_detected ? "yes" : "not visible"}`);
  if (yolo.target_jersey_visible != null)
    lines.push(`Target player (#${jersey}) detected: ${yolo.target_jersey_visible ? "yes" : "not reliably detected"}`);
  if (yolo.field_zones && Object.keys(yolo.field_zones).length > 0) {
    lines.push("Player distribution by field zone:");
    for (const [zone, count] of Object.entries(yolo.field_zones)) {
      lines.push(`  ${zone}: ${count} players`);
    }
  }
  lines.push("Use this detection data to enrich your positioning and physical assessment sections.");
  return lines.join("\n");
}

interface KeyMoment {
  time: string;
  type: "strength" | "weakness" | "neutral";
  description: string;
}

interface DrillRecommendation {
  drill_id?: string | null;
  drill: string;
  why: string;
  frequency: string;
}

interface TurnoverMoment {
  time:            string;
  decision:        string;
  consequence:     string;
  principle_id:    string;
  principle_title: string;
  principle_fix:   string;
  safety_flag:     boolean;
  safety_note?:    string;
}

interface PlayerAnalysis {
  overall_rating: number;
  performance_summary: string;
  key_moments: KeyMoment[];
  technical_strengths: string[];
  areas_to_improve: string[];
  positioning_analysis: string;
  physical_assessment: string;
  tactical_understanding: string;
  drill_recommendations: DrillRecommendation[];
  turnover_moments?: TurnoverMoment[];
  scout_note: string;
}

function extractJSON(text: string): PlayerAnalysis | null {
  try {
    return JSON.parse(text) as PlayerAnalysis;
  } catch {
    const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (mdMatch) {
      try { return JSON.parse(mdMatch[1]) as PlayerAnalysis; } catch { /* fall through */ }
    }
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]) as PlayerAnalysis; } catch { /* fall through */ }
    }
    return null;
  }
}


export async function POST(req: NextRequest) {
  try {
    const {
      fileUri, fileName, mimeType, fileState,
      sport, position, jersey, focusQuestion,
      poseData,
    } = await req.json() as {
      fileUri: string;
      fileName: string;
      mimeType: string;
      fileState?: string;
      sport?: string;
      position?: string;
      jersey?: string;
      focusQuestion?: string;
      poseData?: MediaPipeData | null; // optional — sent by client after MediaPipe processing
    };

    if (!fileUri || !fileName) {
      return Response.json({ error: "No file URI provided" }, { status: 400 });
    }

    const googleKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    // Run YOLO detection concurrently with Gemini file polling — both are async waits
    const yoloPromise = tryYoloDetection(fileUri, fileName, jersey ?? "", googleKey);

    if (fileState !== "ACTIVE") {
      await waitForGeminiFile(fileName, googleKey, 10);
    }

    // Collect YOLO result (already capped at 15 s internally — should be ready by now)
    const yoloResult = await yoloPromise;

    const sportLabel    = sport     || "Football";
    const positionLabel = position  || "player";
    const jerseyLabel   = jersey    ? ` (Jersey #${jersey})` : "";
    const focusLabel    = focusQuestion
      ? `\n\nCoach focus: "${focusQuestion}" — pay particular attention to this.`
      : "";

    const isFootball = sportLabel.toLowerCase() === "football";
    const drillInstructions = isFootball
      ? "Pick the BEST matching drill from the DRILL CATALOG below by ID. Set drill_id to that ID and drill to that drill's name. If no catalog drill fits the weakness, set drill_id to null and invent a suitable drill name."
      : `No drill catalog exists for ${sportLabel} — set drill_id to null for all recommendations and invent ${sportLabel}-specific drill names based on the weaknesses you observe.`;
    const drillCatalogSection = isFootball
      ? `DRILL CATALOG — match weaknesses to these drills by ID:\n${JSON.stringify(DRILL_CATALOG)}\n`
      : "";

    // Build supplementary context from any available model outputs
    const poseContext = poseData && Object.keys(poseData).length > 0
      ? buildPoseContext(poseData)
      : "";
    const yoloContext = yoloResult
      ? buildYoloContext(yoloResult, jersey ?? "")
      : "";

    const systemPrompt = `You are an expert ${sportLabel} coach reviewing footage of an individual player.
Player: ${positionLabel}${jerseyLabel}${focusLabel}${poseContext}${yoloContext}

Watch the full video carefully. Focus entirely on this one player's individual performance — their movement, technical execution, decision-making, positioning relative to teammates and opponents, work rate, and standout moments.

Return ONLY a valid JSON object — no markdown, no explanation — with this exact structure:
{
  "overall_rating": 7,
  "performance_summary": "2-3 sentence overview of the player's overall performance in this footage",
  "key_moments": [
    { "time": "12:30", "type": "strength", "description": "Specific action — what happened and why it was good" },
    { "time": "23:45", "type": "weakness", "description": "Specific action — what went wrong and why" },
    { "time": "38:10", "type": "neutral", "description": "Neutral observation about positioning or decision" }
  ],
  "technical_strengths": [
    "Specific technical quality observed — be precise, not generic",
    "Another technical strength"
  ],
  "areas_to_improve": [
    "Specific technical weakness — describe exactly what needs fixing",
    "Another area needing work"
  ],
  "positioning_analysis": "Paragraph: where did the player position themselves? Good movements, bad movements. Were they in the right place at the right time?",
  "physical_assessment": "Paragraph: pace, stamina, physicality, aerial ability. What physical qualities stood out positively or negatively?",
  "tactical_understanding": "Paragraph: decision-making, reading the game, understanding of their role. Did they make smart choices?",
  "drill_recommendations": [
    { "drill_id": "eng_st_01", "drill": "Lions' Den Central Turning", "why": "Why this drill addresses what was seen", "frequency": "3x per week" },
    { "drill_id": null, "drill": "Generic drill if no catalog match", "why": "Why", "frequency": "Daily" }
  ],
  "turnover_moments": [
    {
      "time": "34:15",
      "decision": "Dribbled into a congested area with three defenders surrounding them instead of playing the ball early",
      "consequence": "Ball was lost in a dangerous midfield position, triggering a counter-attack",
      "principle_id": "pass-and-move",
      "principle_title": "Pass and Move",
      "principle_fix": "Releasing the ball earlier and making a supporting run would have kept possession and opened space",
      "safety_flag": true,
      "safety_note": "Being dispossessed while surrounded in a tight space increases collision risk — scan before receiving and know your exit pass"
    }
  ],
  "scout_note": "One sentence a scout would write — honest, professional, specific to what was seen"
}

overall_rating: 1 (very poor) to 10 (exceptional). Be honest — most grassroots players are 4-7.
key_moments: include 3-6 moments with accurate timestamps.
technical_strengths and areas_to_improve: 3-5 items each — specific to THIS player in THIS video.
drill_recommendations: 2-4 drills specific to ${sportLabel}. ${drillInstructions}
turnover_moments: identify 0-3 moments where a poor decision directly caused a loss of possession. For each, describe the exact decision and its consequence, then pick the MOST relevant principle from the TACTICS CATALOG by ID. Set safety_flag to true only when the player was dispossessed under heavy physical pressure in a tight area (collision risk). If no clear turnovers are visible, return an empty array [].
Base everything on what you actually see in the video.

${drillCatalogSection}TACTICS CATALOG — match turnover decisions to these principles by ID:
${JSON.stringify(TACTICS_CATALOG)}`;

    const geminiText = await callGemini(
      googleKey,
      [
        { text: systemPrompt },
        { file_data: { mime_type: mimeType, file_uri: fileUri } },
        { text: "Now provide your complete JSON analysis of this player's performance." },
      ],
      { temperature: 0.2, maxOutputTokens: 4096 }
    );
    // Clean up uploaded Gemini file (fire-and-forget)
    deleteGeminiFile(fileName, googleKey);

    const analysis = extractJSON(geminiText);

    if (!analysis) {
      const isEmpty = geminiText.trim() === "";
      return Response.json(
        {
          error: isEmpty
            ? "Gemini couldn't analyse this clip — try a clearer angle or shorter clip"
            : "Gemini returned unreadable analysis",
          raw: geminiText.slice(0, 500),
        },
        { status: 502 }
      );
    }

    // ── Gemini personal coaching narrative ───────────────────────────────────
    let narrative = "";

    try {
      narrative = await callGemini(
        googleKey,
        [{
          text: `You are a personal sports coach writing feedback directly to a ${sportLabel} player.

Player: ${positionLabel}${jerseyLabel}
AI Vision Analysis (from the video):
${JSON.stringify(analysis, null, 2)}

Write a personal 3-paragraph coaching message directly to the player (use "you"):
1. What you did well — celebrate the genuine strengths you saw
2. Where you need to grow — honest, specific, kind — reference real moments from the video
3. Your action plan — exactly what to work on before the next session, with one priority drill

Write as a coach who knows this player and cares about their development. Be direct, specific, and encouraging. No generic advice. Reference what was actually seen in the video. Plain text only — no markdown.`,
        }],
        { temperature: 0.4, maxOutputTokens: 1024 }
      );
    } catch {
      // narrative is optional — silently skip if Gemini call fails
    }

    return Response.json({ analysis, narrative });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (
      message.includes("input token count") ||
      message.includes("1048576") ||
      message.includes("token limit") ||
      message.includes("context limit") ||
      message.includes("too long for model") ||
      message.includes("exceeds the maximum")
    ) {
      return Response.json(
        { error: "Video is too long for analysis. Upload a clip under 15 minutes for best results." },
        { status: 422 }
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
