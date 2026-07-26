"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { ArrowLeft, UserCheck, UserX, Shirt, MapPin, MessageCircle, Users } from "lucide-react";

interface Invitation {
  id: string;
  position: string;
  shirt_no: number;
  message: string | null;
  created_at: string;
  coach: {
    id: string;
    name: string;
    first_name: string | null;
    surname: string | null;
  } | null;
}

type ActionState = { [id: string]: "accepting" | "declining" | "done" };

export default function PlayerInvitationsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actions, setActions] = useState<ActionState>({});
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const api = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchInvitations() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${api}/player/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load invitations");
      const json = await res.json();
      setInvitations(Array.isArray(json.data) ? json.data : []);
    } catch {
      setError("Could not load invitations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function respond(id: string, action: "accept" | "decline") {
    setActions((prev) => ({ ...prev, [id]: action === "accept" ? "accepting" : "declining" }));
    try {
      const res = await fetch(`${api}/player/invitations/${id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Request failed");
      setActions((prev) => ({ ...prev, [id]: "done" }));
      showToast(
        action === "accept" ? "You have joined the squad!" : "Invitation declined.",
        action === "accept" ? "success" : "error"
      );
      // Remove the invitation from the list after a short delay
      setTimeout(() => {
        setInvitations((prev) => prev.filter((inv) => inv.id !== id));
        setActions((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      showToast(msg, "error");
      setActions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function coachDisplayName(coach: Invitation["coach"]) {
    if (!coach) return "Unknown Coach";
    if (coach.first_name && coach.surname) return `${coach.first_name} ${coach.surname}`;
    return coach.name || "Unknown Coach";
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  const active = invitations.filter((inv) => actions[inv.id] !== "done");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e5e5",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#1a5c2a", padding: 4, display: "flex" }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Squad Invitations</h1>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
              {loading ? "Loading..." : `${active.length} pending`}
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 72,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: toast.type === "success" ? "#1a5c2a" : "#dc2626",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            whiteSpace: "nowrap",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>
        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 20,
                  border: "1px solid #e5e5e5",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                <div style={{ height: 16, width: "60%", backgroundColor: "#e5e5e5", borderRadius: 4, marginBottom: 10 }} />
                <div style={{ height: 12, width: "40%", backgroundColor: "#f0f0f0", borderRadius: 4, marginBottom: 16 }} />
                <div style={{ height: 36, backgroundColor: "#f0f0f0", borderRadius: 8 }} />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "16px 20px",
              color: "#dc2626",
              fontSize: 14,
            }}
          >
            {error}
            <button
              onClick={fetchInvitations}
              style={{
                display: "block",
                marginTop: 10,
                backgroundColor: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "8px 16px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && active.length === 0 && (
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: "48px 24px",
              textAlign: "center",
              border: "1px solid #e5e5e5",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "#f0fdf4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Users size={28} color="#1a5c2a" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", margin: "0 0 8px" }}>No pending invitations</h3>
            <p style={{ fontSize: 14, color: "#666", margin: 0, lineHeight: 1.5 }}>
              When a coach invites you to join their squad, it will appear here.
            </p>
          </div>
        )}

        {/* Invitation cards */}
        {!loading && !error && active.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {active.map((inv) => {
              const busy = actions[inv.id] === "accepting" || actions[inv.id] === "declining";
              return (
                <div
                  key={inv.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 14,
                    border: "1px solid #e5e5e5",
                    overflow: "hidden",
                    opacity: busy ? 0.7 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {/* Green accent bar */}
                  <div style={{ height: 4, backgroundColor: "#1a5c2a" }} />

                  <div style={{ padding: "18px 18px 16px" }}>
                    {/* Coach name + time */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#1a5c2a", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 3px" }}>
                          Squad Invitation
                        </p>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
                          {coachDisplayName(inv.coach)}
                        </h3>
                      </div>
                      <span style={{ fontSize: 12, color: "#999", whiteSpace: "nowrap", marginLeft: 8 }}>
                        {timeAgo(inv.created_at)}
                      </span>
                    </div>

                    {/* Position + shirt */}
                    <div style={{ display: "flex", gap: 10, marginBottom: inv.message ? 12 : 16 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          backgroundColor: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: 20,
                          padding: "5px 12px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#1a5c2a",
                        }}
                      >
                        <MapPin size={12} />
                        {inv.position}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          backgroundColor: "#fafafa",
                          border: "1px solid #e5e5e5",
                          borderRadius: 20,
                          padding: "5px 12px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#555",
                        }}
                      >
                        <Shirt size={12} />
                        #{inv.shirt_no}
                      </div>
                    </div>

                    {/* Optional message */}
                    {inv.message && (
                      <div
                        style={{
                          backgroundColor: "#fafafa",
                          border: "1px solid #ebebeb",
                          borderRadius: 8,
                          padding: "10px 12px",
                          marginBottom: 16,
                          display: "flex",
                          gap: 8,
                          alignItems: "flex-start",
                        }}
                      >
                        <MessageCircle size={14} color="#999" style={{ marginTop: 1, flexShrink: 0 }} />
                        <p style={{ fontSize: 13, color: "#444", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                          &ldquo;{inv.message}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => respond(inv.id, "accept")}
                        disabled={busy}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 7,
                          backgroundColor: busy && actions[inv.id] === "accepting" ? "#15803d" : "#1a5c2a",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "12px 16px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: busy ? "not-allowed" : "pointer",
                          transition: "background-color 0.15s",
                        }}
                      >
                        <UserCheck size={16} />
                        {actions[inv.id] === "accepting" ? "Joining..." : "Accept"}
                      </button>
                      <button
                        onClick={() => respond(inv.id, "decline")}
                        disabled={busy}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 7,
                          backgroundColor: "#fff",
                          color: "#dc2626",
                          border: "2px solid #fecaca",
                          borderRadius: 8,
                          padding: "12px 16px",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: busy ? "not-allowed" : "pointer",
                          transition: "border-color 0.15s",
                        }}
                      >
                        <UserX size={16} />
                        {actions[inv.id] === "declining" ? "Declining..." : "Decline"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
