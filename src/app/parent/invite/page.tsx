"use client";
// src/app/parent/invite/page.tsx
// Player generates a 6-character invite code to share with their guardian/parent.
// The code is stored locally (offline-first) and also posted to the backend.

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Shield, Copy, Check, Share2, RefreshCw, Clock, X,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API       = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const LS_KEY    = "gs_guardian_invite";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a 6-char alphanumeric code (no confusing chars: 0/O, 1/I). */
function mkCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function fmtTimeLeft(expiry: Date): string {
  const diff = expiry.getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Guardian {
  id: string;
  name: string;
  whatsapp: string;
  linked_at: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InviteParentPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [code,      setCode]      = useState("");
  const [expiry,    setExpiry]    = useState<Date | null>(null);
  const [timeLeft,  setTimeLeft]  = useState("");
  const [copied,    setCopied]    = useState(false);
  const [busy,      setBusy]      = useState(false);
  const [guardians, setGuardians] = useState<Guardian[]>([]);

  // ── Restore code from localStorage on mount ──────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const { code: c, expiry: e } = JSON.parse(stored) as { code: string; expiry: string };
        const exp = new Date(e);
        if (exp > new Date()) { setCode(c); setExpiry(exp); }
        else localStorage.removeItem(LS_KEY);
      }
    } catch { /* ignore */ }
  }, []);

  // ── Countdown ticker ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!expiry) { setTimeLeft(""); return; }
    const tick = () => {
      const t = fmtTimeLeft(expiry);
      setTimeLeft(t);
      if (t === "Expired") { setCode(""); setExpiry(null); localStorage.removeItem(LS_KEY); }
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [expiry]);

  // ── Load linked guardians ─────────────────────────────────────────────────
  const loadGuardians = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/guardian/linked`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGuardians(Array.isArray(data.guardians) ? data.guardians : []);
      }
    } catch { /* offline — skip */ }
  }, [token]);

  useEffect(() => { loadGuardians(); }, [loadGuardians]);

  // ── Generate new code ─────────────────────────────────────────────────────
  const generateCode = async () => {
    setBusy(true);
    const newCode  = mkCode();
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1_000);

    // Persist locally first (works offline)
    localStorage.setItem(LS_KEY, JSON.stringify({
      code:   newCode,
      expiry: newExpiry.toISOString(),
    }));
    setCode(newCode);
    setExpiry(newExpiry);

    // Fire-and-forget to backend
    if (token) {
      fetch(`${API}/guardian/invite`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ invite_code: newCode, expires_at: newExpiry.toISOString() }),
      }).catch(() => { /* not critical */ });
    }
    setBusy(false);
  };

  // ── Copy code ─────────────────────────────────────────────────────────────
  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    }).catch(() => { /* clipboard blocked */ });
  };

  // ── WhatsApp share ────────────────────────────────────────────────────────
  const shareWhatsApp = () => {
    const name = user?.name ?? "a GrassRoots athlete";
    const msg  = encodeURIComponent(
      `Hi! ${name} has invited you to follow their sports progress on GrassRoots Sports.\n\n` +
      `Here's how to connect:\n` +
      `1. Go to: grassrootssports.live/parent\n` +
      `2. Tap "Link a Child"\n` +
      `3. Enter this code: *${code}*\n\n` +
      `The code expires in 24 hours. You'll be able to see training activity, athletic scores, injury alerts, and receive weekly WhatsApp reports.`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  // ── Revoke guardian ───────────────────────────────────────────────────────
  const revokeGuardian = async (id: string) => {
    if (!token) return;
    setGuardians(prev => prev.filter(g => g.id !== id)); // optimistic
    try {
      await fetch(`${API}/guardian/revoke/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* reverted on next load */ }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e5e5",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
            <Link href="/player" style={{ color: "#6b7280", display: "flex" }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Invite Parent / Guardian</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Share your progress with family</div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 56px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* What they can see */}
        <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, backgroundColor: "#dcfce7",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Shield size={18} color={GRS_GREEN} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 4 }}>
                What your guardian will see
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                Training sessions · Athletic scores · Injury risk level · Milestones & achievements · Weekly WhatsApp report (optional addon)
              </div>
            </div>
          </div>
        </div>

        {/* Code card */}
        {code ? (
          <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e5e5" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Active Invite Code
            </div>

            {/* Big code display */}
            <div style={{
              fontSize: 40, fontWeight: 900, letterSpacing: "0.25em", color: GRS_GREEN,
              textAlign: "center", padding: "22px 0",
              backgroundColor: "#f0fdf4", borderRadius: 12,
              border: "2px dashed #bbf7d0",
              marginBottom: 12,
              fontFamily: "monospace",
            }}>
              {code}
            </div>

            {/* Expiry */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginBottom: 16 }}>
              <Clock size={12} color="#9ca3af" />
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{timeLeft}</span>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <button
                onClick={copyCode}
                style={{
                  flex: 1, padding: "13px 0", borderRadius: 10, cursor: "pointer",
                  backgroundColor: copied ? "#f0fdf4" : "#f9fafb",
                  border: `1px solid ${copied ? "#bbf7d0" : "#e5e7eb"}`,
                  color: copied ? GRS_GREEN : "#374151",
                  fontWeight: 700, fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
              <button
                onClick={shareWhatsApp}
                style={{
                  flex: 1, padding: "13px 0", borderRadius: 10, cursor: "pointer",
                  backgroundColor: "#25D366", border: "none",
                  color: "#fff", fontWeight: 700, fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Share2 size={14} />
                WhatsApp
              </button>
            </div>

            <button
              onClick={generateCode}
              disabled={busy}
              style={{
                width: "100%", padding: "9px 0", borderRadius: 10,
                backgroundColor: "transparent", border: "none",
                color: "#9ca3af", fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <RefreshCw size={12} />
              Generate new code (old one becomes invalid)
            </button>
          </div>
        ) : (
          /* No code yet */
          <div style={{
            backgroundColor: "#fff", borderRadius: 16, padding: 28,
            border: "1px solid #e5e5e5", textAlign: "center",
          }}>
            <Shield size={40} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 6 }}>
              No active invite code
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginBottom: 24 }}>
              Generate a 6-character code and share it with your parent or guardian via WhatsApp.
              The code expires after 24 hours for security.
            </div>
            <button
              onClick={generateCode}
              disabled={busy}
              style={{
                padding: "15px 36px", borderRadius: 12, border: "none",
                backgroundColor: busy ? "#9ca3af" : GRS_GREEN,
                color: "#fff", fontWeight: 800, fontSize: 14, cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Generating…" : "Generate Invite Code"}
            </button>
          </div>
        )}

        {/* Steps */}
        <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#111", marginBottom: 14 }}>How it works</div>
          {[
            "Generate your invite code above",
            "Tap WhatsApp to send the code to your parent instantly",
            "They go to grassrootssports.live/parent → tap \"Link a Child\" → enter the code",
            "Your guardian dashboard is activated immediately",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: i === 3 ? 0 : 12, alignItems: "flex-start" }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                backgroundColor: GRS_GREEN, color: "#fff",
                fontSize: 11, fontWeight: 800, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {i + 1}
              </div>
              <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.5, margin: 0, paddingTop: 3 }}>
                {step}
              </p>
            </div>
          ))}
        </div>

        {/* Linked guardians */}
        {guardians.length > 0 && (
          <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#111", marginBottom: 14 }}>
              Linked Guardians ({guardians.length})
            </div>
            {guardians.map(g => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  backgroundColor: "#f0fdf4",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: GRS_GREEN }}>
                    {g.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    {g.whatsapp} · Linked {new Date(g.linked_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => revokeGuardian(g.id)}
                  title="Remove guardian access"
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "5px 10px", borderRadius: 8,
                    backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                    color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <X size={12} />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Privacy note */}
        <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.6 }}>
          Your location and chat messages are never shared with guardians.<br />
          You can remove guardian access at any time above.
        </p>
      </div>
    </div>
  );
}
