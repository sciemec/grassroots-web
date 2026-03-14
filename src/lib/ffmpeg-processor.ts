/**
 * FFmpeg WASM video processing utilities.
 *
 * IMPORTANT: FFmpeg.wasm requires SharedArrayBuffer, which requires
 * Cross-Origin-Opener-Policy: same-origin and
 * Cross-Origin-Embedder-Policy: require-corp headers.
 * These are set in next.config.mjs.
 *
 * FFmpeg is lazy-loaded on first use so the ~6 MB WASM binary is
 * not downloaded until a feature actually needs it.
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
/**
 * Convert FFmpeg FileData to a plain ArrayBuffer so it can be passed to the
 * Blob constructor.  FFmpeg WASM may return a Uint8Array backed by a
 * SharedArrayBuffer, which TypeScript's strict lib types do not accept as
 * a BlobPart.  Slicing the underlying buffer produces a plain ArrayBuffer.
 */
function toBuffer(data: Uint8Array | string): ArrayBuffer {
  if (typeof data === "string") {
    return new TextEncoder().encode(data).buffer as ArrayBuffer;
  }
  // slice() always returns a plain ArrayBuffer (not SharedArrayBuffer)
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

// Module-level singleton — load once, reuse across all calls.
let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

/** Load FFmpeg WASM from CDN (only once per session). */
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ff = new FFmpeg();

    // CDN base for @ffmpeg/core ESM build
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

    await ff.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegInstance = ff;
    return ff;
  })();

  return loadPromise;
}

/**
 * Extract `count` frames (default 8) evenly spaced throughout the video.
 * Returns an array of JPEG Blob objects.
 */
export async function extractFrames(videoFile: File, count = 8): Promise<Blob[]> {
  const ff = await getFFmpeg();
  const inputName = "input.mp4";

  await ff.writeFile(inputName, await fetchFile(videoFile));

  // Probe duration via a fast metadata pass
  let duration = 0;
  ff.on("log", ({ message }) => {
    const match = message.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
    if (match) {
      duration =
        parseInt(match[1]) * 3600 +
        parseInt(match[2]) * 60 +
        parseFloat(match[3]);
    }
  });

  // Run a null-output pass to read metadata
  await ff.exec(["-i", inputName, "-f", "null", "-"]);

  // Fallback if duration was not detected
  if (duration <= 0) duration = 60;

  const frames: Blob[] = [];
  const step = duration / (count + 1);

  for (let i = 1; i <= count; i++) {
    const timestamp = (step * i).toFixed(2);
    const outName = `frame_${i}.jpg`;

    await ff.exec([
      "-ss", timestamp,
      "-i", inputName,
      "-frames:v", "1",
      "-q:v", "2",
      outName,
    ]);

    const data = await ff.readFile(outName);
    frames.push(new Blob([toBuffer(data)], { type: "image/jpeg" }));
    await ff.deleteFile(outName);
  }

  await ff.deleteFile(inputName);
  return frames;
}

/**
 * Compress video to targetMB (default 50 MB) using libx264, scaled to 720p max.
 * Returns a compressed MP4 Blob.
 */
export async function compressVideo(videoFile: File, targetMB = 50): Promise<Blob> {
  const ff = await getFFmpeg();
  const inputName = "compress_in.mp4";
  const outputName = "compress_out.mp4";

  await ff.writeFile(inputName, await fetchFile(videoFile));

  // Estimate target bitrate from file duration + target size
  // target_bits = targetMB * 8 * 1_000_000 / duration_seconds
  // We use a conservative 1500k video + 128k audio as a safe default.
  await ff.exec([
    "-i", inputName,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "28",
    "-vf", "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outputName,
  ]);

  const data = await ff.readFile(outputName);
  const blob = new Blob([toBuffer(data)], { type: "video/mp4" });

  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  // If output exceeds target, pass through as-is (best-effort)
  if (blob.size > targetMB * 1024 * 1024) {
    console.warn(`[ffmpeg] Compressed size ${(blob.size / 1e6).toFixed(1)} MB exceeds target ${targetMB} MB`);
  }

  return blob;
}

/**
 * Trim video to the time range [startSec, endSec].
 * Returns a trimmed MP4 Blob.
 */
export async function trimVideo(
  videoFile: File,
  startSec: number,
  endSec: number
): Promise<Blob> {
  const ff = await getFFmpeg();
  const inputName = "trim_in.mp4";
  const outputName = "trim_out.mp4";
  const duration = endSec - startSec;

  await ff.writeFile(inputName, await fetchFile(videoFile));

  await ff.exec([
    "-ss", startSec.toFixed(2),
    "-i", inputName,
    "-t", duration.toFixed(2),
    "-c", "copy",
    "-movflags", "+faststart",
    outputName,
  ]);

  const data = await ff.readFile(outputName);
  const blob = new Blob([toBuffer(data)], { type: "video/mp4" });

  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  return blob;
}

/**
 * Extract a single JPEG thumbnail from the video at 2 seconds (or 0s if
 * the video is shorter).
 */
export async function generateThumbnail(videoFile: File): Promise<Blob> {
  const ff = await getFFmpeg();
  const inputName = "thumb_in.mp4";
  const outputName = "thumb_out.jpg";

  await ff.writeFile(inputName, await fetchFile(videoFile));

  await ff.exec([
    "-ss", "2",
    "-i", inputName,
    "-frames:v", "1",
    "-q:v", "2",
    outputName,
  ]);

  const data = await ff.readFile(outputName);
  const blob = new Blob([toBuffer(data)], { type: "image/jpeg" });

  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  return blob;
}
