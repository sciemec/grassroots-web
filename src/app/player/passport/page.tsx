"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Download, Loader2, Sparkles, GraduationCap,
  Copy, Check, Plus, Trash2, BookOpen, RefreshCw, Share2,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ─── Local storage keys ───────────────────────────────────────────────────────
const LS_ACADEMIC     = "gs_passport_academic";
const LS_ENDORSEMENTS = "gs_passport_endorsements";
const LS_AI_SUMMARY   = "gs_passport_ai_summary";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  id?: string;
  first_name: string;
  surname: string;
  position: string;
  sport: string;
  province: string;
  age_group: string;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_foot: string | null;
  avatar_url: string | null;
  bio: string | null;
  overall_score: number | null;
  club: string | null;
  school: string | null;
  ai_narrative: string | null;
  school_name?: string | null;
  grade_level?: string | null;
  academic_average?: string | null;
  academic_year?: string | null;
  coach_endorsements?: Endorsement[] | null;
}

interface ShowcaseClip {
  id: string;
  skill_type: string;
  ai_rating: number;
  top_strength: string | null;
  scout_note: string | null;
  view_count: number;
}

interface Academic {
  schoolName: string;
  gradeLevel: string;
  average: string;
  year: string;
}

interface Endorsement {
  coachName: string;
  club: string;
  quote: string;
}

// ─── Rating bar helper ─────────────────────────────────────────────────────────
function RatingBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-700">
        <div
          className="h-full rounded-full bg-[#f0b429] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-bold text-[#f0b429]">
        {value.toFixed(1)}/10
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PassportPage() {
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clips, setClips]     = useState<ShowcaseClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [copied, setCopied]         = useState(false);
  const [saved, setSaved]           = useState(false);

  const [academic, setAcademic] = useState<Academic>({
    schoolName: "", gradeLevel: "", average: "", year: new Date().getFullYear().toString(),
  });
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [aiSummary, setAiSummary] = useState("");

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Hydrate local fields first
    try {
      const a = JSON.parse(localStorage.getItem(LS_ACADEMIC) ?? "{}");
      if (a.schoolName !== undefined) setAcademic(a);
      const e = JSON.parse(localStorage.getItem(LS_ENDORSEMENTS) ?? "[]");
      if (Array.isArray(e)) setEndorsements(e);
      const s = localStorage.getItem(LS_AI_SUMMARY);
      if (s) setAiSummary(s);
    } catch {}

    Promise.all([
      api.get("/profile").catch(() => null),
      api.get("/player/showcase").catch(() => null),
    ]).then(([profRes, clipsRes]) => {
      if (profRes) {
        const p = profRes.data?.profile ?? profRes.data;
        setProfile(p);
        // Prefer backend ai_narrative if local is empty
        if (p?.ai_narrative && !localStorage.getItem(LS_AI_SUMMARY)) {
          setAiSummary(p.ai_narrative);
        }
        // Populate academic from backend if fields exist
        if (p?.school_name && !localStorage.getItem(LS_ACADEMIC)) {
          setAcademic({
            schoolName: p.school_name ?? "",
            gradeLevel: p.grade_level ?? "",
            average:    p.academic_average ?? "",
            year:       p.academic_year ?? new Date().getFullYear().toString(),
          });
        }
        if (p?.coach_endorsements && !localStorage.getItem(LS_ENDORSEMENTS)) {
          setEndorsements(p.coach_endorsements ?? []);
        }
      }
      if (clipsRes) {
        const c = clipsRes.data?.data ?? clipsRes.data ?? [];
        setClips(Array.isArray(c) ? c.slice(0, 6) : []);
      }
    }).finally(() => setLoading(false));
  }, []);

  // ── Save academic + endorsements ───────────────────────────────────────────
  const saveAll = () => {
    localStorage.setItem(LS_ACADEMIC, JSON.stringify(academic));
    localStorage.setItem(LS_ENDORSEMENTS, JSON.stringify(endorsements));
    api.patch("/profile", {
      school_name:          academic.schoolName,
      grade_level:          academic.gradeLevel,
      academic_average:     academic.average,
      academic_year:        academic.year,
      coach_endorsements:   endorsements,
    }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Generate AI summary ────────────────────────────────────────────────────
  const generateSummary = async () => {
    if (!profile) return;
    setGenerating(true);
    try {
      const topRating = clips.length > 0
        ? Math.max(...clips.map((c) => c.ai_rating)).toFixed(1)
        : null;

      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Write a professional 3-sentence talent passport summary for this athlete.
Write in third person. Compelling, specific, concise — this will be read by scouts and scholarship agencies.

Name: ${profile.first_name} ${profile.surname}
Sport: ${profile.sport || "Football"}
Position: ${profile.position || "Not specified"}
Province: ${profile.province || "Zimbabwe"}
Club: ${profile.club || "Not listed"}
Age Group: ${profile.age_group || "Unknown"}
Height: ${profile.height_cm ? profile.height_cm + "cm" : "Not recorded"}
Weight: ${profile.weight_kg ? profile.weight_kg + "kg" : "Not recorded"}
Dominant Foot: ${profile.dominant_foot || "Not recorded"}
${topRating ? `Top Showcase Rating: ${topRating}/10` : ""}
${academic.schoolName ? `School: ${academic.schoolName}` : ""}
${academic.gradeLevel ? `Grade/Form: ${academic.gradeLevel}` : ""}
${academic.average ? `Academic Average: ${academic.average}` : ""}
${clips.length > 0 ? `Showcase clips: ${clips.map((c) => c.skill_type).join(", ")}` : ""}

Output exactly 3 sentences. No bullet points. No headers.`,
          system_prompt: "You are a professional FIFA-certified talent scout writing a player passport summary. Be compelling, specific, and professional.",
        }),
      });
      const data = await res.json();
      const text = (data.response ?? data.answer ?? "").trim();
      setAiSummary(text);
      localStorage.setItem(LS_AI_SUMMARY, text);
      api.patch("/profile", { ai_narrative: text }).catch(() => {});
    } catch {
      setAiSummary("AI summary generation failed. Please check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Copy share link ────────────────────────────────────────────────────────
  const copyLink = () => {
    const id = user?.id ?? "";
    navigator.clipboard.writeText(`${window.location.origin}/passport/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Export PDF ─────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;
      let y = 0;

      // ── Header ──
      doc.setFillColor(26, 92, 42);
      doc.rect(0, 0, W, 46, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(245, 200, 66);
      doc.text("GRASSROOTS SPORT PLATFORM — ZIMBABWE", W / 2, 11, { align: "center" });

      doc.setFontSize(22);
      doc.setTextColor(245, 200, 66);
      doc.text("TALENT PASSPORT", W / 2, 24, { align: "center" });

      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text(
        `${profile?.first_name ?? ""} ${profile?.surname ?? ""}`.trim() || "Player",
        W / 2, 36, { align: "center" }
      );

      doc.setFontSize(8);
      doc.setTextColor(200, 230, 200);
      doc.text(
        [profile?.position, profile?.sport, profile?.province].filter(Boolean).join(" · "),
        W / 2, 43, { align: "center" }
      );

      y = 56;

      // ── Section header helper ──
      const section = (title: string) => {
        doc.setFillColor(230, 168, 23);
        doc.rect(14, y, W - 28, 6.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(26, 60, 26);
        doc.text(title, 17, y + 4.5);
        y += 11;
      };

      const field = (label: string, value: string, colOffset = 0) => {
        if (!value) return;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(label + ":", 17 + colOffset, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);
        doc.text(value, 60 + colOffset, y);
        y += 5.5;
      };

      // ── Identity ──
      section("PLAYER IDENTITY");
      field("Full Name", `${profile?.first_name ?? ""} ${profile?.surname ?? ""}`.trim());
      field("Position", profile?.position ?? "");
      field("Sport", profile?.sport ?? "");
      field("Age Group", profile?.age_group ?? "");
      field("Province", profile?.province ?? "");
      field("Club / Team", profile?.club ?? "");
      y += 2;

      // ── Physical ──
      section("PHYSICAL PROFILE");
      field("Height", profile?.height_cm ? `${profile.height_cm} cm` : "");
      field("Weight", profile?.weight_kg ? `${profile.weight_kg} kg` : "");
      field("Dominant Foot", profile?.dominant_foot ?? "");
      y += 2;

      // ── Academic ──
      if (academic.schoolName || academic.gradeLevel) {
        section("ACADEMIC STANDING");
        field("School", academic.schoolName);
        field("Grade / Form", academic.gradeLevel);
        field("Academic Average", academic.average);
        field("Year", academic.year);
        y += 2;
      }

      // ── AI Summary ──
      if (aiSummary) {
        section("PERFORMANCE SUMMARY");
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        const lines = doc.splitTextToSize(aiSummary, W - 34);
        // Page break if needed
        if (y + lines.length * 5 > 265) {
          doc.addPage();
          y = 20;
        }
        doc.text(lines, 17, y);
        y += lines.length * 5 + 4;
      }

      // ── Coach Endorsements ──
      const validEndorsements = endorsements.filter((e) => e.quote.trim());
      if (validEndorsements.length > 0) {
        if (y + 30 > 265) { doc.addPage(); y = 20; }
        section("COACH ENDORSEMENTS");
        validEndorsements.forEach((e) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(26, 92, 42);
          doc.text(`${e.coachName}${e.club ? ` — ${e.club}` : ""}`, 17, y);
          y += 5;
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(60, 60, 60);
          const qLines = doc.splitTextToSize(`"${e.quote}"`, W - 34);
          doc.text(qLines, 21, y);
          y += qLines.length * 4.5 + 4;
        });
      }

      // ── Showcase clips ──
      if (clips.length > 0) {
        if (y + 30 > 265) { doc.addPage(); y = 20; }
        section("VIDEO HIGHLIGHTS");
        clips.forEach((c) => {
          const filled   = Math.round(c.ai_rating);
          const ratingStr = "●".repeat(filled) + "○".repeat(Math.max(0, 10 - filled));
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(26, 92, 42);
          doc.text(
            `${c.skill_type.toUpperCase().replace(/_/g, " ")}   ${c.ai_rating.toFixed(1)}/10   ${ratingStr}`,
            17, y
          );
          y += 5;
          if (c.top_strength) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(7.5);
            doc.setTextColor(80, 80, 80);
            doc.text(`  ${c.top_strength}`, 21, y);
            y += 4.5;
          }
        });
        y += 2;
      }

      // ── Footer ──
      const shareUrl = `${window.location.origin}/passport/${user?.id ?? ""}`;
      doc.setFillColor(26, 92, 42);
      doc.rect(0, 280, W, 17, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(200, 240, 200);
      doc.text(shareUrl, W / 2, 286, { align: "center" });
      doc.setTextColor(245, 200, 66);
      doc.text(
        "Confidential — Grassroots Sport Platform — grassrootssports.live",
        W / 2, 292, { align: "center" }
      );

      const fname = `${profile?.first_name ?? "player"}-${profile?.surname ?? "passport"}`
        .toLowerCase().replace(/\s+/g, "-");
      doc.save(`${fname}-talent-passport.pdf`);
    } catch {
      // silent fail — PDF export
    } finally {
      setExporting(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-950">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#f0b429]" />
        </main>
      </div>
    );
  }

  const shareUrl = `/passport/${user?.id ?? ""}`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 overflow-auto text-white">

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Link href="/player" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-white">My Talent Passport</h1>
              <p className="text-xs text-zinc-400">Export PDF · Share with scouts &amp; scholarship agencies</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Share Link"}
            </button>
            <button
              onClick={exportPDF}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg bg-[#f0b429] px-4 py-2 text-xs font-bold text-[#1a3a1a] hover:bg-[#f5c542] disabled:opacity-50 transition-colors"
            >
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Export PDF
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-2xl space-y-6 px-6 py-6">

          {/* ── Identity preview card ── */}
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-[#1a3d26] to-[#0d2b1a]">
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-[#f0b429]/30 bg-[#f0b429]/10 text-2xl font-black text-[#f0b429]">
                {profile?.first_name?.[0] ?? "?"}{profile?.surname?.[0] ?? ""}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#f0b429]/70">Talent Passport</p>
                <h2 className="text-lg font-black text-white">
                  {profile?.first_name ?? "—"} {profile?.surname ?? ""}
                </h2>
                <p className="text-sm text-zinc-300">
                  {[profile?.position, profile?.sport, profile?.age_group?.toUpperCase()].filter(Boolean).join(" · ")}
                </p>
                <p className="text-xs text-zinc-500">{profile?.province ?? ""}{profile?.club ? ` · ${profile.club}` : ""}</p>
              </div>
              {(profile?.overall_score ?? 0) > 0 && (
                <div className="flex-shrink-0 text-center">
                  <p className="text-2xl font-black text-[#f0b429]">{profile?.overall_score}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Rating</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 divide-x divide-zinc-800 border-t border-zinc-800 text-center text-xs">
              <div className="py-2.5">
                <p className="font-bold text-white">{profile?.height_cm ? `${profile.height_cm}cm` : "—"}</p>
                <p className="text-zinc-500">Height</p>
              </div>
              <div className="py-2.5">
                <p className="font-bold text-white">{profile?.weight_kg ? `${profile.weight_kg}kg` : "—"}</p>
                <p className="text-zinc-500">Weight</p>
              </div>
              <div className="py-2.5">
                <p className="font-bold text-white capitalize">{profile?.dominant_foot ?? "—"}</p>
                <p className="text-zinc-500">Foot</p>
              </div>
            </div>
          </div>

          {/* ── Share link banner ── */}
          <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3">
            <Copy className="h-4 w-4 flex-shrink-0 text-zinc-500" />
            <p className="flex-1 truncate text-xs text-zinc-400 font-mono">
              grassrootssports.live{shareUrl}
            </p>
            <button
              onClick={copyLink}
              className="flex-shrink-0 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-600 transition-colors"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>

          {/* ── Academic standing ── */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                <GraduationCap className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Academic Standing</h3>
                <p className="text-xs text-zinc-400">Scholarship agencies need this — fill it in</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">School Name</label>
                <input
                  type="text"
                  value={academic.schoolName}
                  onChange={(e) => setAcademic((a) => ({ ...a, schoolName: e.target.value }))}
                  placeholder="e.g. Harare High School"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#f0b429]/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Grade / Form</label>
                <input
                  type="text"
                  value={academic.gradeLevel}
                  onChange={(e) => setAcademic((a) => ({ ...a, gradeLevel: e.target.value }))}
                  placeholder="e.g. Form 4 / Grade 11"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#f0b429]/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Academic Average</label>
                <input
                  type="text"
                  value={academic.average}
                  onChange={(e) => setAcademic((a) => ({ ...a, average: e.target.value }))}
                  placeholder="e.g. 78%  /  B+  /  3.4 GPA"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#f0b429]/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Academic Year</label>
                <input
                  type="text"
                  value={academic.year}
                  onChange={(e) => setAcademic((a) => ({ ...a, year: e.target.value }))}
                  placeholder="e.g. 2026"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#f0b429]/60"
                />
              </div>
            </div>
          </div>

          {/* ── AI Performance Summary ── */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Performance Summary</h3>
                  <p className="text-xs text-zinc-400">Generated by THUTO — reads to scouts like a professional report</p>
                </div>
              </div>
              <button
                onClick={generateSummary}
                disabled={generating}
                className="flex items-center gap-1.5 rounded-lg bg-purple-600/30 border border-purple-500/40 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-600/50 disabled:opacity-50 transition-colors"
              >
                {generating
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <RefreshCw className="h-3.5 w-3.5" />}
                {generating ? "Generating…" : aiSummary ? "Regenerate" : "Generate"}
              </button>
            </div>
            {aiSummary ? (
              <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 px-4 py-3">
                <p className="text-sm leading-relaxed text-zinc-200 italic">{aiSummary}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-700 px-4 py-6 text-center">
                <Sparkles className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
                <p className="text-sm text-zinc-500">Click "Generate" — THUTO will write a professional 3-sentence summary</p>
                <p className="mt-1 text-xs text-zinc-600">Fill in the academic section above first for the best results</p>
              </div>
            )}
          </div>

          {/* ── Coach Endorsements ── */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Coach Endorsements</h3>
                  <p className="text-xs text-zinc-400">Add up to 3 — ask your coach to give you a quote</p>
                </div>
              </div>
              {endorsements.length < 3 && (
                <button
                  onClick={() =>
                    setEndorsements((e) => [...e, { coachName: "", club: "", quote: "" }])
                  }
                  className="flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              )}
            </div>

            {endorsements.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-700 px-4 py-6 text-center">
                <p className="text-sm text-zinc-500">No endorsements yet</p>
                <p className="mt-1 text-xs text-zinc-600">Coach quotes make your passport far more credible to scouts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {endorsements.map((e, i) => (
                  <div key={i} className="rounded-xl border border-zinc-700 bg-zinc-800 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={e.coachName}
                        onChange={(ev) =>
                          setEndorsements((arr) =>
                            arr.map((item, j) => j === i ? { ...item, coachName: ev.target.value } : item)
                          )
                        }
                        placeholder="Coach name"
                        className="flex-1 rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#f0b429]/60"
                      />
                      <input
                        type="text"
                        value={e.club}
                        onChange={(ev) =>
                          setEndorsements((arr) =>
                            arr.map((item, j) => j === i ? { ...item, club: ev.target.value } : item)
                          )
                        }
                        placeholder="Club / School"
                        className="flex-1 rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#f0b429]/60"
                      />
                      <button
                        onClick={() => setEndorsements((arr) => arr.filter((_, j) => j !== i))}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      value={e.quote}
                      onChange={(ev) =>
                        setEndorsements((arr) =>
                          arr.map((item, j) => j === i ? { ...item, quote: ev.target.value } : item)
                        )
                      }
                      placeholder="Coach's words about this player (e.g. 'One of the most technically gifted midfielders I've coached in 15 years.')"
                      rows={2}
                      className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#f0b429]/60 resize-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Video Highlights (from showcase) ── */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0b429]/20">
                  <span className="text-sm">🎬</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Video Highlights</h3>
                  <p className="text-xs text-zinc-400">From your showcase — {clips.length} clip{clips.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <Link
                href="/player/showcase"
                className="text-xs text-[#f0b429] hover:underline"
              >
                Add clips →
              </Link>
            </div>

            {clips.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-700 px-4 py-6 text-center">
                <p className="text-sm text-zinc-500">No showcase clips yet</p>
                <Link
                  href="/player/showcase"
                  className="mt-2 inline-block text-xs text-[#f0b429] hover:underline"
                >
                  Upload your first clip →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {clips.map((c) => (
                  <div key={c.id} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wide text-[#f0b429]">
                        {c.skill_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-zinc-500">{c.view_count} views</span>
                    </div>
                    <RatingBar value={c.ai_rating} />
                    {c.top_strength && (
                      <p className="mt-1.5 text-xs italic text-zinc-400">{c.top_strength}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Save + Action bar ── */}
          <div className="flex gap-3 pb-8">
            <button
              onClick={saveAll}
              className="flex-1 rounded-xl border border-emerald-500/40 bg-emerald-900/30 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-900/50 transition-colors"
            >
              {saved ? "✓ Saved!" : "Save Passport"}
            </button>
            <button
              onClick={exportPDF}
              disabled={exporting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-bold text-[#1a3a1a] hover:bg-[#f5c542] disabled:opacity-50 transition-colors"
            >
              {exporting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
              {exporting ? "Exporting…" : "Export PDF"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
