"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, Save, Edit2, CheckCircle, Globe, Heart } from "lucide-react";
import { PlayerSidebar } from "@/components/layout/player-sidebar";
import { useAuthStore } from "@/lib/auth-store";

export default function PlayerStoryPage() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [story, setStory] = useState("");
  const [savedStory, setSavedStory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`player_story_${user?.id}`);
    if (saved) {
      setStory(saved);
      setSavedStory(saved);
    } else {
      const defaultStory = `Hi, I'm ${user?.name || "a footballer"}. I play as a Right Back, and my dream is to represent my country at the highest level. 

I grew up playing on the streets of Harare, and Grassroots Sports has given me the platform to showcase my talent to the world. 

My strengths are my pace, crossing ability, and tactical awareness. I'm working every day to improve my game and get discovered.

Follow my journey as I chase my dreams! 🇿🇼⚽`;
      setStory(defaultStory);
      setSavedStory(defaultStory);
    }
  }, [user?.id, user?.name]);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem(`player_story_${user?.id}`, story);
    setSavedStory(story);
    setIsEditing(false);
    setIsSaving(false);
  };

  return (
    <div className="flex h-screen bg-gray-950">
      <PlayerSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/player" className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Hub</span>
            </Link>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                <Edit2 className="h-3 w-3" />
                Edit My Story
              </button>
            )}
          </div>

          {/* Hero Banner */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-900/50 to-blue-900/50 p-8 text-center border border-emerald-800/30">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
              <Mic className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Your Story Matters</h1>
            <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
              Scouts don't just look at stats. They want to know who you are, 
              where you come from, and what drives you.
            </p>
          </div>

          {/* Story Editor/Display */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/30 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-white">Your Public Story</h2>
              <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-[9px] text-emerald-400">
                Visible on your Arena profile
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  rows={12}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 p-4 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="Tell your story..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : <><Save className="h-4 w-4" /> Save Story</>}
                  </button>
                  <button
                    onClick={() => {
                      setStory(savedStory);
                      setIsEditing(false);
                    }}
                    className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                  {savedStory}
                </p>
                <div className="mt-6 flex items-center gap-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Heart className="h-4 w-4 fill-emerald-400" />
                    <span className="text-xs font-medium">Share your journey</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Authentic stories get noticed</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tips Card */}
          <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/20 p-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Tips for a great story</h3>
            <div className="mt-3 grid gap-2 text-xs text-gray-400">
              <p>✨ • Share your unique journey - what makes you different?</p>
              <p>✨ • Mention your biggest influences and role models</p>
              <p>✨ • Be honest about your strengths AND areas you're improving</p>
              <p>✨ • Include your goals - what do you want to achieve?</p>
              <p>✨ • Add personality - let your character shine through</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}