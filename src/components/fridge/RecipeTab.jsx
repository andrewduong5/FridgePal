import React, { useState } from "react";
import { fridgePalClient } from "@/api/fridgePalClient";
import { Button } from "@/components/ui/button";
import { ChefHat, Shuffle, Flame, User, CheckCircle2 } from "lucide-react";
import SeasoningsPanel from "@/components/fridge/SeasoningsPanel";

export default function RecipeTab({ items, onItemsUpdated }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seasoningNames, setSeasoningNames] = useState([]);
  const [isDeducted, setIsDeducted] = useState(false);

  const generate = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setIsDeducted(false);

    const inventoryContext = items
      .map((i) => `- [ID: ${i.id}] ${i.name} (Available: ${i.quantity} ${i.unit || "units"})`)
      .join("\n");

    const seasonings = seasoningNames.length ? seasoningNames.join(", ") : "none listed";

    const result = await fridgePalClient.integrations.Core.InvokeLLM({
      prompt: `You are a home-cooking assistant and nutritionist.
A user has these specific fridge items with their IDs and quantities:
${inventoryContext}

They also have these seasonings and pantry staples available: ${seasonings}.

Suggest ONE realistic, quick, single-serving recipe scaled for EXACTLY 1 PERSON.
Use realistic single-serving amounts (for example: 2 eggs out of 12, 0.75 cups of broccoli, 2 oz of cheese).
Do NOT consume the whole container if only a portion is needed for 1 serving.

IMPORTANT: For calories and macros, provide ONLY pure numeric values (e.g. 24, not "24g").

Return:
1. title
2. servings (must be 1)
3. calories (pure integer total for 1 serving)
4. nutrition breakdown: protein, carbs, and fat as numbers (in grams)
5. ingredients list for 1 serving (with clear measurements)
6. instructions (4-6 clear steps)
7. usedIngredients: an array listing the fridge items used, their exact 'itemId', and the numeric 'amountUsed'.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          servings: { type: "number", description: "Must be 1" },
          calories: { type: "number", description: "Estimated total calories (integer)" },
          nutrition: {
            type: "object",
            properties: {
              protein: { type: "number", description: "Protein in grams as a number, e.g. 24" },
              carbs: { type: "number", description: "Carbohydrates in grams as a number, e.g. 35" },
              fat: { type: "number", description: "Fat in grams as a number, e.g. 12" }
            },
            required: ["protein", "carbs", "fat"]
          },
          ingredients: { type: "array", items: { type: "string" } },
          instructions: { type: "array", items: { type: "string" } },
          usedIngredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                itemId: { type: "string", description: "Must match the exact item ID provided" },
                amountUsed: { type: "number", description: "Number of units used for 1 serving" }
              },
              required: ["itemId", "amountUsed"]
            }
          }
        },
        required: ["title", "servings", "calories", "nutrition", "ingredients", "instructions", "usedIngredients"],
      },
    });

    setRecipe(result);
    setLoading(false);
  };

  const handleDeduct = async () => {
    if (!recipe?.usedIngredients || isDeducted) return;

    const totalQuantityUsed = recipe.usedIngredients.reduce(
      (sum, item) => sum + (Number(item.amountUsed) || 0),
      0
    );

    await fridgePalClient.entities.GroceryItem.deductIngredients(recipe.usedIngredients);
    setIsDeducted(true);

    if (onItemsUpdated) {
      onItemsUpdated(totalQuantityUsed);
    }
  };

  // Helper to safely format macro numbers
  const cleanMacro = (val) => {
    if (val === undefined || val === null) return null;
    const num = typeof val === "number" ? val : parseInt(String(val).replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? null : `${num}g`;
  };

  return (
    <div className="space-y-5">
      <SeasoningsPanel onSeasoningsChange={setSeasoningNames} />

      {items.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          Add a few fridge items to get a recipe idea.
        </div>
      ) : !recipe ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <ChefHat className="w-10 h-10 text-emerald-500" />
          <p className="text-stone-600 max-w-xs">
            Get a realistic single-serving recipe using your fridge items plus seasonings on hand.
          </p>
          <Button onClick={generate} disabled={loading} className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-6">
            {loading ? "Cooking up ideas..." : "Cook Something"}
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-stone-800">{recipe.title}</h3>
            
            {/* Calorie & Single Serving Badge */}
            {(recipe.calories || recipe.nutrition) && (
              <div className="flex flex-wrap items-center gap-3 mt-2 p-2.5 bg-emerald-50 border border-emerald-100/80 rounded-xl text-emerald-900 text-xs">
                {recipe.calories && (
                  <div className="flex items-center gap-1.5 font-semibold text-sm">
                    <Flame className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                    <span>{recipe.calories} kcal</span>
                  </div>
                )}

                <div className="flex items-center gap-1 font-medium text-emerald-800 border-l border-emerald-200 pl-3">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1 serving</span>
                </div>

                {recipe.nutrition && (
                  <div className="flex items-center gap-2.5 border-l border-emerald-200 pl-3 text-emerald-800">
                    {cleanMacro(recipe.nutrition.protein) && (
                      <span>Protein: <b>{cleanMacro(recipe.nutrition.protein)}</b></span>
                    )}
                    {cleanMacro(recipe.nutrition.carbs) && (
                      <span>Carbs: <b>{cleanMacro(recipe.nutrition.carbs)}</b></span>
                    )}
                    {cleanMacro(recipe.nutrition.fat) && (
                      <span>Fat: <b>{cleanMacro(recipe.nutrition.fat)}</b></span>
                    )}
                  </div>
                )}

                <span className="ml-auto text-[10px] text-emerald-600/70 italic">
                  *Est.
                </span>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-stone-500 mb-1">Ingredients (1 Serving)</p>
            <ul className="list-disc list-inside text-stone-700 space-y-0.5">
              {recipe.ingredients.map((ing, idx) => <li key={idx}>{ing}</li>)}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-stone-500 mb-1">Instructions</p>
            <ol className="list-decimal list-inside text-stone-700 space-y-1">
              {recipe.instructions.map((step, idx) => <li key={idx}>{step}</li>)}
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-stone-100">
            <Button
              onClick={handleDeduct}
              disabled={isDeducted}
              className={`rounded-full gap-2 transition-all ${
                isDeducted
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 cursor-default"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isDeducted ? "Ingredients Deducted!" : "I Made This! (Deduct Ingredients)"}
            </Button>

            <Button onClick={generate} disabled={loading} variant="outline" className="rounded-full gap-2">
              <Shuffle className="w-4 h-4" /> {loading ? "Shuffling..." : "Shuffle Recipe"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}