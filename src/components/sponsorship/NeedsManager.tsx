"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Loader2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface NeedItem {
  id: string;
  item: string;
  qty: number;
  unit_cost_cents: number;
  total_cents: number;
}

interface Props {
  caseId: string;
  token: string;
  /** If true the case is live — editing is still allowed for record-keeping */
  isLive?: boolean;
}

export default function NeedsManager({ caseId, token, isLive = false }: Props) {
  const [items,       setItems]       = useState<NeedItem[]>([]);
  const [targetCents, setTargetCents] = useState<number>(0);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // New item form
  const [newItem,     setNewItem]     = useState("");
  const [newQty,      setNewQty]      = useState("1");
  const [newUnitUsd,  setNewUnitUsd]  = useState("");

  useEffect(() => {
    if (!caseId || !token) return;
    fetch(`${BASE}/sponsorships/${caseId}/needs`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j) {
          setItems(j.data ?? []);
          setTargetCents(j.target_cents ?? 0);
        }
      })
      .finally(() => setLoading(false));
  }, [caseId, token]);

  const handleAdd = async () => {
    const unitCents = Math.round(parseFloat(newUnitUsd || "0") * 100);
    if (!newItem.trim() || unitCents <= 0) {
      setError("Item name and cost are required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/sponsorships/${caseId}/needs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          item: newItem.trim(),
          qty: parseInt(newQty, 10) || 1,
          unit_cost_cents: unitCents,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Could not add item.");
        return;
      }
      setItems((prev) => [...prev, json.data]);
      setTargetCents(json.target_cents ?? targetCents);
      setNewItem("");
      setNewQty("1");
      setNewUnitUsd("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/sponsorships/${caseId}/needs/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        setTargetCents(json.target_cents ?? 0);
      }
    } catch {
      // silent — item remains in list
    } finally {
      setSaving(false);
    }
  };

  const grandTotal = items.reduce((s, i) => s + i.total_cents, 0);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
        <Loader2 size={14} className="animate-spin" />
        Loading needs list…
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900 text-sm">Needs List</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Break your target down into specific items. The total auto-sets the case target.
        </p>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Table */}
      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left pb-1.5 font-medium">Item</th>
                <th className="text-right pb-1.5 font-medium">Qty</th>
                <th className="text-right pb-1.5 font-medium">Unit cost</th>
                <th className="text-right pb-1.5 font-medium">Total</th>
                <th className="pb-1.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.id} className="group">
                  <td className="py-2 pr-2 text-gray-800">{item.item}</td>
                  <td className="py-2 text-right text-gray-600">{item.qty}</td>
                  <td className="py-2 text-right text-gray-600">{fmt(item.unit_cost_cents)}</td>
                  <td className="py-2 text-right font-medium text-gray-900">{fmt(item.total_cents)}</td>
                  <td className="py-2 pl-2">
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={saving}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={3} className="pt-2 text-xs font-semibold text-gray-500">Total target</td>
                <td className="pt-2 text-right font-bold text-[#1a5c2a]">{fmt(grandTotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-3">No items yet. Add the first one below.</p>
      )}

      {/* Add form */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 mb-2">Add an item</p>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="e.g. Football boots"
            maxLength={200}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
          />
          <input
            type="number"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            min={1}
            max={9999}
            placeholder="Qty"
            className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 text-center"
          />
          <input
            type="number"
            value={newUnitUsd}
            onChange={(e) => setNewUnitUsd(e.target.value)}
            min={0.01}
            step={0.01}
            placeholder="Unit $"
            className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
          />
        </div>
        {newItem && newUnitUsd && (
          <p className="text-xs text-gray-500 mb-2">
            Line total: {fmt(Math.round(parseFloat(newUnitUsd || "0") * 100 * (parseInt(newQty, 10) || 1)))}
          </p>
        )}
        <button
          onClick={handleAdd}
          disabled={saving || !newItem.trim() || !newUnitUsd}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1a5c2a] hover:bg-[#154a22] disabled:opacity-50 rounded-lg px-4 py-2 transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Add item
        </button>
      </div>

      {isLive && (
        <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-3">
          GRS records support. It does not handle money. Items are for tracking purposes only.
        </p>
      )}
    </div>
  );
}
