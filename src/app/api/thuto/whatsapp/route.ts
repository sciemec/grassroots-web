// src/app/api/thuto/whatsapp/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// THUTO on WhatsApp — Claude API coaching via the existing WhatsApp bot
//
// This route is called by the EXISTING /api/whatsapp/route.ts when a player
// sends a text message starting with "THUTO" or "COACH" to the GRS number.
//
// The existing WhatsApp route handles:
//   - Video uploads (Twilio → R2 → YOLOv8 analysis)
//   - Video routing (two-turn flow)
//
// This route handles:
//   - THUTO [question] → Claude API → short coaching reply
//   - SCORE → fetch player AQ/rank from bhora-ai
//   - DRILLS → list unlocked drills
//   - HELP → command list
//
// HOW TO WIRE INTO EXISTING WHATSAPP ROUTE:
// In src/app/api/whatsapp/route.ts, after the video routing block, add:
//
//   const body = await req.text();
//   const params = new URLSearchParams(body);
//   const msgBody = params.get('Body')?.trim().toUpperCase() ?? '';
//
//   if (msgBody.startsWith('THUTO') || msgBody.startsWith('COACH') ||
//       msgBody === 'SCORE' || msgBody === 'DRILLS' || msgBody === 'HELP') {
//     const res = await fetch('/api/thuto/whatsapp', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ from: params.get('From'), message: params.get('Body') }),
//     });
//     const { reply } = await res.json();
//     return twimlReply(reply);
//   }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// WhatsApp messages must be short — keep under 300 chars
const SYSTEM_PROMPT = `You are THUTO, the GrassRoots Sports AI coach. You help young football players in Zimbabwe improve.
Keep every reply under 280 characters — this is WhatsApp. Be direct, encouraging, practical.
Reference Zimbabwe football culture where relevant. Never give generic advice — always be specific.`;

export async function POST(req: NextRequest) {
  const { from, message } = await req.json();

  const upperMsg = message?.trim().toUpperCase() ?? '';
  let reply = '';

  try {

    // ── HELP command ─────────────────────────────────────────────────────────
    if (upperMsg === 'HELP' || upperMsg === 'HI' || upperMsg === 'HELLO') {
      reply = [
        'GRS Commands:',
        'THUTO [question] — ask your AI coach',
        'SCORE — your AQ score and rank',
        'DRILLS — your unlocked drills',
        'VIDEO — send a training video',
        'Or visit grassrootssports.live',
      ].join('\n');
      return NextResponse.json({ reply });
    }

    // ── SCORE command ─────────────────────────────────────────────────────────
    if (upperMsg === 'SCORE' || upperMsg === 'AQ' || upperMsg === 'STATS') {
      const phone = from?.replace('whatsapp:+', '') ?? '';
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/player/score-by-phone/${phone}`,
          { headers: { 'Accept': 'application/json' } }
        );
        if (res.ok) {
          const data = await res.json();
          reply = `${data.name} | Rank: ${data.rank} | AQ: ${data.aq_score ?? '—'} | Streak: ${data.weekly_streak ?? 0} weeks\ngrassrootssports.live/player`;
        } else {
          reply = 'No account found for this number. Register at grassrootssports.live';
        }
      } catch {
        reply = 'Could not fetch your score right now. Try again or visit grassrootssports.live';
      }
      return NextResponse.json({ reply });
    }

    // ── DRILLS command ────────────────────────────────────────────────────────
    if (upperMsg === 'DRILLS' || upperMsg === 'DRILL') {
      const phone = from?.replace('whatsapp:+', '') ?? '';
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/player/drills-by-phone/${phone}`,
          { headers: { 'Accept': 'application/json' } }
        );
        if (res.ok) {
          const data = await res.json();
          const drillList = (data.drills ?? []).slice(0, 3).map((d: any) => `• ${d.name}`).join('\n');
          reply = `Your unlocked drills (Tier ${data.current_tier}):\n${drillList}\n\nSee all: grassrootssports.live/player/drills`;
        } else {
          reply = 'Complete a test session first to unlock your drills. Visit grassrootssports.live/player/talent-id';
        }
      } catch {
        reply = 'Visit grassrootssports.live/player/drills to see your drills.';
      }
      return NextResponse.json({ reply });
    }

    // ── THUTO / COACH question ────────────────────────────────────────────────
    // Strip the command keyword and get the actual question
    let question = message?.trim() ?? '';
    if (upperMsg.startsWith('THUTO ')) question = message.slice(6).trim();
    if (upperMsg.startsWith('COACH ')) question = message.slice(6).trim();
    if (!question || question.length < 3) {
      reply = 'Ask me anything about your training.\nExample: THUTO how do I improve my sprint time?';
      return NextResponse.json({ reply });
    }

    // Fetch player context if we have their phone number
    let playerContext = '';
    const phone = from?.replace('whatsapp:+', '') ?? '';
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/player/score-by-phone/${phone}`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (res.ok) {
        const p = await res.json();
        playerContext = `Player: ${p.name}, age group ${p.age_group}, position ${p.position}, AQ ${p.aq_score ?? 'not tested'}. `;
      }
    } catch { /* no context available */ }

    // Call Claude API
    const msg = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 150,
      system:     SYSTEM_PROMPT,
      messages:   [{
        role:    'user',
        content: `${playerContext}Question: ${question}`,
      }],
    });

    reply = msg.content[0].type === 'text' ? msg.content[0].text.trim() : 'Ask me your training question and I will help.';

    // Enforce WhatsApp length limit
    if (reply.length > 300) reply = reply.slice(0, 297) + '...';

  } catch (err) {
    console.error('THUTO WhatsApp error:', err);
    reply = 'THUTO is resting. Try again in a moment, or visit grassrootssports.live';
  }

  return NextResponse.json({ reply });
}