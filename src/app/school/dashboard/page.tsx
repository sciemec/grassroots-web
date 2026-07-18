"use client";
// src/app/school/dashboard/page.tsx
// GRS School & Academy Dashboard — four role-based views in one page

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap, Users, Trophy, MessageSquare, Bell,
  ChevronRight, Shield, Zap, BookOpen,
  Calendar, ClipboardList, Wallet, AlertCircle,
  CheckCircle2, BarChart3, Star, Send,
  Activity, Target, Award, Home,
  UserCheck, Megaphone, DollarSign,
} from "lucide-react";

// ─── Brand ────────────────────────────────────────────────────────────────────
const G    = "#1a5c2a";
const GOLD = "#c8962a";

// ─── Types ───────────────────────────────────────────────────────────────────
type Role = "headmaster" | "coach" | "parent" | "student";

interface RoleConfig {
  label:   string;
  icon:    React.ReactNode;
  color:   string;
  tagline: string;
}

const ROLES: Record<Role, RoleConfig> = {
  headmaster: { label: "Headmaster", icon: <GraduationCap size={18}/>, color: G,        tagline: "School & Academy Overview"   },
  coach:      { label: "Coach",      icon: <Trophy size={18}/>,        color: "#2563eb", tagline: "Squad & Training Management" },
  parent:     { label: "Parent",     icon: <Users size={18}/>,         color: "#7c3aed", tagline: "My Child's Progress"          },
  student:    { label: "Student",    icon: <Star size={18}/>,          color: GOLD,      tagline: "My Profile & Development"     },
};

// ─── Shared metric card ───────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon, color = G, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color?: string; trend?: "up" | "down" | "flat";
}) {
  return (
    <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e5e5", padding:"16px 18px", display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ width:36, height:36, borderRadius:10, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", color }}>
          {icon}
        </div>
        {trend && (
          <span style={{ fontSize:10, fontWeight:800, color: trend==="up"?"#059669":trend==="down"?"#dc2626":"#9ca3af", background: trend==="up"?"#f0fdf4":trend==="down"?"#fef2f2":"#f9fafb", padding:"2px 8px", borderRadius:20 }}>
            {trend==="up"?"↑":trend==="down"?"↓":"→"} {trend}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize:26, fontWeight:900, color:"#111", lineHeight:1.1 }}>{value}</div>
        <div style={{ fontSize:11, fontWeight:700, color:"#555", marginTop:2 }}>{label}</div>
        {sub && <div style={{ fontSize:10, color:"#aaa", marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

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

function Alert({ type, message }: { type:"warn"|"danger"|"info"; message:string }) {
  const cfg = {
    warn:   { bg:"#fffbeb", border:"#fde68a", color:"#92400e", icon:<AlertCircle size={14}/> },
    danger: { bg:"#fef2f2", border:"#fecaca", color:"#dc2626", icon:<AlertCircle size={14}/> },
    info:   { bg:"#eff6ff", border:"#bfdbfe", color:"#1d4ed8", icon:<Bell size={14}/> },
  }[type];
  return (
    <div style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:10, padding:"10px 14px", display:"flex", gap:8, alignItems:"flex-start" }}>
      <span style={{ color:cfg.color, marginTop:1 }}>{cfg.icon}</span>
      <span style={{ fontSize:12, color:cfg.color, lineHeight:1.5 }}>{message}</span>
    </div>
  );
}

function Pill({ label, color="#1a5c2a" }: { label:string; color?:string }) {
  return (
    <span style={{ fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:20, background:color+"18", color, border:`1px solid ${color}25` }}>
      {label}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HEADMASTER VIEW
// ══════════════════════════════════════════════════════════════════════════════
function HeadmasterDashboard() {
  const teams = [
    { name:"Football (Boys U18)",  coach:"T. Chikwanda", players:22, wins:8, losses:2, draws:2, standing:"1st — NASH Northern" },
    { name:"Football (Girls U18)", coach:"F. Mlambo",    players:18, wins:6, losses:3, draws:3, standing:"3rd — NASH Northern" },
    { name:"Athletics",            coach:"R. Banda",     players:30, wins:"-", losses:"-", draws:"-", standing:"4 medals — Provincial" },
    { name:"Netball (Girls)",      coach:"P. Nkosi",     players:14, wins:5, losses:4, draws:1, standing:"2nd — NAPH Zone A" },
  ];

  const announcements = [
    { title:"NASH Inter-Schools Football — Registration Deadline", date:"20 Jul 2026", urgent:true  },
    { title:"Term 3 Sports Day — All Students Required",           date:"5 Aug 2026",  urgent:false },
    { title:"New GRS AI Analysis Tools Available for Coaches",     date:"12 Jul 2026", urgent:false },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <Alert type="warn"   message="3 students have outstanding fees for Term 3 sport programmes. Total outstanding: USD $45." />
        <Alert type="danger" message="2 players flagged HIGH injury risk by GRS AI — require physio clearance before next fixture." />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
        <MetricCard label="Total Students"       value={847}    icon={<Users size={18}/>}    color={G}       trend="up" />
        <MetricCard label="Active Athletes"      value={214}    icon={<Trophy size={18}/>}   color="#2563eb" trend="up" sub="25% of school" />
        <MetricCard label="Teams / Squads"       value={8}      icon={<Target size={18}/>}   color={GOLD}    />
        <MetricCard label="Coaches on Staff"     value={6}      icon={<UserCheck size={18}/>}color={G}       />
        <MetricCard label="Fixtures This Term"   value={34}     icon={<Calendar size={18}/>} color="#7c3aed" />
        <MetricCard label="Fees Collected (USD)" value="$2,840" icon={<Wallet size={18}/>}   color="#059669" trend="up" />
      </div>

      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
        <SectionHead title="Team Performance Overview" action="Full Report" actionHref="/school/reports" />
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:G, color:"#fff" }}>
                {["Team","Coach","Squad","W","L","D","Standing"].map(h => (
                  <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontWeight:800, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((t,i) => (
                <tr key={t.name} style={{ background:i%2===0?"#f9fafb":"#fff" }}>
                  <td style={{ padding:"8px 12px", fontWeight:700, color:"#111" }}>{t.name}</td>
                  <td style={{ padding:"8px 12px", color:"#555" }}>{t.coach}</td>
                  <td style={{ padding:"8px 12px", textAlign:"center", fontWeight:700 }}>{t.players}</td>
                  <td style={{ padding:"8px 12px", textAlign:"center", color:"#059669", fontWeight:800 }}>{t.wins}</td>
                  <td style={{ padding:"8px 12px", textAlign:"center", color:"#dc2626", fontWeight:800 }}>{t.losses}</td>
                  <td style={{ padding:"8px 12px", textAlign:"center", color:"#ca8a04", fontWeight:800 }}>{t.draws}</td>
                  <td style={{ padding:"8px 12px" }}><Pill label={t.standing} color={G} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
          <SectionHead title="Announcements" action="New" actionHref="/school/announcements/new" />
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {announcements.map((a,i) => (
              <div key={i} style={{ display:"flex", gap:10, padding:"10px 12px", background:a.urgent?"#fef2f2":"#f9fafb", borderRadius:10, border:a.urgent?"1px solid #fecaca":"1px solid #f0f0f0" }}>
                <Megaphone size={14} color={a.urgent?"#dc2626":GOLD} style={{ flexShrink:0, marginTop:2 }} />
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:a.urgent?"#dc2626":"#111" }}>{a.title}</div>
                  <div style={{ fontSize:10, color:"#999", marginTop:2 }}>{a.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
          <SectionHead title="Fee Collection Status" action="Full Report" actionHref="/school/fees" />
          {[
            { label:"Paid in full",   pct:72, color:"#059669" },
            { label:"Partially paid", pct:18, color:GOLD      },
            { label:"Outstanding",    pct:10, color:"#dc2626" },
          ].map(f => (
            <div key={f.label} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:11, fontWeight:600, color:"#555" }}>{f.label}</span>
                <span style={{ fontSize:11, fontWeight:800, color:f.color }}>{f.pct}%</span>
              </div>
              <div style={{ height:8, background:"#f0f0f0", borderRadius:4, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${f.pct}%`, background:f.color, borderRadius:4 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop:14, padding:"10px 12px", background:"#f0fdf4", borderRadius:10, border:"1px solid #bbf7d0" }}>
            <div style={{ fontSize:11, fontWeight:700, color:G }}>Term 3 target: USD $4,000</div>
            <div style={{ fontSize:10, color:"#555", marginTop:2 }}>USD $2,840 collected — 71% of target</div>
          </div>
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
        <SectionHead title="Quick Actions" />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
          {[
            { label:"Send Announcement",  icon:<Megaphone size={16}/>,    href:"/school/announcements/new", color:G         },
            { label:"Add Coach",          icon:<UserCheck size={16}/>,     href:"/school/staff/add",         color:"#2563eb" },
            { label:"View EPR Report",    icon:<BarChart3 size={16}/>,     href:"/school/reports/epr",       color:GOLD      },
            { label:"NASH Registration",  icon:<ClipboardList size={16}/>, href:"/school/compliance/nash",   color:"#7c3aed" },
            { label:"Fee Collection",     icon:<DollarSign size={16}/>,    href:"/school/fees",              color:"#059669" },
            { label:"AI Analysis",        icon:<Activity size={16}/>,      href:"/school/analysis",          color:"#dc2626" },
          ].map(a => (
            <Link key={a.label} href={a.href}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:a.color+"0e", border:`1px solid ${a.color}20`, borderRadius:12, textDecoration:"none" }}>
              <span style={{ color:a.color }}>{a.icon}</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#333" }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COACH VIEW
// ══════════════════════════════════════════════════════════════════════════════
function CoachDashboard() {
  const players = [
    { name:"Tatenda Moyo",  pos:"ST",  age:17, grsScore:82, risk:"Low",      attendance:"95%", form:"●●●●○" },
    { name:"Farai Dube",    pos:"CM",  age:16, grsScore:76, risk:"Low",      attendance:"88%", form:"●●●○○" },
    { name:"Simba Ncube",   pos:"CB",  age:17, grsScore:68, risk:"High",     attendance:"91%", form:"●●○○○" },
    { name:"Tafara Choto",  pos:"GK",  age:16, grsScore:71, risk:"Low",      attendance:"98%", form:"●●●●●" },
    { name:"Kudzi Mhuru",   pos:"RW",  age:15, grsScore:79, risk:"Moderate", attendance:"82%", form:"●●●●○" },
  ];

  const upcoming = [
    { date:"19 Jul", opponent:"Harare High",   venue:"Home", comp:"NASH U18" },
    { date:"26 Jul", opponent:"St Georges",    venue:"Away", comp:"NASH U18" },
    { date:"2 Aug",  opponent:"Prince Edward", venue:"Home", comp:"NASH Cup" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <Alert type="danger" message="Simba Ncube flagged HIGH injury risk by GRS AI (knee valgus detected). Requires clearance before Saturday's fixture." />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12 }}>
        <MetricCard label="Squad Size"      value={22}        icon={<Users size={18}/>}     color={G}       />
        <MetricCard label="Season Record"   value="8W-2L-2D"  icon={<Trophy size={18}/>}    color="#2563eb" />
        <MetricCard label="Next Fixture"    value="Sat 19"    icon={<Calendar size={18}/>}  color={GOLD}    sub="vs Harare High" />
        <MetricCard label="Avg GRS Score"   value={75}        icon={<Activity size={18}/>}  color={G}       trend="up" />
        <MetricCard label="Injury Flags"    value={2}         icon={<Shield size={18}/>}    color="#dc2626" />
        <MetricCard label="Training Streak" value="6"         icon={<Zap size={18}/>}       color={GOLD}    sub="sessions" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
          <SectionHead title="Squad Overview" action="Full Squad" actionHref="/coach/squad" />
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {players.map(p => (
              <div key={p.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:"#f9fafb", borderRadius:10, border:"1px solid #f0f0f0" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:G+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:G, flexShrink:0 }}>
                  {p.name.split(" ").map(n=>n[0]).join("")}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#111", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.name}</div>
                  <div style={{ fontSize:10, color:"#888" }}>{p.pos} · Age {p.age} · {p.attendance} att.</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:G }}>{p.grsScore}</div>
                  <Pill label={p.risk} color={p.risk==="High"?"#dc2626":p.risk==="Moderate"?GOLD:"#059669"} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
            <SectionHead title="Upcoming Fixtures" action="All Fixtures" actionHref="/coach/fixtures" />
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {upcoming.map(f => (
                <div key={f.date} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:"#f9fafb", borderRadius:10 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:G, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:9, fontWeight:900, color:"#fff", textAlign:"center", lineHeight:1.2 }}>{f.date}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#111" }}>vs {f.opponent}</div>
                    <div style={{ fontSize:10, color:"#888" }}>{f.comp}</div>
                  </div>
                  <Pill label={f.venue} color={f.venue==="Home"?G:"#2563eb"} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
            <SectionHead title="Quick Actions" />
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"Log Training Session",    icon:<ClipboardList size={14}/>, href:"/coach/training/new",     color:G         },
                { label:"Run AI Player Analysis",  icon:<Activity size={14}/>,      href:"/coach/tactics/analysis", color:"#dc2626" },
                { label:"Message Parents",         icon:<MessageSquare size={14}/>, href:"/coach/messages",         color:"#7c3aed" },
                { label:"Select Team for Fixture", icon:<Target size={14}/>,        href:"/coach/selection",        color:"#2563eb" },
              ].map(a => (
                <Link key={a.label} href={a.href}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:a.color+"0e", border:`1px solid ${a.color}20`, borderRadius:10, textDecoration:"none" }}>
                  <span style={{ color:a.color }}>{a.icon}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#333" }}>{a.label}</span>
                  <ChevronRight size={12} color="#d1d5db" style={{ marginLeft:"auto" }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
        <SectionHead title="Message Parents" action="View All" actionHref="/coach/messages" />
        <div style={{ display:"flex", gap:10 }}>
          <input placeholder="Type a message to all squad parents..."
            style={{ flex:1, padding:"10px 14px", borderRadius:10, border:"1px solid #e5e5e5", fontSize:12, outline:"none" }} />
          <button style={{ padding:"10px 18px", background:G, color:"#fff", borderRadius:10, border:"none", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            <Send size={13}/> Send
          </button>
        </div>
        <div style={{ fontSize:10, color:"#aaa", marginTop:6 }}>Sends to all parents linked to your squad on GRS · WhatsApp delivery</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PARENT VIEW
// ══════════════════════════════════════════════════════════════════════════════
function ParentDashboard() {
  const child = {
    name:"Tatenda Moyo", age:17, team:"Football Boys U18", coach:"T. Chikwanda", position:"Striker",
    grsScore:82,
    academic:{ english:72, maths:68, science:75, average:72 },
    athletic:{ power:85, pace:78, balance:74, reaction:80, endurance:71, technique:82 },
    risk:"Low", attendance:"95%",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ background:`linear-gradient(135deg, ${G}, #2d7a3a)`, borderRadius:16, padding:20, color:"#fff" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:54, height:54, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:900 }}>
            TM
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:900 }}>{child.name}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>{child.team} · {child.position} · Age {child.age}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:2 }}>Coach: {child.coach}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:32, fontWeight:900, color:GOLD }}>{child.grsScore}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.65)" }}>GRS Score</div>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12 }}>
        <MetricCard label="Injury Risk"   value={child.risk}              icon={<Shield size={18}/>}       color="#059669" />
        <MetricCard label="Attendance"    value={child.attendance}        icon={<CheckCircle2 size={18}/>} color={G}       trend="up" />
        <MetricCard label="Academic Avg"  value={`${child.academic.average}%`} icon={<BookOpen size={18}/>} color="#7c3aed" />
        <MetricCard label="Next Fixture"  value="Sat 19 Jul"             icon={<Calendar size={18}/>}     color={GOLD}    sub="vs Harare High" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
          <SectionHead title="Academic Performance" />
          {Object.entries(child.academic).filter(([k])=>k!=="average").map(([subj, score]) => (
            <div key={subj} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:11, fontWeight:600, color:"#555", textTransform:"capitalize" }}>{subj}</span>
                <span style={{ fontSize:11, fontWeight:800, color: score>=70?G:score>=50?GOLD:"#dc2626" }}>{score}%</span>
              </div>
              <div style={{ height:6, background:"#f0f0f0", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${score}%`, background: score>=70?G:score>=50?GOLD:"#dc2626", borderRadius:3 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
          <SectionHead title="Athletic Profile (GRS AI)" />
          {Object.entries(child.athletic).map(([dim, score]) => (
            <div key={dim} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:11, fontWeight:600, color:"#555", textTransform:"capitalize" }}>{dim}</span>
                <span style={{ fontSize:11, fontWeight:800, color:G }}>{score}</span>
              </div>
              <div style={{ height:6, background:"#f0f0f0", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${score}%`, background:G, borderRadius:3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
          <SectionHead title="Messages from Coach" />
          {[
            { from:"Coach Chikwanda", msg:"Tatenda had an excellent training session today. His first touch has improved significantly.", time:"2h ago" },
            { from:"School Admin",    msg:"Term 3 sport fees due by 31 July 2026. Please pay via EcoCash.", time:"1d ago" },
          ].map((m,i) => (
            <div key={i} style={{ padding:"10px 12px", background:"#f9fafb", borderRadius:10, border:"1px solid #f0f0f0", marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:G }}>{m.from} · <span style={{ color:"#aaa", fontWeight:400 }}>{m.time}</span></div>
              <div style={{ fontSize:11, color:"#555", marginTop:4, lineHeight:1.5 }}>{m.msg}</div>
            </div>
          ))}
        </div>

        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
          <SectionHead title="Fees & Payments" />
          {[
            { item:"Term 3 Sport Programme", amount:"USD $15", status:"Paid",    color:"#059669" },
            { item:"NASH Registration Fee",  amount:"USD $5",  status:"Pending", color:GOLD      },
            { item:"GRS Parent Dashboard",   amount:"USD $2",  status:"Active",  color:G         },
          ].map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 12px", background:"#f9fafb", borderRadius:10, marginBottom:8 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#111" }}>{f.item}</div>
                <div style={{ fontSize:10, color:"#888" }}>{f.amount}</div>
              </div>
              <Pill label={f.status} color={f.color} />
            </div>
          ))}
          <button style={{ width:"100%", padding:"12px", background:G, color:"#fff", borderRadius:10, border:"none", fontWeight:800, fontSize:12, cursor:"pointer" }}>
            Pay via EcoCash / InnBucks →
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT VIEW
// ══════════════════════════════════════════════════════════════════════════════
function StudentDashboard() {
  const drills = [
    { name:"Lateral Band Walk",       category:"Injury Prevention", complete:true,  due:"Done"      },
    { name:"Wall Acceleration Drill", category:"Sprint Mechanics",  complete:true,  due:"Done"      },
    { name:"First Touch — Left Foot", category:"Technical",         complete:false, due:"Today"     },
    { name:"Clamshell Exercise",      category:"Injury Prevention", complete:false, due:"Tomorrow"  },
    { name:"Box Landing Drill",       category:"Physical",          complete:false, due:"This week" },
  ];

  const stats = [
    { label:"GRS Athletic Score",  value:82, max:100, color:G         },
    { label:"Drills Completed",    value:47, max:60,  color:"#2563eb" },
    { label:"Training Attendance", value:95, max:100, color:"#059669" },
    { label:"Academic Average",    value:72, max:100, color:"#7c3aed" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ background:`linear-gradient(135deg, ${G}, #2d7a3a)`, borderRadius:16, padding:20, color:"#fff" }}>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.65)", marginBottom:4 }}>Good morning, Tatenda</div>
        <div style={{ fontSize:22, fontWeight:900, marginBottom:2 }}>Your next fixture is Saturday</div>
        <div style={{ fontSize:13, color:GOLD, fontWeight:700 }}>vs Harare High School · Home · NASH U18</div>
        <div style={{ marginTop:14, display:"flex", gap:10 }}>
          <div style={{ flex:1, background:"rgba(255,255,255,0.12)", borderRadius:10, padding:"10px 14px" }}>
            <div style={{ fontSize:22, fontWeight:900, color:GOLD }}>82</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.65)" }}>Your GRS Score</div>
          </div>
          <div style={{ flex:1, background:"rgba(255,255,255,0.12)", borderRadius:10, padding:"10px 14px" }}>
            <div style={{ fontSize:22, fontWeight:900 }}>3</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.65)" }}>Drills due today</div>
          </div>
          <div style={{ flex:1, background:"rgba(255,255,255,0.12)", borderRadius:10, padding:"10px 14px" }}>
            <div style={{ fontSize:22, fontWeight:900 }}>Low</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.65)" }}>Injury risk</div>
          </div>
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
        <SectionHead title="My Progress" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:11, fontWeight:600, color:"#555" }}>{s.label}</span>
                <span style={{ fontSize:11, fontWeight:800, color:s.color }}>{s.value}</span>
              </div>
              <div style={{ height:8, background:"#f0f0f0", borderRadius:4, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(s.value/s.max)*100}%`, background:s.color, borderRadius:4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
          <SectionHead title="My Drills" action="All Drills" actionHref="/player/drills" />
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {drills.map(d => (
              <div key={d.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:d.complete?"#f0fdf4":"#f9fafb", borderRadius:10, border:d.complete?"1px solid #bbf7d0":"1px solid #f0f0f0" }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:d.complete?G:"#e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {d.complete && <CheckCircle2 size={13} color="#fff" />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:d.complete?"#555":"#111", textDecoration:d.complete?"line-through":"none", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.name}</div>
                  <div style={{ fontSize:10, color:"#aaa" }}>{d.category}</div>
                </div>
                <Pill label={d.due} color={d.due==="Today"?"#dc2626":d.due==="Done"?"#059669":GOLD} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
            <SectionHead title="My Talent Passport" action="View" actionHref="/player/passport" />
            <div style={{ padding:"12px", background:"#f0fdf4", borderRadius:10, border:"1px solid #bbf7d0", marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:G }}>Visible to scouts</div>
              <div style={{ fontSize:10, color:"#555", marginTop:2 }}>Your profile has been viewed 3 times this week</div>
            </div>
            {[["Position","Striker"],["Best Foot","Right"],["Province","Harare"],["Passport Views","3 this week"],["Scholarship Path","In Progress"]].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f5f5f5" }}>
                <span style={{ fontSize:11, color:"#888" }}>{k}</span>
                <span style={{ fontSize:11, fontWeight:700, color:"#111" }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e5e5e5", padding:18 }}>
            <SectionHead title="THUTO AI Coach" action="Chat" actionHref="/player/thuto" />
            <div style={{ padding:"12px 14px", background:"#f0fdf4", borderRadius:10, border:"1px solid #bbf7d0", fontSize:12, color:"#166534", lineHeight:1.6 }}>
              &quot;Tatenda, your left foot control has improved 12% this month. Focus on your weak-foot receiving drills today — 2 more sessions and you&apos;ll unlock the Advanced badge.&quot;
            </div>
            <Link href="/player/thuto"
              style={{ display:"block", marginTop:10, padding:"10px", background:G, color:"#fff", borderRadius:10, fontWeight:700, fontSize:12, textAlign:"center", textDecoration:"none" }}>
              Ask THUTO a question →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function SchoolDashboardPage() {
  const [role, setRole] = useState<Role>("headmaster");
  const currentRole = ROLES[role];

  const ROLE_VIEWS: Record<Role, React.ReactNode> = {
    headmaster: <HeadmasterDashboard />,
    coach:      <CoachDashboard />,
    parent:     <ParentDashboard />,
    student:    <StudentDashboard />,
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f4f2ee" }}>
      <header style={{ background:"#fff", borderBottom:"1px solid #e5e5e5", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px", height:56, display:"flex", alignItems:"center", gap:14 }}>
          <Link href="/" style={{ color:"#ccc" }}><Award size={18}/></Link>
          <div style={{ width:1, height:20, background:"#e5e5e5" }} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:900, color:"#111", lineHeight:1 }}>School & Academy Hub</div>
            <div style={{ fontSize:10, color:"#aaa", marginTop:1 }}>Churchill High School · 2026</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", background:currentRole.color+"12", borderRadius:20, border:`1px solid ${currentRole.color}25` }}>
            <span style={{ color:currentRole.color }}>{currentRole.icon}</span>
            <span style={{ fontSize:11, fontWeight:700, color:currentRole.color }}>{currentRole.tagline}</span>
          </div>
          <button style={{ position:"relative", background:"none", border:"none", cursor:"pointer", color:"#555" }}>
            <Bell size={18}/>
            <span style={{ position:"absolute", top:-2, right:-2, width:8, height:8, background:"#dc2626", borderRadius:"50%", border:"2px solid #fff" }} />
          </button>
        </div>
      </header>

      <div style={{ background:"#fff", borderBottom:"1px solid #e5e5e5" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px", display:"flex", gap:0 }}>
          {(Object.entries(ROLES) as [Role, RoleConfig][]).map(([key, cfg]) => (
            <button key={key} onClick={() => setRole(key)}
              style={{
                padding:"12px 20px", background:"none", border:"none", cursor:"pointer",
                borderBottom: role===key ? `3px solid ${cfg.color}` : "3px solid transparent",
                color: role===key ? cfg.color : "#888",
                fontWeight: role===key ? 800 : 600,
                fontSize:13, display:"flex", alignItems:"center", gap:6, transition:"all 0.15s",
              }}>
              {cfg.icon}
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth:1100, margin:"0 auto", padding:"20px" }}>
        {ROLE_VIEWS[role]}
      </main>
    </div>
  );
}
