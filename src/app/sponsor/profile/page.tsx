"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const INDUSTRIES = [
  { value: "retail",         label: "Retail / FMCG" },
  { value: "food_beverage",  label: "Food & Beverage" },
  { value: "tech",           label: "Technology" },
  { value: "finance",        label: "Financial Services" },
  { value: "health",         label: "Health & Medical" },
  { value: "education",      label: "Education" },
  { value: "media",          label: "Media & Entertainment" },
  { value: "manufacturing",  label: "Manufacturing" },
  { value: "services",       label: "Services / Consulting" },
  { value: "other",          label: "Other" },
  { value: "alcohol",        label: "Alcohol & Beverages" },
  { value: "betting_gambling", label: "Betting & Gambling" },
  { value: "tobacco_vaping", label: "Tobacco & Vaping" },
];

const BLOCKED = ["alcohol", "betting_gambling", "tobacco_vaping"];

type SponsorProfileData = {
  organisation_name: string;
  contact_name: string;
  contact_email: string;
  bio: string;
  website_url: string;
  logo_url: string;
  preferred_sport: string;
  preferred_category: string;
  preferred_region: string;
  budget_min_usd: string;
  budget_max_usd: string;
  industry: string;
  show_publicly: boolean;
};

const EMPTY: SponsorProfileData = {
  organisation_name: "",
  contact_name: "",
  contact_email: "",
  bio: "",
  website_url: "",
  logo_url: "",
  preferred_sport: "",
  preferred_category: "",
  preferred_region: "",
  budget_min_usd: "",
  budget_max_usd: "",
  industry: "",
  show_publicly: false,
};

const SPORTS = [
  "Football", "Rugby", "Athletics", "Netball", "Basketball",
  "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey",
];

const CATEGORIES = [
  "Youth Development", "Women's Sport", "School Sport",
  "Community Club", "Elite / Premier", "Grassroots",
];

const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands", "National",
];

export default function SponsorProfilePage() {
  const router      = useRouter();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);

  const [form,    setForm]    = useState<SponsorProfileData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }

    fetch(`${BASE}/sponsor/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const p = json.data;
        if (p) {
          setForm({
            organisation_name: p.organisation_name ?? "",
            contact_name:      p.contact_name      ?? "",
            contact_email:     p.contact_email     ?? "",
            bio:               p.bio               ?? "",
            website_url:       p.website_url       ?? "",
            logo_url:          p.logo_url          ?? "",
            preferred_sport:   p.preferred_sport   ?? "",
            preferred_category:p.preferred_category?? "",
            preferred_region:  p.preferred_region  ?? "",
            budget_min_usd:    p.budget_min_usd != null ? String(p.budget_min_usd) : "",
            budget_max_usd:    p.budget_max_usd != null ? String(p.budget_max_usd) : "",
            industry:          p.industry          ?? "",
            show_publicly:     p.show_publicly     ?? false,
          });
        }
      })
      .catch(() => {/* no existing profile is fine */})
      .finally(() => setLoading(false));
  }, [hasHydrated, user, token, router]);

  if (!hasHydrated || !user) return null;

  const set = (field: keyof SponsorProfileData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organisation_name.trim()) {
      setError("Organisation name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const payload: Record<string, string | number | null> = {
        organisation_name:   form.organisation_name.trim(),
        contact_name:        form.contact_name.trim()       || null,
        contact_email:       form.contact_email.trim()      || null,
        bio:                 form.bio.trim()                || null,
        website_url:         form.website_url.trim()        || null,
        logo_url:            form.logo_url.trim()           || null,
        preferred_sport:     form.preferred_sport           || null,
        preferred_category:  form.preferred_category        || null,
        preferred_region:    form.preferred_region          || null,
        budget_min_usd:      form.budget_min_usd  ? parseInt(form.budget_min_usd,  10) : null,
        budget_max_usd:      form.budget_max_usd  ? parseInt(form.budget_max_usd,  10) : null,
        industry:            form.industry        || null,
        show_publicly:       form.show_publicly ? 1 : 0,
      };

      const r = await fetch(`${BASE}/sponsor/profile`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError((j as { message?: string }).message ?? "Could not save profile.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Sponsor Profile</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-40 rounded-2xl bg-white animate-pulse" />
            <div className="h-32 rounded-2xl bg-white animate-pulse" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">

            {/* Identity */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Identity</h2>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Organisation / Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.organisation_name}
                  onChange={set("organisation_name")}
                  placeholder="e.g. Econet Wireless, Harare Lions FC"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1a5c2a] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={set("bio")}
                  rows={3}
                  placeholder="Tell athletes why you sponsor grassroots sport…"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1a5c2a] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Website</label>
                <input
                  type="url"
                  value={form.website_url}
                  onChange={set("website_url")}
                  placeholder="https://yourcompany.co.zw"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1a5c2a] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={set("logo_url")}
                  placeholder="https://…/logo.png"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1a5c2a] focus:outline-none"
                />
              </div>
            </div>

            {/* Industry & Visibility */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Industry & Visibility</h2>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Industry</label>
                <select
                  value={form.industry}
                  onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1a5c2a] focus:outline-none bg-white"
                >
                  <option value="">Select industry…</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value}>{ind.label}</option>
                  ))}
                </select>
                {BLOCKED.includes(form.industry) && (
                  <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Your industry cannot sponsor minor or team/school/academy cases. Adult player cases are still permitted.
                  </p>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={form.show_publicly}
                    onChange={(e) => setForm((prev) => ({ ...prev, show_publicly: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-[#1a5c2a] focus:ring-[#1a5c2a]"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Show my name publicly on cases I support</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    When enabled, your organisation name, logo, website, and bio appear on the public page for any confirmed sponsorship. Only verified sponsors are shown.
                  </p>
                </div>
              </label>
            </div>

            {/* Contact */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Contact Person</h2>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={set("contact_name")}
                  placeholder="Full name of main contact"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1a5c2a] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={set("contact_email")}
                  placeholder="sponsor@company.co.zw"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1a5c2a] focus:outline-none"
                />
              </div>
            </div>

            {/* Sponsorship Preferences */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Sponsorship Preferences</h2>
              <p className="text-xs text-gray-500 -mt-2">
                Help athletes find you. These appear on your public sponsor profile.
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Preferred Sport</label>
                <select
                  value={form.preferred_sport}
                  onChange={set("preferred_sport")}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1a5c2a] focus:outline-none bg-white"
                >
                  <option value="">Any sport</option>
                  {SPORTS.map((s) => (
                    <option key={s} value={s.toLowerCase()}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Preferred Category</label>
                <select
                  value={form.preferred_category}
                  onChange={set("preferred_category")}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1a5c2a] focus:outline-none bg-white"
                >
                  <option value="">Any category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c.toLowerCase()}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Preferred Region</label>
                <select
                  value={form.preferred_region}
                  onChange={set("preferred_region")}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1a5c2a] focus:outline-none bg-white"
                >
                  <option value="">Any region</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Budget Min (USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.budget_min_usd}
                    onChange={set("budget_min_usd")}
                    placeholder="e.g. 500"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1a5c2a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Budget Max (USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.budget_max_usd}
                    onChange={set("budget_max_usd")}
                    placeholder="e.g. 5000"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1a5c2a] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {saved && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Profile saved successfully.
              </div>
            )}

            {/* Save button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              <Save size={16} />
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
