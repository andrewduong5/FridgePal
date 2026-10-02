import React, { useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import ConsumeControl from "@/components/fridge/ConsumeControl";

const EMOJI_MAP = {
  milk: "🥛", bread: "🍞", cheese: "🧀", broccoli: "🥦", tomato: "🍅", tomatoes: "🍅",
  egg: "🥚", eggs: "🥚", chicken: "🍗", spinach: "🥬", lettuce: "🥬", apple: "🍎",
  banana: "🍌", yogurt: "🥣", butter: "🧈", carrot: "🥕", pepper: "🫑", onion: "🧅",
  potato: "🥔", fish: "🐟", beef: "🥩", ham: "🍖", juice: "🧃", cream: "🥛",
  chocolate: "🍫", tortilla: "🫓", tortillas: "🫓", oat: "🥣", oats: "🥣",
  bean: "🫘", beans: "🫘", coffee: "☕", turkey: "🦃", grape: "🍇", grapes: "🍇",
  peanut: "🥜", orange: "🍊", clementine: "🍊", pasta: "🍝"
};

const emojiFor = (name) => {
  const n = (name || "").toLowerCase();
  for (const key of Object.keys(EMOJI_MAP)) {
    if (n.includes(key)) return EMOJI_MAP[key];
  }
  return "🍽️️";
};

export default function ItemCard({ item, onConsume, onMarkWasted }) {
  const [wasteOpen, setWasteOpen] = useState(false);
  const [wasteAmount, setWasteAmount] = useState(1);

  const maxQty = Number(item.quantity) || 1;
  const unit = item.unit || "units";

  const daysLeft = differenceInCalendarDays(new Date(item.expiration_date), new Date());
  const urgent = daysLeft <= 2;
  const soon = daysLeft > 2 && daysLeft <= 5;

  const tone = urgent
    ? "from-rose-50 to-white border-rose-200"
    : soon
    ? "from-amber-50 to-white border-amber-200"
    : "from-emerald-50 to-white border-emerald-200";

  const presets = [
    { label: "1/4", value: Math.min(maxQty, Math.round(maxQty * 0.25 * 10) / 10 || 0.25) },
    { label: "1/2", value: Math.min(maxQty, Math.round(maxQty * 0.5 * 10) / 10 || 0.5) },
    { label: "1", value: Math.min(maxQty, 1) },
    { label: `All (${maxQty})`, value: maxQty },
  ].filter((p, idx, arr) => p.value <= maxQty && arr.findIndex((x) => x.value === p.value) === idx);

  const handleApplyWaste = (qty) => {
    const num = Number(qty);
    const parsed = Math.min(maxQty, Math.max(0.05, !isNaN(num) && num > 0 ? num : 1));
    const rounded = Math.round(parsed * 100) / 100;
    onMarkWasted(item, rounded);
    setWasteOpen(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className={`flex items-center justify-between bg-gradient-to-r ${tone} rounded-2xl px-5 py-4 shadow-sm border`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{emojiFor(item.name)}</span>
        <div>
          <p className="font-semibold text-stone-800">{item.name}</p>
          <p className="text-sm text-stone-500">
            Qty {item.quantity} {item.unit ? `${item.unit} ` : ""}·{" "}
            <span
              className={
                urgent
                  ? "text-rose-500 font-semibold"
                  : soon
                  ? "text-amber-600 font-semibold"
                  : "text-emerald-600 font-medium"
              }
            >
              {daysLeft < 0 ? "expired" : daysLeft === 0 ? "today!" : `${daysLeft}d left`}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <ConsumeControl item={item} onConsume={onConsume} />

        {/* Waste / Toss Modal */}
        <Dialog open={wasteOpen} onOpenChange={setWasteOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full text-stone-400 hover:text-rose-500 hover:bg-rose-50 h-10 w-10 shrink-0 transition-colors"
              title="Mark as wasted / spoiled"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </DialogTrigger>

          <DialogContent className="rounded-2xl max-w-xs p-5">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-stone-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-rose-600">
                  <AlertTriangle className="w-4 h-4" /> Toss / Waste
                </span>
                <span className="text-xs font-normal text-stone-500">
                  Have: {maxQty} {unit}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <p className="text-xs text-stone-500 -mt-1">
                How much of <b>{item.name}</b> was spoiled or discarded?
              </p>

              <div>
                <p className="text-xs text-stone-400 mb-2 font-medium">Quick Portion</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {presets.map((p) => (
                    <Button
                      key={p.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setWasteAmount(p.value)}
                      className={`rounded-lg h-8 text-xs font-semibold ${
                        wasteAmount === p.value
                          ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700"
                          : "text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-400 font-medium block mb-1.5">
                  Exact Amount Discarded ({unit})
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max={maxQty}
                    value={wasteAmount}
                    onChange={(e) => setWasteAmount(e.target.value)}
                    className="rounded-xl text-center font-bold text-base h-10 border-rose-200 focus-visible:ring-rose-500"
                  />
                  <span className="text-sm font-medium text-stone-500 min-w-[40px]">
                    {unit}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => handleApplyWaste(wasteAmount)}
                className="w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 mt-2 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Discard {wasteAmount} {unit}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}