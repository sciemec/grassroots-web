import { NextRequest, NextResponse } from 'next/server';

// POST /api/thuto/whatsapp
// ─────────────────────────────────────────────────────────────────────────────
// Called by HandleWhatsAppCommand.php when a player sends
// "THUTO <question>" or "AMARA <question>" via WhatsApp.
//
// Input:  { from: "+263...", message: "THUTO how do I sprint faster?" }
// Output: { reply: "short coaching text (max ~150 chars for WhatsApp)" }
//
// Uses Gemini 2.0 Flash (primary) or Anthropic Claude (fallback) — same provider
// stack as THUTO chat on the web app.
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_API_KEY    = process.env.GEMINI_API_KEY;
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

  // ── Try Gemini first ────────────────────────────────────────────────────────
  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: question }] }],
          generationConfig: { maxOutputTokens: 80 },
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (res.ok) {
        const data = await res.json();
        const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) {
          return NextResponse.json({ reply: trimForWhatsApp(text) });
        }
      }
    } catch {
      // Fall through to Anthropic
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
          max_tokens: 80,
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
