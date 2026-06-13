"use client";

import React, { useState } from "react";
import { 
  Volume2, 
  VolumeX, 
  Languages, 
  Flame, 
  Activity, 
  RefreshCw, 
  PlayCircle 
} from "lucide-react";

export interface LiveMatchEvent {
  minute: number;
  playerName: string;
  teamName: string;
  eventType: "GOAL" | "DANGEROUS_ATTACK" | "YELLOW_CARD";
}

export default function AudioCommentaryPanel() {
  // Available regional dialects mapping
  const languages = [
    { code: "shona", label: "ChiShona", flag: "🇿🇼" },
    { code: "ndebele", label: "isiNdebele", flag: "🇿🇼" },
    { code: "zulu", label: "isiZulu", flag: "🇿🇦" },
    { code: "tswana", label: "Setswana", flag: "🇿🇦" },
  ];

  const [selectedLang, setSelectedLang] = useState("shona");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScript, setCurrentScript] = useState<string>("");

  // Simulated live event payload (mirrors incoming match feeds like the layout in 1001049401.jpg)
  const currentEvent: LiveMatchEvent = {
    minute: 78,
    playerName: "Jader Rafael Obrian",
    teamName: "Los Angeles FC",
    eventType: "DANGEROUS_ATTACK"
  };

  const processAudioCommentary = async () => {
    setIsLoading(true);
    setCurrentScript("");
    
    try {
      // 1. Post target telemetry payload to your Next.js localized API route
      const response = await fetch("/api/commentary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentEvent,
          language: selectedLang
        })
      });

      const data = await response.json();
      
      if (!data.success) throw new Error("Script generation failed");
      
      setCurrentScript(data.script);
      setIsPlaying(true);

      // 2. Client-Side Voice Engine Core Execution Line
      // For maximum compatibility, we route through standard synthesis, 
      // but this text parameter plugs directly into your Azure Neural/ElevenLabs audio element stream.
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel(); // Flush queue
        const utterance = new SpeechSynthesisUtterance(data.script);
        
        // Dynamically adjust speech rate profile based on event tension
        utterance.rate = currentEvent.eventType === "GOAL" ? 1.15 : 1.02;
        
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback for custom audio streaming endpoints
        console.log("Speech synthesis unsupported. Routing to audio wave stream element array.");
        setIsPlaying(false);
      }

    } catch (error) {
      console.error("Audio streaming layer error:", error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudioBroadcast = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden max-w-md mx-auto">
      
      {/* Panel Identity Header banner */}
      <div className="bg-gradient-to-r from-gray-900 to-sky-950 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center text-white">
            <Volume2 size={16} className={isPlaying ? "animate-bounce" : ""} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider">Live Commentary Deck</h3>
            <p className="text-[10px] text-gray-400">Localized digital audio telemetry translator</p>
          </div>
        </div>
        
        <span className="flex items-center gap-1 text-[9px] font-bold bg-white/10 px-2 py-0.5 rounded-md text-emerald-400 uppercase tracking-widest">
          <Activity size={10} className="animate-pulse" /> Engine Live
        </span>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Language selector Grid Layout */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Languages size={12} /> Broadcast Language Dialect
          </label>
          <div className="grid grid-cols-2 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLang(lang.code)}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  selectedLang === lang.code
                    ? "bg-pink-50 border-pink-300 text-pink-700 shadow-xs"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-sm">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Action Trigger Zone */}
        <div className="pt-2">
          {isLoading ? (
            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-gray-200"
            >
              <RefreshCw size={14} className="animate-spin" /> Translating dialect structures without loss...
            </button>
          ) : isPlaying ? (
            <button
              onClick={stopAudioBroadcast}
              className="w-full bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all shadow-sm"
            >
              <VolumeX size={14} /> Mute Live Audio Commentary Feed
            </button>
          ) : (
            <button
              onClick={processAudioCommentary}
              className="w-full bg-[#1a5c2a] text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-800 transition-all shadow-md shadow-green-900/10"
            >
              <PlayCircle size={14} /> Initialize Voice Stream ({currentEvent.minute}')
            </button>
          )}
        </div>

        {/* Live Generated Script Overlay Display Card */}
        {currentScript && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1 animate-fadeIn">
            <div className="flex items-center gap-1 text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
              <Flame size={10} className="text-pink-500 fill-pink-500" /> Transcription Output
            </div>
            <p className="text-xs text-gray-700 leading-relaxed italic">
              "{currentScript}"
            </p>
          </div>
        )}

      </div>
    </div>
  );
}