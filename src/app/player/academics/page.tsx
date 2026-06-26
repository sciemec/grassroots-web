"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, GraduationCap, Plus, Trash2,
  TrendingUp, Star, ChevronDown, ChevronUp, Award,
  School, CheckCircle2, AlertCircle, Target, FileText,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface TermResult {
  id: string;
  term: string;        // e.g. "Term 1 2024"
  subject: string;
  grade: string;       // e.g. "A", "B+", "75%"
  score: number;       // numeric 0-100
  teacher?: string;
  notes?: string;
}

interface AcademicProfile {
  school_name: string;
  grade_level: string;
  academic_year: string;
  academic_average: string;
  aspiration: string;  // target uni/scholarship
}

// ── Scholarship readiness bands ──────────────────────────────────────────────

const SCORE_BANDS = [
  { min: 85, label: "Scholarship Ready",  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: Award  },
  { min: 70, label: "On Track",           color: "#1a5c2a", bg: "#f0fdf4", border: "#86efac", icon: TrendingUp },
  { min: 55, label: "Keep Pushing",       color: "#b45309", bg: "#fffbeb", border: "#fde68a", icon: Target  },
  { min: 0,  label: "Needs Focus",        color: "#dc2626", bg: "#fff1f2", border: "#fecdd3", icon: AlertCircle },
];

function getBand(avg: number) {
  return SCORE_BANDS.find((b) => avg >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
}

// ── Grade → score helper ─────────────────────────────────────────────────────

function gradeToScore(grade: string): number {
  const letter: Record<string, number> = {
    "A+": 97, A: 93, "A-": 90,
    "B+": 87, B: 83, "B-": 80,
    "C+": 77, C: 73, "C-": 70,
    "D+": 67, D: 63, "D-": 60,
    F: 50,
  };
  const g = grade.trim().toUpperCase();
  if (letter[g] !== undefined) return letter[g];
  const num = parseFloat(g.replace("%", ""));
  return isNaN(num) ? 60 : Math.min(100, num);
}

// ── Subjects list ─────────────────────────────────────────────────────────────

const SUBJECTS = [
  "Mathematics", "English", "Science", "History / Social Studies",
  "Geography", "Biology", "Chemistry", "Physics",
  "Agriculture", "Commerce / Business Studies", "Physical Education",
  "Shona / Ndebele", "Art", "Music", "ICT / Computer Science", "Other",
];

const GRADE_LEVELS = [
  "Grade 4","Grade 5","Grade 6","Grade 7",
  "Form 1","Form 2","Form 3","Form 4","Form 5","Form 6",
  "University Year 1","University Year 2","University Year 3","University Year 4",
];

const ASPIRATIONS = [
  "Full Football Scholarship (USA/UK/Europe)",
  "ZIFA National Academy",
  "Premier Soccer League Club",
  "COSAFA Youth Team",
  "Local University Sports Programme",
  "Zimbabwean Olympian",
  "Professional Athlete + Degree",
  "Other",
];

// ── Empty add form ────────────────────────────────────────────────────────────

const EMPTY_FORM: Omit<TermResult, "id"> = {
  term: "", subject: "", grade: "", score: 0, teacher: "", notes: "",
};

// ─────────────────────────────────────────────────────────────────────────────

export default function AcademicsPage() {
  const router   = useRouter();
  const user     = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  const [profile,  setProfile]  = useState<AcademicProfile>({
    school_name: "", grade_level: "", academic_year: "", academic_average: "", aspiration: "",
  });
  const [results,  setResults]  = useState<TermResult[]>([]);
  const [showAdd,  setShowAdd]  = useState(false);
  const [form,     setForm]     = useState<Omit<TermResult, "id">>(EMPTY_FORM);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editProfile, setEditProfile] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
  }, [hydrated, user, router]);

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated || !user) return;

    // Load from localStorage first
    try {
      const raw = localStorage.getItem("grs_academics");
      if (raw) {
        const saved = JSON.parse(raw) as { profile?: AcademicProfile; results?: TermResult[] };
        if (saved.profile) setProfile(saved.profile);
        if (saved.results) setResults(saved.results);
      }
    } catch { /* ignore */ }

    // Try to hydrate academic profile from backend
    api.get("/profile")
      .then((res) => {
        const p = res.data?.data ?? res.data;
        if (p) {
          setProfile((prev) => ({
            ...prev,
            school_name:     p.school_name      || prev.school_name,
            grade_level:     p.grade_level      || prev.grade_level,
            academic_year:   p.academic_year    || prev.academic_year,
            academic_average:p.academic_average || prev.academic_average,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hydrated, user]);

  // ── Persist to localStorage ──────────────────────────────────────────────────
  function persist(newProfile: AcademicProfile, newResults: TermResult[]) {
    try {
      localStorage.setItem("grs_academics", JSON.stringify({ profile: newProfile, results: newResults }));
    } catch { /* ignore */ }
  }

  // ── Save profile ─────────────────────────────────────────────────────────────
  async function saveProfile() {
    setSaving(true);
    persist(profile, results);
    // Sync to backend (fire-and-forget)
    api.patch("/profile", {
      school_name:      profile.school_name,
      grade_level:      profile.grade_level,
      academic_year:    profile.academic_year,
      academic_average: profile.academic_average,
    }).catch(() => {});
    setSaving(false);
    setEditProfile(false);
  }

  // ── Add term result ──────────────────────────────────────────────────────────
  function addResult() {
    if (!form.subject || !form.grade || !form.term) return;
    const score = gradeToScore(form.grade);
    const entry: TermResult = { ...form, score, id: `${Date.now()}` };
    const next = [entry, ...results];
    setResults(next);
    persist(profile, next);
    setForm(EMPTY_FORM);
    setShowAdd(false);
  }

  // ── Delete term result ───────────────────────────────────────────────────────
  function deleteResult(id: string) {
    const next = results.filter((r) => r.id !== id);
    setResults(next);
    persist(profile, next);
  }

  // ── Computed stats ───────────────────────────────────────────────────────────
  const avg = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;
  const band = getBand(avg);
  const BandIcon = band.icon;

  // Group results by term
  const byTerm = results.reduce<Record<string, TermResult[]>>((acc, r) => {
    (acc[r.term] = acc[r.term] || []).push(r);
    return acc;
  }, {});
  const terms = Object.keys(byTerm).sort((a, b) => b.localeCompare(a));

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f4f2ee" }}>
        <BookOpen className="animate-spin" size={28} style={{ color: "#1a5c2a" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: "#f4f2ee" }}>

      {/* ── Header ── */}
      <div style={{ backgroundColor: "#1a5c2a", borderBottom: "3px solid #f0b429" }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/player"
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft size={16} style={{ color: "#f0b429" }} />
          </Link>
          <div>
            <p className="font-black text-sm uppercase tracking-wider leading-none" style={{ color: "#f0b429" }}>
              Academic Tracker
            </p>
            <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-widest"
              style={{ color: "rgba(240,180,41,0.6)" }}>
              Academics · Athletics · Pathway
            </p>
          </div>
          <GraduationCap size={18} style={{ color: "#f0b429" }} className="ml-auto" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* ── Scholarship Readiness Card ── */}
        {results.length > 0 && (
          <div className="rounded-2xl p-5 border"
            style={{ backgroundColor: band.bg, borderColor: band.border }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1"
                  style={{ color: band.color, opacity: 0.7 }}>Scholarship Readiness</p>
                <div className="flex items-center gap-2">
                  <BandIcon size={18} style={{ color: band.color }} />
                  <p className="text-xl font-black" style={{ color: band.color }}>{band.label}</p>
                </div>
                <p className="text-[11px] font-semibold mt-1" style={{ color: band.color, opacity: 0.75 }}>
                  Based on {results.length} grade entries
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black leading-none" style={{ color: band.color }}>{avg}</p>
                <p className="text-[10px] font-bold mt-0.5 uppercase tracking-wider"
                  style={{ color: band.color, opacity: 0.65 }}>/ 100</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${avg}%`, backgroundColor: band.color }} />
            </div>
            <div className="flex justify-between mt-1">
              {[55, 70, 85, 100].map((mark) => (
                <p key={mark} className="text-[9px] font-bold" style={{ color: band.color, opacity: 0.5 }}>{mark}</p>
              ))}
            </div>
          </div>
        )}

        {/* ── Academic Profile Card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <School size={15} style={{ color: "#1a5c2a" }} />
              <p className="font-black text-sm text-gray-900">My School Profile</p>
            </div>
            <button
              onClick={() => setEditProfile((v) => !v)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: editProfile ? "#f0b429" : "#f0fdf4", color: editProfile ? "#1a5c2a" : "#1a5c2a" }}>
              {editProfile ? "Save →" : "Edit"}
            </button>
          </div>

          {editProfile ? (
            <div className="px-5 py-4 space-y-3">
              {[
                { label: "School Name",   key: "school_name",      placeholder: "e.g. Goromonzi High School" },
                { label: "Academic Year", key: "academic_year",    placeholder: "e.g. 2025" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={profile[key as keyof AcademicProfile]}
                    onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:border-transparent"
                    style={{ "--tw-ring-color": "#1a5c2a" } as React.CSSProperties}
                  />
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Grade / Form Level</label>
                <select
                  value={profile.grade_level}
                  onChange={(e) => setProfile((p) => ({ ...p, grade_level: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none">
                  <option value="">Select level…</option>
                  {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Scholarship / Career Aspiration</label>
                <select
                  value={profile.aspiration}
                  onChange={(e) => setProfile((p) => ({ ...p, aspiration: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none">
                  <option value="">Select aspiration…</option>
                  {ASPIRATIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full py-2.5 rounded-xl text-sm font-black uppercase tracking-wide text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#1a5c2a" }}>
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          ) : (
            <div className="px-5 py-4 grid grid-cols-2 gap-3">
              {[
                { label: "School",      value: profile.school_name   || "—" },
                { label: "Level",       value: profile.grade_level   || "—" },
                { label: "Year",        value: profile.academic_year || "—" },
                { label: "Aspiration",  value: profile.aspiration    || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5 leading-snug">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Add Grade Button / Form ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <Plus size={15} style={{ color: "#1a5c2a" }} />
              <span className="font-black text-sm text-gray-900">Add Grade Entry</span>
            </div>
            {showAdd ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </button>

          {showAdd && (
            <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Term</label>
                  <input
                    type="text"
                    placeholder="e.g. Term 1 2025"
                    value={form.term}
                    onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-1"
                    style={{ "--tw-ring-color": "#1a5c2a" } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Grade / Score</label>
                  <input
                    type="text"
                    placeholder="e.g. A, B+, 78%"
                    value={form.grade}
                    onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-1"
                    style={{ "--tw-ring-color": "#1a5c2a" } as React.CSSProperties}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none">
                  <option value="">Select subject…</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Teacher (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Chikomo"
                  value={form.teacher}
                  onChange={(e) => setForm((f) => ({ ...f, teacher: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Notes (optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Strong in algebra, needs to improve essay writing"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addResult}
                  disabled={!form.subject || !form.grade || !form.term}
                  className="flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-wide text-white transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: "#1a5c2a" }}>
                  Add Grade
                </button>
                <button
                  onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Grade History by Term ── */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
            <FileText size={28} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-gray-600">No grades logged yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first grade entry above to start tracking your academic journey.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {terms.map((term) => {
              const termResults = byTerm[term];
              const termAvg = Math.round(
                termResults.reduce((s, r) => s + r.score, 0) / termResults.length
              );
              const termBand = getBand(termAvg);
              const isOpen = expanded === term;

              return (
                <div key={term} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Term header */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : term)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                        style={{ backgroundColor: termBand.bg, color: termBand.color }}>
                        {termAvg}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm text-gray-900">{term}</p>
                        <p className="text-[11px] text-gray-400">{termResults.length} subject{termResults.length !== 1 ? "s" : ""} · avg {termAvg}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ color: termBand.color, backgroundColor: termBand.bg }}>
                        {termBand.label}
                      </span>
                      {isOpen ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
                    </div>
                  </button>

                  {/* Term subjects */}
                  {isOpen && (
                    <div className="divide-y divide-gray-50 border-t border-gray-100">
                      {termResults.map((r) => {
                        const rb = getBand(r.score);
                        return (
                          <div key={r.id} className="flex items-center justify-between px-5 py-3 group">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                                style={{ backgroundColor: rb.bg, color: rb.color }}>
                                {r.score}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{r.subject}</p>
                                {r.teacher && (
                                  <p className="text-[10px] text-gray-400">{r.teacher}</p>
                                )}
                                {r.notes && (
                                  <p className="text-[10px] text-gray-400 truncate max-w-[180px]">{r.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-black text-sm" style={{ color: rb.color }}>{r.grade}</span>
                              <button
                                onClick={() => deleteResult(r.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-red-400 transition-all">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Scholarship Tips ── */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#92400e" }}>
            Scholarship Tips for Zimbabwean Athletes
          </p>
          <div className="space-y-2.5">
            {[
              { icon: CheckCircle2, tip: "US college scouts look for a minimum GPA of 2.5 — aim for 3.0+" },
              { icon: CheckCircle2, tip: "British universities typically require 5 O-Level passes including English and Maths" },
              { icon: CheckCircle2, tip: "Keep a personal statement about your football journey — scouts love a compelling story" },
              { icon: CheckCircle2, tip: "COSAFA Youth tournaments are watched by European scouts — academics + performance = full scholarship" },
              { icon: CheckCircle2, tip: "ZIFA National Academy accepts U17 players — strong school record improves selection chances" },
            ].map(({ icon: Icon, tip }, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Icon size={13} className="shrink-0 mt-0.5" style={{ color: "#92400e" }} />
                <p className="text-[12px] font-medium leading-snug" style={{ color: "#78350f" }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Back to hub ── */}
        <Link href="/player"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white transition-colors">
          <ArrowLeft size={14} />
          Back to Player Hub
        </Link>
      </div>
    </div>
  );
}
