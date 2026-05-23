'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore, roleHomePath, type AuthUser } from '@/lib/auth-store';

// ── Constants ─────────────────────────────────────────────────────────────────

const PROVINCES = [
  'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central',
  'Mashonaland East', 'Mashonaland West', 'Masvingo',
  'Matabeleland North', 'Matabeleland South', 'Midlands',
];

const SPORTS = [
  'Football', 'Rugby', 'Netball', 'Basketball',
  'Cricket', 'Athletics', 'Swimming', 'Tennis', 'Volleyball', 'Hockey',
];

const POSITIONS: Record<string, string[]> = {
  Football:   ['Goalkeeper (GK)', 'Centre Back (CB)', 'Full Back (FB)', 'Defensive Mid (CDM)', 'Central Mid (CM)', 'Attacking Mid (CAM)', 'Winger', 'Striker'],
  Rugby:      ['Prop', 'Hooker', 'Lock', 'Flanker', 'Number 8', 'Scrum Half', 'Fly Half', 'Centre', 'Wing', 'Full Back'],
  Netball:    ['Goal Shooter (GS)', 'Goal Attack (GA)', 'Wing Attack (WA)', 'Centre (C)', 'Wing Defence (WD)', 'Goal Defence (GD)', 'Goalkeeper (GK)'],
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Centre'],
  Cricket:    ['Batsman', 'Bowler', 'All-rounder', 'Wicket Keeper'],
  Athletics:  ['Sprinter', 'Middle Distance', 'Long Distance', 'Jumper', 'Thrower'],
  Swimming:   ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Individual Medley'],
  Tennis:     ['Singles', 'Doubles'],
  Volleyball: ['Setter', 'Libero', 'Outside Hitter', 'Opposite Hitter', 'Middle Blocker'],
  Hockey:     ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
};

const ROLES = ['player', 'coach', 'scout', 'fan'] as const;
type Role = typeof ROLES[number];

const ROLE_LABELS: Record<Role, { label: string; emoji: string; desc: string }> = {
  player: { label: 'Player',  emoji: '⚽', desc: 'Track your stats & get scouted' },
  coach:  { label: 'Coach',   emoji: '📋', desc: 'Manage your squad & tactics' },
  scout:  { label: 'Scout',   emoji: '🔍', desc: 'Discover & sign talent' },
  fan:    { label: 'Fan',     emoji: '🏆', desc: 'Follow teams & players' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAge(dob: string): number {
  if (!dob) return 99;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function pwStrength(pw: string): number {
  if (pw.length === 0) return 0;
  if (pw.length < 6)   return 1;
  if (pw.length < 8)   return 2;
  if (pw.length < 12)  return 3;
  return 4;
}

// ── Step Dots ─────────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i < current
              ? 'w-6 h-2 bg-[#FFD700]'
              : i === current
              ? 'w-6 h-2 bg-[#FFD700]/80'
              : 'w-2 h-2 bg-white/20'
          }`}
        />
      ))}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 space-y-4">
      <h2 className="text-[#FFD700] font-semibold text-sm uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-green-300/70 mb-1.5 font-medium">
        {label}{hint && <span className="text-white/30 ml-1">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = 'w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all';
const SELECT = 'w-full px-3 py-2.5 rounded-xl bg-[#0a1a0e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all';

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const loginStore   = useAuthStore((s) => s.login);

  // Step
  const [step, setStep] = useState(0);

  useEffect(() => {
    const preselect = searchParams.get('role');
    if (preselect && ROLES.includes(preselect as typeof ROLES[number])) {
      setRole(preselect as typeof ROLES[number]);
      setStep(1);
    }
  }, [searchParams]);

  // Step 1 — Role
  const [role, setRole] = useState<Role>('player');

  // Step 2 — Auth method
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');

  // Step 3 — About you
  const [firstName, setFirstName]       = useState('');
  const [surname, setSurname]           = useState('');
  const [dob, setDob]                   = useState('');
  const [province, setProvince]         = useState('');
  const [gender, setGender]             = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  // Step 4 — Sport profile (players only)
  const [sport, setSport]               = useState('Football');
  const [position, setPosition]         = useState('');
  const [dominantFoot, setDominantFoot] = useState('');

  // Step 5 (4 for non-players) — Password & submit
  const [password, setPassword]                 = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [showPass, setShowPass]                 = useState(false);
  const [termsAccepted, setTermsAccepted]       = useState(false);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const isPlayer  = role === 'player';
  const age       = useMemo(() => getAge(dob), [dob]);
  const isUnder13 = age < 13 && dob !== '';

  // Total steps: 5 for players, 4 for others
  const totalSteps = isPlayer ? 5 : 4;

  // Which step index is "password & submit"
  const passwordStep = isPlayer ? 4 : 3;
  // Which step index is "sport profile"
  const sportStep = 3; // only shown for players

  // ── Can move to next step ──────────────────────────────────────────────────

  function canNext(): boolean {
    if (step === 0) return true; // role always selected

    if (step === 1) {
      if (authMethod === 'email') return email.trim().includes('@');
      return phone.trim().replace(/\D/g, '').length >= 9;
    }

    if (step === 2) {
      const ok = firstName.trim().length > 0
        && surname.trim().length > 0
        && dob.trim().length > 0
        && province.trim().length > 0;
      if (!ok) return false;
      if (isUnder13 && !guardianPhone.trim()) return false;
      return true;
    }

    if (step === sportStep && isPlayer) {
      return sport.length > 0 && position.length > 0;
    }

    if (step === passwordStep) {
      return (
        password.length >= 8
        && password === confirmPassword
        && termsAccepted
      );
    }

    return true;
  }

  function next() {
    setError(null);
    // Skip sport step for non-players
    if (step === 2 && !isPlayer) {
      setStep(passwordStep);
    } else {
      setStep(s => s + 1);
    }
  }

  function back() {
    setError(null);
    // Skip sport step when going back for non-players
    if (step === passwordStep && !isPlayer) {
      setStep(2);
    } else {
      setStep(s => s - 1);
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name:                  `${firstName.trim()} ${surname.trim()}`,
        first_name:            firstName.trim(),
        surname:               surname.trim(),
        password,
        password_confirmation: confirmPassword,
        role,
        date_of_birth:         dob,
        province,
        sport:                 sport.toLowerCase(),
        ...(isPlayer && position        ? { position }                          : {}),
        ...(isPlayer && dominantFoot    ? { dominant_foot: dominantFoot }       : {}),
        ...(isPlayer && gender          ? { gender }                            : {}),
        ...(isUnder13 && guardianPhone  ? { guardian_phone: guardianPhone }     : {}),
      };

      if (authMethod === 'email') {
        payload.email = email.trim();
      } else {
        // Normalise: 077... → +263 77...
        const digits = phone.trim().replace(/\D/g, '');
        payload.phone = digits.startsWith('0') ? `+263${digits.slice(1)}` : `+263${digits}`;
      }

      const { data } = await api.post('/auth/register', payload, { timeout: 60000 });

      const token: string | undefined = data.token ?? data.access_token ?? data.data?.token;
      const user: AuthUser | undefined = data.user ?? data.data?.user;

      if (token && user) {
        loginStore({ ...user, token });
        // Fire welcome email — non-blocking
        if (authMethod === 'email') {
          fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to:   email.trim(),
              type: 'welcome',
              data: { name: `${firstName.trim()} ${surname.trim()}`, role },
            }),
          }).catch(() => {});
        }
        router.push(roleHomePath(user.role));
      } else {
        router.push('/login?registered=1');
      }
    } catch (err: unknown) {
      const e = err as { code?: string; response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
      const validationErrors = e?.response?.data?.errors;
      if (validationErrors) {
        const first = Object.values(validationErrors)[0][0];
        setError(first);
      } else if (e?.code === 'ECONNABORTED') {
        setError('Server is waking up — please try again in 30 seconds.');
      } else if (e?.response?.status && e.response.status >= 500) {
        setError('Our server ran into an issue. Your account may have been created — please try signing in first.');
      } else {
        setError(e?.response?.data?.message ?? 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step titles ────────────────────────────────────────────────────────────

  const STEP_TITLES: Record<number, string> = {
    0: 'I am a...',
    1: 'Sign up with',
    2: 'About you',
    3: isPlayer ? 'Sport profile' : 'Password',
    4: 'Password',
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a1a0e] py-8 px-4 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] border-2 border-[#FFD700] rounded-[50%]" />
        <div className="absolute top-0 left-1/2 -translate-x-px w-px h-full bg-[#FFD700]" />
      </div>

      <div className="w-full max-w-lg mx-auto relative z-10">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1a3a1f] border border-[#FFD700]/30 mb-3">
            <span className="text-2xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            GrassRoots <span className="text-[#FFD700]">Sports</span>
          </h1>
          <p className="text-green-400/60 text-sm mt-1">Create your free account</p>
        </div>

        {/* Progress dots */}
        <StepDots current={step} total={totalSteps} />

        {/* Step label */}
        <p className="text-center text-white/40 text-xs mb-4 tracking-wider uppercase">
          Step {step + 1} of {totalSteps} — {STEP_TITLES[step]}
        </p>

        {/* ── STEP 0: Role ── */}
        {step === 0 && (
          <Card title="I am a...">
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === r
                      ? 'border-[#FFD700] bg-[#FFD700]/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-xl mb-1">{ROLE_LABELS[r].emoji}</div>
                  <div className="text-white font-medium text-sm">{ROLE_LABELS[r].label}</div>
                  <div className="text-white/40 text-xs mt-0.5">{ROLE_LABELS[r].desc}</div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* ── STEP 1: Auth method ── */}
        {step === 1 && (
          <Card title="Sign up with">
            {/* Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-white/10 mb-2">
              {(['email', 'phone'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAuthMethod(m)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                    authMethod === m
                      ? 'bg-[#FFD700] text-[#0a1a0e]'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {m === 'email' ? '✉ Email Address' : '📱 Phone Number'}
                </button>
              ))}
            </div>

            {authMethod === 'email' ? (
              <Field label="Email Address">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={INPUT}
                />
              </Field>
            ) : (
              <Field label="Phone Number" hint="Zimbabwe number">
                <div className="flex gap-2">
                  <div className="flex items-center px-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm whitespace-nowrap">
                    +263
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="77 123 4567"
                    autoComplete="tel"
                    className={INPUT}
                  />
                </div>
                <p className="text-white/30 text-xs mt-1.5">
                  Enter your EcoCash / NetOne / Telecel number (e.g. 077 123 4567)
                </p>
              </Field>
            )}
          </Card>
        )}

        {/* ── STEP 2: About you ── */}
        {step === 2 && (
          <Card title="About you">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name">
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Tendai"
                  className={INPUT}
                />
              </Field>
              <Field label="Surname">
                <input
                  type="text"
                  value={surname}
                  onChange={e => setSurname(e.target.value)}
                  placeholder="Musona"
                  className={INPUT}
                />
              </Field>
            </div>

            <Field label="Date of Birth">
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                max={new Date(Date.now() - 6 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className={INPUT}
              />
            </Field>

            <Field label="Province">
              <select value={province} onChange={e => setProvince(e.target.value)} className={SELECT}>
                <option value="">Select province</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>

            {/* Gender — players only */}
            {isPlayer && (
              <Field label="Gender" hint="(optional — helps scouts find female talent)">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'male',              label: 'Male'              },
                    { value: 'female',             label: 'Female'            },
                    { value: 'prefer_not_to_say',  label: 'Prefer not to say' },
                  ].map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGender(gender === g.value ? '' : g.value)}
                      className={`py-2 px-2 rounded-xl border text-xs font-medium transition-all ${
                        gender === g.value
                          ? g.value === 'female'
                            ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                            : 'border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]'
                          : 'border-white/10 text-white/50 hover:border-white/30'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            {/* Under-13 guardian */}
            {isUnder13 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                <p className="text-amber-400 text-xs font-medium">
                  ⚠️ Players under 13 require guardian approval.
                </p>
                <Field label="Guardian Phone Number">
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={e => setGuardianPhone(e.target.value)}
                    placeholder="Guardian's 07X XXX XXXX"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-amber-500/30 text-white placeholder-white/20 text-sm focus:outline-none focus:border-amber-500/50 transition-all"
                  />
                </Field>
              </div>
            )}
          </Card>
        )}

        {/* ── STEP 3: Sport Profile (players only) ── */}
        {step === sportStep && isPlayer && (
          <Card title="Sport profile">
            <Field label="Sport">
              <select
                value={sport}
                onChange={e => { setSport(e.target.value); setPosition(''); }}
                className={SELECT}
              >
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Primary Position">
              <select value={position} onChange={e => setPosition(e.target.value)} className={SELECT}>
                <option value="">Select position</option>
                {(POSITIONS[sport] || []).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>

            <Field label="Dominant Foot" hint="(optional)">
              <div className="grid grid-cols-3 gap-2">
                {['Left', 'Right', 'Both'].map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setDominantFoot(dominantFoot === f ? '' : f)}
                    className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                      dominantFoot === f
                        ? 'border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]'
                        : 'border-white/10 text-white/50 hover:border-white/30'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </Field>
          </Card>
        )}

        {/* ── STEP password: Password & Review ── */}
        {step === passwordStep && (
          <div className="space-y-4">
            <Card title="Set your password">
              <Field label="Password">
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className={INPUT + ' pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          pwStrength(password) >= i
                            ? ['', 'bg-red-500', 'bg-amber-500', 'bg-[#FFD700]', 'bg-green-500'][i]
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </Field>

              <Field label="Confirm Password">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`${INPUT} ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-red-500/50'
                      : ''
                  }`}
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
              </Field>
            </Card>

            {/* Review summary */}
            <div className="bg-[#0f2614]/60 border border-white/5 rounded-2xl p-4 space-y-2">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Account summary</p>
              {[
                ['Role',     ROLE_LABELS[role].label],
                ['Sign in',  authMethod === 'email' ? email || '—' : `+263 ${phone}` || '—'],
                ['Name',     `${firstName} ${surname}`.trim() || '—'],
                ['Province', province || '—'],
                ...(isPlayer ? [
                  ['Sport',    sport],
                  ['Position', position || '—'],
                ] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-white/40">{k}</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#FFD700]"
              />
              <span className="text-xs text-white/50">
                I agree to the{' '}
                <Link href="/terms" className="text-[#FFD700] hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-[#FFD700] hover:underline">Privacy Policy</Link>.
                My information will be used to manage my sports profile on GrassRoots Sports.
              </span>
            </label>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="px-5 py-3 rounded-xl border border-white/10 text-white/60 text-sm hover:border-white/30 hover:text-white transition-all"
            >
              ← Back
            </button>
          )}

          {step < passwordStep ? (
            <button
              type="button"
              onClick={next}
              disabled={!canNext()}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-[#FFD700] text-[#0a1a0e] hover:bg-[#FFE44D] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !canNext()}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-[#FFD700] text-[#0a1a0e] hover:bg-[#FFE44D] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0a1a0e]/30 border-t-[#0a1a0e] rounded-full animate-spin" />
                  Creating account...
                </>
              ) : 'Create Account →'}
            </button>
          )}
        </div>

        {/* Official registration link (players only, visible on role step) */}
        {step === 0 && role === 'player' && (
          <Link
            href="/register/official"
            className="block text-center text-sm text-green-400/60 hover:text-green-400 transition-colors py-3 mt-2"
          >
            Registering a young player officially? →{' '}
            <span className="text-[#FFD700]">Official Player Registration</span>
          </Link>
        )}

        <div className="text-center mt-4 space-y-2">
          <p className="text-white/30 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-[#FFD700] hover:text-[#FFE44D] font-medium transition-colors">
              Sign in
            </Link>
          </p>
          <Link
            href="/player"
            className="block text-white/20 text-xs hover:text-white/40 transition-colors"
          >
            Continue exploring without registering →
          </Link>
        </div>

      </div>
    </div>
  );
}
