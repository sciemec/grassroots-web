"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

interface OrgStatus {
  status: "not_applied" | "pending" | "verified" | "suspended";
  org_id?:   string;
  org_name?: string;
  org_type?: string;
  applied_at?:  string;
  approved_at?: string;
  suspension_reason?: string;
}

interface Player {
  player_id:    string;
  age_group:    string;
  province:     string;
  sport:        string;
  position:     string;
  dominant_foot: string;
  height_cm:    number | null;
  overall_score: number | null;
  consented_at: string;
}

interface ContactRequest {
  id:               string;
  player_id:        string;
  reason:           string;
  status:           string;
  admin_reviewed_at?: string;
  guardian_responded_at?: string;
  guardian_response?: string;
  created_at:       string;
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  pending:           { label: "Pending Approval",  bg: "#fef9c3", color: "#854d0e" },
  verified:          { label: "Verified Partner",   bg: "#f0fdf4", color: "#15803d" },
  suspended:         { label: "Suspended",          bg: "#fef2f2", color: "#b91c1c" },
  not_applied:       { label: "Not Applied",        bg: "#f3f4f6", color: "#374151" },
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending_admin:    "Awaiting Admin Review",
  admin_approved:   "Admin Approved — Awaiting Guardian",
  admin_rejected:   "Rejected by Admin",
  guardian_approved: "Guardian Approved ✓",
  guardian_declined: "Guardian Declined",
  expired:          "Expired",
};

export default function PartnerDashboardPage() {
  const router = useRouter();
  const token  = useAuthStore((s) => s.token);

  const [orgStatus,   setOrgStatus]   = useState<OrgStatus | null>(null);
  const [players,     setPlayers]     = useState<Player[]>([]);
  const [requests,    setRequests]    = useState<ContactRequest[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<"players" | "requests">("players");
  const [filters,     setFilters]     = useState({ sport: "", province: "", position: "" });
  const [contactForm, setContactForm] = useState<{ playerId: string; reason: string } | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [feedback,    setFeedback]    = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    const load = async () => {
      try {
        const [statusRes] = await Promise.allSettled([
          fetch(`${apiBase}/partner/status`, { headers }),
        ]);
        if (statusRes.status === "fulfilled") {
          const data = await statusRes.value.json();
          setOrgStatus(data);
          if (data.status === "verified") {
            await Promise.all([loadPlayers(), loadRequests()]);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line

  const loadPlayers = async (overrideFilters?: typeof filters) => {
    const f = overrideFilters ?? filters;
    const qs = new URLSearchParams();
    if (f.sport)    qs.set("sport",    f.sport);
    if (f.province) qs.set("province", f.province);
    if (f.position) qs.set("position", f.position);
    const res = await fetch(`${apiBase}/partner/players?${qs}`, { headers });
    if (res.ok) {
      const data = await res.json();
      setPlayers(data.data ?? []);
    }
  };

  const loadRequests = async () => {
    const res = await fetch(`${apiBase}/partner/contact-requests`, { headers });
    if (res.ok) {
      const data = await res.json();
      setRequests(data.data ?? []);
    }
  };

  const submitContactRequest = async () => {
    if (!contactForm || contactForm.reason.length < 30) {
      setFeedback("Reason must be at least 30 characters.");
      return;
    }
    setSubmitting(true);
    setFeedback("");
    try {
      const res = await fetch(`${apiBase}/partner/contact-requests`, {
        method:  "POST",
        headers,
        body:    JSON.stringify({ player_id: contactForm.player_id, reason: contactForm.reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to submit.");
      setFeedback(data.message);
      setContactForm(null);
      await loadRequests();
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6b7280" }}>Loading…</p>
      </div>
    );
  }

  // Not applied yet
  if (!orgStatus || orgStatus.status === "not_applied") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: 520, margin: "4rem auto", textAlign: "center" }}>
          <h1 className="text-2xl font-bold mb-3" style={{ color: "#1a5c2a" }}>Partner Dashboard</h1>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
            You have not yet applied for Verified Partner status.
          </p>
          <button
            onClick={() => router.push("/partners/apply")}
            className="rounded-xl px-6 py-3 text-sm font-bold"
            style={{ background: "#1a5c2a", color: "#fff" }}
          >
            Apply Now
          </button>
        </div>
      </div>
    );
  }

  const badge = STATUS_LABELS[orgStatus.status] ?? STATUS_LABELS.not_applied;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", padding: "1.5rem 1rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Org header */}
        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: "#1a5c2a", color: "#fff" }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold">{orgStatus.org_name ?? "Your Organisation"}</h1>
              <p className="text-sm opacity-75 capitalize">{orgStatus.org_type}</p>
            </div>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          </div>
          {orgStatus.approved_at && (
            <p className="text-xs mt-2 opacity-60">
              Approved {new Date(orgStatus.approved_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Pending state */}
        {orgStatus.status === "pending" && (
          <div
            className="rounded-xl p-5 text-sm"
            style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}
          >
            <strong>Your application is under review.</strong> An admin will assess your
            organisation within 3 business days. You will be notified once a decision is made.
          </div>
        )}

        {/* Suspended state */}
        {orgStatus.status === "suspended" && (
          <div
            className="rounded-xl p-5 text-sm"
            style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c" }}
          >
            <strong>Your organisation has been suspended.</strong>
            {orgStatus.suspension_reason && (
              <p className="mt-1">Reason: {orgStatus.suspension_reason}</p>
            )}
            <p className="mt-1">Contact support@grassrootssports.live if you believe this is an error.</p>
          </div>
        )}

        {/* Verified — full dashboard */}
        {orgStatus.status === "verified" && (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {(["players", "requests"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: tab === t ? "#1a5c2a" : "#fff",
                    color:      tab === t ? "#fff"    : "#374151",
                    border:     "1px solid #e5e7eb",
                  }}
                >
                  {t === "players" ? "Consented Players" : `Contact Requests (${requests.length})`}
                </button>
              ))}
            </div>

            {/* Feedback banner */}
            {feedback && (
              <div
                className="rounded-xl p-3 mb-4 text-sm"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" }}
              >
                {feedback}
              </div>
            )}

            {/* Players tab */}
            {tab === "players" && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { key: "sport",    placeholder: "Sport" },
                    { key: "province", placeholder: "Province" },
                    { key: "position", placeholder: "Position" },
                  ].map(({ key, placeholder }) => (
                    <input
                      key={key}
                      type="text"
                      placeholder={placeholder}
                      value={filters[key as keyof typeof filters]}
                      onChange={(e) => {
                        const updated = { ...filters, [key]: e.target.value };
                        setFilters(updated);
                        loadPlayers(updated);
                      }}
                      className="rounded-lg border px-3 py-2 text-sm focus:outline-none"
                      style={{ borderColor: "#d1d5db", background: "#fff", width: 120 }}
                    />
                  ))}
                </div>

                {players.length === 0 ? (
                  <div
                    className="rounded-xl p-8 text-center text-sm"
                    style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#6b7280" }}
                  >
                    No consented players yet. Players must grant your organisation visibility
                    consent through their guardian settings before they appear here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {players.map((p) => (
                      <div
                        key={p.player_id}
                        className="rounded-xl p-4 bg-white flex items-center justify-between gap-4 flex-wrap"
                        style={{ border: "1px solid #e5e7eb" }}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold" style={{ color: "#1a5c2a" }}>
                            {p.player_id}
                          </p>
                          <p className="text-xs" style={{ color: "#6b7280" }}>
                            {p.sport} · {p.position || "—"} · {p.province} · {p.age_group?.replace("_", "–")}
                          </p>
                          {p.overall_score !== null && (
                            <p className="text-xs" style={{ color: "#c8962a" }}>
                              Score: {p.overall_score}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            setContactForm({ playerId: p.player_id, reason: "" })
                          }
                          className="rounded-lg px-3 py-1.5 text-xs font-medium"
                          style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}
                        >
                          Request Contact
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Requests tab */}
            {tab === "requests" && (
              <div className="space-y-3">
                {requests.length === 0 ? (
                  <div
                    className="rounded-xl p-8 text-center text-sm"
                    style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#6b7280" }}
                  >
                    No contact requests submitted yet.
                  </div>
                ) : (
                  requests.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl p-4 bg-white"
                      style={{ border: "1px solid #e5e7eb" }}
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "#1a5c2a" }}>
                            Player: {r.player_id}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                            {new Date(r.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{
                            background: r.status.includes("approved") ? "#f0fdf4" : r.status.includes("reject") || r.status.includes("declin") ? "#fef2f2" : "#fffbeb",
                            color:      r.status.includes("approved") ? "#15803d" : r.status.includes("reject") || r.status.includes("declin") ? "#b91c1c" : "#92400e",
                          }}
                        >
                          {REQUEST_STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </div>
                      <p className="text-xs mt-2 line-clamp-2" style={{ color: "#374151" }}>
                        {r.reason}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Contact request modal */}
      {contactForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4" style={{ border: "1px solid #e5e7eb" }}>
            <h2 className="font-bold text-lg" style={{ color: "#1a5c2a" }}>Request Contact</h2>
            <p className="text-xs" style={{ color: "#6b7280" }}>
              Player: <strong>{contactForm.playerId}</strong>
            </p>
            <p className="text-xs p-3 rounded-lg" style={{ background: "#fffbeb", color: "#92400e" }}>
              This request will be reviewed by a GrassRoots Sports admin before reaching
              the player or their guardian. Do not include personal contact details in
              your reason — only your organisation&apos;s interest in the player.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1a5c2a" }}>
                Reason for contact (min 30 chars) *
              </label>
              <textarea
                rows={4}
                value={contactForm.reason}
                onChange={(e) => setContactForm({ ...contactForm, reason: e.target.value })}
                placeholder="Describe your interest in this player and the opportunity you are offering…"
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none"
                style={{ borderColor: "#d1d5db" }}
              />
              <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                {contactForm.reason.length} / 2000 chars
              </p>
            </div>
            {feedback && (
              <p className="text-xs p-2 rounded-lg" style={{ background: "#fef2f2", color: "#b91c1c" }}>
                {feedback}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setContactForm(null); setFeedback(""); }}
                className="flex-1 rounded-xl py-2 text-sm border"
                style={{ color: "#374151" }}
              >
                Cancel
              </button>
              <button
                onClick={submitContactRequest}
                disabled={submitting}
                className="flex-1 rounded-xl py-2 text-sm font-bold disabled:opacity-50"
                style={{ background: "#1a5c2a", color: "#fff" }}
              >
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
