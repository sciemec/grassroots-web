"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  ArrowLeft, Globe, CheckCircle2, Briefcase, MapPin,
  Trophy, Handshake, ExternalLink,
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type SponsorPublicProfile = {
  user_id: string;
  display_name: string;
  member_since: string;
  organisation_name: string | null;
  bio: string | null;
  website_url: string | null;
  logo_url: string | null;
  preferred_sport: string | null;
  preferred_category: string | null;
  preferred_region: string | null;
  budget_min_usd: number | null;
  budget_max_usd: number | null;
  is_verified: boolean;
  accepted_count: number;
  total_intros: number;
};

function formatMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "long", year: "numeric",
  });
}

function formatBudget(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  if (min) return `From $${min.toLocaleString()}`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return null;
}

export default function SponsorProfilePage() {
  const router      = useRouter();
  const params      = useParams<{ id: string }>();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);

  const [profile, setProfile] = useState<SponsorPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }

    fetch(`${BASE}/sponsors/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 404) throw new Error("not_found");
        return r.json();
      })
      .then((json) => setProfile(json.data ?? null))
      .catch((e) => setError(e.message === "not_found" ? "Sponsor not found." : "Could not load sponsor profile."))
      .finally(() => setLoading(false));
  }, [hasHydrated, user, token, router, params.id]);

  if (!hasHydrated || !user) return null;

  const budget = profile ? formatBudget(profile.budget_min_usd, profile.budget_max_usd) : null;
  const acceptanceRate = profile && profile.total_intros > 0
    ? Math.round((profile.accepted_count / profile.total_intros) * 100)
    : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Sponsor Profile</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <div className="h-36 rounded-2xl bg-white animate-pulse" />
            <div className="h-24 rounded-2xl bg-white animate-pulse" />
            <div className="h-20 rounded-2xl bg-white animate-pulse" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {profile && (
          <>
            {/* Identity card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start gap-4">
                {/* Logo / avatar */}
                {profile.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.logo_url}
                    alt=""
                    className="h-16 w-16 flex-shrink-0 rounded-xl object-cover border border-gray-100"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl text-white text-2xl font-bold"
                    style={{ backgroundColor: "#1a5c2a" }}
                  >
                    {(profile.organisation_name ?? profile.display_name)[0].toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {profile.organisation_name ?? profile.display_name}
                    </h2>
                    {profile.is_verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        <CheckCircle2 size={12} />
                        Verified
                      </span>
                    )}
                  </div>

                  {profile.organisation_name && (
                    <p className="mt-0.5 text-sm text-gray-500">{profile.display_name}</p>
                  )}

                  <p className="mt-1 text-xs text-gray-400">
                    Member since {formatMemberSince(profile.member_since)}
                  </p>

                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                    >
                      <Globe size={12} />
                      {profile.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>

              {profile.bio && (
                <p className="mt-4 text-sm text-gray-700 leading-relaxed border-t border-gray-100 pt-4">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Track record */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Handshake size={16} className="text-gray-400" />
                </div>
                <p className="text-2xl font-bold" style={{ color: "#1a5c2a" }}>{profile.accepted_count}</p>
                <p className="mt-0.5 text-xs text-gray-500">Accepted Connections</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Trophy size={16} className="text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {acceptanceRate !== null ? `${acceptanceRate}%` : "—"}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">Acceptance Rate</p>
              </div>
            </div>

            {/* Sponsorship preferences */}
            {(profile.preferred_sport || profile.preferred_category || profile.preferred_region || budget) && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Sponsorship Preferences</h3>

                <div className="space-y-2">
                  {profile.preferred_sport && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-24 flex-shrink-0 text-xs text-gray-400">Sport</span>
                      <span className="font-medium text-gray-900 capitalize">{profile.preferred_sport}</span>
                    </div>
                  )}
                  {profile.preferred_category && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-24 flex-shrink-0 text-xs text-gray-400">Category</span>
                      <span className="font-medium text-gray-900 capitalize">{profile.preferred_category}</span>
                    </div>
                  )}
                  {profile.preferred_region && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-24 flex-shrink-0 text-xs text-gray-400">Region</span>
                      <span className="inline-flex items-center gap-1 font-medium text-gray-900">
                        <MapPin size={13} className="text-gray-400" />
                        {profile.preferred_region}
                      </span>
                    </div>
                  )}
                  {budget && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-24 flex-shrink-0 text-xs text-gray-400">Budget</span>
                      <span className="inline-flex items-center gap-1 font-medium text-gray-900">
                        <Briefcase size={13} className="text-gray-400" />
                        {budget}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Browse cases CTA */}
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                See their introduction requests in your case dashboard.
              </p>
              <Link
                href="/account/cases"
                className="flex-shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                My Cases
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
