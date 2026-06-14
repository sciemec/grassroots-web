// src/app/coach/gemini-drills/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Coach Gemini Drill Analysis Hub
// Scan video for any player on your squad · view drill results per player
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Video, ChevronLeft, Users, Play, BarChart2,
  CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { ALL_GEMINI_DRILLS, getDrillsBySport, getDrillById, DrillResult } from "@/config/gemini-drills";

const GRS_GREEN = "#1a5c2a";
const GRS_GOLD  = "#c8962a";

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 10) * 100);
  const color = value >= 8 ? "#16a34a" : value >= 6 ? GRS_GOLD : value >= 4 ? "#ea580c" : "#dc2626";
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: "#555" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value.toFixed(1)}/10</span>
      </div>
      <div style={{ height: 5, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

// ── Player selector ───────────────────────────────────────────────────────────
function PlayerSelector({
  players, selected, onSelect,
}: {
  players: { id: string; name: string; position?: string }[];
  selected: string;
  onSelect: (id: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = players.find(p => p.id === selected);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 10,
          border: `1.5px solid ${open ? GRS_GREEN : "#d1d5db"}`,
          background: "#fff", cursor: "pointer", textAlign: "left",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <span style={{ fontSize: 14, color: current ? "#111" : "#888" }}>
          {current ? current.name : "Select a player…"}
        </span>
        {open ? <ChevronUp size={16} color="#888" /> : <ChevronDown size={16} color="#888" />}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, maxHeight: 240, overflowY: "auto",
        }}>
          {players.length === 0 && (
            <div style={{ padding: "14px 16px", fontSize: 13, color: "#888" }}>No players found</div>
          )}
          {players.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.id, p.name); setOpen(false); }}
              style={{
                width: "100%", padding: "10px 16px", border: "none", background: "transparent",
                cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 2,
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{p.name}</span>
              {p.position && <span style={{ fontSize: 11, color: "#888" }}>{p.position}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────
function ResultCard({ result }: { result: DrillResult }) {
  const [expanded, setExpanded] = useState(false);
  const drill = getDrillById(result.drillId);
  const scoreColor = result.overall_score >= 8 ? "#16a34a" : result.overall_score >= 6 ? GRS_GOLD : "#ea580c";

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e5e7eb", overflow: "hidden" }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{drill?.emoji ?? "⚽"}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{result.drillName}</div>
            <div style={{ fontSize: 11, color: "#888" }}>
              {new Date(result.analysedAt).toLocaleDateString()}
              {result.data_confidence && ` · ${result.data_confidence} confidence`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: scoreColor }}>{result.overall_score.toFixed(1)}</div>
          {expanded ? <ChevronUp size={16} color="#888" /> : <ChevronDown size={16} color="#888" />}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: "0.5px solid #f3f4f6" }}>
          {/* Score bars */}
          {result.scores && Object.entries(result.scores).length > 0 && (
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              {Object.entries(result.scores).map(([k, v]) => (
                <ScoreBar key={k} label={k.replace(/_/g, " ")} value={v as number} />
              ))}
            </div>
          )}
          {/* Strength / improvement */}
          {(result.top_strength || result.key_improvement) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              {result.top_strength && (
                <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#16a34a", marginBottom: 3 }}>TOP STRENGTH</div>
                  <div style={{ fontSize: 12, color: "#166534" }}>{result.top_strength}</div>
                </div>
              )}
              {result.key_improvement && (
                <div style={{ background: "#fffbeb", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#d97706", marginBottom: 3 }}>KEY IMPROVEMENT</div>
                  <div style={{ fontSize: 12, color: "#92400e" }}>{result.key_improvement}</div>
                </div>
              )}
            </div>
          )}
          {result.coach_note && (
            <div style={{ background: "#eff6ff", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#1d4ed8", marginBottom: 3 }}>COACH NOTE</div>
              <div style={{ fontSize: 12, color: "#1e3a8a" }}>{result.coach_note}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CoachGeminiDrillsPage() {
  const user     = useAuthStore((s) => s.user);
  const token    = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const router   = useRouter();

  const [squad,           setSquad]           = useState<{ id: string; name: string; position?: string }[]>([]);
  const [selectedPlayer,  setSelectedPlayer]  = useState<string>("");
  const [selectedName,    setSelectedName]    = useState<string>("");
  const [activeSport,     setActiveSport]     = useState<"football">("football");
  const [activeDrillId,   setActiveDrillId]   = useState<string>("");
  const [activeTab,       setActiveTab]       = useState<"library" | "results">("library");

  // Upload state
  const [uploadPhase, setUploadPhase] = useState<"idle" | "getting_url" | "uploading" | "processing" | "done" | "error">("idle");
  const [uploadPct,   setUploadPct]   = useState(0);
  const [drillResult, setDrillResult] = useState<DrillResult | null>(null);
  const [errorMsg,    setErrorMsg]    = useState("");
  const [playerResults, setPlayerResults] = useState<DrillResult[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);

  const drills = getDrillsBySport(activeSport);

  // Auth guard
  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
  }, [hydrated, user, router]);

  // Fetch squad
  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/coach/squad`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const raw = d.data?.data ?? d.data ?? d;
        if (Array.isArray(raw)) {
          setSquad(raw.map((p: { id: string; name?: string; first_name?: string; surname?: string; position?: string }) => ({
            id: String(p.id),
            name: p.name ?? `${p.first_name ?? ""} ${p.surname ?? ""}`.trim(),
            position: p.position,
          })));
        }
      })
      .catch(() => {});
  }, [token]);

  // Load player results from localStorage when player changes
  useEffect(() => {
    if (!selectedName) { setPlayerResults([]); return; }
    const nameKey = selectedName.toLowerCase().replace(/\s+/g, "_");
    const raw = localStorage.getItem(`grs_gemini_all_drills_${nameKey}`);
    if (raw) {
      try { setPlayerResults(JSON.parse(raw)); }
      catch { setPlayerResults([]); }
    } else {
      setPlayerResults([]);
    }
  }, [selectedName]);

  const handleSelectPlayer = (id: string, name: string) => {
    setSelectedPlayer(id);
    setSelectedName(name);
    setUploadPhase("idle");
    setDrillResult(null);
    setErrorMsg("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDrillId || !selectedPlayer) return;
    e.target.value = "";

    const drill = getDrillById(activeDrillId);
    if (!drill) return;

    try {
      // Step 1: get Google resumable upload URL
      setUploadPhase("getting_url");
      const initRes = await fetch("/api/match-eye/upload", {
        method: "POST",
        headers: { "content-type": file.type, "x-content-length": String(file.size) },
      });
      if (!initRes.ok) throw new Error("Could not start upload");
      const { uploadUrl } = await initRes.json();

      // Step 2: XHR PUT directly to Google (bypasses Vercel 4MB limit)
      setUploadPhase("uploading");
      const { fileUri, fileName } = await new Promise<{ fileUri: string; fileName: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (ev) => {
          if (ev.lengthComputable) setUploadPct(Math.round((ev.loaded / ev.total) * 100));
        });
        xhr.addEventListener("load", () => {
          try {
            const d = JSON.parse(xhr.responseText);
            const uri  = d.file?.uri  ?? d.fileUri  ?? "";
            const name = d.file?.name ?? d.fileName ?? "";
            if (!uri) { reject(new Error("No fileUri in Google response")); return; }
            resolve({ fileUri: uri, fileName: name });
          } catch { reject(new Error("Failed to parse upload response")); }
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Step 3: Gemini analysis
      setUploadPhase("processing");
      const res = await fetch("/api/gemini-drill-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUri, fileName, drillId: activeDrillId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Analysis failed");
      }
      const result: DrillResult = await res.json();

      // Persist result to localStorage keyed by player name
      const nameKey = selectedName.toLowerCase().replace(/\s+/g, "_");
      const storageKey = `grs_gemini_drill_${activeDrillId}_${nameKey}`;
      localStorage.setItem(storageKey, JSON.stringify(result));

      // Update all-results list
      const allKey = `grs_gemini_all_drills_${nameKey}`;
      const existing: DrillResult[] = JSON.parse(localStorage.getItem(allKey) ?? "[]");
      const filtered = existing.filter(r => r.drillId !== activeDrillId);
      localStorage.setItem(allKey, JSON.stringify([result, ...filtered]));
      setPlayerResults([result, ...filtered]);

      setDrillResult(result);
      setUploadPhase("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setUploadPhase("error");
    }
  };

  if (!hydrated || !user) return null;

  const activeDrill = getDrillById(activeDrillId);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee", fontFamily: "var(--font-sans)" }}>

      {/* Header */}
      <div style={{ background: GRS_GREEN, padding: "16px 16px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Link href="/coach" style={{ color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center" }}>
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Gemini Drill Analysis</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
              Upload player video · AI analyses technique · motion across time
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["library", "results"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: activeTab === tab ? GRS_GOLD : "rgba(255,255,255,0.15)",
                color: activeTab === tab ? "#1a3a1a" : "rgba(255,255,255,0.8)",
              }}
            >
              {tab === "library" ? "Drill Library" : "Player Results"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px 14px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Player selector (always visible) */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", border: "0.5px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Users size={14} color={GRS_GREEN} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Select Player
            </span>
          </div>
          <PlayerSelector players={squad} selected={selectedPlayer} onSelect={handleSelectPlayer} />
          {squad.length === 0 && (
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
              No squad loaded — <Link href="/coach/squad" style={{ color: GRS_GREEN }}>go to Squad</Link> first
            </div>
          )}
        </div>

        {/* ── DRILL LIBRARY TAB ──────────────────────────────────────────── */}
        {activeTab === "library" && (
          <>
            {/* Sport tabs */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
              {["football"].map(sport => (
                <button
                  key={sport}
                  onClick={() => setActiveSport(sport as "football")}
                  style={{
                    padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                    background: activeSport === sport ? GRS_GREEN : "#e5e7eb",
                    color: activeSport === sport ? "#fff" : "#555",
                  }}
                >
                  Football
                </button>
              ))}
              {["rugby", "netball", "athletics", "basketball", "cricket"].map(s => (
                <button
                  key={s}
                  disabled
                  style={{
                    padding: "6px 14px", borderRadius: 20, border: "none",
                    fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
                    background: "#f3f4f6", color: "#c4c4c4", cursor: "not-allowed",
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)} (soon)
                </button>
              ))}
            </div>

            {/* Gemini info banner */}
            <div style={{ background: "#eff6ff", borderRadius: 12, padding: "10px 12px", border: "1px solid #bfdbfe", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Video size={14} color="#1d4ed8" style={{ marginTop: 1, flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: "#1e3a8a", lineHeight: 1.5 }}>
                <strong>Gemini 2.0 Flash</strong> analyses the full video at 1 frame/second — it sees motion across time.
                Upload a short clip (10–90 seconds) of the player performing the drill.
              </div>
            </div>

            {/* Drill grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {drills.map(drill => {
                const isActive = activeDrillId === drill.id;
                return (
                  <button
                    key={drill.id}
                    onClick={() => {
                      setActiveDrillId(isActive ? "" : drill.id);
                      setUploadPhase("idle");
                      setDrillResult(null);
                      setErrorMsg("");
                    }}
                    style={{
                      background: isActive ? "#f0fdf4" : "#fff",
                      border: `1.5px solid ${isActive ? GRS_GREEN : "#e5e7eb"}`,
                      borderRadius: 12, padding: "12px 10px", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{drill.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? GRS_GREEN : "#111", marginBottom: 2 }}>
                      {drill.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#888", lineHeight: 1.4, marginBottom: 6 }}>
                      {drill.description}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      {drill.dimensions.slice(0, 3).map(d => (
                        <span key={d} style={{ fontSize: 9, background: "#f3f4f6", color: "#555", padding: "2px 5px", borderRadius: 4 }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Upload panel (shown when drill is selected) */}
            {activeDrill && (
              <div style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${GRS_GREEN}`, padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>{activeDrill.emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: GRS_GREEN }}>{activeDrill.name}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>
                      {activeDrill.dimensions.join(" · ")}
                    </div>
                  </div>
                </div>

                {!selectedPlayer && (
                  <div style={{ background: "#fffbeb", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#92400e", marginBottom: 10 }}>
                    Select a player above before uploading
                  </div>
                )}

                {selectedPlayer && uploadPhase === "idle" && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                      width: "100%", padding: "12px", borderRadius: 10,
                      background: GRS_GREEN, color: "#fff", border: "none",
                      cursor: "pointer", fontWeight: 600, fontSize: 14,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <Play size={16} /> Upload clip for {selectedName}
                  </button>
                )}

                {uploadPhase === "getting_url" && (
                  <div style={{ textAlign: "center", padding: "12px", color: "#555", fontSize: 13 }}>
                    <Loader2 size={16} className="animate-spin" style={{ display: "inline", marginRight: 6 }} />
                    Preparing upload…
                  </div>
                )}

                {uploadPhase === "uploading" && (
                  <div style={{ padding: "4px 0" }}>
                    <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
                      Uploading to Gemini… {uploadPct}%
                    </div>
                    <div style={{ height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${uploadPct}%`, background: GRS_GOLD, borderRadius: 99, transition: "width 0.3s" }} />
                    </div>
                  </div>
                )}

                {uploadPhase === "processing" && (
                  <div style={{ textAlign: "center", padding: "12px", color: "#1d4ed8", fontSize: 13 }}>
                    <Loader2 size={16} style={{ display: "inline", marginRight: 6, animation: "spin 1s linear infinite" }} />
                    Gemini is analysing the video… this may take 30–90 seconds
                  </div>
                )}

                {uploadPhase === "error" && (
                  <div style={{ background: "#fef2f2", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <AlertCircle size={14} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#dc2626" }}>Analysis failed</div>
                      <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>{errorMsg}</div>
                      <button onClick={() => setUploadPhase("idle")} style={{ marginTop: 6, fontSize: 11, color: GRS_GREEN, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                        Try again
                      </button>
                    </div>
                  </div>
                )}

                {uploadPhase === "done" && drillResult && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, color: "#16a34a" }}>
                      <CheckCircle2 size={16} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Analysis complete for {selectedName}</span>
                    </div>

                    {/* Overall score */}
                    <div style={{
                      background: "#f0fdf4", borderRadius: 10, padding: "10px 14px",
                      display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>Overall Score</span>
                      <span style={{ fontSize: 28, fontWeight: 900, color: GRS_GREEN }}>{drillResult.overall_score.toFixed(1)}</span>
                    </div>

                    {/* Score bars */}
                    {drillResult.scores && Object.entries(drillResult.scores).map(([k, v]) => (
                      <ScoreBar key={k} label={k.replace(/_/g, " ")} value={v as number} />
                    ))}

                    {/* Strength / improvement grid */}
                    {(drillResult.top_strength || drillResult.key_improvement) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                        {drillResult.top_strength && (
                          <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "#16a34a", marginBottom: 3 }}>TOP STRENGTH</div>
                            <div style={{ fontSize: 11, color: "#166534" }}>{drillResult.top_strength}</div>
                          </div>
                        )}
                        {drillResult.key_improvement && (
                          <div style={{ background: "#fffbeb", borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "#d97706", marginBottom: 3 }}>KEY IMPROVEMENT</div>
                            <div style={{ fontSize: 11, color: "#92400e" }}>{drillResult.key_improvement}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {drillResult.coach_note && (
                      <div style={{ background: "#eff6ff", borderRadius: 8, padding: "8px 10px", marginTop: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#1d4ed8", marginBottom: 3 }}>COACH NOTE</div>
                        <div style={{ fontSize: 11, color: "#1e3a8a" }}>{drillResult.coach_note}</div>
                      </div>
                    )}

                    <button
                      onClick={() => { setUploadPhase("idle"); setDrillResult(null); }}
                      style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 8, background: "#f3f4f6", border: "none", cursor: "pointer", fontSize: 13, color: "#555" }}
                    >
                      Analyse another clip
                    </button>
                  </div>
                )}

                <input ref={fileRef} type="file" accept="video/*" onChange={handleFileChange} style={{ display: "none" }} />
              </div>
            )}
          </>
        )}

        {/* ── PLAYER RESULTS TAB ────────────────────────────────────────── */}
        {activeTab === "results" && (
          <>
            {!selectedPlayer ? (
              <div style={{ background: "#fff", borderRadius: 12, padding: "24px 16px", textAlign: "center", border: "0.5px solid #e5e7eb" }}>
                <BarChart2 size={32} color="#d1d5db" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 14, color: "#888" }}>Select a player above to view their drill results</div>
              </div>
            ) : playerResults.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 12, padding: "24px 16px", textAlign: "center", border: "0.5px solid #e5e7eb" }}>
                <Video size={32} color="#d1d5db" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "#555", marginBottom: 4 }}>{selectedName}</div>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>No drill analyses recorded yet</div>
                <button
                  onClick={() => setActiveTab("library")}
                  style={{ padding: "8px 16px", borderRadius: 8, background: GRS_GREEN, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  Upload a drill clip
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <BarChart2 size={14} color={GRS_GREEN} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: GRS_GREEN }}>
                    {selectedName} · {playerResults.length} drill{playerResults.length !== 1 ? "s" : ""} analysed
                  </span>
                </div>
                {playerResults.map(r => <ResultCard key={`${r.drillId}-${r.analysedAt}`} result={r} />)}
              </>
            )}
          </>
        )}

        {/* Bottom note */}
        <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", paddingBottom: 16 }}>
          Results are saved per player on this device. For cross-device persistence, the backend endpoint
          <code style={{ fontSize: 10 }}> POST /coach/squad/{"{id}"}/gemini-drill </code> will be needed.
        </div>
      </div>
    </div>
  );
}
