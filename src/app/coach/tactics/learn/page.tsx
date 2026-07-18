"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, Target, GraduationCap,
  ChevronDown, ChevronUp, CheckCircle2, Trophy,
} from "lucide-react";
import {
  FORMATION_LIBRARY,
  TACTICAL_PRINCIPLES,
  COACHING_COURSE_MODULES,
  type FormationDetail,
  type TacticalPrinciple,
  type CourseModule,
} from "@/lib/thuto-tactics-knowledge";

const G    = "#1a5c2a";
const GOLD = "#c8962a";

// ─── Position → SVG coordinate map ──────────────────────────────────────────
// Pitch viewBox 0 0 100 140  (attacking = top, GK = bottom)

const POS_XY: Record<string, [number, number]> = {
  GK:  [50, 130],
  RB:  [82,  108], LB:  [18, 108],
  RWB: [88,  100], LWB: [12, 100],
  CB:  [50,  108],  // fallback — spread below
  DM:  [50,   82],
  CM:  [50,   68],
  RM:  [80,   68],  LM:  [20,  68],
  AM:  [50,   50],
  RW:  [82,   38],  LW:  [18,  38],
  ST:  [50,   28],
  SS:  [50,   40],
};

function posToXY(label: string, idx: number, positions: FormationDetail["positions"]): [number, number] {
  // Count how many earlier positions share the same label
  const sameLabel = positions.slice(0, idx).filter((p) => p.label === label).length;
  const total     = positions.filter((p) => p.label === label).length;
  const base = POS_XY[label] ?? [50, 68];

  if (total === 1) return base;
  // Spread horizontally
  const spread = Math.min(28, (total - 1) * 14);
  const startX = base[0] - spread / 2;
  return [startX + sameLabel * (spread / (total - 1)), base[1]];
}

// ─── Formation Diagram ───────────────────────────────────────────────────────

function FormationDiagram({ formation }: { formation: FormationDetail }) {
  const { positions } = formation;
  return (
    <svg viewBox="0 0 100 140" className="w-full max-w-[160px] mx-auto block">
      {/* Pitch */}
      <rect x="0" y="0" width="100" height="140" fill="#2d7a46" rx="4" />
      {/* Halfway line */}
      <line x1="5" y1="70" x2="95" y2="70" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
      {/* Centre circle */}
      <circle cx="50" cy="70" r="10" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
      {/* Attacking penalty area */}
      <rect x="28" y="3"   width="44" height="20" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
      {/* Defending penalty area */}
      <rect x="28" y="117" width="44" height="20" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />

      {positions.map((p, i) => {
        const [cx, cy] = posToXY(p.label, i, positions);
        return (
          <g key={`${p.label}-${i}`}>
            <circle cx={cx} cy={cy} r="5" fill={GOLD} stroke="#fff" strokeWidth="0.8" />
            <text
              x={cx} y={cy + 0.5}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="3.2" fill="#fff" fontWeight="bold"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Formation Card ───────────────────────────────────────────────────────────

function FormationCard({ f }: { f: FormationDetail }) {
  const [open, setOpen] = useState(false);

  const styleBadge: Record<FormationDetail["style"], string> = {
    attacking:  "#fef3c7",
    defensive:  "#fee2e2",
    balanced:   "#dbeafe",
    possession: "#f0fdf4",
  };
  const styleText: Record<FormationDetail["style"], string> = {
    attacking:  "#92400e",
    defensive:  "#991b1b",
    balanced:   "#1e40af",
    possession: "#166534",
  };

  return (
    <div
      style={{ border: "1px solid rgba(26,92,42,0.2)", borderRadius: 12 }}
      className="bg-white overflow-hidden"
    >
      <button
        className="w-full flex items-center gap-4 p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="w-28 flex-shrink-0">
          <FormationDiagram formation={f} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg leading-tight" style={{ color: G }}>{f.name}</div>
          <div className="text-xs text-gray-400 mb-1">{f.era}</div>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: styleBadge[f.style], color: styleText[f.style] }}
          >
            {f.style}
          </span>
        </div>

        {open ? <ChevronUp size={18} color={G} /> : <ChevronDown size={18} color={G} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold mb-1" style={{ color: G }}>STRENGTHS</div>
              <ul className="space-y-1">
                {f.strengths.map((s) => (
                  <li key={s} className="text-xs text-gray-700 flex gap-1.5">
                    <CheckCircle2 size={12} color={G} className="mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold mb-1 text-red-700">WEAKNESSES</div>
              <ul className="space-y-1">
                {f.weaknesses.map((w) => (
                  <li key={w} className="text-xs text-gray-700 flex gap-1.5">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Best For */}
          <div
            className="p-2.5 rounded-lg text-xs text-gray-700"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <span className="font-semibold" style={{ color: G }}>Best For: </span>
            {f.bestFor}
          </div>

          {/* Famous Use */}
          <div className="text-xs text-gray-500 italic">
            <span className="font-semibold not-italic text-gray-600">Famous Use: </span>
            {f.famousUse}
          </div>

          {/* Coaching Tip */}
          <div
            className="p-2.5 rounded-lg text-xs text-gray-700 italic"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <span className="font-semibold not-italic" style={{ color: GOLD }}>Coaching Tip: </span>
            {f.coachingTip}
          </div>

          {/* Position responsibilities */}
          <div>
            <div className="text-xs font-semibold mb-1.5 text-gray-500 uppercase tracking-wide">
              Position Responsibilities
            </div>
            <div className="space-y-1.5">
              {f.positions.map((p, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span
                    className="font-bold flex-shrink-0 w-10 text-right"
                    style={{ color: GOLD }}
                  >
                    {p.label}
                  </span>
                  <span className="text-gray-500 flex-shrink-0 font-medium w-32 truncate">{p.role}</span>
                  <span className="text-gray-600">{p.responsibility}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Principle Card ───────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<TacticalPrinciple["category"], { bg: string; text: string; label: string }> = {
  attack:     { bg: "#fef3c7", text: "#92400e", label: "Attack"    },
  defence:    { bg: "#fee2e2", text: "#991b1b", label: "Defence"   },
  transition: { bg: "#dbeafe", text: "#1e40af", label: "Transition"},
  set_piece:  { bg: "#f3e8ff", text: "#7c3aed", label: "Set Piece" },
};

function PrincipleCard({ p }: { p: TacticalPrinciple }) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORY_COLOR[p.category];

  return (
    <div
      style={{ border: "1px solid rgba(26,92,42,0.2)", borderRadius: 12 }}
      className="bg-white overflow-hidden"
    >
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="font-bold text-sm" style={{ color: G }}>{p.title}</div>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
              style={{ background: cat.bg, color: cat.text }}
            >
              {cat.label}
            </span>
          </div>
          <div className="text-xs text-gray-500 line-clamp-2">{p.summary}</div>
        </div>
        {open ? <ChevronUp size={18} color={G} /> : <ChevronDown size={18} color={G} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">

          <p className="text-sm text-gray-700 leading-relaxed">{p.detail}</p>

          {/* Key Points */}
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: G }}>KEY COACHING POINTS</div>
            <ul className="space-y-1">
              {p.keyPoints.map((kp) => (
                <li key={kp} className="text-sm text-gray-700 flex gap-1.5">
                  <span style={{ color: G }} className="mt-0.5 flex-shrink-0">•</span>
                  {kp}
                </li>
              ))}
            </ul>
          </div>

          {/* Zimbabwe Application */}
          <div
            className="p-3 rounded-lg text-sm"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <div className="text-xs font-semibold mb-1" style={{ color: GOLD }}>ZIMBABWE APPLICATION</div>
            <p className="text-gray-700">{p.zimbabweApplication}</p>
          </div>

          {/* Drill */}
          <div
            className="p-3 rounded-lg text-sm"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <div className="text-xs font-semibold mb-1" style={{ color: G }}>DRILL</div>
            <p className="text-gray-700">{p.drill}</p>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Module Quiz ──────────────────────────────────────────────────────────────

function ModuleQuiz({
  questions,
  onComplete,
}: {
  questions: CourseModule["quiz"];
  onComplete: () => void;
}) {
  const [idx,      setIdx]      = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score,    setScore]    = useState(0);
  const [done,     setDone]     = useState(false);

  const q = questions[idx];
  const passThreshold = Math.ceil(questions.length * 0.6);

  const handleSelect = (i: number) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === q.correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 < questions.length) {
      setIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setDone(true);
    }
  };

  if (done) {
    const passed = score >= passThreshold;
    const pct    = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center py-6 space-y-3">
        <Trophy size={40} style={{ color: GOLD }} className="mx-auto" />
        <div className="text-2xl font-bold" style={{ color: G }}>{pct}%</div>
        <div className="text-sm text-gray-500">{score} / {questions.length} correct</div>
        {passed ? (
          <button
            onClick={onComplete}
            className="px-6 py-2 rounded-full text-sm font-semibold text-white"
            style={{ background: G }}
          >
            Claim Badge ✓
          </button>
        ) : (
          <>
            <p className="text-xs text-gray-500">
              You need {passThreshold}/{questions.length} to pass. Try again!
            </p>
            <button
              onClick={() => {
                setIdx(0); setSelected(null);
                setAnswered(false); setScore(0); setDone(false);
              }}
              className="px-6 py-2 rounded-full text-sm font-semibold"
              style={{ background: "#f4f2ee", color: G, border: `1px solid ${G}` }}
            >
              Try Again
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Question {idx + 1} of {questions.length}</span>
        <span className="text-xs text-gray-500">Score: {score}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-gray-100">
        <div
          className="h-1 rounded-full transition-all"
          style={{ width: `${(idx / questions.length) * 100}%`, background: G }}
        />
      </div>

      <div className="font-semibold text-sm text-gray-800">{q.question}</div>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let bg     = "#f9f9f9";
          let border = "1px solid #e5e5e5";
          if (answered) {
            if (i === q.correct) { bg = "#f0fdf4"; border = `1px solid ${G}`; }
            else if (i === selected) { bg = "#fff1f2"; border = "1px solid #fecdd3"; }
          } else if (i === selected) {
            bg = "#f0fdf4"; border = `1px solid ${G}`;
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ background: bg, border }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <button
          onClick={next}
          className="px-4 py-1.5 rounded-full text-sm font-semibold text-white"
          style={{ background: G }}
        >
          {idx + 1 < questions.length ? "Next Question" : "See Results"}
        </button>
      )}
    </div>
  );
}

// ─── Course Module Card ────────────────────────────────────────────────────────

const MODULE_EMOJI = ["📋", "⚔️", "🛡️", "📊", "👶"];

function CourseModuleCard({
  m,
  earned,
  onBadge,
}: {
  m: CourseModule;
  earned: boolean;
  onBadge: () => void;
}) {
  const [open,     setOpen]     = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const emoji = MODULE_EMOJI[(m.id - 1) % MODULE_EMOJI.length];

  return (
    <div
      style={{
        border: `1px solid ${earned ? G : "rgba(26,92,42,0.2)"}`,
        borderRadius: 12,
      }}
      className="bg-white overflow-hidden"
    >
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-2xl flex-shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-bold text-sm" style={{ color: G }}>{m.title}</div>
            {earned && <CheckCircle2 size={15} color={G} />}
          </div>
          <div className="text-xs text-gray-400">{m.duration} · {m.topics.length} topics</div>
        </div>
        {open ? <ChevronUp size={18} color={G} /> : <ChevronDown size={18} color={G} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-3">

          {/* Topics */}
          <div className="space-y-1">
            {m.topics.map((t) => (
              <div key={t} className="flex items-start gap-2 text-sm text-gray-600">
                <BookOpen size={13} color={G} className="mt-0.5 flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>

          {/* Badge info */}
          {earned ? (
            <div
              className="flex items-center gap-2 p-3 rounded-lg text-sm"
              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
            >
              <Trophy size={16} style={{ color: GOLD }} />
              <span className="font-semibold" style={{ color: G }}>Badge earned: {m.badge}</span>
            </div>
          ) : (
            <>
              {!quizOpen ? (
                <button
                  onClick={() => setQuizOpen(true)}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                  style={{ background: G }}
                >
                  Take Quiz ({m.quiz.length} questions)
                </button>
              ) : (
                <div
                  className="p-4 rounded-xl"
                  style={{ background: "#f8f9fa", border: "1px solid #e5e5e5" }}
                >
                  <ModuleQuiz
                    questions={m.quiz}
                    onComplete={() => { onBadge(); setQuizOpen(false); }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "formations" | "principles" | "education";

export default function TacticsLearnPage() {
  const router  = useRouter();
  const [tab,    setTab]    = useState<Tab>("formations");
  const [badges, setBadges] = useState<Set<string>>(new Set());

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "formations", label: "Formations", icon: <Target       size={15} /> },
    { id: "principles", label: "Principles", icon: <BookOpen     size={15} /> },
    { id: "education",  label: "Coach Ed",   icon: <GraduationCap size={15} /> },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Sticky nav */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Back"
          >
            <ArrowLeft size={20} color={G} />
          </button>
          <div className="flex-1">
            <div className="font-bold text-base" style={{ color: G }}>Tactics Learning</div>
            <div className="text-xs text-gray-400">Formations · Principles · Coach Education</div>
          </div>
          {badges.size > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "#fffbeb", color: GOLD, border: "1px solid #fde68a" }}
            >
              <Trophy size={12} />
              {badges.size} badge{badges.size > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto flex border-t border-gray-100">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors"
              style={
                tab === t.id
                  ? { color: G, borderBottom: `2px solid ${G}` }
                  : { color: "#6b7280", borderBottom: "2px solid transparent" }
              }
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── Formations ─────────────────────────────────────────── */}
        {tab === "formations" && (
          <>
            <p className="text-sm text-gray-500">
              The 5 most-used formations in Zimbabwean football — how they work, when to use them, and what to coach.
            </p>
            {FORMATION_LIBRARY.map((f) => (
              <FormationCard key={f.name} f={f} />
            ))}
          </>
        )}

        {/* ── Principles ─────────────────────────────────────────── */}
        {tab === "principles" && (
          <>
            <p className="text-sm text-gray-500">
              The 6 core tactical principles every Zimbabwean coach should know — with drills and Zimbabwe-specific coaching tips.
            </p>
            {TACTICAL_PRINCIPLES.map((p) => (
              <PrincipleCard key={p.id} p={p} />
            ))}
          </>
        )}

        {/* ── Education ──────────────────────────────────────────── */}
        {tab === "education" && (
          <>
            <p className="text-sm text-gray-500">
              Complete all 5 modules and earn your coaching badges. Score 60% or more on each quiz to claim the badge.
            </p>

            {/* Badge shelf */}
            {badges.size > 0 && (
              <div
                className="p-3 rounded-xl flex flex-wrap gap-2 items-center"
                style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
              >
                <Trophy size={16} style={{ color: GOLD }} />
                {Array.from(badges).map((b) => (
                  <span
                    key={b}
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "#f0fdf4", color: G, border: "1px solid #bbf7d0" }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}

            {/* All complete */}
            {badges.size === COACHING_COURSE_MODULES.length && (
              <div
                className="p-4 rounded-xl text-center"
                style={{ background: `linear-gradient(135deg, ${G}, #14472a)` }}
              >
                <Trophy size={32} style={{ color: GOLD }} className="mx-auto mb-2" />
                <div className="text-white font-bold">All Modules Complete!</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                  You have earned every badge in the GrassRoots Coaching Course.
                </div>
              </div>
            )}

            {COACHING_COURSE_MODULES.map((m) => (
              <CourseModuleCard
                key={m.id}
                m={m}
                earned={badges.has(m.title)}
                onBadge={() => setBadges((prev) => new Set([...prev, m.title]))}
              />
            ))}
          </>
        )}

      </div>
    </div>
  );
}
