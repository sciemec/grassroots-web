"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL;

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

// ── Types ──────────────────────────────────────────────────────────────────────

type JoinRequestStatus = "pending" | "approved" | "declined" | "withdrawn";

interface JoinRequest {
  id: string;
  club_id: string;
  club_name?: string;
  note: string | null;
  status: JoinRequestStatus;
  responded_at: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<JoinRequestStatus, {
  label: string; bg: string; color: string; border: string; desc: string;
}> = {
  pending:   { label: "Pending",   bg: "#1e2a1a", color: "#86efac", border: "#2d4a2a", desc: "Waiting for the coach to respond." },
  approved:  { label: "Approved",  bg: "#1a3a28", color: "#4ade80", border: "#2d6a42", desc: "You are now a member of this club!" },
  declined:  { label: "Declined",  bg: "#2a1a1a", color: "#f87171", border: "#4a2a2a", desc: "Your request was not accepted. You can re-apply." },
  withdrawn: { label: "Withdrawn", bg: "#1e1e1e", color: "#777",    border: "#2a2a2a", desc: "You withdrew this request." },
};

function timeAgoFull(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

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
  join_request_status?: "pending" | "approved" | "declined" | "withdrawn" | null;
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
        body: JSON.stringify({ message: note }),
      });
      if (res.ok) { setApplied(true); setShowNote(false); }
      else if (res.status === 409) { setApplied(true); setShowNote(false); }
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

type JoinState = "none" | "pending" | "approved" | "declined" | "withdrawn";

function initialJoinState(club: Club): JoinState {
  if (club.is_member) return "approved";
  if (club.join_request_status === "pending")   return "pending";
  if (club.join_request_status === "approved")  return "approved";
  if (club.join_request_status === "declined")  return "declined";
  if (club.join_request_status === "withdrawn") return "withdrawn";
  return "none";
}

function ClubCard({ club, token }: { club: Club; token: string }) {
  const [joinState, setJoinState] = useState<JoinState>(initialJoinState(club));
  const [joining,   setJoining]   = useState(false);
  const [showNote,  setShowNote]  = useState(false);
  const [note,      setNote]      = useState("");

  const initials = club.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const sendRequest = async () => {
    setJoining(true);
    try {
      const res = await fetch(`${API}/arena/clubs/${club.id}/join-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      if (res.ok || res.status === 409) {
        setJoinState("pending");
        setShowNote(false);
      }
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

      {/* Join button / state */}
      <div style={{ flexShrink: 0 }}>
        {joinState === "approved" ? (
          <span
            style={{
              background: "#1e3a28",
              color: "#4ade80",
              fontSize: 11.5,
              fontWeight: 700,
              borderRadius: 8,
              padding: "7px 12px",
              display: "inline-block",
            }}
          >
            Joined
          </span>
        ) : joinState === "pending" ? (
          <span
            style={{
              background: "#1e2a3a",
              color: "#60a5fa",
              fontSize: 11.5,
              fontWeight: 700,
              borderRadius: 8,
              padding: "7px 12px",
              display: "inline-block",
            }}
          >
            Requested
          </span>
        ) : showNote ? (
          <div style={{ width: 180 }}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Short note (optional)..."
              rows={2}
              style={{
                width: "100%",
                background: "#1e1e1e",
                border: "1px solid #333",
                borderRadius: 8,
                color: "#fff",
                fontSize: 11.5,
                padding: "6px 8px",
                resize: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button
                onClick={sendRequest}
                disabled={joining}
                style={{
                  flex: 1,
                  background: "#1a5c2a",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 7,
                  padding: "5px 0",
                  cursor: joining ? "not-allowed" : "pointer",
                  opacity: joining ? 0.6 : 1,
                }}
              >
                {joining ? "..." : "Send"}
              </button>
              <button
                onClick={() => setShowNote(false)}
                style={{
                  background: "#2a2a2a",
                  color: "#aaa",
                  fontSize: 11,
                  border: "none",
                  borderRadius: 7,
                  padding: "5px 10px",
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
              background: joinState === "declined" ? "#2a1a1a" : "#1a5c2a",
              color: joinState === "declined" ? "#f87171" : "#fff",
              fontSize: 11.5,
              fontWeight: 700,
              border: "none",
              borderRadius: 8,
              padding: "7px 12px",
              cursor: "pointer",
            }}
          >
            {joinState === "declined" ? "Re-apply" : "Join"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Request card ───────────────────────────────────────────────────────────────

function RequestCard({
  req,
  onWithdraw,
  acting = false,
}: {
  req: JoinRequest;
  onWithdraw?: () => void;
  acting?: boolean;
}) {
  const cfg = STATUS_CONFIG[req.status];
  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "#1a3a28",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#6db88a", fontSize: 11, fontWeight: 700,
            }}
          >
            {(req.club_name ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
              {req.club_name ?? "Unknown Club"}
            </div>
            <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>
              Submitted {timeAgoFull(req.created_at)}
            </div>
          </div>
        </div>
        <span
          style={{
            flexShrink: 0,
            background: "#0e0e0e",
            color: cfg.color,
            fontSize: 10.5,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 20,
            border: `1px solid ${cfg.border}`,
          }}
        >
          {cfg.label}
        </span>
      </div>

      <div style={{ color: "#777", fontSize: 11.5, marginTop: 8 }}>{cfg.desc}</div>

      {req.note && (
        <div
          style={{
            marginTop: 8, background: "#151515", borderRadius: 8,
            padding: "8px 10px", fontSize: 11.5, color: "#aaa",
          }}
        >
          &ldquo;{req.note}&rdquo;
        </div>
      )}

      {req.responded_at && (
        <div style={{ color: "#555", fontSize: 11, marginTop: 6 }}>
          Responded {timeAgoFull(req.responded_at)}
        </div>
      )}

      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
        {req.status === "pending" && onWithdraw && (
          <button
            onClick={onWithdraw}
            disabled={acting}
            style={{
              background: "#2a1a1a",
              color: "#f87171",
              border: "1px solid #4a2a2a",
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 600,
              padding: "5px 12px",
              cursor: acting ? "not-allowed" : "pointer",
              opacity: acting ? 0.5 : 1,
            }}
          >
            Withdraw
          </button>
        )}
        {req.status === "approved" && (
          <Link
            href={`/arena/clubs/${req.club_id}`}
            style={{
              background: "#1a5c2a",
              color: "#fff",
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 600,
              padding: "5px 12px",
              textDecoration: "none",
            }}
          >
            View Club
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type Tab = "trials" | "clubs" | "requests";

export default function FindTeamPage() {
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const searchParams = useSearchParams();

  const initialTab = ((searchParams?.get("tab") ?? "") as Tab) || "trials";
  const [tab,          setTab]          = useState<Tab>(initialTab);
  const [sport,        setSport]        = useState("");
  const [province,     setProvince]     = useState("");
  const [postings,     setPostings]     = useState<TalentPosting[]>([]);
  const [clubs,        setClubs]        = useState<Club[]>([]);
  const [requests,     setRequests]     = useState<JoinRequest[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [available,    setAvailable]    = useState(false);
  const [savingAvail,  setSavingAvail]  = useState(false);
  const [actionId,     setActionId]     = useState<string | null>(null);
  const [withdrawId,   setWithdrawId]   = useState<string | null>(null);

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

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/player/join-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = res.ok ? await res.json() : {};
      setRequests(safeArray<JoinRequest>(json.data ?? json));
    } catch {
      setRequests([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!hasHydrated || !token) return;
    if (tab === "trials")   fetchTrials();
    else if (tab === "clubs") fetchClubs();
    else fetchRequests();
  }, [tab, hasHydrated, token, fetchTrials, fetchClubs, fetchRequests]);

  const handleWithdraw = async (id: string) => {
    if (!token) return;
    setActionId(id);
    try {
      const res = await fetch(`${API}/arena/clubs/join-requests/${id}/withdraw`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: "withdrawn" as JoinRequestStatus, responded_at: new Date().toISOString() } : r
          )
        );
      }
    } catch {}
    setActionId(null);
    setWithdrawId(null);
  };

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

  const pending  = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const history  = requests.filter((r) => r.status === "declined" || r.status === "withdrawn");

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
            gap: 6,
            marginTop: 16,
            background: "#151515",
            borderRadius: 10,
            padding: 4,
          }}
        >
          {(["trials", "clubs", "requests"] as Tab[]).map((t) => {
            const labels: Record<Tab, string> = {
              trials: "Open Trials",
              clubs: "Clubs",
              requests: `My Requests${pending.length > 0 ? ` (${pending.length})` : ""}`,
            };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  background: tab === t ? "#c8962a" : "transparent",
                  color: tab === t ? "#fff" : "#777",
                  border: "none",
                  borderRadius: 7,
                  padding: "8px 4px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        {/* Filters — hidden on requests tab */}
        {tab !== "requests" && (
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
        )}

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

          {!loading && tab === "requests" && (
            requests.length === 0 ? (
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
                <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                <div style={{ color: "#aaa", fontWeight: 600 }}>No join requests yet</div>
                <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                  Browse clubs above and tap &ldquo;Join&rdquo; to get started.
                </div>
              </div>
            ) : (
              <>
                {pending.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: "#666", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      Awaiting Response · {pending.length}
                    </div>
                    {pending.map((r) => (
                      <RequestCard
                        key={r.id}
                        req={r}
                        onWithdraw={() => setWithdrawId(r.id)}
                        acting={actionId === r.id}
                      />
                    ))}
                  </div>
                )}
                {approved.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: "#666", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      Active Memberships · {approved.length}
                    </div>
                    {approved.map((r) => <RequestCard key={r.id} req={r} />)}
                  </div>
                )}
                {history.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: "#666", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      History · {history.length}
                    </div>
                    {history.map((r) => <RequestCard key={r.id} req={r} />)}
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>

      {/* Withdraw confirm modal */}
      {withdrawId && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            background: "rgba(0,0,0,0.6)", padding: 16,
          }}
        >
          <div
            style={{
              background: "#151515",
              border: "1px solid #2a2a2a",
              borderRadius: 20,
              width: "100%",
              maxWidth: 400,
              padding: "20px 20px 24px",
            }}
          >
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
              Withdraw this request?
            </div>
            <div style={{ color: "#777", fontSize: 12.5, marginBottom: 20 }}>
              The club coach will no longer see your request. You can re-apply any time.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setWithdrawId(null)}
                style={{
                  flex: 1, padding: "10px", borderRadius: 10,
                  background: "#1e1e1e", border: "1px solid #333",
                  color: "#aaa", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                Keep It
              </button>
              <button
                onClick={() => handleWithdraw(withdrawId)}
                style={{
                  flex: 1, padding: "10px", borderRadius: 10,
                  background: "#7f1d1d", border: "none",
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
