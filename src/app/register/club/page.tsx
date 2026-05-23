'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Building2, MapPin, User, CheckCircle2, Loader2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Zone {
  id: number;
  name: string;
  code: string;
  suburbs: string[];
}

interface Province {
  id: number;
  name: string;
  code: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

const STEP_LABELS = [
  { label: 'Location',    icon: MapPin },
  { label: 'Club',        icon: Building2 },
  { label: 'Contact',     icon: User },
  { label: 'Review',      icon: CheckCircle2 },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClubRegistrationPage() {
  const router = useRouter();

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Step 1 — Location ───────────────────────────────────────────────────────
  const [provinces, setProvinces]         = useState<Province[]>([]);
  const [zones, setZones]                 = useState<Zone[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedZone, setSelectedZone]   = useState<Zone | null>(null);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingZones, setLoadingZones]   = useState(false);

  // ── Step 2 — Club details ───────────────────────────────────────────────────
  const [clubName, setClubName]           = useState('');
  const [suburb, setSuburb]               = useState('');
  const [homeGround, setHomeGround]       = useState('');

  // ── Step 3 — Contact ────────────────────────────────────────────────────────
  const [contactName, setContactName]     = useState('');
  const [contactPhone, setContactPhone]   = useState('');
  const [contactEmail, setContactEmail]   = useState('');
  const [contactPassword, setContactPassword] = useState('');

  // ── Submission ──────────────────────────────────────────────────────────────
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');

  // ── Load provinces on mount ─────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/provinces`)
      .then(r => r.json())
      .then(data => {
        const raw = data?.data ?? data;
        setProvinces(Array.isArray(raw) ? raw : []);
      })
      .catch(() => {
        // Fallback: hardcoded provinces so the page works before backend is live
        setProvinces([
          { id: 1, name: 'Harare Province', code: 'HAR' },
          { id: 2, name: 'Bulawayo Province', code: 'BYO' },
        ]);
      })
      .finally(() => setLoadingProvinces(false));
  }, []);

  // ── Load zones when province selected ──────────────────────────────────────
  useEffect(() => {
    if (!selectedProvince) return;
    setSelectedZone(null);
    setZones([]);
    setLoadingZones(true);
    fetch(`${API_URL}/provinces/${selectedProvince.id}/zones`)
      .then(r => r.json())
      .then(data => {
        const raw = data?.data ?? data;
        setZones(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setZones([]))
      .finally(() => setLoadingZones(false));
  }, [selectedProvince]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const canNext = (): boolean => {
    if (step === 1) return selectedProvince !== null && selectedZone !== null;
    if (step === 2) return clubName.trim().length > 2 && suburb.trim().length > 0;
    if (step === 3) return contactName.trim().length > 2 && contactEmail.includes('@') && contactPassword.length >= 8;
    return true;
  };

  const next = () => { if (canNext()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/clubs/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          province_id:    selectedProvince!.id,
          zone_id:        selectedZone!.id,
          name:           clubName.trim(),
          suburb:         suburb.trim(),
          home_ground:    homeGround.trim() || null,
          contact_name:   contactName.trim(),
          contact_phone:  contactPhone.trim() || null,
          contact_email:  contactEmail.trim(),
          password:       contactPassword,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Error ${res.status}`);
      }

      router.push('/login?club_registered=1');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
         style={{ backgroundColor: '#1a5c2a' }}>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0b429] mb-4">
          <Building2 className="h-7 w-7 text-[#1a3a1a]" />
        </div>
        <h1 className="text-2xl font-bold text-white">Register Your Club</h1>
        <p className="mt-1 text-sm text-white/60">Join Zimbabwe&apos;s grassroots sports network</p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {STEP_LABELS.map((s, i) => {
          const num = i + 1;
          const active = step === num;
          const done   = step > num;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all
                ${done   ? 'bg-[#f0b429] text-[#1a3a1a]' : ''}
                ${active ? 'bg-white text-[#1a5c2a]' : ''}
                ${!active && !done ? 'bg-white/20 text-white/50' : ''}`}>
                {done ? '✓' : num}
              </div>
              <span className={`hidden sm:block text-xs font-medium ${active ? 'text-white' : 'text-white/40'}`}>
                {s.label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <div className={`h-px w-8 ${done ? 'bg-[#f0b429]' : 'bg-white/20'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">

        {/* ── STEP 1: Location ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#f0b429]" /> Province &amp; Zone
            </h2>

            {/* Province */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70 uppercase tracking-wide">
                Province
              </label>
              {loadingProvinces ? (
                <div className="flex items-center gap-2 text-white/50 text-sm py-3">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading provinces…
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {provinces.map(p => (
                    <button key={p.id} type="button"
                      onClick={() => setSelectedProvince(p)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all
                        ${selectedProvince?.id === p.id
                          ? 'border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]'
                          : 'border-white/10 bg-white/5 text-white hover:border-white/30'}`}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Zone */}
            {selectedProvince && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70 uppercase tracking-wide">
                  Zone
                </label>
                {loadingZones ? (
                  <div className="flex items-center gap-2 text-white/50 text-sm py-3">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading zones…
                  </div>
                ) : zones.length === 0 ? (
                  <p className="text-sm text-white/40 py-2">No zones found for this province.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {zones.map(z => (
                      <button key={z.id} type="button"
                        onClick={() => setSelectedZone(z)}
                        className={`rounded-xl border px-4 py-3 text-left transition-all
                          ${selectedZone?.id === z.id
                            ? 'border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]'
                            : 'border-white/10 bg-white/5 text-white hover:border-white/30'}`}>
                          <p className="text-sm font-semibold">{z.name}</p>
                          {z.suburbs?.length > 0 && (
                            <p className="text-xs text-white/40 mt-0.5 truncate">
                              {z.suburbs.slice(0, 3).join(', ')}
                            </p>
                          )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Club details ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#f0b429]" /> Club Details
            </h2>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70 uppercase tracking-wide">
                Club Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={clubName}
                onChange={e => setClubName(e.target.value)}
                placeholder="e.g. Borrowdale United FC"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#f0b429] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70 uppercase tracking-wide">
                Suburb <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={suburb}
                onChange={e => setSuburb(e.target.value)}
                placeholder="e.g. Borrowdale"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#f0b429] focus:outline-none"
              />
              {selectedZone?.suburbs?.length > 0 && (
                <p className="mt-1.5 text-xs text-white/40">
                  Suburbs in {selectedZone.name}: {selectedZone.suburbs.join(', ')}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70 uppercase tracking-wide">
                Home Ground <span className="text-white/30">(optional)</span>
              </label>
              <input
                type="text"
                value={homeGround}
                onChange={e => setHomeGround(e.target.value)}
                placeholder="e.g. Borrowdale Primary School Grounds"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#f0b429] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: Contact coach ── */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-[#f0b429]" /> Contact Coach Account
            </h2>
            <p className="text-xs text-white/50">
              This creates your login account. You will be the registered contact for this club.
            </p>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70 uppercase tracking-wide">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="e.g. Tendai Moyo"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#f0b429] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70 uppercase tracking-wide">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="coach@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#f0b429] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70 uppercase tracking-wide">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={contactPassword}
                onChange={e => setContactPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#f0b429] focus:outline-none"
              />
              {contactPassword.length > 0 && contactPassword.length < 8 && (
                <p className="mt-1 text-xs text-red-400">Password must be at least 8 characters</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70 uppercase tracking-wide">
                Phone Number <span className="text-white/30">(optional)</span>
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="e.g. 0771 234 567"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#f0b429] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* ── STEP 4: Review ── */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#f0b429]" /> Review &amp; Submit
            </h2>

            <div className="rounded-xl border border-white/10 bg-white/5 divide-y divide-white/10">
              {[
                { label: 'Province',    value: selectedProvince?.name },
                { label: 'Zone',        value: selectedZone?.name },
                { label: 'Club Name',   value: clubName },
                { label: 'Suburb',      value: suburb },
                { label: 'Home Ground', value: homeGround || '—' },
                { label: 'Contact',     value: contactName },
                { label: 'Email',       value: contactEmail },
                { label: 'Phone',       value: contactPhone || '—' },
              ].map(row => (
                <div key={row.label} className="flex justify-between px-4 py-3">
                  <span className="text-xs text-white/50 uppercase tracking-wide">{row.label}</span>
                  <span className="text-sm text-white font-medium text-right max-w-[55%] truncate">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
              Your club registration will be reviewed by your Zone Administrator before it is activated.
              You will receive an email once approved.
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button type="button" onClick={back}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:border-white/30 transition-all">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <Link href="/register/who"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:border-white/30 transition-all">
              <ChevronLeft className="h-4 w-4" /> Back
            </Link>
          )}

          {step < 4 ? (
            <button type="button" onClick={next} disabled={!canNext()}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all
                ${canNext()
                  ? 'bg-[#f0b429] text-[#1a3a1a] hover:bg-[#f5c542]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f0b429] px-4 py-3 text-sm font-semibold text-[#1a3a1a] hover:bg-[#f5c542] transition-all disabled:opacity-50">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Register Club</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Footer link */}
      <p className="mt-6 text-xs text-white/40">
        Already have an account?{' '}
        <Link href="/login" className="text-[#f0b429] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
