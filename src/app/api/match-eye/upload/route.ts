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

    // Normalise to a Gemini-supported MIME type.
    // Mobile browsers often send "application/octet-stream" (empty file.type fallback),
    // "video/x-matroska" (.mkv on Chrome), or "video/mp2t" (.ts) — none of which
    // Gemini accepts. Anything not on this allowlist is treated as video/mp4.
    // Note: "video/3gpp" and "video/3gpp2" (.3gp — common on low-end Android) ARE
    // supported by Gemini and are intentionally kept in the allowlist as-is.
    const GEMINI_VIDEO_TYPES = new Set([
      "video/mp4", "video/mpeg", "video/mpg", "video/quicktime", "video/mov",
      "video/avi", "video/x-flv", "video/webm", "video/wmv", "video/x-ms-wmv",
      "video/3gpp", "video/3gpp2",
    ]);
    const rawType     = req.headers.get("content-type") ?? "";
    const contentType = GEMINI_VIDEO_TYPES.has(rawType) ? rawType : "video/mp4";
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

    // Guard: reject non-final chunks whose size is not a multiple of Google's
    // 8 MiB granularity before a single byte reaches Google's API.
    // Final chunks may be any size (remainder of the file).
    // Resume slices (after a 308) start from a partial boundary — their size is
    // inherently non-aligned, so the guard is skipped for them (?resume=1).
    const isResume = params.get("resume") === "1";
    if (!isLast && !isResume) {
      const GOOGLE_GRANULARITY = 8_388_608;
      const chunkBytes = parseInt(chunkSize, 10);
      if (isNaN(chunkBytes) || chunkBytes % GOOGLE_GRANULARITY !== 0) {
        return Response.json(
          {
            error: `Invalid chunk size: ${chunkSize} bytes is not a multiple of ` +
              `${GOOGLE_GRANULARITY} (Google resumable upload granularity). ` +
              `Valid sizes: 8 MB (${GOOGLE_GRANULARITY}), 16 MB, 24 MB, 32 MB.`,
          },
          { status: 400 }
        );
      }
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

    // 308 Resume Incomplete — Google accepted partial bytes.
    // Read the Range header to find the last confirmed byte, then tell the
    // client where to resume so it can re-slice and retry from that position.
    if (uploadRes.status === 308) {
      const range = uploadRes.headers.get("Range"); // e.g. "bytes=0-4194303"
      const confirmedOffset = range
        ? parseInt(range.split("-")[1] ?? "0", 10) + 1
        : parseInt(offset, 10);
      console.log(
        `[match-eye] 308 Resume Incomplete — Range: ${range ?? "none"} → confirmedOffset: ${confirmedOffset}`,
      );
      return Response.json({ sessionUrl: uploadUrl, confirmedOffset });
    }

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
