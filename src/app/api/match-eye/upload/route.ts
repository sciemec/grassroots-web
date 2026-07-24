export const runtime     = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/match-eye/upload
 *
 * Proxies a video chunk from the browser to the Google Gemini Files API via a
 * resumable upload session (server-side — the API key never leaves the server,
 * and Google's resumable upload endpoint blocks direct browser requests via CORS).
 *
 * Query params:
 *   size   — total file size in bytes (required on the first chunk)
 *   chunk  — byte length of this chunk (defaults to `size` for backwards compat)
 *   offset — byte offset of this chunk in the full file (default "0")
 *   last   — "true"/"false", whether this is the final chunk (default "true")
 *
 * Request headers:
 *   Content-Type           — video MIME type (e.g. video/mp4)
 *   X-Upload-Session-Url   — Google resumable-session URL from a previous chunk
 *                            response; absent on the first chunk so we start a
 *                            new session.
 *
 * Response (non-final chunk):  { sessionUrl }
 * Response (final chunk):      { fileUri, fileName, mimeType, sessionUrl }
 *
 * Backwards compat: callers that only pass ?size=N (single-shot, old behaviour)
 * are treated as a single "last" chunk with offset=0 — no code change needed on
 * old callers.
 */
export async function POST(req: Request) {
  try {
    const googleKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const contentType = req.headers.get("content-type") || "video/mp4";
    const params      = new URL(req.url).searchParams;

    // Total file size — used when starting a new Google resumable session
    const totalSize = params.get("size") ?? "0";
    // Byte length of this specific chunk (Content-Length we send to Google)
    const chunkSize = params.get("chunk") ?? totalSize; // backwards compat: default to total
    // Byte offset of this chunk in the full file
    const offset    = params.get("offset") ?? "0";
    // Whether this is the last chunk — determines "upload" vs "upload, finalize"
    const isLast    = params.get("last") !== "false"; // default true (backwards compat)

    // Google resumable-session URL threaded from the previous chunk response.
    // Absent on the very first chunk → we must start a new session.
    const existingSessionUrl = req.headers.get("x-upload-session-url");

    let uploadUrl: string;

    if (existingSessionUrl) {
      // Continuation chunk — reuse the existing Google resumable upload session
      uploadUrl = existingSessionUrl;
    } else {
      // First chunk — start a new Google resumable upload session
      const initRes = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${googleKey}`,
        {
          method: "POST",
          headers: {
            "X-Goog-Upload-Protocol":              "resumable",
            "X-Goog-Upload-Command":               "start",
            "X-Goog-Upload-Header-Content-Length": totalSize,
            "X-Goog-Upload-Header-Content-Type":   contentType,
            "Content-Type":                        "application/json",
          },
          body: JSON.stringify({ file: { display_name: `match-${Date.now()}` } }),
        }
      );

      if (!initRes.ok) {
        const errText = await initRes.text();
        return Response.json(
          { error: `Failed to start upload session: ${errText.slice(0, 300)}` },
          { status: 502 }
        );
      }

      const sessionUrl = initRes.headers.get("X-Goog-Upload-URL");
      if (!sessionUrl) {
        return Response.json({ error: "Google did not return an upload URL" }, { status: 502 });
      }
      uploadUrl = sessionUrl;
    }

    // Upload this chunk's bytes to Google
    const uploadCommand = isLast ? "upload, finalize" : "upload";
    const uploadRes = await fetch(uploadUrl, {
      method:  "PUT",
      headers: {
        "Content-Type":          contentType,
        "Content-Length":        chunkSize,
        "X-Goog-Upload-Command": uploadCommand,
        "X-Goog-Upload-Offset":  offset,
      },
      // @ts-ignore — Node 18+ requires duplex:"half" when body is a ReadableStream
      body:   req.body,
      duplex: "half",
    } as RequestInit);

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return Response.json(
        { error: `Chunk upload to Google failed (${uploadRes.status}): ${errText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    if (!isLast) {
      // Intermediate chunk — return the session URL so the client can thread it forward
      return Response.json({ sessionUrl: uploadUrl });
    }

    // Final chunk — Google returns the file metadata
    const data = await uploadRes.json() as { file?: { uri: string; name: string } };
    if (!data.file?.uri) {
      return Response.json({ error: "Google did not return a file URI after upload" }, { status: 502 });
    }

    return Response.json({
      fileUri:    data.file.uri,
      fileName:   data.file.name,
      mimeType:   contentType,
      sessionUrl: uploadUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
