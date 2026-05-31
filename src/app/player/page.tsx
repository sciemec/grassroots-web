"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { PlayerSidebar } from "@/components/layout/player-sidebar";
import {
  Activity, TrendingUp, Users, Eye, Heart, Share2,
  Camera, Mic, Video, Image as ImageIcon, Award,
  Sparkles, Flame, Zap, Globe, Bell, MessageCircle,
  ArrowRight, CheckCircle, Clock, Calendar, Star, Shield
} from "lucide-react";

// Types
interface ArenaPost {
  id: string;
  content: string;
  mediaUrl?: string;
  likes: number;
  comments: number;
  timestamp: string;
}

interface BiometricData {
  overallForm: number;
  explosivePower: number;
  kneeAngle: number;
  symmetryScore: number;
  lastScan: string;
}

export default function PlayerHubPage() {
  const { user } = useAuthStore();
  const [hasBiometricScan, setHasBiometricScan] = useState(false);
  const [biometricData, setBiometricData] = useState<BiometricData | null>(null);
  const [arenaPosts, setArenaPosts] = useState<ArenaPost[]>([]);
  const [viewCount, setViewCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);

  // Load biometric data from localStorage
  useEffect(() => {
    const sessions = localStorage.getItem(`training_sessions_${user?.id}`);
    if (sessions) {
      const parsed = JSON.parse(sessions);
      if (parsed.length > 0) {
        setHasBiometricScan(true);
        setBiometricData({
          overallForm: parsed[0].metrics.overallForm,
          explosivePower: parsed[0].metrics.explosivePower,
          kneeAngle: parsed[0].metrics.kneeAngle,
          symmetryScore: parsed[0].metrics.symmetryScore,
          lastScan: parsed[0].timestamp
        });
      }
    }
    
    // Mock arena posts
    setArenaPosts([
      {
        id: "1",
        content: "Just finished my morning training session! Working on acceleration mechanics. #GrassrootsFamily",
        likes: 23,
        comments: 4,
        timestamp: new Date().toISOString()
      },
      {
        id: "2",
        content: "Proud to announce I've committed to the U20 National Team trials next month! 🇿🇼",
        likes: 127,
        comments: 18,
        timestamp: new Date(Date.now() - 86400000).toISOString()
      }
    ]);
    
    setViewCount(23);
    setFollowerCount(47);
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-950">
      <PlayerSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
          
          {/* Welcome Banner */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-blue-900/40 p-5 border border-emerald-800/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                  Welcome Back, {user?.name?.split(" ")[0] || "Athlete"}! 👋
                </p>
                <h1 className="text-2xl font-black text-white mt-1">
                  Your Brand. Your Future.
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  You are LIVE on Arena — {viewCount} people viewed your profile this week
                </p>
              </div>
              <div className="flex gap-3">
                <div className="text-center">
                  <p className="text-xl font-black text-white">{followerCount}</p>
                  <p className="text-[10px] text-gray-500">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-emerald-400">{viewCount}</p>
                  <p className="text-[10px] text-gray-500">Views</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Biometric Scan Card */}
            <Link href="/player/train" className="group">
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center transition-all hover:border-emerald-500 hover:bg-gray-900">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-500">
                  <Camera className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-white">AI Training Lab</p>
                <p className="text-[9px] text-gray-500 mt-1">
                  {hasBiometricScan ? "Update your scan" : "Take 30s assessment"}
                </p>
                {!hasBiometricScan && (
                  <span className="mt-2 inline-block text-[9px] font-bold text-emerald-400">
                    Get discovered →
                  </span>
                )}
              </div>
            </Link>

            {/* Brand Story Card */}
            <Link href="/player/story">
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center transition-all hover:border-emerald-500 hover:bg-gray-900">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/20 text-blue-500">
                  <Mic className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-white">My Story</p>
                <p className="text-[9px] text-gray-500">Tell what makes you unique</p>
              </div>
            </Link>

            {/* Arena Post Card */}
            <Link href="/arena">
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center transition-all hover:border-emerald-500 hover:bg-gray-900">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-600/20 text-purple-500">
                  <Globe className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-white">Arena Feed</p>
                <p className="text-[9px] text-gray-500">Share with your network</p>
              </div>
            </Link>

            {/* Media Upload Card */}
            <Link href="/player/media">
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center transition-all hover:border-emerald-500 hover:bg-gray-900">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-600/20 text-amber-500">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-white">Media Gallery</p>
                <p className="text-[9px] text-gray-500">Upload photos & videos</p>
              </div>
            </Link>
          </div>

          {/* Biometric Metrics Card (if available) */}
          {biometricData && (
            <div className="mb-6 rounded-2xl border border-emerald-800/30 bg-gradient-to-r from-gray-900 to-gray-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-sm font-bold text-white">Your Biometric Profile</h2>
                </div>
                <Link href="/player/train" className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300">
                  Update →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Overall Form</p>
                  <p className="text-xl font-black text-emerald-400">{biometricData.overallForm}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Explosive Power</p>
                  <p className="text-xl font-black text-white">{biometricData.explosivePower}%</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Knee Drive</p>
                  <p className="text-xl font-black text-white">{biometricData.kneeAngle}°</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase">Symmetry</p>
                  <p className="text-xl font-black text-white">{biometricData.symmetryScore}%</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-gray-500">
                Last scan: {new Date(biometricData.lastScan).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Arena Public Profile Preview */}
          <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900/30 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-500" />
                <h2 className="text-sm font-bold text-white">Your Arena Profile (Public)</h2>
              </div>
              <Link href="/arena/profile/me" className="text-[10px] font-bold text-emerald-400">
                View Public Profile →
              </Link>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {user?.name?.[0]?.toUpperCase() || "P"}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-white">{user?.name || "Player"}</p>
                  <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                    Right Back
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Form Score: 84 • ⚡ 47 followers</p>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  Dedicated right-back with explosive pace and precision crossing. 
                  Looking to take my game to the next level.
                </p>
                <div className="mt-3 flex gap-3">
                  <button className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-emerald-400">
                    <Heart className="h-3 w-3" /> Support
                  </button>
                  <button className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-emerald-400">
                    <Share2 className="h-3 w-3" /> Share
                  </button>
                  <button className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-emerald-400">
                    <MessageCircle className="h-3 w-3" /> Message
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Arena Posts */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-500" />
                <h2 className="text-sm font-bold text-white">Recent Activity</h2>
              </div>
              <Link href="/arena" className="text-[10px] font-bold text-gray-500 hover:text-emerald-400">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {arenaPosts.map((post) => (
                <div key={post.id} className="rounded-xl border border-gray-800 bg-gray-900/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-600/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-400">
                        {user?.name?.[0]?.toUpperCase() || "P"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{user?.name}</p>
                        <span className="text-[9px] text-gray-500">
                          {new Date(post.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">{post.content}</p>
                      <div className="mt-3 flex gap-4">
                        <button className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-emerald-400">
                          <Heart className="h-3 w-3" /> {post.likes}
                        </button>
                        <button className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-emerald-400">
                          <MessageCircle className="h-3 w-3" /> {post.comments}
                        </button>
                        <button className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-emerald-400">
                          <Share2 className="h-3 w-3" /> Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Development Cards */}
          <div>
            <h2 className="mb-3 text-sm font-bold text-white">Develop Yourself</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link href="/player/success" className="group">
                <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4 transition-all hover:border-emerald-500">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-emerald-600/20 p-2">
                      <Flame className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Success Engine</p>
                      <p className="text-[10px] text-gray-500">Set goals, track progress</p>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/player/progress" className="group">
                <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4 transition-all hover:border-emerald-500">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-600/20 p-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">My Progress</p>
                      <p className="text-[10px] text-gray-500">Track your improvement</p>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/player/showcase" className="group">
                <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4 transition-all hover:border-emerald-500">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-600/20 p-2">
                      <Video className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Showcase</p>
                      <p className="text-[10px] text-gray-500">Upload skill clips</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}