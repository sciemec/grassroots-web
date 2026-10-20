"use client";
// src/app/guardian/requests/page.tsx
// Guardian contact requests inbox — forwarded partner enquiries awaiting guardian approval.
// Partners never contact guardians directly; GRS admin moderates first.

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, XCircle, Clock, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;

interface ContactRequest {
  id: string;
  partner_name: string;
  partner_org: string;
  partner_sport: string;
  player_display_name: string;
  purpose: string;
  message: string;
  status: "pending_guardian" | "approved" | "declined";
  forwarded_at: string;
  responded_at: string | null;
}

const STATUS_CONFIG: Record<ContactRequest["status"], { label: string; color: string; bg: string }> = {
  pending_guardian: { label: "Awaiting your response", color: "#92400e", bg: "#fef3c7" },
  approved:         { label: "Approved",               color: "#065f46", bg: "#d1fae5" },
  declined:         { label: "Declined",               color: "#7f1d1d", bg: "#fee2e2" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function GuardianRequestsPage() {
  const token = useAuthStore((s) => s.token);

  const [requests, setRequests]   = useState<ContactRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [acting, setActing]       = useState<string | null>(null); // request id being acted on
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"pending_guardian" | "all">("pending_guardian");

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API}/guardian/contact-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        setRequests(Array.isArray(json.data) ? json.data : []);
      })
      .catch(() => setError("Could not load requests. Please try again."))
      .finally(() => setLoading(false));
  }, [token]);

  async function respond(id: string, action: "approve" | "decline") {
    setActing(id);
    try {
      const res = await fetch(`${API}/guardian/contact-requests/${id}/respond`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, status: action === "approve" ? "approved" : "declined", responded_at: new Date().toISOString() }
              : r
          )
        );
        showToast(
          action === "approve"
            ? "Approved. The partner has been notified and will contact you through GRS."
            : "Declined. The partner will not be given any contact details.",
          true
        );
      } else {
        showToast(json.message ?? "Failed to respond. Please try again.", false);
      }
    } catch {
      showToast("Network error. Please try again.", false);
    } finally {
      setActing(null);
    }
  }

  const displayed =
    activeTab === "pending_guardian"
      ? requests.filter((r) => r.status === "pending_guardian")
      : requests;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", paddingBottom: 48 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 100, backgroundColor: toast.ok ? "#1a5c2a" : "#dc2626",
          color: "#fff", borderRadius: 10, padding: "10px 18px",
          fontSize: 13, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          whiteSpace: "nowrap", maxWidth: "90vw",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e5e5",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
            <Link href="/guardian" style={{ color: "#6b7280", display: "flex" }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>Partner Requests</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Contact requests from verified sport partners</div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 0" }}>

        {/* Safeguarding notice */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: 14,
          padding: "14px 16px",
          border: "1px solid #e5e5e5",
          borderLeft: "4px solid #1a5c2a",
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertCircle size={16} color="#1a5c2a" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2a", marginBottom: 4 }}>
                Your child's safety comes first
              </div>
              <div style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.5 }}>
                All partners are verified by GRS before they can send requests. If you approve,
                GRS will coordinate contact — your child's phone number and email are never shared
                directly with any partner.
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["pending_guardian", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: activeTab === tab ? "#1a5c2a" : "#e5e5e5",
                color: activeTab === tab ? "#fff" : "#6b7280",
              }}
            >
              {tab === "pending_guardian" ? "Needs Response" : "All Requests"}
              {tab === "pending_guardian" && requests.filter((r) => r.status === "pending_guardian").length > 0 && (
                <span style={{
                  marginLeft: 6, backgroundColor: "#dc2626", color: "#fff",
                  borderRadius: 99, fontSize: 10, fontWeight: 700,
                  padding: "1px 6px",
                }}>
                  {requests.filter((r) => r.status === "pending_guardian").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "48px 0", color: "#9ca3af" }}>
            <Loader2 size={20} className="animate-spin" />
            <span style={{ fontSize: 13 }}>Loading requests…</span>
          </div>
        ) : error ? (
          <div style={{ backgroundColor: "#fee2e2", borderRadius: 12, padding: "16px", fontSize: 13, color: "#991b1b" }}>
            {error}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{
            backgroundColor: "#fff", borderRadius: 14, border: "1px dashed #d1d5db",
            padding: "48px 24px", textAlign: "center",
          }}>
            <MessageSquare size={32} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              {activeTab === "pending_guardian" ? "No pending requests" : "No requests yet"}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              {activeTab === "pending_guardian"
                ? "You are all caught up."
                : "When a verified partner expresses interest in your child, requests will appear here."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {displayed.map((req) => {
              const cfg = STATUS_CONFIG[req.status];
              const isPending = req.status === "pending_guardian";
              return (
                <div
                  key={req.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 14,
                    border: "1px solid #e5e5e5",
                    padding: "16px",
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      backgroundColor: "#dcfce7",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Building2 size={18} color="#1a5c2a" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{req.partner_name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{req.partner_org} &middot; {req.partner_sport}</div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px",
                      borderRadius: 99, backgroundColor: cfg.bg, color: cfg.color,
                      flexShrink: 0,
                    }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Player + purpose */}
                  <div style={{
                    backgroundColor: "#f9fafb", borderRadius: 10, padding: "10px 12px", marginBottom: 12,
                  }}>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                      Regarding <strong style={{ color: "#111" }}>{req.player_display_name}</strong>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#1a5c2a", marginBottom: 6 }}>
                      Purpose: {req.purpose}
                    </div>
                    <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                      {req.message}
                    </div>
                  </div>

                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: isPending ? 14 : 0 }}>
                    <Clock size={11} style={{ display: "inline", marginRight: 4 }} />
                    Forwarded {timeAgo(req.forwarded_at)}
                    {req.responded_at && ` · Responded ${timeAgo(req.responded_at)}`}
                  </div>

                  {/* Action buttons */}
                  {isPending && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => respond(req.id, "approve")}
                        disabled={acting === req.id}
                        style={{
                          flex: 1, padding: "10px",
                          borderRadius: 10, border: "none",
                          backgroundColor: "#1a5c2a", color: "#fff",
                          fontSize: 13, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          opacity: acting === req.id ? 0.7 : 1,
                        }}
                      >
                        {acting === req.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Approve
                      </button>
                      <button
                        onClick={() => respond(req.id, "decline")}
                        disabled={acting === req.id}
                        style={{
                          flex: 1, padding: "10px",
                          borderRadius: 10, border: "1px solid #e5e5e5",
                          backgroundColor: "#fff", color: "#374151",
                          fontSize: 13, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          opacity: acting === req.id ? 0.7 : 1,
                        }}
                      >
                        <XCircle size={14} color="#dc2626" />
                        Decline
                      </button>
                    </div>
                  )}

                  {/* Outcome badge for responded */}
                  {req.status === "approved" && (
                    <div style={{ fontSize: 12, color: "#065f46", display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={13} /> GRS is coordinating contact.
                    </div>
                  )}
                  {req.status === "declined" && (
                    <div style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
                      <XCircle size={13} /> Request declined. No contact details were shared.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
