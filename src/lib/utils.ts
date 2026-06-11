import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function renderRichText(text: string): React.ReactNode[] | string | null {
  if (!text) return null;
  // Odstranění markdown hvězdiček (zabraňuje zobrazení ** v plain textu na UI)
  const cleanText = text.replace(/\*\*/g, "").replace(/\*/g, "");
  const regex = /\[([^/\]\s]+)\/([^/\]\s]+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(cleanText)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(cleanText.substring(lastIndex, matchIndex));
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
  if (lastIndex < cleanText.length) {
    parts.push(cleanText.substring(lastIndex));
  }
  return parts.length > 0 ? parts : cleanText;
}

export interface ClozePart {
  type: 'text' | 'dropdown' | 'input';
  text?: string;
  index?: number;
  options?: string[];
  correctAnswer?: string;
}

export function parseClozeText(text: string): ClozePart[] {
  if (!text) return [];
  const parts: ClozePart[] = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match;
  let blankIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push({
        type: 'text',
        text: text.substring(lastIndex, matchIndex)
      });
    }

    const content = match[1];
    if (content.includes('/')) {
      const options = content.split('/');
      const correctAnswer = options[0]; // first one is correct
      parts.push({
        type: 'dropdown',
        options: options,
        correctAnswer: correctAnswer,
        index: blankIndex++
      });
    } else {
      parts.push({
        type: 'input',
        correctAnswer: content,
        index: blankIndex++
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      text: text.substring(lastIndex)
    });
  }

  return parts;
}

