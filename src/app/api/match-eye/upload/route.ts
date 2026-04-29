// Edge Runtime — returns a Google resumable upload URL.
// The browser then PUTs the video bytes directly to that URL (no body through Vercel).
// Vercel has a 4 MB body limit on all runtimes — video must bypass it entirely.
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const googleKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return Response.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 500 });
    }

    const contentType = req.headers.get("content-type") || "video/mp4";
    const contentLength = req.headers.get("x-content-length") || "0";

    // Initiate a resumable upload session — tiny metadata-only request, no video body
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
        { error: `Failed to start upload session: ${errText}` },
        { status: 502 }
      );
    }

    const uploadUrl = initRes.headers.get("X-Goog-Upload-URL");
    if (!uploadUrl) {
      return Response.json({ error: "Google did not return an upload URL" }, { status: 502 });
    }

    // Return the self-authenticating URL — browser PUTs the video directly to Google
    return Response.json({ uploadUrl, mimeType: contentType });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
