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

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_F = 0.03; // null axes collapse near centre, not at dead-zero
const CX = 180, CY = 148, R = 100; // radar geometry — fits 343px card width

// Display labels include \n for multi-line SVG tspan rendering
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
}: {
  drillScores: DrillScore[];
  physicalAxes: PhysicalAxis[];
  playerName?: string;
  position?: string;
  xpTotal?: number;
  dailyStreak?: number;
  trainedMinutes?: number;
}) {
  // Technical tab active by default — matches reference render('skills') initial state
  const [tab, setTab] = useState<"physical" | "technical">("technical");
  const isPhysical = tab === "physical";

  const xp       = xpTotal ?? 0;
  const streak   = dailyStreak ?? 0;
  const trainMin = trainedMinutes ?? 0;
  const level    = Math.max(1, Math.floor(xp / 100) + 1);
  const initials = playerName
    ? playerName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const posAbbr = position ? getPosAbbr(position) : "–";

  // Physical: always 7 axes; use PHYSICAL_DEFAULTS labels (which include \n);
  // percentile from API if present, else EMPTY_F*100
  const physAxes: RadarAxis[] = PHYSICAL_DEFAULTS.map(def => {
    const found = physicalAxes.find(a => a.code === def.code);
    const p = found?.percentile;
    return {
      label: def.label,
      value: p != null ? Math.max(0, Math.min(100, p)) : EMPTY_F * 100,
    };
  });

  // Technical: 9 axes matched by drillName prefix; avgSubScore (0–100) or EMPTY_F*100
  const techAxes: RadarAxis[] = TECHNICAL_AXES.map(ax => {
    const found = drillScores.find(d => d.drillName.startsWith(ax.matchPrefix));
    const v = (found?.avgSubScore != null && found.avgSubScore > 0) ? found.avgSubScore : null;
    return {
      label: ax.label,
      value: v !== null ? Math.max(0, Math.min(100, v)) : EMPTY_F * 100,
    };
  });

  const physCfg: RadarCfg = { axes: physAxes, fill: "#1a5c2a", stroke: "#97c459", dot: "#c0dd97" };
  const techCfg: RadarCfg = { axes: techAxes, fill: "#854f0b", stroke: "#ef9f27", dot: "#fac775" };

  const chartTitle  = isPhysical ? "7 attributes" : "9 categories";
  const chartSource = isPhysical ? "EUROFIT-based measurement" : "Gemini-assessed from drill footage";
  const sourceColor = isPhysical ? "#c8962a" : "#ef9f27";

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
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

          {/* Tab buttons */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <button
              onClick={() => setTab("physical")}
              style={{
                flex: 1, border: "none", borderRadius: 8, padding: "6px 0",
                fontSize: 12, fontWeight: 500, cursor: "pointer",
                background: isPhysical ? "#1a5c2a" : "#232323",
                color: isPhysical ? "#c0dd97" : "#999",
              }}
            >
              Physical DNA
            </button>
            <button
              onClick={() => setTab("technical")}
              style={{
                flex: 1, border: "none", borderRadius: 8, padding: "6px 0",
                fontSize: 12, fontWeight: 500, cursor: "pointer",
                background: !isPhysical ? "#854f0b" : "#232323",
                color: !isPhysical ? "#fac775" : "#999",
              }}
            >
              Technical
            </button>
          </div>

          {/* Chart title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{chartTitle}</span>
            <span style={{ fontSize: 11, color: "#173404", background: "#c0dd97", padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>
              Level {level}
            </span>
          </div>

          {/* Single radar — toggled by tab state */}
          <RadarSVG cfg={isPhysical ? physCfg : techCfg} />

          {/* Source line — fontSize 10 exact */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 0 6px", fontSize: 10, color: "#666" }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={sourceColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3h6M10 3v5l-4 9h12l-4-9V3" />
            </svg>
            {chartSource}
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
