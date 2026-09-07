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
  IconArrowRight,
  IconShield,
  IconActivity,
  IconHandFinger,
  IconWorld,
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

// ─── Drill group card (6 skills in one card) ──────────────────────────────────

const DRILLS = [
  { href: "/player/dribbling",   label: "Dribbling",   Icon: IconBallFootball },
  { href: "/player/first-touch", label: "First Touch",  Icon: IconHandFinger   },
  { href: "/player/passing",     label: "Passing",      Icon: IconArrowRight   },
  { href: "/player/tackling",    label: "Tackling",     Icon: IconShield       },
  { href: "/player/shooting",    label: "Shooting",     Icon: IconTarget       },
  { href: "/player/sprint",      label: "Sprint",       Icon: IconRun          },
];

function DrillGroupCard() {
  return (
    <div
      style={{
        background: "#151515",
        borderRadius: 14,
        padding: "14px 14px 12px",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          color: "#c8962a",
          fontSize: 10.5,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          marginBottom: 12,
        }}
      >
        Skill Drills
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {DRILLS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              background: "#1e1e1e",
              borderRadius: 10,
              padding: "12px 6px",
              textDecoration: "none",
            }}
          >
            <Icon size={22} color="#fac775" />
            <span style={{ color: "#fff", fontSize: 10.5, fontWeight: 500, textAlign: "center" }}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
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
        <DrillGroupCard />
        <HubCard
          href="/player/biomechanics"
          icon={IconActivity}
          iconBg={O}
          iconColor={OL}
          title="Movement Check"
          subtitle="Full-body movement scan"
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
          href="/player/gemini-drills"
          icon={IconTarget}
          iconBg={O}
          iconColor={OL}
          title="Football Drill Analysis"
          subtitle="AI video analysis — populate your Technical radar"
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

        {/* Section 5 — Network */}
        <SectionLabel label="Network" />
        <Link
          href="/arena"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "linear-gradient(135deg, #1a3d4a 0%, #0d2233 100%)",
            borderRadius: 12,
            padding: "14px",
            textDecoration: "none",
            marginBottom: 8,
            border: "1px solid #1e5472",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#0e3347",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "1px solid #1e6090",
            }}
          >
            <IconWorld size={20} color="#5bc4f5" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>The Arena</div>
            <div style={{ color: "#7bbdd4", fontSize: 10.5, marginTop: 2 }}>
              Sports network · connect with coaches &amp; scouts
            </div>
          </div>
          <IconChevronRight size={16} color="#5bc4f5" />
        </Link>

        {/* Section 6 — Safety & family */}
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
