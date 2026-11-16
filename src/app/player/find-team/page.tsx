"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL;

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface TalentPosting {
  id: string;
  title: string;
  sport: string;
  position: string;
  province: string;
  age_min?: number;
  age_max?: number;
  tier: string;
  description: string;
  status: "open" | "closed";
  poster_name: string;
  application_count: number;
  has_applied: boolean;
  created_at: string;
}

interface Club {
  id: string;
  name: string;
  sport: string;
  province: string;
  tier: string;
  member_count: number;
  is_member: boolean;
  description?: string;
  open_for_trials: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SPORTS = [
  "Football", "Rugby", "Netball", "Basketball",
  "Cricket", "Athletics", "Swimming", "Tennis", "Volleyball", "Hockey",
];
const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Trial card ─────────────────────────────────────────────────────────────────

function TrialCard({ posting, token }: { posting: TalentPosting; token: string }) {
  const [applied,   setApplied]  = useState(posting.has_applied);
  const [applying,  setApplying] = useState(false);
  const [showNote,  setShowNote] = useState(false);
  const [note,      setNote]     = useState("");

  const apply = async () => {
    setApplying(true);
    try {
      const res = await fetch(`${API}/arena/talent-wanted/${posting.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cover_note: note }),
      });
      if (res.ok) { setApplied(true); setShowNote(false); }
    } catch {}
    setApplying(false);
  };

  const age = [posting.age_min, posting.age_max].filter(Boolean).join("–");

  return (
    <div
      style={{
        background: "#151515",
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 10,
        border: "1px solid #2a2a2a",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#fff", fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>
            {posting.title}
          </div>
          <div style={{ color: "#777", fontSize: 11.5, marginTop: 4, display: "flex", flexWrap: "wrap", gap: "4px 8px" }}>
            <span style={{ textTransform: "capitalize" }}>{posting.sport}</span>
            <span>·</span>
            <span>{posting.position}</span>
            {age && <><span>·</span><span>Age {age}</span></>}
            <span>·</span>
            <span>{posting.province}</span>
          </div>
        </div>
        <div style={{ color: "#555", fontSize: 11, flexShrink: 0 }}>{timeAgo(posting.created_at)}</div>
      </div>

      {/* Tier badge */}
      <div style={{ marginTop: 8 }}>
        <span
          style={{
            background: "#1e3a28",
            color: "#6db88a",
            fontSize: 10.5,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 20,
            textTransform: "capitalize",
          }}
        >
          {posting.tier || "Grassroots"}
        </span>
        {posting.application_count > 0 && (
          <span style={{ color: "#555", fontSize: 11, marginLeft: 8 }}>
            {posting.application_count} applied
          </span>
        )}
      </div>

      {/* Description */}
      {posting.description && (
        <div style={{ color: "#aaa", fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
          {posting.description.length > 120
            ? posting.description.slice(0, 120) + "…"
            : posting.description}
        </div>
      )}

      {/* Posted by */}
      <div style={{ color: "#555", fontSize: 11, marginTop: 8 }}>
        Posted by {posting.poster_name}
      </div>

      {/* Apply */}
      {applied ? (
        <div
          style={{
            marginTop: 10,
            background: "#1e3a28",
            color: "#4ade80",
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 8,
            padding: "7px 14px",
            textAlign: "center",
          }}
        >
          Applied
        </div>
      ) : showNote ? (
        <div style={{ marginTop: 10 }}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a short note (optional)..."
            rows={2}
            style={{
              width: "100%",
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: 8,
              color: "#fff",
              fontSize: 12,
              padding: "8px 10px",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button
              onClick={apply}
              disabled={applying}
              style={{
                flex: 1,
                background: "#c8962a",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                borderRadius: 8,
                padding: "8px",
                cursor: applying ? "not-allowed" : "pointer",
                opacity: applying ? 0.6 : 1,
              }}
            >
              {applying ? "Sending..." : "Send Application"}
            </button>
            <button
              onClick={() => setShowNote(false)}
              style={{
                background: "#2a2a2a",
                color: "#aaa",
                fontSize: 12,
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNote(true)}
          style={{
            marginTop: 10,
            width: "100%",
            background: "#c8962a",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            border: "none",
            borderRadius: 8,
            padding: "8px",
            cursor: "pointer",
          }}
        >
          Apply for this position
        </button>
      )}
    </div>
  );
}

// ── Club card ──────────────────────────────────────────────────────────────────

function ClubCard({ club, token }: { club: Club; token: string }) {
  const [joined,  setJoined]  = useState(club.is_member);
  const [joining, setJoining] = useState(false);

  const initials = club.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const join = async () => {
    setJoining(true);
    try {
      const res = await fetch(`${API}/arena/clubs/${club.id}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setJoined(true);
    } catch {}
    setJoining(false);
  };

  return (
    <div
      style={{
        background: "#151515",
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 10,
        border: "1px solid #2a2a2a",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#1a3a28",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6db88a",
          fontSize: 14,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ color: "#fff", fontSize: 13.5, fontWeight: 600 }}>{club.name}</span>
          {club.open_for_trials && (
            <span
              style={{
                background: "#1e3a28",
                color: "#4ade80",
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: 10,
              }}
            >
              Trials open
            </span>
          )}
        </div>
        <div style={{ color: "#777", fontSize: 11.5, marginTop: 3, display: "flex", gap: "4px 8px", flexWrap: "wrap" }}>
          <span style={{ textTransform: "capitalize" }}>{club.sport}</span>
          <span>·</span>
          <span>{club.province}</span>
          {club.tier && <><span>·</span><span style={{ textTransform: "capitalize" }}>{club.tier}</span></>}
          <span>·</span>
          <span>{club.member_count} members</span>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={join}
        disabled={joined || joining}
        style={{
          flexShrink: 0,
          background: joined ? "#1e3a28" : "#1a5c2a",
          color: joined ? "#4ade80" : "#fff",
          fontSize: 11.5,
          fontWeight: 700,
          border: "none",
          borderRadius: 8,
          padding: "7px 12px",
          cursor: joined || joining ? "default" : "pointer",
          opacity: joining ? 0.6 : 1,
        }}
      >
        {joined ? "Joined" : joining ? "..." : "Join"}
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type Tab = "trials" | "clubs";

export default function FindTeamPage() {
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [tab,          setTab]          = useState<Tab>("trials");
  const [sport,        setSport]        = useState("");
  const [province,     setProvince]     = useState("");
  const [postings,     setPostings]     = useState<TalentPosting[]>([]);
  const [clubs,        setClubs]        = useState<Club[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [available,    setAvailable]    = useState(false);
  const [savingAvail,  setSavingAvail]  = useState(false);

  // Load open_for_scouting from profile
  useEffect(() => {
    if (!token) return;
    api.get("/profile").then((res) => {
      const prof = res.data?.profile ?? {};
      setAvailable(!!prof.open_for_scouting);
    }).catch(() => {});
  }, [token]);

  const fetchTrials = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "open" });
      if (sport)    params.set("sport",    sport);
      if (province) params.set("province", province);
      const res = await fetch(`${API}/arena/talent-wanted?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = res.ok ? await res.json() : {};
      setPostings(safeArray<TalentPosting>(json.data ?? json));
    } catch {
      setPostings([]);
    }
    setLoading(false);
  }, [token, sport, province]);

  const fetchClubs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sport)    params.set("sport",    sport);
      if (province) params.set("province", province);
      const res = await fetch(`${API}/arena/clubs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = res.ok ? await res.json() : {};
      setClubs(safeArray<Club>(json.data ?? json));
    } catch {
      setClubs([]);
    }
    setLoading(false);
  }, [token, sport, province]);

  useEffect(() => {
    if (!hasHydrated || !token) return;
    if (tab === "trials") fetchTrials();
    else fetchClubs();
  }, [tab, hasHydrated, token, fetchTrials, fetchClubs]);

  const toggleAvailable = async () => {
    setSavingAvail(true);
    const next = !available;
    try {
      await api.patch("/profile", { open_for_scouting: next });
      setAvailable(next);
    } catch {}
    setSavingAvail(false);
  };

  if (!hasHydrated) return null;

  const selectStyle: React.CSSProperties = {
    background: "#1e1e1e",
    border: "1px solid #333",
    color: "#fff",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 12,
    flex: 1,
    minWidth: 0,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ padding: "24px 16px 0", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Link href="/player" style={{ color: "#777", fontSize: 13, textDecoration: "none" }}>
            ← Player Hub
          </Link>
        </div>
        <div style={{ color: "#c8962a", fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
          Grassroots Sports
        </div>
        <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginTop: 2 }}>Find a Team</div>
        <div style={{ color: "#777", fontSize: 12, marginTop: 2 }}>
          Browse open trials and clubs across Zimbabwe
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* Available toggle */}
        <div
          style={{
            marginTop: 16,
            background: available ? "#1a3a28" : "#1a1a1a",
            border: `1px solid ${available ? "#2d6a42" : "#2a2a2a"}`,
            borderRadius: 12,
            padding: "11px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ color: available ? "#4ade80" : "#aaa", fontSize: 13, fontWeight: 600 }}>
              {available ? "Available for scouts & coaches" : "Mark yourself as available"}
            </div>
            <div style={{ color: available ? "#6db88a" : "#666", fontSize: 11.5, marginTop: 2 }}>
              {available
                ? "Your profile appears in coach searches and the talent database."
                : "Let coaches and scouts know you're looking for a team."}
            </div>
          </div>
          <button
            onClick={toggleAvailable}
            disabled={savingAvail}
            style={{
              flexShrink: 0,
              width: 44,
              height: 24,
              borderRadius: 12,
              background: available ? "#1a5c2a" : "#333",
              border: "none",
              cursor: savingAvail ? "default" : "pointer",
              position: "relative",
              transition: "background 0.2s",
              opacity: savingAvail ? 0.6 : 1,
            }}
            aria-label="Toggle availability"
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: available ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
            background: "#151515",
            borderRadius: 10,
            padding: 4,
          }}
        >
          {(["trials", "clubs"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                background: tab === t ? "#c8962a" : "transparent",
                color: tab === t ? "#fff" : "#777",
                border: "none",
                borderRadius: 7,
                padding: "8px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {t === "trials" ? "Open Trials" : "Clubs"}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            style={selectStyle}
          >
            <option value="">All sports</option>
            {SPORTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            style={selectStyle}
          >
            <option value="">All provinces</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div style={{ marginTop: 14 }}>
          {loading && (
            <div style={{ textAlign: "center", color: "#555", fontSize: 13, padding: "40px 0" }}>
              Loading...
            </div>
          )}

          {!loading && tab === "trials" && (
            postings.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#555",
                  fontSize: 13,
                  padding: "48px 24px",
                  background: "#151515",
                  borderRadius: 14,
                  border: "1px solid #2a2a2a",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>⚽</div>
                <div style={{ color: "#aaa", fontWeight: 600 }}>No open trials right now</div>
                <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                  Turn on availability above so coaches can find you.
                </div>
              </div>
            ) : (
              postings.map((p) => <TrialCard key={p.id} posting={p} token={token ?? ""} />)
            )
          )}

          {!loading && tab === "clubs" && (
            clubs.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#555",
                  fontSize: 13,
                  padding: "48px 24px",
                  background: "#151515",
                  borderRadius: 14,
                  border: "1px solid #2a2a2a",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>🏟️</div>
                <div style={{ color: "#aaa", fontWeight: 600 }}>No clubs found</div>
                <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                  Try a different sport or province filter.
                </div>
              </div>
            ) : (
              clubs.map((c) => <ClubCard key={c.id} club={c} token={token ?? ""} />)
            )
          )}
        </div>
      </div>
    </div>
  );
}
