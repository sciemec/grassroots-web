"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, Download, Loader2, CheckCircle, Search,
  Star, UserSearch, AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { queryAI } from "@/lib/ai-query";
import { SPORT_STATS, getSportAnalysisPrompt, type SportKey } from "@/config/sports";

interface ScoutPlayer {
  id: string;
  initials: string;
  region: string;
  position: string;
  age_group: string;
  overall_score: number;
  sport: string;
}

interface GeneratedReport {
  player_id: string;
  initials: string;
  generated_at: string;
}

/** Fetches a Claude-generated assessment for a single player. */
async function fetchPlayerAnalysis(player: ScoutPlayer): Promise<string> {
  const statsKeys =
    SPORT_STATS[player.sport]?.outfield ??
    SPORT_STATS[player.sport]?.all ??
    SPORT_STATS[player.sport]?.[Object.keys(SPORT_STATS[player.sport] ?? {})[0]] ??
    [];

  const context =
    `Player: ${player.initials}, Position: ${player.position}, ` +
    `Region: ${player.region}, Age Group: ${player.age_group}, ` +
    `Overall Score: ${player.overall_score}/100, Sport: ${player.sport}. ` +
    `Key stats tracked: ${statsKeys.join(", ")}.`;

  const prompt = getSportAnalysisPrompt(player.sport as SportKey, context);

  return await queryAI(`[Scout Report — ${player.sport}] ${prompt}`, "scout");
}

/** Generates and downloads a professional PDF scouting report for one player. */
async function generatePdf(
  player: ScoutPlayer,
  analysis: string
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = margin;

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(22, 163, 74); // green-600
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("GRASSROOTS SPORT PRO", margin, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("SCOUTING REPORT — CONFIDENTIAL", margin, 16);
  doc.text(
    new Date().toLocaleDateString("en-ZW", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    pageW - margin,
    16,
    { align: "right" }
  );

  y = 32;

  // ── Section title ─────────────────────────────────────────────────────────
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PLAYER PROFILE", margin, y);
  y += 6;

  // ── Player info table ──────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Field", "Value"]],
    body: [
      ["Initials", player.initials],
      ["Position", player.position],
      ["Region", player.region],
      ["Age Group", player.age_group.toUpperCase()],
      ["Sport", player.sport.charAt(0).toUpperCase() + player.sport.slice(1)],
      ["Overall Score", `${player.overall_score} / 100`],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
    theme: "striped",
  });

  const docWithTable1 = doc as typeof doc & { lastAutoTable: { finalY: number } };
  y = docWithTable1.lastAutoTable.finalY + 10;

  // ── Stats section ──────────────────────────────────────────────────────────
  const sportStatsEntry = SPORT_STATS[player.sport];
  if (sportStatsEntry) {
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TRACKED STATISTICS", margin, y);
    y += 4;

    const statsRows: [string, string][] = [];
    for (const [category, stats] of Object.entries(sportStatsEntry)) {
      statsRows.push([`${category} stats`, (stats as string[]).join(", ")]);
    }

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      body: statsRows,
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 30, textColor: [100, 100, 100] },
      },
      theme: "plain",
    });

    const docWithTable2 = doc as typeof doc & { lastAutoTable: { finalY: number } };
    y = docWithTable2.lastAutoTable.finalY + 10;
  }

  // ── AI Analysis section ────────────────────────────────────────────────────
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("AI ANALYSIS — POWERED BY CLAUDE", margin, y);
  y += 6;

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const analysisLines = doc.splitTextToSize(analysis, pageW - margin * 2) as string[];
  const lineH = 4.5;
  const pageH = doc.internal.pageSize.getHeight();

  for (const line of analysisLines) {
    if (y + lineH > pageH - 20) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineH;
  }

  y += 8;

  // ── Recommendations box ────────────────────────────────────────────────────
  if (y + 30 > pageH - 20) {
    doc.addPage();
    y = margin;
  }

  doc.setTextColor(22, 163, 74);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SCOUT RECOMMENDATIONS", margin, y);
  y += 6;

  doc.setFillColor(240, 253, 244); // light green tint
  doc.roundedRect(margin, y, pageW - margin * 2, 22, 3, 3, "F");
  doc.setTextColor(21, 128, 61);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    [
      "• Monitor player development over next 3 months",
      "• Arrange trial session with technical staff",
      "• Review footage with head of recruitment",
    ],
    margin + 4,
    y + 6
  );

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footerY = pageH - 10;
  doc.setTextColor(160, 160, 160);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Confidential — Generated by Grassroots Sport AI · ZIFA Safeguarding Policy: Player identity protected",
    pageW / 2,
    footerY,
    { align: "center" }
  );

  // Trigger download
  doc.save(`scout-report-${player.initials.replace(/\s+/g, "-")}-${Date.now()}.pdf`);
}

export default function ScoutReportsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [error, setError] = useState("");

  useEffect(() => { // guests allowed — no login redirect }, [user, router]);

  const { data: players = [], isLoading } = useQuery<ScoutPlayer[]>({
    queryKey: ["scout-players"],
    queryFn: async () => {
      const res = await api.get("/scout/players");
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !!user,
  });

  const { data: shortlist = [] } = useQuery<ScoutPlayer[]>({
    queryKey: ["scout-shortlist"],
    queryFn: async () => {
      const res = await api.get("/scout/shortlist");
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !!user,
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  /** Client-side PDF generation using jsPDF + Claude AI analysis. */
  const generateReports = async () => {
    if (selected.size === 0) return;
    setGenerating(true);
    setError("");
    const newReports: GeneratedReport[] = [];

    const allCandidates = shortlist.length > 0 ? shortlist : players;

    for (const id of Array.from(selected)) {
      const player = allCandidates.find((p) => p.id === id);
      if (!player) continue;

      try {
        const analysis = await fetchPlayerAnalysis(player);
        await generatePdf(player, analysis);
        newReports.push({
          player_id: id,
          initials: player.initials,
          generated_at: new Date().toISOString(),
        });
      } catch {
        setError(
          `Failed to generate report for ${player.initials}. Check your connection and try again.`
        );
      }
    }

    setReports((prev) => [...newReports, ...prev]);
    setGenerating(false);
  };


  const allCandidates = shortlist.length > 0 ? shortlist : players;
  const filtered = allCandidates.filter(
    (p) =>
      search === "" ||
      p.initials.toLowerCase().includes(search.toLowerCase()) ||
      p.position.toLowerCase().includes(search.toLowerCase()) ||
      p.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/scout/shortlist"
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Scout PDF Reports
            </h1>
            <p className="text-sm text-muted-foreground">
              Select players and generate AI-powered scouting reports via Claude
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Player selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by initials, position, or region…"
                className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Reports are generated by Claude AI and saved as PDF on your device. Player
                identities are protected — reports use initials and region only, per ZIFA
                safeguarding policy.
              </p>
            </div>

            {/* Player list */}
            <div className="rounded-xl border bg-card">
              <div className="border-b px-4 py-3 flex items-center justify-between">
                <h2 className="font-semibold text-sm">
                  {shortlist.length > 0 ? "Your Shortlist" : "All Players"}
                  {" "}({filtered.length})
                </h2>
                {selected.size > 0 && (
                  <button
                    onClick={() => setSelected(new Set())}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-lg bg-muted/40 animate-pulse"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <UserSearch className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No players found. Build your shortlist first.
                  </p>
                  <Link
                    href="/scout"
                    className="mt-3 inline-block text-sm text-primary hover:underline"
                  >
                    Find players →
                  </Link>
                </div>
              ) : (
                <div className="divide-y max-h-[480px] overflow-y-auto">
                  {filtered.map((player) => {
                    const isSelected = selected.has(player.id);
                    return (
                      <button
                        key={player.id}
                        onClick={() => toggle(player.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${
                          isSelected ? "bg-primary/5" : "hover:bg-muted/40"
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle className="h-3.5 w-3.5 text-primary-foreground" />
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {player.initials}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {player.initials}
                          </p>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{player.position}</span>
                            <span>·</span>
                            <span>{player.region}</span>
                            <span>·</span>
                            <span className="uppercase">{player.age_group}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-sm font-bold text-primary">
                          <Star className="h-3.5 w-3.5 fill-primary" />
                          {player.overall_score}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Generate panel */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-5 sticky top-0">
              <h2 className="font-semibold mb-4">Generate Reports</h2>

              <div className="mb-5 rounded-xl bg-muted/40 p-4 text-center">
                <p className="text-3xl font-black text-primary">
                  {selected.size}
                </p>
                <p className="text-xs text-muted-foreground">
                  player{selected.size !== 1 ? "s" : ""} selected
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={generateReports}
                disabled={selected.size === 0 || generating}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating
                    PDF{selected.size > 1 ? "s" : ""}…
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" /> Generate{" "}
                    {selected.size > 0 ? `${selected.size} ` : ""}Report
                    {selected.size !== 1 ? "s" : ""}
                  </>
                )}
              </button>

              <p className="mt-3 text-xs text-center text-muted-foreground">
                PDFs are generated on your device and downloaded automatically.
              </p>

              <div className="mt-4 rounded-xl border border-dashed p-3 text-center">
                <p className="text-xs text-muted-foreground">Premium feature</p>
                <p className="text-xs font-medium mt-0.5">
                  Requires active Scout subscription
                </p>
              </div>
            </div>

            {/* Generated reports log */}
            {reports.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" /> Downloaded
                </h2>
                <div className="space-y-2">
                  {reports.map((report, i) => (
                    <div
                      key={`${report.player_id}-${i}`}
                      className="flex items-center justify-between rounded-lg border px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{report.initials}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.generated_at).toLocaleTimeString(
                            "en-ZW"
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-700">
                        <Download className="h-3.5 w-3.5" /> Saved
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
