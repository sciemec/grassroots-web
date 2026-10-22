"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, CheckCircle2, Clock, X, UserCheck,
  Loader2, Trash2, ShieldCheck, AlertCircle, Download, Play, ChevronUp, Star,
  Camera, AlertTriangle, Pencil, Lock, Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import jsPDF from "jspdf";
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
  coach_name?: string | null; // only present in admin view
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

interface SkillRating {
  code: string;
  display_name: string;
  rating: number;
  notes?: string | null;
  rated_at?: string;
  sort_order?: number;
}

const SKILL_CODES = ["dribbling", "first_touch", "shooting", "sprint", "passing", "tackling"];
const SKILL_LABELS: Record<string, string> = {
  dribbling:   "Dribbling",
  first_touch: "First Touch",
  shooting:    "Shooting",
  sprint:      "Sprint",
  passing:     "Passing",
  tackling:    "Tackling",
};
const SKILL_EMOJIS: Record<string, string> = {
  dribbling:   "🏃",
  first_touch: "🎯",
  shooting:    "⚽",
  sprint:      "💨",
  passing:     "🔄",
  tackling:    "🛡️",
};
function segColor(v: number): string {
  if (v <= 3) return "#ef4444";
  if (v <= 5) return "#f59e0b";
  if (v <= 7) return "#4ade80";
  if (v <= 9) return "#c0dd97";
  return "#c8962a";
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const STATUS_CONFIG = {
  unmatched:            { label: "Not yet on platform",  color: "#6b7280", bg: "#f3f4f6",    icon: Clock },
  pending_confirmation: { label: "Match found — confirm?", color: "#d97706", bg: "#fef3c7", icon: AlertCircle },
  confirmed:            { label: "Linked to Passport",   color: "#16a34a", bg: "#dcfce7",    icon: CheckCircle2 },
  rejected:             { label: "Match rejected",       color: "#dc2626", bg: "#fee2e2",    icon: X },
  standalone_confirmed: { label: "Confirmed by academy", color: "#0369a1", bg: "#e0f2fe",    icon: ShieldCheck },
};

function StatusBadge({ status }: { status: Registration["match_status"] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function generateCertificate(reg: Registration, coachName: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;

  // ── Green header ──────────────────────────────────────────────────────────
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 32, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("GRASSROOTS SPORTS ZIMBABWE", W / 2, 13, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Zimbabwe's AI-Powered Sports Platform  ·  grassrootssports.live", W / 2, 21, { align: "center" });

  // Gold accent line
  doc.setFillColor(200, 150, 42);
  doc.rect(0, 32, W, 2, "F");

  // ── Title ─────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(26, 92, 42);
  doc.text("PLAYER REGISTRATION CERTIFICATE", W / 2, 50, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text("Official Provenance Record — GrassRoots Sports Platform", W / 2, 57, { align: "center" });

  // ── Player details box ────────────────────────────────────────────────────
  let y = 67;
  doc.setFillColor(240, 247, 242);
  doc.setDrawColor(26, 92, 42);
  doc.setLineWidth(0.3);
  doc.rect(15, y, W - 30, 50, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(26, 92, 42);
  doc.text("PLAYER DETAILS", 20, y + 8);

  const playerName = `${reg.first_name} ${reg.surname}`;
  const dob = new Date(reg.date_of_birth).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const playerFields: [string, string][] = [
    ["Full Name",     playerName],
    ["Date of Birth", dob],
    ["Sport",         reg.sport ? reg.sport.charAt(0).toUpperCase() + reg.sport.slice(1) : "Not specified"],
    ["Position",      reg.position || "Not specified"],
  ];

  playerFields.forEach(([label, value], i) => {
    const fy = y + 16 + i * 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(label + ":", 22, fy);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 17, 17);
    doc.text(value, 78, fy);
  });

  // ── Registration details box ───────────────────────────────────────────────
  y = 126;
  doc.setFillColor(240, 247, 242);
  doc.rect(15, y, W - 30, 60, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(26, 92, 42);
  doc.text("REGISTRATION DETAILS", 20, y + 8);

  const registrationDate = new Date(reg.created_at).toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }) + " UTC";

  const confirmedDate = reg.confirmed_at
    ? new Date(reg.confirmed_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const statusLabel =
    reg.match_status === "confirmed"
      ? `Linked to Talent Passport${confirmedDate ? ` (${confirmedDate})` : ""}`
      : reg.match_status === "standalone_confirmed"
      ? `Confirmed by Academy${confirmedDate ? ` (${confirmedDate})` : ""}`
      : reg.match_status === "pending_confirmation"
      ? "Pending Coach Confirmation"
      : "Awaiting Player Registration";

  const refShort = reg.id.toUpperCase().slice(0, 8);

  const regFields: [string, string][] = [
    ["Academy / Club",  reg.organisation_name],
    ["Registered by",   coachName],
    ["Date Registered", registrationDate],
    ["Status",          statusLabel],
    ["GRS Reference",   `GRS-${refShort}`],
  ];

  regFields.forEach(([label, value], i) => {
    const fy = y + 16 + i * 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(label + ":", 22, fy);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 17, 17);
    doc.text(value, 78, fy);
  });

  // ── Provenance statement ───────────────────────────────────────────────────
  y = 196;
  doc.setFillColor(255, 253, 235);
  doc.setDrawColor(200, 150, 42);
  doc.setLineWidth(0.4);
  doc.rect(15, y, W - 30, 46, "FD");

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(8.5);
  doc.setTextColor(70, 50, 0);
  const lines = [
    `This document certifies that ${playerName}, born ${dob},`,
    `was first registered and trained under ${reg.organisation_name}`,
    `on ${registrationDate}.`,
    "This timestamp is stored on GrassRoots Sports Zimbabwe servers",
    "and constitutes the official provenance record for this athlete.",
  ];
  lines.forEach((line, i) => {
    doc.text(line, W / 2, y + 10 + i * 7, { align: "center" });
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(26, 92, 42);
  doc.text(`Verify: grassrootssports.live/verify/${reg.id}`, W / 2, y + 41, { align: "center" });

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFillColor(200, 150, 42);
  doc.rect(0, 268, W, 1.5, "F");
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 269.5, W, 27.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("GrassRoots Sports Zimbabwe  ·  Empowering Athletes Across Zimbabwe", W / 2, 279, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(160, 210, 175);
  const genDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  doc.text(`Certificate generated: ${genDate}  ·  This is an official GrassRoots Sports document`, W / 2, 287, { align: "center" });

  doc.save(`GRS-Certificate-${reg.first_name}-${reg.surname}.pdf`);
}

export default function RegisteredPlayersPage() {
  const router = useRouter();
  const [regs, setRegs]         = useState<Registration[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [lastConfirmed, setLastConfirmed] = useState<{ name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId]     = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);
  const [photoFile, setPhotoFile]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitError, setSubmitError]       = useState<string | null>(null);
  const [actionError, setActionError]       = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError]           = useState<string | null>(null);
  const [editPhotoFile, setEditPhotoFile]   = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    first_name: "", surname: "", date_of_birth: "",
    sport: "", position: "", phone: "",
    gender: "", province: "", school: "",
    height_cm: "", weight_kg: "", dominant_foot: "",
    notes: "", whatsapp_number: "", number_owner: "",
  });

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

      // Get presigned URL from existing R2 route
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key, contentType: file.type }),
      });
      if (!presignRes.ok) return null;
      const { url, publicUrl } = await presignRes.json();

      // PUT directly to R2
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
      // Upload photo first if one was selected — hard stop on failure
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

      // Show duplicate warnings if backend found any — but don't block
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
      setShowForm(false);
      setLastConfirmed({ name: addedName });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Registration failed. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(id: string) {
    setActionId(id);
    setActionError(null);
    try {
      const res = await api.post(`/coach/registered-players/${id}/confirm`);
      setRegs((prev) => prev.map((r) => (r.id === id ? res.data.data : r)));
    } catch {
      setActionError("Could not confirm match. Please try again.");
    } finally {
      setActionId(null);
    }
  }

  async function handleStandaloneConfirm(id: string) {
    setActionId(id);
    setActionError(null);
    try {
      const res = await api.post(`/coach/registered-players/${id}/standalone-confirm`);
      setRegs((prev) => prev.map((r) => (r.id === id ? res.data.data : r)));
    } catch {
      setActionError("Could not confirm player. Please try again.");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id: string) {
    setActionId(id);
    setActionError(null);
    try {
      const res = await api.post(`/coach/registered-players/${id}/reject`);
      setRegs((prev) => prev.map((r) => (r.id === id ? res.data.data : r)));
    } catch {
      setActionError("Could not reject match. Please try again.");
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this registration record?")) return;
    setActionId(id);
    try {
      await api.delete(`/coach/registered-players/${id}`);
      setRegs((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // silent
    } finally {
      setActionId(null);
    }
  }

  function openEdit(reg: Registration) {
    setEditingId(reg.id);
    setEditForm({
      first_name:      reg.first_name,
      surname:         reg.surname,
      date_of_birth:   reg.date_of_birth?.slice(0, 10) ?? "",
      sport:           reg.sport          ?? "",
      position:        reg.position       ?? "",
      phone:           reg.phone          ?? "",
      gender:          reg.gender         ?? "",
      province:        reg.province       ?? "",
      school:          reg.school         ?? "",
      height_cm:       reg.height_cm      != null ? String(reg.height_cm) : "",
      weight_kg:       reg.weight_kg      != null ? String(reg.weight_kg) : "",
      dominant_foot:   reg.dominant_foot  ?? "",
      notes:           reg.notes          ?? "",
      whatsapp_number: reg.whatsapp_number ?? "",
      number_owner:    reg.number_owner   ?? "",
    });
    setEditError(null);
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      let photoUrl: string | undefined;
      if (editPhotoFile) {
        const uploaded = await uploadPhoto(editPhotoFile);
        if (!uploaded) {
          setEditError("Photo upload failed. Please try again.");
          return;
        }
        photoUrl = uploaded;
      }
      const payload: Record<string, unknown> = {
        sport:           editForm.sport          || undefined,
        position:        editForm.position       || undefined,
        phone:           editForm.phone          || undefined,
        gender:          editForm.gender         || undefined,
        province:        editForm.province       || undefined,
        school:          editForm.school         || undefined,
        height_cm:       editForm.height_cm      ? Number(editForm.height_cm)  : undefined,
        weight_kg:       editForm.weight_kg      ? Number(editForm.weight_kg)  : undefined,
        dominant_foot:   editForm.dominant_foot  || undefined,
        notes:           editForm.notes          || undefined,
        whatsapp_number: editForm.whatsapp_number || undefined,
        number_owner:    editForm.number_owner   || undefined,
      };
      if (photoUrl) payload.photo_url = photoUrl;
      // Include identity fields — server enforces the lock for non-admins
      if (editForm.first_name)    payload.first_name    = editForm.first_name;
      if (editForm.surname)       payload.surname       = editForm.surname;
      if (editForm.date_of_birth) payload.date_of_birth = editForm.date_of_birth;

      const res = await api.patch(`/coach/registered-players/${editingId}`, payload);
      setRegs((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...res.data.data } : r)));
      setEditingId(null);
      setEditPhotoFile(null);
      setEditPhotoPreview(null);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; locked_fields?: string[] } } };
      const lockedMsg = apiErr?.response?.data?.locked_fields?.length
        ? ` Locked: ${apiErr.response.data.locked_fields.join(", ")}.`
        : "";
      setEditError((apiErr?.response?.data?.message ?? "Update failed. Please try again.") + lockedMsg);
    } finally {
      setEditSubmitting(false);
    }
  }

  function handleEditPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Photo must be under 5 MB"); return; }
    setEditPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const pending   = regs.filter((r) => r.match_status === "pending_confirmation");
  const confirmed = regs.filter((r) => r.match_status === "confirmed" || r.match_status === "standalone_confirmed");
  const unmatched = regs.filter((r) => r.match_status === "unmatched");
  const rejected  = regs.filter((r) => r.match_status === "rejected");

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
                <div style={{ fontSize: 11, color: "#6b7280" }}>{isAdmin ? "All registrations across all coaches" : "Register players before they join the platform"}</div>
              </div>
            </div>
            {!isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                <Plus size={13} /> Register Player
              </button>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 56px" }}>

        {/* Confirmation screen — shown immediately after a successful registration */}
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
              Their registration certificate is ready to download from the list below.
              When they join the platform, you&apos;ll get a notification to confirm the match.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => { setLastConfirmed(null); setShowForm(true); }}
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

        {/* Action error banner */}
        {actionError && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#991b1b" }}>
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b", fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>✕</button>
          </div>
        )}

        {/* Explainer */}
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold text-blue-800">How this works</p>
          <p className="mt-0.5 text-xs text-blue-600">
            Register a player now — even if they don&apos;t have a GrassRoots account yet.
            When they sign up with the same name and date of birth, you&apos;ll get a notification
            to confirm the match. Once confirmed, your academy&apos;s name appears permanently
            on their Talent Passport as a provenance record.
          </p>
        </div>

        {/* Duplicate warning banner (shown after successful save if warnings returned) */}
        {duplicateWarning && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-bold text-amber-800">Duplicate Alert</p>
                {duplicateWarning.has_platform_account && (
                  <p className="mt-0.5 text-xs text-amber-700">
                    This player already has a GrassRoots account. Check the "Action Required" section above — they may already appear as a pending match.
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

        {/* Add form */}
        {showForm && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">Register a Player</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Fill in as much as you know — all fields except name and DOB are optional</p>
              </div>
              <button onClick={() => { setShowForm(false); setPhotoFile(null); setPhotoPreview(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
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

        {/* ── Edit form ─────────────────────────────────────────────────────── */}
        {editingId && (() => {
          const editingReg = regs.find((r) => r.id === editingId);
          if (!editingReg) return null;
          const identityLocked = editingReg.match_status !== "unmatched" || editingReg.consent_status === "verified";
          const editingPhotoUrl = editPhotoPreview ?? editingReg.photo_url;
          return (
            <div className="mb-6 rounded-2xl border-2 border-[#1a5c2a] bg-white p-5 shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">
                    Edit — {editingReg.first_name} {editingReg.surname}
                  </h3>
                  {identityLocked && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600">
                      <Lock size={10} /> Name and DOB are locked (record is matched or consent verified)
                    </p>
                  )}
                </div>
                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">

                {/* Photo */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Player Photo</label>
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => editPhotoInputRef.current?.click()}
                      className="flex h-16 w-16 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-200 bg-gray-50 hover:border-[#1a5c2a] transition-colors"
                    >
                      {editingPhotoUrl
                        ? <img src={editingPhotoUrl} alt="preview" className="h-full w-full object-cover" />
                        : <Camera size={18} className="text-gray-300" />
                      }
                    </div>
                    <div>
                      <button type="button" onClick={() => editPhotoInputRef.current?.click()} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        {editingPhotoUrl ? "Change photo" : "Add photo"}
                      </button>
                      <p className="mt-0.5 text-[10px] text-gray-400">JPG or PNG · max 5 MB</p>
                    </div>
                    <input ref={editPhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleEditPhotoSelect} />
                  </div>
                </div>

                {/* Identity — locked or editable */}
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">
                    Identity {identityLocked && <span className="text-amber-500">· Locked</span>}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">First Name *</label>
                      <input
                        value={editForm.first_name}
                        onChange={(e) => !identityLocked && setEditForm({ ...editForm, first_name: e.target.value })}
                        required disabled={identityLocked}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                        style={{ borderColor: identityLocked ? "#e5e7eb" : "#d1d5db" }}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">Surname *</label>
                      <input
                        value={editForm.surname}
                        onChange={(e) => !identityLocked && setEditForm({ ...editForm, surname: e.target.value })}
                        required disabled={identityLocked}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                        style={{ borderColor: identityLocked ? "#e5e7eb" : "#d1d5db" }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">Date of Birth *</label>
                      <input type="date" value={editForm.date_of_birth}
                        onChange={(e) => !identityLocked && setEditForm({ ...editForm, date_of_birth: e.target.value })}
                        required disabled={identityLocked}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                        style={{ borderColor: identityLocked ? "#e5e7eb" : "#d1d5db" }}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">Gender</label>
                      <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none">
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
                      <select value={editForm.province} onChange={(e) => setEditForm({ ...editForm, province: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none">
                        <option value="">Select...</option>
                        {ZW_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">School / Club</label>
                      <input value={editForm.school} onChange={(e) => setEditForm({ ...editForm, school: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="e.g. Harare High School" />
                    </div>
                  </div>
                </div>

                {/* Sport Profile */}
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Sport Profile</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">Sport</label>
                      <select value={editForm.sport} onChange={(e) => setEditForm({ ...editForm, sport: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none">
                        <option value="">Select...</option>
                        {["Football", "Rugby", "Athletics", "Netball", "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey"].map((s) => (
                          <option key={s} value={s.toLowerCase()}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">Position</label>
                      <input value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="e.g. Striker" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">Dominant Foot</label>
                    <div className="flex gap-2">
                      {["Right", "Left", "Both"].map((f) => (
                        <button key={f} type="button"
                          onClick={() => setEditForm({ ...editForm, dominant_foot: editForm.dominant_foot === f.toLowerCase() ? "" : f.toLowerCase() })}
                          className="flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors"
                          style={{
                            borderColor: editForm.dominant_foot === f.toLowerCase() ? "#1a5c2a" : "#e5e7eb",
                            backgroundColor: editForm.dominant_foot === f.toLowerCase() ? "#f0fdf4" : "#fff",
                            color: editForm.dominant_foot === f.toLowerCase() ? "#1a5c2a" : "#6b7280",
                          }}
                        >{f}</button>
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
                      <input type="number" min="50" max="250" value={editForm.height_cm} onChange={(e) => setEditForm({ ...editForm, height_cm: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="165" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">Weight (kg)</label>
                      <input type="number" min="20" max="200" value={editForm.weight_kg} onChange={(e) => setEditForm({ ...editForm, weight_kg: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="60" />
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Contact</p>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">Player / Guardian Phone</label>
                      <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="+263 77 123 4567" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">Parent / Guardian WhatsApp Number</label>
                      <input value={editForm.whatsapp_number} onChange={(e) => setEditForm({ ...editForm, whatsapp_number: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none" placeholder="+263712345678" />
                      <p className="mt-0.5 text-[10px] text-amber-600">
                        ⚠ Changing this number will cancel any pending consent request.
                      </p>
                    </div>
                    {editForm.whatsapp_number && (
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-gray-500">WhatsApp number belongs to</label>
                        <div className="flex gap-2">
                          {[{ value: "parent", label: "Parent" }, { value: "guardian", label: "Guardian" }].map(({ value, label }) => (
                            <button key={value} type="button"
                              onClick={() => setEditForm({ ...editForm, number_owner: editForm.number_owner === value ? "" : value })}
                              className="flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors"
                              style={{
                                borderColor: editForm.number_owner === value ? "#1a5c2a" : "#e5e7eb",
                                backgroundColor: editForm.number_owner === value ? "#f0fdf4" : "#fff",
                                color: editForm.number_owner === value ? "#1a5c2a" : "#6b7280",
                              }}
                            >{label}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coach Notes */}
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Coach Notes</p>
                  <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none resize-none" placeholder="e.g. Excellent pace, needs work on left foot" />
                </div>

                {editError && (
                  <p style={{ fontSize: 12, color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px" }}>
                    {editError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditingId(null)} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={editSubmitting || uploadingPhoto}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-60"
                    style={{ backgroundColor: "#1a5c2a" }}
                  >
                    {(editSubmitting || uploadingPhoto) ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
                    {uploadingPhoto ? "Uploading photo..." : editSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          );
        })()}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        )}

        {!loading && regs.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <UserCheck size={40} className="mb-3 text-gray-200" />
            <p className="text-sm font-semibold text-gray-400">No players registered yet</p>
            <p className="mt-1 text-xs text-gray-300">Register players before they join — their Talent Passport will show your academy&apos;s name once they sign up.</p>
          </div>
        )}

        {/* Pending confirmation — most urgent, shown first */}
        {pending.length > 0 && (
          <section className="mb-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-amber-600">
              ⚡ Action Required — {pending.length} match{pending.length > 1 ? "es" : ""} to review
            </p>
            <div className="space-y-3">
              {pending.map((r) => (
                <RegistrationCard
                  key={r.id}
                  reg={r}
                  actionId={actionId}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                  onDelete={handleDelete}
                  onStandaloneConfirm={handleStandaloneConfirm}
                  onCertificate={() => generateCertificate(r, coachName)}
                  onEdit={openEdit}
                />
              ))}
            </div>
          </section>
        )}

        {/* Confirmed links */}
        {confirmed.length > 0 && (
          <section className="mb-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Confirmed — {confirmed.length} linked
            </p>
            <div className="space-y-3">
              {confirmed.map((r) => (
                <RegistrationCard
                  key={r.id}
                  reg={r}
                  actionId={actionId}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                  onDelete={handleDelete}
                  onStandaloneConfirm={handleStandaloneConfirm}
                  onCertificate={() => generateCertificate(r, coachName)}
                  onEdit={openEdit}
                />
              ))}
            </div>
          </section>
        )}

        {/* Unmatched */}
        {unmatched.length > 0 && (
          <section className="mb-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Waiting for player — {unmatched.length}
            </p>
            <div className="space-y-3">
              {unmatched.map((r) => (
                <RegistrationCard
                  key={r.id}
                  reg={r}
                  actionId={actionId}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                  onDelete={handleDelete}
                  onStandaloneConfirm={handleStandaloneConfirm}
                  onCertificate={() => generateCertificate(r, coachName)}
                  onEdit={openEdit}
                />
              ))}
            </div>
          </section>
        )}

        {/* Rejected matches */}
        {rejected.length > 0 && (
          <section className="mb-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-red-400">
              Match rejected — {rejected.length}
            </p>
            <div className="space-y-3">
              {rejected.map((r) => (
                <RegistrationCard
                  key={r.id}
                  reg={r}
                  actionId={actionId}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                  onDelete={handleDelete}
                  onStandaloneConfirm={handleStandaloneConfirm}
                  onCertificate={() => generateCertificate(r, coachName)}
                  onEdit={openEdit}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function RegistrationCard({
  reg, actionId, onConfirm, onReject, onDelete, onStandaloneConfirm, onCertificate, onEdit,
}: {
  reg: Registration;
  actionId: string | null;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onStandaloneConfirm: (id: string) => void;
  onCertificate: () => void;
  onEdit: (reg: Registration) => void;
}) {
  const busy = actionId === reg.id;
  const [playing, setPlaying] = useState(false);

  // ── Skill ratings ─────────────────────────────────────────────────────────
  const [showRatings, setShowRatings]         = useState(false);
  const [ratings, setRatings]                 = useState<Record<string, number>>({});
  const [ratingsLoaded, setRatingsLoaded]     = useState(false);
  const token = useAuthStore((s) => s.token);

  async function loadRatings() {
    if (ratingsLoaded) return;
    try {
      const res = await fetch(`${API_BASE}/coach/registered-players/${reg.id}/skill-ratings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const map: Record<string, number> = {};
        (json.data as SkillRating[]).forEach((r) => { map[r.code] = r.rating; });
        setRatings(map);
      }
    } catch {
      // silently ignore
    } finally {
      setRatingsLoaded(true);
    }
  }

  function handleToggleRatings() {
    if (!showRatings) loadRatings();
    setShowRatings((v) => !v);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        {/* Photo avatar */}
        <div className="flex-shrink-0">
          {reg.photo_url
            ? <img src={reg.photo_url} alt={reg.first_name} className="h-12 w-12 rounded-full object-cover border border-gray-100" />
            : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-sm font-black text-gray-400">
                {reg.first_name[0]}{reg.surname[0]}
              </div>
            )
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black text-gray-900">
              {reg.first_name} {reg.surname}
            </p>
            <StatusBadge status={reg.match_status} />
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            DOB: {new Date(reg.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            {reg.gender ? ` · ${reg.gender.charAt(0).toUpperCase() + reg.gender.slice(1)}` : ""}
            {reg.sport ? ` · ${reg.sport}` : ""}
            {reg.position ? ` · ${reg.position}` : ""}
          </p>
          {(reg.province || reg.school || reg.height_cm || reg.dominant_foot) && (
            <p className="mt-0.5 text-[10px] text-gray-400">
              {[
                reg.province,
                reg.school,
                reg.height_cm ? `${reg.height_cm} cm` : null,
                reg.weight_kg ? `${reg.weight_kg} kg` : null,
                reg.dominant_foot ? `${reg.dominant_foot.charAt(0).toUpperCase() + reg.dominant_foot.slice(1)} foot` : null,
              ].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="text-[10px] text-gray-400 mt-0.5">
            Registered under <span className="font-semibold">{reg.organisation_name}</span>
            {reg.coach_name ? <> by <span className="font-semibold">{reg.coach_name}</span></> : ""}
            {" "}on {new Date(reg.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          {reg.notes && (
            <p className="mt-1.5 text-[11px] italic text-gray-500">"{reg.notes}"</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {reg.video_url && (
            <button
              onClick={() => setPlaying((p) => !p)}
              title={playing ? "Close video" : "Play highlight clip"}
              className="rounded-lg p-1.5 transition-colors"
              style={{ color: playing ? "#1a5c2a" : "#9ca3af", backgroundColor: playing ? "#f0fdf4" : "transparent" }}
            >
              {playing ? <ChevronUp size={13} /> : <Play size={13} />}
            </button>
          )}
          <button
            onClick={() => onEdit(reg)}
            title="Edit player details"
            className="rounded-lg p-1.5 text-gray-300 hover:bg-blue-50 hover:text-blue-500 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onCertificate}
            title="Download Provenance Certificate"
            className="rounded-lg p-1.5 text-gray-300 hover:bg-green-50 hover:text-green-600 transition-colors"
          >
            <Download size={13} />
          </button>
          {reg.match_status !== "confirmed" && reg.match_status !== "standalone_confirmed" && (
            <button
              onClick={() => onDelete(reg.id)}
              disabled={busy}
              className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Inline video player */}
      {playing && reg.video_url && (
        <div style={{ marginTop: 12 }}>
          <video
            controls
            autoPlay
            src={reg.video_url}
            style={{ width: "100%", display: "block", borderRadius: 10, backgroundColor: "#000", maxHeight: 320 }}
          />
          <a
            href={reg.video_url}
            download
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, fontWeight: 700, color: "#374151", backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, padding: "3px 10px", textDecoration: "none" }}
          >
            <Download size={10} /> Download clip
          </a>
        </div>
      )}

      {/* Pending confirmation actions */}
      {reg.match_status === "pending_confirmation" && (
        <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-700">
              A player with this name and date of birth just joined. Is this the correct person?
            </p>
          </div>
          <button
            onClick={() => onReject(reg.id)}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            {busy ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
            Not them
          </button>
          <button
            onClick={() => onConfirm(reg.id)}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            {busy ? <Loader2 size={11} className="animate-spin" /> : <ShieldCheck size={11} />}
            Confirm Link
          </button>
        </div>
      )}

      {/* Confirmed — linked to platform */}
      {reg.match_status === "confirmed" && reg.confirmed_at && (
        <p className="mt-2 text-[10px] text-green-600">
          ✓ Passport linked on {new Date(reg.confirmed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      )}

      {/* Unmatched — offer standalone confirm */}
      {reg.match_status === "unmatched" && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <p className="text-[11px] text-gray-400 leading-snug">
            Player hasn&apos;t joined yet?{" "}
            <span className="text-gray-500">Mark as confirmed to close this record.</span>
          </p>
          <button
            onClick={() => onStandaloneConfirm(reg.id)}
            disabled={busy}
            className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-40 transition-colors"
          >
            {busy ? <Loader2 size={11} className="animate-spin" /> : <ShieldCheck size={11} />}
            Mark Confirmed
          </button>
        </div>
      )}

      {/* Rejected match */}
      {reg.match_status === "rejected" && (
        <p className="mt-2 text-[10px] text-red-500">
          Match rejected — the player who joined was not this person. Delete this record and re-register if needed.
        </p>
      )}

      {/* Standalone confirmed state */}
      {reg.match_status === "standalone_confirmed" && reg.confirmed_at && (
        <p className="mt-2 text-[10px] text-blue-600">
          ✓ Confirmed by academy on {new Date(reg.confirmed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · Certificate valid
        </p>
      )}

      {/* ── Skill Ratings ─────────────────────────────────────────────────── */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <button
          onClick={handleToggleRatings}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
            <Star size={12} style={{ color: "#c8962a" }} />
            Skill Ratings
          </span>
          <ChevronUp
            size={13}
            className="text-gray-400 transition-transform"
            style={{ transform: showRatings ? "rotate(0deg)" : "rotate(180deg)" }}
          />
        </button>

        {showRatings && (
          <div style={{ marginTop: 12 }}>
            {!ratingsLoaded ? (
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin" /> Loading…
              </p>
            ) : (() => {
              const ratedSkills = SKILL_CODES.filter((c) => (ratings[c] ?? 0) >= 1);
              const overall = ratedSkills.length
                ? ratedSkills.reduce((s, c) => s + ratings[c], 0) / ratedSkills.length
                : null;
              return (
                <>
                  {SKILL_CODES.map((code) => {
                    const v = ratings[code] ?? 0;
                    return (
                      <div key={code} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>
                            {SKILL_EMOJIS[code]} {SKILL_LABELS[code]}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: v ? segColor(v) : "#9ca3af", lineHeight: 1 }}>
                            {v || "—"}<span style={{ fontSize: 9, color: "#9ca3af" }}>/10</span>
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 2 }}>
                          {Array.from({ length: 10 }, (_, i) => {
                            const seg = i + 1;
                            return (
                              <div
                                key={seg}
                                style={{
                                  flex: 1, height: 6, borderRadius: 3,
                                  background: seg <= v ? segColor(seg) : "#f3f4f6",
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {overall !== null && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Overall</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: segColor(Math.round(overall)) }}>{overall.toFixed(1)}</span>
                    </div>
                  )}

                  <Link
                    href={`/coach/skill-ratings/${reg.id}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      marginTop: 10, fontSize: 11, fontWeight: 700,
                      color: "#1a5c2a", textDecoration: "none",
                    }}
                  >
                    <Star size={10} />
                    {ratedSkills.length > 0 ? "Edit ratings →" : "Rate this player →"}
                  </Link>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
