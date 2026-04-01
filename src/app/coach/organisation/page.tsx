"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, ChevronLeft, Plus, Trash2, Loader2,
  CheckCircle2, AlertTriangle, Users, Globe, Lock,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
  sport: string;
  age_group: string | null;
  gender: string;
  season: string | null;
}

interface Organisation {
  id: string;
  name: string;
  type: string;
  province: string;
  sports: string[];
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  slug: string;
  is_public: boolean;
  teams: Team[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

const SPORTS = [
  "Football", "Netball", "Rugby", "Athletics", "Basketball",
  "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey",
];

const ORG_TYPES = ["School", "Academy", "Club"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrganisationPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();

  const [org, setOrg] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Wizard state (for new orgs)
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", type: "School", province: "",
    sports: [] as string[],
    description: "", contact_email: "", contact_phone: "",
  });

  // Team form
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: "", sport: "", age_group: "", gender: "Mixed", season: "",
  });
  const [teamSaving, setTeamSaving] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<string | null>(null);

  // ── Auth guard ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "coach" && user.role !== "admin") { router.push("/dashboard"); return; }

    api.get("/organisation")
      .then((res) => {
        setOrg(res.data?.data ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router, _hasHydrated]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const toggleSport = (sport: string) => {
    setForm((f) => ({
      ...f,
      sports: f.sports.includes(sport)
        ? f.sports.filter((s) => s !== sport)
        : [...f.sports, sport],
    }));
  };

  const clearMessages = () => { setError(""); setSuccess(""); };

  // ── Register org ─────────────────────────────────────────────────────────────

  const handleRegister = async () => {
    clearMessages();
    setSaving(true);
    try {
      const res = await api.post("/organisation", form);
      setOrg(res.data.data);
      setSuccess("Organisation registered successfully!");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = e.response?.data?.message
        ?? Object.values(e.response?.data?.errors ?? {}).flat()[0]
        ?? "Failed to register organisation.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Update org ────────────────────────────────────────────────────────────────

  const handleTogglePublic = async () => {
    if (!org) return;
    clearMessages();
    try {
      const res = await api.patch("/organisation", { is_public: !org.is_public });
      setOrg(res.data.data);
    } catch {
      setError("Failed to update visibility.");
    }
  };

  // ── Add team ──────────────────────────────────────────────────────────────────

  const handleAddTeam = async () => {
    clearMessages();
    setTeamSaving(true);
    try {
      const res = await api.post("/organisation/teams", teamForm);
      setOrg((prev) => prev ? { ...prev, teams: [...prev.teams, res.data.data] } : prev);
      setTeamForm({ name: "", sport: "", age_group: "", gender: "Mixed", season: "" });
      setShowTeamForm(false);
      setSuccess("Team added.");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Failed to add team.");
    } finally {
      setTeamSaving(false);
    }
  };

  // ── Delete team ───────────────────────────────────────────────────────────────

  const handleDeleteTeam = async (teamId: string) => {
    clearMessages();
    setDeletingTeam(teamId);
    try {
      await api.delete(`/organisation/teams/${teamId}`);
      setOrg((prev) => prev ? { ...prev, teams: prev.teams.filter((t) => t.id !== teamId) } : prev);
    } catch {
      setError("Failed to remove team.");
    } finally {
      setDeletingTeam(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!_hasHydrated || loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="h-8 w-52 animate-pulse rounded-lg bg-muted mb-4" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/coach" className="rounded-lg p-1.5 hover:bg-white/10 transition-colors">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-amber-400">
              My Organisation
            </p>
            <h1 className="text-xl font-bold text-white">
              {org ? org.name : "Register Your Organisation"}
            </h1>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-500/15 px-4 py-3 text-sm text-green-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* ── Registered org view ─────────────────────────────────────────── */}
        {org ? (
          <div className="space-y-5">

            {/* Org profile card */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                    <Building2 className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">{org.name}</h2>
                    <p className="text-xs text-muted-foreground">{org.type} · {org.province}</p>
                  </div>
                </div>
                <button
                  onClick={handleTogglePublic}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    org.is_public
                      ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
                      : "bg-white/10 text-muted-foreground hover:bg-white/20"
                  }`}
                >
                  {org.is_public
                    ? <><Globe className="h-3.5 w-3.5" /> Public</>
                    : <><Lock className="h-3.5 w-3.5" /> Private</>
                  }
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {org.sports.map((s) => (
                  <span key={s} className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                    {s}
                  </span>
                ))}
              </div>

              {org.description && (
                <p className="mt-3 text-sm text-muted-foreground">{org.description}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {org.contact_email && <span>✉ {org.contact_email}</span>}
                {org.contact_phone && <span>📞 {org.contact_phone}</span>}
                <span className="text-white/30">
                  Fan Hub: grassrootssports.live/organisations/{org.slug}
                </span>
              </div>
            </div>

            {/* Teams */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-400" />
                  <p className="text-sm font-semibold text-white">Teams ({org.teams.length})</p>
                </div>
                <button
                  onClick={() => setShowTeamForm((v) => !v)}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Team
                </button>
              </div>

              {/* Add team form */}
              {showTeamForm && (
                <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-900/10 p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">New Team</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Team name *</label>
                      <input
                        value={teamForm.name}
                        onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. U15 Boys Football"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Sport *</label>
                      <select
                        value={teamForm.sport}
                        onChange={(e) => setTeamForm((f) => ({ ...f, sport: e.target.value }))}
                        className="w-full rounded-lg border border-white/10 bg-[#0d2b1a] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                      >
                        <option value="">Select sport</option>
                        {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Age group</label>
                      <input
                        value={teamForm.age_group}
                        onChange={(e) => setTeamForm((f) => ({ ...f, age_group: e.target.value }))}
                        placeholder="e.g. U15, U17, Senior"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Gender</label>
                      <select
                        value={teamForm.gender}
                        onChange={(e) => setTeamForm((f) => ({ ...f, gender: e.target.value }))}
                        className="w-full rounded-lg border border-white/10 bg-[#0d2b1a] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                      >
                        <option value="Mixed">Mixed</option>
                        <option value="Boys">Boys</option>
                        <option value="Girls">Girls</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleAddTeam}
                      disabled={!teamForm.name || !teamForm.sport || teamSaving}
                      className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-[#0d2b1a] hover:bg-amber-400 disabled:opacity-50 transition-colors"
                    >
                      {teamSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Save Team
                    </button>
                    <button
                      onClick={() => setShowTeamForm(false)}
                      className="rounded-xl border border-white/10 px-4 py-2 text-xs text-muted-foreground hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Teams list */}
              {org.teams.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/20 p-6 text-center">
                  <Users className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No teams yet — add your first team above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {org.teams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-white">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.sport}
                          {team.age_group ? ` · ${team.age_group}` : ""}
                          {` · ${team.gender}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        disabled={deletingTeam === team.id}
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                      >
                        {deletingTeam === team.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        ) : (
          /* ── Registration wizard ──────────────────────────────────────── */
          <div className="mx-auto max-w-lg">

            {/* Step indicator */}
            <div className="mb-6 flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step === s ? "bg-amber-500 text-[#0d2b1a]"
                    : step > s ? "bg-green-500/20 text-green-400"
                    : "bg-white/10 text-muted-foreground"
                  }`}>
                    {step > s ? "✓" : s}
                  </div>
                  {s < 3 && <div className={`h-0.5 w-8 ${step > s ? "bg-green-500/40" : "bg-white/10"}`} />}
                </div>
              ))}
              <p className="ml-2 text-xs text-muted-foreground">
                {step === 1 ? "Organisation details" : step === 2 ? "Sports & contact" : "Confirm"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-card/60 p-6">

              {/* Step 1 — Name, type, province */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Organisation name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Harare Primary School"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Type *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ORG_TYPES.map((t) => (
                        <button
                          key={t}
                          onClick={() => setForm((f) => ({ ...f, type: t }))}
                          className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                            form.type === t
                              ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                              : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Province *</label>
                    <select
                      value={form.province}
                      onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-[#0d2b1a] px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                    >
                      <option value="">Select province</option>
                      {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!form.name || !form.type || !form.province}
                    className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-[#0d2b1a] hover:bg-amber-400 disabled:opacity-50 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Step 2 — Sports & contact */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Sports offered * (select all that apply)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SPORTS.map((s) => (
                        <button
                          key={s}
                          onClick={() => toggleSport(s)}
                          className={`rounded-xl border py-2 text-sm font-medium transition-colors ${
                            form.sports.includes(s)
                              ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                              : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description (optional)</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={2}
                      placeholder="Brief description of your organisation..."
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Contact email</label>
                      <input
                        type="email"
                        value={form.contact_email}
                        onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                        placeholder="sports@school.ac.zw"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Contact phone</label>
                      <input
                        value={form.contact_phone}
                        onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                        placeholder="0771 234 567"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-muted-foreground hover:bg-white/5 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={form.sports.length === 0}
                      className="flex-[2] rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-[#0d2b1a] hover:bg-amber-400 disabled:opacity-50 transition-colors"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — Confirm */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Review your details</p>

                  <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                    {[
                      ["Organisation", form.name],
                      ["Type", form.type],
                      ["Province", form.province],
                      ["Sports", form.sports.join(", ")],
                      ["Contact", [form.contact_email, form.contact_phone].filter(Boolean).join(" · ") || "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-3">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="text-right text-white">{value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Your organisation will be publicly visible on the Fan Hub so parents and fans can find you.
                    You can change this at any time.
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-muted-foreground hover:bg-white/5 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleRegister}
                      disabled={saving}
                      className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-[#0d2b1a] hover:bg-amber-400 disabled:opacity-50 transition-colors"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                      {saving ? "Registering…" : "Register Organisation"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
