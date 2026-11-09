"use client";
// src/app/admin/campaigns/[id]/page.tsx
// Admin campaign detail — publish/pause/close/reject; manage disbursements.

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ShieldCheck, Flag, CheckCircle2, XCircle, Clock,
  DollarSign, Users, ExternalLink, Upload, AlertTriangle,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const GRS_GREEN = "#1a5c2a";
const GOLD      = "#c8962a";
const BG        = "#f4f2ee";

interface Campaign {
  id: string;
  title: string;
  beneficiary_name: string;
  beneficiary_type: string;
  category: string;
  sport: string | null;
  province: string | null;
  story: string;
  target_cents: number;
  raised_cents: number;
  balance_cents: number;
  donor_count: number;
  status: string;
  owner_name: string;
  owner_email: string;
  vouched_by: string | null;
  quote_url: string | null;
  rejection_reason: string | null;
  created_at: string;
  deadline_at: string | null;
  flag_count: number;
}

interface Disbursement {
  id: string;
  amount_cents: number;
  payee_name: string;
  payee_ref: string;
  quote_url: string | null;
  status: "requested" | "approved" | "paid" | "rejected";
  admin_note: string | null;
  proof_url: string | null;
  created_at: string;
}

function fmt(cents: number): string {
  return "USD " + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  draft:          { label: "Draft",          color: "#6b7280", bg: "#f3f4f6" },
  pending_review: { label: "Pending Review", color: "#b45309", bg: "#fef3c7" },
  live:           { label: "Live",           color: GRS_GREEN, bg: "#f0fdf4" },
  paused:         { label: "Paused",         color: "#6b7280", bg: "#f3f4f6" },
  closed:         { label: "Closed",         color: "#374151", bg: "#f3f4f6" },
  rejected:       { label: "Rejected",       color: "#dc2626", bg: "#fef2f2" },
};

const DISB_STATUS: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  requested: { label: "Pending",  color: "#b45309", Icon: Clock },
  approved:  { label: "Approved", color: GRS_GREEN, Icon: CheckCircle2 },
  paid:       { label: "Paid",    color: "#0369a1",  Icon: CheckCircle2 },
  rejected:  { label: "Rejected", color: "#dc2626", Icon: XCircle },
};

// ── Action button helpers ─────────────────────────────────────────────────────
function ActionButton({ label, color, onClick, loading }: {
  label: string; color: string; onClick: () => void; loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{ backgroundColor: color, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
    >
      {loading ? "..." : label}
    </button>
  );
}

// ── Disbursement action modal ─────────────────────────────────────────────────
function DisbursementActions({ d, onDone }: { d: Disbursement; onDone: () => void }) {
  const [action, setAction]   = useState<"approve" | "reject" | "paid" | null>(null);
  const [note, setNote]       = useState("");
  const [saving, setSaving]   = useState(false);

  const submit = async () => {
    if (!action) return;
    setSaving(true);
    try {
      await api.post(`/campaigns/disbursements/${d.id}/${action}`, { admin_note: note.trim() || null });
      setAction(null); setNote(""); onDone();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  if (d.status === "paid" || d.status === "rejected") return null;

  return (
    <div style={{ marginTop: 10 }}>
      {!action ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {d.status === "requested" && (
            <>
              <button onClick={() => setAction("approve")} style={{ backgroundColor: "#f0fdf4", color: GRS_GREEN, border: `1px solid ${GRS_GREEN}`, borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Approve</button>
              <button onClick={() => setAction("reject")} style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Reject</button>
            </>
          )}
          {d.status === "approved" && (
            <button onClick={() => setAction("paid")} style={{ backgroundColor: "#eff6ff", color: "#0369a1", border: "1px solid #93c5fd", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Mark as Paid</button>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e5e5", borderRadius: 8, padding: 12, marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            {action === "approve" ? "Approve disbursement?" : action === "reject" ? "Reject disbursement?" : "Mark as paid?"}
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder={action === "reject" ? "Reason for rejection (required)" : "Optional note to owner"}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, resize: "vertical", boxSizing: "border-box", marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={submit} disabled={saving || (action === "reject" && !note.trim())} style={{
              backgroundColor: action === "approve" ? GRS_GREEN : action === "reject" ? "#dc2626" : "#0369a1",
              color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              {saving ? "..." : "Confirm"}
            </button>
            <button onClick={() => { setAction(null); setNote(""); }} style={{ background: "none", border: "1px solid #d1d5db", borderRadius: 6, padding: "7px 12px", fontSize: 12, cursor: "pointer", color: "#374151" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminCampaignDetailPage() {
  const router      = useRouter();
  const { id }      = useParams<{ id: string }>();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [campaign, setCampaign]           = useState<Campaign | null>(null);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading]             = useState(true);
  const [actionBusy, setActionBusy]       = useState(false);
  const [rejectReason, setRejectReason]   = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [toast, setToast]                 = useState("");

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/"); return; }
  }, [hasHydrated, user, router]);

  const load = useCallback(async () => {
    try {
      const [cRes, dRes] = await Promise.all([
        api.get(`/admin/campaigns/${id}`),
        api.get(`/campaigns/${id}/disbursements`),
      ]);
      setCampaign(cRes.data.data ?? cRes.data);
      setDisbursements(Array.isArray(dRes.data.data) ? dRes.data.data : []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (hasHydrated && user?.role === "admin") load(); }, [hasHydrated, user, load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const doAction = async (action: "publish" | "pause" | "close", body?: object) => {
    setActionBusy(true);
    try {
      await api.post(`/admin/campaigns/${id}/${action}`, body ?? {});
      await load();
      showToast(`Campaign ${action}ed.`);
    } catch { showToast("Action failed. Please try again."); }
    finally { setActionBusy(false); }
  };

  const doReject = async () => {
    if (!rejectReason.trim()) return;
    setActionBusy(true);
    try {
      await api.post(`/admin/campaigns/${id}/reject`, { reason: rejectReason.trim() });
      setRejectReason(""); setShowRejectForm(false);
      await load();
      showToast("Campaign rejected.");
    } catch { showToast("Rejection failed."); }
    finally { setActionBusy(false); }
  };

  if (!hasHydrated || loading || !campaign) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!campaign && !loading ? (
          <div style={{ textAlign: "center" }}>
            <AlertTriangle size={36} color="#d1d5db" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 14, color: "#374151" }}>Campaign not found.</div>
          </div>
        ) : (
          <div style={{ width: 36, height: 36, border: `3px solid ${GRS_GREEN}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        )}
        <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  const badge = STATUS_BADGE[campaign.status] ?? STATUS_BADGE.draft;
  const pct   = Math.min(100, campaign.target_cents > 0 ? Math.round((campaign.raised_cents / campaign.target_cents) * 100) : 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", backgroundColor: GRS_GREEN, color: "#fff", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header style={{ backgroundColor: GRS_GREEN, color: "#fff", padding: "18px 16px 16px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <button onClick={() => router.push("/admin/campaigns")} style={{ background: "none", border: "none", color: "#fff", display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", marginBottom: 12, opacity: 0.85 }}>
            <ArrowLeft size={15} /> Campaign Queue
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3 }}>{campaign.title}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                {campaign.beneficiary_name} · {campaign.owner_name} ({campaign.owner_email})
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ backgroundColor: badge.bg + "30", color: "#fff", border: `1px solid ${badge.color}60`, borderRadius: 999, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>{badge.label}</span>
              {campaign.flag_count > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#fca5a5", fontWeight: 600 }}>
                  <Flag size={11} /> {campaign.flag_count} report{campaign.flag_count !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* Admin actions */}
        <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 14 }}>Admin Actions</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {campaign.status === "pending_review" && (
              <>
                <ActionButton label="Publish Campaign" color={GRS_GREEN} onClick={() => doAction("publish")} loading={actionBusy} />
                <ActionButton label="Reject" color="#dc2626" onClick={() => setShowRejectForm(true)} loading={actionBusy} />
              </>
            )}
            {campaign.status === "live" && (
              <>
                <ActionButton label="Pause" color="#b45309" onClick={() => doAction("pause")} loading={actionBusy} />
                <ActionButton label="Close Campaign" color="#374151" onClick={() => doAction("close")} loading={actionBusy} />
              </>
            )}
            {campaign.status === "paused" && (
              <>
                <ActionButton label="Re-publish" color={GRS_GREEN} onClick={() => doAction("publish")} loading={actionBusy} />
                <ActionButton label="Close Campaign" color="#374151" onClick={() => doAction("close")} loading={actionBusy} />
              </>
            )}
            <a href={`/campaigns/${campaign.id}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#0369a1", padding: "9px 0", textDecoration: "none" }}>
              <ExternalLink size={13} /> View public page
            </a>
          </div>

          {showRejectForm && (
            <div style={{ marginTop: 16, backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", marginBottom: 10 }}>Reason for rejection *</div>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                placeholder="Explain why this campaign cannot be published..."
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #fca5a5", fontSize: 13, resize: "vertical", boxSizing: "border-box", marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={doReject} disabled={actionBusy || !rejectReason.trim()} style={{ backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {actionBusy ? "Rejecting..." : "Confirm Rejection"}
                </button>
                <button onClick={() => { setShowRejectForm(false); setRejectReason(""); }} style={{ background: "none", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 14px", fontSize: 13, cursor: "pointer", color: "#374151" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Campaign stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Raised",    value: fmt(campaign.raised_cents),   Icon: DollarSign },
            { label: "Balance",   value: fmt(campaign.balance_cents),  Icon: DollarSign },
            { label: "Donors",    value: String(campaign.donor_count), Icon: Users },
          ].map(({ label, value, Icon }) => (
            <div key={label} style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Icon size={13} color={GRS_GREEN} />
                <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Campaign details */}
        <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 14 }}>Campaign Details</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {[
                ["Beneficiary",  campaign.beneficiary_name],
                ["Type",         campaign.beneficiary_type],
                ["Category",     campaign.category.replace(/_/g, " ")],
                ["Sport",        campaign.sport ?? "—"],
                ["Province",     campaign.province ?? "—"],
                ["Target",       fmt(campaign.target_cents)],
                ["Deadline",     campaign.deadline_at ? new Date(campaign.deadline_at).toLocaleDateString() : "None"],
                ["Vouched by",   campaign.vouched_by ?? "—"],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 0", fontWeight: 600, color: "#6b7280", width: 130 }}>{k}</td>
                  <td style={{ padding: "8px 0", color: "#374151" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {campaign.quote_url && (
            <a href={campaign.quote_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#0369a1", marginTop: 12 }}>
              <ExternalLink size={12} /> View quote / invoice
            </a>
          )}

          {/* Progress bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Funding progress</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: GRS_GREEN }}>{pct}%</span>
            </div>
            <div style={{ height: 6, backgroundColor: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, backgroundColor: GRS_GREEN, borderRadius: 999 }} />
            </div>
          </div>

          {/* Story */}
          {campaign.story && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Story</div>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, margin: 0 }}>{campaign.story}</p>
            </div>
          )}
        </div>

        {/* Disbursements */}
        <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>
            Disbursements ({disbursements.length})
          </div>

          {disbursements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 20px", color: "#9ca3af" }}>
              <DollarSign size={28} color="#d1d5db" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 13 }}>No disbursement requests yet.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {disbursements.map((d) => {
                const sc = DISB_STATUS[d.status] ?? DISB_STATUS.requested;
                return (
                  <div key={d.id} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{d.payee_name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{d.payee_ref}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: GRS_GREEN }}>{fmt(d.amount_cents)}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 2 }}>
                          <sc.Icon size={11} color={sc.color} />
                          <span style={{ fontSize: 11, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                        </div>
                      </div>
                    </div>

                    {d.quote_url && (
                      <a href={d.quote_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#0369a1", marginTop: 8 }}>
                        <ExternalLink size={11} /> Quote
                      </a>
                    )}
                    {d.proof_url && (
                      <a href={d.proof_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: GRS_GREEN, marginTop: 8, marginLeft: d.quote_url ? 12 : 0 }}>
                        <Upload size={11} /> Proof
                      </a>
                    )}
                    {d.admin_note && (
                      <div style={{ backgroundColor: "#fef3c7", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#92400e", marginTop: 8 }}>
                        Note: {d.admin_note}
                      </div>
                    )}

                    <DisbursementActions d={d} onDone={load} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
