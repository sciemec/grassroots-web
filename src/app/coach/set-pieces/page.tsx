"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Brain, Loader2, Flag, Target, Sparkles,
  Upload, X, Film, CheckCircle2, AlertCircle, ChevronRight,
  Shield, Flame, RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const GRS_GREEN = "#1a5c2a";

type SetPieceType = "corner" | "free-kick" | "penalty" | "throw-in";
type TeamContext = "attacking" | "defending";

interface AnalysisResult {
  type: SetPieceType;
  context: TeamContext;
  feedback: string;
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
  { id: "corner", label: "Corner Kick", icon: Flag, desc: "Delivery & movement in the box", iconBg: "#dcfce7", iconColor: "#16a34a" },
  { id: "free-kick", label: "Free Kick", icon: Target, desc: "Direct, indirect & wall clearance", iconBg: "#dbeafe", iconColor: "#2563eb" },
  { id: "penalty", label: "Penalty", icon: Flame, desc: "Kick & keeper positioning", iconBg: "#fee2e2", iconColor: "#dc2626" },
  { id: "throw-in", label: "Throw-in", icon: RefreshCw, desc: "Long & short throw patterns", iconBg: "#fef3c7", iconColor: "#d97706" },
];

const AI_PROMPTS: Record<SetPieceType, Record<TeamContext, string>> = {
  corner: {
    attacking: `You are an elite football set piece coach. Analyse this attacking corner kick situation and provide tactical coaching feedback. Cover:
1. DELIVERY RECOMMENDATIONS: Near post, far post, or penalty spot delivery — which is most effective and why
2. MOVEMENT PATTERNS: Runs to make, blocking, screening tactics
3. FIRST BALL THREATS: Who attacks the ball and from where
4. SECOND BALL PLAN: Midfielder positioning for knockdowns and rebounds
5. DRILL TO PRACTICE: One specific exercise for the training ground
Be specific, practical, and suitable for a grassroots team in Zimbabwe.`,
    defending: `You are an elite football set piece coach. Analyse this defending corner kick situation and provide tactical coaching feedback. Cover:
1. MARKING SETUP: Zonal vs man-marking recommendations
2. NEAR POST PROTECTION: Who covers it and how
3. AERIAL THREATS: How to win the first ball
4. CLEARANCE DIRECTION: Where to clear and why
5. TRANSITION TRIGGER: How to launch counter-attack from a clearance
Be specific, practical, and suitable for a grassroots team in Zimbabwe.`,
  },
  "free-kick": {
    attacking: `You are an elite football set piece coach. Analyse this attacking free kick situation and provide tactical coaching feedback. Cover:
1. SHOT SELECTION: Direct shot vs played in — when to choose each
2. WALL DECOY RUNS: How to use runners to disrupt the wall
3. DELIVERY CURVE: Inswinger vs outswinger — which and why
4. SECOND PHASE PLAN: Positioning for rebounds and deflections
5. TRAINING DRILL: One exercise to rehearse this routine
Be specific, practical, and suitable for a grassroots team in Zimbabwe.`,
    defending: `You are an elite football set piece coach. Analyse this defending free kick situation and provide tactical coaching feedback. Cover:
1. WALL SETUP: How many in the wall, who, and positioning
2. KEEPER POSITIONING: Where the keeper should stand
3. RUNNERS TO TRACK: How to pick up runners from the free kick
4. PRESSING TRIGGER: When to press after the kick
5. RECOVERY SHAPE: How to reset defensive shape quickly
Be specific, practical, and suitable for a grassroots team in Zimbabwe.`,
  },
  penalty: {
    attacking: `You are an elite football set piece coach. Provide penalty kick coaching guidance covering:
1. SPOT-KICK TECHNIQUE: Approach angle, placement vs power, body shape
2. MENTAL PREPARATION: Pre-kick routine and staying calm under pressure
3. READING THE KEEPER: When and how to change your mind
4. TOP CORNERS VS LOW: Pros and cons of each target
5. PRACTICE ROUTINE: How to train penalties under pressure
Be specific, practical, and suitable for a grassroots team in Zimbabwe.`,
    defending: `You are an elite football set piece coach. Provide penalty kick defensive coaching guidance covering:
1. KEEPER TACTICS: Which way to dive, reading the penalty taker
2. PRE-KICK MIND GAMES: Legal ways to affect the penalty taker
3. REBOUND POSITIONING: Where outfield players should stand
4. POST-SAVE MOMENTUM: How to capitalise on a saved penalty
5. TRAINING DRILL: How to practice penalty saves
Be specific, practical, and suitable for a grassroots team in Zimbabwe.`,
  },
  "throw-in": {
    attacking: `You are an elite football set piece coach. Analyse this attacking throw-in situation and provide tactical coaching feedback. Cover:
1. SHORT VS LONG THROW: When to use each option
2. MOVEMENT TO RECEIVE: Runs to create space for the receiver
3. FLICK-ON PATTERNS: Using a target man to redirect play
4. THIRD MAN RUNS: Creating overloads with indirect movement
5. TRAINING DRILL: One exercise to rehearse throw-in routines
Be specific, practical, and suitable for a grassroots team in Zimbabwe.`,
    defending: `You are an elite football set piece coach. Analyse this defending throw-in situation and provide tactical coaching feedback. Cover:
1. PRESSURE ON THROWER: How close to stand legally
2. MARKING SHAPE: How to prevent easy receipt
3. LONG THROW DANGER: Positioning against a player with a long throw
4. WINNING THE SECOND BALL: Midfield positioning after throw-in
5. TRANSITION: How to press and win possession from a throw-in
Be specific, practical, and suitable for a grassroots team in Zimbabwe.`,
  },
};

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  // History
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) return;
    if (user.role !== "coach" && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [_hasHydrated, user, router]);

  // Drag & drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
    }
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
      const basePrompt = AI_PROMPTS[selectedType][teamContext];
      const contextLine = videoFile
        ? `\nClip uploaded: ${videoFile.name} (${(videoFile.size / 1024 / 1024).toFixed(1)}MB)`
        : "";
      const notesLine = notes.trim()
        ? `\nCoach notes: ${notes.trim()}`
        : "";

      const message = `${basePrompt}${contextLine}${notesLine}

Respond with clear, numbered sections. Use plain English — no jargon. Keep each section to 2-3 sentences maximum. End with one motivational sentence for the players.`;

      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          system_prompt: "You are a practical football set piece coach working with grassroots teams in Zimbabwe. Give specific, actionable advice in plain English.",
        }),
      });

      if (!res.ok) throw new Error("Analysis failed. Try again.");
      const data = await res.json();
      const feedback = data.response || data.answer || "No feedback returned.";

      const newResult: AnalysisResult = {
        type: selectedType,
        context: teamContext,
        feedback,
        timestamp: new Date().toLocaleTimeString(),
      };
      setResult(newResult);
      setHistory((h) => [newResult, ...h.slice(0, 4)]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const canAnalyse = selectedType !== null;

  if (!_hasHydrated || !user) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e5e5",
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
              <div style={{ fontSize: 11, color: "#6b7280" }}>Upload a clip — AI analyses your set piece execution</div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 56px" }}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: Upload + Config ── */}
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
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: active ? sp.iconBg : "#f3f4f6" }}
                      >
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
                3 · Upload Set Piece Clip (Optional)
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
                  <Upload size={28} className="mx-auto mb-3" style={{ color: isDragging ? GRS_GREEN : "#9ca3af" }} />
                  <p className="text-sm font-semibold text-gray-600">
                    Drag & drop a clip, or <span style={{ color: GRS_GREEN }} className="font-bold">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI — max 500MB</p>
                  <p className="text-[10px] text-gray-300 mt-3">
                    AI will analyse delivery, movement & execution
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
                <div
                  className="flex items-center gap-3 rounded-xl border p-4"
                  style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#dcfce7" }}
                  >
                    <Film size={18} style={{ color: GRS_GREEN }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{videoFile.name}</p>
                    <p className="text-xs text-gray-500">{(videoFile.size / 1024 / 1024).toFixed(1)} MB · Ready for analysis</p>
                  </div>
                  <button
                    onClick={() => setVideoFile(null)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <X size={14} className="text-gray-400 hover:text-red-500" />
                  </button>
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
                placeholder="Describe what you want the AI to focus on — e.g. 'Our near post delivery is being cleared too easily' or 'The wall keeps breaking too early on free kicks'"
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-[#1a5c2a] transition-colors"
                style={{ backgroundColor: "#fafafa" }}
              />
            </div>

            {/* Analyse button */}
            <button
              onClick={runAnalysis}
              disabled={!canAnalyse || loading}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all"
              style={{
                backgroundColor: canAnalyse && !loading ? GRS_GREEN : "#d1d5db",
                color: canAnalyse && !loading ? "#fff" : "#9ca3af",
                cursor: canAnalyse && !loading ? "pointer" : "not-allowed",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Analysing set piece...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Brain size={16} />
                  {selectedType
                    ? `Analyse ${SET_PIECE_TYPES.find((s) => s.id === selectedType)?.label}`
                    : "Select a set piece type first"}
                </span>
              )}
            </button>

            {!canAnalyse && (
              <p className="text-center text-xs text-gray-400">
                Select a set piece type above to enable AI analysis
              </p>
            )}
          </div>

          {/* ── RIGHT: Analysis results + history ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Current result */}
            {loading && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <Loader2 size={28} className="mx-auto mb-3 animate-spin" style={{ color: GRS_GREEN }} />
                <p className="text-sm font-bold text-gray-600">Generating tactical feedback...</p>
                <p className="text-xs text-gray-400 mt-1">This takes a few seconds</p>
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
                {/* Result header */}
                <div
                  className="px-5 py-4 flex items-center gap-3"
                  style={{ backgroundColor: GRS_GREEN }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    <Sparkles size={16} className="text-yellow-300" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wide">
                      {SET_PIECE_TYPES.find((s) => s.id === result.type)?.label} — {result.context}
                    </p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                      AI Analysis · {result.timestamp}
                    </p>
                  </div>
                </div>

                {/* Result body */}
                <div className="p-5">
                  <div
                    className="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
                    style={{ fontFamily: "inherit" }}
                  >
                    {result.feedback}
                  </div>

                  <div
                    className="mt-4 flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2"
                    style={{ backgroundColor: "#f0fdf4", color: GRS_GREEN }}
                  >
                    <CheckCircle2 size={12} />
                    Analysis complete — share with your players before training
                  </div>
                </div>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <Brain size={32} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
                <p className="text-sm font-semibold text-gray-500">AI feedback will appear here</p>
                <p className="text-xs text-gray-400 mt-1">
                  Select a set piece type, upload a clip, and tap Analyse
                </p>
              </div>
            )}

            {/* Quick reference guide */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
                Quick Reference
              </p>
              <div className="space-y-2">
                {[
                  { icon: Flag, label: "Corner", tip: "Target far post with late runs" },
                  { icon: Target, label: "Free Kick", tip: "Vary delivery to beat the wall" },
                  { icon: Flame, label: "Penalty", tip: "Pick a spot and commit to it" },
                  { icon: Shield, label: "Defending", tip: "First man always covers near post" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
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
            {history.length > 0 && (
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
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "#f3f4f6" }}
                      >
                        <Brain size={14} style={{ color: GRS_GREEN }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800">
                          {SET_PIECE_TYPES.find((s) => s.id === h.type)?.label} · {h.context}
                        </p>
                        <p className="text-[10px] text-gray-400">{h.timestamp}</p>
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
