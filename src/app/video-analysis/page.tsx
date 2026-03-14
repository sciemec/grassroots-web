"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, Film, Play, ChevronLeft, Loader2, CheckCircle2, AlertCircle, Sparkles, Download } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { SPORTS, SportKey } from "@/config/sports";
import { videoAnalysisPrompt } from "@/config/prompts";
import api from "@/lib/api";

const MATCH_TYPES = [
  { value: "league",   label: "League Match" },
  { value: "cup",      label: "Cup Match" },
  { value: "friendly", label: "Friendly" },
  { value: "training", label: "Training Session" },
];

interface AnalysisResult {
  text: string;
  sport: string;
  matchType: string;
  teamName: string;
  generatedAt: string;
}

export default function VideoAnalysisPage() {
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [sport,        setSport]        = useState<SportKey>((user?.sport as SportKey) ?? "football");
  const [matchType,    setMatchType]    = useState("league");
  const [teamName,     setTeamName]     = useState("");
  const [opposition,   setOpposition]   = useState("");
  const [scoreUs,      setScoreUs]      = useState("");
  const [scoreThem,    setScoreThem]    = useState("");
  const [observations, setObservations] = useState("");

  // File state
  const [file,     setFile]     = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Processing state
  const [stage,    setStage]    = useState<"idle" | "processing" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [result,   setResult]   = useState<AnalysisResult | null>(null);
  const [error,    setError]    = useState("");

  if (!user) {
    router.push("/login?next=/video-analysis");
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setResult(null);
    setStage("idle");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f || !f.type.startsWith("video/")) return;
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setResult(null);
    setStage("idle");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleAnalyse = async () => {
    if (!file && !observations.trim()) {
      setError("Please upload a video or add key observations to analyse.");
      return;
    }
    setError("");
    setStage("processing");
    setProgress(0);

    // Simulate frame extraction progress
    const progressSteps = [
      { pct: 15, label: "Extracting key frames…" },
      { pct: 35, label: "Processing video data…" },
      { pct: 60, label: "Running AI analysis…" },
      { pct: 85, label: "Generating insights…" },
    ];

    let stepIdx = 0;
    const ticker = setInterval(() => {
      if (stepIdx < progressSteps.length) {
        setProgress(progressSteps[stepIdx].pct);
        stepIdx++;
      }
    }, 800);

    try {
      const scoreStr = scoreUs && scoreThem ? `${scoreUs}–${scoreThem}` : "";
      const contextText = [
        teamName    ? `Team: ${teamName}`            : "",
        opposition  ? `Opposition: ${opposition}`    : "",
        scoreStr    ? `Score: ${scoreStr}`            : "",
        matchType   ? `Match type: ${matchType}`      : "",
        observations ? `Coach observations: ${observations}` : "",
      ].filter(Boolean).join("\n");

      const systemPrompt = videoAnalysisPrompt({
        sport,
        analysisType: matchType === "training" ? "training" : "match",
        teamOrPlayer: teamName || undefined,
      });

      const { data } = await api.post(
        "/ai-coach/query",
        {
          message: `Analyse this ${matchType} for ${sport}.\n\n${contextText}\n\nProvide a detailed tactical and technical analysis with specific actionable recommendations.`,
          system_prompt: systemPrompt,
          history: [],
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      clearInterval(ticker);
      setProgress(100);

      setResult({
        text:        data.reply ?? data.response ?? data.message ?? "Analysis complete.",
        sport,
        matchType,
        teamName:    teamName || "Your Team",
        generatedAt: new Date().toLocaleString("en-ZW"),
      });
      setStage("done");
    } catch (err: unknown) {
      clearInterval(ticker);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Analysis failed. Please check your connection and try again.");
      setStage("error");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const text = [
      `MATCH ANALYSIS REPORT`,
      `Generated: ${result.generatedAt}`,
      `Sport: ${result.sport} | Match Type: ${result.matchType}`,
      `Team: ${result.teamName}`,
      ``,
      result.text,
      ``,
      `— Grassroots Sport AI Analysis Studio`,
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `match-analysis-${result.sport}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href={user.role === "coach" ? "/coach" : "/player"} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Video Analysis Studio</h1>
              <p className="text-sm text-muted-foreground">Upload match footage and get AI-powered tactical insights</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">

          {/* Left column — upload + form */}
          <div className="lg:col-span-3 space-y-5">

            {/* Sport selector */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold">Sport</h2>
              <div className="grid grid-cols-5 gap-2">
                {SPORTS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSport(s.key)}
                    className={`flex flex-col items-center rounded-xl border py-2.5 text-xs font-medium transition-all ${sport === s.key ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"}`}
                  >
                    <span className="text-lg">{s.emoji}</span>
                    <span className="mt-1 text-[10px] leading-tight text-center">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Video upload */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold">Match Video <span className="text-muted-foreground font-normal">(optional)</span></h2>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-500/5"
              >
                {file ? (
                  <>
                    <Play className="mb-2 h-8 w-8 text-blue-500" />
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatSize(file.size)}</p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Drop video here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">MP4, MOV, AVI — up to 2 GB</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />

              {videoUrl && (
                <video src={videoUrl} controls className="mt-3 w-full rounded-lg" style={{ maxHeight: 200 }} />
              )}
            </div>

            {/* Match context form */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <h2 className="text-sm font-semibold">Match Context</h2>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Match Type</label>
                <select
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-blue-400"
                >
                  {MATCH_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Your Team</label>
                  <input
                    type="text"
                    placeholder="e.g. Dynamos FC"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Opposition</label>
                  <input
                    type="text"
                    placeholder="e.g. CAPS United"
                    value={opposition}
                    onChange={(e) => setOpposition(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Score <span className="opacity-60">(optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={scoreUs}
                    onChange={(e) => setScoreUs(e.target.value)}
                    className="w-16 rounded-lg border border-border bg-background px-3 py-2 text-sm text-center outline-none focus:border-blue-400"
                  />
                  <span className="text-muted-foreground font-semibold">–</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={scoreThem}
                    onChange={(e) => setScoreThem(e.target.value)}
                    className="w-16 rounded-lg border border-border bg-background px-3 py-2 text-sm text-center outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Key Observations <span className="opacity-60">(what you noticed)</span>
                </label>
                <textarea
                  placeholder={`e.g. We struggled to hold our defensive shape in the second half. Their #10 was dangerous in transition. Our striker missed 3 one-on-ones…`}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-500">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyse}
              disabled={stage === "processing"}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {stage === "processing"
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
                : <><Sparkles className="h-4 w-4" /> Analyse Match</>
              }
            </button>
          </div>

          {/* Right column — results */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 rounded-xl border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Analysis Report</h2>

              {stage === "idle" && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Film className="mb-3 h-10 w-10 opacity-30" />
                  <p className="text-sm">Your AI analysis will appear here</p>
                  <p className="text-xs mt-1 opacity-70">Upload a video or describe the match and click Analyse</p>
                </div>
              )}

              {stage === "processing" && (
                <div className="py-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500 flex-shrink-0" />
                    <span className="text-sm">
                      {progress < 35 ? "Extracting key frames…"
                        : progress < 60 ? "Processing video data…"
                        : progress < 85 ? "Running AI analysis…"
                        : "Generating insights…"}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{progress}% complete</p>
                </div>
              )}

              {stage === "error" && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertCircle className="mb-3 h-10 w-10 text-red-500" />
                  <p className="text-sm text-red-500">Analysis failed</p>
                  <p className="text-xs text-muted-foreground mt-1">Check your connection and try again</p>
                </div>
              )}

              {stage === "done" && result && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">{result.generatedAt}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex gap-3">
                    <span className="capitalize font-medium text-foreground">{result.sport}</span>
                    <span>·</span>
                    <span className="capitalize">{result.matchType}</span>
                    {result.teamName !== "Your Team" && (
                      <><span>·</span><span>{result.teamName}</span></>
                    )}
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                    {result.text}
                  </div>
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
