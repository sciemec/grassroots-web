"use client";

interface VouchRecord {
  id: string;
  status: string;
  voucher_org_name: string | null;
  invite_whatsapp: string | null;
  voucher?: { id: string; name: string } | null;
}

type EligibleCoach = { id: string; name: string; phone: string | null };

const VOUCH_ROLES = [
  { value: "coach",                  label: "Coach" },
  { value: "teacher",                label: "Teacher" },
  { value: "school_head",            label: "School Head / Principal" },
  { value: "community_leader",       label: "Community Leader" },
  { value: "club_or_league_official",label: "Club / League Official" },
  { value: "other_verified_adult",   label: "Other Verified Adult" },
];

interface VouchPanelProps {
  caseId: string;
  caseStatus: string;
  vouches: VouchRecord[];
  token: string | null;
  base: string;
  showVouchForm: boolean;
  setShowVouchForm: (v: boolean) => void;
  eligibleCoaches: EligibleCoach[];
  setEligibleCoaches: (v: EligibleCoach[]) => void;
  eligibleLoading: boolean;
  setEligibleLoading: (v: boolean) => void;
  vouchMode: "platform" | "whatsapp";
  setVouchMode: (v: "platform" | "whatsapp") => void;
  vouchUserId: string;
  setVouchUserId: (v: string) => void;
  vouchWhatsapp: string;
  setVouchWhatsapp: (v: string) => void;
  vouchRole: string;
  setVouchRole: (v: string) => void;
  vouchSubmitting: boolean;
  vouchError: string | null;
  setVouchError: (v: string | null) => void;
  vouchSuccess: boolean;
  onOpenForm: () => void;
  requestVouch: () => void;
}

export default function VouchPanel({
  caseId,
  vouches,
  token,
  base,
  showVouchForm,
  setShowVouchForm,
  eligibleCoaches,
  setEligibleCoaches,
  eligibleLoading,
  setEligibleLoading,
  vouchMode,
  setVouchMode,
  vouchUserId,
  setVouchUserId,
  vouchWhatsapp,
  setVouchWhatsapp,
  vouchRole,
  setVouchRole,
  vouchSubmitting,
  vouchError,
  setVouchError,
  vouchSuccess,
  onOpenForm,
  requestVouch,
}: VouchPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-1 text-sm">Awaiting a Vouch</h2>
      <p className="text-xs text-gray-500 mb-4">
        A coach, teacher, school head, or community leader must vouch before this case can go live.
        If no one is available, contact GRS — we can verify directly.
      </p>

      {vouches.length > 0 && (
        <div className="mb-4 space-y-2">
          {vouches.map((v) => (
            <div key={v.id} className="bg-gray-50 rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2">
              <span className="font-medium text-gray-800 truncate">
                {v.voucher_org_name ?? v.voucher?.name ?? (v.invite_whatsapp ? `WhatsApp: ${v.invite_whatsapp}` : "Pending")}
              </span>
              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full font-medium ${
                v.status === "confirmed" ? "bg-green-100 text-green-800"
                : v.status === "declined" || v.status === "revoked" ? "bg-red-100 text-red-700"
                : "bg-purple-100 text-purple-800"
              }`}>
                {v.status === "requested" ? "Waiting" : v.status.charAt(0).toUpperCase() + v.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      )}

      {vouchSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-3 py-2 text-xs font-medium mb-3">
          Vouch request sent!
        </div>
      )}

      {!showVouchForm ? (
        <button
          onClick={() => {
            onOpenForm();
            if (eligibleCoaches.length === 0 && !eligibleLoading) {
              setEligibleLoading(true);
              fetch(`${base}/sponsorships/${caseId}/eligible-vouchers`, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
              })
                .then((r) => r.ok ? r.json() : Promise.reject())
                .then((j) => setEligibleCoaches(j.data ?? []))
                .catch(() => {/* no eligible coaches found — fallback to manual entry */})
                .finally(() => setEligibleLoading(false));
            }
          }}
          className="w-full border-2 border-dashed border-[#1a5c2a]/30 hover:border-[#1a5c2a]/60 text-[#1a5c2a] text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          + Request a Voucher
        </button>
      ) : (
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-3 text-xs text-amber-800">
            <p className="font-semibold mb-0.5">What is a vouch?</p>
            <p>A vouch is a written confirmation from a coach, teacher, or club official who personally knows this athlete. It tells GRS the case is real. Once a voucher confirms, GRS reviews the case and—if approved—it goes live for sponsors to find.</p>
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setVouchMode("platform")}
              className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${vouchMode === "platform" ? "bg-[#1a5c2a] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Choose on GRS
            </button>
            <button
              onClick={() => setVouchMode("whatsapp")}
              className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${vouchMode === "whatsapp" ? "bg-[#1a5c2a] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Invite by WhatsApp
            </button>
          </div>

          {/* Role selector — required for trust level computation */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-700 block mb-1">
              Their role <span className="text-red-500">*</span>
            </label>
            <select
              value={vouchRole}
              onChange={(e) => setVouchRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 bg-white"
            >
              <option value="">— Select role —</option>
              {VOUCH_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {vouchError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs mb-3">{vouchError}</div>
          )}

          {vouchMode === "platform" ? (
            <div className="mb-3">
              {eligibleLoading ? (
                <p className="text-xs text-gray-400 py-2">Loading eligible coaches…</p>
              ) : eligibleCoaches.length > 0 ? (
                <>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Coaches who know this athlete</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {eligibleCoaches.map((coach) => (
                      <button
                        key={coach.id}
                        onClick={() => setVouchUserId(coach.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors ${
                          vouchUserId === coach.id
                            ? "border-[#1a5c2a] bg-[#f0fdf4]"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <span className="w-7 h-7 rounded-full bg-[#1a5c2a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {(coach.name ?? "?")[0].toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-800 truncate">{coach.name}</span>
                        {vouchUserId === coach.id && (
                          <span className="ml-auto text-[#1a5c2a] text-xs font-semibold">Selected</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-2">No coaches found who have this athlete on their squad or registry. You can invite one by WhatsApp instead, or enter their GRS user ID below if you know it.</p>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Coach&apos;s GRS User ID</label>
                  <input
                    type="text"
                    value={vouchUserId}
                    onChange={(e) => setVouchUserId(e.target.value)}
                    placeholder="Paste the coach's user ID from their profile"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                  />
                  <p className="text-xs text-gray-400 mt-1">The person must have a coach or admin role on GRS.</p>
                </>
              )}
            </div>
          ) : (
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-700 block mb-1">Coach&apos;s WhatsApp number</label>
              <input
                type="tel"
                value={vouchWhatsapp}
                onChange={(e) => setVouchWhatsapp(e.target.value)}
                placeholder="e.g. 0771 234 567"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
              />
              <p className="text-xs text-gray-400 mt-1">We&apos;ll send them a WhatsApp message with a link to vouch for this case.</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setShowVouchForm(false); setVouchError(null); }}
              className="flex-1 border border-gray-300 text-gray-700 text-xs font-medium py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={requestVouch}
              disabled={vouchSubmitting || !vouchRole || (vouchMode === "platform" ? !vouchUserId.trim() : !vouchWhatsapp.trim())}
              className="flex-1 bg-[#1a5c2a] text-white text-xs font-semibold py-2 rounded-lg hover:bg-[#145222] disabled:opacity-60"
            >
              {vouchSubmitting ? "Sending…" : "Send Vouch Request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
