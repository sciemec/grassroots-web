// GrassRoots Sports branded World Cup page – matches the main site design
'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, Radio, Mic, MicOff, Volume2, VolumeX, Tv, Wifi, WifiOff, ChevronRight, RefreshCw, TrendingUp, Target, Activity, Languages, Zap } from 'lucide-react';

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

// ============================================
// REAL DATA FETCHING (ESPN API + worldcup.json)
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
// ENHANCED 2D PITCH with GrassRoots branding
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

    // 1. Grass gradient (using GrassRoots green)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1a5c2a');
    grad.addColorStop(0.5, '#0e4a1e');
    grad.addColorStop(1, '#0a3d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Grass stripes
    ctx.fillStyle = '#0a3d16';
    for (let i = 0; i < width; i += 40) ctx.fillRect(i, 0, 20, height);
    ctx.fillStyle = '#1a5c2a';
    for (let i = 20; i < width; i += 40) ctx.fillRect(i, 0, 20, height);

    // 3. Pitch lines
    ctx.shadowBlur = 0;
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

    // 4. Goals with 3D effect
    ctx.fillStyle = '#ddd';
    ctx.fillRect(25, height / 2 - 40, 15, 80);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(22, height / 2 - 42, 3, 84);
    ctx.fillRect(width - 40, height / 2 - 40, 15, 80);
    ctx.fillRect(width - 25, height / 2 - 42, 3, 84);

    // 5. Centre circle shadow
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 45, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fill();
    ctx.shadowBlur = 0;

    // 6. Heat map (shots)
    for (const shot of shots) {
      const x = 40 + (shot.x / 100) * (width - 80);
      const y = 40 + (shot.y / 100) * (height - 80);
      const radGrad = ctx.createRadialGradient(x, y, 5, x, y, 28);
      if (shot.isGoal) {
        radGrad.addColorStop(0, 'rgba(240, 180, 41, 0.9)');  // Gold for goals
        radGrad.addColorStop(0.6, 'rgba(240, 180, 41, 0.3)');
        radGrad.addColorStop(1, 'rgba(240, 180, 41, 0)');
      } else {
        radGrad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
        radGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.2)');
        radGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      }
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 7. Ball
    if (ballPosition) {
      const x = 40 + (ballPosition.x / 100) * (width - 80);
      const y = 40 + (ballPosition.y / 100) * (height - 80);
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x + 4, y + 6, 9, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x - 3, y, 4, 7, 0, 0, 2 * Math.PI);
      ctx.fillStyle = '#ccc';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 3, y, 4, 7, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 8. GRASSROOTS SPORTS brand banner with URL
    ctx.font = 'bold 24px "Inter", system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.textAlign = 'center';
    ctx.fillText("GRASSROOTS SPORTS", width / 2, height / 2 + 40);
    ctx.font = '16px monospace';
    ctx.fillStyle = 'rgba(240, 180, 41, 0.4)';
    ctx.fillText("grassrootssports.live", width / 2, height / 2 + 85);
    
    // 9. Corner marks
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText("GRS", 20, 35);
    ctx.fillText("LIVE", width - 70, 35);
  }, [ballPosition, shots]);

  return <canvas ref={canvasRef} width={width} height={height} className="w-full rounded-xl shadow-2xl border border-[#f0b429]/20" />;
}

// ============================================
// AI COMMENTARY COMPONENT (DeepSeek Voice Engine)
// ============================================
function AICommentary({ events, selectedMatch }: { events: any[]; selectedMatch: Match | null }) {
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [selectedLang, setSelectedLang] = useState<'en' | 'shona' | 'ndebele' | 'zulu' | 'tswana'>('en');
  const [currentCommentary, setCurrentCommentary] = useState('Select a match, then use the simulator options below to trigger deep slang highlights.');
  const [isTranslating, setIsTranslating] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const dialects = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'shona', label: 'ChiShona', flag: '🇿🇼' },
    { code: 'ndebele', label: 'isiNdebele', flag: '🇿🇼' },
    { code: 'zulu', label: 'isiZulu', flag: '🇿🇦' },
    { code: 'tswana', label: 'Setswana', flag: '🇿🇦' }
  ];

  // Pipeline calling DeepSeek + ElevenLabs audio chunk outputs
  const processAndPlayLiveSlang = async (eventType: string, player: string) => {
    if (!selectedMatch) return;
    
    setIsTranslating(true);
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    try {
      const response = await fetch('/api/commentary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minute: selectedMatch.minute || "12\'",
          playerName: player,
          teamName: selectedMatch.homeTeam,
          eventType: eventType,
          language: selectedLang
        })
      });

      const data = await response.json();
      if (data.success) {
        // Strip out bracket emotion tags like [screaming] before printing to screen
        const cleanedText = data.script.replace(/\[.*?\]/g, "").trim();
        setCurrentCommentary(cleanedText);

        if (isSpeaking && data.audio) {
          const audio = new Audio(data.audio);
          currentAudioRef.current = audio;
          audio.play();
        }
      }
    } catch (err) {
      console.error("DeepSeek telemetry pipe exception:", err);
      setCurrentCommentary("Eish, network issues blocking the DeepSeek commentary box right now!");
    } finally {
      setIsTranslating(false);
    }
  };

  // Automated trigger whenever active selection properties swap
  useEffect(() => {
    if (selectedMatch) {
      setCurrentCommentary(`Match tracker synchronized for ${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}. Tap an event trigger to hear DeepSeek scream in local slang!`);
    }
  }, [selectedMatch, selectedLang]);

  const toggleSpeechState = () => {
    if (isSpeaking && currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    setIsSpeaking(!isSpeaking);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider">AI Live Commentary</h3>
        </div>
        
        {/* Localization selection tray controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
            <Languages size={12} className="text-[#1a5c2a]" /> Dialect:
          </div>
          <div className="flex gap-1 bg-gray-100 p-0.5 rounded-xl border border-gray-200">
            {dialects.map((d) => (
              <button
                key={d.code}
                onClick={() => setSelectedLang(d.code as any)}
                className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all flex items-center gap-1 ${
                  selectedLang === d.code
                    ? 'bg-[#1a5c2a] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={d.label}
              >
                <span>{d.flag}</span>
                <span className="hidden md:inline">{d.label}</span>
              </button>
            ))}
          </div>

          <button 
            onClick={toggleSpeechState} 
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition font-bold ${
              isSpeaking ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSpeaking ? <Volume2 size={12} className="animate-bounce" /> : <MicOff size={12} />}
            {isSpeaking ? "AUDIO ON" : "MUTED"}
          </button>
        </div>
      </div>

      {/* Interactive Trigger Dashboard Tray (Swapped over to process high energy mock handlers) */}
      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
        <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
          <Zap size={10} className="text-[#f0b429]" /> Trigger Sound & Slang Simulation Board:
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => processAndPlayLiveSlang("GOAL", "The Striker")} disabled={isTranslating} className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition disabled:opacity-50">⚽ SCREAM GOAL!</button>
          <button onClick={() => processAndPlayLiveSlang("DRIBBLE", "The Captain")} disabled={isTranslating} className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition disabled:opacity-50">🕺 Hype Dribble Skill</button>
          <button onClick={() => processAndPlayLiveSlang("TACKLE", "The Defender")} disabled={isTranslating} className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition disabled:opacity-50">💥 Heavy Tackle</button>
          <button onClick={() => processAndPlayLiveSlang("OFFSIDE", "The Winger")} disabled={isTranslating} className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition disabled:opacity-50">🚩 Offside Banter</button>
          <button onClick={() => processAndPlayLiveSlang("FREEKICK", "The Playmaker")} disabled={isTranslating} className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition disabled:opacity-50">🎯 Dangerous Free Kick</button>
        </div>
      </div>

      <div className="bg-gray-900 text-green-400 rounded-xl p-4 h-28 overflow-y-auto border border-gray-800 flex items-center font-mono relative">
        {isTranslating ? (
          <div className="flex items-center gap-2 text-xs text-yellow-400 font-semibold italic mx-auto">
            <RefreshCw size={14} className="animate-spin" /> DeepSeek V3 compiling custom audio matrix...
          </div>
        ) : (
          <p className="text-sm italic leading-relaxed text-gray-100 w-full pl-2 border-l-2 border-[#f0b429]">
            "{currentCommentary}"
          </p>
        )}
      </div>

      <div className="flex justify-end mt-2">
        <span className="text-[9px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <Radio size={9} className="text-[#f0b429]"/> Powered by Grassroots Sports DeepSeek Commentary Engine
        </span>
      </div>
    </div>
  );
}

// ============================================
// MATCH CARD (GrassRoots style)
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
  const [events] = useState<any[]>([]); 

  const loadData = async () => {
    try {
      const live = await fetchLiveMatches();
      let all = live;
      if (all.length === 0) all = await fetchScheduledMatches();
      setMatches(all);
      if (all.length > 0 && !selectedMatch) setSelectedMatch(all[0]);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Unable to fetch live data. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simulate ball movement for live matches
  useEffect(() => {
    if (!selectedMatch || selectedMatch.status !== 'live') return;
    const interval = setInterval(() => {
      setBallPosition(prev => ({
        x: Math.min(95, Math.max(5, prev.x + (Math.random() - 0.5) * 3)),
        y: Math.min(95, Math.max(5, prev.y + (Math.random() - 0.5) * 2)),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedMatch]);

  const isLive = selectedMatch?.status === 'live';
  const liveMatchesCount = matches.filter(m => m.status === 'live').length;

  return (
    <div className="min-h-screen bg-[#f4f2ee]">
      {/* GrassRoots header */}
      <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] text-white border-b-4 border-[#f0b429]">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-[#f0b429] rounded-lg flex items-center justify-center">
                  <span className="text-black font-black text-sm">GRS</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">World Cup 2026</h1>
                <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded-full">LIVE DATA</span>
              </div>
              <p className="text-white/80 text-sm">USA · Canada · Mexico | 11 June – 19 July 2026</p>
            </div>
            <div className="flex items-center gap-4">
              {liveMatchesCount > 0 && (
                <div className="bg-red-500/20 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium">{liveMatchesCount} live matches</span>
                </div>
              )}
              <button onClick={loadData} className="text-white/70 hover:text-white transition text-sm flex items-center gap-1">
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>
          {lastUpdated && <div className="text-right text-[9px] text-white/40 mt-2">Updated: {lastUpdated.toLocaleTimeString()}</div>}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button onClick={loadData} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Retry</button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" /></div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
            <p className="text-gray-500">No matches found. The tournament starts June 11, 2026.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT: Match list */}
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-gray-700 font-bold text-sm uppercase tracking-wider flex items-center gap-2"><Calendar size={14} /> MATCH SCHEDULE</h2>
                <span className="text-[10px] text-gray-500">{matches.length} matches</span>
              </div>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                {matches.map(match => (
                  <MatchCard key={match.id} match={match} isSelected={selectedMatch?.id === match.id} onClick={() => setSelectedMatch(match)} />
                ))}
              </div>
            </div>

            {/* RIGHT: Live tracker */}
            <div className="lg:col-span-2 space-y-6">
              {!selectedMatch ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
                  <Radio size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Select a match to start live tracking</p>
                </div>
              ) : (
                <>
                  {/* Scoreboard */}
                  <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-center flex-1">
                        <span className="text-gray-400 text-xs uppercase">HOME</span>
                        <p className="text-gray-800 font-bold text-2xl mt-1">{selectedMatch.homeTeam}</p>
                        <p className="text-5xl font-black text-[#1a5c2a] mt-1">{selectedMatch.homeScore}</p>
                      </div>
                      <div className="text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-500 text-xs font-mono">VS</span>
                        </div>
                        <div className="mt-2 text-[11px] text-gray-500 font-mono">{isLive ? selectedMatch.minute : selectedMatch.time}</div>
                      </div>
                      <div className="text-center flex-1">
                        <span className="text-gray-400 text-xs uppercase">AWAY</span>
                        <p className="text-gray-800 font-bold text-2xl mt-1">{selectedMatch.awayTeam}</p>
                        <p className="text-5xl font-black text-[#1a5c2a] mt-1">{selectedMatch.awayScore}</p>
                      </div>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                      <MapPin size={12} /> {selectedMatch.stadium}, {selectedMatch.city}
                    </div>
                  </div>

                  {/* 2D Pitch with GrassRoots branding */}
                  <div className="bg-white rounded-2xl p-2 shadow-md border border-gray-200">
                    <div className="flex items-center gap-2 px-3 pt-2">
                      <div className="flex items-center gap-1 text-[10px] text-gray-500"><Tv size={12} /> TACTICAL VIEW</div>
                      <div className="flex-1"></div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400"><Activity size={10} /> live data</div>
                    </div>
                    <FootballPitch ballPosition={isLive ? ballPosition : undefined} />
                    <div className="text-center text-[9px] text-gray-400 pb-2">Ball position updates every 3–5 seconds</div>
                  </div>

                  {/* AI Commentary */}
                  <AICommentary events={events} selectedMatch={selectedMatch} />
                  
                  <div className="text-center text-[9px] text-gray-400 border-t border-gray-200 pt-4">
                    Data: ESPN Public API + worldcup.json • Powered by GrassRoots Sports AI
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}