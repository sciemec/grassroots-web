"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Camera, 
  UploadCloud, 
  Video,
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Flame,
  Award,
  QrCode,
  Radio,
  BookOpen,
  Activity,
  GraduationCap,
  MapPin
} from "lucide-react";

export default function GrassrootsSportsLanding() {
  const router = useRouter();
  
  // Sandbox state machinery
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [testType, setTestType] = useState("20m_sprint");
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);
  const [calculatedMetric, setCalculatedMetric] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Wire Ticker State Loop
  const [wireIndex, setWireIndex] = useState(0);

  const activityWire = [
    "⚡ K.M. (U17 Striker, Harare) just clocked a 2.84s 20m sprint line benchmark!",
    "🍀 Coach Moyo (Matabeleland North) logged a 4-3-3 tactical blueprint loop.",
    "🔥 T.N. (U13 Midfielder, Bulawayo) cleared a 45cm vertical leap threshold classification.",
    "🛡️ Zimbiru Primary School NASH cohort profile synced into the National Talent Database.",
    "⚡ S.G. (Senior Tier Wingback, Manicaland) logged a 15-second manual heart rate recovery index.",
    "🍀 Teach for Zimbabwe Mobile Lab Ingestion Engine activated for Hwange District schools."
  ];

  useEffect(() => {
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

    // High-speed sandbox metric simulation
    setTimeout(() => {
      let derivedMetric = "";
      if (testType === "20m_sprint") derivedMetric = "Estimated 2.85s Burst Line";
      else if (testType === "vertical_leap") derivedMetric = "65cm Vertical Separation";
      else derivedMetric = "Elite Technical Agility Grade";

      setCalculatedMetric(derivedMetric);
      setProcessing(false);
      setShowGateModal(true);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900 selection:bg-[#f0b429]/30 antialiased">
      
      {/* 🏁 ULTRA-LEAN BRAND NAVIGATION HEADER WITH STRATEGIC BRANDING */}
      <nav className="bg-[#1c3d22] border-b-2 border-[#f0b429] px-4 sm:px-6 py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-[#f0b429] p-1.5 rounded-lg text-[#1c3d22] font-black text-xs">GRS</div>
            <span className="text-white font-black text-sm tracking-wider uppercase group-hover:text-[#f0b429] transition-colors">Grassroots Sports</span>
          </Link>

          {/* TEACH FOR ZIMBABWE STRATEGIC PARTNER LOGO BLOCK */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-4 py-1.5 rounded-xl border border-white/10 shadow-xs">
            <GraduationCap size={16} className="text-[#f0b429]" />
            <div className="text-left">
              <span className="block text-[8px] font-black uppercase tracking-widest text-[#f0b429] leading-none">Strategic Education Partner</span>
              <span className="text-[11px] font-black tracking-tight text-white uppercase">Teach For Zimbabwe</span>
            </div>
          </div>
          
          <Link href="/login" className="text-gray-200 border border-white/20 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all">
            Sign In Account
          </Link>
        </div>
      </nav>

      {/* 📡 LIVE REGIONAL ACTIVITY WIRE */}
      <div className="bg-[#fffbeb] border-b border-amber-100 py-2.5 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shrink-0 shadow-3xs">
            <Radio size={10} className="animate-pulse" /> Live Wire
          </span>
          <p className="text-xs font-bold text-amber-900 transition-all duration-500 ease-in-out truncate">
            {activityWire[wireIndex]}
          </p>
        </div>
      </div>

      {/* 🌟 MISSION MANIFESTO HERO */}
      <header className="bg-gradient-to-b from-[#1c3d22] to-[#142c18] text-white py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1 bg-[#f0b429] text-[#1c3d22] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            <Zap size={11} className="fill-current animate-pulse" /> The Core Protocol
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none">
            Identify. Nurture. <span className="text-[#f0b429]">Market.</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-gray-300 max-w-lg mx-auto leading-relaxed">
            A digitized talent production line built specifically for Zimbabwean footballers. Strip away the middleman, back your profile with verifiable metrics, and build a global talent passport.
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">

        {/* 🎛️ ECOSYSTEM INFRASTRUCTURE QUICK-LINKS */}
        <section className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Ecosystem Infrastructure Quick-Links</h4>
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
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700"><Activity size={16} /></div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">AI Training Lab</h4>
                  <p className="text-[11px] text-gray-400 font-semibold truncate">Live MediaPipe camera frame scans</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-[#1c3d22] transition-colors shrink-0" />
            </Link>

          </div>
        </section>

        {/* 🗺️ THE TRILOGY CONVERSION FUNNEL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-3xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#c8962a] flex items-center justify-center font-black text-sm">1</div>
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">1. Identify</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">Upload a quick video drill in-browser to extract instant, unforgeable speed and power metrics.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-3xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">2</div>
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">2. Nurture</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">Unlock dedicated position metrics and receive targeted, data-light training routines from the THUTO AI agent.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-3xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm">3</div>
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">3. Market</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">Generate a scannable QR Talent Passport. Share a high-speed digital profile with international scouts instantly.</p>
          </div>
        </div>

        {/* 🧬 THE SANDBOX CORE PIPELINE INTERFACE */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-8 shadow-sm">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center justify-center gap-1.5">
                <Search size={18} className="text-[#1c3d22]" /> Step 1: Initialize Identification Ingestion
              </h2>
              <p className="text-xs text-gray-500 font-semibold max-w-md mx-auto">
                No setup barriers. Drop your drill tape below to begin metric synchronization.
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
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 outline-none focus:bg-white focus:border-gray-400 font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-wider">Biometric Focus Paradigm</label>
                  <select 
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 outline-none focus:bg-white focus:border-gray-400 font-bold cursor-pointer transition-all"
                  >
                    <option value="20m_sprint">20m Direct Acceleration Vector</option>
                    <option value="vertical_leap">Vertical Leap Separation</option>
                  </select>
                </div>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-[#f0b429] bg-gray-50/50 hover:bg-white rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all space-y-2 group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*" 
                  className="hidden" 
                />
                <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-gray-400 group-hover:text-[#c8962a] shadow-xs mx-auto transition-transform group-hover:scale-105">
                  <UploadCloud size={18} />
                </div>
                {videoFile ? (
                  <div>
                    <p className="text-xs font-black text-gray-900 max-w-xs mx-auto truncate">Staged: {videoFile.name}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight mt-0.5">Ingestion node loaded completely</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-black text-gray-800">Select performance drill video file</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Vertical smartphone camera configurations supported</p>
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
                  className={`flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider border px-4 py-3 rounded-xl transition-all ${
                    recording ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Camera size={14} /> {recording ? "Kill Feed" : "Capture Live Video"}
                </button>

                <button
                  type="submit"
                  disabled={processing || (!videoFile && !recording)}
                  className="flex-1 bg-[#1c3d22] hover:bg-[#224b2a] text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-40 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Compiling Velocity Matrices...
                    </>
                  ) : (
                    "Extract AI Performance Profile"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* 🛑 UPGRADED HIGH-CONVERSION ONBOARDING GATE MODAL */}
      {showGateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-center border-t-4 border-[#f0b429]">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#c8962a] mx-auto">
              <Lock size={20} />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-black text-gray-900 tracking-tight uppercase">Talent Ingest Identity Guard</h3>
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <CheckCircle2 size={12} /> Matrix Score Locked: {calculatedMetric}
              </p>
            </div>

            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Your biometric track vectors have successfully compiled! To initialize Step 2 (**Nurture**) and step into Step 3 (**Market**) to generate your scannable QR passport for local or international scout review loops, map your player parameters securely now.
            </p>

            {/* Blurred Mock Hub Analytics Visual Hook Element */}
            <div className="border border-gray-100 bg-gray-50 rounded-xl p-3 flex items-center justify-between select-none filter blur-[2px] opacity-25">
              <div className="flex items-center gap-2">
                <Award size={16} />
                <div className="h-2 w-24 bg-gray-400 rounded"></div>
              </div>
              <QrCode size={16} />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {/* 🚀 FIXED: Directly wires parameters to trigger the new registration folder proxy interceptor automatically */}
              <button 
                onClick={() => router.push(`/register?role=player&name=${encodeURIComponent(playerName)}&pipeline=complete`)}
                className="w-full bg-[#1c3d22] hover:bg-[#234c2b] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                Claim Talent Passport & View Data <ArrowRight size={14} />
              </button>
              <button 
                onClick={() => setShowGateModal(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                Dismiss & Discard Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-12 text-center px-4">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
          Grassroots Sports Development Network © 2026 • Identify, Nurture, and Market Talent
        </p>
      </footer>
    </div>
  );
}