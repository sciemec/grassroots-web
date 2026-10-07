import { NextRequest, NextResponse } from 'next/server';
import { geminiText } from '@/lib/gemini';

// POST /api/thuto/whatsapp
// ─────────────────────────────────────────────────────────────────────────────
// Called by HandleWhatsAppCommand.php when a player sends
// "THUTO <question>" or "AMARA <question>" via WhatsApp.
//
// Input:  { from: "+263...", message: "THUTO how do I sprint faster?" }
// Output: { reply: "short coaching text" }
//
// Uses Gemini (primary, model from @/lib/gemini) or Claude Haiku (fallback).
// Model ID is NOT hardcoded here — it follows GEMINI_TEXT_MODEL in gemini.ts.
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

// Truncate reply to ~150 chars so it reads well on WhatsApp
function trimForWhatsApp(text: string): string {
  const clean = text.trim();
  if (clean.length <= 160) return clean;
  const cut = clean.lastIndexOf(' ', 157);
  return cut > 80 ? clean.slice(0, cut) + '…' : clean.slice(0, 157) + '…';
}

const SYSTEM_PROMPT =
  'You are THUTO, a friendly AI sports coach for Grassroots Sports in Zimbabwe. ' +
  'You give short, practical coaching advice to young athletes via WhatsApp. ' +
  'Keep replies under 150 characters — they must fit in a single WhatsApp message. ' +
  'Be encouraging, specific, and use simple language. No bullet points. Plain sentences only.';

export async function POST(req: NextRequest) {
  let message = '';
  try {
    const body = await req.json();
    message = body.message ?? '';
  } catch {
    return NextResponse.json({ reply: 'Reply HELP to see all commands.' });
  }

  const question = extractQuestion(message);

  if (!question || question.length < 3) {
    return NextResponse.json({
      reply: 'Ask me your training question! Example: THUTO how do I improve my sprint?',
    });
  }

  // ── Try Gemini first (model ID sourced from @/lib/gemini — not hardcoded) ──
  if (process.env.GEMINI_API_KEY) {
    try {
      const text = await geminiText(
        SYSTEM_PROMPT,
        [{ role: 'user', content: question }],
        { max_tokens: 200 },  // ~150 words — enough for a useful coaching reply
      );
      if (text) return NextResponse.json({ reply: trimForWhatsApp(text) });
    } catch {
      // Fall through to Anthropic fallback
    }
  }

  // ── Anthropic Claude fallback ──────────────────────────────────────────────
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
          model:      'claude-haiku-4-5-20251001',   // cheapest Claude — fine for short WhatsApp replies
          max_tokens: 200,
          system:     SYSTEM_PROMPT,
          messages: [{ role: 'user', content: question }],
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
