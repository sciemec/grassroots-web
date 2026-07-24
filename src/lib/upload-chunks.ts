/**
 * uploadVideoInChunks — resilient video upload for mobile connections.
 *
 * Slices a file into CHUNK_BYTES pieces and sends them sequentially through
 * /api/match-eye/upload. Each chunk is retried up to MAX_RETRIES times with
 * exponential backoff. The Google resumable-session URL is threaded from the
 * server response back to subsequent requests so the upload can survive a
 * dropped mobile connection mid-file.
 */

const CHUNK_BYTES = 8 * 1024 * 1024; // 8 MB — matches Google's resumable upload chunk granularity (8,388,608 bytes)
const MAX_RETRIES = 3;

export interface ChunkUploadResult {
  fileUri:  string;
  fileName: string;
  mimeType: string;
}

interface ServerChunkResponse {
  sessionUrl?: string;
  fileUri?:    string;
  fileName?:   string;
  mimeType?:   string;
  error?:      string;
}

/** Send a single chunk via XHR (so onprogress fires) and resolve with the JSON response. */
function sendChunkXhr(
  chunk:      Blob,
  params:     URLSearchParams,
  sessionUrl: string | null,
  onChunkProgress: (loaded: number) => void,
): Promise<ServerChunkResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onChunkProgress(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as ServerChunkResponse);
        } catch {
          reject(new Error("Unexpected response from upload server"));
        }
      } else {
        let msg = `Upload chunk failed (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string };
          if (body.error) msg = body.error;
        } catch {}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () =>
      reject(new Error("Network error during upload — check your connection and try again"));
    xhr.open("POST", `/api/match-eye/upload?${params.toString()}`);
    xhr.setRequestHeader("Content-Type", chunk.type || "video/mp4");
    // Thread the Google session URL so the server can continue the same resumable upload
    if (sessionUrl) xhr.setRequestHeader("X-Upload-Session-Url", sessionUrl);
    xhr.send(chunk);
  });
}

/**
 * Upload a File in 5 MB chunks.
 *
 * @param file       - The video File (or Blob wrapped in a File) to upload.
 * @param onProgress - Called with integer 0–95 as bytes are sent.
 * @returns          - { fileUri, fileName, mimeType } from the Gemini Files API.
 */
export async function uploadVideoInChunks(
  file:       File,
  onProgress: (pct: number) => void,
): Promise<ChunkUploadResult> {
  const totalSize   = file.size;
  const totalChunks = Math.ceil(totalSize / CHUNK_BYTES);
  let   sessionUrl: string | null = null;
  let   bytesUploaded = 0;

  for (let i = 0; i < totalChunks; i++) {
    const start  = i * CHUNK_BYTES;
    const end    = Math.min(start + CHUNK_BYTES, totalSize);
    const chunk  = file.slice(start, end);
    const isLast = i === totalChunks - 1;

    const params = new URLSearchParams({
      size:   String(totalSize),
      chunk:  String(chunk.size),
      offset: String(start),
      last:   String(isLast),
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 1 s, 2 s before retrying
        await new Promise<void>((r) => setTimeout(r, attempt * 1000));
      }

      try {
        const res = await sendChunkXhr(
          chunk,
          params,
          sessionUrl,
          (loaded) => {
            // Report cumulative progress across all chunks, capped at 95%
            onProgress(Math.round(((bytesUploaded + loaded) / totalSize) * 95));
          },
        );

        if (res.error) throw new Error(res.error);

        // Thread the session URL forward to subsequent chunk requests
        if (res.sessionUrl) sessionUrl = res.sessionUrl;

        if (isLast) {
          if (!res.fileUri) throw new Error("Upload server did not return a file URI");
          return {
            fileUri:  res.fileUri,
            fileName: res.fileName ?? "",
            mimeType: res.mimeType ?? file.type,
          };
        }

        bytesUploaded = end;
        lastError = null;
        break; // chunk succeeded — advance to next chunk
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Unknown upload error");
      }
    }

    if (lastError) throw lastError;
  }

  throw new Error("Upload completed but no file URI was returned");
}
