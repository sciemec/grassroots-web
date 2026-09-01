import { ShieldCheck, MapPin, Ruler, Trophy, User, Scale, Footprints, Zap, CheckCircle } from "lucide-react";
import { HighlightReel } from "@/components/player/HighlightReel";
import { LogProfileView } from "@/components/player/LogProfileView";
import { AdBanner } from "@/components/ui/AdBanner";
import PotentialCard from "@/components/player/PotentialCard";
import { RepresentationForm } from "@/components/player/RepresentationForm";
import TacticalPitch from "@/components/TacticalPitch";
import PublicPassportTabs from "@/components/player/PublicPassportTabs";

interface ShowcaseClip {
  id: string;
  skill_type: string;
  video_url: string | null;
  thumbnail_url: string | null;
  ai_rating: number;
  top_strength: string;
  scout_note: string;
  view_count: number;
}

interface GrsTest {
  aqScore: number | null;
  tier: string | null;
  sessionDate: string;
  coachVerified: boolean;
}

interface DrillScore {
  drillName: string;
  score: number;
  topStrength: string | null;
  avgSubScore?: number | null;
}

interface PhysicalAxis {
  code: string;
  label: string;
  percentile: number | null;
}

interface PublicProfile {
  id: string;
  name: string;
  sport: string;
  position: string;
  age_group: string;
  province: string;
  preferred_foot: string;
  height_cm: string;
  weight_kg: string;
  bio: string;
  verification_status: string;
  selfie_url: string | null;
  club: string | null;
  school: string | null;
  goals: number | null;
  appearances: number | null;
  grs_test: GrsTest | null;
  drill_scores: DrillScore[];
  physical_axes: PhysicalAxis[];
  xp_total: number;
  daily_streak: number;
  trained_minutes: number;
}

async function getShowcaseClips(id: string): Promise<ShowcaseClip[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/showcase/discover?user_id=${id}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const raw = data?.data ?? data;
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/player/public/${id}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PublicPlayerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, showcaseClips] = await Promise.all([
    getPublicProfile(id),
    getShowcaseClips(id),
  ]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1a5c2a" }}>
        <div className="text-center px-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0b429]/10">
            <User className="h-8 w-8 text-[#f0b429]/60" />
          </div>
          <h1 className="text-xl font-bold text-white">Profile not found</h1>
          <p className="mt-2 text-sm text-[#f0b429]/60">This player profile does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const isVerified = profile.verification_status === "approved";

  return (
    <>
    <LogProfileView playerId={profile.id} />
    <div className="min-h-screen" style={{ background: "#1a5c2a" }}>
      <div className="mx-auto max-w-sm px-4 py-10">

        {/* Platform logo / header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f0b429]/80">GrassRoots Sports</p>
          <p className="text-[10px] text-[#f0b429]/40 mt-0.5">Zimbabwe&apos;s First AI-Powered Sports Platform</p>
        </div>

        {/* Player card */}
        <div className="rounded-3xl border border-[#f0b429]/10 bg-[#f0b429]/5 backdrop-blur-sm overflow-hidden">

          {/* Green header band */}
          <div className="h-24 relative" style={{ background: "linear-gradient(135deg, #0c3d1a 0%, #1a5c2a 100%)" }}>
            {/* Verified badge */}
            {isVerified && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-[#f0b429] px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#1a3a1a]" />
                <span className="text-[10px] font-bold text-[#1a3a1a] uppercase tracking-wide">Verified</span>
              </div>
            )}
          </div>

          {/* Avatar — overlaps header */}
          <div className="flex justify-center -mt-14 mb-4 px-5">
            {profile.selfie_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.selfie_url}
                alt={profile.name}
                className="h-28 w-28 rounded-full object-cover border-4 border-[#f0b429]/60 shadow-xl"
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-[#f0b429]/10 border-4 border-[#f0b429]/30 flex items-center justify-center">
                <User className="h-12 w-12 text-[#f0b429]/40" />
              </div>
            )}
          </div>

          {/* Name + sport */}
          <div className="px-6 pb-2 text-center">
            <h1 className="text-2xl font-extrabold text-white">{profile.name}</h1>
            <p className="mt-1 text-sm font-medium capitalize text-[#f0b429]">
              {profile.sport} · {profile.position}
            </p>
            {(profile.club || profile.school) && (
              <p className="mt-1 text-xs text-[#f0b429]/50">{profile.club ?? profile.school}</p>
            )}
          </div>

          {/* Stats row */}
          {(profile.appearances !== null || profile.goals !== null) && (
            <div className="mx-5 my-4 grid grid-cols-2 gap-3">
              {profile.appearances !== null && (
                <div className="rounded-xl bg-[#f0b429]/5 p-3 text-center">
                  <p className="text-2xl font-extrabold text-white">{profile.appearances}</p>
                  <p className="text-[10px] text-[#f0b429]/50 uppercase tracking-wide">Appearances</p>
                </div>
              )}
              {profile.goals !== null && (
                <div className="rounded-xl bg-[#f0b429]/5 p-3 text-center">
                  <p className="text-2xl font-extrabold text-[#f0b429]">{profile.goals}</p>
                  <p className="text-[10px] text-[#f0b429]/50 uppercase tracking-wide">Goals</p>
                </div>
              )}
            </div>
          )}

          {/* Details */}
          <div className="mx-5 mb-5 space-y-2.5">
            {[
              { icon: MapPin,      label: "Province",       value: profile.province },
              { icon: Trophy,      label: "Age Group",      value: profile.age_group?.toUpperCase() },
              { icon: Ruler,       label: "Height",         value: profile.height_cm ? `${profile.height_cm} cm` : null },
              { icon: Scale,       label: "Weight",         value: profile.weight_kg ? `${profile.weight_kg} kg` : null },
              { icon: Footprints,  label: "Preferred Foot", value: profile.preferred_foot },
            ].filter(r => r.value).map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-xl bg-[#f0b429]/5 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-[#f0b429]" />
                  <span className="text-xs text-[#f0b429]/50">{label}</span>
                </div>
                <span className="text-sm font-semibold capitalize text-white">{value}</span>
              </div>
            ))}
          </div>

          {/* Tactical position */}
          <div className="mx-5 mb-5">
            <TacticalPitch position={profile.position} />
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mx-5 mb-5 rounded-xl bg-[#f0b429]/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#f0b429]/70 mb-1.5">About</p>
              <p className="text-sm text-[#f0b429]/70 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* GRS Athletic Score */}
          {profile.grs_test && profile.grs_test.aqScore !== null && (
            <div className="mx-5 mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#f0b429]/50 mb-2">
                GRS Athletic Score
              </p>
              <div className="rounded-2xl border border-[#f0b429]/10 bg-[#f0b429]/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0b429]/10">
                      <Zap className="h-5 w-5 text-[#f0b429]" />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-white">
                        {profile.grs_test.aqScore}
                        <span className="text-sm font-normal text-[#f0b429]/40"> / 100</span>
                      </p>
                      <p className="text-[10px] text-[#f0b429]/40 uppercase tracking-wide">Athletic Quotient</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {profile.grs_test.tier && (
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                        profile.grs_test.tier.toLowerCase() === "elite"  ? "bg-purple-500/20 text-purple-300" :
                        profile.grs_test.tier.toLowerCase() === "gold"   ? "bg-[#f0b429]/20 text-[#f0b429]" :
                        profile.grs_test.tier.toLowerCase() === "silver" ? "bg-white/20 text-white/70" :
                        "bg-amber-900/30 text-amber-400"
                      }`}>
                        {profile.grs_test.tier.toUpperCase()}
                      </span>
                    )}
                    {profile.grs_test.coachVerified && (
                      <div className="mt-1.5 flex items-center justify-end gap-1 text-[#f0b429]/50">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-[9px]">Coach verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Passport Radar — Physical DNA + Technical tabs */}
          {((profile.drill_scores && profile.drill_scores.length > 0) ||
            (profile.physical_axes && profile.physical_axes.some((a) => a.percentile !== null))) && (
            <div className="mx-5 mb-5">
              <PublicPassportTabs
                drillScores={profile.drill_scores ?? []}
                physicalAxes={profile.physical_axes ?? []}
                playerName={profile.name}
                position={profile.position}
                xpTotal={profile.xp_total ?? 0}
                dailyStreak={profile.daily_streak ?? 0}
                trainedMinutes={profile.trained_minutes ?? 0}
              />
            </div>
          )}

          {/* Drill Analysis Scores — detail bars below the radar */}
          {profile.drill_scores && profile.drill_scores.length > 0 && (
            <div className="mx-5 mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#f0b429]/50 mb-2">
                AI Drill Analysis
              </p>
              <div className="space-y-2">
                {profile.drill_scores.slice(0, 5).map((drill) => (
                  <div key={drill.drillName} className="rounded-xl bg-[#f0b429]/5 px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-white truncate pr-2">{drill.drillName}</p>
                      <span className={`text-sm font-extrabold shrink-0 ${
                        drill.score >= 8 ? "text-[#f0b429]" :
                        drill.score >= 5 ? "text-white" :
                        "text-white/50"
                      }`}>
                        {drill.score.toFixed(1)}<span className="text-[10px] font-normal text-[#f0b429]/30">/10</span>
                      </span>
                    </div>
                    {/* Score bar */}
                    <div className="h-1 rounded-full bg-white/10">
                      <div
                        className="h-1 rounded-full"
                        style={{
                          width: `${(drill.score / 10) * 100}%`,
                          background: drill.score >= 8 ? "#f0b429" : drill.score >= 5 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                        }}
                      />
                    </div>
                    {drill.topStrength && (
                      <p className="mt-1.5 text-[10px] text-[#f0b429]/40 leading-snug">{drill.topStrength}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-[#f0b429]/5 px-5 py-4 text-center">
            <p className="text-[10px] text-[#f0b429]/30">
              This profile was verified by GrassRoots Sports · grassrootssports.live
            </p>
          </div>
        </div>

        {/* Highlight Reel — showcase + AI-generated clips */}
        <div className="mt-6">
          <HighlightReel
            clips={showcaseClips}
            mode="public"
          />
        </div>

        {/* Talent Prediction — scouts see this as the key signal */}
        <div className="mt-6">
          <PotentialCard
            playerId={profile.id}
            playerName={profile.name}
            isPublicView={true}
          />
        </div>

        {/* Representation enquiry — scouts send formal approach to GrassRoots */}
        <RepresentationForm playerId={profile.id} playerName={profile.name} />

        {/* Ad — player-profile-bottom (high-intent scout audience) */}
        <div className="mt-6">
          <AdBanner slot="player-profile-bottom" fallback={true} className="w-full" />
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <a
            href="https://grassrootssports.live"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-5 py-2.5 text-sm font-bold text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
          >
            Join GrassRoots Sports
          </a>
          <p className="mt-2 text-xs text-[#f0b429]/30">Free for all Zimbabwean athletes</p>
        </div>
      </div>
    </div>
    </>
  );
}
