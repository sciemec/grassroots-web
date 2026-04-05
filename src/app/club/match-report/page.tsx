"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import {
  Trophy, Share2, ChevronLeft, Loader2,
  CheckCircle2, AlertCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MatchReportResponse {
  id: string;
  home_team: string;
  away_team: string;
  score: string;
  match_date: string;
  ai_headline: string;
  ai_report: string;
  player_of_match: string | null;
  area_label: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AREAS = [
  "Harare", "Bulawayo", "Manicaland", "Masvingo",
  "Mashonaland East", "Mashonaland West", "Mashonaland Central",
  "Matabeleland North", "Matabeleland South", "Midlands",
  "Mutare", "Gweru", "Kwekwe", "Kadoma", "Chinhoyi",
  "Bindura", "Masvingo City", "Zvishavane", "Hwange", "Victoria Falls",
];

const WRITING_PHRASES = [
  "THUTO is writing your match report…",
  "Reading the moments you described…",
  "Finding the story in the numbers…",
  "Giving these players the recognition they deserve…",
  "Almost ready…",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function MatchReportPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // Auth guard
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "coach" && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [hasHydrated, user, router]);

  // ── Form state ─────────────────────────────────────────────────────────────

  const [form, setForm] = useState({
    home_team: "",
    away_team: "",
    score: "",
    match_date: new Date().toISOString().split("T")[0],
    submitted_moments: "",
    player_of_match: "",
    area_label: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Submission state ───────────────────────────────────────────────────────

  type Stage = "form" | "writing" | "result" | "error";
  const [stage, setStage] = useState<Stage>("form");
  const [writingPhrase, setWritingPhrase] = useState(WRITING_PHRASES[0]);
  const [result, setResult] = useState<MatchReportResponse | null>(null);
  const [apiError, setApiError] = useState("");

  // Cycle through writing phrases while loading
  useEffect(() => {
    if (stage !== "writing") return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % WRITING_PHRASES.length;
      setWritingPhrase(WRITING_PHRASES[i]);
    }, 2200);
    return () => clearInterval(interval);
  }, [stage]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.home_team.trim())           e.home_team = "Home team is required.";
    if (!form.away_team.trim())           e.away_team = "Away team is required.";
    if (!form.score.trim())               e.score = "Score is required (e.g. 2-1).";
    if (!form.match_date)                 e.match_date = "Match date is required.";
    if (!form.submitted_moments.trim())   e.submitted_moments = "Please describe at least one key moment.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStage("writing");
    setApiError("");

    try {
      const res = await api.post("/matches/report", {
        home_team:         form.home_team.trim(),
        away_team:         form.away_team.trim(),
        score:             form.score.trim(),
        match_date:        form.match_date,
        submitted_moments: form.submitted_moments.trim(),
        player_of_match:   form.player_of_match.trim() || undefined,
        area_label:        form.area_label || undefined,
      });

      setResult(res.data.data ?? res.data);
      setStage("result");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Something went wrong. Please try again.";
      setApiError(msg);
      setStage("error");
    }
  };

  const handleShare = () => {
    if (!result) return;
    const platformLink = `${window.location.origin}/community`;
    const text = [
      `⚽ *${result.ai_headline}*`,
      "",
      `${result.home_team} ${result.score} ${result.away_team}`,
      result.player_of_match ? `⭐ Player of the Match: ${result.player_of_match}` : "",
      result.area_label ? `📍 ${result.area_label}` : "",
      "",
      `Full report: ${platformLink}`,
      "— GrassRoots Sports 🇿🇼",
    ]
      .filter(Boolean)
      .join("\n");

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener");
  };

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!hasHydrated || !user) return null;
  if (user.role !== "coach" && user.role !== "admin") return null;

  // ── Render: Writing animation ──────────────────────────────────────────────

  if (stage === "writing") {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#f0b429]/20" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#f0b429]/10 text-2xl font-black text-[#f0b429]">
              T
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{writingPhrase}</p>
            <p className="mt-1 text-sm text-white/40">
              This usually takes 10–20 seconds
            </p>
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-white/30" />
        </div>
      </PageShell>
    );
  }

  // ── Render: Result ────────────────────────────────────────────────────────

  if (stage === "result" && result) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Success badge */}
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-semibold">Report published to the community feed</span>
          </div>

          {/* Report card */}
          <div className="rounded-2xl border border-[#f0b429]/20 bg-white/5 p-6 backdrop-blur-sm">
            {/* Meta */}
            <div className="mb-4 flex flex-wrap gap-3 text-xs text-white/50">
              {result.area_label && (
                <span className="rounded-full bg-[#1a5c2a] px-2 py-0.5 font-semibold text-[#f0b429]">
                  {result.area_label}
                </span>
              )}
              <span>{new Date(result.match_date).toLocaleDateString("en-ZW", { dateStyle: "long" })}</span>
            </div>

            {/* Headline */}
            <h1 className="mb-4 text-2xl font-black leading-tight text-white sm:text-3xl">
              {result.ai_headline}
            </h1>

            {/* Score banner */}
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#1a5c2a]/60 px-4 py-3">
              <span className="font-bold text-white">{result.home_team}</span>
              <span className="rounded-lg bg-[#f0b429] px-3 py-1 text-lg font-black text-[#1a3a1a]">
                {result.score}
              </span>
              <span className="font-bold text-white">{result.away_team}</span>
            </div>

            {result.player_of_match && (
              <p className="mb-5 text-sm text-white/70">
                ⭐ <strong className="text-white">Player of the Match:</strong>{" "}
                {result.player_of_match}
              </p>
            )}

            {/* AI report body */}
            <div className="space-y-4 text-sm leading-relaxed text-white/80 sm:text-base">
              {result.ai_report.split("\n\n").filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1ebe5d]"
            >
              <Share2 className="h-4 w-4" />
              Share on WhatsApp
            </button>
            <button
              onClick={() => {
                setStage("form");
                setResult(null);
                setForm({
                  home_team: "", away_team: "", score: "",
                  match_date: new Date().toISOString().split("T")[0],
                  submitted_moments: "", player_of_match: "", area_label: "",
                });
              }}
              className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:border-white/40"
            >
              Submit another report
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Render: Error ─────────────────────────────────────────────────────────

  if (stage === "error") {
    return (
      <PageShell>
        <div className="mx-auto max-w-md space-y-4 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
          <p className="text-lg font-semibold text-white">Report could not be generated</p>
          <p className="text-sm text-white/60">{apiError}</p>
          <button
            onClick={() => setStage("form")}
            className="rounded-xl bg-[#f0b429] px-6 py-2.5 text-sm font-bold text-[#1a3a1a] transition hover:bg-[#f5c542]"
          >
            Try again
          </button>
        </div>
      </PageShell>
    );
  }

  // ── Render: Form ──────────────────────────────────────────────────────────

  return (
    <PageShell>
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#f0b429]">
            THUTO Match Reporter
          </p>
          <h1 className="text-3xl font-black text-white">Submit a Match Report</h1>
          <p className="mt-2 text-sm text-white/60">
            Tell THUTO what happened. It will write the full report and publish it to the community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Teams row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Home Team" error={errors.home_team}>
              <input
                value={form.home_team}
                onChange={(e) => set("home_team", e.target.value)}
                placeholder="e.g. Harare City FC"
                className={inputCls(errors.home_team)}
              />
            </Field>
            <Field label="Away Team" error={errors.away_team}>
              <input
                value={form.away_team}
                onChange={(e) => set("away_team", e.target.value)}
                placeholder="e.g. Highlanders"
                className={inputCls(errors.away_team)}
              />
            </Field>
          </div>

          {/* Score + Date row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Score" error={errors.score}>
              <input
                value={form.score}
                onChange={(e) => set("score", e.target.value)}
                placeholder="e.g. 2-1"
                className={inputCls(errors.score)}
              />
            </Field>
            <Field label="Match Date" error={errors.match_date}>
              <input
                type="date"
                value={form.match_date}
                onChange={(e) => set("match_date", e.target.value)}
                className={inputCls(errors.match_date)}
              />
            </Field>
          </div>

          {/* Key moments */}
          <Field label="What happened? Key moments" error={errors.submitted_moments}>
            <textarea
              value={form.submitted_moments}
              onChange={(e) => set("submitted_moments", e.target.value)}
              placeholder={
                "e.g. Musona opened the scoring in the 12th minute with a brilliant header from a corner. " +
                "Chikwanda equalised just before half time with a free kick from 25 yards. " +
                "The winner came in the 78th minute — a counter-attack finished by Ncube."
              }
              rows={5}
              maxLength={5000}
              className={inputCls(errors.submitted_moments) + " resize-none"}
            />
            <p className="mt-1 text-right text-xs text-white/30">
              {form.submitted_moments.length} / 5000
            </p>
          </Field>

          {/* Player of match + Area row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Player of the Match" hint="Optional">
              <input
                value={form.player_of_match}
                onChange={(e) => set("player_of_match", e.target.value)}
                placeholder="e.g. T. Musona"
                className={inputCls()}
              />
            </Field>
            <Field label="Area" hint="Optional">
              <select
                value={form.area_label}
                onChange={(e) => set("area_label", e.target.value)}
                className={inputCls()}
              >
                <option value="">Select province / city</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </Field>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b429] px-6 py-3 text-sm font-black text-[#1a3a1a] transition hover:bg-[#f5c542] active:scale-[0.98]"
          >
            <Trophy className="h-4 w-4" />
            Generate match report
          </button>
        </form>
      </div>
    </PageShell>
  );
}

// ── Layout wrapper ─────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#0d1f13] text-white">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-[#0d1f13]/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-[#f0b429]">
            Match Reporter
          </span>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10">{children}</div>
    </div>
  );
}

// ── Form helpers ───────────────────────────────────────────────────────────────

function Field({
  label, hint, error, children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-semibold text-white/80">{label}</label>
        {hint && <span className="text-xs text-white/40">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function inputCls(error?: string): string {
  return [
    "w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm text-white",
    "placeholder:text-white/30 outline-none transition",
    error
      ? "border-red-500/50 focus:border-red-400"
      : "border-white/15 focus:border-[#f0b429]/50",
  ].join(" ");
}
