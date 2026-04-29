"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { safeArray } from "@/lib/safe-array";
import { ArrowLeft, FileText, Download, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface ReportStats {
  province_name:   string;
  clubs_active:    number;
  clubs_pending:   number;
  players_total:   number;
  shortlisted:     number;
  leagues_active:  number;
  fixtures_played: number;
  goals_scored:    number;
  safeguarding_open: number;
}

interface League {
  id: number;
  name: string;
  sport: string;
  season: string;
  status: string;
  club_count: number;
  fixture_count: number;
}

export default function ReportsPage() {
  const router  = useRouter();
  const token   = useAuthStore((s) => s.token);
  const [stats, setStats]     = useState<ReportStats | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.allSettled([
      fetch(`${API_URL}/province-admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null),
      fetch(`${API_URL}/province-admin/leagues`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null),
    ]).then(([statsRes, leaguesRes]) => {
      if (statsRes.status === "fulfilled" && statsRes.value) {
        setStats(statsRes.value?.data ?? statsRes.value);
      }
      if (leaguesRes.status === "fulfilled" && leaguesRes.value) {
        setLeagues(safeArray<League>(leaguesRes.value));
      }
    }).finally(() => setLoading(false));
  }, [token]);

  const generatePDF = async () => {
    if (!stats) return;
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const today = new Date().toLocaleDateString("en-ZW", { day: "numeric", month: "long", year: "numeric" });
      const w = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(26, 61, 38);
      doc.rect(0, 0, w, 32, "F");
      doc.setFontSize(16);
      doc.setTextColor(240, 180, 41);
      doc.setFont("helvetica", "bold");
      doc.text("ZIFA PROVINCE ADMINISTRATION", w / 2, 13, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(200, 237, 208);
      doc.setFont("helvetica", "normal");
      doc.text(`${stats.province_name} · Quarterly Report`, w / 2, 20, { align: "center" });
      doc.text(`Generated: ${today}`, w / 2, 26, { align: "center" });

      // Province Summary
      doc.setFontSize(11);
      doc.setTextColor(26, 61, 38);
      doc.setFont("helvetica", "bold");
      doc.text("PROVINCE SUMMARY", 14, 42);

      autoTable(doc, {
        startY: 46,
        head: [["Metric", "Value"]],
        body: [
          ["Active Clubs",           stats.clubs_active.toString()],
          ["Pending Club Approvals", stats.clubs_pending.toString()],
          ["Registered Players",     stats.players_total.toString()],
          ["Shortlisted Talents",    stats.shortlisted.toString()],
          ["Active Leagues",         stats.leagues_active.toString()],
          ["Fixtures Played",        stats.fixtures_played.toString()],
          ["Total Goals Scored",     stats.goals_scored.toString()],
          ["Open Safeguarding Flags", stats.safeguarding_open.toString()],
        ],
        headStyles: { fillColor: [26, 61, 38], textColor: [240, 180, 41], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 250, 246] },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
      });

      // Leagues
      if (leagues.length > 0) {
        const afterSummary = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.setTextColor(26, 61, 38);
        doc.setFont("helvetica", "bold");
        doc.text("LEAGUES", 14, afterSummary);

        autoTable(doc, {
          startY: afterSummary + 4,
          head: [["League Name", "Sport", "Season", "Status", "Clubs", "Fixtures"]],
          body: leagues.map((l) => [
            l.name, l.sport, l.season,
            l.status.charAt(0).toUpperCase() + l.status.slice(1),
            l.club_count.toString(),
            l.fixture_count.toString(),
          ]),
          headStyles: { fillColor: [26, 61, 38], textColor: [240, 180, 41], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 250, 246] },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.setFont("helvetica", "normal");
        doc.text("CONFIDENTIAL — For ZIFA HQ use only", 14, 287);
        doc.text(`Page ${i} of ${pageCount}`, w - 14, 287, { align: "right" });
      }

      doc.save(`province-report-${stats.province_name.replace(/\s+/g, "-")}-${today.replace(/\s+/g, "-")}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-3xl">

        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Province Administration
            </p>
            <h1 className="text-2xl font-bold text-foreground">Province Reports</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading report data…</span>
          </div>
        ) : !stats ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm">
            Failed to load province stats.
          </div>
        ) : (
          <>
            {/* Summary preview */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-5 mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                {stats.province_name} — Report Preview
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Active Clubs",    value: stats.clubs_active },
                  { label: "Players",          value: stats.players_total },
                  { label: "Active Leagues",   value: stats.leagues_active },
                  { label: "Fixtures Played",  value: stats.fixtures_played },
                  { label: "Goals Scored",     value: stats.goals_scored },
                  { label: "Shortlisted",      value: stats.shortlisted },
                  { label: "Pending Clubs",    value: stats.clubs_pending },
                  { label: "Safeguarding",     value: stats.safeguarding_open },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-white/5 p-3">
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Leagues preview */}
            {leagues.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden mb-6">
                <div className="px-5 py-4 border-b border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Leagues Included ({leagues.length})
                  </p>
                </div>
                <ul className="divide-y divide-white/5">
                  {leagues.map((l) => (
                    <li key={l.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{l.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{l.sport} · {l.season}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{l.club_count} clubs</p>
                        <p className="text-xs text-accent">{l.fixture_count} fixtures</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Download button */}
            <button
              onClick={generatePDF}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#f0b429] hover:bg-amber-400 disabled:opacity-50 text-[#1a3a1a] font-bold transition-colors"
            >
              {generating ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Generating PDF…</>
              ) : (
                <><Download className="h-5 w-5" /><FileText className="h-5 w-5" /> Download PDF Report for ZIFA HQ</>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground mt-3">
              Includes province summary, league standings, and safeguarding overview.
              Marked CONFIDENTIAL.
            </p>
          </>
        )}

      </main>
    </div>
  );
}
