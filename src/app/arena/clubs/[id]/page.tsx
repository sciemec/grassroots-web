"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Star, Users, ChevronRight, MessageCircle, Send, CheckCircle2, Clock, X } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const BG = "#f4f2ee";

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

interface ClubDetail {
  id: string;
  name: string;
  sport: string;
  province: string;
  tier: string;
  formation?: string;
  playing_style?: string;
  description?: string;
  member_count: number;
  is_following: boolean;
  open_for_trials: boolean;
  scouting_open: boolean;
  created_by: string;
  coach?: { id: string; name: string };
}

interface Review {
  id: string;
  reviewer: { name: string; role: string };
  rating: number;
  body: string;
  created_at: string;
}

interface TopPlayer {
  id: string;
  name: string;
  position: string;
  sport: string;
  thuto_score?: number;
}

interface JoinRequest {
  id: string;
  player_id: string;
  note?: string;
  created_at: string;
  player?: { id: string; name: string; position?: string; sport?: string; province?: string };
}

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <button key={s} onClick={() => onChange?.(s)} className={onChange ? "cursor-pointer" : "cursor-default"}>
          <Star size={16} fill={s <= rating ? "#f59e0b" : "none"} className={s <= rating ? "text-amber-400" : "text-gray-300"} />
        </button>
      ))}
    </div>
  );
}

export default function ClubDetailPage() {
  const { id = '' } = useParams<{ id: string }>() ?? {};
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [club,       setClub]       = useState<ClubDetail | null>(null);
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [joinRequestStatus, setJoinRequestStatus] = useState<string | null>(null);
  const [joinRequestId,     setJoinRequestId]     = useState<string | null>(null);
  const [showJoinModal,     setShowJoinModal]     = useState(false);
  const [joinNote,          setJoinNote]          = useState("");
  const [joinLoading,       setJoinLoading]       = useState(false);
  const [showReview,  setShowReview]  = useState(false);
  const [rating,      setRating]      = useState(5);
  const [reviewBody,  setReviewBody]  = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [showMsg,       setShowMsg]       = useState(false);
  const [msgDraft,      setMsgDraft]      = useState("");
  const [sendingMsg,    setSendingMsg]    = useState(false);
  const [msgSent,       setMsgSent]       = useState(false);
  const [joinRequests,  setJoinRequests]  = useState<JoinRequest[]>([]);
  const [respondingId,  setRespondingId]  = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    Promise.allSettled([
      fetch(`${API}/arena/clubs/${id}`,         { headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` } }),
      fetch(`${API}/arena/clubs/${id}/reviews`,  { headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` } }),
      fetch(`${API}/arena/clubs/${id}/players`,  { headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` } }),
    ]).then(async ([clubRes, revRes, playersRes]) => {
      if (clubRes.status === "fulfilled" && clubRes.value.ok) {
        const json = await clubRes.value.json();
        setClub(json.club ?? json.data ?? json);
        // join_request_status and join_request_id are at the top level of the show() response
        if (json.join_request_status !== undefined) setJoinRequestStatus(json.join_request_status);
        if (json.join_request_id     !== undefined) setJoinRequestId(json.join_request_id);
      }
      if (revRes.status === "fulfilled" && revRes.value.ok) {
        const json = await revRes.value.json();
        setReviews(safeArray(json.data ?? json));
      }
      if (playersRes.status === "fulfilled" && playersRes.value.ok) {
        const json = await playersRes.value.json();
        setTopPlayers(safeArray(json.data ?? json));
      }
    }).finally(() => setLoading(false));
  }, [token, id]);

  // Load pending join requests when this user is the club coach
  useEffect(() => {
    if (!token || !id || !user) return;
    fetch(`${API}/arena/clubs/${id}/join-requests`, {
      headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
    }).then(async (res) => {
      if (res.ok) {
        const json = await res.json();
        setJoinRequests(safeArray<JoinRequest>(json.data ?? json));
      }
    }).catch(() => {});
  }, [token, id, user]);

  const requestToJoin = async () => {
    if (!token || !club || joinLoading) return;
    setJoinLoading(true);
    try {
      const res = await fetch(`${API}/arena/clubs/${id}/join-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
        body: JSON.stringify({ note: joinNote.trim() || null }),
      });
      if (res.ok) {
        const json = await res.json();
        setJoinRequestStatus("pending");
        setJoinRequestId(json.join_request?.id ?? null);
        setShowJoinModal(false);
        setJoinNote("");
      }
    } catch {}
    setJoinLoading(false);
  };

  const withdrawMyRequest = async () => {
    if (!token || !joinRequestId || joinLoading) return;
    setJoinLoading(true);
    try {
      const res = await fetch(`${API}/arena/clubs/join-requests/${joinRequestId}/withdraw`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
      });
      if (res.ok) {
        setJoinRequestStatus("withdrawn");
        setJoinRequestId(null);
      }
    } catch {}
    setJoinLoading(false);
  };

  const submitReview = async () => {
    if (!token || !reviewBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/arena/clubs/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
        body: JSON.stringify({ rating, body: reviewBody }),
      });
      if (res.ok) {
        const json = await res.json();
        setReviews((r) => [json.data ?? json, ...r]);
        setShowReview(false);
        setReviewBody("");
        setRating(5);
      }
    } catch {}
    setSubmitting(false);
  };

  const respondToJoinRequest = async (requestId: string, action: "approve" | "decline") => {
    setRespondingId(requestId);
    try {
      const res = await fetch(`${API}/arena/clubs/join-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
        if (action === "approve") {
          setClub((c) => c ? { ...c, member_count: c.member_count + 1 } : c);
        }
      }
    } catch {}
    setRespondingId(null);
  };

  const sendMessage = async () => {
    if (!msgDraft.trim() || !club?.coach?.id || !token) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${API}/arena/messages/${club.coach.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
        body: JSON.stringify({ body: msgDraft.trim() }),
      });
      if (res.ok) {
        setMsgSent(true);
        setMsgDraft("");
        setShowMsg(false);
      }
    } catch {}
    setSendingMsg(false);
  };

  if (!hasHydrated) return null;

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link href="/arena/clubs" className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft size={18} className="text-gray-600" />
            </Link>
            <span className="font-semibold text-sm text-gray-900">Clubs</span>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <Users size={56} className="mx-auto text-gray-300 mb-4" />
          <p className="font-bold text-lg text-gray-800 mb-1">Join to view this club</p>
          <p className="text-gray-400 text-sm mb-6">
            Sign in to view club details, members, and reviews<br />across Zimbabwe.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="/login" className="inline-block px-6 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: GRS_GREEN }}>Sign in →</a>
            <a href="/register" className="inline-block px-6 py-2.5 rounded-lg text-sm font-bold border" style={{ borderColor: GRS_GREEN, color: GRS_GREEN }}>Join free →</a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {[1,2,3].map((i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          Club not found. <Link href="/arena/clubs" className="font-medium" style={{ color: GRS_GREEN }}>Back to clubs</Link>
        </div>
      </div>
    );
  }

  const initials = club.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      {/* Sticky nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/arena/clubs" className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <span className="font-semibold text-sm text-gray-900">{club.name}</span>
          <div className="ml-auto hidden md:flex items-center gap-1 text-sm">
            {[
              { href: "/arena", label: "Feed" },
              { href: "/arena/network", label: "Network" },
              { href: "/arena/clubs", label: "Clubs" },
              { href: "/arena/recruitment", label: "Talent Board" },
              { href: "/arena/messages", label: "Messages" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="px-3 py-1 rounded-full text-gray-600 hover:bg-gray-100 font-medium"
                style={href === "/arena/clubs" ? { background: GRS_GREEN, color: "#fff" } : {}}>{label}</Link>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Club header card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0" style={{ background: GRS_GREEN }}>{initials}</div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900">{club.name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-500">
                <span className="capitalize">{club.sport}</span>
                <span className="flex items-center gap-1"><MapPin size={11} />{club.province}</span>
                <span>{club.tier}</span>
                {avgRating && <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" fill="#fbbf24" />{avgRating}</span>}
              </div>
              {club.description && <p className="text-sm text-gray-600 mt-2">{club.description}</p>}
              <div className="flex gap-2 mt-2 flex-wrap">
                {club.open_for_trials && <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#f0fdf4", color: GRS_GREEN }}>Open for trials</span>}
                {club.scouting_open   && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Scouting open</span>}
                {club.formation       && <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-gray-50">{club.formation}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users size={15} />
              <span>{club.member_count} members</span>
            </div>
            <div className="flex items-center gap-2">
              {club.coach?.id && club.coach.id !== user?.id && (
                <button
                  onClick={() => { setShowMsg((v) => !v); setMsgSent(false); }}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border transition-colors"
                  style={showMsg
                    ? { background: "#f0fdf4", borderColor: "#bbf7d0", color: GRS_GREEN }
                    : { borderColor: "#d1d5db", color: "#374151" }}>
                  <MessageCircle size={14} />
                  {msgSent ? "Sent ✓" : "Message Coach"}
                </button>
              )}
              {/* Join request button — status-aware */}
              {joinRequestStatus === "approved" ? (
                <span className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full"
                  style={{ background: "#f0fdf4", color: GRS_GREEN }}>
                  <CheckCircle2 size={14} /> Member
                </span>
              ) : joinRequestStatus === "pending" ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full"
                    style={{ background: "#fef9c3", color: "#854d0e" }}>
                    <Clock size={12} /> Pending
                  </span>
                  <button onClick={withdrawMyRequest} disabled={joinLoading}
                    className="text-xs font-medium px-3 py-2 rounded-full border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 transition-colors disabled:opacity-50">
                    {joinLoading ? "..." : "Withdraw"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border transition-colors"
                  style={{ borderColor: GRS_GREEN, color: GRS_GREEN }}>
                  <Send size={13} />
                  {joinRequestStatus === "declined" || joinRequestStatus === "withdrawn" ? "Re-apply" : "Request to Join"}
                </button>
              )}
            </div>
          </div>

          {/* Inline message compose */}
          {showMsg && club.coach?.id && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <p className="text-xs text-gray-500">
                Send a message to <span className="font-semibold text-gray-700">{club.coach.name}</span>
              </p>
              <textarea
                value={msgDraft}
                onChange={(e) => setMsgDraft(e.target.value)}
                placeholder={`Hi, I'm interested in ${club.name}...`}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-green-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={sendMessage}
                  disabled={sendingMsg || !msgDraft.trim()}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: GRS_GREEN }}>
                  {sendingMsg ? "Sending..." : "Send Message"}
                </button>
                <button
                  onClick={() => setShowMsg(false)}
                  className="px-4 py-2 rounded-full text-xs border border-gray-200 text-gray-600">
                  Cancel
                </button>
                {msgSent && (
                  <Link href={`/arena/messages?user=${club.coach.id}`}
                    className="px-4 py-2 rounded-full text-xs font-semibold"
                    style={{ color: GRS_GREEN }}>
                    View conversation →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

      {/* Join request modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-bold text-gray-900">Request to Join</p>
                <p className="text-xs text-gray-500 mt-0.5">{club.name}</p>
              </div>
              <button onClick={() => { setShowJoinModal(false); setJoinNote(""); }}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <textarea
              value={joinNote}
              onChange={(e) => setJoinNote(e.target.value)}
              placeholder="Optional: tell the coach a bit about yourself..."
              rows={3}
              maxLength={300}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-green-400 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowJoinModal(false); setJoinNote(""); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium">
                Cancel
              </button>
              <button onClick={requestToJoin} disabled={joinLoading}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: GRS_GREEN }}>
                {joinLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Top Players */}
        {topPlayers.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-sm text-gray-900 mb-3">Top Players</h2>
            <div className="grid grid-cols-2 gap-3">
              {topPlayers.slice(0, 6).map((p) => {
                const pi = p.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                const score = p.thuto_score ?? 0;
                return (
                  <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: GRS_GREEN }}>{pi}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{p.position}</p>
                    </div>
                    {score > 0 && (
                      <span className="ml-auto text-xs font-bold flex-shrink-0"
                        style={{ color: score >= 75 ? GRS_GREEN : score >= 55 ? "#d97706" : "#dc2626" }}>
                        {score}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Join Requests — visible to coach only */}
        {club.coach?.id === user?.id && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h2 className="font-semibold text-sm text-gray-900">
              Join Requests
              {joinRequests.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold" style={{ background: GRS_GREEN }}>
                  {joinRequests.length}
                </span>
              )}
            </h2>

            {joinRequests.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {joinRequests.map((req) => {
                  const pi = (req.player?.name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                  const busy = respondingId === req.id;
                  return (
                    <div key={req.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: GRS_GREEN }}>{pi}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{req.player?.name ?? "Unknown player"}</p>
                        {req.player?.position && (
                          <p className="text-xs text-gray-500 capitalize">{req.player.position}{req.player.province ? ` · ${req.player.province}` : ""}</p>
                        )}
                        {req.note && (
                          <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{req.note}&rdquo;</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => respondToJoinRequest(req.id, "approve")}
                          disabled={busy}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold text-white disabled:opacity-50"
                          style={{ background: GRS_GREEN }}>
                          {busy ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => respondToJoinRequest(req.id, "decline")}
                          disabled={busy}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 text-gray-600 disabled:opacity-50">
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-gray-900">Reviews {reviews.length > 0 && `(${reviews.length})`}</h2>
            <button onClick={() => setShowReview((v) => !v)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
              style={{ borderColor: GRS_GREEN, color: GRS_GREEN }}>
              Write review
            </button>
          </div>

          {showReview && (
            <div className="p-3 rounded-xl bg-gray-50 space-y-3">
              <StarRating rating={rating} onChange={setRating} />
              <textarea value={reviewBody} onChange={(e) => setReviewBody(e.target.value)}
                placeholder="Share your experience with this club..."
                rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none" />
              <div className="flex gap-2">
                <button onClick={submitReview} disabled={submitting || !reviewBody.trim()}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: GRS_GREEN }}>
                  {submitting ? "Posting..." : "Post Review"}
                </button>
                <button onClick={() => setShowReview(false)} className="px-4 py-2 rounded-full text-xs border border-gray-200 text-gray-600">Cancel</button>
              </div>
            </div>
          )}

          {reviews.length === 0 && !showReview && (
            <p className="text-sm text-gray-400 text-center py-4">No reviews yet. Be the first.</p>
          )}

          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-900">{r.reviewer.name}</p>
                  <StarRating rating={r.rating} />
                </div>
                <p className="text-xs text-gray-600 mt-1">{r.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back link */}
        <Link href="/arena/clubs" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14} /> All Clubs
        </Link>
      </div>
    </div>
  );
}
