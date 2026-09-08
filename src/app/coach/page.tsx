"use client";
// src/app/coach/page.tsx
// Coach Hub — card-based feature dashboard

import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  Users, Dumbbell, Calendar, Video,
  UserSearch, Globe, Bell, Layers,
  ChevronRight, ArrowRight, Play, Eye, School, GraduationCap, UserCheck, Clapperboard, ShoppingBag, Star, ClipboardList,
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
          <HubCard href="/coach/squad"              icon={Users}      iconBg="#dcfce7" iconColor="#16a34a" label="My Squad"              desc="Players · injuries · fatigue · chemistry" badge="core" />
          <HubCard href="/coach/registered-players" icon={UserCheck}  iconBg="#f0fdf4" iconColor="#1a5c2a" label="Player Registry"        desc="Register players · build talent passports" badge="new" />
          <HubCard href="/coach/scouting"           icon={UserSearch} iconBg="#fef3c7" iconColor="#d97706" label="Scouting & Recruitment" desc="Discover players · track targets" />
        </div>

        {/* ── 2. Match & Tactics ─────────────────────────────────────── */}
        <SectionLabel>2 · Match &amp; Tactics</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <HubCard href="/coach/tactics/board"  icon={Layers}        iconBg="#dbeafe" iconColor="#2563eb" label="Intelligence Board" desc="XG map, formations & drag"            badge="new" />
          <HubCard href="/coach/set-pieces"     icon={Video}         iconBg="#fdf4ff" iconColor="#a21caf" label="Set Pieces"         desc="Clip analysis + scoring lab"          badge="ai" />
          <HubCard href="/coach/video-analysis" icon={Eye}           iconBg="#fee2e2" iconColor="#dc2626" label="Video Analysis"     desc="Match Eye · Drill · General · Player" badge="ai" />
          <HubCard href="/coach/tactics/learn"  icon={GraduationCap} iconBg="#f0fdf4" iconColor="#1a5c2a" label="Tactics Academy"   desc="Formations, principles & badges"      badge="new" />
        </div>

        {/* ── 3. Training ────────────────────────────────────────────── */}
        <SectionLabel>3 · Training</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <HubCard href="/coach/training-plans" icon={Calendar}      iconBg="#dcfce7" iconColor="#16a34a" label="Training Plans"    desc="Build & assign plans"                  badge="core" />
          <HubCard href="/coach/drill-library"  icon={Dumbbell}      iconBg="#dbeafe" iconColor="#2563eb" label="Drill Library"     desc="Drills · sessions · AI drill analysis" />
          <HubCard href="/player/assessment"    icon={ClipboardList} iconBg="#f0fdf4" iconColor="#1a5c2a" label="Field Assessment"  desc="Position tests · benchmarks · radar chart" badge="new" />
          <HubCard href="/coach/skill-drills"   icon={Star}          iconBg="#fefce8" iconColor="#ca8a04" label="Skill Assessment"  desc="Rate & test squad across 6 core skills" badge="new" />
        </div>

        {/* ── 4. Network & Videos ────────────────────────────────────── */}
        <SectionLabel>4 · Network &amp; Videos</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <HubCard href="/arena"                     icon={Globe}        iconBg="#dbeafe" iconColor="#2563eb" label="The Arena"        desc="Professional sports network"                      />
          <HubCard href="/arena/recruitment"         icon={UserSearch}   iconBg="#ede9fe" iconColor="#7c3aed" label="Talent Board"     desc="Open positions & talent wants"                    />
          <HubCard href="/coach/match-videos"        icon={Clapperboard} iconBg="#f0fdf4" iconColor="#1a5c2a" label="Video Hub"        desc="Upload · library · share with parents & players"  badge="new" />
          <HubCard href="/coach/marketplace-profile" icon={ShoppingBag}  iconBg="#fef3c7" iconColor="#d97706" label="My Coach Profile" desc="Rates · credentials · assessment requests"        badge="new" />
        </div>

        {/* ── 5. School Programme ────────────────────────────────────── */}
        <SectionLabel>5 · School Programme</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <HubCard href="/school-hub" icon={School} iconBg="#f0fdf4" iconColor="#1a5c2a" label="School Hub" desc="Teams · fixtures · NASH leagues · notices" badge="nash" />
        </div>

      </div>
    </div>
  );
}
