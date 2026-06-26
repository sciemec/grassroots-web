"use client";

// src/components/passport/ScholarshipAlertCard.tsx
// Displays one matched scholarship program from scholarship-matcher.ts
// Used on the Arena Pathways tab and inside the Talent Passport.

import { ExternalLink, BookOpen, CheckCircle2, XCircle } from "lucide-react";
import { type MatchResult, fitColor } from "@/lib/scholarship-matcher";

interface Props {
  match: MatchResult;
  onAddToOutreach?: (programId: string) => void;
  compact?: boolean; // tighter layout for Arena feed
}

const FIT_BG: Record<string, string> = {
  "Strong Fit":   "#f0fdf4",
  "Good Fit":     "#fefce8",
  "Possible Fit": "#fff7ed",
  "Stretch":      "#fdf2f8",
};

const FIT_BORDER: Record<string, string> = {
  "Strong Fit":   "#bbf7d0",
  "Good Fit":     "#fde68a",
  "Possible Fit": "#fed7aa",
  "Stretch":      "#f9a8d4",
};

const CRITERIA: Array<{ key: keyof MatchResult["fit"]; label: string }> = [
  { key: "thuto",    label: "THUTO Score" },
  { key: "position", label: "Position Match" },
  { key: "reel",     label: "Reel Complete" },
  { key: "academic", label: "Academic Eligible" },
  { key: "ncaa",     label: "NCAA ID" },
];

export default function ScholarshipAlertCard({ match, onAddToOutreach, compact = false }: Props) {
  const { program, score, label, fit, blockers } = match;
  const color  = fitColor(label);
  const bg     = FIT_BG[label]     ?? "#f9fafb";
  const border = FIT_BORDER[label] ?? "#e5e7eb";
  const barWidth = `${Math.min(100, Math.round(score))}%`;

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1.5px solid ${border}`,
        background: bg,
        padding: compact ? "12px 14px" : "16px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#111", margin: "0 0 2px" }}>
            {program.institution}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#fff",
              background: "#1a5c2a", borderRadius: 4, padding: "2px 6px",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {program.division}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#fff",
              background: "#64748b", borderRadius: 4, padding: "2px 6px",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {program.sport}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#6b7280",
              background: "#f3f4f6", borderRadius: 4, padding: "2px 6px",
            }}>
              {program.country}
            </span>
          </div>
        </div>

        {/* Fit label */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color, margin: 0 }}>{label}</p>
          <p style={{ fontSize: 10, color: "#9ca3af", margin: "2px 0 0" }}>
            {Math.round(score)}% match
          </p>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ height: 6, borderRadius: 6, background: "#e5e7eb", overflow: "hidden" }}>
          <div style={{ height: "100%", width: barWidth, background: color, borderRadius: 6, transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* Criteria checklist (hidden in compact mode) */}
      {!compact && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", marginBottom: 10 }}>
          {CRITERIA.map(({ key, label: cLabel }) => {
            const met = fit[key];
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {met
                  ? <CheckCircle2 size={13} color="#16a34a" />
                  : <XCircle      size={13} color="#d1d5db" />
                }
                <span style={{ fontSize: 11, color: met ? "#374151" : "#9ca3af" }}>
                  {cLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Blockers */}
      {blockers.length > 0 && !compact && (
        <div style={{ background: "#fff7ed", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#b45309", margin: "0 0 4px" }}>
            What to improve:
          </p>
          {blockers.map((b, i) => (
            <p key={i} style={{ fontSize: 11, color: "#92400e", margin: i === 0 ? 0 : "3px 0 0" }}>
              · {b}
            </p>
          ))}
        </div>
      )}

      {/* Program notes (compact: hidden) */}
      {!compact && program.notes && (
        <p style={{ fontSize: 11, color: "#6b7280", fontStyle: "italic", marginBottom: 10 }}>
          {program.notes}
        </p>
      )}

      {/* CTA row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {onAddToOutreach && (
          <button
            onClick={() => onAddToOutreach(program.id)}
            style={{
              flex: 1, minWidth: 120,
              background: "#1a5c2a", color: "#fff",
              border: "none", borderRadius: 8, padding: "8px 12px",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            <BookOpen size={12} />
            Add to Outreach
          </button>
        )}
        {program.website && (
          <a
            href={program.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, minWidth: 100,
              border: "1.5px solid #d1d5db", borderRadius: 8, padding: "7px 12px",
              fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#374151",
              background: "#fff", textDecoration: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            <ExternalLink size={12} />
            Learn More
          </a>
        )}
      </div>
    </div>
  );
}
