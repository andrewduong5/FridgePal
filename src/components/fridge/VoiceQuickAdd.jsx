import React, { useState } from "react";
import { fridgePalClient } from "@/api/fridgePalClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function VoiceQuickAdd({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    setListening(true);
    setTranscript("");
    setParsed(null);
    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
      await parseItems(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const parseItems = async (text) => {
    setParsing(true);
    const today = new Date().toISOString().split("T")[0];
    const result = await fridgePalClient.integrations.Core.InvokeLLM({
      prompt: `A user spoke this grocery list: "${text}". Extract each distinct item with its quantity (default 1) and estimate a sensible expiration date (ISO format YYYY-MM-DD) based on typical shelf life starting from today (${today}). Examples: bread ~7 days, milk ~7 days, eggs ~21 days, fresh veg ~5 days, cheese ~14 days.`,
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "number" },
                expiration_date: { type: "string" },
              },
              required: ["name", "quantity", "expiration_date"],
            },
          },
        },
        required: ["items"],
      },
    });
    setParsed(result.items || []);
    setParsing(false);
  };

  const confirm = async () => {
    if (!parsed?.length) return;
    setSaving(true);
    await fridgePalClient.entities.GroceryItem.bulkCreate(
      parsed.map((i) => ({
        name: i.name,
        quantity: Number(i.quantity) || 1,
        expiration_date: i.expiration_date,
        status: "active",
      }))
    );
    setSaving(false);
    setParsed(null);
    setTranscript("");
    setOpen(false);
    onAdded?.();
  };

  const tryAgain = () => {
    setParsed(null);
    setTranscript("");
    startListening();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2 px-5">
          <Mic className="w-4 h-4" /> Voice Add
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" /> Quick Add by Voice
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 flex flex-col items-center gap-5 text-center">
          {!parsed && (
            <motion.button
              onClick={startListening}
              whileTap={{ scale: 0.95 }}
              className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg disabled:opacity-60"
              disabled={listening || parsing}
            >
              {listening && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                />
              )}
              <Mic className="w-9 h-9 relative" />
            </motion.button>
          )}

          {listening && <p className="text-stone-600">Listening... say your items 🎙️</p>}
          {parsing && <p className="text-stone-600">Thinking about what you said... 🤔</p>}

          {transcript && !parsing && (
            <p className="text-stone-500 text-sm italic max-w-sm">"{transcript}"</p>
          )}

          {parsed && (
            <div className="w-full space-y-4">
              <p className="font-medium text-stone-700">
                I heard {parsed.length} item{parsed.length > 1 ? "s" : ""} — is this right?
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {parsed.map((i, idx) => (
                  <span key={idx} className="bg-emerald-50 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium border border-emerald-200">
                    {i.quantity}× {i.name}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" className="rounded-full" onClick={tryAgain} disabled={saving}>
                  Try Again
                </Button>
                <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={confirm} disabled={saving}>
                  {saving ? "Adding..." : "Confirm ✓"}
                </Button>
              </div>
            </div>
          )}

          {!parsed && !listening && !parsing && !transcript && (
            <p className="text-stone-500 text-sm max-w-xs">
              Tap the mic and say something like "2 loaves of bread, 3 tomatoes, and 1 carton of eggs."
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}