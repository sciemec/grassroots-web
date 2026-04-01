import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, MapPin, Users, Mail, Phone, Globe, ChevronLeft, ArrowRight } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
  sport: string;
  age_group: string | null;
  gender: string;
  season: string | null;
}

interface Org {
  id: string;
  name: string;
  type: string;
  province: string;
  sports: string[];
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  slug: string;
  teams: Team[];
}

const TYPE_COLORS: Record<string, string> = {
  School:  "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Academy: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  Club:    "bg-green-500/15 text-green-300 border-green-500/30",
};

// ── Data fetching (server component) ─────────────────────────────────────────

async function getOrg(slug: string): Promise<Org | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
    const res = await fetch(`${apiUrl}/organisations/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function OrgProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const org = await getOrg(params.slug);
  if (!org) notFound();

  // Group teams by sport
  const teamsBySport: Record<string, Team[]> = {};
  org.teams.forEach((t) => {
    if (!teamsBySport[t.sport]) teamsBySport[t.sport] = [];
    teamsBySport[t.sport].push(t);
  });

  return (
    <div className="min-h-screen bg-[#0d1f12]">

      {/* Top bar */}
      <div className="border-b border-white/10 bg-[#0d1f12]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <Link href="/schools" className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
            All Organisations
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-xs text-white/70 truncate">{org.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* Header card */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500/15">
                <Building2 className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-white">{org.name}</h1>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[org.type] ?? "bg-white/10 text-white/60 border-white/20"}`}>
                    {org.type}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/50">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {org.province}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {org.teams.length} team{org.teams.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    {org.sports.length} sport{org.sports.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {org.description && (
            <p className="mt-4 text-sm text-white/60 leading-relaxed">{org.description}</p>
          )}

          {/* Contact */}
          {(org.contact_email || org.contact_phone) && (
            <div className="mt-4 flex flex-wrap gap-4 border-t border-white/10 pt-4">
              {org.contact_email && (
                <a
                  href={`mailto:${org.contact_email}`}
                  className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {org.contact_email}
                </a>
              )}
              {org.contact_phone && (
                <a
                  href={`tel:${org.contact_phone}`}
                  className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {org.contact_phone}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Sports */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-400">Sports</h2>
          <div className="flex flex-wrap gap-2">
            {org.sports.map((s) => (
              <span
                key={s}
                className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-300"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Teams by sport */}
        {org.teams.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-amber-400">
              Teams ({org.teams.length})
            </h2>

            {Object.entries(teamsBySport).map(([sport, teams]) => (
              <div key={sport} className="mb-4 last:mb-0">
                <p className="mb-2 text-xs font-medium text-white/40 uppercase tracking-wide">{sport}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{team.name}</p>
                        <p className="text-xs text-white/40">
                          {[team.age_group, team.gender !== "Mixed" ? team.gender : null].filter(Boolean).join(" · ") || "Open"}
                          {team.season ? ` · ${team.season}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA — Join platform */}
        <div className="mt-8 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-900/20 to-yellow-900/10 p-6 text-center">
          <p className="text-sm font-semibold text-white">Are you a player at {org.name}?</p>
          <p className="mt-1 text-xs text-white/50">
            Create your free profile and get discovered by scouts across Zimbabwe.
          </p>
          <Link
            href="/register"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-[#0d1f12] hover:bg-amber-400 transition-colors"
          >
            Create free profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const org = await getOrg(params.slug);
  if (!org) return { title: "Organisation not found" };
  return {
    title: `${org.name} — GrassRoots Sport`,
    description: org.description ?? `${org.type} in ${org.province}, Zimbabwe. Sports: ${org.sports.join(", ")}.`,
  };
}
