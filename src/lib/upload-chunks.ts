/**
 * uploadVideoInChunks — resilient video upload for mobile connections.
 *
 * Flow:
 *   1. Call /api/match-eye/upload/session — server creates a Google resumable
 *      session and returns an opaque session URL. The API key stays server-side.
 *   2. Slice the file into CHUNK_BYTES pieces and PUT them sequentially
 *      DIRECTLY to Google's session URL from the browser.
 *      No Render proxy hop — bytes travel phone → Google only (1× bandwidth).
 *   3. Each chunk is retried up to MAX_RETRIES times with exponential backoff.
 *
 * CORS: confirmed — Google mirrors any Origin in Access-Control-Allow-Origin,
 * so this works in both production (grassrootssports.live) and localhost dev.
 */

const CHUNK_BYTES = 8 * 1024 * 1024; // 8 MB — Google's resumable upload granularity
const MAX_RETRIES = 3;

export interface ChunkUploadResult {
  fileUri:  string;
  fileName: string;
  mimeType: string;
}

/** Google's response body on the final chunk */
interface GoogleFinalResponse {
  file?: { uri: string; name: string; mimeType?: string };
}

/**
 * PUT a single chunk directly to Google's resumable session URL via XHR
 * (XHR is used so onprogress fires for accurate progress bars).
 *
 * Returns the parsed JSON body on the final chunk, null on intermediate chunks.
 */
function sendChunkDirect(
  chunk:           Blob,
  sessionUrl:      string,
  offset:          number,
  isLast:          boolean,
  mimeType:        string,
  onChunkProgress: (loaded: number) => void,
): Promise<GoogleFinalResponse | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onChunkProgress(e.loaded);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (isLast) {
          try {
            resolve(JSON.parse(xhr.responseText) as GoogleFinalResponse);
          } catch {
            reject(new Error("Unexpected response from Google on final chunk"));
          }
        } else {
          resolve(null); // intermediate chunk — no body needed
        }
      } else {
        reject(new Error(
          `Upload chunk failed (${xhr.status}): ${xhr.responseText.slice(0, 200)}`
        ));
      }
    };

    xhr.onerror = () =>
      reject(new Error("Network error during upload — check your connection and try again"));

    xhr.open("PUT", sessionUrl);
    xhr.setRequestHeader("Content-Type",            mimeType);
    xhr.setRequestHeader("X-Goog-Upload-Command",   isLast ? "upload, finalize" : "upload");
    xhr.setRequestHeader("X-Goog-Upload-Offset",    String(offset));
    xhr.send(chunk);
  });
}

/**
 * Upload a File to the Gemini Files API in 8 MB chunks sent directly from
 * the browser to Google (no Render proxy — single bandwidth hop).
 *
 * @param file       - The video File to upload.
 * @param onProgress - Called with integer 0–95 as bytes are sent.
 * @returns          - { fileUri, fileName, mimeType } from the Gemini Files API.
 */
export async function uploadVideoInChunks(
  file:       File,
  onProgress: (pct: number) => void,
): Promise<ChunkUploadResult> {
  const totalSize   = file.size;
  const totalChunks = Math.ceil(totalSize / CHUNK_BYTES);
  const mimeType    = file.type || "video/mp4";
  let   bytesUploaded = 0;

  // ── Step 1: Get a Google resumable session URL from our server ────────────
  // The API key stays server-side. The session URL is an opaque signed token.
  const sessionRes = await fetch("/api/match-eye/upload/session", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ size: totalSize, mimeType, fileName: file.name }),
  });

  if (!sessionRes.ok) {
    const body = await sessionRes.json() as { error?: string };
    throw new Error(body.error ?? "Failed to start upload session");
  }

  const { sessionUrl } = await sessionRes.json() as { sessionUrl: string };

  // ── Step 2: Send all chunks directly to Google ────────────────────────────
  for (let i = 0; i < totalChunks; i++) {
    const start  = i * CHUNK_BYTES;
    const end    = Math.min(start + CHUNK_BYTES, totalSize);
    const chunk  = file.slice(start, end);
    const isLast = i === totalChunks - 1;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 1 s, 2 s before retrying
        await new Promise<void>((r) => setTimeout(r, attempt * 1000));
      }

      try {
        const res = await sendChunkDirect(
          chunk,
          sessionUrl,
          start,
          isLast,
          mimeType,
          (loaded) => {
            onProgress(Math.round(((bytesUploaded + loaded) / totalSize) * 95));
          },
        );

        if (isLast) {
          if (!res?.file?.uri) throw new Error("Google did not return a file URI");
          return {
            fileUri:  res.file.uri,
            fileName: res.file.name ?? file.name,
            mimeType,
          };
        }

        bytesUploaded = end;
        lastError = null;
        break; // chunk succeeded — advance to next
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Unknown upload error");
      }
    }

    if (lastError) throw lastError;
  }

  throw new Error("Upload completed but no file URI was returned");
}
