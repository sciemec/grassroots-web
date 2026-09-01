/**
 * TalentPassportRadar
 *
 * Full 9-axis technical radar for the player public passport page.
 * Each axis = one drill category. Value = average of that drill's sub-metric
 * scores (0–100) from the player's most recent drill_analysis_results row
 * for that drill type.
 *
 * Axes with no data are shown as grey dashed spokes with an open circle at
 * the tip — visually distinct from "scored 0". They are excluded from the
 * filled polygon so a low score and "never attempted" look different.
 *
 * Pure server-renderable SVG — no "use client", no hooks, no recharts.
 */

interface DrillScore {
  drillName:   string;
  score:       number;
  topStrength: string | null;
  avgSubScore?: number | null;   // 0–100 averaged from sub-metrics; null = not recorded
}

// The 9 technical categories that appear on the passport.
// matchPrefix is used with .startsWith() so "Heading (Rosch Test)" → "Heading" ✅
const PASSPORT_AXES = [
  { label: "First Touch",  matchPrefix: "First Touch"  },
  { label: "Turn&Strike",  matchPrefix: "Rebound"      },
  { label: "Passing",      matchPrefix: "Passing"      },
  { label: "Shooting",     matchPrefix: "Shooting"     },
  { label: "Crossing",     matchPrefix: "Crossing"     },
  { label: "Free Kick",    matchPrefix: "Free Kick"    },
  { label: "Heading",      matchPrefix: "Heading"      },
  { label: "Juggling",     matchPrefix: "Ball Juggling"},
  { label: "Throw-In",     matchPrefix: "Throw-In"     },
] as const;

export function TalentPassportRadar({ drillScores }: { drillScores: DrillScore[] }) {
  const N          = PASSPORT_AXES.length;  // 9
  const CX         = 175;
  const CY         = 160;
  const R          = 108;
  const W          = 350;
  const H          = 340;
  const LABEL_PAD  = 22;   // px beyond R for axis label

  // Angle for axis i — start from top (−π/2), distribute evenly clockwise
  const toAngle = (i: number) => (i * 2 * Math.PI) / N - Math.PI / 2;

  // SVG point on axis i at fraction f (0–1) of radius
  const pt = (i: number, f: number) => ({
    x: CX + R * f * Math.cos(toAngle(i)),
    y: CY + R * f * Math.sin(toAngle(i)),
  });

  // Map each of the 9 fixed axes to the player's drill history
  const axisData = PASSPORT_AXES.map(({ label, matchPrefix }, i) => {
    const found = drillScores.find(d => d.drillName.startsWith(matchPrefix));
    return {
      label,
      index: i,
      value: (found?.avgSubScore != null && found.avgSubScore > 0)
        ? found.avgSubScore
        : null,                  // null → not yet attempted
    };
  });

  const available = axisData.filter(a => a.value !== null);

  // Polygon only connects axes that have real data, at their angular positions
  const polygonPts = available
    .map(a => {
      const p = pt(a.index, Math.max(0, Math.min(100, a.value!)) / 100);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const gridRings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div
      style={{
        background:   "#151515",
        border:       "1px solid #2a2a2a",
        borderRadius: 16,
        padding:      "16px 12px 12px",
      }}
    >
      {/* Header */}
      <p
        style={{
          color:         "#c8962a",
          fontSize:      10,
          fontWeight:    900,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom:  10,
        }}
      >
        Technical Passport
      </p>

      {/* Radar SVG */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", display: "block" }}
        aria-label="Technical passport radar chart"
      >
        {/* Grid rings */}
        {gridRings.map(f => (
          <polygon
            key={f}
            points={Array.from({ length: N }, (_, i) => {
              const p = pt(i, f);
              return `${p.x},${p.y}`;
            }).join(" ")}
            fill="none"
            stroke="#242424"
            strokeWidth={f === 1.0 ? 1.5 : 1}
          />
        ))}

        {/* Axis spokes */}
        {axisData.map((axis) => {
          const tip     = pt(axis.index, 1);
          const hasData = axis.value !== null;
          return (
            <line
              key={axis.label}
              x1={CX}    y1={CY}
              x2={tip.x} y2={tip.y}
              stroke={hasData ? "#2e5a2e" : "#222"}
              strokeWidth={1}
              strokeDasharray={hasData ? undefined : "4 3"}
            />
          );
        })}

        {/* Filled polygon — available axes only */}
        {available.length >= 2 && (
          <polygon
            points={polygonPts}
            fill="#1a5c2a"
            fillOpacity={0.45}
            stroke="#97c459"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}

        {/* Score dots on available axes */}
        {available.map(a => {
          const p = pt(a.index, Math.max(0, Math.min(100, a.value!)) / 100);
          return (
            <circle
              key={`dot-${a.label}`}
              cx={p.x} cy={p.y}
              r={4}
              fill="#c0dd97"
              stroke="#0e0e0e"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Open circles at outer tip — not yet attempted */}
        {axisData
          .filter(a => a.value === null)
          .map(a => {
            const tip = pt(a.index, 1);
            return (
              <circle
                key={`empty-${a.label}`}
                cx={tip.x} cy={tip.y}
                r={3}
                fill="none"
                stroke="#333"
                strokeWidth={1.5}
              />
            );
          })}

        {/* Axis labels */}
        {axisData.map((axis) => {
          const ang     = toAngle(axis.index);
          const lx      = CX + (R + LABEL_PAD) * Math.cos(ang);
          const ly      = CY + (R + LABEL_PAD) * Math.sin(ang);
          const cosA    = Math.cos(ang);
          const anchor  = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";
          const hasData = axis.value !== null;

          return (
            <text
              key={`lbl-${axis.label}`}
              x={lx} y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={8.5}
              fontWeight={hasData ? 700 : 400}
              fill={hasData ? "#c8edd0" : "#3e3e3e"}
            >
              {axis.label}
            </text>
          );
        })}

        {/* Score value next to each available dot */}
        {available.map(a => {
          const ang  = toAngle(a.index);
          const f    = Math.max(0.08, Math.min(100, a.value!)) / 100;
          // Nudge label slightly inward so it doesn't overlap the dot
          const nudgeF = f > 0.18 ? f - 0.14 : f + 0.16;
          const p    = pt(a.index, Math.max(0.08, nudgeF));
          const cosA = Math.cos(ang);
          const anchor = cosA > 0.25 ? "start" : cosA < -0.25 ? "end" : "middle";

          return (
            <text
              key={`val-${a.label}`}
              x={p.x} y={p.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={7}
              fontWeight={700}
              fill="#6abf60"
            >
              {Math.round(a.value!)}
            </text>
          );
        })}
      </svg>

      {/* Footer legend */}
      <div
        style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          marginTop:      10,
          paddingTop:     8,
          borderTop:      "1px solid #1e1e1e",
        }}
      >
        <p style={{ color: "#3c3c3c", fontSize: 9 }}>
          Gemini-assessed from drill footage
        </p>
        {available.length < N && (
          <p style={{ color: "#3c3c3c", fontSize: 9 }}>
            ○ = not yet attempted
          </p>
        )}
      </div>
    </div>
  );
}
