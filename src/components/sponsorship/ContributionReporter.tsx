"use client";

// Owner form to report in-kind, paid-to-supplier, or cash-to-payee support.
// Owner-reported rows show as "Reported by owner" until admin verifies them.

import { useState } from "react";
import { Loader2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const TYPE_LABELS: Record<string, string> = {
  in_kind:          "In-kind (goods, services, time)",
  paid_to_supplier: "Paid directly to a supplier",
  cash_to_payee:    "Cash paid directly to payee",
};

interface NeedItem {
  id: string;
  item: string;
  qty: number;
  unit_cost_cents: number;
  total_cents: number;
}

interface Contribution {
  id: string;
  type: string;
  description: string;
  value_cents: number;
  source_name: string | null;
  is_anonymous: boolean;
  evidence_url: string | null;
  need_item_id: string | null;
  verified_at: string | null;
  created_at: string;
}

interface Props {
  caseId: string;
  token: string;
  needItems: NeedItem[];
  onContributionAdded: (c: Contribution) => void;
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ContributionReporter({
  caseId,
  token,
  needItems,
  onContributionAdded,
}: Props) {
  const [type,         setType]         = useState("in_kind");
  const [description,  setDescription]  = useState("");
  const [valueUsd,     setValueUsd]     = useState("");
  const [sourceName,   setSourceName]   = useState("");
  const [isAnonymous,  setIsAnonymous]  = useState(false);
  const [evidenceUrl,  setEvidenceUrl]  = useState("");
  const [needItemId,   setNeedItemId]   = useState("");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState(false);

  const handleSubmit = async () => {
    setError(null);
    const valueCents = Math.round(parseFloat(valueUsd || "0") * 100);
    if (!description.trim() || valueCents <= 0) {
      setError("Description and value are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${BASE}/sponsorships/${caseId}/contributions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          type,
          description: description.trim(),
          value_cents: valueCents,
          source_name:  sourceName.trim() || undefined,
          is_anonymous: isAnonymous,
          evidence_url: evidenceUrl.trim() || undefined,
          need_item_id: needItemId || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Could not submit contribution.");
        return;
      }

      onContributionAdded(json.data);
      setDescription("");
      setValueUsd("");
      setSourceName("");
      setIsAnonymous(false);
      setEvidenceUrl("");
      setNeedItemId("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900 text-sm">Report a Contribution</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Record support that has arrived. Owner-reported items show as pending until GRS verifies them.
        </p>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Contribution reported. GRS will verify it shortly.
        </div>
      )}

      {/* Type */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1.5">Type of support</label>
        <div className="flex flex-col gap-1.5">
          {Object.entries(TYPE_LABELS).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="contrib-type"
                value={val}
                checked={type === val}
                onChange={() => setType(val)}
                className="accent-[#1a5c2a]"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Describe what was provided or paid…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
        />
      </div>

      {/* Value + Source */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Value (USD)</label>
          <input
            type="number"
            value={valueUsd}
            onChange={(e) => setValueUsd(e.target.value)}
            min={0.01}
            step={0.01}
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Source name (optional)</label>
          <input
            type="text"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            maxLength={255}
            placeholder="Person or org name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
          />
        </div>
      </div>

      {/* Link to need item */}
      {needItems.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">
            Linked to need item <span className="text-gray-400">(optional)</span>
          </label>
          <select
            value={needItemId}
            onChange={(e) => setNeedItemId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
          >
            <option value="">— not linked to a specific item —</option>
            {needItems.map((ni) => (
              <option key={ni.id} value={ni.id}>
                {ni.item} ({fmt(ni.total_cents)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Evidence URL */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">
          Receipt / photo URL <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="url"
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
          maxLength={2000}
          placeholder="https://…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
        />
      </div>

      {/* Anonymous toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="accent-[#1a5c2a]"
        />
        <span className="text-sm text-gray-700">Keep source anonymous on public page</span>
      </label>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-gray-400 italic">GRS records support. It does not handle money.</p>
        <button
          onClick={handleSubmit}
          disabled={saving || !description.trim() || !valueUsd}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1a5c2a] hover:bg-[#154a22] disabled:opacity-50 rounded-lg px-4 py-2 transition-colors"
        >
          {saving && <Loader2 size={12} className="animate-spin" />}
          Submit
        </button>
      </div>
    </div>
  );
}
