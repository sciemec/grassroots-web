// src/components/MatchHighlights.tsx
'use client';

import { useState, useEffect } from 'react';
import { Play, Youtube, ExternalLink, CheckCircle, Clock } from 'lucide-react';

interface Highlight {
  id: number;
  type: 'VERIFIED' | 'UNVERIFIED';
  title: string;
  description: string | null;
  url: string;
  embedUrl: string | null;
  imgUrl: string;
  channel: string;
  source: string;
}

export function MatchHighlights({ matchId }: { matchId: string }) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);

  useEffect(() => {
    fetchHighlights();
  }, [matchId]);

  const fetchHighlights = async () => {
    try {
      const response = await fetch(`/api/highlights/${matchId}`);
      const data = await response.json();
      setHighlights(data);
    } catch (err) {
      setError('Failed to load highlights');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
        <p className="text-gray-500 text-sm">Highlights will appear here after the match</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Youtube size={16} className="text-red-600" />
          Match Highlights
          <span className="text-[10px] font-normal text-gray-500 ml-2">
            {highlights.length} clips
          </span>
        </h3>
      </div>

      <div className="p-4">
        {/* Featured highlight (first one, large) */}
        {highlights[0] && (
          <div
            onClick={() => setSelectedHighlight(highlights[0])}
            className="relative rounded-xl overflow-hidden cursor-pointer group mb-4"
          >
            <img
              src={highlights[0].imgUrl}
              alt={highlights[0].title}
              className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <Play size={20} className="text-white ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-white text-sm font-medium truncate">{highlights[0].title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-white/70">{highlights[0].channel}</span>
                {highlights[0].type === 'VERIFIED' ? (
                  <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle size={8} /> Verified
                  </span>
                ) : (
                  <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock size={8} /> Live
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Remaining highlights grid */}
        {highlights.length > 1 && (
          <div className="grid grid-cols-2 gap-3">
            {highlights.slice(1, 5).map((highlight) => (
              <div
                key={highlight.id}
                onClick={() => setSelectedHighlight(highlight)}
                className="cursor-pointer group"
              >
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={highlight.imgUrl}
                    alt={highlight.title}
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <Play size={14} className="text-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-gray-700 mt-1 line-clamp-2">{highlight.title}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[8px] text-gray-400">{highlight.channel}</span>
                  {highlight.type === 'UNVERIFIED' && (
                    <span className="text-[7px] bg-yellow-100 text-yellow-700 px-1 rounded-full">Live</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View all link if more than 5 */}
        {highlights.length > 5 && (
          <button className="mt-3 text-xs text-[#1a5c2a] font-medium hover:underline">
            View all {highlights.length} highlights →
          </button>
        )}
      </div>

      {/* Video Modal */}
      {selectedHighlight && selectedHighlight.embedUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedHighlight(null)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative pb-[56.25%]">
              <iframe
                src={selectedHighlight.embedUrl}
                title={selectedHighlight.title}
                className="absolute inset-0 w-full h-full rounded-xl"
                allowFullScreen
              />
            </div>
            <button
              onClick={() => setSelectedHighlight(null)}
              className="mt-4 w-full py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}