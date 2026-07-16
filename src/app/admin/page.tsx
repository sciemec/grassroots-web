"use client";
// src/app/admin/page.tsx
// Admin Hub — card-based feature dashboard

import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  Users, ShieldCheck, Search, CreditCard, BarChart3, Megaphone,
  Film, Bell, Database, MessageSquare, Building2, Radio, Activity,
  Smartphone, Sparkles, Trophy, Globe, UserCircle, Target,
  Settings, Lock,
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

export default function AdminDashboardPage() {
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
                Admin Console
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                {user?.name ?? "Administrator"} · Root Access
              </div>
            </div>
            <Link href="/admin/health" style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 10,
              backgroundColor: "#f3f4f6", border: "none",
              fontSize: 12, fontWeight: 600, color: "#374151",
              textDecoration: "none",
            }}>
              <Activity size={14} /> System Health
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 56px" }}>

        {/* ── 1. User Management ────────────────────────────────────────── */}
        <SectionLabel>1 · User Management</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/admin/users"          icon={Users}      label="Users"             desc="All accounts, roles & access"      accent />
          <HubCard href="/admin/verifications"  icon={ShieldCheck} label="Verifications"    desc="Identity queue & document review"  />
          <HubCard href="/admin/scout-requests" icon={Search}     label="Scout Requests"    desc="Accreditation & contact approvals" />
          <HubCard href="/admin/player-preview" icon={Sparkles}   label="Player Preview"    desc="Preview player profiles as admin"  />
        </div>

        {/* ── 2. Revenue & Subscriptions ───────────────────────────────── */}
        <SectionLabel>2 · Revenue &amp; Subscriptions</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/admin/subscriptions" icon={CreditCard}  label="Subscriptions"     desc="Billing, plans & Stripe dashboard" accent />
          <HubCard href="/admin/stats"         icon={BarChart3}   label="Platform Stats"    desc="Users, sessions & engagement"      />
          <HubCard href="/notifications"       icon={Bell}        label="Push Notifications" desc="Send FCM alerts to all users"     />
          <HubCard href="/talent-leaderboard"  icon={Database}    label="Talent Database"   desc="National rankings & THUTO scores"  />
        </div>

        {/* ── 3. Content & Community ───────────────────────────────────── */}
        <SectionLabel>3 · Content &amp; Community</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/admin/announcements" icon={Megaphone}    label="Announcements"    desc="Platform notices & broadcasts"     accent />
          <HubCard href="/admin/fan-hub"       icon={Film}         label="Fan Hub Mod"      desc="Review, approve & remove videos"   />
          <HubCard href="/admin/whatsapp"      icon={MessageSquare} label="WhatsApp"        desc="Bot config & message logs"         />
          <HubCard href="/admin/community"     icon={Building2}    label="Community"        desc="Clubs, schools & league oversight" />
          <HubCard href="/admin/tournaments/munhumutapa-2026" icon={Trophy} label="Tournaments" desc="Munhumutapa Cup & fixtures"   />
        </div>

        {/* ── 4. Platform & Infrastructure ─────────────────────────────── */}
        <SectionLabel>4 · Platform &amp; Infrastructure</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/admin/health"  icon={Activity}   label="System Health"    desc="API status, uptime & errors"       accent />
          <HubCard href="/admin/stream"  icon={Radio}      label="Stream Control"   desc="Live broadcast management"         />
          <HubCard href="/admin/pwa"     icon={Smartphone} label="PWA Stats"        desc="Install rates & offline usage"     />
          <HubCard href="/settings"      icon={Settings}   label="Settings"         desc="Platform configuration"            />
          <HubCard href="/admin/health"  icon={Lock}       label="Security"         desc="Access logs & audit trail"         />
        </div>

        {/* ── 5. View as User ──────────────────────────────────────────── */}
        <SectionLabel>5 · View as User</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          <HubCard href="/player" icon={UserCircle} label="Player Hub"  desc="Experience the player dashboard"   accent />
          <HubCard href="/coach"  icon={Users}      label="Coach Hub"   desc="Experience the coach dashboard"    />
          <HubCard href="/scout"  icon={Target}     label="Scout Hub"   desc="Experience the scout console"      />
          <HubCard href="/fan"    icon={Trophy}     label="Fan Hub"     desc="Experience the fan dashboard"      />
          <HubCard href="/arena"  icon={Globe}      label="The Arena"   desc="Monitor the social feed"           />
        </div>

      </div>
    </div>
  );
}
