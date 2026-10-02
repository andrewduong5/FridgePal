import React, { useState, useRef } from "react";
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
import { Camera, Upload, Check, Loader2, Sparkles, Trash2, Plus } from "lucide-react";

const STANDARD_UNITS = [
  "count",
  "cups",
  "oz",
  "lbs",
  "gallons",
  "eggs",
  "slices",
  "tortillas",
  "cans",
  "bar",
  "bottle",
  "jar"
];

export default function ScanReceipt({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScannedItems([]);

    try {
      const { file_url } = await fridgePalClient.integrations.Core.UploadPublicFile({ file });
      const today = new Date().toISOString().split("T")[0];

      const result = await fridgePalClient.integrations.Core.InvokeLLM({
        prompt: `You are an AI grocery identification and retail inventory system. 
Carefully inspect every distinct grocery item, package, and container visible in this photo.

TWO-TIER EXTRACTION PROCESS:

TIER 1 - DIRECT OPTICAL READING:
- Closely inspect bottom corners, banners, and nutrition badges on packaging for printed measurements:
  * Look for 'NET WT', 'FL OZ', 'OZ', 'LB', 'G', 'QT', 'GAL', or count numbers.
  * Examples: "NET WT. 16 OZ (1 LB)", "NET WT 6 OZ (170g)", "12 EGGS".

TIER 2 - PRODUCT & BRAND MATCHING (IF MEASUREMENT IS BLURRED/OBSCURED):
- Identify the exact brand and product line (e.g., Trader Joe's, 365, Kirkland, Chobani, Driscoll's).
- Cross-reference standard commercial retail sizes:
  * Driscoll's / Supermarket Clamshell Blueberries / Raspberries -> typically 6 oz or 12 oz.
  * Bagged Baby Carrots -> standard retail bag is 16 oz (1 lb).
  * High-Protein Organic Tofu brick -> standard retail is 16 oz (1 lb).
  * Peanut Butter Pretzel Nuggets tub/bag -> typically 16 oz or 24 oz.
  * Greek Yogurt tub -> typically 16 oz or 32 oz.
  * Shishito Peppers bag -> typically 8 oz.
  * Bagged Romaine Hearts -> 3 count.
  * Standard Canned Beans (Black Beans, Garbanzo) -> 1 can (15 oz / 1.5 cups).
  * Loose produce (Sweet Potatoes, Apples, Bananas, Cauliflower heads) -> count individual pieces (unit: 'count').

STANDARDIZED UNITS ONLY:
Choose from: ['count', 'cups', 'oz', 'lbs', 'gallons', 'eggs', 'slices', 'tortillas', 'cans', 'bar', 'bottle', 'jar'].
- Prefer exact weights in 'oz' or 'lbs' for packaged goods where applicable.
- For liquids, use 'cups', 'oz', 'bottle', or 'gallons'.

CATEGORIES:
Choose from: ['Produce', 'Dairy/Alts', 'Meat/Seafood', 'Bakery', 'Pantry', 'Snacks', 'Frozen'].

TODAY'S DATE: ${today}. Provide an accurate shelf_life_days estimate based on standard refrigeration guidance.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Clean brand and product name (e.g., Trader Joe's Organic Tofu)"
                  },
                  quantity: {
                    type: "number",
                    description: "Numeric quantity or package weight"
                  },
                  unit: {
                    type: "string",
                    enum: STANDARD_UNITS
                  },
                  category: {
                    type: "string",
                    enum: ["Produce", "Dairy/Alts", "Meat/Seafood", "Bakery", "Pantry", "Snacks", "Frozen"]
                  },
                  shelf_life_days: {
                    type: "number",
                    description: "Expected fresh days in fridge"
                  }
                },
                required: ["name", "quantity", "unit", "category", "shelf_life_days"]
              }
            }
          },
          required: ["items"]
        }
      });

      const parsed = (result?.items || []).map((item) => {
        const days = Number(item.shelf_life_days) || 7;
        const expDate = new Date(Date.now() + days * 86400000).toISOString().split("T")[0];
        return {
          name: item.name,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "count",
          category: item.category || "Produce",
          expiration_date: expDate,
          selected: true
        };
      });

      setScannedItems(parsed);
    } catch (err) {
      console.error("Scan error:", err);
    } finally {
      setScanning(false);
    }
  };

  const updateItemField = (index, field, value) => {
    setScannedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (index) => {
    setScannedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addNewItem = () => {
    const expDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    setScannedItems((prev) => [
      ...prev,
      {
        name: "New Item",
        quantity: 1,
        unit: "count",
        category: "Produce",
        expiration_date: expDate,
        selected: true
      }
    ]);
  };

  const handleSave = async () => {
    const toSave = scannedItems.filter((i) => i.selected && i.name.trim() !== "");
    if (!toSave.length) return;

    setSaving(true);
    await fridgePalClient.entities.GroceryItem.bulkCreate(
      toSave.map((item) => ({
        name: item.name.trim(),
        quantity: Number(item.quantity) || 1,
        unit: item.unit || "count",
        category: item.category || "Produce",
        expiration_date: item.expiration_date,
        status: "active"
      }))
    );

    setSaving(false);
    setOpen(false);
    setScannedItems([]);
    onAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2 px-5"
        >
          <Camera className="w-4 h-4" /> Scan Groceries
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-3xl max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" /> Review & Edit Scanned Groceries
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 flex-1 overflow-y-auto space-y-4 pr-1">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          {!scanning && scannedItems.length === 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-emerald-50/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-semibold text-stone-700">Upload grocery haul or receipt photo</p>
              <p className="text-xs text-stone-400 text-center">JPG or PNG photos of food or store receipts</p>
            </div>
          )}

          {scanning && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-stone-600 font-medium">Reading package weights and quantities...</p>
            </div>
          )}

          {scannedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>Check details before adding to fridge:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addNewItem}
                  className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-7 text-xs font-semibold gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Missed Item
                </Button>
              </div>

              <div className="space-y-2.5">
                {scannedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-emerald-300 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) => updateItemField(idx, "selected", e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    />

                    {/* Item Name */}
                    <div className="flex-1 min-w-[120px]">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItemField(idx, "name", e.target.value)}
                        placeholder="Item name"
                        className="h-9 text-sm font-semibold rounded-xl bg-white"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="w-16">
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.quantity}
                        onChange={(e) => updateItemField(idx, "quantity", e.target.value)}
                        className="h-9 text-sm font-bold text-center rounded-xl bg-white px-1"
                      />
                    </div>

                    {/* Unit Select */}
                    <div className="w-24">
                      <select
                        value={item.unit}
                        onChange={(e) => updateItemField(idx, "unit", e.target.value)}
                        className="h-9 w-full rounded-xl border border-input bg-white px-2 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {STANDARD_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Delete Item */}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(idx)}
                      className="h-8 w-8 text-stone-400 hover:text-rose-500 rounded-lg shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {scannedItems.length > 0 && (
          <div className="flex gap-2 pt-3 border-t border-stone-100">
            <Button
              variant="outline"
              className="rounded-full flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
            >
              Rescan Photo
            </Button>
            <Button
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex-1 gap-1.5"
              onClick={handleSave}
              disabled={saving || scannedItems.filter((i) => i.selected).length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Add ({scannedItems.filter((i) => i.selected).length}) to Fridge
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}