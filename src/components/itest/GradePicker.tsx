"use client";

import { GRADES } from '@/lib/types';
import { cn } from '@/lib/utils';

export function GradePicker({ 
  selected, 
  onSelect,
  suggested 
}: { 
  selected?: number; 
  onSelect: (val: number) => void;
  suggested?: number;
}) {
  return (
    <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
      {GRADES.map((g) => (
        <button
          key={g.value}
          onClick={() => onSelect(g.value)}
          className={cn(
            "flex flex-col items-center gap-2 p-4 min-w-[80px] rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 relative",
            selected === g.value 
              ? "border-primary bg-primary text-white shadow-lg" 
              : g.value === suggested
                ? "border-amber-400 bg-amber-50/50 hover:border-amber-500 text-amber-600 shadow-sm"
                : "border-gray-100 bg-white hover:border-primary/20 text-gray-400"
          )}
        >
          {g.value === suggested && selected !== g.value && (
            <span className="absolute -top-2.5 bg-amber-400 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm tracking-widest animate-bounce">
              Návrh
            </span>
          )}
          <span className="text-4xl">{g.emoji}</span>
          <span className={cn("text-sm font-bold uppercase tracking-tighter", selected === g.value ? "text-white" : g.value === suggested ? "text-amber-700" : "text-muted-foreground")}>
            {g.value}
          </span>
        </button>
      ))}
    </div>
  );
}
