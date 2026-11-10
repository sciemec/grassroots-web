"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

interface SponsorProfile {
  id: string;
  user_id: string;
  organisation_name: string;
  contact_name: string | null;
  contact_email: string | null;
  bio: string | null;
  website_url: string | null;
  logo_url: string | null;
  preferred_sport: string | null;
  preferred_category: string | null;
  preferred_region: string | null;
  budget_min_usd: number | null;
  budget_max_usd: number | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  user: { id: string; name: string; email: string } | null;
}

interface ApiResponse {
  data: SponsorProfile[];
  meta?: { current_page: number; last_page: number; total: number };
  current_page?: number;
  last_page?: number;
  total?: number;
}

type VerifiedFilter = "all" | "unverified" | "verified";

function dateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function BudgetRange({ min, max }: { min: number | null; max: number | null }) {
  if (!min && !max) return <span className="text-gray-400">—</span>;
  if (min && max) return <span>${min.toLocaleString()} – ${max.toLocaleString()}</span>;
  if (min) return <span>From ${min.toLocaleString()}</span>;
  return <span>Up to ${max!.toLocaleString()}</span>;
}

function ProfileDrawer({
  profile,
  onClose,
  onVerify,
  verifying,
}: {
  profile: SponsorProfile;
  onClose: () => void;
  onVerify: (id: string) => void;
  verifying: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative bg-white w-full max-w-sm h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base truncate pr-4">{profile.organisation_name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none flex-shrink-0">
            ✕
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Logo */}
          {profile.logo_url && (
            <img
              src={profile.logo_url}
              alt={profile.organisation_name}
              className="w-20 h-20 rounded-xl object-contain border border-gray-200 bg-gray-50 p-2"
            />
          )}

          {/* Verification status */}
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              profile.is_verified
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {profile.is_verified ? "✓ Verified" : "Pending verification"}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              profile.is_active
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-gray-50 text-gray-500 border-gray-200"
            }`}>
              {profile.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Account info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Account</div>
            {profile.user && (
              <>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-gray-900 text-right">{profile.user.name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900 text-right break-all">{profile.user.email}</span>
                </div>
              </>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Joined</span>
              <span className="font-medium text-gray-900">{dateShort(profile.created_at)}</span>
            </div>
          </div>

          {/* Contact */}
          {(profile.contact_name || profile.contact_email) && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contact</div>
              {profile.contact_name && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Contact name</span>
                  <span className="font-medium text-gray-900 text-right">{profile.contact_name}</span>
                </div>
              )}
              {profile.contact_email && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Contact email</span>
                  <a href={`mailto:${profile.contact_email}`} className="text-[#1a5c2a] hover:underline text-right break-all">
                    {profile.contact_email}
                  </a>
                </div>
              )}
              {profile.website_url && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Website</span>
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-[#1a5c2a] hover:underline text-right break-all">
                    {profile.website_url.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Sponsorship preferences */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Preferences</div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Sport</span>
              <span className="font-medium text-gray-900 capitalize">{profile.preferred_sport ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Category</span>
              <span className="font-medium text-gray-900 capitalize">{profile.preferred_category?.replace(/_/g, " ") ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Region</span>
              <span className="font-medium text-gray-900">{profile.preferred_region ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Budget</span>
              <span className="font-medium text-gray-900">
                <BudgetRange min={profile.budget_min_usd} max={profile.budget_max_usd} />
              </span>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">About</div>
              <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Verify button */}
          {!profile.is_verified && (
            <button
              onClick={() => onVerify(profile.id)}
              disabled={verifying}
              className="w-full bg-[#1a5c2a] hover:bg-[#145222] text-white font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {verifying ? "Verifying…" : "Verify Sponsor"}
            </button>
          )}

          {/* View their intro requests */}
          <Link
            href={`/admin/introductions?sponsor=${profile.user_id}`}
            className="block w-full text-center border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            View Introduction Requests →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminSponsorsPage() {
  const token = useAuthStore((s) => s.token);

  const [profiles, setProfiles] = useState<SponsorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<VerifiedFilter>("unverified");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SponsorProfile | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  useEffect(() => { setPage(1); }, [filter]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: String(page) });
    if (filter === "verified")   params.set("is_verified", "1");
    if (filter === "unverified") params.set("is_verified", "0");

    fetch(`${base}/admin/sponsors?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<ApiResponse>; })
      .then((json) => {
        setProfiles(json.data ?? []);
        setLastPage(json.meta?.last_page ?? json.last_page ?? 1);
        setTotal(json.meta?.total ?? json.total ?? 0);
      })
      .catch(() => setError("Failed to load sponsor profiles."))
      .finally(() => setLoading(false));
  }, [filter, page, token, base]);

  const handleVerify = async (profileId: string) => {
    setVerifyingId(profileId);
    try {
      const res = await fetch(`${base}/admin/sponsors/${profileId}/verify`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const { data } = await res.json() as { data: SponsorProfile };
      setProfiles((prev) => prev.map((p) => p.id === profileId ? data : p));
      setSelected((prev) => prev?.id === profileId ? data : prev);
    } catch {
      alert("Could not verify sponsor. Please try again.");
    } finally {
      setVerifyingId(null);
    }
  };

  const unverifiedCount = profiles.filter((p) => !p.is_verified).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sponsor Profiles</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} profile{total !== 1 ? "s" : ""}
            {filter !== "all" && ` · ${filter}`}
            {filter === "unverified" && unverifiedCount > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {unverifiedCount} to review
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/introductions"
          className="text-sm font-medium text-[#1a5c2a] border border-[#1a5c2a] rounded-lg px-4 py-2 hover:bg-[#1a5c2a]/5 transition-colors"
        >
          Introduction Requests →
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(["unverified", "verified", "all"] as VerifiedFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              filter === f
                ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                : "bg-white text-gray-600 border-gray-300 hover:border-[#1a5c2a] hover:text-[#1a5c2a]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🤝</div>
          <p className="font-medium text-gray-500">No {filter !== "all" ? filter : ""} sponsor profiles</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelected(profile)}
                className="text-left bg-white rounded-2xl border border-gray-200 hover:border-[#1a5c2a] hover:shadow-sm transition-all p-4 group"
              >
                <div className="flex items-start gap-3">
                  {/* Logo or initials */}
                  <div className="w-10 h-10 rounded-xl border border-gray-200 bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {profile.logo_url ? (
                      <img src={profile.logo_url} alt="" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-sm font-bold text-gray-400">
                        {profile.organisation_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 group-hover:text-[#1a5c2a] transition-colors truncate">
                        {profile.organisation_name}
                      </span>
                      {profile.is_verified && (
                        <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-1.5 py-0.5 font-semibold flex-shrink-0">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {profile.user?.email ?? ""}
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {profile.preferred_sport && (
                        <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 capitalize">
                          {profile.preferred_sport}
                        </span>
                      )}
                      {(profile.budget_min_usd || profile.budget_max_usd) && (
                        <span className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
                          <BudgetRange min={profile.budget_min_usd} max={profile.budget_max_usd} />
                        </span>
                      )}
                      {profile.preferred_region && (
                        <span className="text-xs text-gray-500">{profile.preferred_region}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-xs text-gray-300 group-hover:text-gray-500 transition-colors">
                    →
                  </div>
                </div>

                {!profile.is_verified && (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-amber-700 font-medium">
                    Awaiting verification · joined {dateShort(profile.created_at)}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {lastPage}</span>
              <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="px-4 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail drawer */}
      {selected && (
        <ProfileDrawer
          profile={selected}
          onClose={() => setSelected(null)}
          onVerify={handleVerify}
          verifying={verifyingId === selected.id}
        />
      )}
    </div>
  );
}
