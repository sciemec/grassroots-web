// src/components/coaching/VideoCall.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import * as Icons from "lucide-react";
import { VideoCallConfig } from "@/types/coaching";

interface VideoCallProps {
  roomUrl: string;
  roomName: string;
  token?: string;
  isCoach: boolean;
  coachName: string;
  playerName: string;
  sessionId: string;
  onEndCall: () => void;
  onRecording?: (url: string) => void;
}

export default function VideoCall({
  roomUrl,
  roomName,
  token,
  isCoach,
  coachName,
  playerName,
  sessionId,
  onEndCall,
  onRecording,
}: VideoCallProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState(1);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Daily.co or Jitsi
  useEffect(() => {
    setIsLoading(true);

    // Determine which provider
    const isDaily = roomUrl.includes('daily.co');
    const isJitsi = roomUrl.includes('meet.jit.si');

    if (isDaily) {
      // Daily.co integration - load via iframe
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.async = true;
      script.onload = () => {
        setIsLoading(false);
        setIsConnected(true);
      };
      document.head.appendChild(script);
    } else if (isJitsi) {
      // Jitsi integration - load via iframe
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => {
        setIsLoading(false);
        setIsConnected(true);
      };
      document.head.appendChild(script);
    } else {
      setIsLoading(false);
      setError('Unsupported video provider');
    }

    // Start timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [roomUrl]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onEndCall();
  };

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-white">
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
          <span className="text-xs text-gray-400">
            {formatDuration(duration)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">
            {participants} participant{participants !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-gray-400">
            {coachName} • {playerName}
          </span>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative aspect-video bg-gray-950">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Icons.Loader2 className="animate-spin text-[#f0b429]" size={48} />
            <p className="text-gray-400 ml-3">Loading video call...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Icons.AlertCircle className="text-red-500" size={48} />
            <p className="text-red-400 mt-3">{error}</p>
            <p className="text-gray-500 text-sm mt-1">Please try refreshing the page</p>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={roomUrl}
            className="w-full h-full border-0"
            allow="camera; microphone; display-capture; autoplay; encrypted-media"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        )}

        {/* Connection Status Overlay */}
        {!isConnected && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <Icons.WifiOff className="text-gray-500" size={48} />
            <p className="text-gray-400 ml-3">Reconnecting...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-3 rounded-full transition-colors ${
            isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <Icons.MicOff className="text-white" size={20} />
          ) : (
            <Icons.Mic className="text-white" size={20} />
          )}
        </button>

        <button
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`p-3 rounded-full transition-colors ${
            isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoOff ? (
            <Icons.VideoOff className="text-white" size={20} />
          ) : (
            <Icons.Video className="text-white" size={20} />
          )}
        </button>

        <button
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={`p-3 rounded-full transition-colors ${
            isScreenSharing ? 'bg-[#f0b429]' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Share Screen"
        >
          <Icons.Monitor className={isScreenSharing ? 'text-black' : 'text-white'} size={20} />
        </button>

        <button
          onClick={() => {
            setIsRecording(!isRecording);
            if (!isRecording && onRecording) {
              onRecording(`recording_${sessionId}_${Date.now()}.webm`);
            }
          }}
          className={`p-3 rounded-full transition-colors ${
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Record"
        >
          <Icons.Record className={isRecording ? 'text-white' : 'text-white'} size={20} />
        </button>

        <button
          onClick={handleEndCall}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-bold transition-colors flex items-center gap-2"
        >
          <Icons.PhoneOff size={18} />
          End Call
        </button>
      </div>
    </div>
  );
}