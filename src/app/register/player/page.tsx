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

const POSITIONS = [
  'Goalkeeper', 'Right Back', 'Centre Back', 'Left Back',
  'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder',
  'Right Winger', 'Left Winger', 'Striker',
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function getAge(day: string, month: string, year: string): number {
  if (!day || !month || !year) return 99;
  const dob = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

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

export default function RegisterPlayerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Personal
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 — Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Step 3 — Playing
  const [position, setPosition] = useState('');
  const [province, setProvince] = useState('');
  const [school, setSchool] = useState('');
  const [ageGroup, setAgeGroup] = useState('');

  // Step 4 — Physical
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [foot, setFoot] = useState('');

  // Step 5 — Consent
  const [guardianPhone, setGuardianPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const age = getAge(dobDay, dobMonth, dobYear);
  const isUnder13 = age < 13;
  const pw = passwordStrength(password);

  const next = () => { setError(null); setStep(s => s + 1); };
  const back = () => { setError(null); setStep(s => s - 1); };

  const canStep1 = firstName && surname && dobDay && dobMonth && dobYear;
  const canStep2 = email && password.length >= 8 && password === confirmPassword;
  const canStep3 = position && province;
  const canStep4 = foot;
  const canStep5 = termsAccepted && (!isUnder13 || guardianPhone);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const dob = `${dobYear}-${dobMonth.padStart(2,'0')}-${dobDay.padStart(2,'0')}`;
      await api.post('/auth/register', {
        first_name: firstName,
        surname,
        name: `${firstName} ${surname}`,
        email,
        password,
        password_confirmation: confirmPassword,
        role: 'player',
        phone: phone || undefined,
        date_of_birth: dob,
        position,
        province,
        school_club: school || undefined,
        age_group: ageGroup || undefined,
        height_cm: height ? parseInt(height) : undefined,
        weight_kg: weight ? parseInt(weight) : undefined,
        dominant_foot: foot,
        guardian_phone: guardianPhone || undefined,
      });
      router.push('/login?registered=1');
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const d = e?.response?.data;
      const msg = (d?.message as string) ?? (d?.error as string) ?? 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1a0e] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] border-2 border-[#FFD700] rounded-[50%]" />
        <div className="absolute top-0 left-1/2 -translate-x-px w-px h-full bg-[#FFD700]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1a3a1f] border border-[#FFD700]/30 mb-3">
            <span className="text-2xl">⚽</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            GrassRoots <span className="text-[#FFD700]">Sports</span>
          </h1>
          <p className="text-green-400/60 text-xs mt-1">Player Registration</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {[1,2,3,4,5].map(n => (
            <div key={n} className={`flex-1 h-1 rounded-full transition-all ${n <= step ? 'bg-[#FFD700]' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
          )}

          {/* Step 1 — Personal */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-base mb-4">Personal Details</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-green-300/70 mb-1">First Name</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Tendai"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FFD700]/50" />
                </div>
                <div>
                  <label className="block text-xs text-green-300/70 mb-1">Surname</label>
                  <input value={surname} onChange={e => setSurname(e.target.value)} placeholder="Musona"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FFD700]/50" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-green-300/70 mb-1">Date of Birth</label>
                <div className="grid grid-cols-3 gap-2">
                  <select value={dobDay} onChange={e => setDobDay(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50">
                    <option value="">Day</option>
                    {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={dobMonth} onChange={e => setDobMonth(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50">
                    <option value="">Month</option>
                    {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
                  </select>
                  <select value={dobYear} onChange={e => setDobYear(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50">
                    <option value="">Year</option>
                    {Array.from({length:30},(_,i)=>new Date().getFullYear()-i-6).map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-green-300/70 mb-1">Phone (optional)</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07X XXX XXXX"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FFD700]/50" />
              </div>
            </div>
          )}

          {/* Step 2 — Account */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-base mb-4">Create Account</h2>
              <div>
                <label className="block text-xs text-green-300/70 mb-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FFD700]/50" />
              </div>
              <div>
                <label className="block text-xs text-green-300/70 mb-1">Password (min 8 characters)</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full px-3 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FFD700]/50" />
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
                <label className="block text-xs text-green-300/70 mb-1">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FFD700]/50" />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Playing */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-base mb-4">Playing Details</h2>
              <div>
                <label className="block text-xs text-green-300/70 mb-1">Position</label>
                <select value={position} onChange={e => setPosition(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50">
                  <option value="">Select position</option>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-green-300/70 mb-1">Province</label>
                <select value={province} onChange={e => setProvince(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50">
                  <option value="">Select province</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-green-300/70 mb-1">School / Club (optional)</label>
                <input value={school} onChange={e => setSchool(e.target.value)} placeholder="e.g. Dynamos FC or Churchill High"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FFD700]/50" />
              </div>
              <div>
                <label className="block text-xs text-green-300/70 mb-1">Age Group (optional)</label>
                <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50">
                  <option value="">Select age group</option>
                  <option>Under 13</option>
                  <option>Under 15</option>
                  <option>Under 17</option>
                  <option>Under 20</option>
                  <option>Senior (20+)</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4 — Physical */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-base mb-4">Physical Profile</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-green-300/70 mb-1">Height (cm)</label>
                  <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="175"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FFD700]/50" />
                </div>
                <div>
                  <label className="block text-xs text-green-300/70 mb-1">Weight (kg)</label>
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FFD700]/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-green-300/70 mb-2">Dominant Foot</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Right','Left','Both'].map(f => (
                    <button key={f} type="button" onClick={() => setFoot(f)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        foot === f
                          ? 'bg-[#FFD700] text-[#0a1a0e] border-[#FFD700]'
                          : 'bg-white/5 text-white/70 border-white/10 hover:border-[#FFD700]/40'
                      }`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5 — Consent */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-base mb-4">Review & Confirm</h2>
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
                  <span className="text-white/50">Position</span>
                  <span className="text-white">{position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Province</span>
                  <span className="text-white">{province}</span>
                </div>
              </div>

              {isUnder13 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <p className="text-amber-400 text-xs mb-2">⚠️ ZIFA Safeguarding: Parent/Guardian consent required for under-13 players.</p>
                  <label className="block text-xs text-green-300/70 mb-1">Guardian Phone Number</label>
                  <input value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} placeholder="07X XXX XXXX"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FFD700]/50" />
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#FFD700]" />
                <span className="text-xs text-white/60">
                  I agree to the{' '}
                  <Link href="/terms" className="text-[#FFD700] hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-[#FFD700] hover:underline">Privacy Policy</Link>.
                  I confirm all information provided is accurate.
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
            {step < 5 ? (
              <button onClick={next}
                disabled={
                  (step === 1 && !canStep1) ||
                  (step === 2 && !canStep2) ||
                  (step === 3 && !canStep3) ||
                  (step === 4 && !canStep4)
                }
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-[#FFD700] text-[#0a1a0e] hover:bg-[#FFE44D] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Next →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!canStep5 || loading}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-[#FFD700] text-[#0a1a0e] hover:bg-[#FFE44D] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-[#0a1a0e]/30 border-t-[#0a1a0e] rounded-full animate-spin" />Creating account...</>
                ) : 'Create Account ✓'}
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-white/40 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-[#FFD700] hover:text-[#FFE44D] font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
