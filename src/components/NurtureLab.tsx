"use client";

import { usePlayer } from "@/context/PlayerContext";
import { CheckCircle, Target, Shield, Activity, Flame, Loader2 } from "lucide-react";

export function NurtureLab() {
  const { player, filteredDrills, completeDrill } = usePlayer();

  if (!player) {
    return (
      <div className="text-center p-8 bg-zinc-900 rounded-2xl border border-zinc-800">
        <h3 className="text-lg font-bold">Complete Your Profile</h3>
        <p className="text-zinc-400 text-sm mt-2">Select your position to get personalized drills</p>
        {/* Placeholder: In a real app, update this via your Auth Context, not direct localStorage */}
        <p className="text-xs text-emerald-500 mt-4">Profile synchronization required...</p>
      </div>
    );
  }

  // BUG FIX: Prevent division by zero
  const totalAvailable = filteredDrills.length || 0;
  const completionRate = totalAvailable > 0 
    ? (player.completedDrills.filter(id => filteredDrills.some(d => d.id === id)).length / totalAvailable) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Player Stats Dashboard */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <Flame className="h-4 w-4 text-emerald-500 mb-2" />
          <p className="text-2xl font-bold">{player.completedDrills.length}</p>
          <p className="text-xs text-zinc-400">Total Drills Done</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <Target className="h-4 w-4 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{totalAvailable}</p>
          <p className="text-xs text-zinc-400">Available for {player.position}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <Activity className="h-4 w-4 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{Math.round(completionRate)}%</p>
          <p className="text-xs text-zinc-400">Position Progress</p>
        </div>
      </div>

      {/* Personalized Drill List */}
      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Your {player.position.toUpperCase()} Training Plan
        </h2>
        
        {totalAvailable === 0 ? (
          <div className="text-center py-10 text-zinc-500 italic">
            No drills found for this position. Stay tuned for updates!
          </div>
        ) : (
          filteredDrills.map((drill) => {
            const isCompleted = player.completedDrills.includes(drill.id);
            
            return (
              <div 
                key={drill.id}
                className={`border rounded-xl p-4 transition-all ${
                  isCompleted 
                    ? "border-emerald-500/30 bg-emerald-900/10" 
                    : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-sm">{drill.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        {drill.duration} min
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        drill.difficulty === 'advanced' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {drill.difficulty}
                      </span>
                    </div>
                    
                    <div className="space-y-1 mt-2">
                      {drill.coachingPoints.slice(0, 2).map((point, i) => (
                        <p key={i} className="text-xs text-zinc-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                          {point}
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => completeDrill(drill.id)}
                    disabled={isCompleted}
                    className={`ml-4 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isCompleted
                        ? "bg-emerald-500/20 text-emerald-400 cursor-default"
                        : "bg-emerald-500 text-black hover:bg-emerald-400"
                    }`}
                  >
                    {isCompleted ? "Completed ✓" : "Start Drill"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}