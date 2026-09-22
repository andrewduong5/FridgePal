import React from "react";
import { differenceInCalendarDays } from "date-fns";
import { motion } from "framer-motion";
import { BellRing } from "lucide-react";

export default function ExpiringBanner({ items }) {
  const expiringSoon = items
    .filter((i) => differenceInCalendarDays(new Date(i.expiration_date), new Date()) <= 2)
    .sort((a, b) => differenceInCalendarDays(new Date(a.expiration_date), new Date()) - differenceInCalendarDays(new Date(b.expiration_date), new Date()));
  if (expiringSoon.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 bg-gradient-to-r from-amber-100 to-rose-100 border border-amber-300 rounded-2xl px-5 py-4"
    >
      <motion.span
        animate={{ rotate: [0, -12, 12, -8, 0] }}
        transition={{ repeat: Infinity, duration: 1.6, repeatDelay: 1 }}
      >
        <BellRing className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
      </motion.span>
      <p className="text-amber-900 text-sm leading-relaxed">
        <span className="font-bold">{expiringSoon.length} item{expiringSoon.length > 1 ? "s" : ""}</span> need attention soon:{" "}
        {expiringSoon.map((i) => i.name).join(", ")} 🍽️
      </p>
    </motion.div>
  );
}