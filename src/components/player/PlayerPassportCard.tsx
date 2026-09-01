"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhysicalAxis {
  code: string;
  label: string;
  percentile: number | null;
}

interface TechnicalAxis {
  label: string;
  avgSubScore: number | null;
}

interface PassportData {
  physical: PhysicalAxis[];
  technical: TechnicalAxis[];
  xp_total: number;
  daily_streak: number;
  trained_minutes: number;
}

// ─── Empty fallback axes (shown before data loads / on error) ─────────────────

const EMPTY_PHYSICAL: PhysicalAxis[] = [
  { code: "sprint_10m",           label: "Explosiveness",       percentile: null },
  { code: "sprint_30m",           label: "Top speed",           percentile: null },
  { code: "505_agility_seconds",  label: "Change of direction", percentile: null },
  { code: "vertical_jump",        label: "Vertical leap",       percentile: null },
  { code: "functional_strength",  label: "Strength",            percentile: null },
  { code: "lateral_shuffle_5m",   label: "Core stability",      percentile: null },
  { code: "recovery_heart_rate",  label: "Stamina",             percentile: null },
];

const EMPTY_TECHNICAL: TechnicalAxis[] = [
  { label: "First Touch",  avgSubScore: null },
  { label: "Turn&Strike",  avgSubScore: null },
  { label: "Passing",      avgSubScore: null },
  { label: "Shooting",     avgSubScore: null },
  { label: "Crossing",     avgSubScore: null },
  { label: "Free Kick",    avgSubScore: null },
  { label: "Heading",      avgSubScore: null },
  { label: "Juggling",     avgSubScore: null },
  { label: "Throw-In",     avgSubScore: null },
];

// ─── Radar helpers ────────────────────────────────────────────────────────────

const EMPTY_F = 0.03; // axes with no data sit just off-center

function toAngle(i: number, n: number) {
  return (i * 2 * Math.PI) / n - Math.PI / 2;
}

function pt(cx: number, cy: number, r: number, i: number, f: number, n: number) {
  const ang = toAngle(i, n);
  return { x: cx + r * f * Math.cos(ang), y: cy + r * f * Math.sin(ang) };
}

function buildPolygon(
  axes: { value: number | null }[],
  cx: number,
  cy: number,
  r: number,
): string {
  const n = axes.length;
  return axes
    .map((a, i) => {
      const f = a.value !== null ? Math.max(0, Math.min(100, a.value)) / 100 : EMPTY_F;
      const p = pt(cx, cy, r, i, f, n);
      return `${p.x},${p.y}`;
    })
    .join(" ");
}

// ─── PhysicalRadar ────────────────────────────────────────────────────────────

function PhysicalRadar({ axes }: { axes: PhysicalAxis[] }) {
  const N = axes.length;
  const CX = 140, CY = 130, R = 90, W = 280, H = 270;
  const LABEL_PAD = 20;
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  const mapped = axes.map((a) => ({ ...a, value: a.percentile }));
  const polygonPts = buildPolygon(mapped, CX, CY, R);
  const available = mapped.filter((a) => a.value !== null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} aria-label="Physical DNA radar">
      {/* Grid rings */}
      {gridRings.map((f) => (
        <polygon
          key={f}
          points={Array.from({ length: N }, (_, i) => {
            const p = pt(CX, CY, R, i, f, N);
            return `${p.x},${p.y}`;
          }).join(" ")}
          fill="none"
          stroke="#1a3d26"
          strokeWidth={f === 1.0 ? 1.5 : 1}
        />
      ))}

      {/* Spokes */}
      {mapped.map((axis, i) => {
        const tip = pt(CX, CY, R, i, 1, N);
        return (
          <line key={axis.label} x1={CX} y1={CY} x2={tip.x} y2={tip.y}
            stroke={axis.value !== null ? "#2e5a2e" : "#1a2a1a"}
            strokeWidth={1}
            strokeDasharray={axis.value !== null ? undefined : "4 3"}
          />
        );
      })}

      {/* Filled polygon */}
      <polygon points={polygonPts} fill="#1a5c2a" fillOpacity={0.5} stroke="#c0dd97" strokeWidth={2} strokeLinejoin="round" />

      {/* Dots */}
      {available.map((a, idx) => {
        const p = pt(CX, CY, R, axes.findIndex((x) => x.label === a.label), Math.max(0, Math.min(100, a.value!)) / 100, N);
        return <circle key={`dot-${idx}`} cx={p.x} cy={p.y} r={4} fill="#c0dd97" stroke="#0e0e0e" strokeWidth={1.5} />;
      })}

      {/* Empty dots */}
      {mapped.filter((a) => a.value === null).map((a, idx) => {
        const p = pt(CX, CY, R, axes.findIndex((x) => x.label === a.label), EMPTY_F, N);
        return <circle key={`empty-${idx}`} cx={p.x} cy={p.y} r={2} fill="#2a2a2a" />;
      })}

      {/* Labels */}
      {mapped.map((axis, i) => {
        const ang = toAngle(i, N);
        const lx = CX + (R + LABEL_PAD) * Math.cos(ang);
        const ly = CY + (R + LABEL_PAD) * Math.sin(ang);
        const cosA = Math.cos(ang);
        const anchor = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";
        return (
          <text key={`lbl-${i}`} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
            fontSize={8} fontWeight={axis.value !== null ? 700 : 400}
            fill={axis.value !== null ? "#c0dd97" : "#3e3e3e"}>
            {axis.label}
          </text>
        );
      })}

      {/* Score labels */}
      {available.map((a) => {
        const i = axes.findIndex((x) => x.label === a.label);
        const ang = toAngle(i, N);
        const f = Math.max(0.08, Math.min(100, a.value!)) / 100;
        const nudgeF = f > 0.18 ? f - 0.14 : f + 0.16;
        const p = pt(CX, CY, R, i, Math.max(0.08, nudgeF), N);
        const cosA = Math.cos(ang);
        const anchor = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";
        return (
          <text key={`val-${a.label}`} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle"
            fontSize={7} fontWeight={700} fill="#6abf60">
            {Math.round(a.value!)}
          </text>
        );
      })}
    </svg>
  );
}

// ─── TechnicalRadar ───────────────────────────────────────────────────────────

function TechnicalRadar({ axes }: { axes: TechnicalAxis[] }) {
  const N = axes.length;
  const CX = 140, CY = 130, R = 90, W = 280, H = 270;
  const LABEL_PAD = 20;
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  const mapped = axes.map((a) => ({ ...a, value: a.avgSubScore }));
  const polygonPts = buildPolygon(mapped, CX, CY, R);
  const available = mapped.filter((a) => a.value !== null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} aria-label="Technical passport radar">
      {/* Grid rings */}
      {gridRings.map((f) => (
        <polygon
          key={f}
          points={Array.from({ length: N }, (_, i) => {
            const p = pt(CX, CY, R, i, f, N);
            return `${p.x},${p.y}`;
          }).join(" ")}
          fill="none"
          stroke="#2a1a0a"
          strokeWidth={f === 1.0 ? 1.5 : 1}
        />
      ))}

      {/* Spokes */}
      {mapped.map((axis, i) => {
        const tip = pt(CX, CY, R, i, 1, N);
        return (
          <line key={axis.label} x1={CX} y1={CY} x2={tip.x} y2={tip.y}
            stroke={axis.value !== null ? "#5a3a1a" : "#2a1a0a"}
            strokeWidth={1}
            strokeDasharray={axis.value !== null ? undefined : "4 3"}
          />
        );
      })}

      {/* Filled polygon */}
      <polygon points={polygonPts} fill="#854f0b" fillOpacity={0.4} stroke="#fac775" strokeWidth={2} strokeLinejoin="round" />

      {/* Dots */}
      {available.map((a, idx) => {
        const p = pt(CX, CY, R, axes.findIndex((x) => x.label === a.label), Math.max(0, Math.min(100, a.value!)) / 100, N);
        return <circle key={`dot-${idx}`} cx={p.x} cy={p.y} r={4} fill="#fac775" stroke="#0e0e0e" strokeWidth={1.5} />;
      })}

      {/* Empty dots */}
      {mapped.filter((a) => a.value === null).map((a, idx) => {
        const p = pt(CX, CY, R, axes.findIndex((x) => x.label === a.label), EMPTY_F, N);
        return <circle key={`empty-${idx}`} cx={p.x} cy={p.y} r={2} fill="#3a2a1a" />;
      })}

      {/* Labels */}
      {mapped.map((axis, i) => {
        const ang = toAngle(i, N);
        const lx = CX + (R + LABEL_PAD) * Math.cos(ang);
        const ly = CY + (R + LABEL_PAD) * Math.sin(ang);
        const cosA = Math.cos(ang);
        const anchor = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";
        return (
          <text key={`lbl-${i}`} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
            fontSize={8} fontWeight={axis.value !== null ? 700 : 400}
            fill={axis.value !== null ? "#fac775" : "#4a3a2a"}>
            {axis.label}
          </text>
        );
      })}

      {/* Score labels */}
      {available.map((a) => {
        const i = axes.findIndex((x) => x.label === a.label);
        const ang = toAngle(i, N);
        const f = Math.max(0.08, Math.min(100, a.value!)) / 100;
        const nudgeF = f > 0.18 ? f - 0.14 : f + 0.16;
        const p = pt(CX, CY, R, i, Math.max(0.08, nudgeF), N);
        const cosA = Math.cos(ang);
        const anchor = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";
        return (
          <text key={`val-${a.label}`} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle"
            fontSize={7} fontWeight={700} fill="#f5a623">
            {Math.round(a.value!)}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlayerPassportCard({ playerName }: { playerName?: string }) {
  const [tab, setTab] = useState<"physical" | "technical">("physical");
  const [data, setData] = useState<PassportData | null>(null);

  useEffect(() => {
    api
      .get("/player/passport-data")
      .then((res) => setData(res.data))
      .catch(() => {
        // fallback — card renders with empty axes
      });
  }, []);

  const physical  = data?.physical  ?? EMPTY_PHYSICAL;
  const technical = data?.technical ?? EMPTY_TECHNICAL;
  const xp        = data?.xp_total       ?? 0;
  const streak    = data?.daily_streak   ?? 0;
  const minutes   = data?.trained_minutes ?? 0;

  const trainedHours = Math.floor(minutes / 60);
  const trainedLabel = trainedHours >= 1 ? `${trainedHours}h` : `${minutes}m`;

  const initials = (playerName ?? "P")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        background:    "#0e0e0e",
        border:        "1px solid #2a2a2a",
        borderRadius:  28,
        overflow:      "hidden",
        fontFamily:    "system-ui, sans-serif",
      }}
    >
      {/* ── Identity strip ── */}
      <div
        style={{
          background:     "linear-gradient(135deg, #0c1f10 0%, #1a3d26 100%)",
          padding:        "20px 20px 16px",
          display:        "flex",
          alignItems:     "center",
          gap:            14,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width:          52,
            height:         52,
            borderRadius:   "50%",
            background:     "#1a5c2a",
            border:         "2px solid #c0dd97",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       18,
            fontWeight:     800,
            color:          "#c0dd97",
            flexShrink:     0,
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "#fff", fontWeight: 800, fontSize: 16, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {playerName ?? "Player"}
          </p>
          <p style={{ color: "#c0dd97", fontSize: 11, margin: "2px 0 0", opacity: 0.8 }}>
            🇿🇼 Zimbabwe
          </p>
        </div>

        {/* Passport badge */}
        <div
          style={{
            background:   "#1a5c2a",
            border:       "1px solid #c0dd97",
            borderRadius: 8,
            padding:      "4px 10px",
            fontSize:     9,
            fontWeight:   900,
            color:        "#c0dd97",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            flexShrink:   0,
          }}
        >
          Passport
        </div>
      </div>

      {/* ── 3-stat row ── */}
      <div
        style={{
          display:      "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap:          1,
          background:   "#2a2a2a",
          borderBottom: "1px solid #2a2a2a",
        }}
      >
        {[
          { value: xp.toLocaleString(), label: "XP Points" },
          { value: `${streak}d`,         label: "Streak"    },
          { value: trainedLabel,          label: "Trained"   },
        ].map(({ value, label }) => (
          <div
            key={label}
            style={{
              background:     "#0e0e0e",
              padding:        "12px 8px",
              textAlign:      "center",
            }}
          >
            <p style={{ color: "#fff", fontWeight: 800, fontSize: 18, margin: 0 }}>{value}</p>
            <p style={{ color: "#555", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", margin: "2px 0 0" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Tab buttons ── */}
      <div style={{ display: "flex", gap: 1, background: "#2a2a2a", padding: 1 }}>
        <button
          onClick={() => setTab("physical")}
          style={{
            flex:           1,
            padding:        "10px 8px",
            background:     tab === "physical" ? "#1a5c2a" : "#151515",
            color:          tab === "physical" ? "#c0dd97" : "#555",
            border:         "none",
            cursor:         "pointer",
            fontSize:       11,
            fontWeight:     tab === "physical" ? 800 : 500,
            letterSpacing:  "0.05em",
            textTransform:  "uppercase",
            transition:     "all 0.15s",
          }}
        >
          Physical DNA
        </button>
        <button
          onClick={() => setTab("technical")}
          style={{
            flex:           1,
            padding:        "10px 8px",
            background:     tab === "technical" ? "#854f0b" : "#151515",
            color:          tab === "technical" ? "#fac775" : "#555",
            border:         "none",
            cursor:         "pointer",
            fontSize:       11,
            fontWeight:     tab === "technical" ? 800 : 500,
            letterSpacing:  "0.05em",
            textTransform:  "uppercase",
            transition:     "all 0.15s",
          }}
        >
          Technical
        </button>
      </div>

      {/* ── Radar panel ── */}
      <div style={{ padding: "16px 16px 8px" }}>
        {tab === "physical" ? (
          <PhysicalRadar axes={physical} />
        ) : (
          <TechnicalRadar axes={technical} />
        )}

        {/* Footer citation */}
        <p
          style={{
            color:         "#333",
            fontSize:      9,
            textAlign:     "center",
            marginTop:     6,
            marginBottom:  0,
          }}
        >
          {tab === "physical"
            ? "EUROFIT-based measurement · percentile vs Zimbabwe peers"
            : "Gemini-assessed from drill footage · 0–100 sub-metric average"}
        </p>
      </div>

      {/* ── Bottom nav ── */}
      <div
        style={{
          display:        "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          borderTop:      "1px solid #1a1a1a",
          marginTop:      8,
        }}
      >
        {[
          { href: "/player",          label: "Home",     icon: "⊞" },
          { href: "/player/sessions/new", label: "Training", icon: "▶" },
          { href: "/player/goal",     label: "Schedule", icon: "◎" },
          { href: "/player/profile",  label: "Profile",  icon: "◉" },
        ].map(({ href, label, icon }) => (
          <Link
            key={label}
            href={href}
            style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              gap:            3,
              padding:        "10px 4px",
              textDecoration: "none",
              color:          href === "/player/profile" ? "#c0dd97" : "#444",
            }}
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
