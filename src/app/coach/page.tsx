"use client";
// src/app/coach/page.tsx
// Coach Hub — card-based feature dashboard

import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  Users, Target, Activity, Zap, BookOpen, Dumbbell, Calendar,
  Brain, Flag, TrendingUp, TrendingDown, BarChart3, Award, Video,
  UserSearch, Shield, Flame, Swords, Globe, Bell, Crosshair, BarChart2,
  ChevronRight, ArrowRight, Play,
} from "lucide-react";

const GRS_GREEN = "#1a5c2a";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-3 ml-0.5 flex items-center gap-2"
      style={{ color: "#9ca3af" }}>
      <span className="inline-block w-4 h-px bg-gray-300" />
      {children}
    </p>
  );
}

function HubCard({
  href, icon: Icon, iconBg, iconColor, label, desc, badge,
}: {
  href: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  desc: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl p-4 flex flex-col gap-3 border border-gray-200 hover:border-[#1a5c2a] shadow-sm hover:shadow-md transition-all relative overflow-hidden"
    >
      {badge && (
        <span
          className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white"
          style={{ backgroundColor: GRS_GREEN }}
        >
          {badge}
        </span>
      )}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div>
        <h4 className="text-xs font-black uppercase tracking-wide leading-none text-gray-900">{label}</h4>
        <p className="text-[11px] font-medium mt-1 leading-snug text-gray-400">{desc}</p>
      </div>
      <ChevronRight
        size={12}
        className="absolute bottom-4 right-4 text-gray-300 group-hover:text-[#1a5c2a] group-hover:translate-x-0.5 transition-all"
      />
    </Link>
  );
}

function DarkCTA({ href, icon: Icon, iconColor, title, sub }: {
  href: string;
  icon: React.ElementType;
  iconColor: string;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl p-4 flex items-center justify-between transition-all hover:opacity-90"
      style={{
        background: "linear-gradient(135deg, #1a5c2a 0%, #14472a 100%)",
        border: "1px solid rgba(240,180,41,0.12)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: "rgba(240,180,41,0.13)",
            border: "1px solid rgba(240,180,41,0.18)",
          }}
        >
          <Icon size={15} style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide" style={{ color: "#f0b429" }}>{title}</p>
          <p className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(240,180,41,0.65)" }}>{sub}</p>
        </div>
      </div>
      <ArrowRight
        size={13}
        style={{ color: "#f0b429" }}
        className="group-hover:translate-x-0.5 transition-transform"
      />
    </Link>
  );
}

export default function CoachHubPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e5e5",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>Coach Hub</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                Welcome back{user?.name ? `, ${user.name}` : ""}
              </div>
            </div>
            <Link href="/coach/notifications" style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 10,
              backgroundColor: "#f3f4f6", fontSize: 12, fontWeight: 600,
              color: "#374151", textDecoration: "none",
            }}>
              <Bell size={14} /> Alerts
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 56px" }}>

        {/* Live match CTA */}
        <div className="mb-6">
          <DarkCTA
            href="/coach/live-match"
            icon={Play}
            iconColor="#f0b429"
            title="Live Match"
            sub="Start real-time match management"
          />
        </div>

        {/* ── 1. Squad & Players ─────────────────────────────────────── */}
        <SectionLabel>1 · Squad &amp; Players</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <HubCard href="/coach/squad"           icon={Users}      iconBg="#dcfce7" iconColor="#16a34a" label="My Squad"        desc="View & manage all players"    badge="core" />
          <HubCard href="/coach/talent-id"       icon={Target}     iconBg="#dbeafe" iconColor="#2563eb" label="Talent ID"       desc="AI player identification"      />
          <HubCard href="/coach/recruitment"     icon={Shield}     iconBg="#ede9fe" iconColor="#7c3aed" label="Recruitment"     desc="Track recruitment targets"     />
          <HubCard href="/coach/scouting"        icon={UserSearch} iconBg="#fef3c7" iconColor="#d97706" label="Scouting"        desc="Scout discovery feed"          />
          <HubCard href="/coach/technical-staff" icon={Users}      iconBg="#f3f4f6" iconColor="#6b7280" label="Technical Staff" desc="Manage your coaching team"     />
        </div>

        {/* ── 2. Match & Tactics ─────────────────────────────────────── */}
        <SectionLabel>2 · Match &amp; Tactics</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <HubCard href="/coach/matches"           icon={Calendar}   iconBg="#f3f4f6" iconColor="#6b7280" label="Matches"            desc="Fixtures & results"           />
          <HubCard href="/coach/tactics"           icon={Brain}      iconBg="#dbeafe" iconColor="#2563eb" label="Tactics Board"      desc="Build formations & set plays"  />
          <HubCard href="/coach/tactics/simulator" icon={Swords}     iconBg="#ede9fe" iconColor="#7c3aed" label="Tactics Simulator"  desc="Simulate match scenarios"      badge="new" />
          <HubCard href="/coach/tactical-analysis" icon={Crosshair}  iconBg="#fef3c7" iconColor="#d97706" label="Tactical Analysis"  desc="Post-match breakdown"          />
          <HubCard href="/coach/set-pieces"        icon={Flame}      iconBg="#fee2e2" iconColor="#dc2626" label="Set Pieces"         desc="Corners, free kicks & more"    />
          <HubCard href="/coach/set-piece-lab"     icon={Flag}       iconBg="#fdf4ff" iconColor="#a21caf" label="Set Piece Lab"      desc="Design & track set plays"      />
          <HubCard href="/coach/patterns"          icon={TrendingUp} iconBg="#dcfce7" iconColor="#059669" label="Strategic Patterns" desc="Identify winning patterns"     />
        </div>

        {/* ── 3. Training ────────────────────────────────────────────── */}
        <SectionLabel>3 · Training</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <HubCard href="/coach/training-plans"  icon={Calendar} iconBg="#dcfce7" iconColor="#16a34a" label="Training Plans"  desc="Build & assign plans"        badge="core" />
          <HubCard href="/coach/drills"          icon={Dumbbell} iconBg="#dbeafe" iconColor="#2563eb" label="Drills Library"  desc="Browse all drills"           />
          <HubCard href="/coach/drill-analysis"  icon={Video}    iconBg="#ede9fe" iconColor="#7c3aed" label="Drill Analysis"  desc="Analyse training footage"    />
          <HubCard href="/coach/session-library" icon={BookOpen} iconBg="#fef3c7" iconColor="#d97706" label="Session Library" desc="Saved session templates"     />
        </div>

        {/* ── 4. Performance & Health ────────────────────────────────── */}
        <SectionLabel>4 · Performance &amp; Health</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <HubCard href="/coach/injury-hub" icon={Activity}     iconBg="#fee2e2" iconColor="#dc2626" label="Injury Hub"      desc="Track & manage injuries"    badge="core" />
          <HubCard href="/coach/fatigue"    icon={TrendingDown} iconBg="#fef3c7" iconColor="#d97706" label="Fatigue Monitor" desc="Player load & recovery"     />
          <HubCard href="/coach/chemistry"  icon={Zap}          iconBg="#dbeafe" iconColor="#2563eb" label="Squad Chemistry" desc="Team bonding & cohesion"    />
          <HubCard href="/coach/biometrics" icon={BarChart3}    iconBg="#dcfce7" iconColor="#059669" label="Biometrics"      desc="Physical performance data"  />
          <HubCard href="/coach/stats"      icon={BarChart2}    iconBg="#f3f4f6" iconColor="#6b7280" label="Team Stats"      desc="Season statistics overview" />
          <HubCard href="/coach/success"    icon={Award}        iconBg="#fdf4ff" iconColor="#a21caf" label="Success Tracker" desc="Goals, wins & achievements" />
        </div>

        {/* ── 5. Analyst Tools ───────────────────────────────────────── */}
        <SectionLabel>5 · Analyst Tools</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <HubCard href="/analyst"                   icon={BarChart3}  iconBg="#dcfce7" iconColor="#16a34a" label="Analyst Hub"        desc="Full analytics dashboard"   badge="core" />
          <HubCard href="/analyst/live-match"        icon={Flame}      iconBg="#fee2e2" iconColor="#dc2626" label="Live Collector"      desc="Log events in real time"    />
          <HubCard href="/analyst/xg-analysis"       icon={Target}     iconBg="#dbeafe" iconColor="#2563eb" label="xG Analysis"         desc="Expected goals breakdown"   />
          <HubCard href="/analyst/tactical-report"   icon={Crosshair}  iconBg="#ede9fe" iconColor="#7c3aed" label="Tactical Report"     desc="AI-generated match report"  />
          <HubCard href="/analyst/team-biomechanics" icon={Activity}   iconBg="#fef3c7" iconColor="#d97706" label="Team Biomechanics"   desc="Movement & load data"       />
          <HubCard href="/analyst/season"            icon={TrendingUp} iconBg="#dcfce7" iconColor="#059669" label="Season Intelligence" desc="Season-wide trends"         />
        </div>

        {/* ── 6. AI & Network ────────────────────────────────────────── */}
        <SectionLabel>6 · AI &amp; Network</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <HubCard href="/coach/ai-insights" icon={BookOpen}   iconBg="#dcfce7" iconColor="#16a34a" label="AI Insights"  desc="THUTO coaching intelligence"   badge="ai" />
          <HubCard href="/arena"             icon={Globe}      iconBg="#dbeafe" iconColor="#2563eb" label="The Arena"    desc="Professional sports network"   />
          <HubCard href="/arena/recruitment" icon={UserSearch} iconBg="#ede9fe" iconColor="#7c3aed" label="Talent Board" desc="Open positions & talent wants" />
        </div>

      </div>
    </div>
  );
}
