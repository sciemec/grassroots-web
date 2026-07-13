"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Brain, Save, TrendingUp, Target, Dumbbell, Video, Upload } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { SPORT_MAP, SPORT_STATS, getSportAnalysisPrompt, SportKey } from "@/config/sports";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import { queryAI } from "@/lib/ai-query";

interface StatEntry {
  [key: string]: string | number;
}

interface AiResponse {
  text: string;
  loading: boolean;
  error: string;
}

function StatField({ name, value, onChange }: {
  name: string;
  value: string | number;
  onChange: (v: string) => void;
}) {
  const label = name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={name.includes("Pct") || name.includes("Accuracy") || name.includes("Economy") ? "text" : "number"}
        step={name.includes("Pct") || name.includes("Accuracy") ? "0.1" : "1"}
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

// Renders the playing surface diagram for each sport
function SportDiagram({ sportKey, roleKey }: { sportKey: SportKey; roleKey: string }) {
  const NETBALL_ZONES: Record<string, { thirds: ("defending" | "centre" | "attacking")[]; label: string }> = {
    shooter:  { thirds: ["attacking"],  label: "Attacking third — GS/GA" },
    midcourt: { thirds: ["centre"],     label: "Centre third — WA/C/WD" },
    defender: { thirds: ["defending"],  label: "Defending third — GD/GK" },
  };

  const cfg = SPORT_MAP[sportKey];

  const renderDiagram = () => {
    switch (sportKey) {
      case "football":
        return (
          <svg viewBox="0 0 240 140" className="w-full max-w-xs mx-auto" style={{ borderRadius: 8 }}>
            <rect x="0" y="0" width="240" height="140" rx="4" fill="#1d7a34" />
            <rect x="1" y="1" width="238" height="138" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.8" />
            <line x1="120" y1="0" x2="120" y2="140" stroke="white" strokeWidth="1" strokeOpacity="0.8" />
            <circle cx="120" cy="70" r="22" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.8" />
            <circle cx="120" cy="70" r="2" fill="white" fillOpacity="0.8" />
            <rect x="0" y="32" width="50" height="76" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
            <rect x="190" y="32" width="50" height="76" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
            <rect x="0" y="50" width="20" height="40" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
            <rect x="220" y="50" width="20" height="40" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
            <circle cx="35" cy="70" r="1.5" fill="white" fillOpacity="0.6" />
            <circle cx="205" cy="70" r="1.5" fill="white" fillOpacity="0.6" />
          </svg>
        );

      case "rugby":
        return (
          <svg viewBox="0 0 240 140" className="w-full max-w-xs mx-auto" style={{ borderRadius: 8 }}>
            <rect x="0" y="0" width="240" height="140" rx="4" fill="#1d7a34" />
            <rect x="0" y="0" width="20" height="140" fill="#155a28" />
            <rect x="220" y="0" width="20" height="140" fill="#155a28" />
            <line x1="20" y1="0" x2="20" y2="140" stroke="white" strokeWidth="1.5" />
            <line x1="220" y1="0" x2="220" y2="140" stroke="white" strokeWidth="1.5" />
            <line x1="120" y1="0" x2="120" y2="140" stroke="white" strokeWidth="1.5" />
            <line x1="68" y1="0" x2="68" y2="140" stroke="white" strokeWidth="0.8" strokeDasharray="4 3" strokeOpacity="0.6" />
            <line x1="172" y1="0" x2="172" y2="140" stroke="white" strokeWidth="0.8" strokeDasharray="4 3" strokeOpacity="0.6" />
            <line x1="20" y1="25" x2="20" y2="65" stroke="white" strokeWidth="2" />
            <line x1="12" y1="38" x2="28" y2="38" stroke="white" strokeWidth="1.5" />
            <line x1="220" y1="25" x2="220" y2="65" stroke="white" strokeWidth="2" />
            <line x1="212" y1="38" x2="228" y2="38" stroke="white" strokeWidth="1.5" />
            <text x="10" y="120" textAnchor="middle" fill="white" fontSize="6" fillOpacity="0.5">TRY</text>
            <text x="230" y="120" textAnchor="middle" fill="white" fontSize="6" fillOpacity="0.5">TRY</text>
            <text x="120" y="9" textAnchor="middle" fill="white" fontSize="6" fillOpacity="0.5">HALFWAY</text>
            <text x="68" y="9" textAnchor="middle" fill="white" fontSize="5" fillOpacity="0.4">22m</text>
            <text x="172" y="9" textAnchor="middle" fill="white" fontSize="5" fillOpacity="0.4">22m</text>
          </svg>
        );

      case "athletics":
        return (
          <svg viewBox="0 0 240 140" className="w-full max-w-xs mx-auto" style={{ borderRadius: 8 }}>
            <rect x="0" y="0" width="240" height="140" rx="4" fill="#1a1a2e" />
            <ellipse cx="120" cy="70" rx="112" ry="62" fill="#cc330022" stroke="#cc3300" strokeWidth="8" />
            <ellipse cx="120" cy="70" rx="104" ry="54" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.3" />
            <ellipse cx="120" cy="70" rx="96" ry="46" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.3" />
            <ellipse cx="120" cy="70" rx="88" ry="38" fill="#1d7a34" />
            <line x1="120" y1="8" x2="120" y2="20" stroke="white" strokeWidth="2" />
            <text x="136" y="14" fill="white" fontSize="6" fillOpacity="0.7">START</text>
          </svg>
        );

      case "netball": {
        const thirds = ["defending", "centre", "attacking"] as const;
        const thirdColors: Record<string, string> = { defending: "#1E6B3C", centre: "#D4900A", attacking: "#B5261E" };
        const courtZone = NETBALL_ZONES[roleKey];
        const active = courtZone?.thirds ?? [];
        return (
          <svg viewBox="0 0 240 140" className="w-full max-w-xs mx-auto" style={{ borderRadius: 8, border: "1px solid #ffffff18" }}>
            <rect x="0" y="0" width="240" height="140" rx="4" fill="#0a150c" />
            {thirds.map((t, i) => {
              const x = i * 80;
              const isActive = active.includes(t);
              return (
                <g key={t}>
                  <rect x={x} y="0" width="80" height="140"
                    fill={isActive ? `${thirdColors[t]}44` : "#ffffff06"}
                    stroke={isActive ? thirdColors[t] : "#ffffff15"}
                    strokeWidth={isActive ? 1.5 : 0.5}
                  />
                  {i === 0 && <ellipse cx="40" cy="70" rx="22" ry="22" fill="none" stroke={isActive ? thirdColors[t] : "#ffffff20"} strokeWidth="1" />}
                  {i === 2 && <ellipse cx="200" cy="70" rx="22" ry="22" fill="none" stroke={isActive ? thirdColors[t] : "#ffffff20"} strokeWidth="1" />}
                  {i === 1 && <circle cx="120" cy="70" r="14" fill="none" stroke={isActive ? thirdColors[t] : "#ffffff20"} strokeWidth="1" />}
                  <text x={x + 40} y="70" textAnchor="middle" dominantBaseline="middle"
                    fill={isActive ? "#fff" : "#ffffff40"} fontSize="9" fontWeight={isActive ? "bold" : "normal"}>
                    {t === "defending" ? "DEF" : t === "centre" ? "MID" : "ATK"}
                  </text>
                  {t === "defending" && <>
                    <text x="20" y="30" textAnchor="middle" fill={isActive ? "#7fffb0" : "#ffffff25"} fontSize="7">GK</text>
                    <text x="60" y="50" textAnchor="middle" fill={isActive ? "#7fffb0" : "#ffffff25"} fontSize="7">GD</text>
                  </>}
                  {t === "centre" && <>
                    <text x="100" y="40" textAnchor="middle" fill={isActive ? "#ffd966" : "#ffffff25"} fontSize="7">WD</text>
                    <text x="120" y="25" textAnchor="middle" fill={isActive ? "#ffd966" : "#ffffff25"} fontSize="7">C</text>
                    <text x="140" y="40" textAnchor="middle" fill={isActive ? "#ffd966" : "#ffffff25"} fontSize="7">WA</text>
                  </>}
                  {t === "attacking" && <>
                    <text x="180" y="50" textAnchor="middle" fill={isActive ? "#ffaaaa" : "#ffffff25"} fontSize="7">GA</text>
                    <text x="220" y="30" textAnchor="middle" fill={isActive ? "#ffaaaa" : "#ffffff25"} fontSize="7">GS</text>
                  </>}
                </g>
              );
            })}
            <line x1="80" y1="0" x2="80" y2="140" stroke="#ffffff20" strokeWidth="0.5" />
            <line x1="160" y1="0" x2="160" y2="140" stroke="#ffffff20" strokeWidth="0.5" />
          </svg>
        );
      }

      case "basketball":
        return (
          <svg viewBox="0 0 240 140" className="w-full max-w-xs mx-auto" style={{ borderRadius: 8 }}>
            <rect x="0" y="0" width="240" height="140" rx="4" fill="#c87832" />
            <rect x="1" y="1" width="238" height="138" fill="none" stroke="white" strokeWidth="1" />
            <line x1="120" y1="1" x2="120" y2="139" stroke="white" strokeWidth="1" />
            <circle cx="120" cy="70" r="18" fill="none" stroke="white" strokeWidth="1" />
            <rect x="1" y="40" width="55" height="60" fill="#b06e2a" stroke="white" strokeWidth="1" />
            <rect x="184" y="40" width="55" height="60" fill="#b06e2a" stroke="white" strokeWidth="1" />
            <circle cx="56" cy="70" r="18" fill="none" stroke="white" strokeWidth="0.8" strokeDasharray="3 3" />
            <circle cx="184" cy="70" r="18" fill="none" stroke="white" strokeWidth="0.8" strokeDasharray="3 3" />
            <path d="M 1 25 Q 85 70 1 115" fill="none" stroke="white" strokeWidth="1" />
            <path d="M 239 25 Q 155 70 239 115" fill="none" stroke="white" strokeWidth="1" />
            <rect x="1" y="63" width="6" height="14" fill="none" stroke="#ff8c00" strokeWidth="1.5" />
            <rect x="233" y="63" width="6" height="14" fill="none" stroke="#ff8c00" strokeWidth="1.5" />
          </svg>
        );

      case "cricket":
        return (
          <svg viewBox="0 0 240 140" className="w-full max-w-xs mx-auto" style={{ borderRadius: 8 }}>
            <rect x="0" y="0" width="240" height="140" rx="4" fill="#1d7a34" />
            <ellipse cx="120" cy="70" rx="110" ry="62" fill="#2a8a3a" stroke="white" strokeWidth="1" strokeOpacity="0.7" />
            <ellipse cx="120" cy="70" rx="70" ry="42" fill="none" stroke="white" strokeWidth="0.7" strokeDasharray="4 3" strokeOpacity="0.5" />
            <rect x="108" y="20" width="24" height="100" rx="2" fill="#c8a068" stroke="#a07840" strokeWidth="0.5" />
            <line x1="108" y1="35" x2="132" y2="35" stroke="white" strokeWidth="1" />
            <line x1="108" y1="105" x2="132" y2="105" stroke="white" strokeWidth="1" />
            <line x1="116" y1="30" x2="116" y2="37" stroke="#5a3010" strokeWidth="1.5" />
            <line x1="120" y1="30" x2="120" y2="37" stroke="#5a3010" strokeWidth="1.5" />
            <line x1="124" y1="30" x2="124" y2="37" stroke="#5a3010" strokeWidth="1.5" />
            <line x1="116" y1="103" x2="116" y2="110" stroke="#5a3010" strokeWidth="1.5" />
            <line x1="120" y1="103" x2="120" y2="110" stroke="#5a3010" strokeWidth="1.5" />
            <line x1="124" y1="103" x2="124" y2="110" stroke="#5a3010" strokeWidth="1.5" />
          </svg>
        );

      case "swimming":
        return (
          <svg viewBox="0 0 240 140" className="w-full max-w-xs mx-auto" style={{ borderRadius: 8 }}>
            <rect x="0" y="0" width="240" height="140" rx="4" fill="#006994" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <g key={i}>
                <rect x="0" y={i * 17.5} width="12" height="17.5" fill={i % 2 === 0 ? "#1a2a3a" : "#2a3a4a"} />
                <text x="6" y={i * 17.5 + 11} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fillOpacity="0.8">{i + 1}</text>
                <line x1="0" y1={(i + 1) * 17.5} x2="240" y2={(i + 1) * 17.5} stroke="#80c8ff" strokeWidth={i === 3 ? 2 : 1} strokeOpacity={i === 3 ? 0.9 : 0.5} />
              </g>
            ))}
            <rect x="228" y="0" width="12" height="140" fill="#1a2a3a" />
            <line x1="210" y1="0" x2="210" y2="140" stroke="white" strokeWidth="0.5" strokeDasharray="3 3" strokeOpacity="0.3" />
            <text x="215" y="8" fill="white" fontSize="5" fillOpacity="0.4">5m</text>
          </svg>
        );

      case "tennis":
        return (
          <svg viewBox="0 0 240 140" className="w-full max-w-xs mx-auto" style={{ borderRadius: 8 }}>
            <rect x="0" y="0" width="240" height="140" rx="4" fill="#3a7a35" />
            <rect x="20" y="10" width="200" height="120" fill="none" stroke="white" strokeWidth="1.5" />
            <line x1="120" y1="10" x2="120" y2="130" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
            <line x1="20" y1="70" x2="220" y2="70" stroke="white" strokeWidth="2.5" />
            <line x1="20" y1="37" x2="220" y2="37" stroke="white" strokeWidth="1" />
            <line x1="20" y1="103" x2="220" y2="103" stroke="white" strokeWidth="1" />
            <line x1="40" y1="10" x2="40" y2="130" stroke="white" strokeWidth="0.8" strokeOpacity="0.6" />
            <line x1="200" y1="10" x2="200" y2="130" stroke="white" strokeWidth="0.8" strokeOpacity="0.6" />
            <line x1="118" y1="10" x2="122" y2="10" stroke="white" strokeWidth="1.5" />
            <line x1="118" y1="130" x2="122" y2="130" stroke="white" strokeWidth="1.5" />
            <text x="120" y="55" textAnchor="middle" fill="white" fontSize="7" fillOpacity="0.4">SERVICE</text>
            <text x="120" y="90" textAnchor="middle" fill="white" fontSize="7" fillOpacity="0.4">SERVICE</text>
          </svg>
        );

      case "volleyball":
        return (
          <svg viewBox="0 0 240 140" className="w-full max-w-xs mx-auto" style={{ borderRadius: 8 }}>
            <rect x="0" y="0" width="240" height="140" rx="4" fill="#1a3d8b" />
            <rect x="10" y="10" width="220" height="120" fill="none" stroke="white" strokeWidth="1.5" />
            <line x1="10" y1="70" x2="230" y2="70" stroke="white" strokeWidth="3" />
            <line x1="10" y1="55" x2="10" y2="85" stroke="#aaa" strokeWidth="2" />
            <line x1="230" y1="55" x2="230" y2="85" stroke="#aaa" strokeWidth="2" />
            <line x1="10" y1="45" x2="230" y2="45" stroke="white" strokeWidth="1" strokeDasharray="5 3" />
            <line x1="10" y1="95" x2="230" y2="95" stroke="white" strokeWidth="1" strokeDasharray="5 3" />
            <text x="120" y="33" textAnchor="middle" fill="white" fontSize="7" fillOpacity="0.5">ATTACK LINE</text>
            <text x="120" y="109" textAnchor="middle" fill="white" fontSize="7" fillOpacity="0.5">ATTACK LINE</text>
          </svg>
        );

      case "hockey":
        return (
          <svg viewBox="0 0 240 140" className="w-full max-w-xs mx-auto" style={{ borderRadius: 8 }}>
            <rect x="0" y="0" width="240" height="140" rx="4" fill="#1d7a34" />
            <rect x="1" y="1" width="238" height="138" fill="none" stroke="white" strokeWidth="1" />
            <line x1="120" y1="0" x2="120" y2="140" stroke="white" strokeWidth="1.5" />
            <line x1="60" y1="0" x2="60" y2="140" stroke="white" strokeWidth="0.8" strokeDasharray="4 3" strokeOpacity="0.6" />
            <line x1="180" y1="0" x2="180" y2="140" stroke="white" strokeWidth="0.8" strokeDasharray="4 3" strokeOpacity="0.6" />
            <path d="M 0 35 Q 55 70 0 105" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.8" />
            <path d="M 240 35 Q 185 70 240 105" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.8" />
            <rect x="0" y="57" width="6" height="26" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
            <rect x="234" y="57" width="6" height="26" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
            <circle cx="30" cy="70" r="1.5" fill="white" fillOpacity="0.6" />
            <circle cx="210" cy="70" r="1.5" fill="white" fillOpacity="0.6" />
            <circle cx="120" cy="70" r="5" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
          </svg>
        );

      default:
        return null;
    }
  };

  const courtZone = sportKey === "netball" ? NETBALL_ZONES[roleKey] : null;
  const label =
    sportKey === "netball"
      ? (courtZone?.label ?? "Netball Court")
      : `${cfg?.label ?? ""} Playing Area`;

  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="mb-3 text-sm font-semibold">{label}</p>
      {renderDiagram()}
    </div>
  );
}

function VideoTalentSection({
  sportKey,
  roleKey,
  accentColor,
}: {
  sportKey: SportKey;
  roleKey: string;
  accentColor: string;
}) {
  const token = useAuthStore((s) => s.token);
  const cfg = SPORT_MAP[sportKey];
  const drill = cfg?.drills?.[0]?.title ?? sportKey;

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "uploading" | "analysing" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [savedToShowcase, setSavedToShowcase] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 200 * 1024 * 1024) { setErrorMsg("Video must be under 200MB."); return; }
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setFeedback(""); setSavedToShowcase(false); setErrorMsg(""); setStage("idle");
  };

  const analyse = async () => {
    if (!file) return;
    setStage("uploading"); setProgress(0); setErrorMsg("");
    try {
      // Step 1 — get Gemini resumable upload session
      const initRes = await fetch("/api/match-eye/upload", {
        method: "POST",
        headers: {
          "content-type": file.type || "video/mp4",
          "x-content-length": String(file.size),
        },
      });
      if (!initRes.ok) throw new Error("Failed to start upload session");
      const { uploadUrl, mimeType } = await initRes.json();

      // Step 2 — XHR PUT directly to Google (real progress, no body size limit)
      const fileUri = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", mimeType);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 80));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)?.file?.uri ?? ""); }
            catch { resolve(xhr.getResponseHeader("Location") ?? ""); }
          } else { reject(new Error(`Upload failed: ${xhr.status}`)); }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setProgress(85); setStage("analysing");

      // Step 3 — Gemini analysis
      const res = await fetch("/api/analyse-from-uri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUri, fileName: file.name, mimeType, sport: sportKey, drill, position: roleKey, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");

      setFeedback(data.feedback ?? ""); setSavedToShowcase(true); setProgress(100); setStage("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Analysis failed");
      setStage("error");
    }
  };

  return (
    <div className="mt-6 rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Video className="h-4 w-4" style={{ color: accentColor }} />
        <h2 className="text-sm font-semibold">Video Talent Analysis</h2>
        <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: accentColor }}>
          AI
        </span>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Upload a short clip of your {cfg?.label.toLowerCase()} skills. Gemini AI will analyse your technique and save the result to your scout showcase.
      </p>

      <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors hover:border-primary/50">
        <input type="file" accept="video/*" className="hidden" onChange={onFileChange} />
        <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-xs font-medium text-muted-foreground">
          {file ? file.name : "Tap to choose a video (max 200MB)"}
        </span>
      </label>

      {videoUrl && (
        <video src={videoUrl} className="mt-4 w-full rounded-xl" controls playsInline style={{ maxHeight: 240 }} />
      )}

      {(stage === "uploading" || stage === "analysing") && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{stage === "uploading" ? "Uploading…" : "AI analysing…"}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: accentColor }} />
          </div>
        </div>
      )}

      {file && stage !== "uploading" && stage !== "analysing" && (
        <button
          onClick={analyse}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-colors"
          style={{ backgroundColor: accentColor }}
        >
          <Brain className="h-4 w-4" />
          Analyse with AI
        </button>
      )}

      {errorMsg && <p className="mt-3 text-xs text-destructive">{errorMsg}</p>}

      {stage === "done" && feedback && (
        <div className="mt-4 space-y-3">
          <div
            className="rounded-xl p-4 text-sm leading-relaxed"
            style={{ backgroundColor: `${accentColor}15`, borderLeft: `3px solid ${accentColor}` }}
          >
            {feedback}
          </div>
          {savedToShowcase && (
            <p className="text-center text-xs text-muted-foreground">
              ✓ Saved to your showcase — scouts can now discover this clip
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function SportStatsPage() {
  const { sport = "" } = useParams<{ sport: string }>() ?? {};
  const router = useRouter();
  const { user } = useAuthStore();
  const sportKey = sport as SportKey;
  const cfg = SPORT_MAP[sportKey];

  const [roleKey, setRoleKey] = useState<string>("all");
  const [stats, setStats] = useState<StatEntry>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [context, setContext] = useState("");
  const [ai, setAi] = useState<AiResponse>({ text: "", loading: false, error: "" });
  const [history, setHistory] = useState<{ date: string; role: string; stats: StatEntry }[]>([]);

  const sportRoles = useMemo(
    () => SPORT_STATS[sportKey] ?? { all: ["minutesPlayed", "goals", "assists"] },
    [sportKey]
  );
  const roleKeys = Object.keys(sportRoles);

  const initStats = useCallback((rk: string) => {
    const fields = sportRoles[rk] ?? [];
    const blank: StatEntry = {};
    fields.forEach((f) => { blank[f] = ""; });
    setStats(blank);
  }, [sportRoles]);

  useEffect(() => {
    if (!cfg) { router.push("/player/sports"); return; }
    initStats(roleKey);

    api.get(`/profile/sports/${sportKey}/stats`)
      .then((r) => setHistory(r.data ?? []))
      .catch(() => {});
  }, [user, router, cfg, sportKey, roleKey, initStats]);

  const onRoleChange = (rk: string) => {
    setRoleKey(rk);
    initStats(rk);
  };

  const saveStats = async () => {
    setSaving(true);
    try {
      await api.post(`/profile/sports/${sportKey}/stats`, { role: roleKey, stats });
      const newEntry = { date: new Date().toISOString(), role: roleKey, stats };
      setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const getAiFeedback = async () => {
    setAi({ text: "", loading: true, error: "" });

    const statSummary = Object.entries(stats)
      .filter(([, v]) => v !== "" && v !== 0)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const systemPrompt = getSportAnalysisPrompt(sportKey, statSummary || "No stats provided.", roleKey);
    const message = [
      systemPrompt,
      context ? `Additional context: ${context}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      const reply = await queryAI(message, "player");
      setAi({ text: reply, loading: false, error: "" });
    } catch {
      setAi({ text: "", loading: false, error: "Failed to get AI feedback. Please try again." });
    }
  };

  if (!cfg) return null;

  const fields = sportRoles[roleKey] ?? [];
  const accentColor = cfg.color ?? "#1a5c2a";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 pt-16 lg:pt-6">
        <div className="mx-auto max-w-2xl">

          {/* Header — colored left accent bar per sport */}
          <div className="mb-6 flex items-center gap-3">
            <Link href="/player/sports" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div
              className="h-8 w-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-3xl">{cfg.emoji}</span>
            <div>
              <h1 className="text-2xl font-bold">{cfg.label}</h1>
              <p className="text-xs text-muted-foreground">{cfg.governingBody} · {cfg.competitions[0]}</p>
            </div>
          </div>

          {/* Sport-specific playing area diagram */}
          <SportDiagram sportKey={sportKey} roleKey={roleKey} />

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Stat entry */}
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 text-sm font-semibold">Log Performance Stats</h2>

                {/* Role tabs */}
                {roleKeys.length > 1 && (
                  <div className="mb-4 flex gap-2 flex-wrap">
                    {roleKeys.map((rk) => (
                      <button
                        key={rk}
                        onClick={() => onRoleChange(rk)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors"
                        style={
                          roleKey === rk
                            ? { backgroundColor: accentColor, color: "#fff" }
                            : {}
                        }
                        data-inactive={roleKey !== rk || undefined}
                      >
                        {roleKey !== rk
                          ? <span className="rounded-lg px-3 py-1.5 text-xs font-semibold capitalize bg-muted text-muted-foreground hover:bg-muted/80 inline-block">{rk}</span>
                          : rk}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {fields.map((field) => (
                    <StatField
                      key={field}
                      name={field}
                      value={stats[field] ?? ""}
                      onChange={(v) => setStats((prev) => ({ ...prev, [field]: v }))}
                    />
                  ))}
                </div>

                <button
                  onClick={saveStats}
                  disabled={saving}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: accentColor }}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saved ? "Saved!" : saving ? "Saving…" : "Log stats"}
                </button>
              </div>

              {/* Recent history */}
              {history.length > 0 && (
                <div className="rounded-xl border bg-card p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">Recent Entries</h2>
                  </div>
                  <div className="space-y-2">
                    {history.slice(0, 5).map((entry, i) => (
                      <div key={i} className="flex items-start justify-between rounded-lg bg-muted/40 px-3 py-2">
                        <div>
                          <p className="text-xs font-medium capitalize">{entry.role}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {Object.entries(entry.stats)
                              .filter(([, v]) => v !== "" && v !== 0)
                              .slice(0, 3)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" · ")}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Feedback + Focus Areas */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" style={{ color: accentColor }} />
                <h2 className="text-sm font-semibold">AI Performance Feedback</h2>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Add context (optional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  placeholder={`e.g. "This was a cup final, I played ${roleKey === "goalkeeper" || roleKey === "all" ? "centrally" : "on the right"}, we won 2-1…"`}
                  className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              <button
                onClick={getAiFeedback}
                disabled={ai.loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors hover:bg-muted/20"
                style={{ borderColor: `${accentColor}40`, color: accentColor, backgroundColor: `${accentColor}10` }}
              >
                {ai.loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
                ) : (
                  <><Brain className="h-4 w-4" /> Get AI Feedback</>
                )}
              </button>

              {ai.error && (
                <p className="text-xs text-destructive">{ai.error}</p>
              )}

              {ai.text && (
                <div className="rounded-xl bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {ai.text}
                </div>
              )}

              {!ai.text && !ai.loading && (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <Brain className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    Fill in your stats and click &ldquo;Get AI Feedback&rdquo; for personalised{" "}
                    {cfg.label.toLowerCase()} analysis from your AI coach.
                  </p>
                </div>
              )}

              {/* Key Focus Areas */}
              {cfg.keyFocus && cfg.keyFocus.length > 0 && (
                <div className="border-t pt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Key Focus Areas
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {cfg.keyFocus.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: accentColor }}
                        />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Competitions */}
              <div className="border-t pt-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {cfg.governingBody} Competitions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cfg.competitions.map((c) => (
                    <span
                      key={c}
                      className="rounded-full px-2.5 py-1 text-xs font-medium bg-muted"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Drills */}
          {cfg.drills && cfg.drills.length > 0 && (
            <div className="mt-6 rounded-xl border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Recommended {cfg.label} Drills</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {cfg.drills.map((drill, i) => (
                  <div key={i} className="rounded-lg bg-muted/40 p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold leading-tight">{drill.title}</p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: accentColor }}
                      >
                        {drill.duration}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{drill.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Talent Analysis — Gemini AI pipeline */}
          <VideoTalentSection sportKey={sportKey} roleKey={roleKey} accentColor={accentColor} />

        </div>
      </main>
    </div>
  );
}
