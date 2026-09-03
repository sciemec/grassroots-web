"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Camera,
  Loader2,
  ExternalLink,
  Brain,
  Sparkles,
  Copy,
  Award,
  Download,
  Users,
  ChevronDown,
} from "lucide-react";
import { HighlightReel } from "@/components/player/HighlightReel";
import { PlayerGamificationPanel } from "@/components/player/PlayerGamificationPanel";
import PlayerPassportCard from "@/components/player/PlayerPassportCard";
import { QRProfileCard } from "@/components/ui/qr-profile-card";
import { ScoutViewBadge } from "@/components/player/ScoutViewBadge";
import { ProUpgradeBanner } from "@/components/player/ProUpgradeBanner";
import PotentialCard from "@/components/player/PotentialCard";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { SportSelector } from "@/components/sports/sport-selector";
import { SPORT_MAP, SportKey } from "@/config/sports";
import api from "@/lib/api";
import { queryAI } from "@/lib/ai-query";
import { useSearchParams } from "next/navigation";

import { getPositionConfig, POSITION_ICON_REGISTRY } from "@/config/positions";

// ── Player similarity lookup ──────────────────────────────────────────────────
const PLAYER_SIMILARITIES: Record<string, Record<string, string[]>> = {
  football: {
    "centre forward":         ["Knowledge Musona (youth)", "Nyasha Mushekwi"],
    "striker":                ["Khama Billiat (early career)", "Knowledge Musona"],
    "right winger":           ["Khama Billiat", "Tino Kadewere (youth)"],
    "left winger":            ["Tino Kadewere", "Khama Billiat"],
    "attacking midfielder":   ["Marvelous Nakamba (youth)", "Devon Chafa"],
    "central midfielder":     ["Marvelous Nakamba", "Marshal Munetsi"],
    "defensive midfielder":   ["Teenage Hadebe (youth)", "Takudzwa Chimwemwe"],
    "centre back":            ["Teenage Hadebe", "Hardlife Zvirekwi"],
    "right back":             ["Method Mwanjali", "Ronald Pfumbidzai"],
    "left back":              ["Alec Mudimu", "Ronald Pfumbidzai"],
    "goalkeeper":             ["Talbert Shumba", "Edmore Sibanda"],
  },
  netball: {
    "goal shooter":  ["Perpetua Mujuru (NASH)", "Tendai Mhlanga"],
    "goal keeper":   ["Chipo Tsomondo", "Faith Mwale"],
    "centre":        ["Joyce Dhliwayo", "Rumbidzai Chitima"],
  },
};

function getComparisons(position: string, sport: string): string[] {
  const sportMap = PLAYER_SIMILARITIES[sport.toLowerCase()] ?? {};
  return sportMap[position.toLowerCase()] ?? [];
}

const POSITIONS = [
  "Goalkeeper", "Right Back", "Left Back", "Centre Back",
  "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder",
  "Right Winger", "Left Winger", "Centre Forward", "Striker",
];

const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

const AGE_GROUPS = ["u13", "u17", "u20", "senior"];
const PREFERRED_FEET = ["right", "left", "both"];

const schema = z.object({
  sport:          z.string().optional(),
  position:       z.string().min(1, "Position required"),
  province:       z.string().min(1, "Province required"),
  age_group:      z.string().min(1, "Age group required"),
  gender:         z.string().optional(),
  preferred_foot: z.string().optional(),
  height_cm:      z.string().optional(),
  weight_kg:      z.string().optional(),
  club:           z.string().optional(),
  school:         z.string().optional(),
  bio:            z.string().max(500).optional(),
  area:           z.string().max(100).optional(),
  date_of_birth:  z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Profile extends FormData {
  id?:                 string;
  scout_visible:       boolean;
  verification_status: string;
  photo_url:           string | null;
  leadership_score:    number;
  joy_score?:          number;
  gender?:             string;
  whatsapp_phone?:     string;
}

function calcCompletion(data: Partial<FormData>): { count: number; total: number; pct: number } {
  const fields = [
    data.sport, data.position, data.province, data.age_group,
    data.preferred_foot, data.height_cm, data.weight_kg,
    data.date_of_birth, data.club || data.school, data.bio,
  ];
  const total = fields.length;
  const count = fields.filter(Boolean).length;
  return { count, total, pct: Math.round((count / total) * 100) };
}

export default function PlayerProfilePage() {
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile]           = useState<Profile | null>(null);
  const [loading, setLoading]           = useState(true);
  const [saved, setSaved]               = useState(false);
  const [error, setError]               = useState("");
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [aiNarrative, setAiNarrative]           = useState("");
  const [generatingNarrative, setGeneratingNarrative] = useState(false);
  const [copied, setCopied]               = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportKey>("football");
  const [photoUrl, setPhotoUrl]         = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef  = useRef<HTMLInputElement>(null);

  // ── Crop modal ────────────────────────────────────────────────────────────
  const cropCanvasRef   = useRef<HTMLCanvasElement>(null);
  const cropImageRef    = useRef<HTMLImageElement | null>(null);
  const [cropSrc,       setCropSrc]       = useState<string | null>(null);
  const [cropScale,     setCropScale]     = useState(1);
  const [cropOffset,    setCropOffset]    = useState({ x: 0, y: 0 });
  const [cropDragging,  setCropDragging]  = useState(false);
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 });

  // Edit panel + Invite Parent state
  const [showEditPanel, setShowEditPanel]     = useState(() => searchParams.get("edit") === "1");
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteAgeGroup, setInviteAgeGroup]   = useState<"u13" | "u17">("u17");
  const [inviteCode, setInviteCode]           = useState<string | null>(null);
  const [inviteExpiry, setInviteExpiry]       = useState<string | null>(null);
  const [inviteLoading, setInviteLoading]     = useState(false);
  const [inviteError, setInviteError]         = useState("");
  const [inviteCopied, setInviteCopied]       = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const watchedValues = watch();

  useEffect(() => {
    if (!user) return;
    api.get("/profile")
      .then((res) => {
        setProfile(res.data);
        setPhotoUrl(res.data.photo_url ?? null);
        if (res.data.sport) setSelectedSport(res.data.sport as SportKey);
        reset({
          sport:          res.data.sport ?? res.data.profile?.sport ?? "football",
          position:       res.data.profile?.position_primary ?? "",
          province:       res.data.province                  ?? "",
          age_group:      res.data.age_group                 ?? "",
          gender:         res.data.profile?.gender           ?? "",
          preferred_foot: res.data.profile?.dominant_foot    ?? "",
          height_cm:      res.data.profile?.height_cm        ?? "",
          weight_kg:      res.data.profile?.weight_kg        ?? "",
          club:           res.data.profile?.club             ?? "",
          school:         res.data.profile?.school           ?? "",
          bio:            res.data.profile?.bio              ?? "",
          area:           res.data.profile?.area             ?? "",
          date_of_birth:  res.data.profile?.date_of_birth    ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    setError("");
    setSaved(false);
    try {
      const { preferred_foot, position, ...rest } = data;
      const payload = { ...rest, position_primary: position || undefined, dominant_foot: preferred_foot || undefined };
      const res = await api.patch("/profile", payload);
      setProfile(res.data);
      reset(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      // Fire-and-forget: purge the public profile cache so scouts see changes immediately
      if (res.data?.id) {
        fetch(`/api/revalidate/player/${res.data.id}`, { method: "POST" }).catch(() => {});
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to save. Please try again.");
    }
  };

  const generateNarrative = async () => {
    if (!profile) return;
    setGeneratingNarrative(true);
    try {
      const ubuntuRes    = await api.get("/ubuntu/connections").catch(() => null);
      const partnerCount = ((ubuntuRes?.data?.data ?? []) as unknown[]).length;
      const sessionsLed  = (ubuntuRes?.data?.sessions_led ?? 0) as number;
      const leaderScore  = profile.leadership_score ?? 0;

      const ubuntuFlair = leaderScore > 0
        ? ` This player has a leadership score of ${leaderScore} on the Ubuntu Network.` +
          ` They have ${partnerCount} training partner${partnerCount !== 1 ? "s" : ""}` +
          ` and have led ${sessionsLed} group session${sessionsLed !== 1 ? "s" : ""}.` +
          ` Include one sentence about their community leadership and what it says about` +
          ` their character as a professional. Frame it as a strength scouts value.`
        : "";

      const joyFlair = (profile.joy_score ?? 0) > 0
        ? ` This player has a Beautiful Game Score of ${profile.joy_score}/100, reflecting ${profile.joy_score} joyful training experiences logged on the platform. Include one sentence about their evident passion for the game and what that character trait means at professional level.`
        : "";

      const prompt = `Generate a 3-sentence professional scouting profile narrative (third person) for this player:
Name: ${user?.name}, Sport: ${profile.sport}, Position: ${profile.position},
Province: ${profile.province}, Age group: ${profile.age_group},
Club/School: ${profile.club || profile.school || "unattached"}.
Write like a FIFA scout. Be professional and positive. No bullet points.${ubuntuFlair}${joyFlair}`;

      const reply = await queryAI(prompt, "scout");
      setAiNarrative(reply);
      api.patch("/profile", { ai_narrative: reply }).catch(() => {});
    } catch {
      setAiNarrative("Unable to generate narrative. Please try again.");
    } finally {
      setGeneratingNarrative(false);
    }
  };

  const toggleVisibility = async () => {
    setTogglingVisibility(true);
    try {
      const res = await api.post("/profile/scout-visibility");
      setProfile((p) => p ? { ...p, scout_visible: res.data.scout_visible } : p);
    } catch {
      setError("Failed to update scout visibility.");
    } finally {
      setTogglingVisibility(false);
    }
  };

  const copyProfileLink = () => {
    if (!profile?.id) return;
    navigator.clipboard.writeText(`https://grassrootssports.live/player/public/${profile.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const generateInvite = async () => {
    setInviteLoading(true);
    setInviteError("");
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/guardian/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
        body: JSON.stringify({ age_group: inviteAgeGroup }),
      });
      const data = await res.json();
      if (!res.ok) { setInviteError(data.message ?? "Failed to generate code."); return; }
      setInviteCode(data.invite_code);
      setInviteExpiry(data.expires_at);
    } catch {
      setInviteError("Network error. Try again.");
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2500);
  };

  // Open crop modal instead of uploading directly
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError("Photo must be under 15MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Draw the crop preview onto the canvas
  const drawCrop = useCallback(() => {
    const canvas = cropCanvasRef.current;
    const img    = cropImageRef.current;
    if (!canvas || !img) return;
    const ctx  = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#0c1f10";
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    const scaledW = img.naturalWidth  * cropScale;
    const scaledH = img.naturalHeight * cropScale;
    ctx.drawImage(
      img,
      (size - scaledW) / 2 + cropOffset.x,
      (size - scaledH) / 2 + cropOffset.y,
      scaledW, scaledH,
    );
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [cropScale, cropOffset]);

  // Load image when cropSrc is set; auto-fit scale to fill the circle
  useEffect(() => {
    if (!cropSrc) return;
    const img  = new Image();
    img.onload = () => {
      cropImageRef.current = img;
      const size     = 280;
      const fitScale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
      setCropScale(fitScale);
      setCropOffset({ x: 0, y: 0 });
    };
    img.src = cropSrc;
  }, [cropSrc]);

  // Redraw whenever scale or offset changes
  useEffect(() => { drawCrop(); }, [drawCrop]);

  const onCropMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setCropDragging(true);
    setCropDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
  };
  const onCropMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropDragging) return;
    setCropOffset({ x: e.clientX - cropDragStart.x, y: e.clientY - cropDragStart.y });
  };
  const onCropMouseUp = () => setCropDragging(false);
  const onCropWheel   = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setCropScale((s) => Math.min(4, Math.max(0.3, s - e.deltaY * 0.001)));
  };
  const onCropTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const t = e.touches[0];
    setCropDragging(true);
    setCropDragStart({ x: t.clientX - cropOffset.x, y: t.clientY - cropOffset.y });
  };
  const onCropTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1 || !cropDragging) return;
    const t = e.touches[0];
    setCropOffset({ x: t.clientX - cropDragStart.x, y: t.clientY - cropDragStart.y });
  };

  // Export cropped canvas blob and upload
  const handleCropSave = () => {
    const canvas = cropCanvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setCropSrc(null);
      setUploadingPhoto(true);
      const preview = URL.createObjectURL(blob);
      setPhotoUrl(preview);
      const formData = new FormData();
      formData.append("photo", blob, "profile.jpg");
      try {
        const res = await api.post("/profile/photo", formData, {
          headers: { "Content-Type": undefined },
        });
        setPhotoUrl((res.data as { photo_url?: string }).photo_url ?? preview);
      } catch {
        setError("Photo upload failed. Please try again.");
        setPhotoUrl(null);
      } finally {
        setUploadingPhoto(false);
      }
    }, "image/jpeg", 0.92);
  };

  // ── Page background override (declared before any early return) ──────────
  const lightTheme = {
    "--background": "#f4f2ee",
  } as React.CSSProperties;

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f4f2ee]" style={lightTheme}>
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
            <div className="h-4 animate-pulse rounded-full bg-muted" />
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 animate-pulse rounded-lg bg-muted" />
              <div className="h-12 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
            </div>
            <div className="h-28 animate-pulse rounded-xl bg-muted" />
            <div className="h-11 animate-pulse rounded-xl bg-muted" />
          </div>
        </main>
      </div>
    );
  }

  // ── PDF download ──────────────────────────────────────────────────────────
  const downloadProfile = () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { jsPDF } = require("jspdf");
    const doc = new jsPDF();

    // Header bar
    doc.setFillColor(26, 92, 42);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(240, 180, 41);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("GrassRoots Sports", 14, 16);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    doc.text("Player Profile  ·  grassrootssports.live", 14, 25);

    // Name
    doc.setTextColor(26, 92, 42);
    doc.setFontSize(17);
    doc.setFont("helvetica", "bold");
    doc.text(user?.name ?? "Player", 14, 46);

    // Sub-line chips
    const chips = [profile?.sport, profile?.position, profile?.province].filter(Boolean).join("  ·  ");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(chips, 14, 53);

    // Divider
    doc.setDrawColor(240, 180, 41);
    doc.setLineWidth(0.4);
    doc.line(14, 58, 196, 58);

    // Fields
    let y = 67;
    const rows: [string, string][] = [
      ["Age Group",      profile?.age_group?.toUpperCase() ?? "—"],
      ["Gender",         profile?.gender ?? "—"],
      ["Preferred Foot", profile?.preferred_foot ?? "—"],
      ["Height",         profile?.height_cm ? `${profile.height_cm} cm` : "—"],
      ["Weight",         profile?.weight_kg ? `${profile.weight_kg} kg` : "—"],
      ["Club",           profile?.club ?? "—"],
      ["School",         profile?.school ?? "—"],
      ["Province",       profile?.province ?? "—"],
      ["Area",           profile?.area ?? "—"],
    ];
    rows.forEach(([label, val]) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 92, 42);
      doc.setFontSize(9);
      doc.text(label + ":", 14, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(val, 65, y);
      y += 8;
    });

    // Bio
    if (profile?.bio) {
      y += 4;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(14, y, 196, y);
      y += 7;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 92, 42);
      doc.text("Bio", 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const bioLines = doc.splitTextToSize(profile.bio, 178);
      doc.text(bioLines, 14, y);
      y += bioLines.length * 5 + 4;
    }

    // AI narrative
    if (aiNarrative) {
      y += 4;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(14, y, 196, y);
      y += 7;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 92, 42);
      doc.text("AI Scout Narrative", 14, y);
      y += 6;
      doc.setFont("helvetica", "italic");
      doc.setTextColor(80, 80, 80);
      const narLines = doc.splitTextToSize(aiNarrative, 178);
      doc.text(narLines, 14, y);
    }

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(`Generated ${new Date().toLocaleDateString()}  ·  Zimbabwe's First AI-Powered Grassroots Sports Platform`, 14, 286);

    doc.save(`GRS-Profile-${(user?.name ?? "player").replace(/\s+/g, "-")}.pdf`);
  };

  const { count, total, pct } = calcCompletion(watchedValues);

  const activePositionKey = (watchedValues.position || "").toLowerCase();
  let lookupKey = "fallback";
  if (activePositionKey.includes("striker") || activePositionKey.includes("forward") || activePositionKey.includes("winger")) {
    lookupKey = "striker";
  } else if (activePositionKey.includes("midfielder")) {
    lookupKey = "midfielder";
  } else if (activePositionKey.includes("back") || activePositionKey.includes("defender")) {
    lookupKey = "defender";
  } else if (activePositionKey.includes("goalkeeper") || activePositionKey.includes("keeper")) {
    lookupKey = "goalkeeper";
  }

  const dynamicConfig = getPositionConfig(lookupKey, watchedValues.age_group);
  const LiveIconComponent = POSITION_ICON_REGISTRY[lookupKey] || Award;

  return (
    <div className="flex h-screen bg-[#f4f2ee]" style={lightTheme}>

      {/* ── Photo Crop Modal ───────────────────────────────────────────────── */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-xs rounded-2xl bg-[#1a3d26] p-5 shadow-2xl border border-white/10">
            <h3 className="mb-4 text-center text-sm font-semibold text-white">Crop your photo</h3>
            <div className="flex justify-center mb-4">
              <canvas
                ref={cropCanvasRef}
                width={280}
                height={280}
                style={{ borderRadius: "50%", cursor: cropDragging ? "grabbing" : "grab", touchAction: "none" }}
                onMouseDown={onCropMouseDown}
                onMouseMove={onCropMouseMove}
                onMouseUp={onCropMouseUp}
                onMouseLeave={onCropMouseUp}
                onWheel={onCropWheel}
                onTouchStart={onCropTouchStart}
                onTouchMove={onCropTouchMove}
                onTouchEnd={() => setCropDragging(false)}
              />
            </div>
            <div className="mb-5 px-1">
              <label className="mb-1 block text-xs text-white/50">Zoom</label>
              <input type="range" min={0.1} max={4} step={0.05} value={cropScale}
                onChange={(e) => setCropScale(parseFloat(e.target.value))}
                className="w-full accent-[#f0b429]" />
            </div>
            <div className="flex gap-3">
              <button type="button"
                onClick={() => { setCropSrc(null); setCropScale(1); setCropOffset({ x: 0, y: 0 }); }}
                className="flex-1 rounded-lg border border-white/20 py-2.5 text-sm text-white/70 hover:bg-white/10 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleCropSave}
                className="flex-1 rounded-lg bg-[#f0b429] py-2.5 text-sm font-semibold text-[#1a3a1a] hover:bg-[#f5c542] transition-colors">
                Save Photo
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-white/30">Drag to reposition · Scroll or slide to zoom</p>
          </div>
        </div>
      )}

      <Sidebar />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-4">

          <ProUpgradeBanner />

          {/* ── HERO IDENTITY CARD ─────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-card p-5 shadow-sm">
            {/* Top row: back arrow + title + edit button */}
            <div className="mb-5 flex items-center gap-3">
              <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">My Profile</h1>
                <p className="text-xs text-muted-foreground">Player Card</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPanel((v) => !v)}
                className="shrink-0 rounded-xl border border-[#f0b429]/40 bg-[#f0b429]/10 px-4 py-2 text-xs font-bold text-[#f0b429] transition-colors hover:bg-[#f0b429]/20"
              >
                {showEditPanel ? "Done" : "Edit Profile"}
              </button>
            </div>

            {/* Avatar + identity row */}
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt={user?.name ?? "Player"}
                    className="h-24 w-24 rounded-2xl object-cover border-2 border-primary/30" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-muted">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <button type="button" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  title="Upload profile photo">
                  {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="sr-only" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold truncate">{user?.name ?? "Your Profile"}</p>
                <p className="text-xs text-muted-foreground truncate mb-2">{user?.email ?? ""}</p>

                {/* Verification badge */}
                <div className="mb-3">
                  {profile?.verification_status === "approved" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-700">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  ) : (
                    <Link href="/player/verification"
                      className="inline-block rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-500/20 transition-colors">
                      Get verified →
                    </Link>
                  )}
                </div>

                {/* Quick info chips */}
                <div className="flex flex-wrap gap-1.5">
                  {(profile?.sport || watchedValues.sport) && (
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium capitalize">
                      {profile?.sport || watchedValues.sport}
                    </span>
                  )}
                  {(profile?.position || watchedValues.position) && (
                    <span className="rounded-full bg-[#f0b429]/10 border border-[#f0b429]/20 px-2.5 py-0.5 text-xs font-medium capitalize text-[#f0b429]">
                      {profile?.position || watchedValues.position}
                    </span>
                  )}
                  {(profile?.province || watchedValues.province) && (
                    <span className="rounded-full bg-muted border border-white/10 px-2.5 py-0.5 text-xs font-medium">
                      {profile?.province || watchedValues.province}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Scout visibility toggle */}
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex items-center gap-2.5">
                {profile?.scout_visible
                  ? <Eye className="h-4 w-4 text-green-500" />
                  : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">Scout visibility</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.scout_visible ? "Open to scout searches" : "Hidden from scouts"}
                  </p>
                </div>
              </div>
              <button onClick={toggleVisibility} disabled={togglingVisibility}
                className={`relative h-6 w-11 rounded-full transition-colors ${profile?.scout_visible ? "bg-green-500" : "bg-muted"}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${profile?.scout_visible ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          {/* ── GAMIFICATION PANEL — star of the show ─────────────────────── */}
          <PlayerGamificationPanel />

          {/* ── PLAYER PASSPORT CARD ──────────────────────────────────────── */}
          <PlayerPassportCard playerName={user?.name ?? undefined} />

          {/* ── PROFILE COMPLETION PROMPT ─────────────────────────────────── */}
          {pct < 100 && (
            <div className="rounded-2xl border border-[#f0b429]/20 bg-[#f0b429]/5 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#f0b429] uppercase tracking-wide">Profile strength</p>
                <span className="text-xs font-bold text-[#f0b429]">{pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 mb-3">
                <div
                  className="h-full rounded-full bg-[#f0b429] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {!watchedValues.position && (
                  <button
                    type="button"
                    onClick={() => setShowEditPanel(true)}
                    className="rounded-full border border-[#f0b429]/30 bg-[#f0b429]/10 px-3 py-1 text-xs font-medium text-[#f0b429] hover:bg-[#f0b429]/20 transition-colors"
                  >
                    + Position
                  </button>
                )}
                {!watchedValues.province && (
                  <button
                    type="button"
                    onClick={() => setShowEditPanel(true)}
                    className="rounded-full border border-[#f0b429]/30 bg-[#f0b429]/10 px-3 py-1 text-xs font-medium text-[#f0b429] hover:bg-[#f0b429]/20 transition-colors"
                  >
                    + Province
                  </button>
                )}
                {!watchedValues.height_cm && (
                  <button
                    type="button"
                    onClick={() => setShowEditPanel(true)}
                    className="rounded-full border border-[#f0b429]/30 bg-[#f0b429]/10 px-3 py-1 text-xs font-medium text-[#f0b429] hover:bg-[#f0b429]/20 transition-colors"
                  >
                    + Height
                  </button>
                )}
                {!watchedValues.date_of_birth && (
                  <button
                    type="button"
                    onClick={() => setShowEditPanel(true)}
                    className="rounded-full border border-[#f0b429]/30 bg-[#f0b429]/10 px-3 py-1 text-xs font-medium text-[#f0b429] hover:bg-[#f0b429]/20 transition-colors"
                  >
                    + Date of birth
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── SCOUT DISCOVERY STRIP ─────────────────────────────────────── */}
          <div className="flex gap-3">
            <Link href="/player/profile/scout-view"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#f0b429]/30 bg-[#f0b429]/5 py-3 text-sm font-semibold text-[#f0b429] transition-colors hover:bg-[#f0b429]/10">
              <Eye className="h-4 w-4" /> View as Scout
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </Link>
            <button type="button" onClick={downloadProfile}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900 hover:bg-gray-50">
              <Download className="h-4 w-4" />
              PDF
            </button>
            {profile?.id && (
              <button type="button" onClick={copyProfileLink}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900 hover:bg-gray-50">
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Share"}
              </button>
            )}
          </div>

          {/* Scout View Badge */}
          {profile?.id && <ScoutViewBadge playerId={profile.id} />}

          {/* ── EDIT PROFILE COLLAPSIBLE ──────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-card overflow-hidden">
            <button type="button" onClick={() => setShowEditPanel((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-white/80 hover:text-white transition-colors">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#f0b429]" />
                Edit Profile
                {pct < 100 ? (
                  <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-bold text-yellow-400">{pct}% complete</span>
                ) : (
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-bold text-green-400">Complete ✓</span>
                )}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showEditPanel ? "rotate-180" : ""}`} />
            </button>

            {showEditPanel && (
              <div className="border-t border-white/10 px-5 pb-6 pt-4 space-y-6">

                {/* Profile completion bar */}
                <div className="rounded-xl border border-white/15 bg-background/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-white">Profile completion</p>
                    <p className="text-sm font-bold text-primary">{count}/{total} · {pct}%</p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  {pct < 100 && (
                    <p className="mt-2 text-xs text-muted-foreground">Complete your profile to improve scout discovery.</p>
                  )}
                  {pct === 100 && (
                    <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Profile complete — scouts can see everything!
                    </p>
                  )}
                </div>

                {/* Dynamic metric discovery cards */}
                {watchedValues.position && (
                  <div className="rounded-2xl border bg-card p-5 border-primary/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2.5 rounded-xl border ${dynamicConfig.badgeColor}`}>
                        <LiveIconComponent size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-[#f0b429]">{dynamicConfig.title}</h3>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Developmental Targets ({watchedValues.age_group ? watchedValues.age_group.toUpperCase() : "GENERAL"})
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {dynamicConfig.successMetrics.map((metric) => (
                        <div key={metric.label} className="border-l-4 border-[#f0b429] bg-muted/40 px-3 py-2 rounded-r-xl">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight truncate">{metric.label}</p>
                          <p className="text-base font-black text-[#f0b429] mt-0.5">{metric.target}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Primary sport</label>
                    <SportSelector
                      value={selectedSport}
                      onChange={(v) => {
                        setSelectedSport(v as SportKey);
                        reset((prev) => ({ ...prev, sport: v as string, position: "" }));
                      }}
                      size="sm"
                    />
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Playing Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Position</label>
                      <select {...register("position")}
                        className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring">
                        <option value="">Select position…</option>
                        {(SPORT_MAP[selectedSport]?.positions ?? POSITIONS).map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      {errors.position && <p className="mt-1 text-xs text-destructive">{errors.position.message}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Province</label>
                      <select {...register("province")}
                        className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring">
                        <option value="">Select province…</option>
                        {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {errors.province && <p className="mt-1 text-xs text-destructive">{errors.province.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Area / Village / Town <span className="font-normal text-muted-foreground">(optional)</span>
                    </label>
                    <input {...register("area")} type="text"
                      placeholder="e.g. Gutu Growth Point, Wedza, Mhangura, near Marondera…"
                      className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Village, farm, growth point, mission, suburb — anywhere
                    </p>
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Physical Details</p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Age Group</label>
                      <select {...register("age_group")}
                        className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring uppercase">
                        <option value="">Select…</option>
                        {AGE_GROUPS.map((ag) => <option key={ag} value={ag}>{ag.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Gender</label>
                      <select {...register("gender")}
                        className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring">
                        <option value="">Select…</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Preferred Foot</label>
                      <select {...register("preferred_foot")}
                        className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm capitalize outline-none focus:ring-1 focus:ring-ring">
                        <option value="">Select…</option>
                        {PREFERRED_FEET.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Height (cm)</label>
                      <input {...register("height_cm")} type="number" placeholder="175"
                        className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Weight (kg)</label>
                      <input {...register("weight_kg")} type="number" placeholder="70"
                        className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Date of Birth</label>
                      <input {...register("date_of_birth")} type="date"
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
                    </div>
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Club & School</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        Club <span className="font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <input {...register("club")} type="text" placeholder="e.g. Dynamos FC"
                        className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        School <span className="font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <input {...register("school")} type="text" placeholder="e.g. Prince Edward High"
                        className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Bio <span className="font-normal text-muted-foreground">(optional, max 500 chars)</span>
                    </label>
                    <textarea {...register("bio")} rows={4}
                      placeholder="Tell scouts about yourself — your strengths, ambitions, teams you've played for…"
                      className="w-full resize-none rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
                    {errors.bio && <p className="mt-1 text-xs text-destructive">{errors.bio.message}</p>}
                  </div>

                  {error && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
                  )}
                  {saved && (
                    <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">
                      <CheckCircle2 className="h-4 w-4" /> Profile saved successfully
                    </div>
                  )}

                  <button type="submit" disabled={isSubmitting || !isDirty}
                    className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                      </span>
                    ) : "Save profile"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ── QR PROFILE CARD ───────────────────────────────────────────── */}
          {user && (
            <QRProfileCard
              playerId={String(user.id)}
              playerName={user.name}
              ageGroup={profile?.age_group ?? user.age_group}
              province={profile?.province ?? user.province}
              selfieUrl={photoUrl ?? undefined}
            />
          )}

          {/* ── TALENT PREDICTION ─────────────────────────────────────────── */}
          {user && (
            <PotentialCard playerId={String(user.id)} playerName={user.name} />
          )}

          {/* ── AI SCOUT NARRATIVE ────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[#f0b429]/15 bg-card/60 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#f0b429]" />
              <h3 className="font-semibold text-[#f0b429]">AI Scout Narrative</h3>
            </div>
            {aiNarrative ? (
              <>
                <p className="mb-3 text-sm leading-relaxed text-emerald-400">{aiNarrative}</p>
                <button onClick={generateNarrative} disabled={generatingNarrative}
                  className="text-xs text-accent hover:text-[#f0b429] transition-colors">
                  {generatingNarrative ? "Regenerating…" : "↻ Regenerate"}
                </button>
              </>
            ) : (
              <>
                <p className="mb-3 text-sm text-emerald-400">
                  Generate a 3-sentence professional scouting profile — written by AI, based on your position and club. Shown to scouts on your public profile.
                </p>
                <button onClick={generateNarrative} disabled={generatingNarrative || !profile?.position}
                  className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2 text-xs font-semibold text-[#1a3a1a] transition-colors hover:bg-[#f5c542] disabled:opacity-40">
                  {generatingNarrative
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                    : <><Sparkles className="h-3.5 w-3.5" /> Generate narrative</>}
                </button>
                {!profile?.position && (
                  <p className="mt-2 text-xs text-emerald-400">Complete your position in Edit Profile first</p>
                )}
              </>
            )}
          </div>

          {/* ── PLAYS LIKE ────────────────────────────────────────────────── */}
          {(() => {
            const comparisons = getComparisons(profile?.position ?? "", profile?.sport ?? "football");
            if (!comparisons.length) return null;
            return (
              <div className="rounded-2xl border border-[#f0b429]/15 bg-card/60 p-5 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#f0b429]" />
                  <h3 className="font-semibold text-[#f0b429]">Plays Like…</h3>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">Based on your position and sport, scouts may compare you to:</p>
                <div className="flex flex-wrap gap-2">
                  {comparisons.map((name) => (
                    <span key={name}
                      className="rounded-full border border-[#f0b429]/30 bg-[#f0b429]/10 px-3 py-1.5 text-xs font-medium text-[#f0b429]">
                      {name}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground italic">
                  Comparisons are based on playing style and position — not performance level.
                </p>
              </div>
            );
          })()}


          {/* ── INVITE PARENT ─────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm overflow-hidden">
            <button type="button"
              onClick={() => { setShowInvitePanel((v) => !v); setInviteCode(null); setInviteError(""); }}
              className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-white/80 hover:text-white transition-colors">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#f0b429]" />
                Invite Parent / Guardian
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showInvitePanel ? "rotate-180" : ""}`} />
            </button>

            {showInvitePanel && (
              <div className="border-t border-white/10 px-5 pb-5 pt-4">
                <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                  Generate a 6-character code. Your parent enters it at{" "}
                  <span className="text-[#f0b429]">grassrootssports.live/parent/link</span> to connect to your account.
                  The code expires after 48 hours.
                </p>

                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your Age Group</p>
                  <div className="flex gap-2">
                    {(["u13", "u17"] as const).map((ag) => (
                      <button key={ag} type="button" onClick={() => setInviteAgeGroup(ag)}
                        className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                          inviteAgeGroup === ag
                            ? "bg-[#f0b429] text-[#1a3a1a]"
                            : "border border-white/10 bg-white/5 text-white/60 hover:text-white"
                        }`}>
                        {ag.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {inviteError && <p className="mb-3 rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">{inviteError}</p>}

                {inviteCode ? (
                  <div className="rounded-xl border border-[#f0b429]/30 bg-[#f0b429]/5 p-4 text-center">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#f0b429]/70">Invite Code</p>
                    <p className="mb-3 font-mono text-4xl font-black tracking-[0.3em] text-[#f0b429]">{inviteCode}</p>
                    <p className="mb-4 text-xs text-muted-foreground">
                      Expires {inviteExpiry ? new Date(inviteExpiry).toLocaleString() : "in 48 hours"}
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={copyInviteCode}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#f0b429] px-4 py-2.5 text-sm font-bold text-[#1a3a1a] transition-opacity hover:opacity-90">
                        <Copy className="h-3.5 w-3.5" />
                        {inviteCopied ? "Copied!" : "Copy Code"}
                      </button>
                      <button type="button" onClick={generateInvite} disabled={inviteLoading}
                        className="rounded-lg border border-white/10 px-4 py-2.5 text-xs text-muted-foreground hover:text-white transition-colors">
                        New Code
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={generateInvite} disabled={inviteLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a5c2a] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
                    {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                    {inviteLoading ? "Generating..." : "Generate Invite Code"}
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}