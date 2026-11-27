"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import {
  ArrowLeft, Briefcase, Plus, ExternalLink, Users,
  Clock, CheckCircle2, XCircle, AlertCircle, Eye, Pencil, Trash2,
  PauseCircle, DollarSign, ThumbsUp,
} from "lucide-react";
import type { AxiosError } from "axios";

type CaseStatus =
  | "draft"
  | "pending_vouch"
  | "in_review"
  | "live"
  | "paused"
  | "closed"
  | "rejected"
  | "funded";

type Case = {
  id: string;
  title: string;
  category: string;
  sport: string;
  status: CaseStatus;
  target_cents: number | null;
  story_short: string | null;
  deadline_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  wizard_step: number;
};

type StatusCfg = { label: string; color: string; bg: string; icon: React.ReactNode };

const STATUS_CONFIG: Record<CaseStatus, StatusCfg> = {
  draft:        { label: "Draft",             color: "#374151", bg: "#f3f4f6", icon: <AlertCircle size={13} /> },
  pending_vouch:{ label: "Awaiting vouch",    color: "#7c3aed", bg: "#ede9fe", icon: <ThumbsUp size={13} />    },
  in_review:    { label: "Under GRS review",  color: "#92400e", bg: "#fef3c7", icon: <Clock size={13} />       },
  live:         { label: "Live",              color: "#065f46", bg: "#d1fae5", icon: <CheckCircle2 size={13} /> },
  paused:       { label: "Paused",            color: "#1e40af", bg: "#dbeafe", icon: <PauseCircle size={13} /> },
  closed:       { label: "Closed",            color: "#7f1d1d", bg: "#fee2e2", icon: <XCircle size={13} />     },
  rejected:     { label: "Not approved",      color: "#7f1d1d", bg: "#fee2e2", icon: <XCircle size={13} />     },
  funded:       { label: "Funded",            color: "#065f46", bg: "#d1fae5", icon: <DollarSign size={13} />  },
};

const FALLBACK_CFG: StatusCfg = { label: "Unknown", color: "#6b7280", bg: "#f3f4f6", icon: <AlertCircle size={13} /> };

function cfgFor(status: string): StatusCfg {
  return (STATUS_CONFIG as Record<string, StatusCfg>)[status] ?? FALLBACK_CFG;
}

const GROUPS: { label: string; statuses: CaseStatus[] }[] = [
  { label: "Needs your attention", statuses: ["draft", "pending_vouch", "rejected"] },
  { label: "Under GRS review",     statuses: ["in_review"] },
  { label: "Live",                 statuses: ["live"] },
  { label: "Paused",               statuses: ["paused"] },
  { label: "Funded",               statuses: ["funded"] },
  { label: "Closed",               statuses: ["closed"] },
];

const ALL_GROUPED_STATUSES = new Set(GROUPS.flatMap((g) => g.statuses));

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export default function MyCasesPage() {
  const router      = useRouter();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const user        = useAuthStore((s) => s.user);

  const [cases,   setCases]   = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const loadCases = () => {
    setLoading(true);
    setError(null);
    api.get<{ data: Case[] }>("/sponsorships/mine")
      .then((res) => setCases(Array.isArray(res.data.data) ? res.data.data : []))
      .catch(() => setError("Could not load your cases. Please check your connection."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    loadCases();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;

  const liveCount  = cases.filter((c) => c.status === "live").length;
  const reviewCount = cases.filter((c) => c.status === "in_review").length;
  const totalCount = cases.length;

  // Build grouped list; overflow bucket for unexpected statuses
  const grouped = GROUPS.map((g) => ({
    ...g,
    items: cases.filter((c) => g.statuses.includes(c.status)),
  }));
  const overflow = cases.filter((c) => !ALL_GROUPED_STATUSES.has(c.status as CaseStatus));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">My Cases</h1>
            <p className="text-sm text-gray-500">Sponsorship cases you have posted</p>
          </div>
          <Link
            href="/sponsorships/new?new=1"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            <Plus size={15} />
            New Case
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 space-y-8">

        {/* Summary cards */}
        {!loading && !error && totalCount > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              <p className="mt-0.5 text-xs text-gray-500">Total Cases</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center">
              <p className="text-2xl font-bold" style={{ color: "#1a5c2a" }}>{liveCount}</p>
              <p className="mt-0.5 text-xs text-gray-500">Live Now</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center sm:col-span-1 col-span-2">
              <p className="text-2xl font-bold" style={{ color: "#92400e" }}>{reviewCount}</p>
              <p className="mt-0.5 text-xs text-gray-500">Under Review</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 rounded-2xl bg-white animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between gap-4 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={loadCases} className="text-sm font-semibold underline hover:no-underline shrink-0">
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && cases.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center">
            <Briefcase size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700">No cases posted yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Post a sponsorship case so sponsors can find and support your athlete.
            </p>
            <Link
              href="/sponsorships/new?new=1"
              className="mt-4 inline-block rounded-lg px-5 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              Post Your First Case
            </Link>
          </div>
        )}

        {/* Grouped sections */}
        {!loading && !error && grouped.map((g) => {
          if (g.items.length === 0) return null;
          return (
            <section key={g.label}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {g.label} ({g.items.length})
              </h2>
              <div className="space-y-3">
                {g.items.map((c) => (
                  <CaseCard
                    key={c.id}
                    c={c}
                    onDeleteDraft={() => setCases((prev) => prev.filter((x) => x.id !== c.id))}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Overflow: any status not in the defined groups */}
        {!loading && !error && overflow.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Other ({overflow.length})
            </h2>
            <div className="space-y-3">
              {overflow.map((c) => (
                <CaseCard
                  key={c.id}
                  c={c}
                  onDeleteDraft={() => setCases((prev) => prev.filter((x) => x.id !== c.id))}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function CaseCard({ c, onDeleteDraft }: { c: Case; onDeleteDraft?: () => void }) {
  const cfg = cfgFor(c.status);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);

  const handleDelete = async () => {
    if (c.status !== "draft") return;
    if (!confirm("Permanently delete this draft? This cannot be undone.")) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/sponsorships/${c.id}`);
      onDeleteDraft?.();
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setDeleteError(ax.response?.data?.message ?? "Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const initial = c.title.charAt(0).toUpperCase() || "?";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white text-base font-bold"
          style={{ backgroundColor: "#1a5c2a" }}
        >
          {initial}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/account/cases/${c.id}`}
              className="font-semibold text-gray-900 hover:underline truncate"
            >
              {c.title}
            </Link>
            <ExternalLink size={13} className="flex-shrink-0 text-gray-400" />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {c.sport    && <span className="capitalize">{c.sport}</span>}
            {c.category && <span>· {c.category}</span>}
            {c.target_cents != null && (
              <span>· Target: {formatCents(c.target_cents)}</span>
            )}
            <span>· Updated {formatDate(c.updated_at ?? c.created_at)}</span>
            {c.status === "draft" && (
              <span>· Step {c.wizard_step ?? 1} of 6</span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Status badge */}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ color: cfg.color, backgroundColor: cfg.bg }}
            >
              {cfg.icon}
              {cfg.label}
            </span>

            {/* Deadline */}
            {c.deadline_at && (
              <span className="text-xs text-gray-400">
                Deadline: {formatDate(c.deadline_at)}
              </span>
            )}
          </div>

          {/* Story short */}
          {c.story_short && (
            <p className="mt-2 text-xs text-gray-500 line-clamp-2">{c.story_short}</p>
          )}
        </div>
      </div>

      {/* Delete error */}
      {deleteError && (
        <p className="mt-2 text-xs text-red-600">{deleteError}</p>
      )}

      {/* Action row */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
        {c.status === "draft" ? (
          <>
            <Link
              href={`/sponsorships/new?case=${c.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1a5c2a] px-3 py-1.5 text-xs font-semibold text-[#1a5c2a] hover:bg-[#f0fdf4]"
            >
              <Pencil size={13} />
              Continue editing
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={13} />
              {deleting ? "Deleting…" : "Delete draft"}
            </button>
          </>
        ) : c.status === "pending_vouch" ? (
          <Link
            href={`/account/cases/${c.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ backgroundColor: "#7c3aed" }}
          >
            <ThumbsUp size={13} />
            Request / check vouch
          </Link>
        ) : (
          <Link
            href={`/account/cases/${c.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            <Eye size={13} />
            View Case
          </Link>
        )}

        {/* Introductions — live only */}
        {c.status === "live" && (
          <Link
            href={`/sponsorships/${c.id}#introductions`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <Users size={13} />
            Introductions
          </Link>
        )}
      </div>
    </div>
  );
}
