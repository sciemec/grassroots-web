"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Activity, AlertTriangle, CheckCircle, Clock,
  Play, Square, ChevronDown, ChevronUp,
  Zap, TrendingDown, ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SquadPlayer {
  id: string;
  name: string;
  position: string;
}

interface FatigueReading {
  id: string;
  player_id: string;
  fatigue_score: number;
  deviation_pct: number | null;
  flags: string[];
  minute_mark: number;
  created_at: string;
}

interface PlayerFatigueState {
  player: SquadPlayer;
  currentScore: number;
  baselineScore: number | null;
  deviation: number;
  flags: string[];
  readings: FatigueReading[];
  status: "fresh" | "mild" | "moderate" | "high" | "critical";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_LOG = [
  { label: "Fresh",          score: 15, color: "#16a34a" },
  { label: "Slight fatigue", score: 40, color: "#65a30d" },
  { label: "Moderate",       score: 65, color: "#d97706" },
  { label: "Must rest",      score: 85, color: "#dc2626" },
];

const FATIGUE_FLAGS = [
  { key: "hip_drop",          label: "Hip drop"             },
  { key: "shoulder_collapse", label: "Shoulders dropping"   },
  { key: "head_dropping",     label: "Head down"            },
  { key: "reduced_sprint",    label: "Not sprinting"        },
  { key: "not_pressing",      label: "Not pressing"         },
];

const CHART_COLORS = ["#1a5c2a", "#c8962a", "#dc2626", "#2563eb", "#7c3aed", "#0891b2"];

const MOCK_SQUAD: SquadPlayer[] = [
  { id: "m1", name: "Tendai Musona",      position: "ST" },
  { id: "m2", name: "Lucky Nakamba",      position: "CM" },
  { id: "m3", name: "Blessing Mwangi",   position: "LW" },
  { id: "m4", name: "Farai Chitambara",  position: "CB" },
  { id: "m5", name: "Douglas Sibanda",   position: "GK" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toStatus(score: number): PlayerFatigueState["status"] {
  if (score <= 25) return "fresh";
  if (score <= 50) return "mild";
  if (score <= 70) return "moderate";
  if (score <= 85) return "high";
  return "critical";
}

function statusColor(s: PlayerFatigueState["status"]): string {
  return { fresh: "#16a34a", mild: "#65a30d", moderate: "#d97706", high: "#ea580c", critical: "#dc2626" }[s];
}

function statusLabel(s: PlayerFatigueState["status"]): string {
  return { fresh: "Fresh", mild: "Slight Fatigue", moderate: "Moderate", high: "High Fatigue", critical: "Must Sub" }[s];
}

function fmtTime(secs: number) {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}

function initStates(players: SquadPlayer[]): PlayerFatigueState[] {
  return players.map((p) => ({
    player: p, currentScore: 0, baselineScore: null,
    deviation: 0, flags: [], readings: [], status: "fresh",
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FatigueMonitorPage() {
  const token  = useAuthStore((s) => s.token);
  const API    = process.env.NEXT_PUBLIC_API_URL;

  const [phase,         setPhase]         = useState<"setup" | "live" | "report">("setup");
  const [squad,         setSquad]         = useState<SquadPlayer[]>([]);
  const [selectedIds,   setSelectedIds]   = useState<string[]>([]);
  const [sessionName,   setSessionName]   = useState("Training Session");
  const [duration,      setDuration]      = useState(90);
  const [sessionId,     setSessionId]     = useState<string | null>(null);
  const [startedAt,     setStartedAt]     = useState<Date | null>(null);
  const [elapsed,       setElapsed]       = useState(0);
  const [playerStates,  setPlayerStates]  = useState<PlayerFatigueState[]>([]);
  const [logTarget,     setLogTarget]     = useState<string | null>(null);
  const [logScore,      setLogScore]      = useState<number | null>(null);
  const [logFlags,      setLogFlags]      = useState<string[]>([]);
  const [expanded,      setExpanded]      = useState<string | null>(null);
  const [alertIds,      setAlertIds]      = useState<string[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load squad
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/coach/squad`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const raw = data.data || data.squad || [];
        const players: SquadPlayer[] = raw.map((p: Record<string, string>) => ({
          id:       p.user_id || p.id,
          name:     p.name || `${p.first_name ?? ""} ${p.surname ?? ""}`.trim() || "Player",
          position: p.position_primary || p.position || "—",
        }));
        setSquad(players.length ? players : MOCK_SQUAD);
        setSelectedIds((players.length ? players : MOCK_SQUAD).map((p) => p.id));
      })
      .catch(() => {
        setSquad(MOCK_SQUAD);
        setSelectedIds(MOCK_SQUAD.map((p) => p.id));
      });
  }, [token, API]);

  // Timer
  useEffect(() => {
    if (phase === "live" && startedAt) {
      timerRef.current = setInterval(
        () => setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000)),
        1000,
      );
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, startedAt]);

  // Poll readings every 30 s
  useEffect(() => {
    if (phase !== "live" || !sessionId) return;
    const poll = () => fetchReadings(sessionId);
    pollRef.current = setInterval(poll, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [phase, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Alert detection
  useEffect(() => {
    setAlertIds(
      playerStates
        .filter((ps) => ps.status === "high" || ps.status === "critical")
        .map((ps) => ps.player.id),
    );
  }, [playerStates]);

  const fetchReadings = async (sid: string) => {
    if (!token) return;
    try {
      const r    = await fetch(`${API}/coach/fatigue/sessions/${sid}/readings`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      applyReadings(data.data || []);
    } catch { /* silent */ }
  };

  const applyReadings = (readings: FatigueReading[]) => {
    setPlayerStates((prev) =>
      prev.map((ps) => {
        const mine = readings
          .filter((r) => r.player_id === ps.player.id)
          .sort((a, b) => a.minute_mark - b.minute_mark);
        if (!mine.length) return ps;
        const latest   = mine[mine.length - 1];
        const baseline = ps.baselineScore ?? mine[0].fatigue_score;
        const dev      = baseline > 0 ? Math.round(((latest.fatigue_score - baseline) / baseline) * 100) : 0;
        return { ...ps, currentScore: latest.fatigue_score, baselineScore: baseline, deviation: dev, flags: latest.flags || [], readings: mine, status: toStatus(latest.fatigue_score) };
      }),
    );
  };

  // ── Actions ──────────────────────────────────────────────────────────────

  const startSession = async () => {
    if (!selectedIds.length) { setError("Select at least one player."); return; }
    setLoading(true); setError("");
    let sid = `local-${Date.now()}`;
    try {
      if (token) {
        const r    = await fetch(`${API}/coach/fatigue/sessions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ session_name: sessionName, duration_minutes: duration, player_ids: selectedIds }),
        });
        const data = await r.json();
        if (data.data?.id) sid = data.data.id;
      }
    } catch { /* use local id */ }
    const selected = squad.filter((p) => selectedIds.includes(p.id));
    setSessionId(sid);
    setStartedAt(new Date());
    setPlayerStates(initStates(selected));
    setPhase("live");
    setLoading(false);
  };

  const submitReading = async () => {
    if (!logTarget || logScore === null) return;
    const minuteMark = Math.floor(elapsed / 60);
    const reading: FatigueReading = {
      id: `r-${Date.now()}`, player_id: logTarget, fatigue_score: logScore,
      deviation_pct: null, flags: logFlags, minute_mark: minuteMark, created_at: new Date().toISOString(),
    };

    // Optimistic update
    setPlayerStates((prev) =>
      prev.map((ps) => {
        if (ps.player.id !== logTarget) return ps;
        const newReadings = [...ps.readings, reading];
        const baseline    = ps.baselineScore ?? logScore;
        const dev         = baseline > 0 ? Math.round(((logScore - baseline) / baseline) * 100) : 0;
        return { ...ps, currentScore: logScore, baselineScore: baseline, deviation: dev, flags: logFlags, readings: newReadings, status: toStatus(logScore) };
      }),
    );

    if (token && sessionId && !sessionId.startsWith("local-")) {
      fetch(`${API}/coach/fatigue/sessions/${sessionId}/readings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: logTarget, fatigue_score: logScore, flags: logFlags, minute_mark: minuteMark, logged_by: "coach" }),
      }).catch(() => {});
    }

    setLogTarget(null); setLogScore(null); setLogFlags([]);
  };

  const endSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current)  clearInterval(pollRef.current);
    if (token && sessionId && !sessionId.startsWith("local-")) {
      fetch(`${API}/coach/fatigue/sessions/${sessionId}/end`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setPhase("report");
  };

  const resetSession = () => {
    setPhase("setup"); setPlayerStates([]); setSessionId(null);
    setElapsed(0); setStartedAt(null); setAlertIds([]);
  };

  // ── Chart data ────────────────────────────────────────────────────────────

  const chartData = (() => {
    const map: Record<number, Record<string, number>> = {};
    playerStates.forEach((ps) => {
      ps.readings.forEach((r) => {
        map[r.minute_mark] = { ...map[r.minute_mark], [ps.player.id]: r.fatigue_score };
      });
    });
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([m, scores]) => ({ minute: `${m}'`, ...scores }));
  })();

  // ── Shared styles ─────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    backgroundColor: "white", borderRadius: 16, padding: 24,
    border: "1px solid #e5e7eb", marginBottom: 20,
  };

  // ════════════════════════════════════════════════════════════════════════════
  // SETUP PHASE
  // ════════════════════════════════════════════════════════════════════════════

  if (phase === "setup") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        {/* Breadcrumb */}
        <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e5e5", padding: "12px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/coach" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
            <ArrowLeft size={15} /> Coach Hub
          </Link>
          <span style={{ color: "#d1d5db" }}>›</span>
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Fatigue Monitor</span>
        </div>

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={24} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>Fatigue Monitor</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Track real-time fatigue during training or matches</p>
            </div>
          </div>

          {/* Session config */}
          <div style={card}>
            <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#111" }}>Session Setup</h2>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Session Name</label>
            <input
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 20, boxSizing: "border-box", outline: "none" }}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Duration</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[45, 60, 90, 120].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  style={{
                    padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 500, fontSize: 14,
                    border: `2px solid ${duration === d ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: duration === d ? "#1a5c2a" : "white",
                    color: duration === d ? "white" : "#374151",
                  }}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Player selection */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111" }}>Players to Monitor</h2>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{selectedIds.length}/{squad.length} selected</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {squad.map((p) => {
                const sel = selectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedIds((prev) => sel ? prev.filter((id) => id !== p.id) : [...prev, p.id])}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      borderRadius: 10, cursor: "pointer", textAlign: "left",
                      border: `2px solid ${sel ? "#1a5c2a" : "#e5e7eb"}`,
                      backgroundColor: sel ? "#f0f7f2" : "white",
                    }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, backgroundColor: sel ? "#1a5c2a" : "#f3f4f6", color: sel ? "white" : "#6b7280" }}>
                      {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{p.position}</div>
                    </div>
                    {sel && <CheckCircle size={16} color="#1a5c2a" style={{ marginLeft: "auto" }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 12 }}>{error}</p>}

          <button
            onClick={startSession}
            disabled={loading}
            style={{
              width: "100%", padding: "14px", backgroundColor: loading ? "#9ca3af" : "#1a5c2a",
              color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Play size={18} /> {loading ? "Starting…" : "Start Monitoring"}
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIVE PHASE
  // ════════════════════════════════════════════════════════════════════════════

  if (phase === "live") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        {/* Live header bar */}
        <div style={{ backgroundColor: "#1a5c2a", color: "white", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#4ade80" }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>LIVE — {sessionName}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} />
              <span style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700 }}>{fmtTime(elapsed)}</span>
            </div>
            <button
              onClick={endSession}
              style={{ padding: "7px 14px", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Square size={12} /> End Session
            </button>
          </div>
        </div>

        {/* Alert banner */}
        {alertIds.length > 0 && (
          <div style={{ backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={15} color="#dc2626" />
            <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
              {alertIds.length === 1
                ? `${playerStates.find((ps) => ps.player.id === alertIds[0])?.player.name} showing high fatigue — consider substitution`
                : `${alertIds.length} players showing high fatigue`}
            </span>
          </div>
        )}

        {/* Log Reading Modal */}
        {logTarget && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
            <div style={{ backgroundColor: "white", borderRadius: 20, padding: 28, maxWidth: 420, width: "100%" }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#111" }}>Log Fatigue Reading</h3>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6b7280" }}>
                {playerStates.find((ps) => ps.player.id === logTarget)?.player.name} · min {Math.floor(elapsed / 60)}
              </p>

              <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#374151" }}>How does the player look?</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                {QUICK_LOG.map((opt) => (
                  <button
                    key={opt.score}
                    onClick={() => setLogScore(opt.score)}
                    style={{
                      padding: "12px 8px", borderRadius: 10, cursor: "pointer", fontSize: 14,
                      border: `2px solid ${logScore === opt.score ? opt.color : "#e5e7eb"}`,
                      backgroundColor: logScore === opt.score ? opt.color + "18" : "white",
                      fontWeight: logScore === opt.score ? 700 : 400, color: "#111",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#374151" }}>Flags (optional)</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
                {FATIGUE_FLAGS.map((f) => {
                  const active = logFlags.includes(f.key);
                  return (
                    <button
                      key={f.key}
                      onClick={() => setLogFlags((prev) => active ? prev.filter((k) => k !== f.key) : [...prev, f.key])}
                      style={{
                        padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12,
                        border: `1px solid ${active ? "#dc2626" : "#e5e7eb"}`,
                        backgroundColor: active ? "#fef2f2" : "white",
                        color: active ? "#dc2626" : "#374151",
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setLogTarget(null); setLogScore(null); setLogFlags([]); }}
                  style={{ flex: 1, padding: "12px", border: "1px solid #e5e7eb", borderRadius: 10, backgroundColor: "white", cursor: "pointer", fontWeight: 600, color: "#374151" }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitReading}
                  disabled={logScore === null}
                  style={{
                    flex: 2, padding: "12px", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: logScore !== null ? "pointer" : "not-allowed",
                    backgroundColor: logScore !== null ? "#1a5c2a" : "#e5e7eb",
                    color: "white",
                  }}
                >
                  Save Reading
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Player cards grid */}
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {playerStates.map((ps) => {
              const sc       = ps.currentScore;
              const clr      = statusColor(ps.status);
              const isExp    = expanded === ps.player.id;

              return (
                <div key={ps.player.id} style={{ backgroundColor: "white", borderRadius: 16, border: `2px solid ${sc > 0 ? clr + "55" : "#e5e7eb"}`, overflow: "hidden" }}>
                  <div style={{ padding: "16px 16px 14px" }}>
                    {/* Header row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{ps.player.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{ps.player.position}</div>
                      </div>
                      {sc > 0 && (
                        <span style={{ padding: "3px 9px", borderRadius: 20, backgroundColor: clr + "20", color: clr, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                          {statusLabel(ps.status)}
                        </span>
                      )}
                    </div>

                    {/* Score bar */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>Fatigue</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: sc > 0 ? clr : "#9ca3af" }}>{sc > 0 ? `${sc}/100` : "—"}</span>
                      </div>
                      <div style={{ height: 7, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${sc}%`, backgroundColor: sc > 0 ? clr : "transparent", borderRadius: 4, transition: "width 0.4s ease" }} />
                      </div>
                    </div>

                    {/* Deviation */}
                    {ps.baselineScore !== null && ps.deviation !== 0 && (
                      <div style={{ fontSize: 12, color: ps.deviation > 15 ? "#dc2626" : "#6b7280", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                        <TrendingDown size={12} />
                        {ps.deviation > 0 ? `+${ps.deviation}` : ps.deviation}% from baseline
                        {ps.deviation > 15 && <span style={{ fontWeight: 700 }}> ⚠ Alert</span>}
                      </div>
                    )}

                    {/* Flags */}
                    {ps.flags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                        {ps.flags.map((f) => (
                          <span key={f} style={{ padding: "2px 7px", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: 4, fontSize: 11 }}>
                            {FATIGUE_FLAGS.find((ff) => ff.key === f)?.label || f}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => { setLogTarget(ps.player.id); setLogScore(null); setLogFlags([]); }}
                        style={{ flex: 1, padding: "8px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                      >
                        <Zap size={13} /> Log Reading
                      </button>
                      {ps.readings.length > 0 && (
                        <button
                          onClick={() => setExpanded(isExp ? null : ps.player.id)}
                          style={{ padding: "8px 10px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", color: "#6b7280" }}
                        >
                          {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded reading history */}
                  {isExp && ps.readings.length > 0 && (
                    <div style={{ borderTop: "1px solid #f3f4f6", padding: "10px 16px", backgroundColor: "#fafafa" }}>
                      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#374151" }}>Reading history</p>
                      {ps.readings.map((r, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 3 }}>
                          <span>Min {r.minute_mark}</span>
                          <span style={{ fontWeight: 600, color: statusColor(toStatus(r.fatigue_score)) }}>Score {r.fatigue_score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // REPORT PHASE
  // ════════════════════════════════════════════════════════════════════════════

  const highRisk   = playerStates.filter((ps) => ps.status === "high" || ps.status === "critical");
  const avgFatigue = playerStates.length
    ? Math.round(playerStates.reduce((s, ps) => s + ps.currentScore, 0) / playerStates.length)
    : 0;
  const sorted     = [...playerStates].sort((a, b) => b.currentScore - a.currentScore);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e5e5", padding: "12px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/coach" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
          <ArrowLeft size={15} /> Coach Hub
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Session Report</span>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#111" }}>Session Report</h1>
        <p style={{ margin: "0 0 28px", color: "#6b7280", fontSize: 14 }}>{sessionName} · {fmtTime(elapsed)} duration</p>

        {/* Summary strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Players monitored",  value: playerStates.length,                       red: false },
            { label: "Avg fatigue score",  value: avgFatigue > 0 ? `${avgFatigue}/100` : "—", red: false },
            { label: "High-risk players",  value: highRisk.length,                            red: highRisk.length > 0 },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: "white", borderRadius: 12, padding: "18px 14px", border: "1px solid #e5e7eb", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.red ? "#dc2626" : "#1a5c2a", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Fatigue progression chart */}
        {chartData.length > 0 && (
          <div style={{ ...card }}>
            <h2 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "#111" }}>Fatigue Progression</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="minute" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {playerStates.map((ps, i) => (
                  <Line
                    key={ps.player.id}
                    type="monotone"
                    dataKey={ps.player.id}
                    name={ps.player.name.split(" ")[0]}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Player summary table */}
        <div style={card}>
          <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>Player Summary</h2>
          {sorted.map((ps, i) => (
            <div key={ps.player.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: i < sorted.length - 1 ? "1px solid #f3f4f6" : "none" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{ps.player.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{ps.player.position} · {ps.readings.length} reading{ps.readings.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {ps.currentScore > 0 && <span style={{ fontSize: 18, fontWeight: 800, color: statusColor(ps.status) }}>{ps.currentScore}</span>}
                <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, backgroundColor: ps.currentScore > 0 ? statusColor(ps.status) + "20" : "#f3f4f6", color: ps.currentScore > 0 ? statusColor(ps.status) : "#9ca3af" }}>
                  {ps.currentScore > 0 ? statusLabel(ps.status) : "No data"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Substitution recommendations */}
        {highRisk.length > 0 && (
          <div style={{ ...card, backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <AlertTriangle size={18} color="#dc2626" />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#dc2626" }}>Substitution Recommendations</h2>
            </div>
            {highRisk.map((ps) => (
              <p key={ps.player.id} style={{ margin: "0 0 8px", fontSize: 14, color: "#374151" }}>
                <strong>{ps.player.name}</strong> — score {ps.currentScore}/100
                {ps.deviation > 15 ? ` (+${ps.deviation}% from baseline)` : ""}
                {ps.flags.length > 0
                  ? `. Signs: ${ps.flags.map((f) => FATIGUE_FLAGS.find((ff) => ff.key === f)?.label).filter(Boolean).join(", ")}.`
                  : "."}
              </p>
            ))}
          </div>
        )}

        <button
          onClick={resetSession}
          style={{ width: "100%", padding: "14px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
        >
          Start New Session
        </button>
      </div>
    </div>
  );
}
