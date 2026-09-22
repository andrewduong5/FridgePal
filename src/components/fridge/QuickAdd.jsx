import React, { useState } from "react";
import { addDays, format } from "date-fns";
import { fridgePalClient } from "@/api/fridgePalClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Sparkles } from "lucide-react";

const SHELF_LIFE = {
  milk: 7, cream: 7, yogurt: 10, juice: 10, butter: 30, cheese: 14, "cottage cheese": 12,
  eggs: 21, chicken: 3, beef: 3, ham: 7, bacon: 7, fish: 2, shrimp: 2,
  bread: 6, bagel: 6, "tortilla": 14, noodles: 30, pasta: 30, rice: 30,
  spinach: 5, lettuce: 5, greens: 5, salad: 4, arugula: 5, kale: 7,
  tomato: 7, tomatoes: 7, broccoli: 7, pepper: 7, cucumber: 7, carrot: 21,
  onion: 30, potato: 30, mushroom: 5, corn: 5, avocado: 5, zucchini: 7,
  apple: 21, banana: 5, berries: 5, strawberry: 5, blueberry: 5, grape: 7,
  orange: 14, lemon: 21, lime: 21, peach: 5, pear: 7,
};
const estimateDays = (name) => {
  const n = (name || "").toLowerCase();
  for (const key of Object.keys(SHELF_LIFE)) if (n.includes(key)) return SHELF_LIFE[key];
  return 7;
};
const guessDate = (name) => format(addDays(new Date(), estimateDays(name)), "yyyy-MM-dd");

const emptyRow = () => ({ name: "", quantity: 1, expiration_date: "", dateEdited: false });

export default function QuickAdd({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(() => Array.from({ length: 4 }, emptyRow));
  const [saving, setSaving] = useState(false);

  const validRows = rows.filter((r) => r.name.trim());

  const update = (idx, patch) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const onNameChange = (idx, v) =>
    setRows((rs) =>
      rs.map((r, i) =>
        i === idx
          ? { ...r, name: v, expiration_date: r.dateEdited ? r.expiration_date : v.trim() ? guessDate(v) : "" }
          : r
      )
    );

  const onDateChange = (idx, val) =>
    update(idx, { expiration_date: val, dateEdited: true });

  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const removeRow = (idx) => setRows((rs) => rs.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!validRows.length) return;
    setSaving(true);
    await fridgePalClient.entities.GroceryItem.bulkCreate(
      validRows.map((r) => ({
        name: r.name.trim(),
        quantity: Number(r.quantity) || 1,
        expiration_date: r.expiration_date || guessDate(r.name),
        status: "active",
      }))
    );
    setSaving(false);
    setRows(Array.from({ length: 4 }, emptyRow));
    setOpen(false);
    onAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-md gap-2 px-5">
          <Plus className="w-4 h-4" /> Add Items
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-h-[88vh]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" /> Quick Add Groceries
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-stone-500 -mt-1">
          Add everything in your bag at once. Expiry dates are auto-guessed — tap to change.
        </p>

        <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
          {rows.map((r, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={r.name}
                onChange={(e) => onNameChange(idx, e.target.value)}
                placeholder="Item name"
                className="rounded-xl flex-1"
              />
              <Input
                type="number"
                min="1"
                value={r.quantity}
                onChange={(e) => update(idx, { quantity: e.target.value })}
                className="rounded-xl w-14 text-center"
              />
              <Input
                type="date"
                value={r.expiration_date}
                onChange={(e) => onDateChange(idx, e.target.value)}
                className="rounded-xl w-[40%]"
              />
              {rows.length > 1 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full text-stone-400 hover:bg-stone-100 h-9 w-9 shrink-0"
                  onClick={() => removeRow(idx)}
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          className="rounded-full text-emerald-700 hover:bg-emerald-50 self-start -my-1"
          onClick={addRow}
        >
          <Plus className="w-4 h-4" /> Add another item
        </Button>

        <Button
          onClick={submit}
          disabled={saving || !validRows.length}
          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700"
        >
          {saving ? "Adding..." : `Add all to fridge${validRows.length ? ` (${validRows.length})` : ""}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}