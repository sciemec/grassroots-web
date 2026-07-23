export const runtime     = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const googleKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const contentType   = req.headers.get("content-type")   || "video/mp4";
    // nginx/Render strips Content-Length for large bodies and uses chunked transfer instead.
    // Browsers can't set Content-Length on XHR (forbidden header), so we accept the file size
    // via a custom header X-Upload-Content-Length that browsers ARE allowed to set.
    const contentLength =
      req.headers.get("x-upload-content-length") ||
      req.headers.get("content-length") ||
      "0";

    // Step 1 — start a resumable upload session with Google (server-side, key never leaves server)
    const initRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${googleKey}`,
      {
        method: "POST",
        headers: {
          "X-Goog-Upload-Protocol":              "resumable",
          "X-Goog-Upload-Command":               "start",
          "X-Goog-Upload-Header-Content-Length": contentLength,
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

    const uploadUrl = initRes.headers.get("X-Goog-Upload-URL");
    if (!uploadUrl) {
      return Response.json({ error: "Google did not return an upload URL" }, { status: 502 });
    }

    // Step 2 — stream the browser's request body directly to Google (server-to-server).
    // A direct browser → Google PUT is blocked by CORS: Google does not set
    // Access-Control-Allow-Origin on the Gemini Files API resumable upload endpoint,
    // causing xhr.onerror → "Network error during upload" in the browser.
    const uploadRes = await fetch(uploadUrl, {
      method:  "PUT",
      headers: {
        "Content-Type":          contentType,
        "Content-Length":        contentLength,
        "X-Goog-Upload-Command": "upload, finalize",
        "X-Goog-Upload-Offset":  "0",
      },
      // @ts-ignore — Node 18+ requires duplex:"half" when body is a ReadableStream
      body:   req.body,
      duplex: "half",
    } as RequestInit);

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return Response.json(
        { error: `Upload to Google failed (${uploadRes.status}): ${errText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const data = await uploadRes.json() as { file?: { uri: string; name: string } };
    if (!data.file?.uri) {
      return Response.json({ error: "Google did not return a file URI after upload" }, { status: 502 });
    }

    return Response.json({
      fileUri:  data.file.uri,
      fileName: data.file.name,
      mimeType: contentType,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
