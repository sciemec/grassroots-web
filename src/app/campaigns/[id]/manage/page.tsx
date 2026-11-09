"use client";
// src/app/campaigns/[id]/manage/page.tsx
// Campaign owner management — request disbursements, post updates, view donors.
// Requires auth. Only the campaign owner can access this page.

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Upload, DollarSign, Users, MessageSquare,
  CheckCircle2, Clock, XCircle, AlertTriangle, ChevronDown,
  ChevronUp, ExternalLink, Send, RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const GRS_GREEN = "#1a5c2a";
const GOLD      = "#c8962a";
const BG        = "#f4f2ee";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Campaign {
  id: string;
  title: string;
  status: "draft" | "pending_review" | "live" | "paused" | "closed" | "rejected";
  target_cents: number;
  raised_cents: number;
  balance_cents: number;
  donor_count: number;
  owner_user_id: string;
  rejection_reason: string | null;
  vouched_by: string | null;
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
  proof_submitted_at: string | null;
  created_at: string;
  paid_at: string | null;
}

interface Donor {
  id: string;
  display_name: string;
  amount_cents: number;
  message: string | null;
  created_at: string;
}

interface Update {
  id: string;
  body: string;
  notify_donors: boolean;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(cents: number): string {
  return "USD " + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  draft:          { label: "Draft",          color: "#6b7280", bg: "#f3f4f6", desc: "Your campaign is not yet submitted for review." },
  pending_review: { label: "Pending Review", color: "#b45309", bg: "#fef3c7", desc: "Our team is reviewing your campaign. Usually takes 24–48 hours." },
  live:           { label: "Live",           color: GRS_GREEN, bg: "#f0fdf4", desc: "Your campaign is live and accepting donations!" },
  paused:         { label: "Paused",         color: "#6b7280", bg: "#f3f4f6", desc: "Donations are temporarily paused." },
  closed:         { label: "Closed",         color: "#374151", bg: "#f3f4f6", desc: "This campaign has ended." },
  rejected:       { label: "Rejected",       color: "#dc2626", bg: "#fef2f2", desc: "Your campaign was not approved." },
};

const DISB_STATUS: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  requested: { label: "Pending",  color: "#b45309",  Icon: Clock },
  approved:  { label: "Approved", color: GRS_GREEN,  Icon: CheckCircle2 },
  paid:       { label: "Paid",    color: "#0369a1",   Icon: CheckCircle2 },
  rejected:  { label: "Rejected", color: "#dc2626",  Icon: XCircle },
};

// ── Disbursement request form ─────────────────────────────────────────────────
function DisbursementForm({ campaignId, balanceCents, onSuccess }: {
  campaignId: string;
  balanceCents: number;
  onSuccess: () => void;
}) {
  const [open, setOpen]       = useState(false);
  const [payee, setPayee]     = useState("");
  const [ref, setRef]         = useState("");
  const [amtUsd, setAmtUsd]   = useState("");
  const [quoteUrl, setQuoteUrl] = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const maxUsd = balanceCents / 100;

  const submit = async () => {
    setError("");
    const amt = parseFloat(amtUsd);
    if (!payee.trim())            return setError("Payee name is required.");
    if (!ref.trim())              return setError("Payee reference is required.");
    if (!amt || amt <= 0)         return setError("Amount must be greater than 0.");
    if (amt > maxUsd)             return setError(`Amount cannot exceed available balance (${fmt(balanceCents)}).`);
    setSaving(true);
    try {
      await api.post(`/campaigns/${campaignId}/disbursements`, {
        payee_name:  payee.trim(),
        payee_ref:   ref.trim(),
        amount_cents: Math.round(amt * 100),
        quote_url:   quoteUrl.trim() || null,
      });
      setPayee(""); setRef(""); setAmtUsd(""); setQuoteUrl("");
      setOpen(false);
      onSuccess();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Could not submit request. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={balanceCents <= 0}
        style={{
          backgroundColor: balanceCents > 0 ? GRS_GREEN : "#d1d5db",
          color: "#fff", border: "none", borderRadius: 10,
          padding: "10px 20px", fontSize: 13, fontWeight: 700,
          cursor: balanceCents > 0 ? "pointer" : "default",
        }}
      >
        Request Payout
      </button>
    );
  }

  return (
    <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 20, marginTop: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: GRS_GREEN, marginBottom: 16 }}>New Disbursement Request</div>
      {error && <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{error}</div>}

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Payee Name *</label>
          <input value={payee} onChange={(e) => setPayee(e.target.value)}
            placeholder="e.g. Harare Sports Academy"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Payee Reference *</label>
          <input value={ref} onChange={(e) => setRef(e.target.value)}
            placeholder="Invoice number, EcoCash number, or account"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
            Amount (USD) * — Available: {fmt(balanceCents)}
          </label>
          <input value={amtUsd} onChange={(e) => setAmtUsd(e.target.value)}
            type="number" min="1" max={maxUsd} step="0.01"
            placeholder="0.00"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Quote / Invoice URL (recommended)</label>
          <input value={quoteUrl} onChange={(e) => setQuoteUrl(e.target.value)}
            placeholder="Google Drive or Dropbox link to quote"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={submit} disabled={saving} style={{ backgroundColor: GRS_GREEN, color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {saving ? "Submitting..." : "Submit Request"}
        </button>
        <button onClick={() => setOpen(false)} style={{ backgroundColor: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Proof upload form ─────────────────────────────────────────────────────────
function ProofUploadForm({ disbursementId, onSuccess }: { disbursementId: string; onSuccess: () => void }) {
  const [open, setOpen]     = useState(false);
  const [url, setUrl]       = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!url.trim()) return;
    setSaving(true);
    try {
      await api.post(`/campaigns/disbursements/${disbursementId}/proof`, { proof_url: url.trim() });
      setUrl(""); setOpen(false); onSuccess();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ fontSize: 11, color: GRS_GREEN, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      Upload proof
    </button>
  );

  return (
    <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
      <input value={url} onChange={(e) => setUrl(e.target.value)}
        placeholder="Link to proof of payment"
        style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12 }} />
      <button onClick={submit} disabled={saving} style={{ backgroundColor: GRS_GREEN, color: "#fff", border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 12, cursor: "pointer" }}>
        {saving ? "..." : "Save"}
      </button>
      <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 12 }}>✕</button>
    </div>
  );
}

// ── Post update form ──────────────────────────────────────────────────────────
function UpdateForm({ campaignId, onSuccess }: { campaignId: string; onSuccess: () => void }) {
  const [open, setOpen]       = useState(false);
  const [body, setBody]       = useState("");
  const [notify, setNotify]   = useState(true);
  const [saving, setSaving]   = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await api.post(`/campaigns/${campaignId}/updates`, { body: body.trim(), notify_donors: notify });
      setBody(""); setOpen(false); onSuccess();
    } catch { /* silent */ } finally { setSaving(false); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#fff", color: GRS_GREEN, border: `1px solid ${GRS_GREEN}`, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
      <Send size={14} /> Post Update
    </button>
  );

  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 12 }}>New Campaign Update</div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4}
        placeholder="Share progress with your donors..."
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
        <input type="checkbox" id="notify" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        <label htmlFor="notify" style={{ fontSize: 12, color: "#555" }}>Notify donors by email</label>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={submit} disabled={saving || !body.trim()} style={{ backgroundColor: GRS_GREEN, color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {saving ? "Posting..." : "Post"}
        </button>
        <button onClick={() => setOpen(false)} style={{ backgroundColor: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CampaignManagePage() {
  const router    = useRouter();
  const { id }    = useParams<{ id: string }>();
  const user      = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [campaign, setCampaign]           = useState<Campaign | null>(null);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [donors, setDonors]               = useState<Donor[]>([]);
  const [updates, setUpdates]             = useState<Update[]>([]);
  const [loading, setLoading]             = useState(true);
  const [tab, setTab]                     = useState<"payouts" | "updates" | "donors">("payouts");
  const [expandedDonors, setExpandedDonors] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
  }, [hasHydrated, user, router]);

  const load = useCallback(async () => {
    try {
      const [cRes, dRes] = await Promise.all([
        api.get(`/campaigns/${id}`),
        api.get(`/campaigns/${id}/disbursements`),
      ]);
      const c: Campaign = cRes.data.data ?? cRes.data;
      setCampaign(c);
      setDisbursements(Array.isArray(dRes.data.data) ? dRes.data.data : []);

      // Load donors + updates in parallel, non-blocking
      Promise.all([
        api.get(`/campaigns/${id}/donors`).catch(() => ({ data: { data: [] } })),
        api.get(`/campaigns/${id}/updates`).catch(() => ({ data: { data: [] } })),
      ]).then(([donRes, updRes]) => {
        setDonors(Array.isArray(donRes.data.data) ? donRes.data.data : []);
        setUpdates(Array.isArray(updRes.data.data) ? updRes.data.data : []);
      });
    } catch {
      // campaign not found or no access
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (hasHydrated && user) load(); }, [hasHydrated, user, load]);

  if (!hasHydrated || loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={24} color={GRS_GREEN} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <AlertTriangle size={36} color="#d1d5db" />
        <div style={{ fontSize: 15, color: "#374151", fontWeight: 700 }}>Campaign not found</div>
        <button onClick={() => router.push("/campaigns")} style={{ backgroundColor: GRS_GREEN, color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer" }}>Browse Campaigns</button>
      </div>
    );
  }

  const isOwner = user?.id === campaign.owner_user_id;
  if (!isOwner && user?.role !== "admin") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "#dc2626" }}>You do not have access to manage this campaign.</div>
      </div>
    );
  }

  const statusCfg  = STATUS_LABELS[campaign.status] ?? STATUS_LABELS.draft;
  const pct        = Math.min(100, campaign.target_cents > 0 ? Math.round((campaign.raised_cents / campaign.target_cents) * 100) : 0);
  const TAB_STYLE  = (active: boolean) => ({
    padding: "8px 16px",
    borderBottom: active ? `2px solid ${GRS_GREEN}` : "2px solid transparent",
    color: active ? GRS_GREEN : "#6b7280",
    fontWeight: active ? 700 : 500,
    fontSize: 13,
    cursor: "pointer",
    background: "none",
    border: "none",
    borderBottom: active ? `2px solid ${GRS_GREEN}` : "2px solid transparent",
  } as React.CSSProperties);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      {/* Header */}
      <header style={{ backgroundColor: GRS_GREEN, color: "#fff", padding: "18px 16px 16px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <button onClick={() => router.push(`/campaigns/${id}`)} style={{ background: "none", border: "none", color: "#fff", display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", marginBottom: 12, opacity: 0.85 }}>
            <ArrowLeft size={15} /> Back to campaign
          </button>
          <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3 }}>{campaign.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ backgroundColor: statusCfg.color + "30", color: statusCfg.bg === "#fef2f2" ? "#fff" : statusCfg.color, border: `1px solid ${statusCfg.color}50`, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
              {statusCfg.label}
            </span>
            <span style={{ fontSize: 12, opacity: 0.8 }}>{statusCfg.desc}</span>
          </div>
          {campaign.status === "rejected" && campaign.rejection_reason && (
            <div style={{ backgroundColor: "rgba(220,38,38,0.2)", borderRadius: 8, padding: "8px 12px", marginTop: 10, fontSize: 12 }}>
              Reason: {campaign.rejection_reason}
            </div>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 60px" }}>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Raised",     value: fmt(campaign.raised_cents),   Icon: DollarSign },
            { label: "Available",  value: fmt(campaign.balance_cents),  Icon: DollarSign },
            { label: "Donors",     value: String(campaign.donor_count), Icon: Users },
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

        {/* Progress bar */}
        <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: "16px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: GRS_GREEN }}>{fmt(campaign.raised_cents)} raised</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>of {fmt(campaign.target_cents)} goal</span>
          </div>
          <div style={{ height: 8, backgroundColor: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, backgroundColor: GRS_GREEN, borderRadius: 999 }} />
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>{pct}% funded</div>
        </div>

        {/* Tabs */}
        <div style={{ backgroundColor: "#fff", borderRadius: "12px 12px 0 0", border: "1px solid #e5e5e5", borderBottom: "none" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #e5e5e5", paddingLeft: 8 }}>
            <button style={TAB_STYLE(tab === "payouts")} onClick={() => setTab("payouts")}>Payouts</button>
            <button style={TAB_STYLE(tab === "updates")} onClick={() => setTab("updates")}>Updates</button>
            <button style={TAB_STYLE(tab === "donors")} onClick={() => setTab("donors")}>Donors ({campaign.donor_count})</button>
          </div>
        </div>

        <div style={{ backgroundColor: "#fff", borderRadius: "0 0 12px 12px", border: "1px solid #e5e5e5", borderTop: "none", padding: 20, marginBottom: 20 }}>

          {/* ── PAYOUTS TAB ── */}
          {tab === "payouts" && (
            <div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 4 }}>Disbursement Requests</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Funds are always paid directly to service providers — not to individuals.
                    Available balance: <strong>{fmt(campaign.balance_cents)}</strong>
                  </div>
                </div>
                {campaign.status === "live" && (
                  <DisbursementForm campaignId={id} balanceCents={campaign.balance_cents} onSuccess={load} />
                )}
              </div>

              {disbursements.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
                  <DollarSign size={32} color="#d1d5db" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13 }}>No disbursement requests yet.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {disbursements.map((d) => {
                    const sc = DISB_STATUS[d.status] ?? DISB_STATUS.requested;
                    return (
                      <div key={d.id} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
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
                            <ExternalLink size={11} /> View quote
                          </a>
                        )}

                        {d.status === "paid" && !d.proof_url && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 11, color: "#b45309", marginBottom: 4 }}>Admin marked as paid — please upload proof of receipt.</div>
                            <ProofUploadForm disbursementId={d.id} onSuccess={load} />
                          </div>
                        )}
                        {d.proof_url && (
                          <a href={d.proof_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: GRS_GREEN, marginTop: 8 }}>
                            <Upload size={11} /> Proof uploaded
                          </a>
                        )}
                        {d.admin_note && (
                          <div style={{ backgroundColor: "#fef3c7", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#92400e", marginTop: 8 }}>
                            Admin note: {d.admin_note}
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 8 }}>Requested {timeAgo(d.created_at)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── UPDATES TAB ── */}
          {tab === "updates" && (
            <div>
              <UpdateForm campaignId={id} onSuccess={load} />
              {updates.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
                  <MessageSquare size={32} color="#d1d5db" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13 }}>No updates yet. Keep donors informed with progress posts.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {updates.map((u) => (
                    <div key={u.id} style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 14 }}>
                      <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>{u.body}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <span style={{ fontSize: 10, color: "#9ca3af" }}>{timeAgo(u.created_at)}</span>
                        {u.notify_donors && <span style={{ fontSize: 10, color: GRS_GREEN, fontWeight: 600 }}>Donors notified</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DONORS TAB ── */}
          {tab === "donors" && (
            <div>
              {donors.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
                  <Users size={32} color="#d1d5db" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13 }}>No donations yet.</div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(expandedDonors ? donors : donors.slice(0, 10)).map((d) => (
                      <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{d.display_name}</div>
                          {d.message && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, fontStyle: "italic" }}>"{d.message}"</div>}
                          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{timeAgo(d.created_at)}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: GRS_GREEN }}>{fmt(d.amount_cents)}</div>
                      </div>
                    ))}
                  </div>
                  {donors.length > 10 && (
                    <button onClick={() => setExpandedDonors(!expandedDonors)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: GRS_GREEN, fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 12 }}>
                      {expandedDonors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {expandedDonors ? "Show less" : `Show all ${donors.length} donors`}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Campaign link */}
        <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#374151" }}>Public campaign page</span>
          <button onClick={() => router.push(`/campaigns/${id}`)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: GRS_GREEN, background: "none", border: "none", cursor: "pointer" }}>
            View <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
