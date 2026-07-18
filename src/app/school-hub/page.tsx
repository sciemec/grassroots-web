"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import {
  School, Users, Trophy, Calendar, MessageSquare, FileText,
  Plus, CheckCircle, AlertCircle, User, Activity, Bell,
  Star, TrendingUp, Search, Send, ChevronRight,
  BookOpen, Shield, Dumbbell, Megaphone, Phone, Mail,
  BarChart2, ClipboardList, UserCheck, GraduationCap,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type SchoolRole = "headmaster" | "coach" | "parent";

interface Team {
  id: string;
  name: string;
  sport: string;
  emoji: string;
  age_group: string;
  coach: string;
  players: number;
  wins: number;
  draws: number;
  losses: number;
}

interface Coach {
  id: string;
  name: string;
  sport: string;
  team: string;
  phone: string;
  email: string;
  experience: string;
}

interface Player {
  id: string;
  name: string;
  sport: string;
  team: string;
  position: string;
  attendance: number;
  form: "Excellent" | "Good" | "Average" | "Poor";
  age: number;
}

interface Fixture {
  id: string;
  sport: string;
  emoji: string;
  home_team: string;
  away_team: string;
  date: string;
  venue: string;
  result?: string;
  status: "upcoming" | "completed" | "live";
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  from: string;
  date: string;
  priority: "high" | "normal" | "low";
}

interface Message {
  id: string;
  from: string;
  from_role: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
}

// ── Seed data ──────────────────────────────────────────────────────────────────

const TEAMS: Team[] = [
  { id: "1", name: "Senior Boys Football", sport: "Football", emoji: "⚽", age_group: "U19", coach: "Mr. Chikwanda",  players: 22, wins: 8,  draws: 3, losses: 2 },
  { id: "2", name: "Senior Girls Netball", sport: "Netball",  emoji: "🏐", age_group: "U19", coach: "Mrs. Moyo",      players: 15, wins: 10, draws: 1, losses: 1 },
  { id: "3", name: "Junior Boys Football", sport: "Football", emoji: "⚽", age_group: "U15", coach: "Mr. Sibanda",    players: 20, wins: 5,  draws: 4, losses: 3 },
  { id: "4", name: "Athletics Squad",      sport: "Athletics",emoji: "🏃", age_group: "Open",coach: "Mr. Mhuru",      players: 18, wins: 12, draws: 0, losses: 2 },
  { id: "5", name: "U13 Cricket",          sport: "Cricket",  emoji: "🏏", age_group: "U13", coach: "Mr. Nhamo",     players: 14, wins: 6,  draws: 2, losses: 4 },
];

const COACHES: Coach[] = [
  { id: "1", name: "Mr. Chikwanda", sport: "Football",  team: "Senior Boys Football", phone: "0771 234 567", email: "chikwanda@school.ac.zw", experience: "8 years"  },
  { id: "2", name: "Mrs. Moyo",     sport: "Netball",   team: "Senior Girls Netball", phone: "0772 345 678", email: "moyo@school.ac.zw",      experience: "12 years" },
  { id: "3", name: "Mr. Sibanda",   sport: "Football",  team: "Junior Boys Football", phone: "0773 456 789", email: "sibanda@school.ac.zw",   experience: "5 years"  },
  { id: "4", name: "Mr. Mhuru",     sport: "Athletics", team: "Athletics Squad",      phone: "0774 567 890", email: "mhuru@school.ac.zw",     experience: "10 years" },
  { id: "5", name: "Mr. Nhamo",     sport: "Cricket",   team: "U13 Cricket",          phone: "0775 678 901", email: "nhamo@school.ac.zw",     experience: "6 years"  },
];

const PLAYERS: Player[] = [
  { id: "1", name: "Tafara Musona",         sport: "Football",  team: "Senior Boys Football", position: "Striker",       attendance: 92, form: "Excellent", age: 17 },
  { id: "2", name: "Chido Mupfumira",       sport: "Netball",   team: "Senior Girls Netball", position: "Goal Shooter",  attendance: 88, form: "Good",      age: 16 },
  { id: "3", name: "Simba Ndlovu",          sport: "Football",  team: "Senior Boys Football", position: "Midfielder",    attendance: 95, form: "Excellent", age: 18 },
  { id: "4", name: "Rudo Zvobgo",           sport: "Athletics", team: "Athletics Squad",      position: "Sprinter",      attendance: 78, form: "Good",      age: 15 },
  { id: "5", name: "Tatenda Chidziva",      sport: "Football",  team: "Junior Boys Football", position: "Goalkeeper",    attendance: 85, form: "Average",   age: 14 },
  { id: "6", name: "Farai Mutambanengwe",   sport: "Cricket",   team: "U13 Cricket",          position: "All-Rounder",   attendance: 90, form: "Good",      age: 13 },
  { id: "7", name: "Ngoni Tsvangirai",      sport: "Football",  team: "Senior Boys Football", position: "Defender",      attendance: 70, form: "Poor",      age: 17 },
  { id: "8", name: "Memory Chiroto",        sport: "Netball",   team: "Senior Girls Netball", position: "Centre",        attendance: 96, form: "Excellent", age: 16 },
];

const FIXTURES: Fixture[] = [
  { id: "1", sport: "Football",  emoji: "⚽", home_team: "Our School",      away_team: "Harare High",       date: "2026-07-20", venue: "Home Ground",     status: "upcoming"  },
  { id: "2", sport: "Netball",   emoji: "🏐", home_team: "Churchill Girls", away_team: "Our School",        date: "2026-07-22", venue: "Churchill Courts", status: "upcoming"  },
  { id: "3", sport: "Athletics", emoji: "🏃", home_team: "Our School",      away_team: "Multiple Schools",  date: "2026-07-25", venue: "National Stadium", status: "upcoming"  },
  { id: "4", sport: "Football",  emoji: "⚽", home_team: "Our School",      away_team: "Prince Edward",     date: "2026-07-15", venue: "Home Ground",     result: "2 - 1",    status: "completed" },
  { id: "5", sport: "Cricket",   emoji: "🏏", home_team: "Gateway",         away_team: "Our School",        date: "2026-07-10", venue: "Gateway Oval",    result: "Won by 45 runs", status: "completed" },
];

const ANNOUNCEMENTS: Announcement[] = [
  { id: "1", title: "NASH Football Registration Deadline",  body: "All teams must register for NASH Football Championship by July 25. Submit player lists to Mr. Chikwanda before end of school.", from: "Headmaster",        date: "2026-07-16", priority: "high"   },
  { id: "2", title: "Sports Day 2026 — Save the Date",      body: "Annual Inter-House Sports Day will be held on August 15. All house captains must submit team lists by August 1.",                from: "Sports Department", date: "2026-07-14", priority: "normal" },
  { id: "3", title: "New Training Schedule",                 body: "From next week, all training sessions will move to 3:30 PM due to the new timetable. Coaches please inform your squads.",        from: "Mr. Chikwanda",    date: "2026-07-12", priority: "low"    },
];

const MESSAGES: Message[] = [
  { id: "1", from: "Mrs. Moyo",    from_role: "Coach",       subject: "Chido's Excellent Progress",  body: "I wanted to let you know that Chido has been performing exceptionally well in practice this term. She has shown strong leadership skills and her goal accuracy has improved significantly.",                                       date: "2026-07-15", read: false },
  { id: "2", from: "Mr. Chikwanda",from_role: "Coach",       subject: "Attendance Concern — Ngoni",  body: "Ngoni has missed 3 training sessions this week without notice. Please ensure he attends regularly as we have NASH qualifiers coming up in two weeks. Regular training is essential for selection.",                           date: "2026-07-14", read: true  },
  { id: "3", from: "Headmaster",   from_role: "Headmaster",  subject: "Term 3 Sports Performance",   body: "Our school has had an outstanding Term 3 in sports. The Senior Boys Football team are through to the NASH quarterfinals, the Netball girls are unbeaten this term, and our Athletics squad has broken 3 school records.", date: "2026-07-10", read: false },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formColor(form: Player["form"]) {
  return form === "Excellent" ? "#16a34a"
       : form === "Good"      ? "#2563eb"
       : form === "Average"   ? "#d97706"
       :                        "#dc2626";
}

function attendanceColor(pct: number) {
  return pct >= 90 ? "#16a34a" : pct >= 75 ? "#d97706" : "#dc2626";
}

function priorityStyle(p: Announcement["priority"]) {
  return p === "high"   ? { bg: "#fef2f2", border: "#fecaca", dot: "#dc2626" }
       : p === "normal" ? { bg: "#eff6ff", border: "#bfdbfe", dot: "#2563eb" }
       :                  { bg: "#f0fdf4", border: "#bbf7d0", dot: "#16a34a" };
}

// ── Main component ─────────────────────────────────────────────────────────────

const TABS = [
  { key: "overview",      label: "Overview",      icon: BarChart2       },
  { key: "teams",         label: "Teams",         icon: Trophy          },
  { key: "coaches",       label: "Coaches",       icon: UserCheck       },
  { key: "players",       label: "Players",       icon: Users           },
  { key: "fixtures",      label: "Fixtures",      icon: Calendar        },
  { key: "messages",      label: "Messages",      icon: MessageSquare   },
  { key: "announcements", label: "Notices",       icon: Megaphone       },
  { key: "reports",       label: "Reports",       icon: FileText        },
] as const;

type Tab = typeof TABS[number]["key"];

const ROLES: { key: SchoolRole; label: string; icon: React.ElementType; color: string }[] = [
  { key: "headmaster", label: "Headmaster", icon: GraduationCap, color: "#1a5c2a" },
  { key: "coach",      label: "Coach",      icon: Shield,         color: "#1d4ed8" },
  { key: "parent",     label: "Parent",     icon: Heart,          color: "#7c3aed" },
];

export default function SchoolHubPage() {
  const user = useAuthStore((s) => s.user);

  const [role,         setRole]         = useState<SchoolRole>("headmaster");
  const [tab,          setTab]          = useState<Tab>("overview");
  const [search,       setSearch]       = useState("");
  const [activeMsg,    setActiveMsg]    = useState<Message | null>(null);
  const [newMsgBody,   setNewMsgBody]   = useState("");
  const [sending,      setSending]      = useState(false);
  const [msgSent,      setMsgSent]      = useState(false);
  const [newAnnTitle,  setNewAnnTitle]  = useState("");
  const [newAnnBody,   setNewAnnBody]   = useState("");
  const [annPosted,    setAnnPosted]    = useState(false);
  const [localAnns,    setLocalAnns]    = useState<Announcement[]>(ANNOUNCEMENTS);

  // Persist role choice
  useEffect(() => {
    const saved = localStorage.getItem("gs_school_role") as SchoolRole | null;
    if (saved) setRole(saved);
  }, []);
  const switchRole = (r: SchoolRole) => { setRole(r); localStorage.setItem("gs_school_role", r); };

  // Derived stats
  const totalPlayers  = TEAMS.reduce((s, t) => s + t.players, 0);
  const totalWins     = TEAMS.reduce((s, t) => s + t.wins,    0);
  const lowAttendance = PLAYERS.filter((p) => p.attendance < 80);
  const unreadCount   = MESSAGES.filter((m) => !m.read).length;

  const filteredPlayers  = PLAYERS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.team.toLowerCase().includes(search.toLowerCase())
  );

  const roleInfo = ROLES.find((r) => r.key === role)!;

  // Send message (localStorage demo)
  const sendReply = () => {
    if (!newMsgBody.trim()) return;
    setSending(true);
    setTimeout(() => { setSending(false); setMsgSent(true); setNewMsgBody(""); setTimeout(() => setMsgSent(false), 3000); }, 1000);
  };

  // Post announcement
  const postAnnouncement = () => {
    if (!newAnnTitle.trim() || !newAnnBody.trim()) return;
    const a: Announcement = { id: Date.now().toString(), title: newAnnTitle, body: newAnnBody, from: user?.name ?? "You", date: new Date().toISOString().slice(0, 10), priority: "normal" };
    setLocalAnns([a, ...localAnns]);
    setNewAnnTitle(""); setNewAnnBody("");
    setAnnPosted(true);
    setTimeout(() => setAnnPosted(false), 3000);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#1a5c2a", color: "#fff", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, paddingBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <School size={22} color="#f0b429" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.1 }}>GrassRoots Academy Hub</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Zimbabwe Sports School Network</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={18} style={{ opacity: 0.8 }} />
              {unreadCount > 0 && (
                <span style={{ background: "#dc2626", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{unreadCount}</span>
              )}
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f0b429", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#1a3a1a", fontSize: 14, marginLeft: 8 }}>
                {(user?.name ?? "U").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Role switcher */}
          <div style={{ display: "flex", gap: 8, paddingBottom: 0 }}>
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = role === r.key;
              return (
                <button key={r.key} onClick={() => switchRole(r.key)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer", fontWeight: active ? 700 : 500, fontSize: 13,
                    backgroundColor: active ? "#f4f2ee" : "transparent",
                    color: active ? "#1a5c2a" : "rgba(255,255,255,0.8)",
                    transition: "all 0.15s",
                  }}>
                  <Icon size={15} />
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Role context bar ─────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          {(() => { const Icon = roleInfo.icon; return <Icon size={16} color={roleInfo.color} />; })()}
          <span style={{ fontSize: 13, color: "#555" }}>
            Viewing as <strong style={{ color: roleInfo.color }}>{roleInfo.label}</strong>
            {role === "coach"  && " — Mr. Chikwanda (Senior Boys Football)"}
            {role === "parent" && " — Parent of Tafara Musona (U19 Football)"}
          </span>
        </div>
      </div>

      {/* ── Tab nav ──────────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5", overflowX: "auto" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", padding: "0 16px" }}>
          {TABS.map((t) => {
            // Hide some tabs based on role
            if (role === "parent" && ["teams","coaches","announcements","reports"].includes(t.key)) return null;
            if (role === "coach"  && ["reports"].includes(t.key)) return null;
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 14px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: "nowrap",
                  color: active ? "#1a5c2a" : "#666",
                  borderBottom: active ? "2px solid #1a5c2a" : "2px solid transparent",
                  backgroundColor: "transparent",
                }}>
                <Icon size={15} />
                {t.label}
                {t.key === "messages" && unreadCount > 0 && (
                  <span style={{ background: "#dc2626", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{unreadCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Page body ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 20 }}>
              {role === "parent" ? "Your Child's Dashboard" : "School Sports Overview"}
            </h2>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Total Teams",    value: TEAMS.length,    icon: Trophy,    color: "#1a5c2a", bg: "#f0fdf4" },
                { label: "Student Athletes",value: totalPlayers,   icon: Users,     color: "#1d4ed8", bg: "#eff6ff" },
                { label: "Coaches",        value: COACHES.length,  icon: UserCheck, color: "#7c3aed", bg: "#faf5ff" },
                { label: "Wins This Term", value: totalWins,       icon: Star,      color: "#c8962a", bg: "#fffbeb" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} style={{ backgroundColor: s.bg, border: `1px solid ${s.color}22`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>{s.label}</span>
                      <Icon size={18} color={s.color} />
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* Top performing teams */}
              <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 8 }}>
                  <Trophy size={16} color="#c8962a" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Top Performing Teams</span>
                </div>
                <div>
                  {TEAMS.sort((a, b) => b.wins - a.wins).slice(0, 4).map((t) => {
                    const total = t.wins + t.draws + t.losses;
                    const pct   = total ? Math.round((t.wins / total) * 100) : 0;
                    return (
                      <div key={t.id} style={{ padding: "12px 20px", borderBottom: "1px solid #f9f9f9", display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 22 }}>{t.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{t.name}</div>
                          <div style={{ fontSize: 12, color: "#888" }}>{t.wins}W {t.draws}D {t.losses}L</div>
                          <div style={{ height: 4, backgroundColor: "#f0f0f0", borderRadius: 2, marginTop: 4 }}>
                            <div style={{ height: 4, width: `${pct}%`, backgroundColor: "#1a5c2a", borderRadius: 2 }} />
                          </div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1a5c2a" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Attention needed */}
              <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertCircle size={16} color="#dc2626" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Needs Attention</span>
                </div>
                {lowAttendance.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#888", fontSize: 14 }}>
                    <CheckCircle size={28} color="#16a34a" style={{ margin: "0 auto 8px" }} />
                    All players above 80% attendance
                  </div>
                ) : lowAttendance.map((p) => (
                  <div key={p.id} style={{ padding: "12px 20px", borderBottom: "1px solid #f9f9f9", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={16} color="#dc2626" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{p.team}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: attendanceColor(p.attendance) }}>{p.attendance}%</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>attendance</div>
                    </div>
                  </div>
                ))}

                {/* Latest announcement */}
                <div style={{ padding: "12px 20px", borderTop: "1px solid #f0f0f0", backgroundColor: "#fffbeb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Megaphone size={13} color="#c8962a" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#c8962a" }}>LATEST NOTICE</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{localAnns[0]?.title}</div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>From {localAnns[0]?.from}</div>
                </div>
              </div>

              {/* Upcoming fixtures */}
              <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 8 }}>
                  <Calendar size={16} color="#1d4ed8" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Upcoming Fixtures</span>
                </div>
                {FIXTURES.filter((f) => f.status === "upcoming").map((f) => (
                  <div key={f.id} style={{ padding: "12px 20px", borderBottom: "1px solid #f9f9f9", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{f.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{f.home_team} vs {f.away_team}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{f.venue}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>{f.date}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent messages */}
              <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageSquare size={16} color="#7c3aed" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Recent Messages</span>
                </div>
                {MESSAGES.map((m) => (
                  <button key={m.id} onClick={() => { setTab("messages"); setActiveMsg(m); }}
                    style={{ width: "100%", textAlign: "left", padding: "12px 20px", borderBottom: "1px solid #f9f9f9", display: "flex", alignItems: "flex-start", gap: 12, background: m.read ? "#fff" : "#f5f3ff", border: "none", cursor: "pointer" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: m.read ? "transparent" : "#7c3aed", marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: m.read ? 500 : 700, fontSize: 14, color: "#1a1a1a" }}>{m.subject}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>From {m.from} ({m.from_role})</div>
                    </div>
                    <ChevronRight size={14} color="#aaa" style={{ marginTop: 4 }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TEAMS ──────────────────────────────────────────────────────────── */}
        {tab === "teams" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>School Teams</h2>
              {role === "headmaster" && (
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  <Plus size={15} /> Add Team
                </button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {TEAMS.map((t) => {
                const total = t.wins + t.draws + t.losses;
                const pct   = total ? Math.round((t.wins / total) * 100) : 0;
                return (
                  <div key={t.id} style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", background: "linear-gradient(135deg,#1a5c2a,#2d7a3a)", color: "#fff" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 28 }}>{t.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</div>
                          <div style={{ fontSize: 12, opacity: 0.8 }}>{t.age_group} · Coach: {t.coach}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                        {[
                          { label: "Players", value: t.players },
                          { label: "Wins",    value: t.wins,   color: "#16a34a" },
                          { label: "Draws",   value: t.draws,  color: "#d97706" },
                          { label: "Losses",  value: t.losses, color: "#dc2626" },
                        ].map((s) => (
                          <div key={s.label} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: s.color ?? "#1a1a1a" }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: "#888" }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, backgroundColor: "#f0f0f0", borderRadius: 3 }}>
                          <div style={{ height: 6, width: `${pct}%`, backgroundColor: "#1a5c2a", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2a" }}>{pct}% win rate</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── COACHES ────────────────────────────────────────────────────────── */}
        {tab === "coaches" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Coaching Staff</h2>
              {role === "headmaster" && (
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  <Plus size={15} /> Add Coach
                </button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {COACHES.map((c) => (
                <div key={c.id} style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <UserCheck size={22} color="#1d4ed8" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: "#555" }}>{c.team}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#666" }}>
                      <Activity size={14} color="#1a5c2a" />
                      <span>Sport: <strong>{c.sport}</strong></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#666" }}>
                      <BookOpen size={14} color="#1a5c2a" />
                      <span>Experience: <strong>{c.experience}</strong></span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#666" }}>
                      <Phone size={14} color="#1a5c2a" />
                      <span>{c.phone}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#666" }}>
                      <Mail size={14} color="#1a5c2a" />
                      <span style={{ wordBreak: "break-all" }}>{c.email}</span>
                    </div>
                  </div>
                  {role !== "coach" && (
                    <button onClick={() => { setTab("messages"); }}
                      style={{ marginTop: 14, width: "100%", padding: "8px 0", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, color: "#1d4ed8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Message Coach
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PLAYERS ────────────────────────────────────────────────────────── */}
        {tab === "players" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>
                {role === "parent" ? "Your Child" : "Student Athletes"}
              </h2>
            </div>
            {role !== "parent" && (
              <div style={{ position: "relative", marginBottom: 20 }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or team..."
                  style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
              </div>
            )}
            <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr", padding: "10px 20px", borderBottom: "1px solid #f0f0f0", backgroundColor: "#fafafa" }}>
                {["Name", "Team", "Position", "Attendance", "Form"].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                ))}
              </div>
              {(role === "parent" ? PLAYERS.filter((p) => p.id === "1") : filteredPlayers).map((p) => (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: "1px solid #f9f9f9", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#1a5c2a" }}>
                      {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>Age {p.age}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#555" }}>{p.team}</div>
                  <div style={{ fontSize: 13, color: "#555" }}>{p.position}</div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: attendanceColor(p.attendance) }}>{p.attendance}%</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 12, backgroundColor: `${formColor(p.form)}18`, color: formColor(p.form) }}>{p.form}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FIXTURES ───────────────────────────────────────────────────────── */}
        {tab === "fixtures" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Fixtures & Results</h2>
              {(role === "headmaster" || role === "coach") && (
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  <Plus size={15} /> Add Fixture
                </button>
              )}
            </div>

            <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em" }}>Upcoming</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {FIXTURES.filter((f) => f.status === "upcoming").map((f) => (
                <div key={f.id} style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #bfdbfe", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 24 }}>{f.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{f.home_team} <span style={{ color: "#aaa", fontWeight: 400 }}>vs</span> {f.away_team}</div>
                    <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{f.venue} · {f.sport}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>{f.date}</div>
                    <div style={{ fontSize: 11, marginTop: 2, padding: "2px 8px", borderRadius: 10, background: "#eff6ff", color: "#1d4ed8", fontWeight: 600, display: "inline-block" }}>Upcoming</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em" }}>Results</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {FIXTURES.filter((f) => f.status === "completed").map((f) => (
                <div key={f.id} style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 24 }}>{f.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{f.home_team} <span style={{ color: "#aaa", fontWeight: 400 }}>vs</span> {f.away_team}</div>
                    <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{f.venue} · {f.sport}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1a5c2a" }}>{f.result}</div>
                    <div style={{ fontSize: 11, marginTop: 2, padding: "2px 8px", borderRadius: 10, background: "#f0fdf4", color: "#16a34a", fontWeight: 600, display: "inline-block" }}>Completed</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MESSAGES ───────────────────────────────────────────────────────── */}
        {tab === "messages" && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>

            {/* Message list */}
            <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", fontWeight: 700, fontSize: 15 }}>Inbox</div>
              {MESSAGES.map((m) => (
                <button key={m.id} onClick={() => setActiveMsg(m)}
                  style={{ width: "100%", textAlign: "left", padding: "14px 20px", borderBottom: "1px solid #f9f9f9", background: activeMsg?.id === m.id ? "#f0fdf4" : m.read ? "#fff" : "#f5f3ff", border: "none", cursor: "pointer", display: "block" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: m.read ? "#e5e5e5" : "#7c3aed", flexShrink: 0 }} />
                    <span style={{ fontWeight: m.read ? 500 : 700, fontSize: 14, color: "#1a1a1a" }}>{m.subject}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#888", paddingLeft: 16 }}>From {m.from} · {m.date}</div>
                </button>
              ))}

              {/* Compose */}
              {role === "coach" && (
                <div style={{ padding: 16, borderTop: "1px solid #f0f0f0" }}>
                  <button style={{ width: "100%", padding: "8px 0", background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Send size={14} /> Message a Parent
                  </button>
                </div>
              )}
            </div>

            {/* Message detail */}
            <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              {activeMsg ? (
                <>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: "#1a1a1a", marginBottom: 6 }}>{activeMsg.subject}</div>
                    <div style={{ fontSize: 13, color: "#888" }}>
                      From <strong>{activeMsg.from}</strong> ({activeMsg.from_role}) · {activeMsg.date}
                    </div>
                  </div>
                  <div style={{ padding: "24px", lineHeight: 1.7, color: "#333", fontSize: 15 }}>
                    {activeMsg.body}
                  </div>
                  <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0", backgroundColor: "#fafafa" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 8 }}>Reply</div>
                    <textarea value={newMsgBody} onChange={(e) => setNewMsgBody(e.target.value)} rows={3} placeholder="Type your reply..."
                      style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 14, resize: "none", outline: "none", boxSizing: "border-box" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                      <button onClick={sendReply} disabled={sending || !newMsgBody.trim()}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: sending ? "#aaa" : "#1a5c2a", color: "#fff", border: "none", borderRadius: 8, cursor: sending ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
                        <Send size={14} /> {sending ? "Sending..." : "Send Reply"}
                      </button>
                      {msgSent && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>Reply sent!</span>}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, color: "#aaa" }}>
                  <MessageSquare size={40} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 15 }}>Select a message to read</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANNOUNCEMENTS ──────────────────────────────────────────────────── */}
        {tab === "announcements" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Notice Board</h2>
            </div>

            {/* Post new — headmaster only */}
            {role === "headmaster" && (
              <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: 20, marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <Megaphone size={16} color="#c8962a" /> Post New Announcement
                </div>
                <input value={newAnnTitle} onChange={(e) => setNewAnnTitle(e.target.value)} placeholder="Announcement title"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 14, marginBottom: 10, boxSizing: "border-box", outline: "none" }} />
                <textarea value={newAnnBody} onChange={(e) => setNewAnnBody(e.target.value)} rows={3} placeholder="Write your announcement..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 14, resize: "none", outline: "none", boxSizing: "border-box" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                  <button onClick={postAnnouncement} disabled={!newAnnTitle.trim() || !newAnnBody.trim()}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    <Megaphone size={14} /> Post to All Staff & Parents
                  </button>
                  {annPosted && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>Posted!</span>}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {localAnns.map((a) => {
                const s = priorityStyle(a.priority);
                return (
                  <div key={a.id} style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 20, display: "flex", gap: 14 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: s.dot, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 4 }}>{a.title}</div>
                      <div style={{ fontSize: 14, color: "#444", lineHeight: 1.6, marginBottom: 8 }}>{a.body}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>Posted by <strong>{a.from}</strong> · {a.date}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, backgroundColor: s.dot, color: "#fff", height: "fit-content", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {a.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── REPORTS ────────────────────────────────────────────────────────── */}
        {tab === "reports" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 20 }}>Term Performance Reports</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {TEAMS.map((t) => {
                const total  = t.wins + t.draws + t.losses;
                const pct    = total ? Math.round((t.wins / total) * 100) : 0;
                const grade  = pct >= 70 ? "A" : pct >= 50 ? "B" : pct >= 35 ? "C" : "D";
                const gColor = pct >= 70 ? "#16a34a" : pct >= 50 ? "#2563eb" : pct >= 35 ? "#d97706" : "#dc2626";
                return (
                  <div key={t.id} style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{t.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>Term 3 Report · {t.coach}</div>
                      </div>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: `${gColor}18`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: gColor }}>
                        {grade}
                      </div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                        {[
                          { label: "Played",  value: total    },
                          { label: "Won",     value: t.wins   },
                          { label: "Win Rate",value: `${pct}%`},
                        ].map((s) => (
                          <div key={s.label} style={{ textAlign: "center", padding: 8, backgroundColor: "#fafafa", borderRadius: 8 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#1a5c2a" }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: "#888" }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5, marginBottom: 12 }}>
                        {pct >= 70 ? `Outstanding season. ${t.name} has shown excellent performance and team cohesion this term.`
                        : pct >= 50 ? `Good effort from the squad. Consistent improvement shown throughout the term.`
                        : `The team has faced challenges but shown resilience. Focus areas identified for next term.`}
                      </div>
                      <button style={{ width: "100%", padding: "8px 0", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#16a34a", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <FileText size={14} /> Download PDF Report
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
