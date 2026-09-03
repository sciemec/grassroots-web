"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconUser,
  IconShieldCheck,
  IconRoute,
  IconBallFootball,
  IconClipboardList,
  IconVideo,
  IconRun,
  IconTarget,
  IconFolderStar,
  IconBook,
  IconLock,
  IconUsers,
  IconStar,
  IconChevronRight,
} from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        color: "#777",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: 10,
        marginTop: 28,
        paddingLeft: 2,
      }}
    >
      {label}
    </div>
  );
}

// ─── Hub card ─────────────────────────────────────────────────────────────────

function HubCard({
  href,
  iconBg,
  iconColor,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  iconBg: string;
  iconColor: string;
  icon: React.ComponentType<{ size?: number | string; color?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#151515",
        borderRadius: 12,
        padding: "12px 14px",
        textDecoration: "none",
        marginBottom: 8,
      }}
    >
      {/* Icon box */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={iconColor} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{title}</div>
        <div style={{ color: "#777", fontSize: 10.5, marginTop: 2 }}>{subtitle}</div>
      </div>

      {/* Chevron */}
      <IconChevronRight size={16} color="#555" />
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlayerHubPage() {
  const token = useAuthStore((s) => s.token);
  const [profilePct, setProfilePct] = useState<number>(0);

  useEffect(() => {
    if (!token) return;
    api
      .get("/profile")
      .then((res) => {
        const pct: number = res.data?.data?.profile_complete_pct ?? 0;
        setProfilePct(pct);
      })
      .catch(() => {});
  }, [token]);

  // ── Icon palette shortcuts ──────────────────────────────────────────────────
  const G  = "#1a5c2a"; // section 1 — green icon box
  const GL = "#c0dd97"; // section 1 — green icon color
  const O  = "#854f0b"; // section 2 — orange icon box
  const OL = "#fac775"; // section 2 — orange icon color
  const DG = "#173404"; // section 3 — dark green icon box
  const N  = "#232323"; // sections 4 & 5 — neutral icon box
  const NC = "#cccccc"; // sections 4 & 5 — neutral icon color

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", paddingBottom: 48 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", padding: "32px 16px 4px" }}>
        <div
          style={{
            color: "#c8962a",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Grassroots Sports
        </div>
        <div style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginTop: 4 }}>
          Player Hub
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* Section 1 — Build my profile */}
        <SectionLabel label="Build my profile" />
        <HubCard
          href="/player/profile"
          icon={IconUser}
          iconBg={G}
          iconColor={GL}
          title="My Profile"
          subtitle={`Edit your details, ${profilePct}% complete`}
        />
        <HubCard
          href="/player/verification"
          icon={IconShieldCheck}
          iconBg={G}
          iconColor={GL}
          title="Verification"
          subtitle="Confirm you're really you"
        />
        <HubCard
          href="/player/pathway"
          icon={IconRoute}
          iconBg={G}
          iconColor={GL}
          title="My Pathway"
          subtitle="Your stage on the journey"
        />

        {/* Section 2 — Train & get assessed */}
        <SectionLabel label="Train & get assessed" />
        <HubCard
          href="/player/sports"
          icon={IconBallFootball}
          iconBg={O}
          iconColor={OL}
          title="Skill Lab"
          subtitle="Dribbling, shooting, passing & more"
        />
        <HubCard
          href="/player/drills"
          icon={IconClipboardList}
          iconBg={O}
          iconColor={OL}
          title="My Drills"
          subtitle="Practice on your own"
        />
        <HubCard
          href="/player/match-eye"
          icon={IconVideo}
          iconBg={O}
          iconColor={OL}
          title="Match Eye"
          subtitle="Upload a clip, get AI feedback"
        />
        <HubCard
          href="/player/assessment"
          icon={IconRun}
          iconBg={O}
          iconColor={OL}
          title="Fitness Tests"
          subtitle="Sprint, jump, agility + Yo-Yo test"
        />
        <HubCard
          href="/player/analyse"
          icon={IconTarget}
          iconBg={O}
          iconColor={OL}
          title="Football Skill Analysis"
          subtitle="Deep technique breakdown"
        />
        <HubCard
          href="/player/skill-ratings"
          icon={IconStar}
          iconBg={O}
          iconColor={OL}
          title="Coach Ratings"
          subtitle="Your technical skills rated by your coach"
        />

        {/* Section 3 — Showcase */}
        <SectionLabel label="Showcase" />
        <HubCard
          href="/player/vault"
          icon={IconFolderStar}
          iconBg={DG}
          iconColor={GL}
          title="Highlight Vault"
          subtitle="Your video library"
        />

        {/* Section 4 — Academics */}
        <SectionLabel label="Academics" />
        <HubCard
          href="/player/academics"
          icon={IconBook}
          iconBg={N}
          iconColor={NC}
          title="Study Sessions"
          subtitle="Balance school & sport"
        />

        {/* Section 5 — Safety & family */}
        <SectionLabel label="Safety & family" />
        <HubCard
          href="/player/consent"
          icon={IconLock}
          iconBg={N}
          iconColor={NC}
          title="Consent Management"
          subtitle="Who can see what"
        />
        <HubCard
          href="/player/guardian"
          icon={IconUsers}
          iconBg={N}
          iconColor={NC}
          title="Guardian Link"
          subtitle="Connect a parent"
        />

      </div>
    </div>
  );
}
