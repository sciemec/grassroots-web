"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n"; // Initialise i18n safely

interface PlayerVector {
  id: string;
  number: number;
  label: string;
  team: "home" | "away";
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

interface SimulationFrame {
  [playerId: string]: { x: number; y: number };
}

interface TacticalSimulationBoardProps {
  initialVectors: PlayerVector[];
  animationSequence?: SimulationFrame[];
  isInteractive?: boolean;
}

export default function TacticalSimulationBoard({
  initialVectors,
  animationSequence = [],
  isInteractive = true,
}: TacticalSimulationBoardProps) {
  const { t } = useTranslation();
  const [vectors, setVectors] = useState<PlayerVector[]>(initialVectors);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const pitchRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle automated playback sequences (AI text-to-simulation parsing)
  useEffect(() => {
    if (isPlaying && animationSequence.length > 0) {
      if (currentFrameIndex < animationSequence.length) {
        animationRef.current = setTimeout(() => {
          const frame = animationSequence[currentFrameIndex];
          setVectors((prev) =>
            prev.map((v) => (frame[v.id] ? { ...v, x: frame[v.id].x, y: frame[v.id].y } : v))
          );
          setCurrentFrameIndex((prev) => prev + 1);
        }, 800); // Frame playback velocity steps
      } else {
        setIsPlaying(false);
        setCurrentFrameIndex(0);
      }
    }
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [isPlaying, currentFrameIndex, animationSequence]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const resetBoard = () => {
    setIsPlaying(false);
    setCurrentFrameIndex(0);
    setVectors(initialVectors);
  };

  return (
    <div className="w-full bg-[#1a3a23] rounded-2xl border border-white/20 p-4 shadow-inner relative overflow-hidden">
      {/* 2D Pitch Representation Canvas Frame */}
      <div 
        ref={pitchRef}
        className="w-full aspect-[4/3] border-2 border-white/40 rounded-xl relative bg-[#1a5c2a]"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "10% 100%"
        }}
      >
        {/* Pitch Markings (Center Circle Line) */}
        <div className="absolute top-1/2 left-1/2 w-1/4 h-1/3 border border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-0 left-1/2 h-full w-[1px] bg-white/30 pointer-events-none" />

        {/* Render Player Elements */}
        {vectors.map((player) => (
          <div
            key={player.id}
            className={`absolute w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md select-none transition-all duration-700 ease-in-out`}
            style={{
              left: `${player.x}%`,
              top: `${player.y}%`,
              backgroundColor: player.team === "home" ? "#c8962a" : "#ce1126",
              transform: "translate(-50%, -50%)",
              cursor: isInteractive ? "move" : "default"
            }}
          >
            {player.number}
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/60 text-[10px] text-white px-1 rounded">
              {player.label}
            </span>
          </div>
        ))}
      </div>

      {/* Controller Interface Row Layout */}
      <div className="flex justify-center gap-3 mt-8">
        <button
          onClick={togglePlayback}
          disabled={animationSequence.length === 0}
          className="bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-bold shadow hover:bg-gray-100 disabled:opacity-40"
        >
          {isPlaying ? t("tactics.pause") : t("tactics.play")}
        </button>
        <button
          onClick={resetBoard}
          className="border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold shadow hover:bg-white/10"
        >
          {t("tactics.reset")}
        </button>
      </div>
    </div>
  );
}