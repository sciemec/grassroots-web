"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Copy, Check, FileText, Database } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { queryAI } from "@/lib/ai-query";
import { getMatch, calcPossessionFromLog } from "@/lib/analyst-api";
import { MatchLoader } from "@/components/analyst/match-loader";

const LS_FORM   = "gs_tactical_form";
const LS_REPORT = "gs_tactical_report";

interface TacticalForm {
  homeTeam: string; awayTeam: string; homeScore: number; awayScore: number;
  formation: string; possession: number; shots: number; onTarget: number; notes: string;
}

const DEFAULT_FORM: TacticalForm = { homeTeam: "", awayTeam: "", homeScore: 0, awayScore: 0, formation: "4-3-3", possession: 50, shots: 0, onTarget: 0, notes: "" };

function TacticalReportInner() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<TacticalForm>(() => {
    try { return (JSON.parse(localStorage.getItem(LS_FORM) ?? "null") as TacticalForm | null) ?? DEFAULT_FORM; }
    catch { return DEFAULT_FORM; }
  });
  const [report, setReport] = useState(() => {
    try { return localStorage.getItem(LS_REPORT) ?? ""; } catch { return ""; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchLabel, setMatchLabel] = useState<string | null>(null);

  useEffect(() => { try { localStorage.setItem(LS_FORM, JSON.stringify(form)); } catch {} }, [form]);
  useEffect(() => { try { if (report) localStorage.setItem(LS_REPORT, report); } catch {} }, [report]);

  // Auto-load if ?match_id= is in URL
  useEffect(() => {
    const mid = searchParams.get("match_id");
    if (!mid) return;
    setLoadingMatch(true);
    getMatch(mid).then((m) => {
      const poss = calcPossessionFromLog(m.possession_log, m.elapsed);
      setForm({
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        homeScore: m.stats.home_goals,
        awayScore: m.stats.away_goals,
        formation: "4-3-3",
        possession: poss.home,
        shots: m.stats.home_shots + m.stats.away_shots,
        onTarget: 0,
        notes: "",
      });
      setMatchLabel(`${m.home_team} vs ${m.away_team}`);
      setReport("");
    }).catch(() => {}).finally(() => setLoadingMatch(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    if (!form.homeTeam || !form.awayTeam) return;
    setLoading(true);
    setError("");
    setReport("");
    try {
      const prompt = `Generate a professional tactical match report for a grassroots coach.

Match: ${form.homeTeam} ${form.homeScore} - ${form.awayScore} ${form.awayTeam}
Formation used: ${form.formation}
Possession: ${form.possession}%
Shots: ${form.shots} total, ${form.onTarget} on target
Coach observations: ${form.notes || "None provided"}

Provide a concise report in exactly 3 sections:
TACTICAL STRENGTHS:
TACTICAL WEAKNESSES:
RECOMMENDATIONS FOR NEXT MATCH:

Keep it practical and actionable for a grassroots Zimbabwean coach.`;

      const result = await queryAI(prompt, "analyst");
      setReport(result);
    } catch {
      setError("Could not generate report. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyReport = async () => {
    try { await navigator.clipboard.writeText(report); } catch { return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const f = form;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      {showLoader && (
        <MatchLoader
          title="Load Match Data"
          onClose={() => setShowLoader(false)}
          onSelect={(m) => {
            const poss = calcPossessionFromLog(m.possession_log, m.elapsed);
            setForm({
              homeTeam: m.home_team,
              awayTeam: m.away_team,
              homeScore: m.stats.home_goals,
              awayScore: m.stats.away_goals,
              formation: "4-3-3",
              possession: poss.home,
              shots: m.stats.home_shots + m.stats.away_shots,
              onTarget: 0,
              notes: "",
            });
            setMatchLabel(`${m.home_team} vs ${m.away_team}`);
            setReport("");
            setShowLoader(false);
          }}
        />
      )}
      <main className="gs-watermark flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/analyst" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">AI Tactical Report</h1>
            <p className="text-sm text-accent/80 italic">
              {matchLabel ? `Loaded: ${matchLabel}` : "Generate a 3-section match report with AI"}
            </p>
          </div>
          <button
            onClick={() => setShowLoader(true)}
            disabled={loadingMatch}
            className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-white"
          >
            {loadingMatch ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
            Load Match
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Match Details</h2>

            <div className="space-y-4">
              {/* Teams + Score */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Home Team</label>
                  <input type="text" placeholder="e.g. Harare City"
                    value={f.homeTeam} onChange={(e) => setForm((p: TacticalForm) => ({ ...p, homeTeam: e.target.value }))}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="flex gap-1.5 items-center pb-1">
                  <input type="number" min={0} max={99} value={f.homeScore}
                    onChange={(e) => setForm((p: TacticalForm) => ({ ...p, homeScore: Number(e.target.value) }))}
                    className="w-14 rounded-lg border bg-background px-2 py-2.5 text-center text-lg font-bold outline-none focus:ring-1 focus:ring-ring" />
                  <span className="text-muted-foreground font-bold">–</span>
                  <input type="number" min={0} max={99} value={f.awayScore}
                    onChange={(e) => setForm((p: TacticalForm) => ({ ...p, awayScore: Number(e.target.value) }))}
                    className="w-14 rounded-lg border bg-background px-2 py-2.5 text-center text-lg font-bold outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Away Team</label>
                  <input type="text" placeholder="e.g. Dynamos FC"
                    value={f.awayTeam} onChange={(e) => setForm((p: TacticalForm) => ({ ...p, awayTeam: e.target.value }))}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
                </div>
              </div>

              {/* Formation + Possession */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Formation Used</label>
                  <input type="text" placeholder="4-3-3"
                    value={f.formation} onChange={(e) => setForm((p: TacticalForm) => ({ ...p, formation: e.target.value }))}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Possession %</label>
                  <input type="number" min={0} max={100}
                    value={f.possession} onChange={(e) => setForm((p: TacticalForm) => ({ ...p, possession: Number(e.target.value) }))}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
                </div>
              </div>

              {/* Shots */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Total Shots</label>
                  <input type="number" min={0}
                    value={f.shots} onChange={(e) => setForm((p: TacticalForm) => ({ ...p, shots: Number(e.target.value) }))}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">On Target</label>
                  <input type="number" min={0}
                    value={f.onTarget} onChange={(e) => setForm((p: TacticalForm) => ({ ...p, onTarget: Number(e.target.value) }))}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
                </div>
              </div>

              {/* Observations */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Coach Observations <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <textarea rows={4} placeholder="What did you notice? Key moments, players who stood out, problems to fix…"
                  value={f.notes} onChange={(e) => setForm((p: TacticalForm) => ({ ...p, notes: e.target.value }))}
                  className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
              </div>

              <button
                onClick={generate}
                disabled={loading || !f.homeTeam || !f.awayTeam}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-semibold text-[#1a3a1a] hover:bg-[#d4a017] disabled:opacity-50 transition-colors"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating report…</>
                  : <><FileText className="h-4 w-4" /> Generate AI Report</>}
              </button>
            </div>
          </div>

          {/* Report output */}
          <div className="rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tactical Report</h2>
              {report && (
                <button onClick={copyReport} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                  {copied ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => <div key={i} className={`h-4 animate-pulse rounded bg-muted ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />)}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">{error}</div>
            ) : report ? (
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{report}</div>
            ) : (
              <div className="flex h-48 items-center justify-center text-center text-muted-foreground">
                <div>
                  <FileText className="mx-auto mb-3 h-8 w-8 opacity-30" />
                  <p className="text-sm">Fill in the match details and click Generate AI Report</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TacticalReportPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <TacticalReportInner />
    </Suspense>
  );
}
