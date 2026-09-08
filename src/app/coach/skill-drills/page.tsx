"use client";

import Link from "next/link";
import { ArrowLeft, Shuffle, Move, Send, Shield, Target, Zap, Info } from "lucide-react";

const SKILLS = [
  {
    slug: "dribbling",
    label: "Dribbling",
    desc: "Ball control, body position, direction changes, awareness",
    icon: Shuffle,
    iconBg: "#f0fdf4",
    iconColor: "#1a5c2a",
  },
  {
    slug: "first-touch",
    label: "First Touch",
    desc: "Body shape, cushioning, touch direction, speed of play",
    icon: Move,
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
  },
  {
    slug: "passing",
    label: "Passing",
    desc: "Stance, pass weight & accuracy, decision making, follow through",
    icon: Send,
    iconBg: "#fef3c7",
    iconColor: "#d97706",
  },
  {
    slug: "tackling",
    label: "Tackling",
    desc: "Approach & positioning, body balance, timing, recovery",
    icon: Shield,
    iconBg: "#ede9fe",
    iconColor: "#7c3aed",
  },
  {
    slug: "shooting",
    label: "Shooting",
    desc: "Plant foot, body shape over ball, striking technique, follow through",
    icon: Target,
    iconBg: "#fdf4ff",
    iconColor: "#a21caf",
  },
  {
    slug: "sprint",
    label: "Sprint Mechanics",
    desc: "Arm drive, forward lean, knee drive, stride rhythm",
    icon: Zap,
    iconBg: "#fff7ed",
    iconColor: "#c2410c",
  },
];

export default function CoachSkillDrillsPage() {
  const nav: React.CSSProperties = {
    backgroundColor: "white",
    borderBottom: "1px solid #e5e5e5",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <div style={nav}>
        <Link
          href="/coach"
          style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}
        >
          <ArrowLeft size={15} /> Coach Hub
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Skill Drill Test</span>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Target size={24} color="#f0b429" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>Coach Skill Drill Test</h1>
            <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Assess any player from your squad across 6 core skills</p>
          </div>
        </div>

        {/* Info banner */}
        <div style={{ backgroundColor: "#f0fdf4", borderRadius: 12, padding: "14px 18px", border: "1px solid #bbf7d0", marginBottom: 32, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Info size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: 13, color: "#15803d", lineHeight: 1.6 }}>
            Select a skill below, choose a player, rate their mechanics 1–5 as you observe them.
            Every session is averaged and the result automatically updates the player&apos;s radar chart.
            These are <strong>official coach-recorded results</strong> — not player self-assessments.
          </p>
        </div>

        {/* Skill cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {SKILLS.map(({ slug, label, desc, icon: Icon, iconBg, iconColor }) => (
            <Link
              key={slug}
              href={`/coach/skill-drills/${slug}`}
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                padding: "18px 20px",
                border: "1px solid #e5e7eb",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={20} color={iconColor} />
              </div>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#111" }}>{label}</h3>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
