// src/components/CommentarySettings.tsx
'use client';

import { useState } from 'react';
import { Settings, Volume2, Mic, Music, Globe } from 'lucide-react';
import { VoiceSelector } from './VoiceSelector';
import { BackgroundAudio } from './BackgroundAudio';

export function CommentarySettings({ isLive, onVoiceChange, onRateChange, onPitchChange }: { 
  isLive: boolean;
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
  onRateChange: (rate: number) => void;
  onPitchChange: (pitch: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [rate, setRate] = useState(0.95);
  const [pitch, setPitch] = useState(1.0);
  const [selectedAccent, setSelectedAccent] = useState('british');

  const accents = [
    { value: 'british', label: '🇬🇧 British', lang: 'en-GB' },
    { value: 'american', label: '🇺🇸 American', lang: 'en-US' },
    { value: 'australian', label: '🇦🇺 Australian', lang: 'en-AU' },
    { value: 'southAfrican', label: '🇿🇦 South African', lang: 'en-ZA' },
    { value: 'indian', label: '🇮🇳 Indian', lang: 'en-IN' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-700"
      >
        <Settings size={12} />
        Commentary Settings
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Mic size={14} /> Voice Settings</h3>
          
          {/* Voice selector */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Commentator Voice</label>
            <VoiceSelector onVoiceChange={onVoiceChange} />
          </div>
          
          {/* Accent selector */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1 flex items-center gap-1"><Globe size={10} /> Accent</label>
            <select
              value={selectedAccent}
              onChange={(e) => setSelectedAccent(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
            >
              {accents.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          
          {/* Speed control */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Speech Speed: {rate}x</label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={rate}
              onChange={(e) => { setRate(parseFloat(e.target.value)); onRateChange(parseFloat(e.target.value)); }}
              className="w-full"
            />
          </div>
          
          {/* Pitch control */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Voice Pitch: {pitch}</label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={pitch}
              onChange={(e) => { setPitch(parseFloat(e.target.value)); onPitchChange(parseFloat(e.target.value)); }}
              className="w-full"
            />
          </div>
          
          {/* Background atmosphere */}
          <div className="pt-2 border-t border-gray-100">
            <label className="text-[10px] text-gray-500 block mb-1 flex items-center gap-1"><Music size={10} /> Background Atmosphere</label>
            <BackgroundAudio isLive={isLive} />
          </div>
        </div>
      )}
    </div>
  );
}