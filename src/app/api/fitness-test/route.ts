import { NextRequest } from "next/server";

// Allow up to 5 minutes — Python MediaPipe analysis can take 60-120s on cold start.
// This proxy sits between the browser and the Python AI service so the browser's
// connection is to the fast Next.js edge (no Render 30s limit), not the slow Python pod.
export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const testType = searchParams.get("test_type") ?? "jump";
  const ageGroup = searchParams.get("age_group") ?? "senior";

  const aiUrl = process.env.AI_URL ?? process.env.NEXT_PUBLIC_AI_URL ?? "";
  if (!aiUrl) {
    return Response.json(
      { detail: "AI service URL not configured (AI_URL env var missing)" },
      { status: 500 }
    );
  }

  // Route to the correct Python endpoint
  const SKILL_DRILLS = new Set([
    "shooting", "passing", "tackling", "dribbling", "first_touch",
    "free_kick", "heading", "crossing", "ball_juggling", "throw_in", "rebound_turn_strike",
  ]);
  const targetUrl =
    testType === "ball_mastery"
      ? `${aiUrl}/analyse-drill?drill_type=general&age_group=${ageGroup}&mode=gemini`
      : SKILL_DRILLS.has(testType)
        ? `${aiUrl}/analyse-drill?drill_type=${testType}&age_group=${ageGroup}`
        : `${aiUrl}/athletic-test?test_type=${testType}&age_group=${ageGroup}`;

  // Forward the raw multipart body (preserves boundary header)
  const body        = await req.arrayBuffer();
  const contentType = req.headers.get("content-type") ?? "multipart/form-data";

  // Abort after 270 s — gives MediaPipe up to 4.5 min, safely under the
  // Next.js maxDuration=300 cap, so the browser always gets a clear error
  // instead of a silent connection drop.
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 270_000);

  let pyRes: Response;
  try {
    pyRes = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    const msg       = err instanceof Error ? err.message : String(err);
    return Response.json(
      { detail: isTimeout
          ? "AI analysis timed out — please try a shorter clip (under 60 seconds)"
          : `Could not reach AI service: ${msg}` },
      { status: isTimeout ? 504 : 502 }
    );
  }
  clearTimeout(timeoutId);

  const text        = await pyRes.text();
  const resType     = pyRes.headers.get("content-type") ?? "application/json";

  return new Response(text, {
    status:  pyRes.status,
    headers: { "Content-Type": resType },
  });
}
