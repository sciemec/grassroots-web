import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/fitness-test/warm
 *
 * SSE endpoint that pings the Python AI service's /health endpoint and streams
 * the result back to the browser.  Sending periodic keep-alive comments prevents
 * Render's load-balancer from dropping the connection while the Python pod is
 * waking up (cold-start can take 30-60 s on the standard tier).
 *
 * Browser usage:
 *   const es = new EventSource("/api/fitness-test/warm");
 *   es.onmessage = (e) => { const { warm } = JSON.parse(e.data); es.close(); }
 */
export async function GET(_req: NextRequest) {
  const aiUrl = process.env.AI_URL ?? process.env.NEXT_PUBLIC_AI_URL ?? "";

  if (!aiUrl) {
    return Response.json(
      { warm: false, error: "AI_URL env var not configured" },
      { status: 500 }
    );
  }

  const encoder = new TextEncoder();
  let pingTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Send a comment frame every 20 s so the Render LB sees activity and
      // does not treat the connection as idle / close it.
      pingTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          // controller already closed — ignore
        }
      }, 20_000);

      try {
        const res = await fetch(`${aiUrl}/health`, {
          signal: AbortSignal.timeout(90_000), // 90 s — enough for a full cold start
        });
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ warm: res.ok })}\n\n`)
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ warm: false, error: msg })}\n\n`)
        );
      } finally {
        if (pingTimer) clearInterval(pingTimer);
        controller.close();
      }
    },
    cancel() {
      if (pingTimer) clearInterval(pingTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "X-Accel-Buffering": "no",   // disables Nginx response buffering
      "Connection":        "keep-alive",
    },
  });
}
