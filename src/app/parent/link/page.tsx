"use client";
// src/app/parent/link/page.tsx
// Parent linking flow — enter child's invite code to connect

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, AlertCircle } from "lucide-react";

const GRS_GREEN = "#1a5c2a";
const API = process.env.NEXT_PUBLIC_API_URL;

export default function ParentLinkPage() {
  const [code,      setCode]      = useState("");
  const [whatsapp,  setWhatsapp]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState<string | null>(null);
  const [error,     setError]     = useState("");

  const handleLink = async () => {
    if (code.length !== 6) { setError("Enter the 6-character code."); return; }
    if (!whatsapp)         { setError("Enter your WhatsApp number for weekly reports."); return; }

    setLoading(true); setError("");

    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${API}/guardian/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ invite_code: code.toUpperCase(), whatsapp_number: whatsapp }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setSuccess(data.message);
    } else {
      setError(data.message ?? "Failed to link. Try again.");
    }
  };

  if (success) return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 360, width: "100%", textAlign: "center", border: "1px solid #e5e5e5" }}>
        <CheckCircle2 size={48} color="#059669" style={{ margin: "0 auto 16px" }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 8 }}>Linked Successfully!</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 24, lineHeight: 1.7 }}>{success}</div>
        <Link
          href="/parent/dashboard"
          style={{ display: "block", padding: "16px", background: GRS_GREEN, color: "#fff", borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 15 }}
        >
          View Dashboard →
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee" }}>
      <div style={{ background: GRS_GREEN, padding: 16 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/player" style={{ color: "rgba(255,255,255,0.7)" }}><ChevronLeft size={20} /></Link>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Link to Child</div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e5e5" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 6 }}>Enter Invite Code</div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.6 }}>
            Ask your child to go to their Profile → Settings → "Invite Parent" and share the 6-character code with you.
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
              Invite Code
            </label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g. ABC123"
              style={{
                width: "100%", padding: "14px", borderRadius: 10, border: "2px solid #e5e7eb",
                fontSize: 20, fontWeight: 800, letterSpacing: "0.2em", textAlign: "center",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
              Your WhatsApp Number
            </label>
            <input
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="+263 77 123 4567"
              type="tel"
              style={{
                width: "100%", padding: "14px", borderRadius: 10, border: "2px solid #e5e7eb",
                fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>
              Weekly progress reports will be sent here every Sunday
            </div>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
              <AlertCircle size={14} color="#dc2626" />
              <span style={{ fontSize: 12, color: "#dc2626" }}>{error}</span>
            </div>
          )}

          <button
            onClick={handleLink}
            disabled={loading}
            style={{
              width: "100%", padding: "16px", borderRadius: 12,
              background: loading ? "#9ca3af" : GRS_GREEN,
              color: "#fff", fontWeight: 800, fontSize: 15,
              border: "none", cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Linking..." : "Link Account →"}
          </button>
        </div>
      </div>
    </div>
  );
}