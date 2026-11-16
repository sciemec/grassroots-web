"use client";
// src/app/player/personal-bests/page.tsx
// Personal bests tracker — primarily for athletics and swimming.
// Other sports see a generic milestone-style PB list.
//
// Storage contract:
//   gs_personal_bests_<userId>  — confirmed API entries (cache only)
//   gs_pb_pending_<userId>      — entries not yet uploaded (offline queue)
//
// Both keys are cleared on logout (prevUserIdRef tracks the outgoing userId).
// Pending entries are only synced when the SAME user is logged in.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trophy, Trash2, ChevronDown, ChevronUp, WifiOff, AlertCircle, Link2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ── Types ────────────────────────────────────────────────────────────────────

interface PbEntry {
  id:             string;
  event:          string;
  value:          string;   // time (e.g. "10.52") or distance/height (e.g. "7.45m")
  unit:           string;   // "s", "m", "kg" etc.
  date:           string;   // YYYY-MM-DD
  venue?:         string;
  competition?:   string;
  notes?:         string;
  arena_post_id?: string;   // optional Arena post attached as evidence
  created_at:     string;
}

interface ArenaPost {
  id:         string;
  body:       string;
  post_type:  string;
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
      { label: "50m Backstroke",         unit: "s", placeholder: "30.00" },
      { label: "100m Backstroke",        unit: "s", placeholder: "1:05.00" },
      { label: "50m Breaststroke",       unit: "s", placeholder: "32.00" },
      { label: "100m Breaststroke",      unit: "s", placeholder: "1:10.00" },
      { label: "50m Butterfly",          unit: "s", placeholder: "28.00" },
      { label: "100m Butterfly",         unit: "s", placeholder: "1:01.00" },
      { label: "200m Individual Medley", unit: "s", placeholder: "2:20.00" },
      { label: "400m Individual Medley", unit: "s", placeholder: "5:00.00" },
    ],
  },
];

const GENERIC_EVENTS: EventGroup[] = [
  {
    group: "Personal Records",
    events: [
      { label: "Best Performance",   unit: "",  placeholder: "e.g. 25 points, 5 wickets, 3 tries" },
      { label: "Season High",        unit: "",  placeholder: "describe the achievement" },
      { label: "Competition Record", unit: "",  placeholder: "describe the achievement" },
    ],
  },
];

function getEventGroups(sport: string): EventGroup[] {
  const s = sport?.toLowerCase();
  if (s === "athletics") return ATHLETICS_EVENTS;
  if (s === "swimming")  return SWIMMING_EVENTS;
  return GENERIC_EVENTS;
}

// ── localStorage helpers (per-user, never cross-user) ─────────────────────────

function cacheKey(userId: string)   { return `gs_personal_bests_${userId}`; }
function pendingKey(userId: string) { return `gs_pb_pending_${userId}`; }

function readCache(userId: string): PbEntry[] {
  try { return JSON.parse(localStorage.getItem(cacheKey(userId)) ?? "[]"); } catch { return []; }
}
function writeCache(userId: string, entries: PbEntry[]) {
  try { localStorage.setItem(cacheKey(userId), JSON.stringify(entries)); } catch { /* storage full */ }
}

function readPending(userId: string): PbEntry[] {
  try { return JSON.parse(localStorage.getItem(pendingKey(userId)) ?? "[]"); } catch { return []; }
}
function writePending(userId: string, items: PbEntry[]) {
  try { localStorage.setItem(pendingKey(userId), JSON.stringify(items)); } catch { /* storage full */ }
}

function clearUserStorage(userId: string) {
  try {
    localStorage.removeItem(cacheKey(userId));
    localStorage.removeItem(pendingKey(userId));
  } catch { /* ignore */ }
}

// ── Page ─────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function PersonalBestsPage() {
  const router = useRouter();
  const token  = useAuthStore((s) => s.token);
  const user   = useAuthStore((s) => s.user);

  const userId = (user as { id?: string } | null)?.id ?? "";
  const sport  = (user as { sport?: string } | null)?.sport ?? "athletics";

  // Track previous userId to clear storage on logout
  const prevUserIdRef = useRef<string>("");

  const [entries,    setEntries]    = useState<PbEntry[]>([]);
  const [pending,    setPending]    = useState<PbEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const [syncing,    setSyncing]    = useState(false);

  // Form state
  const [selEvent,     setSelEvent]     = useState("");
  const [selUnit,      setSelUnit]      = useState("");
  const [pbValue,      setPbValue]      = useState("");
  const [pbDate,       setPbDate]       = useState(new Date().toISOString().slice(0, 10));
  const [pbVenue,      setPbVenue]      = useState("");
  const [pbComp,       setPbComp]       = useState("");
  const [selArenaPost, setSelArenaPost] = useState<string | null>(null);

  // Arena post picker
  const [arenaPosts,      setArenaPosts]      = useState<ArenaPost[]>([]);
  const [showArenaPicker, setShowArenaPicker] = useState(false);

  const eventGroups = getEventGroups(sport);

  // ── Fetch recent Arena posts when form opens ───────────────────────────────
  useEffect(() => {
    if (!showForm || !token || arenaPosts.length > 0) return;
    fetch(`${API}/arena/feed`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then((d: { data?: ArenaPost[] } | null) => {
        // Filter to current user's own posts only (body > 0, limit 20)
        const posts = (d?.data ?? []).slice(0, 20);
        setArenaPosts(posts);
      })
      .catch(() => { /* picker stays empty — non-critical */ });
  }, [showForm, token, arenaPosts.length]);

  // ── Clear storage on logout ────────────────────────────────────────────────
  useEffect(() => {
    if (!userId && prevUserIdRef.current) {
      clearUserStorage(prevUserIdRef.current);
      setEntries([]);
      setPending([]);
    }
    prevUserIdRef.current = userId;
  }, [userId]);

  // ── Drain pending queue (runs after successful API load) ──────────────────
  const drainPending = async (currentToken: string, currentUserId: string) => {
    const queue = readPending(currentUserId);
    if (queue.length === 0) return;

    setSyncing(true);
    const stillPending: PbEntry[] = [];

    for (const item of queue) {
      try {
        const res = await fetch(`${API}/player/personal-bests`, {
          method:  "POST",
          headers: { Authorization: `Bearer ${currentToken}`, "Content-Type": "application/json" },
          body:    JSON.stringify(item),
        });
        if (!res.ok) stillPending.push(item);
      } catch {
        stillPending.push(item);
      }
    }

    writePending(currentUserId, stillPending);
    setPending(stillPending);
    setSyncing(false);
  };

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !userId) {
      setEntries([]);
      setPending([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(false);

    // Show pending queue immediately so user sees their offline entries
    setPending(readPending(userId));

    fetch(`${API}/player/personal-bests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((d: { data?: PbEntry[] }) => {
        const confirmed = d?.data ?? [];
        setEntries(confirmed);
        writeCache(userId, confirmed);
        // Drain pending queue now that we have a live connection
        return drainPending(token, userId);
      })
      .catch(() => {
        // Network down or server error — show cached data
        setEntries(readCache(userId));
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId]);

  // ── Save — API primary ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selEvent || !pbValue || !token || !userId) return;

    setSaving(true);
    setSaveError(null);

    const entry: PbEntry = {
      id:             crypto.randomUUID(),
      event:          selEvent,
      value:          pbValue,
      unit:           selUnit,
      date:           pbDate,
      venue:          pbVenue || undefined,
      competition:    pbComp  || undefined,
      arena_post_id:  selArenaPost ?? undefined,
      created_at:     new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API}/player/personal-bests`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify(entry),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? `Server error ${res.status}`);
      }

      // Success — add to confirmed list and refresh cache
      const updated = [entry, ...entries];
      setEntries(updated);
      writeCache(userId, updated);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";

      if (msg.includes("Network") || msg.includes("fetch") || msg.includes("Failed")) {
        // Offline — queue for later retry
        const queue = [...readPending(userId), entry];
        writePending(userId, queue);
        setPending(queue);
        // Don't show saveError — pending badge is the visible indicator
      } else {
        setSaveError(msg);
        return; // Keep form open so user can correct the input
      }
    } finally {
      setSaving(false);
    }

    // Reset form on success or offline-queue
    setSelEvent(""); setSelUnit(""); setPbValue(""); setPbVenue(""); setPbComp("");
    setSelArenaPost(null); setShowArenaPicker(false);
    setShowForm(false);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    // Check if it's a pending entry first
    const inPending = pending.some(e => e.id === id);
    if (inPending) {
      const updatedPending = pending.filter(e => e.id !== id);
      writePending(userId, updatedPending);
      setPending(updatedPending);
      return;
    }

    // Optimistic remove from confirmed list
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    writeCache(userId, updated);

    if (!token) return;

    try {
      const res = await fetch(`${API}/player/personal-bests/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 404) {
        // Restore on failure (not a 404 — 404 means already gone, which is fine)
        setEntries(entries);
        writeCache(userId, entries);
        setSaveError("Could not delete — please try again.");
      }
    } catch {
      // Network error — restore
      setEntries(entries);
      writeCache(userId, entries);
      setSaveError("Could not delete — no connection.");
    }
  };

  const toggleGroup = (group: string) =>
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));

  // Best PB per event (confirmed entries only — pending shown separately)
  const bestPerEvent = entries.reduce<Record<string, PbEntry>>((acc, e) => {
    if (!acc[e.event]) { acc[e.event] = e; }
    return acc;
  }, {});

  const totalEvents = Object.keys(bestPerEvent).length;
  const hasPending  = pending.length > 0;

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
            {sport.charAt(0).toUpperCase() + sport.slice(1)} · {totalEvents} event{totalEvents !== 1 ? "s" : ""} recorded
            {hasPending && ` · ${pending.length} pending`}
            {syncing && " · syncing…"}
          </div>
        </div>
        {userId && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              marginLeft: "auto", background: "#c8962a", border: "none", borderRadius: 8,
              color: "#fff", padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13,
            }}
          >
            <Plus size={16} /> Add PB
          </button>
        )}
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 0" }}>

        {/* Not signed in */}
        {!userId && !loading && (
          <div style={{ background: "#fff", borderRadius: 12, padding: "24px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <Trophy size={36} color="#d1d5db" style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "#374151", marginBottom: 6 }}>Sign in to track your personal bests</div>
            <div style={{ color: "#9ca3af", fontSize: 13 }}>Your PBs are saved to your account so they&apos;re always with you.</div>
          </div>
        )}

        {/* Load error banner */}
        {loadError && !loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#92400e" }}>
            <WifiOff size={15} />
            <span>Showing cached data — could not reach server.</span>
          </div>
        )}

        {/* Save error banner */}
        {saveError && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#991b1b" }}>
            <AlertCircle size={15} />
            <span>{saveError}</span>
            <button onClick={() => setSaveError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#991b1b", fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* Pending queue notice */}
        {hasPending && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#1d4ed8" }}>
            <WifiOff size={15} />
            <span>{pending.length} PB{pending.length !== 1 ? "s" : ""} not yet saved — will retry when connected.</span>
          </div>
        )}

        {/* Add form */}
        {showForm && userId && (
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
                          color:      selEvent === ev.label ? "#fff" : "#374151",
                          border:     `1px solid ${selEvent === ev.label ? "#1a5c2a" : "#d1d5db"}`,
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

                {/* Arena post picker — optional evidence link */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowArenaPicker(v => !v)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid #d1d5db", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", width: "100%" }}
                  >
                    <Link2 size={14} />
                    {selArenaPost
                      ? `Linked: ${(arenaPosts.find(p => p.id === selArenaPost)?.body ?? "Post").slice(0, 40)}…`
                      : "Link Arena post as evidence (optional)"}
                    {showArenaPicker ? <ChevronUp size={14} style={{ marginLeft: "auto" }} /> : <ChevronDown size={14} style={{ marginLeft: "auto" }} />}
                  </button>

                  {showArenaPicker && (
                    <div style={{ marginTop: 6, border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
                      {arenaPosts.length === 0 ? (
                        <div style={{ padding: "12px 14px", fontSize: 13, color: "#9ca3af" }}>No Arena posts found.</div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => { setSelArenaPost(null); setShowArenaPicker(false); }}
                            style={{ width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, background: selArenaPost === null ? "#f0fdf4" : "#fff", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer", color: "#374151", fontWeight: 500 }}
                          >
                            None
                          </button>
                          {arenaPosts.map(post => (
                            <button
                              key={post.id}
                              type="button"
                              onClick={() => { setSelArenaPost(post.id); setShowArenaPicker(false); }}
                              style={{ width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, background: selArenaPost === post.id ? "#f0fdf4" : "#fff", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer", color: "#374151" }}
                            >
                              <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {post.body.slice(0, 60)}{post.body.length > 60 ? "…" : ""}
                              </div>
                              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                                {post.post_type} · {post.created_at.slice(0, 10)}
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {saveError && (
                  <div style={{ fontSize: 13, color: "#991b1b", background: "#fee2e2", borderRadius: 8, padding: "8px 12px" }}>
                    {saveError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={handleSave}
                    disabled={!pbValue || saving}
                    style={{ flex: 1, background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: !pbValue || saving ? 0.5 : 1 }}
                  >
                    {saving ? "Saving…" : "Save PB"}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setSelEvent(""); setPbValue(""); setSaveError(null); setSelArenaPost(null); setShowArenaPicker(false); }}
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
        ) : !userId ? null : entries.length === 0 && pending.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 12, padding: "32px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <Trophy size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "#374151", marginBottom: 6 }}>No personal bests yet</div>
            <div style={{ color: "#9ca3af", fontSize: 13 }}>Tap &quot;Add PB&quot; to log your first record.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Pending entries */}
            {pending.length > 0 && (
              <>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
                  Not yet saved
                </div>
                {pending.map(e => (
                  <div
                    key={e.id}
                    style={{ background: "#eff6ff", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #bfdbfe" }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{e.event}</span>
                        <span style={{ fontSize: 11, background: "#dbeafe", color: "#1d4ed8", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>⏳ Pending</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                        {e.date} {e.competition ? `· ${e.competition}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: "#1d4ed8" }}>
                        {e.value}{e.unit ? <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginLeft: 2 }}>{e.unit}</span> : null}
                      </div>
                      <button
                        onClick={() => handleDelete(e.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#93c5fd", padding: 4 }}
                        title="Remove from pending queue"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Confirmed bests */}
            {entries.length > 0 && (
              <>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2, marginTop: pending.length > 0 ? 8 : 0 }}>
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

                {/* Full history if multiple entries per event */}
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
