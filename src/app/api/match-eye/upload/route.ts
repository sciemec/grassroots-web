// Edge Runtime — only initiates the Gemini resumable session.
// The browser then PUTs the video bytes directly to Google's self-authenticating
// upload URL, bypassing Vercel's 4 MB body limit entirely.
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const googleKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return Response.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 500 });
    }

    // x-content-length and content-type come from the browser — no video body here
    const contentType = req.headers.get("content-type") || "video/mp4";
    const contentLength = req.headers.get("x-content-length") || "0";

    // Initiate resumable session — this is a tiny metadata-only request
    const initRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${googleKey}`,
      {
        method: "POST",
        headers: {
          "X-Goog-Upload-Protocol": "resumable",
          "X-Goog-Upload-Command": "start",
          "X-Goog-Upload-Header-Content-Length": contentLength,
          "X-Goog-Upload-Header-Content-Type": contentType,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file: { display_name: `match-${Date.now()}` } }),
      }
    );

    if (!initRes.ok) {
      const errText = await initRes.text();
      return Response.json(
        { error: `Failed to initiate Gemini upload session: ${errText}` },
        { status: 502 }
      );
    }

    const uploadUrl = initRes.headers.get("X-Goog-Upload-URL");
    if (!uploadUrl) {
      return Response.json(
        { error: "Gemini did not return an upload URL" },
        { status: 502 }
      );
    }

    // Return the self-authenticating upload URL to the browser.
    // The browser PUTs the video bytes directly to this URL — no API key needed.
    return Response.json({ uploadUrl, mimeType: contentType });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
