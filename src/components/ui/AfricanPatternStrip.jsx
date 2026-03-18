/**
 * AfricanPatternStrip.jsx
 *
 * WHAT THIS FILE DOES:
 * This is a reusable decorative border component inspired by the African
 * geometric patterns on the building near your office. It creates a horizontal
 * strip with zigzag lines, diamond shapes, and dot accents in the Grassroots
 * Sport colour palette.
 *
 * HOW TO USE IT:
 * Import it anywhere in your app and drop it between sections like this:
 *
 *   import AfricanPatternStrip from '../components/ui/AfricanPatternStrip';
 *
 *   <AfricanPatternStrip variant="dark" />   ← charcoal background, gold zigzag
 *   <AfricanPatternStrip variant="green" />  ← green background, gold arch teeth
 *   <AfricanPatternStrip variant="gold" />   ← gold background, dark zigzag
 *
 * WHERE TO PUT IT:
 *   - Below the NavBar
 *   - Above the Footer
 *   - Between major page sections (e.g. between hero and features)
 *
 * PROPS:
 *   variant   → "dark" | "green" | "gold"  (default: "dark")
 *   height    → number in px               (default: 36)
 *   className → any extra CSS classes      (optional)
 */

const COLORS = {
  gold:        '#E6A817',
  goldLight:   '#F5C842',
  terracotta:  '#C1714A',
  teal:        '#3A7D6B',
  charcoal:    '#2C2416',
  greenDark:   '#1B5E20',
  greenMid:    '#2E7D32',
  white:       '#FFFFFF',
};

// ── VARIANT: DARK ──────────────────────────────────────────────────
// Charcoal background with gold diamond outlines, white zigzag,
// and alternating terracotta / teal dots.
// Used: below NavBar, above Footer
function DarkStrip({ height }) {
  const zigzag = buildZigzag(1440, height, 9);
  const diamonds = buildDiamonds(1440, height, 36);
  const dots = buildDots(1440, height, 36, 18);

  return (
    <svg
      viewBox={`0 0 1440 ${height}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', width: '100%', height }}
    >
      <rect width="1440" height={height} fill={COLORS.charcoal} />

      {/* Diamond outlines */}
      {diamonds.map((d, i) => (
        <polygon
          key={i}
          points={d}
          fill="none"
          stroke={COLORS.gold}
          strokeWidth="1.5"
        />
      ))}

      {/* White zigzag */}
      <polyline
        points={zigzag}
        fill="none"
        stroke={COLORS.white}
        strokeWidth="1"
        opacity="0.35"
      />

      {/* Alternating terracotta / teal dots */}
      {dots.map((dot, i) => (
        <circle
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          r="2.5"
          fill={i % 2 === 0 ? COLORS.terracotta : COLORS.teal}
          opacity="0.7"
        />
      ))}

      {/* Teal corner accents */}
      <rect x="0"    y="0" width="9" height="4" fill={COLORS.teal} opacity="0.5" />
      <rect x="0"    y={height - 4} width="9" height="4" fill={COLORS.teal} opacity="0.5" />
      <rect x="1431" y="0" width="9" height="4" fill={COLORS.teal} opacity="0.5" />
      <rect x="1431" y={height - 4} width="9" height="4" fill={COLORS.teal} opacity="0.5" />
    </svg>
  );
}

// ── VARIANT: GREEN ─────────────────────────────────────────────────
// Dark green background with gold arch/tooth shapes pointing upward
// and a white zigzag running across the top.
// Used: between hero and features, above footer
function GreenStrip({ height }) {
  const archCount = Math.ceil(1440 / 48);
  const zigzag = buildZigzag(1440, height, 12);

  return (
    <svg
      viewBox={`0 0 1440 ${height}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', width: '100%', height }}
    >
      <rect width="1440" height={height} fill={COLORS.greenDark} />

      {/* Arch teeth pointing up from bottom */}
      {Array.from({ length: archCount }, (_, i) => (
        <ellipse
          key={i}
          cx={24 + i * 48}
          cy={height}
          rx="14"
          ry={height * 0.5}
          fill={COLORS.gold}
          opacity="0.25"
        />
      ))}

      {/* White zigzag across the top */}
      <polyline
        points={zigzag}
        fill="none"
        stroke={COLORS.white}
        strokeWidth="1.2"
        opacity="0.4"
      />
    </svg>
  );
}

// ── VARIANT: GOLD ──────────────────────────────────────────────────
// Gold/amber background with dark charcoal zigzag and triangle row.
// Used: as a highlight divider between major sections
function GoldStrip({ height }) {
  const zigzag = buildZigzag(1440, height, 9);
  const triangles = buildTriangles(1440, height);

  return (
    <svg
      viewBox={`0 0 1440 ${height}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', width: '100%', height }}
    >
      <rect width="1440" height={height} fill={COLORS.gold} />

      {/* Dark triangle row */}
      {triangles.map((t, i) => (
        <polygon
          key={i}
          points={t}
          fill={COLORS.charcoal}
          opacity="0.2"
        />
      ))}

      {/* Dark zigzag */}
      <polyline
        points={zigzag}
        fill="none"
        stroke={COLORS.charcoal}
        strokeWidth="1.2"
        opacity="0.3"
      />

      {/* Teal dots */}
      {Array.from({ length: Math.ceil(1440 / 72) }, (_, i) => (
        <circle
          key={i}
          cx={36 + i * 72}
          cy={height / 2}
          r="2.5"
          fill={COLORS.teal}
          opacity="0.5"
        />
      ))}
    </svg>
  );
}

// ── HELPER FUNCTIONS ───────────────────────────────────────────────
// These build the SVG point strings mathematically so the patterns
// tile perfectly at any screen width.

function buildZigzag(width, height, step) {
  const points = [];
  const mid = height * 0.38;
  const low = height * 0.62;
  for (let x = 0; x <= width; x += step) {
    points.push(`${x},${x % (step * 2) === 0 ? mid : low}`);
  }
  return points.join(' ');
}

function buildDiamonds(width, height, spacing) {
  const diamonds = [];
  const halfH = height * 0.42;
  const halfW = height * 0.28;
  const cy = height / 2;
  for (let cx = spacing / 2; cx < width; cx += spacing) {
    diamonds.push(
      `${cx},${cy - halfH} ${cx + halfW},${cy} ${cx},${cy + halfH} ${cx - halfW},${cy}`
    );
  }
  return diamonds;
}

function buildDots(width, height, spacing, offset) {
  const dots = [];
  for (let cx = offset; cx < width; cx += spacing) {
    dots.push({ cx, cy: height / 2 });
  }
  return dots;
}

function buildTriangles(width, height) {
  const triangles = [];
  const triW = 36;
  const count = Math.ceil(width / triW);
  for (let i = 0; i < count; i++) {
    const x = i * triW;
    triangles.push(
      `${x},${height} ${x + triW / 2},${height * 0.2} ${x + triW},${height}`
    );
  }
  return triangles;
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────
export default function AfricanPatternStrip({
  variant = 'dark',
  height = 36,
  className = '',
}) {
  const wrapStyle = {
    width: '100%',
    overflow: 'hidden',
    lineHeight: 0,
    display: 'block',
  };

  return (
    <div style={wrapStyle} className={className}>
      {variant === 'dark'  && <DarkStrip  height={height} />}
      {variant === 'green' && <GreenStrip height={height} />}
      {variant === 'gold'  && <GoldStrip  height={height} />}
    </div>
  );
}
