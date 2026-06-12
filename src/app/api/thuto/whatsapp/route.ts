// src/app/api/thuto/whatsapp/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// THUTO / Amara on WhatsApp — Twilio webhook handler
//
// Supports commands: THUTO [question], AMARA [question], SCORE, DRILLS, HELP
// Uses Groq (lightweight) for AI responses when a question is asked
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import Groq from 'groq-sdk';

const API = process.env.NEXT_PUBLIC_API_URL;

// Lazy singletons — instantiated on first request, not at module load
// This prevents "c(...) is not a constructor" during Next.js static analysis
let _twilioClient: ReturnType<typeof twilio> | null = null;
let _groq: Groq | null = null;

function getTwilioClient() {
  if (!_twilioClient) {
    _twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return _twilioClient;
}

function getGroq() {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

// WhatsApp message limits
const MAX_REPLY_LENGTH = 300;

// System prompts for AI coach
const THUTO_PROMPT = `You are THUTO, the GrassRoots Sports AI coach for male athletes in Zimbabwe.
Reply via WhatsApp so keep it under 280 characters. Be direct, specific, and encouraging.
Reference Zimbabwe football where relevant. Never use markdown or emojis.`;

const AMARA_PROMPT = `You are Amara, the GrassRoots Sports AI coach for female athletes in Zimbabwe.
Reply via WhatsApp so keep it under 280 characters. Be warm, technically precise, and encouraging.
Never compare female athletes to male benchmarks. Never use markdown or emojis.`;

// Helper to send WhatsApp message
async function sendWhatsAppMessage(to: string, body: string) {
  await getTwilioClient().messages.create({
    body: body,
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${to}`,
  });
}

// Helper to create XML response for Twilio
function twimlReply(message: string): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;
  return new NextResponse(xml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    // Parse Twilio webhook (form data from WhatsApp)
    const formData = await req.formData();
    const messageBody = formData.get('Body')?.toString().trim() ?? '';
    const fromNumber = formData.get('From')?.toString().replace('whatsapp:', '') ?? '';
    const profileName = formData.get('ProfileName')?.toString() ?? '';

    if (!messageBody || !fromNumber) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const upper = messageBody.toUpperCase();
    let reply = '';

    // ── HELP / HI / HELLO ─────────────────────────────────────────────────
    if (upper === 'HELP' || upper === 'HI' || upper === 'HELLO') {
      reply = [
        '🏆 GRS Commands:',
        'THUTO [question] — boys AI coach',
        'AMARA [question] — girls AI coach',
        'SCORE — your AQ + rank',
        'DRILLS — your unlocked drills',
        'PASSPORT — your scout link',
        'grassrootssports.live',
      ].join('\n');
      await sendWhatsAppMessage(fromNumber, reply);
      return twimlReply(reply);
    }

    // ── SCORE / AQ / STATS ────────────────────────────────────────────────
    if (upper === 'SCORE' || upper === 'AQ' || upper === 'STATS') {
      try {
        const res = await fetch(`${API}/player/score-by-phone/${encodeURIComponent(fromNumber)}`);
        if (res.ok) {
          const p = await res.json();
          reply = `${p.name || 'Athlete'} | Rank: ${p.rank || '—'} | AQ: ${p.aq_score ?? '—'} | Streak: ${p.weekly_streak ?? 0} weeks\n👉 grassrootssports.live/player`;
        } else {
          reply = 'No account found. Register at grassrootssports.live/player';
        }
      } catch {
        reply = 'Could not fetch your score. Visit grassrootssports.live/player';
      }
      await sendWhatsAppMessage(fromNumber, reply);
      return twimlReply(reply);
    }

    // ── DRILLS / DRILL ────────────────────────────────────────────────────
    if (upper === 'DRILLS' || upper === 'DRILL') {
      try {
        const res = await fetch(`${API}/player/drills-by-phone/${encodeURIComponent(fromNumber)}`);
        if (res.ok) {
          const data = await res.json();
          const list = (data.drills ?? []).slice(0, 3).map((d: any) => `• ${d.drill_name}`).join('\n');
          reply = `Your drills (Tier ${data.current_tier || '—'}):\n${list || 'No drills yet'}\n\n👉 grassrootssports.live/player/drills`;
        } else {
          reply = 'Complete a test session first to unlock drills.\n👉 grassrootssports.live/player/talent-id';
        }
      } catch {
        reply = 'Visit grassrootssports.live/player/drills to see your drills.';
      }
      await sendWhatsAppMessage(fromNumber, reply);
      return twimlReply(reply);
    }

    // ── PASSPORT / CV / SHARE ──────────────────────────────────────────────
    if (upper === 'PASSPORT' || upper === 'CV' || upper === 'SHARE') {
      reply = `Your Talent Passport: grassrootssports.live/passport/${fromNumber}\nShare this link with scouts!`;
      await sendWhatsAppMessage(fromNumber, reply);
      return twimlReply(reply);
    }

    // ── THUTO / AMARA / COACH coaching question ───────────────────────────
    let question = messageBody;
    let isAmara = false;

    // Check for command prefixes
    if (upper.startsWith('THUTO ')) {
      isAmara = false;
      question = messageBody.slice(6).trim();
    } else if (upper.startsWith('AMARA ')) {
      isAmara = true;
      question = messageBody.slice(6).trim();
    } else if (upper.startsWith('COACH ')) {
      isAmara = false;
      question = messageBody.slice(6).trim();
    } else {
      // No prefix - try to detect gender from backend
      try {
        const res = await fetch(`${API}/player/score-by-phone/${encodeURIComponent(fromNumber)}`);
        if (res.ok) {
          const p = await res.json();
          isAmara = p.gender === 'female';
        }
      } catch { /* default to THUTO */ }
    }

    // If no question, show help
    if (!question || question.length < 2) {
      const coachName = isAmara ? 'Amara' : 'THUTO';
      reply = `${coachName} here. Ask me about your training.\nExample: ${isAmara ? 'AMARA' : 'THUTO'} how do I improve my sprint time?`;
      await sendWhatsAppMessage(fromNumber, reply);
      return twimlReply(reply);
    }

    // Call Groq AI for response
    try {
      const systemPrompt = isAmara ? AMARA_PROMPT : THUTO_PROMPT;

      const completion = await getGroq().chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      reply = completion.choices[0]?.message?.content || "I couldn't process that. Ask me again!";

      // Enforce WhatsApp character limit
      if (reply.length > MAX_REPLY_LENGTH) {
        reply = reply.slice(0, MAX_REPLY_LENGTH - 3) + '...';
      }

      await sendWhatsAppMessage(fromNumber, reply);
      return twimlReply(reply);

    } catch (aiError) {
      console.error('AI error:', aiError);
      reply = 'Your coach is resting. Try again in a moment.';
      await sendWhatsAppMessage(fromNumber, reply);
      return twimlReply(reply);
    }

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    const errorReply = 'Something went wrong. Try again later.';
    return twimlReply(errorReply);
  }
}

// For Twilio webhook verification (GET request)
export async function GET() {
  return new NextResponse('OK', { status: 200 });
}