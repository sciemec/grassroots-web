"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, CheckCircle2,
  Loader2, UserCheck, Camera, AlertTriangle, Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

interface Registration {
  id: string;
  organisation_name: string;
  first_name: string;
  surname: string;
  date_of_birth: string;
  sport: string | null;
  position: string | null;
  phone: string | null;
  gender: string | null;
  province: string | null;
  school: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_foot: string | null;
  photo_url: string | null;
  notes: string | null;
  video_url: string | null;
  whatsapp_number: string | null;
  number_owner: string | null;
  consent_status: string | null;
  linked_user_id: string | null;
  match_status: "unmatched" | "pending_confirmation" | "confirmed" | "rejected" | "standalone_confirmed";
  match_flagged_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  coach_name?: string | null;
}

interface DuplicateWarning {
  other_clubs?: { organisation_name: string; match_status: string; registered_at: string }[];
  has_platform_account?: boolean;
}

const ZW_PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

export default function RegisteredPlayersPage() {
  const router = useRouter();
  const [regs, setRegs]         = useState<Registration[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastConfirmed, setLastConfirmed] = useState<{ name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);
  const [photoFile, setPhotoFile]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitError, setSubmitError]       = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const user      = useAuthStore((s) => s.user);
  const token     = useAuthStore((s) => s.token);
  const coachName = (user as { name?: string } | null)?.name ?? "Coach";
  const isAdmin   = (user as { role?: string } | null)?.role === "admin";

  const [form, setForm] = useState({
    first_name: "", surname: "", date_of_birth: "",
    sport: "", position: "", phone: "",
    gender: "", province: "", school: "",
    height_cm: "", weight_kg: "", dominant_foot: "",
    notes: "", whatsapp_number: "", number_owner: "",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get("/coach/registered-players");
      setRegs(res.data?.data ?? []);
    } catch {
      setRegs([]);
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Photo must be under 5 MB");
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadPhoto(file: File): Promise<string | null> {
    try {
      setUploadingPhoto(true);
      const ext = file.name.split(".").pop() ?? "jpg";
      const key = `player-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key, contentType: file.type }),
      });
      if (!presignRes.ok) return null;
      const { url, publicUrl } = await presignRes.json();

      const putRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) return null;
      return publicUrl as string;
    } catch {
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name || !form.surname || !form.date_of_birth) return;
    setSubmitting(true);
    setSubmitError(null);
    setDuplicateWarning(null);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        const uploaded = await uploadPhoto(photoFile);
        if (!uploaded) {
          setSubmitError("Photo upload failed. Please try again — tap the submit button to retry. If it keeps failing, remove the photo selection first.");
          return;
        }
        photoUrl = uploaded;
      }

      const res = await api.post("/coach/registered-players", {
        first_name:    form.first_name,
        surname:       form.surname,
        date_of_birth: form.date_of_birth,
        sport:         form.sport         || undefined,
        position:      form.position      || undefined,
        phone:         form.phone         || undefined,
        gender:        form.gender        || undefined,
        province:      form.province      || undefined,
        school:        form.school        || undefined,
        height_cm:     form.height_cm     ? Number(form.height_cm)   : undefined,
        weight_kg:     form.weight_kg     ? Number(form.weight_kg)   : undefined,
        dominant_foot: form.dominant_foot || undefined,
        photo_url:     photoUrl           || undefined,
        notes:         form.notes         || undefined,
      });

      const addedName = `${form.first_name} ${form.surname}`;
      setRegs((prev) => [res.data.data, ...prev]);

      if (res.data.warnings) {
        setDuplicateWarning(res.data.warnings);
      }

      setForm({
        first_name: "", surname: "", date_of_birth: "",
        sport: "", position: "", phone: "",
        gender: "", province: "", school: "",
        height_cm: "", weight_kg: "", dominant_foot: "",
        notes: "", whatsapp_number: "", number_owner: "",
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setLastConfirmed({ name: addedName });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Registration failed. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/coach" style={{ display: "flex", alignItems: "center", color: "#6b7280", textDecoration: "none" }}>
                <ArrowLeft size={16} />
              </Link>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Player Registry</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  {isAdmin
                    ? "All registrations across all coaches"
                    : `${loading ? "…" : regs.length} player${regs.length === 1 ? "" : "s"} registered`}
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/coach/squad")}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600"
            >
              <Users size={13} /> My Squad
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 56px" }}>

        {/* Confirmation screen */}
        {lastConfirmed && (
          <div style={{
            backgroundColor: "#fff", border: "1px solid #bbf7d0", borderRadius: 16,
            padding: "40px 24px", textAlign: "center", marginBottom: 24,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", backgroundColor: "#dcfce7",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <CheckCircle2 size={32} color="#16a34a" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 20, color: "#111", margin: "0 0 6px" }}>
              {lastConfirmed.name} added to your squad
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 28px" }}>
              A certificate is ready to download from their squad profile.
              When they join the platform, you&apos;ll get a notification to confirm the match.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => setLastConfirmed(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  backgroundColor: "#1a5c2a", color: "#fff",
                  border: "none", borderRadius: 10, padding: "12px 22px",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}
              >
                <Plus size={16} /> Register another
              </button>
              <button
                onClick={() => router.push("/coach/squad")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  backgroundColor: "#fff", color: "#1a5c2a",
                  border: "2px solid #1a5c2a", borderRadius: 10, padding: "12px 22px",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}
              >
                <Users size={16} /> Go to My Squad
              </button>
            </div>
          </div>
        )}

        {/* Explainer */}
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold text-blue-800">How this works</p>
          <p className="mt-0.5 text-xs text-blue-600">
            Register a player now — even if they don&apos;t have a GrassRoots account yet.
            When they sign up with the same name and date of birth, you&apos;ll get a notification
            to confirm the match. Once confirmed, your academy&apos;s name appears permanently
            on their Talent Passport as a provenance record. You can manage and edit players
            from <Link href="/coach/squad" className="font-semibold underline">My Squad</Link>.
          </p>
        </div>

        {/* Duplicate warning banner */}
        {duplicateWarning && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-bold text-amber-800">Duplicate Alert</p>
                {duplicateWarning.has_platform_account && (
                  <p className="mt-0.5 text-xs text-amber-700">
                    This player already has a GrassRoots account. Go to My Squad — they may already appear as a pending match.
                  </p>
                )}
                {duplicateWarning.other_clubs && duplicateWarning.other_clubs.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs text-amber-700">This player is also registered with:</p>
                    {duplicateWarning.other_clubs.map((c, i) => (
                      <p key={i} className="mt-0.5 text-xs font-semibold text-amber-800">· {c.organisation_name}</p>
                    ))}
                    <p className="mt-1 text-[11px] text-amber-600">
                      The player&apos;s Talent Passport will show all academies that registered them — this is intentional for provenance purposes.
                    </p>
                  </div>
                )}
                <button onClick={() => setDuplicateWarning(null)} className="mt-2 text-[11px] font-semibold text-amber-700 underline">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add form — always visible for coaches */}
        {!isAdmin && !lastConfirmed && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">Register a Player</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Fill in as much as you know — all fields except name and DOB are optional</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Photo upload */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Player Photo</label>
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="flex h-16 w-16 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-200 bg-gray-50 hover:border-[#1a5c2a] hover:bg-green-50 transition-colors"
                  >
                    {photoPreview
                      ? <img src={photoPreview} alt="preview" className="h-full w-full object-cover" />
                      : <Camera size={18} className="text-gray-300" />
                    }
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      {photoPreview ? "Change photo" : "Choose photo"}
                    </button>
                    <p className="mt-0.5 text-[10px] text-gray-400">JPG or PNG · max 5 MB</p>
                  </div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>
              </div>

              {/* Identity — required */}
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Identity *</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">First Name *</label>
                    <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="Tino" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">Surname *</label>
                    <input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="Chikosi" />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">Date of Birth *</label>
                    <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">Gender</label>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none">
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Location & School</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">Province</label>
                    <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none">
                      <option value="">Select...</option>
                      {ZW_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">School / Club</label>
                    <input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="e.g. Harare High School" />
                  </div>
                </div>
              </div>

              {/* Sport profile */}
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Sport Profile</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">Sport</label>
                    <select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none">
                      <option value="">Select...</option>
                      {["Football", "Rugby", "Athletics", "Netball", "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey"].map((s) => (
                        <option key={s} value={s.toLowerCase()}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">Position</label>
                    <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="e.g. Striker" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-semibold text-gray-500">Dominant Foot</label>
                  <div className="flex gap-2">
                    {["Right", "Left", "Both"].map((f) => (
                      <button
                        key={f} type="button"
                        onClick={() => setForm({ ...form, dominant_foot: form.dominant_foot === f.toLowerCase() ? "" : f.toLowerCase() })}
                        className="flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors"
                        style={{
                          borderColor: form.dominant_foot === f.toLowerCase() ? "#1a5c2a" : "#e5e7eb",
                          backgroundColor: form.dominant_foot === f.toLowerCase() ? "#f0fdf4" : "#fff",
                          color: form.dominant_foot === f.toLowerCase() ? "#1a5c2a" : "#6b7280",
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Physical */}
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Physical</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">Height (cm)</label>
                    <input type="number" min="50" max="250" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="165" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">Weight (kg)</label>
                    <input type="number" min="20" max="200" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="60" />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Contact</p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">Player / Guardian Phone</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="+263 77 123 4567" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">Parent / Guardian WhatsApp Number</label>
                    <input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="+263712345678 (E.164 format)" />
                    <p className="mt-0.5 text-[10px] text-gray-400">Used to send guardian consent requests. Must start with + and country code.</p>
                  </div>
                  {form.whatsapp_number && (
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">WhatsApp number belongs to</label>
                      <div className="flex gap-2">
                        {[
                          { value: "parent",   label: "Parent" },
                          { value: "guardian", label: "Guardian" },
                        ].map(({ value, label }) => (
                          <button
                            key={value} type="button"
                            onClick={() => setForm({ ...form, number_owner: form.number_owner === value ? "" : value })}
                            className="flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors"
                            style={{
                              borderColor: form.number_owner === value ? "#1a5c2a" : "#e5e7eb",
                              backgroundColor: form.number_owner === value ? "#f0fdf4" : "#fff",
                              color: form.number_owner === value ? "#1a5c2a" : "#6b7280",
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Coach notes */}
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Coach Notes</p>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none resize-none" placeholder="e.g. Excellent pace, needs work on left foot" />
              </div>

              {submitError && (
                <p style={{ fontSize: 12, color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", margin: 0 }}>
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || uploadingPhoto}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                {(submitting || uploadingPhoto) ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {uploadingPhoto ? "Uploading photo..." : submitting ? "Registering..." : "Register Player"}
              </button>
            </form>
          </div>
        )}

        {/* Admin view — loading / empty state */}
        {isAdmin && loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        )}

        {isAdmin && !loading && regs.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <UserCheck size={40} className="mb-3 text-gray-200" />
            <p className="text-sm font-semibold text-gray-400">No players registered yet</p>
          </div>
        )}

      </div>
    </div>
  );
}
