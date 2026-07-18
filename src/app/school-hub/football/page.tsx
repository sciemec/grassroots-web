"use client";
// src/app/school-hub/football/page.tsx
// School Hub — Football Deep-Dive
// Two teams: Senior Boys U18 (NASH) + Junior Boys U15 (NAPH)
// AI match report generator via /api/ai-coach (Gemini)

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Trophy, Users, Calendar,
  Target, Shield, Activity, Star, AlertCircle,
  CheckCircle2, Zap, Send, Flag, Award, Clock,
  MapPin, MessageSquare, TrendingUp, BarChart3, Loader2,
} from "lucide-react";

// ─── Brand ────────────────────────────────────────────────────────────────────
const G    = "#1a5c2a";
const GOLD = "#c8962a";

// ─── Types ───────────────────────────────────────────────────────────────────
type TeamKey = "senior" | "junior";

interface TeamMeta {
  name: string; ageGroup: string; coach: string;
  competition: string; standing: string;
  played: number; wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number; points: number;
}

interface Player {
  name: string; pos: string; apps: number;
  goals: number; assists: number;
  cards: { y: number; r: number };
  form: number[];   // 1=win/played, 0=loss
  grsScore: number;
  risk: "Low" | "Moderate" | "High";
}

interface Fixture {
  date: string; opponent: string; venue: "Home" | "Away";
  comp: string; status: "upcoming" | "completed";
  score?: string; motm?: string;
}

interface LeagueRow {
  pos: number; team: string; p: number; w: number;
  d: number; l: number; gf: number; ga: number; pts: number;
  highlight?: boolean;
}

interface TrainingDay {
  day: string; time: string; focus: string;
  intensity: "High" | "Medium" | "Low" | "Match" | "REST";
  location: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TEAMS: Record<TeamKey, TeamMeta> = {
  senior: {
    name: "Senior Boys Football", ageGroup: "U18", coach: "Mr. T. Chikwanda",
    competition: "NASH Northern U18", standing: "1st",
    played: 12, wins: 8, draws: 2, losses: 2,
    goalsFor: 24, goalsAgainst: 10, points: 26,
  },
  junior: {
    name: "Junior Boys Football", ageGroup: "U15", coach: "Mr. B. Sibanda",
    competition: "NAPH Zone A U15", standing: "3rd",
    played: 10, wins: 5, draws: 4, losses: 1,
    goalsFor: 18, goalsAgainst: 9, points: 19,
  },
};

const SQUAD: Record<TeamKey, Player[]> = {
  senior: [
    { name:"Tafara Musona",    pos:"ST",  apps:10, goals:8, assists:3, cards:{y:1,r:0}, form:[1,1,1,0,1], grsScore:84, risk:"Low"      },
    { name:"Simba Ndlovu",     pos:"CM",  apps:11, goals:3, assists:7, cards:{y:2,r:0}, form:[1,1,0,1,1], grsScore:79, risk:"Low"      },
    { name:"Ngoni Tsvangirai", pos:"CB",  apps: 9, goals:1, assists:0, cards:{y:3,r:0}, form:[1,0,0,1,0], grsScore:65, risk:"High"     },
    { name:"Tafadzwa Gono",    pos:"GK",  apps:11, goals:0, assists:0, cards:{y:0,r:0}, form:[1,1,1,1,1], grsScore:77, risk:"Low"      },
    { name:"Kudzi Mhuru",      pos:"RW",  apps: 8, goals:4, assists:5, cards:{y:1,r:0}, form:[1,1,1,0,1], grsScore:81, risk:"Moderate" },
    { name:"Takudzwa Banda",   pos:"LB",  apps:10, goals:0, assists:2, cards:{y:2,r:0}, form:[0,1,1,0,1], grsScore:70, risk:"Low"      },
    { name:"Farai Dube",       pos:"CAM", apps: 7, goals:2, assists:4, cards:{y:0,r:0}, form:[1,0,1,1,1], grsScore:76, risk:"Low"      },
    { name:"Tinashe Makoni",   pos:"CB",  apps:11, goals:1, assists:1, cards:{y:1,r:0}, form:[1,1,1,1,0], grsScore:72, risk:"Low"      },
  ],
  junior: [
    { name:"Tatenda Chidziva", pos:"GK",  apps: 9, goals:0, assists:0, cards:{y:0,r:0}, form:[1,1,0,1,1], grsScore:71, risk:"Low"      },
    { name:"Ruvimbo Mutasa",   pos:"ST",  apps: 8, goals:5, assists:2, cards:{y:1,r:0}, form:[1,0,1,1,1], grsScore:75, risk:"Low"      },
    { name:"Chiedza Moyo",     pos:"LW",  apps: 7, goals:3, assists:4, cards:{y:0,r:0}, form:[1,1,1,0,0], grsScore:68, risk:"Moderate" },
    { name:"Tinotenda Zvobgo", pos:"CM",  apps:10, goals:1, assists:3, cards:{y:2,r:0}, form:[0,1,1,1,1], grsScore:73, risk:"Low"      },
    { name:"Munashe Chiroto",  pos:"CB",  apps: 9, goals:0, assists:1, cards:{y:1,r:0}, form:[1,1,0,0,1], grsScore:66, risk:"Low"      },
    { name:"Tino Mwangi",      pos:"RB",  apps: 8, goals:0, assists:2, cards:{y:0,r:0}, form:[1,0,1,1,0], grsScore:69, risk:"Low"      },
  ],
};

const FIXTURES: Record<TeamKey, Fixture[]> = {
  senior: [
    { date:"Sat 19 Jul", opponent:"Harare High",   venue:"Home", comp:"NASH U18",     status:"upcoming" },
    { date:"Sat 26 Jul", opponent:"St Georges",    venue:"Away", comp:"NASH U18",     status:"upcoming" },
    { date:"Sat 2 Aug",  opponent:"Prince Edward", venue:"Home", comp:"NASH Cup QF",  status:"upcoming" },
    { date:"Sat 12 Jul", opponent:"Peterhouse",    venue:"Away", comp:"NASH U18",     status:"completed", score:"2-1",           motm:"Tafara Musona"  },
    { date:"Sat 5 Jul",  opponent:"St Johns",      venue:"Home", comp:"NASH U18",     status:"completed", score:"3-0",           motm:"Kudzi Mhuru"    },
    { date:"Sat 28 Jun", opponent:"Falcon",        venue:"Away", comp:"NASH Cup R16", status:"completed", score:"1-1 (W on pens)", motm:"Tafadzwa Gono" },
  ],
  junior: [
    { date:"Thu 17 Jul", opponent:"Warren Park PS",    venue:"Home", comp:"NAPH Zone A", status:"upcoming" },
    { date:"Thu 24 Jul", opponent:"Dzivarasekwa PS",   venue:"Away", comp:"NAPH Zone A", status:"upcoming" },
    { date:"Thu 31 Jul", opponent:"Highfield PS",      venue:"Home", comp:"NAPH Zone A", status:"upcoming" },
    { date:"Thu 10 Jul", opponent:"Glen Norah PS",     venue:"Away", comp:"NAPH Zone A", status:"completed", score:"1-0", motm:"Ruvimbo Mutasa" },
    { date:"Thu 3 Jul",  opponent:"Budiriro PS",       venue:"Home", comp:"NAPH Zone A", status:"completed", score:"2-2", motm:"Chiedza Moyo"   },
  ],
};

const LEAGUE_TABLES: Record<TeamKey, LeagueRow[]> = {
  senior: [
    { pos:1, team:"Our School",    p:12, w:8, d:2, l:2, gf:24, ga:10, pts:26, highlight:true },
    { pos:2, team:"Peterhouse",    p:12, w:7, d:3, l:2, gf:21, ga:12, pts:24 },
    { pos:3, team:"St Georges",    p:11, w:6, d:2, l:3, gf:18, ga:14, pts:20 },
    { pos:4, team:"Prince Edward", p:12, w:5, d:4, l:3, gf:16, ga:13, pts:19 },
    { pos:5, team:"Harare High",   p:11, w:4, d:3, l:4, gf:14, ga:17, pts:15 },
    { pos:6, team:"St Johns",      p:12, w:3, d:2, l:7, gf:10, ga:22, pts:11 },
  ],
  junior: [
    { pos:1, team:"Highfield PS",     p:9, w:7, d:1, l:1, gf:22, ga:7,  pts:22 },
    { pos:2, team:"Glen Norah PS",    p:9, w:6, d:2, l:1, gf:18, ga:9,  pts:20 },
    { pos:3, team:"Our School",       p:10,w:5, d:4, l:1, gf:18, ga:9,  pts:19, highlight:true },
    { pos:4, team:"Warren Park PS",   p:9, w:4, d:2, l:3, gf:14, ga:12, pts:14 },
    { pos:5, team:"Dzivarasekwa PS",  p:8, w:2, d:1, l:5, gf:9,  ga:18, pts:7  },
    { pos:6, team:"Budiriro PS",      p:9, w:1, d:2, l:6, gf:7,  ga:24, pts:5  },
  ],
};

const TRAINING: Record<TeamKey, TrainingDay[]> = {
  senior: [
    { day:"Mon", time:"3:30 PM", focus:"Pressing & Transitions",     intensity:"High",   location:"Main Pitch" },
    { day:"Tue", time:"3:30 PM", focus:"Set Pieces — Corners",       intensity:"Medium", location:"Main Pitch" },
    { day:"Wed", time:"REST",    focus:"Recovery",                   intensity:"REST",   location:"—"          },
    { day:"Thu", time:"3:30 PM", focus:"Tactical Walk-through",      intensity:"Medium", location:"Video Room"  },
    { day:"Fri", time:"3:30 PM", focus:"Pre-Match Activation",       intensity:"Low",    location:"Main Pitch" },
    { day:"Sat", time:"10:00 AM",focus:"Match — vs Harare High",     intensity:"Match",  location:"Home Ground" },
  ],
  junior: [
    { day:"Mon", time:"3:30 PM", focus:"Technical — Dribbling",      intensity:"Medium", location:"Junior Pitch" },
    { day:"Tue", time:"3:30 PM", focus:"Small-Sided Games (5v5)",    intensity:"High",   location:"Junior Pitch" },
    { day:"Wed", time:"REST",    focus:"Recovery",                   intensity:"REST",   location:"—"            },
    { day:"Thu", time:"3:30 PM", focus:"Crossing & Finishing",       intensity:"High",   location:"Junior Pitch" },
    { day:"Fri", time:"3:30 PM", focus:"Team Shape Walkthrough",     intensity:"Low",    location:"Junior Pitch" },
    { day:"Thu", time:"10:00 AM",focus:"Match — vs Warren Park PS",  intensity:"Match",  location:"Home Ground"  },
  ],
};

const COMPLIANCE = [
  { item:"Player registrations submitted to ZIFA/NASH",  done:true  },
  { item:"Medical clearance forms on file (all players)", done:true  },
  { item:"Guardian consent forms signed (all players)",  done:true  },
  { item:"Age verification documents lodged",            done:false },
  { item:"Coach CAF grassroots licence on file",         done:true  },
  { item:"First aid kit present at all fixtures",        done:true  },
  { item:"NASH strip colour registration submitted",     done:false },
  { item:"Team photo submitted to NASH",                 done:true  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function riskColor(r: Player["risk"]) {
  return r==="High"?"#dc2626":r==="Moderate"?GOLD:"#059669";
}

function intensityColor(i: TrainingDay["intensity"]) {
  return i==="High"?"#dc2626":i==="Match"?G:i==="Medium"?GOLD:i==="REST"?"#9ca3af":"#059669";
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHead({ title, action, actionHref }: { title:string; action?:string; actionHref?:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
      <h2 style={{ fontSize:14, fontWeight:900, color:"#111", margin:0 }}>{title}</h2>
      {action && (
        <Link href={actionHref ?? "#"} style={{ fontSize:11, fontWeight:700, color:G, display:"flex", alignItems:"center", gap:4, textDecoration:"none" }}>
          {action} <ChevronRight size={12}/>
        </Link>
      )}
    </div>
  );
}

function Pill({ label, color=G }: { label:string; color?:string }) {
  return (
    <span style={{ fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:20, background:color+"18", color, border:`1px solid ${color}25`, whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

function FormDots({ form }: { form: number[] }) {
  return (
    <div style={{ display:"flex", gap:3 }}>
      {form.map((v,i) => (
        <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:v?"#059669":"#dc2626" }} />
      ))}
    </div>
  );
}

function MetricCard({ label, value, icon, color=G, sub }: {
  label:string; value:string|number; icon:React.ReactNode; color?:string; sub?:string;
}) {
  return (
    <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e5e5", padding:"14px 16px" }}>
      <div style={{ width:32, height:32, borderRadius:9, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", color, marginBottom:8 }}>
        {icon}
      </div>
      <div style={{ fontSize:24, fontWeight:900, color:"#111", lineHeight:1.1 }}>{value}</div>
      <div style={{ fontSize:11, fontWeight:700, color:"#555", marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:"#aaa", marginTop:1 }}>{sub}</div>}
    </div>
  );
}

// ─── Season banner ────────────────────────────────────────────────────────────
function SeasonBanner({ team }: { team: TeamMeta }) {
  const gd = team.goalsFor - team.goalsAgainst;
  return (
    <div style={{ background:`linear-gradient(135deg, ${G}, #2d7a3a)`, borderRadius:16, padding:20, color:"#fff" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>
            {team.competition}
          </div>
          <div style={{ fontSize:22, fontWeight:900, marginTop:4 }}>{team.name}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginTop:2 }}>
            Coach: {team.coach} · Age Group: {team.ageGroup}
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 18px", textAlign:"center" }}>
          <div style={{ fontSize:28, fontWeight:900, color:GOLD }}>{team.standing}</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.65)" }}>League Standing</div>
        </div>
      </div>

      <div style={{ display:"flex", gap:10, marginTop:16, flexWrap:"wrap" }}>
        {[
          { label:"Played", value:team.played   },
          { label:"Wins",   value:team.wins,     color:"#4ade80" },
          { label:"Draws",  value:team.draws,    color:GOLD      },
          { label:"Losses", value:team.losses,   color:"#f87171" },
          { label:"GF",     value:team.goalsFor  },
          { label:"GA",     value:team.goalsAgainst },
          { label:"GD",     value:gd>0?`+${gd}`:gd },
          { label:"Points", value:team.points,   color:GOLD      },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(255,255,255,0.12)", borderRadius:10, padding:"8px 14px", textAlign:"center", minWidth:52 }}>
            <div style={{ fontSize:18, fontWeight:900, color:(s as {color?:string}).color ?? "#fff" }}>{s.value}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.6)", fontWeight:700 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Squad table ──────────────────────────────────────────────────────────────
function SquadTable({ players }: { players: Player[] }) {
  const topScorer   = [...players].sort((a,b) => b.goals-a.goals)[0];
  const topAssister = [...players].sort((a,b) => b.assists-a.assists)[0];

  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
      <SectionHead title="Squad Roster" action="Full Profiles" actionHref="/coach/squad" />
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#f9fafb", borderBottom:"2px solid #f0f0f0" }}>
              {["Player","Pos","Apps","Goals","Assists","Cards","Form (last 5)","GRS","Risk"].map(h => (
                <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontWeight:800, fontSize:10, color:"#888", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.name} style={{ background:i%2===0?"#fff":"#fafafa", borderBottom:"1px solid #f5f5f5" }}>
                <td style={{ padding:"9px 10px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:G+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:900, color:G, flexShrink:0 }}>
                      {p.name.split(" ").map(n=>n[0]).join("")}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:"#111", whiteSpace:"nowrap" }}>{p.name}</div>
                      {p.name===topScorer.name && <div style={{ fontSize:9, color:GOLD, fontWeight:800 }}>Top Scorer</div>}
                      {p.name===topAssister.name && p.name!==topScorer.name && <div style={{ fontSize:9, color:"#7c3aed", fontWeight:800 }}>Top Assist</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding:"9px 10px" }}><Pill label={p.pos} color="#2563eb" /></td>
                <td style={{ padding:"9px 10px", textAlign:"center", fontWeight:700 }}>{p.apps}</td>
                <td style={{ padding:"9px 10px", textAlign:"center", fontWeight:800, color:p.goals>0?G:"#aaa" }}>{p.goals}</td>
                <td style={{ padding:"9px 10px", textAlign:"center", fontWeight:800, color:p.assists>0?"#7c3aed":"#aaa" }}>{p.assists}</td>
                <td style={{ padding:"9px 10px" }}>
                  <div style={{ display:"flex", gap:4 }}>
                    {p.cards.y>0 && <span style={{ background:"#fef08a", border:"1px solid #ca8a04", borderRadius:3, width:14, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:900, color:"#92400e" }}>{p.cards.y}</span>}
                    {p.cards.r>0 && <span style={{ background:"#fca5a5", border:"1px solid #dc2626", borderRadius:3, width:14, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:900, color:"#991b1b" }}>{p.cards.r}</span>}
                    {p.cards.y===0 && p.cards.r===0 && <span style={{ fontSize:10, color:"#d1d5db" }}>—</span>}
                  </div>
                </td>
                <td style={{ padding:"9px 10px" }}><FormDots form={p.form} /></td>
                <td style={{ padding:"9px 10px", textAlign:"center", fontWeight:800, color:p.grsScore>=80?G:p.grsScore>=70?GOLD:"#dc2626" }}>{p.grsScore}</td>
                <td style={{ padding:"9px 10px" }}><Pill label={p.risk} color={riskColor(p.risk)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Fixtures panel ───────────────────────────────────────────────────────────
function FixturesPanel({ fixtures }: { fixtures: Fixture[] }) {
  const upcoming  = fixtures.filter(f => f.status==="upcoming");
  const completed = fixtures.filter(f => f.status==="completed");

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
      {/* Upcoming */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
        <SectionHead title="Upcoming Fixtures" />
        {upcoming.length===0 && <div style={{ fontSize:12, color:"#aaa", textAlign:"center", padding:20 }}>No upcoming fixtures scheduled</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {upcoming.map(f => (
            <div key={f.date+f.opponent} style={{ padding:"12px 14px", background:"#f0fdf4", borderRadius:12, border:`1px solid ${G}20` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Calendar size={13} color={G} />
                  <span style={{ fontSize:11, fontWeight:800, color:G }}>{f.date}</span>
                </div>
                <Pill label={f.venue} color={f.venue==="Home"?G:"#2563eb"} />
              </div>
              <div style={{ fontSize:14, fontWeight:900, color:"#111" }}>vs {f.opponent}</div>
              <div style={{ fontSize:10, color:"#888", marginTop:2, display:"flex", alignItems:"center", gap:6 }}>
                <Flag size={10} /> {f.comp}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Results */}
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
        <SectionHead title="Recent Results" />
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {completed.map(f => {
            const won = f.score?.includes("W") || (f.score && (() => {
              const m = f.score!.match(/(\d+)-(\d+)/);
              return m ? parseInt(m[1]) > parseInt(m[2]) : false;
            })());
            const drew = f.score && !f.score.includes("W") && (() => {
              const m = f.score!.match(/(\d+)-(\d+)/);
              return m ? parseInt(m[1]) === parseInt(m[2]) : false;
            })();
            const resultColor = won ? "#059669" : drew ? GOLD : "#dc2626";
            const resultLabel = won ? "W" : drew ? "D" : "L";

            return (
              <div key={f.date+f.opponent} style={{ padding:"12px 14px", background:"#f9fafb", borderRadius:12, border:"1px solid #f0f0f0" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:10, color:"#888" }}>{f.date} · {f.comp}</span>
                  <span style={{ fontSize:12, fontWeight:900, color:resultColor, background:resultColor+"18", padding:"2px 8px", borderRadius:20 }}>
                    {resultLabel} {f.score}
                  </span>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:"#111" }}>
                  {f.venue==="Home"?"vs":"@"} {f.opponent}
                </div>
                {f.motm && (
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
                    <Star size={10} color={GOLD} />
                    <span style={{ fontSize:10, color:GOLD, fontWeight:700 }}>MOTM: {f.motm}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Stats tables ─────────────────────────────────────────────────────────────
function StatsRow({ label, players, field, color }: {
  label: string; players: Player[]; field: "goals"|"assists"; color: string;
}) {
  const sorted = [...players].sort((a,b) => b[field]-a[field]).filter(p => p[field]>0).slice(0,5);
  const max = sorted[0]?.[field] ?? 1;
  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
      <SectionHead title={label} />
      {sorted.length===0 && <div style={{ fontSize:12, color:"#aaa", textAlign:"center", padding:16 }}>No data yet</div>}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {sorted.map((p,i) => (
          <div key={p.name} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ width:18, fontSize:11, fontWeight:900, color: i===0?GOLD:i===1?"#9ca3af":"#d1d5db", textAlign:"center" }}>
              {i===0?"":"#"}{i+1}
            </span>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#111" }}>{p.name}</span>
                <span style={{ fontSize:12, fontWeight:900, color }}>{p[field]}</span>
              </div>
              <div style={{ height:6, background:"#f0f0f0", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(p[field]/max)*100}%`, background:color, borderRadius:3 }} />
              </div>
            </div>
            <Pill label={p.pos} color="#6b7280" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── League table ─────────────────────────────────────────────────────────────
function LeagueTable({ rows, competition }: { rows: LeagueRow[]; competition: string }) {
  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
      <SectionHead title={competition} />
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#f9fafb", borderBottom:"2px solid #f0f0f0" }}>
              {["#","Team","P","W","D","L","GF","GA","GD","Pts"].map(h => (
                <th key={h} style={{ padding:"7px 8px", textAlign: h==="Team"?"left":"center", fontSize:10, fontWeight:800, color:"#888" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.pos} style={{ background:r.highlight?`${G}10`:"transparent", borderBottom:"1px solid #f5f5f5", fontWeight:r.highlight?800:400 }}>
                <td style={{ padding:"7px 8px", textAlign:"center", color:r.pos<=2?G:"#555", fontWeight:900 }}>{r.pos}</td>
                <td style={{ padding:"7px 8px", color:r.highlight?G:"#333", display:"flex", alignItems:"center", gap:6 }}>
                  {r.highlight && <div style={{ width:6, height:6, borderRadius:"50%", background:G }} />}
                  {r.team}
                </td>
                <td style={{ padding:"7px 8px", textAlign:"center" }}>{r.p}</td>
                <td style={{ padding:"7px 8px", textAlign:"center", color:"#059669", fontWeight:700 }}>{r.w}</td>
                <td style={{ padding:"7px 8px", textAlign:"center", color:GOLD,      fontWeight:700 }}>{r.d}</td>
                <td style={{ padding:"7px 8px", textAlign:"center", color:"#dc2626", fontWeight:700 }}>{r.l}</td>
                <td style={{ padding:"7px 8px", textAlign:"center" }}>{r.gf}</td>
                <td style={{ padding:"7px 8px", textAlign:"center" }}>{r.ga}</td>
                <td style={{ padding:"7px 8px", textAlign:"center", color: r.gf-r.ga>0?G:r.gf-r.ga<0?"#dc2626":"#555" }}>
                  {r.gf-r.ga>0?`+${r.gf-r.ga}`:r.gf-r.ga}
                </td>
                <td style={{ padding:"7px 8px", textAlign:"center", fontWeight:900, color:r.highlight?G:"#111", fontSize:13 }}>{r.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Training plan ────────────────────────────────────────────────────────────
function TrainingPlan({ plan }: { plan: TrainingDay[] }) {
  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
      <SectionHead title="This Week's Training" action="Full Schedule" actionHref="/coach/training-plans" />
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {plan.map(d => (
          <div key={d.day} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 12px", background:d.intensity==="Match"?"#f0fdf4":d.intensity==="REST"?"#f9fafb":"#fff", borderRadius:10, border:`1px solid ${d.intensity==="Match"?G+"30":d.intensity==="REST"?"#f0f0f0":"#f5f5f5"}` }}>
            <div style={{ width:38, textAlign:"center", flexShrink:0 }}>
              <div style={{ fontSize:11, fontWeight:900, color:d.intensity==="REST"?"#aaa":G }}>{d.day}</div>
              <div style={{ fontSize:9, color:"#aaa" }}>{d.time}</div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:d.intensity==="REST"?"#aaa":"#111", fontStyle:d.intensity==="REST"?"italic":"normal" }}>{d.focus}</div>
              <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
                <MapPin size={9} color="#aaa" />
                <span style={{ fontSize:9, color:"#aaa" }}>{d.location}</span>
              </div>
            </div>
            <span style={{ fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:20, background:intensityColor(d.intensity)+"18", color:intensityColor(d.intensity), border:`1px solid ${intensityColor(d.intensity)}25`, flexShrink:0 }}>
              {d.intensity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NASH compliance ──────────────────────────────────────────────────────────
function CompliancePanel() {
  const done  = COMPLIANCE.filter(c=>c.done).length;
  const total = COMPLIANCE.length;
  const pct   = Math.round((done/total)*100);
  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
      <SectionHead title="NASH Compliance Checklist" />
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14, padding:"12px 14px", background: pct===100?"#f0fdf4":"#fffbeb", borderRadius:12, border:`1px solid ${pct===100?"#bbf7d0":"#fde68a"}` }}>
        <div style={{ position:"relative", width:44, height:44, flexShrink:0 }}>
          <svg width={44} height={44} style={{ transform:"rotate(-90deg)" }}>
            <circle cx={22} cy={22} r={18} fill="none" stroke="#f0f0f0" strokeWidth={4} />
            <circle cx={22} cy={22} r={18} fill="none" stroke={pct===100?G:GOLD} strokeWidth={4}
              strokeDasharray={`${2*Math.PI*18*pct/100} ${2*Math.PI*18}`} strokeLinecap="round" />
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:pct===100?G:GOLD }}>
            {pct}%
          </div>
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:"#111" }}>{done}/{total} items complete</div>
          <div style={{ fontSize:10, color:"#888", marginTop:1 }}>
            {pct===100 ? "Your team is NASH compliant!" : `${total-done} item${total-done>1?"s":""} still needed`}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {COMPLIANCE.map((c,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:c.done?"#f0fdf4":"#fef2f2", borderRadius:9, border:`1px solid ${c.done?"#bbf7d0":"#fecaca"}` }}>
            {c.done
              ? <CheckCircle2 size={15} color="#059669" style={{ flexShrink:0 }} />
              : <AlertCircle  size={15} color="#dc2626" style={{ flexShrink:0 }} />}
            <span style={{ fontSize:11, fontWeight:600, color:c.done?"#166534":"#991b1b" }}>{c.item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Match Report generator ───────────────────────────────────────────────
function AIMatchReport({ teamName, competition }: { teamName:string; competition:string }) {
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [opponent,  setOpponent]  = useState("");
  const [notes,     setNotes]     = useState("");
  const [report,    setReport]    = useState("");
  const [loading,   setLoading]   = useState(false);

  const generate = useCallback(async () => {
    if (!opponent.trim()) return;
    setLoading(true);
    setReport("");
    try {
      const prompt = `Generate a brief football match report for a school team.
Team: ${teamName}
Competition: ${competition}
Result: ${teamName} ${homeScore} - ${awayScore} ${opponent}
Coach notes: ${notes || "None provided"}

Write 3 short paragraphs covering: (1) overall match summary, (2) key moments / standout players, (3) areas to improve before next fixture.
Keep it suitable for a school newsletter. Use encouraging, professional language.`;

      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, system_prompt: "You are a school football analyst writing match reports for Zimbabwean school sports." }),
      });
      const data = await res.json() as { response?: string; error?: string };
      setReport(data.response ?? data.error ?? "Unable to generate report. Please try again.");
    } catch {
      setReport("AI coach is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [teamName, competition, homeScore, awayScore, opponent, notes]);

  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
      <SectionHead title="AI Match Report Generator" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 2fr", gap:10, marginBottom:12 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"#888", marginBottom:4 }}>Our Score</div>
          <input value={homeScore} onChange={e=>setHomeScore(e.target.value)} placeholder="0"
            style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:"1px solid #e5e5e5", fontSize:14, fontWeight:800, textAlign:"center", outline:"none", boxSizing:"border-box" }} />
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"#888", marginBottom:4 }}>Their Score</div>
          <input value={awayScore} onChange={e=>setAwayScore(e.target.value)} placeholder="0"
            style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:"1px solid #e5e5e5", fontSize:14, fontWeight:800, textAlign:"center", outline:"none", boxSizing:"border-box" }} />
        </div>
        <div style={{ gridColumn:"span 1" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#888", marginBottom:4 }}>Opponent</div>
          <input value={opponent} onChange={e=>setOpponent(e.target.value)} placeholder="Harare High"
            style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:"1px solid #e5e5e5", fontSize:12, outline:"none", boxSizing:"border-box" }} />
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"#888", marginBottom:4 }}>Coach Notes (optional)</div>
          <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Key moments, standout players..."
            style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:"1px solid #e5e5e5", fontSize:12, outline:"none", boxSizing:"border-box" }} />
        </div>
      </div>

      <button onClick={generate} disabled={loading || !opponent.trim()}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", background:opponent.trim()?G:"#d1d5db", color:"#fff", borderRadius:10, border:"none", fontWeight:800, fontSize:12, cursor:opponent.trim()?"pointer":"not-allowed" }}>
        {loading ? <><Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/> Generating...</> : <><Activity size={14}/> Generate Match Report</>}
      </button>

      {report && (
        <div style={{ marginTop:14, padding:"14px 16px", background:"#f0fdf4", borderRadius:12, border:"1px solid #bbf7d0" }}>
          <div style={{ fontSize:10, fontWeight:800, color:G, marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
            <Award size={12} /> AI MATCH REPORT — {teamName} vs {opponent} ({homeScore}–{awayScore})
          </div>
          <div style={{ fontSize:12, color:"#166534", lineHeight:1.8, whiteSpace:"pre-wrap" }}>{report}</div>
          <button
            onClick={() => navigator.clipboard?.writeText(report)}
            style={{ marginTop:10, padding:"7px 14px", background:"#fff", border:`1px solid ${G}`, borderRadius:8, fontSize:11, fontWeight:700, color:G, cursor:"pointer" }}>
            Copy Report
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function SchoolHubFootballPage() {
  const [activeTeam, setActiveTeam] = useState<TeamKey>("senior");

  const team     = TEAMS[activeTeam];
  const squad    = SQUAD[activeTeam];
  const fixtures = FIXTURES[activeTeam];
  const table    = LEAGUE_TABLES[activeTeam];
  const training = TRAINING[activeTeam];

  const highRisk = squad.filter(p => p.risk==="High");

  return (
    <div style={{ minHeight:"100vh", background:"#f4f2ee" }}>

      {/* ── Top nav ── */}
      <header style={{ background:"#fff", borderBottom:"1px solid #e5e5e5", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px", height:54, display:"flex", alignItems:"center", gap:12 }}>
          <Link href="/school-hub" style={{ display:"flex", alignItems:"center", gap:6, color:"#555", textDecoration:"none", fontSize:12, fontWeight:700 }}>
            <ChevronLeft size={16}/> School Hub
          </Link>
          <div style={{ width:1, height:20, background:"#e5e5e5" }} />
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:20 }}>⚽</span>
            <div>
              <div style={{ fontSize:14, fontWeight:900, color:"#111", lineHeight:1 }}>Football</div>
              <div style={{ fontSize:10, color:"#aaa" }}>School & Academy Football Management</div>
            </div>
          </div>
          <div style={{ flex:1 }} />
          <Link href="/coach/live-match"
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", background:"#dc2626", color:"#fff", borderRadius:20, fontSize:11, fontWeight:800, textDecoration:"none" }}>
            <Zap size={12}/> Live Match
          </Link>
          <Link href="/coach/tactics/learn"
            style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", background:G, color:"#fff", borderRadius:20, fontSize:11, fontWeight:800, textDecoration:"none" }}>
            <TrendingUp size={12}/> Tactics
          </Link>
        </div>
      </header>

      {/* ── Team switcher ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e5e5" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px", display:"flex", gap:0 }}>
          {(["senior","junior"] as TeamKey[]).map(key => (
            <button key={key} onClick={() => setActiveTeam(key)}
              style={{
                padding:"12px 24px", background:"none", border:"none", cursor:"pointer",
                borderBottom: activeTeam===key ? `3px solid ${G}` : "3px solid transparent",
                color: activeTeam===key ? G : "#888",
                fontWeight: activeTeam===key ? 800 : 600,
                fontSize: 13,
                transition:"all 0.15s",
              }}>
              {TEAMS[key].name} <span style={{ fontSize:10, opacity:0.6 }}>{TEAMS[key].ageGroup}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <main style={{ maxWidth:1100, margin:"0 auto", padding:"20px", display:"flex", flexDirection:"column", gap:20 }}>

        {/* Injury risk alert */}
        {highRisk.length>0 && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"10px 16px", display:"flex", gap:8, alignItems:"center" }}>
            <Shield size={15} color="#dc2626" style={{ flexShrink:0 }} />
            <span style={{ fontSize:12, color:"#dc2626", fontWeight:700 }}>
              {highRisk.length} player{highRisk.length>1?"s":""} flagged HIGH injury risk:
              {" "}{highRisk.map(p=>p.name).join(", ")} — GRS AI recommends physio clearance before next fixture.
            </span>
          </div>
        )}

        {/* Season banner */}
        <SeasonBanner team={team} />

        {/* Quick metrics */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12 }}>
          <MetricCard label="Squad Size"     value={squad.length}                                    icon={<Users size={16}/>}     color={G}       />
          <MetricCard label="Goals Scored"   value={squad.reduce((s,p)=>s+p.goals,0)}               icon={<Target size={16}/>}    color="#2563eb" />
          <MetricCard label="Goals Conceded" value={team.goalsAgainst}                              icon={<Shield size={16}/>}    color="#dc2626" sub={`GD +${team.goalsFor-team.goalsAgainst}`} />
          <MetricCard label="Top Scorer"     value={[...squad].sort((a,b)=>b.goals-a.goals)[0]?.goals ?? 0}
                                             icon={<Star size={16}/>}    color={GOLD}
                                             sub={[...squad].sort((a,b)=>b.goals-a.goals)[0]?.name ?? "—"} />
          <MetricCard label="Upcoming Games" value={fixtures.filter(f=>f.status==="upcoming").length} icon={<Calendar size={16}/>} color="#7c3aed" />
          <MetricCard label="Avg GRS Score"  value={Math.round(squad.reduce((s,p)=>s+p.grsScore,0)/squad.length)} icon={<Activity size={16}/>} color={G} />
        </div>

        {/* Squad table */}
        <SquadTable players={squad} />

        {/* Fixtures */}
        <FixturesPanel fixtures={fixtures} />

        {/* Stats tables + League table */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
          <StatsRow label="Top Scorers"  players={squad} field="goals"   color={G}       />
          <StatsRow label="Top Assists"  players={squad} field="assists" color="#7c3aed" />
          <LeagueTable rows={table} competition={team.competition} />
        </div>

        {/* Training + Compliance */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <TrainingPlan plan={training} />
          <CompliancePanel />
        </div>

        {/* AI Match Report */}
        <AIMatchReport teamName={team.name} competition={team.competition} />

        {/* Footer links */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {[
            { label:"Full Squad Profiles",   href:"/coach/squad",          color:G         },
            { label:"Live Match Dashboard",  href:"/coach/live-match",     color:"#dc2626" },
            { label:"Tactics & Formations",  href:"/coach/tactics/learn",  color:"#2563eb" },
            { label:"Training Plans",        href:"/coach/training-plans", color:"#7c3aed" },
            { label:"School Hub Home",       href:"/school-hub",           color:GOLD      },
          ].map(l => (
            <Link key={l.label} href={l.href}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", background:l.color+"12", border:`1px solid ${l.color}25`, borderRadius:20, fontSize:11, fontWeight:700, color:l.color, textDecoration:"none" }}>
              {l.label} <ChevronRight size={11}/>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}
