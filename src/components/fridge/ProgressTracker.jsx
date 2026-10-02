import React from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Leaf, Zap } from "lucide-react";

const LEVELS = [
  { minXP: 0, name: "Fridge Sprout", emoji: "🌱" },
  { minXP: 40, name: "Fresh Keeper", emoji: "🥬" },
  { minXP: 100, name: "Eco Saver", emoji: "♻️" },
  { minXP: 200, name: "Waste Warrior", emoji: "🛡️" },
  { minXP: 350, name: "Master Chef", emoji: "👑" },
];

const BADGES = [
  { id: "first", label: "First Bite", emoji: "🍴", test: (s) => s.used >= 1 || s.recipes >= 1 },
  { id: "chef1", label: "Home Cook", emoji: "🍳", test: (s) => s.recipes >= 1 },
  { id: "chef3", label: "Sous Chef", emoji: "👨‍🍳", test: (s) => s.recipes >= 3 },
  { id: "streak3", label: "3-Streak", emoji: "🔥", test: (s) => s.streak >= 3 },
  { id: "zero5", label: "Zero-Waste 5", emoji: "✨", test: (s) => s.used >= 5 && s.wasted === 0 },
  { id: "level3", label: "Eco Saver", emoji: "♻️", test: (s) => s.xp >= 100 },
];

export default function ProgressTracker({ history = [], recipeCount = 0, cookingXP = 0 }) {
  const used = history.filter((i) => i.status === "used" || i.status === "consumed");
  const wasted = history.filter((i) => i.status === "wasted");
  const usedCount = used.length;

  let streak = 0;
  const sorted = [...history].sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0));
  for (const item of sorted) {
    if (item.status === "used" || item.status === "consumed") streak++;
    else if (item.status === "wasted") break;
  }
  if (recipeCount > 0 && streak === 0) streak = 1;

  // Total XP = 10 XP for completely finished items + Cooking XP (proportional to ingredients used)
  const totalXP = usedCount * 10 + cookingXP;

  const currentLevelIndex = [...LEVELS].reverse().findIndex((l) => totalXP >= l.minXP);
  const actualIndex = currentLevelIndex !== -1 ? LEVELS.length - 1 - currentLevelIndex : 0;
  const level = LEVELS[actualIndex];
  const nextLevel = LEVELS[actualIndex + 1];

  const currentLevelMin = level.minXP;
  const nextLevelMin = nextLevel ? nextLevel.minXP : currentLevelMin + 50;
  const xpInLevel = totalXP - currentLevelMin;
  const xpNeededForNext = nextLevelMin - currentLevelMin;
  const progress = nextLevel ? Math.min(100, Math.max(0, (xpInLevel / xpNeededForNext) * 100)) : 100;

  const stats = { used: usedCount, wasted: wasted.length, streak, recipes: recipeCount, xp: totalXP };
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
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-stone-400 uppercase tracking-wide font-semibold">Your Rank</p>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Zap className="w-3 h-3 fill-emerald-600 text-emerald-600" /> {totalXP} XP
              </span>
            </div>
            <p className="font-bold text-stone-800 text-lg leading-tight">{level.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-500 px-3 py-1.5 rounded-full font-bold text-sm">
          <Flame className="w-4 h-4 fill-orange-500" /> {streak}
        </div>
      </div>

      <div className="relative">
        <div className="flex justify-between text-xs text-stone-500 mb-1">
          <span>{recipeCount} meal{recipeCount !== 1 ? "s" : ""} cooked · {usedCount} items finished</span>
          <span>{nextLevel ? `${nextLevel.minXP - totalXP} XP to ${nextLevel.name}` : "Max rank!"}</span>
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
          <Trophy className="w-3.5 h-3.5 text-amber-500" /> Badges ({unlockedBadges.length}/{BADGES.length})
        </p>
        <div className="flex gap-2 flex-wrap">
          {unlockedBadges.length === 0 ? (
            <p className="text-sm text-stone-400 italic flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5" /> Cook a meal or finish an item to earn a badge!
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