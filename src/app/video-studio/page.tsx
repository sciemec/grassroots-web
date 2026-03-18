"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Play, CheckCircle2, Loader2, X, Film,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { extractApiError } from "@/lib/api-error";
import { SPORTS, ANALYSIS_TYPES, getSportAnalysisPrompt, type SportKey, type AnalysisType } from "@/config/sports";
import { useFileSystem } from "@/hooks/use-file-system";
import { extractFrames, trimVideo } from "@/lib/ffmpeg-processor";
import { PlayerTracker } from "@/components/video/player-tracker";
import { PoseCamera } from "@/components/video/pose-camera";
import { ResultsPanel, type AnalysisResult } from "./results-panel";
import { searchOffline } from "@/lib/offline-ai";

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadStage = "idle" | "processing" | "analysing" | "done" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/avi", "video/x-matroska", "video/webm"];
const MAX_SIZE_MB = 500;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseAIResponse(raw: string): AnalysisResult {
  const strengthsMatch    = raw.match(/STRENGTHS[:\s\n]+([\s\S]*?)(?=AREAS TO IMPROVE|$)/i);
  const improvementsMatch = raw.match(/AREAS TO IMPROVE[:\s\n]+([\s\S]*?)(?=DRILL RECOMMENDATIONS|$)/i);
  const drillsMatch       = raw.match(/DRILL RECOMMENDATIONS[:\s\n]+([\s\S]*?)(?=\n\n[^-•\d]|$)/i);

  const extractBullets = (block: string | undefined): string[] => {
    if (!block) return [];
    return block.split(/\n/).map((l) => l.replace(/^[-•\d.)\s]+/, "").trim()).filter((l) => l.length > 10);
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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${done ? "bg-green-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
      {done ? <CheckCircle2 className="h-4 w-4" /> : n}
    </div>
  );
}

function ProcessingProgress({ status, progress }: { status: string; progress: number }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />{status}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function VideoStudioPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isSupported: fsPick, pickVideoFile } = useFileSystem();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [sport, setSport] = useState<SportKey | "">("");
  const [analysisType, setAnalysisType] = useState<AnalysisType | "">("");
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [frames, setFrames] = useState<string[]>([]);

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);
  useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

  const acceptFile = (f: File) => {
    if (!VIDEO_TYPES.includes(f.type)) { setErrorMsg("Unsupported file type. Please upload MP4, MOV, AVI, MKV or WebM."); return; }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) { setErrorMsg(`File too large. Max ${MAX_SIZE_MB} MB.`); return; }
    setErrorMsg(""); setFile(f); setPreviewUrl(URL.createObjectURL(f)); setResult(null); setStage("idle"); setFrames([]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) acceptFile(f); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) acceptFile(f); };
  const handleFsPick = async () => { const f = await pickVideoFile(); if (f) acceptFile(f); };

  const clearFile = () => {
    setFile(null); setPreviewUrl(null); setResult(null); setStage("idle");
    setErrorMsg(""); setFrames([]); if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const reset = () => { clearFile(); setSport(""); setAnalysisType(""); setQuestion(""); setResult(null); };

  const downloadHighlight = async () => {
    if (!file) return;
    try {
      const clip = await trimVideo(file, 0, 30);
      const url = URL.createObjectURL(clip);
      const a = document.createElement("a"); a.href = url; a.download = `highlight-${Date.now()}.mp4`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Highlight download failed — FFmpeg may not be available in this browser.");
    }
  };

  const analyse = async () => {
    if (!sport || !analysisType || !file) return;
    setStage("processing"); setProgress(0); setErrorMsg("");

    try {
      setStatusMsg("Extracting frames…"); setProgress(10);
      let extractedFrames: Blob[] = [];
      try { extractedFrames = await extractFrames(file, 8); } catch { /* FFmpeg unavailable — continue without frames */ }

      const frameUrls = await Promise.all(extractedFrames.map((b) => blobToDataUrl(b)));
      setFrames(frameUrls); setProgress(50);

      setStatusMsg("Analysing with AI…"); setStage("analysing");
      const sanitize = (s: string) => s.replace(/[<>"'`\\]/g, "").slice(0, 300);
      const context = `Video: "${sanitize(file.name)}" (${formatBytes(file.size)}). ${frameUrls.length} frames extracted. Analysis: ${analysisType}. ${question.trim() ? `Question: ${sanitize(question.trim())}` : ""}`;
      const prompt = getSportAnalysisPrompt(sport, context);

      // Step 1 — Laravel backend
      let raw = "";
      try {
        const res = await api.post("/ask", { question: prompt, role: user?.role ?? "player", language: "english" });
        raw = res.data?.answer ?? res.data?.response ?? res.data?.message ?? "";
      } catch { /* fall through */ }

      // Step 2 — Claude proxy
      if (!raw) {
        try {
          const res = await fetch("/api/ai-coach", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: prompt }),
          });
          if (res.ok) {
            const data = await res.json();
            raw = data.response ?? data.reply ?? "";
          }
        } catch { /* fall through */ }
      }

      // Step 3 — Offline knowledge base
      if (!raw) {
        const offline = await searchOffline(prompt);
        if (offline) raw = `${offline.text}\n\n_📚 Offline: ${offline.source}_`;
      }

      if (!raw) throw new Error("No AI response available. Please check your connection.");

      setProgress(100); setStatusMsg("Done");
      setResult(parseAIResponse(raw));
      setStage("done");
    } catch (e: unknown) {
      setErrorMsg(extractApiError(e, "Analysis failed. Check your connection and try again."));
      setStage("error"); setProgress(0);
    }
  };

  if (!user) return null;

  const selectedSport = SPORTS.find((s) => s.key === sport);
  const step1Done = !!sport; const step2Done = !!analysisType; const step3Done = !!file;
  const canAnalyse = step1Done && step2Done && step3Done && stage !== "processing" && stage !== "analysing";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="border-b bg-card px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Film className="h-5 w-5 text-primary" /></div>
            <div>
              <h1 className="text-xl font-bold">AI Video Studio</h1>
              <p className="text-sm text-muted-foreground">Upload a match or training video — get professional AI coaching feedback</p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {/* Step 1: Sport */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-3"><StepBadge n={1} active={!step1Done} done={step1Done} /><h2 className="font-semibold">Select your sport</h2></div>
            <div className="grid grid-cols-5 gap-2">
              {SPORTS.map((s) => (
                <button key={s.key} onClick={() => setSport(s.key)} className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all active:scale-95 ${sport === s.key ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted text-muted-foreground"}`}>
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-xs font-medium leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Analysis type */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-3"><StepBadge n={2} active={step1Done && !step2Done} done={step2Done} /><h2 className="font-semibold">What do you want analysed?</h2></div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ANALYSIS_TYPES.map((t) => (
                <button key={t.value} onClick={() => setAnalysisType(t.value)} className={`rounded-xl border p-4 text-left transition-all active:scale-95 ${analysisType === t.value ? "border-primary bg-primary/5" : "hover:bg-muted"}`}>
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Optional: what should AI focus on?</label>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} maxLength={300} placeholder={`e.g. "Why do I keep losing the ball in midfield?"`} className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
            </div>
          </div>

          {/* Step 3: Upload */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3"><StepBadge n={3} active={step2Done && !step3Done} done={step3Done} /><h2 className="font-semibold">Upload your video</h2></div>
              {fsPick && !file && <button onClick={handleFsPick} className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">Browse files</button>}
            </div>

            {!file ? (
              <div ref={dropRef} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-muted hover:border-primary/40 hover:bg-muted/40"}`}>
                <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/avi,video/x-matroska,video/webm" onChange={handleFileInput} className="sr-only" />
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"><Upload className="h-6 w-6 text-primary" /></div>
                <div><p className="font-semibold">Drag & drop or tap to upload</p><p className="mt-1 text-sm text-muted-foreground">MP4, MOV, AVI, MKV, WebM · Max {MAX_SIZE_MB} MB</p></div>
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10"><Play className="h-5 w-5 text-primary" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p></div>
                  {(stage === "idle" || stage === "error") && <button onClick={clearFile} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>}
                </div>
              </div>
            )}

            {/* Frame strip */}
            {frames.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <div className="flex gap-2 pb-1">
                  {frames.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt={`Frame ${i + 1}`} className="h-16 w-auto flex-shrink-0 rounded-lg border object-cover" />
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{frames.length} frames extracted</p>
              </div>
            )}

            {errorMsg && <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorMsg}</div>}
          </div>

          {/* Processing progress */}
          {(stage === "processing" || stage === "analysing") && <ProcessingProgress status={statusMsg} progress={progress} />}

          {/* Analyse button */}
          {stage !== "done" && (
            <button onClick={analyse} disabled={!canAnalyse}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors active:scale-[0.99]">
              {stage === "processing" || stage === "analysing" ? (
                <><Loader2 className="h-5 w-5 animate-spin" />{statusMsg}</>
              ) : (
                <>{selectedSport && <span className="text-lg">{selectedSport.emoji}</span>} Analyse with AI</>
              )}
            </button>
          )}

          {/* AI trackers — player detection + live pose analysis */}
          {file && (
            <div className="space-y-4">
              <PlayerTracker videoFile={file} />
              <PoseCamera focusArea={analysisType || undefined} />
            </div>
          )}

          {/* Results */}
          {stage === "done" && result && (
            <ResultsPanel
              result={result}
              sport={sport}
              analysisType={analysisType}
              onReset={reset}
              onDownloadHighlight={downloadHighlight}
            />
          )}
        </div>
      </main>
    </div>
  );
}
