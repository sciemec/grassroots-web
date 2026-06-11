"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface PlayerProfile {
  id: string;
  name: string;
  position: "defender" | "midfielder" | "forward" | "goalkeeper";
  age: number;
  team: string;
  completedDrills: string[];
}

interface Drill {
  id: string;
  title: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  coachingPoints: string[];
  duration: number; // minutes
  videoUrl?: string;
}

const PlayerContext = createContext<{
  player: PlayerProfile | null;
  drills: Drill[];
  filteredDrills: Drill[];
  completeDrill: (drillId: string) => void;
} | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [drills, setDrills] = useState<Drill[]>([]);

  // Load player from localStorage or API
  useEffect(() => {
    const storedPlayer = localStorage.getItem("bhora_player_profile");
    if (storedPlayer) {
      setPlayer(JSON.parse(storedPlayer));
    }
    
    // Load drills from your JSON files
    loadDrills();
  }, []);

  const loadDrills = async () => {
    // Fetch from your API endpoint that reads the JSON files
    const response = await fetch("/api/drills/all");
    const data = await response.json();
    setDrills(data);
  };

  // Filter drills based on player's position
  const filteredDrills = drills.filter(drill => {
    if (!player) return true;
    
    // Map position to drill categories
    const positionCategories: Record<string, string[]> = {
      defender: ["marking", "intercepting", "tackling", "positioning", "defensive"],
      midfielder: ["passing", "pressing", "transition", "possession", "build-up"],
      forward: ["finishing", "movement", "shooting", "pressing", "attacking"],
      goalkeeper: ["shot-stopping", "distribution", "positioning", "reflexes"]
    };
    
    const allowedCategories = positionCategories[player.position] || [];
    return allowedCategories.some(cat => 
      drill.category.toLowerCase().includes(cat)
    );
  });

  const completeDrill = (drillId: string) => {
    if (player && !player.completedDrills.includes(drillId)) {
      const updated = {
        ...player,
        completedDrills: [...player.completedDrills, drillId]
      };
      setPlayer(updated);
      localStorage.setItem("bhora_player_profile", JSON.stringify(updated));
      
      // Track completion for Talent Passport
      trackMilestone(drillId);
    }
  };

  const trackMilestone = async (drillId: string) => {
    await fetch("/api/progress/milestone", {
      method: "POST",
      body: JSON.stringify({ playerId: player?.id, drillId })
    });
  };

  return (
    <PlayerContext.Provider value={{ player, drills, filteredDrills, completeDrill }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};