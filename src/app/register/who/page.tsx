'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ROLES = [
  {
    id: 'player',
    icon: '⚽',
    title: 'Player / Athlete',
    desc: 'Track your stats, get AI coaching, and get discovered by scouts',
    href: '/register?role=player',
    color: 'from-green-900/40 to-green-800/20',
    border: 'border-green-600/30 hover:border-green-400/60',
  },
  {
    id: 'coach',
    icon: '📋',
    title: 'Coach',
    desc: 'Manage your squad, run live matches, and build training plans',
    href: '/register?role=coach',
    color: 'from-blue-900/40 to-blue-800/20',
    border: 'border-blue-600/30 hover:border-blue-400/60',
  },
  {
    id: 'scout',
    icon: '🔍',
    title: 'Scout',
    desc: 'Discover talent, build shortlists, and generate scouting reports',
    href: '/register?role=scout',
    color: 'from-purple-900/40 to-purple-800/20',
    border: 'border-purple-600/30 hover:border-purple-400/60',
  },
  {
    id: 'fan',
    icon: '🏆',
    title: 'Fan',
    desc: 'Follow players and teams, browse the leaderboard, and stay connected',
    href: '/register?role=fan',
    color: 'from-amber-900/40 to-amber-800/20',
    border: 'border-amber-600/30 hover:border-amber-400/60',
  },
  {
    id: 'club',
    icon: '🏟️',
    title: 'Club or Academy',
    desc: 'Register your club, manage rosters, and connect with players',
    href: '/register/organisation',
    color: 'from-teal-900/40 to-teal-800/20',
    border: 'border-teal-600/30 hover:border-teal-400/60',
  },
  {
    id: 'school',
    icon: '🏫',
    title: 'School',
    desc: 'Manage NASH/NAPH sports programmes, fixtures, and student athletes',
    href: '/register/school',
    color: 'from-cyan-900/40 to-cyan-800/20',
    border: 'border-cyan-600/30 hover:border-cyan-400/60',
  },
  {
    id: 'business',
    icon: '💼',
    title: 'Business / Sponsor',
    desc: 'Sponsor teams, organise events, and connect with Zimbabwean sport',
    href: '/register/business',
    color: 'from-orange-900/40 to-orange-800/20',
    border: 'border-orange-600/30 hover:border-orange-400/60',
  },
];

export default function WhoAreYouPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a1a0e] py-10 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] border-2 border-[#FFD700] rounded-[50%]" />
        <div className="absolute top-0 left-1/2 -translate-x-px w-px h-full bg-[#FFD700]" />
      </div>

      <div className="w-full max-w-2xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1a3a1f] border border-[#FFD700]/30 mb-4">
            <span className="text-3xl">🇿🇼</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Who are you?</h1>
          <p className="text-green-400/60 text-sm mt-2">
            GrassRoots Sports — Zimbabwe&apos;s first AI-powered sports platform
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROLES.map(role => (
            <button
              key={role.id}
              type="button"
              onClick={() => router.push(role.href)}
              className={`relative flex items-start gap-4 p-4 rounded-2xl border bg-gradient-to-br ${role.color} ${role.border} text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] group`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0 group-hover:bg-white/10 transition-all">
                {role.icon}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">{role.title}</p>
                <p className="text-white/40 text-xs mt-1 leading-relaxed">{role.desc}</p>
              </div>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/50 transition-all text-lg">
                →
              </span>
            </button>
          ))}
        </div>

        {/* Sign in link */}
        <p className="text-center text-white/30 text-sm mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-[#FFD700]/70 hover:text-[#FFD700] transition-colors font-medium">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
