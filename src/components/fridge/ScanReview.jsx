import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Minus, Plus, RotateCcw } from "lucide-react";

const CATEGORY_COLORS = {
  Produce: "bg-green-100 text-green-700",
  "Dairy/Alts": "bg-blue-100 text-blue-700",
  "Meat/Seafood": "bg-rose-100 text-rose-700",
  Bakery: "bg-amber-100 text-amber-700",
  Pantry: "bg-stone-200 text-stone-700",
  Frozen: "bg-cyan-100 text-cyan-700",
};

export default function ScanReview({ items, imageUrl, onConfirm, onRetake }) {
  const [rows, setRows] = useState(() =>
    items.map((i) => ({
      name: String(i.name),
      quantity: Number(i.quantity) || 1,
      category: i.category || "Pantry",
      shelf_life_days: Number(i.shelf_life_days) || 7,
    }))
  );
  const [saving, setSaving] = useState(false);

  const update = (idx, patch) => setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const remove = (idx) => setRows((rs) => rs.filter((_, i) => i !== idx));
  const bumpQty = (idx, delta) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, quantity: Math.max(1, (Number(r.quantity) || 1) + delta) } : r)));

  const submit = async () => {
    setSaving(true);
    await onConfirm(rows);
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">
          {rows.length} item{rows.length !== 1 ? "s" : ""} detected — review before adding.
        </p>
        <Button variant="ghost" size="sm" className="text-emerald-700 hover:bg-emerald-50 gap-1" onClick={onRetake}>
          <RotateCcw className="w-4 h-4" /> Retake
        </Button>
      </div>

      {imageUrl && (
        <img src={imageUrl} alt="scanned" className="w-full max-h-32 object-cover rounded-xl border border-stone-200" />
      )}

      <div className="max-h-[48vh] overflow-y-auto space-y-2 pr-1">
        {rows.length === 0 && (
          <p className="text-center text-stone-400 py-8 text-sm">No items detected. Try a clearer photo.</p>
        )}
        {rows.map((r, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-stone-200 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={r.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                className="rounded-lg flex-1 font-medium"
              />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-stone-400 hover:text-rose-500 p-1.5 shrink-0"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">Qty</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => bumpQty(idx, -1)} className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-semibold">{r.quantity}</span>
                  <button type="button" onClick={() => bumpQty(idx, 1)} className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${CATEGORY_COLORS[r.category] || "bg-stone-100 text-stone-600"}`}>
                {r.category}
              </span>
              <label className="flex items-center gap-1 text-xs text-stone-400">
                Shelf
                <Input
                  type="number"
                  min="1"
                  value={r.shelf_life_days}
                  onChange={(e) => update(idx, { shelf_life_days: e.target.value })}
                  className="rounded-lg w-14 text-center h-8"
                />
                d
              </label>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={submit} disabled={saving || rows.length === 0} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700">
        {saving ? "Adding..." : `Add All to Fridge (${rows.length})`}
      </Button>
    </div>
  );
}