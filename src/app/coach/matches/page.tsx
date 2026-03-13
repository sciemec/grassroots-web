"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trophy, X, ChevronDown, ChevronUp } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

interface MatchRecord {
  id: string;
  opponent: string;
  venue: "home" | "away" | "neutral";
  date: string;
  our_score: number;
  their_score: number;
  formation: string;
  scorers: string;
  yellow_cards: number;
  red_cards: number;
  notes: string;
}

const FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2"];

const OUTCOME_STYLES = {
  W: "bg-green-500/15 text-green-700",
  D: "bg-blue-500/15 text-blue-700",
  L: "bg-red-500/15 text-red-700",
};

function getOutcome(ours: number, theirs: number): "W" | "D" | "L" {
  return ours > theirs ? "W" : ours === theirs ? "D" : "L";
}

export default function CoachMatchesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    opponent: "", venue: "home" as "home" | "away" | "neutral",
    date: new Date().toISOString().slice(0, 10),
    our_score: 0, their_score: 0, formation: "4-3-3",
    scorers: "", yellow_cards: 0, red_cards: 0, notes: "",
  });

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    // Load from localStorage for offline support
    const saved = localStorage.getItem("coach_matches");
    if (saved) setMatches(JSON.parse(saved));
  }, [user, router]);

  const saveMatches = (updated: MatchRecord[]) => {
    setMatches(updated);
    localStorage.setItem("coach_matches", JSON.stringify(updated));
  };

  const addMatch = () => {
    if (!form.opponent.trim()) return;
    const record: MatchRecord = { ...form, id: Date.now().toString() };
    saveMatches([record, ...matches]);
    setShowForm(false);
    setForm({
      opponent: "", venue: "home", date: new Date().toISOString().slice(0, 10),
      our_score: 0, their_score: 0, formation: "4-3-3",
      scorers: "", yellow_cards: 0, red_cards: 0, notes: "",
    });
  };

  const deleteMatch = (id: string) => {
    if (!confirm("Delete this match record?")) return;
    saveMatches(matches.filter((m) => m.id !== id));
  };

  if (!user) return null;

  const wins   = matches.filter((m) => getOutcome(m.our_score, m.their_score) === "W").length;
  const draws  = matches.filter((m) => getOutcome(m.our_score, m.their_score) === "D").length;
  const losses = matches.filter((m) => getOutcome(m.our_score, m.their_score) === "L").length;
  const goalsFor     = matches.reduce((s, m) => s + m.our_score, 0);
  const goalsAgainst = matches.reduce((s, m) => s + m.their_score, 0);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/coach" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Match Record</h1>
              <p className="text-sm text-muted-foreground">Log results and review performance</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Log match
          </button>
        </div>

        {/* Season summary */}
        {matches.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Played",  value: matches.length,  color: "text-foreground" },
              { label: "Won",     value: wins,            color: "text-green-500" },
              { label: "Drawn",   value: draws,           color: "text-blue-500" },
              { label: "Lost",    value: losses,          color: "text-red-500" },
              { label: "GD",      value: `${goalsFor > goalsAgainst ? "+" : ""}${goalsFor - goalsAgainst}`, color: goalsFor >= goalsAgainst ? "text-green-500" : "text-red-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border bg-card p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add match form */}
        {showForm && (
          <div className="mb-6 rounded-xl border bg-card p-5">
            <h2 className="mb-4 font-semibold">Log a match</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="mb-1.5 block text-sm font-medium">Opponent</label>
                <input
                  type="text"
                  placeholder="e.g. Dynamos FC"
                  value={form.opponent}
                  onChange={(e) => setForm((f) => ({ ...f, opponent: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Venue</label>
                <select
                  value={form.venue}
                  onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value as typeof form.venue }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring capitalize"
                >
                  <option value="home">Home</option>
                  <option value="away">Away</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Our score</label>
                <input
                  type="number" min={0}
                  value={form.our_score}
                  onChange={(e) => setForm((f) => ({ ...f, our_score: Number(e.target.value) }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Their score</label>
                <input
                  type="number" min={0}
                  value={form.their_score}
                  onChange={(e) => setForm((f) => ({ ...f, their_score: Number(e.target.value) }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Formation used</label>
                <select
                  value={form.formation}
                  onChange={(e) => setForm((f) => ({ ...f, formation: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  {FORMATIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="mb-1.5 block text-sm font-medium">Goalscorers <span className="font-normal text-muted-foreground">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Chikwanda 23', Moyo 67'"
                  value={form.scorers}
                  onChange={(e) => setForm((f) => ({ ...f, scorers: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Yellow cards</label>
                <input
                  type="number" min={0}
                  value={form.yellow_cards}
                  onChange={(e) => setForm((f) => ({ ...f, yellow_cards: Number(e.target.value) }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Red cards</label>
                <input
                  type="number" min={0}
                  value={form.red_cards}
                  onChange={(e) => setForm((f) => ({ ...f, red_cards: Number(e.target.value) }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="mb-1.5 block text-sm font-medium">Match notes <span className="font-normal text-muted-foreground">(optional)</span></label>
                <textarea
                  rows={3}
                  placeholder="Observations, key moments, what worked and what didn't…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={addMatch}
                disabled={!form.opponent.trim()}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Save match
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl border px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Match list */}
        {matches.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Trophy className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No matches recorded yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Log your first match using the button above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((m) => {
              const outcome = getOutcome(m.our_score, m.their_score);
              const isOpen = expanded === m.id;
              return (
                <div key={m.id} className="overflow-hidden rounded-xl border bg-card">
                  <button
                    className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : m.id)}
                  >
                    <span className={`w-8 flex-shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-bold ${OUTCOME_STYLES[outcome]}`}>
                      {outcome}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">
                          {m.our_score} – {m.their_score} vs {m.opponent}
                        </p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">{m.venue}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{m.formation}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(m.date).toLocaleDateString("en-ZW", { day: "numeric", month: "long", year: "numeric" })}
                        {m.scorers && ` · ⚽ ${m.scorers}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t px-5 py-4">
                      <div className="mb-3 flex flex-wrap gap-4 text-sm">
                        <span>🟨 {m.yellow_cards} yellow{m.yellow_cards !== 1 ? "s" : ""}</span>
                        <span>🟥 {m.red_cards} red{m.red_cards !== 1 ? "s" : ""}</span>
                        {m.scorers && <span>⚽ {m.scorers}</span>}
                      </div>
                      {m.notes && (
                        <p className="mb-3 rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{m.notes}</p>
                      )}
                      <button
                        onClick={() => deleteMatch(m.id)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-600 hover:bg-red-500/10 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" /> Delete record
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
