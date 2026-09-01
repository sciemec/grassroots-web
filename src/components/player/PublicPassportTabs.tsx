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

// ─── Radar geometry ───────────────────────────────────────────────────────────

const EMPTY_F = 0.03;

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
  { code: "sprint_10m",          label: "Explosiveness",      percentile: null },
  { code: "sprint_30m",          label: "Top speed",          percentile: null },
  { code: "505_agility_seconds", label: "Change of direction",percentile: null },
  { code: "vertical_jump",       label: "Vertical leap",      percentile: null },
  { code: "functional_strength", label: "Strength",           percentile: null },
  { code: "lateral_shuffle_5m",  label: "Core stability",     percentile: null },
  { code: "recovery_heart_rate", label: "Stamina",            percentile: null },
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
  const CX = 145, CY = 135, R = 92, W = 290, H = 290;
  const LABEL_PAD = 18;
  const gridRings = [0.33, 0.66, 1.0];

  const values = axes.map((a) => a.percentile);
  const polygonPts = buildPolygon(values, CX, CY, R, N);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} aria-label="Physical DNA radar">
      {/* Grid rings */}
      {gridRings.map((f) => (
        <polygon key={f} points={ringPts(CX, CY, R, f, N)} fill="none" stroke="#2a2a2a" strokeWidth={1} />
      ))}

      {/* Spoke lines */}
      {axes.map((axis, i) => {
        const tip = pt(CX, CY, R, i, 1, N);
        return <line key={axis.code} x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke="#2a2a2a" strokeWidth={1} />;
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
        return <circle key={`d-${axis.code}`} cx={p.x} cy={p.y} r={3} fill="#c0dd97" stroke="#0e0e0e" strokeWidth={1} />;
      })}

      {/* Multi-line labels */}
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
          <text key={`l-${axis.code}`} textAnchor={anchor} fontSize={8} fontWeight={axis.percentile !== null ? 700 : 400}
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
  const CX = 145, CY = 135, R = 92, W = 290, H = 290;
  const LABEL_PAD = 18;
  const gridRings = [0.33, 0.66, 1.0];

  const axes = TECHNICAL_AXES.map(({ labels, matchPrefix }) => {
    const found = drillScores.find((d) => d.drillName.startsWith(matchPrefix));
    return {
      labels,
      value: (found?.avgSubScore != null && found.avgSubScore > 0) ? found.avgSubScore : null,
    };
  });

  const polygonPts = buildPolygon(axes.map((a) => a.value), CX, CY, R, N);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} aria-label="Technical passport radar">
      {/* Grid rings */}
      {gridRings.map((f) => (
        <polygon key={f} points={ringPts(CX, CY, R, f, N)} fill="none" stroke="#2a2a2a" strokeWidth={1} />
      ))}

      {/* Spoke lines */}
      {axes.map((axis, i) => {
        const tip = pt(CX, CY, R, i, 1, N);
        return <line key={i} x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke="#2a2a2a" strokeWidth={1} />;
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
        return <circle key={`d-${i}`} cx={p.x} cy={p.y} r={3} fill="#fac775" stroke="#0e0e0e" strokeWidth={1} />;
      })}

      {/* Multi-line labels */}
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
          <text key={`l-${i}`} textAnchor={anchor} fontSize={8} fontWeight={axis.value !== null ? 700 : 400}
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
  // fallback: first 2 chars uppercase
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
  const [tab, setTab] = useState<"physical" | "technical">("physical");

  // Always 7 physical axes — fill with null if backend returned empty array
  const resolvedAxes: PhysicalAxis[] = physicalAxes.length === 7
    ? physicalAxes
    : PHYSICAL_DEFAULTS.map((def) => {
        const found = physicalAxes.find((a) => a.code === def.code);
        return found ?? def;
      });

  const hasPhysical = resolvedAxes.some((a) => a.percentile !== null);
  const hasTechnical = drillScores.length > 0;
  const activeTab = !hasPhysical && hasTechnical ? "technical" : tab;

  const xp = xpTotal ?? 0;
  const streak = dailyStreak ?? 0;
  const trainMin = trainedMinutes ?? 0;
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const initials = playerName
    ? playerName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const posAbbr = position ? getPosAbbr(position) : "–";
  const axisCount = activeTab === "physical" ? resolvedAxes.length : TECHNICAL_AXES.length;

  return (
    <div style={{
      background: "#0e0e0e",
      borderRadius: 28,
      border: "1px solid #2a2a2a",
      overflow: "hidden",
      maxWidth: 320,
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Passport "F" icon */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="5" fill="#1a3404" />
            <text x="6" y="16" fontSize="12" fontWeight="900" fill="#c0dd97" fontFamily="monospace">F</text>
          </svg>
          <span style={{ color: "#c0dd97", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
            Player passport
          </span>
        </div>
        {/* Share icon */}
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

      {/* Inner radar card */}
      <div style={{ background: "#151515", borderRadius: 14, margin: "0 8px 8px", padding: "12px 10px 10px" }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Tab buttons */}
            {hasPhysical && hasTechnical ? (
              <div style={{ display: "flex", gap: 1, background: "#2a2a2a", borderRadius: 8, padding: 2 }}>
                <button onClick={() => setTab("physical")} style={{
                  padding: "5px 9px", border: "none", cursor: "pointer", borderRadius: 6,
                  background: activeTab === "physical" ? "#1a5c2a" : "transparent",
                  color: activeTab === "physical" ? "#c0dd97" : "#555",
                  fontSize: 9, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.06em",
                }}>
                  Physical DNA
                </button>
                <button onClick={() => setTab("technical")} style={{
                  padding: "5px 9px", border: "none", cursor: "pointer", borderRadius: 6,
                  background: activeTab === "technical" ? "#854f0b" : "transparent",
                  color: activeTab === "technical" ? "#fac775" : "#555",
                  fontSize: 9, fontWeight: 800, textTransform: "uppercase" as const, letterSpacing: "0.06em",
                }}>
                  Technical
                </button>
              </div>
            ) : (
              <span style={{ color: "#c8962a", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {activeTab === "physical" ? "Physical DNA" : "Technical"}
              </span>
            )}
            <span style={{ color: "#555", fontSize: 9 }}>{axisCount} axes</span>
          </div>
          {/* Level badge */}
          <span style={{
            background: "#c0dd97", color: "#0e1a04",
            fontSize: 8, fontWeight: 900, padding: "2px 8px", borderRadius: 20,
            letterSpacing: "0.06em",
          }}>
            LVL {level}
          </span>
        </div>

        {/* Radar */}
        {activeTab === "physical"
          ? <PhysicalRadar axes={resolvedAxes} />
          : <TechnicalRadar drillScores={drillScores} />
        }

        {/* Source row */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
          {/* Flask icon */}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3h6M9 3v7l-4.5 9a1 1 0 00.9 1.5h13.2a1 1 0 00.9-1.5L15 10V3" />
          </svg>
          <span style={{ color: "#444", fontSize: 8 }}>
            {activeTab === "physical"
              ? "EUROFIT percentile · Zimbabwe peers · centre = no data"
              : "Gemini-assessed from drill footage · centre = no data"}
          </span>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        display: "flex", justifyContent: "space-around", alignItems: "center",
        borderTop: "1px solid #232323", padding: "12px 0",
      }}>
        {/* Home */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        {/* Football */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0dd97" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 00-6.88 2.77L9 9l3-7zm0 0a10 10 0 016.88 2.77L15 9l-3-7zM2 12h7l-2-4m15 4h-7l2-4M5.12 19.23L9 15l-4 1.5m13.88 2.73L15 15l4 1.5M9 15l3 7m0 0l3-7" />
        </svg>
        {/* Calendar */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {/* User */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    </div>
  );
}
