"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2, Award, User } from "lucide-react";

// Mock data representing a localized academy player feed
const MOCK_REELS = [
  {
    id: "reel-1",
    author: "Tinashe Moyo",
    academy: "Harare Grassroots Academy",
    caption: "Perfecting the high knee drive test sequence. Stride length feeling explosive! 📈⚽",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // Replace with your CDN bucket path
    likes: 124,
    comments: 18
  },
  {
    id: "reel-2",
    author: "Blessing Chikwanda",
    academy: "Bulawayo Juniors",
    caption: "Midfield counter-press block drill. Always talking, always shifting! 🛡️⚡",
    videoUrl: "https://www.w3schools.com/html/movie.mp4", 
    likes: 98,
    comments: 7
  }
];

export default function GrassrootsSocialFeed() {
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    setLiked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex justify-center bg-black min-h-screen w-full sm:p-4">
      {/* Scroll Container mimicking TikTok/Instagram layout */}
      <div className="w-full max-w-md h-[100vh] sm:h-[85vh] overflow-y-scroll snap-y snap-mandatory border-none sm:border sm:rounded-2xl bg-zinc-950 relative scrollbar-none">
        
        {MOCK_REELS.map((reel) => (
          <div key={reel.id} className="w-full h-full snap-start snap-always relative flex items-center justify-center bg-black">
            
            {/* The Streaming Video Component */}
            <video 
              src={reel.videoUrl}
              loop
              muted
              controlsList="nodownload"
              playsInline
              className="w-full h-full object-cover"
              onClick={(e) => {
                const v = e.currentTarget;
                v.paused ? v.play() : v.pause();
              }}
            />

            {/* Right Action Menu Bar */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5 z-10 text-white">
              <button 
                onClick={() => toggleLike(reel.id)} 
                className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
              >
                <Heart className={`h-7 w-7 ${liked[reel.id] ? "fill-red-500 text-red-500" : "text-white"}`} />
                <span className="text-xs font-semibold">{liked[reel.id] ? reel.likes + 1 : reel.likes}</span>
              </button>

              <button className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                <MessageCircle className="h-7 w-7 text-white" />
                <span className="text-xs font-semibold">{reel.comments}</span>
              </button>

              <button className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                <Share2 className="h-7 w-7 text-white" />
                <span className="text-xs font-semibold">Share</span>
              </button>
            </div>

            {/* Bottom Overlay Text Panel */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center border border-zinc-500">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1">
                    {reel.author}
                    <Award className="h-3.5 w-3.5 text-blue-400 fill-blue-400" />
                  </h3>
                  <p className="text-[11px] text-zinc-300">{reel.academy}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed pl-1">
                {reel.caption}
              </p>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}