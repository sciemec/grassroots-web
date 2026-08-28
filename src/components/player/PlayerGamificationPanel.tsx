"use client";

import { useEffect, useState } from "react";
import {
  Flame, Star, Zap, Trophy, ChevronRight, CheckCircle2, SkipForward,
  TrendingUp, TrendingDown, Minus, Shield,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GamificationData {
  rank: string;
  streak: number;
  activeToday: boolean;
  xpTotal: number;
  level: {
    label: string;
    colour: string;
    xp_in_level: number;
    xp_to_next: number;
    progress_pct: number;
  };
  newBadges: string[];
  totalSessions: number;
  dq: number;
}

interface AttributeStatus {
  code: string;
  display_name: string;
  category: string;
  current_percentile: number;
  trend: "improving" | "declining" | "plateau" | "stable";
}

interface GoalMission {
  text: string;
  date: string;
}

// ── XP level thresholds (mirrored from XpService::levelFromXp) ───────────────

const LEVEL_THRESHOLDS = [
  { min: 25000, label: "Legend",         colour: "#7c3aed" },
  { min: 10000, label: "Champion",       colour: "#dc2626" },
  { min: 5000,  label: "Elite Prospect", colour: "#ea580c" },
  { min: 2500,  label: "Athlete",        colour: "#d97706" },
  { min: 1000,  label: "Rising Star",    colour: "#ca8a04" },
  { min: 500,   label: "Contender",      colour: "#0d9488" },
  { min: 200,   label: "Prospect",       colour: "#16a34a" },
  { min: 0,     label: "Recruit",        colour: "#6b7280" },
];

function levelFromXp(xp: number) {
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i].min) {
      const prev  = LEVEL_THRESHOLDS[i + 1]?.min ?? 0;
      const next  = i === 0 ? xp : LEVEL_THRESHOLDS[i - 1]?.min ?? xp;
      const range = next - prev;
      return {
        ...LEVEL_THRESHOLDS[i],
        progress_pct: range > 0 ? Math.min(100, Math.round(((xp - prev) / range) * 100)) : 100,
        xp_to_next: i === 0 ? 0 : next - xp,
      };
    }
  }
  return { ...LEVEL_THRESHOLDS[7], progress_pct: Math.round((xp / 200) * 100), xp_to_next: 200 - xp };
}

// ── Radar data builder ────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  speed_agility:      "Speed",
  endurance:          "Endurance",
  strength_endurance: "Strength",
  power:              "Power",
  flexibility:        "Flex",
  balance:            "Balance",
  coordination:       "Coord",
};

function buildRadarData(statuses: AttributeStatus[]) {
  const buckets: Record<string, number[]> = {};
  for (const s of statuses) {
    if (!buckets[s.category]) buckets[s.category] = [];
    buckets[s.category].push(s.current_percentile);
  }
  return Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
    const vals = buckets[cat] ?? [];
    const avg  = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    return { subject: label, value: avg, fullMark: 100 };
  });
}

// ── Badge display ─────────────────────────────────────────────────────────────

const BADGE_META: Record<string, { emoji: string; colour: string }> = {
  "First Test":        { emoji: "🏁", colour: "#6b7280" },
  "5 Sessions":        { emoji: "🔥", colour: "#ea580c" },
  "Dedicated Athlete": { emoji: "💪", colour: "#16a34a" },
  "3-Week Streak":     { emoji: "⚡", colour: "#d97706" },
  "Iron Commitment":   { emoji: "🏆", colour: "#ca8a04" },
  "Coach Verified":    { emoji: "✅", colour: "#0d9488" },
};

// ── Rank chip colours ─────────────────────────────────────────────────────────

const RANK_COLOURS: Record<string, string> = {
  Elite:      "#ca8a04",
  Advanced:   "#0d9488",
  Developing: "#16a34a",
  Foundation: "#6b7280",
  Beginner:   "#9ca3af",
};

// ── Main component ────────────────────────────────────────────────────────────

export function PlayerGamificationPanel() {
  const [gam,      setGam]      = useState<GamificationData | null>(null);
  const [statuses, setStatuses] = useState<AttributeStatus[]>([]);
  const [mission,  setMission]  = useState<GoalMission | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [missionDone, setMissionDone] = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) { setLoading(false); return; }

    Promise.allSettled([
      api.get("/player/gamification"),
      api.get("/player/attribute-status"),
      api.get("/player/goal"),
    ]).then(([gamRes, attrRes, goalRes]) => {
      if (gamRes.status === "fulfilled") setGam(gamRes.value.data as GamificationData);
      if (attrRes.status === "fulfilled") {
        const raw = attrRes.value.data;
        setStatuses(Array.isArray(raw) ? raw : (raw?.data ?? []));
      }
      if (goalRes.status === "fulfilled") {
        const goal = (goalRes.value.data as { data?: { phases?: { milestones?: string[] }[] } })?.data;
        if (goal?.phases?.[0]?.milestones?.[0]) {
          setMission({ text: goal.phases[0].milestones[0], date: new Date().toISOString().split("T")[0] });
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleMission = async (status: "done" | "skip") => {
    if (!mission) return;
    setMissionDone(true);
    try {
      await api.post("/player/goal/mission", { date: mission.date, status });
    } catch {
      // silent — mission logged offline
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse mb-6">
        <div className="h-6 w-40 rounded bg-white/10 mb-3" />
        <div className="h-40 rounded bg-white/5" />
      </div>
    );
  }

  if (!gam) return null;

  const level    = gam.level ?? levelFromXp(gam.xpTotal ?? 0);
  const radarData = buildRadarData(statuses);
  const hasRadar  = statuses.length > 0;

  // Which categories have data — for the expanded view
  const expandedStatuses = expanded
    ? statuses.filter((s) => CATEGORY_LABELS[s.category] === expanded)
    : [];

  return (
    <div className="mb-6 space-y-3">

      {/* ── Row 1: Level + XP bar ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          {/* Level badge */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-black px-2.5 py-1 rounded-full"
              style={{ background: level.colour + "22", color: level.colour, border: `1px solid ${level.colour}44` }}
            >
              {level.label}
            </span>
            <span className="text-[11px] text-white/50 font-medium">
              {gam.xpTotal.toLocaleString()} XP
            </span>
          </div>

          {/* Streak + Rank */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 text-sm font-bold ${gam.activeToday ? "text-orange-400" : "text-white/40"}`}>
              <Flame className="w-4 h-4" />
              <span>{gam.streak}</span>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: (RANK_COLOURS[gam.rank] ?? "#6b7280") + "22", color: RANK_COLOURS[gam.rank] ?? "#9ca3af", border: `1px solid ${RANK_COLOURS[gam.rank] ?? "#6b7280"}44` }}
            >
              {gam.rank}
            </span>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${level.progress_pct}%`, background: level.colour }}
          />
        </div>
        {level.xp_to_next > 0 && (
          <p className="text-[10px] text-white/30 mt-1">
            {level.xp_to_next.toLocaleString()} XP to next level
          </p>
        )}
      </div>

      {/* ── Row 2: Radar chart ────────────────────────────────────────────── */}
      {hasRadar ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Physical Profile</p>
            <p className="text-[10px] text-white/30">Tap a spoke to expand</p>
          </div>

          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#c8edd0", fontSize: 10, fontWeight: 600 }}
                  onClick={(e) => {
                    const name = (e as { value?: string }).value ?? null;
                    setExpanded(expanded === name ? null : name);
                  }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Percentile"]}
                  contentStyle={{ background: "#1a3d26", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#c8edd0", fontSize: 12 }}
                />
                <Radar
                  name="Athlete"
                  dataKey="value"
                  stroke="#f0b429"
                  fill="#f0b429"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Expanded category detail */}
          {expanded && expandedStatuses.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">{expanded}</p>
              {expandedStatuses.map((s) => (
                <div key={s.code} className="flex items-center justify-between">
                  <span className="text-xs text-white/70">{s.display_name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${s.current_percentile}%`, background: s.current_percentile >= 70 ? "#16a34a" : s.current_percentile >= 40 ? "#f0b429" : "#dc2626" }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-white/60 w-8 text-right">{s.current_percentile}%</span>
                    {s.trend === "improving"  && <TrendingUp   className="w-3 h-3 text-green-400"  />}
                    {s.trend === "declining"  && <TrendingDown className="w-3 h-3 text-red-400"    />}
                    {(s.trend === "plateau" || s.trend === "stable") && <Minus className="w-3 h-3 text-white/30" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center">
          <p className="text-xs text-white/40 font-medium">No physical attributes measured yet.</p>
          <a href="/player/attributes" className="text-xs text-[#f0b429] mt-1 block font-semibold">
            Log your first measurement →
          </a>
        </div>
      )}

      {/* ── Row 3: Quick stats + Today's mission ──────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Quick stats */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Quick Stats</p>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[11px] text-white/50">Sessions</span>
              <span className="text-[11px] font-bold text-white/80">{gam.totalSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-white/50">Total XP</span>
              <span className="text-[11px] font-bold" style={{ color: level.colour }}>{gam.xpTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-white/50">Streak</span>
              <span className="text-[11px] font-bold text-orange-400">🔥 {gam.streak}</span>
            </div>
            {gam.dq > 0 && (
              <div className="flex justify-between">
                <span className="text-[11px] text-white/50">DQ Score</span>
                <span className="text-[11px] font-bold text-white/80">{gam.dq.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Today's mission */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Today&apos;s Mission</p>
          {mission ? (
            missionDone ? (
              <div className="flex flex-col items-center justify-center h-[60px]">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
                <p className="text-[10px] text-green-400 mt-1 font-semibold">Done!</p>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-white/70 leading-snug mb-2 line-clamp-2">{mission.text}</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleMission("done")}
                    className="flex-1 text-[10px] font-bold py-1 rounded-lg text-center"
                    style={{ background: "#16a34a22", color: "#4ade80", border: "1px solid #16a34a44" }}
                  >
                    Done ✓
                  </button>
                  <button
                    onClick={() => handleMission("skip")}
                    className="flex-1 text-[10px] font-bold py-1 rounded-lg text-center"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    Skip
                  </button>
                </div>
              </>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-[60px]">
              <p className="text-[10px] text-white/30 text-center">No active goal.</p>
              <a href="/player/goal" className="text-[10px] text-[#f0b429] mt-1 font-semibold">Set a goal →</a>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Badges ribbon ──────────────────────────────────────────── */}
      {gam.newBadges && gam.newBadges.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Badges Earned</p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {gam.newBadges.map((badge) => {
              const meta = BADGE_META[badge] ?? { emoji: "🎖️", colour: "#6b7280" };
              return (
                <div
                  key={badge}
                  className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl"
                  style={{ background: meta.colour + "18", border: `1px solid ${meta.colour}33` }}
                >
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="text-[9px] font-bold whitespace-nowrap" style={{ color: meta.colour }}>{badge}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
