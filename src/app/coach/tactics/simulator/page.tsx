"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ───────────────────────────────────────────────────────────────

type Formation = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2" | "5-3-2";
type Phase     = "possession" | "defensive" | "transition" | "set_piece";

// [x%, y%] — x: 0=left 100=right, y: 0=top 100=bottom
// Home attacks UPWARD (toward y=0). Away attacks DOWNWARD (toward y=100).
type Pos = [number, number];

interface SimKeyframe {
  t:      number;   // 0–1 through the loop
  home:   Pos[];    // 11 home players
  away:   Pos[];    // 11 away players
  ball:   Pos;
  event?: string;
}

interface Scenario {
  id:             string;
  name:           string;
  description:    string;
  formation:      Formation;
  phase:          Phase;
  coachingPoints: string[];
  homeLabels:     string[];
  awayLabels:     string[];
  frames:         SimKeyframe[];
}

// ─── Canvas ──────────────────────────────────────────────────────────────

const W = 400;
const H = 260;

function toSVG(pos: Pos): [number, number] {
  return [pos[0] * W / 100, pos[1] * H / 100];
}

// ─── Base positions ───────────────────────────────────────────────────────

const H433: Pos[] = [
  [50,92],[82,75],[62,80],[38,80],[18,75],
  [50,52],[72,55],[28,55],[82,18],[50,12],[18,18],
];

const A433: Pos[] = [
  [50,8],[18,25],[38,20],[62,20],[82,25],
  [50,48],[28,45],[72,45],[18,82],[50,88],[82,82],
];

const A442: Pos[] = [
  [50,8],[18,25],[38,20],[62,20],[82,25],
  [18,45],[38,48],[62,48],[82,45],[35,80],[65,80],
];

// ─── Scenarios ────────────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    id: "build-from-back",
    name: "Build from Back",
    description: "4-3-3 — GK plays out. CBs split wide, full-backs push high, midfield rotates to receive.",
    formation: "4-3-3",
    phase: "possession",
    homeLabels: ["GK","RB","RCB","LCB","LB","CM","RM","LM","RW","ST","LW"],
    awayLabels: ["GK","RB","RCB","LCB","LB","CM","RM","LM","RW","ST","LW"],
    coachingPoints: [
      "GK steps out — CBs split wide to create short-pass angles",
      "Full-backs push high to provide width and pin opposition wingers",
      "Central midfielder drops between lines to receive under pressure",
      "Wingers stay wide — stretch the defensive block horizontally",
      "Striker drops short or runs in behind depending on the pass",
    ],
    frames: [
      {
        t: 0,
        home: [...H433],
        away: [[50,8],[18,25],[38,20],[62,20],[82,25],[50,48],[28,45],[72,45],[18,78],[50,82],[82,78]],
        ball: [50,92],
        event: "GK in possession — build begins",
      },
      {
        t: 0.18,
        home: [[50,89],[82,62],[68,82],[32,82],[18,62],[48,55],[72,52],[28,52],[85,16],[50,14],[15,16]],
        away: [[50,8],[22,30],[40,25],[60,25],[78,30],[50,45],[30,42],[70,42],[18,75],[50,80],[82,75]],
        ball: [32,82],
        event: "CBs split — LCB receives wide",
      },
      {
        t: 0.35,
        home: [[50,88],[85,56],[65,80],[35,80],[18,58],[42,46],[70,48],[28,48],[85,14],[55,16],[18,20]],
        away: [[50,8],[25,35],[42,28],[58,28],[75,35],[50,42],[32,40],[68,40],[20,68],[50,76],[80,68]],
        ball: [42,46],
        event: "CM drops — receives between lines",
      },
      {
        t: 0.52,
        home: [[50,88],[86,52],[64,78],[36,78],[18,55],[46,44],[72,40],[28,44],[86,12],[58,14],[20,18]],
        away: [[50,8],[28,40],[44,30],[56,30],[72,40],[50,40],[34,38],[66,38],[22,62],[50,72],[78,62]],
        ball: [72,40],
        event: "Ball to RM in half-space — RB overlaps",
      },
      {
        t: 0.70,
        home: [[50,88],[88,46],[64,78],[36,78],[20,52],[48,44],[74,36],[30,40],[88,10],[58,12],[22,16]],
        away: [[50,8],[30,42],[46,32],[54,32],[70,42],[52,38],[36,36],[64,36],[25,55],[50,65],[75,55]],
        ball: [88,10],
        event: "RW 1v1 on right — RB overlapping",
      },
      {
        t: 0.88,
        home: [[50,88],[86,45],[62,78],[38,78],[22,50],[50,42],[72,32],[32,38],[85,10],[52,10],[25,14]],
        away: [[50,8],[28,42],[42,30],[58,30],[72,42],[50,36],[36,34],[64,34],[28,48],[50,58],[72,48]],
        ball: [70,14],
        event: "Cross into box — 3 attackers arriving",
      },
      { t:1.0, home:[...H433], away:[...A433], ball:[50,92], event:"Reset — build again" },
    ],
  },

  {
    id: "mid-block",
    name: "Mid-Block Defence",
    description: "4-3-3 compact mid-block. Stay narrow, shift to ball side, press on back passes.",
    formation: "4-3-3",
    phase: "defensive",
    homeLabels: ["GK","RB","RCB","LCB","LB","CM","RM","LM","RW","ST","LW"],
    awayLabels: ["GK","RB","RCB","LCB","LB","CM","RM","LM","RW","ST","LW"],
    coachingPoints: [
      "Hold a compact block — close central passing lanes, don't chase the ball",
      "Press trigger: when ball goes to away CB feet, striker presses immediately",
      "Midfield 3 shifts to ball side — block the pass into the forward",
      "Full-backs stay narrow until ball is wide — don't get stretched",
      "On turnover — play forward quickly to feet of the striker",
    ],
    frames: [
      {
        t: 0,
        home: [[50,88],[70,70],[58,75],[42,75],[30,70],[50,55],[64,58],[36,58],[50,45],[62,48],[38,48]],
        away: [...A433],
        ball: [62,20],
        event: "Away RCB — home compact block",
      },
      {
        t: 0.20,
        home: [[50,88],[68,68],[58,74],[44,74],[32,70],[55,54],[68,55],[38,56],[62,44],[64,46],[42,46]],
        away: [[50,8],[20,28],[40,22],[64,22],[82,28],[52,46],[30,42],[74,42],[20,72],[52,80],[84,72]],
        ball: [64,22],
        event: "Ball-side shift — RM blocks passing lane",
      },
      {
        t: 0.40,
        home: [[50,88],[66,65],[60,72],[44,72],[34,68],[58,52],[70,52],[40,54],[64,42],[66,44],[44,44]],
        away: [[50,8],[22,32],[42,24],[64,24],[84,32],[62,44],[32,40],[76,40],[22,68],[54,78],[86,68]],
        ball: [62,44],
        event: "Away CM receives — central lane blocked",
      },
      {
        t: 0.60,
        home: [[50,88],[64,62],[60,70],[44,70],[34,66],[58,50],[70,48],[42,52],[64,40],[66,42],[46,42]],
        away: [[50,8],[24,35],[42,26],[62,26],[86,35],[64,42],[34,38],[78,38],[24,62],[56,76],[88,62]],
        ball: [86,35],
        event: "Ball wide to away LB — home LB closes",
      },
      {
        t: 0.80,
        home: [[50,88],[72,60],[60,70],[42,70],[30,60],[55,52],[68,50],[40,54],[62,40],[65,42],[44,44]],
        away: [[50,8],[26,38],[44,28],[60,28],[88,38],[64,42],[36,40],[78,40],[26,58],[56,72],[88,58]],
        ball: [88,40],
        event: "Cross blocked — defensive shape holds",
      },
      { t:1.0, home:[[50,88],[72,70],[58,75],[42,75],[28,70],[50,55],[65,58],[35,58],[50,45],[60,48],[40,48]], away:[...A433], ball:[50,20], event:"Reset — block maintained" },
    ],
  },

  {
    id: "counter-attack",
    name: "Counter Attack",
    description: "Win ball in midfield — instant vertical pass to wingers who stayed high.",
    formation: "4-3-3",
    phase: "transition",
    homeLabels: ["GK","RB","RCB","LCB","LB","CM","RM","LM","RW","ST","LW"],
    awayLabels: ["GK","RB","RCB","LCB","LB","CM","RM","LM","RW","ST","LW"],
    coachingPoints: [
      "Wingers STAY HIGH when defending — ready the instant we win the ball",
      "CM wins ball and plays first-time vertical pass — no delay",
      "Striker makes a diagonal run in behind — don't wait for the ball",
      "Full-backs hold — don't join the counter, maintain defensive cover",
      "Get the shot off early before their shape recovers",
    ],
    frames: [
      {
        t: 0,
        home: [[50,88],[65,72],[55,78],[45,78],[35,72],[50,60],[65,62],[35,62],[88,25],[52,28],[12,25]],
        away: [[50,8],[15,22],[38,18],[62,18],[85,22],[48,42],[28,38],[72,38],[18,62],[50,72],[82,62]],
        ball: [50,60],
        event: "Ball won in midfield — COUNTER!",
      },
      {
        t: 0.22,
        home: [[50,88],[65,70],[55,76],[45,76],[35,70],[52,52],[68,55],[36,55],[88,20],[55,22],[12,20]],
        away: [[50,8],[20,28],[40,24],[60,24],[80,28],[50,45],[32,42],[68,42],[20,58],[50,68],[80,58]],
        ball: [52,52],
        event: "CM drives forward — away scrambling",
      },
      {
        t: 0.42,
        home: [[50,88],[66,68],[55,76],[45,76],[34,68],[54,44],[68,50],[36,50],[88,18],[58,18],[15,22]],
        away: [[50,8],[24,35],[42,28],[58,28],[76,35],[52,48],[34,45],[66,45],[22,52],[50,62],[78,52]],
        ball: [88,18],
        event: "RW receives in space — 3v3 counter",
      },
      {
        t: 0.62,
        home: [[50,88],[66,65],[55,75],[45,75],[34,65],[55,40],[68,38],[36,42],[86,14],[60,14],[18,20]],
        away: [[50,8],[26,38],[44,30],[56,30],[74,38],[52,46],[36,44],[64,44],[25,48],[50,58],[75,48]],
        ball: [75,14],
        event: "RW cuts inside — LW attacks far post",
      },
      {
        t: 0.82,
        home: [[50,88],[65,65],[55,75],[45,75],[34,65],[54,38],[66,34],[36,40],[82,12],[60,12],[20,16]],
        away: [[50,8],[28,40],[44,30],[56,30],[72,40],[52,44],[36,42],[64,42],[28,44],[50,55],[72,44]],
        ball: [60,10],
        event: "Shot on goal",
      },
      { t:1.0, home:[...H433], away:[...A433], ball:[50,92], event:"Reset" },
    ],
  },

  {
    id: "high-press-442",
    name: "High Press (4-4-2)",
    description: "4-4-2 high press — two strikers close GK together, midfield 4 cuts all passing lanes.",
    formation: "4-4-2",
    phase: "defensive",
    homeLabels: ["GK","RB","RCB","LCB","LB","RM","RCM","LCM","LM","RS","LS"],
    awayLabels: ["GK","RB","RCB","LCB","LB","CM","RM","LM","RW","ST","LW"],
    coachingPoints: [
      "Two strikers press together — trap the GK with no safe back-pass option",
      "Midfield 4 holds a high line — no time on the ball anywhere on the pitch",
      "Full-backs push high — away wingers cannot receive a free pass",
      "GK steps forward — sweeper-keeper ready for long ball over the top",
      "If press is beaten, drop quickly into compact 4-4-2 mid-block",
    ],
    frames: [
      {
        t: 0,
        home: [[50,85],[78,60],[60,68],[40,68],[22,60],[72,48],[56,50],[44,50],[28,48],[62,28],[38,28]],
        away: [...A442],
        ball: [50,8],
        event: "Away GK — high press set",
      },
      {
        t: 0.25,
        home: [[50,82],[75,55],[60,65],[40,65],[25,55],[72,44],[58,46],[42,46],[28,44],[62,22],[38,22]],
        away: [[50,8],[22,30],[40,22],[60,22],[78,30],[52,45],[32,42],[68,42],[22,72],[50,80],[78,72]],
        ball: [38,20],
        event: "Press! Away LCB under pressure",
      },
      {
        t: 0.50,
        home: [[50,80],[72,52],[58,62],[42,62],[28,52],[70,40],[58,44],[42,44],[30,40],[60,20],[38,20]],
        away: [[50,8],[25,35],[42,26],[58,26],[75,35],[56,42],[35,38],[65,38],[25,68],[52,76],[75,68]],
        ball: [56,42],
        event: "Ball pressed in midfield — no time",
      },
      {
        t: 0.75,
        home: [[50,78],[70,50],[56,60],[44,60],[30,50],[68,38],[58,42],[42,42],[32,38],[60,20],[40,20]],
        away: [[50,8],[26,38],[44,28],[56,28],[74,38],[58,40],[36,36],[64,36],[28,60],[52,70],[72,60]],
        ball: [72,38],
        event: "Ball forced wide — press shifts",
      },
      { t:1.0, home:[[50,85],[78,60],[60,68],[40,68],[22,60],[72,48],[56,50],[44,50],[28,48],[62,28],[38,28]], away:[...A442], ball:[50,8], event:"Reset — press maintained" },
    ],
  },

  {
    id: "corner-near-post",
    name: "Corner — Near-Post Flick",
    description: "Near-post runner creates confusion. Far-post runner attacks the flick-on late.",
    formation: "4-3-3",
    phase: "set_piece",
    homeLabels: ["GK","RB","RCB","LCB","LB","CM","RM","LM","Taker","ST","LW"],
    awayLabels: ["GK","RB","RCB","LCB","LB","CM","RM","LM","RW","ST","LW"],
    coachingPoints: [
      "Near-post runner (RM) — decoy or flick-on, creates confusion in the six-yard box",
      "Far-post runner (LM) — main target, arrives late into space behind defenders",
      "Penalty spot runner (ST) — secondary target for clearances or second balls",
      "2 players hold back (LCB + CM) — protect against counter on turnover",
      "Delivery: call inswing or outswing before the kick so runners time their run",
    ],
    frames: [
      {
        t: 0,
        home: [[50,88],[82,72],[62,80],[38,80],[18,72],[50,65],[72,55],[28,55],[88,8],[52,18],[18,18]],
        away: [[50,8],[20,18],[38,15],[62,15],[80,18],[50,35],[30,32],[70,32],[20,50],[50,50],[80,50]],
        ball: [88,8],
        event: "Corner kick — runners setting up",
      },
      {
        t: 0.25,
        home: [[50,88],[82,72],[62,80],[38,80],[18,72],[50,65],[72,42],[28,22],[88,8],[55,20],[18,18]],
        away: [[50,8],[22,20],[40,16],[60,16],[78,20],[50,35],[32,32],[68,32],[22,48],[50,48],[78,48]],
        ball: [88,8],
        event: "RM drives near-post, LM runs far-post",
      },
      {
        t: 0.48,
        home: [[50,88],[82,72],[62,80],[38,80],[18,72],[52,62],[68,16],[22,14],[88,8],[55,18],[18,18]],
        away: [[50,8],[24,22],[42,16],[58,16],[76,22],[50,34],[34,30],[66,30],[24,46],[50,46],[76,46]],
        ball: [70,14],
        event: "Ball delivered — near-post flick",
      },
      {
        t: 0.68,
        home: [[50,88],[82,72],[62,80],[38,80],[18,72],[54,60],[64,14],[24,12],[88,8],[56,16],[18,18]],
        away: [[50,8],[26,24],[44,18],[56,18],[74,24],[50,34],[36,30],[64,30],[26,44],[50,44],[74,44]],
        ball: [24,12],
        event: "Far-post runner attacks flick-on!",
      },
      {
        t: 0.88,
        home: [[50,88],[82,72],[62,80],[38,80],[18,72],[54,60],[64,14],[26,12],[78,12],[58,16],[18,18]],
        away: [[50,8],[28,26],[44,18],[56,18],[72,26],[50,32],[36,28],[64,28],[28,42],[50,42],[72,42]],
        ball: [32,10],
        event: "Shot — 3 attackers in box vs 4 defenders",
      },
      { t:1.0, home:[...H433], away:[...A433], ball:[50,92], event:"Reset" },
    ],
  },
];

// ─── Interpolation ────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function interpolate(sc: Scenario, progress: number) {
  const frames = sc.frames;
  let f0 = frames[0], f1 = frames[1];
  for (let i = 0; i < frames.length - 1; i++) {
    if (progress >= frames[i].t && progress <= frames[i + 1].t) {
      f0 = frames[i]; f1 = frames[i + 1]; break;
    }
  }
  const span  = f1.t - f0.t;
  const local = span > 0 ? (progress - f0.t) / span : 0;
  const t     = easeInOut(Math.max(0, Math.min(1, local)));

  const home: Pos[] = f0.home.map((p, i) => [lerp(p[0], f1.home[i][0], t), lerp(p[1], f1.home[i][1], t)]);
  const away: Pos[] = f0.away.map((p, i) => [lerp(p[0], f1.away[i][0], t), lerp(p[1], f1.away[i][1], t)]);
  const ball: Pos   = [lerp(f0.ball[0], f1.ball[0], t), lerp(f0.ball[1], f1.ball[1], t)];
  const event       = progress < (f0.t + f1.t) / 2 ? (f0.event ?? "") : (f1.event ?? "");

  return { home, away, ball, event };
}

// ─── Pitch SVG ───────────────────────────────────────────────────────────

function PitchSVG() {
  const ln = "rgba(255,255,255,0.72)";
  const lw = 0.8;
  return (
    <g>
      <rect width={W} height={H} fill="#2d6a1f" />
      {[0,1,2,3,4].map(i => (
        <rect key={i} x={0} y={i*52} width={W} height={26} fill="rgba(0,0,0,0.04)" />
      ))}
      <rect x={8} y={6} width={384} height={248} fill="none" stroke={ln} strokeWidth={lw} />
      <line x1={8} y1={130} x2={392} y2={130} stroke={ln} strokeWidth={lw} />
      <circle cx={200} cy={130} r={35} fill="none" stroke={ln} strokeWidth={lw} />
      <circle cx={200} cy={130} r={1.5} fill={ln} />
      <rect x={118} y={6} width={164} height={62} fill="none" stroke={ln} strokeWidth={lw} />
      <rect x={157} y={6} width={86} height={22} fill="none" stroke={ln} strokeWidth={lw} />
      <rect x={172} y={3} width={56} height={5} fill="rgba(255,255,255,0.15)" stroke={ln} strokeWidth={lw} />
      <circle cx={200} cy={46} r={1.5} fill={ln} />
      <path d="M 162 68 A 34 34 0 0 1 238 68" fill="none" stroke={ln} strokeWidth={lw} />
      <rect x={118} y={192} width={164} height={62} fill="none" stroke={ln} strokeWidth={lw} />
      <rect x={157} y={232} width={86} height={22} fill="none" stroke={ln} strokeWidth={lw} />
      <rect x={172} y={252} width={56} height={5} fill="rgba(255,255,255,0.15)" stroke={ln} strokeWidth={lw} />
      <circle cx={200} cy={214} r={1.5} fill={ln} />
      <path d="M 162 192 A 34 34 0 0 0 238 192" fill="none" stroke={ln} strokeWidth={lw} />
    </g>
  );
}

// ─── Phase colours ────────────────────────────────────────────────────────

const PHASE_COLOR: Record<Phase, string> = {
  possession: "#1a5c2a",
  defensive:  "#dc2626",
  transition: "#d97706",
  set_piece:  "#7c3aed",
};

// ─── Page ─────────────────────────────────────────────────────────────────

const LOOP_MS = 9000;

export default function TacticsSimulatorPage() {
  const _user = useAuthStore((s) => s.user);

  const [scenario,    setScenario]    = useState<Scenario>(SCENARIOS[0]);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [speed,       setSpeed]       = useState(1);
  const [showLabels,  setShowLabels]  = useState(true);
  const [activeEvent, setActiveEvent] = useState("");

  const rafRef      = useRef<number | null>(null);
  const lastRef     = useRef<number | null>(null);
  const progressRef = useRef(0);
  const speedRef    = useRef(1);

  useEffect(() => { speedRef.current = speed; }, [speed]);

  const tick = useCallback((now: number) => {
    if (lastRef.current === null) lastRef.current = now;
    const delta = now - lastRef.current;
    lastRef.current = now;
    progressRef.current += (delta / LOOP_MS) * speedRef.current;
    if (progressRef.current >= 1) progressRef.current = 0;
    setProgress(progressRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      lastRef.current = null;
      rafRef.current  = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, tick]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    progressRef.current = 0;
    setProgress(0);
    lastRef.current = null;
  }, []);

  const { home, away, ball, event } = interpolate(scenario, progress);
  useEffect(() => { if (event) setActiveEvent(event); }, [event]);

  const [bx, by] = toSVG(ball);
  const phaseColor = PHASE_COLOR[scenario.phase];

  function selectScenario(sc: Scenario) {
    setScenario(sc);
    reset();
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/coach/tactics/board" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="font-black text-gray-900 text-sm leading-none">Tactics Simulator</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Live team movement · works offline</div>
          </div>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: phaseColor + "22", color: phaseColor }}
          >
            {scenario.phase.replace("_"," ").toUpperCase()}
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Left ── */}
          <div className="space-y-3">

            {/* Scenario list */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Scenarios</p>
              <div className="space-y-1.5">
                {SCENARIOS.map(sc => (
                  <button
                    key={sc.id}
                    onClick={() => selectScenario(sc)}
                    className="w-full text-left px-3 py-2.5 rounded-xl border transition-all"
                    style={
                      scenario.id === sc.id
                        ? { backgroundColor: "#1a5c2a", borderColor: "#1a5c2a", color: "white" }
                        : { backgroundColor: "#f9fafb", borderColor: "#e5e7eb", color: "#374151" }
                    }
                  >
                    <div className="text-[12px] font-bold leading-none">{sc.name}</div>
                    <div className="text-[10px] mt-0.5 opacity-70">
                      {sc.formation} · {sc.phase.replace("_"," ")}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Coaching points */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Coaching Points</p>
              <div className="space-y-2">
                {scenario.coachingPoints.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: phaseColor }} />
                    <p className="text-[11px] text-gray-700 leading-snug">{pt}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Key</p>
              <div className="space-y-2">
                {[
                  { bg:"white", border:"#1a5c2a", label:"Home team (white/green)" },
                  { bg:"#dc2626", border:"white",  label:"Away team (red)" },
                  { bg:"#f0b429", border:"#a07000", label:"Ball" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full shrink-0 border-2"
                      style={{ backgroundColor: item.bg, borderColor: item.border }} />
                    <span className="text-[11px] text-gray-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Link to board */}
            <Link
              href="/coach/tactics/board"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-600 hover:border-[#1a5c2a] hover:text-[#1a5c2a] transition-colors bg-white"
            >
              Open Tactical Board
            </Link>
          </div>

          {/* ── Right (pitch + controls) ── */}
          <div className="lg:col-span-2 space-y-3">

            {/* Pitch */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ touchAction: "none" }}>
                <PitchSVG />

                {/* Direction labels */}
                <text x={12} y={20} fontSize={7} fill="rgba(255,255,255,0.45)" fontWeight="700">HOME ▲</text>
                <text x={12} y={252} fontSize={7} fill="rgba(255,255,255,0.45)" fontWeight="700">▼ HOME</text>
                <text x={330} y={20} fontSize={7} fill="rgba(255,255,255,0.35)" fontWeight="700">▼ AWAY</text>
                <text x={330} y={252} fontSize={7} fill="rgba(255,255,255,0.35)" fontWeight="700">AWAY ▲</text>

                {/* Ball */}
                <circle cx={bx} cy={by} r={5.5} fill="#f0b429" stroke="#a07000" strokeWidth={1.2} />

                {/* Away (red) */}
                {away.map((pos, i) => {
                  const [x, y] = toSVG(pos);
                  return (
                    <g key={`a${i}`} transform={`translate(${x},${y})`}>
                      <circle r={11} fill="#dc2626" stroke="white" strokeWidth={1.5} />
                      {showLabels && (
                        <text textAnchor="middle" y={4} fontSize={5.5} fontWeight="800" fill="white"
                          style={{ userSelect: "none" }}>
                          {scenario.awayLabels[i] ?? ""}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Home (white/green) */}
                {home.map((pos, i) => {
                  const [x, y] = toSVG(pos);
                  return (
                    <g key={`h${i}`} transform={`translate(${x},${y})`}>
                      <circle r={11} fill="white" stroke="#1a5c2a" strokeWidth={2} />
                      {showLabels && (
                        <text textAnchor="middle" y={4} fontSize={5.5} fontWeight="800" fill="#1a5c2a"
                          style={{ userSelect: "none" }}>
                          {scenario.homeLabels[i] ?? ""}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Live event */}
            <div
              className="rounded-xl px-4 py-2.5 min-h-[36px] flex items-center"
              style={{ backgroundColor: phaseColor, color: "white" }}
            >
              <span className="text-[12px] font-semibold">{activeEvent || scenario.description}</span>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress * 100}%`, backgroundColor: phaseColor, transition: "none" }}
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Play / Pause */}
                <button
                  onClick={() => setIsPlaying(p => !p)}
                  className="flex items-center justify-center w-10 h-10 rounded-full text-white shadow-sm"
                  style={{ backgroundColor: phaseColor }}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                {/* Reset */}
                <button
                  onClick={reset}
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
                >
                  <RotateCcw size={14} />
                </button>

                <div className="flex-1" />

                {/* Speed */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-400 mr-1">Speed</span>
                  {([0.5, 1, 1.5, 2] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className="text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors"
                      style={
                        speed === s
                          ? { backgroundColor: "#f0b429", borderColor: "#f0b429", color: "#1a3a1a" }
                          : { backgroundColor: "white", borderColor: "#e5e7eb", color: "#9ca3af" }
                      }
                    >
                      {s}×
                    </button>
                  ))}
                </div>

                {/* Labels toggle */}
                <button
                  onClick={() => setShowLabels(l => !l)}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                  style={
                    showLabels
                      ? { backgroundColor: "#1a5c2a", borderColor: "#1a5c2a", color: "white" }
                      : { backgroundColor: "white", borderColor: "#e5e7eb", color: "#9ca3af" }
                  }
                >
                  Labels
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="bg-[#f0fdf4] rounded-2xl border border-green-100 px-4 py-3">
              <p className="text-[11px] font-black text-green-800 mb-0.5">{scenario.name}</p>
              <p className="text-[12px] text-gray-600 leading-relaxed">{scenario.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
