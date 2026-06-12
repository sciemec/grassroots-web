// src/app/api/thuto/whatsapp/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// THUTO / Amara on WhatsApp — Twilio webhook handler
//
// SUPPORTED INPUT TYPES:
//   Video message → download → R2 → Laravel async analysis → Arena post
//   Text message  → command routing or AI coaching
//
// TEXT COMMANDS:
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
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const API = process.env.NEXT_PUBLIC_API_URL;
const MAX_REPLY_LENGTH = 1500;

// Lazy singletons
let _twilioClient: ReturnType<typeof twilio> | null = null;
let _groq: Groq | null = null;
let _r2: S3Client | null = null;

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

function getR2(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const keyId     = process.env.R2_ACCESS_KEY_ID;
  const secret    = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !keyId || !secret) return null;
  if (!_r2) {
    _r2 = new S3Client({
      region:   'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: keyId, secretAccessKey: secret },
    });
  }
  return _r2;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface GrsUser {
  id:             string;
  name:           string;
  gender:         'male' | 'female' | string;
  role:           string;
  sport?:         string;
  position?:      string;
  rank?:          number | string;
  aq_score?:      number;
  weekly_streak?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function sendWhatsApp(to: string, body: string) {
  await getTwilio().messages.create({
    body,
    from: process.env.TWILIO_WHATSAPP_FROM,
    to:   `whatsapp:${to}`,
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

async function lookupUser(phone: string): Promise<GrsUser | null> {
  try {
    const res = await fetch(
      `${API}/player/score-by-phone/${encodeURIComponent(phone)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.data ?? data) as GrsUser;
  } catch {
    return null;
  }
}

function buildSystemPrompt(user: GrsUser | null, isAmara: boolean): string {
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

// ── Video pipeline ────────────────────────────────────────────────────────────

async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string | null> {
  const r2        = getR2();
  const bucket    = process.env.R2_BUCKET ?? 'grassroots-videos';
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!r2 || !publicUrl) return null;
  try {
    await r2.send(new PutObjectCommand({
      Bucket:      bucket,
      Key:         key,
      Body:        buffer,
      ContentType: contentType,
    }));
    return `${publicUrl}/${key}`;
  } catch {
    return null;
  }
}

async function handleVideoMessage(
  fromPhone:   string,
  mediaUrl:    string,
  contentType: string,
  profileName: string,
  user:        GrsUser | null,
): Promise<NextResponse> {

  // 1. Download video from Twilio (Basic Auth required)
  let videoBuffer: Buffer | null = null;
  try {
    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString('base64');
    const dlRes = await fetch(mediaUrl, {
      headers: { Authorization: `Basic ${auth}` },
      signal:  AbortSignal.timeout(25000),
    });
    if (dlRes.ok) videoBuffer = Buffer.from(await dlRes.arrayBuffer());
  } catch { /* fall through — R2 url will be null */ }

  // 2. Upload to R2 so Laravel job can download without Twilio auth
  let videoStorageUrl: string | null = null;
  if (videoBuffer) {
    const digits = fromPhone.replace(/\D/g, '');
    const ext    = contentType.split('/')[1]?.split(';')[0] ?? 'mp4';
    const r2Key  = `whatsapp/${digits}/${Date.now()}.${ext}`;
    videoStorageUrl = await uploadToR2(videoBuffer, r2Key, contentType);
  }

  // Fall back to original Twilio URL if R2 upload failed
  const analysisUrl = videoStorageUrl ?? mediaUrl;

  // 3. Fire-and-forget to Laravel — triggers async YOLOv8 analysis + Arena post
  try {
    await fetch(`${API}/arena/auto-video-post`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        phone:    fromPhone,
        video_url: analysisUrl,
        user_id:  user?.id ?? null,
        sport:    user?.sport ?? null,
      }),
      signal: AbortSignal.timeout(6000),
    });
  } catch { /* fire-and-forget — job queued on Laravel */ }

  // 4. Immediate reply — Twilio requires response within 15s
  let reply: string;
  if (user) {
    reply = [
      `Got your video ${user.name}!`,
      '',
      'The GRS engine is analysing it now.',
      'Your Arena post + performance report will be live at:',
      'grassrootssports.live/arena',
      '',
      "You'll get a WhatsApp message when it's posted.",
    ].join('\n');
  } else {
    const name = profileName || 'there';
    reply = [
      `Got your video ${name}!`,
      '',
      'Register free to post this to The Arena:',
      'grassrootssports.live/register',
      '',
      'Already registered? Link your WhatsApp number in Profile Settings to auto-post your clips.',
    ].join('\n');
  }

  await sendWhatsApp(fromPhone, reply);
  return twimlReply(reply);
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData    = await req.formData();
    const rawFrom     = formData.get('From')?.toString() ?? '';
    const messageBody = formData.get('Body')?.toString().trim() ?? '';
    const profileName = formData.get('ProfileName')?.toString() ?? '';
    const numMedia    = parseInt(formData.get('NumMedia')?.toString() ?? '0');
    const mediaUrl    = formData.get('MediaUrl0')?.toString() ?? '';
    const mediaType   = formData.get('MediaContentType0')?.toString() ?? '';

    // Normalize: "whatsapp:+263712345678" → "+263712345678"
    const fromPhone = rawFrom.replace('whatsapp:', '');
    if (!fromPhone) return twimlEmpty();

    // ONE user lookup — used for all branches below
    const user = await lookupUser(fromPhone);

    // ── VIDEO — intercept before any text processing ───────────────────────
    if (numMedia > 0 && mediaUrl && mediaType.startsWith('video/')) {
      return handleVideoMessage(fromPhone, mediaUrl, mediaType, profileName, user);
    }

    if (!messageBody) return twimlEmpty();

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
          'Send a video — post to your Arena feed',
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
          'Or send a video — we\'ll analyse it!',
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
      const reply = `${coachName} here. Ask me anything about your training.\nExample: ${prefix} how do I improve my sprint?\nOr send a video to post to your Arena feed!`;
      await sendWhatsApp(fromPhone, reply);
      return twimlReply(reply);
    }

    // Call Groq with personalized context
    const systemPrompt = buildSystemPrompt(user, isAmara);

    const completion = await getGroq().chat.completions.create({
      model:       'llama-3.1-8b-instant',
      messages:    [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: question },
      ],
      max_tokens:  200,
      temperature: 0.7,
    });

    let reply = completion.choices[0]?.message?.content?.trim() ?? "I couldn't process that. Ask me again!";

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
