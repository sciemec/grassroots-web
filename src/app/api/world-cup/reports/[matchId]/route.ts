// src/app/api/world-cup/reports/[matchId]/route.ts
// Generates a tactical report on-demand via Gemini AI, with R2 as a write-through cache.
// If R2 is configured and a cached report exists, it is served immediately.
// Otherwise, Gemini generates it fresh (and caches it in R2 for next time if R2 is available).

export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

function getR2(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const keyId     = process.env.R2_ACCESS_KEY_ID;
  const secret    = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !keyId || !secret) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: keyId, secretAccessKey: secret },
  });
}

const BUCKET = process.env.R2_BUCKET ?? 'grassroots-videos';

async function getFromR2(matchId: string) {
  const r2 = getR2();
  if (!r2) return null;
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: `tactical-reports/${matchId}.json` }));
    const body = await res.Body?.transformToString();
    return body ? JSON.parse(body) : null;
  } catch {
    return null;
  }
}

async function saveToR2(matchId: string, report: object) {
  const r2 = getR2();
  if (!r2) return;
  try {
    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `tactical-reports/${matchId}.json`,
      Body: JSON.stringify(report),
      ContentType: 'application/json',
    }));
  } catch { /* non-critical — report still returned to user */ }
}

async function generateWithGemini(matchContext: string): Promise<{ report: object | null; debug?: string }> {
  const geminiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
  if (!geminiKey) return { report: null, debug: 'no_api_key' };

  const prompt = `You are an expert football tactical analyst. Analyse this World Cup 2026 match and produce a structured tactical report.

Match: ${matchContext}

Return ONLY valid JSON with this exact shape:
{
  "available": true,
  "summary": "2-3 sentence match narrative",
  "phases": [
    {
      "id": "phase_1",
      "title": "Phase 1 title (e.g. 'High Press Domination')",
      "minute_range": "0-30",
      "description": "Tactical description of this phase",
      "key_event": "Most important moment in this phase",
      "home_advantage": true
    },
    {
      "id": "phase_2",
      "title": "Phase 2 title",
      "minute_range": "31-60",
      "description": "Tactical description",
      "key_event": "Key moment",
      "home_advantage": false
    },
    {
      "id": "phase_3",
      "title": "Phase 3 title",
      "minute_range": "61-90",
      "description": "Tactical description",
      "key_event": "Key moment",
      "home_advantage": true
    }
  ],
  "tactical_insights": ["Insight 1", "Insight 2", "Insight 3"],
  "what_would_you_do": {
    "scenario": "A key tactical situation from this match",
    "options": ["Option A", "Option B", "Option C"],
    "correct": 0,
    "explanation": "Why this was the correct call"
  },
  "home_rating": 7.5,
  "away_rating": 6.5
}

Return only the JSON, no markdown.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      return { report: null, debug: `gemini_${res.status}: ${errBody.slice(0, 200)}` };
    }
    const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { report: null, debug: `no_json_in_response: ${text.slice(0, 100)}` };
    const report = JSON.parse(jsonMatch[0]);
    return { report };
  } catch (e) {
    return { report: null, debug: `exception: ${e instanceof Error ? e.message : String(e)}` };
  }
}

// In-memory cache — avoids re-generating for every visitor during the same server process lifecycle
const memCache = new Map<string, object>();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  if (!matchId) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  // 1. Memory cache (fastest)
  if (memCache.has(matchId)) {
    return NextResponse.json(memCache.get(matchId));
  }

  // 2. R2 cache (persistent across cold starts)
  const cached = await getFromR2(matchId);
  if (cached) {
    memCache.set(matchId, cached);
    return NextResponse.json(cached);
  }

  // 3. Generate on-demand via Gemini
  const url = new URL(req.url);
  const matchContext = url.searchParams.get('context') ?? `World Cup 2026 match ${matchId}`;
  const { report, debug } = await generateWithGemini(matchContext);

  if (!report) {
    return NextResponse.json({ available: false, error: 'Could not generate report', debug });
  }

  // Write-through cache: save to R2 so future requests are instant
  await saveToR2(matchId, report);
  memCache.set(matchId, report);

  return NextResponse.json(report);
}
