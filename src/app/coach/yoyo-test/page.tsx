"use client";
// src/app/coach/yoyo-test/page.tsx
// Squad Yo-Yo IR1 Test — coach records distances, localStorage leaderboard

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { ArrowLeft, Plus, Trophy, Trash2, Info, ChevronUp, ChevronDown } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const LS_KEY = "gs_squad_yoyo_results";

// Yo-Yo IR1 level→distance lookup (every 40m shuttle)
// Standard FIFA/Bangsbo protocol: levels 5–23, distances 120m–2120m
const LEVEL_DISTANCES: Record<string, number> = {
  "5/1": 120, "5/2": 160, "5/3": 200, "5/4": 240,
  "6/1": 280, "6/2": 320, "6/3": 360, "6/4": 400,
  "7/1": 440, "7/2": 480, "7/3": 520, "7/4": 560,
  "8/1": 600, "8/2": 640, "8/3": 680, "8/4": 720,
  "9/1": 760, "9/2": 800, "9/3": 840, "9/4": 880,
  "10/1": 920, "10/2": 960, "10/3": 1000, "10/4": 1040,
  "11/1": 1080, "11/2": 1120, "11/3": 1160, "11/4": 1200,
  "12/1": 1240, "12/2": 1280, "12/3": 1320, "12/4": 1360,
  "13/1": 1400, "13/2": 1440, "13/3": 1480, "13/4": 1520,
  "14/1": 1560, "14/2": 1600, "14/3": 1640, "14/4": 1680,
  "15/1": 1720, "15/2": 1760, "15/3": 1800, "15/4": 1840,
  "16/1": 1880, "16/2": 1920, "16/3": 1960, "16/4": 2000,
  "17/1": 2040, "17/2": 2080, "17/3": 2120,
};

// VO2max estimate from distance (Bangsbo 2008 equation)
function vo2maxFromDistance(distM: number): number {
  return Math.round((distM / 40) * 0.0136 + 45.3 * 10) / 10;
}

// Fitness category
function fitnessCategory(distM: number): { label: string; color: string } {
  if (distM >= 2080) return { label: "Elite", color: "#16a34a" };
  if (distM >= 1760) return { label: "Excellent", color: "#059669" };
  if (distM >= 1360) return { label: "Good", color: "#2563eb" };
  if (distM >= 960)  return { label: "Average", color: "#d97706" };
  return { label: "Below Average", color: "#dc2626" };
}

interface SquadPlayer {
  id: string;
  first_name: string;
  surname: string;
  position?: string;
  age_group?: string;
}

interface YoyoResult {
  id: string;
  player_id: string;
  player_name: string;
  position: string;
  distance_m: number;
  level_reached?: string;
  tested_at: string; // ISO date string
}

type SortKey = "rank" | "name" | "distance" | "date";
type SortDir = "asc" | "desc";

export default function CoachYoyoTestPage() {
  const token = useAuthStore((s) => s.token);

  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [loadingSquad, setLoadingSquad] = useState(true);
  const [results, setResults] = useState<YoyoResult[]>([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [inputMode, setInputMode] = useState<"distance" | "level">("distance");
  const [distanceInput, setDistanceInput] = useState("");
  const [levelInput, setLevelInput] = useState("10/1");
  const [testedAt, setTestedAt] = useState(() => new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  // Table sort
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Info panel
  const [showInfo, setShowInfo] = useState(false);

  // Load squad from backend
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/coach/squad`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((json) => {
        const players: SquadPlayer[] = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : [];
        setSquad(players);
      })
      .catch(() => {})
      .finally(() => setLoadingSquad(false));
  }, [token]);

  // Load results from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setResults(JSON.parse(raw));
    } catch {}
  }, []);

  const saveResults = useCallback((next: YoyoResult[]) => {
    setResults(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }, []);

  // Resolve distance from form inputs
  const resolveDistance = (): number | null => {
    if (inputMode === "distance") {
      const v = parseInt(distanceInput, 10);
      return isNaN(v) || v <= 0 ? null : v;
    }
    const mapped = LEVEL_DISTANCES[levelInput];
    return mapped ?? null;
  };

  const handleAdd = () => {
    const dist = resolveDistance();
    if (!selectedPlayerId || dist === null) return;
    setSaving(true);

    const player = squad.find((p) => p.id === selectedPlayerId);
    const name = player
      ? `${player.first_name} ${player.surname}`
      : "Unknown";

    const newResult: YoyoResult = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      player_id: selectedPlayerId,
      player_name: name,
      position: player?.position ?? "—",
      distance_m: dist,
      level_reached: inputMode === "level" ? levelInput : undefined,
      tested_at: testedAt,
    };

    saveResults([...results, newResult]);
    setDistanceInput("");
    setSelectedPlayerId("");
    setShowForm(false);
    setSaving(false);

    // Fire-and-forget: persist result in player's attribute profile
    // Silently ignored if squad membership isn't confirmed or attribute code doesn't exist
    if (token) {
      fetch(`${API}/coach/attribute-measurements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          player_user_id: selectedPlayerId,
          attribute_code: "yoyo_ir1",
          raw_value: dist,
          unit: "metres",
          measured_at: new Date(testedAt).toISOString(),
        }),
      }).catch(() => {});
    }
  };

  const handleDelete = (id: string) => {
    saveResults(results.filter((r) => r.id !== id));
  };

  // Sort
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...results].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "rank" || sortKey === "distance") {
      cmp = b.distance_m - a.distance_m; // highest distance = rank 1
    } else if (sortKey === "name") {
      cmp = a.player_name.localeCompare(b.player_name);
    } else if (sortKey === "date") {
      cmp = a.tested_at.localeCompare(b.tested_at);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const topDist = sorted[0]?.distance_m ?? 0;

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={11} className="text-gray-300" />;
    return sortDir === "asc"
      ? <ChevronUp size={11} className="text-[#1a5c2a]" />
      : <ChevronDown size={11} className="text-[#1a5c2a]" />;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <header style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e5e5",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
            <Link href="/coach" style={{ color: "#6b7280", display: "flex" }}>
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Yo-Yo IR1 Test</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                Record squad distances · ranked leaderboard
              </div>
            </div>
            <button
              onClick={() => setShowInfo((v) => !v)}
              style={{
                marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 8,
                backgroundColor: "#f3f4f6", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, color: "#374151",
              }}
            >
              <Info size={13} /> About
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* Info panel */}
        {showInfo && (
          <div style={{
            backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
            padding: 16, marginBottom: 20, fontSize: 13, color: "#374151", lineHeight: 1.6,
          }}>
            <p style={{ fontWeight: 700, marginBottom: 6, color: "#1a5c2a" }}>What is the Yo-Yo IR1 Test?</p>
            <p style={{ marginBottom: 8 }}>
              The Yo-Yo Intermittent Recovery Test Level 1 (IR1) measures a player&apos;s ability to
              repeatedly perform high-intensity running. Players run 20m shuttles at increasing speeds,
              with 10-second active rest periods between each pair of shuttles.
            </p>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Protocol:</p>
            <ul style={{ paddingLeft: 18, marginBottom: 8 }}>
              <li>20m out + 20m back = 1 shuttle (40m)</li>
              <li>10-second active recovery jog after each shuttle</li>
              <li>Speed increases every level — beep test controls the pace</li>
              <li>Test ends when player fails to reach the line twice</li>
              <li>Record the total distance covered (metres)</li>
            </ul>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Benchmarks (senior male footballers):</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
              <span style={{ color: "#16a34a", fontWeight: 700 }}>Elite: 2080m+</span>
              <span style={{ color: "#059669", fontWeight: 700 }}>Excellent: 1760–2080m</span>
              <span style={{ color: "#2563eb", fontWeight: 700 }}>Good: 1360–1760m</span>
              <span style={{ color: "#d97706", fontWeight: 700 }}>Average: 960–1360m</span>
            </div>
          </div>
        )}

        {/* Add result button */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px", borderRadius: 10,
              backgroundColor: "#1a5c2a", color: "#fff",
              border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
            }}
          >
            <Plus size={14} />
            {showForm ? "Cancel" : "Record Test Result"}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{
            backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
            padding: 20, marginBottom: 20,
          }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: "#111", marginBottom: 14 }}>
              New Test Entry
            </p>

            {/* Player selector */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                Player
              </label>
              {loadingSquad ? (
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Loading squad…</div>
              ) : (
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8,
                    border: "1px solid #d1d5db", fontSize: 13, color: "#111",
                    backgroundColor: "#fff",
                  }}
                >
                  <option value="">Select player…</option>
                  {squad.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.surname}{p.position ? ` — ${p.position}` : ""}
                    </option>
                  ))}
                  {squad.length === 0 && (
                    <option disabled>No squad players found</option>
                  )}
                </select>
              )}
            </div>

            {/* Input mode toggle */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                Enter result as
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["distance", "level"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setInputMode(mode)}
                    style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${inputMode === mode ? "#1a5c2a" : "#d1d5db"}`,
                      backgroundColor: inputMode === mode ? "#f0fdf4" : "#fff",
                      color: inputMode === mode ? "#1a5c2a" : "#6b7280",
                      cursor: "pointer",
                    }}
                  >
                    {mode === "distance" ? "Distance (m)" : "Level reached"}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance or Level input */}
            {inputMode === "distance" ? (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                  Total distance (metres)
                </label>
                <input
                  type="number"
                  min={40}
                  max={2200}
                  step={40}
                  value={distanceInput}
                  onChange={(e) => setDistanceInput(e.target.value)}
                  placeholder="e.g. 1360"
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8,
                    border: "1px solid #d1d5db", fontSize: 13,
                  }}
                />
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  Multiples of 40m (one completed shuttle = 40m)
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                  Last level completed
                </label>
                <select
                  value={levelInput}
                  onChange={(e) => setLevelInput(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8,
                    border: "1px solid #d1d5db", fontSize: 13, backgroundColor: "#fff",
                  }}
                >
                  {Object.keys(LEVEL_DISTANCES).map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Level {lvl} — {LEVEL_DISTANCES[lvl]}m
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                Test date
              </label>
              <input
                type="date"
                value={testedAt}
                onChange={(e) => setTestedAt(e.target.value)}
                style={{
                  padding: "8px 10px", borderRadius: 8,
                  border: "1px solid #d1d5db", fontSize: 13,
                }}
              />
            </div>

            {/* Preview */}
            {(() => {
              const dist = resolveDistance();
              if (!dist) return null;
              const cat = fitnessCategory(dist);
              const vo2 = vo2maxFromDistance(dist);
              return (
                <div style={{
                  backgroundColor: "#f0fdf4", borderRadius: 10,
                  border: "1px solid #bbf7d0", padding: "10px 14px",
                  marginBottom: 16, fontSize: 12,
                }}>
                  <span style={{ fontWeight: 700, color: "#1a5c2a" }}>{dist}m</span>
                  <span style={{ color: "#6b7280" }}> · VO₂max ≈ </span>
                  <span style={{ fontWeight: 700, color: "#374151" }}>{vo2} ml/kg/min</span>
                  <span style={{ color: "#6b7280" }}> · </span>
                  <span style={{ fontWeight: 700, color: cat.color }}>{cat.label}</span>
                </div>
              );
            })()}

            <button
              onClick={handleAdd}
              disabled={saving || !selectedPlayerId || !resolveDistance()}
              style={{
                padding: "9px 20px", borderRadius: 9,
                backgroundColor: saving || !selectedPlayerId || !resolveDistance() ? "#d1d5db" : "#1a5c2a",
                color: "#fff", border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 13,
              }}
            >
              Save Result
            </button>
          </div>
        )}

        {/* Leaderboard */}
        {sorted.length === 0 ? (
          <div style={{
            backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
            padding: 40, textAlign: "center",
          }}>
            <Trophy size={32} style={{ color: "#d1d5db", margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 700, color: "#374151", marginBottom: 4 }}>No results yet</p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              Record a test above to start building the squad leaderboard.
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 90px 100px 90px 36px",
              alignItems: "center",
              padding: "10px 16px",
              borderBottom: "1px solid #f3f4f6",
              backgroundColor: "#fafafa",
            }}>
              {([
                ["rank", "#"],
                ["name", "Player"],
                ["distance", "Distance"],
                [null, "Category"],
                ["date", "Date"],
                [null, ""],
              ] as [SortKey | null, string][]).map(([col, label], i) => (
                <div
                  key={i}
                  onClick={() => col && toggleSort(col)}
                  style={{
                    fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.1em", color: "#9ca3af",
                    cursor: col ? "pointer" : "default",
                    display: "flex", alignItems: "center", gap: 3,
                    userSelect: "none",
                  }}
                >
                  {label}
                  {col && <SortIcon col={col} />}
                </div>
              ))}
            </div>

            {/* Rows */}
            {sorted.map((r, idx) => {
              const cat = fitnessCategory(r.distance_m);
              const isTop = r.distance_m === topDist;
              return (
                <div
                  key={r.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr 90px 100px 90px 36px",
                    alignItems: "center",
                    padding: "11px 16px",
                    borderBottom: idx < sorted.length - 1 ? "1px solid #f3f4f6" : "none",
                    backgroundColor: isTop ? "#f0fdf4" : "#fff",
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    fontWeight: 800, fontSize: 13,
                    color: idx === 0 ? "#c8962a" : idx === 1 ? "#6b7280" : idx === 2 ? "#b45309" : "#9ca3af",
                  }}>
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                  </div>

                  {/* Name + position — click-through to squad player detail */}
                  <div>
                    <Link
                      href={`/coach/squad/${r.player_id}`}
                      style={{ fontWeight: 700, fontSize: 13, color: "#1a5c2a", textDecoration: "none" }}
                    >
                      {r.player_name}
                    </Link>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>{r.position}</p>
                  </div>

                  {/* Distance */}
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 14, color: "#1a5c2a" }}>{r.distance_m}m</p>
                    {r.level_reached && (
                      <p style={{ fontSize: 10, color: "#9ca3af" }}>Lvl {r.level_reached}</p>
                    )}
                  </div>

                  {/* Category badge */}
                  <div>
                    <span style={{
                      display: "inline-block",
                      fontSize: 10, fontWeight: 700,
                      padding: "2px 7px", borderRadius: 99,
                      color: cat.color,
                      backgroundColor: `${cat.color}18`,
                      border: `1px solid ${cat.color}30`,
                    }}>
                      {cat.label}
                    </span>
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    {new Date(r.tested_at).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short",
                    })}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#d1d5db", padding: 4, display: "flex",
                    }}
                    title="Remove"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}

            {/* Summary footer */}
            <div style={{
              padding: "10px 16px",
              borderTop: "1px solid #f3f4f6",
              backgroundColor: "#fafafa",
              display: "flex", gap: 24, flexWrap: "wrap",
            }}>
              {[
                { label: "Players tested", value: sorted.length },
                { label: "Best distance", value: `${topDist}m` },
                { label: "Squad avg", value: `${Math.round(sorted.reduce((s, r) => s + r.distance_m, 0) / sorted.length)}m` },
                { label: "Squad avg VO₂max", value: `${vo2maxFromDistance(Math.round(sorted.reduce((s, r) => s + r.distance_m, 0) / sorted.length))} ml/kg/min` },
              ].map((stat) => (
                <div key={stat.label}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", marginBottom: 1 }}>
                    {stat.label}
                  </p>
                  <p style={{ fontWeight: 800, fontSize: 15, color: "#1a5c2a" }}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 16, textAlign: "center" }}>
          Results saved locally and posted to each player&apos;s attribute profile — visible in the Player Hub.
        </p>
      </div>
    </div>
  );
}
