// src/app/api/thuto/whatsapp/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// THUTO / Amara on WhatsApp — Twilio webhook handler
//
// When someone messages the GrassRoots Sports WhatsApp number:
// 1. Their phone number is looked up against registered accounts (phone OR whatsapp_phone)
// 2. If registered  → greet by name, use their sport/position context in AI responses
// 3. If unregistered → let them try coaching free, prompt them to register to save progress
//
// Supported commands:
//   HELP / HI / HELLO   — welcome + command list
//   SCORE               — their AQ score + rank
//   DRILLS              — their unlocked drills
//   PASSPORT / CV       — their scout profile link
//   THUTO [question]    — AI coaching (male persona)
//   AMARA [question]    — AI coaching (female persona)
//   Any other text      — AI coaching using detected gender
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import Groq from 'groq-sdk';

const API = process.env.NEXT_PUBLIC_API_URL;
const MAX_REPLY_LENGTH = 1500; // WhatsApp supports up to ~4096 chars; we keep it readable

// Lazy singletons — prevent "c(...) is not a constructor" at module load
let _twilioClient: ReturnType<typeof twilio> | null = null;
let _groq: Groq | null = null;

function getTwilio() {
  if (!_twilioClient) {
    _twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return _twilioClient;
}

function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface GrsUser {
  id:            string;
  name:          string;
  gender:        'male' | 'female' | string;
  role:          string;
  sport?:        string;
  position?:     string;
  rank?:         number | string;
  aq_score?:     number;
  weekly_streak?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function sendWhatsApp(to: string, body: string) {
  await getTwilio().messages.create({
    body,
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${to}`,
  });
}

function twimlReply(message: string): NextResponse {
  const safe = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  );
}

function twimlEmpty(): NextResponse {
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { 'Content-Type': 'text/xml' } }
  );
}

// Look up a registered user by their WhatsApp phone number.
// The backend checks both `phone` and `whatsapp_phone` columns.
async function lookupUser(phone: string): Promise<GrsUser | null> {
  try {
    const res = await fetch(
      `${API}/player/score-by-phone/${encodeURIComponent(phone)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Backend may wrap in { data: ... }
    return (data.data ?? data) as GrsUser;
  } catch {
    return null;
  }
}

// Build a personalized system prompt for the AI coach
function buildSystemPrompt(user: GrsUser | null, isAmara: boolean): string {
  const coachName = isAmara ? 'Amara' : 'THUTO';
  const gender    = isAmara ? 'female' : 'male';

  const base = isAmara
    ? `You are Amara, the GrassRoots Sports AI coach for female athletes in Zimbabwe. Be warm, technically precise, and encouraging. Never compare female athletes to male benchmarks.`
    : `You are THUTO, the GrassRoots Sports AI coach for male athletes in Zimbabwe. Be direct, specific, and encouraging. Reference Zimbabwe football where relevant.`;

  const rules = `Reply via WhatsApp — keep it under 280 characters. No markdown. No emojis.`;

  if (!user) {
    return `${base} ${rules} The athlete is not yet registered. After answering, remind them to register at grassrootssports.live to save their progress.`;
  }

  const sport    = user.sport    ? `Sport: ${user.sport}.`    : '';
  const position = user.position ? `Position: ${user.position}.` : '';
  const streak   = user.weekly_streak ? `Training streak: ${user.weekly_streak} weeks.` : '';

  return `${base} ${rules} You are speaking with ${user.name}. ${sport} ${position} ${streak} Address them by name when appropriate. Tailor advice to their sport and position.`.trim();
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData   = await req.formData();
    const rawFrom    = formData.get('From')?.toString() ?? '';
    const messageBody = formData.get('Body')?.toString().trim() ?? '';
    const profileName = formData.get('ProfileName')?.toString() ?? '';

    // Normalize number: "whatsapp:+263712345678" → "+263712345678"
    const fromPhone = rawFrom.replace('whatsapp:', '');

    if (!messageBody || !fromPhone) return twimlEmpty();

    // ── ONE user lookup, used for all branches below ───────────────────────
    const user = await lookupUser(fromPhone);
    const upper = messageBody.toUpperCase();

    // ── HELP / HI / HELLO / HEY ───────────────────────────────────────────
    if (['HELP', 'HI', 'HELLO', 'HEY', 'SAWUBONA', 'MHORO'].some(w => upper === w)) {
      let reply: string;

      if (user) {
        reply = [
          `Welcome back ${user.name}! Your GRS coach is here.`,
          '',
          'Commands:',
          'THUTO [question] — ask your coach',
          'SCORE — your AQ score + rank',
          'DRILLS — your training drills',
          'PASSPORT — your scout profile link',
        ].join('\n');
      } else {
        const name = profileName || 'there';
        reply = [
          `Hi ${name}! I'm THUTO, your GrassRoots Sports AI coach.`,
          '',
          'Register free to save your progress:',
          'grassrootssports.live/register',
          '',
          'Or ask me anything — THUTO how do I improve my sprint?',
        ].join('\n');
      }

      await sendWhatsApp(fromPhone, reply);
      return twimlReply(reply);
    }

    // ── SCORE / AQ / STATS ────────────────────────────────────────────────
    if (['SCORE', 'AQ', 'STATS', 'RANK'].some(w => upper === w)) {
      let reply: string;

      if (user) {
        const aq     = user.aq_score     ?? '—';
        const rank   = user.rank         ?? '—';
        const streak = user.weekly_streak ?? 0;
        reply = `${user.name} | AQ: ${aq} | Rank: ${rank} | Streak: ${streak} weeks\ngrassrootssports.live/player`;
      } else {
        reply = 'No account found for this number.\nRegister at grassrootssports.live/register\nOr link your number in your profile settings.';
      }

      await sendWhatsApp(fromPhone, reply);
      return twimlReply(reply);
    }

    // ── DRILLS ────────────────────────────────────────────────────────────
    if (['DRILLS', 'DRILL', 'TRAINING'].some(w => upper === w)) {
      let reply: string;

      if (user) {
        try {
          const res = await fetch(
            `${API}/player/drills-by-phone/${encodeURIComponent(fromPhone)}`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (res.ok) {
            const data = await res.json();
            const list = ((data.drills ?? []) as { drill_name: string }[])
              .slice(0, 3)
              .map(d => `• ${d.drill_name}`)
              .join('\n');
            reply = `${user.name}'s drills (Tier ${data.current_tier ?? '—'}):\n${list || 'No drills yet'}\n\ngrassrootssports.live/player/drills`;
          } else {
            reply = `Complete a biometric scan first to unlock drills.\ngrassrootssports.live/player/talent-id`;
          }
        } catch {
          reply = 'Visit grassrootssports.live/player/drills to see your drills.';
        }
      } else {
        reply = 'Register to unlock your personal drill programme:\ngrassrootssports.live/register';
      }

      await sendWhatsApp(fromPhone, reply);
      return twimlReply(reply);
    }

    // ── PASSPORT / CV / SHARE ─────────────────────────────────────────────
    if (['PASSPORT', 'CV', 'SHARE', 'PROFILE'].some(w => upper === w)) {
      let reply: string;

      if (user) {
        reply = `${user.name}'s Talent Passport:\ngrassrootssports.live/passport/${user.id}\n\nShare this link with scouts and coaches!`;
      } else {
        reply = 'Register to get your public Talent Passport:\ngrassrootssports.live/register';
      }

      await sendWhatsApp(fromPhone, reply);
      return twimlReply(reply);
    }

    // ── THUTO / AMARA / COACH AI question ─────────────────────────────────
    let question = messageBody;
    let isAmara  = user?.gender === 'female';

    if (upper.startsWith('THUTO ')) {
      isAmara  = false;
      question = messageBody.slice(6).trim();
    } else if (upper.startsWith('AMARA ')) {
      isAmara  = true;
      question = messageBody.slice(6).trim();
    } else if (upper.startsWith('COACH ')) {
      question = messageBody.slice(6).trim();
    }

    if (!question || question.length < 2) {
      const coachName = isAmara ? 'Amara' : 'THUTO';
      const prefix    = isAmara ? 'AMARA' : 'THUTO';
      const reply = `${coachName} here. Ask me anything about your training.\nExample: ${prefix} how do I improve my sprint?`;
      await sendWhatsApp(fromPhone, reply);
      return twimlReply(reply);
    }

    // Call Groq with personalized context
    const systemPrompt = buildSystemPrompt(user, isAmara);

    const completion = await getGroq().chat.completions.create({
      model:      'llama-3.1-8b-instant',
      messages:   [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: question },
      ],
      max_tokens:  200,
      temperature: 0.7,
    });

    let reply = completion.choices[0]?.message?.content?.trim() ?? "I couldn't process that. Ask me again!";

    // If unregistered, append a registration nudge (only once, at the end)
    if (!user && reply.length < MAX_REPLY_LENGTH - 80) {
      reply += '\n\nSave your progress: grassrootssports.live/register';
    }

    if (reply.length > MAX_REPLY_LENGTH) {
      reply = reply.slice(0, MAX_REPLY_LENGTH - 3) + '...';
    }

    await sendWhatsApp(fromPhone, reply);
    return twimlReply(reply);

  } catch (err) {
    console.error('THUTO WhatsApp error:', err);
    return twimlEmpty();
  }
}

export async function GET() {
  return new NextResponse('OK', { status: 200 });
}
