import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

const DEFAULT_SEASONINGS = ["Salt", "Black Pepper", "Olive Oil", "Garlic Powder", "Soy Sauce"];
const STORAGE_KEY = "fridgepal_seasonings";

export default function SeasoningsPanel({ onSeasoningsChange }) {
  const [seasonings, setSeasonings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SEASONINGS;
  });
  const [newSeasoning, setNewSeasoning] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seasonings));
    onSeasoningsChange?.(seasonings);
  }, [seasonings, onSeasoningsChange]);

  const addSeasoning = (e) => {
    e.preventDefault();
    if (!newSeasoning.trim()) return;
    if (!seasonings.includes(newSeasoning.trim())) {
      setSeasonings([...seasonings, newSeasoning.trim()]);
    }
    setNewSeasoning("");
  };

  const removeSeasoning = (name) => {
    setSeasonings(seasonings.filter((s) => s !== name));
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Pantry & Seasonings</p>
        <span className="text-xs text-stone-400">{seasonings.length} available</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {seasonings.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 text-xs px-2.5 py-1 rounded-full font-medium"
          >
            {s}
            <button type="button" onClick={() => removeSeasoning(s)} className="text-stone-400 hover:text-stone-700">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <form onSubmit={addSeasoning} className="flex gap-2">
        <Input
          value={newSeasoning}
          onChange={(e) => setNewSeasoning(e.target.value)}
          placeholder="Add seasoning (e.g. Cumin, Paprika)..."
          className="h-8 text-xs rounded-xl"
        />
        <Button type="submit" size="sm" variant="outline" className="h-8 rounded-xl px-3 text-xs">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
}