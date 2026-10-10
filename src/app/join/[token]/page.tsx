"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface CoachInfo {
  coach_name: string;
  organisation: string | null;
  sport: string | null;
}

interface FormData {
  first_name: string;
  surname: string;
  date_of_birth: string;
  sport: string;
  position: string;
  phone: string;
  parent_name: string;
  parent_phone: string;
  notes: string;
}

const SPORTS = [
  "Football", "Rugby", "Athletics", "Netball", "Basketball",
  "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey",
];

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string | undefined;

  const [coach, setCoach] = useState<CoachInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    first_name: "",
    surname: "",
    date_of_birth: "",
    sport: "",
    position: "",
    phone: "",
    parent_name: "",
    parent_phone: "",
    notes: "",
  });

  // Calculate age from DOB to show guardian fields for under-13
  const age = form.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(form.date_of_birth).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      )
    : null;
  const isMinor = age !== null && age < 13;

  useEffect(() => {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/join/${token}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (json?.data) {
          setCoach(json.data);
          if (json.data.sport) {
            setForm((f) => ({ ...f, sport: json.data.sport }));
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [token]);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.first_name.trim() || !form.surname.trim() || !form.date_of_birth) {
      setError("Please fill in name and date of birth.");
      return;
    }
    if (isMinor && (!form.parent_name.trim() || !form.parent_phone.trim())) {
      setError("Guardian name and phone are required for players under 13.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/join/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || "Registration failed. Please try again.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={{ color: "#6b7280", textAlign: "center" }}>Loading…</p>
        </div>
      </div>
    );
  }

  // ── Invalid token ────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>GRS</div>
          <h1 style={styles.h1}>Link not found</h1>
          <p style={{ color: "#6b7280", textAlign: "center", marginBottom: 24 }}>
            This registration link is invalid or has been removed. Ask your
            coach to send you a new link.
          </p>
          <a href="/" style={styles.btnPrimary}>Go to GrassRoots Sports</a>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: 48, textAlign: "center", marginBottom: 8 }}>✅</div>
          <h1 style={styles.h1}>You&apos;re registered!</h1>
          <p style={{ color: "#374151", textAlign: "center", marginBottom: 8 }}>
            <strong>{form.first_name} {form.surname}</strong> has been added to{" "}
            {coach?.organisation ?? coach?.coach_name}&apos;s squad on GrassRoots Sports.
          </p>
          <p style={{ color: "#6b7280", textAlign: "center", fontSize: 14, marginBottom: 24 }}>
            Your coach will receive a notification. If you would like your own
            GRS account to track stats and get AI coaching, tap below.
          </p>
          <a href="/register" style={styles.btnPrimary}>Create your GRS account</a>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.logo}>GRS</div>
        <h1 style={styles.h1}>Join {coach?.organisation ?? coach?.coach_name}</h1>
        <p style={{ color: "#6b7280", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
          Fill in the form below. Your coach will be notified once you&apos;re registered.
        </p>

        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={styles.row}>
            <div style={styles.half}>
              <label style={styles.label}>First name *</label>
              <input style={styles.input} value={form.first_name} onChange={set("first_name")} placeholder="Tendai" required />
            </div>
            <div style={styles.half}>
              <label style={styles.label}>Surname *</label>
              <input style={styles.input} value={form.surname} onChange={set("surname")} placeholder="Moyo" required />
            </div>
          </div>

          {/* DOB */}
          <label style={styles.label}>Date of birth *</label>
          <input style={styles.input} type="date" value={form.date_of_birth} onChange={set("date_of_birth")} required />

          {/* Sport */}
          <label style={styles.label}>Sport</label>
          <select style={styles.input} value={form.sport} onChange={set("sport")}>
            <option value="">Select sport…</option>
            {SPORTS.map((s) => (
              <option key={s} value={s.toLowerCase()}>{s}</option>
            ))}
          </select>

          {/* Position */}
          <label style={styles.label}>Position / event</label>
          <input style={styles.input} value={form.position} onChange={set("position")} placeholder="e.g. Striker, Winger, 100m…" />

          {/* Phone */}
          <label style={styles.label}>Player phone (optional)</label>
          <input style={styles.input} type="tel" value={form.phone} onChange={set("phone")} placeholder="07X XXX XXXX" />

          {/* Guardian fields — shown for under-13 */}
          {isMinor && (
            <>
              <div style={styles.guardianBanner}>
                Under-13 players require a parent or guardian contact.
              </div>
              <label style={styles.label}>Parent / Guardian name *</label>
              <input style={styles.input} value={form.parent_name} onChange={set("parent_name")} placeholder="Full name" required={isMinor} />
              <label style={styles.label}>Parent / Guardian WhatsApp *</label>
              <input style={styles.input} type="tel" value={form.parent_phone} onChange={set("parent_phone")} placeholder="07X XXX XXXX" required={isMinor} />
            </>
          )}

          {/* Notes */}
          <label style={styles.label}>Notes for coach (optional)</label>
          <textarea style={{ ...styles.input, height: 72, resize: "vertical" }} value={form.notes} onChange={set("notes")} placeholder="e.g. plays for school team, previous clubs…" />

          <button type="submit" style={submitting ? styles.btnDisabled : styles.btnPrimary} disabled={submitting}>
            {submitting ? "Registering…" : "Register"}
          </button>
        </form>

        <p style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", marginTop: 16 }}>
          Powered by <strong>GrassRoots Sports</strong> — Zimbabwe&apos;s AI sports platform
        </p>
      </div>
    </div>
  );
}

// ── Inline styles (no Tailwind dependency — public page) ──────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f2ee",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "32px 16px 64px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: "32px 24px",
    width: "100%",
    maxWidth: 480,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#1a5c2a",
    color: "#f0b429",
    fontWeight: 900,
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
  },
  h1: {
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
    textAlign: "center",
    margin: "0 0 8px",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    display: "block",
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  row: {
    display: "flex",
    gap: 12,
  },
  half: {
    flex: 1,
  },
  btnPrimary: {
    display: "block",
    width: "100%",
    padding: "12px 0",
    backgroundColor: "#1a5c2a",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
    textDecoration: "none",
    marginTop: 20,
  },
  btnDisabled: {
    display: "block",
    width: "100%",
    padding: "12px 0",
    backgroundColor: "#9ca3af",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: "not-allowed",
    textAlign: "center",
    marginTop: 20,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#b91c1c",
    fontSize: 14,
    marginBottom: 8,
  },
  guardianBanner: {
    backgroundColor: "#fffbeb",
    border: "1px solid #fcd34d",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#92400e",
    fontSize: 13,
    marginTop: 16,
    marginBottom: 4,
  },
};
