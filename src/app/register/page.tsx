'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore, roleHomePath, type AuthUser } from '@/lib/auth-store';

// ── Constants ────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAge(dob: string): number {
  if (!dob) return 99;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router     = useRouter();
  const loginStore = useAuthStore((s) => s.login);

  // Personal
  const [firstName, setFirstName]       = useState('');
  const [surname, setSurname]           = useState('');
  const [phone, setPhone]               = useState('');
  const [email, setEmail]               = useState('');
  const [dob, setDob]                   = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  // Role
  const [role, setRole] = useState<Role>('player');

  // Sport profile
  const [sport, setSport]             = useState('Football');
  const [position, setPosition]       = useState('');
  const [dominantFoot, setDominantFoot] = useState('');
  const [province, setProvince]       = useState('');

  // Security
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]           = useState(false);

  // UI state
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const age       = useMemo(() => getAge(dob), [dob]);
  const isUnder13 = age < 13 && dob !== '';
  const isPlayer  = role === 'player';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (isUnder13 && !guardianPhone) {
      setError('Guardian phone number is required for players under 13.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name:                  `${firstName.trim()} ${surname.trim()}`,
        first_name:            firstName.trim(),
        surname:               surname.trim(),
        email:                 email.trim(),
        phone:                 phone.trim(),
        password,
        password_confirmation: confirmPassword,
        role,
        date_of_birth:         dob,
        sport:                 sport.toLowerCase(),
        position,
        dominant_foot:         dominantFoot,
        province,
        ...(isUnder13 && guardianPhone ? { guardian_phone: guardianPhone } : {}),
      }, { timeout: 60000 });

      // Auto-login if backend returns a token
      const token: string | undefined = data.token ?? data.access_token ?? data.data?.token;
      const user: AuthUser | undefined = data.user ?? data.data?.user;

      if (token && user) {
        loginStore({ ...user, token });
        router.push(roleHomePath(user.role));
      } else {
        router.push('/login?registered=1');
      }
    } catch (err: unknown) {
      const e = err as { code?: string; response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const validationErrors = e?.response?.data?.errors;
      if (validationErrors) {
        const first = Object.values(validationErrors)[0][0];
        setError(first);
      } else {
        setError(
          e?.response?.data?.message ??
          (e?.code === 'ECONNABORTED' ? 'Server is waking up — please try again in 30 seconds.' : null) ??
          'Registration failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1a0e] py-8 px-4 relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] border-2 border-[#FFD700] rounded-[50%]" />
        <div className="absolute top-0 left-1/2 -translate-x-px w-px h-full bg-[#FFD700]" />
      </div>

      <div className="w-full max-w-lg mx-auto relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1a3a1f] border border-[#FFD700]/30 mb-3">
            <span className="text-2xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            GrassRoots <span className="text-[#FFD700]">Sports</span>
          </h1>
          <p className="text-green-400/60 text-sm mt-1">Create your free account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Role Selector ── */}
          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6">
            <h2 className="text-[#FFD700] font-semibold text-sm uppercase tracking-wider mb-4">I am a...</h2>
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
          </div>

          {/* ── Personal Details ── */}
          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-[#FFD700] font-semibold text-sm uppercase tracking-wider">Personal Details</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-green-300/70 mb-1.5 font-medium">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Tendai"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Surname</label>
                <input
                  type="text"
                  value={surname}
                  onChange={e => setSurname(e.target.value)}
                  placeholder="Musona"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Phone Number <span className="text-white/30">(optional)</span></label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="07X XXX XXXX"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                max={new Date(Date.now() - 6 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>

            {/* Under-13 guardian field */}
            {isUnder13 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                <p className="text-amber-400 text-xs font-medium">
                  ⚠️ Players under 13 require guardian approval. A notification will be sent to the guardian.
                </p>
                <div>
                  <label className="block text-xs text-amber-300/70 mb-1.5 font-medium">Guardian Phone Number</label>
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={e => setGuardianPhone(e.target.value)}
                    placeholder="Guardian's 07X XXX XXXX"
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-amber-500/30 text-white placeholder-white/20 text-sm focus:outline-none focus:border-amber-500/50 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Sport Profile ── */}
          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-[#FFD700] font-semibold text-sm uppercase tracking-wider">Sport Profile</h2>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Sport</label>
              <select
                value={sport}
                onChange={e => { setSport(e.target.value); setPosition(''); }}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0a1a0e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              >
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {isPlayer && (
              <>
                <div>
                  <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Primary Position</label>
                  <select
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0a1a0e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
                  >
                    <option value="">Select position</option>
                    {(POSITIONS[sport] || []).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-green-300/70 mb-2 font-medium">Dominant Foot</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Left', 'Right', 'Both'].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setDominantFoot(f)}
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
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Province</label>
              <select
                value={province}
                onChange={e => setProvince(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-[#0a1a0e] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
              >
                <option value="">Select province</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* ── Security ── */}
          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-[#FFD700] font-semibold text-sm uppercase tracking-wider">Security</h2>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="w-full px-3 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#FFD700]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        password.length >= [4, 6, 8, 12][i]
                          ? ['bg-red-500', 'bg-amber-500', 'bg-[#FFD700]', 'bg-green-500'][i]
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-green-300/70 mb-1.5 font-medium">Confirm Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                className={`w-full px-3 py-2.5 rounded-xl bg-white/5 border text-white placeholder-white/20 text-sm focus:outline-none transition-all ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-[#FFD700]/50'
                }`}
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ── Terms & Conditions ── */}
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

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading || !termsAccepted}
            className="w-full py-3.5 rounded-xl font-semibold text-sm
                       bg-[#FFD700] text-[#0a1a0e]
                       hover:bg-[#FFE44D] active:scale-[0.98]
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#0a1a0e]/30 border-t-[#0a1a0e] rounded-full animate-spin" />
                Creating account...
              </>
            ) : 'Create Account →'}
          </button>

          {/* Official registration link (players only) */}
          {isPlayer && (
            <Link
              href="/register/official"
              className="block text-center text-sm text-green-400/60 hover:text-green-400 transition-colors py-2"
            >
              Registering a young player officially? →{' '}
              <span className="text-[#FFD700]">Official Player Registration</span>
            </Link>
          )}

          <div className="text-center space-y-2">
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

        </form>
      </div>
    </div>
  );
}
