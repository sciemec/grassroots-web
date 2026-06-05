"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Users, Dumbbell, Eye, Heart, Activity, Loader2 } from "lucide-react";

const ROLES = [
  { 
    role: "player", 
    title: "Football Player", 
    description: "Get scouted, track progress, access drills",
    icon: Dumbbell,
    href: "/register/player",
    color: "from-emerald-600 to-green-700"
  },
  { 
    role: "athlete", 
    title: "Athlete", 
    description: "Any sport. Biometric analysis. Get discovered.",
    icon: Activity,
    href: "/register/athlete",
    color: "from-blue-600 to-cyan-700"
  },
  { 
    role: "coach", 
    title: "Coach", 
    description: "Manage squad, assign drills, track talent",
    icon: Users,
    href: "/register/coach",
    color: "from-amber-600 to-orange-700"
  },
  { 
    role: "scout", 
    title: "Scout", 
    description: "Discover talent, generate reports, shortlist",
    icon: Eye,
    href: "/register/scout",
    color: "from-purple-600 to-indigo-700"
  },
  { 
    role: "fan", 
    title: "Fan / Supporter", 
    description: "Discover local talent, share passports",
    icon: Heart,
    href: "/register/fan",
    color: "from-rose-600 to-pink-700"
  },
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const role = searchParams?.get("role");
    const name = searchParams?.get("name");
    const pipeline = searchParams?.get("pipeline");

    // ⚡ SAFE PIPELINE INTERCEPTION
    // Redirects incoming sandbox users directly to their designated wizard folder
    if (pipeline === "complete" && role) {
      router.replace(`/register/${role}?name=${encodeURIComponent(name || "")}&pipeline=complete`);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center p-6 selection:bg-[#f0b429]/30 antialiased">
      <div className="max-w-4xl w-full">
        
        <div className="text-center mb-8 space-y-2">
          <div className="bg-[#1c3d22] text-[#f0b429] inline-flex p-2 rounded-xl font-black text-xs uppercase tracking-wider shadow-2xs">
            GRS Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 uppercase">
            Join GrassRoots Sports
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-gray-500 max-w-md mx-auto">
            Select your role below to initialize your customized grassroots development profile.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.role}
                href={role.href}
                className={`bg-gradient-to-r ${role.color} p-6 rounded-2xl text-white hover:shadow-lg transition-all hover:-translate-y-0.5 group flex flex-col justify-between h-44`}
              >
                <div>
                  <Icon size={32} className="mb-3 transition-transform group-hover:scale-105" />
                  <h2 className="text-xl font-bold uppercase tracking-wide">{role.title}</h2>
                  <p className="text-white/80 text-sm mt-1 leading-relaxed">{role.description}</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/90 group-hover:text-white mt-2 block">
                  Join Profile →
                </span>
              </Link>
            );
          })}
        </div>
        
        <p className="text-center text-xs text-gray-500 font-semibold mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-[#1a5c2a] font-bold underline tracking-wide ml-1">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f4f2ee] flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-[#1c3d22]" size={28} />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          Verifying Pipeline Trajectory...
        </p>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}