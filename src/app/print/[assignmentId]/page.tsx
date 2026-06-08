import dbConnect from "@/lib/mongodb";
import { Assignment } from "@/models/Assignment";
import { Classroom } from "@/models/Classroom";
import { renderRichText } from "@/lib/utils";
import React from 'react';
import { Printer, ChevronLeft } from "lucide-react";
import Link from 'next/link';

interface PrintPageProps {
  params: Promise<{
    assignmentId: string;
  }>;
}

export default async function PrintPage({ params }: PrintPageProps) {
  const { assignmentId } = await params;

  await dbConnect();
  const assignment = await Assignment.findOne({ _id: assignmentId }).lean();

  if (!assignment) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-650">Zadání nebylo nalezeno</h1>
        <p className="mt-2 text-slate-500">Zkontrolujte prosím URL adresu.</p>
        <div className="mt-6">
          <Link href="/" className="inline-flex items-center text-primary hover:underline gap-1.5 font-bold">
            <ChevronLeft className="w-4 h-4" /> Zpět do iTestu
          </Link>
        </div>
      </div>
    );
  }

  const classroom = await Classroom.findOne({ _id: assignment.classId }).lean();
  const className = classroom ? classroom.name : "Bez třídy";

  // Shuffle right items helper for matching questions in printable form
  const getPrintableMatching = (options: string[]) => {
    const pairs = options.map((opt, idx) => {
      const [left, right] = opt.split('|');
      return {
        left: left || '',
        right: right || '',
        originalIndex: idx
      };
    });

    // Shuffle the right side items for matching
    const shuffledRights = pairs.map((p, idx) => ({ text: p.right, originalIndex: p.originalIndex }));
    // Simple pseudo-random shuffle (deterministic for the printable output based on text lengths)
    const seed = assignmentId.charCodeAt(0) || 42;
    for (let i = shuffledRights.length - 1; i > 0; i--) {
      const j = (seed + i) % (i + 1);
      const temp = shuffledRights[i];
      shuffledRights[i] = shuffledRights[j];
      shuffledRights[j] = temp;
    }

    return {
      lefts: pairs.map(p => p.left),
      rights: shuffledRights
    };
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased print:bg-white print:text-black">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
      <script dangerouslySetInnerHTML={{ __html: `
        setTimeout(() => {
          window.print();
        }, 800);
      `}} />
      {/* Control panel for screen only */}
      <div className="no-print sticky top-0 z-50 bg-slate-900 text-white p-4 shadow-md flex justify-between items-center px-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-350 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Zpět do aplikace
          </Link>
          <span className="text-slate-500">|</span>
          <span className="font-bold text-sm text-slate-300">Tiskový náhled: <span className="text-white">{assignment.title}</span></span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.print();
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Vytisknout / Uložit do PDF
          </button>
        </div>
      </div>

      {/* Main printable sheet */}
      <div className="max-w-[210mm] mx-auto bg-white p-[20mm] min-h-[297mm] shadow-lg print:shadow-none print:p-0 print:mx-0">
        
        {/* Student Header */}
        <div className="border-b-2 border-slate-950 pb-6 mb-8 flex flex-col justify-between gap-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                {assignment.isPractice ? "🏋️ Pracovní list (Procvičování)" : "📝 Test k vypracování"}
              </span>
              <h1 className="text-3xl font-black mt-1 leading-tight">{assignment.title}</h1>
              {assignment.description && (
                <p className="text-sm text-slate-650 mt-1 italic leading-relaxed">{assignment.description}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-full block border border-slate-200">
                Třída: {className}
              </span>
              {assignment.subject && (
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mt-2">
                  Předmět: {assignment.subject}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-dashed border-slate-200 mt-2">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400">Jméno studenta</span>
              <div className="border-b border-slate-500 h-8"></div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400">Třída</span>
              <div className="border-b border-slate-500 h-8"></div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400">Datum</span>
              <div className="border-b border-slate-500 h-8"></div>
            </div>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-8">
          {(!assignment.questions || assignment.questions.length === 0) ? (
            <p className="text-center text-slate-500 italic py-10">Tento test neobsahuje žádné otázky.</p>
          ) : (
            assignment.questions.map((q: any, idx: number) => {
              const maxPoints = q.points || 1;
              return (
                <div key={q.id} className="space-y-3 avoid-break">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-2">
                      <span className="font-bold text-lg">{idx + 1}.</span>
                      <div className="font-bold text-lg text-slate-900 leading-tight">
                        {renderRichText(q.text)}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 shrink-0 border border-slate-300 rounded px-1.5 py-0.5 mt-1">
                      {maxPoints} {maxPoints === 1 ? 'bod' : maxPoints < 5 ? 'body' : 'bodů'}
                    </span>
                  </div>

                  {/* Rendering inputs based on Question Type */}
                  <div className="pl-6 pt-1">
                    
                    {/* Short Answer */}
                    {q.type === 'short_answer' && (
                      <div className="space-y-3 pt-2">
                        <div className="border-b border-dashed border-slate-400 h-6 w-full"></div>
                        <span className="text-[10px] font-bold text-slate-400 block">Odpověď: __________________________________________________</span>
                      </div>
                    )}

                    {/* Long Answer */}
                    {q.type === 'long_answer' && (
                      <div className="space-y-2 pt-2">
                        <div className="border-b border-dashed border-slate-450 h-6 w-full"></div>
                        <div className="border-b border-dashed border-slate-450 h-6 w-full"></div>
                        <div className="border-b border-dashed border-slate-450 h-6 w-full"></div>
                        <div className="border-b border-dashed border-slate-450 h-6 w-full"></div>
                        <div className="border-b border-dashed border-slate-450 h-6 w-full"></div>
                      </div>
                    )}

                    {/* Multiple Choice */}
                    {q.type === 'multiple_choice' && q.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {q.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className="flex items-center gap-2 text-sm font-semibold">
                            <span className="w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* True / False */}
                    {q.type === 'true_false' && (
                      <div className="flex gap-8 pt-2 text-sm font-bold">
                        <label className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border border-slate-600 block"></span>
                          <span>✓ ANO / PRAVDA</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border border-slate-600 block"></span>
                          <span>✗ NE / NEPRAVDA</span>
                        </label>
                      </div>
                    )}

                    {/* Drawing */}
                    {q.type === 'drawing' && (
                      <div className="mt-2 border border-slate-350 rounded-xl h-44 bg-slate-50/25 flex items-center justify-center text-xs font-bold text-slate-400">
                        [ Prostor pro nákres / výpočet ]
                      </div>
                    )}

                    {/* Graph */}
                    {q.type === 'graph' && (
                      <div className="mt-2 border border-slate-350 rounded-xl h-44 bg-slate-50/25 flex items-center justify-center text-xs font-bold text-slate-400 flex-col gap-1.5">
                        <span>[ Prostor pro vykreslení grafu ({q.graphType || 'sloupcový'}) ]</span>
                        {q.graphData?.categories && (
                          <div className="flex gap-3 mt-1.5 flex-wrap justify-center">
                            {q.graphData.categories.map((c: any, cIdx: number) => (
                              <span key={cIdx} className="border px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                                {c.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Axis X/Y */}
                    {q.type === 'axis' && (
                      <div className="mt-2 flex justify-center py-2">
                        <div className="border border-slate-350 rounded-xl p-4 bg-slate-50/25 flex items-center gap-4 flex-col sm:flex-row">
                          {/* SVG Grid representation */}
                          <svg width="180" height="180" className="bg-white border border-slate-200">
                            {/* Grid Lines */}
                            {Array.from({ length: 9 }).map((_, i) => (
                              <React.Fragment key={i}>
                                <line x1={(i + 1) * 20} y1="0" x2={(i + 1) * 20} y2="180" stroke="#E2E8F0" strokeWidth="1" />
                                <line x1="0" y1={(i + 1) * 20} x2="180" y2={(i + 1) * 20} stroke="#E2E8F0" strokeWidth="1" />
                              </React.Fragment>
                            ))}
                            {/* Axes */}
                            <line x1="90" y1="0" x2="90" y2="180" stroke="#475569" strokeWidth="2" />
                            <line x1="0" y1="90" x2="180" y2="90" stroke="#475569" strokeWidth="2" />
                            {/* Arrows */}
                            <polygon points="90,0 87,7 93,7" fill="#475569" />
                            <polygon points="180,90 173,87 173,93" fill="#475569" />
                            {/* Labels */}
                            <text x="100" y="12" fill="#475569" fontSize="8" fontWeight="bold">y</text>
                            <text x="170" y="82" fill="#475569" fontSize="8" fontWeight="bold">x</text>
                          </svg>
                          <div className="text-[10px] text-slate-505 font-semibold space-y-1">
                            <p>Zákres bodů do kartézské soustavy souřadnic.</p>
                            <p>Osy jsou dělené po 1 jednotce.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Number Line */}
                    {q.type === 'number_line' && (
                      <div className="mt-2 py-4">
                        <div className="flex justify-center flex-col items-center gap-2">
                          <svg width="320" height="35" className="overflow-visible">
                            {/* Line */}
                            <line x1="10" y1="15" x2="310" y2="15" stroke="#475569" strokeWidth="2" />
                            <polygon points="315,15 307,11 307,19" fill="#475569" />
                            {/* Ticks and labels */}
                            {Array.from({ length: 7 }).map((_, i) => {
                              const x = 20 + i * 45;
                              const val = -3 + i;
                              return (
                                <React.Fragment key={i}>
                                  <line x1={x} y1="10" x2={x} y2="20" stroke="#475569" strokeWidth="1.5" />
                                  <text x={x} y="32" fill="#475569" fontSize="9" fontWeight="bold" textAnchor="middle">{val}</text>
                                </React.Fragment>
                              );
                            })}
                          </svg>
                          <span className="text-[10px] text-slate-505 font-semibold">Vyznačte požadované body/intervaly na číselné ose.</span>
                        </div>
                      </div>
                    )}

                    {/* Matching (Přiřazování) */}
                    {q.type === 'matching' && q.options && (() => {
                      const { lefts, rights } = getPrintableMatching(q.options);
                      return (
                        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Levá strana</span>
                            {lefts.map((leftItem, lIdx) => (
                              <div key={lIdx} className="flex items-center gap-2 text-sm font-semibold">
                                <span className="text-slate-400 text-xs w-4 font-bold">{lIdx + 1}.</span>
                                <span className="border border-slate-300 bg-slate-50 px-2 py-1 rounded min-w-[30px] text-center font-bold">
                                  ( &nbsp; &nbsp; )
                                </span>
                                <span className="ml-1">{renderRichText(leftItem)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-3">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Pravá strana</span>
                            {rights.map((rightItem, rIdx) => (
                              <div key={rIdx} className="flex items-center gap-2 text-sm font-semibold">
                                <span className="text-slate-400 text-xs font-bold">{String.fromCharCode(65 + rIdx)})</span>
                                <span>{renderRichText(rightItem.text)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* -------------------- TEACHER ANSWER KEY -------------------- */}
        <div className="answer-key border-t-4 border-double border-slate-900 mt-16 pt-8 space-y-6 avoid-break" style={{ pageBreakBefore: 'always' }}>
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-700 tracking-widest bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                Učitelský klíč
              </span>
              <h2 className="text-2xl font-black mt-2">Autorské řešení testu</h2>
              <p className="text-xs text-slate-500 mt-0.5">Určeno pouze pro učitele k rychlé opravě prací.</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700 block">Zadání: {assignment.title}</span>
              <span className="text-xs font-semibold text-slate-500 block">Třída: {className}</span>
            </div>
          </div>

          <div className="space-y-6">
            {(!assignment.questions || assignment.questions.length === 0) ? (
              <p className="italic text-slate-500">Žádné otázky k vyhodnocení.</p>
            ) : (
              assignment.questions.map((q: any, idx: number) => {
                const maxPoints = q.points || 1;
                return (
                  <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex justify-between text-sm font-bold border-b pb-1.5 border-slate-200">
                      <span className="text-slate-800">Otázka {idx + 1} ({q.type === 'short_answer' ? 'Krátká odpověď' : 
                                                                    q.type === 'long_answer' ? 'Dlouhá odpověď' : 
                                                                    q.type === 'multiple_choice' ? 'Výběr z možností' : 
                                                                    q.type === 'axis' ? 'Osa X/Y' : 
                                                                    q.type === 'number_line' ? 'Číselná osa' : q.type === 'true_false' ? 'Ano / Ne' : 
                                                                    q.type === 'drawing' ? 'Kresba' : 
                                                                    q.type === 'graph' ? 'Graf' : q.type})</span>
                      <span className="text-slate-500">{maxPoints} b.</span>
                    </div>

                    <div className="text-sm">
                      <span className="font-semibold text-slate-500 block">Zadání:</span>
                      <p className="font-bold text-slate-800">{q.text}</p>
                    </div>

                    <div className="text-sm bg-white p-3 rounded-lg border border-slate-150 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-700 block">Správné řešení:</span>
                      <div className="font-bold text-slate-900">
                        {q.correctAnswer === undefined || q.correctAnswer === null ? (
                          <span className="italic text-slate-400 font-medium">Volné slovní zadání / Kresba bez autoklíče</span>
                        ) : q.type === 'multiple_choice' ? (
                          <span>Option {String.fromCharCode(65 + Number(q.correctAnswer))}: {q.options?.[Number(q.correctAnswer)]}</span>
                        ) : q.type === 'true_false' ? (
                          <span>{q.correctAnswer ? '✓ ANO (Pravda)' : '✗ NE (Nepravda)'}</span>
                        ) : q.type === 'matching' ? (
                          <div className="space-y-1 pt-1">
                            {q.options?.map((opt: string, optIdx: number) => {
                              const [left, right] = opt.split('|');
                              return (
                                <div key={optIdx} className="text-xs flex items-center gap-1.5">
                                  <span className="text-slate-500 font-medium">{optIdx + 1}. {left}</span>
                                  <span className="text-indigo-500 font-bold">↔</span>
                                  <span className="text-slate-800">{right}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : q.type === 'axis' || q.type === 'number_line' || q.type === 'graph' ? (
                          <span className="font-mono text-slate-700 text-xs">{JSON.stringify(q.correctAnswer)}</span>
                        ) : (
                          <span>{String(q.correctAnswer)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
