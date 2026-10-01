import { ShieldCheck, MapPin, Ruler, Trophy, User, Scale, Footprints, Zap, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LogProfileView } from "@/components/player/LogProfileView";
import { AdBanner } from "@/components/ui/AdBanner";
import PublicPassportTabs from "@/components/player/PublicPassportTabs";
import { PublicProfileCompletionNudge } from "@/components/player/PublicProfileCompletionNudge";
import PublicProfileAccordion from "@/components/player/PublicProfileAccordion";

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

interface AnalysisHistory {
  session_count: number;
  average_score: number | null;
  latest_score: number | null;
  latest_date: string | null;
  latest_strengths: string[];
  latest_improvements: string[];
  score_history: { date: string; score: number }[];
}

interface PublicProfile {
  id: string;
  name: string;
  sport: string;
  position: string;
  age_group: string;
  province: string | null;
  preferred_foot: string | null;
  height_cm: string | null;
  weight_kg: string | null;
  bio: string | null;
  verification_status: string;
  selfie_url: string | null;
  club: string | null;
  school: string | null;
  goals: number | null;
  appearances: number | null;
  grs_test: GrsTest | null;
  drill_scores: DrillScore[];
  coach_ratings: { axis: string; score: number }[];
  assessment_domains: { code: string; score: number }[];
  skill_scores: { skill: string; score: number }[];
  physical_axes: PhysicalAxis[];
  xp_total: number;
  daily_streak: number;
  trained_minutes: number;
  position_verified?: boolean;
  analysis_history?: AnalysisHistory | null;
}

async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/player/public/${id}`,
      { next: { revalidate: 60, tags: [`player-${id}`] } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PublicPlayerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPublicProfile(id);

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

  // Profile strength — matches the 10-field checklist in PublicProfileAccordion
  const profileFields = [
    profile.sport,
    profile.position,
    profile.province,
    profile.age_group,
    profile.height_cm,
    profile.weight_kg,
    profile.preferred_foot,
    profile.club ?? profile.school,
    profile.bio,
    profile.verification_status === "approved" ? "yes" : null,
  ];
  const profilePct = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );

  return (
    <>
    <LogProfileView playerId={profile.id} />
    <div className="min-h-screen" style={{ background: "#1a5c2a" }}>
      <div className="mx-auto max-w-sm px-4 py-10">

        {/* Back to Arena */}
        <div className="mb-6">
          <Link
            href="/arena"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#f0b429]/70 hover:text-[#f0b429] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to The Arena
          </Link>
        </div>

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

          {/* Passport photo — overlaps header */}
          <div className="flex justify-center -mt-16 mb-4 px-5">
            {profile.selfie_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.selfie_url}
                alt={profile.name}
                className="w-24 h-32 rounded-xl object-cover object-top border-4 border-[#f0b429]/60 shadow-xl"
              />
            ) : (
              <div className="w-24 h-32 rounded-xl bg-[#f0b429]/10 border-4 border-[#f0b429]/30 flex flex-col items-center justify-center gap-1">
                <User className="h-10 w-10 text-[#f0b429]/40" />
                <span className="text-[9px] text-[#f0b429]/30 uppercase tracking-widest">No photo</span>
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

          {/* AI Match Analysis */}
          {profile.analysis_history && (
            <div className="mx-5 mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#f0b429]/50 mb-2">
                AI Match Analysis
              </p>
              <div className="rounded-2xl border border-[#f0b429]/10 bg-[#f0b429]/5 p-4 space-y-3">

                {/* Session count + latest score */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#f0b429]/40 uppercase tracking-wide">Sessions</p>
                    <p className="text-xl font-extrabold text-white">
                      {profile.analysis_history.session_count}
                      <span className="text-xs font-normal text-[#f0b429]/40 ml-1">analysed</span>
                    </p>
                  </div>
                  {profile.analysis_history.latest_score !== null && (
                    <div className="text-right">
                      <p className="text-[10px] text-[#f0b429]/40 uppercase tracking-wide">Latest Rating</p>
                      <p className="text-xl font-extrabold text-[#f0b429]">
                        {profile.analysis_history.latest_score}
                        <span className="text-xs font-normal text-[#f0b429]/40">/10</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Progress bars — oldest left → newest right */}
                {profile.analysis_history.score_history.length > 1 && (() => {
                  const hist = profile.analysis_history!.score_history;
                  const newest = hist[0].score;
                  const oldest = hist[hist.length - 1].score;
                  const diff = newest - oldest;
                  const trend = diff >= 1 ? "↑ Improving" : diff <= -1 ? "↓ Declining" : "→ Consistent";
                  const trendColor = diff >= 1 ? "text-green-400" : diff <= -1 ? "text-red-400" : "text-[#f0b429]/50";
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[9px] text-[#f0b429]/30 uppercase tracking-wide">Progress (oldest → latest)</p>
                        <p className={`text-[9px] font-bold ${trendColor}`}>{trend}</p>
                      </div>
                      <div className="flex items-end gap-1 h-8">
                        {[...hist].reverse().map((s, i) => (
                          <div
                            key={i}
                            title={`${s.date}: ${s.score}/10`}
                            style={{ height: `${Math.max(15, s.score * 10)}%` }}
                            className={`flex-1 rounded-sm ${
                              i === hist.length - 1 ? "bg-[#f0b429]" : "bg-[#f0b429]/25"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Latest strengths */}
                {profile.analysis_history.latest_strengths.length > 0 && (
                  <div>
                    <p className="text-[9px] text-[#f0b429]/30 uppercase tracking-wide mb-1.5">Latest Strengths</p>
                    <ul className="space-y-1">
                      {profile.analysis_history.latest_strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-white/70 leading-snug">
                          <span className="text-[#f0b429] flex-shrink-0">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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

        {/* Profile completion nudge — only visible to the profile owner */}
        <PublicProfileCompletionNudge
          profileId={profile.id}
          sport={profile.sport || undefined}
          position={profile.position || undefined}
          province={profile.province || undefined}
          ageGroup={profile.age_group || undefined}
          pct={profilePct}
        />

        {/* Passport Radar — full-width below the card */}
        <div className="mt-6">
          <PublicPassportTabs
            drillScores={profile.drill_scores ?? []}
            skillScores={profile.skill_scores ?? []}
            coachRatings={profile.coach_ratings ?? []}
            assessmentDomains={profile.assessment_domains ?? []}
            positionCoachVerified={profile.position_verified ?? false}
            physicalAxes={profile.physical_axes ?? []}
            playerName={profile.name}
            sport={profile.sport}
            position={profile.position}
            xpTotal={profile.xp_total ?? 0}
            dailyStreak={profile.daily_streak ?? 0}
            trainedMinutes={profile.trained_minutes ?? 0}
          />
        </div>

        {/* Accordion — Profile Strength, Drill Analysis, Talent Prediction, Get Represented, Download PDF */}
        <PublicProfileAccordion
          playerId={profile.id}
          playerName={profile.name}
          sport={profile.sport ?? ""}
          position={profile.position ?? ""}
          province={profile.province ?? ""}
          ageGroup={profile.age_group}
          profilePct={profilePct}
          drillScores={profile.drill_scores ?? []}
          club={profile.club}
          school={profile.school}
          bio={profile.bio}
          heightCm={profile.height_cm}
          weightKg={profile.weight_kg}
          preferredFoot={profile.preferred_foot}
          verificationStatus={profile.verification_status}
        />

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
