"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, Dumbbell, Target, Zap, Shield } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import type { AgeGroup } from "@/lib/drill-data";

const AGE_GROUPS: { id: AgeGroup; label: string; age: string; desc: string; color: string; bg: string }[] = [
  { id: "u13", label: "Under 13",  age: "10–12 yrs", desc: "Foundation & fun — build love for the game",  color: "#15803d", bg: "#f0fdf4" },
  { id: "u16", label: "Under 16",  age: "13–15 yrs", desc: "Skill development — position awareness begins", color: "#1d4ed8", bg: "#eff6ff" },
  { id: "u19", label: "Under 19",  age: "16–18 yrs", desc: "Tactical growth — transition to adult game",   color: "#7e22ce", bg: "#faf5ff" },
  { id: "senior", label: "Senior", age: "18+ yrs",   desc: "Performance — consistency and specialisation", color: "#b45309", bg: "#fffbeb" },
];

type Section = {
  icon: React.ReactNode;
  title: string;
  items: string[];
};

const GUIDE_CONTENT: Record<AgeGroup, {
  headline: string;
  philosophy: string;
  weekly: { day: string; focus: string; duration: string; details: string }[];
  positions: { pos: string; focus: string[]; drillTip: string }[];
  sections: Section[];
  shonaPhrase: string;
  shonaTranslation: string;
}> = {
  u13: {
    headline: "Play More, Practise More, Enjoy More",
    philosophy: "At Under 13, the goal is simple: fall in love with the ball. Every session should feel like a game. Technical skills develop through play — not repetitive drills done in lines. Keep it short, fun, and active.",
    shonaPhrase: "Tamba nenyasha",
    shonaTranslation: "Play with joy",
    weekly: [
      { day: "Mon", focus: "Touch & Control", duration: "45 min", details: "Juggling, 1v1 dribbling, rondos 3v1. Keep the ball moving." },
      { day: "Wed", focus: "Small-Sided Games", duration: "45 min", details: "3v3 or 4v4. No goalkeeper. Maximum touches per player." },
      { day: "Fri", focus: "Fun Match", duration: "60 min", details: "Full small-sided match. Coach observes only — no shouting instructions." },
      { day: "Sat", focus: "Rest or Free Play", duration: "—",    details: "Let players play unstructured football with friends." },
    ],
    positions: [
      { pos: "All positions", focus: ["Ball control in tight spaces", "1v1 attacking confidence", "Basic passing accuracy", "Movement without the ball"], drillTip: "Lions' Den Central Turning is the #1 drill for this age." },
    ],
    sections: [
      { icon: <Target size={15} />, title: "What to develop", items: ["First touch (both feet)", "Ball manipulation in small areas", "Basic 1v2 defending", "Throwing into the game from goal kicks", "Enjoying being in possession"] },
      { icon: <Zap size={15} />, title: "What NOT to focus on", items: ["Heading (brain development — avoid before 13)", "Complex formations", "Winning at all costs", "Long passing patterns", "Physical strength work"] },
      { icon: <Shield size={15} />, title: "Coaching approach", items: ["Positive reinforcement only", "Max 2 instructions per session", "Ask questions instead of telling", "FIFA GAG model: all players touch ball every 20 seconds", "Celebrate creativity, even when it fails"] },
    ],
  },
  u16: {
    headline: "Find Your Position, Build Your Weapon",
    philosophy: "Between 13 and 15, players begin to understand their natural position. This is the time to develop a signature skill — a dribble move, a pass range, a heading ability — while building physical literacy.",
    shonaPhrase: "Shandira nemoyo wose",
    shonaTranslation: "Work with your whole heart",
    weekly: [
      { day: "Mon", focus: "Technical Mastery", duration: "60 min", details: "Position-specific drills. Striker: finishing. Midfielder: receiving + turning. Defender: 1v1 defending." },
      { day: "Tue", focus: "Physical — Speed & Agility", duration: "45 min", details: "Sprint mechanics, change of direction, reaction. No ball needed." },
      { day: "Thu", focus: "Tactical Patterns", duration: "60 min", details: "3v2 overloads, pressing triggers, switching play. 10 players max." },
      { day: "Sat", focus: "Full Match or 7v7", duration: "75 min", details: "Apply the week's learning. Coach notes from sideline only." },
    ],
    positions: [
      { pos: "Striker",    focus: ["Finishing under pressure", "Movement in behind", "Hold-up play (basic)"],              drillTip: "Tri-Third Elimination End Zones for goal-scoring instincts." },
      { pos: "Midfielder", focus: ["Receive & turn in tight spaces", "Switch of play", "Winning second balls"],          drillTip: "Rondo 4v2 — minimum 15 minutes every session." },
      { pos: "Defender",   focus: ["1v1 defending body shape", "Heading for clearances", "Short passing out from back"], drillTip: "Defensive shape 4v4 — defend the gate drill." },
      { pos: "Goalkeeper", focus: ["Footwork + distribution", "Shot-stopping angles", "Communication"],                  drillTip: "GK angles work: 10 minutes of position training daily." },
    ],
    sections: [
      { icon: <Target size={15} />, title: "Key skills to develop", items: ["Dominant foot mastery, weaker foot basics", "Speed of play (one/two touch under pressure)", "Positional intelligence — where to be without the ball", "Aerial ability (now safe to introduce heading)", "Sprint endurance (20m repeats)"] },
      { icon: <Dumbbell size={15} />, title: "Physical development", items: ["Body weight only — no gym weights until 16+", "Sprint training: 3×20m, 3×40m with full recovery", "Plyometrics: box jumps, bounds (twice per week)", "Flexibility: 10 min stretching post-session every day"] },
      { icon: <Shield size={15} />, title: "Mental skills", items: ["Decision-making under pressure (3-second rule)", "Pre-match routine development", "Managing mistakes quickly", "Communication on the pitch"] },
    ],
  },
  u19: {
    headline: "Bridge the Gap to Adult Football",
    philosophy: "16-18 is the transition phase. Tactically, players must understand the adult game. Physically, strength training begins. Mentally, resilience is built. This is the hardest age — the dropout risk is highest here. Keep players connected to their purpose.",
    shonaPhrase: "Ramba wakashinga",
    shonaTranslation: "Stay strong",
    weekly: [
      { day: "Mon", focus: "Gym + Technical", duration: "75 min", details: "Compound lifts (squats, deadlifts, bench) followed by 30 min technical work." },
      { day: "Tue", focus: "Tactical Unit Training", duration: "70 min", details: "Positional groups: forwards, midfield, defence train separately then combine." },
      { day: "Thu", focus: "High-Intensity Training", duration: "60 min", details: "Pressing patterns, transition, counter-attack. Match tempo throughout." },
      { day: "Sat", focus: "Full 11v11 Match", duration: "90 min", details: "Full adult match conditions. Post-match debrief (10 min max)." },
    ],
    positions: [
      { pos: "Striker",    focus: ["Combination play in final third", "Pressing from the front", "Set piece movement"], drillTip: "Scoring under pressure: 3v2 finishing with overload." },
      { pos: "Midfielder", focus: ["Box-to-box running loads", "Shielding in midfield", "Line-breaking passes"],        drillTip: "Positional rondo 7v3: maintain shape while circulating." },
      { pos: "Winger",     focus: ["Beating full-backs 1v1", "Crossing quality (moving ball)", "Cutting inside"],       drillTip: "Wide 1v1 channel drill: 10 reps each side." },
      { pos: "Defender",   focus: ["Line defence", "Recovery runs", "Long distribution"],                               drillTip: "Defensive line 4v2: hold shape, delay, recover." },
    ],
    sections: [
      { icon: <Dumbbell size={15} />, title: "Strength training (gym)", items: ["3× per week: compound lifts only", "Squat, deadlift, bench press, pull-ups", "No isolation exercises until base strength achieved", "Target: 1.5× bodyweight squat before elite trail", "Sleep 8–9 hours — growth hormone peaks at night"] },
      { icon: <Target size={15} />, title: "Tactical awareness", items: ["Understand your team's pressing triggers", "Know when to dribble vs pass immediately", "Set piece runs — both attacking and defending", "Reading opposition shape before receiving ball"] },
      { icon: <Zap size={15} />, title: "Professional habits now", items: ["Training diary — write 3 lines after every session", "Film yourself: one clip per week", "Nutrition: 1.6g protein per kg bodyweight daily", "Recovery: ice baths or cold shower after hard sessions"] },
    ],
  },
  senior: {
    headline: "Consistency Beats Perfection",
    philosophy: "Senior players train to perform — not to learn fundamentals. The goal is maintaining physical sharpness, refining tactical roles, and recovering well enough to do it again. Quality over quantity every time.",
    shonaPhrase: "Kushanda nekugadzirira",
    shonaTranslation: "Work and prepare",
    weekly: [
      { day: "Mon", focus: "Recovery + Activation", duration: "40 min", details: "Light movement, foam rolling, pool or bike if available. Low CNS load." },
      { day: "Tue", focus: "Technical + Tactical", duration: "75 min", details: "Position-specific patterns, set piece rehearsal, combination play." },
      { day: "Thu", focus: "High Intensity + Strength", duration: "70 min", details: "Power work in gym, then 30 min game simulations at match speed." },
      { day: "Sat", focus: "Match Day", duration: "90 min", details: "Full performance. Nothing new. Trust the preparation." },
    ],
    positions: [
      { pos: "Striker",    focus: ["Movement timing (runs in behind)", "Hold-up + combination play", "Penalty & set piece routines"],      drillTip: "Shadow finishing: 15 min daily, both feet." },
      { pos: "Central Mid", focus: ["Game management (tempo control)", "Pressing coordination", "Long range passing range"],              drillTip: "Positional play 8v4: circulation + press-breaking." },
      { pos: "Full Back",   focus: ["Overlapping timing with winger", "Defensive positioning vs crosses", "Short distribution from GK"], drillTip: "Overlap patterns: 5v3 wide channel build-up." },
      { pos: "Centre Back", focus: ["Aerial dominance + distribution", "Line management", "Anticipation + interception"],                 drillTip: "1v1 defending: block tackle + jockeying discipline." },
    ],
    sections: [
      { icon: <Zap size={15} />, title: "Weekly load management", items: ["3 hard sessions + 1 match is enough", "Never train at high intensity 2 days before a match", "Subjective wellness check: rate sleep, fatigue, mood 1-10 daily", "Volume drops 30–40% in match weeks", "Extra rest beats extra training every time"] },
      { icon: <Target size={15} />, title: "Performance peaks", items: ["Peak performance = 3–4 day taper before big matches", "Pre-match activation: 15 min ramp-up, not a full session", "Nutrition: 6–8g carbs/kg bodyweight on match day", "Caffeine: 3mg/kg, 60 min before match (if tolerated)"] },
      { icon: <Shield size={15} />, title: "Injury prevention", items: ["Nordic hamstring curls — 3× per week minimum", "Hip flexor mobility daily (5 minutes)", "Calf raises for Achilles prevention", "Report soreness early — do not play through sharp pain", "Minimum 6 hours sleep before any session"] },
    ],
  },
};

function GuideSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white text-left"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <span className="text-[#1a5c2a]">{section.icon}</span>
          {section.title}
        </div>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && (
        <ul className="bg-gray-50 px-4 pb-3 pt-1 space-y-1">
          {section.items.map((item, i) => (
            <li key={i} className="text-sm text-gray-700 flex gap-2">
              <span className="text-[#1a5c2a] mt-0.5 flex-shrink-0">•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DrillGuidesPage() {
  const user = useAuthStore((s) => s.user);
  const [activeAge, setActiveAge] = useState<AgeGroup>("u16");

  const guide = GUIDE_CONTENT[activeAge];
  const ageConfig = AGE_GROUPS.find(a => a.id === activeAge)!;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Nav */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link href="/player/drills" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={16} className="text-gray-600" />
        </Link>
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-[#1a5c2a]" />
          <span className="font-bold text-gray-900 text-sm">Training Guides</span>
        </div>
        <div className="ml-auto">
          <Link
            href="/player/drills"
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: "#1a5c2a", color: "#fff" }}
          >
            Open Drill Lab
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Age Group Selector */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Select Age Group</p>
          <div className="grid grid-cols-2 gap-2">
            {AGE_GROUPS.map(ag => (
              <button
                key={ag.id}
                onClick={() => setActiveAge(ag.id)}
                className="text-left rounded-xl border-2 px-4 py-3 transition-all"
                style={{
                  borderColor: activeAge === ag.id ? ag.color : "#e5e7eb",
                  background:  activeAge === ag.id ? ag.bg : "#fff",
                }}
              >
                <p className="text-sm font-black" style={{ color: ag.color }}>{ag.label}</p>
                <p className="text-[11px] text-gray-500">{ag.age}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{ag.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Headline */}
        <div
          className="rounded-2xl p-5"
          style={{ background: ageConfig.bg, borderLeft: `4px solid ${ageConfig.color}` }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: ageConfig.color }}>
            {ageConfig.label} Philosophy
          </p>
          <h2 className="text-lg font-black text-gray-900 mb-2">{guide.headline}</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{guide.philosophy}</p>
          <p className="mt-3 text-sm italic text-gray-500">
            &ldquo;{guide.shonaPhrase}&rdquo; — {guide.shonaTranslation}
          </p>
        </div>

        {/* Weekly Programme */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Sample Weekly Programme</p>
          <div className="space-y-2">
            {guide.weekly.map((w) => (
              <div key={w.day} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                  style={{ background: ageConfig.bg, color: ageConfig.color }}
                >
                  {w.day}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{w.focus}</span>
                    {w.duration !== "—" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{w.duration}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{w.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Position Guides */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">By Position</p>
          <div className="space-y-3">
            {guide.positions.map((p) => (
              <div key={p.pos} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-black text-gray-900 mb-2">{p.pos}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.focus.map((f) => (
                    <span key={f} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{f}</span>
                  ))}
                </div>
                <p className="text-[11px] italic text-[#1a5c2a] border-l-2 border-[#1a5c2a] pl-2">{p.drillTip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Expandable Sections */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Coaching Notes</p>
          <div className="space-y-2">
            {guide.sections.map((sec, i) => (
              <GuideSection key={i} section={sec} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
          <p className="text-sm font-bold text-gray-900 mb-1">Ready to practise?</p>
          <p className="text-xs text-gray-500 mb-4">Open the Drill Lab to work through position-specific drills with Gemini AI feedback.</p>
          <Link
            href={`/player/drills`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white"
            style={{ background: "#1a5c2a" }}
          >
            <Dumbbell size={14} />
            Open Drill Lab
          </Link>
        </div>

      </div>
    </div>
  );
}
