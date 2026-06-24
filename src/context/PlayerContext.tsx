'use client';
// src/context/PlayerContext.tsx
// Minimal stub used by NurtureLab.tsx

import { createContext, useContext } from 'react';

export interface PlayerDrill {
  id: string;
  title: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  coachingPoints: string[];
  category: string;
}

export interface PlayerProfile {
  position: string;
  completedDrills: string[];
}

interface PlayerContextValue {
  player: PlayerProfile | null;
  filteredDrills: PlayerDrill[];
  completeDrill: (id: string) => void;
}

const PlayerContext = createContext<PlayerContextValue>({
  player: null,
  filteredDrills: [],
  completeDrill: () => {},
});

export function usePlayer() {
  return useContext(PlayerContext);
}

export { PlayerContext };
