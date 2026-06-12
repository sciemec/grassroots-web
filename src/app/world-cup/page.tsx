// src/app/world-cup/page.tsx
// Complete World Cup 2026 Hub - Live Scores, 2D Pitch, AI Commentary, Highlights, Payment Gateway

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Menu, ChevronDown, Radio, RefreshCw, MapPin, Calendar, 
  Tv, Activity, Volume2, MicOff, Settings, Lock, Youtube,
  Play, X, CheckCircle, Clock, MessageCircle, Trophy, Users,
  Flame, TrendingUp, Award, BookOpen
} from 'lucide-react';
import { VoiceSelector } from '@/components/VoiceSelector';
import { BackgroundAudio } from '@/components/BackgroundAudio';

// ============================================
// TYPES
// ============================================
interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'finished';
  minute: string;
  date: string;
  time: string;
  stadium: string;
  city: string;
}

interface Highlight {
  id: number;
  type: 'VERIFIED' | 'UNVERIFIED';
  title: string;
  url: string;
  embedUrl: string | null;
  imgUrl: string;
  channel: string;
}

// ============================================
// REAL DATA FETCHING
// ============================================
async function fetchLiveMatches(): Promise<Match[]> {
  try {
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa-world-cup/scoreboard', { next: { revalidate: 5 } });
    if (!res.ok) throw new Error(`ESPN error: ${res.status}`);
    const data = await res.json();
    if (!data.events || data.events.length === 0) return fetchScheduledMatches();
    return data.events.map((event: any) => {
      const home = event.competitions[0].competitors.find((c: any) => c.homeAway === 'home');
      const away = event.competitions[0].competitors.find((c: any) => c.homeAway === 'away');
      return {
        id: event.id,
        homeTeam: home?.team.displayName || '?',
        awayTeam: away?.team.displayName || '?',
        homeScore: parseInt(home?.score || '0'),
        awayScore: parseInt(away?.score || '0'),
        status: event.status.type.state === 'in' ? 'live' : event.status.type.state === 'post' ? 'finished' : 'scheduled',
        minute: event.competitions[0].status.type.shortDetail || '0\'',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stadium: event.competitions[0].venue?.fullName || 'TBD',
        city: event.competitions[0].venue?.city || 'TBD',
      };
    });
  } catch (error) {
    console.error('ESPN error:', error);
    return [];
  }
}

async function fetchScheduledMatches(): Promise<Match[]> {
  try {
    const res = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json');
    if (!res.ok) throw new Error('worldcup.json error');
    const data = await res.json();
    if (!data.matches) return [];
    const today = new Date().toISOString().split('T')[0];
    return data.matches
      .filter((m: any) => m.date >= today)
      .slice(0, 12)
      .map((m: any) => ({
        id: `${m.team1}-${m.team2}-${m.date}`,
        homeTeam: m.team1,
        awayTeam: m.team2,
        homeScore: 0,
        awayScore: 0,
        status: 'scheduled',
        minute: '0\'',
        date: m.date,
        time: m.time || 'TBD',
        stadium: m.ground || 'TBD',
        city: m.ground?.split(',')[1]?.trim() || 'TBD',
      }));
  } catch (error) {
    console.error('worldcup.json error:', error);
    return [];
  }
}

// ============================================
// 2D PITCH COMPONENT
// ============================================
function FootballPitch({ ballPosition, shots = [] }: { ballPosition?: { x: number; y: number }; shots?: Array<{ x: number; y: number; isGoal: boolean }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = 900;
  const height = 600;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1a5c2a');
    grad.addColorStop(0.5, '#0e4a1e');
    grad.addColorStop(1, '#0a3d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0a3d16';
    for (let i = 0; i < width; i += 40) ctx.fillRect(i, 0, 20, height);
    ctx.fillStyle = '#1a5c2a';
    for (let i = 20; i < width; i += 40) ctx.fillRect(i, 0, 20, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, width - 80, height - 80);
    ctx.beginPath();
    ctx.moveTo(width / 2, 40);
    ctx.lineTo(width / 2, height - 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 45, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.strokeRect(40, height / 2 - 90, 90, 180);
    ctx.strokeRect(width - 130, height / 2 - 90, 90, 180);

    ctx.fillStyle = '#ddd';
    ctx.fillRect(25, height / 2 - 40, 15, 80);
    ctx.fillRect(width - 40, height / 2 - 40, 15, 80);

    ctx.font = 'bold 24px "Inter", system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.textAlign = 'center';
    ctx.fillText("GRASSROOTS SPORTS", width / 2, height / 2 + 40);
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(240, 180, 41, 0.3)';
    ctx.fillText("grassrootssports.live", width / 2, height / 2 + 85);

    for (const shot of shots) {
      const x = 40 + (shot.x / 100) * (width - 80);
      const y = 40 + (shot.y / 100) * (height - 80);
      const radGrad = ctx.createRadialGradient(x, y, 5, x, y, 28);
      radGrad.addColorStop(0, shot.isGoal ? 'rgba(240, 180, 41, 0.9)' : 'rgba(239, 68, 68, 0.7)');
      radGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, 2 * Math.PI);
      ctx.fill();
    }

    if (ballPosition) {
      const x = 40 + (ballPosition.x / 100) * (width - 80);
      const y = 40 + (ballPosition.y / 100) * (height - 80);
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.stroke();
    }
  }, [ballPosition, shots]);

  return <canvas ref={canvasRef} width={width} height={height} className="w-full rounded-xl shadow-2xl" />;
}

// ============================================
// AI COMMENTARY COMPONENT
// ============================================
function AICommentary({ events, isLive, onVoiceChange, onRateChange, onPitchChange }: { 
  events: any[]; 
  isLive: boolean;
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
  onRateChange: (rate: number) => void;
  onPitchChange: (pitch: number) => void;
}) {
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [currentCommentary, setCurrentCommentary] = useState('Select a live match to start AI commentary');
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const processedEvents = useRef<Set<string>>(new Set());
  const queueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speakText = (text: string) => {
    if (!synthRef.current || !isSpeaking) return;
    if (isSpeakingRef.current) synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = 1;
    
    utterance.onstart = () => { isSpeakingRef.current = true; };
    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (queueRef.current.length > 0) speakText(queueRef.current.shift()!);
    };
    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    if (!isLive) return;
    const newEvents = events.filter(e => !processedEvents.current.has(e.id));
    for (const event of newEvents) {
      processedEvents.current.add(event.id);
      let commentary = '';
      switch (event.type) {
        case 'goal':
          commentary = `GOAL! ${event.player || 'A player'} scores for ${event.team}! What a strike!`;
          if (typeof window !== 'undefined' && (window as any).boostAudio) (window as any).boostAudio();
          break;
        case 'yellow_card': commentary = `Yellow card shown to ${event.player} of ${event.team}.`; break;
        case 'red_card': commentary = `RED CARD! ${event.player} is sent off!`; break;
        default: commentary = event.description || `${event.type} for ${event.team}.`;
      }
      setCurrentCommentary(commentary);
      if (isSpeaking) speakText(commentary);
    }
  }, [events, isLive, isSpeaking, selectedVoice, speechRate, speechPitch]);

  const handleVoiceChange = (voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
    onVoiceChange(voice);
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <h3 className="text-gray-900 font-bold text-sm uppercase flex items-center gap-1"><Radio size={12} className="text-[#f0b429]" />AI LIVE COMMENTARY</h3>
        </div>
        <div className="flex items-center gap-2">
          <VoiceSelector onVoiceChange={handleVoiceChange} currentVoice={selectedVoice} />
          <BackgroundAudio isLive={isLive} />
          <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
            <Settings size={14} className="text-gray-600" />
          </button>
          <button onClick={() => setIsSpeaking(!isSpeaking)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition ${isSpeaking ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-600'}`}>
            {isSpeaking ? <Volume2 size={12} /> : <MicOff size={12} />}
            {isSpeaking ? "ON" : "OFF"}
          </button>
        </div>
      </div>
      
      {showSettings && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
          <div><label className="text-[10px] text-gray-500">Speed: {speechRate}x</label><input type="range" min="0.5" max="1.5" step="0.05" value={speechRate} onChange={(e) => { setSpeechRate(parseFloat(e.target.value)); onRateChange(parseFloat(e.target.value)); }} className="w-full" /></div>
          <div><label className="text-[10px] text-gray-500">Pitch: {speechPitch}</label><input type="range" min="0.5" max="1.5" step="0.05" value={speechPitch} onChange={(e) => { setSpeechPitch(parseFloat(e.target.value)); onPitchChange(parseFloat(e.target.value)); }} className="w-full" /></div>
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-3 h-28 overflow-y-auto">
        <p className="text-sm text-gray-700 italic">"{currentCommentary}"</p>
      </div>
    </div>
  );
}

// ============================================
// HIGHLIGHTS COMPONENT
// ============================================
function MatchHighlights({ matchId }: { matchId: string }) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);

  useEffect(() => {
    if (!matchId) return;
    const fetchHighlights = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/highlights/${matchId}`);
        const data = await res.json();
        setHighlights(data);
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };
    fetchHighlights();
  }, [matchId]);

  if (isLoading) return <div className="bg-white rounded-xl p-4 animate-pulse"><div className="h-32 bg-gray-200 rounded" /></div>;
  if (highlights.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Youtube size={16} className="text-red-600" />Match Highlights <span className="text-[10px] text-gray-500">{highlights.length} clips</span></h3>
      </div>
      <div className="p-4">
        {highlights[0] && (
          <div onClick={() => setSelectedHighlight(highlights[0])} className="relative rounded-xl overflow-hidden cursor-pointer group mb-4">
            <img src={highlights[0].imgUrl} alt={highlights[0].title} className="w-full aspect-video object-cover group-hover:scale-105 transition" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center"><Play size={20} className="text-white ml-0.5" /></div></div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3"><p className="text-white text-sm font-medium truncate">{highlights[0].title}</p><div className="flex items-center gap-2 mt-1"><span className="text-[10px] text-white/70">{highlights[0].channel}</span>{highlights[0].type === 'VERIFIED' ? <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={8} /> Verified</span> : <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full"><Clock size={8} /> Live</span>}</div></div>
          </div>
        )}
        {highlights.length > 1 && (
          <div className="grid grid-cols-2 gap-3">
            {highlights.slice(1, 5).map(h => (
              <div key={h.id} onClick={() => setSelectedHighlight(h)} className="cursor-pointer group">
                <div className="relative rounded-lg overflow-hidden"><img src={h.imgUrl} alt={h.title} className="w-full aspect-video object-cover group-hover:scale-105 transition" /><div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100"><div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center"><Play size={14} className="text-white ml-0.5" /></div></div></div>
                <p className="text-[11px] font-medium text-gray-700 mt-1 line-clamp-2">{h.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedHighlight && selectedHighlight.embedUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedHighlight(null)}>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="relative pb-[56.25%]"><iframe src={selectedHighlight.embedUrl} className="absolute inset-0 w-full h-full rounded-xl" allowFullScreen /></div>
            <button onClick={() => setSelectedHighlight(null)} className="mt-4 w-full py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PAYMENT MODAL
// ============================================
function PaymentModal({ matchId, matchName, onClose, onSuccess }: { matchId: string; matchName: string; onClose: () => void; onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'match' | 'subscription'>('match');
  const pricing = { match: { price: 0.99, label: 'This Match Only' }, subscription: { price: 12, label: 'Full Tournament Pass' } };

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch('/api/payment/paynow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, matchId, purchaseType: selectedOption, amount: pricing[selectedOption].price, userEmail: user.email, userPhone: user.phone })
      });
      const data = await response.json();
      if (data.success && data.redirectUrl) window.location.href = data.redirectUrl;
    } catch (error) { alert('Payment failed'); } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] p-5 text-white flex justify-between items-center"><div><h2 className="text-lg font-bold">Unlock Live Commentary</h2><p className="text-white/70 text-sm">{matchName}</p></div><button onClick={onClose}><X size={20} /></button></div>
        <div className="p-5">
          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50"><input type="radio" name="pricing" checked={selectedOption === 'match'} onChange={() => setSelectedOption('match')} className="w-4 h-4 text-[#1a5c2a]" /><div className="flex-1"><div className="flex justify-between"><span className="font-bold">This Match Only</span><span className="text-xl font-black text-[#1a5c2a]">${pricing.match.price}</span></div></div></label>
            <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50"><input type="radio" name="pricing" checked={selectedOption === 'subscription'} onChange={() => setSelectedOption('subscription')} className="w-4 h-4 text-[#1a5c2a]" /><div className="flex-1"><div className="flex justify-between"><span className="font-bold">Full Tournament Pass</span><span className="text-xl font-black text-[#1a5c2a]">${pricing.subscription.price}</span></div><p className="text-xs text-gray-500">All 104 matches + highlights</p></div></label>
          </div>
          <button onClick={handlePayment} disabled={isLoading} className="w-full bg-[#1a5c2a] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">{isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Lock size={16} /> Pay with EcoCash / InnBucks / Card</>}</button>
          <p className="text-[9px] text-gray-400 text-center mt-4">Secure payment via Paynow. Supports EcoCash, InnBucks, OneMoney, Credit/Debit cards.</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MATCH CARD COMPONENT
// ============================================
function MatchCard({ match, isSelected, onClick }: { match: Match; isSelected: boolean; onClick: () => void }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${
        isSelected
          ? 'bg-[#1a5c2a] text-white shadow-lg border-l-4 border-[#f0b429]'
          : 'bg-white border border-gray-200 hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>{match.homeTeam}</span>
            {isLive && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">LIVE</span>}
            {isFinished && <span className="text-[9px] text-gray-400">FT</span>}
          </div>
          <div className={`text-sm mt-1 ${isSelected ? 'text-white/70' : 'text-gray-600'}`}>{match.awayTeam}</div>
        </div>
        <div className="text-right">
          {isLive || isFinished ? (
            <div className={`text-2xl font-black ${isSelected ? 'text-[#f0b429]' : 'text-[#1a5c2a]'}`}>{match.homeScore} - {match.awayScore}</div>
          ) : (
            <div className="text-sm text-gray-500">{match.time}</div>
          )}
          <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><MapPin size={10} /> {match.stadium}</div>
        </div>
      </div>
      {isLive && <div className="mt-2 text-[11px] text-yellow-600 font-mono">{match.minute} • Live now</div>}
    </button>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function WorldCupPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [ballPosition, setBallPosition] = useState({ x: 55, y: 50 });
  const [events, setEvents] = useState<any[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const loadData = async () => {
    try {
      const live = await fetchLiveMatches();
      let all = live.length ? live : await fetchScheduledMatches();
      setMatches(all);
      if (all.length && !selectedMatch) setSelectedMatch(all[0]);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) { setError('Unable to fetch live data'); } finally { setIsLoading(false); }
  };

  useEffect(() => { loadData(); const interval = setInterval(loadData, 30000); return () => clearInterval(interval); }, []);
  
  useEffect(() => {
    if (!selectedMatch || selectedMatch.status !== 'live') return;
    const interval = setInterval(() => { 
      setBallPosition(prev => ({ 
        x: Math.min(95, Math.max(5, prev.x + (Math.random() - 0.5) * 3)), 
        y: Math.min(95, Math.max(5, prev.y + (Math.random() - 0.5) * 2)) 
      })); 
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedMatch]);

  // Simulate events for demo (replace with real API)
  useEffect(() => {
    if (!selectedMatch || selectedMatch.status !== 'live') return;
    const eventInterval = setInterval(() => {
      const randomEvent = Math.random();
      if (randomEvent > 0.8) {
        const newEvent = {
          id: Date.now(),
          type: randomEvent > 0.95 ? 'goal' : 'shot',
          team: Math.random() > 0.5 ? selectedMatch.homeTeam : selectedMatch.awayTeam,
          player: ['Musona', 'Billiat', 'Nakamba', 'Hadebe'][Math.floor(Math.random() * 4)],
          minute: Math.floor(Math.random() * 90),
          onTarget: Math.random() > 0.5,
          description: `${['Shot on target', 'Shot wide', 'Foul', 'Corner'][Math.floor(Math.random() * 4)]}`
        };
        setEvents(prev => [...prev, newEvent]);
      }
    }, 15000);
    return () => clearInterval(eventInterval);
  }, [selectedMatch]);

  // Check access (mock - replace with real check)
  useEffect(() => {
    if (selectedMatch) {
      const purchased = localStorage.getItem(`wc_access_${selectedMatch.id}`);
      setHasAccess(!!purchased);
    }
  }, [selectedMatch]);

  const isLive = selectedMatch?.status === 'live';
  const liveCount = matches.filter(m => m.status === 'live').length;

  return (
    <div className="min-h-screen bg-[#f4f2ee]">
      {/* Header - GrassRoots Branded */}
      <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] text-white border-b-4 border-[#f0b429] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f0b429] rounded-lg flex items-center justify-center">
                <span className="text-black font-black text-sm">GRS</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">World Cup 2026</h1>
              <div className="flex items-center gap-1 ml-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-white/70">LIVE DATA</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 border border-white/20 bg-white/10 rounded-full px-3 py-1">
                <span className="text-sm">🇿🇼</span>
                <ChevronDown size={12} className="opacity-70" />
              </div>
              <button onClick={loadData} className="text-white/80 hover:text-white transition text-sm flex items-center gap-1 px-3 py-1 rounded-full hover:bg-white/10">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <p className="text-white/70 text-xs">USA · Canada · Mexico | 11 June – 19 July 2026</p>
            {lastUpdated && <span className="text-[8px] text-white/30">Updated: {lastUpdated.toLocaleTimeString()}</span>}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Live indicator */}
        {liveCount > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-gray-700">{liveCount} live matches now</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
            <p className="text-red-600">{error}</p>
            <button onClick={loadData} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Retry</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" /></div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
            <p className="text-gray-500">No matches found. The tournament starts June 11, 2026.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* LEFT: Match list */}
            <div className="lg:col-span-1 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-gray-700 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={14} /> MATCH SCHEDULE
                </h2>
                <span className="text-[9px] text-gray-500">{matches.length} matches</span>
              </div>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {matches.map(m => (
                  <MatchCard key={m.id} match={m} isSelected={selectedMatch?.id === m.id} onClick={() => setSelectedMatch(m)} />
                ))}
              </div>
            </div>

            {/* RIGHT: Live tracker */}
            <div className="lg:col-span-2 space-y-4">
              {!selectedMatch ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
                  <Radio size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Select a match to start live tracking</p>
                </div>
              ) : (
                <>
                  {/* Payment gate */}
                  {!hasAccess && (selectedMatch.status === 'live' || selectedMatch.status === 'finished') ? (
                    <div className="bg-white rounded-xl p-8 text-center border border-gray-200 shadow-sm">
                      <Lock size={40} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-700 font-medium mb-2">Unlock live commentary & 2D pitch</p>
                      <p className="text-sm text-gray-500 mb-4">Get real-time AI commentary and tactical view for this match</p>
                      <button onClick={() => setShowPayment(true)} className="px-6 py-2.5 bg-[#1a5c2a] text-white rounded-xl font-bold hover:bg-[#2a6e3a] transition">
                        Unlock for ${selectedMatch.status === 'live' ? '0.99' : '0.49'}
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Scoreboard */}
                      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="text-center flex-1">
                            <span className="text-gray-400 text-xs uppercase">HOME</span>
                            <p className="text-gray-800 font-bold text-xl mt-1">{selectedMatch.homeTeam}</p>
                            <p className="text-4xl font-black text-[#1a5c2a] mt-1">{selectedMatch.homeScore}</p>
                          </div>
                          <div className="text-center px-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-500 text-xs font-bold">VS</span>
                            </div>
                            <div className="mt-2 text-[11px] text-gray-500 font-mono">{isLive ? selectedMatch.minute : selectedMatch.time}</div>
                          </div>
                          <div className="text-center flex-1">
                            <span className="text-gray-400 text-xs uppercase">AWAY</span>
                            <p className="text-gray-800 font-bold text-xl mt-1">{selectedMatch.awayTeam}</p>
                            <p className="text-4xl font-black text-[#1a5c2a] mt-1">{selectedMatch.awayScore}</p>
                          </div>
                        </div>
                        <div className="flex justify-center items-center gap-2 mt-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                          <MapPin size={12} /> {selectedMatch.stadium}, {selectedMatch.city}
                        </div>
                      </div>

                      {/* 2D Pitch */}
                      <div className="bg-white rounded-xl p-2 shadow-md border border-gray-200">
                        <div className="flex justify-between items-center px-3 pt-2">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500"><Tv size={12} /> TACTICAL VIEW</div>
                          <div className="flex items-center gap-1 text-[9px] text-gray-400"><Activity size={10} /> live tracking</div>
                        </div>
                        <FootballPitch ballPosition={isLive ? ballPosition : undefined} />
                        <div className="text-center text-[8px] text-gray-400 pb-2">Ball position updates every 3–5 seconds</div>
                      </div>

                      {/* AI Commentary */}
                      <AICommentary events={events} isLive={isLive} onVoiceChange={() => {}} onRateChange={() => {}} onPitchChange={() => {}} />

                      {/* Highlights (finished matches only) */}
                      {selectedMatch.status === 'finished' && <MatchHighlights matchId={selectedMatch.id} />}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-[8px] text-gray-400 border-t border-gray-200 pt-4">
          Data: ESPN API • GrassRoots Sports AI • Live Commentary • Secure payments via Paynow
        </div>
      </main>

      {/* Floating WhatsApp */}
      <div className="fixed bottom-6 right-4 z-50">
        <a href="https://wa.me/263775285106" className="w-14 h-14 bg-[#25d366] text-white rounded-full shadow-xl flex flex-col items-center justify-center hover:scale-105 transition">
          <MessageCircle size={20} />
          <span className="text-[7px] font-black mt-0.5">WhatsApp</span>
        </a>
      </div>

      {/* Payment Modal */}
      {showPayment && selectedMatch && (
        <PaymentModal 
          matchId={selectedMatch.id} 
          matchName={`${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`} 
          onClose={() => setShowPayment(false)} 
          onSuccess={() => { 
            localStorage.setItem(`wc_access_${selectedMatch.id}`, 'true'); 
            setHasAccess(true); 
            setShowPayment(false); 
          }} 
        />
      )}
    </div>
  );
}