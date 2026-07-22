/**
 * Gemini API helper — shared across all Next.js server routes.
 *
 * Uses Google Gemini 2.0 Flash for fast, cost-effective text generation.
 * Env var: GEMINI_API_KEY (set in .env.local + Vercel dashboard)
 *
 * Same API key used by the Laravel CommentaryController on Render.
 */

export const GEMINI_TEXT_MODEL = "gemini-2.0-flash-001";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function geminiText(
  systemPrompt: string,
  messages: Message[],
  options: { max_tokens?: number; temperature?: number; model?: string } = {},
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured in Vercel environment variables.");

  const model = options.model ?? GEMINI_TEXT_MODEL;
  const url   = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;

  // Gemini requires strict user/model alternation — merge consecutive same-role messages
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  for (const m of messages) {
    const geminiRole = m.role === "assistant" ? "model" : "user";
    const last = contents[contents.length - 1];
    if (last && last.role === geminiRole) {
      last.parts[0].text += "\n" + m.content;
    } else {
      contents.push({ role: geminiRole, parts: [{ text: m.content }] });
    }
  }

  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: options.max_tokens  ?? 1024,
        temperature:     options.temperature ?? 0.7,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const data  = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
  if (!reply) throw new Error("Gemini returned an empty response.");
  return reply;
}

/**
 * Gemini vision — analyse video frames (base64 JPEGs) with optional text context.
 * Sends images inline as inlineData parts alongside the user text prompt.
 */
export async function geminiVision(
  systemPrompt: string,
  frames: string[],        // base64 JPEG strings (no data: prefix)
  userText: string,
  options: { max_tokens?: number; model?: string } = {},
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured in Vercel environment variables.");

  const model = options.model ?? GEMINI_TEXT_MODEL;
  const url   = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;

  // Build parts: image frames first, then the text prompt
  type GeminiPart =
    | { text: string }
    | { inlineData: { mimeType: string; data: string } };

  const parts: GeminiPart[] = [
    ...frames.slice(0, 15).map((frame) => ({
      inlineData: { mimeType: "image/jpeg", data: frame },
    })),
    { text: userText },
  ];

  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        maxOutputTokens: options.max_tokens ?? 2000,
        temperature:     0.7,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini vision error ${res.status}: ${err}`);
  }

  const data  = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
  if (!reply) throw new Error("Gemini returned an empty vision response.");
  return reply;
}
