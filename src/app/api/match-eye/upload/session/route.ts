export const runtime     = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/match-eye/upload/session
 *
 * Creates a Google Gemini Files API resumable upload session and returns the
 * opaque session URL to the client. The client then sends all video chunks
 * directly to Google — bypassing the Render proxy entirely.
 *
 * The API key never leaves the server. Google's session URL is a signed,
 * short-lived token that carries its own auth — no key in the browser.
 *
 * Body: { size: number, mimeType: string, fileName?: string }
 * Response: { sessionUrl: string }
 */
export async function POST(req: Request) {
  try {
    const googleKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const { size, mimeType, fileName } = await req.json() as {
      size: number;
      mimeType: string;
      fileName?: string;
    };

    if (!size || !mimeType) {
      return Response.json({ error: "size and mimeType are required" }, { status: 400 });
    }

    const initRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${googleKey}`,
      {
        method: "POST",
        headers: {
          "X-Goog-Upload-Protocol":              "resumable",
          "X-Goog-Upload-Command":               "start",
          "X-Goog-Upload-Header-Content-Length": String(size),
          "X-Goog-Upload-Header-Content-Type":   mimeType,
          "Content-Type":                        "application/json",
        },
        body: JSON.stringify({ file: { display_name: fileName ?? `match-${Date.now()}` } }),
      }
    );

    if (!initRes.ok) {
      const errText = await initRes.text();
      return Response.json(
        { error: `Failed to start Google upload session: ${errText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const sessionUrl = initRes.headers.get("X-Goog-Upload-URL");
    if (!sessionUrl) {
      return Response.json({ error: "Google did not return a session URL" }, { status: 502 });
    }

    return Response.json({ sessionUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
