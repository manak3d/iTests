"use client";

import { GRADES } from '@/lib/types';
import { cn } from '@/lib/utils';

export function GradePicker({ selected, onSelect }: { selected?: number; onSelect: (val: number) => void }) {
  return (
    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
      {GRADES.map((g) => (
        <button
          key={g.value}
          onClick={() => onSelect(g.value)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 min-w-[80px] rounded-2xl border-2 transition-all hover:scale-105 active:scale-95",
            selected === g.value 
              ? "border-primary bg-primary text-white shadow-lg" 
              : "border-gray-100 bg-white hover:border-primary/20 text-gray-400"
          )}
        >
          <span className="text-4xl">{g.emoji}</span>
          <span className={cn("text-sm font-bold uppercase tracking-tighter", selected === g.value ? "text-white" : "text-muted-foreground")}>
            {g.value}
          </span>
        </button>
      ))}
    </div>
  );
}
