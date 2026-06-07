import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function renderRichText(text: string): React.ReactNode[] | string | null {
  if (!text) return null;
  const regex = /\[([^/\]\s]+)\/([^/\]\s]+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }
    const numerator = match[1];
    const denominator = match[2];
    parts.push(
      React.createElement(
        'span',
        {
          key: matchIndex,
          className: 'inline-flex flex-col items-center justify-center text-[11px] align-middle leading-none mx-0.5 font-bold text-slate-800'
        },
        React.createElement('span', { className: 'border-b border-slate-600 pb-0.5 px-0.5' }, numerator),
        React.createElement('span', { className: 'pt-0.5 px-0.5' }, denominator)
      )
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

