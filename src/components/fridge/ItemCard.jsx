import React from "react";
import { differenceInCalendarDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import ConsumeControl from "@/components/fridge/ConsumeControl";

const EMOJI_MAP = {
  milk: "🥛", bread: "🍞", cheese: "🧀", broccoli: "🥦", tomato: "🍅", tomatoes: "🍅",
  egg: "🥚", eggs: "🥚", chicken: "🍗", spinach: "🥬", lettuce: "🥬", apple: "🍎",
  banana: "🍌", yogurt: "🥣", butter: "🧈", carrot: "🥕", pepper: "🫑", onion: "🧅",
  potato: "🥔", fish: "🐟", beef: "🥩", ham: "🍖", juice: "🧃", cream: "🥛",
};

const emojiFor = (name) => {
  const n = (name || "").toLowerCase();
  for (const key of Object.keys(EMOJI_MAP)) {
    if (n.includes(key)) return EMOJI_MAP[key];
  }
  return "🍽️";
};

export default function ItemCard({ item, onConsume, onMarkWasted }) {
  const daysLeft = differenceInCalendarDays(new Date(item.expiration_date), new Date());
  const urgent = daysLeft <= 2;
  const soon = daysLeft > 2 && daysLeft <= 5;

  const tone = urgent
    ? "from-rose-50 to-white border-rose-200"
    : soon
    ? "from-amber-50 to-white border-amber-200"
    : "from-emerald-50 to-white border-emerald-200";

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
            Qty {item.quantity} ·{" "}
            <span className={urgent ? "text-rose-500 font-semibold" : soon ? "text-amber-600 font-semibold" : "text-emerald-600 font-medium"}>
              {daysLeft < 0 ? "expired" : daysLeft === 0 ? "today!" : `${daysLeft}d left`}
            </span>
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <ConsumeControl item={item} onConsume={onConsume} />
        <Button size="icon" variant="ghost" className="rounded-full text-stone-400 hover:bg-stone-100 h-10 w-10" onClick={() => onMarkWasted(item)} title="Mark as wasted">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}