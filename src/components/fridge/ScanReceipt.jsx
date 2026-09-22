import React, { useRef, useState } from "react";
import { addDays, format } from "date-fns";
import { fridgePalClient } from "@/api/fridgePalClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, ScanLine, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import ScanReview from "@/components/fridge/ScanReview";

const SYSTEM_INSTRUCTIONS = `Extract every grocery item found in this receipt or photo. For each item:
1. Clean and normalize the name (e.g., resolve abbreviations like 'ORG RD DRGNFRT' into 'Red Dragon Fruit'). Do NOT rely on a fixed list — dynamically detect any food, including uncommon, regional, and specialty items (e.g., dragonfruit, bok choy, oat milk).
2. Determine the quantity purchased (default 1).
3. Identify the food category: one of Produce, Dairy/Alts, Meat/Seafood, Bakery, Pantry, Frozen.
4. Dynamically estimate the shelf-life in days based on standard real-world refrigeration and pantry guidelines (e.g., Dragon Fruit: 5 days, Fresh Spinach: 5 days, Milk: 7 days, Cheddar: 14 days, Fresh Chicken: 2 days).
Ignore non-food entries such as taxes, register numbers, store information, and household items.`;

export default function ScanReceipt({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState("upload");
  const [imageUrl, setImageUrl] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const cameraInput = useRef(null);
  const fileInput = useRef(null);
  const { toast } = useToast();

  const reset = () => {
    setStage("upload");
    setImageUrl(null);
    setItems([]);
    setError(null);
    if (cameraInput.current) cameraInput.current.value = "";
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleOpen = (v) => {
    setOpen(v);
    if (!v) setTimeout(reset, 200);
  };

  const analyze = async (file) => {
    setError(null);
    setStage("analyzing");
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const file_url = reader.result;
          setImageUrl(file_url);

          const result = await fridgePalClient.integrations.Core.InvokeLLM({
            prompt: `${SYSTEM_INSTRUCTIONS}\n\nToday's date is ${format(new Date(), "yyyy-MM-dd")}. Return a JSON object with an "items" array containing the detected food items. Each item must have: name, quantity, category, shelf_life_days.`,
            file_urls: [file_url],
          });

          console.log("Gemini parsed result:", result);

          // Handle array directly or wrapped in an object property (items, grocery_items, foods, etc.)
          let rawList = [];
          if (Array.isArray(result)) {
            rawList = result;
          } else if (result && typeof result === "object") {
            rawList =
              result.items ||
              result.groceries ||
              result.grocery_items ||
              result.food_items ||
              Object.values(result).find(Array.isArray) ||
              [];
          }

          const detected = rawList.filter((i) => i && (i.name || i.item));

          // Normalize property names in case the AI used 'item' instead of 'name'
          const formatted = detected.map((i) => ({
            name: String(i.name || i.item || "Unknown item").trim(),
            quantity: Number(i.quantity) || 1,
            category: i.category || "Produce",
            shelf_life_days: Number(i.shelf_life_days || i.shelf_life || 7),
          }));

          setItems(formatted);
          setStage("review");
        } catch (innerErr) {
          console.error("Analysis error:", innerErr);
          setError("Could not analyze the image. Try a clearer photo.");
          setStage("upload");
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error("File reading error:", e);
      setError("Could not read image file.");
      setStage("upload");
      if (cameraInput.current) cameraInput.current.value = "";
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (file) analyze(file);
  };

  const confirm = async (finalItems) => {
    const records = finalItems
      .filter((i) => String(i.name).trim() && Number(i.shelf_life_days) > 0)
      .map((i) => ({
        name: String(i.name).trim(),
        quantity: Number(i.quantity) || 1,
        category: i.category,
        expiration_date: format(addDays(new Date(), Number(i.shelf_life_days)), "yyyy-MM-dd"),
        status: "active",
      }));
    if (!records.length) return;
    await fridgePalClient.entities.GroceryItem.bulkCreate(records);
    toast({ title: `${records.length} items added to your fridge!` });
    setOpen(false);
    setTimeout(reset, 200);
    onAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-md gap-2 px-5">
          <Camera className="w-4 h-4" /> Scan Receipt / Groceries
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-h-[88vh]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-emerald-500" /> Scan Receipt / Groceries
          </DialogTitle>
        </DialogHeader>

        {stage === "upload" && (
          <div className="py-6 flex flex-col items-center gap-5 text-center">
            <p className="text-stone-500 text-sm max-w-sm">
              Snap a receipt or groceries photo, or upload an image. AI detects every item — even uncommon ones — and estimates shelf life.
            </p>
            {error && (
              <p className="text-rose-500 text-sm flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            )}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => cameraInput.current?.click()}>
                <Camera className="w-4 h-4" /> Take Photo
              </Button>
              <Button variant="outline" className="rounded-xl gap-2" onClick={() => fileInput.current?.click()}>
                <Upload className="w-4 h-4" /> Upload Image
              </Button>
            </div>
            <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
            <input ref={fileInput} type="file" accept="image/*" onChange={onFile} className="hidden" />
          </div>
        )}

        {stage === "analyzing" && (
          <div className="py-12 flex flex-col items-center gap-5 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center"
            >
              <ScanLine className="w-8 h-8 text-emerald-600" />
            </motion.div>
            <p className="text-stone-600 font-medium">AI is analyzing your grocery items...</p>
            {imageUrl && (
              <img src={imageUrl} alt="scanning" className="w-24 h-24 object-cover rounded-xl border border-stone-200 opacity-60" />
            )}
          </div>
        )}

        {stage === "review" && (
          <ScanReview items={items} imageUrl={imageUrl} onConfirm={confirm} onRetake={reset} />
        )}
      </DialogContent>
    </Dialog>
  );
}