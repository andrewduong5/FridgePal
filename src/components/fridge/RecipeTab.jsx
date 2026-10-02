import React, { useState } from "react";
import { fridgePalClient, RECIPE_SCHEMA } from "@/api/fridgePalClient";
import { Button } from "@/components/ui/button";
import { Sparkles, Utensils, Check, Loader2, Shuffle, Flame, Dumbbell, Wheat, Droplets } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CUISINE_STYLES = [
  "Crispy Pan Stir-Fry or Sauté",
  "Warm Grains & Roasted Veggie Bowl",
  "Savory Scramble, Omelet, or Skillet Hash",
  "Toasted Wrap, Sandwich, or Loaded Flatbread",
  "Hearty Stew, Curry, or Simmered Soup",
  "Fresh Tossed Crisp Salad with Warm Protein/Toppings"
];

export default function RecipeTab({ items = [], onItemsUpdated }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cooking, setCooking] = useState(false);
  const [cooked, setCooked] = useState(false);
  const [previousRecipes, setPreviousRecipes] = useState([]);

  const activeItems = items.filter((i) => i.status === "active" && Number(i.quantity) > 0);

  const generateRecipe = async (isShuffle = false) => {
    if (activeItems.length === 0) return;
    setLoading(true);
    setCooked(false);

    const chosenStyle = CUISINE_STYLES[Math.floor(Math.random() * CUISINE_STYLES.length)];

    const inventoryList = activeItems
      .map(
        (i) =>
          `ID: "${i.id}" | Name: "${i.name}" | Available: ${i.quantity} ${i.unit || "count"} | Category: ${i.category}`
      )
      .join("\n");

    const previousTitles = previousRecipes.map((r) => `"${r.title}"`).join(", ");
    const previousUsedIds = previousRecipes
      .flatMap((r) => (r.usedIngredients || []).map((u) => u.itemId))
      .filter(Boolean);

    const diversityDirective = isShuffle && previousRecipes.length > 0
      ? `\nSHUFFLE REQUIREMENT:
The user clicked "Shuffle" because they want a completely different meal.
- AVOID duplicating these previously generated recipes: [${previousTitles}].
- Avoid heavily relying on previously used item IDs if alternatives exist: [${previousUsedIds.join(", ")}].
- Make this meal in the style of: "${chosenStyle}".
- Select a fresh subset of ingredients from the fridge that feel novel compared to the last suggestion.`
      : `\nCUISINE THEME: Craft this single-serving dish in the style of: "${chosenStyle}".`;

    try {
      const result = await fridgePalClient.integrations.Core.InvokeLLM({
        prompt: `You are an expert culinary nutritionist creating a single-serving meal using the user's available fridge items.

AVAILABLE FRIDGE ITEMS:
${inventoryList}
${diversityDirective}

STRICT CRITERIA & UNIT CONVERSION RULES:
1. Feature a distinct combination of ingredients. 
2. In "usedIngredients", every entry MUST use an exact "itemId" from the list above, with:
   - "amountUsed": numeric amount used in recipe (e.g. 2, 0.5, 1)
   - "unitUsed": the culinary unit used (e.g. "cups", "tbsp", "oz", "cans", "gallons", "slices", "eggs")
   NOTE: If an inventory item is stored in "gallons", you can specify "cups" or "fl oz" in "unitUsed". If an item is in "cans", you can specify "cups" or "cans". Our app converts and deducts automatically.
3. "servings" MUST be 1.
4. Calculate realistic macronutrient grams based ONLY on the actual quantities used:
   - "protein": raw integer in grams
   - "carbs": raw integer in grams
   - "fat": raw integer in grams
5. CRITICAL CALORIE ACCURACY: "calories" MUST equal (protein * 4) + (carbs * 4) + (fat * 9).`,
        response_json_schema: RECIPE_SCHEMA
      });

      // Programmatically lock calories to Atwater multipliers
      if (result && result.nutrition) {
        const p = Number(result.nutrition.protein) || 0;
        const c = Number(result.nutrition.carbs) || 0;
        const f = Number(result.nutrition.fat) || 0;
        result.calories = Math.round((p * 4) + (c * 4) + (f * 9));
      }

      setRecipe(result);
      if (result?.title) {
        setPreviousRecipes((prev) => [result, ...prev].slice(0, 5));
      }
    } catch (err) {
      console.error("Recipe generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCook = async () => {
    if (!recipe || !recipe.usedIngredients) return;
    setCooking(true);

    try {
      await fridgePalClient.entities.GroceryItem.deductIngredients(recipe.usedIngredients);

      const totalQuantityUsed = (recipe.usedIngredients || []).reduce(
        (sum, item) => sum + (Number(item.amountUsed) || 0),
        0
      );

      onItemsUpdated?.(totalQuantityUsed);
      setCooked(true);
    } catch (err) {
      console.error("Deduction error:", err);
    } finally {
      setCooking(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-stone-800">Smart Recipe Generator</h3>
          <p className="text-xs text-stone-400">
            Crafts dynamic single-portion meals from your available fridge items
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {recipe && (
            <Button
              variant="outline"
              onClick={() => generateRecipe(true)}
              disabled={loading || activeItems.length === 0}
              className="rounded-full border-stone-200 text-stone-700 hover:bg-stone-50 gap-1.5 font-medium text-xs h-9 px-3.5"
            >
              <Shuffle className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Shuffle</span>
            </Button>
          )}

          <Button
            onClick={() => generateRecipe(false)}
            disabled={loading || activeItems.length === 0}
            className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-sm text-xs h-9 px-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cooking...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Cook Something
              </>
            )}
          </Button>
        </div>
      </div>

      {activeItems.length === 0 && (
        <div className="text-center py-8 text-stone-500 text-sm">
          Your fridge has no active items. Scan or add groceries to start cooking!
        </div>
      )}

      <AnimatePresence mode="wait">
        {recipe && (
          <motion.div
            key={recipe.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5 pt-2"
          >
            <div className="border-b border-stone-100 pb-5">
              <h4 className="text-xl font-extrabold text-stone-800 mb-3">{recipe.title}</h4>

              {/* Macro Cards */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-sm shadow-emerald-200">
                  <div className="flex items-center gap-1 opacity-90 text-[10px] font-bold uppercase tracking-wider">
                    <Flame className="w-3 h-3" /> Cals
                  </div>
                  <span className="text-lg font-black mt-0.5">{recipe.calories}</span>
                  <span className="text-[10px] font-medium opacity-80">kcal</span>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-sm shadow-blue-200">
                  <div className="flex items-center gap-1 opacity-90 text-[10px] font-bold uppercase tracking-wider">
                    <Dumbbell className="w-3 h-3" /> Protein
                  </div>
                  <span className="text-lg font-black mt-0.5">{recipe.nutrition?.protein || 0}</span>
                  <span className="text-[10px] font-medium opacity-80">grams</span>
                </div>

                <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-sm shadow-amber-200">
                  <div className="flex items-center gap-1 opacity-90 text-[10px] font-bold uppercase tracking-wider">
                    <Wheat className="w-3 h-3" /> Carbs
                  </div>
                  <span className="text-lg font-black mt-0.5">{recipe.nutrition?.carbs || 0}</span>
                  <span className="text-[10px] font-medium opacity-80">grams</span>
                </div>

                <div className="bg-gradient-to-br from-rose-400 to-pink-600 text-white rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-sm shadow-rose-200">
                  <div className="flex items-center gap-1 opacity-90 text-[10px] font-bold uppercase tracking-wider">
                    <Droplets className="w-3 h-3" /> Fats
                  </div>
                  <span className="text-lg font-black mt-0.5">{recipe.nutrition?.fat || 0}</span>
                  <span className="text-[10px] font-medium opacity-80">grams</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                Ingredients Used
              </h5>
              <ul className="space-y-1.5 text-sm text-stone-700">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                Instructions
              </h5>
              <ol className="space-y-2 text-sm text-stone-700">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold text-emerald-600 min-w-[20px]">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleCook}
                disabled={cooking || cooked}
                className={`w-full rounded-2xl h-11 font-semibold gap-2 ${
                  cooked
                    ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {cooking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Deducting ingredients...
                  </>
                ) : cooked ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" /> Cooked & Deducted!
                  </>
                ) : (
                  <>
                    <Utensils className="w-4 h-4" /> I Cooked This (Deduct from Fridge)
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}