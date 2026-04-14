"use client";

import Link from "next/link";
import { CheckCircle2, Award, BookOpen, Users, Target, Zap, Star, ChevronRight, Shield } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FIFA_NON_NEGOTIABLES = [
  { emoji: "😄", title: "Fun",                  desc: "Every session must be enjoyable. Players who enjoy training return for more." },
  { emoji: "🛡️", title: "Safety",               desc: "Physical and emotional safety is non-negotiable in every drill." },
  { emoji: "🎯", title: "Clear purpose",         desc: "Every drill has one clear learning objective. No busy work." },
  { emoji: "🤝", title: "Inclusion",             desc: "Every player participates. No player stands watching for more than 30 seconds." },
  { emoji: "⚽", title: "Game-based learning",   desc: "Skills are learned inside game situations, not isolated repetition alone." },
  { emoji: "🖐️", title: "Maximum ball touches",  desc: "Every player touches the ball as many times as possible per session." },
];

const BRACKETS = [
  {
    age: "Ages 8–12",
    label: "Foundation Phase",
    method: "GAG — Global · Analytical · Global",
    color: "from-teal-600 to-emerald-700",
    badge: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    icon: "⭐",
    focus: [
      "Ball mastery — juggling, dribbling, 1v1 situations",
      "Basic shooting technique with correct foot shape",
      "Fun-first, repetition-heavy small-sided games (3v3, 4v4)",
      "Dribbling courses and individual skill challenges",
      "NO tactical concepts — motor learning only",
    ],
    sessionStructure: [
      { phase: "Global (Game)",      time: "10 min", desc: "Start with a small-sided game — let them play freely" },
      { phase: "Analytical (Skill)", time: "20 min", desc: "Isolate one technique (e.g. inside-foot dribbling)" },
      { phase: "Global (Game)",      time: "15 min", desc: "Return to game — see if skill appears naturally" },
    ],
    coachingTone: "Encouragement-first. Celebrate every attempt. Short instructions (3 words max per cue). Ask 'How did that feel?' not 'Why did you do that?'",
    drills: ["Juggling challenge (beat your record)", "Cone dribbling slalom", "1v1 to small goals", "4v4 no goalkeeper", "Ball mastery ABC sequence"],
  },
  {
    age: "Ages 12–15",
    label: "Progressive Phase",
    method: "Progressive Methodology",
    color: "from-amber-600 to-orange-700",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: "🚀",
    focus: [
      "Tactical introduction — shape, pressing, transitions",
      "Rondo variations (4v1, 5v2, 6v2) for decision-making",
      "Game-like situations — 8v8, positional games",
      "Passing combinations under pressure",
      "Introduction to positional roles and responsibilities",
    ],
    sessionStructure: [
      { phase: "Activation",        time: "10 min", desc: "Rondo or passing combination to warm up the mind" },
      { phase: "Skill Application", time: "20 min", desc: "Positional game with specific tactical constraint" },
      { phase: "Full Expression",   time: "20 min", desc: "11v11 or 9v9 match applying the session theme" },
    ],
    coachingTone: "Ask 'What did you see?' not 'You should have done X.' Build football IQ. Introduce the WHY behind every decision. Players should understand shape, not just follow instructions.",
    drills: ["Rondo 4v1 / 5v2", "Positional play with zones", "Pressing triggers 6v4", "Combination passing sequences", "8v8 with positional themes"],
  },
  {
    age: "Ages 15+",
    label: "Performance Phase",
    method: "Play · Practice · Play",
    color: "from-purple-600 to-indigo-700",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: "🏆",
    focus: [
      "Full tactical understanding — pressing systems, block defence",
      "Physical conditioning integrated with technical work",
      "Set piece preparation (corners, free kicks, throw-ins)",
      "Positional mastery and role-specific development",
      "Match analysis and self-correction",
    ],
    sessionStructure: [
      { phase: "Play (Game)",         time: "10 min", desc: "Free play — let the coach observe natural tendencies" },
      { phase: "Practice (Training)", time: "30 min", desc: "High-intensity drill targeting the session objective" },
      { phase: "Play (Match)",        time: "20 min", desc: "Match with the session theme applied under pressure" },
    ],
    coachingTone: "Professional and outcome-focused. Use data ('You covered 8km last session — today aim for 9km'). Challenge players. Build leaders on the pitch.",
    drills: ["Rondo 6v3 high press", "Full-pitch positional games", "Set piece rehearsal", "High-press trigger drills", "Fitness-integrated technical circuits"],
  },
];

const SCHOOL_BENEFITS = [
  { icon: Shield,    title: "International Credibility",      desc: "Your curriculum is aligned with FIFA's globally accepted Progressive Methodology — the same framework used by European academies." },
  { icon: Award,     title: "NASH-Ready Training Plans",      desc: "Age-appropriate programmes designed to prepare students for NASH and NAPH competitions." },
  { icon: BookOpen,  title: "Coach Development",              desc: "Every physical education teacher gets a FIFA-aligned coaching framework, not guesswork." },
  { icon: Users,     title: "Player Tracking",                desc: "Monitor every student's development against FIFA milestones — not just match results." },
  { icon: Target,    title: "Talent Identification",          desc: "Identify gifted students early using AI-powered potential scoring before other schools do." },
  { icon: Zap,       title: "Zero Equipment Required",        desc: "The Foundation and Progressive phases require no equipment — only a ball and space." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchoolCurriculumPage() {
  return (
    <main className="min-h-screen bg-[#0d2b1a]">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0d2b1a] via-[#1a5c2a] to-[#0d2b1a] px-6 py-20 text-center">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent 0px, transparent 8px, rgba(240,180,41,0.3) 8px, rgba(240,180,41,0.3) 10px), repeating-linear-gradient(45deg, transparent 0px, transparent 8px, rgba(240,180,41,0.3) 8px, rgba(240,180,41,0.3) 10px)",
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f0b429]/30 bg-[#f0b429]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#f0b429]">
            <Award className="h-3.5 w-3.5" />
            FIFA-Aligned Curriculum
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Your School&apos;s Sports Programme,{" "}
            <span className="text-[#f0b429]">Built on FIFA Standards</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">
            GrassRoots Sports delivers training plans aligned with FIFA&apos;s Progressive Methodology —
            the same framework used by top academies across Europe and Africa.
            Give your students world-class coaching. No guesswork.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register/coach"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#f0b429] px-7 py-4 text-base font-bold text-[#1a3a1a] transition-opacity hover:opacity-90"
            >
              Register Your School <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/school-leagues"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-7 py-4 text-base font-semibold text-white/80 transition-colors hover:bg-white/10"
            >
              View NASH Leagues
            </Link>
          </div>
        </div>
      </div>

      {/* ── Credibility bar ───────────────────────────────────────────────────── */}
      <div className="border-y border-white/10 bg-white/5 px-6 py-5">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 text-center">
          {[
            { label: "FIFA Progressive Methodology", sub: "Certified Framework" },
            { label: "3 Age Brackets",               sub: "8–12 · 12–15 · 15+" },
            { label: "6 Non-Negotiables",             sub: "Every Session" },
            { label: "Zimbabwe Schools",              sub: "NASH · NAPH Aligned" },
          ].map(({ label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-base font-bold text-[#f0b429]">{label}</span>
              <span className="text-xs text-white/50">{sub}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-16 space-y-20">

        {/* ── 6 Non-Negotiables ─────────────────────────────────────────────── */}
        <section>
          <div className="mb-2 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#f0b429]">The Foundation</span>
          </div>
          <h2 className="mb-2 text-center text-3xl font-bold text-white">
            FIFA&apos;s 6 Non-Negotiables
          </h2>
          <p className="mb-10 text-center text-white/60">
            Every single training session on this platform — regardless of age group — is built around these six principles.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FIFA_NON_NEGOTIABLES.map(({ emoji, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <span className="block text-2xl">{emoji}</span>
                <p className="mt-2 text-sm font-bold text-white">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Age Brackets ──────────────────────────────────────────────────── */}
        <section>
          <div className="mb-2 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#f0b429]">Progressive Methodology</span>
          </div>
          <h2 className="mb-2 text-center text-3xl font-bold text-white">
            Age-Appropriate Training, Every Session
          </h2>
          <p className="mb-10 text-center text-white/60">
            FIFA mandates different coaching approaches for each age group.
            Our AI automatically applies the correct bracket when generating training plans.
          </p>
          <div className="space-y-10">
            {BRACKETS.map((b) => (
              <div
                key={b.age}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${b.color} px-7 py-6`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className={`inline-block rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${b.badge}`}>
                        {b.age}
                      </span>
                      <h3 className="mt-2 text-2xl font-extrabold text-white">
                        {b.icon} {b.label}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-white/80">{b.method}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-0 p-0 sm:grid-cols-2">
                  {/* Focus areas */}
                  <div className="border-b border-white/10 p-6 sm:border-b-0 sm:border-r">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40">
                      Training Focus
                    </p>
                    <ul className="space-y-2">
                      {b.focus.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-white/80">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#f0b429]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Session structure + drills */}
                  <div className="p-6">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/40">
                      Session Structure
                    </p>
                    <div className="space-y-2">
                      {b.sessionStructure.map((s) => (
                        <div key={s.phase} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{s.phase}</span>
                            <span className="text-[10px] text-[#f0b429]">{s.time}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-white/50">{s.desc}</p>
                        </div>
                      ))}
                    </div>

                    <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-widest text-white/40">
                      Typical Drills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {b.drills.map((d) => (
                        <span key={d} className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[11px] text-white/70">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Coaching tone */}
                <div className="border-t border-white/10 bg-white/3 px-6 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Coaching Tone</p>
                  <p className="mt-1 text-xs italic text-white/60">&quot;{b.coachingTone}&quot;</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── School Benefits ───────────────────────────────────────────────── */}
        <section>
          <div className="mb-2 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#f0b429]">For Headmasters</span>
          </div>
          <h2 className="mb-2 text-center text-3xl font-bold text-white">
            What Your School Gets
          </h2>
          <p className="mb-10 text-center text-white/60">
            GrassRoots Sports gives every Zimbabwean school the analytical tools that only
            elite academies could previously afford.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SCHOOL_BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0b429]/10">
                  <Icon className="h-4 w-4 text-[#f0b429]" />
                </div>
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── AI personalisation callout ────────────────────────────────────── */}
        <section className="rounded-3xl border border-[#f0b429]/20 bg-gradient-to-br from-[#1a3a1a] to-[#0d2b0d] p-8 text-center">
          <span className="text-3xl">🤖</span>
          <h3 className="mt-3 text-2xl font-bold text-white">
            THUTO Knows Their Age. Automatically.
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/65">
            When a student logs in, THUTO reads their age group and automatically applies the
            correct FIFA bracket — GAG for under-12s, Progressive Methodology for 12–15s.
            Every coaching tip, drill recommendation, and feedback message is age-appropriate
            without the coach having to configure anything.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <div className="flex items-center gap-2 rounded-2xl border border-teal-500/30 bg-teal-500/10 px-5 py-3">
              <Star className="h-4 w-4 text-teal-400" />
              <span className="text-sm font-semibold text-teal-300">Under 12: GAG + Ball Mastery</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">12–15: Progressive + Tactical Intro</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-5 py-3">
              <Star className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-300">15+: Play-Practice-Play</span>
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Give Your Students a World-Class Programme?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-white/60">
            Join hundreds of Zimbabwean schools already using GrassRoots Sports.
            Free to start. No equipment required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register/coach"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#f0b429] px-8 py-4 text-base font-bold text-[#1a3a1a] transition-opacity hover:opacity-90"
            >
              Register Your School — Free <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/school-leagues"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-8 py-4 text-base font-semibold text-white/80 transition-colors hover:bg-white/10"
            >
              Explore NASH Leagues
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/30">
            grassrootssports.live · Zimbabwe&apos;s AI Sports Platform
          </p>
        </section>

      </div>
    </main>
  );
}
