"use client";

import Link from "next/link";
import { ArrowLeft, Eye, Video, Film, Activity, ChevronRight } from "lucide-react";

const TOOLS = [
  {
    href:  "/coach/match-eye",
    icon:  Eye,
    color: "#dc2626",
    bg:    "#fee2e2",
    label: "Match Eye",
    desc:  "Full match video analysis — formation detection, possession, tactical patterns, player tracking",
    badge: "AI Vision",
  },
  {
    href:  "/coach/drill-analysis",
    icon:  Video,
    color: "#7c3aed",
    bg:    "#ede9fe",
    label: "Drill Analysis",
    desc:  "Upload training footage — biomechanics scoring for 6 sprint, agility and technique drills",
    badge: "Gemini",
  },
  {
    href:  "/coach/general-analysis",
    icon:  Film,
    color: "#1a5c2a",
    bg:    "#f0fdf4",
    label: "General Analysis",
    desc:  "Upload any football footage for open-ended AI coaching feedback",
    badge: "AI",
  },
  {
    href:  "/coach/player-analysis",
    icon:  Activity,
    color: "#dc2626",
    bg:    "#fee2e2",
    label: "Player Analysis",
    desc:  "4-type biomechanics hub — movement, technique, resilience, posture screening",
    badge: "Gemini",
  },
];

export default function VideoAnalysisHubPage() {
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
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Video Analysis</span>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px 64px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#111" }}>Video Analysis</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
            Choose your analysis tool — upload match, training, or player footage and get AI coaching feedback.
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
                    textTransform: "uppercase",
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

        {/* Footer note */}
        <p style={{ marginTop: 28, fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
          All video analysis is powered by Gemini 2.0 Flash. Videos are not stored permanently unless you publish to the Arena.
        </p>
      </div>
    </div>
  );
}
