"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { 
  Activity, Award, BarChart3, Camera, CheckCircle, 
  Flame, BookOpen, Loader2, Share2, Sparkles, TrendingUp, Upload, User 
} from "lucide-react";
import { POSITION_FOCUS_MAP, type PositionFocusConfig } from "@/config/position-focus";
import { useAuthStore } from "@/lib/auth-store";

const POSITION_TABS = [
  { id: "striker",       label: "Striker" },
  { id: "winger",        label: "Winger" },
  { id: "midfielder",    label: "Midfielder" },
  { id: "defensive_mid", label: "Def. Mid" },
  { id: "defender",      label: "Center Back" },
  { id: "fullback",      label: "Full Back" },
  { id: "goalkeeper",    label: "Goalkeeper" },
];

export default function EnhancedPlayerHub() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const loginStore = useAuthStore((state) => state.login);

  // ── Existing Selector & Chat States ─────────────────────────────────────────
  const [positionId, setPositionId] = useState<string>(
    user?.position ?? "striker"
  );
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const pos = POSITION_FOCUS_MAP[positionId] ?? POSITION_FOCUS_MAP.fallback;

  // ── Brand Optimization States ──────────────────────────────────────────────
  const [height, setHeight] = useState("178");
  const [weight, setWeight] = useState("72");
  const [speed, setSpeed] = useState("32");
  const [stamina, setStamina] = useState("80");
  const [passing, setPassing] = useState("75");
  
  const [loadingBiometrics, setLoadingBiometrics] = useState(false);
  const [biometricResults, setBiometricResults] = useState<any>(null);
  const [story, setStory] = useState("");
  const [savingStory, setSavingStory] = useState(false);
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=60");
  const [upscaling, setUpscaling] = useState(false);
  const [message, setMessage] = useState("");

  // ── Side Effects ────────────────────────────────────────────────────────────
  // Reset chat when position changes
  useEffect(() => {
    setMessages([{ role: "assistant", content: pos.thutoGreeting }]);
  }, [positionId, pos.thutoGreeting]);

  // Scroll chat to bottom
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ── Interactive Logic Handlers ──────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || aiLoading) return;
    const userMsg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/thuto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          systemPrompt: pos.thutoSystemPrompt,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue. Please try again." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleBiometricSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingBiometrics(true);
    setMessage("");

    try {
      const response = await fetch("https://bhora-ai.onrender.com/api/v1/player/biometrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          height_cm: parseInt(height),
          weight_kg: parseInt(weight),
          top_speed_kmh: parseInt(speed),
          stamina_rating: parseInt(stamina),
          passing_accuracy: parseInt(passing)
        })
      });

      if (response.ok) {
        const json = await response.json();
        setBiometricResults(json.analytics);
        setMessage("✅ Matrix successfully calculated and linked onto your public Arena profile.");
      }
    } catch (err) {
      console.error("Biometric analytics processing error:", err);
    } finally {
      setLoadingBiometrics(false);
    }
  };

  const handleUpscaleMedia = async () => {
    setUpscaling(true);
    try {
      const response = await fetch("https://bhora-ai.onrender.com/api/v1/player/media-upscale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ image_url: imageUrl })
      });
      if (response.ok) {
        const json = await response.json();
        setImageUrl(json.enhanced_url);
        setMessage("✨ AI Media Enhancer Complete! Contrast and definition upscaled to Ultra-HD for scouts.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpscaling(false);
    }
  };

  const handleStorySubmit = async () => {
    setSavingStory(true);
    try {
      const response = await fetch("https://bhora-ai.onrender.com/api/v1/player/story-tell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ story_bio: story })
      });
      if (response.ok) {
        setMessage("📖 Your unique background story has been pinned onto the public timeline successfully.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingStory(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 font-sans antialiased pb-12" style={{ background: "#f4f2ee" }}>
      
      {/* ── Dynamic Branding Header Banner ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-green-900 to-emerald-800 text-white py-12 px-6 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="bg-yellow-500 text-green-950 font-black text-[10px] uppercase px-2.5 py-1 rounded-full tracking-widest">
              Brand Marketing Active
            </span>
            <h1 className="text-3xl font-black mt-2">ATHLETE BRAND HUB</h1>
            <p className="text-green-200 text-xs font-medium mt-1">
              Upload visuals, log metrics, and broadcast your profile onto the Arena timeline.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer">
              <Share2 size={14} /> View Public Arena Profile
            </button>
          </div>
        </div>
      </div>

      {/* ── Position Tabs Navigation Roster ───────────────────────────────────── */}
      <div className="flex gap-2 px-6 py-2.5 bg-white border-b border-gray-200 overflow-x-auto">
        {POSITION_TABS.map(t => (
          <button key={t.id} onClick={() => setPositionId(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all cursor-pointer ${
              positionId === t.id
                ? "text-white border-transparent"
                : "text-gray-500 border-gray-200"
            }`}
            style={positionId === t.id ? { background: "#1a5c2a", borderColor: "#1a5c2a" } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Notification Center Banner ────────────────────────────────────────── */}
      {message && (
        <div className="max-w-6xl mx-auto mt-4 mx-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-3 rounded-xl shadow-2xs">
          {message}
        </div>
      )}

      {/* ── Main Responsive Grid Core Matrix ──────────────────────────────────── */}
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 🛠️ LEFT COLUMN: Biometrics Input & AI Performance Score Matrix */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Activity size={16} className="text-green-700" /> Biometric Input Matrix
            </h2>
            
            <form onSubmit={handleBiometricSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Height (cm)</label>
                <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-green-700" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Weight (kg)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-green-700" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Top Speed (km/h)</label>
                <input type="number" value={speed} onChange={e => setSpeed(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-green-700" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Stamina Capacity (1-99)</label>
                <input type="number" value={stamina} onChange={e => setStamina(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-green-700" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Ball Control / Distribution (1-99)</label>
                <input type="number" value={passing} onChange={e => setPassing(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-green-700" />
              </div>

              <button type="submit" disabled={loadingBiometrics} className="w-full bg-green-700 hover:bg-green-800 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs">
                {loadingBiometrics ? "Analyzing Parameters..." : "Generate AI Analysis Breakdown"}
              </button>
            </form>
          </div>

          {/* AI Performance Score Card Display */}
          {biometricResults && (
            <div className="bg-gradient-to-br from-gray-900 to-green-950 text-white rounded-2xl p-6 shadow-sm animate-fade-in">
              <h3 className="text-xs font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                <BarChart3 size={14} /> AI Score Performance Output
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[9px] block text-gray-400 uppercase font-black">Body Mass Index</span>
                  <span className="text-xl font-black text-white mt-1 block">{biometricResults.body_mass_index}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[9px] block text-gray-400 uppercase font-black">Athletic Power Index</span>
                  <span className="text-xl font-black text-white mt-1 block">{biometricResults.athletic_score} / 99</span>
                </div>
              </div>
              <div className="mt-4 bg-white/10 px-3 py-2 rounded-xl text-xs font-bold text-center">
                Scouting Status Pool: <span className="text-yellow-400">{biometricResults.scouting_tier}</span>
              </div>
            </div>
          )}
        </section>

        {/* 🛠️ RIGHT COLUMN: Marketing Engine, Authentic Stories, and original Position Grids */}
        <section className="lg:col-span-2 space-y-6">
          
          {/* Ultra-HD Image Sharpener Module */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-2 relative h-44 rounded-xl overflow-hidden bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Profile Card View" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[9px] font-black text-white uppercase tracking-wider">
                Resolution Preview
              </div>
            </div>
            
            <div className="md:col-span-3 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-black text-green-700 uppercase tracking-widest block">Brand Optimization</span>
                <h3 className="text-lg font-black text-gray-900 mt-0.5">Ultra-HD Image Sharpener</h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1">
                  Enhance picture quality and boost definition to present a highly polished, professional profile for international scouts.
                </p>
              </div>
              <button onClick={handleUpscaleMedia} disabled={upscaling} className="w-full md:w-auto bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                {upscaling ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} className="text-yellow-400" />}
                {upscaling ? "Upscaling Resolution..." : "Upscale & Optimize Visual Assets"}
              </button>
            </div>
          </div>

          {/* THUTO Personal Narrative Canvas */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <BookOpen size={16} />
              </div>
              <div>
                <span className="text-[9px] block text-amber-600 uppercase font-black">THUTO Narrative Suite</span>
                <h3 className="text-sm font-black text-gray-900 uppercase">Tell Your Authentic Story</h3>
              </div>
            </div>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              Document your background, training milestones, challenges, and aspirations. Authenticity creates memorable profiles that capture attention.
            </p>
            <textarea value={story} onChange={e => setStory(e.target.value)} placeholder="Share where your journey started, your local academy context, and your football goals..." rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-900 outline-none focus:ring-1 focus:ring-green-700" />
            <button onClick={handleStorySubmit} disabled={savingStory || !story.trim()} className="bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs disabled:opacity-40">
              {savingStory ? "Saving Bio..." : "Publish Story to Profile"}
            </button>
          </div>

          {/* 📦 ORIGINAL COMBINED MATRIX COMPONENT CARDS AREA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Position Attribute Focus Profile */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-medium mb-2">Position profile</p>
              <p className="text-sm font-black text-gray-900 mb-2">{pos.title}</p>
              <div className="flex flex-wrap gap-1.5">
                {pos.primaryAttributes.map(a => (
                  <span key={a} className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${pos.badgeColor}`}>{a}</span>
                ))}
              </div>
            </div>

            {/* Physical Training focus */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-medium mb-2">Physical focus</p>
              <div className="grid grid-cols-1 gap-1.5">
                {pos.physicalFocus.map(p => (
                  <div key={p} className="flex items-center gap-2 text-xs text-gray-700 bg-stone-50 rounded-lg px-3 py-2 border border-gray-100 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#c8962a" }} />
                    {p}
                  </div>
                ))}
              </div>
            </div>

            {/* Target Drill Categories */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-medium mb-2">Your drill categories</p>
              <div className="flex flex-col gap-1.5">
                {pos.targetDrillCategories.map(d => (
                  <div key={d} className="flex items-center gap-2 text-xs text-gray-700 bg-stone-50 rounded-lg px-3 py-2 border border-gray-100 font-semibold uppercase tracking-wide text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#1a5c2a" }} />
                    {d.replace(/_/g, " ")}
                  </div>
                ))}
              </div>
            </div>

            {/* Metric Targets Cards */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-medium mb-2">Success metrics</p>
              <div className="grid grid-cols-2 gap-2">
                {pos.successMetrics.map(m => (
                  <div key={m.label} className="bg-stone-50 border border-gray-100 rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{m.label}</p>
                    <p className="text-base font-black mt-0.5" style={{ color: pos.accentColor }}>—</p>
                    <p className="text-[10px] text-gray-400 font-medium">target: {m.target}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 📋 THUTO AI COACH TERMINAL PANEL (Full Width Grid Base) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div>
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest block">Position Academy</span>
              <p className="text-sm font-black text-gray-900 uppercase">Thuto AI — your {pos.title.split("/")[0].trim().toLowerCase()} coach</p>
            </div>

            {/* Quick Prompt Pill Triggers */}
            <div className="flex flex-wrap gap-2">
              {pos.quickPrompts.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-stone-50 transition-colors font-semibold cursor-pointer"
                  style={{ color: "#1a5c2a" }}>
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Frame Content Scroll Window */}
            <div ref={chatRef} className="flex flex-col gap-2 max-h-56 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50">
              {messages.map((m, i) => (
                <div key={i} className={`text-sm rounded-xl px-3 py-2 leading-relaxed max-w-[86%] font-medium ${
                  m.role === "user"
                    ? "self-end text-white rounded-br-sm shadow-2xs"
                    : "self-start text-gray-900 bg-white border border-gray-200 rounded-bl-sm shadow-3xs"
                }`} style={m.role === "user" ? { background: "#1a5c2a" } : {}}>
                  {m.content}
                </div>
              ))}
              {aiLoading && (
                <div className="self-start text-xs text-gray-400 bg-white border border-gray-100 rounded-xl rounded-bl-sm px-3 py-2 italic font-medium flex items-center gap-1.5">
                  <Loader2 className="animate-spin text-green-700" size={12} /> Thuto is tactical modeling…
                </div>
              )}
            </div>

            {/* Interaction Input Interface Box */}
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask your position coach anything tactical..."
                className="flex-1 text-xs font-bold px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:border-green-700 transition-colors" />
              <button onClick={() => sendMessage(input)} disabled={aiLoading || !input.trim()}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-xs transition-opacity hover:opacity-90"
                style={{ background: "#c8962a" }}>
                Ask Coach
              </button>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}