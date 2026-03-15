/**
 * extract-frames.ts
 *
 * Extracts evenly-spaced frames from a video File using the HTML5 <video>
 * element + Canvas API.  No WASM, no CDN loading, no SharedArrayBuffer
 * required — works in every modern browser.
 *
 * Returns up to MAX_FRAMES base64-encoded JPEG strings (without the
 * data:image/jpeg;base64, prefix) suitable for the Anthropic vision API.
 */

const MAX_FRAMES = 15;
const FRAME_WIDTH = 640; // resize to 640px wide, maintain aspect ratio

export async function extractFrames(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.muted = true;
    video.preload = "metadata";

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read video file. Please try MP4 or MOV format."));
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      if (!duration || !isFinite(duration)) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not determine video duration."));
        return;
      }

      const frameCount = Math.min(MAX_FRAMES, Math.floor(duration));
      const interval = duration / frameCount;
      const frames: string[] = [];
      let captured = 0;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas not supported in this browser."));
        return;
      }

      const seekToNext = () => {
        if (captured >= frameCount) {
          URL.revokeObjectURL(objectUrl);
          resolve(frames);
          return;
        }
        video.currentTime = captured * interval + interval * 0.1;
      };

      video.onseeked = () => {
        // Size canvas to maintain aspect ratio at FRAME_WIDTH
        const aspect = video.videoHeight / video.videoWidth;
        canvas.width  = FRAME_WIDTH;
        canvas.height = Math.round(FRAME_WIDTH * aspect);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Extract as JPEG base64 (strip data URL prefix)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        frames.push(dataUrl.split(",")[1]);

        captured++;
        onProgress?.(Math.round((captured / frameCount) * 100));
        seekToNext();
      };

      seekToNext();
    };
  });
}
