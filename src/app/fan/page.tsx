"use client";
// src/app/fan/page.tsx
// Fan Hub — card-based feature dashboard

import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  Star, Heart, Trophy, Users, Radio, Video,
  Globe, Briefcase, Building2, User, Bell, Flame,
  MessageCircle, Target, TrendingUp,
} from "lucide-react";

const GRS_GREEN = "#1a5c2a";

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

export default function FanHubPage() {
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
                Fan Hub
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                Welcome back{user?.name ? `, ${user.name}` : ""}
              </div>
            </div>
            <Link href="/fan/notifications" style={{
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

        {/* ── 1. Discovery & Players ─────────────────────────────────────── */}
        <SectionLabel>1 · Discovery &amp; Players</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/fan/discover"       icon={Star}        label="Discover Talent"  desc="Find players by sport & province"   accent />
          <HubCard href="/fan/following"      icon={Heart}       label="Following"         desc="Players you support & follow"       />
          <HubCard href="/fan/leaderboard"    icon={Trophy}      label="Leaderboard"       desc="Top-rated players this season"      />
          <HubCard href="/talent-leaderboard" icon={Users}       label="Rising Stars"      desc="National THUTO talent rankings"     />
          <HubCard href="/talent-database"    icon={Target}      label="Talent Database"   desc="Browse all verified players"        />
        </div>

        {/* ── 2. Live & Matches ─────────────────────────────────────────── */}
        <SectionLabel>2 · Live &amp; Matches</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/fan/live-commentary" icon={Radio}      label="Live Commentary"   desc="Follow matches in real time"        accent />
          <HubCard href="/streaming"           icon={Video}      label="Live Matches"      desc="Watch live broadcasts"              />
          <HubCard href="/world-cup"           icon={Trophy}     label="World Cup"         desc="Tournament updates & fixtures"      />
          <HubCard href="/school-leagues"      icon={TrendingUp} label="School Leagues"    desc="NASH & NAPH tournament tables"      />
        </div>

        {/* ── 3. Community & Network ────────────────────────────────────── */}
        <SectionLabel>3 · Community &amp; Network</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/arena"             icon={Globe}        label="The Arena"         desc="Posts, discussions & reactions"     accent />
          <HubCard href="/arena/recruitment" icon={Briefcase}    label="Talent Board"      desc="Open positions & opportunities"     />
          <HubCard href="/arena/clubs"       icon={Building2}    label="Schools & Clubs"   desc="Find & follow a team"               />
          <HubCard href="/arena/network"     icon={Users}        label="Network"           desc="Connect with the sports community"  />
          <HubCard href="/community"         icon={MessageCircle} label="Community"        desc="Fans, coaches & scouts together"    />
        </div>

        {/* ── 4. My Account ────────────────────────────────────────────── */}
        <SectionLabel>4 · My Account</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/fan/profile"       icon={User}         label="My Profile"        desc="Your fan identity & preferences"    accent />
          <HubCard href="/fan/notifications" icon={Bell}         label="Notifications"     desc="Alerts, updates & messages"         />
          <HubCard href="/fan/leaderboard"   icon={Flame}        label="Fan Activity"      desc="Your engagement & history"          />
          <HubCard href="/settings"          icon={Star}         label="Settings"          desc="Account preferences & privacy"      />
        </div>

      </div>
    </div>
  );
}
