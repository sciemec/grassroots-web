import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_VISION_MODEL } from '@/lib/gemini';

// POST /api/analyse-general
// ─────────────────────────────────────────────────────────────────────────────
// Open-ended football analysis — no rigid drill/match format required.
// Body: { fileUri, fileName, mimeType, userNote?, token }
//
// Flow:
//   1. Check credits via Laravel GET /video-analysis/credits
//   2. Poll Gemini until file is ACTIVE (max 3 min)
//   3. Generate open-ended football analysis
//   4. Record usage via Laravel POST /video-analysis/record
//   5. Return { analysis, free_trial, is_pro }
// ─────────────────────────────────────────────────────────────────────────────

export const maxDuration = 300;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
const API_URL        = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'AI analysis is not configured. Please contact support.' },
      { status: 503 }
    );
  }

  let fileUri  = '';
  let fileName = '';
  let mimeType = 'video/mp4';
  let userNote = '';
  let token    = '';

  try {
    const body = await req.json() as Record<string, string>;
    fileUri  = body.fileUri  ?? '';
    fileName = body.fileName ?? '';
    mimeType = body.mimeType ?? 'video/mp4';
    userNote = body.userNote ?? '';
    token    = body.token    ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!fileUri) {
    return NextResponse.json({ error: 'No file URI provided.' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json(
      { error: 'Please log in to use AI analysis.', login_required: true },
      { status: 401 }
    );
  }

  // ── Check credits via Laravel ─────────────────────────────────────────────
  let canAnalyse = true;
  let freeTrial  = false;
  let isPro      = false;

  try {
    const credRes = await fetch(`${API_URL}/video-analysis/credits`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (credRes.ok) {
      const cred = await credRes.json() as { can_analyse?: boolean; free_trial?: boolean; is_pro?: boolean };
      canAnalyse = cred.can_analyse ?? true;
      freeTrial  = cred.free_trial  ?? false;
      isPro      = cred.is_pro      ?? false;
    }
  } catch {
    // Non-fatal — allow on credit check failure
  }

  if (!canAnalyse) {
    return NextResponse.json({
      error:       'free_trial_used',
      message:     'Your free trial has been used. Upgrade to Pro for unlimited AI analysis.',
      upgrade_url: '/player/subscription',
    }, { status: 402 });
  }

  // ── Poll until Gemini file is ACTIVE (max 3 min) ─────────────────────────
  if (fileName) {
    for (let i = 0; i < 36; i++) {
      await new Promise((r) => setTimeout(r, 5_000));
      try {
        const stateRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_API_KEY}`,
          { signal: AbortSignal.timeout(10_000) }
        );
        if (stateRes.ok) {
          const s = await stateRes.json() as { state?: string };
          if (s.state === 'ACTIVE') break;
        }
      } catch {
        // Continue polling
      }
    }
  }

  // ── Build open-ended prompt ───────────────────────────────────────────────
  const noteSection = userNote.trim()
    ? `\nThe person who uploaded this added a note: "${userNote.trim()}"\n`
    : '';

  const prompt = `You are a UEFA Pro Licence football analyst reviewing footage submitted by a grassroots athlete or coach in Zimbabwe.

Watch the entire video carefully. This could be ANYTHING — a full match, a training drill, street football, one player practicing alone, a goalkeeper session, a small-sided game, kids playing informally, or something else entirely. Do NOT assume a specific format.
${noteSection}
Describe what you actually observe. Return ONLY valid JSON — no markdown:
{
  "video_type": "<match|training_drill|skill_practice|small_sided_game|street_football|goalkeeper_training|fitness_session|other>",
  "context_summary": "<1-2 sentences: what is genuinely happening in this footage>",
  "participants": {
    "estimated_count": <integer>,
    "age_group": "<junior|youth|senior|mixed|unclear>",
    "level": "<grassroots|amateur|semi-pro|unclear>"
  },
  "key_observations": ["<specific observation 1>", "<specific observation 2>", "<specific observation 3>"],
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>"],
  "tactical_note": "<tactical pattern if applicable, or null if individual skill practice>",
  "standout_moment": "<one notable moment — exceptional skill, poor decision, great teamwork, or null if nothing stands out>",
  "coaching_priority": "<the single most impactful coaching point from this footage>",
  "drill_recommendation": "<one specific drill to address the main improvement area>",
  "overall_score": <integer 1-10>,
  "score_rationale": "<one sentence explaining the score>"
}

Score honestly — 5-6 is solid grassroots level. Reserve 8+ for clearly exceptional play. If the footage is too dark or blurry to assess reliably, set overall_score to 0 and explain in context_summary.`;

  // ── Generate analysis ─────────────────────────────────────────────────────
  const genRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { file_data: { mime_type: mimeType, file_uri: fileUri } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(60_000),
    }
  );

  if (!genRes.ok) {
    return NextResponse.json(
      { error: 'AI could not process the video. Please try again.' },
      { status: 502 }
    );
  }

  const genData = await genRes.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = genData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Parse JSON from response
  let analysis: Record<string, unknown> | null = null;
  try {
    analysis = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        analysis = JSON.parse(match[0]) as Record<string, unknown>;
      } catch { /* fall through */ }
    }
  }

  if (!analysis) {
    return NextResponse.json(
      { error: 'Could not parse analysis. Try a clearer or shorter clip.' },
      { status: 502 }
    );
  }

  // ── Record usage via Laravel ──────────────────────────────────────────────
  try {
    await fetch(`${API_URL}/video-analysis/record`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal:  AbortSignal.timeout(6_000),
    });
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ analysis, free_trial: freeTrial, is_pro: isPro });
}
