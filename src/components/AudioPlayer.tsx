// src/components/AudioPlayer.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';

interface AudioPlayerProps {
  streamUrl?: string;
  matchId?: string;
  isLive?: boolean;
}

export function AudioPlayer({ streamUrl, matchId, isLive }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [error, setError] = useState<string | null>(null);
  const [isStreamLive, setIsStreamLive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Default stream URL
  const defaultStreamUrl = 'http://139.84.250.73:8000/live';
  const audioUrl = streamUrl || defaultStreamUrl;

  // Check if stream is live
  useEffect(() => {
    const checkStream = async () => {
      try {
        const response = await fetch('/api/stream/status');
        const data = await response.json();
        setIsStreamLive(data.isLive);
      } catch (error) {
        console.error('Failed to check stream:', error);
        setIsStreamLive(false);
      }
    };

    checkStream();
    const interval = setInterval(checkStream, 10000);
    return () => clearInterval(interval);
  }, []);

  // Initialize audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'none';
      audioRef.current.crossOrigin = 'anonymous';
      
      // Event listeners
      audioRef.current.addEventListener('play', () => setIsPlaying(true));
      audioRef.current.addEventListener('pause', () => setIsPlaying(false));
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
      audioRef.current.addEventListener('error', (e) => {
        setError('Failed to load stream');
        setIsPlaying(false);
        setIsLoading(false);
      });
      audioRef.current.addEventListener('waiting', () => setIsLoading(true));
      audioRef.current.addEventListener('canplay', () => setIsLoading(false));
      
      // Update volume when audio is ready
      audioRef.current.volume = volume / 100;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Set source if not set
      if (!audioRef.current.src) {
        audioRef.current.src = audioUrl;
      }
      
      audioRef.current.play()
        .catch((err) => {
          console.error('Playback failed:', err);
          setError('Unable to play stream');
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  // If stream is not live, show a message
  if (!isStreamLive && !streamUrl) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 text-center">
        <div className="text-4xl mb-3">🔴</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No Live Stream</h3>
        <p className="text-sm text-gray-500">The match commentary stream is currently offline.</p>
        <p className="text-xs text-gray-400 mt-2">Stream will start automatically when commentary is available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isPlaying 
              ? 'bg-[#1a5c2a] hover:bg-[#0d3d1a]' 
              : 'bg-[#f0b429] hover:bg-[#d6a020]'
          } text-white`}
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={20} fill="white" />
          ) : (
            <Play size={20} fill="white" className="ml-0.5" />
          )}
        </button>

        {/* Stream Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 text-sm">Live Commentary</h4>
            {isPlaying && (
              <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {isPlaying ? 'Now playing' : 'Click play to listen'}
          </p>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#1a5c2a]"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}