"use client";
// src/app/admin/contact-requests/page.tsx
// Admin: moderate partner contact requests before forwarding to guardians.
// This is the safeguarding gate — no request reaches a guardian without admin approval.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, CheckCircle2, XCircle, User, Clock,
  Loader2, AlertTriangle, MessageSquare, Search, AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

interface ContactRequest {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_org: string;
  partner_type: string;
  player_id: string;
  player_name: string;
  player_age_group: string;
  player_sport: string;
  purpose: string;
  message: string;
  status: "pending_admin" | "approved" | "rejected" | "pending_guardian" | "guardian_approved" | "guardian_declined";
  admin_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
}

const STATUS_TABS = ["pending_admin", "approved", "rejected"] as const;
type StatusFilter = typeof STATUS_TABS[number];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending_admin:    { label: "Awaiting review",    color: "#92400e", bg: "#fef3c7" },
  approved:         { label: "Forwarded",           color: "#1e40af", bg: "#dbeafe" },
  rejected:         { label: "Rejected",            color: "#7f1d1d", bg: "#fee2e2" },
  pending_guardian: { label: "With guardian",       color: "#5b21b6", bg: "#ede9fe" },
  guardian_approved:{ label: "Guardian approved",   color: "#065f46", bg: "#d1fae5" },
  guardian_declined:{ label: "Guardian declined",   color: "#374151", bg: "#f3f4f6" },
};

const AGE_GROUP_LABELS: Record<string, string> = {
  under_13: "Under 13",
  "13_17":  "13–17",
  "18_25":  "18–25",
  "26_plus":"26+",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ListSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{
          height: 120, borderRadius: 12, backgroundColor: "#e5e5e5",
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      ))}
    </div>
  );
}

export default function AdminContactRequestsPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/dashboard"); }
  }, [hasHydrated, user, router]);

  const [statusTab, setStatusTab]   = useState<StatusFilter>("pending_admin");
  const [search, setSearch]         = useState("");
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [expanded, setExpanded]     = useState<Record<string, boolean>>({});
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const { data, isLoading } = useQuery<{ data: ContactRequest[] }>({
    queryKey: ["admin-contact-requests", statusTab],
    queryFn: () => api.get("/admin/contact-requests", { params: { status: statusTab, per_page: 50 } }).then((r) => r.data),
    enabled: !!user && user.role === "admin",
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.patch(`/admin/contact-requests/${id}/approve`, { notes }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-requests"] });
      setExpanded((p) => ({ ...p, [id]: false }));
      showToast("Request approved and forwarded to guardian.");
    },
    onError: () => showToast("Could not approve request. Please try again.", false),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.patch(`/admin/contact-requests/${id}/reject`, { notes }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-requests"] });
      setExpanded((p) => ({ ...p, [id]: false }));
      showToast("Request rejected. Partner will be notified.");
    },
    onError: () => showToast("Could not reject request. Please try again.", false),
  });

  const requests = (data?.data ?? []).filter((r) =>
    search.trim() === "" ||
    r.partner_name.toLowerCase().includes(search.toLowerCase()) ||
    r.partner_org.toLowerCase().includes(search.toLowerCase()) ||
    r.player_name.toLowerCase().includes(search.toLowerCase())
  );

  const isActing = (id: string) =>
    (approveMutation.isPending && approveMutation.variables?.id === id) ||
    (rejectMutation.isPending && rejectMutation.variables?.id === id);

  if (!hasHydrated || !user) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", paddingBottom: 48 }}>

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
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
            <Link href="/admin" style={{ color: "#6b7280", display: "flex" }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>Contact Request Moderation</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Review partner requests before they reach guardians</div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 0" }}>

        {/* Safeguarding notice */}
        <div style={{
          backgroundColor: "#fff", borderRadius: 14, padding: "12px 16px",
          border: "1px solid #e5e5e5", borderLeft: "4px solid #dc2626", marginBottom: 20,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
            <strong>Safeguarding gate.</strong> No contact request reaches a guardian without
            admin approval here. Reject any request that seems inappropriate, commercially aggressive,
            or that targets a minor without a clear legitimate sporting purpose.
            Under-13 players must never appear in partner contact requests — reject immediately if they do.
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <Search size={14} color="#9ca3af" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by partner, org, or player name…"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 12px 9px 34px", borderRadius: 10,
              border: "1px solid #e5e5e5", fontSize: 13, backgroundColor: "#fff",
              outline: "none", color: "#111",
            }}
          />
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {STATUS_TABS.map((tab) => {
            const count = tab === "pending_admin" && data
              ? (data.data ?? []).filter((r) => r.status === "pending_admin").length
              : undefined;
            return (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                style={{
                  padding: "6px 14px", borderRadius: 20, border: "none",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  backgroundColor: statusTab === tab ? "#1a5c2a" : "#e5e5e5",
                  color: statusTab === tab ? "#fff" : "#6b7280",
                }}
              >
                {STATUS_CONFIG[tab]?.label ?? tab}
                {count != null && count > 0 && (
                  <span style={{
                    marginLeft: 6, backgroundColor: "#dc2626", color: "#fff",
                    borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px",
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <ListSkeleton />
        ) : requests.length === 0 ? (
          <div style={{
            backgroundColor: "#fff", borderRadius: 14, border: "1px dashed #d1d5db",
            padding: "48px 24px", textAlign: "center",
          }}>
            <MessageSquare size={32} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
              No {STATUS_CONFIG[statusTab]?.label.toLowerCase()} requests
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {requests.map((req) => {
              const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG["pending_admin"];
              const isMinor = req.player_age_group === "under_13" || req.player_age_group === "13_17";
              return (
                <div
                  key={req.id}
                  style={{
                    backgroundColor: "#fff", borderRadius: 14,
                    border: `1px solid ${isMinor && req.status === "pending_admin" ? "#fca5a5" : "#e5e5e5"}`,
                    padding: "16px",
                  }}
                >
                  {/* Minor warning banner */}
                  {isMinor && req.status === "pending_admin" && (
                    <div style={{
                      backgroundColor: "#fef3c7", borderRadius: 8, padding: "8px 12px",
                      marginBottom: 12, fontSize: 12, color: "#92400e",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <AlertCircle size={13} />
                      <strong>Minor player ({AGE_GROUP_LABELS[req.player_age_group]}).</strong>
                      {" "}Verify legitimate sporting purpose before approving. Guardian must have active consent.
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, backgroundColor: "#dcfce7",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Building2 size={18} color="#1a5c2a" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{req.partner_name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{req.partner_org} &middot; {req.partner_type}</div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px",
                      borderRadius: 99, backgroundColor: cfg.bg, color: cfg.color, flexShrink: 0,
                    }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Player target */}
                  <div style={{
                    backgroundColor: "#f9fafb", borderRadius: 10,
                    padding: "10px 12px", marginBottom: 12,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <User size={12} color="#6b7280" />
                      <span style={{ fontSize: 11, color: "#6b7280" }}>Target player</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 2 }}>
                      {req.player_name}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      {AGE_GROUP_LABELS[req.player_age_group] ?? req.player_age_group} &middot; {req.player_sport}
                    </div>
                  </div>

                  {/* Request detail */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#1a5c2a", marginBottom: 4 }}>
                      Purpose: {req.purpose}
                    </div>
                    <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                      {req.message}
                    </div>
                  </div>

                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 12 }}>
                    <Clock size={11} style={{ display: "inline", marginRight: 4 }} />
                    Submitted {formatDate(req.submitted_at)}
                    {req.reviewed_at && ` · Reviewed ${formatDate(req.reviewed_at)} by ${req.reviewed_by_name ?? "Admin"}`}
                  </div>

                  {req.admin_notes && (
                    <div style={{
                      fontSize: 12, color: "#6b7280", marginBottom: 12,
                      padding: "8px 12px", backgroundColor: "#f9fafb", borderRadius: 8,
                    }}>
                      Admin notes: {req.admin_notes}
                    </div>
                  )}

                  {/* Expand for notes + actions */}
                  {req.status === "pending_admin" && (
                    <>
                      {expanded[req.id] && (
                        <textarea
                          value={adminNotes[req.id] ?? ""}
                          onChange={(e) => setAdminNotes((p) => ({ ...p, [req.id]: e.target.value }))}
                          placeholder="Admin notes for this decision (optional but recommended)…"
                          rows={2}
                          style={{
                            width: "100%", boxSizing: "border-box", padding: "8px 12px",
                            borderRadius: 8, border: "1px solid #d1d5db", fontSize: 12,
                            marginBottom: 10, resize: "none", outline: "none",
                          }}
                        />
                      )}

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => {
                            if (!expanded[req.id]) {
                              setExpanded((p) => ({ ...p, [req.id]: true }));
                            } else {
                              approveMutation.mutate({ id: req.id, notes: adminNotes[req.id] ?? "" });
                            }
                          }}
                          disabled={isActing(req.id)}
                          style={{
                            flex: 1, padding: "9px", borderRadius: 10, border: "none",
                            backgroundColor: "#1a5c2a", color: "#fff",
                            fontSize: 12, fontWeight: 700, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          }}
                        >
                          {approveMutation.isPending && approveMutation.variables?.id === req.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <CheckCircle2 size={13} />}
                          {expanded[req.id] ? "Confirm & Forward" : "Approve"}
                        </button>
                        <button
                          onClick={() => {
                            if (!expanded[req.id]) {
                              setExpanded((p) => ({ ...p, [req.id]: true }));
                            } else {
                              rejectMutation.mutate({ id: req.id, notes: adminNotes[req.id] ?? "" });
                            }
                          }}
                          disabled={isActing(req.id)}
                          style={{
                            flex: 1, padding: "9px", borderRadius: 10,
                            border: "1px solid #fca5a5", backgroundColor: "#fff", color: "#dc2626",
                            fontSize: 12, fontWeight: 700, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          }}
                        >
                          {rejectMutation.isPending && rejectMutation.variables?.id === req.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <XCircle size={13} />}
                          {expanded[req.id] ? "Confirm Reject" : "Reject"}
                        </button>
                        {expanded[req.id] && (
                          <button
                            onClick={() => setExpanded((p) => ({ ...p, [req.id]: false }))}
                            style={{
                              padding: "9px 12px", borderRadius: 10,
                              border: "1px solid #e5e5e5", backgroundColor: "#fff", color: "#6b7280",
                              fontSize: 12, cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </>
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
