import { NextRequest } from "next/server";

export const maxDuration = 300;
export const runtime = "nodejs";

interface JointScore {
  rating: "strong" | "good" | "fair" | "weak";
  note: string;
}

export interface DrillAnalysis {
  posture_score: number;
  movement_efficiency: number;
  joint_scores: {
    knee_drive: JointScore;
    hip_extension: JointScore;
    arm_mechanics: JointScore;
    trunk_alignment: JointScore;
    foot_strike: JointScore;
  };
  strengths: string[];
  improvements: string[];
  drill_specific_tip: string;
  overall_assessment: string;
}

const DRILL_CONTEXT: Record<string, string> = {
  sprint:
    "Sprint technique — analyse stride length, knee drive height, arm mechanics, forward lean angle, foot strike pattern, and hip extension through the drive phase.",
  dribbling:
    "Dribbling technique — analyse body position over the ball, head position, touch quality, change of direction mechanics, low centre of gravity maintenance, and shoulder drop.",
  shooting:
    "Shooting technique — analyse plant foot position, striking foot contact point, body lean at contact, follow-through, hip rotation, and balance through the shot.",
  jumping:
    "Jumping and heading technique — analyse approach run, take-off mechanics, knee bend depth, arm swing contribution, peak height body shape, and landing mechanics.",
  passing:
    "Passing technique — analyse support foot placement, ankle lock, hip opening, body shape at contact, follow-through direction, and weight transfer.",
  defending:
    "Defending technique — analyse defensive stance width, centre of gravity height, jockeying footwork, shoulder orientation, timing of challenge, and recovery run mechanics.",
  first_touch:
    "First touch technique — analyse body orientation before receiving, cushioning mechanics, foot/chest/thigh surface used, touch direction, and subsequent movement.",
  heading:
    "Heading technique — analyse approach angle, take-off timing, neck and core tension at contact, eye-on-ball tracking, forehead contact point, and power generation from core.",
};

function extractJSON(text: string): DrillAnalysis | null {
  try {
    return JSON.parse(text) as DrillAnalysis;
  } catch {
    const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (mdMatch) {
      try {
        return JSON.parse(mdMatch[1]) as DrillAnalysis;
      } catch {
        /* fall through */
      }
    }
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]) as DrillAnalysis;
      } catch {
        /* fall through */
      }
    }
    return null;
  }
}

async function waitForFileActive(
  fileName: string,
  googleKey: string
): Promise<void> {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${googleKey}`
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `File state check failed: ${res.status} — ${body.slice(0, 300)}`
      );
    }
    const data = (await res.json()) as { state: string };
    if (data.state === "ACTIVE") return;
    if (data.state === "FAILED")
      throw new Error("Gemini file processing failed");
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Video did not become ready within 5 minutes");
}

export async function POST(req: NextRequest) {
  try {
    const { fileUri, fileName, mimeType, drillType } = (await req.json()) as {
      fileUri: string;
      fileName: string;
      mimeType: string;
      drillType: string;
    };

    if (!fileUri || !fileName) {
      return Response.json({ error: "fileUri and fileName are required" }, { status: 400 });
    }

    const googleKey =
      process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return Response.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    await waitForFileActive(fileName, googleKey);

    const drillContext =
      DRILL_CONTEXT[drillType] ??
      "General athletic movement — analyse overall body mechanics, balance, coordination, and movement efficiency.";

    const prompt = `You are an elite sports biomechanics coach analysing a grassroots Zimbabwean athlete.

Drill being performed: ${drillType.toUpperCase().replace(/_/g, " ")}
Focus: ${drillContext}

Watch the complete video carefully. Assess the athlete's body position, movement mechanics, and technique throughout.

Return ONLY a valid JSON object — no markdown, no explanation:
{
  "posture_score": <integer 0-100>,
  "movement_efficiency": <integer 0-100>,
  "joint_scores": {
    "knee_drive":       { "rating": "<strong|good|fair|weak>", "note": "<one specific observation>" },
    "hip_extension":    { "rating": "<strong|good|fair|weak>", "note": "<one specific observation>" },
    "arm_mechanics":    { "rating": "<strong|good|fair|weak>", "note": "<one specific observation>" },
    "trunk_alignment":  { "rating": "<strong|good|fair|weak>", "note": "<one specific observation>" },
    "foot_strike":      { "rating": "<strong|good|fair|weak>", "note": "<one specific observation>" }
  },
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific numbered improvement 1>", "<specific numbered improvement 2>", "<specific numbered improvement 3>"],
  "drill_specific_tip": "<one concrete coaching cue for this drill type>",
  "overall_assessment": "<2-3 sentences: what level this athlete is at and what their biggest opportunity is>"
}

Be specific to what you see in the video. If visibility is limited, note it in your assessment.
Score honestly — 60-75 is good for grassroots level. Reserve 85+ for clearly exceptional technique.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${googleKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { file_data: { mime_type: mimeType, file_uri: fileUri } },
                {
                  text: "Provide your complete JSON biomechanics analysis now.",
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return Response.json(
        { error: `Gemini API error: ${geminiRes.status}`, detail: errText },
        { status: 502 }
      );
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const rawText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const analysis = extractJSON(rawText);

    if (!analysis) {
      return Response.json(
        {
          error: "Gemini returned unreadable analysis",
          raw: rawText.slice(0, 500),
        },
        { status: 502 }
      );
    }

    return Response.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
