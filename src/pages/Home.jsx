import React, { useEffect, useState, useCallback } from "react";
import { fridgePalClient } from "@/api/fridgePalClient";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";

import QuickAdd from "@/components/fridge/QuickAdd";
import VoiceQuickAdd from "@/components/fridge/VoiceQuickAdd";
import ScanReceipt from "@/components/fridge/ScanReceipt";
import ItemCard from "@/components/fridge/ItemCard";
import ExpiringBanner from "@/components/fridge/ExpiringBanner";
import RecipeTab from "@/components/fridge/RecipeTab";
import InsightsTab from "@/components/fridge/InsightsTab";
import ProgressTracker from "@/components/fridge/ProgressTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LOGO_URL = "/logo.svg";

export default function Home() {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const [recipeCount, setRecipeCount] = useState(0);

  const load = useCallback(async () => {
    const [active, past] = await Promise.all([
      fridgePalClient.entities.GroceryItem.filter({ status: "active" }, "expiration_date"),
      fridgePalClient.entities.GroceryItem.filter({}, "-updated_date", 200),
    ]);
    setItems(active);
    setHistory(past.filter((i) => i.status !== "active"));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const fireConfetti = () => {
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors: ["#34d399", "#fbbf24", "#fb7185", "#60a5fa"] });
  };

  const consume = async (item, amount) => {
    if (amount >= item.quantity) {
      await fridgePalClient.entities.GroceryItem.update(item.id, { status: "used" });
      fireConfetti();
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1800);
    } else {
      await fridgePalClient.entities.GroceryItem.update(item.id, { quantity: item.quantity - amount });
    }
    load();
  };
  const markWasted = async (item) => {
    await fridgePalClient.entities.GroceryItem.update(item.id, { status: "wasted" });
    load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-[#F5F3EC] to-[#F5F3EC]">
      <header className="max-w-2xl mx-auto px-6 pt-8 pb-5 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white rounded-3xl pl-3 pr-5 py-2.5 shadow-md shadow-emerald-100/70 border border-emerald-100">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 ring-1 ring-emerald-200/60 overflow-hidden">
            <img src={LOGO_URL} alt="FridgePal" className="h-full w-full object-contain" />
          </div>
          <span className="font-display text-2xl font-extrabold tracking-tight text-emerald-700">
            Fridge<span className="text-stone-800">Pal</span>
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pb-6 flex flex-wrap gap-3 justify-center">
        <VoiceQuickAdd onAdded={load} />
        <QuickAdd onAdded={load} />
        <ScanReceipt onAdded={load} />
      </div>

      <main className="max-w-2xl mx-auto px-6 pb-20 space-y-5">
        <ProgressTracker history={history} recipeCount={recipeCount} />

        {!loading && <ExpiringBanner items={items} />}

        <Tabs defaultValue="fridge" className="w-full">
          <TabsList className="grid grid-cols-3 rounded-full bg-white/80 backdrop-blur p-1.5 shadow-sm border border-stone-200">
            <TabsTrigger value="fridge" className="rounded-full data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-medium">🧊 My Fridge</TabsTrigger>
            <TabsTrigger value="recipe" className="rounded-full data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-medium">🍳 Recipe</TabsTrigger>
            <TabsTrigger value="insights" className="rounded-full data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-medium">📊 Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="fridge" className="mt-5 space-y-3">
            {loading ? (
              <p className="text-stone-400 text-center py-10">Loading your fridge... 🧊</p>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-5xl mb-3">🧊</p>
                <p className="text-stone-500">Your fridge is empty — add your first item!</p>
              </div>
            ) : (
              <AnimatePresence>
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} onConsume={consume} onMarkWasted={markWasted} />
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          <TabsContent value="recipe" className="mt-5">
            <RecipeTab items={items} onGenerated={() => setRecipeCount((c) => c + 1)} />
          </TabsContent>

          <TabsContent value="insights" className="mt-5">
            <InsightsTab history={history} />
          </TabsContent>
        </Tabs>
      </main>

      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-xl font-semibold flex items-center gap-2 z-50"
          >
            🎉 Great job! Nothing wasted!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}