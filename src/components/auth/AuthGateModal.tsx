"use client";

// src/components/auth/AuthGateModal.tsx
//
// Rendered whenever useAuthGate fires. Shows a gentle sign-up prompt —
// not a hard block. User can always dismiss and keep browsing.
//
// Usage:
//   const { showPrompt, gateOptions, goToRegister, goToLogin, dismiss } = useAuthGate();
//   {showPrompt && (
//     <AuthGateModal
//       feature={gateOptions.feature}
//       onRegister={goToRegister}
//       onLogin={goToLogin}
//       onDismiss={dismiss}
//     />
//   )}

import { X, Trophy, Zap, Users, Star } from "lucide-react";

interface Props {
  feature?:   string;
  onRegister: () => void;
  onLogin:    () => void;
  onDismiss:  () => void;
}

const BENEFITS = [
  { icon: <Trophy size={15} />, text: "Get your AI-powered Talent Passport"   },
  { icon: <Zap    size={15} />, text: "Access 95+ drills and athletic tests"   },
  { icon: <Users  size={15} />, text: "Get discovered by scouts and agents"    },
  { icon: <Star   size={15} />, text: "Track your progress and earn badges"    },
];

const G = "#1a5c2a";

export default function AuthGateModal({ feature, onRegister, onLogin, onDismiss }: Props) {
  return (
    <div
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, padding: "28px 24px",
          maxWidth: 380, width: "100%", position: "relative",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Close */}
        <button
          onClick={onDismiss}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "#f3f4f6", border: "none", borderRadius: "50%",
            width: 28, height: 28, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#888",
          }}
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", background: G,
            margin: "0 auto 12px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 24,
          }}>
            ⚽
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#111", marginBottom: 4 }}>
            {feature ? `Join to ${feature}` : "Join Grassroots Sports Pro"}
          </div>
          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>
            Free to join. Works on any phone. No app download needed.
          </div>
        </div>

        {/* Benefits */}
        <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "center",
              marginBottom: i < BENEFITS.length - 1 ? 8 : 0,
            }}>
              <span style={{ color: G, flexShrink: 0 }}>{b.icon}</span>
              <span style={{ fontSize: 12, color: "#166534" }}>{b.text}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <button
          onClick={onRegister}
          style={{
            width: "100%", padding: 13, background: G, color: "#fff",
            borderRadius: 12, border: "none", fontWeight: 800, fontSize: 14,
            cursor: "pointer", marginBottom: 8,
          }}
        >
          Create Free Account →
        </button>
        <button
          onClick={onLogin}
          style={{
            width: "100%", padding: 11, background: "transparent", color: G,
            borderRadius: 12, border: `1px solid ${G}`,
            fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 12,
          }}
        >
          Sign in to existing account
        </button>

        {/* Dismiss */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={onDismiss}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#aaa" }}
          >
            Keep browsing without registering →
          </button>
        </div>
      </div>
    </div>
  );
}
