"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DrillScore {
  drillName: string;
  score: number;
  topStrength: string | null;
  avgSubScore?: number | null;
}

interface PhysicalAxis {
  code: string;
  label: string;
  percentile: number | null;
}

// Per-skill mechanic average (from /player/shooting, /player/dribbling, etc.)
interface SkillScore {
  skill: string;  // "shooting" | "passing" | "dribbling" | "first_touch" | "tackling" | "sprint"
  score: number;  // 0–10
}

// Coach skill rating
interface CoachRating {
  axis: string;   // "pace" | "dribbling" | "passing" | "shooting" | "defending" | "heading"
  score: number;  // 0–10
}

// Position fitness domain from /player/assessment
interface AssessmentDomain {
  code: string;   // "explosivePower" | "linearSpeed" | "balance" | "cognitiveSpeed" | "endurance" | "ballMastery"
  score: number;  // 0–100
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_F = 0.03; // null axes collapse near centre, not at dead-zero
const CX = 180, CY = 148, R = 100; // radar geometry — fits 343px card width

const PHYSICAL_DEFAULTS = [
  { code: "explosiveness_0_10m", label: "Explosiveness"        },
  { code: "top_end_speed",       label: "Top speed"            },
  { code: "change_of_direction", label: "Change of\ndirection" },
  { code: "vertical_leap",       label: "Vertical leap"        },
  { code: "functional_strength", label: "Strength"             },
  { code: "core_stability",      label: "Core\nstability"      },
  { code: "aerobic_endurance",   label: "Stamina"              },
];

const TECHNICAL_AXES = [
  { label: "First touch\n& control", matchPrefix: "First Touch"   },
  { label: "Rebound\nturn",          matchPrefix: "Rebound"       },
  { label: "Passing\naccuracy",      matchPrefix: "Passing"       },
  { label: "Shooting",               matchPrefix: "Shooting"      },
  { label: "Crossing",               matchPrefix: "Crossing"      },
  { label: "Free kick",              matchPrefix: "Free Kick"     },
  { label: "Heading",                matchPrefix: "Heading"       },
  { label: "Juggling",               matchPrefix: "Ball Juggling" },
  { label: "Throw-in",               matchPrefix: "Throw-In"      },
];

// Technique tab — one axis per skill page, keyed by drill_type string
const TECHNIQUE_AXES = [
  { code: "dribbling",   label: "Dribbling"    },
  { code: "first_touch", label: "First\ntouch" },
  { code: "passing",     label: "Passing"      },
  { code: "tackling",    label: "Tackling"     },
  { code: "shooting",    label: "Shooting"     },
  { code: "sprint",      label: "Sprint"       },
];

// Coached tab — standard football attributes rated by coach
const COACHED_AXES = [
  { code: "pace",      label: "Pace"      },
  { code: "dribbling", label: "Dribbling" },
  { code: "passing",   label: "Passing"   },
  { code: "shooting",  label: "Shooting"  },
  { code: "defending", label: "Defending" },
  { code: "heading",   label: "Heading"   },
];

// Position tab — DomainScores from /player/assessment
const POSITION_AXES = [
  { code: "explosivePower", label: "Explosive\npower" },
  { code: "linearSpeed",    label: "Linear\nspeed"    },
  { code: "balance",        label: "Balance"          },
  { code: "cognitiveSpeed", label: "Cognitive\nspeed" },
  { code: "endurance",      label: "Endurance"        },
  { code: "ballMastery",    label: "Ball\nmastery"    },
];

// Tab metadata
type TabId = "physical" | "technical" | "technique" | "coached" | "position";

const TAB_META: Record<TabId, { label: string; activeBg: string; activeText: string; sourceColor: string }> = {
  physical:  { label: "Physical",  activeBg: "#1a5c2a", activeText: "#c0dd97", sourceColor: "#c8962a" },
  technical: { label: "Technical", activeBg: "#854f0b", activeText: "#fac775", sourceColor: "#ef9f27" },
  technique: { label: "Technique", activeBg: "#2d1b5e", activeText: "#a78bfa", sourceColor: "#a78bfa" },
  coached:   { label: "Coached",   activeBg: "#0a3030", activeText: "#5eead4", sourceColor: "#14b8a6" },
  position:  { label: "Position",  activeBg: "#2e0a14", activeText: "#f87171", sourceColor: "#f87171" },
};

const POSITION_ABBR: Record<string, string> = {
  "goalkeeper": "GK", "striker": "ST", "centre forward": "CF",
  "centre-forward": "CF", "forward": "FW", "winger": "WG",
  "attacking midfielder": "AM", "central midfielder": "CM",
  "defensive midfielder": "DM", "midfielder": "MF",
  "centre back": "CB", "centre-back": "CB", "centreback": "CB",
  "right back": "RB", "left back": "LB", "right wing back": "RWB",
  "left wing back": "LWB", "defender": "DF",
  "right winger": "RW", "left winger": "LW",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function radarPt(i: number, r: number, N: number): [number, number] {
  const ang = -Math.PI / 2 + (i * 2 * Math.PI) / N;
  return [CX + r * Math.cos(ang), CY + r * Math.sin(ang)];
}

function getPosAbbr(pos: string): string {
  return POSITION_ABBR[pos.toLowerCase().trim()] ?? pos.slice(0, 2).toUpperCase();
}

function formatTrainedTime(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Radar SVG ────────────────────────────────────────────────────────────────

interface RadarAxis { label: string; value: number; } // 0–100; null already replaced by EMPTY_F*100
interface RadarCfg  { axes: RadarAxis[]; fill: string; stroke: string; dot: string; }

function RadarSVG({ cfg }: { cfg: RadarCfg }) {
  const { axes, fill, stroke, dot } = cfg;
  const N = axes.length;

  return (
    <svg viewBox="0 0 360 300" style={{ width: "100%", display: "block" }} role="img" aria-label="Radar chart">
      {/* 3 grid rings */}
      {[1, 2, 3].map(ring => {
        const r = R * ring / 3;
        const pts = Array.from({ length: N }, (_, i) => radarPt(i, r, N).join(",")).join(" ");
        return <polygon key={ring} points={pts} fill="none" stroke="#2a2a2a" strokeWidth={1} />;
      })}

      {/* Spokes */}
      {Array.from({ length: N }, (_, i) => {
        const [x2, y2] = radarPt(i, R, N);
        return <line key={i} x1={CX} y1={CY} x2={x2} y2={y2} stroke="#2a2a2a" strokeWidth={1} />;
      })}

      {/* Data polygon */}
      <polygon
        points={axes.map((a, i) => radarPt(i, R * a.value / 100, N).join(",")).join(" ")}
        fill={fill}
        fillOpacity={0.45}
        stroke={stroke}
        strokeWidth={2}
      />

      {/* Dots */}
      {axes.map((a, i) => {
        const [dx, dy] = radarPt(i, R * a.value / 100, N);
        return <circle key={i} cx={dx} cy={dy} r={3} fill={dot} />;
      })}

      {/* Axis labels — fontSize 9.5, fill #999, exact reference values */}
      {axes.map((a, i) => {
        const [lx, ly] = radarPt(i, R + 24, N);
        const lines = a.label.split("\n");
        const anchor: "middle" | "start" | "end" =
          Math.abs(lx - CX) < 5 ? "middle" : lx > CX ? "start" : "end";
        return (
          <text key={i} x={lx} textAnchor={anchor} fontSize={9.5} fill="#999">
            {lines.map((ln, li) => (
              <tspan key={li} x={lx} y={ly + li * 10 - (lines.length - 1) * 4.5}>{ln}</tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function PublicPassportTabs({
  drillScores,
  physicalAxes,
  playerName,
  position,
  xpTotal,
  dailyStreak,
  trainedMinutes,
  skillScores = [],
  coachRatings = [],
  assessmentDomains = [],
}: {
  drillScores: DrillScore[];
  physicalAxes: PhysicalAxis[];
  playerName?: string;
  position?: string;
  xpTotal?: number;
  dailyStreak?: number;
  trainedMinutes?: number;
  skillScores?: SkillScore[];
  coachRatings?: CoachRating[];
  assessmentDomains?: AssessmentDomain[];
}) {
  const [tab, setTab] = useState<TabId>("technical");

  const xp       = xpTotal ?? 0;
  const streak   = dailyStreak ?? 0;
  const trainMin = trainedMinutes ?? 0;
  const level    = Math.max(1, Math.floor(xp / 100) + 1);
  const initials = playerName
    ? playerName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const posAbbr = position ? getPosAbbr(position) : "–";

  // Physical — 7 axes, percentile 0–100 or EMPTY_F
  const physAxes: RadarAxis[] = PHYSICAL_DEFAULTS.map(def => {
    const found = physicalAxes.find(a => a.code === def.code);
    const p = found?.percentile;
    return { label: def.label, value: p != null ? Math.max(0, Math.min(100, p)) : EMPTY_F * 100 };
  });

  // Technical — 9 axes, avgSubScore 0–100 or EMPTY_F
  const techAxes: RadarAxis[] = TECHNICAL_AXES.map(ax => {
    const found = drillScores.find(d => d.drillName.startsWith(ax.matchPrefix));
    const v = (found?.avgSubScore != null && found.avgSubScore > 0) ? found.avgSubScore : null;
    return { label: ax.label, value: v !== null ? Math.max(0, Math.min(100, v)) : EMPTY_F * 100 };
  });

  // Technique — 6 axes, skill mechanic average 0–10 converted to 0–100
  const techniqueAxes: RadarAxis[] = TECHNIQUE_AXES.map(ax => {
    const found = skillScores.find(s => s.skill === ax.code);
    const v = found != null ? Math.max(0, Math.min(10, found.score)) * 10 : null;
    return { label: ax.label, value: v !== null ? v : EMPTY_F * 100 };
  });

  // Coached — 6 axes, coach rating 0–10 converted to 0–100
  const coachedAxes: RadarAxis[] = COACHED_AXES.map(ax => {
    const found = coachRatings.find(r => r.axis === ax.code);
    const v = found != null ? Math.max(0, Math.min(10, found.score)) * 10 : null;
    return { label: ax.label, value: v !== null ? v : EMPTY_F * 100 };
  });

  // Position — 6 axes, DomainScore 0–100 directly
  const positionAxes: RadarAxis[] = POSITION_AXES.map(ax => {
    const found = assessmentDomains.find(d => d.code === ax.code);
    const v = found != null ? Math.max(0, Math.min(100, found.score)) : null;
    return { label: ax.label, value: v !== null ? v : EMPTY_F * 100 };
  });

  const radarCfgs: Record<TabId, RadarCfg> = {
    physical:  { axes: physAxes,      fill: "#1a5c2a", stroke: "#97c459", dot: "#c0dd97" },
    technical: { axes: techAxes,      fill: "#854f0b", stroke: "#ef9f27", dot: "#fac775" },
    technique: { axes: techniqueAxes, fill: "#2d1b5e", stroke: "#a78bfa", dot: "#c4b5fd" },
    coached:   { axes: coachedAxes,   fill: "#0a3030", stroke: "#14b8a6", dot: "#5eead4" },
    position:  { axes: positionAxes,  fill: "#2e0a14", stroke: "#f87171", dot: "#fca5a5" },
  };

  const chartTitles: Record<TabId, string> = {
    physical:  "7 attributes",
    technical: "9 categories",
    technique: "6 skill areas",
    coached:   "6 attributes",
    position:  "6 domains",
  };

  const chartSources: Record<TabId, string> = {
    physical:  "EUROFIT-based measurement",
    technical: "Gemini-assessed from drill footage",
    technique: "AI mechanic breakdown — 6 skill pages",
    coached:   "Coach-verified ratings",
    position:  "Position fitness assessment",
  };

  const meta = TAB_META[tab];

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
      {/* Hide scrollbar on the tab row across all browsers */}
      <style>{`.grs-tab-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div style={{ width: 343, background: "#0e0e0e", borderRadius: 28, padding: 14, border: "1px solid #2a2a2a" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width={18} height={18} viewBox="0 0 24 24">
              <path d="M4 4h9v4H8v4h5v4H8v8H4z" fill="#c8962a" />
            </svg>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>GRS Player Passport</span>
          </div>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1={12} y1={2} x2={12} y2={15} />
          </svg>
        </div>

        {/* Identity strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 6px 14px" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            border: "2px solid #1a5c2a", background: "#173404",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#c0dd97", fontSize: 16, fontWeight: 500, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 500 }}>{playerName ?? "Player"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 12, color: "#888" }}>Zimbabwe</span>
              <span style={{ fontSize: 11, color: "#412402", background: "#c8962a", padding: "1px 7px", borderRadius: 10, fontWeight: 500 }}>
                {posAbbr}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0 6px 16px" }}>
          <div style={{ background: "#181818", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ color: "#c0dd97", fontSize: 17, fontWeight: 500 }}>{xp.toLocaleString()}</div>
            <div style={{ color: "#777", fontSize: 11, marginTop: 2 }}>Points</div>
          </div>
          <div style={{ background: "#181818", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ color: "#c8962a", fontSize: 17, fontWeight: 500 }}>{streak}</div>
            <div style={{ color: "#777", fontSize: 11, marginTop: 2 }}>Day streak</div>
          </div>
          <div style={{ background: "#181818", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 500 }}>{formatTrainedTime(trainMin)}</div>
            <div style={{ color: "#777", fontSize: 11, marginTop: 2 }}>Trained</div>
          </div>
        </div>

        {/* Chart section */}
        <div style={{ background: "#151515", borderRadius: 14, padding: "14px 12px 10px", margin: "0 4px" }}>

          {/* Tab pill row — horizontally scrollable, no visible scrollbar */}
          <div
            className="grs-tab-scroll"
            style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto", scrollbarWidth: "none" }}
          >
            {(Object.keys(TAB_META) as TabId[]).map(id => {
              const active = tab === id;
              const m = TAB_META[id];
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    flexShrink: 0,
                    border: "none",
                    borderRadius: 20,
                    padding: "5px 13px",
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: active ? m.activeBg : "#232323",
                    color: active ? m.activeText : "#888",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Chart title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{chartTitles[tab]}</span>
            <span style={{ fontSize: 11, color: "#173404", background: "#c0dd97", padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>
              Level {level}
            </span>
          </div>

          {/* Radar — driven by active tab */}
          <RadarSVG cfg={radarCfgs[tab]} />

          {/* Source line — fontSize 10 exact */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 0 6px", fontSize: 10, color: "#666" }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={meta.sourceColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3h6M10 3v5l-4 9h12l-4-9V3" />
            </svg>
            {chartSources[tab]}
          </div>
        </div>

        {/* Bottom nav */}
        <div style={{ display: "flex", justifyContent: "space-around", padding: "16px 0 4px", marginTop: 10, borderTop: "1px solid #232323" }}>
          {/* Home */}
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {/* Football */}
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={12} r={10} />
            <path d="M12 2c-1.5 3-2 6-2 10s.5 7 2 10M12 2c1.5 3 2 6 2 10s-.5 7-2 10M2 12h20" />
          </svg>
          {/* Calendar */}
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x={3} y={4} width={18} height={18} rx={2} /><line x1={16} y1={2} x2={16} y2={6} /><line x1={8} y1={2} x2={8} y2={6} /><line x1={3} y1={10} x2={21} y2={10} />
          </svg>
          {/* User — active (green) */}
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#c0dd97" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx={12} cy={7} r={4} />
          </svg>
        </div>

      </div>
    </div>
  );
}
