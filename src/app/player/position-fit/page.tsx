'use client';
// src/app/player/position-fit/page.tsx
// Player Position Finder — GRS Engine scores tell a player which football
// position their physical profile suits best.
// History stored in localStorage: grs_pos_fit_{playerName_snake}

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Crosshair, ChevronDown, ChevronUp, History, Star,
  Camera, Video, StopCircle, RotateCcw, CheckCircle, BookOpen,
} from 'lucide-react';
import { evaluate, type RawTestInputs, type GRSResult, type Gender, type Position } from '@/lib/grs-engine';
import { useAuthStore } from '@/lib/auth-store';

// ── Position configuration ────────────────────────────────────────────────────
type PosKey = 'striker' | 'winger' | 'midfielder' | 'defender' | 'goalkeeper';
type DomainKey = 'linearSpeed' | 'cognitiveSpeed' | 'ballMastery' | 'explosivePower' | 'balance' | 'endurance';
type CamPhase = 'idle' | 'setup' | 'recording' | 'preview' | 'processing' | 'done' | 'error';
type CamTarget = 'jump' | 'sprint' | 'juggling' | null;

interface PosConfig {
  label:      string;
  emoji:      string;
  grsPos:     Position;
  pqKey:      PosKey;
  color:      string;
  bgColor:    string;
  borderColor:string;
  tagline:    string;
  priority:   DomainKey[];
}

const POS_CONFIG: Record<PosKey, PosConfig> = {
  striker: {
    label: 'Striker', emoji: '⚽', grsPos: 'striker', pqKey: 'striker',
    color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca',
    tagline: 'Goals · Pace · Finishing',
    priority: ['linearSpeed', 'cognitiveSpeed', 'ballMastery', 'explosivePower', 'balance', 'endurance'],
  },
  winger: {
    label: 'Winger', emoji: '⚡', grsPos: 'winger', pqKey: 'winger',
    color: '#ea580c', bgColor: '#fff7ed', borderColor: '#fed7aa',
    tagline: 'Pace · Dribbling · Width',
    priority: ['linearSpeed', 'ballMastery', 'cognitiveSpeed', 'explosivePower', 'balance', 'endurance'],
  },
  midfielder: {
    label: 'Midfielder', emoji: '🧠', grsPos: 'midfielder', pqKey: 'midfielder',
    color: '#15803d', bgColor: '#f0fdf4', borderColor: '#bbf7d0',
    tagline: 'Engine · Vision · Stamina',
    priority: ['endurance', 'cognitiveSpeed', 'balance', 'ballMastery', 'linearSpeed', 'explosivePower'],
  },
  defender: {
    label: 'Defender', emoji: '🛡️', grsPos: 'defender', pqKey: 'defender',
    color: '#1d4ed8', bgColor: '#eff6ff', borderColor: '#bfdbfe',
    tagline: 'Power · Aerial · Composure',
    priority: ['explosivePower', 'linearSpeed', 'cognitiveSpeed', 'balance', 'endurance', 'ballMastery'],
  },
  goalkeeper: {
    label: 'Goalkeeper', emoji: '🧤', grsPos: 'goalkeeper', pqKey: 'goalkeeper',
    color: '#7c3aed', bgColor: '#faf5ff', borderColor: '#ddd6fe',
    tagline: 'Reflexes · Jump · Command',
    priority: ['cognitiveSpeed', 'explosivePower', 'balance', 'linearSpeed', 'ballMastery', 'endurance'],
  },
};

// ── Domain labels ─────────────────────────────────────────────────────────────
const DOMAIN_META: Record<DomainKey, { label: string; test: string }> = {
  linearSpeed:    { label: 'Sprint Speed',          test: 'T2 — 20m Sprint'      },
  cognitiveSpeed: { label: 'Reaction / Decision',   test: 'T4 — Ball Juggle (1 min)'  },
  ballMastery:    { label: 'Ball Mastery',           test: 'T6 — Juggling'        },
  explosivePower: { label: 'Explosive Power',        test: 'T1 — Jump'            },
  balance:        { label: 'Balance',                test: 'T3 — Balance'         },
  endurance:      { label: 'Agility / COD',           test: 'T5 — Illinois Agility'     },
};

// ── Test guides ───────────────────────────────────────────────────────────────
interface TestGuide {
  title:    string;
  what:     string;
  equipment: string[];
  steps:    string[];
  reps:     string;
  duration: string;
  apps:     string[];
  cameraTip:string;
  proTip:   string;
}

const TEST_GUIDE: Record<DomainKey, TestGuide> = {
  explosivePower: {
    title: 'T1 — Vertical Jump (Flight Time Method)',
    what: 'Measures your explosive leg power using flight time — the same method used by professional academies. Force plates cost thousands of dollars, but a smartphone and basic gravity equations (h = ½g(t/2)²) give you the same result within millimetres.',
    equipment: [
      'Flat, hard surface — concrete, court, or hard pitch (NOT grass — absorbs energy)',
      'Smartphone on a tripod or rested against a water bottle — camera at GROUND LEVEL, side profile',
      'My Jump Lab app (iOS/Android) — FREE, used by university sports science departments',
    ],
    steps: [
      'Position the phone at ground level, side-on, 2–3 metres away from the athlete. MUST be stationary.',
      'Stand flat-footed, feet shoulder-width apart. Swing arms back and bend knees to ~90°.',
      'Explode upward — drive arms forcefully overhead as you leave the ground.',
      'Land softly in the same spot on both feet.',
      'In My Jump Lab: tap the video to select the exact FRAME where toes leave the ground (takeoff) and the exact FRAME where toes first touch back down (landing). The app computes flight time (t) and calculates jump height using h = ½ × g × (t/2)².',
      'Do 3 attempts with 60 seconds rest between. Record your BEST result.',
    ],
    reps: '3 jumps — use best result',
    duration: '~5 minutes including rest',
    apps: [
      'My Jump Lab (iOS/Android) — frame-by-frame flight time measurement. Used by Premier League academies. FREE version works for this test.',
      'Jump Measurement (Android) — alternative app. Uses slow-motion video and auto-detects takeoff/landing frames.',
      'Manual slow-motion: Record at 240fps on iPhone or Samsung. Count frames between toe-off and toe-touch. Divide by frame rate to get flight time (t). h = ½ × 9.81 × (t/2)² in metres.',
    ],
    cameraTip: 'Camera must be at ground level, perfectly side-on, 2–3 metres away. Use 120fps or 240fps slow motion. Keep the phone on a tripod — any movement ruins frame accuracy. Key rule: same camera distance every test session for consistent comparisons.',
    proTip: 'Arms MUST swing — they contribute 10–15cm. FIFA academy reference: U13 boys avg 28cm, U17 boys avg 42cm, U17 girls avg 32cm. Record Reactive Strength Index (RSI) in My Jump Lab too — it shows how quickly you generate force, not just how high you jump.',
  },
  linearSpeed: {
    title: 'T2 — Speed & Acceleration (0–10m + 10–30m)',
    what: 'Measures both your acceleration (0–10m, first-step burst) and your top-end speed (10–30m) using slow-motion video — the same split-time method used by professional clubs without laser timing gates. You get two separate scores: acceleration and maximum velocity.',
    equipment: [
      'Flat surface — 30 metres minimum (road, track, or dry pitch)',
      '3 cones at 0m (start), 10m, and 30m',
      'Smartphone on a fixed tripod, perpendicular to the sprint path',
      'Photo Finish app or My Sprint Pro app (iOS/Android)',
    ],
    steps: [
      'Set cones at exactly 0m, 10m, and 30m. Measure with a tape — accuracy matters.',
      'Position the phone on a TRIPOD, perpendicular to the running direction, zoomed out enough to see all 3 cones. Camera must be completely STATIONARY.',
      'Record the sprint at 120fps or 240fps (slow motion).',
      'Athlete starts from a STANDING position behind the 0m cone. No crouching start.',
      'Sprint THROUGH the 30m cone without decelerating.',
      'In Photo Finish or My Sprint Pro: mark the frame when the athlete\'s chest (or hips) crosses each cone to extract 0–10m split and 10–30m split.',
      'Rest 3–4 minutes between runs. Do 2–3 attempts. Record the best time for each split.',
    ],
    reps: '2–3 sprints — best time for each split',
    duration: '~12 minutes including rest',
    apps: [
      'Photo Finish (iOS/Android) — uses slow-motion video as an optical timing gate. Mark start and finish frames manually. Accuracy: ±0.03s at 240fps.',
      'My Sprint Pro (iOS) — dedicated sprint timing from phone camera. Set up at the side of the track, detects athlete passing each marker.',
      'SpeedClock (iOS) — radar-style speed measurement from video. Good for top-speed estimate.',
      'Manual frame count — at 120fps, count frames between cone crossings. Divide by 120 to get seconds. Slow and less accurate but works offline.',
    ],
    cameraTip: 'Camera MUST be perpendicular to the run (directly to the side), on a tripod, zoomed out to see all 3 cones clearly. 240fps gives the most accurate timing. Do NOT chase the runner with the camera — it makes timing impossible. Key rule: keep a consistent distance between camera and run path each session.',
    proTip: 'Two scores are better than one. A player with a fast 0–10m but slow 10–30m is an explosive accelerator (classic striker). A player with a slow 0–10m but fast 10–30m is a top-speed runner (winger in a race). ZIFA U17 reference: elite 0–10m = sub-1.70s, elite 10–30m = sub-2.50s.',
  },
  balance: {
    title: 'T3 — Single-Leg Balance',
    what: 'Measures your proprioception and ankle stability — players with better balance have fewer ankle injuries and better composure when receiving the ball under pressure. Eyes-closed testing reveals true neuromuscular control that shoes and flat grass hide.',
    equipment: [
      'Flat, HARD surface — barefoot or thin socks only (shoes mask ankle instability)',
      'A partner to count errors (or record yourself for review)',
      'Timer or phone stopwatch',
    ],
    steps: [
      'Stand on ONE leg. The lifted foot must NOT touch the standing leg or the ground.',
      'Hold the position for 30 seconds.',
      'Each touch-down, hop, or grab = 1 error.',
      'Test in this exact order: Right leg eyes OPEN → Left leg eyes OPEN → Right leg eyes CLOSED → Left leg eyes CLOSED.',
      'Rest 30 seconds between each stance.',
      'Enter your error count for all 4 stances. Eyes-closed scores are weighted 1.5× in the GRS engine — harder = more informative.',
    ],
    reps: '4 stances × 30 seconds each',
    duration: '~5 minutes',
    apps: [
      'No app required. A partner counts errors live. If alone, record yourself with the phone propped up in front and review the video.',
      'Hudl Technique or Kinovea (free, PC) — useful for reviewing your body sway if you want to analyse form.',
    ],
    cameraTip: 'Film from directly in front at knee height. Stable camera — any movement makes foot corrections hard to count. Normal speed (30fps) is fine for this test.',
    proTip: 'Midfielders and goalkeepers need the best balance scores. Target: 0–2 errors across all 4 stances. Eyes-closed is typically 3–4× harder than eyes-open — this is normal. Training tip: progress to balance on an unstable surface (folded towel, foam pad) once you achieve 0 errors with eyes open.',
  },
  cognitiveSpeed: {
    title: 'T4 — Ball Juggle (1 Minute)',
    what: 'Measures hand-eye coordination, rhythm, and motor control under sustained effort. Counts total successful catches in a 1-minute window — the more catches maintained without a drop, the higher the score. Works with any juggleable object.',
    equipment: [
      '1 or 2 juggling objects — tennis balls, small rubber balls, oranges, rolled socks, beanbags, or anything similar in weight',
      'A timer (phone stopwatch is fine)',
      'Open space',
    ],
    steps: [
      'Player stands in open space holding their chosen juggling objects.',
      'On "Go", start a 1-minute timer.',
      'Player juggles continuously — throwing and catching alternating between hands. Any juggling style counts: 2-ball alternating, 1 ball hand-to-hand, cascade pattern.',
      'Count EVERY successful catch throughout the full minute.',
      'If a ball drops — pick it up and continue immediately. Catches already made are kept.',
      'Do 3 attempts with 2 minutes rest between. Record the BEST score.',
    ],
    reps: '3 attempts — record best catch count',
    duration: '~10 minutes including rest',
    apps: [
      'No app needed — just a phone timer and a counter (can use a tally on paper).',
      'Optional: record video and count catches in playback for accuracy.',
    ],
    cameraTip: 'Set phone on a tripod or lean it against a bag, facing the player from 3–4 metres away. You can count catches from the video replay if you lose count live.',
    proTip: 'Use the lightest objects you can find — lighter = faster rhythm = higher score. An orange or a pair of rolled-up socks works fine if tennis balls are not available. Grassroots reference: 30–60 catches/min is average, 80–100+ is strong hand-eye coordination.',
  },
  endurance: {
    title: 'T5 — Agility & Change of Direction (COD)',
    what: 'Measures your ability to decelerate, change direction, and re-accelerate — the most game-specific form of fitness for football. Traditional straight-line endurance matters less than your ability to change direction quickly and repeatedly, which is what the Chitima/Illinois test captures.',
    equipment: [
      'Cones laid out in Illinois or 5-10-5 agility pattern (standard dimensions)',
      'Smartphone on a tripod or elevated stand (standing on a bench gives a cleaner angle)',
      'Timing app or manual stopwatch',
    ],
    steps: [
      'Illinois Agility Test layout: 10m length × 5m width. 4 cones at corners + 4 central cones in a line down the middle at 3.3m intervals.',
      'Start lying face-down at the start cone, hands by shoulders.',
      'On go: sprint to the far end, weave through the 4 central cones (slalom), sprint back to finish.',
      'Record total time from "go" to crossing the finish line.',
      'Alternative — 5-10-5 Shuttle (Pro Agility): start in the middle. Sprint 5 yards right, touch the line, sprint 10 yards left, touch, sprint 5 yards back through the middle. Time from first movement to finish.',
      'Rest 3 minutes. Do 2 attempts. Record best time in total seconds (enter as minutes = 0, seconds = your time).',
    ],
    reps: '2 attempts — best time counts',
    duration: '~8 minutes including rest',
    apps: [
      'Record from an ELEVATED angle (stand on a bench, use a tripod on a table) — this eliminates cone occlusion and gives cleaner split-time visibility.',
      'Photo Finish or SpeedClock — mark start frame and finish frame in the video for accurate timing.',
      'Kinovea (free, PC) — can track split times at each direction change from video replay. Useful for identifying which direction change is slowest.',
      'Manual stopwatch with a partner — reactive start (start timing on first movement, not on voice command).',
    ],
    cameraTip: 'Elevated angle (camera on tripod on a table, or held from above) is essential for agility tests — it shows all cones and direction changes clearly. Keep the camera STATIONARY. Record at 60fps minimum. Normal speed is fine for timing; slow-motion is only needed if analysing deceleration mechanics.',
    proTip: 'Illinois Agility Test reference: U17 boys elite = sub-15.2s, average = 16–17s. U17 girls elite = sub-16.0s. 5-10-5 reference: U17 boys elite = sub-4.3s. Agility is 60% trainable — poor scores here respond well to cone drills and reactive training sessions.',
  },
  ballMastery: {
    title: 'T6 — Ball Juggling (Football)',
    what: 'Measures your technical ball control and touch quality. Juggling forces constant micro-adjustments of body position and weight transfer — the same mechanisms used in first touch, passing, and dribbling. It is the simplest standardised test of foot-eye coordination.',
    equipment: [
      'Standard football — size 4 (U13 and under), size 5 (U14 and above)',
      'Open flat surface — indoors is best (wind affects count outdoors)',
      'Smartphone camera (optional — for AI counting or review)',
    ],
    steps: [
      'Start with the ball in your hands. Drop it onto your dominant foot.',
      'Juggle using feet, knees, or thighs — any combination is allowed.',
      'Every time the ball touches the ground = end of sequence. Count stops.',
      'Do 3 attempts with 1 minute rest between. Record your BEST single sequence (most consecutive touches without a drop).',
      'Soft-ball variation (advanced): use a ball at 40% normal pressure. Much harder to control — builds superior first touch.',
      'For an extra challenge: count only alternating-foot touches (left → right → left). This is harder and maps more directly to dribbling rhythm.',
    ],
    reps: '3 attempts — best consecutive count',
    duration: '~5 minutes',
    apps: [
      'Keepy Uppy (iOS) — AI counts ball touches from phone camera in real time. FREE.',
      'Ball Juggling Counter (Android) — detects ball bounce from camera to count touches.',
      'Camera + AI Measure button below — records your session and counts touches using Gemini AI.',
    ],
    cameraTip: 'Place phone 3–4 metres away at waist height, filming from the FRONT (not from behind). Bright, even light — avoid shadows which confuse the AI counter. Normal 30fps speed is fine for counting. Use 120fps only if you want to analyse touch mechanics.',
    proTip: 'GRS reference: 0–5 = Beginner · 6–15 = Developing · 16–30 = Competent · 31–60 = Advanced · 61+ = Elite. Goalkeepers: use a tennis ball in one hand instead to test hand-eye coordination. Defenders: include heading juggles (head the ball to yourself repeatedly) — a separate useful metric.',
  },
};

// ── Reference table ───────────────────────────────────────────────────────────
const TABLE_ROWS: { test: string; striker: number; winger: number; midfielder: number; defender: number; goalkeeper: number }[] = [
  { test: 'T1 — Jump (cm)',           striker: 4, winger: 4, midfielder: 6, defender: 1, goalkeeper: 2 },
  { test: 'T2 — 20m Sprint (sec)',    striker: 1, winger: 1, midfielder: 5, defender: 2, goalkeeper: 4 },
  { test: 'T3 — Balance (errors)',    striker: 5, winger: 5, midfielder: 3, defender: 4, goalkeeper: 3 },
  { test: 'T4 — Ball Juggle (catches/min)',  striker: 2, winger: 3, midfielder: 2, defender: 3, goalkeeper: 1 },
  { test: 'T5 — Illinois Agility (sec)',       striker: 6, winger: 6, midfielder: 1, defender: 5, goalkeeper: 6 },
  { test: 'T6 — Juggling (count)',    striker: 3, winger: 2, midfielder: 4, defender: 6, goalkeeper: 5 },
];

// ── Position label for fit display ───────────────────────────────────────────
const FIT_LABELS: [PosKey, string][] = [
  ['striker',    'Striker'],
  ['winger',     'Winger'],
  ['midfielder', 'Midfielder'],
  ['defender',   'Defender'],
  ['goalkeeper', 'Goalkeeper'],
];

// ── Helpers ───────────────────────────────────────────────────────────────────
interface SavedResult { date: string; pos: PosKey; aq: number; tier: string; bestFit: string; pqFit: number }

function storageKey(name: string) { return `grs_pos_fit_${name.toLowerCase().replace(/\s+/g, '_')}`; }
function loadHistory(name: string): SavedResult[] {
  try { const r = localStorage.getItem(storageKey(name)); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveToHistory(name: string, entry: SavedResult) {
  try {
    const h = loadHistory(name); h.unshift(entry);
    localStorage.setItem(storageKey(name), JSON.stringify(h.slice(0, 10)));
  } catch { /* unavailable */ }
}
function formatChitima(sec: number) {
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}
function medalLabel(idx: number) {
  return idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PositionFitPage() {
  const user = useAuthStore((s) => s.user);

  const [pos,          setPos]          = useState<PosKey>('midfielder');
  const [playerName,   setPlayerName]   = useState(user?.name ?? '');
  const [age,          setAge]          = useState('');
  const [gender,       setGender]       = useState<Gender>('male');

  // Test inputs
  const [jumpCm,         setJumpCm]         = useState('');
  const [sprintSec,      setSprintSec]      = useState('');
  const [balRightOpen,   setBalRightOpen]   = useState('');
  const [balLeftOpen,    setBalLeftOpen]    = useState('');
  const [balRightClosed, setBalRightClosed] = useState('');
  const [balLeftClosed,  setBalLeftClosed]  = useState('');
  const [catches,        setCatches]        = useState('');
  const [chitimaSec,     setChitimaSec]     = useState('');
  const [juggles,        setJuggles]        = useState('');

  // Guide panels
  const [guideOpen, setGuideOpen] = useState<Partial<Record<DomainKey, boolean>>>({});

  // Save / share state
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [arenaSharing, setArenaSharing] = useState(false);
  const [arenaShared,  setArenaShared]  = useState(false);

  // Camera state
  const [camTarget,  setCamTarget]  = useState<CamTarget>(null);
  const [camPhase,   setCamPhase]   = useState<CamPhase>('idle');
  const [camUrl,     setCamUrl]     = useState<string | null>(null);
  const [camBlob,    setCamBlob]    = useState<Blob | null>(null);
  const [camResult,  setCamResult]  = useState<{ value: number; unit: string; confidence: string; notes: string } | null>(null);
  const [camError,   setCamError]   = useState<string | null>(null);
  const [camSeconds, setCamSeconds] = useState(0);

  const mediaRef    = useRef<MediaRecorder | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const chunksRef   = useRef<BlobPart[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef    = useRef<HTMLVideoElement>(null);

  const [result,      setResult]      = useState<GRSResult | null>(null);
  const [history,     setHistory]     = useState<SavedResult[]>([]);
  const [showTable,   setShowTable]   = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const cfg = POS_CONFIG[pos];

  const chitimaTotalSec = (() => {
    const s = parseFloat(chitimaSec);
    if (!isNaN(s) && s > 0) return s;
    return undefined;
  })();

  const runAssessment = useCallback(async () => {
    if (!playerName.trim() || !age) return;
    setSaved(false);
    setArenaShared(false);
    const inputs: RawTestInputs = {
      playerName: playerName.trim(), age: parseInt(age, 10), gender,
      position: cfg.grsPos,
      sessionDate: new Date().toISOString().split('T')[0],
      verifiedBy: 'Self-assessment', coachVerified: false,
      jumpHeightCm:       jumpCm         ? parseFloat(jumpCm)          : undefined,
      sprint20mSec:       sprintSec      ? parseFloat(sprintSec)       : undefined,
      balanceRightOpen:   balRightOpen   ? parseInt(balRightOpen,   10) : undefined,
      balanceLeftOpen:    balLeftOpen    ? parseInt(balLeftOpen,    10) : undefined,
      balanceRightClosed: balRightClosed ? parseInt(balRightClosed, 10) : undefined,
      balanceLeftClosed:  balLeftClosed  ? parseInt(balLeftClosed,  10) : undefined,
      reactionCatchRate:  catches ? parseInt(catches, 10) : undefined,
      chitimaTotalSec,
      jugglingSequence:   juggles        ? parseInt(juggles, 10)       : undefined,
    };
    const res = evaluate(inputs, []);
    setResult(res);
    const best = res.pq.bestFit;
    const entry: SavedResult = {
      date: new Date().toLocaleDateString(), pos, aq: res.aq, tier: res.tier,
      bestFit: POS_CONFIG[best as PosKey]?.label ?? best,
      pqFit: Math.round(res.pq[cfg.pqKey]),
    };
    saveToHistory(playerName.trim(), entry);
    setHistory(loadHistory(playerName.trim()));
    setShowHistory(false);

    // ── Auto-save to passport (non-blocking) ──────────────────────────────
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token && token !== 'dev-token') {
      setSaving(true);
      try {
        await fetch(`${apiBase}/player/biometrics/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            testType: 'position-fit',
            ageGroup: res.ageGroup,
            rawScore: res.aq,
            tier: res.tier,
            scoutNarrative: res.scoutNarrative,
            recommendedPositions: [POS_CONFIG[best as PosKey]?.label ?? best],
            suggestedDrills: res.suggestedDrills.map((d: { name: string }) => d.name),
          }),
        });
        setSaved(true);
      } catch {
        /* offline or server error — result already saved locally */
      } finally {
        setSaving(false);
      }
    }
  }, [playerName, age, gender, pos, cfg,
      jumpCm, sprintSec, balRightOpen, balLeftOpen, balRightClosed, balLeftClosed,
      catches, chitimaTotalSec, juggles]);

  const shareToArena = async () => {
    if (!result) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token || token === 'dev-token') return;
    const bestFitLabel = POS_CONFIG[result.pq.bestFit as PosKey]?.label ?? result.pq.bestFit;
    const bestFitPct   = Math.round(result.pq[cfg.pqKey]);
    const postBody = `Just completed my GRS Position Fit assessment!\n\nBest position: ${cfg.emoji} ${bestFitLabel} (${bestFitPct}% fit) · AQ Score: ${result.aq} · ${result.tier}\n\n"${result.scoutNarrative}"\n\n#GrassRootsSports #PositionFit #Zimbabwe`;
    setArenaSharing(true);
    try {
      await fetch(`${apiBase}/arena/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: postBody, post_type: 'milestone' }),
      });
      setArenaShared(true);
    } catch {
      /* silent */
    } finally {
      setArenaSharing(false);
    }
  };

  const openHistory = () => {
    if (playerName.trim()) { setHistory(loadHistory(playerName.trim())); setShowHistory(true); }
  };

  // ── Camera functions ──────────────────────────────────────────────────────

  const startCam = async (target: CamTarget) => {
    setCamTarget(target);
    setCamPhase('setup');
    setCamUrl(null);
    setCamBlob(null);
    setCamResult(null);
    setCamError(null);
    setCamSeconds(0);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCamError('Camera permission denied. Allow camera access and try again.');
      setCamPhase('error');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp8' });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setCamBlob(blob);
      setCamUrl(URL.createObjectURL(blob));
      setCamPhase('preview');
    };
    mr.start(200);
    mediaRef.current = mr;
    setCamPhase('recording');
    setCamSeconds(0);
    timerRef.current = setInterval(() => {
      setCamSeconds(s => {
        if (s >= 60) { stopRecording(); return s; }
        return s + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const retake = () => {
    setCamUrl(null);
    setCamBlob(null);
    setCamPhase('setup');
    chunksRef.current = [];
    startCam(camTarget);
  };

  const closeCam = () => {
    stopRecording();
    setCamTarget(null);
    setCamPhase('idle');
    setCamUrl(null);
    setCamBlob(null);
    setCamResult(null);
    setCamError(null);
  };

  const runCamMeasure = async () => {
    if (!camBlob || !camTarget) return;
    setCamPhase('processing');
    try {
      const fd = new FormData();
      fd.append('testType', camTarget);
      fd.append('video', camBlob, 'clip.webm');
      const res = await fetch('/api/fitness-test/measure', { method: 'POST', body: fd });
      const json = (await res.json()) as { result?: { measured_value: number; unit: string; confidence: string; notes: string }; error?: string };
      if (!res.ok || json.error) {
        setCamError(json.error ?? 'Analysis failed');
        setCamPhase('error');
        return;
      }
      const r = json.result!;
      setCamResult({ value: r.measured_value, unit: r.unit, confidence: r.confidence, notes: r.notes });
      setCamPhase('done');
      // Auto-fill the input
      if (camTarget === 'jump')     setJumpCm(String(r.measured_value));
      if (camTarget === 'sprint')   setSprintSec(String(r.measured_value));
      if (camTarget === 'juggling') setJuggles(String(r.measured_value));
    } catch (err) {
      setCamError(err instanceof Error ? err.message : 'Unknown error');
      setCamPhase('error');
    }
  };

  const orderedDomains = cfg.priority;

  // Sorted position fits from result
  const sortedFits = result
    ? ([...FIT_LABELS] as [PosKey, string][]).map(([k, label]) => ({ key: k, label, score: result.pq[k] })).sort((a, b) => b.score - a.score)
    : [];

  const bestPos = result ? POS_CONFIG[result.pq.bestFit as PosKey] : null;

  // ── Camera overlay ────────────────────────────────────────────────────────
  const camGuide = camTarget ? TEST_GUIDE[
    camTarget === 'jump' ? 'explosivePower' :
    camTarget === 'sprint' ? 'linearSpeed' : 'ballMastery'
  ] : null;

  const camOverlay = camTarget && camPhase !== 'idle' ? (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 540, backgroundColor: '#111', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', backgroundColor: '#1a5c2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>
            {camGuide?.title ?? 'Camera Measure'}
          </span>
          <button onClick={closeCam} style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {/* Setup phase */}
        {camPhase === 'setup' && (
          <div style={{ padding: 20 }}>
            <p style={{ color: '#ccc', fontSize: 13, marginTop: 0 }}>
              <strong style={{ color: 'white' }}>Camera tip:</strong> {camGuide?.cameraTip}
            </p>
            {/* Live preview */}
            <video ref={videoRef} autoPlay muted playsInline
              style={{ width: '100%', borderRadius: 10, backgroundColor: '#000', maxHeight: 300, objectFit: 'cover' }} />
            <button onClick={startRecording}
              style={{ marginTop: 14, width: '100%', padding: 14, backgroundColor: '#dc2626', border: 'none', borderRadius: 8, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Video size={18} /> Start Recording
            </button>
          </div>
        )}

        {/* Recording phase */}
        {camPhase === 'recording' && (
          <div style={{ padding: 20 }}>
            <div style={{ position: 'relative' }}>
              <video ref={videoRef} autoPlay muted playsInline
                style={{ width: '100%', borderRadius: 10, backgroundColor: '#000', maxHeight: 300, objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#dc2626', color: 'white', fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 99 }}>
                ● REC {camSeconds}s
              </div>
            </div>
            <button onClick={stopRecording}
              style={{ marginTop: 14, width: '100%', padding: 14, backgroundColor: '#1a5c2a', border: 'none', borderRadius: 8, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <StopCircle size={18} /> Stop Recording
            </button>
          </div>
        )}

        {/* Preview phase */}
        {camPhase === 'preview' && camUrl && (
          <div style={{ padding: 20 }}>
            <video src={camUrl} controls style={{ width: '100%', borderRadius: 10, maxHeight: 300 }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={retake}
                style={{ flex: 1, padding: 12, backgroundColor: '#374151', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}>
                <RotateCcw size={15} /> Retake
              </button>
              <button onClick={runCamMeasure}
                style={{ flex: 2, padding: 12, backgroundColor: '#1a5c2a', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 }}>
                <Camera size={16} /> Analyse with AI
              </button>
            </div>
          </div>
        )}

        {/* Processing phase */}
        {camPhase === 'processing' && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>🤖</div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>Gemini AI is measuring…</p>
            <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>
              Analysing your video to extract the measurement. This takes 10–30 seconds.
            </p>
          </div>
        )}

        {/* Done phase */}
        {camPhase === 'done' && camResult && (
          <div style={{ padding: 24 }}>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16, marginBottom: 16, textAlign: 'center' }}>
              <CheckCircle size={32} color="#15803d" style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#15803d' }}>
                {camResult.value} <span style={{ fontSize: 16 }}>{camResult.unit}</span>
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#374151', fontWeight: 600 }}>
                Confidence: {camResult.confidence.toUpperCase()}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280' }}>{camResult.notes}</p>
            </div>
            <p style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', margin: 0 }}>
              Result auto-filled in your score input below.
            </p>
            <button onClick={closeCam}
              style={{ marginTop: 14, width: '100%', padding: 12, backgroundColor: '#1a5c2a', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              Done — Close Camera
            </button>
          </div>
        )}

        {/* Error phase */}
        {camPhase === 'error' && (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#fca5a5', fontWeight: 700, fontSize: 15, marginTop: 0 }}>Could not measure</p>
            <p style={{ color: '#9ca3af', fontSize: 13 }}>{camError}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setCamPhase('setup'); startCam(camTarget); }}
                style={{ flex: 1, padding: 12, backgroundColor: '#374151', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                Try again
              </button>
              <button onClick={closeCam}
                style={{ flex: 1, padding: 12, backgroundColor: '#1a5c2a', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                Enter manually
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f2ee' }}>
      {camOverlay}

      {/* Nav */}
      <div style={{ backgroundColor: '#1a5c2a', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/player" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 14 }}>
          <ArrowLeft size={16} /> Player Hub
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>/</span>
        <span style={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Crosshair size={16} /> Position Finder
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>What Position Suits You?</h1>
          <p style={{ fontSize: 14, color: '#555', marginTop: 4 }}>
            Complete the 6 GRS physical tests and find out which football position your body profile fits best.
            Use the "How to do this test" guides below each test for step-by-step instructions.
          </p>
        </div>

        {/* ── Reference table ──────────────────────────────────────────── */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 24, overflow: 'hidden' }}>
          <button
            onClick={() => setShowTable(v => !v)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#111' }}
          >
            <span>Which tests matter most per position?</span>
            {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showTable && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '10px 20px', fontWeight: 600, color: '#374151' }}>GRS Test</th>
                    {(Object.entries(POS_CONFIG) as [PosKey, PosConfig][]).map(([k, c]) => (
                      <th key={k} style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: c.color }}>
                        {c.emoji} {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((row, i) => (
                    <tr key={row.test} style={{ borderTop: '1px solid #f3f4f6', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '10px 20px', fontWeight: 500, color: '#111' }}>{row.test}</td>
                      {(Object.keys(POS_CONFIG) as PosKey[]).map(k => {
                        const val  = row[k];
                        const top3 = val <= 3;
                        return (
                          <td key={k} style={{ textAlign: 'center', padding: '10px 12px' }}>
                            <span style={{
                              display: 'inline-block', minWidth: 28, padding: '2px 8px', borderRadius: 99,
                              fontSize: 12, fontWeight: 700,
                              backgroundColor: top3 ? POS_CONFIG[k].color : '#f3f4f6',
                              color: top3 ? 'white' : '#6b7280',
                            }}>#{val}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 12, color: '#9ca3af', padding: '10px 20px', borderTop: '1px solid #f3f4f6', margin: 0 }}>
                #1 = most important for that position · Coloured = top 3
              </p>
            </div>
          )}
        </div>

        {/* ── Player details ────────────────────────────────────────────── */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16, marginTop: 0 }}>Your Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Your Name *</label>
              <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Your name"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Age *</label>
              <input type="number" min={6} max={40} value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 17"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value as Gender)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Position selector ─────────────────────────────────────────── */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 4, marginTop: 0 }}>Your Position</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, marginTop: 0 }}>
            Select your position. The test inputs below will sort by what matters most for that role.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {(Object.entries(POS_CONFIG) as [PosKey, PosConfig][]).map(([key, c]) => (
              <button key={key} onClick={() => setPos(key)}
                style={{
                  padding: '10px 4px', borderRadius: 8,
                  border: `2px solid ${pos === key ? c.color : '#e5e7eb'}`,
                  backgroundColor: pos === key ? c.bgColor : 'white',
                  color: pos === key ? c.color : '#374151',
                  fontWeight: pos === key ? 700 : 500,
                  cursor: 'pointer', fontSize: 12, transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                <span style={{ fontSize: 20 }}>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 10, marginBottom: 0 }}>
            {cfg.emoji} <strong style={{ color: cfg.color }}>{cfg.label}</strong> — {cfg.tagline} &nbsp;·&nbsp;
            🥇🥈🥉 test inputs below are sorted by priority for this position.
          </p>
        </div>

        {/* ── Test inputs sorted by position priority ───────────────────── */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 4, marginTop: 0 }}>Your Test Scores</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, marginTop: 0 }}>
            Enter as many as you have. Tap <strong>How to do this test</strong> for step-by-step instructions and recommended apps.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {orderedDomains.map((domainKey, idx) => {
              const meta   = DOMAIN_META[domainKey];
              const guide  = TEST_GUIDE[domainKey];
              const isTop3 = idx < 3;
              const isGOpen = !!guideOpen[domainKey];
              const showCamBtn = domainKey === 'explosivePower' || domainKey === 'linearSpeed' || domainKey === 'ballMastery';
              const camKey: CamTarget = domainKey === 'explosivePower' ? 'jump' : domainKey === 'linearSpeed' ? 'sprint' : 'juggling';

              return (
                <div key={domainKey} style={{
                  borderRadius: 8,
                  border: `1px solid ${isTop3 ? cfg.borderColor : '#e5e7eb'}`,
                  backgroundColor: isTop3 ? cfg.bgColor : '#fafafa',
                  overflow: 'hidden',
                }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{meta.label}</span>
                      <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{meta.test}</span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      backgroundColor: isTop3 ? cfg.color : '#e5e7eb',
                      color: isTop3 ? 'white' : '#6b7280',
                    }}>{medalLabel(idx)}</span>
                  </div>

                  {/* Input area */}
                  <div style={{ padding: '0 16px 12px' }}>
                    {/* T1 Jump */}
                    {domainKey === 'explosivePower' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <input type="number" min={0} max={100} step={0.5} value={jumpCm}
                          onChange={e => setJumpCm(e.target.value)} placeholder="Height"
                          style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 110 }} />
                        <span style={{ fontSize: 13, color: '#6b7280' }}>cm — higher is better</span>
                        <button onClick={() => startCam('jump')}
                          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 6, border: '1px solid #1a5c2a', backgroundColor: 'white', color: '#1a5c2a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <Camera size={13} /> Measure with Camera
                        </button>
                      </div>
                    )}

                    {/* T2 Sprint */}
                    {domainKey === 'linearSpeed' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <input type="number" min={2} max={10} step={0.01} value={sprintSec}
                          onChange={e => setSprintSec(e.target.value)} placeholder="Time"
                          style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 110 }} />
                        <span style={{ fontSize: 13, color: '#6b7280' }}>seconds — lower is better</span>
                        <button onClick={() => startCam('sprint')}
                          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 6, border: '1px solid #1a5c2a', backgroundColor: 'white', color: '#1a5c2a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <Camera size={13} /> Measure with Camera
                        </button>
                      </div>
                    )}

                    {/* T3 Balance */}
                    {domainKey === 'balance' && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 400 }}>
                          {([
                            ['Right — eyes open',   balRightOpen,   setBalRightOpen],
                            ['Left — eyes open',    balLeftOpen,    setBalLeftOpen],
                            ['Right — eyes closed', balRightClosed, setBalRightClosed],
                            ['Left — eyes closed',  balLeftClosed,  setBalLeftClosed],
                          ] as [string, string, (v: string) => void][]).map(([lbl, val, setter]) => (
                            <div key={lbl}>
                              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 3 }}>{lbl}</label>
                              <input type="number" min={0} max={30} value={val}
                                onChange={e => setter(e.target.value)} placeholder="corrections"
                                style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, marginBottom: 0 }}>
                          Foot correction count · lower is better · eyes-closed counts 1.5×
                        </p>
                      </div>
                    )}

                    {/* T4 Ball Juggle */}
                    {domainKey === 'cognitiveSpeed' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <input type="number" min={0} max={300} value={catches}
                          onChange={e => setCatches(e.target.value)} placeholder="Best count"
                          style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 110 }} />
                        <span style={{ fontSize: 13, color: '#6b7280' }}>catches in 1 min — higher is better</span>
                      </div>
                    )}

                    {/* T5 Illinois Agility */}
                    {domainKey === 'endurance' && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="number" min={10} max={60} step={0.1} value={chitimaSec}
                            onChange={e => setChitimaSec(e.target.value)} placeholder="e.g. 15.4"
                            style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 110 }} />
                          <span style={{ fontSize: 13, color: '#6b7280' }}>seconds — lower is better</span>
                        </div>
                        {chitimaTotalSec !== undefined && (
                          <p style={{ fontSize: 12, color: cfg.color, marginTop: 6, marginBottom: 0, fontWeight: 600 }}>
                            {chitimaTotalSec.toFixed(1)}s — U17 elite: sub-15.2s (boys) · sub-16.0s (girls)
                          </p>
                        )}
                      </div>
                    )}

                    {/* T6 Juggling */}
                    {domainKey === 'ballMastery' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <input type="number" min={0} max={200} value={juggles}
                          onChange={e => setJuggles(e.target.value)} placeholder="Count"
                          style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 110 }} />
                        <span style={{ fontSize: 13, color: '#6b7280' }}>juggles — higher is better</span>
                        <button onClick={() => startCam('juggling')}
                          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 6, border: '1px solid #1a5c2a', backgroundColor: 'white', color: '#1a5c2a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <Camera size={13} /> Count with Camera
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Guide toggle */}
                  <button
                    onClick={() => setGuideOpen(g => ({ ...g, [domainKey]: !g[domainKey] }))}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
                      background: 'none', border: 'none', borderTop: '1px solid rgba(0,0,0,0.06)',
                      cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      color: isGOpen ? '#1a5c2a' : '#6b7280',
                      textAlign: 'left',
                    }}
                  >
                    <BookOpen size={13} />
                    How to do this test
                    {isGOpen ? <ChevronUp size={13} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={13} style={{ marginLeft: 'auto' }} />}
                  </button>

                  {/* Expanded guide */}
                  {isGOpen && (
                    <div style={{ padding: '0 16px 16px', backgroundColor: 'rgba(255,255,255,0.6)' }}>
                      <p style={{ fontSize: 13, color: '#374151', marginTop: 12, marginBottom: 10, lineHeight: 1.55 }}>
                        {guide.what}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                        <div style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: '10px 12px' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginTop: 0, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reps</p>
                          <p style={{ fontSize: 13, color: '#111', margin: 0 }}>{guide.reps}</p>
                        </div>
                        <div style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: '10px 12px' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginTop: 0, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</p>
                          <p style={{ fontSize: 13, color: '#111', margin: 0 }}>{guide.duration}</p>
                        </div>
                      </div>

                      <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, marginTop: 0 }}>Equipment needed:</p>
                      <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>
                        {guide.equipment.map((e, i) => (
                          <li key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 3 }}>{e}</li>
                        ))}
                      </ul>

                      <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, marginTop: 8 }}>Steps:</p>
                      <ol style={{ margin: '0 0 10px', paddingLeft: 18 }}>
                        {guide.steps.map((s, i) => (
                          <li key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 4, lineHeight: 1.5 }}>{s}</li>
                        ))}
                      </ol>

                      {guide.apps.length > 0 && (
                        <>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, marginTop: 8 }}>Recommended apps / tools:</p>
                          <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>
                            {guide.apps.map((a, i) => (
                              <li key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 4, lineHeight: 1.5 }}>{a}</li>
                            ))}
                          </ul>
                        </>
                      )}

                      {showCamBtn && (
                        <div style={{ backgroundColor: '#f0fdf4', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#15803d', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Camera tip</p>
                          <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5 }}>{guide.cameraTip}</p>
                        </div>
                      )}

                      <div style={{ backgroundColor: '#fffbeb', borderRadius: 8, padding: '10px 12px' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#92400e', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pro tip</p>
                        <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5 }}>{guide.proTip}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Buttons ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            onClick={runAssessment}
            disabled={!playerName.trim() || !age}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700,
              backgroundColor: playerName.trim() && age ? '#1a5c2a' : '#d1d5db',
              color: playerName.trim() && age ? 'white' : '#9ca3af',
              transition: 'all 0.15s',
            }}>
            Find My Best Position
          </button>
          <button onClick={openHistory} disabled={!playerName.trim()}
            style={{ padding: '14px 20px', borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 14,
              fontWeight: 500, backgroundColor: 'white', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={16} /> History
          </button>
        </div>

        {/* ── History ───────────────────────────────────────────────────── */}
        {showHistory && (
          <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 12 }}>History — {playerName}</h3>
            {history.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No assessments yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((h, i) => {
                  const pc = POS_CONFIG[h.pos];
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, backgroundColor: '#f9fafb', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: '#6b7280', minWidth: 80 }}>{h.date}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, backgroundColor: pc.bgColor, color: pc.color }}>
                        {pc.emoji} {pc.label}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>AQ {h.aq}</span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{h.tier}</span>
                      <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>Best fit: <strong>{h.bestFit}</strong></span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────── */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Best position hero */}
            {bestPos && (
              <div style={{
                borderRadius: 12, padding: 24,
                background: `linear-gradient(135deg, ${bestPos.color}, ${bestPos.color}cc)`,
                color: 'white',
              }}>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>{result.playerName} · GRS Position Analysis</p>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, opacity: 0.85 }}>Your best-fit position is</p>
                    <p style={{ margin: '4px 0 0', fontSize: 36, fontWeight: 800, lineHeight: 1 }}>
                      {bestPos.emoji} {bestPos.label}
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.85 }}>{bestPos.tagline}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <Star size={16} />
                      <span style={{ fontSize: 24, fontWeight: 700 }}>{result.aq}</span>
                      <span style={{ fontSize: 14, opacity: 0.85 }}>AQ</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13 }}>{result.tier} · {result.ageGroup}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>
                      Fit for {cfg.label}: <strong>{Math.round(result.pq[cfg.pqKey])}%</strong>
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>
                      {result.testsCompleted} / 6 tests completed
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Position fit ranking */}
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 14 }}>Your Position Fit Ranking</h3>
              {sortedFits.map(({ key, label, score }, idx) => {
                const pc       = POS_CONFIG[key];
                const barColor = score >= 70 ? '#15803d' : score >= 50 ? '#ca8a04' : '#dc2626';
                const isBest   = idx === 0;
                return (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{pc.emoji}</span>
                        <span style={{ fontWeight: isBest ? 700 : 500, color: isBest ? pc.color : '#374151' }}>{label}</span>
                        {isBest && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 99, backgroundColor: pc.color, color: 'white' }}>
                            Best fit
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, color: barColor }}>{Math.round(score)}%</span>
                    </div>
                    <div style={{ height: 10, backgroundColor: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99, width: `${Math.min(score, 100)}%`,
                        backgroundColor: isBest ? pc.color : barColor,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Domain breakdown for selected position */}
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 14 }}>
                {cfg.emoji} {cfg.label} Domain Scores — priority order
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orderedDomains.map((key, idx) => {
                  const domain = result.domains[key];
                  const meta   = DOMAIN_META[key];
                  const isTop3 = idx < 3;
                  if (!domain.tested) {
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.4, padding: '8px 14px' }}>
                        <span style={{ fontSize: 11, minWidth: 32, color: '#9ca3af' }}>{medalLabel(idx)}</span>
                        <span style={{ fontSize: 13, color: '#9ca3af' }}>{meta.label} — not tested</span>
                      </div>
                    );
                  }
                  const pct  = domain.percentile;
                  const barC = pct >= 75 ? '#15803d' : pct >= 50 ? '#ca8a04' : pct >= 25 ? '#ea580c' : '#dc2626';
                  return (
                    <div key={key} style={{
                      padding: '12px 14px', borderRadius: 8,
                      border: `1px solid ${isTop3 ? cfg.borderColor : '#f3f4f6'}`,
                      backgroundColor: isTop3 ? cfg.bgColor : '#fafafa',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: isTop3 ? cfg.color : '#9ca3af', fontWeight: 700, minWidth: 32 }}>{medalLabel(idx)}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{meta.label}</span>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>{domain.rawScore}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: barC }}>p{pct}</span>
                          <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 6 }}>{domain.label}</span>
                        </div>
                      </div>
                      <div style={{ height: 6, backgroundColor: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: barC, borderRadius: 99, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scout narrative */}
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 10 }}>What Scouts See</h3>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, margin: 0 }}>{result.scoutNarrative}</p>
            </div>

            {/* Coach recommendation */}
            <div style={{ backgroundColor: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#15803d', marginTop: 0, marginBottom: 10 }}>What to Work On</h3>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, margin: 0 }}>{result.coachRecommendation}</p>
            </div>

            {/* Drills */}
            {result.suggestedDrills.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 12 }}>Drills for Your Profile</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                  {result.suggestedDrills.map(drill => (
                    <div key={drill.id} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{drill.name}</span>
                        <span style={{ fontSize: 11, color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: 99, whiteSpace: 'nowrap' }}>{drill.duration}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{drill.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div style={{ backgroundColor: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a', padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginTop: 0, marginBottom: 8 }}>Notes</h4>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {result.warnings.map((w, i) => <li key={i} style={{ fontSize: 13, color: '#92400e', marginBottom: 4 }}>{w}</li>)}
                </ul>
              </div>
            )}

            {/* ── Passport save + Arena share ───────────────────────────── */}
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 4 }}>Save & Share</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0, marginBottom: 16 }}>
                Your result is saved to your device. Sign in to save it to your player passport and share to The Arena.
              </p>

              {/* Passport save status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 14px', borderRadius: 8, backgroundColor: saved ? '#f0fdf4' : '#f9fafb', border: `1px solid ${saved ? '#bbf7d0' : '#e5e7eb'}` }}>
                <CheckCircle size={16} style={{ color: saved ? '#15803d' : '#9ca3af', flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: saved ? '#15803d' : '#374151' }}>
                    {saving ? 'Saving to passport…' : saved ? 'Saved to your player passport' : 'Player passport — sign in to save'}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                    Your AQ score, tier, best position and scout narrative appear on your profile.
                  </p>
                </div>
              </div>

              {/* Arena share button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, backgroundColor: arenaShared ? '#f0fdf4' : '#f9fafb', border: `1px solid ${arenaShared ? '#bbf7d0' : '#e5e7eb'}` }}>
                <Star size={16} style={{ color: arenaShared ? '#15803d' : '#9ca3af', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: arenaShared ? '#15803d' : '#374151' }}>
                    {arenaShared ? 'Posted to The Arena!' : 'Share milestone to The Arena'}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
                    Post your best position and AQ score as a milestone — visible to coaches and scouts in your network.
                  </p>
                </div>
                {!arenaShared && (
                  <button
                    onClick={shareToArena}
                    disabled={arenaSharing}
                    style={{
                      flexShrink: 0, padding: '8px 16px', borderRadius: 6, border: 'none',
                      backgroundColor: arenaSharing ? '#d1d5db' : '#1a5c2a',
                      color: 'white', fontSize: 13, fontWeight: 600, cursor: arenaSharing ? 'not-allowed' : 'pointer',
                    }}>
                    {arenaSharing ? 'Posting…' : 'Post'}
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
