import { NextRequest, NextResponse } from 'next/server';

// POST /api/analyse-from-uri
// ─────────────────────────────────────────────────────────────────────────────
// Receives a Gemini File URI (already uploaded by the browser directly to
// Google via XHR — no video bytes ever pass through Vercel).
// Body: { fileUri, fileName, mimeType, sport, drill, position, token }
//
// Flow:
//   1. Check credits via Laravel GET /video-analysis/credits
//   2. Poll Gemini until file is ACTIVE (max 3 min)
//   3. Generate coaching feedback
//   4. Record usage via Laravel POST /video-analysis/record
//   5. Return { feedback, free_trial, is_pro }
// ─────────────────────────────────────────────────────────────────────────────

export const maxDuration = 300;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
const API_URL        = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

function buildContext(sport: string, drill: string, position: string): string {
  const key = `${sport} ${drill}`.toLowerCase();

  const map: Record<string, string> = {
    'football sprint':    'Player performing a football sprint drill. Analyse acceleration, body lean, arm drive, stride length, and running form across the full clip.',
    'football dribbling': 'Player performing a dribbling drill. Analyse touch quality, body shape in possession, head position, and change of direction technique.',
    'football shooting':  'Player shooting at goal. Analyse approach, plant foot, body shape at contact, foot contact point, and follow-through.',
    'football passing':   'Player performing a passing drill. Analyse body shape, supporting foot position, technique, and weight and accuracy of pass.',
    'football defending': 'Player in a defensive drill. Analyse approach, body shape, tackle timing, and recovery position.',
    'football heading':   'Player performing a heading drill. Analyse jump timing, body position at peak, neck muscles at contact, and landing.',
    'football juggling':  'Player juggling a football. Analyse touch quality, body shape, balance, and consistency across repetitions.',
    'football agility':   'Player performing an agility drill. Analyse foot speed, coordination, posture through each gate, and whether form holds across reps.',
    'rugby sprint':       'Rugby player performing a sprint drill. Analyse acceleration, running form, arm drive, and whether speed is maintained.',
    'rugby tackle':       'Rugby player practising tackling. Analyse approach angle, body position, tackle height, and safety of technique.',
    'rugby carry':        'Rugby player carrying the ball. Analyse body position, protection of the ball, leg drive, and contact technique.',
    'athletics sprint':   'Athlete performing a sprint. Analyse reaction, acceleration phase, running form, arm mechanics, and finish.',
    'athletics long jump':'Athlete performing a long jump. Analyse run-up consistency, take-off technique, body position in flight, and landing.',
    'athletics hurdles':  'Athlete performing hurdles. Analyse stride pattern, lead leg, trail leg technique, body lean, and rhythm.',
    'netball shooting':   'Netball player shooting. Analyse footwork, body position, ball release point, arc, and follow-through.',
    'netball footwork':   'Netball player performing footwork drills. Analyse landing, pivoting, footwork accuracy, and balance.',
    'netball passing':    'Netball player performing passing drills. Analyse technique, ball speed, accuracy, and body position.',
    'basketball shooting':'Basketball player shooting. Analyse stance, release point, arc, follow-through, and consistency.',
    'basketball dribbling':'Basketball player dribbling. Analyse ball control, body position, change of direction, and use of both hands.',
    'cricket batting':    'Cricket batsman at the crease. Analyse stance, backlift, footwork, shot selection, weight transfer, and follow-through.',
    'cricket bowling':    'Cricket bowler in action. Analyse run-up, gather, front arm, body rotation, release point, and follow-through.',
    'swimming freestyle': 'Swimmer performing freestyle. Analyse body position in water, stroke technique, breathing rhythm, kick pattern, and turns.',
    'tennis serve':       'Tennis player serving. Analyse ball toss, trophy position, contact point, body rotation, and follow-through.',
    'tennis forehand':    'Tennis player hitting forehand. Analyse grip, stance, backswing, contact point, follow-through, and footwork.',
    'volleyball spike':   'Volleyball player spiking. Analyse approach footwork, jump timing, arm swing, hand position, and landing.',
    'volleyball serve':   'Volleyball player serving. Analyse stance, toss, contact point, arm swing, and ball flight.',
    'hockey dribbling':   'Hockey player dribbling. Analyse stick grip, body position, control, and change of direction technique.',
    'hockey shooting':    'Hockey player shooting. Analyse approach, stick position, body shape at contact, and follow-through.',
  };

  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k.split(' ')[1]) && key.includes(k.split(' ')[0])) return v;
  }
  for (const [, v] of Object.entries(map)) {
    if (key.startsWith(sport.toLowerCase())) return v;
  }

  return `A ${position} performing a ${sport} ${drill} drill. ` +
    'Watch the full video and analyse movement quality, body position, technique, ' +
    'and athletic execution. Identify one clear strength and one improvement.';
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'AI analysis is not configured. Please contact support.' },
      { status: 503 }
    );
  }

  let fileUri  = '';
  let fileName = '';
  let mimeType = 'video/mp4';
  let sport    = 'football';
  let drill    = 'drill';
  let position = 'player';
  let token    = '';

  try {
    const body = await req.json() as Record<string, string>;
    fileUri  = body.fileUri  ?? '';
    fileName = body.fileName ?? '';
    mimeType = body.mimeType ?? 'video/mp4';
    sport    = body.sport    ?? 'football';
    drill    = body.drill    ?? 'drill';
    position = body.position ?? 'player';
    token    = body.token    ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!fileUri) {
    return NextResponse.json({ error: 'No file URI provided.' }, { status: 400 });
  }

  // ── Require authentication ────────────────────────────────────────────────
  if (!token) {
    return NextResponse.json(
      { error: 'Please log in to use AI analysis.', login_required: true },
      { status: 401 }
    );
  }

  // ── Check credits via Laravel ─────────────────────────────────────────────
  let canAnalyse = true;
  let freeTrial  = false;
  let isPro      = false;

  try {
    const credRes = await fetch(`${API_URL}/video-analysis/credits`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (credRes.ok) {
      const cred = await credRes.json() as { can_analyse?: boolean; free_trial?: boolean; is_pro?: boolean };
      canAnalyse = cred.can_analyse ?? true;
      freeTrial  = cred.free_trial  ?? false;
      isPro      = cred.is_pro      ?? false;
    }
  } catch {
    // Non-fatal — allow on credit check failure
  }

  if (!canAnalyse) {
    return NextResponse.json({
      error:       'free_trial_used',
      message:     'Your free trial has been used. Upgrade to Pro for unlimited AI drill analysis.',
      upgrade_url: '/player/subscription',
    }, { status: 402 });
  }

  // ── Poll until Gemini file is ACTIVE (max 3 min) ─────────────────────────
  if (fileName) {
    for (let i = 0; i < 36; i++) {
      await new Promise((r) => setTimeout(r, 5_000));
      try {
        const stateRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_API_KEY}`,
          { signal: AbortSignal.timeout(10_000) }
        );
        if (stateRes.ok) {
          const s = await stateRes.json() as { state?: string };
          if (s.state === 'ACTIVE') break;
        }
      } catch {
        // Continue polling
      }
    }
  }

  // ── Generate coaching feedback ────────────────────────────────────────────
  const context = buildContext(sport, drill, position);
  const genRes  = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { file_data: { mime_type: mimeType, file_uri: fileUri } },
            {
              text:
                `You are an elite sports coach working with grassroots athletes in Zimbabwe. ` +
                `Watch this video carefully — you can see the full movement across time.\n\n` +
                `Context: ${context}\n\n` +
                `Give honest, specific feedback based on what you actually observe:\n` +
                `1. One strength — what the athlete is doing well (1 sentence).\n` +
                `2. One improvement — the most important thing to fix (1 sentence, specific).\n` +
                `3. One drill — a simple exercise to improve that area (1 sentence).\n\n` +
                `Keep language simple and encouraging. 3 sentences total. ` +
                `If the movement is not clearly visible, say so honestly.`,
            },
          ],
        }],
        generationConfig: { maxOutputTokens: 300 },
      }),
      signal: AbortSignal.timeout(45_000),
    }
  );

  if (!genRes.ok) {
    return NextResponse.json({ error: 'AI could not process the video. Please try again.' }, { status: 502 });
  }

  const genData  = await genRes.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const feedback = genData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!feedback) {
    return NextResponse.json({ error: 'No feedback returned. Try a clearer, shorter clip.' }, { status: 502 });
  }

  // ── Record usage via Laravel ──────────────────────────────────────────────
  if (token) {
    try {
      await fetch(`${API_URL}/video-analysis/record`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal:  AbortSignal.timeout(6_000),
      });
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json({ feedback, free_trial: freeTrial, is_pro: isPro });
}
