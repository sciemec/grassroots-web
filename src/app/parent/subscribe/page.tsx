"use client";
// src/app/parent/subscribe/page.tsx
// Parent Dashboard addon — $2/month via EcoCash or InnBucks

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, CheckCircle2, AlertCircle, Loader2,
  Shield, Smartphone, Activity, MessageCircle, Zap,
} from "lucide-react";

const GRS_GREEN = "#1a5c2a";
const GRS_GOLD  = "#c8962a";
const API       = process.env.NEXT_PUBLIC_API_URL;

const FEATURES = [
  { icon: Activity,       text: "Athletic profile scores (Power, Pace, Balance, Reaction, Endurance, Technique)" },
  { icon: Shield,         text: "Injury risk level with real-time alerts for High and Critical flags" },
  { icon: Zap,            text: "Weekly training activity — sessions, drills, and AI coach usage" },
  { icon: CheckCircle2,   text: "Recent achievements and milestone tracking" },
  { icon: MessageCircle,  text: "Automated WhatsApp progress reports every Sunday at 8am" },
];

const METHODS = [
  { id: "ecocash",  label: "EcoCash",  hint: "07X XXX XXXX" },
  { id: "innbucks", label: "InnBucks", hint: "08X XXX XXXX" },
] as const;

type Method = "ecocash" | "innbucks";
type Phase  = "form" | "waiting" | "paid" | "failed";

export default function ParentSubscribePage() {
  const [method,  setMethod]  = useState<Method>("ecocash");
  const [phone,   setPhone]   = useState("");
  const [phase,   setPhase]   = useState<Phase>("form");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [pollUrl, setPollUrl] = useState<string | null>(null);
  const [ref,     setRef]     = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const handleSubscribe = async () => {
    if (!phone) { setError("Enter your mobile money number."); return; }
    setLoading(true);
    setError("");

    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${API}/guardian/addon/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ payment_method: method, mobile_money_number: phone }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.message ?? "Payment initiation failed."); return; }

    setRef(data.reference_number ?? "");
    if (data.poll_url) {
      setPollUrl(data.poll_url);
      setPhase("waiting");
      startPolling(data.poll_url, data.reference_number);
    } else {
      // Paynow returned success immediately (sandbox)
      setPhase("paid");
    }
  };

  const startPolling = (url: string, reference: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API}/guardian/addon/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reference, status: "paid" }),
        });
        if (res.ok) { stopPolling(); setPhase("paid"); }
      } catch { /* keep polling */ }
    }, 5000);

    // Give up after 10 minutes
    setTimeout(() => {
      stopPolling();
      if (phase !== "paid") setPhase("failed");
    }, 600_000);
  };

  /* ── SUCCESS ── */
  if (phase === "paid") return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 380, width: "100%", textAlign: "center", border: "1px solid #e5e5e5" }}>
        <CheckCircle2 size={52} color="#059669" style={{ margin: "0 auto 16px" }} />
        <div style={{ fontSize: 20, fontWeight: 900, color: "#111", marginBottom: 8 }}>Parent Dashboard Activated!</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 24, lineHeight: 1.7 }}>
          Your $2/month addon is now live. You have full access to your child's progress dashboard and weekly WhatsApp reports.
        </div>
        <Link
          href="/parent/dashboard"
          style={{ display: "block", padding: "16px", background: GRS_GREEN, color: "#fff", borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 15 }}
        >
          Go to Dashboard →
        </Link>
      </div>
    </div>
  );

  /* ── WAITING FOR PHONE APPROVAL ── */
  if (phase === "waiting") return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 380, width: "100%", textAlign: "center", border: "1px solid #e5e5e5" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Smartphone size={28} color={GRS_GOLD} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 8 }}>Check Your Phone</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.7 }}>
          A USSD prompt has been sent to <strong>{phone}</strong>. Approve the $2.00 payment to activate your Parent Dashboard.
        </div>
        <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <Loader2 size={16} color={GRS_GREEN} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#555" }}>Waiting for payment confirmation…</span>
        </div>
        {ref && (
          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 20 }}>Reference: {ref}</div>
        )}
        <button
          onClick={() => { stopPolling(); setPhase("form"); setError(""); }}
          style={{ background: "none", border: "none", color: "#999", fontSize: 12, cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  /* ── FAILED ── */
  if (phase === "failed") return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 380, width: "100%", textAlign: "center", border: "1px solid #fecaca" }}>
        <AlertCircle size={48} color="#dc2626" style={{ margin: "0 auto 16px" }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 8 }}>Payment Timed Out</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 24, lineHeight: 1.7 }}>
          The payment confirmation timed out. Please try again or use a different payment method.
        </div>
        <button
          onClick={() => setPhase("form")}
          style={{ display: "block", width: "100%", padding: "14px", background: GRS_GREEN, color: "#fff", borderRadius: 12, border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer" }}
        >
          Try Again
        </button>
      </div>
    </div>
  );

  /* ── FORM ── */
  return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee" }}>

      {/* Header */}
      <div style={{ background: GRS_GREEN, padding: 16 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/parent/dashboard" style={{ color: "rgba(255,255,255,0.7)" }}><ChevronLeft size={20} /></Link>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Activate Parent Dashboard</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>$2 / month · Cancel anytime</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* What you get */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Shield size={20} color={GRS_GOLD} />
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>What you get</div>
          </div>
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
              <Icon size={16} color={GRS_GREEN} style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#444", lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: "12px 14px", background: GRS_GREEN + "10", borderRadius: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: GRS_GREEN }}>$2<span style={{ fontSize: 13, fontWeight: 600 }}> / month</span></div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Billed monthly. Cancel by revoking your child's parent link.</div>
          </div>
        </div>

        {/* Payment form */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 16 }}>Pay with Mobile Money</div>

          {/* Method selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {METHODS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                style={{
                  padding: "12px", borderRadius: 10, fontWeight: 700, fontSize: 14,
                  border: `2px solid ${method === id ? GRS_GREEN : "#e5e7eb"}`,
                  background: method === id ? GRS_GREEN + "10" : "#f9fafb",
                  color: method === id ? GRS_GREEN : "#555",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Phone number */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
              {METHODS.find(m => m.id === method)?.label} Number
            </label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={METHODS.find(m => m.id === method)?.hint}
              type="tel"
              style={{ width: "100%", padding: "14px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 16, outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>
              You will receive a USSD prompt to approve the $2.00 charge.
            </div>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
              <AlertCircle size={14} color="#dc2626" />
              <span style={{ fontSize: 12, color: "#dc2626" }}>{error}</span>
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            style={{
              width: "100%", padding: "16px", borderRadius: 12,
              background: loading ? "#9ca3af" : GRS_GREEN,
              color: "#fff", fontWeight: 800, fontSize: 15,
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Processing…</> : "Activate for $2 / month →"}
          </button>
        </div>

        <div style={{ fontSize: 11, color: "#bbb", textAlign: "center", lineHeight: 1.6 }}>
          Payments processed securely via Paynow Zimbabwe. Your child's account is not charged — only the guardian account linked to this phone number.
        </div>

        <div style={{ height: 24 }} />
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
