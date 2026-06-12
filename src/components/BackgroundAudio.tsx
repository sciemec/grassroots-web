// src/components/BackgroundAudio.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

const ATMOSPHERE_TRACKS = {
  stadium: '/sounds/stadium-ambience.mp3',
  crowd: '/sounds/crowd-cheer.mp3',
  quiet: '/sounds/quiet-ambience.mp3',
  none: null
};

export function BackgroundAudio({ isLive }: { isLive: boolean }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedAtmosphere, setSelectedAtmosphere] = useState<keyof typeof ATMOSPHERE_TRACKS>('stadium');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isLive || !isEnabled || selectedAtmosphere === 'none') {
      audioRef.current?.pause();
      return;
    }
    
    const track = ATMOSPHERE_TRACKS[selectedAtmosphere];
    if (track && audioRef.current) {
      audioRef.current.src = track;
      audioRef.current.loop = true;
      audioRef.current.volume = 0.2;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  }, [isLive, isEnabled, selectedAtmosphere]);

  if (!isLive) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
        title={isEnabled ? 'Mute atmosphere' : 'Enable atmosphere'}
      >
        {isEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </button>
      
      {isEnabled && (
        <select
          value={selectedAtmosphere}
          onChange={(e) => setSelectedAtmosphere(e.target.value as any)}
          className="text-[10px] bg-gray-100 rounded-lg px-2 py-1.5 border border-gray-200"
        >
          <option value="stadium">🏟️ Stadium</option>
          <option value="crowd">🗣️ Crowd</option>
          <option value="quiet">🔇 Quiet</option>
          <option value="none">🚫 Off</option>
        </select>
      )}
    </div>
  );
}