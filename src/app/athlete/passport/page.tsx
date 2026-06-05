
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Share2, QrCode, Award, Target, Loader2, Copy, Check } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

interface BiometricResult {
  id: string;
  testType: string;
  rawScore: string;
  percentile: number;
  tier: string;
  date: string;
  scoutNarrative: string;
  recommendedPositions: string[];
  suggestedDrills: string[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  sport?: string;
  province?: string;
  age_group?: string;
  bio?: string;
}

export default function AthletePassportPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [biometrics, setBiometrics] = useState<BiometricResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadPassportData();
  }, [hasHydrated, user, router]);

  const loadPassportData = async () => {
    setIsLoading(true);
    
    try {
      // Load profile
      const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.data || profileData);
      } else {
        setProfile(user as UserProfile);
      }

      // Load biometric results
      const bioRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/biometrics/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (bioRes.ok) {
        const bioData = await bioRes.json();
        setBiometrics(bioData.results || []);
      }

      // Generate QR code (using external library or simple data URL)
      const publicUrl = `${window.location.origin}/athlete/public/${user?.id}`;
      // Simple QR generation using an API (or you can use qrcode library)
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`);
      
    } catch (error) {
      console.error("Failed to load passport data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const shareViaWhatsApp = () => {
    if (!profile) return;
    const publicUrl = `${window.location.origin}/athlete/public/${user?.id}`;
    const text = `🏅 Check out ${profile.name}'s Talent Passport!\n\nSport: ${profile.sport || "Multi-sport"}\nBest Score: ${getBestPercentile()}th percentile\nTier: ${getBestTier()}\n\nView full profile: ${publicUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyShareLink = () => {
    const publicUrl = `${window.location.origin}/athlete/public/${user?.id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBestPercentile = () => {
    if (biometrics.length === 0) return 0;
    return Math.max(...biometrics.map(b => b.percentile));
  };

  const getBestTier = () => {
    if (biometrics.length === 0) return "Not assessed";
    const best = biometrics.reduce((best, current) => 
      current.percentile > best.percentile ? current : best
    );
    return best.tier;
  };

  const getLatestNarrative = () => {
    if (biometrics.length === 0) return "Complete a biometric scan to get your personalized scouting report.";
    return biometrics[0].scoutNarrative;
  };

  const downloadPDF = async () => {
    // Dynamic import jsPDF
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(26, 92, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Talent Passport", 20, 25);
    doc.setFontSize(10);
    doc.text(profile?.name || "Athlete", 20, 35);
    
    // Bio section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("Athlete Information", 20, 55);
    doc.setFontSize(10);
    doc.text(`Sport: ${profile?.sport || "Multi-sport"}`, 20, 65);
    doc.text(`Province: ${profile?.province || "Zimbabwe"}`, 20, 72);
    doc.text(`Age Group: ${profile?.age_group || "Senior"}`, 20, 79);
    
    // Stats
    doc.setFontSize(12);
    doc.text("Performance Statistics", 20, 95);
    doc.setFontSize(10);
    doc.text(`Best Percentile: ${getBestPercentile()}th`, 20, 105);
    doc.text(`Tier: ${getBestTier()}`, 20, 112);
    doc.text(`Tests Completed: ${biometrics.length}`, 20, 119);
    
    // Scout Narrative
    doc.setFontSize(12);
    doc.text("Scout Assessment", 20, 140);
    doc.setFontSize(9);
    const narrative = getLatestNarrative();
    const splitNarrative = doc.splitTextToSize(narrative, 170);
    doc.text(splitNarrative, 20, 150);
    
    // Footer
    doc.setFillColor(240, 180, 41);
    doc.rect(0, 270, 210, 10, 'F');
    doc.setTextColor(26, 92, 42);
    doc.setFontSize(8);
    doc.text("Generated by GrassRoots Sports - Identify · Nurture · Market", 105, 277, { align: "center" });
    
    doc.save(`talent-passport-${profile?.name?.replace(/\s/g, "-") || "athlete"}.pdf`);
  };

  if (!hasHydrated || isLoading) {
    return (
      <div className="flex h-screen bg-[#f4f2ee] items-center justify-center">
        <Loader2 className="animate-spin text-[#1a5c2a]" size={32} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f2ee]">
      <Sidebar />
      
      <main className="flex-1 lg:ml-72 p-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/athlete" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1a5c2a] to-[#2a6e3a] p-6 text-white text-center">
              <h1 className="text-2xl font-black">Talent Passport</h1>
              <p className="text-white/80 mt-1">{profile?.name} · {profile?.sport || "Athlete"}</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Award size={20} className="mx-auto text-[#f0b429] mb-2" />
                  <p className="text-2xl font-black text-gray-900">{getBestPercentile()}th</p>
                  <p className="text-[10px] text-gray-500">Best Percentile</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Target size={20} className="mx-auto text-[#1a5c2a] mb-2" />
                  <p className="text-sm font-black text-gray-900">{getBestTier()}</p>
                  <p className="text-[10px] text-gray-500">Current Tier</p>
                </div>
              </div>

              {/* Scout Narrative */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Scout Assessment</h3>
                <p className="text-sm text-gray-600">{getLatestNarrative()}</p>
              </div>

              {/* Test History */}
              {biometrics.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Test History</h3>
                  <div className="space-y-2">
                    {biometrics.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {test.testType.replace(/_/g, " ")}
                          </p>
                          <p className="text-[10px] text-gray-400">{new Date(test.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-gray-900">{test.rawScore}</p>
                          <p className="text-[10px] text-gray-500">{test.percentile}th percentile</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QR Code */}
              {qrUrl && (
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold text-gray-700 mb-2">SCAN TO VIEW PROFILE</p>
                  <img src={qrUrl} alt="Talent Passport QR" className="w-32 h-32 mx-auto" />
                  <button
                    onClick={copyShareLink}
                    className="mt-2 text-xs text-[#1a5c2a] font-bold flex items-center justify-center gap-1 mx-auto"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied!" : "Copy share link"}
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={downloadPDF}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download PDF
                </button>
                <button
                  onClick={shareViaWhatsApp}
                  className="flex-1 bg-[#25D366] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#20b859] flex items-center justify-center gap-2"
                >
                  <Share2 size={16} /> Share via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}