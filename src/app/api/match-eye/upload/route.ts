// Edge Runtime — streams video bytes from browser through to Google.
// Edge has no body size limit (streaming), so large match videos work fine.
// Proxying server-side avoids CORS issues with direct browser→Google uploads.
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const googleKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return Response.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 500 });
    }

    const contentType = req.headers.get("content-type") || "video/mp4";
    const contentLength = req.headers.get("content-length") || "0";

    // Step 1: Start a resumable upload session with Google
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
      return Response.json({ error: "Gemini did not return an upload URL" }, { status: 502 });
    }

    // Step 2: Stream the request body directly to Google — no buffering in memory
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": contentLength,
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize",
      },
      // @ts-expect-error duplex required for streaming request bodies
      duplex: "half",
      body: req.body,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return Response.json(
        { error: `Upload to Google failed: ${uploadRes.status} — ${errText}` },
        { status: 502 }
      );
    }

    const fileData = await uploadRes.json() as {
      file?: { uri: string; name: string; mimeType: string };
    };

    const file = fileData.file;
    if (!file?.uri) {
      return Response.json({ error: "Google did not return a file URI" }, { status: 502 });
    }

    return Response.json({
      fileUri:  file.uri,
      fileName: file.name,
      mimeType: file.mimeType || contentType,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
