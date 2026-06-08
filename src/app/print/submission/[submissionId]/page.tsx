import dbConnect from "@/lib/mongodb";
import { Submission } from "@/models/Submission";
import { Assignment } from "@/models/Assignment";
import { Classroom } from "@/models/Classroom";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";
import { renderRichText } from "@/lib/utils";
import React from 'react';
import { Printer, ChevronLeft } from "lucide-react";
import Link from 'next/link';

interface PrintSubmissionPageProps {
  params: Promise<{
    submissionId: string;
  }>;
}

const GRADES = [
  { value: 1, label: 'Výborně', emoji: '🤩' },
  { value: 2, label: 'Chvalitebně', emoji: '😊' },
  { value: 3, label: 'Dobře', emoji: '😐' },
  { value: 4, label: 'Dostatečně', emoji: '😟' },
  { value: 5, label: 'Nedostatečně', emoji: '😢' },
];

export default async function PrintSubmissionPage({ params }: PrintSubmissionPageProps) {
  const { submissionId } = await params;

  await dbConnect();
  const submission = await Submission.findOne({ _id: submissionId }).lean();

  if (!submission) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-650">Odevzdaná práce nebyla nalezena</h1>
        <p className="mt-2 text-slate-500">Zkontrolujte prosím URL adresu.</p>
        <div className="mt-6">
          <Link href="/" className="inline-flex items-center text-primary hover:underline gap-1.5 font-bold">
            <ChevronLeft className="w-4 h-4" /> Zpět do iTestu
          </Link>
        </div>
      </div>
    );
  }

  const assignment = await Assignment.findOne({ _id: submission.assignmentId }).lean();

  if (!assignment) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-650">Zadání k této práci nebylo nalezeno</h1>
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

  // Load student name
  let studentName = "Neznámý žák";
  let studentObj = await Student.findOne({ _id: submission.studentId }).lean();
  if (studentObj) {
    studentName = `${studentObj.firstName} ${studentObj.lastName}`;
  } else {
    const teacherObj = await Teacher.findOne({ _id: submission.studentId }).lean();
    if (teacherObj) {
      studentName = `${teacherObj.firstName} ${teacherObj.lastName}`;
    }
  }

  // Cast maps to plain objects because of .lean()
  const questionScores = (submission.questionScores || {}) as any;
  const answers = (submission.answers || {}) as any;
  const questionDrawings = (submission.questionDrawings || {}) as any;

  // Calculate points
  let earnedPoints = 0;
  let maxPoints = 0;
  if (assignment.questions) {
    assignment.questions.forEach((q: any) => {
      maxPoints += q.points ?? 1;
      earnedPoints += questionScores[q.id] ?? 0;
    });
  }

  // Grade representation
  const gradeObj = submission.grade ? GRADES.find(g => g.value === submission.grade) : null;

  // Matching helper
  const renderMatchingAnswer = (q: any, studentAnswer: any) => {
    if (!q.options) return null;
    const pairs = q.options.map((opt: string, idx: number) => {
      const [left, right] = opt.split('|');
      return {
        left: left || '',
        right: right || '',
        originalIndex: idx
      };
    });

    // Shuffle deterministic
    const shuffledRights = pairs.map((p: any, idx: number) => ({ text: p.right, originalIndex: p.originalIndex }));
    const seed = submission.assignmentId.charCodeAt(0) || 42;
    for (let i = shuffledRights.length - 1; i > 0; i--) {
      const j = (seed + i) % (i + 1);
      const temp = shuffledRights[i];
      shuffledRights[i] = shuffledRights[j];
      shuffledRights[j] = temp;
    }

    const given = studentAnswer && typeof studentAnswer === 'object' ? studentAnswer : {};

    return (
      <div className="space-y-2.5 pt-2 text-left">
        {pairs.map((p: any, lIdx: number) => {
          const chosenOrigIdx = given[lIdx];
          const chosenShuffledIdx = shuffledRights.findIndex((r: any) => r.originalIndex === Number(chosenOrigIdx));
          const chosenLetter = chosenShuffledIdx !== -1 ? String.fromCharCode(65 + chosenShuffledIdx) : '—';
          const isCorrect = Number(chosenOrigIdx) === p.originalIndex;
          
          return (
            <div key={lIdx} className="text-sm flex flex-col sm:flex-row sm:items-center gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 min-w-[200px]">
                <span className="text-slate-450 font-bold text-xs">{lIdx + 1}.</span>
                <span className="font-semibold text-slate-800">{p.left}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Přiřazeno:</span>
                <span className={`px-2 py-0.5 rounded font-black text-xs ${
                  chosenOrigIdx === undefined 
                    ? 'bg-slate-100 text-slate-500' 
                    : isCorrect 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                }`}>
                  {chosenLetter}) {chosenShuffledIdx !== -1 ? shuffledRights[chosenShuffledIdx].text : 'Žádná odpověď'}
                </span>
                {!isCorrect && chosenOrigIdx !== undefined && (
                  <span className="text-xs font-semibold text-slate-500 italic">
                    (Správně: {String.fromCharCode(65 + shuffledRights.findIndex((r: any) => r.originalIndex === p.originalIndex))}) {p.right})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Multiple Choice helper
  const renderMultipleChoiceAnswer = (options: string[], correct: any, studentVal: any) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-left">
        {options.map((opt, idx) => {
          const isChosen = studentVal === idx;
          const isCorrectChoice = Number(correct) === idx;
          const isWrongChoice = isChosen && !isCorrectChoice;
          
          return (
            <div 
              key={idx} 
              className={`flex items-center gap-2 p-2 rounded-xl border transition-all text-sm font-semibold ${
                isCorrectChoice 
                  ? 'bg-green-50 border-green-200 text-green-900 font-bold' 
                  : isWrongChoice 
                    ? 'bg-red-50 border-red-200 text-red-900' 
                    : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-black shrink-0 ${
                isChosen 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'border-slate-500'
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span>{opt}</span>
              {isCorrectChoice && <span className="text-[10px] font-black text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full uppercase ml-auto">Správná</span>}
              {isWrongChoice && <span className="text-[10px] font-black text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full uppercase ml-auto">Chybná volba</span>}
            </div>
          );
        })}
      </div>
    );
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
          <span className="font-bold text-sm text-slate-300">Tisk odevzdané práce: <span className="text-white">{studentName} - {assignment.title}</span></span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.print();
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all shadow flex items-center gap-2 cursor-pointer border-none"
          >
            <Printer className="w-4 h-4" /> Vytisknout / Uložit do PDF
          </button>
        </div>
      </div>

      {/* Main printable sheet */}
      <div className="max-w-[210mm] mx-auto bg-white p-[20mm] min-h-[297mm] shadow-lg print:shadow-none print:p-0 print:mx-0">
        
        {/* Header Block */}
        <div className="border-b-2 border-slate-950 pb-6 mb-8 flex flex-col gap-4 text-left">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                Odevzdaná práce žáka
              </span>
              <h1 className="text-3xl font-black mt-2 leading-tight">{assignment.title}</h1>
              <p className="text-xs text-slate-500 mt-1">Vypracoval/a: <strong className="text-slate-800 text-sm">{studentName}</strong></p>
            </div>
            
            <div className="text-right flex flex-col items-end gap-1.5">
              <span className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                Třída: {className}
              </span>
              <span className="text-[10px] text-slate-500 font-bold tracking-mono">
                Odevzdáno: {new Date(submission.submittedAt).toLocaleDateString('cs-CZ')} {new Date(submission.submittedAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-dashed border-slate-200 mt-2">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Celkové body</span>
              <div className="text-lg font-black text-primary">{earnedPoints} / {maxPoints} b.</div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Úspěšnost</span>
              <div className="text-lg font-black text-indigo-700">{maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0} %</div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Výsledná známka</span>
              <div className="text-lg font-black text-amber-600">
                {gradeObj ? `${gradeObj.value} - ${gradeObj.label} ${gradeObj.emoji}` : 'Nehodnoceno'}
              </div>
            </div>
          </div>

          {submission.feedback && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mt-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Zpětná vazba od učitele:</span>
              <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">{submission.feedback}</p>
            </div>
          )}
        </div>

        {/* Questions & Answers list */}
        <div className="space-y-8 text-left">
          {(!assignment.questions || assignment.questions.length === 0) ? (
            <p className="text-center text-slate-500 italic py-10">Tento test neobsahuje žádné otázky.</p>
          ) : (
            assignment.questions.map((q: any, idx: number) => {
              const maxQPoints = q.points ?? 1;
              const earnedQPoints = questionScores[q.id] ?? 0;
              const studentAnswer = answers[q.id];
              const studentDrawing = questionDrawings[q.id];
              
              return (
                <div key={q.id} className="space-y-3 avoid-break border-b border-dashed border-slate-200 pb-6 last:border-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-2">
                      <span className="font-bold text-lg">{idx + 1}.</span>
                      <div className="font-bold text-lg text-slate-900 leading-tight">
                        {renderRichText(q.text)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 gap-1 mt-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        earnedQPoints === maxQPoints 
                          ? 'bg-green-100 text-green-800' 
                          : earnedQPoints > 0 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        Body: {earnedQPoints} / {maxQPoints}
                      </span>
                    </div>
                  </div>

                  {/* Rendering inputs based on Question Type */}
                  <div className="pl-6 pt-1">
                    
                    {/* Short Answer */}
                    {q.type === 'short_answer' && (
                      <div className="space-y-2 pt-1 text-left">
                        <div className="text-sm font-medium text-slate-500">Odpověď studenta:</div>
                        <div className="text-sm font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border">
                          {studentAnswer || <span className="italic text-slate-400 font-medium">Nevyplněno</span>}
                        </div>
                        {q.correctAnswer && (
                          <div className="text-xs font-bold text-green-700 bg-green-50/50 p-2 rounded-lg border border-green-100 mt-1.5 flex gap-1">
                            <span>Správné řešení:</span>
                            <span>{q.correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Long Answer */}
                    {q.type === 'long_answer' && (
                      <div className="space-y-2 pt-1 text-left">
                        <div className="text-sm font-medium text-slate-500">Odpověď studenta:</div>
                        <div className="text-sm font-semibold text-slate-800 bg-slate-50 p-4 rounded-xl border whitespace-pre-wrap leading-relaxed">
                          {studentAnswer || <span className="italic text-slate-400 font-medium">Nevyplněno</span>}
                        </div>
                      </div>
                    )}

                    {/* Multiple Choice */}
                    {q.type === 'multiple_choice' && q.options && (
                      renderMultipleChoiceAnswer(q.options, q.correctAnswer, studentAnswer)
                    )}

                    {/* True / False */}
                    {q.type === 'true_false' && (
                      <div className="space-y-1.5">
                        <span className="text-xs text-slate-500 font-bold uppercase block tracking-wider">Odpověď:</span>
                        {renderTrueFalseAnswer(q.correctAnswer, studentAnswer)}
                      </div>
                    )}

                    {/* Drawing */}
                    {q.type === 'drawing' && (
                      <div className="space-y-2 pt-1 text-left">
                        <span className="text-xs text-slate-500 font-bold uppercase block tracking-wider">Nákres studenta:</span>
                        {studentDrawing ? (
                          <div className="border border-slate-200 rounded-2xl p-2 bg-slate-50 flex justify-center max-w-md">
                            <img src={studentDrawing} alt="Nákres studenta" className="max-h-48 object-contain rounded-lg" />
                          </div>
                        ) : (
                          <div className="border border-dashed border-slate-300 rounded-2xl p-6 text-center italic text-slate-450 bg-slate-50/50 text-xs">
                            Žádný nákres nebyl odeslán.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Graph */}
                    {q.type === 'graph' && (
                      <div className="space-y-2 pt-1 text-left">
                        <span className="text-xs text-slate-500 font-bold uppercase block tracking-wider">Zákres grafu studenta:</span>
                        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 text-xs text-slate-600 font-mono space-y-1">
                          <div><strong>Odpověď studenta:</strong> {JSON.stringify(studentAnswer) || "Nevyplněno"}</div>
                          {q.correctAnswer && <div><strong>Správné řešení:</strong> {JSON.stringify(q.correctAnswer)}</div>}
                        </div>
                      </div>
                    )}

                    {/* Axis X/Y */}
                    {q.type === 'axis' && (
                      <div className="space-y-2 pt-1 text-left">
                        <span className="text-xs text-slate-500 font-bold uppercase block tracking-wider">Zákres bodů studenta:</span>
                        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 text-xs text-slate-600 font-mono space-y-1">
                          <div><strong>Body odeslané studentem:</strong> {JSON.stringify(studentAnswer) || "Nevyplněno"}</div>
                          {q.correctAnswer && <div><strong>Správné body:</strong> {JSON.stringify(q.correctAnswer)}</div>}
                        </div>
                      </div>
                    )}

                    {/* Number Line */}
                    {q.type === 'number_line' && (
                      <div className="space-y-2 pt-1 text-left">
                        <span className="text-xs text-slate-500 font-bold uppercase block tracking-wider">Zákres na číselné ose studenta:</span>
                        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 text-xs text-slate-600 font-mono space-y-1">
                          <div><strong>Zákres studenta:</strong> {JSON.stringify(studentAnswer) || "Nevyplněno"}</div>
                          {q.correctAnswer && <div><strong>Správné body:</strong> {JSON.stringify(q.correctAnswer)}</div>}
                        </div>
                      </div>
                    )}

                    {/* Matching (Přiřazování) */}
                    {q.type === 'matching' && q.options && (
                      renderMatchingAnswer(q, studentAnswer)
                    )}

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}

// Render helper for True/False
function renderTrueFalseAnswer(correct: boolean, studentVal: any) {
  const isCorrect = studentVal === correct;
  return (
    <div className="flex gap-8 pt-1 text-sm font-bold">
      <span className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border ${
        studentVal === true 
          ? isCorrect 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-red-100 text-red-800 border-red-200'
          : 'bg-slate-50 text-slate-400 border-slate-200'
      }`}>
        {studentVal === true ? '✓ ANO' : 'ANO'} {correct === true && <span className="text-[10px] text-green-700 bg-green-50 px-1 rounded-full">(Správná)</span>}
      </span>
      <span className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border ${
        studentVal === false 
          ? isCorrect 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-red-100 text-red-800 border-red-200'
          : 'bg-slate-50 text-slate-400 border-slate-200'
      }`}>
        {studentVal === false ? '✗ NE' : 'NE'} {correct === false && <span className="text-[10px] text-green-700 bg-green-50 px-1 rounded-full">(Správná)</span>}
      </span>
    </div>
  );
}
