"use client";
// src/app/school/hub/page.tsx
// GRS School Hub — Primary & Secondary School Football Programme
// All age groups · All features · Academic + Sport integration

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, Trophy, Users, Calendar, Bell, ChevronRight,
  Shield, Star, TrendingUp, CheckCircle2, AlertCircle,
  Target, Award, Heart, Activity, GraduationCap,
  MessageSquare, Wallet, Zap, Flame, Leaf, Home,
  ClipboardList, ArrowUpRight, Medal, BarChart3,
} from "lucide-react";

const G    = "#1a5c2a";
const GOLD = "#c8962a";

// ─── School Level Config ──────────────────────────────────────────────────────
type SchoolLevel = "primary" | "secondary";
type ViewMode    = "overview" | "agegroup" | "league" | "academic" | "parents";

interface SchoolGrade {
  id:          string;
  label:       string;
  ages:        string;
  ageGroup:    string;
  level:       SchoolLevel;
  emoji:       string;
  color:       string;
  playerCount: number;
  coachName:   string;
  philosophy:  string;
  weekPlan: { day:string; time:string; duration:string; focus:string; drill:string; equipment:string }[];
  skills: { name:string; badge:"bronze"|"silver"|"gold"|"elite"; how:string }[];
  safetyRules: string[];
  academicRules: string[];
  talentSigns: string[];
  scholarshipInfo?: string;
}

const SCHOOL_GRADES: SchoolGrade[] = [
  // ── PRIMARY ───────────────────────────────────────────────────────────────
  {
    id:"grade1_3", label:"Grade 1-3", ages:"Age 6-9", ageGroup:"U6-U9",
    level:"primary", emoji:"⭐", color:"#f59e0b", playerCount:32, coachName:"Coach Tendai",
    philosophy:"At this age football is purely play. Every child runs, kicks, and laughs. No formations, no scores, no pressure. The only goal is to make every child love the ball.",
    weekPlan:[
      { day:"Tuesday",   time:"14:30", duration:"30 min", focus:"Ball Play",    drill:"Free dribbling — each child has a ball and follows the coach", equipment:"1 ball per child" },
      { day:"Thursday",  time:"14:30", duration:"30 min", focus:"Kicking Fun",  drill:"Kick the ball into the goal — celebrate every attempt",         equipment:"Balls, 2 small goals" },
      { day:"Saturday",  time:"09:00", duration:"30 min", focus:"Mini Game",    drill:"3v3 — no rules, just play. Every child plays.",                  equipment:"Balls, bibs, cones" },
    ],
    skills:[
      { name:"Can dribble 10 metres",        badge:"bronze", how:"Dribbles ball from cone A to cone B without stopping" },
      { name:"Can kick into a goal",         badge:"bronze", how:"Scores 1 out of 3 shots at a small goal" },
      { name:"Passes to a friend",           badge:"silver", how:"Rolls or kicks ball to a partner 3 metres away" },
      { name:"Runs with ball under control", badge:"silver", how:"Dribbles across the width of the pitch without losing the ball" },
    ],
    safetyRules:[
      "No heading — ever at this age. Brains are still developing.",
      "Maximum 30 minutes per session — young bodies fatigue quickly",
      "Every child touches the ball at least once per minute",
      "Grass or soft surface only — no concrete",
      "Parent or teacher must be present at every session",
    ],
    academicRules:[
      "Sport does not interfere with classroom time — sessions only after school or on Saturday",
      "Teachers flag any child who is struggling academically — coach reduces their training load that week",
      "Sport is used as a reward and motivator for good classroom behaviour",
    ],
    talentSigns:[
      "Naturally comfortable with the ball — dribbles without looking at their feet",
      "Shows balance and coordination advanced for their age",
      "Instinctively moves into open space",
      "Wants to keep playing after the session ends every time",
    ],
  },
  {
    id:"grade4_5", label:"Grade 4-5", ages:"Age 10-12", ageGroup:"U10-U12",
    level:"primary", emoji:"🌱", color:G, playerCount:28, coachName:"Coach Farai",
    philosophy:"First real football. Players learn their first position, their first passing combination, and what it feels like to work as a team. Still fun-first but now with structure and simple tactics.",
    weekPlan:[
      { day:"Monday",    time:"15:00", duration:"45 min", focus:"Passing",        drill:"Partner passing — 10 metres, 20 passes each foot",                         equipment:"2 balls per pair, cones" },
      { day:"Wednesday", time:"15:00", duration:"45 min", focus:"Dribbling",      drill:"Cone slalom with weak foot — 6 cones, dribble and return",                  equipment:"6 cones per player, balls" },
      { day:"Friday",    time:"15:00", duration:"45 min", focus:"Shooting",       drill:"Drive and shoot — dribble from halfway, shoot at goal",                     equipment:"Goals, balls" },
      { day:"Saturday",  time:"09:00", duration:"60 min", focus:"7v7 Match",      drill:"Full 7v7 match with coaching stops for positioning",                        equipment:"Full pitch, bibs, ball" },
    ],
    skills:[
      { name:"First touch — right foot",    badge:"bronze", how:"Controls a moving pass from 5 metres with the right foot" },
      { name:"First touch — left foot",     badge:"bronze", how:"Controls a moving pass from 5 metres with the left foot" },
      { name:"Pass — 10 metres accurate",   badge:"silver", how:"Passes to a stationary target 10 metres away 4 out of 5 times" },
      { name:"Shoot with laces",            badge:"silver", how:"Strikes a clean shot with the laces that reaches the goal" },
      { name:"Hold a position for 5 mins",  badge:"gold",   how:"Stays in their assigned zone for a full 5-minute period without drifting" },
    ],
    safetyRules:[
      "No heading in training — only in matches with a soft ball",
      "Knee pain during growth spurts — report immediately to coach",
      "Dynamic warm-up mandatory before every session — 10 minutes minimum",
      "Boots must fit properly — check every half-term as feet grow quickly",
    ],
    academicRules:[
      "Any player failing two or more subjects is moved to 'development sessions' only — no competitive matches",
      "Grade 5 players beginning O-Level prep get a study period built into Saturday sessions",
      "Coach liaises with class teacher termly to monitor academic standing",
      "Players who improve academically are celebrated in the team just like scoring a goal",
    ],
    talentSigns:[
      "Controls the ball on both feet automatically — does not have to think about it",
      "Reads the game 1-2 seconds ahead of peers",
      "Maintains energy for the full 45-minute session without tiring",
      "Communicates and organises teammates naturally",
    ],
  },
  {
    id:"grade6_7", label:"Grade 6-7", ages:"Age 12-14", ageGroup:"U12-U14",
    level:"primary", emoji:"🔥", color:"#dc2626", playerCount:24, coachName:"Coach Blessing",
    philosophy:"The bridge between primary and secondary school football. Players start understanding formations, taking positions seriously, and preparing for secondary school sport. AI biomechanical testing begins at Grade 7.",
    weekPlan:[
      { day:"Monday",    time:"15:00", duration:"60 min", focus:"Technical",     drill:"Position-specific skill circuit — groups by position",                      equipment:"Cones, balls, bibs" },
      { day:"Wednesday", time:"15:00", duration:"60 min", focus:"Tactics",       drill:"Tactical walk-through then 8v8 with coaching stops",                        equipment:"Full pitch, bibs, cones" },
      { day:"Friday",    time:"15:00", duration:"45 min", focus:"Set Pieces",    drill:"Corner and free kick routines — attack and defence both",                   equipment:"Full pitch, cones, balls" },
      { day:"Saturday",  time:"09:00", duration:"75 min", focus:"11v11 Match",   drill:"Competitive match vs another school",                                        equipment:"Full match setup" },
    ],
    skills:[
      { name:"Understands their position",      badge:"silver", how:"Can explain their defensive and attacking responsibilities" },
      { name:"Passing range — 15 metres",       badge:"silver", how:"Accurate pass to a moving player at 15 metres" },
      { name:"1v1 defending basics",            badge:"gold",   how:"Delays an attacker and forces them wide in a 1v1 drill" },
      { name:"First GRS Athletic Test",         badge:"gold",   how:"Completes the GRS 6-test battery and receives a score" },
      { name:"Set piece role",                  badge:"elite",  how:"Executes assigned role in corner and free kick routines consistently" },
    ],
    safetyRules:[
      "GRS AI biomechanical screening begins at Grade 7 — detects ACL and knee risk early",
      "Growth plate injuries possible — any bone pain must be checked by a doctor",
      "No adult-weight strength training — body weight only",
      "Heading limited to set pieces only with proper technique taught first",
    ],
    academicRules:[
      "Grade 7 national exam period — all sport paused for 3 weeks before exams",
      "Players who fail Grade 7 cannot join secondary school football team until academic standing improves",
      "Talent Passport activated at Grade 7 — academic scores included alongside athletic scores",
    ],
    talentSigns:[
      "GRS Athletic score above 65 — ahead of primary school benchmarks",
      "Already standing out in matches against older age groups",
      "Technical ability does not decline under fatigue",
      "Secondary school coaches are already asking about this player",
    ],
  },

  // ── SECONDARY ─────────────────────────────────────────────────────────────
  {
    id:"form1_2", label:"Form 1-2", ages:"Age 13-15", ageGroup:"U13-U15",
    level:"secondary", emoji:"⚡", color:"#2563eb", playerCount:26, coachName:"Coach Simba",
    philosophy:"Serious football begins. Full 11v11, real formations, real tactics, and AI analysis. Academic performance is monitored closely — the two must grow together. This is when scouts begin paying attention.",
    weekPlan:[
      { day:"Monday",    time:"15:30", duration:"75 min", focus:"Technical",       drill:"Position-specific drills — each group has tailored exercises",             equipment:"Cones, balls, bibs" },
      { day:"Tuesday",   time:"15:30", duration:"75 min", focus:"Tactical",        drill:"Formation training — 11v11 with tactical pauses",                         equipment:"Full pitch, cones, bibs" },
      { day:"Wednesday", time:"15:30", duration:"60 min", focus:"Fitness",         drill:"Interval running + bodyweight circuit",                                    equipment:"Cones, grass" },
      { day:"Friday",    time:"15:30", duration:"60 min", focus:"Set Pieces",      drill:"Corner, free kick, and throw-in routines",                                equipment:"Full pitch, cones, balls" },
      { day:"Saturday",  time:"09:00", duration:"90 min", focus:"NASH Match",      drill:"Competitive NASH fixture — GRS AI tracking",                              equipment:"Full match + AI camera" },
    ],
    skills:[
      { name:"Position mastery — primary position",  badge:"silver", how:"Executes all primary position responsibilities in matches" },
      { name:"GRS Athletic Test — Bronze",           badge:"bronze", how:"Scores 50+ on GRS Athletic Battery" },
      { name:"GRS Athletic Test — Silver",           badge:"silver", how:"Scores 65+ on GRS Athletic Battery" },
      { name:"Tactical understanding",               badge:"gold",   how:"Can explain and demonstrate the team's shape in and out of possession" },
      { name:"Video analysis participation",         badge:"gold",   how:"Attends video review and identifies 2 personal improvement areas" },
    ],
    safetyRules:[
      "Full MediaPipe ACL screening before the season — mandatory for all Form 1-2 players",
      "High injury risk during growth spurts — monitor knee and hip pain closely",
      "Mental health check-ins — secondary school transition is stressful",
      "No supervised strength training sessions without a qualified fitness coach",
    ],
    academicRules:[
      "Minimum C grade in all core subjects to play in NASH competitions",
      "Mid-term academic report shared between class teacher and coach",
      "Players below grade threshold train but do not compete until grades improve",
      "Study periods built into Wednesday fitness sessions for players in academic difficulty",
    ],
    talentSigns:[
      "NASH coach or opposing school coaches asking about the player",
      "GRS Athletic score above 70 — ahead of Form 1-2 benchmarks",
      "Technical ability visible even in low-quality footage",
      "Comfortable playing up an age group",
    ],
    scholarshipInfo: "Form 2 players who maintain a B average and GRS score above 70 enter the scholarship tracking system. Target: UK, South Africa, and USA university programmes.",
  },
  {
    id:"form3_4", label:"Form 3-4", ages:"Age 15-17", ageGroup:"U15-U17",
    level:"secondary", emoji:"🏆", color:"#7c3aed", playerCount:22, coachName:"Coach Kudzi",
    philosophy:"O-Level years. Football and academics must coexist. Training load reduces during exam terms automatically. Players build their Talent Passport and prepare for international exposure. The best players here attract real scout interest.",
    weekPlan:[
      { day:"Monday",    time:"15:30", duration:"90 min", focus:"Tactical Training",    drill:"Opponent-specific session — analysis of next fixture",                equipment:"Full pitch, cones, bibs" },
      { day:"Wednesday", time:"15:30", duration:"75 min", focus:"Technical + Fitness",  drill:"Position drills then interval conditioning",                          equipment:"Cones, balls, resistance bands" },
      { day:"Friday",    time:"15:30", duration:"60 min", focus:"Set Pieces",           drill:"Advanced routines — attacking and defensive dead balls",               equipment:"Full pitch, cones, balls" },
      { day:"Saturday",  time:"09:00", duration:"90 min", focus:"NASH/League Match",   drill:"Competitive match — full GRS AI suite active",                         equipment:"Full match setup + camera" },
    ],
    skills:[
      { name:"GRS Athletic Test — Gold",        badge:"gold",  how:"Scores 78+ on GRS Athletic Battery — provincial standard" },
      { name:"Full Talent Passport active",     badge:"gold",  how:"Profile complete with 3 video highlights and current scores" },
      { name:"O-Level academic standing",       badge:"gold",  how:"Minimum 5 subjects at C or above — scholarship eligible" },
      { name:"Scout-ready video highlight",     badge:"elite", how:"3-minute highlight reel uploaded to GRS profile" },
      { name:"Leadership role in team",         badge:"elite", how:"Captaincy, vice-captaincy, or unofficial team leader role" },
    ],
    safetyRules:[
      "Full pre-season and mid-season MediaPipe screening",
      "O-Level exam stress can affect sleep and nutrition — watch for performance drops",
      "Mental health priority — pressure from school + sport is significant at this age",
      "Load management during O-Level exam term — reduce training intensity by 40%",
    ],
    academicRules:[
      "O-Level exam term: training reduced to 2 sessions per week maximum",
      "Week before O-Level exams: training suspended entirely",
      "Players must show O-Level timetable to coach at start of exam term",
      "Any player who wants to pursue football scholarship MUST achieve minimum 5 Os",
      "Academic tutor support available for players in the scholarship programme",
    ],
    talentSigns:[
      "International scouts or agents have made direct contact through GRS",
      "GRS Athletic score above 80 — approaching national elite standard",
      "Performance in NASH competitions drawing attention from Division 1 clubs",
      "Academic standing maintained under the pressure of competitive football",
    ],
    scholarshipInfo: "Form 3-4 players with 5 O-Levels at B or above and GRS score 78+ are actively promoted to UK and USA university scouts. GRS connects directly to scholarship programme coordinators.",
  },
  {
    id:"form5_6", label:"Form 5-6", ages:"Age 17-19", ageGroup:"U17-U19",
    level:"secondary", emoji:"🎓", color:GOLD, playerCount:18, coachName:"Coach Chikwanda",
    philosophy:"The final and most important phase. A-Level results and football performance combine to determine scholarship and professional opportunities. Every session, every match, and every academic grade counts. These players are leaving school — GRS ensures they leave with options.",
    weekPlan:[
      { day:"Tuesday",   time:"16:00", duration:"90 min", focus:"Video Review + Tactics", drill:"Match analysis + opponent prep",                                   equipment:"Screen/projector, GRS analysis" },
      { day:"Thursday",  time:"16:00", duration:"75 min", focus:"Match Preparation",      drill:"Set pieces + finishing + match walk-through",                      equipment:"Full pitch, cones, balls" },
      { day:"Saturday",  time:"09:00", duration:"90 min", focus:"Competitive Match",      drill:"NASH or league fixture — GRS full AI tracking",                    equipment:"Full match setup + camera" },
    ],
    skills:[
      { name:"GRS Athletic Test — Elite",          badge:"elite", how:"Scores 88+ on GRS Athletic Battery — national elite standard" },
      { name:"A-Level academic standing",          badge:"elite", how:"Minimum 2 A-Level passes — university entrance qualification" },
      { name:"Professional Talent Passport",       badge:"elite", how:"Full profile: 5 video highlights, updated athletic scores, academic transcript" },
      { name:"Scout engagement",                   badge:"elite", how:"Has been contacted by at least 1 registered scout or agent through GRS" },
      { name:"Scholarship application submitted",  badge:"elite", how:"Has submitted at least 1 university or scholarship application" },
    ],
    safetyRules:[
      "A-Level stress is significant — reduce training load during study leave",
      "Any injury during this period requires immediate attention — career is at stake",
      "Mental health priority — this is the most pressured period of a young person's life",
      "Full pre-season screening before every competitive term",
    ],
    academicRules:[
      "A-Level study leave: all training suspended — academic results are the priority",
      "Players must share university and scholarship application deadlines with coach",
      "GRS scholarship pathway provides specific academic targets per university",
      "Combined academic + athletic transcript prepared for every scholarship application",
    ],
    talentSigns:[
      "Already signed or in trial with a professional club or university team",
      "GRS profile being actively reviewed by international scouts",
      "A-Level grades on track for university entrance",
      "Identified as a mentor and role model for younger academy players",
    ],
    scholarshipInfo: "Form 6 players with A-Level qualifications and GRS Elite status are submitted directly to GRS scholarship partners in the UK (English universities), USA (NCAA Division 2 and 3), and South Africa (USSA). GRS handles the initial introduction.",
  },
];

// ─── Mini League types ────────────────────────────────────────────────────────
interface LeagueFixture {
  date: string; homeTeam: string; awayTeam: string;
  homeScore: number|null; awayScore: number|null; venue: string;
}
interface LeagueTeam { name: string; played:number; won:number; drawn:number; lost:number; gf:number; ga:number; }

const SAMPLE_FIXTURES: LeagueFixture[] = [
  { date:"Sat 19 Jul", homeTeam:"Form 1A Lions",    awayTeam:"Form 1B Eagles",  homeScore:2, awayScore:1, venue:"Main Pitch" },
  { date:"Sat 19 Jul", homeTeam:"Form 2A United",   awayTeam:"Form 2B City",    homeScore:null, awayScore:null, venue:"Back Pitch" },
  { date:"Sat 26 Jul", homeTeam:"Form 1B Eagles",   awayTeam:"Form 2A United",  homeScore:null, awayScore:null, venue:"Main Pitch" },
  { date:"Sat 26 Jul", homeTeam:"Form 2B City",     awayTeam:"Form 1A Lions",   homeScore:null, awayScore:null, venue:"Back Pitch" },
  { date:"Sat 2 Aug",  homeTeam:"Form 1A Lions",    awayTeam:"Form 2B City",    homeScore:null, awayScore:null, venue:"Main Pitch" },
  { date:"Sat 2 Aug",  homeTeam:"Form 2A United",   awayTeam:"Form 1B Eagles",  homeScore:null, awayScore:null, venue:"Back Pitch" },
];

const LEAGUE_STANDINGS: LeagueTeam[] = [
  { name:"Form 1A Lions",  played:1, won:1, drawn:0, lost:0, gf:2, ga:1 },
  { name:"Form 2A United", played:0, won:0, drawn:0, lost:0, gf:0, ga:0 },
  { name:"Form 1B Eagles", played:1, won:0, drawn:0, lost:1, gf:1, ga:2 },
  { name:"Form 2B City",   played:0, won:0, drawn:0, lost:0, gf:0, ga:0 },
];

// ─── Skill badge ──────────────────────────────────────────────────────────────
function Badge({ level }: { level: string }) {
  const c: Record<string,{color:string;bg:string;label:string}> = {
    bronze:{ color:"#92400e", bg:"#fef3c7", label:"🥉 Bronze" },
    silver:{ color:"#475569", bg:"#f1f5f9", label:"🥈 Silver" },
    gold:  { color:GOLD,      bg:"#fffbeb", label:"🥇 Gold"   },
    elite: { color:"#7c3aed", bg:"#f5f3ff", label:"⚡ Elite"  },
  };
  const s = c[level] ?? c.bronze;
  return (
    <span style={{ fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:20,
      background:s.bg, color:s.color, border:`1px solid ${s.color}30` }}>
      {s.label}
    </span>
  );
}

// ─── Grade card ────────────────────────────────────────────────────────────────
function GradeCard({ grade, selected, onClick }: {
  grade:SchoolGrade; selected:boolean; onClick:()=>void;
}) {
  return (
    <button onClick={onClick} style={{
      width:"100%", textAlign:"left",
      padding:"12px 14px",
      background: selected ? grade.color+"14" : "#fff",
      border:`2px solid ${selected ? grade.color : "#e5e7eb"}`,
      borderRadius:12, cursor:"pointer", transition:"all 0.15s",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:grade.color+"18",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
          {grade.emoji}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:900, color:grade.color }}>{grade.label}</div>
          <div style={{ fontSize:10, color:"#888" }}>{grade.ages} · {grade.ageGroup}</div>
        </div>
        <div style={{ fontSize:18, fontWeight:900, color:grade.color, flexShrink:0 }}>
          {grade.playerCount}
        </div>
      </div>
    </button>
  );
}

// ─── Grade detail ─────────────────────────────────────────────────────────────
function GradeDetail({ grade }: { grade: SchoolGrade }) {
  const [tab, setTab] = useState<"programme"|"skills"|"academic"|"safety"|"talent">("programme");
  const tabs = [
    { key:"programme", label:"Training" },
    { key:"skills",    label:"Skills"   },
    { key:"academic",  label:"Academic" },
    { key:"safety",    label:"Safety"   },
    { key:"talent",    label:"Talent"   },
  ] as const;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg, ${grade.color}, ${grade.color}bb)`,
        borderRadius:16, padding:18, color:"#fff" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
          <span style={{ fontSize:32 }}>{grade.emoji}</span>
          <div>
            <div style={{ fontSize:20, fontWeight:900 }}>{grade.label}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>
              {grade.ages} · Coach: {grade.coachName}
            </div>
          </div>
          <div style={{ marginLeft:"auto", textAlign:"right" }}>
            <div style={{ fontSize:26, fontWeight:900 }}>{grade.playerCount}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.65)" }}>players</div>
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:10, padding:"10px 14px",
          fontSize:12, color:"rgba(255,255,255,0.9)", lineHeight:1.5 }}>
          {grade.philosophy}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flexShrink:0, padding:"6px 14px", borderRadius:20, border:"none",
            background: tab===t.key ? grade.color : "#f0f0f0",
            color: tab===t.key ? "#fff" : "#666",
            fontWeight: tab===t.key ? 800 : 600, fontSize:11, cursor:"pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Training Programme */}
      {tab === "programme" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {grade.weekPlan.map((s,i) => (
            <div key={i} style={{ background:"#fff", border:"1px solid #e5e7eb",
              borderRadius:12, padding:"12px 14px",
              borderLeft:`4px solid ${grade.color}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, fontWeight:900, color:grade.color }}>{s.day}</span>
                <span style={{ fontSize:10, color:"#aaa" }}>{s.time} · {s.duration}</span>
              </div>
              <div style={{ fontSize:13, fontWeight:800, color:"#111", marginBottom:4 }}>{s.focus}</div>
              <div style={{ fontSize:11, color:"#555", lineHeight:1.5, marginBottom:6 }}>{s.drill}</div>
              <div style={{ fontSize:10, color:"#888" }}><b>Equipment:</b> {s.equipment}</div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {tab === "skills" && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0",
            borderRadius:12, padding:12, fontSize:11, color:"#166534" }}>
            Coach confirms each skill. Badge appears on GRS Talent Passport.
            Parent receives WhatsApp notification when badge is earned.
          </div>
          {grade.skills.map((sk,i) => (
            <div key={i} style={{ background:"#fff", border:"1px solid #e5e7eb",
              borderRadius:12, padding:"11px 14px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#111", flex:1, marginRight:8 }}>{sk.name}</div>
                <Badge level={sk.badge} />
              </div>
              <div style={{ fontSize:11, color:"#666", lineHeight:1.5 }}>{sk.how}</div>
            </div>
          ))}
        </div>
      )}

      {/* Academic */}
      {tab === "academic" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe",
            borderRadius:12, padding:12 }}>
            <div style={{ fontSize:12, fontWeight:800, color:"#1d4ed8", marginBottom:4 }}>
              📚 Academic + Sport Balance Rules
            </div>
            <div style={{ fontSize:11, color:"#1e40af", lineHeight:1.5 }}>
              At GRS School Hub, football and academics grow together.
              A player who fails academically cannot reach their football potential.
              These rules protect both.
            </div>
          </div>
          {grade.academicRules.map((rule,i) => (
            <div key={i} style={{ display:"flex", gap:10, padding:"10px 14px",
              background:"#fff", border:"1px solid #e5e7eb", borderRadius:12 }}>
              <BookOpen size={14} color="#2563eb" style={{ flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:12, color:"#333", lineHeight:1.5 }}>{rule}</span>
            </div>
          ))}
          {grade.scholarshipInfo && (
            <div style={{ background:`linear-gradient(135deg, ${G}, #2d7a3a)`,
              borderRadius:12, padding:16, color:"#fff" }}>
              <div style={{ fontSize:12, fontWeight:800, marginBottom:6 }}>
                🎓 Scholarship Pathway
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.9)", lineHeight:1.6 }}>
                {grade.scholarshipInfo}
              </div>
              <Link href="/player/scholarship" style={{
                display:"inline-block", marginTop:10, padding:"8px 16px",
                background:GOLD, color:G, borderRadius:8,
                fontWeight:800, fontSize:11, textDecoration:"none",
              }}>
                View Scholarship Pathway →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Safety */}
      {tab === "safety" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca",
            borderRadius:12, padding:12 }}>
            <div style={{ fontSize:12, fontWeight:800, color:"#dc2626", marginBottom:2 }}>
              ⚠️ Age-Specific Safety Rules — Non-Negotiable
            </div>
            <div style={{ fontSize:11, color:"#991b1b" }}>
              Based on sports medicine research. Must be followed at every session without exception.
            </div>
          </div>
          {grade.safetyRules.map((rule,i) => (
            <div key={i} style={{ display:"flex", gap:10, padding:"10px 14px",
              background:"#fff", border:"1px solid #e5e7eb", borderRadius:12 }}>
              <Shield size={14} color="#dc2626" style={{ flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:12, color:"#333", lineHeight:1.5 }}>{rule}</span>
            </div>
          ))}
          {(grade.id==="grade1_3"||grade.id==="grade4_5") && (
            <div style={{ background:"#fffbeb", border:"1px solid #fde68a",
              borderRadius:12, padding:12 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#92400e", marginBottom:4 }}>
                🚫 No Heading Policy — Primary School
              </div>
              <div style={{ fontSize:11, color:"#92400e", lineHeight:1.6 }}>
                GRS follows FA, US Soccer, and medical consensus: no heading for players
                under 11. This is an absolute rule — no exceptions at Grade 1-5 level.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Talent */}
      {tab === "talent" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ background:`linear-gradient(135deg, ${grade.color}, ${grade.color}bb)`,
            borderRadius:12, padding:14, color:"#fff" }}>
            <div style={{ fontSize:12, fontWeight:800, marginBottom:4 }}>
              🌟 Signs of Elite Talent at {grade.label}
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.85)", lineHeight:1.5 }}>
              When you see these consistently across multiple sessions and matches,
              flag the player to the school sports director immediately.
            </div>
          </div>
          {grade.talentSigns.map((sign,i) => (
            <div key={i} style={{ display:"flex", gap:10, padding:"10px 14px",
              background:"#fff", border:"1px solid #e5e7eb", borderRadius:12 }}>
              <Star size={14} color={GOLD} style={{ flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:12, color:"#333", lineHeight:1.5 }}>{sign}</span>
            </div>
          ))}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:800, color:"#111", marginBottom:10 }}>
              When You Spot Talent — What To Do
            </div>
            {[
              { n:"1", title:"Flag to Sports Director", desc:"Document what you saw, when, and under what conditions." },
              { n:"2", title:"Activate Talent Passport", desc:"Ensure a full GRS profile exists with current scores and position." },
              { n:"3", title:"Upload Video",             desc:"Record 3-5 minutes of their best moments and upload to GRS." },
              { n:"4", title:"Tell the Parents",         desc:"Parents must know. Explain the scholarship pathway clearly." },
              { n:"5", title:"Scout Visibility",         desc:"Their profile becomes searchable to registered GRS scouts and agents." },
            ].map(s => (
              <div key={s.n} style={{ display:"flex", gap:12, marginBottom:10 }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:grade.color,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, fontWeight:900, color:"#fff", flexShrink:0 }}>
                  {s.n}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:grade.color }}>{s.title}</div>
                  <div style={{ fontSize:11, color:"#555", lineHeight:1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mini League View ─────────────────────────────────────────────────────────
function MiniLeagueView() {
  const pts = (t: LeagueTeam) => t.won*3 + t.drawn;
  const gd  = (t: LeagueTeam) => t.gf - t.ga;
  const sorted = [...LEAGUE_STANDINGS].sort((a,b) => pts(b)-pts(a) || gd(b)-gd(a));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ background:`linear-gradient(135deg,${G},#2d7a3a)`, borderRadius:16,
        padding:18, color:"#fff" }}>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)", marginBottom:4 }}>
          School Mini League
        </div>
        <div style={{ fontSize:20, fontWeight:900 }}>Inter-Form League 2026</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginTop:4 }}>
          Secondary School · Term 3 · 4 teams
        </div>
      </div>

      {/* Standings */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 16px", borderBottom:"1px solid #f0f0f0",
          fontSize:12, fontWeight:800, color:"#111" }}>
          League Table
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:G, color:"#fff" }}>
                {["Pos","Team","P","W","D","L","GF","GA","GD","Pts"].map(h => (
                  <th key={h} style={{ padding:"8px 10px", textAlign:"center",
                    fontWeight:800, fontSize:11, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((t,i) => (
                <tr key={t.name} style={{ background:i%2===0?"#f9fafb":"#fff" }}>
                  <td style={{ padding:"8px 10px", textAlign:"center", fontWeight:900,
                    color:i===0?GOLD:"#555" }}>{i+1}</td>
                  <td style={{ padding:"8px 10px", fontWeight:700, color:"#111",
                    whiteSpace:"nowrap" }}>{t.name}</td>
                  <td style={{ padding:"8px 10px", textAlign:"center" }}>{t.played}</td>
                  <td style={{ padding:"8px 10px", textAlign:"center", color:"#059669", fontWeight:700 }}>{t.won}</td>
                  <td style={{ padding:"8px 10px", textAlign:"center", color:GOLD,    fontWeight:700 }}>{t.drawn}</td>
                  <td style={{ padding:"8px 10px", textAlign:"center", color:"#dc2626",fontWeight:700}}>{t.lost}</td>
                  <td style={{ padding:"8px 10px", textAlign:"center" }}>{t.gf}</td>
                  <td style={{ padding:"8px 10px", textAlign:"center" }}>{t.ga}</td>
                  <td style={{ padding:"8px 10px", textAlign:"center",
                    color:gd(t)>0?"#059669":gd(t)<0?"#dc2626":"#555",
                    fontWeight:700 }}>{gd(t)>0?"+":""}{gd(t)}</td>
                  <td style={{ padding:"8px 10px", textAlign:"center",
                    fontWeight:900, color:G }}>{pts(t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixtures */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, padding:18 }}>
        <div style={{ fontSize:12, fontWeight:800, color:"#111", marginBottom:12 }}>
          Fixtures & Results
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {SAMPLE_FIXTURES.map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
              padding:"10px 12px", background:"#f9fafb", borderRadius:10,
              border:"1px solid #f0f0f0" }}>
              <div style={{ width:60, textAlign:"center", fontSize:10,
                fontWeight:700, color:G, flexShrink:0 }}>{f.date}</div>
              <div style={{ flex:1, fontSize:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
                  <span style={{ fontWeight:700, color:"#111", textAlign:"right", flex:1 }}>
                    {f.homeTeam}
                  </span>
                  <span style={{ fontSize:14, fontWeight:900, color:G, width:50,
                    textAlign:"center", flexShrink:0 }}>
                    {f.homeScore !== null ? `${f.homeScore} – ${f.awayScore}` : "vs"}
                  </span>
                  <span style={{ fontWeight:700, color:"#111", flex:1 }}>
                    {f.awayTeam}
                  </span>
                </div>
                <div style={{ fontSize:10, color:"#aaa", textAlign:"center", marginTop:2 }}>
                  {f.venue} · {f.homeScore !== null ? "FT" : "Upcoming"}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button style={{ width:"100%", marginTop:12, padding:"10px", background:G, color:"#fff",
          borderRadius:10, border:"none", fontWeight:700, fontSize:12, cursor:"pointer" }}>
          + Add New Fixture
        </button>
      </div>
    </div>
  );
}

// ─── Parent Communication View ────────────────────────────────────────────────
function ParentView() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ background:`linear-gradient(135deg,${G},#2d7a3a)`, borderRadius:16,
        padding:18, color:"#fff" }}>
        <div style={{ fontSize:20, fontWeight:900 }}>Parent Communication Hub</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginTop:4 }}>
          Keep parents informed and involved in their child&apos;s development
        </div>
      </div>

      {/* What parents receive */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:18 }}>
        <div style={{ fontSize:12, fontWeight:800, color:"#111", marginBottom:12 }}>
          What Parents Receive Automatically on GRS
        </div>
        {[
          { icon:<Bell size={14}/>,         color:"#2563eb", title:"Weekly WhatsApp Report",    desc:"Every Sunday at 8am — drill completions, AI scores, upcoming fixtures, and any injury alerts" },
          { icon:<Award size={14}/>,        color:GOLD,      title:"Badge Earned Notification", desc:"Instant WhatsApp when their child earns a new skill badge — parents can share with family" },
          { icon:<AlertCircle size={14}/>,  color:"#dc2626", title:"Injury Risk Alert",         desc:"Immediate notification if GRS AI flags a biomechanical risk — includes which drill fixes it" },
          { icon:<Calendar size={14}/>,     color:G,         title:"Fixture Reminder",          desc:"24 hours before every match — venue, kick-off time, and what to bring" },
          { icon:<BookOpen size={14}/>,     color:"#7c3aed", title:"Academic Alert",            desc:"If their child's academic standing affects football participation — transparent and immediate" },
          { icon:<TrendingUp size={14}/>,   color:"#059669", title:"Monthly Progress Report",   desc:"Full academic + athletic comparison — this month vs last month. Sent on the 1st of each month" },
        ].map((item,i) => (
          <div key={i} style={{ display:"flex", gap:12, padding:"10px 12px",
            background:i%2===0?"#f9fafb":"#fff", borderRadius:10, marginBottom:6 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:item.color+"18",
              display:"flex", alignItems:"center", justifyContent:"center",
              color:item.color, flexShrink:0 }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#111" }}>{item.title}</div>
              <div style={{ fontSize:11, color:"#555", lineHeight:1.5, marginTop:2 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Send message to all parents */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:18 }}>
        <div style={{ fontSize:12, fontWeight:800, color:"#111", marginBottom:10 }}>
          Send Message to All Parents
        </div>
        <select style={{ width:"100%", padding:"9px 12px", borderRadius:10,
          border:"1px solid #e5e7eb", fontSize:12, marginBottom:10, background:"#fff" }}>
          <option>All parents (all grades)</option>
          <option>Primary school parents only</option>
          <option>Secondary school parents only</option>
          <option>Grade 1-3 parents</option>
          <option>Form 5-6 parents</option>
        </select>
        <textarea rows={3} placeholder="Type your message here — sent via WhatsApp to all linked parents..."
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #e5e7eb",
            fontSize:12, resize:"none", outline:"none", boxSizing:"border-box" }} />
        <button style={{ width:"100%", marginTop:8, padding:"10px", background:G, color:"#fff",
          borderRadius:10, border:"none", fontWeight:700, fontSize:12, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <MessageSquare size={14}/> Send via WhatsApp to All Parents
        </button>
        <div style={{ fontSize:10, color:"#aaa", textAlign:"center", marginTop:6 }}>
          Delivered via GRS WhatsApp Business API
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SchoolHubPage() {
  const [view,          setView]          = useState<ViewMode>("overview");
  const [selectedGrade, setSelectedGrade] = useState<string|null>(null);
  const [levelFilter,   setLevelFilter]   = useState<"all"|"primary"|"secondary">("all");

  const filteredGrades = SCHOOL_GRADES.filter(g =>
    levelFilter === "all" || g.level === levelFilter
  );
  const activeGrade = SCHOOL_GRADES.find(g => g.id === selectedGrade);

  const totalPlayers = SCHOOL_GRADES.reduce((a,g)=>a+g.playerCount,0);

  const NAV = [
    { key:"overview",  label:"Overview",    icon:<Home size={14}/>        },
    { key:"agegroup",  label:"Age Groups",  icon:<Users size={14}/>       },
    { key:"league",    label:"Mini League", icon:<Trophy size={14}/>      },
    { key:"academic",  label:"Academic",    icon:<BookOpen size={14}/>    },
    { key:"parents",   label:"Parents",     icon:<MessageSquare size={14}/>},
  ] as const;

  return (
    <div style={{ minHeight:"100vh", background:"#f4f2ee" }}>
      {/* Header */}
      <header style={{ background:"#fff", borderBottom:"1px solid #e5e7eb",
        position:"sticky", top:0, zIndex:20 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px", height:56,
          display:"flex", alignItems:"center", gap:14 }}>
          <Link href="/" style={{ color:"#ccc", display:"flex" }}>
            <ChevronRight size={20} style={{ transform:"rotate(180deg)" }}/>
          </Link>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:900, color:"#111" }}>
              GRS School Hub
            </div>
            <div style={{ fontSize:10, color:"#aaa" }}>
              Primary &amp; Secondary · Grade 1 → Form 6 · {totalPlayers} players
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {(["all","primary","secondary"] as const).map(l => (
              <button key={l} onClick={() => setLevelFilter(l)} style={{
                padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer",
                background: levelFilter===l ? G : "#f0f0f0",
                color: levelFilter===l ? "#fff" : "#888",
                fontWeight: levelFilter===l ? 800 : 600, fontSize:11,
              }}>
                {l === "all" ? "All" : l.charAt(0).toUpperCase()+l.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px",
          display:"flex", overflowX:"auto" }}>
          {NAV.map(n => (
            <button key={n.key}
              onClick={() => { setView(n.key as ViewMode); if(n.key!=="agegroup") setSelectedGrade(null); }}
              style={{
                flexShrink:0, padding:"12px 16px", background:"none", border:"none",
                cursor:"pointer", display:"flex", alignItems:"center", gap:6,
                borderBottom: view===n.key ? `3px solid ${G}` : "3px solid transparent",
                color: view===n.key ? G : "#888",
                fontWeight: view===n.key ? 800 : 600, fontSize:12,
              }}>
              {n.icon} {n.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth:1100, margin:"0 auto", padding:20 }}>

        {/* Overview */}
        {view === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:`linear-gradient(135deg,${G},#2d7a3a)`,
              borderRadius:16, padding:20, color:"#fff" }}>
              <div style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>
                GRS School Football Hub
              </div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", lineHeight:1.5 }}>
                A complete football development programme from Grade 1 to Form 6.
                Age-appropriate training, academic balance, talent identification,
                and parent communication — all in one platform.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:16 }}>
                {[
                  { label:"Total Players",  value:totalPlayers },
                  { label:"Grade Groups",   value:SCHOOL_GRADES.length },
                  { label:"Weekly Sessions",value:"18+" },
                ].map(m => (
                  <div key={m.label} style={{ background:"rgba(255,255,255,0.12)",
                    borderRadius:10, padding:"10px 14px" }}>
                    <div style={{ fontSize:24, fontWeight:900, color:GOLD }}>{m.value}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.65)" }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick summary of all grades */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {SCHOOL_GRADES.map(g => (
                <button key={g.id}
                  onClick={() => { setView("agegroup"); setSelectedGrade(g.id); }}
                  style={{ textAlign:"left", padding:"14px 16px", background:"#fff",
                    border:`1px solid #e5e7eb`, borderRadius:12, cursor:"pointer",
                    transition:"all 0.15s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:24 }}>{g.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:900, color:g.color }}>{g.label}</div>
                      <div style={{ fontSize:10, color:"#888" }}>{g.ages} · {g.playerCount} players</div>
                    </div>
                    <ChevronRight size={14} color="#d1d5db"/>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:18 }}>
              <div style={{ fontSize:12, fontWeight:800, color:"#111", marginBottom:12 }}>
                Quick Actions
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:8 }}>
                {[
                  { label:"Add Player",        icon:<Users size={13}/>,        href:"/school/register",    color:G        },
                  { label:"Schedule Fixture",  icon:<Calendar size={13}/>,     href:"/school/fixtures/new",color:"#2563eb"},
                  { label:"Run AI Analysis",   icon:<Activity size={13}/>,     href:"/coach/analysis",     color:"#dc2626"},
                  { label:"Message Parents",   icon:<MessageSquare size={13}/>,href:"/school/messages",    color:"#7c3aed"},
                  { label:"View Passports",    icon:<Award size={13}/>,        href:"/school/passports",   color:GOLD     },
                  { label:"Scholarship Track", icon:<GraduationCap size={13}/>,href:"/player/scholarship", color:G        },
                ].map(a => (
                  <Link key={a.label} href={a.href}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 12px",
                      background:a.color+"0e", border:`1px solid ${a.color}20`,
                      borderRadius:10, textDecoration:"none" }}>
                    <span style={{ color:a.color }}>{a.icon}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:"#333" }}>{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Age Groups */}
        {view === "agegroup" && (
          <div style={{ display:"grid",
            gridTemplateColumns: selectedGrade ? "250px 1fr" : "1fr", gap:20 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {["primary","secondary"].filter(l =>
                levelFilter==="all" || levelFilter===l
              ).map(level => (
                <div key={level}>
                  <div style={{ fontSize:10, fontWeight:800, color:"#888",
                    textTransform:"uppercase", letterSpacing:"0.1em",
                    marginBottom:8, marginTop:level==="secondary"?12:0 }}>
                    {level === "primary" ? "Primary School — Grade 1-7" : "Secondary School — Form 1-6"}
                  </div>
                  {filteredGrades.filter(g=>g.level===level).map(g => (
                    <div key={g.id} style={{ marginBottom:8 }}>
                      <GradeCard grade={g}
                        selected={selectedGrade===g.id}
                        onClick={() => setSelectedGrade(selectedGrade===g.id?null:g.id)} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {selectedGrade && activeGrade && (
              <GradeDetail grade={activeGrade} />
            )}
          </div>
        )}

        {/* Mini League */}
        {view === "league" && <MiniLeagueView />}

        {/* Academic */}
        {view === "academic" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ background:`linear-gradient(135deg,${G},#2d7a3a)`,
              borderRadius:16, padding:18, color:"#fff" }}>
              <div style={{ fontSize:20, fontWeight:900 }}>Academic + Sport Integration</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginTop:4 }}>
                GRS believes football and academics must grow together.
                A player who fails academically cannot reach their football potential.
              </div>
            </div>
            <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:18 }}>
              <div style={{ fontSize:12, fontWeight:800, color:"#111", marginBottom:12 }}>
                School-Wide Academic Policy
              </div>
              {[
                { grade:"Grade 1-5",  rule:"Sport is used as a motivator for academic effort. No academic minimum — but teachers flag struggling students and training load is adjusted." },
                { grade:"Grade 6-7",  rule:"Players below grade threshold train but do not represent the school in matches. Talent Passport includes academic standing." },
                { grade:"Form 1-2",   rule:"Minimum C in all core subjects to play in NASH competitions. Mid-term report shared between teacher and coach." },
                { grade:"Form 3-4",   rule:"O-Level exam term: training cut to 2 sessions per week. Week before exams: training suspended. Minimum 5 Os required for scholarship eligibility." },
                { grade:"Form 5-6",   rule:"A-Level study leave: all football suspended. Results determine scholarship options. GRS prepares combined academic + athletic transcript for every application." },
              ].map((p,i) => (
                <div key={i} style={{ display:"flex", gap:12, padding:"11px 12px",
                  background:i%2===0?"#f9fafb":"#fff", borderRadius:10, marginBottom:6 }}>
                  <div style={{ width:70, fontSize:11, fontWeight:800, color:G,
                    flexShrink:0 }}>{p.grade}</div>
                  <div style={{ fontSize:11, color:"#444", lineHeight:1.6 }}>{p.rule}</div>
                </div>
              ))}
            </div>
            <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:18 }}>
              <div style={{ fontSize:12, fontWeight:800, color:G, marginBottom:12 }}>
                🎓 Scholarship Academic Requirements by Destination
              </div>
              {[
                { dest:"UK Universities",     req:"2 A-Level passes (any grade) + GRS score 78+ + video highlights" },
                { dest:"USA (NCAA D2/D3)",    req:"5 O-Levels at C or above + GRS score 80+ + 3 video highlights" },
                { dest:"South Africa",        req:"5 O-Levels at C or above + GRS score 70+" },
                { dest:"Zimbabwe Universities",req:"5 O-Levels at C or above + NASH recognition" },
              ].map((s,i) => (
                <div key={i} style={{ display:"flex", gap:12, padding:"10px 12px",
                  background:i%2===0?"#f0fdf4":"#fff", borderRadius:10,
                  border:i%2===0?"1px solid #bbf7d0":"1px solid #f0f0f0", marginBottom:8 }}>
                  <div style={{ width:130, fontSize:11, fontWeight:800, color:G,
                    flexShrink:0 }}>{s.dest}</div>
                  <div style={{ fontSize:11, color:"#444", lineHeight:1.6 }}>{s.req}</div>
                </div>
              ))}
              <Link href="/player/scholarship"
                style={{ display:"block", marginTop:12, padding:"10px",
                  background:G, color:"#fff", borderRadius:10, fontWeight:700,
                  fontSize:12, textAlign:"center", textDecoration:"none" }}>
                Open Full Scholarship Pathway →
              </Link>
            </div>
          </div>
        )}

        {/* Parents */}
        {view === "parents" && <ParentView />}
      </main>
    </div>
  );
}
