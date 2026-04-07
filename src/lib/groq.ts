/**
 * Groq API helper — shared across all Next.js server routes.
 *
 * Groq is OpenAI-compatible, so it uses the chat completions format.
 * Env var: GROQ_API_KEY  (set in .env.local + Vercel dashboard)
 *
 * Text model:   llama-3.3-70b-versatile  (fast, accurate, free tier generous)
 * Vision model: meta-llama/llama-4-scout-17b-16e-instruct  (image + text)
 */

export const GROQ_TEXT_MODEL   = "llama-3.3-70b-versatile";
export const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type Role = "system" | "user" | "assistant";

interface TextMessage {
  role:    Role;
  content: string;
}

interface VisionMessage {
  role: "user";
  content: (
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  )[];
}

// ── Text completion ───────────────────────────────────────────────────────────

export async function groqText(
  systemPrompt: string,
  messages: TextMessage[],
  options: { max_tokens?: number; temperature?: number; model?: string } = {},
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured in Vercel environment variables.");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       options.model       ?? GROQ_TEXT_MODEL,
      max_tokens:  options.max_tokens  ?? 1024,
      temperature: options.temperature ?? 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const data  = await res.json();
  const reply = data?.choices?.[0]?.message?.content as string | undefined;
  if (!reply) throw new Error("Groq returned an empty response.");
  return reply;
}

// ── Vision completion (image + text) ─────────────────────────────────────────

export async function groqVision(
  systemPrompt: string,
  frames: string[],            // base64 JPEG strings (no data URI prefix needed)
  userText: string,
  options: { max_tokens?: number } = {},
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured in Vercel environment variables.");

  const imageBlocks = frames.slice(0, 10).map((b64) => ({
    type:      "image_url" as const,
    image_url: { url: `data:image/jpeg;base64,${b64}` },
  }));

  const userMessage: VisionMessage = {
    role:    "user",
    content: [...imageBlocks, { type: "text", text: userText }],
  };

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:      GROQ_VISION_MODEL,
      max_tokens: options.max_tokens ?? 1200,
      messages: [
        { role: "system", content: systemPrompt },
        userMessage,
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq vision error ${res.status}: ${err}`);
  }

  const data  = await res.json();
  const reply = data?.choices?.[0]?.message?.content as string | undefined;
  if (!reply) throw new Error("Groq vision returned an empty response.");
  return reply;
}
