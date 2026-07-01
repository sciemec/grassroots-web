"use client";

import Link from "next/link";
import { CheckCircle2, Play, Video, Lock, ChevronDown, ChevronUp, Clock, MapPin } from "lucide-react";
import type { DrillData, AgeGroup } from "@/lib/drill-data";

const DIFFICULTY_CONFIG = {
  1: { label: "Beginner",     color: "#15803d", bg: "#dcfce7" },
  2: { label: "Intermediate", color: "#92400e", bg: "#fef3c7" },
  3: { label: "Advanced",     color: "#991b1b", bg: "#fee2e2" },
} as const;

const EQUIPMENT_CONFIG = {
  zero:  { label: "No equipment",  icon: "🟢" },
  basic: { label: "Ball / partner", icon: "⚽" },
  gym:   { label: "Gym needed",    icon: "🏋️" },
} as const;

const CATEGORY_CONFIG = {
  Technical: { color: "#1d4ed8", bg: "#dbeafe" },
  Physical:  { color: "#c2410c", bg: "#ffedd5" },
  Tactical:  { color: "#7e22ce", bg: "#f3e8ff" },
} as const;

interface DrillCardProps {
  drill:          DrillData;
  index:          number;
  isDone:         boolean;
  isExpanded:     boolean;
  isPremiumUser:  boolean;
  onToggleExpand: (id: string) => void;
  onMarkDone:     (id: string) => void;
  ageGroup?:      AgeGroup;
  masteryCount?:  number;
}

export default function DrillCard({
  drill,
  index,
  isDone,
  isExpanded,
  isPremiumUser,
  onToggleExpand,
  onMarkDone,
  ageGroup,
  masteryCount = 0,
}: DrillCardProps) {
  const diff  = DIFFICULTY_CONFIG[drill.difficulty_level];
  const equip = EQUIPMENT_CONFIG[drill.equipment_tier];
  const cat   = CATEGORY_CONFIG[drill.category];

  // Resolve age-variant instructions if available
  const ageVariant = ageGroup ? drill.age_variants?.[ageGroup] : undefined;
  const instructionsToShow = ageVariant?.instructions ?? drill.instructions;

  // Mastery badge colour
  const masteryColor =
    masteryCount >= 3 ? "#15803d" :
    masteryCount >= 1 ? "#92400e" :
    "#9ca3af";
  const masteryBg =
    masteryCount >= 3 ? "#dcfce7" :
    masteryCount >= 1 ? "#fef3c7" :
    "#f3f4f6";

  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden transition-all shadow-sm ${
        isDone ? "border-emerald-200 bg-emerald-50/20" : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
    >
      {/* ── COLLAPSED HEADER ── */}
      <button
        onClick={() => onToggleExpand(drill.id)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left bg-transparent border-none cursor-pointer"
      >
        {/* Circle number / done tick */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${
            isDone ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          {isDone ? <CheckCircle2 size={14} /> : index + 1}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          {/* Badge row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-gray-100 text-gray-700 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded">
              {drill.duration}
            </span>
            {masteryCount > 0 && (
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded"
                style={{ color: masteryColor, background: masteryBg }}
              >
                {masteryCount >= 3 ? "Mastered" : `${masteryCount}x done`}
              </span>
            )}
            {ageVariant && ageGroup && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {ageGroup === "u13" ? "U13" : ageGroup === "u16" ? "U16" : ageGroup === "u19" ? "U19" : "Senior"} version
              </span>
            )}
            <span
              className="text-[9px] font-black px-2 py-0.5 rounded"
              style={{ color: diff.color, background: diff.bg }}
            >
              {diff.label}
            </span>
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded"
              style={{ color: cat.color, background: cat.bg }}
            >
              {drill.category}
            </span>
            <span className="text-[11px]" title={equip.label}>{equip.icon}</span>
          </div>
          {/* Name */}
          <h3
            className={`text-sm font-black uppercase tracking-wide ${
              isDone ? "text-emerald-700 line-through opacity-70" : "text-gray-900"
            }`}
          >
            {drill.name}
          </h3>
        </div>

        <span className="text-gray-300 flex-shrink-0">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* ── EXPANDED BODY ── */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5">

          {/* PAYWALL — Advanced drills locked for free users */}
          {drill.is_premium && !isPremiumUser ? (
            <div className="text-center space-y-3 py-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Lock size={22} className="text-gray-400" />
              </div>
              <p className="text-sm font-black text-gray-800">Pro Drill</p>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                This Advanced drill is unlocked with a Pro subscription — along with Gemini AI video feedback.
              </p>
              <Link
                href="/player/subscription"
                className="inline-block text-xs font-black px-5 py-2.5 rounded-xl text-white"
                style={{ background: "#1a5c2a" }}
              >
                Upgrade to Pro →
              </Link>
              <p className="text-[10px] text-gray-400">From $10/month · Cancel anytime</p>
            </div>
          ) : (
          <>

          {/* ① WHY THIS DRILL */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1a5c2a] mb-1.5">
              Why this drill
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">{drill.football_benefit}</p>
          </div>

          {/* ② WHEN TO USE */}
          {drill.when_to_use && (
            <div className="flex gap-3 items-start bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <Clock size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">
                  When to use
                </h4>
                <p className="text-sm text-amber-900 leading-relaxed">{drill.when_to_use}</p>
              </div>
            </div>
          )}

          {/* ③ WHERE ON THE PITCH */}
          {drill.where_on_pitch && (
            <div className="flex gap-3 items-start bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
              <MapPin size={15} className="text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-sky-700 mb-1">
                  Where on the pitch
                </h4>
                <p className="text-sm text-sky-900 leading-relaxed">{drill.where_on_pitch}</p>
              </div>
            </div>
          )}

          {/* ④ HOW TO DO IT */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1a5c2a] mb-2">
              How to do it
            </h4>
            {ageVariant?.coaching_notes && (
              <p className="text-xs italic text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3">
                Coach tip: {ageVariant.coaching_notes}
              </p>
            )}
            <div className="space-y-2">
              {instructionsToShow.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-[#1a5c2a] text-white text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
            {/* Equipment pill */}
            <div className="mt-3 inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
              <span className="text-sm">{equip.icon}</span>
              <span className="text-[10px] font-bold text-gray-600">Equipment: {equip.label}</span>
            </div>
            {drill.gender_notes && (
              <div className="mt-2 text-[10px] text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-3 py-1 inline-block ml-2">
                {drill.gender_notes}
              </div>
            )}
          </div>

          {/* ⑤ WHAT GOOD FEELS LIKE */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-1.5">
              What good feels like
            </h4>
            <p className="text-sm text-emerald-900 leading-relaxed italic">
              &ldquo;{drill.success_feels_like}&rdquo;
            </p>
          </div>

          {/* ⑥ GEMINI WILL SCORE */}
          <div
            className="border rounded-xl p-4"
            style={{ background: isPremiumUser ? "#faf5ff" : "#f3f4f6", borderColor: isPremiumUser ? "#d8b4fe" : "#e5e7eb" }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: isPremiumUser ? "#7e22ce" : "#6b7280" }}>
                Gemini will score
              </h4>
              {!isPremiumUser && (
                <span className="flex items-center gap-1 bg-gray-200 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded-full">
                  <Lock size={9} /> Pro only
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {drill.gemini_scores.map((attr, i) => (
                <span
                  key={i}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: isPremiumUser ? "#ede9fe" : "#f3f4f6",
                    color:      isPremiumUser ? "#5b21b6" : "#9ca3af",
                  }}
                >
                  {isPremiumUser ? "✓" : <Lock size={9} className="inline mr-0.5" />} {attr}
                </span>
              ))}
            </div>
            {!isPremiumUser && (
              <p className="text-[10px] text-gray-400 mt-2">
                Upload your drill video and Gemini AI will score these specific attributes.{" "}
                <Link href="/player/subscription" className="text-purple-600 underline font-bold">
                  Upgrade to Pro →
                </Link>
              </p>
            )}
          </div>

          {/* ⑦ META GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Equipment", value: equip.label },
              { label: "Duration",  value: drill.duration },
              { label: "Positions", value: drill.position_tags.join(", ") },
              { label: "Muscles",   value: drill.muscles_targeted.join(", ") },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{item.label}</p>
                <p className="text-[11px] font-semibold text-gray-700 leading-tight">{item.value}</p>
              </div>
            ))}
          </div>

          {/* ⑧ ACTION BUTTONS */}
          <div className="flex flex-wrap gap-2 pt-1">
            {isPremiumUser ? (
              <Link
                href={`/player/analyse?drill=${drill.id}&name=${encodeURIComponent(drill.name)}`}
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all"
                style={{ background: "#7e22ce", color: "#fff", border: "1px solid #7e22ce" }}
              >
                <Video size={13} />
                Record &amp; Get AI Feedback
              </Link>
            ) : (
              <Link
                href="/player/subscription"
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all"
                style={{ background: "#f3f4f6", color: "#9ca3af", border: "1px solid #e5e7eb" }}
              >
                <Lock size={13} />
                Record &amp; Get AI Feedback
              </Link>
            )}

            <button
              onClick={() => onMarkDone(drill.id)}
              className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                isDone
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-[#1a5c2a] text-white border-[#1a5c2a]"
              }`}
            >
              {isDone ? <><CheckCircle2 size={12} /> Completed</> : <><Play size={12} className="fill-current" /> Mark as done</>}
            </button>
          </div>

          {/* ⑨ GEMINI CANNOT MEASURE DISCLAIMER */}
          <p className="text-[9px] text-gray-400 italic border-t border-gray-100 pt-3">
            Gemini cannot measure match intelligence, composure, or decision-making under pressure —
            those require a real coach watching you play. AI feedback scores technique only.
          </p>
          </>
          )}
        </div>
      )}
    </div>
  );
}
