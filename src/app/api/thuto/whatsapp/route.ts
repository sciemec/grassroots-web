// src/app/api/thuto/whatsapp/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// THUTO / Amara on WhatsApp — Twilio version
//
// Called by HandleWhatsAppCommand.php (bhora-ai) when a player sends
// THUTO [question], AMARA [question], SCORE, DRILLS, or HELP to the GRS
// WhatsApp number.
//
// Also called directly by the EXISTING src/app/api/whatsapp/route.ts
// (the Next.js Twilio webhook) for text command routing.
//
// HOW TO WIRE INTO THE EXISTING NEXT.JS WHATSAPP ROUTE:
// In src/app/api/whatsapp/route.ts, the incoming body is Twilio form-encoded.
// After parsing it, add this block before the existing text handling:
//
//   const msgBody = params.get('Body')?.trim() ?? '';
//   const upper   = msgBody.toUpperCase();
//   const from    = params.get('From')?.replace('whatsapp:', '') ?? '';
//
//   if (upper.startsWith('THUTO') || upper.startsWith('AMARA') ||
//       upper.startsWith('COACH') || upper === 'SCORE' ||
//       upper === 'DRILLS' || upper === 'HELP') {
//     const r = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/thuto/whatsapp`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ from, message: msgBody }),
//     });
//     const { reply } = await r.json();
//     return twimlReply(reply);
//   }
//
// where twimlReply() returns:
//   new NextResponse(
//     `<?xml version="1.0"?><Response><Message>${reply}</Message></Response>`,
//     { headers: { 'Content-Type': 'text/xml' } }
//   )
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// WhatsApp messages must be short — keep replies under 300 characters
const THUTO_WHATSAPP_PROMPT =
  'You are THUTO, the GrassRoots Sports AI coach for male athletes in Zimbabwe. ' +
  'Reply via WhatsApp so keep it under 280 characters. Be direct, specific, and encouraging. ' +
  'Reference Zimbabwe football where relevant.';

const AMARA_WHATSAPP_PROMPT =
  'You are Amara, the GrassRoots Sports AI coach for female athletes in Zimbabwe. ' +
  'Reply via WhatsApp so keep it under 280 characters. Be warm, technically precise, and encouraging. ' +
  'Never compare female athletes to male benchmarks.';

const API = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: NextRequest) {
  const { from, message } = await req.json();

  // Normalise phone — strip country code prefix variations
  const phone = (from ?? '').replace(/^whatsapp:/, '').replace(/^\+/, '');
  const upper = (message ?? '').trim().toUpperCase();

  let reply = '';

  try {

    // ── HELP ──────────────────────────────────────────────────────────────
    if (upper === 'HELP' || upper === 'HI' || upper === 'HELLO') {
      reply = [
        'GRS Commands:',
        'THUTO [question] — boys AI coach',
        'AMARA [question] — girls AI coach',
        'SCORE — your AQ + rank',
        'DRILLS — your unlocked drills',
        'PASSPORT — your scout link',
        'grassrootssports.live',
      ].join('\n');
      return NextResponse.json({ reply });
    }

    // ── SCORE ─────────────────────────────────────────────────────────────
    if (upper === 'SCORE' || upper === 'AQ' || upper === 'STATS') {
      try {
        const res = await fetch(`${API}/player/score-by-phone/${encodeURIComponent(phone)}`);
        if (res.ok) {
          const p = await res.json();
          reply = `${p.name} | Rank: ${p.rank} | AQ: ${p.aq_score ?? '—'} | Streak: ${p.weekly_streak ?? 0} weeks\ngrassrootssports.live/player`;
        } else {
          reply = 'No account found. Register at grassrootssports.live';
        }
      } catch {
        reply = 'Could not fetch your score. Visit grassrootssports.live/player';
      }
      return NextResponse.json({ reply });
    }

    // ── DRILLS ────────────────────────────────────────────────────────────
    if (upper === 'DRILLS' || upper === 'DRILL') {
      try {
        const res = await fetch(`${API}/player/drills-by-phone/${encodeURIComponent(phone)}`);
        if (res.ok) {
          const data = await res.json();
          const list = (data.drills ?? []).slice(0, 3).map((d: any) => `• ${d.drill_name}`).join('\n');
          reply = `Your drills (Tier ${data.current_tier}):\n${list}\n\ngrassrootssports.live/player/drills`;
        } else {
          reply = 'Complete a test session first to unlock drills.\ngrassrootssports.live/player/talent-id';
        }
      } catch {
        reply = 'Visit grassrootssports.live/player/drills';
      }
      return NextResponse.json({ reply });
    }

    // ── THUTO / AMARA / COACH coaching question ───────────────────────────
    // Detect gender from command prefix — AMARA = female, THUTO/COACH = male
    let question  = (message ?? '').trim();
    let isAmara   = false;

    for (const prefix of ['AMARA ', 'THUTO ', 'COACH ']) {
      if (upper.startsWith(prefix)) {
        isAmara  = prefix === 'AMARA ';
        question = message.slice(prefix.length).trim();
        break;
      }
    }

    // Try to get player gender from bhora-ai to auto-select coach
    if (!isAmara && phone) {
      try {
        const res = await fetch(`${API}/player/score-by-phone/${encodeURIComponent(phone)}`);
        if (res.ok) {
          const p = await res.json();
          isAmara = p.gender === 'female';
        }
      } catch { /* default to THUTO */ }
    }

    if (!question || question.length < 3) {
      const name = isAmara ? 'Amara' : 'THUTO';
      reply = `${name} here. Ask me anything about your training.\nExample: ${isAmara ? 'AMARA' : 'THUTO'} how do I improve my sprint time?`;
      return NextResponse.json({ reply });
    }

    // Call Claude
    const systemPrompt = isAmara ? AMARA_WHATSAPP_PROMPT : THUTO_WHATSAPP_PROMPT;

    const msg = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 150,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: question }],
    });

    reply = msg.content[0].type === 'text' ? msg.content[0].text.trim() : 'Ask me your training question.';

    // Enforce WhatsApp character limit
    if (reply.length > 300) reply = reply.slice(0, 297) + '...';

  } catch (err) {
    console.error('THUTO WhatsApp error:', err);
    reply = 'Your coach is resting. Try again in a moment.';
  }

  return NextResponse.json({ reply });
}