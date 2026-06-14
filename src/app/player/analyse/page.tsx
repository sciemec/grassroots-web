"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Upload, Play, RefreshCw, Zap, Lock, CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─────────────────────────────────────────────────────────────────────────────
// Sport + Drill config — all 10 GRS sports
// ─────────────────────────────────────────────────────────────────────────────
const SPORTS: { id: string; label: string; emoji: string; positions: string[]; drills: string[] }[] = [
  {
    id: "football", label: "Football", emoji: "⚽",
    positions: ["Striker", "Midfielder", "Defender", "Goalkeeper", "Winger"],
    drills:    ["Sprint", "Dribbling", "Shooting", "Passing", "Defending", "Heading", "Juggling", "Agility"],
  },
  {
    id: "rugby", label: "Rugby", emoji: "🏉",
    positions: ["Prop", "Hooker", "Lock", "Flanker", "Number 8", "Scrum-half", "Fly-half", "Wing", "Centre", "Fullback"],
    drills:    ["Sprint", "Tackle", "Lineout", "Scrum", "Carry", "Kicking", "Agility"],
  },
  {
    id: "athletics", label: "Athletics", emoji: "🏃",
    positions: ["Sprinter", "Middle Distance", "Long Distance", "Jumper", "Thrower"],
    drills:    ["Sprint", "Long Jump", "High Jump", "Hurdles", "Relay", "Discus", "Shot Put"],
  },
  {
    id: "netball", label: "Netball", emoji: "🏐",
    positions: ["Goal Shooter", "Goal Attack", "Wing Attack", "Centre", "Wing Defence", "Goal Defence", "Goalkeeper"],
    drills:    ["Shooting", "Chest Pass", "Footwork", "Defence", "Agility", "Court Movement"],
  },
  {
    id: "basketball", label: "Basketball", emoji: "🏀",
    positions: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Centre"],
    drills:    ["Dribbling", "Shooting", "Layup", "Defence", "Passing", "Agility"],
  },
  {
    id: "cricket", label: "Cricket", emoji: "🏏",
    positions: ["Batsman", "Bowler", "All-Rounder", "Wicketkeeper"],
    drills:    ["Batting", "Bowling", "Fielding", "Wicketkeeping"],
  },
  {
    id: "swimming", label: "Swimming", emoji: "🏊",
    positions: ["Freestyle", "Breaststroke", "Backstroke", "Butterfly", "Individual Medley"],
    drills:    ["Freestyle", "Breaststroke", "Backstroke", "Butterfly", "Turns", "Starts"],
  },
  {
    id: "tennis", label: "Tennis", emoji: "🎾",
    positions: ["Baseline Player", "Serve-Volley Player", "All-Court Player"],
    drills:    ["Serve", "Forehand", "Backhand", "Volley", "Footwork"],
  },
  {
    id: "volleyball", label: "Volleyball", emoji: "🏐",
    positions: ["Setter", "Outside Hitter", "Middle Blocker", "Libero", "Opposite"],
    drills:    ["Spike", "Serve", "Dig", "Block", "Setting"],
  },
  {
    id: "hockey", label: "Hockey", emoji: "🏑",
    positions: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
    drills:    ["Dribbling", "Shooting", "Passing", "Defence", "Penalty Corner"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AnalysePage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [sport,    setSport]    = useState(SPORTS[0]);
  const [drill,    setDrill]    = useState(SPORTS[0].drills[0]);
  const [position, setPosition] = useState(SPORTS[0].positions[0]);
  const [video,    setVideo]    = useState<File | null>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const [phase,    setPhase]    = useState<"idle" | "uploading" | "done" | "error" | "paywall">("idle");
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const handleSportChange = (s: typeof SPORTS[0]) => {
    setSport(s);
    setDrill(s.drills[0]);
    setPosition(s.positions[0]);
  };

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/")) {
      setErrorMsg("Please upload a video file (mp4 or mov).");
      return;
    }
    if (f.size > 200 * 1024 * 1024) {
      setErrorMsg("Video must be under 200MB. Try a shorter clip (under 60 seconds).");
      return;
    }
    setVideo(f);
    setPreview(URL.createObjectURL(f));
    setPhase("idle");
    setErrorMsg("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const runAnalysis = async () => {
    if (!video) return;
    setPhase("uploading");
    setFeedback("");
    setErrorMsg("");

    const form = new FormData();
    form.append("video",    video);
    form.append("sport",    sport.id);
    form.append("drill",    drill);
    form.append("position", position);
    form.append("token",    token ?? "");

    try {
      const res  = await fetch("/api/analyse", { method: "POST", body: form });
      const data = await res.json();

      if (res.status === 402) {
        setPhase("paywall");
        return;
      }
      if (!res.ok) {
        setErrorMsg(data.error ?? "Analysis failed. Please try again.");
        setPhase("error");
        return;
      }
      setFeedback(data.feedback ?? "");
      setPhase("done");
    } catch {
      setErrorMsg("Connection error. Please check your internet and try again.");
      setPhase("error");
    }
  };

  const reset = () => {
    setVideo(null);
    setPreview(null);
    setPhase("idle");
    setFeedback("");
    setErrorMsg("");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/player" className="text-gray-400 hover:text-gray-900 transition">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-sm font-black text-gray-900 uppercase tracking-tight">
              AI Drill Analysis
            </h1>
            <p className="text-xs text-gray-400">
              Upload a short video — Gemini watches the full clip and coaches you
            </p>
          </div>
          <span
            className="text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider"
            style={{ background: "#c8962a", color: "#fff" }}
          >
            Pro Feature
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Free trial banner ── */}
        <div
          className="rounded-2xl p-4 border"
          style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
        >
          <div className="flex items-start gap-3">
            <Zap size={18} className="mt-0.5 shrink-0" style={{ color: "#1c3d22" }} />
            <div>
              <p className="text-sm font-black text-gray-900">
                1 free analysis included
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Try AI drill analysis free. Upgrade to Pro for unlimited coaching feedback
                on all 10 sports.{" "}
                <Link href="/player/subscription" className="underline font-bold" style={{ color: "#1c3d22" }}>
                  Upgrade
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── Sport selector ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
            Select Sport
          </p>
          <div className="grid grid-cols-5 gap-2">
            {SPORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSportChange(s)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-center"
                style={{
                  borderColor:  sport.id === s.id ? "#1c3d22" : "#e5e7eb",
                  background:   sport.id === s.id ? "#f0fdf4" : "#fff",
                  color:        sport.id === s.id ? "#1c3d22" : "#6b7280",
                }}
              >
                <span className="text-lg leading-none">{s.emoji}</span>
                <span className="text-[9px] font-bold leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Drill + Position ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1.5">
              Drill Type
            </label>
            <select
              value={drill}
              onChange={(e) => setDrill(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-800 bg-white"
            >
              {sport.drills.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1.5">
              Your Position
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-800 bg-white"
            >
              {sport.positions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Video upload ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
            Upload Drill Video
          </p>

          {!preview ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-gray-400 transition-colors"
              style={{ minHeight: 160 }}
            >
              <Upload size={28} className="text-gray-300" />
              <div className="text-center">
                <p className="text-sm font-bold text-gray-500">
                  Tap to upload or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  MP4 or MOV · Max 60 seconds · Max 200MB
                </p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video
                src={preview}
                controls
                className="w-full h-full object-contain"
              />
              <button
                onClick={reset}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full"
              >
                Remove
              </button>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/quicktime,video/mov"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>

        {/* ── Error ── */}
        {errorMsg && (
          <div className="rounded-xl p-3 bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
            {errorMsg}
          </div>
        )}

        {/* ── Paywall ── */}
        {phase === "paywall" && (
          <div
            className="rounded-2xl p-5 border text-center"
            style={{ background: "#fffbeb", borderColor: "#fde68a" }}
          >
            <Lock size={24} className="mx-auto mb-2" style={{ color: "#c8962a" }} />
            <p className="text-sm font-black text-gray-900 mb-1">
              Free trial used
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Upgrade to Pro for unlimited AI drill analysis across all 10 sports.
            </p>
            <Link
              href="/player/subscription"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white"
              style={{ background: "#1c3d22" }}
            >
              Upgrade to Pro
            </Link>
          </div>
        )}

        {/* ── Feedback ── */}
        {phase === "done" && feedback && (
          <div
            className="rounded-2xl p-5 border"
            style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={18} style={{ color: "#1c3d22" }} />
              <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                Gemini AI Coach Feedback — {sport.label} · {drill}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {feedback}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 transition"
              >
                <RefreshCw size={13} /> Analyse Another
              </button>
              <Link
                href="/player/drills"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black text-white transition"
                style={{ background: "#1c3d22" }}
              >
                <Play size={13} /> See Drills
              </Link>
            </div>
          </div>
        )}

        {/* ── Analyse button ── */}
        {phase !== "done" && phase !== "paywall" && (
          <button
            onClick={runAnalysis}
            disabled={!video || phase === "uploading"}
            className="w-full py-3 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition disabled:opacity-40"
            style={{ background: "#1c3d22" }}
          >
            {phase === "uploading" ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Uploading &amp; analysing... (30–60 seconds)
              </>
            ) : (
              <>
                <Zap size={15} />
                Analyse with Gemini AI
              </>
            )}
          </button>
        )}

        {/* ── Tips ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
            Tips for best results
          </p>
          <ul className="space-y-1.5">
            {[
              "Keep clips under 60 seconds — focus on one drill",
              "Film in good light with the full body visible",
              "Hold the phone steady or prop it against something",
              "One player in frame gives the clearest feedback",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-xs text-gray-500">
                <span style={{ color: "#1c3d22" }} className="mt-0.5 font-bold">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {!user && (
          <div className="text-center text-xs text-gray-400 pb-4">
            <Link href="/login" className="font-bold underline" style={{ color: "#1c3d22" }}>
              Sign in
            </Link>{" "}
            to save your analysis history and track improvement over time.
          </div>
        )}
      </div>
    </div>
  );
}
