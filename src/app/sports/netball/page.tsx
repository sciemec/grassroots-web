"use client";

import { useState } from "react";

/* ─── DESIGN TOKENS ─────────────────────────────────────────────── */
const C = {
  green:      "#1E6B3C",
  greenLight: "#2D7D46",
  greenGlow:  "#2D7D4622",
  gold:       "#D4900A",
  goldLight:  "#F5A623",
  goldGlow:   "#F5A62322",
  red:        "#B5261E",
  redGlow:    "#B5261E22",
  dark:       "#080F0A",
  darkCard:   "#0E1A10",
  darkBorder: "#1A2E1E",
  surface:    "#111D13",
  text:       "#EDF2EE",
  muted:      "#6B8F72",
  white:      "#FFFFFF",
};

/* ─── CHEVRON SVG PATTERN ────────────────────────────────────────── */
const chevronBg = `url("data:image/svg+xml,%3Csvg width='60' height='30' viewBox='0 0 60 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L30 0 L60 30' fill='none' stroke='%231E6B3C' stroke-width='1.2' opacity='0.15'/%3E%3C/svg%3E")`;
const diamondBg = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='20' y='2' width='12' height='12' transform='rotate(45 20 8)' fill='none' stroke='%23D4900A' stroke-width='0.8' opacity='0.12'/%3E%3C/svg%3E")`;

/* ─── NETBALL DATA ───────────────────────────────────────────────── */
const POSITIONS = [
  { abbr: "GS", full: "Goal Shooter",  zone: "Attacking third",       focus: "Shooting technique, holding position under pressure, composure in the circle." },
  { abbr: "GA", full: "Goal Attack",   zone: "Attacking two-thirds",  focus: "Movement off the ball, passing range, link play, and finishing." },
  { abbr: "WA", full: "Wing Attack",   zone: "Centre + Attacking",    focus: "Width creation, delivery timing, angles for shooters." },
  { abbr: "C",  full: "Centre",        zone: "Full court width",       focus: "Endurance, decision-making, connecting attack and defence." },
  { abbr: "WD", full: "Wing Defence",  zone: "Centre + Defending",    focus: "Anticipation, 0.9m discipline, restricting feeding lanes." },
  { abbr: "GD", full: "Goal Defence",  zone: "Defending two-thirds",  focus: "Reading the game, timing, interceptions, rebounding." },
  { abbr: "GK", full: "Goal Keeper",   zone: "Defending third",       focus: "Shot-reading, communication with GD, organising the defensive third." },
];

const DRILLS = [
  { name: "Chest Pass Pairs",         level: "Beginner",     time: "10 min", desc: "Partners 3m apart, flat direct passes with fingers spread. The most-used delivery in netball." },
  { name: "Dodge and Lead",           level: "Beginner",     time: "15 min", desc: "Drive away from defender then cut back sharply to receive. Core movement for all positions." },
  { name: "Circle Edge Feeding",      level: "Intermediate", time: "20 min", desc: "WA/GA deliver into GS under light pressure. Builds the most common attacking combination." },
  { name: "1v1 Shooting Under Load",  level: "Intermediate", time: "15 min", desc: "GS or GA shoots while defender raises arms. Builds composure and correct release height." },
  { name: "Centre Pass Pattern",      level: "Intermediate", time: "20 min", desc: "Structured rehearsal of centre pass play — timing, role assignment, back-up options." },
  { name: "Intercept Positioning",    level: "Advanced",     time: "25 min", desc: "Defenders read the ball and time their move to cut off passes. Separates average from elite defenders." },
  { name: "Footwork Gate Drill",      level: "All levels",   time: "10 min", desc: "Receive, land, pivot, release — without stepping. Directly reduces footwork penalties in match play." },
];

const RULES = [
  { rule: "Offside",             icon: "🚫", summary: "Stay in your zone", detail: "Each position has designated court zones. Leaving your zone concedes a free pass." },
  { rule: "Obstruction",         icon: "📏", summary: "0.9m from the ball", detail: "Defenders must stay at least 0.9m from a player holding the ball. Most-called junior rule." },
  { rule: "Contact",             icon: "🤚", summary: "No physical play", detail: "Pushing, tripping, or holding results in a free pass. Discipline is foundational." },
  { rule: "Footwork",            icon: "👣", summary: "No stepping", detail: "Land, pivot, release — cannot drag or re-ground the landing foot after receiving." },
  { rule: "3-Second Rule",       icon: "⏱", summary: "Pass or shoot fast", detail: "The player with the ball must pass or shoot within 3 seconds of receiving." },
  { rule: "Shooting Zone",       icon: "🎯", summary: "GS & GA only", detail: "Only Goal Shooter and Goal Attack may attempt to score, only from the goal circle." },
  { rule: "Centre Pass",         icon: "⭕", summary: "After every goal", detail: "The team that conceded takes the centre pass. Centre must begin in the circle." },
];

const LEAGUES = [
  { group: "U14", ages: "12–14", level: "District",          color: C.goldLight, desc: "School entry point. First structured competition. Guardian consent required." },
  { group: "U16", ages: "15–16", level: "District/Province", color: C.gold,      desc: "Transition tier. Emerging talent begins provincial exposure and tracking." },
  { group: "U18", ages: "17–18", level: "Province",          color: C.greenLight, desc: "Consistent competition. Provincial selectors actively monitoring profiles." },
  { group: "U21", ages: "19–21", level: "Province/National", color: C.green,     desc: "Pre-senior. Direct feeder into the Zambezi Eagles national pathway." },
];

const VIDEO_FEATURES = [
  {
    id: "coach-review",
    icon: "📹",
    title: "Match Footage Review",
    who: "Coaches",
    color: C.green,
    desc: "Upload match recordings and annotate moments directly in the app. Draw on the screen, add timestamps, and share clips with individual players.",
    features: ["Upload from device or cloud", "Frame-by-frame scrubbing", "Draw & annotate on video", "Clip and share to player profile", "Add voice commentary"],
    note: "Uses video_player + custom annotation canvas layer. Cloud storage via Render backend.",
  },
  {
    id: "drill-library",
    icon: "🎬",
    title: "AI Drill Demonstrations",
    who: "Players & Coaches",
    color: C.gold,
    desc: "Every drill in the library includes a short demonstration video. AI overlays highlight key technique points — footwork, hand position, court spacing.",
    features: ["Video for all 7 starter drills", "Slow-motion technique highlights", "AI keypoint overlay", "Shona & English narration", "Works offline after first download"],
    note: "Videos pre-packaged for offline. AI overlay uses ML Kit pose detection already in the football module.",
  },
  {
    id: "self-review",
    icon: "🔍",
    title: "Player Self-Review",
    who: "Players",
    color: C.red,
    desc: "Players record their own training sessions and receive AI feedback on their movement, footwork, and shooting technique. Builds self-awareness and ownership.",
    features: ["Record from phone camera", "AI footwork analysis", "Shooting arc detection", "Personal highlights reel", "Share to coach for feedback"],
    note: "Camera recording via camera plugin. Analysis sent to DeepSeek/Claude API. Results cached locally.",
  },
];

/* ─── REUSABLE COMPONENTS ───────────────────────────────────────── */

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px",
      background: `${color}22`, border: `1px solid ${color}55`,
      borderRadius: 4, fontSize: 9, fontWeight: 800, letterSpacing: 2,
      color, fontFamily: "'Georgia', serif", textTransform: "uppercase",
    }}>{text}</span>
  );
}

function SectionLabel({ text, color = C.gold }: { text: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ width: 24, height: 2, background: color }} />
      <span style={{ fontSize: 10, letterSpacing: 3, color, fontWeight: 700, textTransform: "uppercase", fontFamily: "'Georgia', serif" }}>{text}</span>
    </div>
  );
}

function LevelPill({ level }: { level: string }) {
  const colors: Record<string, string> = { Beginner: C.green, Intermediate: C.gold, Advanced: C.red, "All levels": C.muted };
  const c = colors[level] || C.muted;
  return <Badge text={level} color={c} />;
}

/* ─── NETBALL HERO ───────────────────────────────────────────────── */
function NetballHero() {
  return (
    <div style={{
      background: `linear-gradient(135deg, #060E07 0%, #0D1F0F 50%, #071208 100%)`,
      backgroundImage: chevronBg,
      borderBottom: `1px solid ${C.darkBorder}`,
      padding: "56px 32px 48px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, transparent)`,
      }} />
      <div style={{
        position: "absolute", right: -40, top: -40,
        fontSize: 220, opacity: 0.04, lineHeight: 1, userSelect: "none",
        filter: "blur(2px)",
      }}>🏐</div>

      <div style={{ maxWidth: 640, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Badge text="ZINA Partnership" color={C.gold} />
          <Badge text="New Sport" color={C.green} />
        </div>
        <h1 style={{
          margin: "0 0 12px",
          fontSize: "clamp(32px, 5vw, 52px)",
          fontFamily: "'Georgia', serif",
          fontWeight: 700,
          color: C.text,
          lineHeight: 1.1,
          letterSpacing: -1,
        }}>
          Netball is now<br />
          <span style={{ color: C.goldLight }}>on Grassroots Sports.</span>
        </h1>
        <p style={{
          margin: "0 0 28px",
          fontSize: 15, color: C.muted, lineHeight: 1.7,
          fontFamily: "'Georgia', serif",
          maxWidth: 480,
        }}>
          Full player tracking from U14 to the Gems. Court positions, training drills, rules, junior leagues — and a ZINA-aligned registration pipeline built for Zimbabwe&apos;s schools and clubs.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/register?sport=netball" style={{
            padding: "12px 28px",
            background: C.gold, border: "none", borderRadius: 6,
            color: C.dark, fontWeight: 800, fontSize: 13,
            fontFamily: "'Georgia', serif", letterSpacing: 0.5,
            boxShadow: `0 4px 20px ${C.gold}44`,
            textDecoration: "none", display: "inline-block",
          }}>Register a Player →</a>
          <a href="/register?sport=netball&role=coach" style={{
            padding: "12px 28px",
            background: "transparent",
            border: `1px solid ${C.darkBorder}`,
            borderRadius: 6, color: C.muted, fontSize: 13,
            fontFamily: "'Georgia', serif",
            textDecoration: "none", display: "inline-block",
          }}>Register as Coach</a>
        </div>
      </div>

      <div style={{
        display: "flex", gap: 0, marginTop: 40,
        borderTop: `1px solid ${C.darkBorder}`,
        paddingTop: 28, flexWrap: "wrap",
      }}>
        {[
          { val: "4",   label: "Age Groups" },
          { val: "7",   label: "Court Positions" },
          { val: "7",   label: "Training Drills" },
          { val: "10+", label: "Provinces" },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "0 32px 0 0", marginRight: 32,
            borderRight: i < 3 ? `1px solid ${C.darkBorder}` : "none",
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.goldLight, fontFamily: "'Georgia', serif" }}>{s.val}</div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── POSITIONS TAB ─────────────────────────────────────────────── */
function PositionsTab() {
  const [selected, setSelected] = useState(0);
  const pos = POSITIONS[selected];

  return (
    <div style={{ padding: "32px 24px" }}>
      <SectionLabel text="Court Positions" color={C.gold} />
      <h2 style={{ margin: "0 0 24px", fontSize: 22, color: C.text, fontFamily: "'Georgia', serif" }}>
        Seven positions. Every player tracked by role.
      </h2>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160, flexShrink: 0 }}>
          {POSITIONS.map((p, i) => (
            <button key={i} onClick={() => setSelected(i)} style={{
              padding: "10px 14px",
              background: selected === i ? `${C.gold}18` : C.darkCard,
              border: `1px solid ${selected === i ? C.gold : C.darkBorder}`,
              borderRadius: 8, cursor: "pointer", textAlign: "left",
              transition: "all 0.15s",
            }}>
              <span style={{
                display: "inline-block", width: 36, fontSize: 12,
                fontWeight: 800, color: selected === i ? C.goldLight : C.muted,
                fontFamily: "'Georgia', serif",
              }}>{p.abbr}</span>
              <span style={{ fontSize: 12, color: selected === i ? C.text : C.muted, fontFamily: "'Georgia', serif" }}>{p.full}</span>
            </button>
          ))}
        </div>

        <div style={{
          flex: 1, minWidth: 240,
          background: C.darkCard, border: `1px solid ${C.darkBorder}`,
          borderRadius: 12, padding: "28px 24px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", right: -20, top: -20, fontSize: 100, opacity: 0.06, lineHeight: 1 }}>🏐</div>
          <div style={{
            display: "inline-block",
            background: C.gold, color: C.dark,
            padding: "4px 14px", borderRadius: 4,
            fontSize: 22, fontWeight: 900, fontFamily: "'Georgia', serif", marginBottom: 12,
          }}>{pos.abbr}</div>
          <h3 style={{ margin: "0 0 6px", fontSize: 20, color: C.text, fontFamily: "'Georgia', serif" }}>{pos.full}</h3>
          <div style={{ fontSize: 12, color: C.gold, marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>
            Zone: {pos.zone}
          </div>
          <div style={{ background: C.surface, borderRadius: 8, padding: "14px 16px", borderLeft: `3px solid ${C.gold}` }}>
            <div style={{ fontSize: 11, color: C.gold, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Development Focus</div>
            <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.7, fontFamily: "'Georgia', serif" }}>{pos.focus}</p>
          </div>
          <div style={{
            marginTop: 20, padding: "12px 16px",
            background: `${C.green}11`, border: `1px dashed ${C.green}44`,
            borderRadius: 8, fontSize: 12, color: C.muted,
          }}>
            🏟 In-app: full interactive court diagram showing {pos.abbr} zone highlighted
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── DRILLS TAB ────────────────────────────────────────────────── */
function DrillsTab() {
  const [filter, setFilter] = useState("All");
  const levels = ["All", "Beginner", "Intermediate", "Advanced", "All levels"];
  const filtered = filter === "All" ? DRILLS : DRILLS.filter(d => d.level === filter);

  return (
    <div style={{ padding: "32px 24px" }}>
      <SectionLabel text="Training Drills" color={C.green} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: C.text, fontFamily: "'Georgia', serif" }}>
          Low-equipment drills for school &amp; district level.
        </h2>
        <div style={{ display: "flex", gap: 6 }}>
          {levels.map(l => (
            <button key={l} onClick={() => setFilter(l)} style={{
              padding: "6px 12px",
              background: filter === l ? C.green : "transparent",
              border: `1px solid ${filter === l ? C.green : C.darkBorder}`,
              borderRadius: 20, cursor: "pointer",
              fontSize: 11, color: filter === l ? C.white : C.muted,
              fontFamily: "'Georgia', serif", transition: "all 0.15s",
            }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {filtered.map((d, i) => (
          <div key={i} style={{
            background: C.darkCard, border: `1px solid ${C.darkBorder}`,
            borderRadius: 10, padding: "18px 20px", transition: "border-color 0.2s",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'Georgia', serif" }}>{d.name}</span>
              <span style={{
                background: `${C.gold}18`, color: C.gold, fontSize: 10,
                padding: "2px 8px", borderRadius: 3, flexShrink: 0, marginLeft: 8,
                fontWeight: 700, letterSpacing: 1,
              }}>{d.time}</span>
            </div>
            <LevelPill level={d.level} />
            <p style={{ margin: "10px 0 0", fontSize: 12, color: C.muted, lineHeight: 1.7, fontFamily: "'Georgia', serif" }}>{d.desc}</p>
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.green, cursor: "pointer" }}>
              🎬 <span>Watch drill video</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── RULES TAB ─────────────────────────────────────────────────── */
function RulesTab() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ padding: "32px 24px" }}>
      <SectionLabel text="Key Rules" color={C.red} />
      <h2 style={{ margin: "0 0 8px", fontSize: 22, color: C.text, fontFamily: "'Georgia', serif" }}>
        The rules that matter most at junior level.
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: C.muted, fontFamily: "'Georgia', serif" }}>
        These seven rules account for the majority of free passes conceded in district competition.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {RULES.map((r, i) => (
          <div key={i}
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              background: C.darkCard,
              border: `1px solid ${open === i ? C.red : C.darkBorder}`,
              borderLeft: `3px solid ${open === i ? C.red : C.darkBorder}`,
              borderRadius: 10, cursor: "pointer", overflow: "hidden",
              transition: "all 0.2s",
            }}>
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 20 }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'Georgia', serif" }}>{r.rule}</span>
                <span style={{ marginLeft: 12, fontSize: 12, color: C.muted }}>— {r.summary}</span>
              </div>
              <span style={{ color: C.muted, fontSize: 12 }}>{open === i ? "▲" : "▼"}</span>
            </div>
            {open === i && (
              <div style={{
                padding: "14px 20px 18px 54px",
                fontSize: 13, color: C.muted, lineHeight: 1.7,
                fontFamily: "'Georgia', serif",
                borderTop: `1px solid ${C.darkBorder}`,
              }}>{r.detail}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── LEAGUES TAB ───────────────────────────────────────────────── */
function LeaguesTab() {
  return (
    <div style={{ padding: "32px 24px" }}>
      <SectionLabel text="Junior Leagues" color={C.goldLight} />
      <h2 style={{ margin: "0 0 8px", fontSize: 22, color: C.text, fontFamily: "'Georgia', serif" }}>
        District → Province → National.
      </h2>
      <p style={{ margin: "0 0 28px", fontSize: 13, color: C.muted, fontFamily: "'Georgia', serif", maxWidth: 480 }}>
        ZINA&apos;s junior development pipeline tracked end-to-end on Grassroots Sports. Every player registered at U14 carries their profile all the way to national selection.
      </p>

      <div style={{
        background: C.darkCard, border: `1px solid ${C.darkBorder}`,
        borderRadius: 12, padding: "24px", marginBottom: 24,
        display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap",
      }}>
        {["School / Club", "District League", "Provincial League", "National Pool", "Zambezi Eagles / Gems"].map((stage, i, arr) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              padding: "8px 14px",
              background: i === arr.length - 1 ? `${C.gold}22` : C.surface,
              border: `1px solid ${i === arr.length - 1 ? C.gold : C.darkBorder}`,
              borderRadius: 6, fontSize: 11, fontWeight: 700,
              color: i === arr.length - 1 ? C.goldLight : C.muted,
              textAlign: "center", letterSpacing: 0.5, whiteSpace: "nowrap",
            }}>{stage}</div>
            {i < arr.length - 1 && (
              <div style={{ padding: "0 6px", color: C.green, fontSize: 14, fontWeight: 700 }}>→</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {LEAGUES.map((l, i) => (
          <div key={i} style={{
            background: C.darkCard, border: `1px solid ${C.darkBorder}`,
            borderTop: `3px solid ${l.color}`, borderRadius: 10, padding: "20px 18px",
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: l.color, fontFamily: "'Georgia', serif", lineHeight: 1, marginBottom: 4 }}>{l.group}</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, letterSpacing: 1 }}>Ages {l.ages}</div>
            <div style={{
              display: "inline-block", padding: "3px 10px",
              background: `${l.color}18`, border: `1px solid ${l.color}44`,
              borderRadius: 4, fontSize: 10, color: l.color,
              fontWeight: 700, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase",
            }}>{l.level}</div>
            <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.6, fontFamily: "'Georgia', serif" }}>{l.desc}</p>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 24,
        background: `linear-gradient(135deg, ${C.greenGlow}, ${C.goldGlow})`,
        border: `1px solid ${C.darkBorder}`,
        borderRadius: 12, padding: "24px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "'Georgia', serif", marginBottom: 4 }}>
            Register your club&apos;s junior netball squad
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>ZINA-compliant registration. QR player cards. Automatic age-group assignment.</div>
        </div>
        <a href="/register?sport=netball" style={{
          padding: "12px 24px", background: C.gold, border: "none",
          borderRadius: 6, color: C.dark, fontWeight: 800, fontSize: 13,
          fontFamily: "'Georgia', serif", whiteSpace: "nowrap",
          boxShadow: `0 4px 16px ${C.gold}44`,
          textDecoration: "none", display: "inline-block",
        }}>Register Now →</a>
      </div>
    </div>
  );
}

/* ─── VIDEO SYSTEM ──────────────────────────────────────────────── */
function VideoSystem() {
  const [active, setActive] = useState("coach-review");
  const feature = VIDEO_FEATURES.find(f => f.id === active)!;

  return (
    <div style={{
      margin: "0", padding: "32px 24px",
      borderTop: `1px solid ${C.darkBorder}`,
      background: `linear-gradient(180deg, ${C.dark} 0%, #0A160C 100%)`,
      backgroundImage: diamondBg,
    }}>
      <SectionLabel text="Video Assistance System" color={C.goldLight} />
      <h2 style={{ margin: "0 0 6px", fontSize: 22, color: C.text, fontFamily: "'Georgia', serif" }}>
        See the game. Understand the game. Improve.
      </h2>
      <p style={{ margin: "0 0 28px", fontSize: 13, color: C.muted, fontFamily: "'Georgia', serif", maxWidth: 540 }}>
        Three integrated video tools — for coaches analysing matches, players learning drills, and athletes reviewing their own technique.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {VIDEO_FEATURES.map(f => (
          <button key={f.id} onClick={() => setActive(f.id)} style={{
            padding: "10px 18px",
            background: active === f.id ? `${f.color}22` : C.darkCard,
            border: `1px solid ${active === f.id ? f.color : C.darkBorder}`,
            borderRadius: 8, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 16 }}>{f.icon}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: active === f.id ? f.color : C.muted, fontFamily: "'Georgia', serif" }}>{f.title}</div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>FOR {f.who.toUpperCase()}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{
        display: "flex", gap: 20, flexWrap: "wrap",
        background: C.darkCard, border: `1px solid ${C.darkBorder}`,
        borderTop: `3px solid ${feature.color}`,
        borderRadius: 12, padding: "28px 24px",
      }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>{feature.icon}</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: "'Georgia', serif" }}>{feature.title}</div>
              <Badge text={`For ${feature.who}`} color={feature.color} />
            </div>
          </div>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: C.muted, lineHeight: 1.7, fontFamily: "'Georgia', serif" }}>{feature.desc}</p>
          <div style={{
            background: "#000", borderRadius: 10, overflow: "hidden",
            border: `1px solid ${feature.color}44`,
            aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 8, maxWidth: 340,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: `${feature.color}33`, border: `2px solid ${feature.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, cursor: "pointer",
            }}>▶</div>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase" }}>Preview coming soon</div>
          </div>
        </div>

        <div style={{ minWidth: 200, flex: "0 0 220px" }}>
          <div style={{ fontSize: 11, color: feature.color, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14, fontWeight: 700 }}>
            Capabilities
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {feature.features.map((feat, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: `${feature.color}22`, border: `1px solid ${feature.color}55`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: feature.color, flexShrink: 0, marginTop: 1,
                }}>✓</div>
                <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, fontFamily: "'Georgia', serif" }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────── */
export default function NetballSportPage() {
  const [tab, setTab] = useState("positions");
  const tabs = [
    { id: "positions", label: "Court Positions", icon: "🏐" },
    { id: "drills",    label: "Training Drills",  icon: "💪" },
    { id: "rules",     label: "Key Rules",        icon: "📋" },
    { id: "leagues",   label: "Junior Leagues",   icon: "🏆" },
  ];

  return (
    <div style={{ background: C.dark, minHeight: "100vh", color: C.text }}>
      <NetballHero />

      {/* Tab bar */}
      <div style={{
        background: C.darkCard,
        borderBottom: `1px solid ${C.darkBorder}`,
        display: "flex", padding: "0 16px", overflowX: "auto",
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "14px 18px",
            background: "transparent", border: "none",
            borderBottom: tab === t.id ? `2px solid ${C.goldLight}` : "2px solid transparent",
            cursor: "pointer",
            color: tab === t.id ? C.goldLight : C.muted,
            fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
            fontFamily: "'Georgia', serif",
            display: "flex", alignItems: "center", gap: 6,
            flexShrink: 0, transition: "all 0.15s",
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {tab === "positions" && <PositionsTab />}
        {tab === "drills"    && <DrillsTab />}
        {tab === "rules"     && <RulesTab />}
        {tab === "leagues"   && <LeaguesTab />}
      </div>

      {/* Video system */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <VideoSystem />
      </div>
    </div>
  );
}
