"use client";

import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Question } from '@/lib/types';
import { renderRichText } from '@/lib/utils';

interface MatchingQuestionStudentProps {
  question: Question;
  disabled: boolean;
  value: Record<string, number> | undefined;
  onChange: (val: Record<string, number>) => void;
}

const PAIR_COLORS = [
  { bg: 'border-blue-300 bg-blue-50/70 text-blue-900 shadow-sm', badge: 'bg-blue-600 text-white' },
  { bg: 'border-emerald-300 bg-emerald-50/70 text-emerald-900 shadow-sm', badge: 'bg-emerald-600 text-white' },
  { bg: 'border-purple-300 bg-purple-50/70 text-purple-900 shadow-sm', badge: 'bg-purple-600 text-white' },
  { bg: 'border-amber-300 bg-amber-50/70 text-amber-900 shadow-sm', badge: 'bg-amber-600 text-white' },
  { bg: 'border-rose-300 bg-rose-50/70 text-rose-900 shadow-sm', badge: 'bg-rose-600 text-white' }
];

export function MatchingQuestionStudent({
  question,
  disabled,
  value,
  onChange
}: MatchingQuestionStudentProps) {
  const pairs = useMemo(() => {
    return (question.options || []).map(opt => {
      const [left, right] = opt.split('|');
      return { left: left || '', right: right || '' };
    });
  }, [question.options]);

  const [shuffledRight, setShuffledRight] = useState<{ text: string; originalIndex: number }[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  useEffect(() => {
    const items = pairs.map((p, idx) => ({ text: p.right, originalIndex: idx }));
    // Stabilní shuffle na základě ID otázky a obsahu možností, popř. náhodný při prvním vykreslení
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setShuffledRight(shuffled);
    setSelectedLeft(null);
  }, [question.id, question.options]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      {/* Levý sloupec */}
      <div className="space-y-3">
        <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">Levá část</span>
        <div className="space-y-2">
          {pairs.map((p, idx) => {
            const pairedRightIndex = value?.[String(idx)];
            const isSelected = selectedLeft === idx;
            const isPaired = pairedRightIndex !== undefined;

            const colorClass = isPaired 
              ? PAIR_COLORS[idx % PAIR_COLORS.length].bg 
              : isSelected 
                ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20 text-indigo-900 shadow-sm'
                : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700';

            return (
              <div
                key={idx}
                onClick={() => {
                  if (disabled) return;
                  if (isSelected) {
                    setSelectedLeft(null);
                  } else {
                    setSelectedLeft(idx);
                  }
                }}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between text-sm font-semibold select-none ${colorClass}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                  <span>{renderRichText(p.left)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isPaired && (
                    <>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${PAIR_COLORS[idx % PAIR_COLORS.length].badge}`}>
                        Pár {String.fromCharCode(65 + Number(idx))}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (disabled) return;
                          const copy = { ...value };
                          delete copy[String(idx)];
                          onChange(copy);
                        }}
                        className="text-slate-400 hover:text-red-500 hover:bg-slate-100 p-1.5 rounded-full transition-colors leading-none"
                      >
                        ✕
                      </button>
                    </>
                  )}
                  {!isPaired && isSelected && (
                    <span className="text-xs text-indigo-600 animate-pulse font-bold">Zvolte pravou část...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pravý sloupec */}
      <div className="space-y-3">
        <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">Pravá část</span>
        <div className="space-y-2">
          {shuffledRight.map((item, idx) => {
            let pairedLeftIdx: number | null = null;
            if (value) {
              Object.keys(value).forEach(lKey => {
                if (value[lKey] === item.originalIndex) {
                  pairedLeftIdx = Number(lKey);
                }
              });
            }
            const isPaired = pairedLeftIdx !== null;

            const colorClass = isPaired 
              ? PAIR_COLORS[pairedLeftIdx! % PAIR_COLORS.length].bg 
              : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700';

            return (
              <div
                key={idx}
                onClick={() => {
                  if (disabled) return;
                  if (selectedLeft !== null) {
                    const copy = { ...(value || {}) };
                    // Zrušit ostatní vazby pro tento pravý prvek
                    Object.keys(copy).forEach(lKey => {
                      if (copy[lKey] === item.originalIndex) {
                        delete copy[lKey];
                      }
                    });
                    copy[String(selectedLeft)] = item.originalIndex;
                    onChange(copy);
                    setSelectedLeft(null);
                  }
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between text-sm font-semibold select-none ${colorClass} ${
                  selectedLeft !== null && !isPaired ? 'cursor-pointer hover:bg-indigo-50/20' : 'cursor-default'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span>{renderRichText(item.text)}</span>
                </div>
                {isPaired && (
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${PAIR_COLORS[pairedLeftIdx! % PAIR_COLORS.length].badge}`}>
                    Pár {String.fromCharCode(65 + Number(pairedLeftIdx))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface MatchingQuestionReviewProps {
  question: Question;
  studentAnswer: Record<string, number> | undefined;
}

export function MatchingQuestionReview({ question, studentAnswer }: MatchingQuestionReviewProps) {
  const pairs = useMemo(() => {
    return (question.options || []).map(opt => {
      const [left, right] = opt.split('|');
      return { left: left || '', right: right || '' };
    });
  }, [question.options]);

  const given = studentAnswer && typeof studentAnswer === 'object' ? studentAnswer : {};

  return (
    <div className="space-y-2.5 mt-3 w-full">
      <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">Vyhodnocení párování:</span>
      <div className="grid grid-cols-1 gap-2 w-full">
        {pairs.map((p, idx) => {
          const matchedRightIdx = given[idx];
          const isCorrect = matchedRightIdx !== undefined && Number(matchedRightIdx) === idx;
          const studentMatchedText = matchedRightIdx !== undefined 
            ? (pairs[Number(matchedRightIdx)]?.right || 'Neznámý')
            : null;

          return (
            <div 
              key={idx}
              className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-semibold ${
                matchedRightIdx === undefined
                  ? 'bg-slate-50 border-slate-200 text-slate-500'
                  : isCorrect
                    ? 'bg-green-50/60 border-green-200 text-green-950'
                    : 'bg-red-50/60 border-red-200 text-red-955'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                <span>{renderRichText(p.left)}</span>
                <span className="text-slate-400">↔</span>
                {matchedRightIdx === undefined ? (
                  <span className="italic text-slate-405">Neodpovězeno</span>
                ) : (
                  <span>{renderRichText(studentMatchedText || '')}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {matchedRightIdx === undefined ? (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                    Správně: {renderRichText(p.right)}
                  </Badge>
                ) : isCorrect ? (
                  <Badge className="bg-green-600 text-white hover:bg-green-600 text-[10px] font-bold flex items-center gap-1">
                    ✓ Správně
                  </Badge>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="destructive" className="bg-red-600 text-white hover:bg-red-600 text-[10px] font-bold flex items-center gap-1">
                      ✗ Chyba
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] font-bold">
                      Správně: {renderRichText(p.right)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
