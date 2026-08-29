"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, type AuthUser } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

export default function AcademyJoinPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const loginStore = useAuthStore((s) => s.login);

  const [form, setForm] = useState({
    name: "",
    email: "",
    academy: "",
    password: "",
  });
  const [step, setStep] = useState<"form" | "done">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // If already logged in as coach, skip to player registration
  useEffect(() => {
    if (!hasHydrated) return;
    if (user?.role === "coach" || user?.role === "admin") {
      router.replace("/coach/registered-players");
    }
  }, [hasHydrated, user, router]);

  const set = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) { setError("Please enter your full name."); return; }
    if (!form.email.trim()) { setError("Please enter your email address."); return; }
    if (!form.academy.trim()) { setError("Please enter your academy or club name."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setBusy(true);
    try {
      // 1 — Register
      const regRes = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          password_confirmation: form.password,
          role: "coach",
        }),
      });

      if (!regRes.ok) {
        const err = await regRes.json().catch(() => ({}));
        const msg =
          err?.errors?.email?.[0] ??
          err?.errors?.password?.[0] ??
          err?.message ??
          "Registration failed. Please try again.";
        setError(msg);
        setBusy(false);
        return;
      }

      // 2 — Login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const loginData = await loginRes.json();
      const token: string =
        loginData.token ?? loginData.access_token ?? loginData.data?.token;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authedUser: any =
        loginData.user ?? loginData.data?.user ?? loginData.data;

      if (!token) {
        // Account created but auto-login failed — send to login page
        router.push("/login?registered=1");
        return;
      }

      loginStore({ ...authedUser, token } as AuthUser);

      // 3 — Save academy name to profile (non-blocking)
      fetch(`${API}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${useAuthStore.getState().token ?? ""}`,
        },
        body: JSON.stringify({ club: form.academy.trim() }),
      }).catch(() => {/* non-critical */});

      // 4 — Land at player registration
      setStep("done");
      setTimeout(() => {
        router.push("/coach/registered-players");
      }, 1200);
    } catch {
      setError("Could not reach the server. Please check your connection.");
      setBusy(false);
    }
  }

  // While hydrating or redirecting existing coaches, show nothing
  if (!hasHydrated || (user && (user.role === "coach" || user.role === "admin"))) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f2ee",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "#1a5c2a",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            backgroundColor: "#c8962a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            color: "#fff",
            fontSize: 15,
            flexShrink: 0,
          }}
        >
          G
        </div>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>
          GrassRoots Sports
        </span>
      </header>

      {/* Body */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 440 }}>

          {step === "done" ? (
            /* Success state */
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: "40px 32px",
                textAlign: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ fontSize: 44, marginBottom: 16 }}>✅</div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1a5c2a",
                  marginBottom: 8,
                }}
              >
                Account created!
              </div>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                Taking you to your player registration form…
              </div>
            </div>
          ) : (
            <>
              {/* Hero text */}
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div
                  style={{
                    display: "inline-block",
                    backgroundColor: "#1a5c2a",
                    color: "#c8962a",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "4px 12px",
                    borderRadius: 20,
                    marginBottom: 14,
                  }}
                >
                  Free · Always
                </div>
                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "0 0 10px",
                    lineHeight: 1.2,
                  }}
                >
                  Register Your Players
                </h1>
                <p
                  style={{
                    fontSize: 14,
                    color: "#475569",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Create a free academy account. Every player you register gets a
                  timestamped provenance record and a downloadable certificate — no
                  subscription required.
                </p>
              </div>

              {/* Form card */}
              <form
                onSubmit={handleSubmit}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: "28px 28px 24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
                }}
              >
                <Field
                  label="Your Full Name"
                  type="text"
                  placeholder="e.g. Takudzwa Moyo"
                  value={form.name}
                  onChange={(v) => set("name", v)}
                  autoComplete="name"
                />
                <Field
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  autoComplete="email"
                />
                <Field
                  label="Academy / Club Name"
                  type="text"
                  placeholder="e.g. Harare United Academy"
                  value={form.academy}
                  onChange={(v) => set("academy", v)}
                  hint="This appears on every player certificate you issue."
                />
                <Field
                  label="Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(v) => set("password", v)}
                  autoComplete="new-password"
                />

                {error && (
                  <div
                    style={{
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#dc2626",
                      marginBottom: 16,
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    width: "100%",
                    padding: "13px",
                    backgroundColor: busy ? "#9ca3af" : "#1a5c2a",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    border: "none",
                    borderRadius: 10,
                    cursor: busy ? "not-allowed" : "pointer",
                    transition: "background-color 0.15s",
                  }}
                >
                  {busy ? "Creating account…" : "Create Account & Register Players →"}
                </button>

                <p
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    color: "#94a3b8",
                    margin: "14px 0 0",
                  }}
                >
                  No credit card. No trial period. Player registration is free forever.
                </p>
              </form>

              {/* What you can do */}
              <div
                style={{
                  marginTop: 20,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {[
                  ["📋", "Register players", "Timestamped record"],
                  ["📄", "Download certificates", "PDF provenance"],
                  ["🔗", "Verify online", "Public verify URL"],
                  ["🏅", "Link to platform", "When player joins GRS"],
                ].map(([icon, title, sub]) => (
                  <div
                    key={title}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 10,
                      padding: "12px 14px",
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                        {title}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Already have account */}
              <p
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: "#64748b",
                  marginTop: 20,
                }}
              >
                Already have an account?{" "}
                <Link
                  href="/login"
                  style={{ color: "#1a5c2a", fontWeight: 600, textDecoration: "none" }}
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 5,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1.5px solid #e2e8f0",
          borderRadius: 8,
          fontSize: 14,
          color: "#0f172a",
          backgroundColor: "#fff",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#1a5c2a")}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      />
      {hint && (
        <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>{hint}</p>
      )}
    </div>
  );
}
