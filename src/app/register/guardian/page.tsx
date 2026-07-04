"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, ArrowLeft, Check } from "lucide-react";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirm: string;
  whatsapp: string;
  agreed: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bhora-ai.onrender.com/api/v1";

export default function GuardianRegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirm: "",
    whatsapp: "",
    agreed: false,
  });

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const step1Valid =
    form.name.trim().length >= 2 &&
    form.email.includes("@") &&
    form.password.length >= 8 &&
    form.password === form.confirm;

  const step2Valid = form.agreed;

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          password_confirmation: form.confirm,
          role: "guardian",
          whatsapp_number: form.whatsapp.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.errors?.email?.[0] || "Registration failed. Please try again.";
        setError(msg);
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    fontSize: 14,
    color: "#111",
    outline: "none",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px 16px" }}>

      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Back */}
        <Link href="/register" style={{ display: "inline-flex", alignItems: "center",
          gap: 6, color: "#6b7280", fontSize: 13, textDecoration: "none", marginBottom: 24 }}>
          <ArrowLeft size={14} /> Back to roles
        </Link>

        {/* Card */}
        <div style={{ backgroundColor: "#fff", borderRadius: 20,
          border: "1px solid #e5e5e5", padding: "32px 28px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14,
              backgroundColor: "#dcfce7", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 12px" }}>
              <Shield size={24} color="#1a5c2a" />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 4 }}>
              Parent / Guardian
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              Monitor your child&apos;s athletic progress
            </p>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
            {[1, 2].map((s) => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 2,
                backgroundColor: step >= s ? "#1a5c2a" : "#e5e5e5",
                transition: "background-color 0.2s" }} />
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input style={inputStyle} type="text" placeholder="e.g. Tendai Moyo"
                  value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>Email Address</label>
                <input style={inputStyle} type="email" placeholder="your@email.com"
                  value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>Password <span style={{ color: "#9ca3af", fontWeight: 400 }}>(min 8 chars)</span></label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...inputStyle, paddingRight: 44 }}
                    type={showPw ? "text" : "password"}
                    placeholder="Create a password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: 14, top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      border: "none", cursor: "pointer", color: "#9ca3af" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input style={{ ...inputStyle,
                  borderColor: form.confirm && form.confirm !== form.password ? "#ef4444" : "#d1d5db" }}
                  type="password" placeholder="Repeat password"
                  value={form.confirm} onChange={(e) => set("confirm", e.target.value)} />
                {form.confirm && form.confirm !== form.password && (
                  <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>Passwords do not match</p>
                )}
              </div>

              <div>
                <label style={labelStyle}>
                  WhatsApp Number <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span>
                </label>
                <input style={inputStyle} type="tel" placeholder="+263 77 123 4567"
                  value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  Used for Guardian Addon alerts ($2/month — activate later)
                </p>
              </div>

              <button
                disabled={!step1Valid}
                onClick={() => setStep(2)}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                  cursor: step1Valid ? "pointer" : "not-allowed",
                  backgroundColor: step1Valid ? "#1a5c2a" : "#d1d5db",
                  color: "#fff", fontWeight: 800, fontSize: 14,
                }}>
                Continue
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Summary */}
              <div style={{ backgroundColor: "#f9fafb", borderRadius: 12,
                border: "1px solid #e5e5e5", padding: "16px 16px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280",
                  textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                  Account Summary
                </p>
                {[
                  { label: "Name",  value: form.name },
                  { label: "Email", value: form.email },
                  { label: "Role",  value: "Parent / Guardian" },
                  ...(form.whatsapp ? [{ label: "WhatsApp", value: form.whatsapp }] : []),
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between",
                    marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* What you get */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#374151",
                  textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                  What you get (free)
                </p>
                {[
                  "View your child's training scores and milestones",
                  "See injury risk flags from the AI",
                  "Access their public Talent Passport",
                  "Link via 6-digit invite code — no sharing passwords",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                    <Check size={14} color="#1a5c2a" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Terms */}
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                <input type="checkbox" checked={form.agreed}
                  onChange={(e) => set("agreed", e.target.checked)}
                  style={{ marginTop: 2, accentColor: "#1a5c2a", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
                  I agree to the{" "}
                  <Link href="/terms" style={{ color: "#1a5c2a" }}>Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" style={{ color: "#1a5c2a" }}>Privacy Policy</Link>.
                  I understand my child must consent to linking.
                </span>
              </label>

              {error && (
                <div style={{ backgroundColor: "#fee2e2", border: "1px solid #fca5a5",
                  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(1)}
                  style={{ flex: 1, padding: "12px 0", borderRadius: 12,
                    border: "1px solid #d1d5db", backgroundColor: "#fff",
                    color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Back
                </button>
                <button
                  disabled={!step2Valid || loading}
                  onClick={handleSubmit}
                  style={{
                    flex: 2, padding: "12px 0", borderRadius: 12, border: "none",
                    cursor: step2Valid && !loading ? "pointer" : "not-allowed",
                    backgroundColor: step2Valid && !loading ? "#1a5c2a" : "#d1d5db",
                    color: "#fff", fontWeight: 800, fontSize: 14,
                  }}>
                  {loading ? "Creating account…" : "Create Account"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6b7280" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#1a5c2a", fontWeight: 700, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
