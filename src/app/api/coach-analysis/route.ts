import { NextRequest } from "next/server";

export const maxDuration = 300;
export const runtime = "nodejs";

// Allow-list — only these Python endpoints can be called through this proxy.
const ALLOWED_ENDPOINTS = new Set([
  "/coach-analysis/fatigue",
  "/coach-analysis/injury-risk",
  "/coach-analysis/first-touch",
  "/coach-analysis/sprint-mechanics",
  "/coach-analysis/set-piece",
  "/coach-analysis/match-readiness",
]);

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint") ?? "";

  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return Response.json({ detail: `Unknown analysis endpoint: ${endpoint}` }, { status: 400 });
  }

  const aiUrl = process.env.AI_URL ?? process.env.NEXT_PUBLIC_AI_URL ?? "";
  if (!aiUrl) {
    return Response.json(
      { detail: "AI service URL not configured (AI_URL env var missing)" },
      { status: 500 }
    );
  }

  const body        = await req.arrayBuffer();
  const contentType = req.headers.get("content-type") ?? "multipart/form-data";

  let pyRes: Response;
  try {
    pyRes = await fetch(`${aiUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ detail: `Could not reach AI service: ${msg}` }, { status: 502 });
  }

  const text    = await pyRes.text();
  const resType = pyRes.headers.get("content-type") ?? "application/json";
  return new Response(text, { status: pyRes.status, headers: { "Content-Type": resType } });
}
