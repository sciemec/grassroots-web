"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserSearch, Send, Star, ChevronRight, Search, Loader2, Shield } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface ScoutPlayer {
  id: string;
  initials: string;
  region: string;
  position: string;
  age_group: string;
  overall_score: number | null;
  sessions_count: number;
  scout_visible: boolean;
}

const POSITIONS = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];
const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Masvingo",
  "Mashonaland East", "Mashonaland West", "Mashonaland Central",
  "Matabeleland North", "Matabeleland South", "Midlands",
];
const AGE_GROUPS = ["u13", "u17", "u20", "senior"];

const scoreColor = (s: number) =>
  s >= 80 ? "text-green-500" : s >= 60 ? "text-yellow-500" : "text-muted-foreground";

function PageSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-8 h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="mb-6 flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function ScoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [players, setPlayers] = useState<ScoutPlayer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState("");
  const [province, setProvince] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [contactReason, setContactReason] = useState<Record<string, string>>({});
  const [sent, setSent]     = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "scout" && user.role !== "admin") { router.push("/dashboard"); return; }
  }, [user, router]);

  const search = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get("/scout/players", {
        params: {
          position: position || undefined,
          province: province || undefined,
          age_group: ageGroup || undefined,
        },
      });
      setPlayers(res.data?.data ?? res.data ?? []);
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const sendContact = async (playerId: string) => {
    if (!contactReason[playerId]?.trim()) return;
    setSending((s) => ({ ...s, [playerId]: true }));
    try {
      await api.post("/scout/contact-requests", {
        player_id: playerId,
        reason: contactReason[playerId],
      });
      setSent((s) => ({ ...s, [playerId]: true }));
    } catch {
      // keep form open on error
    } finally {
      setSending((s) => ({ ...s, [playerId]: false }));
    }
  };

  if (!user) return <PageSkeleton />;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Find Players</h1>
            <p className="text-sm text-muted-foreground">
              Player names are hidden — initials and region only until contact is approved
            </p>
          </div>
          <Link
            href="/scout/shortlist"
            className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
          >
            <Star className="h-4 w-4 text-yellow-500" />
            My Shortlist
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </div>

        {/* Privacy notice */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3">
          <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
          <p className="text-sm text-blue-700">
            Player privacy is protected. You see initials and region only. Full contact details are shared only after admin approves your request.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Search filters
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Position</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPosition("")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    !position ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Any
                </button>
                {POSITIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPosition(position === p ? "" : p)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      position === p ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Province</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Any province</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Age Group</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAgeGroup("")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    !ageGroup ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Any
                </button>
                {AGE_GROUPS.map((ag) => (
                  <button
                    key={ag}
                    onClick={() => setAgeGroup(ageGroup === ag ? "" : ag)}
                    className={`rounded-full px-3 py-1 text-xs font-medium uppercase transition-colors ${
                      ageGroup === ag ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {ag}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={search}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Searching…" : "Search players"}
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : players !== null ? (
          players.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <UserSearch className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No players found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">{players.length} player{players.length !== 1 ? "s" : ""} found</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((p) => (
                  <div key={p.id} className="rounded-xl border bg-card p-5">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                          {p.initials}
                        </div>
                        <p className="mt-2 font-semibold uppercase">{p.position}</p>
                        <p className="text-sm text-muted-foreground">{p.region}</p>
                        <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium uppercase">
                          {p.age_group}
                        </span>
                      </div>
                      {p.overall_score !== null && (
                        <div className="text-right">
                          <p className={`text-2xl font-black ${scoreColor(p.overall_score)}`}>
                            {p.overall_score}
                          </p>
                          <p className="text-xs text-muted-foreground">avg score</p>
                        </div>
                      )}
                    </div>

                    <p className="mb-3 text-xs text-muted-foreground">
                      {p.sessions_count} training session{p.sessions_count !== 1 ? "s" : ""} recorded
                    </p>

                    {sent[p.id] ? (
                      <div className="flex items-center gap-2 rounded-xl bg-green-500/10 px-3 py-2.5 text-sm font-medium text-green-700">
                        <Send className="h-3.5 w-3.5" />
                        Request sent — awaiting admin review
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          value={contactReason[p.id] ?? ""}
                          onChange={(e) => setContactReason((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="Reason for contact…"
                          className="w-full rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                        />
                        <button
                          onClick={() => sendContact(p.id)}
                          disabled={!contactReason[p.id]?.trim() || sending[p.id]}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                        >
                          {sending[p.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          Contact Player
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )
        ) : !hasSearched ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <UserSearch className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Search for players</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the filters above to find players matching your criteria
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
