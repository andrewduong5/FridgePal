import React from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Leaf } from "lucide-react";

const LEVELS = [
  { min: 0, name: "Fridge Sprout", emoji: "🌱" },
  { min: 3, name: "Fresh Keeper", emoji: "🥬" },
  { min: 8, name: "Eco Saver", emoji: "♻️" },
  { min: 15, name: "Waste Warrior", emoji: "🛡️" },
  { min: 25, name: "Fridge Master", emoji: "👑" },
];

const BADGES = [
  { id: "first", label: "First Bite", emoji: "🍴", test: (s) => s.used >= 1 },
  { id: "streak3", label: "3-Streak", emoji: "🔥", test: (s) => s.streak >= 3 },
  { id: "zero5", label: "Zero-Waste 5", emoji: "✨", test: (s) => s.used >= 5 && s.wasted === 0 },
  { id: "chef", label: "Recipe Explorer", emoji: "🍳", test: (s) => s.recipes >= 1 },
  { id: "level3", label: "Eco Saver", emoji: "♻️", test: (s) => s.used >= 8 },
];

export default function ProgressTracker({ history, recipeCount }) {
  const used = history.filter((i) => i.status === "used");
  const wasted = history.filter((i) => i.status === "wasted");
  const usedCount = used.length;

  let streak = 0;
  const sorted = [...history].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
  for (const item of sorted) {
    if (item.status === "used") streak++;
    else if (item.status === "wasted") break;
  }

  const level = [...LEVELS].reverse().find((l) => usedCount >= l.min) || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.min > usedCount);
  const xpInLevel = usedCount - level.min;
  const xpForNext = nextLevel ? nextLevel.min - level.min : 1;
  const progress = nextLevel ? Math.min(100, (xpInLevel / xpForNext) * 100) : 100;

  const stats = { used: usedCount, wasted: wasted.length, streak, recipes: recipeCount };
  const unlockedBadges = BADGES.filter((b) => b.test(stats));

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 space-y-4 overflow-hidden relative">
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-100 rounded-full opacity-60" />
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, repeatDelay: 1 }}
            className="text-4xl"
          >
            {level.emoji}
          </motion.div>
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold">Your Rank</p>
            <p className="font-bold text-stone-800 text-lg leading-tight">{level.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-500 px-3 py-1.5 rounded-full font-bold text-sm">
          <Flame className="w-4 h-4" /> {streak}
        </div>
      </div>

      <div className="relative">
        <div className="flex justify-between text-xs text-stone-500 mb-1">
          <span>{usedCount} items saved</span>
          <span>{nextLevel ? `${nextLevel.min - usedCount} to ${nextLevel.name}` : "Max rank!"}</span>
        </div>
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          />
        </div>
      </div>

      <div>
        <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold mb-2 flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5" /> Badges
        </p>
        <div className="flex gap-2 flex-wrap">
          {unlockedBadges.length === 0 ? (
            <p className="text-sm text-stone-400 italic flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5" /> Save your first item to earn a badge!
            </p>
          ) : (
            unlockedBadges.map((b) => (
              <motion.span
                key={b.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-full px-3 py-1.5 text-sm font-medium text-stone-700"
                title={b.label}
              >
                <span className="text-base">{b.emoji}</span> {b.label}
              </motion.span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}