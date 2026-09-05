"use client";

import { useState } from "react";
import {
  ChevronDown,
  BarChart3,
  Brain,
  Users,
  Download,
  Target,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import PotentialCard from "./PotentialCard";
import { RepresentationForm } from "./RepresentationForm";

// ── Types ──────────────────────────────────────────────────────────────────

interface DrillScore {
  drillName: string;
  score: number;
  topStrength: string | null;
  avgSubScore?: number | null;
}

interface Props {
  playerId: string;
  playerName: string;
  sport: string;
  position: string;
  province: string;
  ageGroup: string | null;
  profilePct: number;
  drillScores: DrillScore[];
  club: string | null;
  school: string | null;
  bio: string | null;
  heightCm: string | null;
  weightKg: string | null;
  preferredFoot: string | null;
  verificationStatus: string;
}

// ── Profile fields for the strength checklist ──────────────────────────────

const STRENGTH_FIELDS = [
  { key: "sport",        label: "Sport" },
  { key: "position",    label: "Position" },
  { key: "province",    label: "Province" },
  { key: "ageGroup",    label: "Age Group" },
  { key: "heightCm",    label: "Height" },
  { key: "weightKg",    label: "Weight" },
  { key: "preferredFoot", label: "Preferred Foot" },
  { key: "clubOrSchool", label: "Club / School" },
  { key: "bio",          label: "Bio" },
  { key: "verified",     label: "Identity Verified" },
] as const;

// ── Collapsible panel ──────────────────────────────────────────────────────

function Panel({
  title,
  icon: Icon,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-[#f0b429]/10 bg-[#f0b429]/5 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f0b429]/10 shrink-0">
          <Icon className="h-4 w-4 text-[#f0b429]" />
        </div>
        <span className="flex-1 text-sm font-semibold text-white">{title}</span>
        {badge && (
          <span className="rounded-full bg-[#f0b429]/20 px-2 py-0.5 text-[10px] font-bold text-[#f0b429]">
            {badge}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 text-[#f0b429]/50 transition-transform duration-200 shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-[#f0b429]/10 px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function PublicProfileAccordion({
  playerId,
  playerName,
  sport,
  position,
  province,
  ageGroup,
  profilePct,
  drillScores,
  club,
  school,
  bio,
  heightCm,
  weightKg,
  preferredFoot,
  verificationStatus,
}: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const fieldValues: Record<string, string | null | undefined> = {
    sport,
    position,
    province,
    ageGroup,
    heightCm,
    weightKg,
    preferredFoot,
    clubOrSchool: club ?? school,
    bio,
    verified: verificationStatus === "approved" ? "yes" : null,
  };

  // ── PDF download ─────────────────────────────────────────────────────────

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;
      const mg = 16;

      // Green header band
      doc.setFillColor(26, 92, 42);
      doc.rect(0, 0, W, 36, "F");

      doc.setTextColor(240, 180, 41);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("GRASSROOTS SPORTS", mg, 13);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("TALENT PASSPORT", mg, 24);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 230, 200);
      doc.text("Zimbabwe's First AI-Powered Sports Platform", mg, 31);

      // Player name
      doc.setTextColor(26, 92, 42);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(playerName, mg, 52);

      // Sport · position · province sub-line
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const subLine = [sport, position, province, ageGroup?.toUpperCase()]
        .filter(Boolean)
        .join("  ·  ");
      doc.text(subLine, mg, 60);

      // Verified badge
      if (verificationStatus === "approved") {
        doc.setFillColor(240, 180, 41);
        doc.roundedRect(W - mg - 32, 43, 32, 9, 2, 2, "F");
        doc.setTextColor(26, 42, 26);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("VERIFIED", W - mg - 16, 49, { align: "center" });
      }

      // Gold divider
      doc.setDrawColor(240, 180, 41);
      doc.setLineWidth(0.5);
      doc.line(mg, 65, W - mg, 65);

      let y = 74;

      // Profile details
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 92, 42);
      doc.text("PROFILE DETAILS", mg, y);
      y += 6;

      const details: [string, string | null | undefined][] = [
        ["Height", heightCm ? `${heightCm} cm` : null],
        ["Weight", weightKg ? `${weightKg} kg` : null],
        ["Preferred Foot", preferredFoot],
        ["Club / School", club ?? school],
      ];

      doc.setFont("helvetica", "normal");
      for (const [label, value] of details) {
        if (!value) continue;
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text(`${label}:`, mg, y);
        doc.setTextColor(30, 30, 30);
        doc.text(value, mg + 42, y);
        y += 6;
      }

      // Bio
      if (bio) {
        y += 3;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(26, 92, 42);
        doc.text("ABOUT", mg, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(8);
        const bioLines = doc.splitTextToSize(bio, W - mg * 2);
        doc.text(bioLines, mg, y);
        y += bioLines.length * 4.5 + 6;
      }

      // Drill scores
      if (drillScores.length > 0) {
        doc.setFillColor(240, 247, 240);
        doc.rect(mg, y, W - mg * 2, 8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(26, 92, 42);
        doc.text("AI DRILL ANALYSIS", mg + 2, y + 5.5);
        y += 13;

        const barW = W - mg * 2 - 32;

        for (const drill of drillScores.slice(0, 6)) {
          if (y > 258) break;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(30, 30, 30);
          doc.text(drill.drillName, mg, y);

          doc.setFont("helvetica", "bold");
          doc.setTextColor(26, 92, 42);
          doc.text(`${drill.score.toFixed(1)}/10`, W - mg, y, { align: "right" });

          y += 2.5;
          // Bar background
          doc.setFillColor(210, 210, 210);
          doc.roundedRect(mg, y, barW, 2.5, 0.5, 0.5, "F");
          // Bar fill
          const c =
            drill.score >= 8 ? [240, 180, 41] : drill.score >= 5 ? [26, 92, 42] : [160, 160, 160];
          doc.setFillColor(c[0], c[1], c[2]);
          doc.roundedRect(mg, y, (drill.score / 10) * barW, 2.5, 0.5, 0.5, "F");
          y += 8;
        }
        y += 4;
      }

      // Footer
      doc.setFillColor(26, 92, 42);
      doc.rect(0, 280, W, 17, "F");
      doc.setTextColor(240, 180, 41);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("grassrootssports.live", mg, 289);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Generated ${new Date().toLocaleDateString("en-GB")}`,
        W - mg,
        289,
        { align: "right" }
      );
      doc.setFontSize(6.5);
      doc.text(
        "This passport was issued by GrassRoots Sports · Zimbabwe's National Talent Registry",
        W / 2,
        294,
        { align: "center" }
      );

      doc.save(`GRS-Passport-${playerName.replace(/\s+/g, "-")}.pdf`);
    } catch {
      // silent — user can retry
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mt-4 space-y-2">

      {/* ── 1. Profile Strength ─────────────────────────────────────────── */}
      <Panel title="Profile Strength" icon={Target} badge={`${profilePct}%`}>
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-widest text-[#f0b429]/50">
              Completeness
            </span>
            <span className="text-[10px] font-bold text-[#f0b429]">{profilePct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${profilePct}%`,
                background:
                  profilePct >= 80
                    ? "#f0b429"
                    : profilePct >= 50
                    ? "#22c55e"
                    : "rgba(255,255,255,0.35)",
              }}
            />
          </div>
        </div>

        {/* Field checklist */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
          {STRENGTH_FIELDS.map((f) => {
            const filled = !!fieldValues[f.key];
            return (
              <div key={f.key} className="flex items-center gap-1.5">
                {filled ? (
                  <CheckCircle className="h-3.5 w-3.5 text-[#f0b429] shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-white/20 shrink-0" />
                )}
                <span
                  className={`text-[11px] ${filled ? "text-white/80" : "text-white/25"}`}
                >
                  {f.label}
                </span>
              </div>
            );
          })}
        </div>

      </Panel>

      {/* ── 2. AI Drill Analysis ────────────────────────────────────────── */}
      {drillScores.length > 0 && (
        <Panel
          title="AI Drill Analysis"
          icon={BarChart3}
          badge={String(drillScores.length)}
        >
          <div className="space-y-2">
            {drillScores.slice(0, 5).map((drill) => (
              <div key={drill.drillName} className="rounded-xl bg-[#f0b429]/5 px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-white truncate pr-2">
                    {drill.drillName}
                  </p>
                  <span
                    className={`text-sm font-extrabold shrink-0 ${
                      drill.score >= 8
                        ? "text-[#f0b429]"
                        : drill.score >= 5
                        ? "text-white"
                        : "text-white/50"
                    }`}
                  >
                    {drill.score.toFixed(1)}
                    <span className="text-[10px] font-normal text-[#f0b429]/30">/10</span>
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/10">
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${(drill.score / 10) * 100}%`,
                      background:
                        drill.score >= 8
                          ? "#f0b429"
                          : drill.score >= 5
                          ? "rgba(255,255,255,0.5)"
                          : "rgba(255,255,255,0.2)",
                    }}
                  />
                </div>
                {drill.topStrength && (
                  <p className="mt-1.5 text-[10px] text-[#f0b429]/40 leading-snug">
                    {drill.topStrength}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ── 3. Talent Prediction ────────────────────────────────────────── */}
      <Panel title="Talent Prediction" icon={Brain}>
        <PotentialCard playerId={playerId} playerName={playerName} isPublicView={true} />
      </Panel>

      {/* ── 4. Get Represented ──────────────────────────────────────────── */}
      <Panel title="Get Represented" icon={Users}>
        <p className="text-xs text-[#f0b429]/50 mb-3 leading-relaxed">
          Scouts and clubs can send a formal approach through GrassRoots Sports.
        </p>
        <RepresentationForm playerId={playerId} playerName={playerName} />
      </Panel>

      {/* ── 5. Download Talent Passport ─────────────────────────────────── */}
      <Panel title="Download Talent Passport" icon={FileText}>
        <p className="text-xs text-[#f0b429]/50 mb-4 leading-relaxed">
          Generate a shareable PDF — perfect for trials, coach submissions, and scouting packs.
        </p>
        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-bold text-[#1a3a1a] transition-colors hover:bg-[#f0b429]/90 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {pdfLoading ? "Generating…" : "Download PDF"}
        </button>
      </Panel>

    </div>
  );
}
