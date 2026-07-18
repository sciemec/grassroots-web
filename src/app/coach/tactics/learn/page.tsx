"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Target, GraduationCap, ChevronDown, ChevronUp, CheckCircle2, Circle, Trophy } from "lucide-react";
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

// ─── Formation Diagram ───────────────────────────────────────────────────────

function FormationDiagram({ positions }: { positions: FormationDetail["positions"] }) {
  return (
    <svg viewBox="0 0 100 140" className="w-full max-w-[180px] mx-auto block">
      {/* Pitch */}
      <rect x="0" y="0" width="100" height="140" fill="#2d7a46" rx="4" />
      {/* Centre line */}
      <line x1="5" y1="70" x2="95" y2="70" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      {/* Centre circle */}
      <circle cx="50" cy="70" r="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      {/* Penalty box top */}
      <rect x="25" y="5" width="50" height="20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      {/* Penalty box bottom */}
      <rect x="25" y="115" width="50" height="20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
      {/* Players (attack half = top, y 10–65) */}
      {positions.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="5" fill={GOLD} stroke="#fff" strokeWidth="0.8" />
          <text
            x={p.x}
            y={p.y + 0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="3.5"
            fill="#fff"
            fontWeight="bold"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Formation Card ───────────────────────────────────────────────────────────

function FormationCard({ f }: { f: FormationDetail }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ border: `1px solid rgba(26,92,42,0.2)`, borderRadius: 12 }}
      className="bg-white overflow-hidden"
    >
      <button
        className="w-full flex items-center gap-4 p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <FormationDiagram positions={f.positions} />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg" style={{ color: G }}>{f.name}</div>
          <div className="text-sm text-gray-500 mb-1">{f.style}</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {f.bestFor.map((b) => (
              <span
                key={b}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "#f0fdf4", color: G, border: `1px solid #bbf7d0` }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
        {open ? <ChevronUp size={18} color={G} /> : <ChevronDown size={18} color={G} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div>
              <div className="text-xs font-semibold mb-1" style={{ color: G }}>STRENGTHS</div>
              <ul className="space-y-1">
                {f.strengths.map((s) => (
                  <li key={s} className="text-sm text-gray-700 flex gap-1.5">
                    <CheckCircle2 size={14} color={G} className="mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold mb-1 text-red-700">WEAKNESSES</div>
              <ul className="space-y-1">
                {f.weaknesses.map((w) => (
                  <li key={w} className="text-sm text-gray-700 flex gap-1.5">
                    <span className="text-red-400 mt-0.5">•</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: GOLD }}>KEY INSTRUCTIONS</div>
            <ul className="space-y-1">
              {f.keyInstructions.map((i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-1.5">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: GOLD }}>→</span>
                  {i}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="p-3 rounded-lg text-sm text-gray-700 italic"
            style={{ background: "#fffbeb", border: `1px solid #fde68a` }}
          >
            <span className="font-semibold not-italic" style={{ color: GOLD }}>Zimbabwe Context: </span>
            {f.zimbabweContext}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Principle Card ───────────────────────────────────────────────────────────

function PrincipleCard({ p }: { p: TacticalPrinciple }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ border: `1px solid rgba(26,92,42,0.2)`, borderRadius: 12 }}
      className="bg-white overflow-hidden"
    >
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-2xl">{p.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold" style={{ color: G }}>{p.title}</div>
          <div className="text-sm text-gray-500">{p.phase} phase</div>
        </div>
        {open ? <ChevronUp size={18} color={G} /> : <ChevronDown size={18} color={G} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <p className="text-sm text-gray-700">{p.description}</p>

          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: G }}>COACHING POINTS</div>
            <ul className="space-y-1">
              {p.coachingPoints.map((cp) => (
                <li key={cp} className="text-sm text-gray-700 flex gap-1.5">
                  <span style={{ color: G }} className="mt-0.5">•</span>
                  {cp}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: GOLD }}>DRILLS</div>
            <ul className="space-y-1">
              {p.drills.map((d) => (
                <li key={d} className="text-sm text-gray-700 flex gap-1.5">
                  <span style={{ color: GOLD }} className="mt-0.5">→</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="p-3 rounded-lg text-sm"
            style={{ background: "#f0fdf4", border: `1px solid #bbf7d0` }}
          >
            <span className="font-semibold" style={{ color: G }}>Common mistake: </span>
            <span className="text-gray-700">{p.commonMistake}</span>
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
  const [idx, setIdx]       = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore]   = useState(0);
  const [done, setDone]     = useState(false);

  const q = questions[idx];

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
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center py-6 space-y-3">
        <Trophy size={40} style={{ color: GOLD }} className="mx-auto" />
        <div className="text-2xl font-bold" style={{ color: G }}>{pct}%</div>
        <div className="text-gray-600 text-sm">
          {score} / {questions.length} correct
        </div>
        {pct >= 70 ? (
          <button
            onClick={onComplete}
            className="px-6 py-2 rounded-full text-sm font-semibold text-white"
            style={{ background: G }}
          >
            Claim Badge
          </button>
        ) : (
          <button
            onClick={() => { setIdx(0); setSelected(null); setAnswered(false); setScore(0); setDone(false); }}
            className="px-6 py-2 rounded-full text-sm font-semibold"
            style={{ background: "#f4f2ee", color: G }}
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500">Question {idx + 1} of {questions.length}</div>
      <div className="font-semibold text-gray-800">{q.question}</div>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let bg = "#f9f9f9";
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
              className="w-full text-left px-3 py-2 rounded-lg text-sm"
              style={{ background: bg, border }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ background: "#fffbeb", border: `1px solid #fde68a` }}
        >
          {q.explanation}
        </div>
      )}
      {answered && (
        <button
          onClick={next}
          className="px-4 py-1.5 rounded-full text-sm font-semibold text-white"
          style={{ background: G }}
        >
          {idx + 1 < questions.length ? "Next" : "See Results"}
        </button>
      )}
    </div>
  );
}

// ─── Course Module Card ────────────────────────────────────────────────────────

function CourseModuleCard({ m, earned, onBadge }: { m: CourseModule; earned: boolean; onBadge: () => void }) {
  const [open, setOpen]       = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <div
      style={{ border: `1px solid ${earned ? G : "rgba(26,92,42,0.2)"}`, borderRadius: 12 }}
      className={`bg-white overflow-hidden ${earned ? "ring-1" : ""}`}
    >
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-2xl">{m.badge}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-bold" style={{ color: G }}>{m.title}</div>
            {earned && <CheckCircle2 size={16} color={G} />}
          </div>
          <div className="text-xs text-gray-500">
            Level {m.level} • {m.duration}
          </div>
        </div>
        {open ? <ChevronUp size={18} color={G} /> : <ChevronDown size={18} color={G} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-3">
          <div className="space-y-1">
            {m.topics.map((t) => (
              <div key={t} className="flex items-start gap-2 text-sm text-gray-700">
                <BookOpen size={13} color={G} className="mt-0.5 flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>

          {!quizOpen ? (
            <button
              onClick={() => setQuizOpen(true)}
              className="px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: earned ? "#9ca3af" : G }}
              disabled={earned}
            >
              {earned ? "Badge Earned" : "Take Quiz"}
            </button>
          ) : (
            <ModuleQuiz questions={m.quiz} onComplete={() => { onBadge(); setQuizOpen(false); }} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "formations" | "principles" | "education";

export default function TacticsLearnPage() {
  const router   = useRouter();
  const [tab, setTab] = useState<Tab>("formations");
  const [badges, setBadges] = useState<Set<string>>(new Set());

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "formations", label: "Formations",    icon: <Target size={16} />       },
    { id: "principles", label: "Principles",    icon: <BookOpen size={16} />     },
    { id: "education",  label: "Coach Ed",      icon: <GraduationCap size={16} /> },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Nav */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={20} color={G} />
          </button>
          <div className="flex-1">
            <div className="font-bold text-base" style={{ color: G }}>Tactics Learning</div>
            <div className="text-xs text-gray-500">Formations · Principles · Coach Education</div>
          </div>
          {badges.size > 0 && (
            <div
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "#fffbeb", color: GOLD, border: `1px solid #fde68a` }}
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
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {tab === "formations" && (
          <>
            <div className="text-sm text-gray-600 mb-2">
              Learn the 5 most-used formations in Zimbabwean football — how they work, when to use them, and what to coach.
            </div>
            {FORMATION_LIBRARY.map((f) => (
              <FormationCard key={f.name} f={f} />
            ))}
          </>
        )}

        {tab === "principles" && (
          <>
            <div className="text-sm text-gray-600 mb-2">
              Master the 6 core tactical principles that underpin every coaching session — with drills and coaching cues.
            </div>
            {TACTICAL_PRINCIPLES.map((p) => (
              <PrincipleCard key={p.title} p={p} />
            ))}
          </>
        )}

        {tab === "education" && (
          <>
            <div className="text-sm text-gray-600 mb-2">
              Complete modules and earn digital badges. Score 70%+ on the quiz to claim each badge.
            </div>
            <div className="flex gap-2 flex-wrap mb-3">
              {Array.from(badges).map((b) => (
                <span
                  key={b}
                  className="text-xl"
                  title={b}
                >
                  {COACHING_COURSE_MODULES.find((m) => m.title === b)?.badge ?? "🏅"}
                </span>
              ))}
              {badges.size === 0 && (
                <span className="text-sm text-gray-400 italic">No badges yet — complete a module quiz to earn one.</span>
              )}
            </div>
            {COACHING_COURSE_MODULES.map((m) => (
              <CourseModuleCard
                key={m.title}
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
