import { GEMINI_VISION_MODEL } from "@/lib/gemini";

const GEMINI_BASE = "https://generativelanguage.googleapis.com";

export interface GeminiFilePart {
  file_data: { mime_type: string; file_uri: string };
}
export interface GeminiTextPart {
  text: string;
}
export type GeminiPart = GeminiFilePart | GeminiTextPart;

export interface GeminiCallConfig {
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Poll the Gemini Files API until the file state is ACTIVE.
 * Throws on FAILED state or timeout.
 */
export async function waitForGeminiFile(
  fileName: string,
  apiKey: string,
  timeoutMinutes = 5
): Promise<void> {
  const maxAttempts = timeoutMinutes * 12; // 5-second intervals
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `${GEMINI_BASE}/v1beta/${fileName}?key=${apiKey}`
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `File state check failed: ${res.status} — ${body.slice(0, 200)}`
      );
    }
    const data = (await res.json()) as { state?: string };
    if (data.state === "ACTIVE") return;
    if (data.state === "FAILED")
      throw new Error("Gemini file processing failed");
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(
    `Video did not become ready within ${timeoutMinutes} minutes`
  );
}

/**
 * Call Gemini generateContent with a list of parts (file + text).
 * Returns the text of the first candidate's first part.
 * Throws on non-2xx responses.
 */
export async function callGemini(
  apiKey: string,
  parts: GeminiPart[],
  config: GeminiCallConfig = {}
): Promise<string> {
  const res = await fetch(
    `${GEMINI_BASE}/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: config.temperature ?? 0.2,
          maxOutputTokens: config.maxOutputTokens ?? 1024,
        },
      }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

/**
 * Fire-and-forget DELETE of a Gemini file. Never throws.
 */
export function deleteGeminiFile(fileName: string, apiKey: string): void {
  fetch(`${GEMINI_BASE}/v1beta/${fileName}?key=${apiKey}`, {
    method: "DELETE",
  }).catch(() => {});
}
