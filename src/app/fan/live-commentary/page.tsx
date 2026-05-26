"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Volume2, VolumeX, MessageSquare, Flame, Trophy, Clock } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";

interface CommentaryLine {
  id: string;
  minute: string;
  type: "goal" | "card" | "incident" | "general";
  team?: "home" | "away" | "neutral";
  text: string;
}

export default function FanLiveCommentaryPage() {
  const [isAudioLive, setIsAudioLive] = useState(false);
  const [commentaryFeed, setCommentaryFeed] = useState<CommentaryLine[]>([]);

  // Mock live database stream handshake mapping
  useEffect(() => {
    const staticFeed: CommentaryLine[] = [
      {
        id: "c-4",
        minute: "90+3'",
        type: "goal",
        team: "home",
        text: "GOAL!!! Dynamos FC dramatically snatch the lead late in injury time! A magnificent, blistering volley from the edge of the 18-yard box into the top right corner! The stadium erupts!"
      },
      {
        id: "c-3",
        minute: "86'",
        type: "card",
        team: "away",
        text: "Yellow Card issued to Highlanders FC central defender for a tactical foul, breaking up a dangerous counter-attack transition route."
      },
      {
        id: "c-2",
        minute: "74'",
        type: "incident",
        team: "neutral",
        text: "Substitution Match Break: Home side makes a double tactical shift to introduce fresh attacking speed dynamics out wide on the flanks."
      },
      {
        id: "c-1",
        minute: "61'",
        type: "general",
        text: "High-intensity midfield pressing battles block up central progression pathways. Both lines holding strict, solid structural shapes."
      }
    ];
    setCommentaryFeed(staticFeed);
  }, []);

  return (
    // CONTAINER CANVAS: Standardized light background system layout mapping
    <div className="flex h-screen bg-[#f4f2ee]">
      <Sidebar />

      <main className="flex-1 overflow-auto p-6">
        {/* Navigation Action Header */}
        <div className="mb-6 flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/player" className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Link>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#c8962a]">The Arena — Matchday Live</p>
              <h1 className="text-xl font-black text-gray-900">Live Text Commentary</h1>
            </div>
          </div>

          {/* High Visibility Interactive Audio Toggle Module */}
          <button
            onClick={() => setIsAudioLive(!isAudioLive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
              isAudioLive
                ? "bg-[#1a5c2a] border-[#1a5c2a] text-white shadow-md animate-pulse"
                : "bg-amber-50 border-amber-200 text-[#c8962a] hover:bg-amber-100/50"
            }`}
          >
            {isAudioLive ? (
              <>
                <Volume2 size={14} /> Audio Broadcast Live
              </>
            ) : (
              <>
                <VolumeX size={14} /> Listen Live Radio
              </>
            )}
          </button>
        </div>

        {/* Live Scoreboard Header Panel Block */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
          <div className="flex items-center justify-center gap-6 sm:gap-12">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900">Dynamos FC</h3>
              <p className="text-xs text-gray-500 font-bold mt-0.5">Home Side</p>
            </div>
            {/* FIXED SCORE METRIC DISPLAY CHIP: High visibility gold block color with deep readable values */}
            <div className="bg-[#f0b429] text-[#1c3d22] px-5 py-2.5 rounded-2xl text-xl sm:text-2xl font-black tracking-wider shadow-sm flex items-center gap-2">
              <span>1</span>
              <span className="text-sm opacity-60">:</span>
              <span>0</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900">Highlanders FC</h3>
              <p className="text-xs text-gray-500 font-bold mt-0.5">Away Side</p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-red-700">
            <Flame size={12} className="animate-pulse" /> Live In-Play · Second Half Injury Time
          </div>
        </div>

        {/* Live Feed Commentary Feed Stream Block Area */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 pl-1 mb-2">Match Timeline Events</p>
          
          {commentaryFeed.map((line) => {
            // Determine structural highlight properties dynamically based on data category
            const isGoal = line.type === "goal";
            const isCard = line.type === "card";
            
            return (
              <div 
                key={line.id} 
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-all flex gap-4 items-start ${
                  isGoal ? "border-l-4 border-l-[#1a5c2a] border-emerald-100 bg-emerald-50/10" : ""
                } ${
                  isCard ? "border-l-4 border-l-red-500 border-red-100" : ""
                }`}
              >
                {/* MINUTE DISPLAY BADGE: Yellow background with deep dark contrast text so it never becomes invisible */}
                <div className="bg-[#f0b429] text-[#1c3d22] px-3 py-1 rounded-xl text-xs font-black font-mono shrink-0 shadow-sm flex items-center gap-1">
                  <Clock size={11} />
                  {line.minute}
                </div>

                {/* Narrative Detail Area */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {isGoal && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-black uppercase text-[#1a5c2a]">
                        <Trophy size={10} /> Match Goal Point
                      </span>
                    )}
                    {isCard && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-black uppercase text-red-700">
                        Match Incident Caution
                      </span>
                    )}
                    {!isGoal && !isCard && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600">
                        Match Intelligence Note
                      </span>
                    )}
                  </div>

                  {/* MAIN TEXT BODY: Explicit deep charcoal color guarantees readability across devices */}
                  <p className="text-sm font-semibold leading-relaxed text-gray-900">
                    {line.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}