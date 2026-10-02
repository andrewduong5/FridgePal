import React, { useState, useEffect } from "react";
import { fridgePalClient } from "@/api/fridgePalClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Sparkles, Loader2, Calendar } from "lucide-react";

// Standard USDA / FoodKeeper typical refrigerated shelf life (in days)
const SHELF_LIFE_DATABASE = {
  // Produce - Berries & Greens (very perishable: 3-5 days)
  berries: 4,
  strawberries: 4,
  blueberries: 7,
  raspberries: 3,
  blackberries: 3,
  spinach: 5,
  arugula: 5,
  lettuce: 7,
  romaine: 7,
  kale: 7,
  mushrooms: 5,
  asparagus: 4,
  herbs: 6,
  cilantro: 7,
  parsley: 7,

  // Produce - Hearty Veg & Fruit (7-21 days)
  broccoli: 7,
  cauliflower: 7,
  carrots: 21,
  celery: 14,
  cabbage: 21,
  cucumber: 7,
  zucchini: 5,
  bell_pepper: 10,
  peppers: 10,
  apples: 28,
  oranges: 21,
  lemons: 21,
  limes: 21,
  grapes: 7,
  avocado: 4,
  bananas: 5,
  tomatoes: 7,
  potatoes: 30,
  sweet_potatoes: 28,
  onions: 30,
  garlic: 60,

  // Dairy & Alternatives
  milk: 7,
  almond_milk: 10,
  oat_milk: 10,
  heavy_cream: 10,
  sour_cream: 14,
  yogurt: 14,
  greek_yogurt: 14,
  cottage_cheese: 10,
  butter: 60,
  cheddar: 28,
  cheese: 21,
  mozzarella: 14,
  parmesan: 90,
  eggs: 28,
  tofu: 7,

  // Meat & Seafood (highly perishable)
  chicken: 2,
  poultry: 2,
  ground_beef: 2,
  ground_turkey: 2,
  steak: 4,
  beef: 4,
  pork: 4,
  bacon: 14,
  sausage: 3,
  deli_meat: 5,
  salmon: 2,
  fish: 2,
  shrimp: 2,

  // Bakery
  bread: 7,
  sliced_bread: 7,
  bagels: 6,
  tortillas: 21,
  pita: 7,
  croissant: 3,

  // Pantry & Condiments
  canned_beans: 365,
  beans: 365,
  pasta: 365,
  rice: 365,
  farro: 180,
  oats: 180,
  peanut_butter: 90,
  soy_sauce: 180,
  olive_oil: 180,
  mayo: 60,
  ketchup: 180,
  mustard: 180,
  salsa: 14,
  hummus: 7,
};

const STANDARD_UNITS = [
  "count",
  "cups",
  "oz",
  "lbs",
  "eggs",
  "slices",
  "tortillas",
  "cans",
  "bar",
  "bottle",
  "jar",
];

const CATEGORIES = [
  "Produce",
  "Dairy/Alts",
  "Meat/Seafood",
  "Bakery",
  "Pantry",
  "Snacks",
  "Frozen",
];

function getLocalEstimate(name) {
  const clean = name.toLowerCase().replace(/[^a-z_ ]/g, "").trim();
  for (const [key, days] of Object.entries(SHELF_LIFE_DATABASE)) {
    const formattedKey = key.replace(/_/g, " ");
    if (clean.includes(formattedKey)) {
      return days;
    }
  }
  return null;
}

export default function QuickAdd({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("count");
  const [category, setCategory] = useState("Produce");
  const [expirationDate, setExpirationDate] = useState("");
  const [detectingDate, setDetectingDate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Set default expiration date to 7 days from today on initial open
  useEffect(() => {
    if (open && !expirationDate) {
      const defaultExp = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      setExpirationDate(defaultExp);
    }
  }, [open, expirationDate]);

  // Handle accurate expiration date estimation when typing or leaving item name field
  const handleNameBlur = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // 1. Try local USDA database match first (instant)
    const localDays = getLocalEstimate(trimmed);
    if (localDays !== null) {
      const targetDate = new Date(Date.now() + localDays * 86400000)
        .toISOString()
        .split("T")[0];
      setExpirationDate(targetDate);

      // Auto-assign matching category
      const lower = trimmed.toLowerCase();
      if (lower.match(/(milk|cheese|yogurt|cream|butter|egg|tofu)/)) setCategory("Dairy/Alts");
      else if (lower.match(/(chicken|beef|turkey|steak|pork|fish|salmon|shrimp|bacon)/)) setCategory("Meat/Seafood");
      else if (lower.match(/(bread|bagel|tortilla|pita|pastry)/)) setCategory("Bakery");
      else if (lower.match(/(rice|bean|pasta|sauce|oil|canned|spices|cereal|farro)/)) setCategory("Pantry");
      else if (lower.match(/(chip|pretzel|chocolate|cookie|cracker|snack)/)) setCategory("Snacks");
      else setCategory("Produce");
      return;
    }

    // 2. Unlisted/unusual food: Query Gemini for exact USDA shelf life
    setDetectingDate(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      const result = await fridgePalClient.integrations.Core.InvokeLLM({
        prompt: `Provide the standard refrigerated shelf-life estimation for: "${trimmed}".
Reference USDA FoodKeeper standards.
Today's date is: ${today}.

Respond with:
- shelf_life_days: standard integer of days this item safely stays fresh in a home refrigerator/pantry.
- category: one of 'Produce', 'Dairy/Alts', 'Meat/Seafood', 'Bakery', 'Pantry', 'Snacks', 'Frozen'.
- recommended_unit: the best culinary unit from ['count', 'cups', 'oz', 'lbs', 'eggs', 'slices', 'tortillas', 'cans', 'bar', 'bottle', 'jar'].`,
        response_json_schema: {
          type: "object",
          properties: {
            shelf_life_days: { type: "number" },
            category: {
              type: "string",
              enum: CATEGORIES,
            },
            recommended_unit: {
              type: "string",
              enum: STANDARD_UNITS,
            },
          },
          required: ["shelf_life_days", "category", "recommended_unit"],
        },
      });

      if (result?.shelf_life_days) {
        const days = Number(result.shelf_life_days) || 7;
        const targetDate = new Date(Date.now() + days * 86400000)
          .toISOString()
          .split("T")[0];
        setExpirationDate(targetDate);
        if (result.category) setCategory(result.category);
        if (result.recommended_unit && unit === "count") setUnit(result.recommended_unit);
      }
    } catch (err) {
      console.error("Auto shelf-life estimation error:", err);
    } finally {
      setDetectingDate(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const today = new Date().toISOString().split("T")[0];

    await fridgePalClient.entities.GroceryItem.create({
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit,
      category,
      expiration_date: expirationDate || today,
      status: "active",
    });

    setSaving(false);
    setName("");
    setQuantity("1");
    setUnit("count");
    setExpirationDate("");
    setOpen(false);
    onAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2 px-5"
        >
          <Plus className="w-4 h-4" /> Quick Add
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-3xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" /> Add Grocery Item
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Item Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-600">Item Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="e.g. Fresh Salmon, Greek Yogurt, Spinach"
              required
              className="rounded-xl bg-stone-50 border-stone-200"
            />
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">Quantity</label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="rounded-xl bg-stone-50 border-stone-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {STANDARD_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-600">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Accurate Expiration Date */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Estimated Expiration
              </label>
              {detectingDate && (
                <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> USDA checking...
                </span>
              )}
            </div>
            <Input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              required
              className="rounded-xl bg-stone-50 border-stone-200"
            />
            <p className="text-[10px] text-stone-400">
              Auto-calculated using USDA shelf-life guidelines. You can also edit it.
            </p>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-2"
          >
            {saving ? "Adding to Fridge..." : "Add to Fridge ✓"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}