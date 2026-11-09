"use client";
// src/app/campaigns/new/page.tsx
// 4-step campaign creation wizard. Requires auth.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertCircle,
  User, Users, School, Target, Shirt, Plane, BookOpen,
  Dumbbell, Stethoscope, Building2, Sparkles, Upload, Info,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

const GRS_GREEN = "#1a5c2a";
const GOLD      = "#c8962a";
const BG        = "#f4f2ee";

// ── Types ─────────────────────────────────────────────────────────────────────
type BeneficiaryType = "individual" | "team" | "school";

interface WizardData {
  // Step 1
  beneficiary_type: BeneficiaryType;
  beneficiary_name: string;
  sport: string;
  province: string;
  age_group: string;
  is_minor_beneficiary: boolean;
  // Step 2
  title: string;
  story: string;
  category: string;
  target_cents: string;
  currency: string;
  deadline_days: string;
  // Step 3
  quote_file_url: string;
}

const INITIAL: WizardData = {
  beneficiary_type: "individual",
  beneficiary_name: "",
  sport: "",
  province: "",
  age_group: "",
  is_minor_beneficiary: false,
  title: "",
  story: "",
  category: "kit",
  target_cents: "",
  currency: "USD",
  deadline_days: "60",
  quote_file_url: "",
};

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "trial_fee",   label: "Trial Fee",    Icon: Target,       desc: "Registration or trial fees for a club or academy" },
  { id: "kit",         label: "Kit & Gear",   Icon: Shirt,        desc: "Boots, kit, equipment for training or matches" },
  { id: "travel",      label: "Travel",       Icon: Plane,        desc: "Transport to tournaments, trials, or training camps" },
  { id: "scholarship", label: "Scholarship",  Icon: BookOpen,     desc: "School fees or education costs for a student athlete" },
  { id: "training",    label: "Training",     Icon: Dumbbell,     desc: "Coaching sessions, development programs" },
  { id: "medical",     label: "Medical",      Icon: Stethoscope,  desc: "Injury treatment, physio, medical clearance" },
  { id: "facility",    label: "Facility",     Icon: Building2,    desc: "Pitch hire, gym access, training facility costs" },
  { id: "other",       label: "Other",        Icon: Sparkles,     desc: "Any other legitimate athlete need" },
];

const PROVINCES = [
  "Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East",
  "Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands",
];

const SPORTS = ["Football","Rugby","Athletics","Netball","Basketball","Cricket","Swimming","Tennis","Volleyball","Hockey"];
const AGE_GROUPS = ["Under 13","13-17","18-24","25+"];

const BENEFICIARY_TYPES = [
  { id: "individual", label: "Individual athlete",  Icon: User,   desc: "One player, school team member, or athlete" },
  { id: "team",       label: "Team / Club",          Icon: Users,  desc: "A registered team or club group" },
  { id: "school",     label: "School programme",     Icon: School, desc: "A school sports department or team" },
] as const;

// ── Step components ───────────────────────────────────────────────────────────
function Step1({ data, onChange }: { data: WizardData; onChange: (k: keyof WizardData, v: string | boolean) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 10 }}>Who is this campaign for?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {BENEFICIARY_TYPES.map(({ id, label, Icon, desc }) => (
            <button
              key={id}
              onClick={() => onChange("beneficiary_type", id)}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: `1.5px solid ${data.beneficiary_type === id ? GRS_GREEN : "#e5e5e5"}`,
                backgroundColor: data.beneficiary_type === id ? "#f0fdf4" : "#fff",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: data.beneficiary_type === id ? "#dcfce7" : "#f3f4f6",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon size={16} color={data.beneficiary_type === id ? GRS_GREEN : "#6b7280"} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{label}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
          {data.beneficiary_type === "individual" ? "Athlete name" : data.beneficiary_type === "team" ? "Team / Club name" : "School name"} *
        </label>
        <input
          type="text"
          value={data.beneficiary_name}
          onChange={(e) => onChange("beneficiary_name", e.target.value)}
          placeholder={data.beneficiary_type === "individual" ? "Full name" : "Organisation name"}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e5e5", fontSize: 13, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {data.beneficiary_type === "individual" && (
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Age group</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
            {AGE_GROUPS.map((ag) => (
              <button
                key={ag}
                onClick={() => {
                  onChange("age_group", ag);
                  onChange("is_minor_beneficiary", ag === "Under 13" || ag === "13-17");
                }}
                style={{
                  padding: "9px 10px",
                  borderRadius: 8,
                  border: `1.5px solid ${data.age_group === ag ? GRS_GREEN : "#e5e5e5"}`,
                  backgroundColor: data.age_group === ag ? "#f0fdf4" : "#fff",
                  fontSize: 12, fontWeight: 600,
                  color: data.age_group === ag ? GRS_GREEN : "#374151",
                  cursor: "pointer",
                }}
              >
                {ag}
              </button>
            ))}
          </div>
          {data.is_minor_beneficiary && (
            <div style={{ marginTop: 10, padding: "10px 12px", backgroundColor: "#fef3c7", borderRadius: 8, fontSize: 12, color: "#92400e", display: "flex", gap: 6 }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Guardian consent is required for campaigns on behalf of under-18 athletes. You will need to provide this in the vouch stage.</span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Sport</label>
          <select
            value={data.sport}
            onChange={(e) => onChange("sport", e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e5e5", fontSize: 13, outline: "none", backgroundColor: "#fff" }}
          >
            <option value="">Select sport</option>
            {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Province</label>
          <select
            value={data.province}
            onChange={(e) => onChange("province", e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e5e5", fontSize: 13, outline: "none", backgroundColor: "#fff" }}
          >
            <option value="">Select province</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function Step2({ data, onChange }: { data: WizardData; onChange: (k: keyof WizardData, v: string | boolean) => void }) {
  const targetUsd = parseFloat(data.target_cents || "0");
  const feeNote   = targetUsd > 0 ? `After 5% platform fee: USD ${(targetUsd * 0.95).toFixed(2)} reaches the athlete` : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Campaign title *</label>
        <input
          type="text"
          maxLength={120}
          value={data.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="e.g. Help Tawanda Attend the COSAFA Trial"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e5e5", fontSize: 13, outline: "none", boxSizing: "border-box" }}
        />
        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>{data.title.length}/120</div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>What is the money for? *</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {CATEGORIES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onChange("category", id)}
              style={{
                padding: "10px 10px",
                borderRadius: 8,
                border: `1.5px solid ${data.category === id ? GRS_GREEN : "#e5e5e5"}`,
                backgroundColor: data.category === id ? "#f0fdf4" : "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
                textAlign: "left",
              }}
            >
              <Icon size={14} color={data.category === id ? GRS_GREEN : "#6b7280"} />
              <span style={{ fontSize: 11, fontWeight: 600, color: data.category === id ? GRS_GREEN : "#374151" }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Tell the story *</label>
        <textarea
          rows={6}
          maxLength={2000}
          value={data.story}
          onChange={(e) => onChange("story", e.target.value)}
          placeholder="Explain who this athlete is, what they need the money for, and why this opportunity matters. Be specific — donors give more when they understand the need clearly."
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e5e5", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.55 }}
        />
        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>{data.story.length}/2000</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Fundraising target (USD) *</label>
          <input
            type="number"
            min="1"
            value={data.target_cents}
            onChange={(e) => onChange("target_cents", e.target.value)}
            placeholder="e.g. 150"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e5e5", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
          {feeNote && <div style={{ fontSize: 10, color: "#6b7280", marginTop: 3 }}>{feeNote}</div>}
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Deadline</label>
          <select
            value={data.deadline_days}
            onChange={(e) => onChange("deadline_days", e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e5e5", fontSize: 13, outline: "none", backgroundColor: "#fff" }}
          >
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
            <option value="0">No deadline</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function Step3({ data, onChange }: { data: WizardData; onChange: (k: keyof WizardData, v: string | boolean) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "14px", backgroundColor: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0", fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
        <strong>Why we require a quote or invoice:</strong> GRS pays vendors directly — not athletes or parents. Before any money leaves the platform, we need proof that the cost is real. Upload a quote, invoice, official letter, or fee schedule from the club, school, or service provider.
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
          Quote / invoice URL *
        </label>
        <div style={{ padding: "10px 12px", backgroundColor: "#fef3c7", borderRadius: 8, fontSize: 11, color: "#92400e", marginBottom: 8, display: "flex", gap: 6 }}>
          <Info size={13} style={{ flexShrink: 0 }} />
          Upload your document to Google Drive, Dropbox, or any file hosting service, then paste the shareable link below. Make sure the link allows anyone to view.
        </div>
        <input
          type="url"
          value={data.quote_file_url}
          onChange={(e) => onChange("quote_file_url", e.target.value)}
          placeholder="https://drive.google.com/file/d/..."
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e5e5e5", fontSize: 13, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ padding: "14px", backgroundColor: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 12, color: "#374151", lineHeight: 1.65 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>What happens next?</div>
        <ol style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <li>Your campaign is submitted for review</li>
          <li>A registered GRS coach or club official vouches for the athlete</li>
          <li>GRS admin approves and publishes the campaign</li>
          <li>Donors give — funds held securely by GRS</li>
          <li>You submit disbursement requests with vendor invoices</li>
          <li>GRS pays the vendor directly</li>
          <li>You upload proof of purchase within 7 days</li>
        </ol>
      </div>
    </div>
  );
}

function ReviewStep({ data }: { data: WizardData }) {
  const targetUsd = parseFloat(data.target_cents || "0");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 4 }}>Review your campaign</div>
      {[
        ["Campaign title", data.title],
        ["Beneficiary", `${data.beneficiary_name} (${data.beneficiary_type})`],
        ["Category", data.category.replace("_", " ")],
        ["Sport", data.sport || "—"],
        ["Province", data.province || "—"],
        ["Target", targetUsd > 0 ? `USD ${targetUsd.toFixed(2)}` : "—"],
        ["Deadline", data.deadline_days === "0" ? "No deadline" : `${data.deadline_days} days`],
        ["Quote URL", data.quote_file_url || "—"],
      ].map(([label, value]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#111", textAlign: "right", maxWidth: "60%", wordBreak: "break-all" }}>{value}</span>
        </div>
      ))}
      <div style={{ padding: "10px 12px", backgroundColor: "#fef3c7", borderRadius: 8, fontSize: 11, color: "#92400e" }}>
        Your campaign will be in <strong>draft</strong> status until a voucher confirms it and GRS admin approves it for publication.
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NewCampaignPage() {
  const router       = useRouter();
  const user         = useAuthStore((s) => s.user);
  const hasHydrated  = useAuthStore((s) => s._hasHydrated);

  const [data, setData]       = useState<WizardData>(INITIAL);
  const [step, setStep]       = useState(1);
  const [submitting, setSub]  = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.push("/login?redirect=/campaigns/new");
  }, [hasHydrated, user, router]);

  function set(k: keyof WizardData, v: string | boolean) {
    setData((d) => ({ ...d, [k]: v }));
  }

  function canAdvance(): boolean {
    if (step === 1) return !!(data.beneficiary_name.trim());
    if (step === 2) return !!(data.title.trim() && data.story.trim() && parseFloat(data.target_cents || "0") >= 1);
    if (step === 3) return !!(data.quote_file_url.trim());
    return true;
  }

  async function handleSubmit() {
    setSub(true);
    setError(null);
    try {
      const payload = {
        beneficiary_type:     data.beneficiary_type,
        beneficiary_name:     data.beneficiary_name,
        sport:                data.sport || null,
        province:             data.province || null,
        age_group:            data.age_group || null,
        is_minor_beneficiary: data.is_minor_beneficiary,
        title:                data.title,
        story:                data.story,
        category:             data.category,
        target_cents:         Math.round(parseFloat(data.target_cents) * 100),
        currency:             "USD",
        deadline_at:          data.deadline_days === "0"
          ? null
          : new Date(Date.now() + parseInt(data.deadline_days) * 86_400_000).toISOString(),
        quote_file_url:       data.quote_file_url,
      };
      const res = await api.post<{ data: { id: string } }>("/campaigns", payload);
      router.push(`/campaigns/${res.data.data.id}/manage`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to create campaign";
      setError(msg);
    } finally {
      setSub(false);
    }
  }

  const STEPS = ["Beneficiary", "Details", "Quote", "Review"];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      {/* Header */}
      <header style={{ backgroundColor: GRS_GREEN, color: "#fff", padding: "16px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => step > 1 ? setStep((s) => s - 1) : router.push("/campaigns")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Start a Campaign</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Step {step} of {STEPS.length}: {STEPS[step - 1]}</div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.3)", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(step / STEPS.length) * 100}%`, backgroundColor: GOLD, transition: "width 0.3s" }} />
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: "20px" }}>
          {step === 1 && <Step1 data={data} onChange={set} />}
          {step === 2 && <Step2 data={data} onChange={set} />}
          {step === 3 && <Step3 data={data} onChange={set} />}
          {step === 4 && <ReviewStep data={data} />}

          {error && (
            <div style={{ marginTop: 16, padding: "10px 12px", backgroundColor: "#fef2f2", borderRadius: 8, fontSize: 12, color: "#dc2626", display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #e5e5e5", backgroundColor: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#374151" }}
              >
                Back
              </button>
            )}
            {step < STEPS.length ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: canAdvance() ? GRS_GREEN : "#d1d5db",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: canAdvance() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: submitting ? "#d1d5db" : GRS_GREEN,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: submitting ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {submitting ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</> : "Submit Campaign"}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
