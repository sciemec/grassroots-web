'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

const PROVINCES = [
  'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central',
  'Mashonaland East', 'Mashonaland West', 'Masvingo',
  'Matabeleland North', 'Matabeleland South', 'Midlands',
];

const SPORTS = [
  'Football', 'Rugby', 'Athletics', 'Netball',
  'Basketball', 'Cricket', 'Swimming', 'Tennis', 'Volleyball', 'Hockey',
];

const CAF_LEVELS = [
  'Grassroots Certificate',
  'Level 1 CAF',
  'Level 2 CAF',
  'Level 3 CAF',
  'UEFA equivalent / International',
];

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  return { score, label: labels[score] || '', color: colors[score] || '' };
}

export default function RegisterCoachPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Personal
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');

  // Step 2 — Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Step 3 — Professional
  const [teamName, setTeamName] = useState('');
  const [sport, setSport] = useState('');
  const [cafLevel, setCafLevel] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');

  // Step 4 — Confirm (no extra fields, just review)
  const [termsAccepted, setTermsAccepted] = useState(false);

  const pw = passwordStrength(password);

  const next = () => { setError(null); setStep(s => s + 1); };
  const back = () => { setError(null); setStep(s => s - 1); };

  const canStep1 = firstName && surname && province;
  const canStep2 = email && password.length >= 8 && password === confirmPassword;
  const canStep3 = sport;
  const canStep4 = termsAccepted;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/register', {
        first_name: firstName,
        surname,
        name: `${firstName} ${surname}`,
        email,
        password,
        password_confirmation: confirmPassword,
        role: 'coach',
        phone: phone || undefined,
        province,
        team_name: teamName || undefined,
        sport,
        coaching_level: cafLevel || undefined,
        years_experience: yearsExperience ? parseInt(yearsExperience) : undefined,
      });
      router.push('/login?registered=1');
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const d = e?.response?.data;
      setError((d?.message as string) ?? (d?.error as string) ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1020] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] border-2 border-blue-400 rounded-[50%]" />
        <div className="absolute top-0 left-1/2 -translate-x-px w-px h-full bg-blue-400" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f1f3a] border border-blue-400/30 mb-3">
            <span className="text-2xl">🏆</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            GrassRoots <span className="text-blue-400">Sports</span>
          </h1>
          <p className="text-blue-400/60 text-xs mt-1">Coach Registration</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {[1,2,3,4].map(n => (
            <div key={n} className={`flex-1 h-1 rounded-full transition-all ${n <= step ? 'bg-blue-400' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="bg-[#0f1a2e]/80 backdrop-blur border border-blue-400/10 rounded-2xl p-6 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
          )}

          {/* Step 1 — Personal */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-base mb-4">Personal Details</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-blue-300/70 mb-1">First Name</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Callisto"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-400/50" />
                </div>
                <div>
                  <label className="block text-xs text-blue-300/70 mb-1">Surname</label>
                  <input value={surname} onChange={e => setSurname(e.target.value)} placeholder="Pasuwa"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-400/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-blue-300/70 mb-1">Province</label>
                <select value={province} onChange={e => setProvince(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400/50">
                  <option value="">Select province</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blue-300/70 mb-1">Phone (optional)</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07X XXX XXXX"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-400/50" />
              </div>
            </div>
          )}

          {/* Step 2 — Account */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-base mb-4">Create Account</h2>
              <div>
                <label className="block text-xs text-blue-300/70 mb-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="coach@email.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-400/50" />
              </div>
              <div>
                <label className="block text-xs text-blue-300/70 mb-1">Password (min 8 characters)</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full px-3 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-400/50" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs">
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                {password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex gap-0.5 flex-1">
                      {[1,2,3,4].map(n => (
                        <div key={n} className="flex-1 h-1 rounded-full"
                          style={{ background: n <= pw.score ? pw.color : 'rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: pw.color }}>{pw.label}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-blue-300/70 mb-1">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-400/50" />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Professional */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-base mb-4">Professional Details</h2>
              <div>
                <label className="block text-xs text-blue-300/70 mb-1">Team / Club Name (optional)</label>
                <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Dynamos FC"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-400/50" />
              </div>
              <div>
                <label className="block text-xs text-blue-300/70 mb-1">Sport Coached</label>
                <select value={sport} onChange={e => setSport(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400/50">
                  <option value="">Select sport</option>
                  {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blue-300/70 mb-1">CAF Coaching Level</label>
                <select value={cafLevel} onChange={e => setCafLevel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400/50">
                  <option value="">Select level</option>
                  {CAF_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-blue-300/70 mb-1">Years of Experience</label>
                <select value={yearsExperience} onChange={e => setYearsExperience(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400/50">
                  <option value="">Select years</option>
                  <option value="0">Less than 1 year</option>
                  <option value="1">1–2 years</option>
                  <option value="3">3–5 years</option>
                  <option value="6">6–10 years</option>
                  <option value="11">10+ years</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4 — Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-base mb-4">Confirm Registration</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Name</span>
                  <span className="text-white">{firstName} {surname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Email</span>
                  <span className="text-white">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Sport</span>
                  <span className="text-white">{sport || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Level</span>
                  <span className="text-white">{cafLevel || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Province</span>
                  <span className="text-white">{province}</span>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-400" />
                <span className="text-xs text-white/60">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-400 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>.
                </span>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button onClick={back}
                className="flex-1 py-3 rounded-xl font-medium text-sm bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 transition-all">
                ← Back
              </button>
            )}
            {step < 4 ? (
              <button onClick={next}
                disabled={
                  (step === 1 && !canStep1) ||
                  (step === 2 && !canStep2) ||
                  (step === 3 && !canStep3)
                }
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Next →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!canStep4 || loading}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
                ) : 'Create Account ✓'}
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-white/40 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
