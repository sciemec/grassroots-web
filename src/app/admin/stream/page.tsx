// src/app/admin/stream/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, StopCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

export default function StreamControlPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Idle');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'admin') { router.replace('/dashboard'); }
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;

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
    } catch {
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
    } catch {
      // silently handled
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="gs-watermark overflow-auto p-6">
      <div className="max-w-4xl">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Stream Control</h1>
            <p className="text-sm text-muted-foreground">Live broadcast management</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold">Icecast Stream</h2>
              <p className="text-sm text-muted-foreground">Live audio broadcast server</p>
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
              className="flex items-center gap-2 px-4 py-3 rounded-lg border bg-muted text-muted-foreground hover:bg-muted/80 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold mb-2">Stream Info</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Mount Point:</span>
                <span className="ml-2 font-mono">/live</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}