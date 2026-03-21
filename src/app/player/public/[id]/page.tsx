import { ShieldCheck, MapPin, Ruler, Trophy, User } from "lucide-react";

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

export default async function PublicPlayerProfile({ params }: { params: { id: string } }) {
  const profile = await getPublicProfile(params.id);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1a5c2a" }}>
        <div className="text-center px-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <User className="h-8 w-8 text-white/60" />
          </div>
          <h1 className="text-xl font-bold text-white">Profile not found</h1>
          <p className="mt-2 text-sm text-white/60">This player profile does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const isVerified = profile.verification_status === "approved";

  return (
    <div className="min-h-screen" style={{
      background: "#1a5c2a",
      backgroundImage: `
        repeating-linear-gradient(-45deg, transparent 0px, transparent 8px, rgba(180,160,0,0.08) 8px, rgba(180,160,0,0.08) 10px),
        repeating-linear-gradient(45deg, transparent 0px, transparent 8px, rgba(180,160,0,0.08) 8px, rgba(180,160,0,0.08) 10px)
      `,
    }}>
      <div className="mx-auto max-w-sm px-4 py-10">

        {/* Platform logo / header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#f0b429]/80">GrassRoots Sports</p>
          <p className="text-[10px] text-white/40 mt-0.5">Zimbabwe&apos;s First AI-Powered Sports Platform</p>
        </div>

        {/* Player card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">

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
              <div className="h-28 w-28 rounded-full bg-white/10 border-4 border-[#f0b429]/30 flex items-center justify-center">
                <User className="h-12 w-12 text-white/40" />
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
              <p className="mt-1 text-xs text-white/50">{profile.club ?? profile.school}</p>
            )}
          </div>

          {/* Stats row */}
          {(profile.appearances || profile.goals) && (
            <div className="mx-5 my-4 grid grid-cols-2 gap-3">
              {profile.appearances !== null && (
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-2xl font-extrabold text-white">{profile.appearances}</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">Appearances</p>
                </div>
              )}
              {profile.goals !== null && (
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-2xl font-extrabold text-[#f0b429]">{profile.goals}</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wide">Goals</p>
                </div>
              )}
            </div>
          )}

          {/* Details */}
          <div className="mx-5 mb-5 space-y-2.5">
            {[
              { icon: MapPin,  label: "Province",       value: profile.province },
              { icon: Trophy,  label: "Age Group",      value: profile.age_group?.toUpperCase() },
              { icon: Ruler,   label: "Height",         value: profile.height_cm ? `${profile.height_cm} cm` : null },
              { icon: User,    label: "Preferred Foot", value: profile.preferred_foot },
            ].filter(r => r.value).map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-[#f0b429]" />
                  <span className="text-xs text-white/50">{label}</span>
                </div>
                <span className="text-sm font-semibold capitalize text-white">{value}</span>
              </div>
            ))}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mx-5 mb-5 rounded-xl bg-white/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#f0b429]/70 mb-1.5">About</p>
              <p className="text-sm text-white/70 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-white/5 px-5 py-4 text-center">
            <p className="text-[10px] text-white/30">
              This profile was verified by GrassRoots Sports · grassrootssports.live
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <a
            href="https://grassrootssports.live"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-5 py-2.5 text-sm font-bold text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
          >
            Join GrassRoots Sports
          </a>
          <p className="mt-2 text-xs text-white/30">Free for all Zimbabwean athletes</p>
        </div>
      </div>
    </div>
  );
}
