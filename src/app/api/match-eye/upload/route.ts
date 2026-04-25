// Edge Runtime — no body size limit, supports streaming large video files
export const runtime = "edge";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const googleKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return Response.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 500 });
    }

    const contentType = req.headers.get("content-type") || "video/mp4";
    const contentLength = req.headers.get("content-length") || "0";

    // ── Step 1: Initiate resumable upload session with Gemini File API ──────────
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

    // ── Step 2: Upload video bytes to Gemini ─────────────────────────────────────
    const videoBuffer = await req.arrayBuffer();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": String(videoBuffer.byteLength),
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize",
      },
      body: videoBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return Response.json({ error: `Video upload failed: ${errText}` }, { status: 502 });
    }

    const fileData = await uploadRes.json() as {
      file: { uri: string; name: string; state: string; mimeType: string };
    };

    return Response.json({
      fileUri: fileData.file.uri,
      fileName: fileData.file.name,
      mimeType: fileData.file.mimeType || contentType,
      state: fileData.file.state,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
