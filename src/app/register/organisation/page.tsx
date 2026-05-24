'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

const PROVINCES = [
  'Harare', 'Bulawayo', 'Manicaland', 'Mashonaland Central',
  'Mashonaland East', 'Mashonaland West', 'Masvingo',
  'Matabeleland North', 'Matabeleland South', 'Midlands',
];

const ORG_TYPES = [
  'Football Club', 'Rugby Club', 'Athletics Club', 'Netball Club',
  'Basketball Club', 'Cricket Club', 'Swimming Club',
  'Multi-Sport Academy', 'Development Academy', 'Sports Federation',
];

const SPORTS = [
  'Football', 'Rugby', 'Athletics', 'Netball', 'Basketball',
  'Cricket', 'Swimming', 'Tennis', 'Volleyball', 'Hockey', 'Multi-Sport',
];

type Step = 1 | 2 | 3;

interface OrgData {
  orgName: string;
  orgType: string;
  sport: string;
  province: string;
  website: string;
}

interface AdminData {
  contactName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function passwordStrength(p: string): number {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score;
}

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

export default function OrganisationRegisterPage() {
  const router = useRouter();
  const loginStore = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [org, setOrg] = useState<OrgData>({
    orgName: '', orgType: '', sport: '', province: '', website: '',
  });
  const [admin, setAdmin] = useState<AdminData>({
    contactName: '', email: '', password: '', confirmPassword: '',
  });

  const canNext: Record<Step, boolean> = {
    1: !!org.orgName && !!org.orgType && !!org.sport && !!org.province,
    2: !!admin.contactName && !!admin.email &&
       admin.password.length >= 8 &&
       admin.password === admin.confirmPassword,
    3: true,
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const nameParts = admin.contactName.trim().split(' ');
      const res = await api.post('/auth/register', {
        name:                  admin.contactName,
        first_name:            nameParts[0] ?? admin.contactName,
        surname:               nameParts.slice(1).join(' ') || '-',
        email:                 admin.email,
        password:              admin.password,
        password_confirmation: admin.confirmPassword,
        role:                  'club',
        province:              org.province,
        organisation_name:     org.orgName,
        organisation_type:     org.orgType,
        sport:                 org.sport,
        website:               org.website || null,
      });

      const data = res.data;
      if (data.token && data.user) {
        loginStore(data.token, data.user);
        router.push('/coach');
      } else {
        router.push('/login?registered=1');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const firstError = e.response?.data?.errors
        ? Object.values(e.response.data.errors)[0]?.[0]
        : null;
      setError(firstError ?? e.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(admin.password);

  return (
    <div className="min-h-screen bg-[#0a1a0e] py-8 px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] border-2 border-[#FFD700] rounded-[50%]" />
        <div className="absolute top-0 left-1/2 -translate-x-px w-px h-full bg-[#FFD700]" />
      </div>

      <div className="w-full max-w-lg mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1a3a1f] border border-[#FFD700]/30 mb-3">
            <span className="text-2xl">🏟️</span>
          </div>
          <h1 className="text-xl font-bold text-white">Club or Academy Registration</h1>
          <p className="text-green-400/60 text-sm mt-1">GrassRoots Sports — Zimbabwe</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {['Organisation', 'Admin', 'Confirm'].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > i + 1
                    ? 'bg-green-500 text-white'
                    : step === i + 1
                      ? 'bg-[#FFD700] text-[#0a1a0e]'
                      : 'bg-white/10 text-white/30'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${step === i + 1 ? 'text-[#FFD700]' : 'text-white/30'}`}>{label}</span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-white/10 rounded-full">
            <div
              className="h-1 bg-[#FFD700] rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step 1 — Organisation Details */}
        {step === 1 && (
          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">Step 1 — Organisation Details</h2>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Club / Academy Name</label>
              <input
                type="text"
                value={org.orgName}
                onChange={e => setOrg({ ...org, orgName: e.target.value })}
                placeholder="e.g. Harare City FC Academy"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-2 font-medium">Organisation Type</label>
              <div className="grid grid-cols-2 gap-2">
                {ORG_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOrg({ ...org, orgType: t })}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium text-left transition-all ${
                      org.orgType === t
                        ? 'border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]'
                        : 'border-white/10 text-white/50 hover:border-white/30'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Primary Sport</label>
              <select
                value={org.sport}
                onChange={e => setOrg({ ...org, sport: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0a1a0e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              >
                <option value="">Select sport</option>
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Province</label>
              <select
                value={org.province}
                onChange={e => setOrg({ ...org, province: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0a1a0e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              >
                <option value="">Select province</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">
                Website <span className="text-white/30">(optional)</span>
              </label>
              <input
                type="url"
                value={org.website}
                onChange={e => setOrg({ ...org, website: e.target.value })}
                placeholder="https://yourclub.co.zw"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>
          </div>
        )}

        {/* Step 2 — Admin Contact */}
        {step === 2 && (
          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">Step 2 — Admin Contact</h2>
            <p className="text-white/40 text-sm">This person will manage the organisation account.</p>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Contact Person Full Name</label>
              <input
                type="text"
                value={admin.contactName}
                onChange={e => setAdmin({ ...admin, contactName: e.target.value })}
                placeholder="Full name of club administrator"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Email Address</label>
              <input
                type="email"
                value={admin.email}
                onChange={e => setAdmin({ ...admin, email: e.target.value })}
                placeholder="admin@yourclub.co.zw"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Password</label>
              <input
                type="password"
                value={admin.password}
                onChange={e => setAdmin({ ...admin, password: e.target.value })}
                placeholder="Min. 8 characters"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
              {admin.password && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= strength ? STRENGTH_COLOR[strength] : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strength >= 3 ? 'text-green-400' : 'text-white/40'}`}>
                    {STRENGTH_LABEL[strength]}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Confirm Password</label>
              <input
                type="password"
                value={admin.confirmPassword}
                onChange={e => setAdmin({ ...admin, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-white/20 text-sm focus:outline-none transition-all ${
                  admin.confirmPassword && admin.password !== admin.confirmPassword
                    ? 'border-red-500/50'
                    : 'border-white/10 focus:border-[#FFD700]/50'
                }`}
              />
              {admin.confirmPassword && admin.password !== admin.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Review & Confirm */}
        {step === 3 && (
          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg">Step 3 — Review & Submit</h2>
            <p className="text-white/40 text-sm">Check your details before creating the account.</p>

            <div className="space-y-2 bg-white/5 rounded-xl p-4">
              {[
                ['Organisation', org.orgName],
                ['Type', org.orgType],
                ['Sport', org.sport],
                ['Province', org.province],
                ['Contact', admin.contactName],
                ['Email', admin.email],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-white/40">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
            </div>

            <p className="text-white/30 text-xs text-center">
              By registering you agree to the{' '}
              <Link href="/terms" className="text-[#FFD700]/60 hover:text-[#FFD700]">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[#FFD700]/60 hover:text-[#FFD700]">Privacy Policy</Link>.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as Step)}
              className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:border-white/30 transition-all"
            >
              Back
            </button>
          ) : (
            <Link
              href="/register/who"
              className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:border-white/30 transition-all text-center"
            >
              Back
            </Link>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => canNext[step] && setStep((step + 1) as Step)}
              disabled={!canNext[step]}
              className="flex-1 py-3 rounded-xl bg-[#FFD700] text-[#0a1a0e] text-sm font-semibold hover:bg-[#FFE44D] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-[#FFD700] text-[#0a1a0e] text-sm font-semibold hover:bg-[#FFE44D] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0a1a0e]/30 border-t-[#0a1a0e] rounded-full animate-spin" />
                  Creating account...
                </>
              ) : 'Create Organisation Account'}
            </button>
          )}
        </div>

        <p className="text-center text-white/20 text-xs mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-[#FFD700]/60 hover:text-[#FFD700] transition-colors">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
