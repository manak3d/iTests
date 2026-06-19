// @ts-nocheck
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard,
  BookOpen,
  ChevronRight,
  AlertTriangle,
  ArrowLeft,
  Send,
  Play,
  CheckCircle2,
  Trophy,
  Clock,
  XCircle,
  TrendingUp,
  HelpCircle,
  Activity,
  Star,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/itest/Navbar";
import { QuestionRenderer } from "@/components/itest/QuestionRenderer";
import { parseClozeText } from "@/lib/utils";

export function StudentDashboard(props: any) {
    const {
    store, currentUser,
    selectedSubject, setSelectedSubject,
    viewingAssignment, setViewingAssignment,
    formatDateTime,
    renderProfileModal, renderGradebookDialog,
    setSelectedGradebookStudent, setSelectedGradebookSubject, setGradebookViewMode,
    practiceLoading, practiceErrors, practiceAiContent, practiceAnswers, practiceChecked,
    setPracticeAnswers, setPracticeChecked, handleLoadAiPractice,
    renderRichText, studentAnswers, setStudentAnswers,
    setQuestionDrawings, questionDrawingOpen, setQuestionDrawingOpen, questionDrawings,
    setMainWorkDrawing, mainWorkDrawing,
    handlePracticeSubmit, isEvaluatingPractice,
    selectedAssignmentId, selectStudentAssignment
  } = props;
  const [tabFocusLostCount, setTabFocusLostCount] = React.useState(0);
  const [showCheatWarning, setShowCheatWarning] = React.useState(false);
  const cheatTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!selectedAssignmentId || showResults) return;

    const handleCheat = () => {
      setTabFocusLostCount(prev => prev + 1);
      setShowCheatWarning(true);
      if (cheatTimeoutRef.current) clearTimeout(cheatTimeoutRef.current);
      cheatTimeoutRef.current = setTimeout(() => {
        setShowCheatWarning(false);
      }, 5000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleCheat();
    };

    const handleBlur = () => {
      handleCheat();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      if (cheatTimeoutRef.current) clearTimeout(cheatTimeoutRef.current);
    };
  }, [selectedAssignmentId, showResults]);

  React.useEffect(() => {
    if (selectedAssignmentId && !showResults) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else if (!selectedAssignmentId) {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [selectedAssignmentId, showResults]);


  const studentAssignments = store.assignments.filter(
    (a) =>
      a.classId === currentUser.classId &&
      (!a.studentIds ||
        a.studentIds.length === 0 ||
        a.studentIds.includes(currentUser.id)),
  );
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showCheatWarning && (
        <div className="fixed inset-0 z-[9999] bg-red-600 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
          <AlertTriangle className="w-32 h-32 text-white mb-6 animate-pulse" />
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Opuštění testu zaznamenáno!</h1>
          <p className="text-2xl text-red-100 font-medium max-w-2xl">
            Systém detekoval opuštění okna prohlížeče. Toto chování je zaznamenáno a bude předáno učiteli jako možné porušení pravidel zkoušky.
          </p>
          <div className="mt-8 px-6 py-3 bg-black/20 rounded-full text-red-50 font-bold">
            Vraťte se okamžitě k testu. Zpráva zmizí za chvíli.
          </div>
        </div>
      )}

      <Navbar user={currentUser} onLogout={() => store.logout()} />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 animate-fade-in">
        {selectedAssignmentId ? (
          <div className="space-y-6">
            {timeLeft !== null && (
              <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-red-500 to-indigo-600 text-white font-mono px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-pulse print-exclude">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold block uppercase tracking-wider text-white/80">
                    Zbývající čas
                  </span>
                  <span className="text-2xl font-black">
                    {(() => {
                      const mins = Math.floor(timeLeft / 60);
                      const secs = timeLeft % 60;
                      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
                    })()}
                  </span>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => selectStudentAssignment(null)}
            >
              ← Zpět
            </Button>
            {(() => {
              const a = store.assignments.find(
                (as) => as.id === selectedAssignmentId,
              );
              const now = new Date();
              const formatter = new Intl.DateTimeFormat("en-US", {
                timeZone: "Europe/Prague",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
              const parts = formatter.formatToParts(now);
              const getVal = (type: string) =>
                parts.find((p) => p.type === type)?.value || "";
              let hourVal = getVal("hour");
              if (hourVal === "24") hourVal = "00";
              const nowStr = `${getVal("year")}-${getVal("month")}-${getVal("day")}T${hourVal}:${getVal("minute")}`;
              const hasEnded = a && a.endTime ? nowStr > a.endTime : false;
              const submission = store.submissions.find(
                (s) =>
                  s.assignmentId === selectedAssignmentId &&
                  s.studentId === currentUser.id,
              );
              if (!a) return null;
              return (
                <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-primary text-white p-8">
                    <CardTitle className="text-3xl">{a.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8 bg-white">
                    {submission && submission.submittedAt ? (
                      <div className="space-y-8">
                        {/* Výsledková karta žáka */}
                        <div className="text-center py-6 space-y-4">
                          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                          <h3 className="text-2xl font-bold">
                            Práce byla odevzdána
                          </h3>

                          {(() => {
                            const totalMax =
                              a.questions?.reduce(
                                (acc, q) => acc + (q.points || 1),
                                0,
                              ) || 0;
                            let earned = 0;
                            if (submission.questionScores) {
                              if (submission.questionScores instanceof Map) {
                                submission.questionScores.forEach((val) => {
                                  earned += val;
                                });
                              } else {
                                Object.values(
                                  submission.questionScores,
                                ).forEach((val) => {
                                  earned += val as number;
                                });
                              }
                            }
                            const pct =
                              totalMax > 0
                                ? Math.round((earned / totalMax) * 100)
                                : 0;
                            return (
                              <div className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/20 mt-4 text-center space-y-4">
                                {a.isPractice ? (
                                  <div className="text-4xl font-black text-indigo-700 bg-indigo-50/50 border border-indigo-100 px-6 py-3 rounded-2xl inline-block">
                                    🏋️ Procvičování
                                  </div>
                                ) : (
                                  <div className="text-4xl font-black text-primary">
                                    Známka: {submission.grade || "Nehodnoceno"}
                                  </div>
                                )}
                                <div className="text-lg font-bold text-muted-foreground">
                                  Celkové body: {earned} / {totalMax} ({pct} %)
                                </div>

                                {!a.isPractice && submission.grade && (
                                  <div className="flex flex-wrap gap-4 justify-center pt-2">
                                    {[1, 2, 3, 4, 5].map((g) => {
                                      const isActive =
                                        Number(submission.grade) === g;
                                      const emoji =
                                        g === 1
                                          ? "🤩"
                                          : g === 2
                                            ? "😊"
                                            : g === 3
                                              ? "😐"
                                              : g === 4
                                                ? "😟"
                                                : "😢";

                                      const activeClass =
                                        g === 1
                                          ? "border-amber-400 bg-amber-50/50 text-amber-600 hover:border-amber-500 shadow-sm"
                                          : g === 2
                                            ? "border-green-400 bg-green-50/50 text-green-600 hover:border-green-500 shadow-sm"
                                            : g === 3
                                              ? "border-blue-400 bg-blue-50/50 text-blue-600 hover:border-blue-500 shadow-sm"
                                              : g === 4
                                                ? "border-orange-400 bg-orange-50/50 text-orange-600 hover:border-orange-500 shadow-sm"
                                                : "border-primary bg-primary text-white shadow-lg";

                                      const textClass = isActive
                                        ? g === 5
                                          ? "text-white"
                                          : g === 1
                                            ? "text-amber-700"
                                            : g === 2
                                              ? "text-green-700"
                                              : g === 3
                                                ? "text-blue-700"
                                                : "text-orange-700"
                                        : "text-muted-foreground";

                                      const badgeBg =
                                        g === 1
                                          ? "bg-amber-400"
                                          : g === 2
                                            ? "bg-green-400"
                                            : g === 3
                                              ? "bg-blue-400"
                                              : g === 4
                                                ? "bg-orange-400"
                                                : "bg-red-500";

                                      return (
                                        <button
                                          key={g}
                                          type="button"
                                          className={`flex flex-col items-center gap-2 p-4 min-w-[80px] rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 relative ${
                                            isActive
                                              ? activeClass
                                              : "border-gray-100 bg-white hover:border-primary/20 text-gray-400"
                                          }`}
                                        >
                                          {isActive && (
                                            <span
                                              className={`absolute -top-2.5 ${badgeBg} text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm tracking-widest animate-bounce`}
                                            >
                                              Tvoje Známka
                                            </span>
                                          )}
                                          <span className="text-4xl">
                                            {emoji}
                                          </span>
                                          <span
                                            className={`text-sm font-bold uppercase tracking-tighter ${textClass}`}
                                          >
                                            {g}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {submission.feedback &&
                                  (a.isPractice ? (
                                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-left space-y-2">
                                      <div className="text-indigo-800 font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                                        Celkové hodnocení AI
                                      </div>
                                      <p className="text-sm font-medium text-indigo-950 whitespace-pre-wrap leading-relaxed">
                                        {submission.feedback}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="mt-4 p-3 bg-white rounded-xl border border-primary/10 italic text-muted-foreground">
                                      Odpověď učitele: "{submission.feedback}"
                                    </div>
                                  ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Seznam otázek a vyhodnocení */}
                        {a.questions && a.questions.length > 0 && (
                          <div className="space-y-6">
                            <h3 className="font-headline text-xl font-bold text-primary border-b pb-2">
                              Vyhodnocení jednotlivých otázek
                            </h3>
                            <div className="space-y-4">
                              {a.questions.map((q, index) => {
                                const answer = submission.answers?.[q.id];
                                const drawing =
                                  submission.questionDrawings?.[q.id];
                                const maxPoints = q.points || 1;
                                const score = submission.questionScores
                                  ? submission.questionScores instanceof Map
                                    ? (submission.questionScores.get(q.id) ?? 0)
                                    : ((
                                        submission.questionScores as Record<
                                          string,
                                          number
                                        >
                                      )[q.id] ?? 0)
                                  : 0;

                                const isGraded =
                                  (submission.grade !== undefined &&
                                    submission.grade !== null) ||
                                  (a.isPractice && !!submission.submittedAt);
                                const isCorrect =
                                  isGraded && score === maxPoints;

                                return (
                                  <div
                                    key={q.id}
                                    className={`p-5 rounded-2xl border transition-all ${
                                      !isGraded
                                        ? "bg-gray-50/50 border-gray-200 text-gray-500"
                                        : isCorrect
                                          ? "bg-green-50/30 border-green-200"
                                          : "bg-red-50/30 border-red-200 shadow-sm"
                                    }`}
                                  >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          className={`font-bold ${
                                            !isGraded
                                              ? "bg-gray-400 text-white hover:bg-gray-400"
                                              : isCorrect
                                                ? "bg-green-500 text-white hover:bg-green-500"
                                                : "bg-red-500 text-white hover:bg-red-500"
                                          }`}
                                        >
                                          {index + 1}
                                        </Badge>
                                        <p className="font-bold text-lg text-gray-800">
                                          {renderRichText(q.text)}
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {isGraded && !isCorrect && (
                                          <Badge
                                            variant="destructive"
                                            className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold text-xs uppercase px-2.5 py-0.5"
                                          >
                                            Chyba
                                          </Badge>
                                        )}
                                        <Badge
                                          variant="outline"
                                          className={`font-bold border px-3 py-1 ${
                                            !isGraded
                                              ? "bg-gray-100/50 text-gray-600 border-gray-300 hover:bg-gray-100/50"
                                              : isCorrect
                                                ? "bg-green-100/50 text-green-800 border-green-300 hover:bg-green-100/50"
                                                : "bg-red-100/50 text-red-800 border-red-300 hover:bg-red-100/50"
                                          }`}
                                        >
                                          {isGraded
                                            ? `Body: ${score} / ${maxPoints} b`
                                            : `Max. bodů: ${maxPoints} b`}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* Odpověď */}
                                    {q.type !== "drawing" &&
                                      q.type !== "graph" &&
                                      q.type !== "axis" &&
                                      q.type !== "number_line" &&
                                      q.type !== "matching" &&
                                      q.type !== "cloze" && (
                                        <div className="bg-white/80 p-3.5 rounded-xl border border-gray-100 space-y-1">
                                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Moje odpověď:
                                          </span>
                                          <div>
                                            {answer === undefined ||
                                            answer === null ||
                                            answer === "" ? (
                                              <span className="italic text-gray-400">
                                                Neodpovězeno
                                              </span>
                                            ) : q.type === "multiple_choice" ? (
                                              <span className="font-semibold text-gray-800">
                                                {String.fromCharCode(
                                                  65 + Number(answer),
                                                )}
                                                . {q.options?.[Number(answer)]}
                                              </span>
                                            ) : q.type === "true_false" ? (
                                              <span className="font-semibold text-gray-800">
                                                {answer ? "✓ Ano" : "✗ Ne"}
                                              </span>
                                            ) : (
                                              <span className="font-semibold text-gray-800 whitespace-pre-wrap">
                                                {String(answer)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    {/* Cloze results renderer */}
                                    {q.type === "cloze" && (
                                      <div className="bg-white/80 p-3.5 rounded-xl border border-gray-100 space-y-1 text-left">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                          Moje odpověď:
                                        </span>
                                        <div>
                                          {answer === undefined ||
                                          answer === null ||
                                          Object.keys(answer).length === 0 ? (
                                            <span className="italic text-gray-400">
                                              Neodpovězeno
                                            </span>
                                          ) : (
                                            <div className="leading-relaxed text-slate-800 font-medium text-sm text-left mt-1">
                                              {(() => {
                                                const parts = parseClozeText(
                                                  q.clozeText || q.text || "",
                                                );
                                                const given =
                                                  answer &&
                                                  typeof answer === "object"
                                                    ? answer
                                                    : {};
                                                return parts.map(
                                                  (part, idx) => {
                                                    if (part.type === "text") {
                                                      return (
                                                        <span key={idx}>
                                                          {part.text}
                                                        </span>
                                                      );
                                                    } else {
                                                      const studentVal = String(
                                                        given[part.index!] ||
                                                          "",
                                                      ).trim();
                                                      const correctVal = String(
                                                        part.correctAnswer ||
                                                          "",
                                                      ).trim();
                                                      const isPartCorrect =
                                                        studentVal.toLowerCase() ===
                                                        correctVal.toLowerCase();

                                                      if (!studentVal) {
                                                        return (
                                                          <span
                                                            key={idx}
                                                            className="mx-1 px-1.5 py-0.5 rounded bg-yellow-50 border border-yellow-300 text-yellow-700 text-xs font-bold"
                                                          >
                                                            [chybí, správně:{" "}
                                                            {correctVal}]
                                                          </span>
                                                        );
                                                      }

                                                      if (isPartCorrect) {
                                                        return (
                                                          <span
                                                            key={idx}
                                                            className="mx-1 px-1.5 py-0.5 rounded bg-green-50 border border-green-300 text-green-700 text-xs font-bold"
                                                          >
                                                            {studentVal} ✓
                                                          </span>
                                                        );
                                                      } else {
                                                        return (
                                                          <span
                                                            key={idx}
                                                            className="mx-1 px-1.5 py-0.5 rounded bg-red-50 border border-red-300 text-red-700 text-xs font-bold inline-flex items-center gap-1"
                                                          >
                                                            <span className="line-through opacity-70">
                                                              {studentVal}
                                                            </span>
                                                            <span className="text-green-700 font-bold ml-1">
                                                              ({correctVal})
                                                            </span>{" "}
                                                            ✗
                                                          </span>
                                                        );
                                                      }
                                                    }
                                                  },
                                                );
                                              })()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Grafické vyhodnocení pro typ graph */}
                                    {q.type === "graph" && (
                                      <div className="mt-2">
                                        {isGraded ? (
                                          <GraphQuestionEvaluation
                                            question={q}
                                            studentAnswer={answer}
                                            score={score}
                                            maxPoints={maxPoints}
                                          />
                                        ) : (
                                          <GraphQuestionStudent
                                            question={q}
                                            disabled={true}
                                            value={answer}
                                            onChange={() => {}}
                                          />
                                        )}
                                      </div>
                                    )}

                                    {/* Osa X/Y vyhodnocení */}
                                    {q.type === "axis" && (
                                      <div className="mt-2">
                                        {isGraded ? (
                                          <AxisQuestionEvaluation
                                            question={q}
                                            studentAnswer={answer}
                                            score={score}
                                            maxPoints={maxPoints}
                                          />
                                        ) : (
                                          <AxisQuestionStudent
                                            question={q}
                                            disabled={true}
                                            value={answer}
                                            onChange={() => {}}
                                          />
                                        )}
                                      </div>
                                    )}
                                    {q.type === "number_line" && (
                                      <div className="mt-2">
                                        {isGraded ? (
                                          <NumberLineQuestionEvaluation
                                            question={q}
                                            studentAnswer={answer}
                                            score={score}
                                            maxPoints={maxPoints}
                                          />
                                        ) : (
                                          <NumberLineQuestionStudent
                                            question={q}
                                            disabled={true}
                                            value={answer}
                                            onChange={() => {}}
                                          />
                                        )}
                                      </div>
                                    )}

                                    {/* Kresba k otázce */}
                                    {drawing && (
                                      <div className="mt-3 bg-white p-3 rounded-xl border">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                                          Moje přiložená kresba:
                                        </span>
                                        <img
                                          src={drawing}
                                          className="border rounded-lg max-w-full max-h-60 object-contain bg-white"
                                          alt="Kresba k otázce"
                                        />
                                      </div>
                                    )}

                                    {q.type === "matching" && (
                                      <div className="mt-2">
                                        {isGraded ? (
                                          <MatchingQuestionReview
                                            question={q}
                                            studentAnswer={answer}
                                          />
                                        ) : (
                                          <MatchingQuestionStudent
                                            question={q}
                                            disabled={true}
                                            value={answer}
                                            onChange={() => {}}
                                          />
                                        )}
                                      </div>
                                    )}

                                    {/* AI Vysvětlení */}
                                    {submission.questionFeedback &&
                                      (submission.questionFeedback instanceof
                                      Map
                                        ? submission.questionFeedback.get(q.id)
                                        : (
                                            submission.questionFeedback as Record<
                                              string,
                                              string
                                            >
                                          )[q.id]) && (
                                        <div className="mt-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1 text-left animate-fade-in">
                                          <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                                            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                                            Vysvětlení AI
                                          </div>
                                          <p className="text-sm font-medium text-indigo-900 leading-relaxed">
                                            {submission.questionFeedback instanceof
                                            Map
                                              ? submission.questionFeedback.get(
                                                  q.id,
                                                )
                                              : (
                                                  submission.questionFeedback as Record<
                                                    string,
                                                    string
                                                  >
                                                )[q.id]}
                                          </p>
                                        </div>
                                      )}

                                    {/* Trénink chyb v procvičování */}
                                    {a.isPractice &&
                                      isGraded &&
                                      !isCorrect &&
                                      q.numPracticeQuestions !== undefined &&
                                      q.numPracticeQuestions > 0 && (
                                        <MistakeTrainingWidget
                                          q={q}
                                          index={index}
                                          practiceLoading={practiceLoading}
                                          practiceErrors={practiceErrors}
                                          practiceAiContent={practiceAiContent}
                                          practiceAnswers={practiceAnswers}
                                          practiceChecked={practiceChecked}
                                          setPracticeAnswers={
                                            setPracticeAnswers
                                          }
                                          setPracticeChecked={
                                            setPracticeChecked
                                          }
                                          handleLoadAiPractice={
                                            handleLoadAiPractice
                                          }
                                          assignmentId={a.id}
                                        />
                                      )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Hlavní odevzdaný dokument */}
                        {submission.mainWorkDrawing && (
                          <div className="space-y-3">
                            <h3 className="font-headline text-xl font-bold text-primary border-b pb-2">
                              Vypracovaný dokument
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-2xl border">
                              <img
                                src={submission.mainWorkDrawing}
                                className="w-full border rounded-xl bg-white shadow-sm"
                                alt="Vypracovaný dokument"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {hasEnded && (
                          <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl flex items-start gap-3 shadow-sm animate-pulse">
                            <span className="text-2xl">⚠️</span>
                            <div>
                              <h4 className="font-bold text-amber-800 text-lg">
                                Vypršel časový limit
                              </h4>
                              <p className="text-sm text-amber-600 font-medium">
                                Tento úkol měl termín odevzdání do{" "}
                                {formatDateTime(a.endTime)}. Nyní si ho můžete
                                pouze prohlédnout, ale již nelze odevzdat žádné
                                odpovědi.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Popis úkolu */}
                        {a.description && (
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-muted-foreground whitespace-pre-wrap">
                              {a.description}
                            </p>
                          </div>
                        )}

                        {/* Otázky */}
                        {a.questions && a.questions.length > 0 && (
                          <div className="space-y-6">
                            <h3 className="font-headline text-xl font-bold text-primary">
                              Otázky ({a.questions.length})
                            </h3>
                            {a.questions.map((q, index) => (
                              <div
                                key={q.id}
                                className="p-5 bg-gray-50 rounded-xl border space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="bg-primary/10 text-primary font-bold"
                                    >
                                      {index + 1}
                                    </Badge>
                                    <p className="font-semibold text-lg">
                                      {renderRichText(q.text)}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] uppercase"
                                  >
                                    {q.type === "short_answer"
                                      ? "Krátká odpověď"
                                      : q.type === "long_answer"
                                        ? "Dlouhá odpověď"
                                        : q.type === "multiple_choice"
                                          ? "Výběr z možností"
                                          : q.type === "axis"
                                            ? "Osa X/Y"
                                            : q.type === "number_line"
                                              ? "Číselná osa"
                                              : q.type === "true_false"
                                                ? "Ano / Ne"
                                                : q.type === "matching"
                                                  ? "Přiřazování"
                                                  : q.type === "drawing"
                                                    ? "Kresba"
                                                    : q.type === "cloze"
                                                      ? "Doplňovačka"
                                                      : q.type}
                                  </Badge>
                                </div>

                                {/* Textový vstup pro všechny typy kromě drawing */}
                                {q.type === "short_answer" && (
                                  <Input
                                    placeholder="Vaše odpověď..."
                                    value={studentAnswers[q.id] || ""}
                                    onChange={(e) =>
                                      setStudentAnswers((prev) => ({
                                        ...prev,
                                        [q.id]: e.target.value,
                                      }))
                                    }
                                    disabled={hasEnded}
                                  />
                                )}

                                {q.type === "long_answer" && (
                                  <Textarea
                                    placeholder="Vaše odpověď..."
                                    className="min-h-[100px]"
                                    value={studentAnswers[q.id] || ""}
                                    onChange={(e) =>
                                      setStudentAnswers((prev) => ({
                                        ...prev,
                                        [q.id]: e.target.value,
                                      }))
                                    }
                                    disabled={hasEnded}
                                  />
                                )}

                                {q.type === "multiple_choice" && q.options && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {q.options.map((opt, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        disabled={hasEnded}
                                        className={`p-3 rounded-lg border text-left transition-all ${
                                          studentAnswers[q.id] === i
                                            ? "bg-primary text-white border-primary shadow-md"
                                            : "bg-white hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
                                        }`}
                                        onClick={() =>
                                          !hasEnded &&
                                          setStudentAnswers((prev) => ({
                                            ...prev,
                                            [q.id]: i,
                                          }))
                                        }
                                      >
                                        <span className="font-bold mr-2">
                                          {String.fromCharCode(65 + i)}.
                                        </span>
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Osa X/Y solver */}
                                {q.type === "axis" && (
                                  <AxisQuestionStudent
                                    question={q}
                                    disabled={hasEnded}
                                    value={studentAnswers[q.id]}
                                    onChange={(val) =>
                                      setStudentAnswers((prev) => ({
                                        ...prev,
                                        [q.id]: val,
                                      }))
                                    }
                                  />
                                )}
                                {/* Číselná osa solver */}
                                {q.type === "number_line" && (
                                  <NumberLineQuestionStudent
                                    question={q}
                                    disabled={hasEnded}
                                    value={studentAnswers[q.id]}
                                    onChange={(val) =>
                                      setStudentAnswers((prev) => ({
                                        ...prev,
                                        [q.id]: val,
                                      }))
                                    }
                                  />
                                )}

                                {/* Přiřazování solver */}
                                {q.type === "matching" && (
                                  <MatchingQuestionStudent
                                    question={q}
                                    disabled={hasEnded}
                                    value={studentAnswers[q.id]}
                                    onChange={(val) =>
                                      setStudentAnswers((prev) => ({
                                        ...prev,
                                        [q.id]: val,
                                      }))
                                    }
                                  />
                                )}

                                {q.type === "true_false" && (
                                  <div className="flex gap-3">
                                    <button
                                      type="button"
                                      disabled={hasEnded}
                                      className={`flex-1 p-3 rounded-lg border text-center font-bold transition-all ${
                                        studentAnswers[q.id] === true
                                          ? "bg-green-500 text-white border-green-500"
                                          : "bg-white hover:bg-green-50 disabled:opacity-50 disabled:hover:bg-white"
                                      }`}
                                      onClick={() =>
                                        !hasEnded &&
                                        setStudentAnswers((prev) => ({
                                          ...prev,
                                          [q.id]: true,
                                        }))
                                      }
                                    >
                                      ✓ Ano
                                    </button>
                                    <button
                                      type="button"
                                      disabled={hasEnded}
                                      className={`flex-1 p-3 rounded-lg border text-center font-bold transition-all ${
                                        studentAnswers[q.id] === false
                                          ? "bg-red-500 text-white border-red-500"
                                          : "bg-white hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-white"
                                      }`}
                                      onClick={() =>
                                        !hasEnded &&
                                        setStudentAnswers((prev) => ({
                                          ...prev,
                                          [q.id]: false,
                                        }))
                                      }
                                    >
                                      ✗ Ne
                                    </button>
                                  </div>
                                )}

                                {/* Kresba pro typ drawing — vždy otevřená */}
                                {q.type === "drawing" && (
                                  <DrawingPad
                                    compact
                                    disabled={hasEnded}
                                    onSave={(data) =>
                                      setQuestionDrawings((prev) => ({
                                        ...prev,
                                        [q.id]: data,
                                      }))
                                    }
                                  />
                                )}

                                {/* Grafická otázka student solver */}
                                {q.type === "graph" && (
                                  <GraphQuestionStudent
                                    question={q}
                                    disabled={hasEnded}
                                    value={studentAnswers[q.id]}
                                    onChange={(val) =>
                                      setStudentAnswers((prev) => ({
                                        ...prev,
                                        [q.id]: val,
                                      }))
                                    }
                                  />
                                )}

                                {/* Cloze solver */}
                                {q.type === "cloze" && (
                                  <div className="p-4 bg-white rounded-xl border border-slate-150 leading-relaxed text-slate-800 font-medium text-base select-none">
                                    {(() => {
                                      const parts = parseClozeText(
                                        q.clozeText || q.text || "",
                                      );
                                      const currentAns =
                                        studentAnswers[q.id] || {};
                                      return parts.map((part, i) => {
                                        if (part.type === "text") {
                                          return (
                                            <span
                                              key={i}
                                              className="whitespace-pre-wrap"
                                            >
                                              {part.text}
                                            </span>
                                          );
                                        } else if (part.type === "dropdown") {
                                          const currentVal =
                                            currentAns[part.index!] ?? "";
                                          const sortedOptions = [
                                            ...(part.options || []),
                                          ].sort((a, b) => a.localeCompare(b));
                                          return (
                                            <select
                                              key={i}
                                              value={currentVal}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setStudentAnswers((prev) => ({
                                                  ...prev,
                                                  [q.id]: {
                                                    ...(prev[q.id] || {}),
                                                    [part.index!]: val,
                                                  },
                                                }));
                                              }}
                                              disabled={hasEnded}
                                              className="mx-1 h-8 rounded-lg border border-slate-350 bg-white px-2 text-sm font-bold text-indigo-750 focus:outline-none focus:ring-2 focus:ring-primary inline-block align-middle"
                                            >
                                              <option value="">—</option>
                                              {sortedOptions.map(
                                                (opt, optIdx) => (
                                                  <option
                                                    key={optIdx}
                                                    value={opt}
                                                  >
                                                    {opt}
                                                  </option>
                                                ),
                                              )}
                                            </select>
                                          );
                                        } else {
                                          const currentVal =
                                            currentAns[part.index!] ?? "";
                                          return (
                                            <input
                                              key={i}
                                              type="text"
                                              value={currentVal}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setStudentAnswers((prev) => ({
                                                  ...prev,
                                                  [q.id]: {
                                                    ...(prev[q.id] || {}),
                                                    [part.index!]: val,
                                                  },
                                                }));
                                              }}
                                              disabled={hasEnded}
                                              style={{
                                                width: `${Math.max(4, (part.correctAnswer || "").length + 2)}ch`,
                                              }}
                                              className="mx-1 h-8 rounded-lg border border-slate-350 bg-white px-2 text-sm font-bold text-indigo-750 focus:outline-none focus:ring-2 focus:ring-primary inline-block align-middle text-center"
                                            />
                                          );
                                        }
                                      });
                                    })()}
                                  </div>
                                )}

                                {/* Toggle: Dokreslit perem (pro všechny typy kromě drawing a graph) */}
                                {q.type !== "drawing" &&
                                  q.type !== "graph" &&
                                  !hasEnded && (
                                    <div className="pt-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setQuestionDrawingOpen((prev) => ({
                                            ...prev,
                                            [q.id]: !prev[q.id],
                                          }))
                                        }
                                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                                          questionDrawingOpen[q.id]
                                            ? "bg-primary/10 text-primary border-primary/30"
                                            : "text-muted-foreground hover:text-primary hover:border-primary/20 border-transparent"
                                        }`}
                                      >
                                        <PenTool className="w-3 h-3" />
                                        {questionDrawingOpen[q.id]
                                          ? "Skrýt kreslicí plochu"
                                          : "✏️ Dokreslit perem"}
                                        {questionDrawings[q.id] &&
                                          !questionDrawingOpen[q.id] && (
                                            <span
                                              className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block"
                                              title="Kresba přiložena"
                                            />
                                          )}
                                      </button>
                                      {questionDrawingOpen[q.id] && (
                                        <div className="mt-2 animate-fade-in">
                                          <DrawingPad
                                            compact
                                            onSave={(data) =>
                                              setQuestionDrawings((prev) => ({
                                                ...prev,
                                                [q.id]: data,
                                              }))
                                            }
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Podklad / kresba na hlavním dokumentu */}
                        {a.fileUri ? (
                          <div className="space-y-2">
                            <h3 className="font-headline text-xl font-bold text-primary">
                              Pracovní dokument
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Piš perem přímo do dokumentu nebo ho nech prázdný.
                            </p>
                            <DrawingPad
                              backgroundImage={a.fileUri}
                              disabled={hasEnded}
                              onSave={setMainWorkDrawing}
                            />
                          </div>
                        ) : null}

                        {!hasEnded &&
                          (a.isPractice ? (
                            <Button
                              className="w-full h-14 text-xl shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 rounded-2xl font-bold"
                              onClick={() => handlePracticeSubmit(a)}
                              disabled={isEvaluatingPractice}
                            >
                              {isEvaluatingPractice ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  <span>AI vyhodnocuje tvé odpovědi...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-5 h-5" />
                                  <span>Odevzdat a vyhodnotit AI</span>
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              className="w-full h-14 text-xl shadow-lg"
                              onClick={() => {
                                store.submitWork({ assignmentId: selectedAssignmentId, studentId: currentUser.id, answers: studentAnswers, questionDrawings, mainWorkDrawing, tabFocusLostCount,
                                });
                              }}
                            >
                              Odevzdat v cloudu
                            </Button>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        ) : selectedSubject ? (
          <div className="space-y-8 animate-fade-in">
            {/* Back button & Title */}
            <div className="flex flex-col gap-4">
              <Button
                variant="ghost"
                className="self-start rounded-full"
                onClick={() => setSelectedSubject(null)}
              >
                ← Zpět na předměty
              </Button>
              <div className="flex items-center gap-3 bg-primary/5 p-6 rounded-3xl border border-primary/20">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Předmět
                  </span>
                  <h1 className="text-3xl font-headline font-black text-primary">
                    {selectedSubject}
                  </h1>
                </div>
              </div>
            </div>

            {/* Rozdělení rozhraní na Známkované testy a Neznámkované procvičování (Svisle) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
              {/* LEVÝ SLOUPEC: TESTY (ZNÁMKOVANÉ) */}
              <div className="space-y-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100/80 shadow-xs">
                <div className="border-b pb-4 flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-headline font-bold text-primary">
                      Známkované testy
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Testy vyhodnocované a známkované učitelem.
                    </p>
                  </div>
                </div>

                {/* K vypracování (To Do) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5 px-1">
                    ⏳ K vypracování
                  </h3>
                  {(() => {
                    const pendingTests = studentAssignments.filter(
                      (a) =>
                        (a.subject === selectedSubject ||
                          (selectedSubject === "Jiný" && !a.subject)) &&
                        !a.isPractice &&
                        !store.submissions.some(
                          (s) =>
                            s.assignmentId === a.id &&
                            s.studentId === currentUser.id &&
                            s.submittedAt,
                        ),
                    );

                    if (pendingTests.length === 0) {
                      return (
                        <Card className="border-none shadow-sm bg-white p-6 text-center space-y-2">
                          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                          <h4 className="text-sm font-bold text-gray-800">
                            Vše hotovo!
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Nemáš žádné testy k vypracování.
                          </p>
                        </Card>
                      );
                    }

                    return (
                      <div className="grid gap-3">
                        {pendingTests.map((a) => {
                          const now = new Date();
                          const formatter = new Intl.DateTimeFormat("en-US", {
                            timeZone: "Europe/Prague",
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          });
                          const parts = formatter.formatToParts(now);
                          const getVal = (type: string) =>
                            parts.find((p) => p.type === type)?.value || "";
                          let hourVal = getVal("hour");
                          if (hourVal === "24") hourVal = "00";
                          const nowStr = `${getVal("year")}-${getVal("month")}-${getVal("day")}T${hourVal}:${getVal("minute")}`;
                          const hasStarted =
                            !a.startTime || nowStr >= a.startTime;
                          const hasEnded = a.endTime && nowStr > a.endTime;

                          return (
                            <Card
                              key={a.id}
                              className={`transition-all border-none bg-white shadow-xs overflow-hidden ${
                                !hasStarted
                                  ? "opacity-60 cursor-not-allowed select-none"
                                  : "cursor-pointer hover:shadow-md hover:border-primary"
                              }`}
                              onClick={() => {
                                if (hasStarted) {
                                  selectStudentAssignment(a.id);
                                }
                              }}
                            >
                              <div
                                className={`h-1 w-full ${!hasStarted ? "bg-gray-300" : hasEnded ? "bg-amber-500" : "bg-accent/30"}`}
                              />
                              <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-base text-gray-800">
                                      {a.title}
                                    </p>
                                    {!hasStarted && (
                                      <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                                        🔒 Neaktivní
                                      </span>
                                    )}
                                    {hasEnded && (
                                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                                        ⌛ Vypršel čas
                                      </span>
                                    )}
                                  </div>
                                  {a.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                      {a.description}
                                    </p>
                                  )}
                                  <div className="mt-1.5 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                                    {a.startTime && (
                                      <span>
                                        Od: {formatDateTime(a.startTime)}
                                      </span>
                                    )}
                                    {a.endTime && (
                                      <span
                                        className={
                                          hasEnded
                                            ? "text-amber-600 font-bold"
                                            : ""
                                        }
                                      >
                                        Do: {formatDateTime(a.endTime)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Vypracované testy */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5 px-1">
                    ✓ Vypracované testy
                  </h3>
                  {(() => {
                    const completedTests = studentAssignments.filter(
                      (a) =>
                        (a.subject === selectedSubject ||
                          (selectedSubject === "Jiný" && !a.subject)) &&
                        !a.isPractice &&
                        store.submissions.some(
                          (s) =>
                            s.assignmentId === a.id &&
                            s.studentId === currentUser.id &&
                            s.submittedAt,
                        ),
                    );

                    if (completedTests.length === 0) {
                      return (
                        <Card className="border-none shadow-xs bg-white p-6 text-center">
                          <p className="text-xs text-muted-foreground">
                            Zatím žádné odevzdané testy.
                          </p>
                        </Card>
                      );
                    }

                    return (
                      <div className="grid gap-3">
                        {completedTests.map((a) => {
                          const sub = store.submissions.find(
                            (s) =>
                              s.assignmentId === a.id &&
                              s.studentId === currentUser.id,
                          )!;
                          const totalMax =
                            a.questions?.reduce(
                              (acc, q) => acc + (q.points || 1),
                              0,
                            ) || 0;
                          let earned = 0;
                          if (sub.questionScores) {
                            if (sub.questionScores instanceof Map) {
                              sub.questionScores.forEach((val) => {
                                earned += val;
                              });
                            } else {
                              Object.values(sub.questionScores).forEach(
                                (val) => {
                                  earned += val as number;
                                },
                              );
                            }
                          }
                          const badgeText = sub.grade
                            ? `Známka: ${sub.grade} (${earned}/${totalMax} b)`
                            : "Odevzdáno (Neopraveno)";

                          return (
                            <Card
                              key={a.id}
                              className="cursor-pointer hover:shadow-md transition-all border-none bg-white shadow-xs overflow-hidden"
                              onClick={() => selectStudentAssignment(a.id)}
                            >
                              <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                  <p className="font-bold text-base text-gray-800">
                                    {a.title}
                                  </p>
                                  <div className="mt-1">
                                    <Badge
                                      variant={
                                        sub.grade ? "default" : "secondary"
                                      }
                                      className="text-[10px]"
                                    >
                                      {badgeText}
                                    </Badge>
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* PRAVÝ SLOUPEC: PROCVIČOVÁNÍ (NEZNÁMKOVANÉ) */}
              <div className="space-y-6 bg-indigo-50/20 p-6 rounded-3xl border border-indigo-100/50 shadow-xs">
                <div className="border-b pb-4 flex items-center gap-3">
                  <div className="bg-indigo-600/10 p-2.5 rounded-2xl text-indigo-700">
                    <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-headline font-bold text-indigo-900">
                      Neznámkované procvičování
                    </h2>
                    <p className="text-xs text-indigo-600/80">
                      Cvičení s okamžitým vyhodnocením a vysvětlením od AI.
                    </p>
                  </div>
                </div>

                {/* K vypracování (To Do) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-700/70 flex items-center gap-1.5 px-1">
                    ⏳ K vypracování
                  </h3>
                  {(() => {
                    const pendingPractice = studentAssignments.filter(
                      (a) =>
                        (a.subject === selectedSubject ||
                          (selectedSubject === "Jiný" && !a.subject)) &&
                        a.isPractice &&
                        !store.submissions.some(
                          (s) =>
                            s.assignmentId === a.id &&
                            s.studentId === currentUser.id &&
                            s.submittedAt,
                        ),
                    );

                    if (pendingPractice.length === 0) {
                      return (
                        <Card className="border-none shadow-sm bg-white p-6 text-center space-y-2">
                          <CheckCircle2 className="w-10 h-10 text-indigo-500 mx-auto" />
                          <h4 className="text-sm font-bold text-gray-800">
                            Hotovo!
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Všechna cvičení máš vypracovaná.
                          </p>
                        </Card>
                      );
                    }

                    return (
                      <div className="grid gap-3">
                        {pendingPractice.map((a) => {
                          const now = new Date();
                          const formatter = new Intl.DateTimeFormat("en-US", {
                            timeZone: "Europe/Prague",
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          });
                          const parts = formatter.formatToParts(now);
                          const getVal = (type: string) =>
                            parts.find((p) => p.type === type)?.value || "";
                          let hourVal = getVal("hour");
                          if (hourVal === "24") hourVal = "00";
                          const nowStr = `${getVal("year")}-${getVal("month")}-${getVal("day")}T${hourVal}:${getVal("minute")}`;
                          const hasStarted =
                            !a.startTime || nowStr >= a.startTime;
                          const hasEnded = a.endTime && nowStr > a.endTime;

                          return (
                            <Card
                              key={a.id}
                              className={`transition-all border-none bg-white shadow-xs overflow-hidden ${
                                !hasStarted
                                  ? "opacity-60 cursor-not-allowed select-none"
                                  : "cursor-pointer hover:shadow-md hover:border-indigo-450"
                              }`}
                              onClick={() => {
                                if (hasStarted) {
                                  selectStudentAssignment(a.id);
                                }
                              }}
                            >
                              <div
                                className={`h-1 w-full ${!hasStarted ? "bg-gray-300" : hasEnded ? "bg-amber-500" : "bg-indigo-400/40"}`}
                              />
                              <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-base text-gray-800">
                                      {a.title}
                                    </p>
                                    {!hasStarted && (
                                      <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                                        🔒 Neaktivní
                                      </span>
                                    )}
                                    {hasEnded && (
                                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                                        ⌛ Vypršel čas
                                      </span>
                                    )}
                                  </div>
                                  {a.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                      {a.description}
                                    </p>
                                  )}
                                  <div className="mt-1.5 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                                    {a.startTime && (
                                      <span>
                                        Od: {formatDateTime(a.startTime)}
                                      </span>
                                    )}
                                    {a.endTime && (
                                      <span
                                        className={
                                          hasEnded
                                            ? "text-amber-600 font-bold"
                                            : ""
                                        }
                                      >
                                        Do: {formatDateTime(a.endTime)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Vyhodnocená cvičení */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-700/70 flex items-center gap-1.5 px-1">
                    ✓ Vyhodnocená cvičení
                  </h3>
                  {(() => {
                    const completedPractice = studentAssignments.filter(
                      (a) =>
                        (a.subject === selectedSubject ||
                          (selectedSubject === "Jiný" && !a.subject)) &&
                        a.isPractice &&
                        store.submissions.some(
                          (s) =>
                            s.assignmentId === a.id &&
                            s.studentId === currentUser.id &&
                            s.submittedAt,
                        ),
                    );

                    if (completedPractice.length === 0) {
                      return (
                        <Card className="border-none shadow-xs bg-white p-6 text-center">
                          <p className="text-xs text-muted-foreground">
                            Zatím žádné odevzdané procvičování.
                          </p>
                        </Card>
                      );
                    }

                    return (
                      <div className="grid gap-3">
                        {completedPractice.map((a) => {
                          const sub = store.submissions.find(
                            (s) =>
                              s.assignmentId === a.id &&
                              s.studentId === currentUser.id,
                          )!;
                          const totalMax =
                            a.questions?.reduce(
                              (acc, q) => acc + (q.points || 1),
                              0,
                            ) || 0;
                          let earned = 0;
                          if (sub.questionScores) {
                            if (sub.questionScores instanceof Map) {
                              sub.questionScores.forEach((val) => {
                                earned += val;
                              });
                            } else {
                              Object.values(sub.questionScores).forEach(
                                (val) => {
                                  earned += val as number;
                                },
                              );
                            }
                          }
                          const badgeText = `Procvičování (${earned}/${totalMax} b)`;

                          return (
                            <Card
                              key={a.id}
                              className="cursor-pointer hover:shadow-md transition-all border-none bg-white shadow-xs overflow-hidden"
                              onClick={() => selectStudentAssignment(a.id)}
                            >
                              <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                  <p className="font-bold text-base text-gray-800">
                                    {a.title}
                                  </p>
                                  <div className="mt-1">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] bg-indigo-50/50 text-indigo-750 border-indigo-200"
                                    >
                                      {badgeText}
                                    </Badge>
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in">
            {/* Moje Žákovská knížka premium card */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm">
              <div>
                <h3 className="text-xl font-headline font-bold text-primary flex items-center gap-2">
                  📖 Moje Žákovská knížka
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Podívej se na své známky a hodnocení ze všech testů.
                </p>
              </div>
              <Button
                className="w-full md:w-auto rounded-xl px-6 h-12 text-sm font-headline font-bold shadow-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center justify-center gap-2"
                onClick={() => {
                  setSelectedGradebookStudent(currentUser);
                  setSelectedGradebookSubject("Matematika");
                  setGradebookViewMode("child");
                }}
              >
                <BookOpen className="w-4 h-4" /> Zobrazit známky
              </Button>
            </div>

            {/* Sekce 1: Předměty */}
            <div className="space-y-6">
              <h2 className="text-3xl font-headline font-bold text-primary flex items-center gap-2 border-b pb-3">
                <BookOpen className="w-8 h-8 text-accent" /> Moje předměty
              </h2>
              {(() => {
                const predefinedSubjects = [
                  "Matematika",
                  "Český jazyk",
                  "Anglický jazyk",
                  "Fyzika",
                  "Chemie",
                  "Dějepis",
                  "Zeměpis",
                  "Přírodopis",
                  "Informatika",
                  "Jiný",
                ];

                return (
                  <div className="space-y-4 animate-fade-in">
                    {predefinedSubjects.map((subjectName) => {
                      return (
                        <button
                          key={subjectName}
                          type="button"
                          onClick={() => setSelectedSubject(subjectName)}
                          className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50/80 active:bg-gray-100 border border-gray-200/80 rounded-2xl shadow-sm transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <span className="font-headline text-xl text-primary font-bold">
                              {subjectName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {(() => {
                              const pendingCount = studentAssignments.filter(
                                (a) =>
                                  (a.subject === subjectName ||
                                    (subjectName === "Jiný" && !a.subject)) &&
                                  !store.submissions.some(
                                    (s) =>
                                      s.assignmentId === a.id &&
                                      s.studentId === currentUser.id,
                                  ),
                              ).length;

                              const completedCount = studentAssignments.filter(
                                (a) =>
                                  (a.subject === subjectName ||
                                    (subjectName === "Jiný" && !a.subject)) &&
                                  store.submissions.some(
                                    (s) =>
                                      s.assignmentId === a.id &&
                                      s.studentId === currentUser.id,
                                  ),
                              ).length;

                              if (pendingCount > 0) {
                                return (
                                  <Badge className="bg-accent text-white font-semibold text-xs px-2.5 py-0.5 animate-pulse">
                                    {pendingCount} k vypracování
                                  </Badge>
                                );
                              } else if (completedCount > 0) {
                                return (
                                  <Badge
                                    variant="secondary"
                                    className="font-semibold text-xs px-2.5 py-0.5"
                                  >
                                    {completedCount} dokončeno
                                  </Badge>
                                );
                              } else {
                                return (
                                  <Badge
                                    variant="outline"
                                    className="text-muted-foreground font-semibold text-xs px-2.5 py-0.5 border-gray-200"
                                  >
                                    Bez úkolů
                                  </Badge>
                                );
                              }
                            })()}
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        {renderGradebookDialog()}
      </main>
    </div>
  );
}

