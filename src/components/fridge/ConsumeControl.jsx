import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, Minus, Plus } from "lucide-react";

export default function ConsumeControl({ item, onConsume }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(item.quantity);
  const max = item.quantity || 1;
  const clamp = (v) => Math.max(1, Math.min(max, v));

  const confirm = () => {
    setOpen(false);
    onConsume(item, clamp(amount));
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setAmount(max); }}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="rounded-full text-emerald-600 hover:bg-emerald-100 h-10 w-10" title="Mark as used">
          <Check className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-3 rounded-2xl" align="end">
        <p className="text-xs font-medium text-stone-500 mb-2 text-center">How many used?</p>
        <div className="flex items-center justify-between gap-1">
          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => setAmount((a) => clamp(a - 1))} disabled={amount <= 1}>
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-lg font-bold text-stone-800 tabular-nums min-w-[2ch] text-center">{amount}</span>
          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => setAmount((a) => clamp(a + 1))} disabled={amount >= max}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <Button size="sm" className="w-full mt-3 rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={confirm}>
          Mark used
        </Button>
      </PopoverContent>
    </Popover>
  );
}