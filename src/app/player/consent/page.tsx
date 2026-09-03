"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconChevronLeft, IconEye, IconAtom } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  loading,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  loading: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "#151515",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 10,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ color: "#777", fontSize: 10.5, marginTop: 3, lineHeight: 1.4 }}>
          {description}
        </div>
      </div>

      {/* Toggle switch */}
      <button
        onClick={onChange}
        disabled={loading}
        aria-pressed={checked}
        style={{
          position: "relative",
          width: 44,
          height: 26,
          borderRadius: 13,
          background: checked ? "#1a5c2a" : "#2a2a2a",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          flexShrink: 0,
          transition: "background 0.2s",
          opacity: loading ? 0.5 : 1,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: checked ? "#c0dd97" : "#555",
            transition: "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConsentPage() {
  const token  = useAuthStore((s) => s.token);
  const user   = useAuthStore((s) => s.user);

  const [scoutVisible,   setScoutVisible]   = useState(false);
  const [chemConsent,    setChemConsent]     = useState(false);
  const [loadingScout,   setLoadingScout]    = useState(false);
  const [loadingChem,    setLoadingChem]     = useState(false);
  const [toast,          setToast]           = useState<string | null>(null);
  const [pageLoading,    setPageLoading]     = useState(true);

  // ── Load current values from profile ──────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const d = json?.data ?? json;
        setScoutVisible(!!d.open_for_scouting);
        setChemConsent(!!d.safeguarding_consent_chemistry);
      })
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, [token]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // ── Toggle scout visibility ────────────────────────────────────────────────
  async function toggleScout() {
    setLoadingScout(true);
    try {
      const res = await fetch(`${API}/profile/scout-visibility`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setScoutVisible(!!json.scout_visible);
        showToast(json.message ?? "Saved.");
      } else {
        showToast(json.message ?? "Failed to update.");
      }
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setLoadingScout(false);
    }
  }

  // ── Toggle chemistry consent ───────────────────────────────────────────────
  async function toggleChem() {
    if (!user?.id) return;
    setLoadingChem(true);
    const next = !chemConsent;
    try {
      const res = await fetch(`${API}/chemistry/consent/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ safeguarding_consent_chemistry: next }),
      });
      if (res.ok) {
        setChemConsent(next);
        showToast(next ? "Chemistry matching enabled." : "Chemistry matching disabled.");
      } else {
        const json = await res.json();
        showToast(json.message ?? "Failed to update.");
      }
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setLoadingChem(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", paddingBottom: 48 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "20px 16px 0",
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        <Link
          href="/player"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "#1a1a1a",
            color: "#999",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <IconChevronLeft size={18} />
        </Link>
        <div>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>Consent Management</div>
          <div style={{ color: "#777", fontSize: 11, marginTop: 2 }}>Who can see what</div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 0" }}>

        {pageLoading ? (
          <div style={{ color: "#555", fontSize: 13, textAlign: "center", marginTop: 40 }}>
            Loading your settings…
          </div>
        ) : (
          <>
            {/* Scout visibility */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
                paddingLeft: 2,
              }}
            >
              <IconEye size={13} color="#777" />
              <span style={{ color: "#777", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Discovery
              </span>
            </div>

            <ToggleRow
              label="Scout Discovery"
              description="Let scouts and coaches find your profile in the player database."
              checked={scoutVisible}
              onChange={toggleScout}
              loading={loadingScout}
            />

            {/* Chemistry consent */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
                marginTop: 24,
                paddingLeft: 2,
              }}
            >
              <IconAtom size={13} color="#777" />
              <span style={{ color: "#777", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                AI Features
              </span>
            </div>

            <ToggleRow
              label="Chemistry Matching"
              description="Allow our AI to compare your playing style with other athletes to find compatible teammates and training partners."
              checked={chemConsent}
              onChange={toggleChem}
              loading={loadingChem}
            />

            {/* Info note */}
            <div
              style={{
                marginTop: 28,
                background: "#111",
                borderRadius: 12,
                padding: "12px 14px",
                borderLeft: "3px solid #1a5c2a",
              }}
            >
              <p style={{ color: "#777", fontSize: 11, lineHeight: 1.6, margin: 0 }}>
                Your data is never sold. Changes take effect immediately. You can update these settings at any time.
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1a5c2a",
            color: "#c0dd97",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 10,
            padding: "10px 20px",
            whiteSpace: "nowrap",
            zIndex: 999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
