"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Brain, Loader2, Flag, Target, Sparkles,
  Upload, X, Film, CheckCircle2, AlertCircle, ChevronRight,
  Shield, Flame, RefreshCw, Video,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const GRS_GREEN = "#1a5c2a";

type SetPieceType = "corner" | "free-kick" | "penalty" | "throw-in";
type TeamContext = "attacking" | "defending";

interface AnalysisResult {
  type: SetPieceType;
  context: TeamContext;
  analysis: string;
  hadVideo: boolean;
  timestamp: string;
}

const SET_PIECE_TYPES: {
  id: SetPieceType;
  label: string;
  icon: React.ElementType;
  desc: string;
  iconBg: string;
  iconColor: string;
}[] = [
  { id: "corner",    label: "Corner Kick", icon: Flag,     desc: "Delivery & box movement",      iconBg: "#dcfce7", iconColor: "#16a34a" },
  { id: "free-kick", label: "Free Kick",   icon: Target,   desc: "Direct, indirect & walls",     iconBg: "#dbeafe", iconColor: "#2563eb" },
  { id: "penalty",   label: "Penalty",     icon: Flame,    desc: "Spot-kick & keeper tactics",   iconBg: "#fee2e2", iconColor: "#dc2626" },
  { id: "throw-in",  label: "Throw-in",    icon: RefreshCw,desc: "Long & short throw patterns",  iconBg: "#fef3c7", iconColor: "#d97706" },
];

const AI_PROMPTS: Record<SetPieceType, Record<TeamContext, string>> = {
  corner: {
    attacking: `Analyse this attacking corner kick and provide tactical coaching feedback. Cover:
1. DELIVERY RECOMMENDATIONS — near post, far post, or penalty spot: which is most effective and why
2. MOVEMENT PATTERNS — runs to make, blocking and screening tactics
3. FIRST BALL THREATS — who attacks the ball and from where
4. SECOND BALL PLAN — midfielder positioning for knockdowns and rebounds
5. DRILL TO PRACTICE — one specific training exercise
Be specific and practical for a grassroots team in Zimbabwe.`,
    defending: `Analyse this defending corner kick and provide tactical coaching feedback. Cover:
1. MARKING SETUP — zonal vs man-marking recommendations
2. NEAR POST PROTECTION — who covers it and how
3. AERIAL THREATS — how to win the first ball
4. CLEARANCE DIRECTION — where to clear and why
5. TRANSITION TRIGGER — how to launch the counter-attack from a clearance
Be specific and practical for a grassroots team in Zimbabwe.`,
  },
  "free-kick": {
    attacking: `Analyse this attacking free kick and provide tactical coaching feedback. Cover:
1. SHOT SELECTION — direct shot vs played in: when to choose each
2. WALL DECOY RUNS — how to use runners to disrupt the wall
3. DELIVERY CURVE — inswinger vs outswinger: which and why
4. SECOND PHASE PLAN — positioning for rebounds and deflections
5. TRAINING DRILL — one exercise to rehearse this routine
Be specific and practical for a grassroots team in Zimbabwe.`,
    defending: `Analyse this defending free kick and provide tactical coaching feedback. Cover:
1. WALL SETUP — how many in the wall, who, and exact positioning
2. KEEPER POSITIONING — where the keeper should stand and why
3. RUNNERS TO TRACK — how to pick up runners from the free kick
4. PRESSING TRIGGER — when to press after the kick
5. RECOVERY SHAPE — how to reset defensive shape quickly
Be specific and practical for a grassroots team in Zimbabwe.`,
  },
  penalty: {
    attacking: `Provide penalty kick coaching guidance covering:
1. SPOT-KICK TECHNIQUE — approach angle, placement vs power, body shape
2. MENTAL PREPARATION — pre-kick routine and staying composed under pressure
3. READING THE KEEPER — when and how to change your mind
4. TARGET SELECTION — top corners vs low: pros and cons
5. PRACTICE ROUTINE — how to train penalties under pressure
Be specific and practical for a grassroots team in Zimbabwe.`,
    defending: `Provide penalty kick defensive coaching guidance covering:
1. KEEPER TACTICS — which way to dive, how to read the taker's body shape
2. PRE-KICK POSITIONING — legal ways to gain an edge
3. REBOUND POSITIONING — where outfield players should stand
4. POST-SAVE MOMENTUM — how to capitalise on a saved penalty
5. TRAINING DRILL — how to practice penalty saves effectively
Be specific and practical for a grassroots team in Zimbabwe.`,
  },
  "throw-in": {
    attacking: `Analyse this attacking throw-in and provide tactical coaching feedback. Cover:
1. SHORT VS LONG THROW — when to use each option
2. MOVEMENT TO RECEIVE — runs to create space for the receiver
3. FLICK-ON PATTERNS — using a target man to redirect play
4. THIRD MAN RUNS — creating overloads with indirect movement
5. TRAINING DRILL — one exercise to rehearse throw-in routines
Be specific and practical for a grassroots team in Zimbabwe.`,
    defending: `Analyse this defending throw-in and provide tactical coaching feedback. Cover:
1. PRESSURE ON THROWER — how close to stand legally
2. MARKING SHAPE — how to prevent easy receipt
3. LONG THROW DANGER — positioning against a player with a long throw
4. WINNING THE SECOND BALL — midfield positioning after the throw-in
5. TRANSITION — how to press and win possession from a throw-in
Be specific and practical for a grassroots team in Zimbabwe.`,
  },
};

// Extract evenly-spaced frames from a video file using HTML5 Canvas.
// Returns array of base64 JPEG strings (no data: prefix).
async function extractFrames(file: File, count = 6): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    const frames: string[] = [];
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 270;
    const ctx = canvas.getContext("2d");
    if (!ctx) { URL.revokeObjectURL(url); resolve([]); return; }

    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) {
        URL.revokeObjectURL(url);
        resolve([]);
        return;
      }
      // Sample evenly across the video, avoiding the very start/end
      const step = duration / (count + 1);
      const timestamps = Array.from({ length: count }, (_, i) => step * (i + 1));
      let idx = 0;

      const seekNext = () => {
        if (idx >= timestamps.length) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }
        video.currentTime = timestamps[idx];
      };

      video.addEventListener("seeked", () => {
        try {
          ctx.drawImage(video, 0, 0, 480, 270);
          const data = canvas.toDataURL("image/jpeg", 0.75).split(",")[1];
          if (data) frames.push(data);
        } catch {
          // Silently skip frames that can't be captured (e.g. cross-origin)
        }
        idx++;
        seekNext();
      });

      seekNext();
    });

    video.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      resolve([]);
    });

    video.load();
  });
}

export default function SetPiecesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [selectedType, setSelectedType] = useState<SetPieceType | null>(null);
  const [teamContext, setTeamContext] = useState<TeamContext>("attacking");
  const [notes, setNotes] = useState("");

  // Video upload state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  // History (last 4 previous results)
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) return;
    if (user.role !== "coach" && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [_hasHydrated, user, router]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) setVideoFile(file);
  }, []);
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideoFile(file);
  };

  async function runAnalysis() {
    if (!selectedType) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let frames: string[] = [];

      if (videoFile) {
        setExtracting(true);
        frames = await extractFrames(videoFile, 6);
        setExtracting(false);
      }

      const prompt = AI_PROMPTS[selectedType][teamContext];

      const res = await fetch("/api/analyse-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames,
          type: selectedType,
          context: teamContext,
          notes: notes.trim(),
          prompt,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || "Analysis failed. Try again.");
      }

      const data = await res.json() as { analysis?: string };
      const analysis = data.analysis || "No feedback returned.";

      const newResult: AnalysisResult = {
        type: selectedType,
        context: teamContext,
        analysis,
        hadVideo: frames.length > 0,
        timestamp: new Date().toLocaleTimeString(),
      };
      setResult(newResult);
      setHistory((h) => [newResult, ...h.slice(0, 3)]);
    } catch (err: unknown) {
      setExtracting(false);
      setError(err instanceof Error ? err.message : "Analysis failed. Check your connection and try again.");
    } finally {
      setLoading(false);
      setExtracting(false);
    }
  }

  const canAnalyse = selectedType !== null && !loading;

  if (!_hasHydrated || !user) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header style={{
        backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
            <Link href="/coach" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 8, backgroundColor: "#f3f4f6",
              color: "#6b7280", textDecoration: "none",
            }}>
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>Set Piece Lab</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                Upload a clip — Gemini AI analyses your set piece execution
              </div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 56px" }}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: Config + Upload ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* 1. Set piece type */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
                1 · Select Set Piece Type
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SET_PIECE_TYPES.map((sp) => {
                  const Icon = sp.icon;
                  const active = selectedType === sp.id;
                  return (
                    <button
                      key={sp.id}
                      onClick={() => setSelectedType(sp.id)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center"
                      style={{
                        borderColor: active ? GRS_GREEN : "#e5e5e5",
                        backgroundColor: active ? "#f0fdf4" : "#fff",
                        boxShadow: active ? `0 0 0 2px ${GRS_GREEN}` : "none",
                      }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: active ? sp.iconBg : "#f3f4f6" }}>
                        <Icon size={16} style={{ color: active ? sp.iconColor : "#9ca3af" }} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-gray-800 leading-tight">{sp.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sp.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Team context */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
                2 · Your Team Context
              </p>
              <div className="flex gap-3">
                {(["attacking", "defending"] as TeamContext[]).map((ctx) => (
                  <button
                    key={ctx}
                    onClick={() => setTeamContext(ctx)}
                    className="flex-1 py-3 rounded-xl border font-bold text-sm transition-all"
                    style={{
                      borderColor: teamContext === ctx ? GRS_GREEN : "#e5e5e5",
                      backgroundColor: teamContext === ctx ? GRS_GREEN : "#f9fafb",
                      color: teamContext === ctx ? "#fff" : "#6b7280",
                    }}
                  >
                    {ctx === "attacking" ? "⚡ Attacking" : "🛡 Defending"}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Video upload */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
                3 · Upload Set Piece Clip
                <span className="ml-2 font-medium text-gray-300 normal-case tracking-normal">
                  — Gemini analyses every frame
                </span>
              </p>

              {!videoFile ? (
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed transition-colors p-8 text-center"
                  style={{
                    borderColor: isDragging ? GRS_GREEN : "#d1d5db",
                    backgroundColor: isDragging ? "#f0fdf4" : "#fafafa",
                  }}
                >
                  <Upload size={28} className="mx-auto mb-3"
                    style={{ color: isDragging ? GRS_GREEN : "#9ca3af" }} />
                  <p className="text-sm font-semibold text-gray-600">
                    Drag & drop a clip, or{" "}
                    <span style={{ color: GRS_GREEN }} className="font-bold">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI — max 500MB</p>
                  <p className="text-[10px] text-gray-300 mt-3">
                    6 frames extracted · sent to Gemini Vision for analysis
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className="flex items-center gap-3 rounded-xl border p-4"
                    style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "#dcfce7" }}>
                      <Film size={18} style={{ color: GRS_GREEN }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{videoFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(videoFile.size / 1024 / 1024).toFixed(1)} MB ·{" "}
                        <span style={{ color: GRS_GREEN }} className="font-semibold">
                          6 frames will be extracted for Gemini
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => setVideoFile(null)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <X size={14} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
                    <Video size={10} />
                    Gemini Vision will analyse player positions, delivery quality, and movement patterns
                  </p>
                </div>
              )}
            </div>

            {/* 4. Notes */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
                4 · Coach Notes (Optional)
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`Describe what to focus on — e.g. "Our near post delivery keeps getting cleared" or "The wall breaks too early on free kicks"`}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-[#1a5c2a] transition-colors"
                style={{ backgroundColor: "#fafafa" }}
              />
            </div>

            {/* Analyse button */}
            <button
              onClick={runAnalysis}
              disabled={!canAnalyse}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all"
              style={{
                backgroundColor: canAnalyse ? GRS_GREEN : "#d1d5db",
                color: canAnalyse ? "#fff" : "#9ca3af",
                cursor: canAnalyse ? "pointer" : "not-allowed",
              }}
            >
              {extracting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Extracting video frames...
                </span>
              ) : loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Gemini is analysing{videoFile ? " your clip" : ""}...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Brain size={16} />
                  {selectedType
                    ? `Analyse ${SET_PIECE_TYPES.find((s) => s.id === selectedType)?.label}${videoFile ? " (with video)" : ""}`
                    : "Select a set piece type first"}
                </span>
              )}
            </button>

            {!selectedType && (
              <p className="text-center text-xs text-gray-400">
                Select a set piece type above to enable analysis
              </p>
            )}
          </div>

          {/* ── RIGHT: Results + History ── */}
          <div className="lg:col-span-2 space-y-4">

            {(loading || extracting) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <Loader2 size={28} className="mx-auto mb-3 animate-spin" style={{ color: GRS_GREEN }} />
                <p className="text-sm font-bold text-gray-600">
                  {extracting ? "Extracting frames from clip..." : "Gemini is analysing your set piece..."}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {extracting ? "Reading key moments from the video" : "This takes a few seconds"}
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-white rounded-2xl border border-red-200 p-4 flex items-start gap-3">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {result && !loading && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: GRS_GREEN }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                    {result.hadVideo ? (
                      <Film size={16} className="text-yellow-300" />
                    ) : (
                      <Sparkles size={16} className="text-yellow-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wide">
                      {SET_PIECE_TYPES.find((s) => s.id === result.type)?.label} · {result.context}
                    </p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {result.hadVideo ? "Gemini Vision · video analysed" : "Gemini · text analysis"} · {result.timestamp}
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {result.analysis}
                  </div>
                  <div
                    className="mt-4 flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2"
                    style={{ backgroundColor: "#f0fdf4", color: GRS_GREEN }}
                  >
                    <CheckCircle2 size={12} />
                    {result.hadVideo
                      ? "Video analysed — share this with your players before training"
                      : "Tactical analysis complete — upload a clip for visual feedback"}
                  </div>
                </div>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <Brain size={32} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
                <p className="text-sm font-semibold text-gray-500">AI feedback will appear here</p>
                <p className="text-xs text-gray-400 mt-1">
                  Select a type, upload a clip, and tap Analyse
                </p>
              </div>
            )}

            {/* Quick reference */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
                Quick Reference
              </p>
              <div className="space-y-2">
                {[
                  { icon: Flag,    label: "Corner",    tip: "Target far post with late-arriving runs" },
                  { icon: Target,  label: "Free Kick", tip: "Vary delivery to beat the wall" },
                  { icon: Flame,   label: "Penalty",   tip: "Pick a spot and commit to it" },
                  { icon: Shield,  label: "Defending", tip: "First man always covers near post" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label}
                      className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                      <Icon size={13} style={{ color: GRS_GREEN }} className="shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-gray-800">{item.label}</p>
                        <p className="text-[11px] text-gray-400">{item.tip}</p>
                      </div>
                      <ChevronRight size={12} className="ml-auto text-gray-300" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* History */}
            {history.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
                  Previous Analyses
                </p>
                <div className="space-y-2">
                  {history.slice(1).map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setResult(h)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#1a5c2a] hover:bg-[#f0fdf4] transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "#f3f4f6" }}>
                        {h.hadVideo
                          ? <Film size={13} style={{ color: GRS_GREEN }} />
                          : <Brain size={13} style={{ color: GRS_GREEN }} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800">
                          {SET_PIECE_TYPES.find((s) => s.id === h.type)?.label} · {h.context}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {h.hadVideo ? "Video" : "Text"} · {h.timestamp}
                        </p>
                      </div>
                      <ChevronRight size={12} className="text-gray-300 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
