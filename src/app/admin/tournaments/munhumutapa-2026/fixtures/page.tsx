"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Trophy, Plus, Save, Trash2, ArrowLeft,
  CheckCircle2, Clock, Radio,
} from "lucide-react";
import type { Fixture } from "@/app/tournaments/munhumutapa-2026/fixtures/page";

// ── Types ────────────────────────────────────────────────────────────────────

type Category = "u14-boys" | "u14-girls" | "u16-boys" | "u16-girls";
type Round    = "group" | "quarter" | "semi" | "final";

interface Registration {
  id: string;
  club_name: string;
  age_group: "U14" | "U16";
  gender: "Boys" | "Girls";
}

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "u14-boys",  label: "U14 Boys"  },
  { value: "u14-girls", label: "U14 Girls" },
  { value: "u16-boys",  label: "U16 Boys"  },
  { value: "u16-girls", label: "U16 Girls" },
];

const ROUNDS: { value: Round; label: string }[] = [
  { value: "group",   label: "Group Stage"    },
  { value: "quarter", label: "Quarter-Finals" },
  { value: "semi",    label: "Semi-Finals"    },
  { value: "final",   label: "Final"          },
];

const VENUES = [
  "Raylton Sports Club",
  "Harare City Sports Centre",
  "Rufaro Stadium",
  "HICC Grounds",
  "TBA",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadFixtures(): Fixture[] {
  try { return JSON.parse(localStorage.getItem("munhumutapa_2026_fixtures") ?? "[]"); }
  catch { return []; }
}

function saveFixtures(fixtures: Fixture[]) {
  localStorage.setItem("munhumutapa_2026_fixtures", JSON.stringify(fixtures));
}

function loadRegistrations(): Registration[] {
  try { return JSON.parse(localStorage.getItem("munhumutapa_2026_registrations") ?? "[]"); }
  catch { return []; }
}

function catToAgeGender(cat: Category): { age: "U14" | "U16"; gender: "Boys" | "Girls" } {
  const [age, gender] = cat.split("-");
  return {
    age:    (age.toUpperCase() as "U14" | "U16"),
    gender: (gender.charAt(0).toUpperCase() + gender.slice(1) as "Boys" | "Girls"),
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminFixturesPage() {
  const [fixtures, setFixtures]       = useState<Fixture[]>([]);
  const [registrations, setReg]       = useState<Registration[]>([]);
  const [activeCategory, setActiveCat]= useState<Category>("u14-boys");
  const [showAddForm, setShowAddForm] = useState(false);
  const [saved, setSaved]             = useState(false);

  // New fixture form state
  const [homeTeam,  setHomeTeam]  = useState("");
  const [awayTeam,  setAwayTeam]  = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("10:00");
  const [venue,     setVenue]     = useState("Raylton Sports Club");
  const [group,     setGroup]     = useState("Group A");
  const [round,     setRound]     = useState<Round>("group");

  useEffect(() => {
    setFixtures(loadFixtures());
    setReg(loadRegistrations());
  }, []);

  // Teams registered for the active category
  const teamsInCategory = useMemo(() => {
    const { age, gender } = catToAgeGender(activeCategory);
    return registrations
      .filter((r) => r.age_group === age && r.gender === gender)
      .map((r) => r.club_name);
  }, [registrations, activeCategory]);

  const catFixtures = useMemo(
    () => fixtures.filter((f) => f.category === activeCategory),
    [fixtures, activeCategory]
  );

  // ── Add fixture ────────────────────────────────────────────────────────────

  const addFixture = () => {
    if (!homeTeam || !awayTeam || !matchDate || homeTeam === awayTeam) return;

    const newFixture: Fixture = {
      id:        `fix-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category:  activeCategory,
      group,
      round,
      homeTeam,
      awayTeam,
      date:      matchDate,
      time:      matchTime,
      venue,
      homeScore: null,
      awayScore: null,
      status:    "scheduled",
    };

    const updated = [...fixtures, newFixture];
    setFixtures(updated);
    saveFixtures(updated);

    // Reset form
    setHomeTeam(""); setAwayTeam("");
    setMatchDate(""); setShowAddForm(false);
    flash();
  };

  // ── Update score ───────────────────────────────────────────────────────────

  const updateScore = (id: string, home: number | null, away: number | null) => {
    const updated = fixtures.map((f) =>
      f.id !== id ? f : {
        ...f,
        homeScore: home,
        awayScore: away,
        status: (home !== null && away !== null ? "completed" : f.status) as Fixture["status"],
      }
    );
    setFixtures(updated);
    saveFixtures(updated);
    flash();
  };

  const setStatus = (id: string, status: Fixture["status"]) => {
    const updated = fixtures.map((f) => f.id !== id ? f : { ...f, status });
    setFixtures(updated);
    saveFixtures(updated);
    flash();
  };

  const deleteFixture = (id: string) => {
    const updated = fixtures.filter((f) => f.id !== id);
    setFixtures(updated);
    saveFixtures(updated);
  };

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  // ── Group fixtures by round ────────────────────────────────────────────────

  const byRound = useMemo(() => {
    const result: Partial<Record<Round, Fixture[]>> = {};
    (["group", "quarter", "semi", "final"] as Round[]).forEach((r) => {
      const rf = catFixtures.filter((f) => f.round === r);
      if (rf.length > 0) result[r] = rf;
    });
    return result;
  }, [catFixtures]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 gs-watermark">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/tournaments/munhumutapa-2026"
              className="flex items-center gap-1.5 rounded-lg border border-[#f0b429]/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Fixtures &amp; Results</h1>
              <p className="text-sm text-muted-foreground">Munhumutapa Challenge Cup 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
            <Link
              href="/tournaments/munhumutapa-2026/fixtures"
              target="_blank"
              className="flex items-center gap-2 rounded-lg border border-[#f0b429]/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:bg-white/10"
            >
              Public View →
            </Link>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-[#f0b429] px-4 py-2 text-sm font-semibold text-[#1a3a1a] hover:bg-[#e6a820]"
            >
              <Plus className="h-4 w-4" /> Add Fixture
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-[#f0b429]/10 bg-white/5 p-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setActiveCat(c.value)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                activeCategory === c.value
                  ? "bg-[#f0b429] text-[#1a3a1a]"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Add fixture form */}
        {showAddForm && (
          <div className="mb-6 rounded-xl border border-[#f0b429]/30 bg-[#f0b429]/5 p-5 space-y-4">
            <p className="font-semibold text-white">New Fixture — {CATEGORIES.find((c) => c.value === activeCategory)?.label}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Round + Group */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Round</label>
                <select
                  value={round}
                  onChange={(e) => setRound(e.target.value as Round)}
                  className="w-full rounded-lg border border-[#f0b429]/10 bg-[#0a1f0e] px-3 py-2 text-sm text-white"
                >
                  {ROUNDS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Group / Label</label>
                <input
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="Group A / Semi-Final 1 / Final"
                  className="w-full rounded-lg border border-[#f0b429]/10 bg-[#0a1f0e] px-3 py-2 text-sm text-white placeholder:text-white/20"
                />
              </div>

              {/* Home / Away */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Home Team</label>
                <TeamSelect
                  value={homeTeam}
                  onChange={setHomeTeam}
                  teams={teamsInCategory}
                  exclude={awayTeam}
                  placeholder="Select or type home team"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Away Team</label>
                <TeamSelect
                  value={awayTeam}
                  onChange={setAwayTeam}
                  teams={teamsInCategory}
                  exclude={homeTeam}
                  placeholder="Select or type away team"
                />
              </div>

              {/* Date + Time */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Date</label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full rounded-lg border border-[#f0b429]/10 bg-[#0a1f0e] px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Kick-off Time</label>
                <input
                  type="time"
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                  className="w-full rounded-lg border border-[#f0b429]/10 bg-[#0a1f0e] px-3 py-2 text-sm text-white"
                />
              </div>

              {/* Venue */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Venue</label>
                <select
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full rounded-lg border border-[#f0b429]/10 bg-[#0a1f0e] px-3 py-2 text-sm text-white"
                >
                  {VENUES.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg border border-[#f0b429]/10 py-2.5 text-sm text-muted-foreground hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={addFixture}
                disabled={!homeTeam || !awayTeam || !matchDate || homeTeam === awayTeam}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#f0b429] py-2.5 text-sm font-bold text-[#1a3a1a] disabled:opacity-40"
              >
                <Save className="h-4 w-4" /> Save Fixture
              </button>
            </div>
          </div>
        )}

        {/* Fixtures list */}
        {catFixtures.length === 0 ? (
          <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-12 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">No fixtures yet for this category.</p>
            <p className="mt-1 text-sm text-muted-foreground/50">Click &quot;Add Fixture&quot; to create the first one.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(Object.entries(byRound) as [Round, Fixture[]][]).map(([r, rFixtures]) => (
              <div key={r}>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {ROUNDS.find((rd) => rd.value === r)?.label}
                </p>
                <div className="space-y-2">
                  {rFixtures
                    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                    .map((f) => (
                      <AdminFixtureRow
                        key={f.id}
                        fixture={f}
                        onUpdateScore={updateScore}
                        onSetStatus={setStatus}
                        onDelete={deleteFixture}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

// ── Team select (dropdown + free-type) ───────────────────────────────────────

function TeamSelect({
  value, onChange, teams, exclude, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  teams: string[];
  exclude: string;
  placeholder: string;
}) {
  const options = teams.filter((t) => t !== exclude);
  return (
    <div className="relative">
      {options.length > 0 ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[#f0b429]/10 bg-[#0a1f0e] px-3 py-2 text-sm text-white"
        >
          <option value="">{placeholder}</option>
          {options.map((t) => <option key={t} value={t}>{t}</option>)}
          <option value="__other__">Other / Type name...</option>
        </select>
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[#f0b429]/10 bg-[#0a1f0e] px-3 py-2 text-sm text-white placeholder:text-white/20"
        />
      )}
      {value === "__other__" && (
        <input
          autoFocus
          placeholder="Type team name"
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#f0b429]/40 bg-[#0a1f0e] px-3 py-2 text-sm text-white placeholder:text-white/20"
        />
      )}
    </div>
  );
}

// ── Admin fixture row ─────────────────────────────────────────────────────────

function AdminFixtureRow({
  fixture: f,
  onUpdateScore,
  onSetStatus,
  onDelete,
}: {
  fixture: Fixture;
  onUpdateScore: (id: string, home: number | null, away: number | null) => void;
  onSetStatus: (id: string, status: Fixture["status"]) => void;
  onDelete: (id: string) => void;
}) {
  const [homeInput, setHomeInput] = useState(f.homeScore?.toString() ?? "");
  const [awayInput, setAwayInput] = useState(f.awayScore?.toString() ?? "");
  const [editing, setEditing]     = useState(false);

  const saveScore = () => {
    const h = homeInput.trim() === "" ? null : parseInt(homeInput);
    const a = awayInput.trim() === "" ? null : parseInt(awayInput);
    onUpdateScore(f.id, h, a);
    setEditing(false);
  };

  const STATUS_ICONS = {
    scheduled: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
    live:      <Radio className="h-3.5 w-3.5 text-red-400 animate-pulse" />,
    completed: <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />,
  };

  return (
    <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Status toggle */}
        <div className="flex items-center gap-1">
          {(["scheduled", "live", "completed"] as Fixture["status"][]).map((s) => (
            <button
              key={s}
              onClick={() => onSetStatus(f.id, s)}
              title={s}
              className={`rounded-lg p-1.5 transition-colors ${
                f.status === s ? "bg-white/10" : "opacity-30 hover:opacity-60"
              }`}
            >
              {STATUS_ICONS[s]}
            </button>
          ))}
        </div>

        {/* Match info */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-white truncate">{f.homeTeam}</span>
          <span className="text-xs text-muted-foreground shrink-0">vs</span>
          <span className="text-sm font-bold text-white truncate">{f.awayTeam}</span>
        </div>

        {/* Score entry / display */}
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={homeInput}
              onChange={(e) => setHomeInput(e.target.value)}
              className="w-12 rounded-lg border border-[#f0b429]/40 bg-[#0a1f0e] px-2 py-1.5 text-center text-sm font-bold text-white"
              placeholder="0"
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="number"
              min="0"
              value={awayInput}
              onChange={(e) => setAwayInput(e.target.value)}
              className="w-12 rounded-lg border border-[#f0b429]/40 bg-[#0a1f0e] px-2 py-1.5 text-center text-sm font-bold text-white"
              placeholder="0"
            />
            <button
              onClick={saveScore}
              className="rounded-lg bg-[#f0b429] px-3 py-1.5 text-xs font-bold text-[#1a3a1a]"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-muted-foreground hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
              f.homeScore !== null
                ? "bg-white/10 text-white hover:bg-white/15"
                : "border border-dashed border-[#f0b429]/20 text-muted-foreground hover:border-[#f0b429]/40 hover:text-[#f0b429]"
            }`}
          >
            {f.homeScore !== null ? `${f.homeScore} – ${f.awayScore}` : "Enter Score"}
          </button>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(f.id)}
          className="rounded-lg p-1.5 text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Date / venue sub-row */}
      <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground/50">
        <span>{f.group}</span>
        <span>·</span>
        <span>{new Date(f.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at {f.time}</span>
        <span>·</span>
        <span>{f.venue}</span>
      </div>
    </div>
  );
}
