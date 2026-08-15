"use client";

import Link from "next/link";
import { ArrowLeft, Dumbbell, BookOpen, Video, ChevronRight } from "lucide-react";

const TOOLS = [
  {
    href:  "/coach/drills",
    icon:  Dumbbell,
    color: "#2563eb",
    bg:    "#dbeafe",
    label: "Drill Browser",
    desc:  "Browse all drills by sport, phase, difficulty and position — filter by department",
    badge: "Library",
  },
  {
    href:  "/coach/session-library",
    icon:  BookOpen,
    color: "#d97706",
    bg:    "#fef3c7",
    label: "Session Library",
    desc:  "Full coaching session templates — attacking, defending, pressing, fundamentals and safety",
    badge: "Templates",
  },
  {
    href:  "/coach/gemini-drills",
    icon:  Video,
    color: "#1a5c2a",
    bg:    "#f0fdf4",
    label: "AI Drill Analysis",
    desc:  "Upload player footage and get Gemini-powered drill-specific biomechanics reports",
    badge: "Gemini AI",
  },
];

export default function DrillLibraryHubPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Nav */}
      <div style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e5e5e5",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <Link href="/coach" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
          <ArrowLeft size={15} /> Coach Hub
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Drill Library</span>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px 64px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#111" }}>Drill Library</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
            Browse coaching drills, full session plans, or analyse player footage to get drill-specific AI feedback.
          </p>
        </div>

        {/* Tool cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                backgroundColor: "white",
                borderRadius: 16,
                padding: "18px 20px",
                border: "1px solid #e5e7eb",
                textDecoration: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1a5c2a";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 8px rgba(26,92,42,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "#e5e7eb";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: tool.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <tool.icon size={22} color={tool.color} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{tool.label}</span>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.08em",
                    backgroundColor: "#1a5c2a",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}>
                    {tool.badge}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{tool.desc}</p>
              </div>

              <ChevronRight size={16} color="#d1d5db" style={{ flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
