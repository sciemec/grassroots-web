// src/app/api/gemini-drill-analysis/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Runs a Gemini 2.0 Flash drill analysis on a previously-uploaded video.
//
// Flow:
//   1. Browser uploads video directly to Google (via /api/match-eye/upload URL)
//   2. Browser calls this route with { fileUri, fileName, drillId }
//   3. This route polls until the file is ACTIVE, then runs the drill prompt
//   4. Returns structured DrillResult JSON
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { getDrillById } from '@/config/gemini-drills';
import { waitForGeminiFile, callGemini, deleteGeminiFile } from '@/lib/gemini-api';

export const maxDuration = 300; // 5 min — Gemini can take time on longer clips

function extractJson(text: string): Record<string, unknown> | null {
  // Try direct parse
  try { return JSON.parse(text); } catch { /* fall through */ }
  // Strip markdown code block
  const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (mdMatch) {
    try { return JSON.parse(mdMatch[1]); } catch { /* fall through */ }
  }
  // Find first { ... } block
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch { /* fall through */ }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const googleKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const { fileUri, fileName, drillId } = await req.json() as {
      fileUri: string;
      fileName: string;
      drillId: string;
    };

    if (!fileUri || !fileName || !drillId) {
      return NextResponse.json({ error: 'Missing fileUri, fileName, or drillId' }, { status: 400 });
    }

    const drill = getDrillById(drillId);
    if (!drill) {
      return NextResponse.json({ error: `Unknown drill: ${drillId}` }, { status: 400 });
    }

    // Wait for Gemini to finish processing the uploaded file (3 min timeout)
    await waitForGeminiFile(fileName, googleKey, 3);

    // Run the drill-specific Gemini prompt.
    // 2048 tokens: drill schemas have 4+ score objects with observation sentences
    // plus 4 top-level text fields — 1024 was tight enough to cause mid-JSON truncation.
    const rawText = await callGemini(
      googleKey,
      [
        { file_data: { mime_type: 'video/mp4', file_uri: fileUri } },
        { text: drill.geminiPrompt },
      ],
      { temperature: 0.3, maxOutputTokens: 2048 }
    );

    // Clean up the uploaded file (fire and forget)
    deleteGeminiFile(fileName, googleKey);

    const parsed = extractJson(rawText);
    if (!parsed) {
      // Distinguish the two failure modes so Render logs show which one fired:
      // - Empty string → Gemini refused (safety filter / video quality / content policy)
      // - Non-empty but unparseable → truncated or malformed JSON (token limit or retry)
      const isEmpty = rawText.trim() === '';
      const failureMode = isEmpty ? 'safety_refusal' : 'malformed_json';
      console.error(
        `[gemini-drill] parse failed — mode: ${failureMode}, drill: ${drillId}`,
        isEmpty ? '(empty response)' : `raw (first 500 chars): ${rawText.slice(0, 500)}`
      );
      return NextResponse.json(
        {
          error: isEmpty
            ? "Gemini couldn't analyse this clip — try a clearer angle or shorter video"
            : 'Could not parse Gemini response',
          failureMode,
          raw: rawText,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      drillId,
      drillName: drill.name,
      sport: drill.sport,
      passportLabel: drill.passportLabel,
      ...parsed,
      analysedAt: new Date().toISOString(),
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
