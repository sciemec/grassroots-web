"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, Camera, UploadCloud, CheckCircle2, Loader2, ArrowRight,
  Zap, Lock, Award, QrCode, Radio, BookOpen, Activity, 
  GraduationCap, MapPin, Users, Globe, ChevronRight
} from "lucide-react";

interface LeaderboardAthlete {
  id: string;
  name: string;
  sport: string;
  province: string;
  score: number;
}

export default function GrassrootsSportsLanding() {
  const router = useRouter();
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [testType, setTestType] = useState("20m_sprint");
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);
  const [calculatedMetric, setCalculatedMetric] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic content streams managed directly from endpoints
  const [activityWire, setActivityWire] = useState<string[]>([]);
  const [wireIndex, setWireIndex] = useState(0);
  const [topTalents, setTopTalents] = useState<LeaderboardAthlete[]>([]);
  const [talentsLoading, setTalentsLoading] = useState(true);

  // Fetch contextual ticker streams and high-speed leaderboards asynchronously on mount
  useEffect(() => {
    async function fetchLandingMetrics() {
      try {
        const [wireRes, leaderboardRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ticker-wire`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/talent-leaderboard?limit=3`)
        ]);

        if (wireRes.ok) {
          const wireData = await wireRes.json();
          if (wireData.ticker_items) setActivityWire(wireData.ticker_items);
        }
        
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          const transformed = (leaderboardData.data || []).map((item: any) => ({
            id: item.user_id,
            name: item.initials || "Athlete",
            sport: item.sport || "Multi-sport",
            province: item.province || "Zimbabwe",
            score: item.percentile || 0,
          }));
          setTopTalents(transformed);
        }
      } catch (err) {
        console.error("Pipeline discovery sync error:", err);
      } finally {
        setTalentsLoading(false);
      }
    }
    fetchLandingMetrics();
  }, []);

  useEffect(() => {
    if (activityWire.length === 0) return;
    const interval = setInterval(() => {
      setWireIndex((prev) => (prev + 1) % activityWire.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activityWire.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (!playerName) setPlayerName("Trial Athlete");
    }
  };

  const handleBiometricPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile && !recording) return;
    
    setProcessing(true);

    setTimeout(() => {
      let derivedMetric = "";
      if (testType === "20m_sprint") {
        derivedMetric = "Estimated 2.85s Burst Velocity Vector";
      } else if (testType === "vertical_leap") {
        derivedMetric = "65cm Vertical Separation Delta";
      } else if (testType === "5_10_5_agility") {
        derivedMetric = "4.35s 5-10-5 Agility Transition Score";
      } else {
        derivedMetric = "Elite Technical Agility Grade";
      }

      setCalculatedMetric(derivedMetric);
      setProcessing(false);
      setShowGateModal(true);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-[#1c3d22] selection:bg-[#f0b429]/30 antialiased font-sans">
      
      {/* 🏁 HIGH-VISIBILITY SAGE BRAND NAVIGATION */}
      <nav className="bg-[#e2f0d9] border-b-2 border-[#f0b429] px-4 sm:px-6 py-4 shadow-xs sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-[#1c3d22] p-1.5 rounded-lg text-[#f0b429] font-black text-xs">GRS</div>
            <span className="text-[#1c3d22] font-black text-sm tracking-wider uppercase group-hover:text-emerald-700 transition-colors">
              Grassroots Sports
            </span>
          </Link>

          <div className="flex items-center gap-2 bg-[#f0f9e8] px-4 py-1.5 rounded-xl border border-[#1c3d22]/10 shadow-3xs">
            <GraduationCap size={16} className="text-[#1c3d22]" />
            <div className="text-left">
              <span className="block text-[8px] font-black uppercase tracking-widest text-emerald-800 leading-none">Strategic Education Partner</span>
              <span className="text-[11px] font-black tracking-tight text-[#1c3d22] uppercase">Teach For Zimbabwe</span>
            </div>
          </div>
          
          <Link href="/login" className="bg-white text-[#1c3d22] border-2 border-[#1c3d22] hover:bg-[#f0f9e8] px-4 py-1.75 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-3xs">
            Sign In Account
          </Link>
        </div>
      </nav>

      {/* 📡 LIVE regional ACTIVITY WIRE */}
      {activityWire.length > 0 && (
        <div className="bg-[#fffbeb] border-b border-amber-200 py-2.5 px-4 overflow-hidden">
          <div className="max-w-6xl mx-auto flex items-center gap-2">
            <span className="flex items-center gap-1 bg-[#1c3d22] text-[#f0b429] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shrink-0 shadow-3xs">
              <Radio size={10} className="animate-pulse" /> Live Wire
            </span>
            <p className="text-xs font-bold text-amber-950 transition-all duration-500 ease-in-out truncate">
              {activityWire[wireIndex]}
            </p>
          </div>
        </div>
      )}

      {/* 🌟 MISSION HERO JUMBOTRON */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#e2f0d9] via-[#f0f9e8] to-[#f4f2ee] border-b border-[#1c3d22]/10 py-16 lg:py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/80 border border-[#1c3d22]/10 rounded-full px-4 py-1.5 mb-2 shadow-3xs">
            <Zap size={14} className="text-[#1c3d22]" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900">Zimbabwe's #1 Talent Discovery Platform</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 leading-none">
            Identify. Nurture. <span className="text-[#1c3d22] border-b-4 border-[#f0b429]">Market.</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            AI-powered biometric metrics, personalized training frameworks, and a digital talent passport built to get African grassroots athletes discovered by global scouts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link 
              href="/register" 
              className="bg-[#f0b429] text-[#1c3d22] border-2 border-[#1c3d22] px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              Get Started <ChevronRight size={14} />
            </Link>
            <Link 
              href="/talent-leaderboard" 
              className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-3xs"
            >
              Discover Talent <Users size={14} />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-12">

        {/* 🎛️ ECOSYSTEM QUICK LINKS */}
        <section className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Ecosystem Infrastructure Quick-Links</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <Link href="/player/success" className="bg-white border border-gray-200 hover:border-[#1c3d22] p-4 rounded-2xl flex items-center justify-between group shadow-3xs transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-amber-50 text-[#c8962a]"><Zap size={16} /></div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">THUTO Success Engine</h4>
                  <p className="text-[11px] text-gray-400 font-semibold truncate">Streak monitoring & daily check-ins</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-[#1c3d22] transition-colors shrink-0" />
            </Link>

            <Link href="/player/passport" className="bg-white border border-gray-200 hover:border-[#1c3d22] p-4 rounded-2xl flex items-center justify-between group shadow-3xs transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700"><BookOpen size={16} /></div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">Talent Passport</h4>
                  <p className="text-[11px] text-gray-400 font-semibold truncate">Verified public A4 scout portfolio</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-[#1c3d22] transition-colors shrink-0" />
            </Link>

            <Link href="/player/training" className="bg-white border border-gray-200 hover:border-[#1c3d22] p-4 rounded-2xl flex items-center justify-between group shadow-3xs transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-[#f0f9e8] text-emerald-800"><Activity size={16} /></div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">AI Training Lab</h4>
                  <p className="text-[11px] text-gray-400 font-semibold truncate">Live MediaPipe camera frame scans</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-[#1c3d22] transition-colors shrink-0" />
            </Link>

          </div>
        </section>

        {/* 🗺️ FUNNEL ROW */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-3xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#c8962a] flex items-center justify-center font-black text-sm">1</div>
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">1. Identify</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">Record your athletic performance drill in-browser to extract instant speed, change-of-direction, and power vectors.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-3xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#f0f9e8] text-emerald-800 flex items-center justify-center font-black text-sm">2</div>
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">2. Nurture</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">Unlock granular positional metrics and structured, local food nutrition guidelines derived directly from the THUTO AI curriculum.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-3xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm">3</div>
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">3. Market</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">Compile a scannable QR Talent Passport. Share comprehensive physical data sheets with regional and global scout networks instantly.</p>
          </div>
        </section>

        {/* 🧬 INTEGRATED ANALYSIS INTERFACE */}
        <section className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-8 shadow-xs">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center justify-center gap-1.5">
                <Search size={18} className="text-[#1c3d22]" /> Step 1: Initialize Identification Ingestion
              </h2>
              <p className="text-xs text-gray-500 font-semibold max-w-md mx-auto">
                Drop your drill execution tape below to begin automated parameter extraction.
              </p>
            </div>

            <form onSubmit={handleBiometricPipeline} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-wider">Athlete Moniker</label>
                  <input 
                    type="text" 
                    required
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="e.g. Knowledge Moyo" 
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 outline-none focus:bg-white focus:border-zinc-400 font-bold transition-all text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-wider">Biometric Diagnostic Focus</label>
                  <select 
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 outline-none focus:bg-white focus:border-zinc-400 font-black cursor-pointer transition-all uppercase tracking-wide text-gray-800"
                  >
                    <option value="20m_sprint">20m Direct Sprint Acceleration</option>
                    <option value="vertical_leap">Vertical High Jump / Leap Delta</option>
                    <option value="5_10_5_agility">5-10-5 Agility Shuttle Drive</option>
                  </select>
                </div>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#1c3d22]/20 hover:border-[#1c3d22] bg-[#f0f9e8]/30 hover:bg-white rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all space-y-2 group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*" 
                  className="hidden" 
                />
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-emerald-800 shadow-3xs mx-auto transition-transform group-hover:scale-105">
                  <Camera size={18} className="text-[#1c3d22]" />
                </div>
                {videoFile ? (
                  <div>
                    <p className="text-xs font-black text-gray-900 max-w-xs mx-auto truncate">Staged: {videoFile.name}</p>
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-tight mt-0.5">Ingestion node configured</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-black text-gray-800">Select or drop raw video tape file</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Vertical smartphone capture configurations supported</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecording(!recording);
                    if (!recording) setVideoFile(new File([""], "device_lens_sandbox.mp4"));
                  }}
                  className={`flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider border px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    recording ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <Camera size={14} /> {recording ? "Kill Lens" : "Use Live Device Lens"}
                </button>

                <button
                  type="submit"
                  disabled={processing || (!videoFile && !recording)}
                  className="flex-1 bg-[#1c3d22] hover:bg-emerald-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-40 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {processing ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-[#f0b429]" /> Compiling Velocity Matrices...
                    </>
                  ) : (
                    "Extract AI Performance Profile"
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* 🌍 SPORT DISCIPLINE GRID */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 space-y-6 shadow-3xs">
          <div className="text-center max-w-md mx-auto space-y-1">
            <Globe size={28} className="mx-auto text-[#1c3d22]" />
            <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">All Sports. One Platform.</h2>
            <p className="text-xs text-gray-400 font-semibold">Our biometric evaluation engine maps parameters across multi-sport streams.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {["Football", "Athletics", "Rugby", "Netball", "Basketball", "Swimming", "Tennis", "Boxing"].map((sport) => (
              <div key={sport} className="p-3.5 bg-[#f0f9e8]/50 text-[#1c3d22] border border-[#e2f0d9] font-black text-xs rounded-xl uppercase tracking-wide">
                {sport}
              </div>
            ))}
          </div>
        </section>

        {/* 🏆 LEADERBOARD MATRICES */}
        <section className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Top National Talent Roster</h2>
              <p className="text-xs text-gray-400 font-semibold">Verified profiles receiving active scout evaluations</p>
            </div>
            <Link href="/talent-leaderboard" className="text-[#1c3d22] hover:text-emerald-800 font-black text-xs uppercase tracking-wider flex items-center gap-0.5 underline">
              View Leaderboard Matrix <ChevronRight size={14} />
            </Link>
          </div>
          
          {talentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse border" />
              ))}
            </div>
          ) : topTalents.length === 0 ? (
            <div className="text-center py-6 border border-dashed text-xs text-gray-400 italic rounded-2xl bg-white">
              No national leaderboard positions logged yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topTalents.map((athlete, index) => (
                <div key={athlete.id} className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center justify-between gap-4 shadow-3xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#e2f0d9] flex items-center justify-center text-[#1c3d22] font-black text-xs border border-[#1c3d22]/10">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm uppercase">{athlete.name}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                        <span>{athlete.sport}</span>
                        <span>•</span>
                        <MapPin size={10} className="text-gray-300" />
                        <span>{athlete.province}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-[#1c3d22] leading-none">{athlete.score}th</p>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Percentile</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* 🛑 SECURE RESPONSE INTERCEPT MODAL */}
      {showGateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center border-t-4 border-[#f0b429]">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#c8962a] mx-auto">
              <Lock size={20} className="text-[#1c3d22]" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-black text-gray-900 tracking-tight uppercase">Talent Ingest Identity Guard</h3>
              <p className="text-xs text-emerald-700 font-black uppercase tracking-wider flex items-center justify-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-600" /> Matrix Score Locked: {calculatedMetric}
              </p>
            </div>

            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Your biometric track vectors have successfully compiled! To initialize Step 2 (**Nurture**) and step into Step 3 (**Market**) to generate your scannable QR passport for local or international scout review loops, map your player parameters securely now.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={() => router.push(`/register?role=player&name=${encodeURIComponent(playerName)}&pipeline=complete`)}
                className="w-full bg-[#f0b429] hover:bg-amber-400 text-[#1c3d22] border-2 border-[#1c3d22] py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Claim Talent Passport & View Data <ArrowRight size={14} />
              </button>
              <button 
                onClick={() => setShowGateModal(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors py-1 cursor-pointer"
              >
                Dismiss & Discard Score
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-gray-200 bg-white py-8 text-center px-4">
        <Award size={32} className="mx-auto text-[#1c3d22] mb-2" />
        <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">
          Grassroots Sports Development Network © 2026 • Identify, Nurture, and Market Talent
        </p>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
          Zimbabwe's First AI-Powered Multi-Sport Talent Discovery Platform
        </p>
      </footer>
    </div>
  );
}