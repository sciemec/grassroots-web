"use client";

import type { ReactNode } from "react";

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

// ─── Radar geometry ───────────────────────────────────────────────────────────

const EMPTY_F = 0.03; // null axes collapse near centre, not at dead-zero

// Landscape viewBox keeps each radar compact in height (~229px rendered on mobile).
// The page is max-w-sm so content is always ≤ 352px wide; radars stack vertically
// (flex-direction: column in the row below) so each SVG fills the full content width.
// Scale at 343px: 343/300 = 1.143 → axis labels (fontSize=9) render as ~10.3px — legible.
// To add a 3rd or 4th radar: create the component and add another <RadarPanel> to the column.
const SVG_W = 300, SVG_H = 200, CX = 150, CY = 100, R = 74, LABEL_PAD = 16;
const GRID_RINGS = [0.33, 0.66, 1.0];

function toAngle(i: number, n: number) {
  return (i * 2 * Math.PI) / n - Math.PI / 2;
}

function pt(cx: number, cy: number, r: number, i: number, f: number, n: number) {
  const ang = toAngle(i, n);
  return { x: cx + r * f * Math.cos(ang), y: cy + r * f * Math.sin(ang) };
}

function buildPolygon(values: (number | null)[], cx: number, cy: number, r: number, n: number): string {
  return values
    .map((v, i) => {
      const f = v !== null ? Math.max(0, Math.min(100, v)) / 100 : EMPTY_F;
      const p = pt(cx, cy, r, i, f, n);
      return `${p.x},${p.y}`;
    })
    .join(" ");
}

function ringPts(cx: number, cy: number, r: number, f: number, n: number): string {
  return Array.from({ length: n }, (_, i) => {
    const p = pt(cx, cy, r, i, f, n);
    return `${p.x},${p.y}`;
  }).join(" ");
}

// ─── Physical DNA radar (7 axes, green) ───────────────────────────────────────

const PHYSICAL_DEFAULTS: PhysicalAxis[] = [
  { code: "explosiveness_0_10m", label: "Explosiveness",       percentile: null },
  { code: "top_end_speed",       label: "Top speed",           percentile: null },
  { code: "change_of_direction", label: "Change of direction", percentile: null },
  { code: "vertical_leap",       label: "Vertical leap",       percentile: null },
  { code: "functional_strength", label: "Strength",            percentile: null },
  { code: "core_stability",      label: "Core stability",      percentile: null },
  { code: "aerobic_endurance",   label: "Stamina",             percentile: null },
];

const PHYSICAL_LABELS: string[][] = [
  ["Explosiveness"],
  ["Top speed"],
  ["Change of", "direction"],
  ["Vertical leap"],
  ["Strength"],
  ["Core", "stability"],
  ["Stamina"],
];

function PhysicalRadar({ axes }: { axes: PhysicalAxis[] }) {
  const N = axes.length;
  const polygonPts = buildPolygon(axes.map((a) => a.percentile), CX, CY, R, N);

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: "100%", display: "block" }} aria-label="Physical DNA radar">
      {/* Grid rings */}
      {GRID_RINGS.map((f) => (
        <polygon key={f} points={ringPts(CX, CY, R, f, N)} fill="none" stroke="#2a2a2a" strokeWidth={0.8} />
      ))}
      {/* Spoke lines */}
      {axes.map((axis, i) => {
        const tip = pt(CX, CY, R, i, 1, N);
        return <line key={axis.code} x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke="#2a2a2a" strokeWidth={0.8} />;
      })}
      {/* Filled polygon */}
      <polygon points={polygonPts} fill="#1a5c2a" fillOpacity={0.45} stroke="#c0dd97" strokeWidth={1.5} strokeLinejoin="round" />
      {/* Dots */}
      {axes.map((axis, i) => {
        if (axis.percentile === null) {
          const p = pt(CX, CY, R, i, EMPTY_F, N);
          return <circle key={`e-${axis.code}`} cx={p.x} cy={p.y} r={2} fill="#2a2a2a" />;
        }
        const p = pt(CX, CY, R, i, Math.max(0, Math.min(100, axis.percentile)) / 100, N);
        return <circle key={`d-${axis.code}`} cx={p.x} cy={p.y} r={2.5} fill="#c0dd97" stroke="#0e0e0e" strokeWidth={0.8} />;
      })}
      {/* Labels */}
      {axes.map((axis, i) => {
        const ang = toAngle(i, N);
        const lx = CX + (R + LABEL_PAD) * Math.cos(ang);
        const ly = CY + (R + LABEL_PAD) * Math.sin(ang);
        const cosA = Math.cos(ang);
        const anchor = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";
        const lines = PHYSICAL_LABELS[i] ?? [axis.label];
        const lineH = 9;
        const startY = ly - ((lines.length - 1) * lineH) / 2;
        return (
          <text key={`l-${axis.code}`} textAnchor={anchor} fontSize={9} fontWeight={axis.percentile !== null ? 700 : 400}
            fill={axis.percentile !== null ? "#c0dd97" : "#3e3e3e"}>
            {lines.map((line, li) => (
              <tspan key={li} x={lx} y={startY + li * lineH}>{line}</tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Technical radar (9 axes, amber) ─────────────────────────────────────────

const TECHNICAL_AXES = [
  { labels: ["First touch", "& control"], matchPrefix: "First Touch"   },
  { labels: ["Rebound", "turn"],          matchPrefix: "Rebound"       },
  { labels: ["Passing", "accuracy"],      matchPrefix: "Passing"       },
  { labels: ["Shooting"],                 matchPrefix: "Shooting"      },
  { labels: ["Crossing"],                 matchPrefix: "Crossing"      },
  { labels: ["Free kick"],                matchPrefix: "Free Kick"     },
  { labels: ["Heading"],                  matchPrefix: "Heading"       },
  { labels: ["Juggling"],                 matchPrefix: "Ball Juggling" },
  { labels: ["Throw-in"],                 matchPrefix: "Throw-In"      },
];

function TechnicalRadar({ drillScores }: { drillScores: DrillScore[] }) {
  const N = TECHNICAL_AXES.length;
  const axes = TECHNICAL_AXES.map(({ labels, matchPrefix }) => {
    const found = drillScores.find((d) => d.drillName.startsWith(matchPrefix));
    return {
      labels,
      value: (found?.avgSubScore != null && found.avgSubScore > 0) ? found.avgSubScore : null,
    };
  });
  const polygonPts = buildPolygon(axes.map((a) => a.value), CX, CY, R, N);

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: "100%", display: "block" }} aria-label="Technical passport radar">
      {/* Grid rings */}
      {GRID_RINGS.map((f) => (
        <polygon key={f} points={ringPts(CX, CY, R, f, N)} fill="none" stroke="#2a2a2a" strokeWidth={0.8} />
      ))}
      {/* Spoke lines */}
      {axes.map((axis, i) => {
        const tip = pt(CX, CY, R, i, 1, N);
        return <line key={i} x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke="#2a2a2a" strokeWidth={0.8} />;
      })}
      {/* Filled polygon */}
      <polygon points={polygonPts} fill="#854f0b" fillOpacity={0.45} stroke="#fac775" strokeWidth={1.5} strokeLinejoin="round" />
      {/* Dots */}
      {axes.map((axis, i) => {
        if (axis.value === null) {
          const p = pt(CX, CY, R, i, EMPTY_F, N);
          return <circle key={`e-${i}`} cx={p.x} cy={p.y} r={2} fill="#2a2a2a" />;
        }
        const p = pt(CX, CY, R, i, Math.max(0, Math.min(100, axis.value)) / 100, N);
        return <circle key={`d-${i}`} cx={p.x} cy={p.y} r={2.5} fill="#fac775" stroke="#0e0e0e" strokeWidth={0.8} />;
      })}
      {/* Labels */}
      {axes.map((axis, i) => {
        const ang = toAngle(i, N);
        const lx = CX + (R + LABEL_PAD) * Math.cos(ang);
        const ly = CY + (R + LABEL_PAD) * Math.sin(ang);
        const cosA = Math.cos(ang);
        const anchor = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";
        const lines = axis.labels;
        const lineH = 9;
        const startY = ly - ((lines.length - 1) * lineH) / 2;
        return (
          <text key={`l-${i}`} textAnchor={anchor} fontSize={9} fontWeight={axis.value !== null ? 700 : 400}
            fill={axis.value !== null ? "#fac775" : "#4a3a2a"}>
            {lines.map((line, li) => (
              <tspan key={li} x={lx} y={startY + li * lineH}>{line}</tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}

// ─── RadarPanel — title + radar SVG + source badge ────────────────────────────
// Extensible: to add a 3rd or 4th radar (e.g. Coach Assessed, Personal Rating),
// create the radar SVG component and wrap it in another <RadarPanel> in the
// radar column below. The flex-direction: column layout handles any number of panels.

function RadarPanel({
  title,
  accentColor,
  sourceLine,
  children,
}: {
  title: string;
  accentColor: string;
  sourceLine: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <p style={{
        color: accentColor,
        fontSize: 9,
        fontWeight: 900,
        textTransform: "uppercase" as const,
        letterSpacing: "0.1em",
        margin: 0,
        textAlign: "center",
      }}>
        {title}
      </p>
      {children}
      <p style={{
        color: "#444",
        fontSize: 7.5,
        margin: 0,
        textAlign: "center",
        lineHeight: 1.4,
      }}>
        {sourceLine}
      </p>
    </div>
  );
}

// ─── Position abbreviation lookup ─────────────────────────────────────────────

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

function getPosAbbr(position: string): string {
  const key = position.toLowerCase().trim();
  if (POSITION_ABBR[key]) return POSITION_ABBR[key];
  return position.slice(0, 2).toUpperCase();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTrainedTime(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
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
  // Always 7 physical axes — merge backend data over defaults (null = no data)
  const resolvedAxes: PhysicalAxis[] = physicalAxes.length === 7
    ? physicalAxes
    : PHYSICAL_DEFAULTS.map((def) => {
        const found = physicalAxes.find((a) => a.code === def.code);
        return found ?? def;
      });

  const xp       = xpTotal ?? 0;
  const streak   = dailyStreak ?? 0;
  const trainMin = trainedMinutes ?? 0;
  const level    = Math.max(1, Math.floor(xp / 100) + 1);
  const initials = playerName
    ? playerName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const posAbbr = position ? getPosAbbr(position) : "–";

  return (
    <div style={{
      background: "#0e0e0e",
      borderRadius: 28,
      border: "1px solid #2a2a2a",
      overflow: "hidden",
      maxWidth: 440,
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="5" fill="#1a3404" />
            <text x="6" y="16" fontSize="12" fontWeight="900" fill="#c0dd97" fontFamily="monospace">F</text>
          </svg>
          <span style={{ color: "#c0dd97", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
            Player passport
          </span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </div>

      {/* Identity strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 14px" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          border: "2px solid #1a5c2a", background: "#173404",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#c0dd97", fontSize: 18, fontWeight: 800, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "#ffffff", fontSize: 14, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {playerName ?? "Player"}
          </p>
          <p style={{ color: "#888", fontSize: 10, margin: "1px 0 4px" }}>Zimbabwe</p>
          <span style={{
            background: "#c8962a", color: "#412402",
            fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20,
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            {posAbbr}
          </span>
        </div>
      </div>

      {/* 3-stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "#2a2a2a", margin: "0 12px 12px", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ background: "#181818", padding: "8px 6px", textAlign: "center" }}>
          <p style={{ color: "#c0dd97", fontSize: 15, fontWeight: 800, margin: 0 }}>{xp.toLocaleString()}</p>
          <p style={{ color: "#555", fontSize: 8, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Points</p>
        </div>
        <div style={{ background: "#181818", padding: "8px 6px", textAlign: "center" }}>
          <p style={{ color: "#c8962a", fontSize: 15, fontWeight: 800, margin: 0 }}>{streak}</p>
          <p style={{ color: "#555", fontSize: 8, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Day streak</p>
        </div>
        <div style={{ background: "#181818", padding: "8px 6px", textAlign: "center" }}>
          <p style={{ color: "#ffffff", fontSize: 15, fontWeight: 800, margin: 0 }}>{formatTrainedTime(trainMin)}</p>
          <p style={{ color: "#555", fontSize: 8, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trained</p>
        </div>
      </div>

      {/* Radar panel */}
      <div style={{ background: "#151515", borderRadius: 14, margin: "0 8px 8px", padding: "10px 8px 10px" }}>
        {/* LVL badge */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <span style={{
            background: "#c0dd97", color: "#0e1a04",
            fontSize: 8, fontWeight: 900, padding: "2px 8px", borderRadius: 20,
            letterSpacing: "0.06em",
          }}>
            LVL {level}
          </span>
        </div>

        {/* Radar column — Physical DNA above Technical, independent empty-states */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <RadarPanel
            title="Physical DNA"
            accentColor="#c0dd97"
            sourceLine="EUROFIT percentile · Zimbabwe peers · centre = no data"
          >
            <PhysicalRadar axes={resolvedAxes} />
          </RadarPanel>

          <RadarPanel
            title="Technical"
            accentColor="#fac775"
            sourceLine="Gemini-assessed from drill footage · centre = no data"
          >
            <TechnicalRadar drillScores={drillScores} />
          </RadarPanel>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        display: "flex", justifyContent: "space-around", alignItems: "center",
        borderTop: "1px solid #232323", padding: "12px 0",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0dd97" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 00-6.88 2.77L9 9l3-7zm0 0a10 10 0 016.88 2.77L15 9l-3-7zM2 12h7l-2-4m15 4h-7l2-4M5.12 19.23L9 15l-4 1.5m13.88 2.73L15 15l4 1.5M9 15l3 7m0 0l3-7" />
        </svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    </div>
  );
}
