const STORAGE_KEY = "fridgepal_grocery_items";

const DEFAULT_ITEMS = [
  {
    id: "item-1",
    name: "Broccoli",
    quantity: 1,
    expiration_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    status: "active",
    category: "Produce",
    updated_date: new Date().toISOString()
  },
  {
    id: "item-2",
    name: "Cheddar Cheese",
    quantity: 3,
    expiration_date: new Date(Date.now() + 8 * 86400000).toISOString().split("T")[0],
    status: "active",
    category: "Dairy/Alts",
    updated_date: new Date().toISOString()
  },
  {
    id: "item-3",
    name: "Milk",
    quantity: 2,
    expiration_date: new Date(Date.now() + 1 * 86400000).toISOString().split("T")[0],
    status: "active",
    category: "Dairy/Alts",
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
          quantity: 1,
          status: "active",
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
          status: "active",
          quantity: 1,
          ...item,
          updated_date: new Date().toISOString()
        }));
        items.push(...created);
        saveStoredItems(items);
        return created;
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

          const data = await response.json();
          return data;
        } catch (e) {
          console.error("Gemini serverless call failed, falling back to local simulation:", e);
        }

        // --- Demo Fallback ---
        await new Promise((r) => setTimeout(r, 1200));

        if (prompt.includes("recipe") || prompt.includes("cooking")) {
          return {
            title: "Quick Broccoli Cheddar Soup",
            ingredients: [
              "2 cups Fresh Broccoli florets",
              "1 cup Shredded Cheddar Cheese",
              "1 cup Milk",
              "Salt and black pepper to taste"
            ],
            instructions: [
              "Steam or simmer the broccoli in a pot with a splash of water until tender (5-6 mins).",
              "Lower heat, pour in milk, and warm gently without boiling.",
              "Slowly whisk in cheddar cheese until completely melted and velvety smooth.",
              "Season with salt and fresh black pepper, then serve immediately."
            ]
          };
        }

        if (prompt.includes("grocery list")) {
          const today = new Date().toISOString().split("T")[0];
          return {
            items: [
              { name: "Bread", quantity: 2, expiration_date: today },
              { name: "Tomatoes", quantity: 3, expiration_date: today },
              { name: "Egg Carton", quantity: 1, expiration_date: today }
            ]
          };
        }

        return {
          items: [
            { name: "Dragon Fruit", quantity: 2, category: "Produce", shelf_life_days: 5 },
            { name: "Organic Spinach", quantity: 1, category: "Produce", shelf_life_days: 5 },
            { name: "Oat Milk", quantity: 1, category: "Dairy/Alts", shelf_life_days: 8 },
            { name: "Cheddar Cheese", quantity: 1, category: "Dairy/Alts", shelf_life_days: 14 }
          ]
        };
      }
    }
  }
};