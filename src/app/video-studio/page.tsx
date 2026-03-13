"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Play, CheckCircle2, AlertTriangle, Dumbbell,
  Download, Share2, Loader2, X, ChevronRight, Film,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { SPORTS, ANALYSIS_TYPES, type SportKey, type AnalysisType } from "@/config/sports";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  strengths: string[];
  improvements: string[];
  drills: string[];
  encouragement: string;
  raw?: string;
}

type UploadStage = "idle" | "uploading" | "analysing" | "done" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/avi", "video/x-matroska", "video/webm"];
const MAX_SIZE_MB = 500;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseAIResponse(raw: string): AnalysisResult {
  // Parse structured Claude response into sections
  const strengthsMatch = raw.match(/STRENGTHS[:\s\n]+([\s\S]*?)(?=AREAS TO IMPROVE|$)/i);
  const improvementsMatch = raw.match(/AREAS TO IMPROVE[:\s\n]+([\s\S]*?)(?=DRILL RECOMMENDATIONS|$)/i);
  const drillsMatch = raw.match(/DRILL RECOMMENDATIONS[:\s\n]+([\s\S]*?)(?=\n\n[^-•\d]|$)/i);

  const extractBullets = (block: string | undefined): string[] => {
    if (!block) return [];
    return block
      .split(/\n/)
      .map((l) => l.replace(/^[-•\d.)\s]+/, "").trim())
      .filter((l) => l.length > 10);
  };

  const lastLine = raw.trim().split("\n").pop() ?? "";

  return {
    strengths: extractBullets(strengthsMatch?.[1]),
    improvements: extractBullets(improvementsMatch?.[1]),
    drills: extractBullets(drillsMatch?.[1]),
    encouragement: lastLine.length > 10 ? lastLine : "Keep working hard — improvement is coming!",
    raw,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
      done ? "bg-green-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
    }`}>
      {done ? <CheckCircle2 className="h-4 w-4" /> : n}
    </div>
  );
}

function ResultSection({
  icon, title, items, color,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function VideoStudioPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [sport, setSport] = useState<SportKey | "">("");
  const [analysisType, setAnalysisType] = useState<AnalysisType | "">("");
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
  }, [user, router]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ── File handling ──────────────────────────────────────────────────────────

  const acceptFile = (f: File) => {
    if (!VIDEO_TYPES.includes(f.type)) {
      setErrorMsg("Unsupported file type. Please upload MP4, MOV, AVI, MKV or WebM.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setErrorMsg("");
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setStage("idle");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setStage("idle");
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Analysis ───────────────────────────────────────────────────────────────

  const canAnalyse = !!sport && !!analysisType && !!file && stage !== "uploading" && stage !== "analysing";

  const analyse = async () => {
    if (!canAnalyse) return;
    setStage("uploading");
    setProgress(0);
    setErrorMsg("");
    setSaved(false);

    try {
      const formData = new FormData();
      formData.append("video", file!);
      formData.append("sport", sport);
      formData.append("analysis_type", analysisType);
      if (question.trim()) formData.append("question", question.trim());

      // Simulate upload progress (real progress via XHR if needed)
      const ticker = setInterval(() => {
        setProgress((p) => Math.min(p + 8, 85));
      }, 300);

      const res = await api.post("/video-analysis", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(ticker);
      setProgress(100);
      setStage("analysing");

      // Brief pause to show "Analysing…" state
      await new Promise((r) => setTimeout(r, 800));

      const raw: string = res.data?.feedback ?? res.data?.response ?? res.data?.ai_feedback ?? "";
      setResult(parseAIResponse(raw));
      setStage("done");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg ?? "Analysis failed. Please check your connection and try again.");
      setStage("error");
      setProgress(0);
    }
  };

  const saveAnalysis = async () => {
    if (!result || saved) return;
    try {
      await api.post("/video-analysis/save", {
        sport,
        analysis_type: analysisType,
        question,
        ai_feedback: result,
      });
      setSaved(true);
    } catch {
      // non-blocking — don't surface save errors
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const sportLabel = SPORTS.find((s) => s.key === sport)?.label ?? sport;
    const analysisLabel = ANALYSIS_TYPES.find((a) => a.value === analysisType)?.label ?? analysisType;
    const lines = [
      `GrassRoots Sports — AI Video Analysis Report`,
      `Sport: ${sportLabel}  |  Type: ${analysisLabel}`,
      `Date: ${new Date().toLocaleDateString("en-ZW", { day: "numeric", month: "long", year: "numeric" })}`,
      ``,
      `💪 STRENGTHS`,
      ...result.strengths.map((s) => `  • ${s}`),
      ``,
      `🔧 AREAS TO IMPROVE`,
      ...result.improvements.map((s) => `  • ${s}`),
      ``,
      `🏋️ DRILL RECOMMENDATIONS`,
      ...result.drills.map((s) => `  • ${s}`),
      ``,
      result.encouragement,
      ``,
      `grassrootssports.live`,
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grassroots-analysis-${sport}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return null;

  const selectedSport = SPORTS.find((s) => s.key === sport);
  const step1Done = !!sport;
  const step2Done = !!analysisType;
  const step3Done = !!file;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b bg-card px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Film className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Video Studio</h1>
              <p className="text-sm text-muted-foreground">
                Upload any match or training video — get professional AI coaching feedback instantly
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl space-y-6 p-6">

          {/* ── Step 1: Sport ── */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <StepBadge n={1} active={!step1Done} done={step1Done} />
              <h2 className="font-semibold">Select your sport</h2>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
              {SPORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSport(s.key)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all active:scale-95 ${
                    sport === s.key
                      ? "border-primary bg-primary/5 text-primary"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-xs font-medium leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Step 2: Analysis type ── */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <StepBadge n={2} active={step1Done && !step2Done} done={step2Done} />
              <h2 className="font-semibold">What do you want analysed?</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ANALYSIS_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setAnalysisType(t.value)}
                  className={`rounded-xl border p-4 text-left transition-all active:scale-95 ${
                    analysisType === t.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                >
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </div>

            {/* Optional question */}
            <div className="mt-3">
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Optional: what should AI focus on?
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder={`e.g. "Why do I keep losing the ball in midfield?"`}
                className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* ── Step 3: Upload ── */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <StepBadge n={3} active={step2Done && !step3Done} done={step3Done} />
              <h2 className="font-semibold">Upload your video</h2>
            </div>

            {!file ? (
              <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-muted hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/avi,video/x-matroska,video/webm"
                  onChange={handleFileInput}
                  className="sr-only"
                />
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Drag & drop or tap to upload</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    MP4, MOV, AVI, MKV, WebM · Max {MAX_SIZE_MB} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Play className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  {stage === "idle" || stage === "error" ? (
                    <button
                      onClick={clearFile}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                {/* Progress bar */}
                {(stage === "uploading" || stage === "analysing") && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>{stage === "uploading" ? "Uploading…" : "Analysing with AI…"}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMsg}
              </div>
            )}
          </div>

          {/* ── Analyse button ── */}
          {stage !== "done" && (
            <button
              onClick={analyse}
              disabled={!canAnalyse}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors active:scale-[0.99]"
            >
              {stage === "uploading" ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Uploading…</>
              ) : stage === "analysing" ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Analysing with AI…</>
              ) : (
                <>
                  {selectedSport && <span className="text-lg">{selectedSport.emoji}</span>}
                  Analyse with AI
                </>
              )}
            </button>
          )}

          {/* ── Results ── */}
          {stage === "done" && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">
                  {selectedSport?.emoji} AI Analysis — {selectedSport?.label}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={saveAnalysis}
                    disabled={saved}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                      saved ? "border-green-500/30 bg-green-500/10 text-green-700" : "hover:bg-muted"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {saved ? "Saved" : "Save"}
                  </button>
                  <button
                    onClick={downloadReport}
                    className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                  <button
                    onClick={() => {
                      navigator.share?.({
                        title: "GrassRoots AI Analysis",
                        text: result.raw ?? "",
                        url: window.location.href,
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>
              </div>

              <ResultSection
                icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                title="💪 Strengths"
                items={result.strengths}
                color="border-green-500/30 bg-green-500/5"
              />
              <ResultSection
                icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
                title="🔧 Areas to Improve"
                items={result.improvements}
                color="border-amber-500/30 bg-amber-500/5"
              />
              <ResultSection
                icon={<Dumbbell className="h-5 w-5 text-blue-600" />}
                title="🏋️ Drill Recommendations"
                items={result.drills}
                color="border-blue-500/30 bg-blue-500/5"
              />

              {result.encouragement && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-center text-sm font-medium text-primary">
                  {result.encouragement}
                </div>
              )}

              {/* Analyse another */}
              <button
                onClick={() => { clearFile(); setStage("idle"); setSport(""); setAnalysisType(""); setQuestion(""); setResult(null); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors"
              >
                Analyse another video
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
