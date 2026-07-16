"use client";
// src/app/coach/page.tsx
// Coach Hub — card-based feature dashboard

import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  Users, Target, Activity, Zap, BookOpen, Dumbbell, Calendar,
  Brain, Flag, TrendingUp, TrendingDown, BarChart3, Award, Video,
  UserSearch, Shield, Flame, Swords, Globe, Bell, Crosshair, BarChart2
} from "lucide-react";

const GRS_GREEN = "#1a5c2a";
const GOLD      = "#c8962a";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, color: "#9ca3af",
      textTransform: "uppercase", letterSpacing: "0.08em",
      marginBottom: 10, marginTop: 4,
    }}>
      {children}
    </div>
  );
}

function HubCard({
  href, icon: Icon, label, desc, accent = false,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  accent?: boolean;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: "14px 14px 12px",
        border: `1px solid ${accent ? "#bbf7d0" : "#e5e5e5"}`,
        display: "flex", flexDirection: "column", gap: 8,
        height: "100%", cursor: "pointer",
        transition: "box-shadow 0.15s",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: accent ? "#dcfce7" : "#f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={17} color={accent ? GRS_GREEN : "#6b7280"} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111", marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>{desc}</div>
        </div>
      </div>
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
              <div style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>
                Coach Hub
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                Welcome back{user?.name ? `, ${user.name}` : ""}
              </div>
            </div>
            <Link href="/coach/notifications" style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 10,
              backgroundColor: "#f3f4f6", border: "none",
              fontSize: 12, fontWeight: 600, color: "#374151",
              textDecoration: "none",
            }}>
              <Bell size={14} /> Alerts
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 56px" }}>

        {/* ── 1. Squad & Players ─────────────────────────────────────── */}
        <SectionLabel>1 · Squad &amp; Players</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/coach/squad"           icon={Users}      label="My Squad"        desc="View & manage all players"           accent />
          <HubCard href="/coach/talent-id"       icon={Target}     label="Talent ID"       desc="AI player identification"            />
          <HubCard href="/coach/recruitment"     icon={Shield}     label="Recruitment"     desc="Track recruitment targets"           />
          <HubCard href="/coach/scouting"        icon={UserSearch} label="Scouting"        desc="Scout discovery feed"                />
          <HubCard href="/coach/technical-staff" icon={Users}      label="Technical Staff" desc="Manage your coaching team"           />
        </div>

        {/* ── 2. Match & Tactics ─────────────────────────────────────── */}
        <SectionLabel>2 · Match &amp; Tactics</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/coach/live-match"         icon={Activity}   label="Live Match"          desc="Real-time match management"    accent />
          <HubCard href="/coach/matches"            icon={Calendar}   label="Matches"             desc="Fixtures & results"            />
          <HubCard href="/coach/tactics"            icon={Brain}      label="Tactics Board"       desc="Build formations & set plays"  />
          <HubCard href="/coach/tactics/simulator"  icon={Swords}     label="Tactics Simulator"   desc="Simulate match scenarios"      />
          <HubCard href="/coach/tactical-analysis"  icon={Crosshair}  label="Tactical Analysis"   desc="Post-match breakdown"          />
          <HubCard href="/coach/set-pieces"         icon={Flame}      label="Set Pieces"          desc="Corners, free kicks & more"    />
          <HubCard href="/coach/set-piece-lab"      icon={Flag}       label="Set Piece Lab"       desc="Design & track set plays"      />
          <HubCard href="/coach/patterns"           icon={TrendingUp} label="Strategic Patterns"  desc="Identify winning patterns"     />
        </div>

        {/* ── 3. Training ────────────────────────────────────────────── */}
        <SectionLabel>3 · Training</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/coach/training-plans"   icon={Calendar}   label="Training Plans"   desc="Build & assign plans"           accent />
          <HubCard href="/coach/drills"           icon={Dumbbell}   label="Drills Library"   desc="Browse all drills"              />
          <HubCard href="/coach/drill-analysis"   icon={Video}      label="Drill Analysis"   desc="Analyse training footage"       />
          <HubCard href="/coach/session-library"  icon={BookOpen}   label="Session Library"  desc="Saved session templates"        />
        </div>

        {/* ── 4. Performance & Health ────────────────────────────────── */}
        <SectionLabel>4 · Performance &amp; Health</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/coach/injury-hub"   icon={Activity}     label="Injury Hub"       desc="Track & manage injuries"      accent />
          <HubCard href="/coach/fatigue"      icon={TrendingDown} label="Fatigue Monitor"  desc="Player load & recovery"       />
          <HubCard href="/coach/chemistry"    icon={Zap}          label="Squad Chemistry"  desc="Team bonding & cohesion"      />
          <HubCard href="/coach/biometrics"   icon={BarChart3}    label="Biometrics"       desc="Physical performance data"    />
          <HubCard href="/coach/stats"        icon={BarChart2}    label="Team Stats"       desc="Season statistics overview"   />
          <HubCard href="/coach/success"      icon={Award}        label="Success Tracker"  desc="Goals, wins & achievements"   />
        </div>

        {/* ── 5. Analyst Tools ───────────────────────────────────────── */}
        <SectionLabel>5 · Analyst Tools</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/analyst"                   icon={BarChart3}  label="Analyst Hub"          desc="Full analytics dashboard"   accent />
          <HubCard href="/analyst/live-match"        icon={Flame}      label="Live Collector"       desc="Log events in real time"    />
          <HubCard href="/analyst/xg-analysis"       icon={Target}     label="xG Analysis"          desc="Expected goals breakdown"   />
          <HubCard href="/analyst/tactical-report"   icon={Crosshair}  label="Tactical Report"      desc="AI-generated match report"  />
          <HubCard href="/analyst/team-biomechanics" icon={Activity}   label="Team Biomechanics"    desc="Movement & load data"       />
          <HubCard href="/analyst/season"            icon={TrendingUp} label="Season Intelligence"  desc="Season-wide trends"         />
        </div>

        {/* ── 6. AI & Network ────────────────────────────────────────── */}
        <SectionLabel>6 · AI &amp; Network</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/coach/ai-insights" icon={BookOpen}   label="AI Insights"   desc="THUTO coaching intelligence"    accent />
          <HubCard href="/arena"             icon={Globe}      label="The Arena"     desc="Professional sports network"    />
          <HubCard href="/coach/recruitment" icon={UserSearch} label="Talent Board"  desc="Open positions & talent wants"  />
        </div>

      </div>
    </div>
  );
}
