"use client";

import { useState } from "react";
import { Users, Shield, Star, Activity, Trophy, ChevronRight } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Skill {
  name: string;
  description: string;
  level: 1 | 2 | 3;
}

interface WeekSession {
  day: string;
  session: string;
  duration: string;
  focus: string;
}

interface AgeGroup {
  id: string;
  label: string;
  ages: string;
  emoji: string;
  playerCount: number;
  coachName: string;
  philosophy: string;
  tagline: string;
  keyRules: string[];
  weeklyFocus: string[];
  skills: Skill[];
  weekPlan: WeekSession[];
  injuries: string[];
  talent_signs: string[];
}

type AgeSub = "overview" | "plan" | "skills" | "safety" | "talent";

// ── Data ───────────────────────────────────────────────────────────────────────

const AGE_GROUPS: AgeGroup[] = [
  {
    id: "tiny",
    label: "Tiny Stars",
    ages: "U6–U8",
    emoji: "⭐",
    playerCount: 24,
    coachName: "Ms. Dziva",
    philosophy: "Fun first. Every child is a winner. We plant the love of the game before teaching any technique. Games, songs, and laughter are our tools.",
    tagline: "Plant the seed. Every child belongs.",
    keyRules: [
      "No scores kept — participation is the only goal",
      "Every player gets equal game time, no exceptions",
      "Celebrate effort, never results",
      "No tactical instructions — just let them play",
      "Parents cheer from the sideline, never coach",
    ],
    weeklyFocus: ["Ball familiarity", "Running with the ball", "Kicking for fun", "Social play"],
    skills: [
      { name: "Ball Confidence", description: "Comfortable with the ball at feet — dribbles freely without fear", level: 1 },
      { name: "Kicking", description: "Can strike a stationary ball with dominant foot", level: 1 },
      { name: "Running", description: "Moves freely with and without the ball", level: 1 },
    ],
    weekPlan: [
      { day: "Monday",    session: "Free Play",    duration: "45 min", focus: "Ball exploration — no structured drills" },
      { day: "Wednesday", session: "Fun Games",    duration: "45 min", focus: "Dribbling games, tag, movement" },
      { day: "Friday",    session: "Mini Match",   duration: "30 min", focus: "3v3 on small pitch — no positions" },
    ],
    injuries: [
      "No contact drills — avoid collisions at all times",
      "Always warm up with a light jog and dynamic stretches",
      "Proper footwear mandatory — no bare feet on grass or astroturf",
      "Hydration break every 15 minutes in hot weather",
    ],
    talent_signs: [
      "Natural comfort with the ball — no hesitation when it arrives",
      "Eagerness to play — always wants the ball",
      "Coordination visibly beyond peers when running and turning",
      "Quick to pick up new games and movements",
    ],
  },
  {
    id: "grassroots",
    label: "Grassroots",
    ages: "U10–U12",
    emoji: "🌱",
    playerCount: 32,
    coachName: "Mr. Mapfunde",
    philosophy: "Introduction to the game's building blocks. Technique before tactics. We teach 1v1 skills, basic passing, and how to enjoy small-sided games with teammates.",
    tagline: "Learn the basics. Love the game.",
    keyRules: [
      "7v7 format — smaller pitch means more touches per player",
      "Encourage taking players on 1v1 — never shout 'get rid of it'",
      "Mistakes are expected and celebrated as learning moments",
      "All players rotate through different positions each session",
      "Coaching feedback only between sessions, not during matches",
    ],
    weeklyFocus: ["Dribbling technique", "Passing accuracy", "First touch control", "Small-sided games"],
    skills: [
      { name: "First Touch", description: "Controls the ball with chest, thigh, or foot within 1–2 touches", level: 1 },
      { name: "Passing",     description: "Can play a 10m pass with accuracy using the inside of the foot", level: 1 },
      { name: "1v1 Dribble", description: "Beats a defender using a feint or body movement", level: 2 },
      { name: "Shooting",    description: "Shoots on target from inside the penalty area with power", level: 2 },
    ],
    weekPlan: [
      { day: "Tuesday",   session: "Technical Drills", duration: "60 min", focus: "First touch + passing circuits" },
      { day: "Thursday",  session: "1v1 Skills",       duration: "60 min", focus: "Dribbling past defenders in corridors" },
      { day: "Saturday",  session: "Match Day",        duration: "90 min", focus: "7v7 game — let them express themselves" },
    ],
    injuries: [
      "Warm up: 10 min dynamic stretching before any drills",
      "No headers — brain development risk at this age group",
      "Report any ankle rolls immediately — never play through pain",
      "Rest 48 hours minimum after any muscle strain",
    ],
    talent_signs: [
      "Exceptional ball control compared to peers of same age",
      "Naturally finds space — early signs of game intelligence",
      "Two-footedness or a surprisingly strong weaker foot",
      "Composure under pressure in 1v1 situations",
      "Leadership — organises teammates without being asked",
    ],
  },
  {
    id: "rising",
    label: "Rising Stars",
    ages: "U13–U15",
    emoji: "🚀",
    playerCount: 28,
    coachName: "Mr. Chikwanda",
    philosophy: "Tactical awareness begins. We introduce positions, pressing, and team shape. Individual technique must now combine with team understanding for NASH competition.",
    tagline: "Rise. The game is getting serious.",
    keyRules: [
      "11v11 format begins at U14 — full pitch",
      "Set positions introduced but players still rotate monthly",
      "Pressing triggers taught: back pass = press trigger",
      "NASH Championship eligibility begins — represent the school",
      "Academic performance must stay above 50% to train",
    ],
    weeklyFocus: ["Pressing shape", "Positional awareness", "Set pieces", "Physical conditioning"],
    skills: [
      { name: "Pressing Trigger",  description: "Recognises the back pass cue and initiates press with teammates", level: 2 },
      { name: "Positioning",       description: "Holds team shape both in and out of possession", level: 2 },
      { name: "Long Passing",      description: "Switches play 30m+ with accuracy under pressure", level: 2 },
      { name: "Finishing",         description: "Clinical inside 18m with both feet in 1v1 with goalkeeper", level: 3 },
      { name: "Heading",           description: "Can defend and attack corners with confident headers", level: 2 },
    ],
    weekPlan: [
      { day: "Monday",    session: "Technical",        duration: "75 min", focus: "Passing patterns + finishing combinations" },
      { day: "Wednesday", session: "Tactical",         duration: "75 min", focus: "Shape drills + pressing sequences" },
      { day: "Friday",    session: "Set Pieces",       duration: "60 min", focus: "Corners, free kicks, throw-ins" },
      { day: "Saturday",  session: "NASH / Friendly",  duration: "90 min", focus: "Official or practice match" },
    ],
    injuries: [
      "Growth plate awareness — report any knee or ankle pain early, never ignore it",
      "Weekly rest day mandatory — Sunday recommended for full recovery",
      "No double training sessions without a minimum 48-hour gap",
      "Hamstring stretching routine mandatory after every single session",
    ],
    talent_signs: [
      "Positional maturity — reads the game two moves ahead",
      "Physical development beyond age group: pace, strength, aerial ability",
      "High technical floor with both feet under match pressure",
      "Mental resilience — performance improves in big NASH matches",
      "ZIFA Under-15 national team pool candidate",
    ],
  },
  {
    id: "elite",
    label: "Academy Elite",
    ages: "U16–U18",
    emoji: "🏆",
    playerCount: 20,
    coachName: "Mr. Sibanda",
    philosophy: "Performance environment. Every session is a trial. We compete at NASH national level and prepare players for the Zimbabwe Sables pathway. Excellence is non-negotiable.",
    tagline: "Elite mindset. National ambition.",
    keyRules: [
      "NASH Championship first team — top priority each term",
      "Full 11v11 with weekly tactical periodisation plan",
      "Video analysis session after every competitive match",
      "Strength & conditioning programme twice per week",
      "Scout showcases held each term — agents and clubs invited",
    ],
    weeklyFocus: ["Tactical periodisation", "Individual excellence", "Set piece mastery", "Physical peak performance"],
    skills: [
      { name: "Tactical Intelligence",   description: "Adapts positional role to match situation without instruction from coach", level: 3 },
      { name: "Physical Excellence",     description: "Covers 11km+ per match. Sprint speed 28km/h+. Recovers within 72 hours", level: 3 },
      { name: "Set Piece Execution",     description: "Delivers and attacks from all standard set piece scenarios at pace", level: 3 },
      { name: "Pressure Performance",    description: "Maintains technical quality in NASH national championship fixtures", level: 3 },
    ],
    weekPlan: [
      { day: "Monday",    session: "Recovery + Video",   duration: "90 min",  focus: "Match review, light activation, ice" },
      { day: "Tuesday",   session: "Technical",          duration: "90 min",  focus: "Individual skill refinement per position" },
      { day: "Wednesday", session: "Strength & Cond.",   duration: "75 min",  focus: "Gym + speed and agility work" },
      { day: "Thursday",  session: "Tactical",           duration: "90 min",  focus: "Shape for next opposition" },
      { day: "Friday",    session: "Set Pieces + Team",  duration: "60 min",  focus: "Set piece preparation + team selection" },
      { day: "Saturday",  session: "NASH Match",         duration: "120 min", focus: "Official championship fixture" },
    ],
    injuries: [
      "Weekly physio assessment mandatory for all squad players",
      "Load monitoring: maximum 3 high-intensity sessions per week",
      "Report any hamstring tightness immediately — never train through it",
      "Ice bath protocol after all matches exceeding 70 minutes",
    ],
    talent_signs: [
      "NASH championship performer — delivers in semi-finals and finals",
      "Zimbabwe Sables Under-20 national team radar",
      "Professional trial invitations from Dynamos, Highlanders, or CAPS",
      "European scout visibility through GrassRoots showcase platform",
      "Academic + sport dual excellence — role model for the academy",
    ],
  },
  {
    id: "senior",
    label: "Senior",
    ages: "18+",
    emoji: "🦁",
    playerCount: 16,
    coachName: "Mr. Mhuru",
    philosophy: "The bridge to professional football. We compete in the ZIFA Northern Region league and prepare our graduates for professional contracts. Every match is a live showcase.",
    tagline: "This is where careers begin.",
    keyRules: [
      "ZIFA registered team — competes in Northern Region league",
      "Full professional training methodology and standards",
      "Dual mission: win matches AND develop players for contracts",
      "Player welfare and futures above all results",
      "Monthly individual progress reviews with each player",
    ],
    weeklyFocus: ["Professional standards", "League performance", "Contract readiness", "Mental resilience"],
    skills: [
      { name: "Professional Standard",   description: "Matches intensity and quality expected at Division 1 or Premier League level", level: 3 },
      { name: "Leadership",              description: "Leads by example on and off the pitch — inspires younger academy players", level: 3 },
      { name: "Contract Readiness",      description: "GrassRoots profile, stats, and showcase footage ready for professional submission", level: 3 },
    ],
    weekPlan: [
      { day: "Monday",    session: "Recovery",        duration: "45 min",  focus: "Pool / ice / light stretching and review" },
      { day: "Tuesday",   session: "Tactical",        duration: "90 min",  focus: "Opposition analysis and shape work" },
      { day: "Thursday",  session: "Technical + Phys",duration: "90 min",  focus: "Match sharpness and set pieces" },
      { day: "Friday",    session: "Pre-match Prep",  duration: "60 min",  focus: "Set pieces, team shape, final selection" },
      { day: "Saturday",  session: "ZIFA Match",      duration: "120 min", focus: "Northern Region league fixture" },
    ],
    injuries: [
      "Mandatory medical clearance before annual league registration",
      "Player insurance policy required — all competitive fixtures",
      "Concussion protocol: minimum 7-day rest, no exceptions",
      "Nutrition plan reviewed quarterly with coach and physio",
    ],
    talent_signs: [
      "Division 1 or Premier League trial offer received",
      "International scouting visibility confirmed",
      "Consistent ZIFA league performance metrics month over month",
      "GrassRoots platform showcase: 500+ scout views",
    ],
  },
];

const SUB_TABS: { key: AgeSub; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview",    icon: Activity },
  { key: "plan",     label: "Weekly Plan", icon: Trophy   },
  { key: "skills",   label: "Skills",      icon: Star     },
  { key: "safety",   label: "Safety",      icon: Shield   },
  { key: "talent",   label: "Talent Signs",icon: Users    },
];

const LEVEL_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "Foundation", color: "#2563eb", bg: "#eff6ff" },
  2: { label: "Developing",  color: "#d97706", bg: "#fffbeb" },
  3: { label: "Elite",       color: "#16a34a", bg: "#f0fdf4" },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function SkillBadge({ level }: { level: 1 | 2 | 3 }) {
  const s = LEVEL_LABELS[level];
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, backgroundColor:s.bg, color:s.color, border:`1px solid ${s.color}33` }}>
      {s.label}
    </span>
  );
}

function WeekPlanCard({ sessions }: { sessions: WeekSession[] }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {sessions.map((s) => (
        <div key={s.day} style={{ display:"grid", gridTemplateColumns:"90px 1fr", gap:12, backgroundColor:"#fafafa", borderRadius:10, padding:"12px 16px", border:"1px solid #f0f0f0" }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#1a5c2a" }}>{s.day}</div>
            <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{s.duration}</div>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#1a1a1a" }}>{s.session}</div>
            <div style={{ fontSize:12, color:"#555", marginTop:2, lineHeight:1.4 }}>{s.focus}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AgeGroupDetail({ group }: { group: AgeGroup }) {
  const [sub, setSub] = useState<AgeSub>("overview");

  return (
    <div>
      {/* Group header */}
      <div style={{ backgroundColor:"#1a5c2a", borderRadius:"14px 14px 0 0", padding:"20px 24px", color:"#fff" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:40 }}>{group.emoji}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:20 }}>{group.label} <span style={{ fontSize:14, opacity:0.75 }}>({group.ages})</span></div>
            <div style={{ fontSize:13, opacity:0.8, marginTop:2 }}>{group.tagline}</div>
          </div>
          <div style={{ marginLeft:"auto", textAlign:"right" }}>
            <div style={{ fontSize:24, fontWeight:800 }}>{group.playerCount}</div>
            <div style={{ fontSize:11, opacity:0.7 }}>players</div>
          </div>
        </div>
        <div style={{ marginTop:12, fontSize:12, opacity:0.7 }}>
          Coach: <strong style={{ opacity:1 }}>{group.coachName}</strong>
        </div>
      </div>

      {/* Sub-tab bar */}
      <div style={{ backgroundColor:"#fff", borderBottom:"1px solid #e5e5e5", display:"flex", overflowX:"auto" }}>
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          const active = sub === t.key;
          return (
            <button key={t.key} onClick={() => setSub(t.key)}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"10px 16px", border:"none", cursor:"pointer", fontSize:12, fontWeight:active?700:500, whiteSpace:"nowrap",
                color:active?"#1a5c2a":"#666", borderBottom:active?"2px solid #1a5c2a":"2px solid transparent", backgroundColor:"transparent" }}>
              <Icon size={13} />{t.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tab content */}
      <div style={{ backgroundColor:"#fff", borderRadius:"0 0 14px 14px", padding:24, border:"1px solid #e5e5e5", borderTop:"none" }}>

        {/* Overview */}
        {sub === "overview" && (
          <div>
            <p style={{ fontSize:14, color:"#444", lineHeight:1.7, marginBottom:20 }}>{group.philosophy}</p>
            <h4 style={{ fontSize:12, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Key Rules</h4>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {group.keyRules.map((rule, i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", backgroundColor:"#f0fdf4", border:"1px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:"#1a5c2a" }}>{i+1}</span>
                  </div>
                  <span style={{ fontSize:13, color:"#555", lineHeight:1.5 }}>{rule}</span>
                </div>
              ))}
            </div>
            <h4 style={{ fontSize:12, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.07em", marginTop:20, marginBottom:10 }}>Weekly Focus Areas</h4>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {group.weeklyFocus.map((f) => (
                <span key={f} style={{ fontSize:12, padding:"5px 12px", borderRadius:20, backgroundColor:"#f0fdf4", color:"#1a5c2a", fontWeight:600, border:"1px solid #bbf7d0" }}>{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Plan */}
        {sub === "plan" && (
          <div>
            <p style={{ fontSize:13, color:"#888", marginBottom:16 }}>
              Training schedule for {group.label} ({group.ages}). Adapt to school calendar as needed.
            </p>
            <WeekPlanCard sessions={group.weekPlan} />
          </div>
        )}

        {/* Skills Ladder */}
        {sub === "skills" && (
          <div>
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              {[1,2,3].map((l) => {
                const s = LEVEL_LABELS[l];
                return (
                  <span key={l} style={{ fontSize:11, padding:"3px 10px", borderRadius:20, backgroundColor:s.bg, color:s.color, fontWeight:700, border:`1px solid ${s.color}33` }}>
                    {s.label}
                  </span>
                );
              })}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {group.skills.map((sk) => (
                <div key={sk.name} style={{ padding:"14px 16px", borderRadius:10, border:"1px solid #f0f0f0", backgroundColor:"#fafafa" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:"#1a1a1a" }}>{sk.name}</span>
                    <SkillBadge level={sk.level} />
                  </div>
                  <p style={{ fontSize:13, color:"#666", lineHeight:1.5, margin:0 }}>{sk.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Rules */}
        {sub === "safety" && (
          <div>
            <div style={{ backgroundColor:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
              <p style={{ fontSize:13, color:"#dc2626", fontWeight:600, margin:0 }}>
                All coaches must review these rules with players at the start of every term.
              </p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {group.injuries.map((rule, i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"12px 16px", borderRadius:10, border:"1px solid #fee2e2", backgroundColor:"#fff5f5" }}>
                  <Shield size={16} color="#dc2626" style={{ flexShrink:0, marginTop:2 }} />
                  <span style={{ fontSize:13, color:"#555", lineHeight:1.5 }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Talent Signs */}
        {sub === "talent" && (
          <div>
            <p style={{ fontSize:13, color:"#888", marginBottom:16 }}>
              Signs that a player in this age group may be ready for the next level or national selection.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {group.talent_signs.map((sign, i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"12px 16px", borderRadius:10, border:"1px solid #fde68a", backgroundColor:"#fffbeb" }}>
                  <Star size={16} color="#c8962a" style={{ flexShrink:0, marginTop:2 }} />
                  <span style={{ fontSize:13, color:"#555", lineHeight:1.5 }}>{sign}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DirectorOverview() {
  const totalPlayers = AGE_GROUPS.reduce((s, g) => s + g.playerCount, 0);
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:28 }}>
        {[
          { label:"Total Players",  value:totalPlayers, color:"#1a5c2a", bg:"#f0fdf4" },
          { label:"Age Groups",     value:AGE_GROUPS.length, color:"#2563eb", bg:"#eff6ff" },
          { label:"Coaching Staff", value:AGE_GROUPS.length, color:"#7c3aed", bg:"#faf5ff" },
          { label:"NASH Teams",     value:3,             color:"#c8962a", bg:"#fffbeb" },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor:s.bg, border:`1px solid ${s.color}22`, borderRadius:12, padding:"18px 20px" }}>
            <div style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:13, color:"#555", marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize:14, fontWeight:700, color:"#555", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:14 }}>All Age Groups</h3>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {AGE_GROUPS.map((g) => (
          <div key={g.id} style={{ backgroundColor:"#fff", border:"1px solid #e5e5e5", borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:32 }}>{g.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15, color:"#1a1a1a" }}>{g.label} <span style={{ fontSize:12, color:"#888", fontWeight:400 }}>({g.ages})</span></div>
              <div style={{ fontSize:12, color:"#888", marginTop:2 }}>Coach: {g.coachName}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontWeight:700, fontSize:18, color:"#1a5c2a" }}>{g.playerCount}</div>
              <div style={{ fontSize:11, color:"#aaa" }}>players</div>
            </div>
            <div style={{ fontSize:12, color:"#555", maxWidth:280, lineHeight:1.4 }}>{g.tagline}</div>
            <ChevronRight size={16} color="#aaa" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

export function AcademyPanel() {
  const [selected,      setSelected]      = useState<string | null>(null);
  const [directorView,  setDirectorView]  = useState(false);

  const activeGroup = AGE_GROUPS.find((g) => g.id === selected);

  return (
    <div>
      {/* Panel header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, color:"#1a1a1a", margin:0 }}>Football Academy</h2>
          <p style={{ fontSize:13, color:"#888", margin:"4px 0 0" }}>Age-group programmes from U6 through to Senior</p>
        </div>
        <button
          onClick={() => { setDirectorView((v) => !v); setSelected(null); }}
          style={{ padding:"8px 16px", borderRadius:8, border:"1.5px solid #1a5c2a", backgroundColor: directorView ? "#1a5c2a" : "#fff", color: directorView ? "#fff" : "#1a5c2a", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          {directorView ? "Group View" : "Director View"}
        </button>
      </div>

      {/* Director overview */}
      {directorView && <DirectorOverview />}

      {/* Group selector + detail */}
      {!directorView && (
        <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:20, alignItems:"start" }}>
          {/* Sidebar — age group list */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {AGE_GROUPS.map((g) => {
              const active = selected === g.id;
              return (
                <button key={g.id} onClick={() => setSelected(active ? null : g.id)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:10,
                    border: active ? "1.5px solid #1a5c2a" : "1.5px solid #e5e5e5",
                    backgroundColor: active ? "#f0fdf4" : "#fff",
                    cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
                  <span style={{ fontSize:22 }}>{g.emoji}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color: active ? "#1a5c2a" : "#1a1a1a" }}>{g.label}</div>
                    <div style={{ fontSize:11, color:"#888" }}>{g.ages} · {g.playerCount} players</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div>
            {!activeGroup ? (
              <div style={{ backgroundColor:"#fff", border:"1.5px dashed #e5e5e5", borderRadius:14, padding:48, textAlign:"center" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🏫</div>
                <p style={{ fontWeight:700, fontSize:16, color:"#1a1a1a", marginBottom:6 }}>Select an age group</p>
                <p style={{ fontSize:13, color:"#888" }}>Choose a group from the left to view their programme, training plan, skills ladder, and talent signs.</p>
              </div>
            ) : (
              <AgeGroupDetail group={activeGroup} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
