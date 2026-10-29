"use client";
// src/app/admin/partners/page.tsx
// Admin: verify, monitor, and suspend Verified Partner accounts.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, CheckCircle2, XCircle, ShieldCheck,
  Loader2, ExternalLink, Search, AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

interface Partner {
  id: string;
  user_id: string;
  organisation_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  partner_type: string;
  sport_focus: string;
  status: "pending" | "verified" | "suspended";
  notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
}

const STATUS_TABS = ["pending", "verified", "suspended"] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_CONFIG: Record<StatusTab, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "#92400e", bg: "#fef3c7" },
  verified:  { label: "Verified",  color: "#065f46", bg: "#d1fae5" },
  suspended: { label: "Suspended", color: "#7f1d1d", bg: "#fee2e2" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ListSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{
          height: 90, borderRadius: 12, backgroundColor: "#e5e5e5",
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      ))}
    </div>
  );
}

export default function AdminPartnersPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/dashboard"); }
  }, [hasHydrated, user, router]);

  const [statusTab, setStatusTab] = useState<StatusTab>("pending");
  const [search, setSearch]       = useState("");
  const [notes, setNotes]         = useState<Record<string, string>>({});
  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({});
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const { data, isLoading } = useQuery<{ data: Partner[] }>({
    queryKey: ["admin-partners", statusTab],
    queryFn: () => api.get("/admin/partners", { params: { status: statusTab, per_page: 50 } }).then((r) => r.data),
    enabled: !!user && user.role === "admin",
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, n }: { id: string; n: string }) =>
      api.patch(`/admin/partners/${id}/verify`, { notes: n }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      setNotesOpen((p) => ({ ...p, [id]: false }));
      showToast("Partner verified. They can now submit contact requests.");
    },
    onError: () => showToast("Verification failed. Please try again.", false),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, n }: { id: string; n: string }) =>
      api.patch(`/admin/partners/${id}/suspend`, { notes: n }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      setNotesOpen((p) => ({ ...p, [id]: false }));
      showToast("Partner suspended. Their active contact requests have been closed.");
    },
    onError: () => showToast("Suspension failed. Please try again.", false),
  });

  const partners = (data?.data ?? []).filter((p) =>
    search.trim() === "" ||
    p.organisation_name.toLowerCase().includes(search.toLowerCase()) ||
    p.contact_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const isPending = (id: string) =>
    (verifyMutation.isPending && verifyMutation.variables?.id === id) ||
    (suspendMutation.isPending && suspendMutation.variables?.id === id);

  if (!hasHydrated || !user) return null;

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
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
            <Link href="/admin" style={{ color: "#6b7280", display: "flex" }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>Verified Partners</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Review and manage partner applications</div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 0" }}>

        {/* Safeguard notice */}
        <div style={{
          backgroundColor: "#fff", borderRadius: 14, padding: "12px 16px",
          border: "1px solid #e5e5e5", borderLeft: "4px solid #1a5c2a", marginBottom: 20,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <AlertCircle size={15} color="#1a5c2a" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
            Verified partners can search the player discovery feed and submit contact requests,
            which GRS admin moderates before forwarding to guardians. Partners never see
            player contact details directly.
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <Search size={14} color="#9ca3af" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, org, or email…"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 12px 9px 34px", borderRadius: 10,
              border: "1px solid #e5e5e5", fontSize: 13, backgroundColor: "#fff",
              outline: "none", color: "#111",
            }}
          />
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "none",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                backgroundColor: statusTab === tab ? "#1a5c2a" : "#e5e5e5",
                color: statusTab === tab ? "#fff" : "#6b7280",
                textTransform: "capitalize",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <ListSkeleton />
        ) : partners.length === 0 ? (
          <div style={{
            backgroundColor: "#fff", borderRadius: 14, border: "1px dashed #d1d5db",
            padding: "48px 24px", textAlign: "center",
          }}>
            <Building2 size={32} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
              No {statusTab} partners
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {partners.map((partner) => {
              const cfg = STATUS_CONFIG[partner.status as StatusTab];
              return (
                <div
                  key={partner.id}
                  style={{ backgroundColor: "#fff", borderRadius: 14, border: "1px solid #e5e5e5", padding: "16px" }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, backgroundColor: "#dcfce7",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Building2 size={18} color="#1a5c2a" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>
                        {partner.organisation_name}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        {partner.partner_type} &middot; {partner.sport_focus}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px",
                      borderRadius: 99, backgroundColor: cfg.bg, color: cfg.color, flexShrink: 0,
                    }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px",
                    backgroundColor: "#f9fafb", borderRadius: 10, padding: "10px 12px", marginBottom: 12,
                  }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>Contact</div>
                      <div style={{ fontSize: 12, color: "#111" }}>{partner.contact_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>Email</div>
                      <div style={{ fontSize: 12, color: "#111" }}>{partner.email}</div>
                    </div>
                    {partner.phone && (
                      <div>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>Phone</div>
                        <div style={{ fontSize: 12, color: "#111" }}>{partner.phone}</div>
                      </div>
                    )}
                    {partner.website && (
                      <div>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>Website</div>
                        <a href={partner.website} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, color: "#1a5c2a", display: "flex", alignItems: "center", gap: 4 }}>
                          Visit <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>Submitted</div>
                      <div style={{ fontSize: 12, color: "#111" }}>{formatDate(partner.submitted_at)}</div>
                    </div>
                    {partner.reviewed_at && (
                      <div>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>Reviewed by</div>
                        <div style={{ fontSize: 12, color: "#111" }}>{partner.reviewed_by_name ?? "Admin"}</div>
                      </div>
                    )}
                  </div>

                  {partner.notes && (
                    <div style={{
                      fontSize: 12, color: "#6b7280", marginBottom: 12,
                      padding: "8px 12px", backgroundColor: "#f9fafb", borderRadius: 8,
                    }}>
                      Notes: {partner.notes}
                    </div>
                  )}

                  {/* Admin notes input */}
                  {notesOpen[partner.id] && (
                    <textarea
                      value={notes[partner.id] ?? ""}
                      onChange={(e) => setNotes((p) => ({ ...p, [partner.id]: e.target.value }))}
                      placeholder="Add admin notes (optional)…"
                      rows={2}
                      style={{
                        width: "100%", boxSizing: "border-box", padding: "8px 12px",
                        borderRadius: 8, border: "1px solid #d1d5db", fontSize: 12,
                        marginBottom: 10, resize: "none", outline: "none",
                      }}
                    />
                  )}

                  {/* Action buttons */}
                  {partner.status === "pending" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          if (!notesOpen[partner.id]) {
                            setNotesOpen((p) => ({ ...p, [partner.id]: true }));
                          } else {
                            verifyMutation.mutate({ id: partner.id, n: notes[partner.id] ?? "" });
                          }
                        }}
                        disabled={isPending(partner.id)}
                        style={{
                          flex: 1, padding: "9px", borderRadius: 10, border: "none",
                          backgroundColor: "#1a5c2a", color: "#fff",
                          fontSize: 12, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                      >
                        {verifyMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                        {notesOpen[partner.id] ? "Confirm Verify" : "Verify Partner"}
                      </button>
                      <button
                        onClick={() => setNotesOpen((p) => ({ ...p, [partner.id]: !p[partner.id] }))}
                        style={{
                          padding: "9px 14px", borderRadius: 10, border: "1px solid #e5e5e5",
                          backgroundColor: "#fff", color: "#6b7280",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        {notesOpen[partner.id] ? "Cancel" : "Reject"}
                      </button>
                    </div>
                  )}

                  {partner.status === "verified" && (
                    <button
                      onClick={() => suspendMutation.mutate({ id: partner.id, n: notes[partner.id] ?? "" })}
                      disabled={isPending(partner.id)}
                      style={{
                        padding: "8px 16px", borderRadius: 10,
                        border: "1px solid #fca5a5", backgroundColor: "#fff", color: "#dc2626",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      {suspendMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                      Suspend Partner
                    </button>
                  )}

                  {partner.status === "suspended" && (
                    <button
                      onClick={() => verifyMutation.mutate({ id: partner.id, n: notes[partner.id] ?? "" })}
                      disabled={isPending(partner.id)}
                      style={{
                        padding: "8px 16px", borderRadius: 10,
                        border: "1px solid #bbf7d0", backgroundColor: "#f0fdf4", color: "#1a5c2a",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      {verifyMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      Reinstate Partner
                    </button>
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
