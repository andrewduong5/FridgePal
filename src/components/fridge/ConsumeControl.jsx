import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, Utensils } from "lucide-react";

export default function ConsumeControl({ item, onConsume }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(1);

  const maxQty = Number(item.quantity) || 1;
  const unit = item.unit || "units";

  // Provide intuitive quick-fractions depending on how much is left
  const presets = [
    { label: "1/4", value: Math.min(maxQty, 0.25) },
    { label: "1/2", value: Math.min(maxQty, 0.5) },
    { label: "1", value: Math.min(maxQty, 1) },
    { label: `All (${maxQty})`, value: maxQty },
  ].filter((p, idx, arr) => p.value <= maxQty && arr.findIndex(x => x.value === p.value) === idx);

  const handleApply = (qtyToUse) => {
    const parsed = Math.min(maxQty, Math.max(0.1, Number(qtyToUse) || 1));
    // Clean up float precision e.g. 0.25 or 1.5
    const rounded = Math.round(parsed * 100) / 100;
    onConsume(item, rounded);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl h-9 px-3 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium"
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Use</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-2xl max-w-xs p-5">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-stone-800 flex items-center justify-between">
            <span>Use {item.name}</span>
            <span className="text-xs font-normal text-stone-500">
              Have: {maxQty} {unit}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Quick preset buttons */}
          <div>
            <p className="text-xs text-stone-400 mb-2 font-medium">Quick Portion</p>
            <div className="grid grid-cols-4 gap-1.5">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(p.value)}
                  className={`rounded-lg h-8 text-xs font-semibold ${
                    amount === p.value
                      ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                      : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom decimal input */}
          <div>
            <label className="text-xs text-stone-400 font-medium block mb-1.5">
              Exact Amount Used ({unit})
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.05"
                min="0.05"
                max={maxQty}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl text-center font-bold text-base h-10"
              />
              <span className="text-sm font-medium text-stone-500 min-w-[40px]">
                {unit}
              </span>
            </div>
          </div>

          <Button
            onClick={() => handleApply(amount)}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 mt-2"
          >
            <Check className="w-4 h-4" />
            Deduct {amount} {unit}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}