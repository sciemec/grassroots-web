"use client";
// src/app/player/personal-bests/page.tsx
// Personal bests tracker — primarily for athletics and swimming.
// Other sports see a generic milestone-style PB list.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trophy, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ── Types ────────────────────────────────────────────────────────────────────

interface PbEntry {
  id:         string;
  event:      string;
  value:      string;   // time (e.g. "10.52") or distance/height (e.g. "7.45m")
  unit:       string;   // "s", "m", "kg" etc.
  date:       string;   // YYYY-MM-DD
  venue?:     string;
  competition?: string;
  notes?:     string;
  created_at: string;
}

// ── Event definitions by sport ────────────────────────────────────────────────

type EventGroup = { group: string; events: { label: string; unit: string; placeholder: string }[] };

const ATHLETICS_EVENTS: EventGroup[] = [
  {
    group: "Track",
    events: [
      { label: "60m",          unit: "s", placeholder: "7.52" },
      { label: "100m",         unit: "s", placeholder: "11.45" },
      { label: "200m",         unit: "s", placeholder: "23.10" },
      { label: "400m",         unit: "s", placeholder: "54.80" },
      { label: "800m",         unit: "s", placeholder: "2:05.40" },
      { label: "1500m",        unit: "s", placeholder: "4:12.00" },
      { label: "3000m",        unit: "s", placeholder: "9:30.00" },
      { label: "5000m",        unit: "s", placeholder: "16:45.00" },
      { label: "10000m",       unit: "s", placeholder: "35:20.00" },
      { label: "100m Hurdles", unit: "s", placeholder: "13.80" },
      { label: "110m Hurdles", unit: "s", placeholder: "14.10" },
      { label: "400m Hurdles", unit: "s", placeholder: "58.20" },
      { label: "3000m Steeplechase", unit: "s", placeholder: "10:15.00" },
    ],
  },
  {
    group: "Jumps",
    events: [
      { label: "Long Jump",   unit: "m", placeholder: "5.80" },
      { label: "Triple Jump", unit: "m", placeholder: "12.40" },
      { label: "High Jump",   unit: "m", placeholder: "1.75" },
      { label: "Pole Vault",  unit: "m", placeholder: "3.80" },
    ],
  },
  {
    group: "Throws",
    events: [
      { label: "Shot Put",    unit: "m", placeholder: "11.50" },
      { label: "Discus",      unit: "m", placeholder: "35.00" },
      { label: "Javelin",     unit: "m", placeholder: "45.00" },
      { label: "Hammer",      unit: "m", placeholder: "40.00" },
    ],
  },
  {
    group: "Road",
    events: [
      { label: "Half Marathon", unit: "s", placeholder: "1:30:00" },
      { label: "Marathon",      unit: "s", placeholder: "3:15:00" },
      { label: "10km Race",     unit: "s", placeholder: "42:00" },
    ],
  },
];

const SWIMMING_EVENTS: EventGroup[] = [
  {
    group: "Freestyle",
    events: [
      { label: "50m Freestyle",   unit: "s", placeholder: "26.50" },
      { label: "100m Freestyle",  unit: "s", placeholder: "57.80" },
      { label: "200m Freestyle",  unit: "s", placeholder: "2:08.00" },
      { label: "400m Freestyle",  unit: "s", placeholder: "4:35.00" },
      { label: "800m Freestyle",  unit: "s", placeholder: "9:45.00" },
      { label: "1500m Freestyle", unit: "s", placeholder: "19:00.00" },
    ],
  },
  {
    group: "Other Strokes",
    events: [
      { label: "50m Backstroke",    unit: "s", placeholder: "30.00" },
      { label: "100m Backstroke",   unit: "s", placeholder: "1:05.00" },
      { label: "50m Breaststroke",  unit: "s", placeholder: "32.00" },
      { label: "100m Breaststroke", unit: "s", placeholder: "1:10.00" },
      { label: "50m Butterfly",     unit: "s", placeholder: "28.00" },
      { label: "100m Butterfly",    unit: "s", placeholder: "1:01.00" },
      { label: "200m Individual Medley", unit: "s", placeholder: "2:20.00" },
      { label: "400m Individual Medley", unit: "s", placeholder: "5:00.00" },
    ],
  },
];

const GENERIC_EVENTS: EventGroup[] = [
  {
    group: "Personal Records",
    events: [
      { label: "Best Performance",    unit: "",  placeholder: "e.g. 25 points, 5 wickets, 3 tries" },
      { label: "Season High",         unit: "",  placeholder: "describe the achievement" },
      { label: "Competition Record",  unit: "",  placeholder: "describe the achievement" },
    ],
  },
];

function getEventGroups(sport: string): EventGroup[] {
  const s = sport?.toLowerCase();
  if (s === "athletics") return ATHLETICS_EVENTS;
  if (s === "swimming")  return SWIMMING_EVENTS;
  return GENERIC_EVENTS;
}

// ── Storage key ───────────────────────────────────────────────────────────────

const LS_KEY = "gs_personal_bests";
const API     = process.env.NEXT_PUBLIC_API_URL ?? "";

function loadLocal(): PbEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveLocal(entries: PbEntry[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(entries)); } catch { /* ignore */ }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PersonalBestsPage() {
  const router = useRouter();
  const token  = useAuthStore((s) => s.token);
  const user   = useAuthStore((s) => s.user);
  const sport  = (user as { sport?: string } | null)?.sport ?? "athletics";

  const [entries,     setEntries]     = useState<PbEntry[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [openGroups,  setOpenGroups]  = useState<Record<string, boolean>>({});
  const [saving,      setSaving]      = useState(false);

  // Form state
  const [selEvent,    setSelEvent]    = useState("");
  const [selUnit,     setSelUnit]     = useState("");
  const [pbValue,     setPbValue]     = useState("");
  const [pbDate,      setPbDate]      = useState(new Date().toISOString().slice(0, 10));
  const [pbVenue,     setPbVenue]     = useState("");
  const [pbComp,      setPbComp]      = useState("");

  const eventGroups = getEventGroups(sport);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    if (!token) { setEntries(loadLocal()); setLoading(false); return; }
    fetch(`${API}/player/personal-bests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.data) { setEntries(d.data); saveLocal(d.data); } else { setEntries(loadLocal()); } })
      .catch(() => setEntries(loadLocal()))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selEvent || !pbValue) return;
    setSaving(true);
    const entry: PbEntry = {
      id:         crypto.randomUUID(),
      event:      selEvent,
      value:      pbValue,
      unit:       selUnit,
      date:       pbDate,
      venue:      pbVenue || undefined,
      competition: pbComp || undefined,
      created_at: new Date().toISOString(),
    };
    const updated = [entry, ...entries];
    saveLocal(updated);
    setEntries(updated);

    if (token) {
      fetch(`${API}/player/personal-bests`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify(entry),
      }).catch(() => { /* already saved locally */ });
    }

    // Reset form
    setSelEvent(""); setSelUnit(""); setPbValue(""); setPbVenue(""); setPbComp("");
    setShowForm(false);
    setSaving(false);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    saveLocal(updated);
    setEntries(updated);
    if (token) {
      fetch(`${API}/player/personal-bests/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => { /* ignore */ });
    }
  };

  const toggleGroup = (group: string) =>
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));

  // Best PB per event
  const bestPerEvent = entries.reduce<Record<string, PbEntry>>((acc, e) => {
    if (!acc[e.event]) { acc[e.event] = e; }
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: "#1a5c2a", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>Personal Bests</div>
          <div style={{ color: "#a7d4a7", fontSize: 12 }}>
            {sport.charAt(0).toUpperCase() + sport.slice(1)} · {Object.keys(bestPerEvent).length} event{Object.keys(bestPerEvent).length !== 1 ? "s" : ""} recorded
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            marginLeft: "auto", background: "#c8962a", border: "none", borderRadius: 8,
            color: "#fff", padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13,
          }}
        >
          <Plus size={16} /> Add PB
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 0" }}>

        {/* Add form */}
        {showForm && (
          <div style={{ background: "#fff", borderRadius: 12, padding: 18, marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#1a5c2a" }}>Log a Personal Best</div>

            {/* Event picker by group */}
            {eventGroups.map(g => (
              <div key={g.group} style={{ marginBottom: 8 }}>
                <button
                  onClick={() => toggleGroup(g.group)}
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1px solid #d1fae5", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#1a5c2a" }}
                >
                  {g.group}
                  {openGroups[g.group] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {openGroups[g.group] && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, paddingLeft: 4 }}>
                    {g.events.map(ev => (
                      <button
                        key={ev.label}
                        onClick={() => { setSelEvent(ev.label); setSelUnit(ev.unit); }}
                        style={{
                          padding: "5px 11px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          background: selEvent === ev.label ? "#1a5c2a" : "#fff",
                          color: selEvent === ev.label ? "#fff" : "#374151",
                          border: `1px solid ${selEvent === ev.label ? "#1a5c2a" : "#d1d5db"}`,
                        }}
                      >
                        {ev.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {selEvent && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                    {selUnit === "s" ? "Time" : selUnit === "m" ? "Distance / Height" : "Result"} {selUnit ? `(${selUnit})` : ""}
                  </label>
                  <input
                    type="text"
                    value={pbValue}
                    onChange={e => setPbValue(e.target.value)}
                    placeholder={eventGroups.flatMap(g => g.events).find(ev => ev.label === selEvent)?.placeholder ?? ""}
                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Date achieved</label>
                    <input
                      type="date"
                      value={pbDate}
                      onChange={e => setPbDate(e.target.value)}
                      style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 10px", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Venue (optional)</label>
                    <input
                      type="text"
                      value={pbVenue}
                      onChange={e => setPbVenue(e.target.value)}
                      placeholder="Stadium / pool name"
                      style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 10px", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Competition (optional)</label>
                  <input
                    type="text"
                    value={pbComp}
                    onChange={e => setPbComp(e.target.value)}
                    placeholder="NASH Championships, club trial, etc."
                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={handleSave}
                    disabled={!pbValue || saving}
                    style={{ flex: 1, background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: !pbValue || saving ? 0.5 : 1 }}
                  >
                    {saving ? "Saving…" : "Save PB"}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setSelEvent(""); setPbValue(""); }}
                    style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PB list */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 12, padding: "32px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <Trophy size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "#374151", marginBottom: 6 }}>No personal bests yet</div>
            <div style={{ color: "#9ca3af", fontSize: 13 }}>Tap &quot;Add PB&quot; to log your first record.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Best per event summary */}
            <div style={{ fontWeight: 700, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
              Current Bests
            </div>
            {Object.values(bestPerEvent).map(e => (
              <div
                key={e.id}
                style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{e.event}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {e.date} {e.competition ? `· ${e.competition}` : ""} {e.venue ? `· ${e.venue}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "#1a5c2a" }}>
                    {e.value}{e.unit ? <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginLeft: 2 }}>{e.unit}</span> : null}
                  </div>
                  <button
                    onClick={() => handleDelete(e.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 4 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}

            {/* Full history if multiple entries */}
            {entries.length > Object.keys(bestPerEvent).length && (
              <>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 8, marginBottom: 2 }}>
                  Full History
                </div>
                {entries.map(e => (
                  <div
                    key={e.id}
                    style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>{e.event}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{e.date}{e.venue ? ` · ${e.venue}` : ""}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#1a5c2a" }}>
                        {e.value}{e.unit ? <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 1 }}>{e.unit}</span> : null}
                      </div>
                      <button onClick={() => handleDelete(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
