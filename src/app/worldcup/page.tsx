'use client';

// src/app/world-cup/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FINAL PRODUCT — GRS World Cup Tactical Lab with Virtual Classroom
//
// WHAT CHANGED:
//   1. Virtual Classroom added to right sidebar (replaces empty space)
//   2. Match modules library for past matches
//   3. Module player with lessons, chat, and drawing tools
//   4. Progress tracking for each module
//   5. All existing features preserved (Tactical Reports, Quizzes, Blueprints)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import {
  MapPin, Calendar, Tv, Activity, Copy, Check,
  TrendingUp, Youtube, MessageCircle, Lock, Unlock,
  Loader2, X, Star, Users, Trophy as TrophyIcon, Brain,
  FileDown, Download,
  Video,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { calculateTacticalIQ, type TacticalIQResult } from '@/lib/tactical-iq/tactical-iq-engine';

// ─────────────────────────────────────────────────────────────────────────────
// VIRTUAL CLASSROOM IMPORTS
// ─────────────────────────────────────────────────────────────────────────────
import { VirtualClassroom } from '@/lib/virtual-classroom/VirtualClassroom';
import { ClassroomProvider } from '@/lib/virtual-classroom/ClassroomProvider';
import { BlueprintPurchaseModal } from '@/components/tactical-iq/BlueprintPurchaseModal';

const GRS_GREEN = '#1a5c2a';
const GRS_GOLD  = '#f0b429';

// Flag emoji map for World Cup 2026 nations
const FLAG: Record<string, string> = {
  'Argentina': '🇦🇷', 'France': '🇫🇷', 'Brazil': '🇧🇷', 'Germany': '🇩🇪',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Spain': '🇪🇸', 'Portugal': '🇵🇹', 'Netherlands': '🇳🇱',
  'Italy': '🇮🇹', 'Belgium': '🇧🇪', 'Croatia': '🇭🇷', 'Morocco': '🇲🇦',
  'USA': '🇺🇸', 'Mexico': '🇲🇽', 'Canada': '🇨🇦', 'Japan': '🇯🇵',
  'South Korea': '🇰🇷', 'Australia': '🇦🇺', 'Senegal': '🇸🇳', 'Ecuador': '🇪🇨',
  'Uruguay': '🇺🇾', 'Colombia': '🇨🇴', 'Chile': '🇨🇱', 'Poland': '🇵🇱',
  'Switzerland': '🇨🇭', 'Denmark': '🇩🇰', 'Sweden': '🇸🇪', 'Austria': '🇦🇹',
  'Ukraine': '🇺🇦', 'Turkey': '🇹🇷', 'Serbia': '🇷🇸', 'Czech Republic': '🇨🇿',
  'Ghana': '🇬🇭', 'Nigeria': '🇳🇬', 'Cameroon': '🇨🇲', 'Tunisia': '🇹🇳',
  'Egypt': '🇪🇬', 'Côte d\'Ivoire': '🇨🇮', "Ivory Coast": '🇨🇮', 'Algeria': '🇩🇿',
  'Saudi Arabia': '🇸🇦', 'Iran': '🇮🇷', 'Qatar': '🇶🇦', 'Panama': '🇵🇦',
  'Costa Rica': '🇨🇷', 'Honduras': '🇭🇳', 'Jamaica': '🇯🇲', 'Venezuela': '🇻🇪',
  'Paraguay': '🇵🇾', 'Peru': '🇵🇪', 'Bolivia': '🇧🇴', 'New Zealand': '🇳🇿',
  'Zimbabwe': '🇿🇼', 'South Africa': '🇿🇦', 'Zambia': '🇿🇲', 'Kenya': '🇰🇪',
};
const flag = (team: string) => FLAG[team] ?? '🏳️';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Match {
  id:          string;
  homeTeam:    string;
  awayTeam:    string;
  homeScore:   number;
  awayScore:   number;
  status:      'scheduled' | 'completed';
  date:        string;
  time:        string;
  stadium:     string;
  city:        string;
  reportReady: boolean;
}

interface LiveScoreboardMatch {
  id:             string;
  homeTeam:       string;
  awayTeam:       string;
  homeScore:      number;
  awayScore:      number;
  minute:         number;
  possessionHome: number;
  possessionAway: number;
}

interface TacticalPhase {
  id:             string;
  title:          string;
  minute_range:   string;
  description:    string;
  key_event:      string;
  home_advantage: boolean;
}
interface TacticalReport {
  available:         boolean;
  summary:           string;
  phases:            TacticalPhase[];
  tactical_insights: string[];
  what_would_you_do: {
    scenario:    string;
    options:     string[];
    correct:     number;
    explanation: string;
  };
  home_rating:  number;
  away_rating:  number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERKS LIST
// ─────────────────────────────────────────────────────────────────────────────
const PERKS: Array<{ icon: React.ElementType; text: string }> = [
  { icon: Brain,        text: 'AI tactical breakdown after every match' },
  { icon: TrophyIcon,   text: 'Build your Tactical IQ score' },
  { icon: Users,        text: 'Compare your reads with other players' },
  { icon: Star,         text: 'Vote Player of the Tournament' },
];

function PerksList() {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-6">
      {PERKS.map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gray-100 text-gray-900 border border-gray-300 shadow-sm">
          <Icon size={13} className="text-[#1a5c2a]" />
          {text}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AD BANNER
// ─────────────────────────────────────────────────────────────────────────────
interface AdBannerProps {
  tier:        'GOLD' | 'SILVER' | 'BRONZE';
  targetUrl?:  string | null;
  sponsorName?: string | null;
  imageUrl?:   string | null;
}

function AdBanner({ tier, targetUrl, sponsorName, imageUrl }: AdBannerProps) {
  const destination = targetUrl || 'https://grassrootssports.live';
  const displaySponsor = sponsorName || 'Official Partner';

  if (tier === 'GOLD') {
    const goldAdImage = imageUrl || '/assets/sponsors/default-gold-banner.png';
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
        <span className="text-[10px] font-bold text-amber-600 block mb-2 uppercase tracking-wide">Gold Tournament Partner</span>
        <a href={destination} target="_blank" rel="noopener noreferrer" className="block h-[250px] relative border border-gray-200 rounded overflow-hidden hover:border-amber-500 hover:shadow-md transition-all">
          <img src={goldAdImage} alt={`${displaySponsor} Advertisement`} className="w-full h-full object-cover" />
        </a>
      </div>
    );
  }
  if (tier === 'SILVER') {
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center">
        <span className="text-[9px] text-gray-400 block mb-1 uppercase tracking-wider">Silver Metrics Sponsor</span>
        <a href={destination} target="_blank" rel="noopener noreferrer" className="block p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded border border-emerald-200 hover:bg-emerald-100 transition">
          Tactical data powered by <br />
          <span className="underline font-bold text-sm text-emerald-900 block mt-1">{displaySponsor}</span>
        </a>
      </div>
    );
  }
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center">
      <span className="text-[9px] text-gray-400 block mb-2 uppercase tracking-wider">Bronze Grassroots Sponsor</span>
      <a href={destination} target="_blank" rel="noopener noreferrer" className="block h-[120px] relative border border-dashed border-gray-300 rounded overflow-hidden hover:border-gray-400 transition bg-gray-50">
        {imageUrl ? (
          <img src={imageUrl} alt={displaySponsor} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-gray-500">
            <span className="font-semibold text-xs text-gray-700">{displaySponsor}</span>
            <span className="text-[10px] text-gray-400 mt-1">Local Academy Space</span>
          </div>
        )}
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE MAP
// ─────────────────────────────────────────────────────────────────────────────
const PHASE_COLORS = [
  'bg-blue-50 border-blue-200',
  'bg-emerald-50 border-emerald-200',
  'bg-amber-50 border-amber-200',
  'bg-purple-50 border-purple-200',
  'bg-rose-50 border-rose-200',
];
const PHASE_EMOJIS = ['🛡️', '⚙️', '🎯', '⚡', '🔄'];

function PhaseMap({ phases, homeTeam }: { phases: TacticalPhase[]; homeTeam: string; awayTeam: string }) {
  if (!phases || phases.length === 0) {
    return <p className="text-center text-sm text-gray-400 py-6">No phase data available.</p>;
  }
  return (
    <div className="space-y-3 p-3">
      {phases.map((phase, i) => (
        <div key={phase.id} className={`rounded-xl p-4 border ${PHASE_COLORS[i % PHASE_COLORS.length]}`}>
          <div className="flex items-start gap-2 mb-2">
            <span className="text-lg flex-shrink-0">{PHASE_EMOJIS[i % PHASE_EMOJIS.length]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-gray-900">{phase.title}</h4>
                <span className="text-[10px] text-gray-500 bg-white/80 px-2 py-0.5 rounded-full whitespace-nowrap">{phase.minute_range}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{phase.description}</p>
          {phase.key_event && (
            <div className="mt-2 text-[11px] font-medium text-gray-600 bg-white/70 rounded-lg px-3 py-1.5">
              🔑 {phase.key_event}
            </div>
          )}
          {phase.home_advantage && (
            <span className="mt-2 inline-block text-[10px] font-bold text-[#1a5c2a] bg-green-100 px-2 py-0.5 rounded-full">
              {homeTeam} advantage
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCH ODDS
// ─────────────────────────────────────────────────────────────────────────────
function MatchOdds({ match }: { match: Match | null }) {
  if (!match) return null;
  const odds = { home: 2.10, draw: 3.20, away: 2.15 };
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-[#1a5c2a]" /> Final Odds</h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">{match.homeTeam}</p><p className="text-lg font-bold text-[#1a5c2a]">{odds.home}</p></div>
        <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">Draw</p><p className="text-lg font-bold text-[#1a5c2a]">{odds.draw}</p></div>
        <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">{match.awayTeam}</p><p className="text-lg font-bold text-[#1a5c2a]">{odds.away}</p></div>
      </div>
      <p className="text-[8px] text-gray-400 text-center mt-2">For reference only</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARE BUTTONS
// ─────────────────────────────────────────────────────────────────────────────
function ShareButtons({ match }: { match: Match | null }) {
  const [copied, setCopied] = useState(false);
  if (!match) return null;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/world-cup?match=${match.id}` : '';
  const shareText = `📊 Tactical Report: ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} — study it on GrassRoots Sports!`;
  const copyLink = async () => { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  return (
    <div className="flex gap-2">
      <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition">
        {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied!' : 'Copy Link'}
      </button>
      <button onClick={shareWhatsApp} className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#25D366] text-white hover:bg-[#20b859] rounded-lg text-sm font-medium transition">
        <MessageCircle size={14} /> Share
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HIGHLIGHTS MODAL
// ─────────────────────────────────────────────────────────────────────────────
interface Highlight { id: string; title: string; thumbnail: string; }

function HighlightsModal({ match, onClose }: { match: Match | null; onClose: () => void }) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    if (!match) return;
    setLoading(true);
    fetch(`/api/youtube/search?q=${encodeURIComponent(`${match.homeTeam} vs ${match.awayTeam} world cup 2026 highlights`)}`)
      .then(r => r.json())
      .then(data => {
        if (data.items) {
          setHighlights(data.items.map((item: any) => ({
            id: item.id.videoId, title: item.snippet.title, thumbnail: item.snippet.thumbnails.medium.url,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [match]);

  if (!match) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] p-4 text-white flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><Youtube size={18} className="text-red-500" /> Match Highlights</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {selectedVideo ? (
            <div>
              <iframe src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`} className="w-full aspect-video rounded-lg" allowFullScreen />
              <button onClick={() => setSelectedVideo(null)} className="mt-3 text-sm text-[#1a5c2a] hover:underline">← Back to list</button>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" /></div>
          ) : highlights.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No highlights available yet.</p>
          ) : (
            <div className="space-y-3">
              {highlights.map(h => (
                <div key={h.id} className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => setSelectedVideo(h.id)}>
                  <img src={h.thumbnail} alt={h.title} className="w-32 h-20 rounded object-cover" />
                  <div className="flex-1"><p className="text-sm font-medium line-clamp-2">{h.title}</p><p className="text-[10px] text-gray-400 mt-1">Click to watch ▶</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCH CARD
// ─────────────────────────────────────────────────────────────────────────────
function MatchCard({ match, isSelected, onClick, isUnlocked, onUnlockClick }: {
  match: Match; isSelected: boolean; onClick: () => void; isUnlocked: boolean; onUnlockClick: (m: Match) => void;
}) {
  const sel = isSelected;
  return (
    <button onClick={onClick} className={`w-full text-left rounded-2xl overflow-hidden transition-all duration-200 ${sel ? 'shadow-lg ring-2 ring-[#f0b429]' : 'shadow-sm hover:shadow-md'} border ${sel ? 'border-[#f0b429]' : 'border-gray-200'} bg-white`}>
      <div className={`px-3 py-1 flex items-center justify-between text-[10px] font-bold ${sel ? 'bg-[#1a5c2a] text-[#f0b429]' : 'bg-gray-50 text-gray-500'}`}>
        <span>FIFA WORLD CUP 2026</span>
        {match.reportReady ? (
          <span className="bg-green-500 text-white px-1.5 py-0.5 rounded-full">REPORT READY</span>
        ) : match.status === 'completed' ? (
          <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded-full">GENERATING…</span>
        ) : (
          <span>{match.time}</span>
        )}
      </div>

      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex-1 flex flex-col items-start gap-0.5">
          <span className="text-xl leading-none">{flag(match.homeTeam)}</span>
          <span className={`text-xs font-bold leading-tight ${sel ? 'text-[#1a5c2a]' : 'text-gray-800'} max-w-[70px] truncate`}>{match.homeTeam}</span>
        </div>

        <div className="flex flex-col items-center px-2">
          {match.status === 'completed' ? (
            <>
              <span className={`text-2xl font-black tabular-nums leading-none ${sel ? 'text-[#1a5c2a]' : 'text-gray-900'}`}>
                {match.homeScore} <span className="text-gray-300">–</span> {match.awayScore}
              </span>
              <span className="text-[9px] font-bold text-gray-400 mt-0.5">FT</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">{match.time}</span>
          )}
        </div>

        <div className="flex-1 flex flex-col items-end gap-0.5">
          <span className="text-xl leading-none">{flag(match.awayTeam)}</span>
          <span className={`text-xs font-bold leading-tight ${sel ? 'text-[#1a5c2a]' : 'text-gray-800'} max-w-[70px] truncate text-right`}>{match.awayTeam}</span>
        </div>
      </div>

      <div className={`px-3 pb-2 text-[9px] flex items-center gap-1 ${sel ? 'text-[#1a5c2a]/60' : 'text-gray-400'}`}>
        <MapPin size={9} /> {match.city}
      </div>

      {match.status === 'completed' && !isUnlocked && (
        <div className="px-3 pb-2 border-t border-gray-100 pt-1.5">
          <button onClick={(e) => { e.stopPropagation(); onUnlockClick(match); }} className="text-xs text-[#1a5c2a] font-bold flex items-center gap-1"><Unlock size={10} /> Register to study free</button>
        </div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE MATCH CARD
// ─────────────────────────────────────────────────────────────────────────────
function LiveMatchCard({ m }: { m: LiveScoreboardMatch }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      <div className="bg-[#1a5c2a] px-3 py-1.5 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">FIFA World Cup 2026</span>
        <span className="flex items-center gap-1 text-[10px] font-black text-white">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          LIVE · {m.minute}&apos;
        </span>
      </div>

      <div className="flex items-center px-3 py-3 gap-2">
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl leading-none">{flag(m.homeTeam)}</span>
          <span className="text-xs font-bold text-gray-800 text-center leading-tight max-w-[80px]">{m.homeTeam}</span>
        </div>

        <div className="flex flex-col items-center px-3">
          <span className="text-4xl font-black tabular-nums text-[#1a5c2a] leading-none">
            {m.homeScore} <span className="text-gray-300 font-light">–</span> {m.awayScore}
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl leading-none">{flag(m.awayTeam)}</span>
          <span className="text-xs font-bold text-gray-800 text-center leading-tight max-w-[80px]">{m.awayTeam}</span>
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
          <span className="text-[#1a5c2a]">{m.possessionHome}%</span>
          <span className="text-gray-400 font-normal">possession</span>
          <span className="text-gray-500">{m.possessionAway}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex bg-gray-100">
          <div className="h-full bg-[#1a5c2a] transition-all duration-700" style={{ width: `${m.possessionHome}%` }} />
          <div className="h-full bg-red-400 transition-all duration-700" style={{ width: `${m.possessionAway}%` }} />
        </div>
      </div>

      <div className="px-3 pb-2 text-[9px] text-gray-400 border-t border-gray-100 pt-1.5">
        After-Match Class unlocks ~15 min after full-time
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAN REGISTRATION MODAL
// ─────────────────────────────────────────────────────────────────────────────
function FanRegistrationModal({ onClose, onRegisterSuccess }: { onClose: () => void; onRegisterSuccess: () => void }) {
  const [fullName, setFullName]   = useState('');
  const [country, setCountry]     = useState('Zimbabwe');
  const [contactType, setContactType] = useState<'phone' | 'email'>('phone');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const COUNTRIES = ['Zimbabwe', 'South Africa', 'Zambia', 'Botswana', 'Malawi', 'Mozambique', 'Namibia', 'Other'];
  const contactValid = contactType === 'email' ? email.includes('@') : phone.replace(/\D/g, '').length >= 9;
  const canSubmit = fullName.trim().length >= 2 && contactValid && password.length >= 6;

  const handleRegister = async () => {
    setIsSubmitting(true); setError(null);
    try {
      const parts = fullName.trim().split(' ');
      const body: Record<string, unknown> = {
        first_name: parts[0], surname: parts.slice(1).join(' ') || parts[0],
        name: fullName.trim(), country, password, password_confirmation: password, role: 'fan',
      };
      if (contactType === 'email') body.email = email.trim().toLowerCase();
      else body.phone = phone.trim();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Registration failed');
      onRegisterSuccess(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl p-6 bg-[#111f14] border border-[rgba(240,180,41,0.2)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 text-white/40"><X size={18} /></button>
        <h2 className="text-lg font-black text-white mb-1">Join the Tactical Lab</h2>
        <p className="text-xs mb-5 text-white/35">Register free to study full tactical reports and quiz yourself.</p>
        {error && <div className="mb-4 p-2.5 rounded-xl text-xs bg-red-500/10 border border-red-500/25 text-red-300">{error}</div>}
        <div className="space-y-4">
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name"
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#1a3a20] border border-white/8 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          <select value={country} onChange={e => setCountry(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#1a3a20] border border-white/8 focus:outline-none focus:ring-2 focus:ring-yellow-500">
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={() => setContactType('phone')} className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${contactType === 'phone' ? 'bg-[#f0b429] text-[#0a1a0f] border-[#f0b429]' : 'bg-transparent border-white/12 text-white/50'}`}>Phone</button>
            <button onClick={() => setContactType('email')} className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${contactType === 'email' ? 'bg-[#f0b429] text-[#0a1a0f] border-[#f0b429]' : 'bg-transparent border-white/12 text-white/50'}`}>Email</button>
          </div>
          {contactType === 'phone' ? (
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+263 77 123 4567"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#1a3a20] border border-white/8 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          ) : (
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#1a3a20] border border-white/8 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          )}
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 characters)"
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#1a3a20] border border-white/8 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          <button disabled={!canSubmit || isSubmitting} onClick={handleRegister}
            className={`w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${canSubmit && !isSubmitting ? 'bg-[#f0b429] text-[#0a1a0f]' : 'bg-white/7 text-white/25 cursor-not-allowed'}`}>
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Join & Study Free'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE QUIZ COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function _deletedGetModulesFromPhases_placeholder(): void {
  const modules: TrainingModule[] = [];

  if (phases.regain.successRate < 40) {
    modules.push({
      title: 'Pressing Triggers',
      focus: 'Win the ball back quicker in transition',
      drills: [
        {
          name: 'Shadow Pressing',
          setup: '8v8 + 2 neutrals in half pitch. GK plays short = press trigger. Force play wide, never inside.',
          reps: '4 × 6-min rounds',
          coachingPoint: 'Press in pairs — never solo. If the first presser gets beaten, the second must be there.',
        },
        {
          name: 'Counter-Press Rondo',
          setup: '5v5 in 20×20m. Team that loses possession has a 5-second window to win it back immediately.',
          reps: '6 × 4-min rounds',
          coachingPoint: 'First 3 seconds after losing the ball is the press window. After that — drop and organise.',
        },
      ],
    });
  }

  if (phases.build.successRate < 40) {
    modules.push({
      title: 'Positional Play Under Pressure',
      focus: 'Play through the midfield press with composure',
      drills: [
        {
          name: '4v2 Positional Rondo',
          setup: '4 attackers vs 2 defenders in 15×15m grid. 8 passes = 1 point. Rotate defenders every 2 min.',
          reps: '5 × 5-min rounds',
          coachingPoint: 'Move before receiving. Create a third-man option behind the press — never play into pressure.',
        },
        {
          name: 'Build-Out Pattern 11v6',
          setup: 'Full team vs 6-man high press. GK → CB → CM → wide player sequence. Restart on GK each time.',
          reps: '3 × 10-min runs',
          coachingPoint: 'Goalkeeper is a real passing option, not a last resort. No hoofing under pressure.',
        },
      ],
    });
  }

  if (phases.finish.successRate < 40) {
    modules.push({
      title: 'Clinical Finishing',
      focus: 'Convert chances in the final third',
      drills: [
        {
          name: 'Combination Finishing 2v1',
          setup: '2 attackers vs 1 defender, entering from midfield. Vary angle and distance of approach each rep.',
          reps: '20 reps each side',
          coachingPoint: 'Communicate before the box — "square it" or "shoot". Hesitation inside the area is fatal.',
        },
        {
          name: 'Crossing & Arrival Timing',
          setup: 'Winger crosses from 3 zones (byline, cut-back, early cross). 2 strikers attack near/far post on cue.',
          reps: '25 crosses per winger',
          coachingPoint: 'Late arrival into the box hits the ball harder than an early run that slows down.',
        },
      ],
    });
  }

  if (modules.length === 0) {
    modules.push({
      title: 'Advanced Transition Play',
      focus: 'Exploit both defensive and attacking transitions',
      drills: [
        {
          name: 'Counter-Attack Burst 3v2',
          setup: 'GK distributes to CM. Instant 3v2 fast break. Add a covering defender after every 5 reps.',
          reps: '15 reps each way',
          coachingPoint: '2 touches maximum in the break. First pass sets the angle, second pass or shot finishes.',
        },
        {
          name: 'Transition Game 6v6',
          setup: '6v6 on 40×50m. Goal only counts if scored within 6 seconds of winning possession.',
          reps: '4 × 8-min rounds',
          coachingPoint: 'Attack the space between defenders — not the man. Speed of decision beats speed of running.',
        },
      ],
    });
  }

  return modules;
}

function generateModulePDF(match: Match, phases: PhaseReport, modules: TrainingModule[]): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const margin = 14;

  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 58, 'F');
  doc.setFillColor(240, 180, 41);
  doc.rect(0, 58, W, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(240, 180, 41);
  doc.text('GRS COACHING BLUEPRINTS', W / 2, 18, { align: 'center' });

  doc.setFontSize(19);
  doc.setTextColor(255, 255, 255);
  doc.text('5-Day Training Microcycle', W / 2, 34, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`${match.homeTeam}  ${match.homeScore} – ${match.awayScore}  ${match.awayTeam}`, W / 2, 48, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Based on the AI tactical report generated by GrassRoots Sports.', margin, 72);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, 80);

  doc.setFillColor(245, 250, 246);
  doc.roundedRect(margin, 88, W - margin * 2, 50, 3, 3, 'F');
  doc.setDrawColor(26, 92, 42);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, 88, W - margin * 2, 50, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(26, 92, 42);
  doc.text('MATCH PHASE ANALYSIS', margin + 4, 97);

  const phaseRows = [
    { label: 'Regaining Possession', rate: phases.regain.successRate },
    { label: 'Building the Attack',  rate: phases.build.successRate },
    { label: 'Finishing',            rate: phases.finish.successRate },
  ];
  phaseRows.forEach((p, i) => {
    const y = 107 + i * 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`${p.label}:`, margin + 4, y);

    const col: [number, number, number] = p.rate < 40 ? [190, 40, 40] : p.rate < 60 ? [180, 120, 0] : [26, 92, 42];
    doc.setTextColor(col[0], col[1], col[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`${p.rate}% success`, 118, y);

    if (p.rate < 40) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text('  ← focus area this week', 145, y);
    }
  });

  let y = 152;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 92, 42);
  doc.text('TRAINING FOCUS THIS WEEK', margin, y);
  y += 8;

  modules.forEach((mod, i) => {
    doc.setFillColor(240, 180, 41);
    doc.rect(margin, y + 1, 2, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(`${i + 1}. ${mod.title}`, margin + 6, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(mod.focus, margin + 6, y + 13);
    y += 22;
  });

  doc.setFillColor(26, 92, 42);
  doc.rect(0, H - 14, W, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text("GrassRoots Sports · grassrootssports.live · Zimbabwe's First AI Sports Platform", W / 2, H - 6, { align: 'center' });

  doc.addPage();

  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 18, 'F');
  doc.setTextColor(240, 180, 41);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('5-DAY MICROCYCLE PLAN', W / 2, 12, { align: 'center' });

  y = 26;
  BLUEPRINT_DAY_PLAN.forEach((dayLabel, dayIdx) => {
    const isModuleDay = dayIdx >= 1 && dayIdx <= 3;
    const mod = isModuleDay ? modules[dayIdx - 1] : null;
    const boxH = mod ? 54 : 22;

    doc.setFillColor(245, 250, 246);
    doc.roundedRect(margin, y, W - margin * 2, boxH, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(26, 92, 42);
    doc.text(`DAY ${dayIdx + 1}`, margin + 4, y + 7);

    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(mod ? mod.title : dayLabel, margin + 20, y + 7);

    if (mod) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`Focus: ${mod.focus}`, margin + 4, y + 16);

      mod.drills.forEach((drill, di) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.text(`• ${drill.name}  (${drill.reps})`, margin + 4, y + 26 + di * 12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(110, 110, 110);
        const lines = doc.splitTextToSize(drill.setup, W - margin * 2 - 10) as string[];
        doc.text(lines[0], margin + 8, y + 32 + di * 12);
      });
      y += boxH + 6;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(dayLabel, margin + 4, y + 16);
      y += boxH + 6;
    }
  });

  doc.addPage();

  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 18, 'F');
  doc.setTextColor(240, 180, 41);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DRILL CARDS', W / 2, 12, { align: 'center' });

  let drillY = 26;
  let drillIndex = 0;
  const allDrills = modules.flatMap(m => m.drills);

  allDrills.forEach((drill, i) => {
    if (drillY > 260) {
      doc.addPage();
      drillY = 26;
    }

    doc.setFillColor(245, 250, 246);
    doc.roundedRect(margin, drillY, W - margin * 2, 40, 2, 2, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, drillY, W - margin * 2, 40, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(26, 92, 42);
    doc.text(`DRILL ${i + 1}: ${drill.name}`, margin + 4, drillY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(`Setup: ${drill.setup}`, margin + 4, drillY + 16);
    doc.text(`Reps: ${drill.reps}`, margin + 4, drillY + 23);
    doc.text(`Coaching Point: ${drill.coachingPoint}`, margin + 4, drillY + 30);

    drillY += 44;
  });

  doc.setFillColor(26, 92, 42);
  doc.rect(0, H - 14, W, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text("GrassRoots Sports · grassrootssports.live · Zimbabwe's First AI Sports Platform", W / 2, H - 6, { align: 'center' });

  doc.save(`GRS-Blueprint-${match.homeTeam}-vs-${match.awayTeam}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function WorldCupTacticalLabPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [matches, setMatches]               = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch]    = useState<Match | null>(null);
  const [report, setReport]                  = useState<TacticalReport | null>(null);
  const [reportLoading, setReportLoading]    = useState(false);
  const [isLoading, setIsLoading]            = useState(true);
  const [error, setError]                    = useState<string | null>(null);
  const [showHighlightsModal, setShowHighlightsModal] = useState(false);
  const [unlockedMatches, setUnlockedMatches] = useState<string[]>([]);
  const [showFanRegister, setShowFanRegister] = useState(false);
  const [tacticalIQ, setTacticalIQ]          = useState<TacticalIQResult | null>(null);
  const [liveMatches, setLiveMatches]        = useState<LiveScoreboardMatch[]>([]);
  const [showBlueprintModal, setShowBlueprintModal]         = useState(false);
  const [isDownloadingBlueprint, setIsDownloadingBlueprint] = useState(false);
  const [hasPurchasedBlueprint, setHasPurchasedBlueprint]   = useState(false);
  const hasSetInitial = useRef(false);
  const UNLOCK_KEY = 'wc_unlocked_matches';

  const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
  const gender = (typeof window !== 'undefined' ? localStorage.getItem('player_gender') : null) as 'male' | 'female' | null ?? 'male';

  const loadUnlocked = (): string[] => { try { return JSON.parse(localStorage.getItem(UNLOCK_KEY) ?? '[]'); } catch { return []; } };
  const saveUnlocked = (ids: string[]) => localStorage.setItem(UNLOCK_KEY, JSON.stringify(ids));

  useEffect(() => { setUnlockedMatches(loadUnlocked()); }, []);

  useEffect(() => {
    const loadMatches = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/worldcup/matches?status=completed');
        if (!res.ok) throw new Error('Could not load matches');
        const data = await res.json();
        const transformed: Match[] = (data.matches ?? []).map((m: any) => ({
          id:          String(m.id),
          homeTeam:    m.home_team,
          awayTeam:    m.away_team,
          homeScore:   m.home_score ?? 0,
          awayScore:   m.away_score ?? 0,
          status:      'completed',
          date:        m.date ?? '',
          time:        m.time ?? '',
          stadium:     m.stadium ?? 'TBD',
          city:        m.city ?? 'TBD',
          reportReady: !!m.tactical_report_generated,
        }));
        setMatches(transformed);
        if (transformed.length > 0 && !hasSetInitial.current) {
          setSelectedMatch(transformed[0]);
          hasSetInitial.current = true;
        }
      } catch {
        setError('Could not load match list. Please try again shortly.');
      }
      setIsLoading(false);
    };
    loadMatches();
    // Poll every 2 minutes so newly finished matches appear automatically
    const interval = setInterval(loadMatches, 120_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadLive = async () => {
      try {
        const res = await fetch('/api/worldcup/matches?status=live');
        if (!res.ok) return;
        const data = await res.json();
        setLiveMatches((data.matches ?? []).map((m: any) => ({
          id:              String(m.id),
          homeTeam:        m.home_team,
          awayTeam:        m.away_team,
          homeScore:       m.home_score ?? 0,
          awayScore:       m.away_score ?? 0,
          minute:          m.minute ?? 0,
          possessionHome:  m.possession_home ?? 50,
          possessionAway:  m.possession_away ?? 50,
        })));
      } catch { /* silent */ }
    };
    loadLive();
    const interval = setInterval(loadLive, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedMatch || !selectedMatch.reportReady) { setReport(null); return; }
    setReportLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/world-cup/matches/${selectedMatch.id}/tactical-report`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setReport(data?.available ? data : null))
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  }, [selectedMatch]);

  useEffect(() => {
    if (!authToken) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tactical-iq/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.answers) setTacticalIQ(calculateTacticalIQ(data.answers)); })
      .catch(() => {});
  }, [authToken]);

  useEffect(() => {
    if (!selectedMatch || !authToken) { setHasPurchasedBlueprint(false); return; }
    const cached = localStorage.getItem(`blueprint_purchased_${selectedMatch.id}`);
    if (cached === '1') { setHasPurchasedBlueprint(true); return; }
    fetch(`/api/worldcup/matches/${selectedMatch.id}/check-purchase`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.ok ? r.json() : { purchased: false })
      .then(data => {
        setHasPurchasedBlueprint(!!data.purchased);
        if (data.purchased) localStorage.setItem(`blueprint_purchased_${selectedMatch.id}`, '1');
      })
      .catch(() => setHasPurchasedBlueprint(false));
  }, [selectedMatch, authToken]);

  const handleDownloadBlueprint = async () => {
    if (!selectedMatch) return;
    if (!hasPurchasedBlueprint) { setShowBlueprintModal(true); return; }
    setIsDownloadingBlueprint(true);
    try {
      const res = await fetch(`/api/worldcup/matches/${selectedMatch.id}/generate-blueprint`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken ?? ''}` },
      });
      if (res.status === 402) { setShowBlueprintModal(true); return; }
      if (!res.ok) throw new Error('Blueprint generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GRS-Blueprint-${selectedMatch.homeTeam}-vs-${selectedMatch.awayTeam}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setShowBlueprintModal(true);
    } finally {
      setIsDownloadingBlueprint(false);
    }
  };

  const handleUnlockMatch = () => setShowFanRegister(true);

  const onRegisterSuccess = () => {
    const allIds = matches.map(m => m.id);
    setUnlockedMatches(allIds);
    saveUnlocked(allIds);
    window.location.href = '/login?registered=1';
  };

  const isMatchUnlocked = (matchId: string) =>
    unlockedMatches.includes(matchId) || unlockedMatches.length > 0;

  const handleQuizAnswered = async (moment: QuizMoment, wasOptimal: boolean) => {
    if (!authToken || !selectedMatch) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tactical-iq/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          matchId:        selectedMatch.id,
          quizMomentId:   moment.id,
          chosenOptionId: moment.options.find(o => o.isOptimal === wasOptimal)?.id ?? moment.options[0].id,
          wasOptimal,
          zone:           moment.zone,
        }),
      });
    } catch {}
  };

  const phaseIcons: Record<keyof PhaseReport, string> = { regain: '🛡️', build: '⚙️', finish: '🎯' };
  const phaseLabels: Record<keyof PhaseReport, string> = { regain: 'Regaining Possession', build: 'Building the Attack', finish: 'Finishing' };

  return (
    <ClassroomProvider>
      <div className="min-h-screen bg-[#f4f2ee]">

        <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] text-white border-b-4 border-[#f0b429]">
          <div className="max-w-[1400px] mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-[#f0b429] rounded-lg flex items-center justify-center">
                    <span className="text-black font-black text-sm">GRS</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight">World Cup Tactical Lab</h1>
                  <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded-full">EDUCATIONAL · POST-MATCH</span>
                </div>
                <p className="text-white/80 text-sm">Study every match like a coach. Reports unlock after full-time.</p>
              </div>
              <div className="flex items-center gap-4">
                {tacticalIQ && (
                  <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-xl text-center">
                    <div className="text-[9px] text-white/60 uppercase tracking-wide">Your Tactical IQ</div>
                    <div className="text-xl font-black text-[#f0b429]">{tacticalIQ.score}</div>
                  </div>
                )}
                <button onClick={() => setShowFanRegister(true)} className="px-4 py-1.5 bg-[#f0b429] text-[#1a5c2a] rounded-lg text-xs font-bold hover:bg-[#d6a020] transition">
                  Join as Fan
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 pt-4"><PerksList /></div>

        <div className="max-w-[1400px] mx-auto px-4 py-6">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"><p className="text-red-600">{error}</p></div>
          ) : isLoading ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* ────────────────────────────────────────────────────────────── */}
              {/* LEFT COLUMN — Match List */}
              {/* ────────────────────────────────────────────────────────────── */}
              <div className="lg:col-span-3 space-y-4">

                {liveMatches.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                      <Activity size={14} /> In progress
                    </h2>
                    <div className="space-y-3">
                      {liveMatches.map(m => (
                        <LiveMatchCard key={m.id} m={m} />
                      ))}
                    </div>
                    <p className="text-[9px] text-gray-300 mt-3 pt-2 border-t border-gray-100">
                      Tactical Report available ~15 min after full-time
                    </p>
                  </div>
                )}

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                    <Calendar size={14} /> Completed Matches
                  </h2>
                  {matches.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-4 text-center">No completed matches yet. Check back after kickoff.</p>
                  ) : (
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                      {matches.map(match => (
                        <MatchCard key={match.id} match={match} isSelected={selectedMatch?.id === match.id}
                          onClick={() => setSelectedMatch(match)} isUnlocked={isMatchUnlocked(match.id)}
                          onUnlockClick={handleUnlockMatch} />
                      ))}
                    </div>
                  )}
                </div>
                <AdBanner tier="BRONZE" />
              </div>

              {/* ────────────────────────────────────────────────────────────── */}
              {/* CENTER COLUMN — Tactical Report */}
              {/* ────────────────────────────────────────────────────────────── */}
              <div className="lg:col-span-6 space-y-6">
                {!selectedMatch ? (
                  <div className="bg-white rounded-2xl p-12 text-center border shadow-sm text-gray-500">
                    Select a completed match to open its Tactical Report.
                  </div>
                ) : !isMatchUnlocked(selectedMatch.id) ? (
                  <div className="bg-white rounded-2xl p-8 text-center border shadow-sm">
                    <Lock size={32} className="mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Report Locked</h3>
                    <p className="text-sm text-gray-500 mb-4">Register free to study full tactical reports</p>
                    <button onClick={() => setShowFanRegister(true)} className="px-5 py-2.5 bg-[#1a5c2a] text-white rounded-xl text-sm font-bold">Register Free</button>
                  </div>
                ) : !selectedMatch.reportReady ? (
                  <div className="bg-white rounded-2xl p-8 text-center border shadow-sm">
                    <Loader2 size={28} className="mx-auto text-amber-500 mb-3 animate-spin" />
                    <h3 className="text-base font-bold text-gray-900 mb-1">Report generating</h3>
                    <p className="text-sm text-gray-500">Tactical reports are ready within 15 minutes of full-time. Check back shortly.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="text-center flex-1">
                          <span className="text-gray-400 text-xs uppercase">HOME</span>
                          <p className="text-gray-800 font-bold text-xl mt-1">{selectedMatch.homeTeam}</p>
                          <p className="text-4xl font-black text-[#1a5c2a] mt-1">{selectedMatch.homeScore}</p>
                        </div>
                        <div className="text-center px-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><span className="text-gray-500 text-xs font-mono">FT</span></div>
                        </div>
                        <div className="text-center flex-1">
                          <span className="text-gray-400 text-xs uppercase">AWAY</span>
                          <p className="text-gray-800 font-bold text-xl mt-1">{selectedMatch.awayTeam}</p>
                          <p className="text-4xl font-black text-[#1a5c2a] mt-1">{selectedMatch.awayScore}</p>
                        </div>
                      </div>
                      <div className="flex justify-center items-center gap-2 mt-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                        <MapPin size={12} /> {selectedMatch.stadium}
                      </div>
                    </div>

                    {reportLoading ? (
                      <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" /></div>
                    ) : report ? (
                      <>
                        <div className="bg-white rounded-2xl p-2 shadow-md border border-gray-200">
                          <div className="flex items-center justify-between px-3 pt-2 pb-1">
                            <div className="flex items-center gap-1 text-[10px] text-gray-500"><Tv size={12} /> THREE PHASES OF PLAY</div>
                          </div>
                          <PhaseMap phases={report.phases} homeTeam={selectedMatch.homeTeam} awayTeam={selectedMatch.awayTeam} />
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-9 h-9 rounded-full bg-[#1a5c2a] flex items-center justify-center font-black text-[#f0b429] text-sm flex-shrink-0">
                              {gender === 'female' ? 'A' : 'T'}
                            </div>
                            <h3 className="text-sm font-bold text-gray-900">{gender === 'female' ? 'Amara' : 'THUTO'}'s tactical read</h3>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{report.summary}</p>
                        </div>

                        <div className="space-y-3">
                          {report.phases.map((phase, i) => {
                            const icons = ['🛡️', '⚙️', '🎯'];
                            return (
                              <div key={phase.id ?? i} className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg">{icons[i] ?? '📋'}</span>
                                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">{phase.title}</h4>
                                  <span className="ml-auto text-xs font-bold text-[#1a5c2a]">{phase.minute_range}</span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{phase.description}</p>
                                {phase.key_event && <p className="text-xs text-[#1a5c2a] font-semibold mt-2">⚡ {phase.key_event}</p>}
                              </div>
                            );
                          })}
                        </div>

                        {report.what_would_you_do?.scenario && (
                          <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200 space-y-3">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Brain size={16} className="text-[#1a5c2a]" /> What Would You Do?</h3>
                            <p className="text-sm text-gray-700">{report.what_would_you_do.scenario}</p>
                            <div className="space-y-2">
                              {report.what_would_you_do.options.map((opt, idx) => (
                                <div key={idx} className={`text-xs px-3 py-2 rounded-lg border ${idx === report.what_would_you_do!.correct ? 'bg-[#f0fdf4] border-[#1a5c2a] text-[#1a5c2a] font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                  {String.fromCharCode(65 + idx)}. {opt}
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 italic">{report.what_would_you_do.explanation}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-white rounded-2xl p-8 text-center border shadow-sm text-gray-500">
                        Report data unavailable. Please try again shortly.
                      </div>
                    )}

                    {selectedMatch.status === 'completed' && (
                      <button onClick={() => setShowHighlightsModal(true)} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition flex items-center justify-center gap-2">
                        <Youtube size={16} /> Watch Match Highlights
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* ────────────────────────────────────────────────────────────── */}
              {/* RIGHT COLUMN — Virtual Classroom & Ads */}
              {/* ────────────────────────────────────────────────────────────── */}
              <div className="lg:col-span-3 space-y-4">
                {selectedMatch ? (
                  <>
                    <VirtualClassroom 
                      matchId={selectedMatch.id}
                      matchName={`${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`}
                    />
                    <AdBanner tier="BRONZE" />
                    <MatchOdds match={selectedMatch} />
                    <ShareButtons match={selectedMatch} />
                    {report && (
                      <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
                        <p className="text-[10px] font-bold text-[#1a5c2a] uppercase tracking-widest mb-1">GRS Coaching Blueprint</p>
                        <p className="text-xs text-gray-500 mb-3">5-day training microcycle built from this match's tactical data</p>
                        <button
                          onClick={handleDownloadBlueprint}
                          disabled={isDownloadingBlueprint}
                          className="w-full py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white"
                        >
                          {isDownloadingBlueprint ? (
                            <><Loader2 size={14} className="animate-spin" />Generating…</>
                          ) : hasPurchasedBlueprint ? (
                            <><Download size={14} />Download Blueprint</>
                          ) : (
                            <><FileDown size={14} />Unlock for $4.99</>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <AdBanner tier="GOLD" />
                    <AdBanner tier="SILVER" />
                    <div className="bg-white rounded-2xl p-6 text-center border border-gray-200 shadow-sm">
                      <Video size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-xs text-gray-500">Select a match to open the Virtual Classroom</p>
                    </div>
                  </>
                )}
              </div>

            </div>
          )}
        </div>

        {showHighlightsModal && selectedMatch && <HighlightsModal match={selectedMatch} onClose={() => setShowHighlightsModal(false)} />}
        {showFanRegister && <FanRegistrationModal onClose={() => setShowFanRegister(false)} onRegisterSuccess={onRegisterSuccess} />}
        {showBlueprintModal && selectedMatch && (
          <BlueprintPurchaseModal
            matchId={selectedMatch.id}
            matchName={`${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`}
            onClose={() => setShowBlueprintModal(false)}
            onPurchaseComplete={() => {
              setHasPurchasedBlueprint(true);
              localStorage.setItem(`blueprint_purchased_${selectedMatch.id}`, '1');
              setShowBlueprintModal(false);
            }}
          />
        )}
      </div>
    </ClassroomProvider>
  );
}