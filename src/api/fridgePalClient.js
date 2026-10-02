const STORAGE_KEY = "fridgepal_grocery_items";

// Conversion tables
const VOLUME_TO_CUPS = {
  gallon: 16,
  gallons: 16,
  gal: 16,
  quart: 4,
  quarts: 4,
  qt: 4,
  pint: 2,
  pints: 2,
  pt: 2,
  cup: 1,
  cups: 1,
  c: 1,
  "fl oz": 0.125,
  floz: 0.125,
  tablespoon: 1 / 16,
  tablespoons: 1 / 16,
  tbsp: 1 / 16,
  tbs: 1 / 16,
  teaspoon: 1 / 48,
  teaspoons: 1 / 48,
  tsp: 1 / 48,
};

const WEIGHT_TO_OZ = {
  lb: 16,
  lbs: 16,
  pound: 16,
  pounds: 16,
  oz: 1,
  ounce: 1,
  ounces: 1,
  g: 0.035274,
  gram: 0.035274,
  grams: 0.035274,
};

/**
 * Converts an amount from one culinary unit to another.
 * Handles volume-to-volume, weight-to-weight, and food-container approximations.
 */
function convertUnits(amount, fromUnitRaw, toUnitRaw, itemName = "") {
  if (!amount || amount <= 0) return 0;
  const from = (fromUnitRaw || "").toLowerCase().trim();
  const to = (toUnitRaw || "").toLowerCase().trim();
  const item = (itemName || "").toLowerCase().trim();

  if (from === to) return amount;

  // 1. Can / container conversions (e.g. 1 can of beans ≈ 1.5 cups)
  if (from === "cans" || from === "can") {
    if (VOLUME_TO_CUPS[to] !== undefined) {
      const totalCupsInCans = amount * 1.5;
      return totalCupsInCans / VOLUME_TO_CUPS[to];
    }
  }
  if (to === "cans" || to === "can") {
    if (VOLUME_TO_CUPS[from] !== undefined) {
      const totalCupsUsed = amount * VOLUME_TO_CUPS[from];
      return totalCupsUsed / 1.5; // e.g. 0.5 cup beans / 1.5 = 0.33 can
    }
  }

  // 2. Volume-to-Volume conversions (e.g. Gallons <-> Cups <-> Tbsp)
  if (VOLUME_TO_CUPS[from] !== undefined && VOLUME_TO_CUPS[to] !== undefined) {
    const cups = amount * VOLUME_TO_CUPS[from];
    return cups / VOLUME_TO_CUPS[to];
  }

  // 3. Weight-to-Weight conversions (e.g. Lbs <-> Oz <-> Grams)
  if (WEIGHT_TO_OZ[from] !== undefined && WEIGHT_TO_OZ[to] !== undefined) {
    const oz = amount * WEIGHT_TO_OZ[from];
    return oz / WEIGHT_TO_OZ[to];
  }

  // 4. Fallback if incompatible or same category
  return amount;
}

const DEFAULT_ITEMS = [
  {
    id: "item-1",
    name: "Broccoli",
    quantity: 3,
    unit: "cups",
    expiration_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    status: "active",
    category: "Produce",
    updated_date: new Date().toISOString()
  },
  {
    id: "item-2",
    name: "Cheddar Cheese",
    quantity: 8,
    unit: "oz",
    expiration_date: new Date(Date.now() + 8 * 86400000).toISOString().split("T")[0],
    status: "active",
    category: "Dairy/Alts",
    updated_date: new Date().toISOString()
  },
  {
    id: "item-3",
    name: "Eggs",
    quantity: 12,
    unit: "eggs",
    expiration_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    status: "active",
    category: "Dairy/Alts",
    updated_date: new Date().toISOString()
  },
  {
    id: "item-4",
    name: "Milk",
    quantity: 1,
    unit: "gallons",
    expiration_date: new Date(Date.now() + 6 * 86400000).toISOString().split("T")[0],
    status: "active",
    category: "Dairy/Alts",
    updated_date: new Date().toISOString()
  },
  {
    id: "item-5",
    name: "Sliced Bread",
    quantity: 16,
    unit: "slices",
    expiration_date: new Date(Date.now() + 6 * 86400000).toISOString().split("T")[0],
    status: "active",
    category: "Bakery",
    updated_date: new Date().toISOString()
  },
  {
    id: "item-6",
    name: "Black Beans",
    quantity: 2,
    unit: "cans",
    expiration_date: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
    status: "active",
    category: "Pantry",
    updated_date: new Date().toISOString()
  }
];

function getStoredItems() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ITEMS));
    return DEFAULT_ITEMS;
  }
  return JSON.parse(data);
}

function saveStoredItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const RECIPE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    servings: { type: "number", description: "Must be 1" },
    calories: { type: "number", description: "Estimated total calories calculated strictly as (protein*4) + (carbs*4) + (fat*9)" },
    nutrition: {
      type: "object",
      properties: {
        protein: { type: "number", description: "Protein in grams" },
        carbs: { type: "number", description: "Carbs in grams" },
        fat: { type: "number", description: "Fat in grams" }
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
          itemId: { type: "string" },
          amountUsed: { type: "number" },
          unitUsed: { type: "string", description: "Unit used in recipe, e.g. cups, tbsp, oz, cans, gallons" }
        },
        required: ["itemId", "amountUsed", "unitUsed"]
      }
    }
  },
  required: ["title", "servings", "calories", "nutrition", "ingredients", "instructions", "usedIngredients"]
};

export const fridgePalClient = {
  entities: {
    GroceryItem: {
      async filter(query = {}, sortField = "", limit = 200) {
        let items = getStoredItems();

        if (query.status) {
          items = items.filter((i) => i.status === query.status);
        }

        if (sortField === "expiration_date") {
          items.sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));
        } else if (sortField === "-updated_date") {
          items.sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0));
        }

        return items.slice(0, limit);
      },

      async update(id, updates) {
        const items = getStoredItems();
        const index = items.findIndex((i) => i.id === id);
        if (index !== -1) {
          items[index] = {
            ...items[index],
            ...updates,
            updated_date: new Date().toISOString()
          };
          saveStoredItems(items);
          return items[index];
        }
        return null;
      },

      async create(newItem) {
        const items = getStoredItems();
        const record = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          quantity: newItem.quantity ?? 1,
          unit: newItem.unit || "count",
          category: newItem.category || "Pantry",
          status: newItem.status || "active",
          ...newItem,
          updated_date: new Date().toISOString()
        };
        items.push(record);
        saveStoredItems(items);
        return record;
      },

      async bulkCreate(newItems) {
        const items = getStoredItems();
        const created = newItems.map((item) => ({
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          status: item.status || "active",
          quantity: item.quantity ?? 1,
          unit: item.unit || "count",
          category: item.category || "Pantry",
          ...item,
          updated_date: new Date().toISOString()
        }));
        items.push(...created);
        saveStoredItems(items);
        return created;
      },

      async deductIngredients(usedList = []) {
        const items = getStoredItems();
        const now = new Date().toISOString();

        for (const used of usedList) {
          const item = items.find((i) => i.id === used.itemId);
          if (item) {
            // Convert the recipe's unit to the inventory item's native unit
            const convertedDeduction = convertUnits(
              Number(used.amountUsed) || 0,
              used.unitUsed || item.unit,
              item.unit,
              item.name
            );

            // Cap deduction to available quantity and round cleanly
            const roundedDeduction = Math.round(convertedDeduction * 100) / 100;
            const amountDeducted = Math.min(Number(item.quantity) || 0, roundedDeduction);

            if (amountDeducted > 0) {
              // 1. Log historical entry in native units so Insights calculates correctly
              items.push({
                id: `used-log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                name: item.name,
                quantity: amountDeducted,
                unit: item.unit || "count",
                category: item.category || "Pantry",
                expiration_date: item.expiration_date,
                status: "used",
                updated_date: now
              });

              // 2. Adjust remaining inventory on the active fridge item
              const remaining = Math.round((Number(item.quantity) - amountDeducted) * 100) / 100;
              if (remaining <= 0) {
                item.quantity = 0;
                item.status = "archived";
              } else {
                item.quantity = remaining;
                item.status = "active";
              }
              item.updated_date = now;
            }
          }
        }

        saveStoredItems(items);
        return items.filter((i) => i.status === "active");
      }
    }
  },

  integrations: {
    Core: {
      async UploadPublicFile({ file }) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = (event) => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
              const MAX_WIDTH = 1200;
              const MAX_HEIGHT = 1200;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height = Math.round((height * MAX_WIDTH) / width);
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width = Math.round((width * MAX_HEIGHT) / height);
                  height = MAX_HEIGHT;
                }
              }

              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, width, height);

              const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
              resolve({ file_url: compressedBase64 });
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
        });
      },

      async InvokeLLM({ prompt, file_urls = [], response_json_schema }) {
        try {
          const response = await fetch("/api/gemini", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt,
              file_urls,
              response_json_schema,
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Serverless endpoint error (${response.status}): ${errText}`);
          }

          return await response.json();
        } catch (e) {
          console.error("Gemini serverless call failed, falling back to local simulation:", e);
        }

        await new Promise((r) => setTimeout(r, 600));

        // Recipe fallback with conversion awareness
        if (prompt.includes("recipe") || prompt.includes("cooking")) {
          const currentFridge = getStoredItems().filter((i) => i.status === "active" && Number(i.quantity) > 0);

          if (currentFridge.length > 0) {
            const shuffled = [...currentFridge].sort(() => 0.5 - Math.random());
            const chosen = shuffled.slice(0, Math.min(3, shuffled.length));

            const usedList = chosen.map((item) => {
              let amountUsed = 1;
              let unitUsed = item.unit || "count";

              if (item.unit === "gallons" || item.unit === "gallon") {
                amountUsed = 1; // 1 cup of milk from a gallon
                unitUsed = "cups";
              } else if (item.unit === "cans" || item.unit === "can") {
                amountUsed = 0.5; // 0.5 cup beans from a can
                unitUsed = "cups";
              } else if (item.unit === "oz") {
                amountUsed = 2;
                unitUsed = "oz";
              } else if (item.unit === "cups") {
                amountUsed = 0.5;
                unitUsed = "cups";
              }

              return {
                itemId: item.id,
                amountUsed,
                unitUsed,
              };
            });

            const ingredientNames = chosen.map(
              (item, i) => `${usedList[i].amountUsed} ${usedList[i].unitUsed} ${item.name}`
            );

            const protein = Math.floor(Math.random() * 14) + 16;
            const carbs = Math.floor(Math.random() * 20) + 20;
            const fat = Math.floor(Math.random() * 8) + 8;
            const calculatedCalories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));

            return {
              title: `${chosen[0].name} Comfort Skillet`,
              servings: 1,
              calories: calculatedCalories,
              nutrition: { protein, carbs, fat },
              ingredients: [
                ...ingredientNames,
                "1 tbsp cooking oil or seasoning",
                "Salt and black pepper to taste"
              ],
              instructions: [
                `Prep ingredients: measure out ${ingredientNames.join(", ")}.`,
                "Heat a lightly oiled skillet over medium heat.",
                "Add your main ingredients, sautéing gently until warm and aromatic.",
                "Season with salt and pepper to taste and enjoy immediately."
              ],
              usedIngredients: usedList,
            };
          }

          return {
            title: "Quick Pantry Bowl",
            servings: 1,
            calories: 320,
            nutrition: { protein: 12, carbs: 46, fat: 8 },
            ingredients: ["Available pantry items", "Seasonings"],
            instructions: ["Combine available ingredients and heat thoroughly."],
            usedIngredients: [],
          };
        }

        return { items: [] };
      }
    }
  }
};