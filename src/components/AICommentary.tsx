// src/components/AICommentary.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2, MicOff, Radio, Loader2 } from 'lucide-react';
import { VoiceSelector } from './VoiceSelector';
import { BackgroundAudio } from './BackgroundAudio';

interface AICommentaryProps {
  events: any[];
  isLive: boolean;
}

export function AICommentary({ events, isLive }: AICommentaryProps) {
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [currentCommentary, setCurrentCommentary] = useState('Select a live match to start AI commentary');
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const processedEvents = useRef<Set<string>>(new Set());
  const queueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speakText = (text: string) => {
    if (!synthRef.current || !isSpeaking) return;
    
    // Stop current speech if any
    if (isSpeakingRef.current) {
      synthRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = 1;
    
    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setIsLoading(false);
    };
    
    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (queueRef.current.length > 0) {
        const next = queueRef.current.shift();
        if (next) speakText(next);
      }
    };
    
    utterance.onerror = () => {
      isSpeakingRef.current = false;
    };
    
    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    if (!isLive) return;
    
    // Find new events
    const newEvents = events.filter(e => !processedEvents.current.has(e.id));
    
    for (const event of newEvents) {
      processedEvents.current.add(event.id);
      
      let commentary = '';
      switch (event.type) {
        case 'goal':
          commentary = `GOAL! ${event.player || 'A player'} scores for ${event.team}! What a strike!`;
          // Boost crowd volume on goal
          if (typeof window !== 'undefined' && (window as any).boostAudio) {
            (window as any).boostAudio();
          }
          break;
        case 'yellow_card':
          commentary = `Yellow card shown to ${event.player} of ${event.team}.`;
          break;
        case 'red_card':
          commentary = `RED CARD! ${event.player} is sent off for ${event.team}!`;
          break;
        case 'shot':
          commentary = event.onTarget 
            ? `${event.player} shoots... on target! The goalkeeper saves!`
            : `${event.player} takes a shot... just wide of the post!`;
          break;
        default:
          commentary = event.description || `${event.type} for ${event.team}.`;
      }
      
      setCurrentCommentary(commentary);
      
      if (isSpeaking) {
        if (isSpeakingRef.current) {
          queueRef.current.push(commentary);
        } else {
          speakText(commentary);
        }
      }
    }
  }, [events, isLive, isSpeaking, selectedVoice, speechRate, speechPitch]);

  return (
    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wide flex items-center gap-1">
            <Radio size={12} className="text-[#f0b429]" />
            AI LIVE COMMENTARY
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <VoiceSelector onVoiceChange={setSelectedVoice} currentVoice={selectedVoice} />
          <BackgroundAudio isLive={isLive} />
          <button
            onClick={() => setIsSpeaking(!isSpeaking)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-gray-200 transition"
          >
            {isSpeaking ? <Volume2 size={12} /> : <MicOff size={12} />}
            {isSpeaking ? "ON" : "OFF"}
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3 h-28 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full gap-2">
            <Loader2 size={16} className="animate-spin text-[#1a5c2a]" />
            <span className="text-xs text-gray-500">Speaking...</span>
          </div>
        ) : (
          <p className="text-sm text-gray-700 italic leading-relaxed">"{currentCommentary}"</p>
        )}
      </div>
      
      <div className="flex justify-between items-center mt-2 text-[9px] text-gray-400">
        <span className="flex items-center gap-1">
          <span>{selectedVoice ? `${selectedVoice.name}` : 'Default voice'}</span>
        </span>
        <span className="flex items-center gap-1">
          <span>Speed: {speechRate}x</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full mx-1" />
          <span>Pitch: {speechPitch}</span>
        </span>
      </div>
    </div>
  );
}