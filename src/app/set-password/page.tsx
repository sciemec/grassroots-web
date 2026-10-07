"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SetPasswordForm() {
  const params   = useSearchParams();
  const router   = useRouter();
  const token    = params.get("token") ?? "";
  const email    = params.get("email") ?? "";

  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [status, setStatus]           = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg]       = useState("");

  const strength = password.length >= 8 ? (password.match(/[A-Z]/) && password.match(/[0-9]/) ? "strong" : "medium") : "weak";
  const strengthColor = strength === "strong" ? "#2ecc71" : strength === "medium" ? "#f0b429" : "#ef3340";
  const strengthLabel = strength === "strong" ? "Strong" : strength === "medium" ? "Medium" : "Too short";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email, password, password_confirmation: confirm }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Something went wrong. The link may have expired.");
      }

      setStatus("done");
      setTimeout(() => router.push("/login?registered=1"), 2500);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (!token || !email) {
    return (
      <div style={styles.card}>
        <h2 style={styles.title}>Invalid Link</h2>
        <p style={styles.subtitle}>This set-password link is missing required information. Please request a new one.</p>
        <a href="/forgot-password" style={styles.link}>Request new link</a>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div style={styles.card}>
        <div style={{ fontSize: 48, textAlign: "center" }}>✅</div>
        <h2 style={styles.title}>Password set!</h2>
        <p style={styles.subtitle}>Redirecting you to the login page…</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Set your password</h2>
      <p style={styles.subtitle}>Welcome to GrassRoots Sports. Choose a password to activate your account.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={styles.label}>Email</label>
          <input value={email} readOnly style={{ ...styles.input, opacity: 0.7, cursor: "not-allowed" }} />
        </div>

        <div>
          <label style={styles.label}>New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            required
            style={styles.input}
          />
          {password.length > 0 && (
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#ddd" }}>
                <div style={{ height: "100%", borderRadius: 2, background: strengthColor, width: strength === "strong" ? "100%" : strength === "medium" ? "60%" : "25%", transition: "width 0.2s" }} />
              </div>
              <span style={{ fontSize: 12, color: strengthColor }}>{strengthLabel}</span>
            </div>
          )}
        </div>

        <div>
          <label style={styles.label}>Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            required
            style={styles.input}
          />
        </div>

        {(status === "error" || errorMsg) && (
          <p style={{ color: "#ef3340", fontSize: 14, margin: 0 }}>{errorMsg}</p>
        )}

        <button type="submit" disabled={status === "loading"} style={styles.button}>
          {status === "loading" ? "Saving…" : "Set password & log in"}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 13, color: "#888", textAlign: "center" }}>
        Link expired?{" "}
        <a href="/forgot-password" style={styles.link}>Request a new one</a>
      </p>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <main style={styles.page}>
      <Suspense fallback={<div style={styles.card}><p style={{ textAlign: "center", color: "#888" }}>Loading…</p></div>}>
        <SetPasswordForm />
      </Suspense>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f2ee",
    padding: "24px 16px",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "40px 32px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  title: {
    margin: "0 0 8px",
    fontSize: 24,
    fontWeight: 700,
    color: "#1a5c2a",
    textAlign: "center",
  },
  subtitle: {
    margin: "0 0 24px",
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 1.5,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    padding: "12px 0",
    borderRadius: 8,
    background: "#1a5c2a",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    border: "none",
    cursor: "pointer",
    marginTop: 4,
  },
  link: {
    color: "#1a5c2a",
    fontWeight: 600,
    textDecoration: "underline",
  },
};
