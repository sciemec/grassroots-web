"use client";
// src/app/campaigns/[id]/page.tsx
// Public campaign detail + inline donate form.

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Heart, Users, Clock, ShieldCheck, CheckCircle2,
  AlertCircle, Loader2, ChevronDown, ChevronUp, Phone, Mail,
  Share2, Flag, Edit3, ExternalLink, Copy, Check,
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
  beneficiary_name: string;
  beneficiary_type: "individual" | "team" | "school";
  category: string;
  story: string;
  story_short: string;
  target_cents: number;
  raised_cents: number;
  donor_count: number;
  deadline_at: string | null;
  vouched_by: string | null;
  vouched_org: string | null;
  sport: string | null;
  province: string | null;
  currency: string;
  owner_user_id: string;
  status: string;
  recent_donors: Array<{ display_name: string; amount_cents: number; message: string | null; confirmed_at: string }>;
  updates: Array<{ id: string; body: string; media_url: string | null; created_at: string }>;
  guardian_consent: boolean;
}

interface DonateState {
  step: "form" | "paynow_waiting" | "success" | "error";
  donationId: string | null;
  pollUrl: string | null;
  error: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function pct(raised: number, target: number): number {
  return Math.min(100, target > 0 ? Math.round((raised / target) * 100) : 0);
}

function fmt(cents: number, currency = "USD"): string {
  return currency + " " + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const AMOUNT_PRESETS = [5, 10, 20, 50];

// ── Donate Form ───────────────────────────────────────────────────────────────
function DonateForm({ campaign, onSuccess }: { campaign: Campaign; onSuccess: () => void }) {
  const user = useAuthStore((s) => s.user);

  const [amountUsd, setAmountUsd]   = useState("");
  const [tipUsd, setTipUsd]         = useState("0");
  const [gateway, setGateway]       = useState<"paynow" | "stripe" | "manual">("paynow");
  const [phone, setPhone]           = useState("");
  const [donorName, setDonorName]   = useState(user?.name ?? "");
  const [contact, setContact]       = useState("");
  const [message, setMessage]       = useState("");
  const [anonymous, setAnonymous]   = useState(false);
  const [state, setState]           = useState<DonateState>({ step: "form", donationId: null, pollUrl: null, error: null });
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const amountCents = Math.round(parseFloat(amountUsd || "0") * 100);
  const tipCents    = Math.round(parseFloat(tipUsd || "0") * 100);
  const feeCents    = Math.round(amountCents * 0.05);
  const isValid     = amountCents >= 100;

  async function initiatePaynow(donationId: string) {
    const res = await fetch("/api/campaigns/paynow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donation_id:    donationId,
        amount_cents:   amountCents + tipCents,
        phone,
        campaign_title: campaign.title,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error ?? "Paynow initiation failed");
    return data.poll_url as string;
  }

  function startPolling(donationId: string, pollUrl: string) {
    setState((s) => ({ ...s, step: "paynow_waiting", pollUrl }));
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 40) { // 2 min timeout
        clearInterval(pollRef.current!);
        setState((s) => ({ ...s, step: "error", error: "Payment timed out. Please try again." }));
        return;
      }
      try {
        const res  = await fetch("/api/campaigns/paynow/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ poll_url: pollUrl }),
        });
        const data = await res.json();
        if (data.paid) {
          clearInterval(pollRef.current!);
          await api.post(`/campaigns/donations/${donationId}/confirm`, { gateway_ref: data.paynow_ref ?? pollUrl });
          setState((s) => ({ ...s, step: "success" }));
          onSuccess();
        }
      } catch { /* continue polling */ }
    }, 3000);
  }

  async function handleSubmit() {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setState((s) => ({ ...s, error: null }));

    try {
      const payload: Record<string, unknown> = {
        amount_cents:  amountCents,
        tip_cents:     tipCents,
        gateway,
        is_anonymous:  anonymous,
        donor_name:    anonymous ? null : (donorName || null),
        message:       message || null,
        donor_contact: contact || null,
      };

      const initRes = await api.post<{ data: { donation_id: string } }>(
        `/campaigns/${campaign.id}/donate`,
        payload
      );
      const donationId = initRes.data.data.donation_id;
      setState((s) => ({ ...s, donationId }));

      if (gateway === "paynow") {
        if (!phone.trim()) {
          setState((s) => ({ ...s, error: "Enter your EcoCash/Paynow phone number." }));
          setSubmitting(false);
          return;
        }
        const pollUrl = await initiatePaynow(donationId);
        startPolling(donationId, pollUrl);
      } else if (gateway === "manual") {
        setState((s) => ({ ...s, step: "success" }));
        onSuccess();
      } else {
        // Stripe — open checkout
        const ckRes = await api.post<{ url: string }>("/payments/checkout", {
          type:        "campaign_donation",
          campaign_id: campaign.id,
          donation_id: donationId,
          amount:      amountCents + tipCents,
        });
        window.location.href = ckRes.data.url;
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Something went wrong. Please try again.";
      setState((s) => ({ ...s, step: "form", error: msg }));
    } finally {
      setSubmitting(false);
    }
  }

  if (state.step === "paynow_waiting") {
    return (
      <div style={{ textAlign: "center", padding: "32px 16px" }}>
        <Loader2 size={36} color={GRS_GREEN} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
        <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 6 }}>Check your phone</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          A Paynow USSD prompt has been sent to your EcoCash number. Approve it to complete your donation.
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>Waiting for confirmation...</div>
        <button
          onClick={() => { clearInterval(pollRef.current!); setState({ step: "form", donationId: null, pollUrl: null, error: null }); }}
          style={{ marginTop: 16, fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (state.step === "success") {
    return (
      <div style={{ textAlign: "center", padding: "32px 16px" }}>
        <CheckCircle2 size={40} color={GRS_GREEN} style={{ marginBottom: 12 }} />
        <div style={{ fontWeight: 800, fontSize: 16, color: GRS_GREEN, marginBottom: 6 }}>Thank you!</div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          Your donation to {campaign.beneficiary_name} has been recorded.
          {gateway === "manual" && " Please complete your payment via EcoCash or bank transfer as instructed."}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>Make a donation</div>

      {/* Amount presets */}
      <div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Choose amount (USD)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 8 }}>
          {AMOUNT_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setAmountUsd(String(p))}
              style={{
                padding: "8px 4px",
                borderRadius: 8,
                border: `1.5px solid ${amountUsd === String(p) ? GRS_GREEN : "#e5e5e5"}`,
                backgroundColor: amountUsd === String(p) ? "#dcfce7" : "#fff",
                color: amountUsd === String(p) ? GRS_GREEN : "#374151",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ${p}
            </button>
          ))}
        </div>
        <input
          type="number"
          min="1"
          placeholder="Or enter custom amount"
          value={amountUsd}
          onChange={(e) => setAmountUsd(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1.5px solid #e5e5e5", fontSize: 13, outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Tip */}
      <div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Add a tip to support GRS platform (optional)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {["0", "1", "2", "5"].map((t) => (
            <button
              key={t}
              onClick={() => setTipUsd(t)}
              style={{
                padding: "7px 4px",
                borderRadius: 8,
                border: `1.5px solid ${tipUsd === t ? GOLD : "#e5e5e5"}`,
                backgroundColor: tipUsd === t ? "#fef3c7" : "#fff",
                color: tipUsd === t ? "#92400e" : "#374151",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t === "0" ? "No tip" : `$${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* Gateway */}
      <div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Payment method</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {(["paynow", "stripe", "manual"] as const).map((gw) => (
            <button
              key={gw}
              onClick={() => setGateway(gw)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: `1.5px solid ${gateway === gw ? GRS_GREEN : "#e5e5e5"}`,
                backgroundColor: gateway === gw ? "#f0fdf4" : "#fff",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: "50%",
                border: `2px solid ${gateway === gw ? GRS_GREEN : "#d1d5db"}`,
                backgroundColor: gateway === gw ? GRS_GREEN : "#fff",
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>
                  {gw === "paynow" ? "EcoCash / Paynow" : gw === "stripe" ? "Card (Stripe)" : "Manual transfer"}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  {gw === "paynow" ? "USSD push to your mobile" : gw === "stripe" ? "Visa, Mastercard — USD" : "EcoCash number or bank details provided after"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Phone for Paynow */}
      {gateway === "paynow" && (
        <div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <Phone size={11} /> Your EcoCash number
          </div>
          <input
            type="tel"
            placeholder="e.g. 0771 234 567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: "1.5px solid #e5e5e5", fontSize: 13, outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* Manual instructions */}
      {gateway === "manual" && (
        <div style={{ padding: "10px 12px", backgroundColor: "#fef3c7", borderRadius: 8, fontSize: 12, color: "#92400e" }}>
          After submitting, you will receive payment details (EcoCash number or bank account). Your donation will be recorded as pending until payment is confirmed by the campaign team.
        </div>
      )}

      {/* Donor info */}
      <div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Your name (shown on donor wall)</div>
        <input
          type="text"
          placeholder={anonymous ? "Anonymous" : "Your name"}
          value={anonymous ? "" : donorName}
          onChange={(e) => setDonorName(e.target.value)}
          disabled={anonymous}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1.5px solid #e5e5e5", fontSize: 13, outline: "none",
            backgroundColor: anonymous ? "#f9fafb" : "#fff",
            boxSizing: "border-box",
          }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          <span style={{ fontSize: 12, color: "#6b7280" }}>Donate anonymously</span>
        </label>
      </div>

      {/* Contact for receipt */}
      <div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
          <Mail size={11} /> Email or phone for receipt (optional)
        </div>
        <input
          type="text"
          placeholder="email@example.com or +263 7..."
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1.5px solid #e5e5e5", fontSize: 13, outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Message */}
      <div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Leave a message (optional)</div>
        <textarea
          rows={2}
          maxLength={280}
          placeholder="Words of encouragement..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1.5px solid #e5e5e5", fontSize: 13, outline: "none",
            resize: "none", boxSizing: "border-box", fontFamily: "inherit",
          }}
        />
      </div>

      {/* Fee summary */}
      {amountCents > 0 && (
        <div style={{ padding: "10px 12px", backgroundColor: "#f0fdf4", borderRadius: 8, fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ color: "#6b7280" }}>Donation</span>
            <span style={{ color: "#111" }}>{fmt(amountCents)}</span>
          </div>
          {tipCents > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ color: "#6b7280" }}>Platform tip</span>
              <span style={{ color: "#111" }}>{fmt(tipCents)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ color: "#6b7280" }}>Platform fee (5%)</span>
            <span style={{ color: "#6b7280" }}>−{fmt(feeCents)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #bbf7d0", paddingTop: 6, marginTop: 4 }}>
            <span style={{ fontWeight: 700, color: GRS_GREEN }}>Reaches athlete</span>
            <span style={{ fontWeight: 700, color: GRS_GREEN }}>{fmt(amountCents - feeCents)}</span>
          </div>
        </div>
      )}

      {state.error && (
        <div style={{ padding: "10px 12px", backgroundColor: "#fef2f2", borderRadius: 8, fontSize: 12, color: "#dc2626", display: "flex", alignItems: "center", gap: 6 }}>
          <AlertCircle size={14} /> {state.error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: 10,
          border: "none",
          backgroundColor: !isValid || submitting ? "#d1d5db" : GRS_GREEN,
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          cursor: !isValid || submitting ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {submitting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
        {!isValid ? "Enter an amount" : submitting ? "Processing..." : `Donate ${amountCents > 0 ? fmt(amountCents + tipCents) : ""}`}
      </button>

      <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
        Funds are paid directly to vendors, not to individuals. GRS verifies every disbursement.
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CampaignDetailClient() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);

  const [campaign, setCampaign]   = useState<Campaign | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showDonate, setShowDonate] = useState(false);
  const [donated, setDonated]     = useState(false);
  const [showFullStory, setShowFullStory] = useState(false);
  const [showShare, setShowShare]   = useState(false);
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/campaigns/${id}/public`)
      .then((res) => setCampaign(res.data.data))
      .catch(() => setError("Campaign not found or no longer active."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color={GRS_GREEN} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: BG, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <AlertCircle size={36} color="#dc2626" />
        <div style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>{error ?? "Campaign not found"}</div>
        <button onClick={() => router.push("/campaigns")} style={{ fontSize: 13, color: GRS_GREEN, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
          Browse campaigns
        </button>
      </div>
    );
  }

  const progress = pct(campaign.raised_cents, campaign.target_cents);
  const days     = daysLeft(campaign.deadline_at);
  const isOwner  = user?.id === campaign.owner_user_id;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      {/* Nav */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#374151", fontSize: 13, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Campaigns
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {isOwner && (
              <button
                onClick={() => router.push(`/campaigns/${id}/manage`)}
                style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${GRS_GREEN}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, color: GRS_GREEN, fontWeight: 600 }}
              >
                <Edit3 size={12} /> Manage
              </button>
            )}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowShare((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: 4, background: showShare ? GRS_GREEN : "none", border: `1px solid ${showShare ? GRS_GREEN : "#e5e5e5"}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, color: showShare ? "#fff" : "#374151" }}
              >
                <Share2 size={12} /> Share
              </button>

              {showShare && (
                <>
                  {/* Backdrop */}
                  <div
                    onClick={() => setShowShare(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 39 }}
                  />
                  {/* Panel */}
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                    backgroundColor: "#fff", border: "1px solid #e5e5e5",
                    borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                    padding: 12, zIndex: 40, minWidth: 220,
                    display: "flex", flexDirection: "column", gap: 4,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", paddingBottom: 6, borderBottom: "1px solid #f3f4f6", marginBottom: 4 }}>
                      Share this campaign
                    </div>

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Support ${campaign.beneficiary_name}'s campaign on GrassRoots Sports 🌱\n\n${campaign.title}\n\n${window.location.href}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowShare(false)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, textDecoration: "none", color: "#111", fontSize: 13, fontWeight: 600 }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0fdf4")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1 }}>💬</span> WhatsApp
                    </a>

                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowShare(false)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, textDecoration: "none", color: "#111", fontSize: 13, fontWeight: 600 }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#eff6ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1 }}>📘</span> Facebook
                    </a>

                    {/* Copy link */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href).then(() => {
                          setCopied(true);
                          setTimeout(() => { setCopied(false); setShowShare(false); }, 1500);
                        });
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, border: "none", background: "none", cursor: "pointer", color: "#111", fontSize: 13, fontWeight: 600, textAlign: "left", width: "100%" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {copied
                        ? <><Check size={16} color="#16a34a" /> <span style={{ color: "#16a34a" }}>Link copied!</span></>
                        : <><Copy size={16} /> Copy link</>
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>

          {/* Left: campaign info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Title card */}
            <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div style={{ backgroundColor: GRS_GREEN, padding: "16px 20px" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4, lineHeight: 1.3 }}>{campaign.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                  {campaign.beneficiary_name}
                  {campaign.province && ` · ${campaign.province}`}
                  {campaign.sport && ` · ${campaign.sport}`}
                </div>
              </div>

              {/* Progress */}
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: GRS_GREEN }}>{fmt(campaign.raised_cents, campaign.currency)}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>raised of {fmt(campaign.target_cents, campaign.currency)} goal</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#111" }}>{campaign.donor_count}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>donors</div>
                  </div>
                </div>
                <div style={{ height: 10, backgroundColor: "#f0f0f0", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ height: "100%", width: `${progress}%`, backgroundColor: GRS_GREEN, borderRadius: 999 }} />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: GRS_GREEN }}>{progress}% funded</span>
                  {days !== null && (
                    <span style={{ fontSize: 12, color: days <= 3 ? "#dc2626" : "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} /> {days === 0 ? "Last day!" : `${days} days left`}
                    </span>
                  )}
                </div>
              </div>

              {/* Vouch badge */}
              {campaign.vouched_by && (
                <div style={{ padding: "10px 20px", borderTop: "1px solid #f0f0f0", backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={16} color={GRS_GREEN} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: GRS_GREEN }}>Vouched by {campaign.vouched_by}</div>
                    {campaign.vouched_org && <div style={{ fontSize: 11, color: "#6b7280" }}>{campaign.vouched_org}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Story */}
            <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: "16px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 10 }}>The Story</div>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, margin: 0,
                ...(!showFullStory && campaign.story.length > 300 ? {
                  display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical", overflow: "hidden",
                } : {}) }}>
                {campaign.story}
              </p>
              {campaign.story.length > 300 && (
                <button
                  onClick={() => setShowFullStory((v) => !v)}
                  style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", color: GRS_GREEN, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                >
                  {showFullStory ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
                </button>
              )}
            </div>

            {/* Recent donors */}
            {campaign.recent_donors.length > 0 && (
              <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: "16px 20px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Users size={15} /> Recent Donors
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {campaign.recent_donors.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        backgroundColor: "#f0fdf4",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: GRS_GREEN, flexShrink: 0,
                      }}>
                        {d.display_name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{d.display_name}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: GRS_GREEN }}>{fmt(d.amount_cents, campaign.currency)}</span>
                        </div>
                        {d.message && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{d.message}</div>}
                        <div style={{ fontSize: 10, color: "#d1d5db" }}>{timeAgo(d.confirmed_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Updates */}
            {campaign.updates.length > 0 && (
              <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: "16px 20px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 12 }}>Campaign Updates</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {campaign.updates.map((u) => (
                    <div key={u.id} style={{ paddingLeft: 12, borderLeft: `3px solid ${GRS_GREEN}` }}>
                      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.55 }}>{u.body}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{timeAgo(u.created_at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Donate panel — sticky on desktop */}
          <div style={{ position: "sticky", top: 60, alignSelf: "start" }}>
            {campaign.status === "live" ? (
              donated ? (
                <div style={{ backgroundColor: "#f0fdf4", borderRadius: 16, border: "1px solid #bbf7d0", padding: "20px", textAlign: "center" }}>
                  <CheckCircle2 size={32} color={GRS_GREEN} style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: GRS_GREEN }}>Donation received!</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Thank you for supporting {campaign.beneficiary_name}.</div>
                </div>
              ) : (
                <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: "20px" }}>
                  {!showDonate ? (
                    <div style={{ textAlign: "center" }}>
                      <button
                        onClick={() => setShowDonate(true)}
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: 10,
                          border: "none",
                          backgroundColor: GRS_GREEN,
                          color: "#fff",
                          fontSize: 15,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        <Heart size={16} fill="#fff" /> Donate Now
                      </button>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
                        Secure · Funds verified before disbursement
                      </div>
                    </div>
                  ) : (
                    <DonateForm campaign={campaign} onSuccess={() => { setDonated(true); setShowDonate(false); }} />
                  )}
                </div>
              )
            ) : (
              <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  This campaign is currently <strong>{campaign.status}</strong> and not accepting donations.
                </div>
              </div>
            )}

            {/* Flag */}
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button
                onClick={() => alert("To report this campaign, email trust@grassrootssports.live")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#9ca3af", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <Flag size={11} /> Report this campaign
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
