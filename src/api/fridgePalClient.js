const STORAGE_KEY = "fridgepal_grocery_items";

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
    quantity: 4,
    unit: "cups",
    expiration_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
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
    name: "Flour Tortillas",
    quantity: 10,
    unit: "tortillas",
    expiration_date: new Date(Date.now() + 12 * 86400000).toISOString().split("T")[0],
    status: "active",
    category: "Bakery",
    updated_date: new Date().toISOString()
  },
  {
    id: "item-7",
    name: "Black Beans",
    quantity: 2,
    unit: "cans",
    expiration_date: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
    status: "active",
    category: "Pantry",
    updated_date: new Date().toISOString()
  },
  {
    id: "item-8",
    name: "Dark Chocolate",
    quantity: 1,
    unit: "bar",
    expiration_date: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0],
    status: "active",
    category: "Snacks",
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
    calories: { type: "number", description: "Estimated total calories for this 1 serving" },
    nutrition: {
      type: "object",
      properties: {
        protein: { type: "number", description: "Protein in grams (number only, e.g. 24)" },
        carbs: { type: "number", description: "Carbs in grams (number only, e.g. 35)" },
        fat: { type: "number", description: "Fat in grams (number only, e.g. 12)" }
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
          amountUsed: { type: "number" }
        },
        required: ["itemId", "amountUsed"]
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
            const amountDeducted = Math.min(Number(item.quantity) || 0, Number(used.amountUsed) || 0);

            if (amountDeducted > 0) {
              // 1. Log a historical entry so the Insights Tab reflects recipe cooking
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

              // 2. Adjust remaining quantity on active fridge item
              const remaining = Number((item.quantity - amountDeducted).toFixed(1));
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

        // --- Demo Fallback ---
        await new Promise((r) => setTimeout(r, 600));

        // Fallback for recipe generation
        if (prompt.includes("recipe") || prompt.includes("cooking")) {
          return {
            title: "Single-Skillet Cheesy Scramble",
            servings: 1,
            calories: 340,
            nutrition: {
              protein: 22,
              carbs: 6,
              fat: 24
            },
            ingredients: [
              "2 large Eggs, beaten",
              "1/2 cup Broccoli florets, chopped small",
              "2 oz Shredded Cheddar Cheese",
              "Salt and black pepper to taste"
            ],
            instructions: [
              "Heat a small lightly oiled skillet over medium heat and sauté the chopped broccoli for 2-3 minutes.",
              "Pour in the beaten eggs and gently stir until soft curds form.",
              "Sprinkle cheddar cheese over top and let melt for 30 seconds.",
              "Season with salt and pepper and serve warm."
            ],
            usedIngredients: [
              { itemId: "item-1", amountUsed: 0.5 },
              { itemId: "item-2", amountUsed: 2 },
              { itemId: "item-3", amountUsed: 2 }
            ]
          };
        }

        // Intelligent local text parser for Voice & Quick Add inputs
        if (prompt.includes("grocery list") || prompt.includes("spoke") || prompt.includes("voice")) {
          const match = prompt.match(/spoke this grocery list:\s*"([^"]+)"/i) || prompt.match(/"([^"]+)"/);
          const spoken = match ? match[1] : "";
          const today = new Date().toISOString().split("T")[0];

          if (spoken) {
            const segments = spoken
              .split(/,\s*|\s+and\s+|\s*\+\s*/i)
              .map((s) => s.trim())
              .filter(Boolean);

            const parsedItems = segments.map((seg) => {
              const lower = seg.toLowerCase();
              let qty = 1;
              let unit = "count";
              let category = "Produce";

              const numMatch = lower.match(/\b(\d+(\.\d+)?|a|one|two|three|four|five|six|half|dozen)\b/i);
              if (numMatch) {
                const word = numMatch[1].toLowerCase();
                const wordMap = { a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, half: 0.5, dozen: 12 };
                qty = wordMap[word] !== undefined ? wordMap[word] : parseFloat(word) || 1;
              }

              if (lower.includes("egg")) {
                unit = "eggs";
                category = "Dairy/Alts";
                if (lower.includes("carton") || lower.includes("dozen")) qty = 12;
              } else if (lower.includes("milk")) {
                unit = "cups";
                category = "Dairy/Alts";
                if (qty === 1 && !lower.includes("cup")) qty = 4;
              } else if (lower.includes("cheese")) {
                unit = "oz";
                category = "Dairy/Alts";
                if (qty === 1 && !lower.includes("oz")) qty = 8;
              } else if (lower.includes("bread")) {
                unit = "slices";
                category = "Bakery";
                if (lower.includes("loaf")) qty = 16;
              } else if (lower.includes("tortilla")) {
                unit = "tortillas";
                category = "Bakery";
                if (lower.includes("pack")) qty = 10;
              } else if (lower.includes("bean")) {
                unit = "cans";
                category = "Pantry";
              } else if (lower.includes("chicken") || lower.includes("beef") || lower.includes("meat")) {
                unit = "oz";
                category = "Meat/Seafood";
              } else if (lower.includes("chocolate")) {
                unit = "bar";
                category = "Snacks";
              }

              const cleanName = seg
                .replace(/\b(\d+|a|an|one|two|three|four|five|six|half|dozen)\b/gi, "")
                .replace(/\b(carton of|loaf of|pack of|head of|bag of|bottle of|can of|slices of|cups of|oz of|ounces of)\b/gi, "")
                .trim();

              const capitalized = cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : seg;

              return {
                name: capitalized,
                quantity: qty,
                unit: unit,
                category: category,
                expiration_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
              };
            });

            if (parsedItems.length > 0) {
              return { items: parsedItems };
            }
          }

          return {
            items: [
              { name: "Bananas", quantity: 4, unit: "count", category: "Produce", expiration_date: today }
            ]
          };
        }

        // Receipt scan fallback
        return {
          items: [
            { name: "Eggs", quantity: 12, unit: "eggs", category: "Dairy/Alts", shelf_life_days: 21 },
            { name: "Broccoli", quantity: 3, unit: "cups", category: "Produce", shelf_life_days: 5 },
            { name: "Cheddar Cheese", quantity: 8, unit: "oz", category: "Dairy/Alts", shelf_life_days: 14 }
          ]
        };
      }
    }
  }
};