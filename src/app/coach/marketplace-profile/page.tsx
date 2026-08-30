"use client";
// src/app/coach/marketplace-profile/page.tsx
// Coach Marketplace Profile Setup — coaches fill this in so players can book them

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  ChevronLeft, Save, Plus, Trash2, CheckCircle2, Loader2,
  Star, Clock, DollarSign, Users, Award, Calendar,
  Briefcase, Globe, BookOpen, AlertCircle,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SPORTS = ["Football", "Rugby", "Athletics", "Netball", "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey"];
const LANGUAGES = ["English", "Shona", "Ndebele", "Kalanga", "Tonga", "Venda", "Sotho", "Nyanja"];
const SESSION_TYPES = [
  { value: "individual",     label: "1-on-1 Individual" },
  { value: "group",          label: "Group Session" },
  { value: "video_analysis", label: "Video Analysis" },
  { value: "tactical",       label: "Tactical Review" },
  { value: "drills",         label: "Drills & Training" },
  { value: "match_analysis", label: "Match Analysis" },
];
const DURATIONS = [30, 45, 60, 90, 120];
const GRS_GREEN = "#1a5c2a";
const GRS_GOLD  = "#f0b429";

// ── Types ──────────────────────────────────────────────────────────────────

interface Credential {
  id?: string;
  name: string;
  issuer: string;
  year: number;
  document_url?: string;
}

interface AvailabilitySlot {
  id?: string;
  day: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  max_bookings: number;
}

interface MarketplaceProfile {
  current_club: string;
  current_role: string;
  former_clubs: string[];
  specialties: string[];
  coaching_style: string;
  languages: string[];
  experience: number;
  price_per_session: number;
  session_duration: number;
  session_types: string[];
  credentials: Credential[];
  availability: AvailabilitySlot[];
}

const DEFAULT_PROFILE: MarketplaceProfile = {
  current_club: "",
  current_role: "",
  former_clubs: [],
  specialties: [],
  coaching_style: "",
  languages: ["English"],
  experience: 0,
  price_per_session: 35,
  session_duration: 60,
  session_types: [],
  credentials: [],
  availability: [],
};

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={14} style={{ color: GRS_GREEN }} />
        </div>
        <h3 style={{ fontWeight: 700, fontSize: 13, color: "#111", letterSpacing: "0.01em" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "1px solid #d1d5db", borderRadius: 8,
  padding: "9px 12px", fontSize: 13, color: "#111",
  backgroundColor: "#fff", outline: "none",
};

function ChipPicker({ options, selected, onToggle }: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
              backgroundColor: active ? GRS_GREEN : "#f3f4f6",
              color: active ? "#fff" : "#374151",
              border: active ? `1px solid ${GRS_GREEN}` : "1px solid #e5e7eb",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CoachMarketplaceProfilePage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [profile, setProfile]     = useState<MarketplaceProfile>(DEFAULT_PROFILE);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Credential form state
  const [newCred, setNewCred] = useState<Credential>({ name: "", issuer: "", year: new Date().getFullYear() });
  const [addingCred, setAddingCred] = useState(false);

  // Availability slot form state
  const [newSlot, setNewSlot] = useState<AvailabilitySlot>({
    day: "Monday", start_time: "08:00", end_time: "10:00",
    is_recurring: true, max_bookings: 4,
  });
  const [addingSlot, setAddingSlot] = useState(false);

  // Former clubs input
  const [clubInput, setClubInput] = useState("");

  // ── Load profile ──────────────────────────────────────────────────────

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/coaches/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const p = data.data ?? data;
        setProfile({
          current_club:    p.current_club    ?? "",
          current_role:    p.current_role    ?? "",
          former_clubs:    Array.isArray(p.former_clubs)   ? p.former_clubs   : [],
          specialties:     Array.isArray(p.specialties)    ? p.specialties    : [],
          coaching_style:  p.coaching_style  ?? "",
          languages:       Array.isArray(p.languages)      ? p.languages      : ["English"],
          experience:      p.experience      ?? 0,
          price_per_session: parseFloat(p.price_per_session) || 35,
          session_duration:  parseInt(p.session_duration)   || 60,
          session_types:   Array.isArray(p.session_types)  ? p.session_types  : [],
          credentials:     Array.isArray(p.credentials)    ? p.credentials    : [],
          availability:    Array.isArray(p.availability)   ? p.availability   : [],
        });
      } else {
        // Profile doesn't exist yet — use defaults (coach sets it up for the first time)
        setProfile(DEFAULT_PROFILE);
      }
    } catch {
      // Offline / Render cold start — load from localStorage fallback
      const cached = localStorage.getItem("coach_marketplace_profile");
      if (cached) {
        try { setProfile(JSON.parse(cached)); } catch { /* ignore */ }
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Save profile ──────────────────────────────────────────────────────

  async function saveProfile() {
    setSaving(true);
    setError(null);
    try {
      const body = {
        current_club:      profile.current_club,
        current_role:      profile.current_role,
        former_clubs:      profile.former_clubs,
        specialties:       profile.specialties,
        coaching_style:    profile.coaching_style,
        languages:         profile.languages,
        experience:        profile.experience,
        price_per_session: profile.price_per_session,
        session_duration:  profile.session_duration,
        session_types:     profile.session_types,
      };

      const res = await fetch(`${API_URL}/coaches/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message ?? `Server error ${res.status}`);
      }

      // Also cache to localStorage for offline
      localStorage.setItem("coach_marketplace_profile", JSON.stringify(profile));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      // Fallback: save to localStorage so data is not lost
      localStorage.setItem("coach_marketplace_profile", JSON.stringify(profile));
      setError("Saved locally. Backend not yet connected — push the Laravel backend to Render to persist online.");
    } finally {
      setSaving(false);
    }
  }

  // ── Credential helpers ────────────────────────────────────────────────

  async function addCredential() {
    if (!newCred.name || !newCred.issuer) return;
    const cred: Credential = { ...newCred };

    try {
      const res = await fetch(`${API_URL}/coaches/me/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(cred),
      });
      if (res.ok) {
        const data = await res.json();
        const saved = data.data ?? data;
        setProfile(p => ({ ...p, credentials: [...p.credentials, { ...cred, id: saved.id }] }));
      } else {
        // Optimistic local add
        setProfile(p => ({ ...p, credentials: [...p.credentials, { ...cred, id: `tmp-${Date.now()}` }] }));
      }
    } catch {
      setProfile(p => ({ ...p, credentials: [...p.credentials, { ...cred, id: `tmp-${Date.now()}` }] }));
    }
    setNewCred({ name: "", issuer: "", year: new Date().getFullYear() });
    setAddingCred(false);
  }

  async function removeCredential(id: string) {
    setProfile(p => ({ ...p, credentials: p.credentials.filter(c => c.id !== id) }));
    if (!id.startsWith("tmp-")) {
      fetch(`${API_URL}/coaches/me/credentials/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }

  // ── Availability slot helpers ─────────────────────────────────────────

  async function addSlot() {
    if (!newSlot.day || !newSlot.start_time || !newSlot.end_time) return;
    const slot: AvailabilitySlot = { ...newSlot };

    try {
      const res = await fetch(`${API_URL}/coaches/me/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(slot),
      });
      if (res.ok) {
        const data = await res.json();
        const saved = data.data ?? data;
        setProfile(p => ({ ...p, availability: [...p.availability, { ...slot, id: saved.id }] }));
      } else {
        setProfile(p => ({ ...p, availability: [...p.availability, { ...slot, id: `tmp-${Date.now()}` }] }));
      }
    } catch {
      setProfile(p => ({ ...p, availability: [...p.availability, { ...slot, id: `tmp-${Date.now()}` }] }));
    }
    setNewSlot({ day: "Monday", start_time: "08:00", end_time: "10:00", is_recurring: true, max_bookings: 4 });
    setAddingSlot(false);
  }

  async function removeSlot(id: string) {
    setProfile(p => ({ ...p, availability: p.availability.filter(s => s.id !== id) }));
    if (!id.startsWith("tmp-")) {
      fetch(`${API_URL}/coaches/me/availability/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }

  // ── Chip toggle helpers ───────────────────────────────────────────────

  function toggleChip(field: "specialties" | "languages" | "session_types", value: string) {
    setProfile(p => {
      const arr = p[field] as string[];
      return {
        ...p,
        [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  }

  // ── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: GRS_GREEN }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header style={{
        backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/coach" style={{ display: "flex", alignItems: "center", color: "#6b7280", textDecoration: "none" }}>
                <ChevronLeft size={18} />
              </Link>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Marketplace Profile</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>
                  {user?.name ? `@${user.name.toLowerCase().replace(/\s+/g, "")}` : "Set up your coaching profile"}
                </div>
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 10, border: "none", cursor: saving ? "not-allowed" : "pointer",
                backgroundColor: saved ? "#16a34a" : GRS_GREEN, color: "#fff",
                fontSize: 12, fontWeight: 700,
              }}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* Error banner */}
        {error && (
          <div style={{
            backgroundColor: "#fffbeb", border: "1px solid #fbbf24",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <AlertCircle size={14} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#92400e", margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Visibility notice */}
        <div style={{
          backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 12, padding: "12px 14px", marginBottom: 20,
          display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <Star size={14} style={{ color: GRS_GREEN, flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: GRS_GREEN, margin: "0 0 3px" }}>
              This profile is visible to all players on the platform
            </p>
            <p style={{ fontSize: 11, color: "#166534", margin: 0 }}>
              Complete every section to appear higher in search results and attract more bookings.
            </p>
          </div>
        </div>

        {/* ── 1. Basic Info ── */}
        <SectionCard title="Basic Information" icon={Briefcase}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <InputField label="Current Club / School">
              <input
                style={inputStyle}
                value={profile.current_club}
                onChange={e => setProfile(p => ({ ...p, current_club: e.target.value }))}
                placeholder="e.g. Dynamos FC"
              />
            </InputField>
            <InputField label="Your Role">
              <input
                style={inputStyle}
                value={profile.current_role}
                onChange={e => setProfile(p => ({ ...p, current_role: e.target.value }))}
                placeholder="e.g. Head Coach"
              />
            </InputField>
          </div>
          <InputField label="Years of Coaching Experience">
            <input
              type="number" min={0} max={50}
              style={{ ...inputStyle, width: 120 }}
              value={profile.experience}
              onChange={e => setProfile(p => ({ ...p, experience: parseInt(e.target.value) || 0 }))}
            />
          </InputField>
          <InputField label="Coaching Style">
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              value={profile.coaching_style}
              onChange={e => setProfile(p => ({ ...p, coaching_style: e.target.value }))}
              placeholder="Describe your coaching philosophy and approach..."
            />
          </InputField>
        </SectionCard>

        {/* ── 2. Specialties & Languages ── */}
        <SectionCard title="Specialties &amp; Languages" icon={Globe}>
          <InputField label="Sports You Coach">
            <ChipPicker
              options={SPORTS}
              selected={profile.specialties}
              onToggle={v => toggleChip("specialties", v)}
            />
          </InputField>
          <InputField label="Languages">
            <ChipPicker
              options={LANGUAGES}
              selected={profile.languages}
              onToggle={v => toggleChip("languages", v)}
            />
          </InputField>
        </SectionCard>

        {/* ── 3. Session Settings ── */}
        <SectionCard title="Session Settings" icon={DollarSign}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <InputField label="Price per Session (USD)">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>$</span>
                <input
                  type="number" min={0} step={5}
                  style={{ ...inputStyle, width: 90 }}
                  value={profile.price_per_session}
                  onChange={e => setProfile(p => ({ ...p, price_per_session: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </InputField>
            <InputField label="Session Duration">
              <select
                style={inputStyle}
                value={profile.session_duration}
                onChange={e => setProfile(p => ({ ...p, session_duration: parseInt(e.target.value) }))}
              >
                {DURATIONS.map(d => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </InputField>
          </div>
          <InputField label="Session Types You Offer">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SESSION_TYPES.map(st => {
                const active = profile.session_types.includes(st.value);
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => toggleChip("session_types", st.value)}
                    style={{
                      padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", transition: "all 0.15s",
                      backgroundColor: active ? "#f0fdf4" : "#f9fafb",
                      color: active ? GRS_GREEN : "#6b7280",
                      border: active ? `1.5px solid ${GRS_GREEN}` : "1.5px solid #e5e7eb",
                    }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </InputField>
        </SectionCard>

        {/* ── 4. Credentials ── */}
        <SectionCard title="Credentials &amp; Licences" icon={Award}>
          {profile.credentials.length === 0 && !addingCred && (
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
              No credentials added yet. Add your CAF licence, ZIFA certificates, etc.
            </p>
          )}

          {/* Existing credentials */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
            {profile.credentials.map(cred => (
              <div key={cred.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                backgroundColor: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "9px 12px",
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: 0 }}>{cred.name}</p>
                  <p style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 0" }}>{cred.issuer} · {cred.year}</p>
                </div>
                <button
                  onClick={() => cred.id && removeCredential(cred.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add credential form */}
          {addingCred ? (
            <div style={{
              backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 10, padding: 14,
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                <InputField label="Credential Name">
                  <input
                    style={inputStyle} placeholder="e.g. CAF A Licence"
                    value={newCred.name}
                    onChange={e => setNewCred(c => ({ ...c, name: e.target.value }))}
                  />
                </InputField>
                <InputField label="Issuer">
                  <input
                    style={inputStyle} placeholder="e.g. CAF"
                    value={newCred.issuer}
                    onChange={e => setNewCred(c => ({ ...c, issuer: e.target.value }))}
                  />
                </InputField>
                <InputField label="Year">
                  <input
                    type="number" style={inputStyle} min={1980} max={2030}
                    value={newCred.year}
                    onChange={e => setNewCred(c => ({ ...c, year: parseInt(e.target.value) || 2024 }))}
                  />
                </InputField>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={addCredential}
                  disabled={!newCred.name || !newCred.issuer}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "none",
                    backgroundColor: !newCred.name || !newCred.issuer ? "#d1d5db" : GRS_GREEN,
                    color: "#fff", fontSize: 12, fontWeight: 700, cursor: !newCred.name || !newCred.issuer ? "not-allowed" : "pointer",
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => setAddingCred(false)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #d1d5db", backgroundColor: "#fff", fontSize: 12, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingCred(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, border: `1px dashed ${GRS_GREEN}`,
                backgroundColor: "#f0fdf4", color: GRS_GREEN, fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              <Plus size={13} /> Add Credential
            </button>
          )}
        </SectionCard>

        {/* ── 5. Availability Slots ── */}
        <SectionCard title="Weekly Availability" icon={Calendar}>
          <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>
            Add recurring weekly slots when you are available for bookings.
          </p>

          {/* Existing slots */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
            {profile.availability.map(slot => (
              <div key={slot.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                backgroundColor: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "9px 12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    backgroundColor: "#dcfce7", borderRadius: 6,
                    padding: "2px 8px", fontSize: 11, fontWeight: 700, color: "#15803d",
                  }}>
                    {slot.day}
                  </div>
                  <span style={{ fontSize: 13, color: "#374151" }}>
                    {slot.start_time} – {slot.end_time}
                  </span>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>
                    · max {slot.max_bookings} bookings
                  </span>
                </div>
                <button
                  onClick={() => slot.id && removeSlot(slot.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add slot form */}
          {addingSlot ? (
            <div style={{
              backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 10, padding: 14,
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                <InputField label="Day">
                  <select
                    style={inputStyle}
                    value={newSlot.day}
                    onChange={e => setNewSlot(s => ({ ...s, day: e.target.value }))}
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </InputField>
                <InputField label="Start">
                  <input
                    type="time" style={inputStyle}
                    value={newSlot.start_time}
                    onChange={e => setNewSlot(s => ({ ...s, start_time: e.target.value }))}
                  />
                </InputField>
                <InputField label="End">
                  <input
                    type="time" style={inputStyle}
                    value={newSlot.end_time}
                    onChange={e => setNewSlot(s => ({ ...s, end_time: e.target.value }))}
                  />
                </InputField>
                <InputField label="Max Bookings">
                  <input
                    type="number" min={1} max={20} style={inputStyle}
                    value={newSlot.max_bookings}
                    onChange={e => setNewSlot(s => ({ ...s, max_bookings: parseInt(e.target.value) || 1 }))}
                  />
                </InputField>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={addSlot}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "none",
                    backgroundColor: GRS_GREEN, color: "#fff",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Add Slot
                </button>
                <button
                  onClick={() => setAddingSlot(false)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #d1d5db", backgroundColor: "#fff", fontSize: 12, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingSlot(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, border: `1px dashed ${GRS_GREEN}`,
                backgroundColor: "#f0fdf4", color: GRS_GREEN, fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              <Plus size={13} /> Add Time Slot
            </button>
          )}
        </SectionCard>

        {/* ── 6. Former Clubs ── */}
        <SectionCard title="Former Clubs &amp; Teams" icon={Users}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {profile.former_clubs.map((club, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 4,
                backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb",
                borderRadius: 20, padding: "4px 10px",
              }}>
                <span style={{ fontSize: 12, color: "#374151" }}>{club}</span>
                <button
                  onClick={() => setProfile(p => ({ ...p, former_clubs: p.former_clubs.filter((_, idx) => idx !== i) }))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="e.g. Caps United"
              value={clubInput}
              onChange={e => setClubInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && clubInput.trim()) {
                  setProfile(p => ({ ...p, former_clubs: [...p.former_clubs, clubInput.trim()] }));
                  setClubInput("");
                }
              }}
            />
            <button
              onClick={() => {
                if (clubInput.trim()) {
                  setProfile(p => ({ ...p, former_clubs: [...p.former_clubs, clubInput.trim()] }));
                  setClubInput("");
                }
              }}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "none",
                backgroundColor: "#f3f4f6", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              Add
            </button>
          </div>
          <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>Press Enter or click Add</p>
        </SectionCard>

        {/* ── Preview Link ── */}
        <div style={{
          backgroundColor: "#1a1a1a", borderRadius: 12, padding: "14px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={14} style={{ color: GRS_GOLD }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>See how players see your profile</p>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>Players browse coaches at /player/coaching/browse</p>
            </div>
          </div>
          <Link
            href={`/player/coaching/${user?.id ?? "me"}`}
            style={{
              fontSize: 11, fontWeight: 700, color: GRS_GOLD,
              textDecoration: "none", padding: "6px 12px",
              backgroundColor: "rgba(240,180,41,0.12)", borderRadius: 8,
            }}
          >
            Preview →
          </Link>
        </div>

        {/* Bottom Save */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
          <button
            onClick={saveProfile}
            disabled={saving}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 32px", borderRadius: 12, border: "none", cursor: saving ? "not-allowed" : "pointer",
              backgroundColor: saved ? "#16a34a" : GRS_GREEN, color: "#fff",
              fontSize: 14, fontWeight: 800, letterSpacing: "0.02em",
            }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saving ? "Saving..." : saved ? "Profile Saved!" : "Save Marketplace Profile"}
          </button>
        </div>

        {/* Stats row (read-only) */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 16,
        }}>
          {[
            { icon: Clock,  label: "Session Duration", value: `${profile.session_duration} min` },
            { icon: DollarSign, label: "Price",        value: `$${profile.price_per_session}` },
            { icon: Star,   label: "Availability Slots", value: `${profile.availability.length} slots` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{
              backgroundColor: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 10, padding: "10px 12px", textAlign: "center",
            }}>
              <Icon size={14} style={{ color: GRS_GREEN, marginBottom: 4 }} />
              <p style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: 0 }}>{value}</p>
              <p style={{ fontSize: 10, color: "#9ca3af", margin: "2px 0 0" }}>{label}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
