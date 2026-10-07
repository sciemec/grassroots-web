import { NextRequest, NextResponse } from 'next/server';
import { geminiText } from '@/lib/gemini';

// POST /api/thuto/whatsapp
// ─────────────────────────────────────────────────────────────────────────────
// Called by HandleWhatsAppCommand.php when a player sends
// "THUTO <question>" or "AMARA <question>" via WhatsApp.
//
// Input:  {
//   from:     "+263...",
//   message:  "THUTO how do I sprint faster?",
//   context?: string,                                    ← ThutoContextService::buildContext()
//   history?: { role: 'user'|'model'; content: string }[], ← last 6 turns from thuto_memory
//   is_pro?:  boolean,
// }
// Output: { reply: "coaching text (≤600 chars)" }
//
// System instruction (base prompt + player context) is placed in the AI system
// field — NEVER in the user message array — so it cannot be overridden by user input.
//
// Uses Gemini (primary, model ID from @/lib/gemini) or Claude Haiku (fallback).
// ─────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Strip the command keyword (THUTO / AMARA / COACH) from the raw message
function extractQuestion(message: string): string {
  const prefixes = ['THUTO ', 'AMARA ', 'COACH '];
  const upper = message.toUpperCase();
  for (const prefix of prefixes) {
    if (upper.startsWith(prefix)) {
      return message.slice(prefix.length).trim();
    }
  }
  return message.trim();
}

// Truncate reply to ≤600 chars — readable on WhatsApp without being a wall of text.
// Priority:
//   1. Last complete sentence ending with . ! ? that fits in 600 chars → no ellipsis
//   2. Last word boundary before char 600 → add ellipsis
//   3. Hard cut at 597 → add ellipsis
function trimForWhatsApp(text: string): string {
  const clean = text.trim();
  if (clean.length <= 600) return clean;

  // Walk every sentence-end marker; keep the rightmost one whose end char ≤ 600.
  const re = /[.!?](?=\s|$)/g;
  let lastBoundary = -1;
  let m = re.exec(clean);
  while (m !== null) {
    if (m.index + 1 <= 600) lastBoundary = m.index + 1; // include the punctuation
    m = re.exec(clean);
  }
  // Only use if we found a meaningful cut point (> 200 avoids one-word sentences)
  if (lastBoundary > 200) return clean.slice(0, lastBoundary).trim();

  // Fallback: word boundary with ellipsis
  const wordCut = clean.lastIndexOf(' ', 597);
  return wordCut > 200 ? clean.slice(0, wordCut) + '…' : clean.slice(0, 597) + '…';
}

const BASE_SYSTEM_PROMPT =
  'You are THUTO, a friendly AI sports coach for Grassroots Sports in Zimbabwe. ' +
  'You give short, practical coaching advice to young athletes via WhatsApp. ' +
  'Keep replies concise — plain sentences only, no bullet points. Be encouraging and specific. ' +
  'Answer in 2 to 4 complete sentences only. ' +
  'If the player sends "continue", "more", or "why?", use the conversation history to continue or expand on your previous answer. ' +
  'Reply in the same language the player is writing in (English, Shona, or Ndebele).';

export async function POST(req: NextRequest) {
  let message = '';
  let context = '';
  let history: { role: string; content: string }[] = [];
  let lang = 'en';

  try {
    const body = await req.json();
    message = body.message ?? '';
    context = typeof body.context === 'string' ? body.context : '';
    history = Array.isArray(body.history) ? body.history : [];
    if (body.lang === 'sn' || body.lang === 'nd') lang = body.lang;
  } catch {
    return NextResponse.json({ reply: 'Reply HELP to see all commands.' });
  }

  const question = extractQuestion(message);

  if (!question || question.length < 3) {
    return NextResponse.json({
      reply: 'Ask me your training question! Example: THUTO how do I improve my sprint?',
    });
  }

  // System instruction = base prompt + language directive + player context.
  // Context already includes the minor safety block when the player is under-18
  // (injected server-side by ThutoContextService::buildContext()).
  const LANG_INSTRUCTION: Record<string, string> = {
    sn: 'Reply in ChiShona (Shona). Pindura muChiShona.',
    nd: 'Reply in isiNdebele (Ndebele). Phendula ngesiNdebele.',
  };
  const langLine = LANG_INSTRUCTION[lang] ?? '';
  const systemInstruction = [BASE_SYSTEM_PROMPT, langLine, context]
    .filter(Boolean)
    .join('\n\n');

  // Build message array: stored 'model' role → 'assistant' for both AI APIs,
  // then append the current question as the final user turn.
  const historyMessages = history.map((m) => ({
    role: (m.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: m.content,
  }));
  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...historyMessages,
    { role: 'user', content: question },
  ];

  // ── Try Gemini first (model ID sourced from @/lib/gemini — not hardcoded) ──
  if (process.env.GEMINI_API_KEY) {
    try {
      const text = await geminiText(
        systemInstruction,
        messages,
        { max_tokens: 400 },
      );
      if (text) return NextResponse.json({ reply: trimForWhatsApp(text) });
    } catch {
      // Fall through to Anthropic fallback
    }
  }

  // ── Anthropic Claude Haiku fallback ───────────────────────────────────────
  if (ANTHROPIC_API_KEY) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system:     systemInstruction,
          messages:   messages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text ?? '';
        if (text) {
          return NextResponse.json({ reply: trimForWhatsApp(text) });
        }
      }
    } catch {
      // Fall through to static reply
    }
  }

  // ── Static fallback ────────────────────────────────────────────────────────
  return NextResponse.json({
    reply: 'Your coach is resting. Try again in a moment. Visit grassrootssports.live for full coaching.',
  });
}
