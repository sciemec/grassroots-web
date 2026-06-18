// src/app/admin/stream/page.tsx
'use client';

import { useState } from 'react';
import { Play, StopCircle, RefreshCw } from 'lucide-react';

export default function StreamControlPage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Idle');

  const startStream = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stream/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: 'current-match',
          audioUrl: 'https://your-audio-source.com/commentary.mp3'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setIsStreaming(true);
        setStatus('Streaming Live');
      }
    } catch (error) {
      console.error('Failed to start stream:', error);
      setStatus('Error');
    } finally {
      setIsLoading(false);
    }
  };

  const stopStream = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stream/stop', {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        setIsStreaming(false);
        setStatus('Stopped');
      }
    } catch (error) {
      console.error('Failed to stop stream:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Stream Control</h1>
        
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold">Icecast Stream</h2>
              <p className="text-sm text-gray-500">Server: 139.84.250.73:8000</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm font-medium">{status}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={startStream}
              disabled={isStreaming || isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={18} />
              Start Stream
            </button>
            
            <button
              onClick={stopStream}
              disabled={!isStreaming || isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <StopCircle size={18} />
              Stop Stream
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Stream Info</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Mount Point:</span>
                <span className="ml-2 font-mono text-gray-700">/live</span>
              </div>
              <div>
                <span className="text-gray-500">Listen URL:</span>
                <a 
                  href="http://139.84.250.73:8000/live"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:underline font-mono text-xs"
                >
                  http://139.84.250.73:8000/live
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}