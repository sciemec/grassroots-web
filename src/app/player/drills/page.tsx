"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Dumbbell, Target, Shield, Award, Users, 
  ArrowLeft, GraduationCap, Play, 
  CheckCircle2, AlertTriangle, Download, TrendingUp, Flame
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// 🎛️ EXPANDED GRASSROOTS FOOTBALL MATRIX INCLUDING NEW ENGLAND LEARNING CURRICULUMS
const FOOTBALL_POSITION_DRILLS = {
  striker: {
    title: "Striker & Attacking Forward Track",
    focus: "Attacking intent, positive first-touch control, creative blind turns, and clinical box execution[cite: 3, 5].",
    drills: [
      { id: "eng_st_01", name: "Lions' Den Central Turning", duration: "15 mins", description: "Receive a firm vertical entry pass inside a tight, heavily congested 8x8-yard embedded square under physical contact[cite: 21, 22]. Protect the ball with your body, turn sharply on the half-turn, and play forward to a teammate[cite: 21, 22]." },
      { id: "eng_st_02", name: "Tri-Third Elimination End Zones", duration: "20 mins", description: "Combine out of the defensive third to play an incisive, firm line-breaking pass past the midfield layer[cite: 21, 22]. Time your forward run into the shaded end zone to collect and finish without running offside[cite: 21, 22]." },
      { id: "eng_st_03", name: "Three-Goal Endline Finale", duration: "15 mins", description: "Small-sided competitive match attacking a baseline equipped with one large central goal and two corner mini-goals[cite: 23, 24]. Any regular goal is 1 point; an instinctive first-time finish is worth 2 points[cite: 23, 24]." },
      { id: "eng_st_04", name: "Double Trouble Combination", duration: "15 mins", description: "Attack a keeper and a defender in pairs on a 35x25-yard pitch[cite: 35, 36]. Move and combine to open up space and score[cite: 35, 36]. If the defender wins it, recover to help your unit[cite: 35, 36]." },
      { id: "eng_st_05", name: "The Great Escape Funnel", duration: "20 mins", description: "Start inside a cone funnel before breaking out into a 35x35-yard area against two central guards[cite: 35, 36]. Use feints and body movement to disguise your intentions and escape through perimeter gates[cite: 35, 36]." }
    ]
  },
  midfielder: {
    title: "Central Midfield & Pivot Track",
    focus: "Pre-receipt shoulder scanning, body shape openness, cover shadows drop, and tactical point switches[cite: 2, 3, 11].",
    drills: [
      { id: "cat_md_01", name: "Barcelona 3-2-1 Build Up Choices", duration: "15 mins", description: "7v7 positional small-sided game[cite: 2, 30]. Receive deep build-up passes from the center-back, scan before receiving, use your back foot to open your body shape, and decide whether to combine via a central wall-pass or switch play wide[cite: 2, 30]." },
      { id: "eng_md_02", name: "Around the Clock Passing Ring", duration: "12 mins", description: "Position symmetrically around a 20-yard diameter circle area[cite: 21, 22]. Execute rapid one-touch and two-touch passing patterns through and across the clock structure to break blocks while central defenders chase interceptions[cite: 21, 22]." },
      { id: "eng_md_03", name: "Connect Four Corner Squares", duration: "20 mins", description: "A 35x20-yard directional transition game[cite: 23, 24]. Midfielders use quick horizontal circulation to pull the defensive block out of alignment, then launch a vertical through-ball into any of the 4 shaded corner target boxes[cite: 23, 24]." },
      { id: "eng_md_04", name: "Table Football Tri-Thirds Match", duration: "25 mins", description: "Play a match inside a field split into thirds where outfielders are entirely locked into their areas to emphasize vertical lines[cite: 23, 24]. Work the ball dynamically through the thirds to feed your striker[cite: 23, 24]." },
      { id: "eng_md_05", name: "Three-Channel Tight Turning", duration: "15 mins", description: "Receive a pass inside a small central vertical channel under tight pressure[cite: 35, 36]. Keep a tight turning circle, use an outside hook or Cruyff turn to escape interference, and pass to create width[cite: 35, 36]." }
    ]
  },
  defender: {
    title: "Defensive Unit & Fullback Track",
    focus: "Defensive approach angles, arm's-length pressure, deceleration braking, and line cover support[cite: 20, 25].",
    drills: [
      { id: "eng_df_01", name: "Angled Pressing & Directional Dictation", duration: "15 mins", description: "Approach a perimeter attacker at an angle rather than straight-on to limit their options[cite: 25, 26]. Get within arm's-length to apply high pressure and dictate their movement toward the wide sidelines or weaker side goals[cite: 25, 26]." },
      { id: "eng_df_02", name: "Cover and Recover Horizontal Channels", duration: "15 mins", description: "Work in tandem inside a pitch split horizontally into thirds[cite: 25, 26]. Establish optimal supporting distances between the pressing and covering players; if the primary presser is bypassed, the covering player steps out immediately while you recover underneath[cite: 25, 26]." },
      { id: "eng_df_03", name: "Line Cover and Press 2v2", duration: "20 mins", description: "Small-sided area with mini-goals behind a baseline[cite: 20]. The out-of-possession duo must work together seamlessly: one player steps out to actively press the ball carrier while the other provides deep covering support on the line directly in front of the goal mouth[cite: 20]." },
      { id: "eng_df_04", name: "Stadium Game 1v1 Marking", duration: "15 mins", description: "Pair up with an opponent inside an isolated half of a 30x20-yard area[cite: 31, 32]. Stay close to prevent them from receiving the ball easily, position goal-side, and use a side-on stance to steal possession[cite: 31, 32]." },
      { id: "eng_df_05", name: "Five-Section Possession Grid", duration: "20 mins", description: "Engage in parallel 1v1 duels inside a 30x20-yard pitch split into five sections[cite: 31, 32]. Work together as a compact unit off the ball to mark, cover, and intercept passes to win the ball back cleanly[cite: 31, 32]." }
    ]
  },
  goalkeeper: {
    title: "Goalkeeper Elite Protocol",
    focus: "Balls-of-feet readiness, handling holds ('W' and 'M' catch styles), low ground diving, and wide distribution[cite: 7].",
    drills: [
      { id: "so_gk_01", name: "Ground Side-Diving & Ball Recovery", duration: "15 mins", description: "Crouch to lower your center of gravity before diving on the side of your body (not your stomach)[cite: 7]. Get both hands to the ball using the secure 'M' little-finger line for low shots, then immediately hug it into your chest[cite: 7]." },
      { id: "so_gk_02", name: "The 'W' & 'M' Handling Fundamentals", duration: "10 mins", description: "Practice forming a 'W' with your thumbs almost touching to secure incoming high balls, and an 'M' with little fingers touching to handle low balls[cite: 7]. Stand lightly on the balls of your feet with hands open at waist height[cite: 7]." },
      { id: "eng_gk_03", name: "Circular Target-Gate Angle Coverage", duration: "15 mins", description: "Position inside standalone square keeper boxes placed symmetrically within a circle layout[cite: 21, 22]. Move dynamically to adjust your positioning angle relative to passing pairs, making safe interceptions on first-time pass inputs[cite: 21, 22]." },
      { id: "eng_gk_04", name: "Feeder-Attacker Isolation Guard", duration: "15 mins", description: "Manage angle coverage in a 20x15-yard pitch with a goal at one end[cite: 33, 34]. Direct your defender to mark the attacker tight, tracking the ball from the feeder, and be alert to make reflex saves[cite: 33, 34]." },
      { id: "eng_gk_05", name: "Asymmetric Low Block Clearing", duration: "20 mins", description: "Defend a full-size goal with a backline of 8 outfielders against 7 attackers on half a pitch[cite: 31, 33]. Dominate your box, collect loose crosses, and quickly distribute wide after a rebound[cite: 31, 33]." }
    ]
  }
};

export default function FootballDrillsLabPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  const [activePosition, setActivePosition] = useState<keyof typeof FOOTBALL_POSITION_DRILLS>("striker");
  const [completedDrills, setCompletedDrills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTalentPassport, setShowTalentPassport] = useState(false);

  // 🆕 LOAD SAVED PROGRESS FROM DATABASE
  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    const loadProgress = async () => {
      try {
        const response = await fetch("/api/player/progress");
        if (response.ok) {
          const data = await response.json();
          setCompletedDrills(data.drills || []);
          
          // Auto-set position based on saved preference or user profile
          if (data.position) {
            setActivePosition(data.position);
          } else {
            mapUserPositionToDrillPosition();
          }
        } else {
          mapUserPositionToDrillPosition();
        }
      } catch (error) {
        console.error("Failed to load progress:", error);
        mapUserPositionToDrillPosition();
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [hydrated, user, router]);

  const mapUserPositionToDrillPosition = () => {
    const mappedRole = (user?.position || "").toLowerCase();
    if (mappedRole.includes("strik") || mappedRole.includes("forward")) 
      setActivePosition("striker");
    else if (mappedRole.includes("mid") || mappedRole.includes("play") || mappedRole.includes("wing")) 
      setActivePosition("midfielder");
    else if (mappedRole.includes("def") || mappedRole.includes("back")) 
      setActivePosition("defender");
    else if (mappedRole.includes("keep") || mappedRole.includes("goal")) 
      setActivePosition("goalkeeper");
  };

  // 🆕 SAVE PROGRESS TO DATABASE WHEN DRILLS CHANGE
  const saveProgressToBackend = async (newCompletedDrills: string[], position: string) => {
    setIsSaving(true);
    try {
      await fetch("/api/player/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          drills: newCompletedDrills,
          position: position 
        })
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // 🆕 TOGGLE DRILL COMPLETION WITH PERSISTENCE
  const toggleDrillCompletion = async (drillId: string) => {
    const newCompleted = completedDrills.includes(drillId)
      ? completedDrills.filter((id) => id !== drillId)
      : [...completedDrills, drillId];
    
    setCompletedDrills(newCompleted);
    await saveProgressToBackend(newCompleted, activePosition);
  };

  // 🆕 GENERATE TALENT PASSPORT REPORT
  const generateTalentPassport = () => {
    const selectedData = FOOTBALL_POSITION_DRILLS[activePosition];
    const completedForPosition = completedDrills.filter(id => 
      selectedData.drills.some(drill => drill.id === id)
    );
    
    const report = {
      playerName: user?.name || "Player",
      position: activePosition,
      totalDrillsCompleted: completedForPosition.length,
      totalAvailable: selectedData.drills.length,
      completionPercentage: (completedForPosition.length / selectedData.drills.length) * 100,
      completedDrillsList: selectedData.drills.filter(drill => completedDrills.includes(drill.id)),
      generatedDate: new Date().toISOString()
    };
    
    // Create downloadable JSON
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `talent-passport-${user?.name}-${activePosition}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!hydrated || isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="animate-spin text-[#1c3d22] mx-auto mb-4" size={32} />
          <p className="text-sm text-gray-600">Loading your training lab...</p>
        </div>
      </div>
    );
  }

  const selectedData = FOOTBALL_POSITION_DRILLS[activePosition];
  const completedCount = completedDrills.filter(id => 
    selectedData.drills.some(drill => drill.id === id)
  ).length;
  const completionPercentage = (completedCount / selectedData.drills.length) * 100;

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900 font-sans selection:bg-[#f0b429]/30 antialiased">
      
      {/* HEADER BARS */}
      <div className="bg-[#1c3d22] text-white border-b-4 border-[#f0b429] px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/player" className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-white">GRS Talent Nurture Lab</h1>
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Position-Specific Technical Progress Line</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-4 py-1.5 rounded-xl border border-white/10">
              <GraduationCap size={16} className="text-[#f0b429]" />
              <div className="text-left">
                <span className="block text-[8px] font-black uppercase tracking-widest text-[#f0b429] leading-none">Strategic Partner</span>
                <span className="text-[11px] font-black tracking-tight text-white uppercase">Teach For Zimbabwe</span>
              </div>
            </div>
            
            {/* 🆕 TALENT PASSPORT BUTTON */}
            <button
              onClick={generateTalentPassport}
              className="bg-[#f0b429] text-[#1c3d22] px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#f0b429]/90 transition-all flex items-center gap-2"
            >
              <Download size={14} />
              Passport
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">

        {/* MEDICAL SAFEGUARD BANNER */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={16} />
          <div>
            <h5 className="text-xs font-black uppercase text-orange-900 tracking-wide">FA Medical Safeguard Rule: Concussion Restraint</h5>
            <p className="text-[11px] text-orange-700 font-semibold mt-0.5 leading-relaxed">
              <strong>If In Doubt, Sit Them Out.</strong> Suspected head trauma requires immediate removal from play. 
              Players must be completely symptom-free before returning. No headers for players under 10 years old.
            </p>
          </div>
        </div>

        {/* 🆕 PROGRESS BANNER */}
        <div className="bg-gradient-to-r from-[#1c3d22] to-[#2a5532] rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Flame className="text-[#f0b429]" size={24} />
              <div>
                <p className="text-xs uppercase tracking-wider opacity-80">Your Progress</p>
                <p className="text-2xl font-black">{completedCount}/{selectedData.drills.length}</p>
                <p className="text-xs">Drills Completed</p>
              </div>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-xs mb-1">
                <span>Completion Rate</span>
                <span>{Math.round(completionPercentage)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#f0b429] transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
            
            {isSaving && (
              <div className="flex items-center gap-2 text-xs">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>

        {/* POSITION SELECTION CHIPS */}
        <section className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Your Position</h4>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FOOTBALL_POSITION_DRILLS) as Array<keyof typeof FOOTBALL_POSITION_DRILLS>).map((key) => {
              const isActive = activePosition === key;
              const positionCompletedCount = completedDrills.filter(id => 
                FOOTBALL_POSITION_DRILLS[key].drills.some(drill => drill.id === id)
              ).length;
              const positionTotal = FOOTBALL_POSITION_DRILLS[key].drills.length;
              
              return (
                <button
                  key={key}
                  onClick={() => setActivePosition(key)}
                  className={`relative text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl border transition-all cursor-pointer ${
                    isActive 
                      ? "bg-[#1c3d22] text-white border-[#1c3d22] shadow-md" 
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {key}
                  {positionCompletedCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#f0b429] text-[#1c3d22] text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                      {positionCompletedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* MAIN CONTENT GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* INFO PANEL */}
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4 sticky top-24">
            <div className="bg-blue-50 text-blue-700 w-10 h-10 rounded-xl flex items-center justify-center">
              <Dumbbell size={20} />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-black uppercase tracking-tight text-gray-900">{selectedData.title}</h2>
              <span className="inline-block bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-100">
                Academy Routine Group
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 leading-relaxed">
              {selectedData.focus}
            </p>
            
            {/* 🆕 MILESTONE BADGES */}
            {completionPercentage === 100 && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-3 text-center">
                <Award className="text-yellow-600 mx-auto mb-1" size={20} />
                <p className="text-[10px] font-black uppercase text-yellow-800">Position Mastered!</p>
                <p className="text-[9px] text-yellow-700">You've completed all drills for this position</p>
              </div>
            )}
            
            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
                <span>Session Completion Log</span>
                <span className="text-[#1c3d22] font-black">
                  {completedCount} / {selectedData.drills.length}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#1c3d22] transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* DRILLS LIST */}
          <div className="lg:col-span-8 space-y-3">
            {selectedData.drills.map((drill, index) => {
              const isDone = completedDrills.includes(drill.id);
              return (
                <div 
                  key={drill.id} 
                  className={`group bg-white border rounded-2xl p-5 transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden ${
                    isDone ? "border-emerald-200 bg-emerald-50/20" : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  {/* 🆕 COMPLETION INDICATOR */}
                  {isDone && (
                    <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 bg-emerald-500" />
                  )}
                  
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-gray-100 text-gray-800 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded">
                        {drill.duration}
                      </span>
                      <span className="text-[9px] font-black text-gray-400 uppercase">
                        Drill {index + 1}/{selectedData.drills.length}
                      </span>
                      <h3 className={`text-sm font-black uppercase tracking-wide truncate ${isDone ? "text-emerald-700 line-through opacity-70" : "text-gray-900"}`}>
                        {drill.name}
                      </h3>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 leading-relaxed pr-2">
                      {drill.description}
                    </p>
                    
                    {/* 🆕 COACHING POINTS HINT */}
                    {!isDone && (
                      <div className="flex items-center gap-2 mt-2">
                        <Target size={10} className="text-gray-400" />
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">Tap to mark complete</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleDrillCompletion(drill.id)}
                    className={`w-full sm:w-auto text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl border transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${
                      isDone 
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 size={14} /> Completed
                      </>
                    ) : (
                      <>
                        <Play size={12} className="fill-current" /> Start Drill
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

        </section>

        {/* 🆕 TALENT PASSPORT PREVIEW SECTION */}
        {completedCount > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="text-[#f0b429]" size={20} />
                <h3 className="text-sm font-black uppercase text-gray-900">Your Talent Passport Summary</h3>
              </div>
              <button
                onClick={generateTalentPassport}
                className="text-[10px] font-black uppercase bg-[#1c3d22] text-white px-3 py-1.5 rounded-xl hover:bg-[#2a5532] transition-colors"
              >
                Download Full Report
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-black text-[#1c3d22]">{completedCount}</p>
                <p className="text-[9px] uppercase text-gray-500">Drills Mastered</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-black text-[#1c3d22]">{Math.round(completionPercentage)}%</p>
                <p className="text-[9px] uppercase text-gray-500">Completion Rate</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-black text-[#1c3d22]">{activePosition}</p>
                <p className="text-[9px] uppercase text-gray-500">Primary Position</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-2xl font-black text-[#1c3d22]">
                  {selectedData.drills.filter(d => completedDrills.includes(d.id)).reduce((acc, d) => 
                    acc + parseInt(d.duration), 0
                  )} min
                </p>
                <p className="text-[9px] uppercase text-gray-500">Total Practice Time</p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}