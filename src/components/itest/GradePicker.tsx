"use client";

import { GRADES } from '@/lib/types';
import { cn } from '@/lib/utils';

export function GradePicker({ selected, onSelect }: { selected?: number; onSelect: (val: number) => void }) {
  return (
    <div className="flex gap-4">
      {GRADES.map((g) => (
        <button
          key={g.value}
          onClick={() => onSelect(g.value)}
          className={cn(
            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:scale-105",
            selected === g.value 
              ? "border-primary bg-primary/5 shadow-inner" 
              : "border-transparent bg-white hover:border-gray-200"
          )}
        >
          <span className="text-3xl">{g.emoji}</span>
          <span className={cn("text-xs font-bold", selected === g.value ? "text-primary" : "text-muted-foreground")}>
            {g.value}
          </span>
        </button>
      ))}
    </div>
  );
}