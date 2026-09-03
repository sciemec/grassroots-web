"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconChevronLeft,
  IconUsers,
  IconKey,
  IconCopy,
  IconCheck,
  IconTrash,
  IconRefresh,
} from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;

type LinkStatus =
  | { status: "none" }
  | { status: "pending"; invite_code: string; invite_expires_at: string; age_group: string }
  | { status: "active"; guardian_name: string | null; guardian_whatsapp: string | null; linked_at: string; link_id: string };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuardianPage() {
  const token = useAuthStore((s) => s.token);

  const [linkStatus,   setLinkStatus]   = useState<LinkStatus>({ status: "none" });
  const [pageLoading,  setPageLoading]  = useState(true);
  const [ageGroup,     setAgeGroup]     = useState<"u13" | "u17">("u17");
  const [generating,   setGenerating]   = useState(false);
  const [revoking,     setRevoking]     = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Load current guardian status ──────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/guardian/my-guardian`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const link = json?.link;
        if (!link) {
          setLinkStatus({ status: "none" });
          return;
        }
        if (link.status === "active") {
          setLinkStatus({
            status: "active",
            guardian_name:     link.guardian_name ?? null,
            guardian_whatsapp: link.guardian_whatsapp ?? null,
            linked_at:         link.linked_at ?? link.created_at,
            link_id:           link.id,
          });
        } else if (link.status === "pending") {
          setLinkStatus({
            status:            "pending",
            invite_code:       link.invite_code ?? "------",
            invite_expires_at: link.invite_expires_at ?? "",
            age_group:         link.age_group ?? "u17",
          });
        } else {
          setLinkStatus({ status: "none" });
        }
      })
      .catch(() => setLinkStatus({ status: "none" }))
      .finally(() => setPageLoading(false));
  }, [token]);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Generate invite code ───────────────────────────────────────────────────
  async function generateCode() {
    setGenerating(true);
    try {
      const res = await fetch(`${API}/guardian/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ age_group: ageGroup }),
      });
      const json = await res.json();
      if (res.ok) {
        setLinkStatus({
          status:            "pending",
          invite_code:       json.invite_code,
          invite_expires_at: json.expires_at,
          age_group:         json.age_group ?? ageGroup,
        });
        showToast("Code generated. Share it with your guardian.");
      } else {
        // Already has an active link — refresh
        showToast(json.message ?? "Something went wrong.", false);
        if (json.guardian_link) {
          const link = json.guardian_link;
          setLinkStatus({
            status:            "pending",
            invite_code:       link.invite_code ?? "------",
            invite_expires_at: link.invite_expires_at ?? "",
            age_group:         link.age_group ?? ageGroup,
          });
        }
      }
    } catch {
      showToast("Network error. Try again.", false);
    } finally {
      setGenerating(false);
    }
  }

  // ── Revoke link ───────────────────────────────────────────────────────────
  async function revokeLink() {
    if (linkStatus.status !== "active") return;
    if (!confirm("Remove this guardian link? They will no longer see your activity.")) return;
    setRevoking(true);
    try {
      const res = await fetch(`${API}/guardian/revoke/${linkStatus.link_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setLinkStatus({ status: "none" });
        showToast("Guardian link removed.");
      } else {
        const json = await res.json();
        showToast(json.message ?? "Failed to remove link.", false);
      }
    } catch {
      showToast("Network error. Try again.", false);
    } finally {
      setRevoking(false);
    }
  }

  // ── Copy code ─────────────────────────────────────────────────────────────
  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ─── Render helpers ────────────────────────────────────────────────────────

  function renderNone() {
    return (
      <>
        {/* Explainer */}
        <div style={{ background: "#151515", borderRadius: 12, padding: "16px 16px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "#232323",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <IconUsers size={18} color="#ccc" />
            </div>
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>No guardian linked</div>
              <div style={{ color: "#777", fontSize: 10.5, marginTop: 2 }}>Generate a code for your parent or guardian</div>
            </div>
          </div>
          <p style={{ color: "#666", fontSize: 11, lineHeight: 1.6, margin: 0 }}>
            Once linked, your guardian can monitor your training activity and receive weekly WhatsApp reports. They cannot edit your profile.
          </p>
        </div>

        {/* Age group selector */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: "#777", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10, paddingLeft: 2 }}>
            Your age group
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(["u13", "u17"] as const).map((ag) => (
              <button
                key={ag}
                onClick={() => setAgeGroup(ag)}
                style={{
                  padding: "12px 0",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  background: ageGroup === ag ? "#1a5c2a" : "#151515",
                  color: ageGroup === ag ? "#c0dd97" : "#777",
                  transition: "background 0.15s",
                }}
              >
                {ag === "u13" ? "Under 13" : "Under 17"}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generateCode}
          disabled={generating}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 12,
            border: "none",
            cursor: generating ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 700,
            background: generating ? "#2a2a2a" : "#1a5c2a",
            color: generating ? "#555" : "#c0dd97",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <IconKey size={16} />
          {generating ? "Generating…" : "Generate Invite Code"}
        </button>
      </>
    );
  }

  function renderPending(s: Extract<LinkStatus, { status: "pending" }>) {
    const expiresAt = s.invite_expires_at
      ? new Date(s.invite_expires_at).toLocaleString("en-GB", {
          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        })
      : null;

    return (
      <>
        {/* Invite code card */}
        <div style={{
          background: "#151515",
          borderRadius: 16,
          padding: "24px 20px",
          textAlign: "center",
          marginBottom: 16,
        }}>
          <div style={{ color: "#777", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12 }}>
            Invite code
          </div>

          {/* The code */}
          <div style={{
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: "10px",
            color: "#c0dd97",
            background: "#0e1f0e",
            borderRadius: 12,
            padding: "18px 20px",
            display: "inline-block",
            marginBottom: 16,
          }}>
            {s.invite_code}
          </div>

          {/* Copy button */}
          <div>
            <button
              onClick={() => copyCode(s.invite_code)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                background: copied ? "#1a5c2a" : "#232323",
                color: copied ? "#c0dd97" : "#aaa",
                transition: "background 0.15s",
              }}
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              {copied ? "Copied!" : "Copy code"}
            </button>
          </div>

          {expiresAt && (
            <p style={{ color: "#555", fontSize: 10.5, marginTop: 14, marginBottom: 0 }}>
              Expires {expiresAt}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          background: "#111",
          borderRadius: 12,
          padding: "12px 14px",
          borderLeft: "3px solid #854f0b",
          marginBottom: 16,
        }}>
          <p style={{ color: "#aaa", fontSize: 11, lineHeight: 1.6, margin: 0 }}>
            Share this code with your parent or guardian. They enter it on GrassRoots Sports to link to your account. The code expires in 48 hours.
          </p>
        </div>

        {/* Regenerate */}
        <button
          onClick={generateCode}
          disabled={generating}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 10,
            border: "1px solid #2a2a2a",
            cursor: generating ? "not-allowed" : "pointer",
            fontSize: 12,
            fontWeight: 600,
            background: "transparent",
            color: "#555",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <IconRefresh size={13} />
          {generating ? "Generating…" : "Generate new code"}
        </button>
      </>
    );
  }

  function renderActive(s: Extract<LinkStatus, { status: "active" }>) {
    const linkedDate = s.linked_at
      ? new Date(s.linked_at).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric",
        })
      : null;

    return (
      <>
        {/* Guardian card */}
        <div style={{ background: "#151515", borderRadius: 12, padding: "16px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", background: "#1a5c2a",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <IconUsers size={20} color="#c0dd97" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
                {s.guardian_name ?? "Guardian"}
              </div>
              {s.guardian_whatsapp && (
                <div style={{ color: "#777", fontSize: 10.5, marginTop: 2 }}>
                  {s.guardian_whatsapp}
                </div>
              )}
              {linkedDate && (
                <div style={{ color: "#555", fontSize: 10.5, marginTop: 2 }}>
                  Linked {linkedDate}
                </div>
              )}
            </div>
            {/* Active badge */}
            <div style={{
              background: "#0e1f0e",
              color: "#c0dd97",
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 8,
              padding: "3px 8px",
              flexShrink: 0,
            }}>
              Active
            </div>
          </div>
        </div>

        {/* What they can see */}
        <div style={{
          background: "#111",
          borderRadius: 12,
          padding: "12px 14px",
          borderLeft: "3px solid #1a5c2a",
          marginBottom: 20,
        }}>
          <p style={{ color: "#777", fontSize: 11, lineHeight: 1.6, margin: 0 }}>
            Your guardian can see your training activity and receive weekly WhatsApp reports. They cannot view your messages, change your settings, or edit your profile.
          </p>
        </div>

        {/* Revoke */}
        <button
          onClick={revokeLink}
          disabled={revoking}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 10,
            border: "1px solid #3a1a1a",
            cursor: revoking ? "not-allowed" : "pointer",
            fontSize: 12,
            fontWeight: 600,
            background: "transparent",
            color: revoking ? "#555" : "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <IconTrash size={13} />
          {revoking ? "Removing…" : "Remove guardian link"}
        </button>
      </>
    );
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
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>Guardian Link</div>
          <div style={{ color: "#777", fontSize: 11, marginTop: 2 }}>Connect a parent or guardian</div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 0" }}>
        {pageLoading ? (
          <div style={{ color: "#555", fontSize: 13, textAlign: "center", marginTop: 40 }}>
            Loading…
          </div>
        ) : linkStatus.status === "none"    ? renderNone()
          : linkStatus.status === "pending"  ? renderPending(linkStatus)
          : renderActive(linkStatus)}
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.ok ? "#1a5c2a" : "#7f1d1d",
            color: toast.ok ? "#c0dd97" : "#fca5a5",
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 10,
            padding: "10px 20px",
            whiteSpace: "nowrap",
            zIndex: 999,
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
