import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

const DRILLS: Record<string, { name: string; metrics: string[] }> = {
  sprint_10m:      { name: "Short Sprint (10m)",      metrics: ["trunk_lean", "knee_drive", "heel_recovery"] },
  cut_505:         { name: "Change of Direction 505",  metrics: ["knee_valgus", "bilateral_asymmetry", "amortization_ms"] },
  drop_jump:       { name: "Step-Off Jump",            metrics: ["landing_stiffness", "knee_valgus", "bilateral_asymmetry"] },
  header:          { name: "Jump Header",              metrics: ["arm_swing", "bilateral_asymmetry", "landing_stiffness"] },
  lateral_shuffle: { name: "Side-Step Speed",          metrics: ["trunk_lean", "bilateral_asymmetry", "heel_recovery"] },
  dribble_sprint:  { name: "Dribble Sprint",           metrics: ["trunk_lean", "knee_drive", "heel_recovery"] },
};

const METRIC_LABELS: Record<string, string> = {
  trunk_lean:          "Body Lean — forward lean during movement (0–100, higher is better)",
  knee_drive:          "Knee Drive — how high the knees lift during running (0–100, higher is better)",
  heel_recovery:       "Heel Pull-Back — heel snapping under hips quickly (0–100, higher is better)",
  knee_valgus:         "Knee Cave — inward knee collapse on landing or cutting (0–100, LOWER is better — 0 means no collapse)",
  bilateral_asymmetry: "Left-Right Imbalance — difference between left and right sides (0–100, LOWER is better — 0 means perfectly balanced)",
  amortization_ms:     "Ground Contact Time — time spent on ground before switching direction in ms (0–100, LOWER is better — lower ms = faster switch)",
  landing_stiffness:   "Landing Control — quality of shock absorption on landing (0–100, higher means softer safer landing)",
  arm_swing:           "Arm Swing — upward arm drive during jump takeoff (0–100, higher is better)",
};

async function waitForFileActive(fileName: string): Promise<void> {
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5_000));
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_API_KEY}`,
        { signal: AbortSignal.timeout(8_000) },
      );
      if (res.ok) {
        const s = (await res.json()) as { state?: string };
        if (s.state === "ACTIVE") return;
      }
    } catch { /* keep polling */ }
  }
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI analysis is not configured." }, { status: 503 });
  }

  const { fileUri, fileName, mimeType, drillId } = (await req.json()) as {
    fileUri: string;
    fileName: string;
    mimeType: string;
    drillId: string;
  };

  if (!fileUri) return NextResponse.json({ error: "No file URI provided." }, { status: 400 });

  const drill = DRILLS[drillId] ?? DRILLS["sprint_10m"];

  if (fileName) await waitForFileActive(fileName);

  const metricsList = drill.metrics
    .map((m) => `- "${m}": ${METRIC_LABELS[m] ?? m}`)
    .join("\n");

  const prompt =
    `You are an elite sports biomechanics coach analysing a grassroots athlete in Zimbabwe.\n\n` +
    `Watch this video of an athlete performing the "${drill.name}" drill.\n\n` +
    `Score ONLY these specific movement metrics from 0 to 100:\n${metricsList}\n\n` +
    `Also provide:\n` +
    `- performance_index: overall explosive output score 0–100\n` +
    `- resilience_index: joint control and injury-resistance score 0–100 (higher = more resilient)\n` +
    `- flags: array of 0–3 specific concerns observed (use these keys if relevant: ` +
    `"knee_valgus", "bilateral_asymmetry", "heel_recovery_poor", "arm_swing_weak", "landing_too_stiff", "trunk_too_upright")\n\n` +
    `Return ONLY valid JSON with no markdown or explanation:\n` +
    `{"metrics":{"trunk_lean":72},"performance_index":68,"resilience_index":74,"flags":[]}\n\n` +
    `If video quality is too poor to assess a metric reliably, score it 50. Be honest — do not fabricate observations.`;

  const genRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { file_data: { mime_type: mimeType, file_uri: fileUri } },
            { text: prompt },
          ],
        }],
        generationConfig: { maxOutputTokens: 400, temperature: 0.1 },
      }),
      signal: AbortSignal.timeout(90_000),
    },
  );

  if (!genRes.ok) {
    return NextResponse.json({ error: "AI could not process the video. Try a shorter clip." }, { status: 502 });
  }

  const genData = (await genRes.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw = genData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  let parsed: {
    metrics: Record<string, number>;
    performance_index: number;
    resilience_index: number;
    flags: string[];
  };
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Could not parse AI response. Try again." }, { status: 502 });
  }

  const metrics: Record<string, number> = {};
  for (const m of drill.metrics) {
    metrics[m] = Math.round(Math.min(100, Math.max(0, parsed.metrics?.[m] ?? 50)));
  }

  return NextResponse.json({
    id: 1,
    metrics,
    performance_index: Math.round(Math.min(100, Math.max(0, parsed.performance_index ?? 60))),
    resilience_index:  Math.round(Math.min(100, Math.max(0, parsed.resilience_index  ?? 60))),
    flags: Array.isArray(parsed.flags) ? parsed.flags.slice(0, 3) : [],
  });
}
