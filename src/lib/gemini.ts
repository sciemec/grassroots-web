/**
 * Gemini API helper — shared across all Next.js server routes.
 *
 * Model names are defined once here. To update after a future deprecation,
 * change only these two constants — all routes using the helpers update automatically.
 *
 * Env var: GEMINI_API_KEY (set in .env.local + Render dashboard)
 * Same API key used by the Laravel GeminiAnalysisService on Render.
 */

// Model is overridable via GEMINI_TEXT_MODEL / GEMINI_VISION_MODEL env vars.
// Default: gemini-3.8-flash (update the env var on Render to change without a deploy).
export const GEMINI_TEXT_MODEL   = process.env.GEMINI_TEXT_MODEL   ?? "gemini-3.8-flash";
export const GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL ?? "gemini-3.8-flash";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Trim text back to the last complete sentence (ends with . ! ?).
// Used when Gemini returns finishReason=MAX_TOKENS to avoid mid-sentence cuts.
function trimToLastSentence(text: string): string {
  const re = /[.!?](?=\s|$)/g;
  let lastBoundary = -1;
  let m = re.exec(text);
  while (m !== null) {
    lastBoundary = m.index + 1; // include the punctuation
    m = re.exec(text);
  }
  return lastBoundary > 20 ? text.slice(0, lastBoundary).trim() : text.trim();
}

export async function geminiText(
  systemPrompt: string,
  messages: Message[],
  options: { max_tokens?: number; temperature?: number; model?: string; timeout_ms?: number; thinkingConfig?: { thinkingLevel: "low" | "medium" | "high" } } = {},
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured in Vercel environment variables.");

  const model = options.model ?? GEMINI_TEXT_MODEL;
  const url   = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;

  // generateContent requires strict user/model alternation — merge consecutive same-role messages
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

  const fetchOptions: RequestInit = {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: options.max_tokens ?? 1024,
        thinkingConfig:  options.thinkingConfig ?? { thinkingLevel: "low" },
        ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      },
    }),
  };
  if (options.timeout_ms) fetchOptions.signal = AbortSignal.timeout(options.timeout_ms);

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const data         = await res.json();
  const candidate    = data?.candidates?.[0];
  const finishReason = candidate?.finishReason as string | undefined;
  const parts        = (candidate?.content?.parts ?? []) as { text?: string }[];
  const tokenCount     = data?.usageMetadata?.candidatesTokenCount as number | undefined;
  const thoughtsTokens = data?.usageMetadata?.thoughtsTokenCount  as number | undefined;

  // Join ALL text parts — Gemini can split output across multiple parts
  let reply = parts.map((p) => p.text ?? "").join("");

  console.log(
    `[gemini] finishReason=${finishReason ?? "none"} parts=${parts.length}` +
    ` tokens=${tokenCount ?? "?"} thoughts=${thoughtsTokens ?? 0} replyLen=${reply.length} model=${model}`,
  );

  if (finishReason === "MAX_TOKENS") {
    reply = trimToLastSentence(reply);
  }
  if (finishReason === "SAFETY" || finishReason === "RECITATION") {
    throw new Error(`Gemini blocked response: finishReason=${finishReason}`);
  }
  if (!reply) throw new Error(`Gemini returned empty response (finishReason=${finishReason ?? "unknown"})`);
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

  const model = options.model ?? GEMINI_VISION_MODEL;
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
        thinkingConfig:  { thinkingLevel: "low" },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini vision error ${res.status}: ${err}`);
  }

  const data      = await res.json();
  const rawParts  = (data?.candidates?.[0]?.content?.parts ?? []) as { text?: string }[];
  const reply     = rawParts.map((p) => p.text ?? "").join("") || undefined;
  if (!reply) throw new Error("Gemini returned an empty vision response.");
  return reply;
}
