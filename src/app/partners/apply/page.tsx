"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

const ORG_TYPES = [
  { value: "club",        label: "Football / Sports Club" },
  { value: "academy",     label: "Academy / Development Centre" },
  { value: "agent",       label: "Licensed Agent" },
  { value: "ngo",         label: "NGO / Foundation" },
  { value: "media",       label: "Media / Journalism" },
  { value: "government",  label: "Government / Ministry" },
  { value: "university",  label: "University / College" },
  { value: "other",       label: "Other" },
];

const COC_TEXT = `As a Verified Partner, my organisation commits to:
1. Only use player data to evaluate talent — never for commercial profiling or resale.
2. Never contact a minor directly without guardian consent being granted through the platform.
3. Comply with the Zimbabwe Cyber and Data Protection Act 2021 and FIFA Article 19.
4. Accept that GrassRoots Sports may revoke partner status for any breach of these terms.`;

export default function PartnerApplyPage() {
  const router  = useRouter();
  const token   = useAuthStore((s) => s.token);
  const user    = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    name:                   "",
    type:                   "",
    country:                "Zimbabwe",
    website:                "",
    contact_email:          user?.email ?? "",
    description:            "",
    code_of_conduct_signed: false,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code_of_conduct_signed) {
      setError("You must accept the Partner Code of Conduct to proceed.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/apply`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Application failed.");
      setSuccess(data.message);
      setTimeout(() => router.push("/partners/dashboard"), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    type = "text",
    placeholder = ""
  ) => (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: "#1a5c2a" }}>
        {label}
      </label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
        style={{ borderColor: "#d1d5db", background: "#fff" }}
      />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Header */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "#1a5c2a", color: "#fff" }}
        >
          <h1 className="text-2xl font-bold">Apply to Become a Verified Partner</h1>
          <p className="text-sm mt-1 opacity-80">
            Verified Partners can discover consented players and submit mediated contact
            requests. All requests go through admin + guardian approval before any contact
            details are shared.
          </p>
        </div>

        {/* Scam warning */}
        <div
          className="rounded-xl p-4 mb-5 text-sm"
          style={{ background: "#fef9c3", border: "1px solid #fde047", color: "#713f12" }}
        >
          <strong>⚠️ Warning:</strong> GrassRoots Sports will <strong>never</strong> ask
          for payment to become a Verified Partner. If anyone contacts you claiming to
          offer partner access for a fee, report it to support@grassrootssports.live.
        </div>

        {/* FIFA Article 19 notice */}
        <div
          className="rounded-xl p-4 mb-5 text-sm"
          style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e3a8a" }}
        >
          <strong>FIFA Article 19 Notice:</strong> The international transfer of players
          under 18 is prohibited except in specific circumstances. Verified Partner status
          does not exempt any organisation from FIFA regulations.
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 bg-white space-y-4"
          style={{ border: "1px solid #e5e7eb" }}
        >
          {field("name", "Organisation Name *", "text", "e.g. Harare FC Academy")}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#1a5c2a" }}>
              Organisation Type *
            </label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#d1d5db" }}
            >
              <option value="">Select type…</option>
              {ORG_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {field("country",       "Country *",        "text",  "Zimbabwe")}
          {field("website",       "Website",          "url",   "https://…")}
          {field("contact_email", "Contact Email *",  "email", "info@yourorg.com")}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#1a5c2a" }}>
              About Your Organisation (optional)
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Briefly describe your organisation and what you do."
              className="w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
              style={{ borderColor: "#d1d5db" }}
            />
          </div>

          {/* Code of Conduct */}
          <div
            className="rounded-xl p-4"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: "#1a5c2a" }}>
              Partner Code of Conduct
            </p>
            <pre
              className="text-xs whitespace-pre-wrap mb-3"
              style={{ color: "#374151", fontFamily: "inherit" }}
            >
              {COC_TEXT}
            </pre>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.code_of_conduct_signed}
                onChange={(e) =>
                  setForm({ ...form, code_of_conduct_signed: e.target.checked })
                }
              />
              <span className="text-sm" style={{ color: "#1a5c2a" }}>
                I confirm that my organisation accepts the Partner Code of Conduct and
                all applicable data protection and safeguarding obligations.
              </span>
            </label>
          </div>

          {error && (
            <p className="text-sm rounded-lg p-3" style={{ background: "#fef2f2", color: "#b91c1c" }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm rounded-lg p-3" style={{ background: "#f0fdf4", color: "#15803d" }}>
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-bold transition-opacity disabled:opacity-50"
            style={{ background: "#1a5c2a", color: "#fff" }}
          >
            {loading ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
