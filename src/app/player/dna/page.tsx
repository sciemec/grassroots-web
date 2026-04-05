"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DnaData {
  purpose:     Record<string, string | number | boolean>;
  environment: Record<string, string | number | boolean>;
  resources:   Record<string, string | number | boolean>;
  family:      Record<string, string | number | boolean>;
  education:   Record<string, string | number | boolean>;
  health:      Record<string, string | number | boolean>;
  mental:      Record<string, string | number | boolean>;
  commitment:  Record<string, string | number | boolean>;
  identity:    Record<string, string | number | boolean>;
}

const SECTION_KEYS: (keyof DnaData)[] = [
  "purpose", "environment", "resources", "family",
  "education", "health", "mental", "commitment", "identity",
];

const SECTION_LABELS: Record<keyof DnaData, string> = {
  purpose:     "Why You Play",
  environment: "Your Environment",
  resources:   "Your Resources",
  family:      "Family & Home",
  education:   "Education",
  health:      "Health & Wellbeing",
  mental:      "Mental Game",
  commitment:  "Your Commitment",
  identity:    "Your Identity",
};

const SECTION_ICONS: Record<keyof DnaData, string> = {
  purpose:     "🔥",
  environment: "🏙️",
  resources:   "⚽",
  family:      "🏠",
  education:   "📚",
  health:      "💤",
  mental:      "🧠",
  commitment:  "📅",
  identity:    "🇿🇼",
};

// ── Step Components ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm text-white/70 mb-1">{children}</label>;
}

function TextInput({
  value, onChange, placeholder,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#f0b429]"
    />
  );
}

function TextArea({
  value, onChange, placeholder, rows = 2,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#f0b429] resize-none"
    />
  );
}

function SelectInput({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f0b429]"
    >
      <option value="" className="bg-[#1a3d26]">— select —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#1a3d26]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  label, checked, onChange,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
        checked
          ? "bg-[#f0b429] text-[#1a3d26] border-[#f0b429]"
          : "bg-white/10 text-white/70 border-white/20"
      }`}
    >
      <span>{checked ? "✓" : "○"}</span>
      {label}
    </button>
  );
}

function NumberInput({
  value, onChange, min = 0, max = 100, step = 1,
}: {
  value: number | string; onChange: (v: number) => void;
  min?: number; max?: number; step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f0b429]"
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DnaPage() {
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [step,    setStep]    = useState(0); // 0 = intro
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [completeness, setCompleteness] = useState(0);

  const [dna, setDna] = useState<DnaData>({
    purpose:     { why: "", hero: "", dream: "", fear: "" },
    environment: { training_space: "", location_type: "", transport_access: false },
    resources:   { has_ball: false, has_boots: false, gym_access: false, nutrition_budget: "" },
    family:      { parental_consent: false, family_support_level: "", home_responsibilities: "" },
    education:   { in_school: false, grade_level: "", academic_performance: "" },
    health:      { avg_sleep_hours: 7, known_injuries: "", typical_daily_meals: "", hydration_habits: "" },
    mental:      { handles_failure: "", motivation_style: "", self_belief_score: 5, discipline_rating: 5 },
    commitment:  { training_days_per_week: 3, hours_per_session: 1, preferred_time: "", has_club: false },
    identity:    { province: "", community_role: "", playing_style_admired: "", cultural_notes: "" },
  });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    // Load existing DNA if any
    api.get("/player/dna").then((res) => {
      if (res.data.exists && res.data.data) {
        const saved = res.data.data;
        setDna((prev) => {
          const merged = { ...prev };
          SECTION_KEYS.forEach((k) => {
            if (saved[k]) merged[k] = { ...prev[k], ...saved[k] };
          });
          return merged;
        });
        setCompleteness(saved.profile_completeness ?? 0);
        if (saved.profile_completeness >= 100) setDone(true);
      }
    }).catch(() => {/* no DNA yet — start fresh */});
  }, [hasHydrated, user, router]);

  const setField = (section: keyof DnaData, field: string, value: string | number | boolean) => {
    setDna((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const saveSection = async (section: keyof DnaData) => {
    setSaving(true);
    try {
      const res = await api.post("/player/dna", { [section]: dna[section] });
      setCompleteness(res.data.data?.profile_completeness ?? completeness);
    } catch {
      // silent — will retry on next save
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (step >= 1 && step <= 9) {
      const section = SECTION_KEYS[step - 1];
      await saveSection(section);
    }
    if (step < 9) {
      setStep((s) => s + 1);
    } else {
      setDone(true);
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  if (!hasHydrated || !user) return null;

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-[#0f2a1a] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🧬</div>
        <h1 className="text-2xl font-bold text-[#f0b429] mb-2">THUTO knows you now.</h1>
        <p className="text-white/70 mb-2 max-w-sm">
          Your Player DNA is <span className="text-[#f0b429] font-bold">{completeness}% complete</span>.
          Every session, every goal, every drill THUTO suggests will be built around your real life.
        </p>
        <p className="text-white/50 text-sm mb-8 max-w-sm">
          Zvakanaka! You are not just a player — you are a full person. THUTO sees that.
        </p>
        <button
          onClick={() => router.push("/player")}
          className="bg-[#f0b429] text-[#1a3d26] font-bold px-8 py-3 rounded-full text-base"
        >
          Back to Dashboard →
        </button>
      </div>
    );
  }

  // ── Intro screen ─────────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#0f2a1a] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">🧬</div>
        <h1 className="text-2xl font-bold text-white mb-2">Your Player DNA</h1>
        <p className="text-white/70 mb-4 max-w-sm text-sm leading-relaxed">
          THUTO needs to understand your real life — not just your stats.
          Where you train, what you have, your family, your dreams.
          This takes about 5 minutes and makes every THUTO response 10× more personal.
        </p>
        {completeness > 0 && (
          <p className="text-[#f0b429] text-sm mb-4">{completeness}% already completed — continue where you left off.</p>
        )}
        <div className="grid grid-cols-3 gap-2 mb-8 max-w-xs">
          {SECTION_KEYS.map((k) => (
            <div key={k} className="bg-white/5 rounded-xl p-2 text-center">
              <div className="text-xl">{SECTION_ICONS[k]}</div>
              <div className="text-white/60 text-xs mt-1">{SECTION_LABELS[k]}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setStep(1)}
          className="bg-[#f0b429] text-[#1a3d26] font-bold px-8 py-3 rounded-full text-base"
        >
          Build My DNA →
        </button>
        <button onClick={() => router.push("/player")} className="mt-3 text-white/40 text-sm underline">
          Skip for now
        </button>
      </div>
    );
  }

  // ── Progress bar ──────────────────────────────────────────────────────────────
  const currentSection = SECTION_KEYS[step - 1];

  return (
    <div className="min-h-screen bg-[#0f2a1a] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={handleBack} className="text-white/50 text-sm">← Back</button>
          <span className="text-white/50 text-sm">{step} / 9</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#f0b429] rounded-full transition-all duration-300"
            style={{ width: `${(step / 9) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-2xl">{SECTION_ICONS[currentSection]}</span>
          <h2 className="text-lg font-bold text-white">{SECTION_LABELS[currentSection]}</h2>
        </div>
      </div>

      {/* Section content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

        {/* Step 1 — Purpose */}
        {step === 1 && (
          <>
            <div>
              <FieldLabel>Why do you play? (your honest reason)</FieldLabel>
              <TextArea
                value={String(dna.purpose.why ?? "")}
                onChange={(v) => setField("purpose", "why", v)}
                placeholder="e.g. I want to make my family proud. I love the feeling of scoring..."
                rows={3}
              />
            </div>
            <div>
              <FieldLabel>Who is your hero or role model?</FieldLabel>
              <TextInput
                value={String(dna.purpose.hero ?? "")}
                onChange={(v) => setField("purpose", "hero", v)}
                placeholder="e.g. Khama Billiat, my older brother..."
              />
            </div>
            <div>
              <FieldLabel>What is your biggest dream as an athlete?</FieldLabel>
              <TextInput
                value={String(dna.purpose.dream ?? "")}
                onChange={(v) => setField("purpose", "dream", v)}
                placeholder="e.g. Play for Warriors, get a scholarship..."
              />
            </div>
            <div>
              <FieldLabel>What is your biggest fear about your sports career?</FieldLabel>
              <TextInput
                value={String(dna.purpose.fear ?? "")}
                onChange={(v) => setField("purpose", "fear", v)}
                placeholder="e.g. Getting injured and never recovering..."
              />
            </div>
          </>
        )}

        {/* Step 2 — Environment */}
        {step === 2 && (
          <>
            <div>
              <FieldLabel>Where do you usually train?</FieldLabel>
              <TextInput
                value={String(dna.environment.training_space ?? "")}
                onChange={(v) => setField("environment", "training_space", v)}
                placeholder="e.g. Open field near home, school ground, community pitch..."
              />
            </div>
            <div>
              <FieldLabel>Location type</FieldLabel>
              <SelectInput
                value={String(dna.environment.location_type ?? "")}
                onChange={(v) => setField("environment", "location_type", v)}
                options={[
                  { value: "urban",      label: "Urban (city / town centre)" },
                  { value: "peri-urban", label: "Peri-urban (suburb / township)" },
                  { value: "rural",      label: "Rural (village / farming area)" },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Do you have transport to reach a training facility?</FieldLabel>
              <div className="flex gap-3 mt-1">
                <Toggle
                  label="Yes"
                  checked={Boolean(dna.environment.transport_access)}
                  onChange={(v) => setField("environment", "transport_access", v)}
                />
                <Toggle
                  label="No — I train near home"
                  checked={!Boolean(dna.environment.transport_access)}
                  onChange={(v) => setField("environment", "transport_access", !v)}
                />
              </div>
            </div>
          </>
        )}

        {/* Step 3 — Resources */}
        {step === 3 && (
          <>
            <div>
              <FieldLabel>What equipment do you have access to?</FieldLabel>
              <div className="flex flex-wrap gap-2 mt-1">
                <Toggle label="Ball" checked={Boolean(dna.resources.has_ball)} onChange={(v) => setField("resources", "has_ball", v)} />
                <Toggle label="Boots" checked={Boolean(dna.resources.has_boots)} onChange={(v) => setField("resources", "has_boots", v)} />
                <Toggle label="Gym access" checked={Boolean(dna.resources.gym_access)} onChange={(v) => setField("resources", "gym_access", v)} />
              </div>
            </div>
            <div>
              <FieldLabel>Nutrition budget</FieldLabel>
              <SelectInput
                value={String(dna.resources.nutrition_budget ?? "")}
                onChange={(v) => setField("resources", "nutrition_budget", v)}
                options={[
                  { value: "very_low", label: "Very low — basic meals only" },
                  { value: "low",      label: "Low — some choice in meals" },
                  { value: "medium",   label: "Medium — can eat fairly well" },
                ]}
              />
            </div>
          </>
        )}

        {/* Step 4 — Family */}
        {step === 4 && (
          <>
            <div>
              <FieldLabel>Does your family support your sporting career?</FieldLabel>
              <SelectInput
                value={String(dna.family.family_support_level ?? "")}
                onChange={(v) => setField("family", "family_support_level", v)}
                options={[
                  { value: "none", label: "No — they want me to focus elsewhere" },
                  { value: "some", label: "Some — they tolerate it" },
                  { value: "full", label: "Full — they actively support me" },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Do you have a parent or guardian&apos;s consent to train?</FieldLabel>
              <div className="flex gap-3 mt-1">
                <Toggle label="Yes" checked={Boolean(dna.family.parental_consent)} onChange={(v) => setField("family", "parental_consent", v)} />
                <Toggle label="No / Not applicable" checked={!Boolean(dna.family.parental_consent)} onChange={(v) => setField("family", "parental_consent", !v)} />
              </div>
            </div>
            <div>
              <FieldLabel>Home responsibilities (chores, caring for siblings, etc.)</FieldLabel>
              <TextArea
                value={String(dna.family.home_responsibilities ?? "")}
                onChange={(v) => setField("family", "home_responsibilities", v)}
                placeholder="e.g. I cook dinner every evening, look after my 2 younger siblings..."
              />
            </div>
          </>
        )}

        {/* Step 5 — Education */}
        {step === 5 && (
          <>
            <div>
              <FieldLabel>Are you currently in school?</FieldLabel>
              <div className="flex gap-3 mt-1">
                <Toggle label="Yes" checked={Boolean(dna.education.in_school)} onChange={(v) => setField("education", "in_school", v)} />
                <Toggle label="No" checked={!Boolean(dna.education.in_school)} onChange={(v) => setField("education", "in_school", !v)} />
              </div>
            </div>
            {Boolean(dna.education.in_school) && (
              <>
                <div>
                  <FieldLabel>Grade / Form level</FieldLabel>
                  <TextInput
                    value={String(dna.education.grade_level ?? "")}
                    onChange={(v) => setField("education", "grade_level", v)}
                    placeholder="e.g. Form 3, Grade 10..."
                  />
                </div>
                <div>
                  <FieldLabel>Academic performance</FieldLabel>
                  <SelectInput
                    value={String(dna.education.academic_performance ?? "")}
                    onChange={(v) => setField("education", "academic_performance", v)}
                    options={[
                      { value: "struggling", label: "Struggling — need extra support" },
                      { value: "average",    label: "Average — keeping up" },
                      { value: "good",       label: "Good — on top of things" },
                    ]}
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Step 6 — Health */}
        {step === 6 && (
          <>
            <div>
              <FieldLabel>Average sleep per night (hours)</FieldLabel>
              <NumberInput
                value={Number(dna.health.avg_sleep_hours ?? 7)}
                onChange={(v) => setField("health", "avg_sleep_hours", v)}
                min={3} max={12} step={0.5}
              />
            </div>
            <div>
              <FieldLabel>Known injuries or physical concerns</FieldLabel>
              <TextInput
                value={String(dna.health.known_injuries ?? "")}
                onChange={(v) => setField("health", "known_injuries", v)}
                placeholder="e.g. Left knee pain, previous ankle sprain... or 'none'"
              />
            </div>
            <div>
              <FieldLabel>Typical daily meals</FieldLabel>
              <TextArea
                value={String(dna.health.typical_daily_meals ?? "")}
                onChange={(v) => setField("health", "typical_daily_meals", v)}
                placeholder="e.g. Sadza and vegetables for lunch, bread in morning..."
              />
            </div>
            <div>
              <FieldLabel>Hydration habits</FieldLabel>
              <TextInput
                value={String(dna.health.hydration_habits ?? "")}
                onChange={(v) => setField("health", "hydration_habits", v)}
                placeholder="e.g. I drink 2 bottles of water a day..."
              />
            </div>
          </>
        )}

        {/* Step 7 — Mental */}
        {step === 7 && (
          <>
            <div>
              <FieldLabel>How do you handle failure or a bad performance?</FieldLabel>
              <TextArea
                value={String(dna.mental.handles_failure ?? "")}
                onChange={(v) => setField("mental", "handles_failure", v)}
                placeholder="e.g. I get angry at first but then I analyse what went wrong..."
              />
            </div>
            <div>
              <FieldLabel>What motivates you most?</FieldLabel>
              <SelectInput
                value={String(dna.mental.motivation_style ?? "")}
                onChange={(v) => setField("mental", "motivation_style", v)}
                options={[
                  { value: "encouragement", label: "Encouragement — I need to feel believed in" },
                  { value: "challenge",     label: "Challenge — push me hard, I rise" },
                  { value: "competition",   label: "Competition — I want to be better than others" },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Self-belief score (1 = very low, 10 = extremely confident)</FieldLabel>
              <NumberInput
                value={Number(dna.mental.self_belief_score ?? 5)}
                onChange={(v) => setField("mental", "self_belief_score", Math.min(10, Math.max(1, v)))}
                min={1} max={10}
              />
            </div>
            <div>
              <FieldLabel>Discipline rating (1 = struggle to stay consistent, 10 = always on schedule)</FieldLabel>
              <NumberInput
                value={Number(dna.mental.discipline_rating ?? 5)}
                onChange={(v) => setField("mental", "discipline_rating", Math.min(10, Math.max(1, v)))}
                min={1} max={10}
              />
            </div>
          </>
        )}

        {/* Step 8 — Commitment */}
        {step === 8 && (
          <>
            <div>
              <FieldLabel>Training days per week</FieldLabel>
              <NumberInput
                value={Number(dna.commitment.training_days_per_week ?? 3)}
                onChange={(v) => setField("commitment", "training_days_per_week", Math.min(7, Math.max(1, v)))}
                min={1} max={7}
              />
            </div>
            <div>
              <FieldLabel>Hours per session</FieldLabel>
              <NumberInput
                value={Number(dna.commitment.hours_per_session ?? 1)}
                onChange={(v) => setField("commitment", "hours_per_session", Math.min(4, Math.max(0.5, v)))}
                min={0.5} max={4} step={0.5}
              />
            </div>
            <div>
              <FieldLabel>Preferred training time</FieldLabel>
              <SelectInput
                value={String(dna.commitment.preferred_time ?? "")}
                onChange={(v) => setField("commitment", "preferred_time", v)}
                options={[
                  { value: "morning",   label: "Morning (before school/work)" },
                  { value: "afternoon", label: "Afternoon (after school/lunch)" },
                  { value: "evening",   label: "Evening (after work/dinner)" },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Do you currently train with a club or team?</FieldLabel>
              <div className="flex gap-3 mt-1">
                <Toggle label="Yes" checked={Boolean(dna.commitment.has_club)} onChange={(v) => setField("commitment", "has_club", v)} />
                <Toggle label="No — training alone" checked={!Boolean(dna.commitment.has_club)} onChange={(v) => setField("commitment", "has_club", !v)} />
              </div>
            </div>
          </>
        )}

        {/* Step 9 — Identity */}
        {step === 9 && (
          <>
            <div>
              <FieldLabel>Province</FieldLabel>
              <SelectInput
                value={String(dna.identity.province ?? "")}
                onChange={(v) => setField("identity", "province", v)}
                options={[
                  { value: "Harare",         label: "Harare" },
                  { value: "Bulawayo",       label: "Bulawayo" },
                  { value: "Manicaland",     label: "Manicaland" },
                  { value: "Mashonaland Central", label: "Mashonaland Central" },
                  { value: "Mashonaland East",    label: "Mashonaland East" },
                  { value: "Mashonaland West",    label: "Mashonaland West" },
                  { value: "Masvingo",       label: "Masvingo" },
                  { value: "Matabeleland North", label: "Matabeleland North" },
                  { value: "Matabeleland South", label: "Matabeleland South" },
                  { value: "Midlands",       label: "Midlands" },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Your role in your community (optional)</FieldLabel>
              <TextInput
                value={String(dna.identity.community_role ?? "")}
                onChange={(v) => setField("identity", "community_role", v)}
                placeholder="e.g. Team captain, mentor to younger players..."
              />
            </div>
            <div>
              <FieldLabel>Playing style you admire most</FieldLabel>
              <TextInput
                value={String(dna.identity.playing_style_admired ?? "")}
                onChange={(v) => setField("identity", "playing_style_admired", v)}
                placeholder="e.g. Fast and direct, technical and patient, physical..."
              />
            </div>
            <div>
              <FieldLabel>Anything about your culture or community THUTO should know?</FieldLabel>
              <TextArea
                value={String(dna.identity.cultural_notes ?? "")}
                onChange={(v) => setField("identity", "cultural_notes", v)}
                placeholder="e.g. Training is not allowed on Sundays in my family..."
              />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 pt-4 border-t border-white/10">
        <button
          onClick={handleNext}
          disabled={saving}
          className="w-full bg-[#f0b429] text-[#1a3d26] font-bold py-3 rounded-full text-base disabled:opacity-50"
        >
          {saving ? "Saving…" : step === 9 ? "Complete My DNA ✓" : "Save & Continue →"}
        </button>
        <p className="text-center text-white/30 text-xs mt-3">
          Your answers are private — only THUTO uses them to personalise your coaching.
        </p>
      </div>
    </div>
  );
}
