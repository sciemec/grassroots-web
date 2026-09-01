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

function buildPolygon(
  values: (number | null)[],
  cx: number,
  cy: number,
  r: number,
  n: number,
): string {
  return values
    .map((v, i) => {
      const f = v !== null ? Math.max(0, Math.min(100, v)) / 100 : EMPTY_F;
      const p = pt(cx, cy, r, i, f, n);
      return `${p.x},${p.y}`;
    })
    .join(" ");
}

// ─── Physical DNA radar (7 axes, green) ───────────────────────────────────────

function PhysicalRadar({ axes }: { axes: PhysicalAxis[] }) {
  const N = axes.length;
  const CX = 140, CY = 125, R = 88, W = 280, H = 260;
  const LABEL_PAD = 20;
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  const values = axes.map((a) => a.percentile);
  const polygonPts = buildPolygon(values, CX, CY, R, N);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} aria-label="Physical DNA radar">
      {gridRings.map((f) => (
        <polygon key={f}
          points={Array.from({ length: N }, (_, i) => { const p = pt(CX, CY, R, i, f, N); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke="#1a3d26" strokeWidth={f === 1.0 ? 1.5 : 1}
        />
      ))}

      {axes.map((axis, i) => {
        const tip = pt(CX, CY, R, i, 1, N);
        return (
          <line key={axis.code} x1={CX} y1={CY} x2={tip.x} y2={tip.y}
            stroke={axis.percentile !== null ? "#2e5a2e" : "#1a2a1a"}
            strokeWidth={1} strokeDasharray={axis.percentile !== null ? undefined : "4 3"}
          />
        );
      })}

      <polygon points={polygonPts} fill="#1a5c2a" fillOpacity={0.5} stroke="#c0dd97" strokeWidth={2} strokeLinejoin="round" />

      {axes.map((axis, i) => {
        if (axis.percentile === null) {
          const p = pt(CX, CY, R, i, EMPTY_F, N);
          return <circle key={`e-${axis.code}`} cx={p.x} cy={p.y} r={2} fill="#2a2a2a" />;
        }
        const p = pt(CX, CY, R, i, Math.max(0, Math.min(100, axis.percentile)) / 100, N);
        return <circle key={`d-${axis.code}`} cx={p.x} cy={p.y} r={4} fill="#c0dd97" stroke="#0e0e0e" strokeWidth={1.5} />;
      })}

      {axes.map((axis, i) => {
        const ang = toAngle(i, N);
        const lx = CX + (R + LABEL_PAD) * Math.cos(ang);
        const ly = CY + (R + LABEL_PAD) * Math.sin(ang);
        const cosA = Math.cos(ang);
        const anchor = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";
        return (
          <text key={`l-${axis.code}`} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
            fontSize={8} fontWeight={axis.percentile !== null ? 700 : 400}
            fill={axis.percentile !== null ? "#c0dd97" : "#3e3e3e"}>
            {axis.label}
          </text>
        );
      })}

      {axes.map((axis, i) => {
        if (axis.percentile === null) return null;
        const ang = toAngle(i, N);
        const f = Math.max(0.08, Math.min(100, axis.percentile)) / 100;
        const nudgeF = f > 0.18 ? f - 0.14 : f + 0.16;
        const p = pt(CX, CY, R, i, Math.max(0.08, nudgeF), N);
        const cosA = Math.cos(ang);
        const anchor = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";
        return (
          <text key={`v-${axis.code}`} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle"
            fontSize={7} fontWeight={700} fill="#6abf60">
            {Math.round(axis.percentile)}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Technical radar (9 axes, amber) ─────────────────────────────────────────

const TECHNICAL_AXES = [
  { label: "First Touch",  matchPrefix: "First Touch"  },
  { label: "Turn&Strike",  matchPrefix: "Rebound"      },
  { label: "Passing",      matchPrefix: "Passing"      },
  { label: "Shooting",     matchPrefix: "Shooting"     },
  { label: "Crossing",     matchPrefix: "Crossing"     },
  { label: "Free Kick",    matchPrefix: "Free Kick"    },
  { label: "Heading",      matchPrefix: "Heading"      },
  { label: "Juggling",     matchPrefix: "Ball Juggling"},
  { label: "Throw-In",     matchPrefix: "Throw-In"     },
];

function TechnicalRadar({ drillScores }: { drillScores: DrillScore[] }) {
  const N = TECHNICAL_AXES.length;
  const CX = 140, CY = 125, R = 88, W = 280, H = 260;
  const LABEL_PAD = 20;
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  const axes = TECHNICAL_AXES.map(({ label, matchPrefix }) => {
    const found = drillScores.find((d) => d.drillName.startsWith(matchPrefix));
    return {
      label,
      value: (found?.avgSubScore != null && found.avgSubScore > 0) ? found.avgSubScore : null,
    };
  });

  const polygonPts = buildPolygon(axes.map((a) => a.value), CX, CY, R, N);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} aria-label="Technical passport radar">
      {gridRings.map((f) => (
        <polygon key={f}
          points={Array.from({ length: N }, (_, i) => { const p = pt(CX, CY, R, i, f, N); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke="#2a1a0a" strokeWidth={f === 1.0 ? 1.5 : 1}
        />
      ))}

      {axes.map((axis, i) => {
        const tip = pt(CX, CY, R, i, 1, N);
        return (
          <line key={axis.label} x1={CX} y1={CY} x2={tip.x} y2={tip.y}
            stroke={axis.value !== null ? "#5a3a1a" : "#2a1a0a"}
            strokeWidth={1} strokeDasharray={axis.value !== null ? undefined : "4 3"}
          />
        );
      })}

      <polygon points={polygonPts} fill="#854f0b" fillOpacity={0.4} stroke="#fac775" strokeWidth={2} strokeLinejoin="round" />

      {axes.map((axis, i) => {
        if (axis.value === null) {
          const p = pt(CX, CY, R, i, EMPTY_F, N);
          return <circle key={`e-${axis.label}`} cx={p.x} cy={p.y} r={2} fill="#3a2a1a" />;
        }
        const p = pt(CX, CY, R, i, Math.max(0, Math.min(100, axis.value)) / 100, N);
        return <circle key={`d-${axis.label}`} cx={p.x} cy={p.y} r={4} fill="#fac775" stroke="#0e0e0e" strokeWidth={1.5} />;
      })}

      {axes.map((axis, i) => {
        const ang = toAngle(i, N);
        const lx = CX + (R + LABEL_PAD) * Math.cos(ang);
        const ly = CY + (R + LABEL_PAD) * Math.sin(ang);
        const cosA = Math.cos(ang);
        const anchor = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";
        return (
          <text key={`l-${axis.label}`} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
            fontSize={8} fontWeight={axis.value !== null ? 700 : 400}
            fill={axis.value !== null ? "#fac775" : "#4a3a2a"}>
            {axis.label}
          </text>
        );
      })}

      {axes.map((axis, i) => {
        if (axis.value === null) return null;
        const ang = toAngle(i, N);
        const f = Math.max(0.08, Math.min(100, axis.value)) / 100;
        const nudgeF = f > 0.18 ? f - 0.14 : f + 0.16;
        const p = pt(CX, CY, R, i, Math.max(0.08, nudgeF), N);
        const cosA = Math.cos(ang);
        const anchor = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";
        return (
          <text key={`v-${axis.label}`} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle"
            fontSize={7} fontWeight={700} fill="#f5a623">
            {Math.round(axis.value)}
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
}: {
  drillScores: DrillScore[];
  physicalAxes: PhysicalAxis[];
}) {
  const [tab, setTab] = useState<"physical" | "technical">("physical");

  const hasPhysical = physicalAxes.some((a) => a.percentile !== null);
  const hasTechnical = drillScores.length > 0;

  // If only one side has data, lock to that tab
  const activeTab = !hasPhysical && hasTechnical ? "technical" : !hasTechnical && hasPhysical ? "physical" : tab;

  return (
    <div style={{ background: "#151515", border: "1px solid #2a2a2a", borderRadius: 16, padding: "16px 12px 12px" }}>
      {/* Header */}
      <p style={{ color: "#c8962a", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
        Technical Passport
      </p>

      {/* Tab buttons — only show if both sides exist */}
      {hasPhysical && hasTechnical && (
        <div style={{ display: "flex", gap: 1, marginBottom: 12, background: "#2a2a2a", borderRadius: 10, padding: 2 }}>
          <button
            onClick={() => setTab("physical")}
            style={{
              flex: 1, padding: "7px 8px", border: "none", cursor: "pointer", borderRadius: 8,
              background: activeTab === "physical" ? "#1a5c2a" : "transparent",
              color: activeTab === "physical" ? "#c0dd97" : "#666",
              fontSize: 10, fontWeight: activeTab === "physical" ? 800 : 500,
              textTransform: "uppercase", letterSpacing: "0.06em", transition: "all 0.15s",
            }}
          >
            Physical DNA
          </button>
          <button
            onClick={() => setTab("technical")}
            style={{
              flex: 1, padding: "7px 8px", border: "none", cursor: "pointer", borderRadius: 8,
              background: activeTab === "technical" ? "#854f0b" : "transparent",
              color: activeTab === "technical" ? "#fac775" : "#666",
              fontSize: 10, fontWeight: activeTab === "technical" ? 800 : 500,
              textTransform: "uppercase", letterSpacing: "0.06em", transition: "all 0.15s",
            }}
          >
            Technical
          </button>
        </div>
      )}

      {/* Radar */}
      {activeTab === "physical" ? (
        <PhysicalRadar axes={physicalAxes} />
      ) : (
        <TechnicalRadar drillScores={drillScores} />
      )}

      {/* Footer legend */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px solid #1e1e1e" }}>
        <p style={{ color: "#3c3c3c", fontSize: 9 }}>
          {activeTab === "physical"
            ? "EUROFIT-based measurement · percentile vs Zimbabwe peers"
            : "Gemini-assessed from drill footage"}
        </p>
        {((activeTab === "physical" && physicalAxes.some((a) => a.percentile === null)) ||
          (activeTab === "technical" && drillScores.length < 9)) && (
          <p style={{ color: "#3c3c3c", fontSize: 9 }}>· = not yet attempted</p>
        )}
      </div>
    </div>
  );
}
