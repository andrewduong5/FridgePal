import React, { useState } from "react";
import { fridgePalClient } from "@/api/fridgePalClient";
import { Button } from "@/components/ui/button";
import { ChefHat, Shuffle } from "lucide-react";
import SeasoningsPanel from "@/components/fridge/SeasoningsPanel";

export default function RecipeTab({ items, onGenerated }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seasoningNames, setSeasoningNames] = useState([]);

  const generate = async () => {
    if (items.length === 0) return;
    setLoading(true);
    const fridgeNames = items.map((i) => i.name).join(", ");
    const seasonings = seasoningNames.length ? seasoningNames.join(", ") : "none listed";
    const result = await fridgePalClient.integrations.Core.InvokeLLM({
      prompt: `You are a home-cooking assistant. A user has these fridge ingredients: ${fridgeNames}. They also have these seasonings and pantry staples available: ${seasonings}.

Suggest ONE realistic, tasty recipe they can cook with what they have. Real meals usually need more than 3 ingredients — use a practical number of the available fridge ingredients plus the relevant seasonings. Only use ingredients and seasonings from the lists above (common pantry basics like oil and water are fine). Include the seasonings used in the ingredient list.

Return a title, a full ingredient list (with amounts where helpful), and concise step-by-step instructions (4-6 steps).`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          ingredients: { type: "array", items: { type: "string" } },
          instructions: { type: "array", items: { type: "string" } },
        },
        required: ["title", "ingredients", "instructions"],
      },
    });
    setRecipe(result);
    setLoading(false);
    onGenerated?.();
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
            Get a realistic recipe using your fridge items plus the seasonings you have on hand.
          </p>
          <Button onClick={generate} disabled={loading} className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-6">
            {loading ? "Cooking up ideas..." : "Cook Something"}
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-4">
          <h3 className="text-xl font-semibold text-stone-800">{recipe.title}</h3>
          <div>
            <p className="text-sm font-medium text-stone-500 mb-1">Ingredients</p>
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
          <Button onClick={generate} disabled={loading} variant="outline" className="rounded-full gap-2">
            <Shuffle className="w-4 h-4" /> {loading ? "Shuffling..." : "Shuffle Recipe"}
          </Button>
        </div>
      )}
    </div>
  );
}