"use client";

import { useState, useEffect, useRef } from 'react';
import { useITestStore } from '@/hooks/use-itest-store';
import { Navbar } from '@/components/itest/Navbar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Users, ClipboardList, CheckCircle2, ChevronRight, GraduationCap, School, Loader2, BookOpen, PenTool, Trash2, Upload, LayoutDashboard, Activity, ChevronUp, ChevronDown, Edit3, UserPlus, Crown, Check, Sparkles, Download, Printer, Zap, Settings, MessageSquare, Search, Key, Shield, ShieldAlert, Send, History, Bookmark, Volume2, ArrowLeft } from 'lucide-react';
import { AddTeacherDialog } from '@/components/dashboard/AddTeacherDialog';
import { AssignmentCreator } from '@/components/itest/AssignmentCreator';
import { DrawingPad } from '@/components/itest/DrawingPad';
import { GradePicker } from '@/components/itest/GradePicker';
import { GraphQuestionStudent, GraphQuestionEvaluation, AxisQuestionStudent, AxisQuestionEvaluation, NumberLineQuestionStudent, NumberLineQuestionEvaluation } from '@/components/itest/GraphQuestion';
import { MatchingQuestionStudent, MatchingQuestionReview } from '@/components/itest/MatchingQuestion';
import { renderRichText, parseClozeText } from '@/lib/utils';
import { Assignment, User, Submission, Question } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LiveMonitor } from '@/components/itest/LiveMonitor';
import { TeacherHub } from '@/components/dashboard/TeacherHub';
import { AiPedagogDashboard } from '@/components/dashboard/AiPedagogDashboard';

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage.getItem failed", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage.setItem failed", e);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("localStorage.removeItem failed", e);
    }
  }
};


interface MistakeTrainingWidgetProps {
  q: Question;
  index: number;
  practiceLoading: Record<string, boolean>;
  practiceErrors: Record<string, string>;
  practiceAiContent: Record<string, { theoryExplanation: string; questions: any[] }>;
  practiceAnswers: Record<string, Record<string, any>>;
  practiceChecked: Record<string, Record<string, boolean>>;
  setPracticeAnswers: React.Dispatch<React.SetStateAction<Record<string, Record<string, any>>>>;
  setPracticeChecked: React.Dispatch<React.SetStateAction<Record<string, Record<string, boolean>>>>;
  handleLoadAiPractice: (qId: string, questionText: string, numQuestions: number, assignmentId?: string) => Promise<void>;
  assignmentId?: string;
}

function MistakeTrainingWidget({
  q,
  index,
  practiceLoading,
  practiceErrors,
  practiceAiContent,
  practiceAnswers,
  practiceChecked,
  setPracticeAnswers,
  setPracticeChecked,
  handleLoadAiPractice,
  assignmentId
}: MistakeTrainingWidgetProps) {
  const qId = q.id;
  const numQuestions = q.numPracticeQuestions || 1;
  const useAi = !!q.useAiForPractice;

  useEffect(() => {
    if (useAi && !practiceAiContent[qId] && !practiceLoading[qId] && !practiceErrors[qId]) {
      handleLoadAiPractice(qId, q.text, numQuestions, assignmentId);
    }
  }, [useAi, qId, q.text, numQuestions, practiceAiContent, practiceLoading, practiceErrors, handleLoadAiPractice, assignmentId]);

  const isLoading = practiceLoading[qId];
  const error = practiceErrors[qId];
  const aiData = practiceAiContent[qId];

  const hasAiContent = useAi && aiData?.questions && aiData.questions.length > 0;
  
  const activeQuestions = hasAiContent
    ? aiData.questions
    : (q.practiceQuestions || []).slice(0, numQuestions);

  const answers = practiceAnswers[qId] || {};
  const checked = practiceChecked[qId] || {};

  const handleAnswerChange = (pqId: string, val: any) => {
    setPracticeAnswers(prev => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || {}),
        [pqId]: val
      }
    }));
  };

  const handleCheck = () => {
    setPracticeChecked(prev => ({
      ...prev,
      [qId]: activeQuestions.reduce((acc: Record<string, boolean>, pq: any) => {
        acc[pq.id || pq.text] = true;
        return acc;
      }, {} as Record<string, boolean>)
    }));
  };

  const handleReset = () => {
    setPracticeAnswers(prev => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
    setPracticeChecked(prev => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  if (useAi && isLoading) {
    return (
      <div className="mt-4 p-5 rounded-2xl border border-indigo-100 bg-indigo-50/20 text-indigo-955 space-y-3 animate-pulse">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
          <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Generuji doplňující příklady přes AI...</span>
        </div>
        <div className="h-4 bg-indigo-100/50 rounded w-3/4"></div>
        <div className="h-8 bg-indigo-100/50 rounded w-full"></div>
      </div>
    );
  }

  if (useAi && error && activeQuestions.length === 0) {
    return (
      <div className="mt-4 p-4 rounded-2xl border border-amber-200 bg-amber-50/50 text-amber-900 text-xs">
        <div className="font-bold flex items-center gap-1.5 text-amber-800">
          ⚠️ Nelze načíst tréninkové otázky přes AI
        </div>
        <p className="mt-1 text-slate-500">
          {error === 'AI_OFFLINE' 
            ? 'AI asistent je offline (chybí API klíč Gemini).' 
            : `Chyba: ${error}`}
        </p>
        <p className="mt-1 text-slate-400 font-semibold">Učitel pro tuto otázku nepřipravil žádné náhradní úlohy.</p>
      </div>
    );
  }

  if (activeQuestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-5 rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-purple-50/20 shadow-sm text-left space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
          🏋️ Trénink chyb: Procvičování navíc ({activeQuestions.length}x)
        </span>
      </div>

      {useAi && aiData?.theoryExplanation && (
        <div className="p-3.5 rounded-xl bg-white border border-indigo-100/80 text-xs text-slate-700 leading-relaxed shadow-sm">
          <div className="font-bold text-indigo-700 flex items-center gap-1 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            💡 Vysvětlení teorie a tipy:
          </div>
          <div>{renderRichText(aiData.theoryExplanation)}</div>
        </div>
      )}

      <div className="space-y-4 pt-1">
        {activeQuestions.map((pq: any, idx: number) => {
          const pqId = pq.id || pq.text;
          const studentAns = answers[pqId];
          const isChecked = !!checked[pqId];
          
          let isCorrect = false;
          if (pq.type === 'multiple_choice') {
            isCorrect = studentAns === pq.correctAnswer;
          } else if (pq.type === 'true_false') {
            isCorrect = studentAns === pq.correctAnswer;
          } else {
            const cleanCorrect = String(pq.correctAnswer || '').trim().toLowerCase();
            const cleanStudent = String(studentAns || '').trim().toLowerCase();
            isCorrect = cleanCorrect === cleanStudent;
          }

          return (
            <div key={pqId} className="p-4 bg-white/70 rounded-xl border border-slate-100 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold h-5 mt-0.5">
                    {idx + 1}
                  </Badge>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{renderRichText(pq.text)}</p>
                </div>

                {isChecked && (
                  <Badge className={`text-[9px] font-black uppercase tracking-wider ${
                    isCorrect 
                      ? 'bg-green-600 text-white hover:bg-green-600' 
                      : 'bg-red-600 text-white hover:bg-red-600'
                  }`}>
                    {isCorrect ? '✓ Správně' : '✗ Chyba'}
                  </Badge>
                )}
              </div>

              <div className="pt-1">
                {pq.type === 'multiple_choice' && pq.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pq.options.map((opt: string, oIdx: number) => {
                      const isSelected = studentAns === oIdx;
                      const isOptionCorrect = pq.correctAnswer === oIdx;
                      
                      let btnClass = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700';
                      if (isSelected) {
                        btnClass = 'bg-indigo-600 border-indigo-600 text-white shadow-sm';
                      }
                      if (isChecked) {
                        if (isOptionCorrect) {
                          btnClass = 'bg-green-100 border-green-300 text-green-800 font-bold';
                        } else if (isSelected) {
                          btnClass = 'bg-red-100 border-red-300 text-red-800 line-through';
                        } else {
                          btnClass = 'opacity-50 border-slate-200 bg-white text-slate-500';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={isChecked}
                          onClick={() => handleAnswerChange(pqId, oIdx)}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center ${btnClass}`}
                        >
                          <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {pq.type === 'true_false' && (
                  <div className="flex gap-3 max-w-xs">
                    {[true, false].map((tfVal) => {
                      const isSelected = studentAns === tfVal;
                      const isTfCorrect = pq.correctAnswer === tfVal;

                      let btnClass = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700';
                      if (isSelected) {
                        btnClass = 'bg-indigo-600 border-indigo-600 text-white shadow-sm';
                      }
                      if (isChecked) {
                        if (isTfCorrect) {
                          btnClass = 'bg-green-100 border-green-300 text-green-800 font-bold';
                        } else if (isSelected) {
                          btnClass = 'bg-red-100 border-red-300 text-red-800 line-through';
                        } else {
                          btnClass = 'opacity-50 border-slate-200 bg-white text-slate-500';
                        }
                      }

                      return (
                        <button
                          key={String(tfVal)}
                          type="button"
                          disabled={isChecked}
                          onClick={() => handleAnswerChange(pqId, tfVal)}
                          className={`flex-1 p-2 rounded-lg border text-center text-xs font-bold transition-all ${btnClass}`}
                        >
                          {tfVal ? '✓ Ano' : '✗ Ne'}
                        </button>
                      );
                    })}
                  </div>
                )}

                {pq.type === 'short_answer' && (
                  <div className="space-y-2 max-w-md">
                    <Input
                      placeholder="Napište svoji odpověď..."
                      disabled={isChecked}
                      value={studentAns || ''}
                      onChange={(e) => handleAnswerChange(pqId, e.target.value)}
                      className={`h-9 text-xs rounded-lg ${
                        isChecked 
                          ? (isCorrect ? 'bg-green-50 border-green-300 text-green-950 font-bold' : 'bg-red-50 border-red-300 text-red-955 line-through') 
                          : 'focus-visible:ring-indigo-500 bg-white'
                      }`}
                    />
                    {isChecked && !isCorrect && (
                      <div className="text-[11px] font-bold text-green-700 bg-green-50/60 p-2 rounded-lg border border-green-100">
                        Správná odpověď: {String(pq.correctAnswer)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isChecked && pq.explanation && (
                <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/50 text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-bold text-indigo-700 uppercase tracking-wide block mb-0.5">Postup řešení:</span>
                  {renderRichText(pq.explanation)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2.5 pt-2">
        {Object.keys(checked).length === 0 ? (
          <Button
            onClick={handleCheck}
            className="rounded-xl font-bold px-5 bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm text-xs py-2 h-9 flex items-center"
          >
            Ověřit řešení
          </Button>
        ) : (
          <Button
            onClick={handleReset}
            variant="outline"
            className="rounded-xl font-bold px-5 border-slate-200 hover:bg-slate-50 text-xs text-slate-700 py-2 h-9 flex items-center"
          >
            Zkusit znovu
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ITestApp() {
  const store = useITestStore();
  const { toast } = useToast();
  
  const [monitorAssignmentId, setMonitorAssignmentId] = useState<string | null>(null);
  const [pendingTestId, setPendingTestId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mId = params.get('monitor');
      if (mId) {
        setMonitorAssignmentId(mId);
      }
      
      const testId = params.get('test');
      if (testId) {
        setPendingTestId(testId);
        safeLocalStorage.setItem('pendingTestId', testId);
      } else {
        const cached = safeLocalStorage.getItem('pendingTestId');
        if (cached) {
          setPendingTestId(cached);
        }
      }
    }
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'register-trial' | 'student-register'>('login');
  const [loginRole, setLoginRole] = useState<'admin' | 'teacher' | 'student'>('teacher');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // AI Pedagog and Portal state
  const [teacherMode, setTeacherMode] = useState<'hub' | 'itest' | 'ai' | 'admin-dashboard'>('hub');
  const [aiPedagogMessage, setAiPedagogMessage] = useState('');
  const [aiPedagogHistory, setAiPedagogHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [aiPedagogContext, setAiPedagogContext] = useState('');
  const [aiPedagogSavedPrompts, setAiPedagogSavedPrompts] = useState<any[]>([]);
  const [isAiPedagogGenerating, setIsAiPedagogGenerating] = useState(false);
  const [aiPedagogFileName, setAiPedagogFileName] = useState('');
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [isSavingPromptModalOpen, setIsSavingPromptModalOpen] = useState(false);
  const [pastPrompts, setPastPrompts] = useState<string[]>([]);

  const handleClearPastPrompts = () => {
    if (confirm("Opravdu chcete vyčistit historii minulých promptů?")) {
      setPastPrompts([]);
      if (typeof window !== 'undefined' && store.currentUser) {
        safeLocalStorage.removeItem(`past_prompts_${store.currentUser.id}`);
      }
    }
  };

  // Vlastní API Klíč Gemini a stavy pro dělenou obrazovku
  const [userGeminiKey, setUserGeminiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [aiPedagogTab, setAiPedagogTab] = useState<'chat' | 'templates' | 'context'>('chat');
  const [activeMobileTab, setActiveMobileTab] = useState<'itest' | 'ai-pedagog'>('itest');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserGeminiKey(safeLocalStorage.getItem('gemini_api_key') || '');
    }
  }, []);

  const handleSaveGeminiKey = (key: string) => {
    setUserGeminiKey(key);
    if (typeof window !== 'undefined') {
      safeLocalStorage.setItem('gemini_api_key', key);
    }
  };

  useEffect(() => {
    if (store.currentUser && store.currentUser.role === 'teacher') {
      fetchSavedPrompts();
      if (typeof window !== 'undefined') {
        const stored = safeLocalStorage.getItem(`past_prompts_${store.currentUser.id}`);
        if (stored) {
          try {
            setPastPrompts(JSON.parse(stored));
          } catch (e) {
            console.error(e);
          }
        } else {
          setPastPrompts([]);
        }
      }
    }
  }, [store.currentUser]);

  const [schools, setSchools] = useState<any[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolInviteCode, setNewSchoolInviteCode] = useState('');

  const [selectedSchoolForLicense, setSelectedSchoolForLicense] = useState<any | null>(null);
  const [editSchoolLicenseType, setEditSchoolLicenseType] = useState<'free' | 'school'>('free');
  const [editSchoolLicenseExpiresAt, setEditSchoolLicenseExpiresAt] = useState<string>('');
  const [editSchoolMaxTeachers, setEditSchoolMaxTeachers] = useState<number>(10);
  const [isSchoolLicenseModalOpen, setIsSchoolLicenseModalOpen] = useState(false);
  const [isSavingSchoolLicense, setIsSavingSchoolLicense] = useState(false);
  const [editSchoolCreditsPool, setEditSchoolCreditsPool] = useState<number>(0);
  const [editSchoolCreditsPoolMax, setEditSchoolCreditsPoolMax] = useState<number>(0);
  const [editSchoolAdminId, setEditSchoolAdminId] = useState<string>('');

  const fetchSchools = async () => {
    try {
      setIsLoadingSchools(true);
      const res = await fetch('/api/schools');
      const data = await res.json();
      if (data.success) {
        setSchools(data.schools);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSchools(false);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim() || !newSchoolInviteCode.trim()) {
      toast({ title: "Chyba", description: "Vyplňte název školy i zvací kód.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSchoolName, inviteCode: newSchoolInviteCode })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Úspěch", description: "Škola byla úspěšně vytvořena." });
        setNewSchoolName('');
        setNewSchoolInviteCode('');
        fetchSchools();
      } else {
        toast({ title: "Chyba", description: data.error || "Nepodařilo se vytvořit školu.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Chyba sítě", variant: "destructive" });
    }
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm("Opravdu chcete tuto školu smazat? Data učitelů a tříd nebudou smazána, ale přijdou o přístup.")) return;
    try {
      const res = await fetch(`/api/schools?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Úspěch", description: "Škola byla smazána." });
        fetchSchools();
      } else {
        toast({ title: "Chyba", description: data.error || "Nepodařilo se smazat školu.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Chyba sítě", variant: "destructive" });
    }
  };

  const handleUpdateSchoolLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolForLicense) return;

    try {
      setIsSavingSchoolLicense(true);
      const res = await fetch('/api/schools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSchoolForLicense.id,
          licenseType: editSchoolLicenseType,
          licenseExpiresAt: editSchoolLicenseExpiresAt || null,
          maxTeachersCount: editSchoolMaxTeachers,
          aiCreditsPool: editSchoolCreditsPool,
          aiCreditsPoolMax: editSchoolCreditsPoolMax,
          adminTeacherId: editSchoolAdminId
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Úspěch", description: "Licence školy byla úspěšně aktualizována." });
        setIsSchoolLicenseModalOpen(false);
        setSelectedSchoolForLicense(null);
        fetchSchools();
        store.refresh();
      } else {
        toast({ title: "Chyba", description: data.error || "Nepodařilo se uložit změny.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Chyba sítě", variant: "destructive" });
    } finally {
      setIsSavingSchoolLicense(false);
    }
  };
  
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCustomSchoolModalOpen, setIsCustomSchoolModalOpen] = useState(false);
  const [selectedSchoolTier, setSelectedSchoolTier] = useState<'small' | 'medium' | 'large' | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{ amount: number, type: 'monthly' | 'yearly' | 'credits', credits?: number } | null>(null);
  const [newClassName, setNewClassName] = useState('');

  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [targetClassId, setTargetClassId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [editIsPublicTemplate, setEditIsPublicTemplate] = useState(false);
  const [editTimeLimit, setEditTimeLimit] = useState(0);
  const [customCredits, setCustomCredits] = useState<Record<string, string>>({});
  const [schoolCustomCredits, setSchoolCustomCredits] = useState<Record<string, string>>({});

  const [selectedTemplateForCopy, setSelectedTemplateForCopy] = useState<Assignment | null>(null);
  const [templateCopyClassId, setTemplateCopyClassId] = useState<string>('');
  const [templateCopyStartTime, setTemplateCopyStartTime] = useState<string>('');
  const [templateCopyEndTime, setTemplateCopyEndTime] = useState<string>('');
  const [templateCopyAssignType, setTemplateCopyAssignType] = useState<'all' | 'specific'>('all');
  const [templateCopySelectedStudentIds, setTemplateCopySelectedStudentIds] = useState<string[]>([]);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const autoSubmitRef = useRef<() => void>(() => {});
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isFullscreenWarningOpen, setIsFullscreenWarningOpen] = useState(false);
  const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
  const [teacherPreviewHeights, setTeacherPreviewHeights] = useState<Record<string, number>>({});
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'teacher' | 'classroom' | 'student' | 'assignment';
    id: string;
    name: string;
  } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string, name: string } | null>(null);
  const [newClassNameVal, setNewClassNameVal] = useState('');
  const [editingStudentTime, setEditingStudentTime] = useState<{
    studentId: string;
    studentName: string;
    assignmentId: string;
    currentLimit: number;
    customLimit: number | null;
  } | null>(null);
  const [customTimeVal, setCustomTimeVal] = useState<string>('');

  const [classActionType, setClassActionType] = useState<'create' | 'select'>('create');
  const [selectedExistingClassId, setSelectedExistingClassId] = useState('');

  const [studentActionType, setStudentActionType] = useState<'create' | 'select' | 'csv'>('create');
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState('');

  const [classSearch, setClassSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [isImportingCSV, setIsImportingCSV] = useState(false);
  const [csvClassName, setCsvClassName] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParsingError, setCsvParsingError] = useState<string | null>(null);
  const [csvImportProgress, setCsvImportProgress] = useState<string>('');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [aiInstructions, setAiInstructions] = useState('');
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEducation, setProfileEducation] = useState('');
  const [profileYearsOfExperience, setProfileYearsOfExperience] = useState('');
  const [profileSchoolName, setProfileSchoolName] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'feedback'>('profile');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [replyingFeedbackId, setReplyingFeedbackId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  useEffect(() => {
    if (isProfileModalOpen && store.currentUser) {
      setProfileFirstName((store.currentUser as any).firstName || '');
      setProfileLastName((store.currentUser as any).lastName || '');
      setProfileEducation(store.currentUser.education || '');
      setProfileYearsOfExperience(store.currentUser.yearsOfExperience !== undefined ? String(store.currentUser.yearsOfExperience) : '');
      const userSchool = schools.find(s => s.id === store.currentUser?.schoolId);
      setProfileSchoolName(userSchool?.name || '');
      setActiveProfileTab('profile');
    }
  }, [isProfileModalOpen, store.currentUser, schools]);

  const handleSaveProfile = async () => {
    if (!profileFirstName.trim() || !profileLastName.trim()) {
      toast({
        title: "Chyba",
        description: "Jméno a příjmení jsou povinná pole.",
        variant: "destructive"
      });
      return;
    }
    setIsSavingProfile(true);
    try {
      const success = await store.updateProfile({
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
        education: profileEducation.trim(),
        yearsOfExperience: parseInt(profileYearsOfExperience) || 0,
        schoolName: profileSchoolName.trim()
      });
      if (success) {
        setIsProfileModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Chyba sítě", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackContent.trim()) {
      toast({
        title: "Chyba",
        description: "Zpětná vazba nemůže být prázdná.",
        variant: "destructive"
      });
      return;
    }
    setIsSendingFeedback(true);
    try {
      const success = await store.sendFeedback(feedbackContent.trim());
      if (success) {
        setFeedbackContent('');
        setIsProfileModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Chyba sítě", variant: "destructive" });
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const [activeTab, setActiveTab] = useState('classes');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [templateSelectedSubject, setTemplateSelectedSubject] = useState('Vše');
  const [adminTab, setAdminTab] = useState<'overview' | 'classes' | 'teachers' | 'students' | 'assignments' | 'schools' | 'school_admins' | 'feedback'>('overview');
  const [adminSchoolFilter, setAdminSchoolFilter] = useState<string>('all');
  const [adminSearchFilter, setAdminSearchFilter] = useState<string>('');
  const [adminSortBy, setAdminSortBy] = useState<'name' | 'school' | 'default'>('default');
  const [adminSortOrder, setAdminSortOrder] = useState<'asc' | 'desc'>('asc');

  const [isAiGrading, setIsAiGrading] = useState(false);
  const handleAiGrade = async (assignment: Assignment, sub: Submission, customInstructions?: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.premiumType !== 'yearly' && currentUser?.premiumType !== 'school') {
      toast({
        title: "Nedostupná funkce",
        description: "AI hodnocení odevzdaných prací je dostupné pouze pro uživatele s ročním Premium předplatným nebo školní licencí.",
        variant: "destructive"
      });
      return;
    }
    setIsAiGrading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grade',
          questions: assignment.questions,
          answers: sub.answers || {},
          questionDrawings: sub.questionDrawings || {},
          mainWorkDrawing: sub.mainWorkDrawing,
          gradeThresholds: assignment.gradeThresholds,
          customInstructions: customInstructions || ''
        })
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        const evalData = data.evaluation;
        
        // Convert any Map/object schemas correctly
        const newScores: Record<string, number> = {};
        if (evalData.questionScores) {
          Object.entries(evalData.questionScores).forEach(([qId, val]) => {
            newScores[qId] = Number(val);
          });
        }
        
        setEvalScores(newScores);
        setEvalGrade(evalData.suggestedGrade || 5);
        
        // Append question feedbacks if available to final feedback
        let combinedFeedback = evalData.suggestedFeedback || '';
        if (evalData.questionFeedback && Object.keys(evalData.questionFeedback).length > 0) {
          combinedFeedback += "\n\nPodrobné hodnocení otázek:";
          assignment.questions.forEach((q, idx) => {
            const qFb = evalData.questionFeedback[q.id];
            if (qFb) {
              combinedFeedback += `\n- Otázka ${idx + 1}: ${qFb}`;
            }
          });
        }
        
        setEvalFeedback(combinedFeedback);
        setIsGradeManuallySet(true);
        toast({
          title: "AI Návrh úspěšný",
          description: "Známka, body a slovní hodnocení byly předvyplněny podle Gemini."
        });
      } else {
        toast({
          title: "AI Hodnocení selhalo",
          description: data.error || "Došlo k neznámé chybě při hodnocení.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Chyba sítě",
        description: err.message || "Nepodařilo se připojit k AI službě.",
        variant: "destructive"
      });
    } finally {
      setIsAiGrading(false);
    }
  };

  const [hasSetDefaultTab, setHasSetDefaultTab] = useState(false);
  useEffect(() => {
    if (store.currentUser) {
      if (store.currentUser.role === 'teacher' && store.currentUser.isSchoolAdmin && !hasSetDefaultTab) {
        setActiveTab('school-admin');
        setHasSetDefaultTab(true);
      }
    } else {
      setHasSetDefaultTab(false);
    }
  }, [store.currentUser, hasSetDefaultTab]);

  useEffect(() => {
    if (store.currentUser && (store.currentUser.role === 'admin' || store.currentUser.role === 'teacher')) {
      fetchSchools();
    }
  }, [store.currentUser, adminTab]);

  const [adminViewingAssignmentId, setAdminViewingAssignmentId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[] | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const handleGenerateTestFromAi = async (text: string, config: { numMultipleChoice: number; numTrueFalse: number; numShortAnswer: number; numCloze: number; targetAssignmentId?: string }) => {
    if (!text.trim()) {
      toast({ title: "Chyba", description: "Nelze generovat test z prázdného textu.", variant: "destructive" });
      return;
    }

    setIsGeneratingQuestions(true);
    toast({ title: "Generuji test", description: "AI analyzuje text a generuje otázky. Může to trvat několik sekund..." });

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          extractedText: text,
          numMultipleChoice: config.numMultipleChoice,
          numTrueFalse: config.numTrueFalse,
          numShortAnswer: config.numShortAnswer,
          numCloze: config.numCloze,
          generationMode: 'ai-pedagog'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Při generování testu došlo k chybě.");
      }

      setTeacherMode('itest');
      
      if (config.targetAssignmentId) {
        // Append to existing assignment
        const existingAss = store.assignments.find(a => a.id === config.targetAssignmentId);
        if (existingAss) {
          store.updateAssignment(config.targetAssignmentId, { 
            questions: [...existingAss.questions, ...data.questions] 
          });
          setEditingAssignmentId(config.targetAssignmentId);
          toast({ title: "Úspěch", description: `Přidáno ${data.questions.length} otázek do testu.` });
        }
      } else {
        // Create new assignment
        setGeneratedQuestions(data.questions);
        setIsCreatingAssignment(true);
        toast({ title: "Test vygenerován", description: "Otázky byly úspěšně přidány do nového testu." });
      }

    } catch (error: any) {
      toast({ title: "Chyba generování", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const [viewingAssignment, setViewingAssignment] = useState<string | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<string | null>(null);
  const [viewingAssignmentSubs, setViewingAssignmentSubs] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    if (store.currentUser && store.currentUser.role === 'student' && pendingTestId) {
      // Check if this student is assigned/allowed or if the test exists
      const testExists = store.assignments.some(a => a.id === pendingTestId);
      if (testExists) {
        setSelectedAssignmentId(pendingTestId);
        setPendingTestId(null);
        safeLocalStorage.removeItem('pendingTestId');
        toast({ title: "Test automaticky načten", description: "Byl jsi přesměrován na zadaný test." });
      }
    }
  }, [store.currentUser, pendingTestId, store.assignments]);
  const [selectedGradebookStudent, setSelectedGradebookStudent] = useState<User | null>(null);
  const [selectedGradebookSubject, setSelectedGradebookSubject] = useState<string>('Matematika');
  const [selectedTeacherSubject, setSelectedTeacherSubject] = useState<string>('Matematika');
  const [gradebookViewMode, setGradebookViewMode] = useState<'child' | 'teacher'>('child');
  const [mainWorkDrawing, setMainWorkDrawing] = useState<string | undefined>();
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>({});
  const [questionDrawings, setQuestionDrawings] = useState<Record<string, string>>({});
  const [questionDrawingOpen, setQuestionDrawingOpen] = useState<Record<string, boolean>>({});

  // State pro trénink chyb (Otázky navíc) v procvičování
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, Record<string, any>>>({});
  const [practiceChecked, setPracticeChecked] = useState<Record<string, Record<string, boolean>>>({});
  const [practiceAiContent, setPracticeAiContent] = useState<Record<string, { theoryExplanation: string; questions: any[] }>>({});
  const [practiceLoading, setPracticeLoading] = useState<Record<string, boolean>>({});
  const [practiceErrors, setPracticeErrors] = useState<Record<string, string>>({});

  const [isEvaluatingPractice, setIsEvaluatingPractice] = useState(false);
  const handlePracticeSubmit = async (a: Assignment) => {
    setIsEvaluatingPractice(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grade',
          assignmentId: a.id,
          questions: a.questions,
          answers: studentAnswers,
          questionDrawings: questionDrawings || {},
          mainWorkDrawing: mainWorkDrawing,
          gradeThresholds: a.gradeThresholds
        })
      });

      const data = await res.json();
      let evalScores: Record<string, number> = {};
      let evalQuestionFeedback: Record<string, string> = {};
      let evalFeedback = "";

      if (res.ok && data.success && data.evaluation) {
        const evalData = data.evaluation;
        if (evalData.questionScores) {
          Object.entries(evalData.questionScores).forEach(([qId, val]) => {
            evalScores[qId] = Number(val);
          });
        }
        if (evalData.questionFeedback) {
          Object.entries(evalData.questionFeedback).forEach(([qId, val]) => {
            evalQuestionFeedback[qId] = String(val);
          });
        }
        evalFeedback = evalData.suggestedFeedback || "";
        toast({
          title: "Vyhodnoceno pomocí AI",
          description: "Tvé odpovědi byly zkontrolovány umělou inteligencí a bylo vygenerováno vysvětlení."
        });
      } else {
        toast({
          title: "AI vyhodnocení selhalo",
          description: data.error || "Nepodařilo se vyhodnotit práci pomocí AI, ukládám bez vysvětlení.",
          variant: "destructive"
        });
      }

      await store.submitWork({
        assignmentId: a.id,
        studentId: store.currentUser?.id || "",
        answers: studentAnswers,
        questionDrawings,
        mainWorkDrawing,
        questionScores: evalScores,
        questionFeedback: evalQuestionFeedback,
        feedback: evalFeedback
      });
      selectStudentAssignment(null);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Chyba sítě",
        description: err.message || "Nepodařilo se připojit k AI službě, ukládám bez vyhodnocení.",
        variant: "destructive"
      });
      await store.submitWork({
        assignmentId: a.id,
        studentId: store.currentUser?.id || "",
        answers: studentAnswers,
        questionDrawings,
        mainWorkDrawing
      });
      selectStudentAssignment(null);
    } finally {
      setIsEvaluatingPractice(false);
    }
  };

  const handleLoadAiPractice = async (qId: string, questionText: string, numQuestions: number, assignmentId?: string) => {
    setPracticeLoading(prev => ({ ...prev, [qId]: true }));
    setPracticeErrors(prev => ({ ...prev, [qId]: '' }));
    try {
      const res = await fetch('/api/ai/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText, numQuestions, assignmentId })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'AI_OFFLINE') {
          throw new Error('AI_OFFLINE');
        }
        throw new Error(data.message || 'Nepodařilo se vygenerovat cvičné otázky.');
      }
      setPracticeAiContent(prev => ({ ...prev, [qId]: data.data }));
    } catch (err: any) {
      console.error(err);
      setPracticeErrors(prev => ({ ...prev, [qId]: err.message }));
    } finally {
      setPracticeLoading(prev => ({ ...prev, [qId]: false }));
    }
  };

  useEffect(() => {
    autoSubmitRef.current = () => {
      if (!selectedAssignmentId || !store.currentUser) return;
      store.submitWork({
        assignmentId: selectedAssignmentId,
        studentId: store.currentUser.id,
        answers: studentAnswers,
        questionDrawings,
        mainWorkDrawing
      });
      toast({
        title: "Časový limit vypršel",
        description: "Test byl automaticky odevzdán.",
        variant: "destructive"
      });
      selectStudentAssignment(null);
    };
  });

  useEffect(() => {
    const currentStudent = store.currentUser;
    if (!selectedAssignmentId || !currentStudent || currentStudent.role !== 'student') {
      setTimeLeft(null);
      return;
    }
    const a = store.assignments.find(as => as.id === selectedAssignmentId);
    if (!a || !a.timeLimit || a.timeLimit <= 0) {
      setTimeLeft(null);
      return;
    }
    if (a.antiCheat && !isTestStarted) {
      setTimeLeft(null);
      return;
    }

    const sub = store.submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === currentStudent.id);
    if (sub && sub.submittedAt) {
      setTimeLeft(null);
      return;
    }

    let timerStartedAt = sub?.startedAt;
    let isSubscribed = true;
    let interval: any = null;

    const initializeTimer = async () => {
      if (!timerStartedAt) {
        timerStartedAt = await store.startAssignmentTimer(a.id, currentStudent.id, currentStudent.schoolId || '');
      }

      if (!isSubscribed) return;

      interval = setInterval(() => {
        const startMs = new Date(timerStartedAt!).getTime();
        const limitMins = sub?.customTimeLimit !== undefined && sub?.customTimeLimit !== null
          ? sub.customTimeLimit
          : a.timeLimit!;
        const limitMs = limitMins * 60 * 1000;
        const elapsed = Date.now() - startMs;
        const remaining = Math.max(0, limitMs - elapsed);
        
        setTimeLeft(Math.floor(remaining / 1000));

        if (remaining <= 0) {
          if (interval) clearInterval(interval);
          autoSubmitRef.current?.();
        }
      }, 1000);
    };

    initializeTimer();

    return () => {
      isSubscribed = false;
      if (interval) clearInterval(interval);
    };
  }, [selectedAssignmentId, store.currentUser, store.submissions, isTestStarted]);
  
  const tabFocusLostCountRef = useRef(0);
  const lastLoadedDraftAssignmentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedAssignmentId || !store.currentUser || store.currentUser.role !== 'student') return;
    const sub = store.submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === store.currentUser!.id);
    if (sub) {
      tabFocusLostCountRef.current = sub.tabFocusLostCount || 0;
    } else {
      tabFocusLostCountRef.current = 0;
    }
  }, [selectedAssignmentId, store.currentUser, store.submissions]);

  useEffect(() => {
    if (!selectedAssignmentId || !store.currentUser || store.currentUser.role !== 'student') {
      lastLoadedDraftAssignmentIdRef.current = null;
      return;
    }
    
    if (lastLoadedDraftAssignmentIdRef.current === selectedAssignmentId) return;

    const sub = store.submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === store.currentUser!.id);
    if (sub) {
      lastLoadedDraftAssignmentIdRef.current = selectedAssignmentId;
      if (!sub.submittedAt) {
        setStudentAnswers(sub.answers || {});
        setQuestionDrawings(sub.questionDrawings || {});
        setMainWorkDrawing(sub.mainWorkDrawing);
      }
    }
  }, [selectedAssignmentId, store.currentUser, store.submissions]);

  useEffect(() => {
    if (!selectedAssignmentId || !store.currentUser || store.currentUser.role !== 'student') return;
    const sub = store.submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === store.currentUser!.id);
    if (sub && sub.submittedAt) return;

    const handleBlur = () => {
      tabFocusLostCountRef.current += 1;
      toast({
        title: "Upozornění",
        description: "Opustili jste okno testu! Tento incident byl zaznamenán.",
        variant: "destructive"
      });
      store.saveDraft({
        assignmentId: selectedAssignmentId,
        studentId: store.currentUser!.id,
        answers: studentAnswers,
        questionDrawings,
        mainWorkDrawing,
        tabFocusLostCount: tabFocusLostCountRef.current,
        lastActiveAt: new Date().toISOString()
      });
    };

    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [selectedAssignmentId, store.currentUser, studentAnswers, questionDrawings, mainWorkDrawing, store.saveDraft, toast]);

  useEffect(() => {
    if (!selectedAssignmentId || !store.currentUser || store.currentUser.role !== 'student') return;
    const assignment = store.assignments.find(a => a.id === selectedAssignmentId);
    if (!assignment || !assignment.antiCheat || !isTestStarted) return;

    const sub = store.submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === store.currentUser!.id);
    if (sub && sub.submittedAt) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        tabFocusLostCountRef.current += 1;
        toast({
          title: "Upozornění",
          description: "Opustili jste režim celé obrazovky! Tento incident byl zaznamenán.",
          variant: "destructive"
        });
        store.saveDraft({
          assignmentId: selectedAssignmentId,
          studentId: store.currentUser!.id,
          answers: studentAnswers,
          questionDrawings,
          mainWorkDrawing,
          tabFocusLostCount: tabFocusLostCountRef.current,
          lastActiveAt: new Date().toISOString()
        });
        setIsFullscreenWarningOpen(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [selectedAssignmentId, store.currentUser, isTestStarted, studentAnswers, questionDrawings, mainWorkDrawing, store.saveDraft, toast]);

  useEffect(() => {
    if (!selectedAssignmentId || !store.currentUser || store.currentUser.role !== 'student') return;
    const assignment = store.assignments.find(a => a.id === selectedAssignmentId);
    if (!assignment || !assignment.antiCheat) return;

    const preventCopyPaste = (e: Event) => {
      e.preventDefault();
      toast({
        title: "Akce zakázána",
        description: "Kopírování a vkládání textu je u tohoto testu zablokováno.",
        variant: "destructive"
      });
    };

    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);

    return () => {
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
    };
  }, [selectedAssignmentId, store.currentUser, toast]);

  useEffect(() => {
    if (!selectedAssignmentId || !store.currentUser || store.currentUser.role !== 'student') return;
    const sub = store.submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === store.currentUser!.id);
    if (sub && sub.submittedAt) return;

    const delayDebounce = setTimeout(() => {
      store.saveDraft({
        assignmentId: selectedAssignmentId,
        studentId: store.currentUser!.id,
        answers: studentAnswers,
        questionDrawings,
        mainWorkDrawing,
        tabFocusLostCount: tabFocusLostCountRef.current,
        lastActiveAt: new Date().toISOString()
      });
    }, 2000);

    return () => clearTimeout(delayDebounce);
  }, [studentAnswers, questionDrawings, mainWorkDrawing, selectedAssignmentId, store.currentUser, store.saveDraft]);

  useEffect(() => {
    if (!selectedAssignmentId || !store.currentUser || store.currentUser.role !== 'student') return;
    const sub = store.submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === store.currentUser!.id);
    if (sub && sub.submittedAt) return;

    const interval = setInterval(() => {
      store.saveDraft({
        assignmentId: selectedAssignmentId,
        studentId: store.currentUser!.id,
        answers: studentAnswers,
        questionDrawings,
        mainWorkDrawing,
        tabFocusLostCount: tabFocusLostCountRef.current,
        lastActiveAt: new Date().toISOString()
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [selectedAssignmentId, store.currentUser, studentAnswers, questionDrawings, mainWorkDrawing, store.saveDraft]);

  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editAssignType, setEditAssignType] = useState<'all' | 'specific'>('all');
  const [editSelectedStudentIds, setEditSelectedStudentIds] = useState<string[]>([]);

  // Stavy pro kopii do jiné třídy
  const [isSendingCopy, setIsSendingCopy] = useState(false);
  const [copyTargetClassId, setCopyTargetClassId] = useState('');
  const [copyStartTime, setCopyStartTime] = useState('');
  const [copyEndTime, setCopyEndTime] = useState('');
  const [copyAssignType, setCopyAssignType] = useState<'all' | 'specific'>('all');
  const [copySelectedStudentIds, setCopySelectedStudentIds] = useState<string[]>([]);
  const [isGeneratingAlternative, setIsGeneratingAlternative] = useState(false);

  const handleStartEditSettings = (a: Assignment) => {
    setEditStartTime(a.startTime || '');
    setEditEndTime(a.endTime || '');
    setEditAssignType(a.studentIds && a.studentIds.length > 0 ? 'specific' : 'all');
    setEditSelectedStudentIds(a.studentIds || []);
    setEditIsPublicTemplate(!!a.isPublicTemplate);
    setEditTimeLimit(a.timeLimit || 0);
    setIsEditingSettings(true);
  };

  const handleStartSendCopy = (a: Assignment) => {
    setCopyStartTime('');
    setCopyEndTime('');
    setCopyTargetClassId('');
    setCopyAssignType('all');
    setCopySelectedStudentIds([]);
    setIsSendingCopy(true);
  };

  const selectStudentAssignment = (id: string | null) => {
    setSelectedAssignmentId(id);
    setStudentAnswers({});
    setQuestionDrawings({});
    setMainWorkDrawing(undefined);
    setPracticeAnswers({});
    setPracticeChecked({});
    setPracticeAiContent({});
    setPracticeLoading({});
    setPracticeErrors({});
    setIsTestStarted(false);
    setIsFullscreenWarningOpen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
    }

    if (id && currentUser && currentUser.role === 'student') {
      const assignment = store.assignments.find(a => a.id === id);
      if (assignment && !assignment.antiCheat && assignment.timeLimit && assignment.timeLimit > 0) {
        store.startAssignmentTimer(id, currentUser.id, currentUser.schoolId || '');
      }
    }
  };

  const handleStartAntiCheatTest = async (assignment: Assignment) => {
    try {
      await document.documentElement.requestFullscreen();
      setIsTestStarted(true);
      if (currentUser && assignment.timeLimit && assignment.timeLimit > 0) {
        await store.startAssignmentTimer(assignment.id, currentUser.id, currentUser.schoolId || '');
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
      toast({
        title: "Chyba",
        description: "Pro spuštění testu musíte povolit režim celé obrazovky ve Vašem prohlížeči.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateVariantB = async (assignment: Assignment) => {
    setIsGeneratingVariant(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateAlternative',
          questions: assignment.questions
        })
      });
      const data = await res.json();
      if (data.error) {
        toast({
          title: "Chyba při generování",
          description: data.error,
          variant: "destructive"
        });
        return;
      }
      if (data.questions) {
        const newAssignment: Omit<Assignment, 'id'> = {
          title: `${assignment.title} (Varianta B)`,
          description: assignment.description,
          classId: assignment.classId,
          subject: assignment.subject,
          teacherId: assignment.teacherId || '',
          schoolId: assignment.schoolId || currentUser?.schoolId || '',
          startTime: assignment.startTime,
          endTime: assignment.endTime,
          timeLimit: assignment.timeLimit,
          antiCheat: assignment.antiCheat,
          isPractice: assignment.isPractice,
          isDraft: true,
          questions: data.questions,
          dueDate: assignment.dueDate || ''
        };
        await store.addAssignment(newAssignment);
        toast({
          title: "Varianta B vytvořena",
          description: `Byl vytvořen nový koncept „${newAssignment.title}“.`,
        });
        setViewingAssignment(null);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Neočekávaná chyba",
        description: err.message || "Nepodařilo se vygenerovat variantu.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingVariant(false);
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('cs-CZ', { 
      day: 'numeric', 
      month: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderAudioControls = (q: any) => {
    if (!q.audioText && !q.audioUri) return null;

    const playTextToSpeech = () => {
      if (!window.speechSynthesis) {
        toast({
          title: "Chyba",
          description: "Váš prohlížeč nepodporuje předčítání textu.",
          variant: "destructive"
        });
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(q.audioText);
      utterance.lang = 'en-GB';
      utterance.rate = 0.82; // Klidný hlas pro výuku
      
      const voices = window.speechSynthesis.getVoices();
      const enGBVoices = voices.filter(v => v.lang.toLowerCase().replace('_', '-') === 'en-gb' || v.lang.toLowerCase().startsWith('en-gb'));
      const femaleVoice = enGBVoices.find(v => {
        const name = v.name.toLowerCase();
        return name.includes('female') || name.includes('hazel') || name.includes('fiona') || name.includes('serena') || name.includes('sonia') || name.includes('libby') || name.includes('victoria') || name.includes('zira');
      });
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      } else if (enGBVoices.length > 0) {
        utterance.voice = enGBVoices[0];
      }
      
      window.speechSynthesis.speak(utterance);
    };

    return (
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-150 shadow-sm print-exclude w-full max-w-md my-2 text-left">
        {q.audioUri && (
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <audio src={q.audioUri} controls className="h-8 max-w-full w-full" />
          </div>
        )}
        {q.audioText && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={playTextToSpeech}
            className="flex items-center gap-1.5 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold rounded-xl h-9 shadow-xs"
          >
            <Volume2 className="w-4 h-4 text-indigo-500" />
            <span>Přečíst zadání (AI hlas)</span>
          </Button>
        )}
      </div>
    );
  };
  const downloadAllSubmissionsZip = async (assignmentId: string) => {
    try {
      const assignment = store.assignments.find(a => a.id === assignmentId);
      if (!assignment) return;
      
      const assignmentSubmissions = store.submissions.filter(s => s.assignmentId === assignmentId);
      if (assignmentSubmissions.length === 0) {
        toast({ title: "Informace", description: "Pro tento úkol zatím nejsou žádné odevzdané práce.", variant: "default" });
        return;
      }
      
      toast({ title: "Příprava archivu", description: "Generuji ZIP s PDF soubory..." });
      
      // Dynamický import JSZip a jsPDF
      const [JSZipModule, jsPDFModule] = await Promise.all([
        import('jszip'),
        import('jspdf')
      ]);
      const JSZip = JSZipModule.default;
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
      
      // Stažení fontu Roboto pro diakritiku (Czech/Slovak)
      let fontBase64 = '';
      try {
        const response = await fetch("https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf");
        if (response.ok) {
          const fontBuffer = await response.arrayBuffer();
          const bytes = new Uint8Array(fontBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          fontBase64 = window.btoa(binary);
        }
      } catch (fontErr) {
        console.warn("Nepodařilo se stáhnout Roboto font, použije se Helvetica (bez diakritiky):", fontErr);
      }
      
      const zip = new JSZip();
      const folder = zip.folder(assignment.title.replace(/[/\\?%*:|"<>\s]+/g, '_'));
      
      for (const sub of assignmentSubmissions) {
        const student = store.users.find(u => u.id === sub.studentId);
        const studentName = student ? student.name : sub.studentId;
        const studentNameEscaped = studentName.replace(/[/\\?%*:|"<>\s]+/g, '_');
        
        // Vytvoření PDF dokumentu pro žáka
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });
        
        if (fontBase64) {
          doc.addFileToVFS("Roboto.ttf", fontBase64);
          doc.addFont("Roboto.ttf", "Roboto", "normal");
          doc.setFont("Roboto");
        } else {
          doc.setFont("Helvetica");
        }
        
        // 1. Hlavička protokolu (Stylizovaná jako kopie s tisku - CardHeader)
        doc.setFontSize(20);
        doc.setTextColor("#4F46E5"); // Indigo primary
        doc.text(assignment.title, 15, 23);
        
        doc.setFontSize(11);
        doc.setTextColor("#4B5563"); // gray-600
        doc.text(`Odevzdal(a): ${studentName} (${student ? student.username : ''})`, 15, 29);
        
        doc.setDrawColor(229, 231, 235); // border-gray-200
        doc.setLineWidth(0.5);
        doc.line(15, 33, 195, 33);
        
        let yPos = 42;
        
        // 2. Odpovědi na otázky (Kartičky v pořadí s inlinovanými kresbami)
        if (assignment.questions && assignment.questions.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor("#4F46E5");
          doc.text("ODPOVĚDI NA OTÁZKY", 15, yPos);
          yPos += 8;
          
          assignment.questions.forEach((q, idx) => {
            const answer = sub.answers?.[q.id];
            const score = sub.questionScores?.[q.id] || 0;
            const isCorrect = score === (q.points || 1);
            const drawing = sub.questionDrawings?.[q.id];
            
            // Určení textu odpovědi
            let ansText = 'Neodpovězeno';
            if (q.type === 'drawing') {
              ansText = 'Kresba odevzdaná níže v této kartě';
            } else if (q.type === 'multiple_choice') {
              ansText = answer !== undefined && answer !== null && answer !== '' 
                ? `${String.fromCharCode(65 + Number(answer))}. ${q.options?.[Number(answer)] || ''}` 
                : 'Neodpovězeno';
            } else if (q.type === 'axis') {
              ansText = Array.isArray(answer) && answer.length > 0
                ? answer.map(([x, y]) => `[${x}, ${y}]`).join(', ')
                : 'Neodpovězeno';
            } else if (q.type === 'number_line') {
              ansText = Array.isArray(answer) && answer.length > 0
                ? answer.map(val => parseFloat(Number(val).toFixed(2)).toString()).join(', ')
                : 'Neodpovězeno';
            } else if (q.type === 'true_false') {
              ansText = answer !== undefined && answer !== null && answer !== ''
                ? (answer ? '✓ Ano' : '✗ Ne')
                : 'Neodpovězeno';
            } else if (q.type === 'graph') {
              ansText = answer !== undefined && answer !== null && answer !== ''
                ? (Array.isArray(answer) ? JSON.stringify(answer) : String(answer))
                : 'Neodpovězeno';
            } else if (answer !== undefined && answer !== null && answer !== '') {
              ansText = String(answer);
            }
            
            // Typ otázky a text
            const qTypeLabel = q.type === 'short_answer' ? 'Krátká odpověď' : 
                               q.type === 'long_answer' ? 'Dlouhá odpověď' : 
                               q.type === 'multiple_choice' ? 'Výběr z možností' : 
                               q.type === 'axis' ? 'Osa X/Y' : 
                               q.type === 'number_line' ? 'Číselná osa' : q.type === 'true_false' ? 'Ano / Ne' : 
                               q.type === 'drawing' ? 'Kresba' : 
                               q.type === 'graph' ? 'Graf' : 
                               q.type === 'cloze' ? 'Doplňovačka' : 
                               q.type === 'audio' ? 'Poslech / Diktát' : q.type;
                               
            const qLines = doc.splitTextToSize(`${idx + 1}. ${q.text} [${qTypeLabel}]`, 122); // Necháme místo pro body pill
            const aLines = q.type !== 'drawing' ? doc.splitTextToSize(`Odpověď: ${ansText}`, 168) : [];
            
            // Výpočet výšek
            let textHeight = 6 + qLines.length * 5;
            if (q.type !== 'drawing') {
              textHeight += 4 + aLines.length * 5;
            }
            
            const drawingHeight = drawing ? 52 : 0; // 45mm obrázek + 7mm padding
            const cardHeight = textHeight + drawingHeight + 6;
            
            // Kontrola konce stránky
            if (yPos + cardHeight > 275) {
              doc.addPage();
              if (fontBase64) doc.setFont("Roboto", "normal");
              yPos = 20;
            }
            
            // Pozadí a okraje karty
            doc.setFillColor(249, 250, 251); // bg-gray-50
            doc.setDrawColor(229, 231, 235); // border-gray-200
            doc.roundedRect(15, yPos, 180, cardHeight, 3, 3, "FD");
            
            // Otázka
            doc.setFontSize(10.5);
            doc.setTextColor("#1F2937"); // gray-800
            qLines.forEach((line: string, lineIdx: number) => {
              doc.text(line, 20, yPos + 7 + lineIdx * 5);
            });
            
            // Odpověď
            if (q.type !== 'drawing') {
              doc.setFontSize(10);
              doc.setTextColor("#4B5563"); // gray-600
              aLines.forEach((line: string, lineIdx: number) => {
                doc.text(line, 20, yPos + 7 + qLines.length * 5 + 4 + lineIdx * 5);
              });
            }
            
            // Kresba
            if (drawing) {
              try {
                const imgY = yPos + textHeight + 2;
                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(229, 231, 235);
                doc.roundedRect(20, imgY, 90, 46, 2, 2, "FD");
                doc.addImage(drawing, 'JPEG', 20.5, imgY + 0.5, 89, 45, undefined, 'FAST');
              } catch (drawErr) {
                console.error("Chyba při inlinování kresby do PDF:", drawErr);
              }
            }
            
            // Bodový odznáček (Pill)
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(229, 231, 235);
            doc.roundedRect(148, yPos + 4, 42, 7, 1.5, 1.5, "FD");
            doc.setFontSize(9.5);
            doc.setTextColor(score === (q.points || 1) ? "#16A34A" : "#DC2626");
            doc.text(`Body: ${score} / ${q.points || 1}`, 152, yPos + 9);
            
            yPos += cardHeight + 4;
          });
        }
        
        // 3. Hlavní odevzdaný list (Vypracovaný dokument)
        if (sub.mainWorkDrawing) {
          try {
            doc.addPage();
            if (fontBase64) doc.setFont("Roboto", "normal");
            
            doc.setFontSize(14);
            doc.setTextColor("#4F46E5");
            doc.text("VYPRACOVANÝ DOKUMENT / LIST", 15, 20);
            
            doc.setDrawColor(229, 231, 235);
            doc.roundedRect(14.5, 25.5, 181, 246, 3, 3, "D");
            
            doc.addImage(sub.mainWorkDrawing, 'JPEG', 15, 26, 180, 245, undefined, 'FAST');
            yPos = 20; // Resetujeme yPos na 20, protože jsme na nové čisté stránce
          } catch (imgErr) {
            console.error("Chyba při vkládání hlavního nákresu do PDF:", imgErr);
          }
        }
        
        // 4. Celkové hodnocení a slovní posudek (Stylizováno jako 'Výsledky pro tiskovou verzi')
        const totalMax = assignment.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;
        let earned = 0;
        if (sub.questionScores) {
          Object.values(sub.questionScores).forEach(val => { earned += val as number; });
        }
        const pct = totalMax > 0 ? Math.round((earned / totalMax) * 100) : 0;
        
        const feedbackLines = sub.feedback ? doc.splitTextToSize(sub.feedback, 166) : [];
        const scoreHeight = 14;
        const gradeHeight = 18;
        const feedbackBlockHeight = sub.feedback ? (8 + feedbackLines.length * 5 + 6) : 0;
        const totalResultsHeight = 10 + scoreHeight + 4 + gradeHeight + (sub.feedback ? 6 + feedbackBlockHeight : 0);
        
        if (yPos + totalResultsHeight > 275 || yPos === 20) {
          doc.addPage();
          if (fontBase64) doc.setFont("Roboto", "normal");
          yPos = 20;
        }
        
        doc.setFontSize(12);
        doc.setTextColor("#4F46E5");
        doc.text("CELKOVÉ HODNOCENÍ A VÝSLEDEK", 15, yPos + 2);
        yPos += 8;
        
        // A. Celkové skóre
        doc.setFillColor(238, 242, 246); // light blue-gray
        doc.setDrawColor(199, 210, 254); // border-indigo-200
        doc.roundedRect(15, yPos, 180, scoreHeight, 3, 3, "FD");
        
        doc.setFontSize(10.5);
        doc.setTextColor("#4F46E5");
        doc.text("Celkové skóre:", 22, yPos + 9);
        doc.setFontSize(12);
        doc.text(`${earned} / ${totalMax} bodů (${pct} %)`, 142, yPos + 9.5);
        yPos += scoreHeight + 4;
        
        // B. Výsledná známka
        doc.setFillColor(249, 250, 251); // bg-gray-50
        doc.setDrawColor(229, 231, 235); // border-gray-200
        doc.roundedRect(15, yPos, 180, gradeHeight, 3, 3, "FD");
        
        doc.setFontSize(10.5);
        doc.setTextColor("#4B5563"); // gray-600
        doc.text("Výsledná známka:", 22, yPos + 11);
        doc.setFontSize(16);
        doc.setTextColor("#4F46E5"); // Indigo
        doc.text(String(sub.grade || 'Nehodnoceno'), 155, yPos + 12.5);
        yPos += gradeHeight + 6;
        
        // C. Slovní hodnocení
        if (sub.feedback && feedbackBlockHeight > 0) {
          doc.setFillColor(249, 250, 251);
          doc.setDrawColor(229, 231, 235);
          doc.roundedRect(15, yPos, 180, feedbackBlockHeight, 3, 3, "FD");
          
          doc.setFontSize(9);
          doc.setTextColor("#9CA3AF"); // gray-400
          doc.text("SLOVNÍ HODNOCENÍ UČITELE:", 20, yPos + 6);
          
          doc.setFontSize(10);
          doc.setTextColor("#1F2937"); // gray-800
          feedbackLines.forEach((line: string, lineIdx: number) => {
            doc.text(line, 20, yPos + 12 + lineIdx * 5);
          });
        }
        
        const pdfOutput = doc.output('arraybuffer');
        folder?.file(`${studentNameEscaped}.pdf`, pdfOutput);
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${assignment.title.replace(/[/\\?%*:|"<>\s]+/g, '_')}_prace_pdf.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Staženo", description: "Archiv ZIP s PDF soubory byl úspěšně stažen.", variant: "default" });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Chyba", description: "Hromadný export do ZIP selhal.", variant: "destructive" });
    }
  };

  const downloadCsvResults = (assignmentId: string) => {
    const assignment = store.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const classStudents = store.users.filter(u => {
      if (u.role !== 'student') return false;
      if (assignment.studentIds && assignment.studentIds.length > 0) {
        return assignment.studentIds.includes(u.id);
      }
      return u.classId === selectedClassId;
    });

    const totalMax = assignment.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;

    const headers = [
      'Jméno žáka',
      'Uživatelské jméno',
      'Získané body',
      'Maximální body',
      'Úspěšnost (%)',
      'Výsledná známka',
      'Datum odevzdání'
    ];

    const rows = classStudents.map(student => {
      const sub = store.submissions.find(s => s.assignmentId === assignment.id && s.studentId === student.id);
      
      let earned = 0;
      if (sub?.questionScores) {
        Object.values(sub.questionScores).forEach(v => { earned += v as number; });
      }

      const pct = totalMax > 0 ? Math.round((earned / totalMax) * 100) : 0;
      const grade = assignment.isPractice ? (sub ? 'Procvičování' : 'Neodevzdáno') : (sub && sub.grade ? String(sub.grade) : (sub ? 'Neopraveno' : 'Neodevzdáno'));
      const submittedDate = sub && sub.submittedAt ? formatDateTime(sub.submittedAt) : 'Neodevzdáno';

      return [
        student.name,
        student.username,
        sub ? earned : 0,
        totalMax,
        sub ? pct : 0,
        grade,
        submittedDate
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(val => {
        const strVal = String(val);
        if (strVal.includes(';') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(';'))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const sanitizedTitle = assignment.title.replace(/[/\\?%*:|"<>\s]+/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `vysledky_${sanitizedTitle}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV Exportováno",
      description: `Výsledky testu „${assignment.title}“ byly staženy ve formátu CSV.`,
    });
  };

  const [evalGrade, setEvalGrade] = useState<number | undefined>();
  const [evalFeedback, setEvalFeedback] = useState<string>('');
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [isGradeManuallySet, setIsGradeManuallySet] = useState(false);

  useEffect(() => {
    if (viewingSubmission) {
      const sub = store.submissions.find(s => s.id === viewingSubmission);
      if (sub) {
        setEvalGrade(sub.grade);
        setEvalFeedback(sub.feedback || '');
        setIsGradeManuallySet(!!sub.grade);
        
        let scores: Record<string, number> = {};
        if (sub.questionScores) {
          if (sub.questionScores instanceof Map) {
            sub.questionScores.forEach((val, key) => {
              scores[key] = val;
            });
          } else {
            scores = { ...sub.questionScores };
          }
        }
        setEvalScores(scores);
      }
    }
  }, [viewingSubmission, store.submissions]);

  // Live výpočet a pre-selekcia navrhovanej známky podľa bodového zisku
  useEffect(() => {
    if (!viewingSubmission) return;
    const sub = store.submissions.find(s => s.id === viewingSubmission);
    const assignment = store.assignments.find(a => a.id === sub?.assignmentId);
    if (!assignment) return;

    const totalMax = assignment.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;
    const totalEarned = assignment.questions?.reduce((acc, q) => acc + (evalScores[q.id] || 0), 0) || 0;
    const pct = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

    const thresholds = assignment.gradeThresholds || [85, 65, 45, 25];
    let suggested = 5;
    if (pct >= (thresholds[0] ?? 85)) suggested = 1;
    else if (pct >= (thresholds[1] ?? 65)) suggested = 2;
    else if (pct >= (thresholds[2] ?? 45)) suggested = 3;
    else if (pct >= (thresholds[3] ?? 25)) suggested = 4;

    if (!isGradeManuallySet) {
      setEvalGrade(suggested);
    }
  }, [evalScores, isGradeManuallySet, viewingSubmission, store.submissions, store.assignments]);

  const renderGradebookDialog = () => {
    if (!selectedGradebookStudent) return null;

    const student = selectedGradebookStudent;
    const classroom = store.classes.find(c => c.id === student.classId);
    const className = classroom ? classroom.name : 'Bez třídy';

    // Get assignments available to the student
    const studentAssignments = store.assignments.filter(a =>
      a.classId === student.classId &&
      (!a.studentIds || a.studentIds.length === 0 || a.studentIds.includes(student.id))
    );

    // Get submissions by the student
    const studentSubmissions = store.submissions.filter(s =>
      s.studentId === student.id
    );

    const predefinedSubjects = [
      'Matematika',
      'Český jazyk',
      'Anglický jazyk',
      'Fyzika',
      'Chemie',
      'Dějepis',
      'Zeměpis',
      'Přírodopis',
      'Informatika',
      'Jiný'
    ];

    // Calculate overall average
    const allGradedSubmissions = studentSubmissions.filter(s => s.grade !== undefined && s.grade !== null && (() => { const a = store.assignments.find(as => as.id === s.assignmentId); return !a || !a.isPractice; })());
    const overallSum = allGradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
    const overallAverage = allGradedSubmissions.length > 0 ? (overallSum / allGradedSubmissions.length) : null;

    // Filter assignments of the selected subject
    const selectedSubjectAssignments = studentAssignments.filter(a =>
      selectedGradebookSubject === 'Jiný' ? (!a.subject || a.subject === 'Jiný') : (a.subject === selectedGradebookSubject)
    );

    // Calculate stats for the selected subject
    const selectedSubjectGradedSubmissions = studentSubmissions.filter(s => {
      const a = store.assignments.find(as => as.id === s.assignmentId);
      if (!a) return false;
      const isCorrectSubject = selectedGradebookSubject === 'Jiný' ? (!a.subject || a.subject === 'Jiný') : (a.subject === selectedGradebookSubject);
      return isCorrectSubject && s.grade !== undefined && s.grade !== null && !a.isPractice;
    });
    const subjectSum = selectedSubjectGradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
    const subjectAverage = selectedSubjectGradedSubmissions.length > 0 ? (subjectSum / selectedSubjectGradedSubmissions.length) : null;

    // Calculate subject averages for display in the sidebar
    const subjectAverages = predefinedSubjects.reduce((acc, subj) => {
      const graded = studentSubmissions.filter(s => {
        const a = store.assignments.find(as => as.id === s.assignmentId);
        if (!a) return false;
        const isCorrectSubject = subj === 'Jiný' ? (!a.subject || a.subject === 'Jiný') : (a.subject === subj);
        return isCorrectSubject && s.grade !== undefined && s.grade !== null && !a.isPractice;
      });
      const sum = graded.reduce((sumVal, s) => sumVal + (s.grade || 0), 0);
      acc[subj] = graded.length > 0 ? (sum / graded.length) : null;
      return acc;
    }, {} as Record<string, number | null>);

    // Overall performance description and emoji
    let overallEmoji = '✨';
    let overallText = 'Zatím bez známek';
    if (overallAverage !== null) {
      if (overallAverage <= 1.5) { overallEmoji = '🤩'; overallText = 'Výborný pokrok!'; }
      else if (overallAverage <= 2.5) { overallEmoji = '😊'; overallText = 'Dobrá práce!'; }
      else if (overallAverage <= 3.5) { overallEmoji = '😐'; overallText = 'Jde to, ale přidej.'; }
      else if (overallAverage <= 4.5) { overallEmoji = '😟'; overallText = 'Měl bys zabrat.'; }
      else { overallEmoji = '😢'; overallText = 'Potřebuješ pomoc.'; }
    }

    // Subject performance description and emoji
    let subjectEmoji = '📚';
    let subjectText = 'Zatím bez známek';
    if (subjectAverage !== null) {
      if (subjectAverage <= 1.5) { subjectEmoji = '🤩'; subjectText = 'Skvělý výsledek!'; }
      else if (subjectAverage <= 2.5) { subjectEmoji = '😊'; subjectText = 'Pěkná práce!'; }
      else if (subjectAverage <= 3.5) { subjectEmoji = '😐'; subjectText = 'Dobré výsledky.'; }
      else if (subjectAverage <= 4.5) { subjectEmoji = '😟'; subjectText = 'Zkus to vylepšit.'; }
      else { subjectEmoji = '😢'; subjectText = 'Je potřeba procvičovat.'; }
    }

    const formatDateSimple = (dateStr?: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('cs-CZ', { 
        day: 'numeric', 
        month: 'numeric', 
        year: 'numeric' 
      });
    };

    const isTeacherOrAdmin = store.currentUser?.role === 'teacher' || store.currentUser?.role === 'admin';
    const showAverages = isTeacherOrAdmin && gradebookViewMode === 'teacher';

    return (
      <Dialog open={selectedGradebookStudent !== null} onOpenChange={(open) => { if (!open) setSelectedGradebookStudent(null); }}>
        <DialogContent className="max-w-4xl bg-white rounded-3xl border-none shadow-2xl overflow-hidden p-0 max-h-[90vh] flex flex-col">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-6 md:p-8 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3.5 rounded-2xl">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Žákovská Knížka</span>
                <h2 className="text-2xl md:text-3xl font-headline font-black tracking-tight">{student.name}</h2>
                <p className="text-sm text-indigo-100 font-medium">Třída: <span className="font-bold">{className}</span> · Login: <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-xs">{student.username}</span></p>
              </div>
            </div>

            {/* Overall average */}
            {showAverages && (
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 border border-white/10 shrink-0 self-stretch sm:self-auto">
                <div className="text-4xl">{overallEmoji}</div>
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-200 tracking-wider block">Celkový Průměr</span>
                  <span className="text-2xl font-black text-white">{overallAverage !== null ? overallAverage.toFixed(2).replace('.', ',') : '--'}</span>
                  <span className="text-xs text-indigo-100 block font-medium">{overallText}</span>
                </div>
              </div>
            )}
          </div>

          {/* Main Layout Grid */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Sidebar with subjects */}
            <div className="w-full md:w-64 bg-slate-50 border-r overflow-y-auto shrink-0 max-h-48 md:max-h-none flex md:flex-col border-b md:border-b-0">
              <div className="p-4 border-b hidden md:block">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Výběr předmětu</span>
              </div>
              <div className="flex md:flex-col gap-1 p-2 md:p-3 overflow-x-auto md:overflow-x-visible w-full">
                {predefinedSubjects.map(subj => {
                  const isActive = selectedGradebookSubject === subj;
                  const avg = subjectAverages[subj];
                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setSelectedGradebookSubject(subj)}
                      className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-semibold transition-all shrink-0 md:shrink ${
                        isActive
                          ? 'bg-primary text-white shadow-md font-bold'
                          : 'bg-white md:bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border md:border-transparent'
                      }`}
                    >
                      <span className="truncate">{subj}</span>
                      {showAverages && (
                        avg !== null ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {avg.toFixed(1).replace('.', ',')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-normal italic">--</span>
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject content area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 bg-slate-50/20">
              {/* Header inside right column */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Detail předmětu</span>
                  <h3 className="text-2xl font-headline font-bold text-gray-800 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-primary" /> {selectedGradebookSubject}
                  </h3>
                </div>

                {/* Teacher / Admin switch */}
                {isTeacherOrAdmin && (
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setGradebookViewMode('child')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        gradebookViewMode === 'child' ? 'bg-white text-primary shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      👶 Pohled žáka
                    </button>
                    <button
                      type="button"
                      onClick={() => setGradebookViewMode('teacher')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        gradebookViewMode === 'teacher' ? 'bg-white text-primary shadow-sm font-black' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      👩‍🏫 Pohled učitele
                    </button>
                  </div>
                )}
              </div>

              {/* Subject Summary Card */}
              <div className={`p-5 rounded-2xl border transition-all ${
                subjectAverage !== null 
                  ? 'bg-gradient-to-br from-white to-slate-50 border-slate-200' 
                  : 'bg-slate-50 border-dashed border-2 text-center py-8'
              }`}>
                {subjectAverage !== null ? (
                  <div className="flex items-center justify-between gap-4">
                    {showAverages ? (
                      <div className="flex items-center gap-4">
                        <span className="text-5xl">{subjectEmoji}</span>
                        <div>
                          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Průměrná známka</span>
                          <h4 className="text-2xl font-black text-primary mt-0.5">
                            {subjectAverage.toFixed(2).replace('.', ',')}
                          </h4>
                          <span className="text-xs text-muted-foreground font-semibold">{subjectText}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="text-5xl">📊</span>
                        <div>
                          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Přehled předmětu</span>
                          <h4 className="text-2xl font-black text-primary mt-0.5">
                            {selectedGradebookSubject}
                          </h4>
                          <span className="text-xs text-muted-foreground font-semibold">Moje dosavadní klasifikace</span>
                        </div>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-700">{selectedSubjectGradedSubmissions.length}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Klasifikovaných testů</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-4xl block">📖</span>
                    <h4 className="font-bold text-slate-700 text-lg">Zatím neklasifikováno</h4>
                    <p className="text-sm text-slate-400">V předmětu {selectedGradebookSubject} student zatím neobdržel žádné známky.</p>
                  </div>
                )}
              </div>

              {/* Individual Tests Grades List */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">Přehled odevzdaných prací</span>
                
                {selectedSubjectAssignments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-white border border-dashed rounded-2xl">
                    <p className="font-medium text-sm">V tomto předmětu nebyly zadané žádné testy.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedSubjectAssignments.map(a => {
                      const sub = studentSubmissions.find(s => s.assignmentId === a.id);
                      
                      let earned = 0;
                      if (sub?.questionScores) {
                        Object.values(sub.questionScores).forEach(val => { earned += val as number; });
                      }
                      const totalMax = a.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;
                      const pct = totalMax > 0 ? Math.round((earned / totalMax) * 100) : 0;

                      return (
                        <div 
                          key={a.id}
                          className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800 text-lg">{a.title}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                              {sub ? (
                                <span>Odevzdáno: {formatDateSimple(sub.submittedAt)}</span>
                              ) : (
                                <span className="text-amber-600 font-semibold">⌛ Neodevzdáno (Uzávěrka: {formatDateSimple(a.dueDate)})</span>
                              )}
                              {sub && sub.feedback && (
                                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold">💬 Slovní hodnocení přiloženo</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                            {/* Rendering based on View Mode (Child vs Teacher) */}
                            {gradebookViewMode === 'child' ? (
                              <div className="flex items-center gap-3">
                                {sub ? (
                                    a.isPractice ? (
                                      <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-3 py-1 rounded-full border-none">
                                        Dokončeno · {earned} / {totalMax} b ({pct}%)
                                      </Badge>
                                    ) : sub.grade ? (
                                    (() => {
                                      const emoji = sub.grade === 1 ? '🤩' : sub.grade === 2 ? '😊' : sub.grade === 3 ? '😐' : sub.grade === 4 ? '😟' : '😢';
                                      return (
                                        <Badge className="bg-primary hover:bg-primary text-white font-black text-sm px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                                          Známka: {sub.grade} {emoji}
                                        </Badge>
                                      );
                                    })()
                                  ) : (
                                    <Badge variant="outline" className="text-indigo-600 bg-indigo-50 border-indigo-200 font-bold px-3 py-1">
                                      Odevzdáno (Neopraveno)
                                    </Badge>
                                  )
                                ) : (
                                  <Badge variant="secondary" className="text-slate-400 font-bold px-3 py-1 bg-slate-100">
                                    Neodevzdáno
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              /* Teacher View Details */
                              <div className="flex flex-wrap items-center gap-3">
                                {sub ? (
                                  <>
                                    <div className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border font-mono">
                                      Body: <span className="font-bold text-slate-800">{earned} / {totalMax} b.</span>
                                    </div>
                                    <div className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border font-mono">
                                      Úspěšnost: <span className="font-bold text-slate-800">{pct} %</span>
                                    </div>
                                    <Badge variant={!a.isPractice && sub.grade ? "default" : earned > 0 ? "outline" : "secondary"} className="font-bold text-xs px-2.5 py-1">
                                      {a.isPractice
                                        ? `Procvičování (${earned}/${totalMax} b)`
                                        : (sub.grade ? `Známka: ${sub.grade}` : 'Neohodnoceno')
                                      }
                                    </Badge>

                                    {/* Action link to view/grade submission */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-xl text-xs font-bold gap-1 px-3 text-indigo-700 bg-indigo-50 border-indigo-150 hover:bg-indigo-100"
                                      onClick={() => {
                                        // Open detailed view
                                        setEvalScores(sub.questionScores ? { ...sub.questionScores as Record<string, number> } : {});
                                        setEvalGrade(sub.grade);
                                        setEvalFeedback(sub.feedback || '');
                                        setIsGradeManuallySet(!!sub.grade);
                                        setViewingSubmission(sub.id);
                                        
                                        // Set corresponding navigation
                                        setSelectedClassId(student.classId!);
                                        setActiveTab('submissions');
                                        if (store.currentUser?.role === 'admin') {
                                          setAdminViewingAssignmentId(a.id);
                                        }
                                        
                                        // Close gradebook modal
                                        setSelectedGradebookStudent(null);
                                      }}
                                    >
                                      Zobrazit práci →
                                    </Button>
                                  </>
                                ) : (
                                  <Badge variant="secondary" className="text-slate-400 font-bold px-3 py-1 bg-slate-100">
                                    Neodevzdáno
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer containing overall stats/notes */}
          <DialogFooter className="bg-slate-50 p-4 border-t shrink-0 flex items-center justify-between gap-4">
            <p className="text-[11px] text-slate-400 font-medium leading-normal">Klasifikace a známkování odpovídá standardním testům v platformě iTest Cloud.</p>
            <Button variant="outline" className="rounded-full font-bold px-4 h-9 text-xs" onClick={() => setSelectedGradebookStudent(null)}>
              Zavřít
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (!store.isLoaded) {
    return (
      <div className="h-svh flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="font-headline text-2xl text-primary font-bold animate-pulse text-center px-4">
          Synchronizace: MANAK3D<br/>
          <span className="text-sm font-normal text-muted-foreground">Stahuji vaše data z databáze</span>
        </div>
      </div>
    );
  }

  const renderTemplateCopyDialog = () => {
    if (!selectedTemplateForCopy) return null;

    const teacherClasses = store.classes.filter(c => c.teacherId === currentUser?.id);

    return (
      <Dialog open={!!selectedTemplateForCopy} onOpenChange={(open) => { if (!open) setSelectedTemplateForCopy(null); }}>
        <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-bold text-primary">
              Použít šablonu testu
            </DialogTitle>
            <DialogDescription className="text-sm">
              Tímto zkopírujete test „{selectedTemplateForCopy.title}“ do své vybrané třídy jako nové zadání.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Výběr třídy */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Cílová třída:</label>
              <select
                value={templateCopyClassId}
                onChange={(e) => {
                  setTemplateCopyClassId(e.target.value);
                  setTemplateCopySelectedStudentIds([]);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-bold"
              >
                <option value="">— Vyberte třídu —</option>
                {teacherClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Časový limit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Zahájení (od kdy):</label>
                <Input 
                  type="datetime-local" 
                  value={templateCopyStartTime} 
                  onChange={e => setTemplateCopyStartTime(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Uzávěrka (do kdy):</label>
                <Input 
                  type="datetime-local" 
                  value={templateCopyEndTime} 
                  onChange={e => setTemplateCopyEndTime(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Zacílení žáků */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase">Zacílení žáků:</label>
              <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTemplateCopyAssignType('all')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${templateCopyAssignType === 'all' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-slate-50'}`}
                >
                  Celá třída
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateCopyAssignType('specific')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${templateCopyAssignType === 'specific' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-slate-50'}`}
                >
                  Vybraní žáci
                </button>
              </div>

              {templateCopyAssignType === 'specific' && templateCopyClassId && (
                <div className="border rounded-xl bg-white p-3 max-h-32 overflow-y-auto space-y-1.5">
                  {(() => {
                    const activeStudents = store.users.filter(u => u.role === 'student' && u.classId === templateCopyClassId);
                    if (activeStudents.length === 0) {
                      return <p className="text-xs text-muted-foreground italic text-center py-2">Ve třídě nejsou žádní žáci.</p>;
                    }
                    return activeStudents.map(s => {
                      const isChecked = templateCopySelectedStudentIds.includes(s.id);
                      return (
                        <label key={s.id} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setTemplateCopySelectedStudentIds(prev => prev.filter(id => id !== s.id));
                              } else {
                                setTemplateCopySelectedStudentIds(prev => [...prev, s.id]);
                              }
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span>{s.name} <span className="text-gray-400">({s.username})</span></span>
                        </label>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setSelectedTemplateForCopy(null)}
              className="rounded-xl"
            >
              Zrušit
            </Button>
            <Button
              onClick={async () => {
                if (!selectedTemplateForCopy || !currentUser) return;
                
                const copiedAssignment: Omit<Assignment, 'id'> = {
                  title: selectedTemplateForCopy.title,
                  description: selectedTemplateForCopy.description,
                  classId: templateCopyClassId,
                  subject: selectedTemplateForCopy.subject,
                  questions: selectedTemplateForCopy.questions,
                  fileUri: selectedTemplateForCopy.fileUri,
                  dueDate: templateCopyEndTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  startTime: templateCopyStartTime || undefined,
                  endTime: templateCopyEndTime || undefined,
                  studentIds: templateCopyAssignType === 'specific' ? templateCopySelectedStudentIds : [],
                  gradeThresholds: selectedTemplateForCopy.gradeThresholds,
                  isDraft: false,
                  isPublicTemplate: false,
                  timeLimit: selectedTemplateForCopy.timeLimit
                };

                store.addAssignment(copiedAssignment);
                setSelectedTemplateForCopy(null);
                toast({
                  title: "Šablona použita",
                  description: `Test byl zkopírován jako nové zadání do zvolené třídy.`,
                });
              }}
              disabled={!templateCopyClassId}
              className="bg-primary text-white rounded-xl font-bold px-6"
            >
              Vytvořit zadání
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderProfileModal = () => {
    if (!currentUser) return null;

    return (
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-xl bg-white rounded-3xl border-none shadow-2xl p-6 text-slate-800">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-headline font-black text-indigo-700 flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-600" />
              Můj Profil a Nastavení
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm leading-relaxed">
              Upravte své osobní údaje, informace o výuce nebo nám pošlete zpětnou vazbu.
            </DialogDescription>
          </DialogHeader>

          <div className="flex border-b border-slate-100 mb-6 mt-4">
            <button
              type="button"
              onClick={() => setActiveProfileTab('profile')}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeProfileTab === 'profile'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Osobní údaje
            </button>
            <button
              type="button"
              onClick={() => setActiveProfileTab('feedback')}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeProfileTab === 'feedback'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Zpětná vazba
            </button>
          </div>

          {activeProfileTab === 'profile' ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prof-first" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jméno</Label>
                  <Input
                    id="prof-first"
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    className="rounded-xl h-11 border-slate-200 focus-visible:ring-indigo-500 font-medium"
                    placeholder="Např. Jan"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prof-last" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Příjmení</Label>
                  <Input
                    id="prof-last"
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    className="rounded-xl h-11 border-slate-200 focus-visible:ring-indigo-500 font-medium"
                    placeholder="Např. Novák"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prof-school" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Škola, kde učíte</Label>
                <Input
                  id="prof-school"
                  value={profileSchoolName}
                  onChange={(e) => setProfileSchoolName(e.target.value)}
                  className="rounded-xl h-11 border-slate-200 focus-visible:ring-indigo-500 font-medium"
                  placeholder="Zadejte název školy"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prof-edu" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dosažené vzdělání</Label>
                  <Input
                    id="prof-edu"
                    value={profileEducation}
                    onChange={(e) => setProfileEducation(e.target.value)}
                    className="rounded-xl h-11 border-slate-200 focus-visible:ring-indigo-500 font-medium"
                    placeholder="Např. Mgr., Ing."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prof-exp" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Roky praxe</Label>
                  <Input
                    id="prof-exp"
                    type="number"
                    min="0"
                    value={profileYearsOfExperience}
                    onChange={(e) => setProfileYearsOfExperience(e.target.value)}
                    className="rounded-xl h-11 border-slate-200 focus-visible:ring-indigo-500 font-medium"
                    placeholder="Např. 5"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 leading-relaxed shadow-sm">
                <div className="flex gap-2.5 items-start">
                  <span className="text-base shrink-0">💡</span>
                  <div className="space-y-1">
                    <strong className="font-bold">Jak s námi nejlépe komunikovat?</strong>
                    <p className="text-indigo-900/90">
                      Zanechte nám zde své postřehy, nápady na nové funkce, hlášení chyb nebo cokoli, co by vám v iTestu usnadnilo práci. Zpětnou vazbu si osobně čteme a neustále podle ní systém vylepšujeme.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="feedback-text" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vaše zpráva</Label>
                <Textarea
                  id="feedback-text"
                  placeholder="Napište nám své připomínky, návrhy nebo dotazy..."
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  className="rounded-xl min-h-[140px] border-slate-200 focus-visible:ring-indigo-500 resize-none font-medium"
                />
              </div>

              {store.feedbacks && store.feedbacks.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100 mt-6 max-h-[220px] overflow-y-auto pr-1">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Předchozí zprávy</h4>
                  <div className="space-y-2.5">
                    {store.feedbacks.map((f: any) => (
                      <div key={f.id} className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-2 text-left">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] text-slate-500 font-medium font-mono">
                            {new Date(f.createdAt).toLocaleDateString('cs-CZ')} {new Date(f.createdAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            f.status === 'resolved' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {f.status === 'resolved' ? 'Vyřešeno' : 'Čeká na vyřízení'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 leading-relaxed break-words whitespace-pre-wrap">{f.content}</p>
                        {f.adminReply && (
                          <div className="bg-indigo-50/70 border border-indigo-100/50 rounded-lg p-2.5 mt-2 space-y-1 text-left">
                            <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                              💬 Odpověď administrátora:
                            </span>
                            <p className="text-xs font-medium text-slate-850 whitespace-pre-wrap break-words">{f.adminReply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-6 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              className="rounded-xl font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
              onClick={() => setIsProfileModalOpen(false)}
              disabled={isSavingProfile || isSendingFeedback}
            >
              Zrušit
            </Button>
            {activeProfileTab === 'profile' ? (
              <Button
                onClick={handleSaveProfile}
                disabled={isSavingProfile || !profileFirstName.trim() || !profileLastName.trim()}
                className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold px-6"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ukládám...
                  </>
                ) : 'Uložit změny'}
              </Button>
            ) : (
              <Button
                onClick={handleSendFeedback}
                disabled={isSendingFeedback || !feedbackContent.trim()}
                className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold px-6"
              >
                {isSendingFeedback ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Odesílám...
                  </>
                ) : 'Odeslat názor'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderSchoolLicenseModal = () => {
    if (!selectedSchoolForLicense) return null;

    return (
      <Dialog open={isSchoolLicenseModalOpen} onOpenChange={setIsSchoolLicenseModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl border-none shadow-2xl p-6 text-slate-800">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-headline font-bold text-indigo-700 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600 animate-pulse" />
              Správa školní licence
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm leading-relaxed">
              Nastavení licenčních podmínek pro školu <strong>{selectedSchoolForLicense.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateSchoolLicense} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="lic-type" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Typ licence
              </Label>
              <select
                id="lic-type"
                value={editSchoolLicenseType}
                onChange={(e) => {
                  const type = e.target.value as 'free' | 'school';
                  setEditSchoolLicenseType(type);
                  if (type === 'school' && !editSchoolLicenseExpiresAt) {
                    const oneYear = new Date();
                    oneYear.setFullYear(oneYear.getFullYear() + 1);
                    setEditSchoolLicenseExpiresAt(oneYear.toISOString().split('T')[0]);
                  }
                }}
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="free">Bez licence (Free / Zkušební)</option>
                <option value="school">Školní licence (Premium)</option>
              </select>
            </div>

            {editSchoolLicenseType === 'school' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="lic-expires" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Datum expirace
                  </Label>
                  <Input
                    id="lic-expires"
                    type="date"
                    value={editSchoolLicenseExpiresAt}
                    onChange={(e) => setEditSchoolLicenseExpiresAt(e.target.value)}
                    className="rounded-xl h-11 border-slate-200 focus-visible:ring-indigo-500 font-medium"
                    required
                  />
                  <div className="flex gap-2 mt-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[10px] h-7 px-2.5 rounded-lg border-slate-200 font-bold"
                      onClick={() => {
                        const date = new Date();
                        date.setFullYear(date.getFullYear() + 1);
                        setEditSchoolLicenseExpiresAt(date.toISOString().split('T')[0]);
                      }}
                    >
                      +1 rok
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[10px] h-7 px-2.5 rounded-lg border-slate-200 font-bold"
                      onClick={() => {
                        const now = new Date();
                        let targetYear = now.getFullYear();
                        if (now.getMonth() >= 8) {
                          targetYear += 1;
                        }
                        setEditSchoolLicenseExpiresAt(`${targetYear}-08-31`);
                      }}
                    >
                      Konec šk. roku
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lic-max-teachers" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Limit učitelů
                  </Label>
                  <Input
                    id="lic-max-teachers"
                    type="number"
                    min="1"
                    value={editSchoolMaxTeachers}
                    onChange={(e) => setEditSchoolMaxTeachers(Number(e.target.value))}
                    className="rounded-xl h-11 border-slate-200 focus-visible:ring-indigo-500 font-medium"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block font-medium">
                    Maximální počet učitelů, kteří se mohou pod kódem školy zaregistrovat.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="lic-pool-max" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Celoškolní AI fond (Max)
                    </Label>
                    <Input
                      id="lic-pool-max"
                      type="number"
                      min="0"
                      value={editSchoolCreditsPoolMax}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditSchoolCreditsPoolMax(val);
                        if (editSchoolCreditsPool === 0) {
                          setEditSchoolCreditsPool(val);
                        }
                      }}
                      className="rounded-xl h-11 border-slate-200 focus-visible:ring-indigo-500 font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lic-pool-current" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Fond Kredity (Aktuální)
                    </Label>
                    <Input
                      id="lic-pool-current"
                      type="number"
                      min="0"
                      value={editSchoolCreditsPool}
                      onChange={(e) => setEditSchoolCreditsPool(Number(e.target.value))}
                      className="rounded-xl h-11 border-slate-200 focus-visible:ring-indigo-500 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lic-admin" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Správce školy (Ředitel)
                  </Label>
                  {(() => {
                    const schoolTeachers = store.users.filter(u => u.role === 'teacher' && u.schoolId === selectedSchoolForLicense.id);
                    if (schoolTeachers.length === 0) {
                      return (
                        <p className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200/50 p-2.5 rounded-xl">
                          Na této škole zatím nejsou zaregistrováni žádní učitelé. Noví učitelé se musí nejprve registrovat s kódem školy.
                        </p>
                      );
                    }
                    return (
                      <select
                        id="lic-admin"
                        value={editSchoolAdminId}
                        onChange={(e) => setEditSchoolAdminId(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        <option value="">-- Bez správce --</option>
                        {schoolTeachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.username})</option>
                        ))}
                      </select>
                    );
                  })()}
                  <span className="text-[10px] text-muted-foreground mt-0.5 block font-medium">
                    Vyberte učitele, který získá práva správce školy pro rozdělování kreditů a správu testů.
                  </span>
                </div>
              </>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-100 mt-6">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
                onClick={() => {
                  setIsSchoolLicenseModalOpen(false);
                  setSelectedSchoolForLicense(null);
                }}
                disabled={isSavingSchoolLicense}
              >
                Zrušit
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold px-6"
                disabled={isSavingSchoolLicense}
              >
                {isSavingSchoolLicense ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ukládám...
                  </>
                ) : 'Uložit nastavení'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role: loginRole })
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast({ title: "Úspěšně přihlášeno", description: "Vítejte zpět!" });
          // Zde proběhne synchronizace stavu pro aplikaci - použijeme forceLogin z hooku
          store.forceLogin(data.user.id, data.user.role, data.user.username, data.user.name, data.user.classId);
        } else {
          // Fallback na Firebase pokud selže MongoDB
          if (!store.login(loginRole, username, password)) {
            toast({ title: "Přihlášení se nezdařilo", description: data.error, variant: "destructive" });
          } else {
            toast({ title: "Přihlášeno přes starý systém", description: "Doporučujeme vytvořit nový účet v DB." });
          }
        }
      } catch (error) {
        toast({ title: "Chyba serveru", variant: "destructive" });
      }
    } else {
      if (authMode === 'student-register') {
        if (name && username && password && inviteCode) {
          const usernameLower = username.trim().toLowerCase();
          const exists = store.users.some(u => u.username.toLowerCase() === usernameLower);
          if (exists) {
            toast({ title: "Registrace selhala", description: "Tento uživatel (login) již existuje.", variant: "destructive" });
            return;
          }

          try {
            const nameParts = name.trim().split(' ');
            const firstName = nameParts[0] || 'Neznámé';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Neznámé';

            const response = await fetch('/api/students/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firstName,
                lastName,
                username,
                password,
                joinCode: inviteCode.trim()
              })
            });

            const data = await response.json();

            if (!response.ok) {
              toast({ title: "Registrace selhala", description: data.error || "Chyba databáze", variant: "destructive" });
              return;
            }

            // Pokud MongoDB projde, uložíme i do lokálního Firebase store
            store.register(name, username, password);

            // Automatické přihlášení studenta
            const loginResponse = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password, role: 'student' })
            });
            const loginData = await loginResponse.json();

            if (loginData.success) {
              toast({ title: "Registrace úspěšná", description: "Byl jsi úspěšně zaregistrován a přihlášen!" });
              store.forceLogin(loginData.user.id, loginData.user.role, loginData.user.username, loginData.user.name, loginData.user.classId);
            } else {
              setAuthMode('login');
              setLoginRole('student');
              toast({ title: "Registrace úspěšná", description: "Nyní se můžeš přihlásit svým uživatelským jménem a heslem." });
            }
          } catch (error) {
            console.error("Chyba při registraci studenta:", error);
            toast({ title: "Chyba sítě", description: "Nelze se spojit se serverem.", variant: "destructive" });
          }
        } else {
          toast({ title: "Registrace selhala", description: "Vyplňte prosím všechna pole.", variant: "destructive" });
        }
      } else if (name && username && password) {
        const isTrial = authMode === 'register-trial';
        if (!isTrial && !inviteCode.trim()) {
          toast({ title: "Registrace selhala", description: "Zadejte kód školy (zvací kód).", variant: "destructive" });
          return;
        }

        // Kontrola unikátnosti loginu na klientu
        const usernameLower = username.trim().toLowerCase();
        const exists = store.users.some(u => u.username.toLowerCase() === usernameLower);
        if (exists) {
          toast({ title: "Registrace selhala", description: "Tento uživatel (login) již existuje.", variant: "destructive" });
          return;
        }

        try {
          const nameParts = name.split(' ');
          const firstName = nameParts[0] || 'Neznámé';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Neznámé';
          
          const response = await fetch('/api/teachers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName,
              lastName,
              email: `${username}@skola.cz`,
              username,
              password,
              inviteCode: isTrial ? undefined : inviteCode.trim(),
              isTrialRegistration: isTrial,
              subjects: []
            })
          });

          const data = await response.json();

          if (!response.ok) {
            toast({ title: "Registrace selhala", description: data.error || "Chyba databáze", variant: "destructive" });
            return; // Nepokračujeme dál
          }

          // Pokud MongoDB projde, uložíme i do lokálního Firebase store pro kompatibilitu
          store.register(name, username, password);
          setAuthMode('login');
          toast({ title: "Registrace úspěšná", description: isTrial ? "Zkušební účet byl vytvořen, můžete se přihlásit." : "Účet byl vytvořen, můžete se přihlásit." });

        } catch (error) {
          console.error("Chyba při zápisu do MongoDB:", error);
          toast({ title: "Chyba sítě", description: "Nelze se spojit se serverem.", variant: "destructive" });
        }
      }
    }
  };

  const fetchSavedPrompts = async () => {
    try {
      const res = await fetch('/api/ai/pedagog');
      const data = await res.json();
      if (data.success) {
        setAiPedagogSavedPrompts(data.prompts || []);
      }
    } catch (err) {
      console.error("Failed to fetch saved prompts:", err);
    }
  };

  const handleSendAiPedagogMessage = async (textToSend?: string) => {
    const messageText = textToSend !== undefined ? textToSend : aiPedagogMessage;
    if (!messageText.trim()) return;
    const promptText = messageText.trim();
    if (promptText) {
      setPastPrompts(prev => {
        const filtered = prev.filter(p => p !== promptText);
        const updated = [promptText, ...filtered].slice(0, 20);
        if (typeof window !== 'undefined' && store.currentUser) {
          safeLocalStorage.setItem(`past_prompts_${store.currentUser.id}`, JSON.stringify(updated));
        }
        return updated;
      });
    }



    const newUserMessage = { role: 'user' as const, content: messageText };
    const updatedHistory = [...aiPedagogHistory, newUserMessage];
    setAiPedagogHistory(updatedHistory);
    setAiPedagogMessage('');
    setIsAiPedagogGenerating(true);

    try {
      const res = await fetch('/api/ai/pedagog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          promptText: messageText,
          contextText: aiPedagogContext,
          history: aiPedagogHistory,
          apiKey: userGeminiKey || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiPedagogHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
        store.refresh();
      } else {
        toast({
          title: "Chyba AI",
          description: data.error || "Nepodařilo se získat odpověď.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Chyba připojení",
        description: err.message || "Nepodařilo se připojit k serveru.",
        variant: "destructive"
      });
    } finally {
      setIsAiPedagogGenerating(false);
    }
  };

  const handleSavePromptTemplate = async () => {
    if (!newPromptTitle.trim() || !aiPedagogMessage.trim()) {
      toast({ title: "Chyba", description: "Zadejte název šablony a ujistěte se, že máte v textovém poli napsaný prompt.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch('/api/ai/pedagog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'savePrompt',
          title: newPromptTitle,
          content: aiPedagogMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Šablona uložena", description: "Prompt byl úspěšně uložen jako šablona." });
        setNewPromptTitle('');
        setIsSavingPromptModalOpen(false);
        fetchSavedPrompts();
      } else {
        toast({ title: "Chyba", description: data.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Chyba sítě", description: err.message, variant: "destructive" });
    }
  };

  const handleDeletePromptTemplate = async (id: string) => {
    if (!confirm("Opravdu chcete tuto šablonu smazat?")) return;
    try {
      const res = await fetch(`/api/ai/pedagog?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Smazáno", description: "Šablona byla úspěšně smazána." });
        fetchSavedPrompts();
      } else {
        toast({ title: "Chyba", description: data.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Chyba sítě", description: err.message, variant: "destructive" });
    }
  };

  const handleContextFileUpload = async (file: File) => {
    if (!file) return;
    
    if (file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setAiPedagogContext(text);
        setAiPedagogFileName(file.name);
        toast({ title: "Soubor nahrán", description: `Text z ${file.name} byl načten jako kontext.` });
      };
      reader.readAsText(file);
      return;
    }

    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      if (currentUser && currentUser.role === 'teacher' && (currentUser.aiCredits || 0) <= 0) {
        toast({
          title: "Nedostatek kreditů",
          description: "Pro digitalizaci dokumentu nemáte dostatek AI kreditů.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Zpracování souboru",
        description: `Spouštím digitalizaci souboru ${file.name} pomocí AI (může to chvíli trvat)...`,
      });

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Uri = e.target?.result as string;
        if (!base64Uri) return;

        try {
          setIsAiPedagogGenerating(true);
          const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'digitize',
              fileDataUri: base64Uri
            })
          });
          const data = await res.json();
          if (data.success) {
            setAiPedagogContext(data.extractedText || '');
            setAiPedagogFileName(file.name);
            toast({ title: "Dokument digitalizován", description: `Text z ${file.name} byl úspěšně načten.` });
            store.refresh();
          } else {
            toast({
              title: "Digitalizace selhala",
              description: data.error || "Nepodařilo se načíst text z dokumentu.",
              variant: "destructive"
            });
          }
        } catch (err: any) {
          toast({
            title: "Chyba sítě",
            description: err.message || "Nepodařilo se připojit k digitalizační službě.",
            variant: "destructive"
          });
        } finally {
          setIsAiPedagogGenerating(false);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    toast({
      title: "Nepodporovaný formát",
      description: "Nahrajte prosím textový soubor (.txt), PDF nebo obrázek.",
      variant: "destructive"
    });
  };

  const handleExportToPdf = async (content: string) => {
    if (!content) return;
    try {
      const [jsPDFModule, fontsModule] = await Promise.all([
        import('jspdf'),
        import('@/lib/fonts')
      ]);
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
      const { robotoRegularBase64, robotoBoldBase64 } = fontsModule;

      // Clean conversational AI intro/outro from the PDF content
      let pdfContent = content.replace(/\r\n/g, '\n');
      const lines = pdfContent.split('\n');
      let startIdx = 0;
      let endIdx = lines.length;

      let checkedLines = 0;
      for (let i = 0; i < lines.length && checkedLines < 5; i++) {
        const lineTrimmed = lines[i].trim();
        if (lineTrimmed === '') continue;
        checkedLines++;

        const isIntro = 
          /^(dobrý den|rozumím|děkuji|zde je|tady je|rád[a]? vám|milerád[a]?|samozřejmě)/i.test(lineTrimmed) ||
          /koleg(yně|o|yn\s*\/kolego)/i.test(lineTrimmed) ||
          /podle vašich představ/i.test(lineTrimmed) ||
          /bez jakýchkoli doplňujících textů/i.test(lineTrimmed) ||
          /návrh provozního řádu/i.test(lineTrimmed);

        if (isIntro) {
          startIdx = i + 1;
        } else {
          if (lineTrimmed.startsWith('#') || lineTrimmed === '---') {
            break;
          }
        }
      }

      checkedLines = 0;
      for (let i = lines.length - 1; i >= startIdx && checkedLines < 6; i--) {
        const lineTrimmed = lines[i].trim();
        if (lineTrimmed === '') continue;
        checkedLines++;

        const isSignOff =
          /^(s přátelským pozdravem|váš ai|váš pedagogický|přeji vám|přeji hodně|pokud byste|pokud máte|dejte mi|dejte prosím vědět|dejte mi prosím vědět)/i.test(lineTrimmed) ||
          /ai pedagog/i.test(lineTrimmed) ||
          /asistent/i.test(lineTrimmed) ||
          /hodně úspěchů/i.test(lineTrimmed) ||
          /klidné práce/i.test(lineTrimmed) ||
          /doplnit nebo upravit/i.test(lineTrimmed);

        if (isSignOff) {
          endIdx = i;
        } else {
          break;
        }
      }

      pdfContent = lines.slice(startIdx, endIdx).join('\n').trim();
      if (pdfContent.startsWith('---')) {
        pdfContent = pdfContent.substring(3).trim();
      }

      // If the content becomes empty after cleaning, fallback to original
      if (!pdfContent) {
        pdfContent = content.replace(/\r\n/g, '\n');
      }

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Register custom fonts supporting Czech diacritics
      doc.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldBase64);
      doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
      doc.setFont("Roboto", "normal");

      // Layout constants
      const PAGE_WIDTH = 210;
      const PAGE_HEIGHT = 297;
      const MARGIN_LEFT = 20;
      const MARGIN_RIGHT = 20;
      const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 170 mm
      const MARGIN_TOP = 25;
      const MARGIN_BOTTOM = 25;
      const PAGE_LIMIT = PAGE_HEIGHT - MARGIN_BOTTOM;

      let y = MARGIN_TOP;

      // Header/Footer decorations helper
      const drawPageDecoration = () => {
        // Page Header
        doc.setFont("Roboto", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text("iTest Cloud — Výstup AI Pedagoga", MARGIN_LEFT, 12);
        
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.setLineWidth(0.2);
        doc.line(MARGIN_LEFT, 15, PAGE_WIDTH - MARGIN_RIGHT, 15);
      };

      const checkPageSpace = (neededHeight: number) => {
        if (y + neededHeight > PAGE_LIMIT) {
          doc.addPage();
          drawPageDecoration();
          y = MARGIN_TOP;
        }
      };

      // Draw initial decorations on Page 1
      drawPageDecoration();

      // Draw Title Card
      doc.setFillColor(243, 244, 246); // gray-100
      doc.roundedRect(MARGIN_LEFT, y, CONTENT_WIDTH, 18, 2, 2, "F");
      
      doc.setFont("Roboto", "bold");
      doc.setFontSize(16);
      doc.setTextColor(79, 70, 229); // Indigo 600
      doc.text("VÝSTUP AI PEDAGOGA", MARGIN_LEFT + 5, y + 11);

      // Left blue ribbon on Title Card
      doc.setFillColor(79, 70, 229);
      doc.rect(MARGIN_LEFT, y, 1.5, 18, "F");

      y += 26; // move past the header card

      // Markdown block types
      type Block =
        | { type: 'h1'; text: string }
        | { type: 'h2'; text: string }
        | { type: 'h3'; text: string }
        | { type: 'hr' }
        | { type: 'list-item'; marker: string; text: string }
        | { type: 'paragraph'; text: string };

      interface Span {
        text: string;
        bold: boolean;
      }

      // Inline bold tag parser
      const parseSpans = (txt: string): Span[] => {
        const parts = txt.split(/\*\*/g);
        const spans: Span[] = [];
        parts.forEach((part, idx) => {
          if (part !== '') {
            spans.push({
              text: part,
              bold: idx % 2 === 1
            });
          }
        });
        if (spans.length === 0) {
          spans.push({ text: '', bold: false });
        }
        return spans;
      };

      // Word wrapper supporting bold segments
      const wrapSpans = (spans: Span[], maxWidth: number): Span[][] => {
        const lines: Span[][] = [];
        let currentLine: Span[] = [];
        let currentLineWidth = 0;

        interface Token {
          text: string;
          bold: boolean;
          isWhitespace: boolean;
        }

        const tokens: Token[] = [];
        spans.forEach(span => {
          const parts = span.text.split(/(\s+)/g);
          parts.forEach(part => {
            if (part === '') return;
            tokens.push({
              text: part,
              bold: span.bold,
              isWhitespace: /^\s+$/.test(part)
            });
          });
        });

        tokens.forEach(token => {
          doc.setFont("Roboto", token.bold ? "bold" : "normal");
          const tokenWidth = doc.getTextWidth(token.text);

          if (currentLineWidth + tokenWidth > maxWidth) {
            if (token.isWhitespace && currentLine.length === 0) {
              return; // Skip leading whitespace
            }
            if (currentLine.length > 0) {
              lines.push(currentLine);
            }
            currentLine = [];
            currentLineWidth = 0;
            if (token.isWhitespace) {
              return;
            }
          }

          if (currentLine.length > 0 && currentLine[currentLine.length - 1].bold === token.bold) {
            currentLine[currentLine.length - 1].text += token.text;
          } else {
            currentLine.push({ text: token.text, bold: token.bold });
          }
          currentLineWidth += tokenWidth;
        });

        if (currentLine.length > 0) {
          lines.push(currentLine);
        }

        return lines;
      };

      // Parse markdown into blocks
      const rawLines = pdfContent.split('\n');
      const blocks: Block[] = [];

      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        if (line === '') continue;

        if (line === '---' || line === '***' || line === '___') {
          blocks.push({ type: 'hr' });
        } else if (line.startsWith('# ')) {
          blocks.push({ type: 'h1', text: line.substring(2).trim() });
        } else if (line.startsWith('## ')) {
          blocks.push({ type: 'h2', text: line.substring(3).trim() });
        } else if (line.startsWith('### ')) {
          blocks.push({ type: 'h3', text: line.substring(4).trim() });
        } else {
          const listMatch = line.match(/^(?:\*|\-|\d+(?:\.\d+)*\.)\s+(.*)$/);
          if (listMatch) {
            const markerMatch = line.match(/^(?:\*|\-|\d+(?:\.\d+)*\.)/);
            const marker = markerMatch ? markerMatch[0] : '•';
            blocks.push({ type: 'list-item', marker, text: listMatch[1].trim() });
          } else {
            // Merge consecutive paragraph lines
            if (blocks.length > 0 && blocks[blocks.length - 1].type === 'paragraph' && i > 0 && rawLines[i - 1].trim() !== '') {
              const prev = blocks[blocks.length - 1] as { type: 'paragraph'; text: string };
              prev.text += ' ' + line;
            } else {
              blocks.push({ type: 'paragraph', text: line });
            }
          }
        }
      }

      // Render blocks
      blocks.forEach(block => {
        if (block.type === 'hr') {
          checkPageSpace(8);
          doc.setDrawColor(226, 232, 240); // Slate 200
          doc.setLineWidth(0.4);
          doc.line(MARGIN_LEFT, y + 4, PAGE_WIDTH - MARGIN_RIGHT, y + 4);
          y += 8;
        } 
        else if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
          let fontSize = 16;
          let color = [79, 70, 229]; // Indigo Primary
          let lineSpacing = 7;
          let marginBefore = 6;
          let marginAfter = 4;

          if (block.type === 'h1') {
            fontSize = 18;
            color = [79, 70, 229];
            lineSpacing = 8;
            marginBefore = 8;
            marginAfter = 5;
          } else if (block.type === 'h2') {
            fontSize = 14;
            color = [49, 46, 129]; // Indigo Dark
            lineSpacing = 7;
            marginBefore = 7;
            marginAfter = 4;
          } else {
            fontSize = 11;
            color = [30, 41, 59]; // Slate 800
            lineSpacing = 6;
            marginBefore = 5;
            marginAfter = 3;
          }

          // Strip wrapping asterisks in headings for rendering cleanliness
          const cleanText = block.text.replace(/^\*\*(.*)\*\*$/, '$1');
          const spans = parseSpans(cleanText);
          
          doc.setFont("Roboto", "bold");
          doc.setFontSize(fontSize);
          const wrappedLines = wrapSpans(spans, CONTENT_WIDTH);
          
          checkPageSpace(marginBefore + (wrappedLines.length * lineSpacing) + marginAfter);
          y += marginBefore;

          wrappedLines.forEach(lineSpans => {
            let currentX = MARGIN_LEFT;
            lineSpans.forEach(span => {
              doc.setFont("Roboto", "bold"); // Headings are uniformly bold
              doc.setFontSize(fontSize);
              doc.setTextColor(color[0], color[1], color[2]);
              doc.text(span.text, currentX, y);
              currentX += doc.getTextWidth(span.text);
            });
            y += lineSpacing;
          });

          y += marginAfter;
        } 
        else if (block.type === 'paragraph') {
          const fontSize = 10;
          const lineSpacing = 5.5;
          const marginBefore = 2;
          const marginAfter = 4;

          const spans = parseSpans(block.text);
          doc.setFont("Roboto", "normal");
          doc.setFontSize(fontSize);
          const wrappedLines = wrapSpans(spans, CONTENT_WIDTH);

          checkPageSpace(marginBefore + (wrappedLines.length * lineSpacing) + marginAfter);
          y += marginBefore;

          wrappedLines.forEach(lineSpans => {
            let currentX = MARGIN_LEFT;
            lineSpans.forEach(span => {
              doc.setFont("Roboto", span.bold ? "bold" : "normal");
              doc.setFontSize(fontSize);
              doc.setTextColor(55, 65, 81); // Slate 700
              doc.text(span.text, currentX, y);
              currentX += doc.getTextWidth(span.text);
            });
            y += lineSpacing;
          });

          y += marginAfter;
        } 
        else if (block.type === 'list-item') {
          const fontSize = 10;
          const lineSpacing = 5.5;
          const marginBefore = 1.5;
          const marginAfter = 2;
          const listIndent = 8; // mm
          const textWidth = CONTENT_WIDTH - listIndent;

          // Strip wrapping asterisks in list items for neatness
          const cleanText = block.text.replace(/^\*\*(.*)\*\*$/, '$1');
          const spans = parseSpans(cleanText);
          
          doc.setFont("Roboto", "normal");
          doc.setFontSize(fontSize);
          const wrappedLines = wrapSpans(spans, textWidth);

          checkPageSpace(marginBefore + (wrappedLines.length * lineSpacing) + marginAfter);
          y += marginBefore;

          wrappedLines.forEach((lineSpans, lineIdx) => {
            let currentX = MARGIN_LEFT + listIndent;

            if (lineIdx === 0) {
              doc.setFont("Roboto", "bold");
              doc.setFontSize(fontSize);
              doc.setTextColor(79, 70, 229); // Indigo 600

              let marker = block.marker;
              if (marker === '*' || marker === '-') {
                marker = '•';
              }
              doc.text(marker, MARGIN_LEFT + 2, y);
            }

            lineSpans.forEach(span => {
              doc.setFont("Roboto", span.bold ? "bold" : "normal");
              doc.setFontSize(fontSize);
              doc.setTextColor(55, 65, 81); // Slate 700
              doc.text(span.text, currentX, y);
              currentX += doc.getTextWidth(span.text);
            });
            y += lineSpacing;
          });

          y += marginAfter;
        }
      });

      // Post-process: Add footer page numbers
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        doc.setFont("Roboto", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate 400
        
        // Left footer text
        doc.text("iTest Cloud — Generováno AI Pedagogem", MARGIN_LEFT, PAGE_HEIGHT - 12);
        
        // Right footer page number
        const pageText = `Stránka ${i} z ${totalPages}`;
        const pageTextWidth = doc.getTextWidth(pageText);
        doc.text(pageText, PAGE_WIDTH - MARGIN_RIGHT - pageTextWidth, PAGE_HEIGHT - 12);

        // Thin separator line
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.setLineWidth(0.2);
        doc.line(MARGIN_LEFT, PAGE_HEIGHT - 16, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 16);
      }

      doc.save("ai-pedagog-vystup.pdf");
      toast({ title: "PDF staženo", description: "Dokument byl úspěšně vyexportován a stažen." });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Export selhal",
        description: err.message || "Nepodařilo se vygenerovat PDF.",
        variant: "destructive"
      });
    }
  };



  const handleAddClass = () => {
    if (newClassName.trim()) {
      store.addClass(newClassName);
      setNewClassName('');
      setIsAddingClass(false);
    }
  };

  const handleImportCSV = async () => {
    if (!csvClassName.trim()) {
      toast({ title: "Chyba", description: "Zadejte prosím název nové třídy.", variant: "destructive" });
      return;
    }
    if (!csvFile) {
      toast({ title: "Chyba", description: "Vyberte prosím CSV soubor k importu.", variant: "destructive" });
      return;
    }

    setCsvParsingError(null);
    setCsvImportProgress('Čtení souboru...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setCsvParsingError('Nepodařilo se přečíst obsah souboru.');
        setCsvImportProgress('');
        return;
      }

      try {
        setCsvImportProgress('Analyzování CSV...');
        // Rozdělení na řádky
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length < 2) {
          setCsvParsingError('CSV soubor musí obsahovat záhlaví a alespoň jednoho žáka.');
          setCsvImportProgress('');
          return;
        }

        // Detekce oddělovače (středník nebo čárka)
        const header = lines[0];
        let delimiter = ';';
        if (header.includes(',')) {
          const semicolonsCount = (header.match(/;/g) || []).length;
          const commasCount = (header.match(/,/g) || []).length;
          if (commasCount > semicolonsCount) {
            delimiter = ',';
          }
        }

        const headers = header.split(delimiter).map(h => h.trim().toLowerCase());
        const nameIdx = headers.findIndex(h => h.includes('jméno') || h.includes('jmeno') || h.includes('name') || h.includes('student'));
        const usernameIdx = headers.findIndex(h => h.includes('uživ') || h.includes('uziv') || h.includes('user') || h.includes('login'));
        const passwordIdx = headers.findIndex(h => h.includes('heslo') || h.includes('pass'));

        if (nameIdx === -1) {
          setCsvParsingError('V CSV nebyl nalezen sloupec pro jméno (např. "Jméno").');
          setCsvImportProgress('');
          return;
        }

        const studentsToCreate: Array<{ name: string, username: string, password?: string }> = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length <= nameIdx) continue;

          const fullName = cols[nameIdx];
          if (!fullName) continue;

          let username = usernameIdx !== -1 && cols[usernameIdx]
            ? cols[usernameIdx].toLowerCase()
            : fullName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");

          const password = passwordIdx !== -1 && cols[passwordIdx]
            ? cols[passwordIdx]
            : '123456';

          studentsToCreate.push({ name: fullName, username, password });
        }

        if (studentsToCreate.length === 0) {
          setCsvParsingError('V CSV nebyli nalezeni žádní platní žáci.');
          setCsvImportProgress('');
          return;
        }

        setCsvImportProgress(`Vytváření třídy "${csvClassName}"...`);

        // Voláme store.addClass, který třídu vytvoří v DB (a Firestore) a vrátí vygenerované ID
        const classId = store.addClass(csvClassName);
        if (!classId) {
          throw new Error('Nepodařilo se vytvořit novou třídu v databázi.');
        }

        let successCount = 0;
        let duplicateCount = 0;

        for (let idx = 0; idx < studentsToCreate.length; idx++) {
          const s = studentsToCreate[idx];
          setCsvImportProgress(`Zápis žáka ${idx + 1} z ${studentsToCreate.length} (${s.name})...`);

          const nameParts = s.name.split(' ');
          const firstName = nameParts[0] || 'Neznámé';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Neznámé';

          const studentRes = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName,
              lastName,
              username: s.username,
              password: s.password,
              classroomId: classId
            })
          });

          if (studentRes.ok) {
            const resData = await studentRes.json();
            const createdStudent = resData.data;
            successCount++;
            store.addStudent(classId, s.name, s.username, s.password, createdStudent._id);
          } else {
            const data = await studentRes.json();
            if (data.error && data.error.includes("již existuje")) {
              duplicateCount++;
              const altUsername = `${s.username}${Math.floor(10 + Math.random() * 90)}`;
              const altRes = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  firstName,
                  lastName,
                  username: altUsername,
                  password: s.password,
                  classroomId: classId
                })
              });
              if (altRes.ok) {
                const altData = await altRes.json();
                const createdStudent = altData.data;
                successCount++;
                store.addStudent(classId, s.name, altUsername, s.password, createdStudent._id);
              }
            }
          }
        }

        toast({
          title: "Import dokončen!",
          description: `Třída "${csvClassName}" byla vytvořena se ${successCount} žáky. (Duplicity loginů: ${duplicateCount})`
        });

        // Reset
        setCsvClassName('');
        setCsvFile(null);
        setIsImportingCSV(false);
        setCsvImportProgress('');
      } catch (err: any) {
        console.error(err);
        setCsvParsingError(err.message || 'Při importu došlo k chybě.');
        setCsvImportProgress('');
      }
    };

    reader.onerror = () => {
      setCsvParsingError('Čtení souboru selhalo.');
      setCsvImportProgress('');
    };

    reader.readAsText(csvFile, 'UTF-8');
  };

  const handleImportCSVToExisting = async () => {
    const classId = targetClassId || selectedClassId;
    if (!classId) {
      toast({ title: "Chyba", description: "Nebyla vybrána žádná třída.", variant: "destructive" });
      return;
    }
    const classroom = store.classes.find(c => c.id === classId);
    const className = classroom ? classroom.name : "třídy";

    if (!csvFile) {
      toast({ title: "Chyba", description: "Vyberte prosím CSV soubor k importu.", variant: "destructive" });
      return;
    }

    setCsvParsingError(null);
    setCsvImportProgress('Čtení souboru...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setCsvParsingError('Nepodařilo se přečíst obsah souboru.');
        setCsvImportProgress('');
        return;
      }

      try {
        setCsvImportProgress('Analyzování CSV...');
        // Rozdělení na řádky
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length < 2) {
          setCsvParsingError('CSV soubor musí obsahovat záhlaví a alespoň jednoho žáka.');
          setCsvImportProgress('');
          return;
        }

        // Detekce oddělovače (středník nebo čárka)
        const header = lines[0];
        let delimiter = ';';
        if (header.includes(',')) {
          const semicolonsCount = (header.match(/;/g) || []).length;
          const commasCount = (header.match(/,/g) || []).length;
          if (commasCount > semicolonsCount) {
            delimiter = ',';
          }
        }

        const headers = header.split(delimiter).map(h => h.trim().toLowerCase());
        const nameIdx = headers.findIndex(h => h.includes('jméno') || h.includes('jmeno') || h.includes('name') || h.includes('student'));
        const usernameIdx = headers.findIndex(h => h.includes('uživ') || h.includes('uziv') || h.includes('user') || h.includes('login'));
        const passwordIdx = headers.findIndex(h => h.includes('heslo') || h.includes('pass'));

        if (nameIdx === -1) {
          setCsvParsingError('V CSV nebyl nalezen sloupec pro jméno (např. "Jméno").');
          setCsvImportProgress('');
          return;
        }

        const studentsToCreate: Array<{ name: string, username: string, password?: string }> = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length <= nameIdx) continue;

          const fullName = cols[nameIdx];
          if (!fullName) continue;

          let username = usernameIdx !== -1 && cols[usernameIdx]
            ? cols[usernameIdx].toLowerCase()
            : fullName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");

          const password = passwordIdx !== -1 && cols[passwordIdx]
            ? cols[passwordIdx]
            : '123456';

          studentsToCreate.push({ name: fullName, username, password });
        }

        if (studentsToCreate.length === 0) {
          setCsvParsingError('V CSV nebyli nalezeni žádní platní žáci.');
          setCsvImportProgress('');
          return;
        }

        let successCount = 0;
        let duplicateCount = 0;

        for (let idx = 0; idx < studentsToCreate.length; idx++) {
          const s = studentsToCreate[idx];
          setCsvImportProgress(`Zápis žáka ${idx + 1} z ${studentsToCreate.length} (${s.name})...`);

          const nameParts = s.name.split(' ');
          const firstName = nameParts[0] || 'Neznámé';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Neznámé';

          const studentRes = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName,
              lastName,
              username: s.username,
              password: s.password,
              classroomId: classId
            })
          });

          if (studentRes.ok) {
            const resData = await studentRes.json();
            const createdStudent = resData.data;
            successCount++;
            store.addStudent(classId, s.name, s.username, s.password, createdStudent._id);
          } else {
            const data = await studentRes.json();
            if (data.error && data.error.includes("již existuje")) {
              duplicateCount++;
              const altUsername = `${s.username}${Math.floor(10 + Math.random() * 90)}`;
              const altRes = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  firstName,
                  lastName,
                  username: altUsername,
                  password: s.password,
                  classroomId: classId
                })
              });
              if (altRes.ok) {
                const altData = await altRes.json();
                const createdStudent = altData.data;
                successCount++;
                store.addStudent(classId, s.name, altUsername, s.password, createdStudent._id);
              }
            }
          }
        }

        toast({
          title: "Import dokončen!",
          description: `Do třídy "${className}" bylo úspěšně přidáno ${successCount} žáků. (Duplicity loginů: ${duplicateCount})`
        });

        // Reset
        setCsvFile(null);
        setCsvImportProgress('');
        setIsAddingStudent(false);
      } catch (err: any) {
        console.error(err);
        setCsvParsingError(err.message || 'Při importu došlo k chybě.');
        setCsvImportProgress('');
      }
    };

    reader.onerror = () => {
      setCsvParsingError('Čtení souboru selhalo.');
      setCsvImportProgress('');
    };

    reader.readAsText(csvFile, 'UTF-8');
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentUsername.trim() || !newStudentPassword.trim()) {
      toast({ title: "Chyba", description: "Musíte vyplnit všechna pole (jméno, login i heslo).", variant: "destructive" });
      return;
    }

    const classId = targetClassId || selectedClassId;
    if (!classId) {
      toast({ title: "Chyba", description: "Musíte vybrat cílovou třídu.", variant: "destructive" });
      return;
    }

    // Kontrola unikátnosti loginu na klientu
    const studentUsernameLower = newStudentUsername.trim().toLowerCase();
    const exists = store.users.some(u => u.username.toLowerCase() === studentUsernameLower);
    if (exists) {
      toast({ title: "Chyba", description: "Tento uživatel (login) již existuje.", variant: "destructive" });
      return;
    }
    
    try {
      const nameParts = newStudentName.split(' ');
      const firstName = nameParts[0] || 'Neznámé';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Neznámé';

      const studentRes = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          username: newStudentUsername,
          password: newStudentPassword,
          classroomId: classId
        })
      });

      const data = await studentRes.json();

      if (!studentRes.ok) {
        toast({ title: "Registrace žáka selhala", description: data.error || "Chyba databáze", variant: "destructive" });
        return; // DŮLEŽITÉ: Nepokračujeme dál, abychom nezavřeli modal a nesmazali data učitele
      }

      // Uložení s reálným ID z MongoDB
      store.addStudent(classId, newStudentName, newStudentUsername, newStudentPassword, data.data._id);

      toast({ title: "Žák zapsán", description: "Žák byl úspěšně vytvořen v databázi i cloudu." });

      setNewStudentName('');
      setNewStudentUsername('');
      setNewStudentPassword('');
      setIsAddingStudent(false);
      setTargetClassId(null);
    } catch (error) {
      console.error("Chyba při zápisu žáka do MongoDB:", error);
      toast({ title: "Chyba sítě", description: "Nelze se spojit se serverem.", variant: "destructive" });
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#EFF3F7] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (monitorAssignmentId) {
    if (!store.isLoaded) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
          <p className="text-slate-450 animate-pulse font-medium">Načítám rozhraní pro sledování...</p>
        </div>
      );
    }
    return (
      <LiveMonitor
        assignmentId={monitorAssignmentId}
        store={store}
        onClose={() => {
          setMonitorAssignmentId(null);
        }}
      />
    );
  }

  if (!store.currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200/50 to-indigo-50/50 flex items-center justify-center p-4 py-8 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl w-full mx-auto items-stretch">
          
          {/* Levý sloupec - AI Pedagog asistent */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/40 rounded-3xl p-8 flex flex-col justify-between shadow-xl space-y-6">
            <div className="space-y-4">
              <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center shadow-inner">
                <Sparkles className="text-amber-600 w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-black text-gray-800 tracking-tight">Co je AI-pedagog?</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Váš inteligentní asistent pro každodenní školskou legislativu, administrativní úkony a diplomatickou komunikaci s rodiči.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200/60">
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">⚖️</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">Školská legislativa</p>
                    <p className="text-xs text-slate-500">Rychlé vyhledávání a rady k zákonům, vyhláškám, ŠVP/RVP a klasifikačním řádům (Školský zákon 561/2004 Sb.).</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">✉️</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">Diplomatická komunikace</p>
                    <p className="text-xs text-slate-500">Snadné a rychlé formulování citlivých, profesionálních odpovědí na e-maily od rodičů.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">🔍</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">Reakce na ČŠI</p>
                    <p className="text-xs text-slate-500">Podpora a formulace odpovědí při zpracovávání zpráv, doporučení a podnětů České školní inspekce.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">📐</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">Provozní řády učeben</p>
                    <p className="text-xs text-slate-500">Tvorba řádů odborných učeben a bezpečnostních směrnic (chemie, fyzika, IT, tělocvičny) v souladu s předpisy.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">👨‍🏫</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">Metodické postupy</p>
                    <p className="text-xs text-slate-500">Pomoc s plánováním výuky, tvorbou osnov, metodickým vedením a řešením kázňských prohřešků.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-medium pt-4 border-t border-slate-100">
              © 2026 AI-pedagog / iTest. Všechna práva vyhrazena.
            </div>
          </div>

          {/* Prostřední sloupec - Přihlášení / Registrace */}
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white flex flex-col justify-between">
            <CardHeader className="text-center space-y-4 bg-primary text-white pb-6 pt-8 shrink-0">
              <div className="bg-white/20 w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg transform -rotate-6">
                <School className="text-white w-7 h-7" />
              </div>
              <div className="space-y-1">
                <CardTitle className="font-headline text-3xl">AI-pedagog / iTest</CardTitle>
                <CardDescription className="text-white/70">Zadávání testů a AI pedagogická asistence v cloudu.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex-1 flex flex-col justify-center">
              <form onSubmit={handleAuth} className="space-y-6">
                {authMode !== 'student-register' ? (
                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-4 border-b pb-4">
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('login')}
                      className={`text-sm font-bold pb-2 border-b-2 -mb-5 transition-all text-center ${authMode === 'login' ? 'border-primary text-primary font-black' : 'border-transparent text-muted-foreground hover:text-slate-800'}`}
                    >Přihlášení</button>
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('register')}
                      className={`text-sm font-bold pb-2 border-b-2 -mb-5 transition-all text-center ${authMode === 'register' ? 'border-primary text-primary font-black' : 'border-transparent text-muted-foreground hover:text-slate-800'}`}
                    >Registrace s kódem</button>
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('register-trial')}
                      className={`text-sm font-bold pb-2 border-b-2 -mb-5 transition-all text-center ${authMode === 'register-trial' ? 'border-primary text-primary font-black' : 'border-transparent text-muted-foreground hover:text-slate-800'}`}
                    >Zkouška zdarma</button>
                  </div>
                ) : (
                  <div className="mb-4 border-b pb-4 flex justify-between items-center">
                    <span className="text-sm font-black text-primary">Registrace žáka</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setLoginRole('student');
                        setName('');
                        setInviteCode('');
                        setUsername('');
                        setPassword('');
                      }}
                      className="text-xs font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
                    >
                      ← Zpět na přihlášení
                    </button>
                  </div>
                )}

                {authMode === 'login' && (
                  <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl">
                    <button 
                      type="button" 
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${loginRole === 'teacher' ? 'bg-white shadow text-primary font-black' : 'text-gray-500 hover:text-gray-900'}`}
                      onClick={() => setLoginRole('teacher')}
                    >Učitel</button>
                    <button 
                      type="button" 
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${loginRole === 'student' ? 'bg-white shadow text-primary font-black' : 'text-gray-500 hover:text-gray-900'}`}
                      onClick={() => setLoginRole('student')}
                    >Student</button>
                  </div>
                )}

                <div className="space-y-4">
                  {(authMode === 'register' || authMode === 'register-trial' || authMode === 'student-register') && (
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-700">Vaše jméno</Label>
                      <Input placeholder={authMode === 'student-register' ? "Michal Novák" : "Mgr. Jan Novák"} value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  )}
                  {authMode === 'register' && (
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-700">Kód školy (zvací kód)</Label>
                      <Input placeholder="např. testskola" value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  )}
                  {authMode === 'student-register' && (
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-700">Kód třídy (od učitele)</Label>
                      <Input placeholder="např. A8X2B7" value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Uživatelské jméno</Label>
                    <Input placeholder={authMode === 'student-register' ? "michal.novak" : "jan.novak"} value={username} onChange={e => setUsername(e.target.value)} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Heslo</Label>
                    <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl" />
                  </div>
                </div>
                
                <Button type="submit" className="w-full h-12 text-base font-headline font-bold shadow-lg rounded-xl">
                  {authMode === 'login' ? 'Vstoupit do iTestu' : authMode === 'register' ? 'Vytvořit účet' : authMode === 'student-register' ? 'Zaregistrovat se a přihlásit' : 'Vytvořit zkušební účet'}
                </Button>

                {authMode === 'login' && loginRole === 'student' && (
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('student-register');
                        setName('');
                        setInviteCode('');
                        setUsername('');
                        setPassword('');
                      }}
                      className="text-xs font-bold text-indigo-650 hover:text-indigo-850 hover:underline transition-all"
                    >
                      🎓 Nemáš účet? Zaregistruj se přes kód třídy
                    </button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Pravý sloupec - Co je iTest */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/40 rounded-3xl p-8 flex flex-col justify-between shadow-xl space-y-6">
            <div className="space-y-4">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center shadow-inner">
                <PenTool className="text-indigo-650 w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-black text-gray-800 tracking-tight">Co je iTest?</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Moderní cloudová platforma pro online zkoušení, interaktivní zadávání a automatické hodnocení žákovských prací.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200/60">
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">📝</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">Interaktivní testování</p>
                    <p className="text-xs text-slate-500">Tvorba testů s pokročilou podporou matematických grafů, os, číselných os a doplňovaček.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">🎨</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">Kreslicí plátno</p>
                    <p className="text-xs text-slate-500">Žáci vypracovávají a kreslí grafy i geometrické úlohy přímo na plátně (tablet, mobil, PC).</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">🤖</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">AI vyhodnocení</p>
                    <p className="text-xs text-slate-500">Automatické a poloautomatické AI známkování odpovědí a ručních kreseb šetří hodiny času.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">📊</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">Okamžité výsledky</p>
                    <p className="text-xs text-slate-500">Přehledná žákovská knížka, statistika úspěšnosti třídy a reaktivní známkování bez reloadů.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">🔒</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">Bezpečné školní prostředí</p>
                    <p className="text-xs text-slate-500">Bezpečná a izolovaná data pro každou školu se samostatnými zvacími kódy.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-medium pt-4 border-t border-slate-100 text-right">
              iTest Cloud © 2026. Všechna práva vyhrazena.
            </div>
          </div>

        </div>
      </div>
    );
  }

  const currentUser = store.currentUser;


  if (currentUser.role === 'admin' || currentUser.role === 'teacher') {
    if (teacherMode === 'hub') {
      return (
        <TeacherHub 
          userName={currentUser.name} 
          onSelectMode={setTeacherMode} 
          onLogout={() => store.logout()}
          isAdmin={currentUser.role === 'admin'}
          aiLogs={store.aiLogs}
          users={store.users}
        />
      );
    }
    
    if (teacherMode === 'ai') {
      return (
        <AiPedagogDashboard 
          userName={currentUser.name}
          onBack={() => setTeacherMode('hub')}
          aiLogs={store.aiLogs}
          setAiLogs={store.setAiLogs}
          onGenerateTest={handleGenerateTestFromAi}
          isGeneratingQuestions={isGeneratingQuestions}
          assignments={store.assignments.filter(a => a.teacherId === currentUser.id || !a.teacherId)}
          customAiTemplates={currentUser.customAiTemplates}
          onAddCustomTemplate={store.addCustomAiTemplate}
        />
      );
    }
  }

  if (currentUser.role === 'admin' && teacherMode === 'admin-dashboard') {
    const rawTeachers = store.users.filter(u => u.role === 'teacher');
    const rawStudents = store.users.filter(u => u.role === 'student');
    const rawClassrooms = store.classes;
    const rawAssignments = store.assignments;
    const submissions = store.submissions;

    // Apply filtering and sorting for Učitelé (Teachers)
    const teachers = rawTeachers.filter(t => {
      const matchesSchool = adminSchoolFilter === 'all' || t.schoolId === adminSchoolFilter;
      const matchesSearch = !adminSearchFilter.trim() || 
        t.name.toLowerCase().includes(adminSearchFilter.toLowerCase()) || 
        t.username.toLowerCase().includes(adminSearchFilter.toLowerCase());
      return matchesSchool && matchesSearch;
    }).sort((a, b) => {
      let comparison = 0;
      if (adminSortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (adminSortBy === 'school') {
        const schoolA = schools.find(s => s.id === a.schoolId)?.name || '';
        const schoolB = schools.find(s => s.id === b.schoolId)?.name || '';
        comparison = schoolA.localeCompare(schoolB);
      }
      return adminSortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply filtering and sorting for Žáci (Students)
    const students = rawStudents.filter(s => {
      const matchesSchool = adminSchoolFilter === 'all' || s.schoolId === adminSchoolFilter;
      const matchesSearch = !adminSearchFilter.trim() || 
        s.name.toLowerCase().includes(adminSearchFilter.toLowerCase()) || 
        s.username.toLowerCase().includes(adminSearchFilter.toLowerCase());
      return matchesSchool && matchesSearch;
    }).sort((a, b) => {
      let comparison = 0;
      if (adminSortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (adminSortBy === 'school') {
        const schoolA = schools.find(s => s.id === a.schoolId)?.name || '';
        const schoolB = schools.find(s => s.id === b.schoolId)?.name || '';
        comparison = schoolA.localeCompare(schoolB);
      }
      return adminSortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply filtering and sorting for Třídy (Classes)
    const classrooms = rawClassrooms.filter(c => {
      const matchesSchool = adminSchoolFilter === 'all' || c.schoolId === adminSchoolFilter;
      const matchesSearch = !adminSearchFilter.trim() || 
        c.name.toLowerCase().includes(adminSearchFilter.toLowerCase());
      return matchesSchool && matchesSearch;
    }).sort((a, b) => {
      let comparison = 0;
      if (adminSortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (adminSortBy === 'school') {
        const schoolA = schools.find(s => s.id === a.schoolId)?.name || '';
        const schoolB = schools.find(s => s.id === b.schoolId)?.name || '';
        comparison = schoolA.localeCompare(schoolB);
      }
      return adminSortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply filtering and sorting for Úkoly (Assignments)
    const assignments = rawAssignments.filter(a => {
      const matchesSchool = adminSchoolFilter === 'all' || a.schoolId === adminSchoolFilter;
      const matchesSearch = !adminSearchFilter.trim() || 
        a.title.toLowerCase().includes(adminSearchFilter.toLowerCase());
      return matchesSchool && matchesSearch;
    }).sort((a, b) => {
      let comparison = 0;
      if (adminSortBy === 'name') {
        comparison = a.title.localeCompare(b.title);
      } else if (adminSortBy === 'school') {
        const schoolA = schools.find(s => s.id === a.schoolId)?.name || '';
        const schoolB = schools.find(s => s.id === b.schoolId)?.name || '';
        comparison = schoolA.localeCompare(schoolB);
      }
      return adminSortOrder === 'asc' ? comparison : -comparison;
    });

    return (
      <div className="min-h-screen flex flex-col bg-[#EFF3F7]">
        <Navbar 
          user={currentUser} 
          onLogout={() => store.logout()} 
          onUpgradeClick={() => setIsUpgradeModalOpen(true)} 
          onProfileClick={() => setIsProfileModalOpen(true)}
          showPortalLink={true}
          onPortalClick={() => setTeacherMode('hub')}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
                Nástěnka administrátora
              </h1>
              <p className="text-muted-foreground">
                Přehled a správa všech učitelů, tříd, žáků a úkolů v systému iTest.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 border border-primary/20 text-primary font-bold px-4 py-2 rounded-full text-sm">
                Root administrátorský přístup
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            <Card 
              className={`border-none shadow-md cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${adminTab === 'overview' ? 'ring-2 ring-primary bg-white' : 'bg-white'}`}
              onClick={() => setAdminTab('overview')}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <LayoutDashboard className="w-8 h-8 text-primary" />
                <p className="text-sm font-semibold text-muted-foreground">Přehled</p>
                <p className="text-2xl font-black text-primary">Hlavní</p>
              </CardContent>
            </Card>

            <Card 
              className={`border-none shadow-md cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${adminTab === 'schools' ? 'ring-2 ring-primary bg-white' : 'bg-white'}`}
              onClick={() => setAdminTab('schools')}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <School className="w-8 h-8 text-violet-500" />
                <p className="text-sm font-semibold text-muted-foreground">Školy</p>
                <p className="text-2xl font-black text-violet-500">{schools.length}</p>
              </CardContent>
            </Card>

            <Card 
              className={`border-none shadow-md cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${adminTab === 'school_admins' ? 'ring-2 ring-primary bg-white' : 'bg-white'}`}
              onClick={() => setAdminTab('school_admins')}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <Shield className="w-8 h-8 text-indigo-600" />
                <p className="text-sm font-semibold text-muted-foreground">Správci</p>
                <p className="text-2xl font-black text-indigo-600">
                  {store.users.filter(u => u.role === 'teacher' && u.isSchoolAdmin).length}
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`border-none shadow-md cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${adminTab === 'teachers' ? 'ring-2 ring-primary bg-white' : 'bg-white'}`}
              onClick={() => setAdminTab('teachers')}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <GraduationCap className="w-8 h-8 text-accent" />
                <p className="text-sm font-semibold text-muted-foreground">Učitelé</p>
                <p className="text-2xl font-black text-accent">{teachers.length}</p>
              </CardContent>
            </Card>

            <Card 
              className={`border-none shadow-md cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${adminTab === 'classes' ? 'ring-2 ring-primary bg-white' : 'bg-white'}`}
              onClick={() => setAdminTab('classes')}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <School className="w-8 h-8 text-green-500" />
                <p className="text-sm font-semibold text-muted-foreground">Třídy</p>
                <p className="text-2xl font-black text-green-500">{classrooms.length}</p>
              </CardContent>
            </Card>

            <Card 
              className={`border-none shadow-md cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${adminTab === 'students' ? 'ring-2 ring-primary bg-white' : 'bg-white'}`}
              onClick={() => setAdminTab('students')}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <Users className="w-8 h-8 text-indigo-500" />
                <p className="text-sm font-semibold text-muted-foreground">Žáci</p>
                <p className="text-2xl font-black text-indigo-500">{students.length}</p>
              </CardContent>
            </Card>

            <Card 
              className={`border-none shadow-md cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${adminTab === 'assignments' ? 'ring-2 ring-primary bg-white' : 'bg-white'}`}
              onClick={() => setAdminTab('assignments')}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <ClipboardList className="w-8 h-8 text-amber-500" />
                <p className="text-sm font-semibold text-muted-foreground">Úkoly</p>
                <p className="text-2xl font-black text-amber-500">{assignments.length}</p>
              </CardContent>
            </Card>

            <Card 
              className={`border-none shadow-md cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${adminTab === 'feedback' ? 'ring-2 ring-primary bg-white' : 'bg-white'}`}
              onClick={() => setAdminTab('feedback')}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-rose-500" />
                <p className="text-sm font-semibold text-muted-foreground">Feedback</p>
                <p className="text-2xl font-black text-rose-500">{store.feedbacks ? store.feedbacks.length : 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Tab View */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-6 md:p-8">
              {adminTab === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h3 className="text-2xl font-headline font-bold text-gray-800">Aktuální stav platformy</h3>
                    <p className="text-muted-foreground text-sm">Rychlé statistiky a nedávné aktivity na platformě iTest Cloud.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-2xl border space-y-4">
                      <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" /> Celková odevzdání prací
                      </h4>
                      <p className="text-3xl font-black text-primary">{submissions.length} odevzdaných prací</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Žáci úspěšně vypracovali a odevzdali celkem {submissions.length} digitálních testů a výkresů za posledních 30 dní.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border space-y-4">
                      <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <School className="w-5 h-5 text-green-500" /> Rozložení žáků ve třídách
                      </h4>
                      <p className="text-3xl font-black text-green-500">
                        {classrooms.length > 0 ? Math.round(students.length / classrooms.length) : 0} žáků / třída
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        V průměru připadá přibližně {classrooms.length > 0 ? (students.length / classrooms.length).toFixed(1) : 0} žáků na jednu vytvořenou školní třídu v databázi.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-lg text-gray-800">Rychlý rozcestník administrátora</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <Button variant="outline" className="h-16 rounded-xl font-bold justify-start px-6 gap-3 shadow-sm" onClick={() => setAdminTab('schools')}>
                        <School className="w-5 h-5 text-violet-500" /> Zobrazit školy →
                      </Button>
                      <Button variant="outline" className="h-16 rounded-xl font-bold justify-start px-6 gap-3 shadow-sm" onClick={() => setAdminTab('school_admins')}>
                        <Shield className="w-5 h-5 text-indigo-650" /> Zobrazit správce →
                      </Button>
                      <Button variant="outline" className="h-16 rounded-xl font-bold justify-start px-6 gap-3 shadow-sm" onClick={() => setAdminTab('teachers')}>
                        <GraduationCap className="w-5 h-5 text-accent" /> Zobrazit učitele →
                      </Button>
                      <Button variant="outline" className="h-16 rounded-xl font-bold justify-start px-6 gap-3 shadow-sm" onClick={() => setAdminTab('classes')}>
                        <School className="w-5 h-5 text-green-500" /> Zobrazit třídy →
                      </Button>
                      <Button variant="outline" className="h-16 rounded-xl font-bold justify-start px-6 gap-3 shadow-sm" onClick={() => setAdminTab('students')}>
                        <Users className="w-5 h-5 text-indigo-500" /> Zobrazit žáky →
                      </Button>
                      <Button variant="outline" className="h-16 rounded-xl font-bold justify-start px-6 gap-3 shadow-sm" onClick={() => setAdminTab('assignments')}>
                        <ClipboardList className="w-5 h-5 text-amber-500" /> Zobrazit úkoly →
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'teachers' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-headline font-bold text-gray-800">Seznam Učitelů</h3>
                      <p className="text-muted-foreground text-sm">Správa a přehled všech registrovaných učitelských účtů.</p>
                    </div>
                    <Button 
                      className="rounded-full shadow-md bg-accent hover:bg-accent/90"
                      onClick={() => setIsAddingTeacher(true)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" /> Přidat učitele
                    </Button>
                  </div>

                  {/* Unified Search, Filter and Sort Bar */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="🔍 Hledat podle jména nebo loginu..." 
                          value={adminSearchFilter} 
                          onChange={e => setAdminSearchFilter(e.target.value)} 
                          className="bg-white h-10 pl-3 rounded-xl"
                        />
                      </div>
                      <div className="w-full sm:w-64">
                        <select 
                          value={adminSchoolFilter} 
                          onChange={e => setAdminSchoolFilter(e.target.value)}
                          className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="all">🏫 Všechny školy</option>
                          {schools.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                      <select 
                        value={adminSortBy} 
                        onChange={e => setAdminSortBy(e.target.value as any)}
                        className="flex h-10 rounded-xl border border-input bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="default">↕️ Výchozí řazení</option>
                        <option value="name">🔤 Podle jména</option>
                        <option value="school">🏫 Podle školy</option>
                      </select>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-white border border-input"
                        onClick={() => setAdminSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        title={adminSortOrder === 'asc' ? 'Vzestupně' : 'Sestupně'}
                      >
                        {adminSortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="p-4 font-bold text-gray-700 text-sm">Jméno učitele</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Uživatelské jméno</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Přístupové heslo</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Škola</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Spravované třídy</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Tarif / Premium</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Akce</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {teachers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-muted-foreground">V systému zatím nejsou žádní učitelé.</td>
                          </tr>
                        ) : (
                          teachers.map(t => {
                            const managedClasses = classrooms.filter(c => c.teacherId === t.id);
                            const now = new Date();
                            const isPremium = !!(t.isPremium && (!t.premiumExpiresAt || new Date(t.premiumExpiresAt) > now));
                            const premiumDaysLeft = t.premiumExpiresAt ? Math.max(0, Math.ceil((new Date(t.premiumExpiresAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0;
                            const createdTime = t.createdAt ? new Date(t.createdAt).getTime() : Date.now();
                            const trialDurationMs = 90 * 24 * 60 * 60 * 1000;
                            const timeSinceCreation = Date.now() - createdTime;
                            const trialDaysLeft = Math.max(0, Math.ceil((trialDurationMs - timeSinceCreation) / (24 * 60 * 60 * 1000)));
                            const isTrialExpired = !isPremium && (timeSinceCreation > trialDurationMs);

                            return (
                              <tr key={t.id} className="hover:bg-gray-50/50">
                                <td className="p-4 font-bold text-primary flex items-center gap-2 flex-wrap">
                                  <GraduationCap className="w-4 h-4 text-accent shrink-0" /> 
                                  <span>{t.name}</span>
                                  {t.isSchoolAdmin && (
                                    <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-250 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                      Správce
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-sm text-gray-600 font-mono">{t.username}</td>
                                <td className="p-4 text-sm text-primary font-mono font-bold">{t.password || 'Nenastaveno'}</td>
                                <td className="p-4 text-sm text-gray-600 font-semibold">
                                  {schools.find(s => s.id === t.schoolId)?.name || 'Bez školy / Admin'}
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-wrap gap-1.5">
                                    {managedClasses.length === 0 ? (
                                      <span className="text-xs text-muted-foreground italic">Žádné třídy</span>
                                    ) : (
                                      managedClasses.map(c => (
                                        <Badge key={c.id} variant="secondary" className="font-semibold">{c.name}</Badge>
                                      ))
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center gap-2">
                                        <div className="flex flex-col">
                                          {isPremium ? (
                                            <>
                                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200/50 px-2 py-0.5 rounded-full w-max flex items-center gap-1">
                                                <Crown className="w-3 h-3 fill-amber-500 text-amber-500" /> Premium ({t.premiumType === 'yearly' ? 'Roční' : t.premiumType === 'school' ? 'Školní' : t.premiumType === 'trial' ? 'Zkušební' : 'Měsíční'})
                                              </span>
                                              <span className="text-[10px] text-muted-foreground mt-1 font-medium">zbývá {premiumDaysLeft} dní</span>
                                            </>
                                          ) : isTrialExpired ? (
                                            <>
                                              <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200/50 px-2 py-0.5 rounded-full w-max">
                                                Zkušební verze vypršela
                                              </span>
                                              <span className="text-[10px] text-muted-foreground mt-1 font-medium">0 dní</span>
                                            </>
                                          ) : (
                                            <>
                                              <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full w-max">
                                                Zkušební verze
                                              </span>
                                              <span className="text-[10px] text-muted-foreground mt-1 font-medium">zbývá {trialDaysLeft} dní</span>
                                            </>
                                          )}
                                        </div>
                                        <div className="text-[10px] font-semibold text-indigo-950 font-mono bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg flex flex-col shrink-0">
                                          <span>AI: {t.aiCredits !== undefined ? t.aiCredits : 30} / {t.aiCreditsMax || 30}</span>
                                          {t.aiExtraCredits ? <span className="text-[9px] text-indigo-600 font-bold font-sans">+{t.aiExtraCredits} extra</span> : null}
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap gap-1">
                                        {isPremium ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-[9px] px-2 rounded-xl font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => store.toggleUserPremium(t.id, true)}
                                          >
                                            Zrušit Premium
                                          </Button>
                                        ) : (
                                          <>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-6 text-[9px] px-2 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none"
                                              onClick={() => store.toggleUserPremium(t.id, false, 'monthly')}
                                            >
                                              Aktivovat Měsíční
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-6 text-[9px] px-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white border-none"
                                              onClick={() => store.toggleUserPremium(t.id, false, 'yearly')}
                                            >
                                              Aktivovat Roční
                                            </Button>
                                             <Button variant="outline" size="sm" className="h-6 text-[9px] px-2 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white border-none" onClick={() => store.toggleUserPremium(t.id, false, "school")}>Aktivovat Školní</Button>
                                          </>
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-6 text-[9px] px-2 rounded-xl font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                          onClick={() => store.addTeacherCredits(t.id, 50)}
                                        >
                                          +50 kr.
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className={`h-6 text-[9px] px-2 rounded-xl font-bold ${t.isSchoolAdmin ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100' : 'border-indigo-250 text-indigo-700 hover:bg-indigo-50'}`}
                                          onClick={() => store.toggleSchoolAdmin(t.id, !t.isSchoolAdmin)}
                                        >
                                          {t.isSchoolAdmin ? 'Zrušit správce' : '🛡️ Udělat správcem'}
                                        </Button>
                                        <div className="flex items-center gap-1 ml-1">
                                          <Input
                                            type="number"
                                            placeholder="vlastní"
                                            value={customCredits[t.id] ?? ''}
                                            onChange={e => setCustomCredits(prev => ({ ...prev, [t.id]: e.target.value }))}
                                            className="h-6 w-14 text-[9px] px-1 bg-white rounded-lg border border-slate-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-offset-0"
                                          />
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-[9px] px-1.5 rounded-xl font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                            onClick={() => {
                                              const amount = parseInt(customCredits[t.id] || '0');
                                              if (amount > 0) {
                                                store.addTeacherCredits(t.id, amount);
                                                setCustomCredits(prev => ({ ...prev, [t.id]: '' }));
                                              } else {
                                                toast({
                                                  title: "Chyba",
                                                  description: "Zadejte platné kladné číslo.",
                                                  variant: "destructive"
                                                });
                                              }
                                            }}
                                          >
                                            Přidat
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                  {t.id === currentUser.id ? (
                                    <span className="text-xs text-muted-foreground italic bg-gray-100 px-2 py-1 rounded-full border">Aktivní účet</span>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => setDeleteTarget({ type: 'teacher', id: t.id, name: t.name })}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminTab === 'classes' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-2xl font-headline font-bold text-gray-800">Školní třídy</h3>
                    <p className="text-muted-foreground text-sm">Rozklikněte jakoukoli třídu pro detailní seznam žáků a zadaných prací.</p>
                  </div>

                  {/* Unified Search, Filter and Sort Bar */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="🔍 Hledat podle názvu třídy..." 
                          value={adminSearchFilter} 
                          onChange={e => setAdminSearchFilter(e.target.value)} 
                          className="bg-white h-10 pl-3 rounded-xl"
                        />
                      </div>
                      <div className="w-full sm:w-64">
                        <select 
                          value={adminSchoolFilter} 
                          onChange={e => setAdminSchoolFilter(e.target.value)}
                          className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="all">🏫 Všechny školy</option>
                          {schools.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                      <select 
                        value={adminSortBy} 
                        onChange={e => setAdminSortBy(e.target.value as any)}
                        className="flex h-10 rounded-xl border border-input bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="default">↕️ Výchozí řazení</option>
                        <option value="name">🔤 Podle názvu třídy</option>
                        <option value="school">🏫 Podle školy</option>
                      </select>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-white border border-input"
                        onClick={() => setAdminSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        title={adminSortOrder === 'asc' ? 'Vzestupně' : 'Sestupně'}
                      >
                        {adminSortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {classrooms.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground bg-gray-50 border rounded-2xl">
                        V systému zatím nejsou vytvořeny žádné třídy.
                      </div>
                    ) : (
                      classrooms.map(c => {
                        const classTeacher = teachers.find(t => t.id === c.teacherId);
                        const classStudents = students.filter(s => s.classId === c.id);
                        const classAssignments = assignments.filter(a => a.classId === c.id);
                        const isExpanded = expandedSubjects[c.id];

                        return (
                          <Card key={c.id} className="border-none shadow-sm bg-gray-50/70 overflow-hidden">
                            <CardContent className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50" onClick={() => setExpandedSubjects(prev => ({ ...prev, [c.id]: !isExpanded }))}>
                              <div className="flex items-center gap-4">
                                <School className="w-6 h-6 text-green-500" />
                                <div>
                                  <h4 className="font-black text-xl text-gray-800 flex items-center gap-2">
                                    {c.name}
                                    <Badge variant="outline" className="text-[10px] py-0 font-normal text-muted-foreground">
                                      {schools.find(s => s.id === c.schoolId)?.name || 'Bez školy'}
                                    </Badge>
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    Třídní učitel: <span className="font-bold text-gray-700">{classTeacher ? classTeacher.name : 'Nespecifikován'}</span>
                                    {c.joinCode && (
                                      <span className="ml-3 font-semibold text-slate-500">
                                        Kód třídy: <span className="font-mono bg-slate-200 px-1 py-0.5 rounded text-primary font-bold">{c.joinCode}</span>
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-full text-primary hover:bg-primary/5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRenameTarget({ id: c.id, name: c.name });
                                    setNewClassNameVal(c.name);
                                  }}
                                  title="Přejmenovat třídu"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-gray-700">{classStudents.length} žáků</p>
                                  <p className="text-xs text-muted-foreground">{classAssignments.length} úkolů</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget({ type: 'classroom', id: c.id, name: c.name });
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <span className="text-gray-400">
                                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </span>
                              </div>
                            </CardContent>

                            {isExpanded && (
                              <div className="p-6 bg-white border-t border-gray-100 grid md:grid-cols-2 gap-6 animate-fade-in">
                                {/* Students list */}
                                <div className="space-y-3">
                                  <h5 className="font-bold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                                    <Users className="w-4 h-4 text-indigo-500" /> Žáci ve třídě ({classStudents.length})
                                  </h5>
                                  <div className="divide-y border rounded-xl overflow-hidden bg-gray-50/30 max-h-64 overflow-y-auto">
                                    {classStudents.length === 0 ? (
                                      <p className="p-4 text-sm text-muted-foreground italic text-center">Tato třída nemá žádné zapsané žáky.</p>
                                    ) : (
                                      classStudents.map(s => (
                                        <div key={s.id} className="p-3 flex justify-between items-center text-sm">
                                          <span className="font-bold text-gray-800">{s.name}</span>
                                          <span className="text-xs text-muted-foreground font-mono bg-gray-100 px-2 py-0.5 rounded border">Login: {s.username}</span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Assignments list */}
                                <div className="space-y-3">
                                  <h5 className="font-bold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-amber-500" /> Zadané úkoly a práce ({classAssignments.length})
                                  </h5>
                                  <div className="divide-y border rounded-xl overflow-hidden bg-gray-50/30 max-h-64 overflow-y-auto">
                                    {classAssignments.length === 0 ? (
                                      <p className="p-4 text-sm text-muted-foreground italic text-center">Pro tuto třídu nebyly zadány žádné úkoly.</p>
                                    ) : (
                                      classAssignments.map(a => {
                                        const subCount = submissions.filter(s => s.assignmentId === a.id).length;
                                        return (
                                          <div key={a.id} className={`p-3 flex justify-between items-center text-sm ${a.isDraft ? 'bg-amber-50/50' : ''}`}>
                                            <div className="space-y-0.5">
                                              <p className="font-bold text-gray-800 flex items-center gap-2">
                                                {a.title}
                                                {a.isDraft && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">KONCEPT</span>}
                                              </p>
                                              <p className="text-[10px] text-muted-foreground">Předmět: {a.subject || 'Obecný'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {a.isDraft
                                                ? <Badge variant="outline" className="font-bold text-amber-600 bg-amber-50 border-amber-200">Neuveřejněno</Badge>
                                                : <Badge variant="outline" className="font-bold text-primary bg-primary/5">{subCount} odevzdání</Badge>
                                              }
                                              <a
                                                href={`/print/${a.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-primary">
                                                  <Printer className="w-4 h-4" />
                                                </Button>
                                              </a>
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {adminTab === 'students' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-headline font-bold text-gray-800">Seznam Žáků</h3>
                      <p className="text-muted-foreground text-sm">Přehled všech zapsaných žáků ve všech třídách platformy.</p>
                    </div>
                    <Button 
                      className="rounded-full shadow-md"
                      onClick={() => {
                        setTargetClassId(null);
                        setIsAddingStudent(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" /> Zapsat žáka
                    </Button>
                  </div>

                  {/* Unified Search, Filter and Sort Bar */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="🔍 Hledat podle jména nebo loginu..." 
                          value={adminSearchFilter} 
                          onChange={e => setAdminSearchFilter(e.target.value)} 
                          className="bg-white h-10 pl-3 rounded-xl"
                        />
                      </div>
                      <div className="w-full sm:w-64">
                        <select 
                          value={adminSchoolFilter} 
                          onChange={e => setAdminSchoolFilter(e.target.value)}
                          className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="all">🏫 Všechny školy</option>
                          {schools.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                      <select 
                        value={adminSortBy} 
                        onChange={e => setAdminSortBy(e.target.value as any)}
                        className="flex h-10 rounded-xl border border-input bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="default">↕️ Výchozí řazení</option>
                        <option value="name">🔤 Podle jména</option>
                        <option value="school">🏫 Podle školy</option>
                      </select>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-white border border-input"
                        onClick={() => setAdminSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        title={adminSortOrder === 'asc' ? 'Vzestupně' : 'Sestupně'}
                      >
                        {adminSortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="p-4 font-bold text-gray-700 text-sm">Celé jméno žáka</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Uživatelské jméno</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Škola</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Přiřazená třída</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Přístupové heslo</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Akce</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {students.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-muted-foreground">V systému zatím nejsou registrovaní žádní žáci.</td>
                          </tr>
                        ) : (
                          students.map(s => {
                            const classroom = classrooms.find(c => c.id === s.classId);
                            return (
                              <tr key={s.id} className="hover:bg-gray-50/50">
                                <td className="p-4 font-bold text-indigo-600 flex items-center gap-2">
                                  <Users className="w-4 h-4 text-indigo-500" /> {s.name}
                                </td>
                                <td className="p-4 text-sm text-gray-600 font-mono">{s.username}</td>
                                <td className="p-4 text-sm text-gray-600 font-semibold">
                                  {schools.find(sc => sc.id === s.schoolId)?.name || 'Bez školy'}
                                </td>
                                <td className="p-4">
                                  {classroom ? (
                                    <Badge variant="outline" className="font-bold text-green-600 bg-green-50 border-green-100">{classroom.name}</Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">Bez třídy</span>
                                  )}
                                </td>
                                <td className="p-4 text-sm text-primary font-mono font-bold">{s.password || 'Nenastaveno'}</td>
                                <td className="p-4 flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-full text-xs font-bold gap-1 px-3"
                                    onClick={() => {
                                      setEditingStudentId(s.id);
                                      setNewPasswordVal(s.password || '');
                                    }}
                                  >
                                    <PenTool className="w-3.5 h-3.5" /> Změnit heslo
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setDeleteTarget({ type: 'student', id: s.id, name: s.name })}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminTab === 'assignments' && (
                <div className="space-y-6 animate-fade-in">
                  {adminViewingAssignmentId ? (() => {
                    const a = store.assignments.find(x => x.id === adminViewingAssignmentId);
                    if (!a) return null;
                    const creator = store.users.find(u => u.id === a.teacherId) || store.users.find(u => (u as any).teacherId === a.teacherId);
                    const classroom = store.classes.find(c => c.id === a.classId);
                    const assignmentSubmissions = store.submissions.filter(s => s.assignmentId === a.id);
                    return (
                      <div className="space-y-6">
                        {/* Záhlaví detail testu */}
                        <div className="flex items-center justify-between gap-4">
                          <Button variant="ghost" className="rounded-full" onClick={() => {
                            setAdminViewingAssignmentId(null);
                            setViewingSubmission(null);
                          }}>
                            ← Zpět na přehled testů
                          </Button>
                          {!viewingSubmission && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 flex items-center gap-1.5 h-8"
                              onClick={() => downloadAllSubmissionsZip(a.id)}
                            >
                              📥 Stáhnout ZIP s PDF
                            </Button>
                          )}
                        </div>

                        {viewingSubmission ? (
                          /* === DETAIL ODEVZDANÉ PRÁCE === */
                          <div className="space-y-6">
                            <Button variant="ghost" className="rounded-full" onClick={() => setViewingSubmission(null)}>← Zpět na odevzdání</Button>
                            {(() => {
                              const sub = store.submissions.find(s => s.id === viewingSubmission);
                              const assignment = store.assignments.find(x => x.id === sub?.assignmentId);
                              const student = store.users.find(u => u.id === sub?.studentId);
                              if (!sub || !assignment || !student) return null;
                              return (
                                <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                                  <CardHeader className="bg-white border-b p-8 flex flex-row items-center justify-between gap-4">
                                    <div>
                                      <CardTitle className="font-headline text-3xl text-primary">{assignment.title}</CardTitle>
                                      <CardDescription>Odevzdal: {student.name}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Button
                                        variant="outline"
                                        className="rounded-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 flex items-center gap-1.5 h-10 shadow-sm"
                                        onClick={() => {
                                          if (confirm("Opravdu chcete smazat toto odevzdání? Žák bude moci test vypracovat a odevzdat znovu.")) {
                                            store.deleteSubmission(sub.id);
                                            setViewingSubmission(null);
                                          }
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" /> Smazat práci (Reset)
                                      </Button>
                                      <a
                                        href={`/print/submission/${sub.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Button 
                                          className="rounded-full shadow-md bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                                        >
                                          🖨️ Tisk / Uložit PDF
                                        </Button>
                                      </a>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="p-8 space-y-8">
                                    {assignment.questions && assignment.questions.length > 0 && (
                                      <div className="space-y-4">
                                        <label className="text-sm font-bold uppercase text-primary">Odpovědi na otázky</label>
                                        <div className="space-y-4">
                                          {assignment.questions.map((q, index) => {
                                            const answer = sub.answers?.[q.id];
                                            const drawing = sub.questionDrawings?.[q.id];
                                            return (
                                              <div key={q.id} className="p-4 bg-gray-50 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="flex-1 space-y-2">
                                                  <div className="flex justify-between items-start mb-2">
                                                    <p className="font-semibold">{index + 1}. {q.text}</p>
                                                    <Badge variant="outline">
                                                      {q.type === 'short_answer' ? 'Krátká odpověď' :
                                                       q.type === 'long_answer' ? 'Dlouhá odpověď' :
                                                       q.type === 'multiple_choice' ? 'Výběr z možností' :
                                                       q.type === 'axis' ? 'Osa X/Y' :
                                                       q.type === 'number_line' ? 'Číselná osa' : q.type === 'true_false' ? 'Ano / Ne' :
                                                       q.type === 'drawing' ? 'Kresba' :
                                               q.type === 'graph' ? 'Graf' :
                                               q.type === 'cloze' ? 'Doplňovačka' :
                                               q.type === 'audio' ? 'Poslech / Diktát' : q.type}
                                                    </Badge>
                                                  </div>
                                                  {q.type !== 'drawing' && q.type !== 'graph' && q.type !== 'axis' && q.type !== 'number_line' && q.type !== 'cloze' && q.type !== 'audio' && (
                                                    <div className="mt-2">
                                                      <span className="text-sm font-medium text-muted-foreground mr-2">Odpověď:</span>
                                                      {answer === undefined || answer === null || answer === '' ? (
                                                        <span className="italic text-gray-400">Neodpovězeno</span>
                                                      ) : q.type === 'multiple_choice' ? (
                                                        <span className="font-bold">{String.fromCharCode(65 + Number(answer))}. {q.options?.[Number(answer)]}</span>
                                                      )  : q.type === 'true_false' ? (
                                                        <span className="font-bold">{answer ? '✓ Ano' : '✗ Ne'}</span>
                                                      ) : (
                                                        <span className="font-bold whitespace-pre-wrap">{String(answer)}</span>
                                                      )}
                                                    </div>
                                                  )}

                                                  {q.type === 'audio' && (
                                                    <div className="mt-2 space-y-2">
                                                      <div className="bg-slate-100 p-2.5 rounded-lg border text-xs">
                                                        <span className="font-bold text-slate-700 block mb-1">Zadání diktátu (učitel):</span>
                                                        {q.audioText && <p className="italic text-slate-600 mb-1">"{q.audioText}"</p>}
                                                        {q.audioUri && <audio src={q.audioUri} controls className="h-8 w-full max-w-xs mt-1" />}
                                                      </div>
                                                      <div>
                                                        <span className="text-sm font-medium text-slate-700 mr-2">Odpověď studenta:</span>
                                                        {answer ? (
                                                          <span className="font-semibold text-slate-800 bg-white px-2 py-1 border rounded">{String(answer)}</span>
                                                        ) : (
                                                          <span className="italic text-gray-400">Neodpovězeno</span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}

                                                  {q.type === 'cloze' && (
                                                    <div className="mt-2 text-left">
                                                      <span className="text-sm font-medium text-muted-foreground block mb-1">Odpověď (doplňovačka):</span>
                                                      {answer === undefined || answer === null || Object.keys(answer).length === 0 ? (
                                                        <span className="italic text-gray-400">Neodpovězeno</span>
                                                      ) : (
                                                        <div className="p-3 bg-white rounded-xl border border-slate-200 leading-relaxed text-slate-800 font-medium text-sm inline-block">
                                                          {(() => {
                                                            const parts = parseClozeText(q.clozeText || q.text || '');
                                                            const given = answer && typeof answer === 'object' ? answer : {};
                                                            return parts.map((part, idx) => {
                                                              if (part.type === 'text') {
                                                                return <span key={idx}>{part.text}</span>;
                                                              } else {
                                                                const studentVal = String(given[part.index!] || '').trim();
                                                                const correctVal = String(part.correctAnswer || '').trim();
                                                                const isPartCorrect = studentVal.toLowerCase() === correctVal.toLowerCase();

                                                                if (!studentVal) {
                                                                  return (
                                                                    <span
                                                                      key={idx}
                                                                      className="mx-1 px-1.5 py-0.5 rounded bg-yellow-50 border border-yellow-300 text-yellow-700 text-xs font-bold"
                                                                    >
                                                                      [chybí, správně: {correctVal}]
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
                                                                      <span className="line-through opacity-70">{studentVal}</span>
                                                                      <span className="text-green-700 font-bold ml-1">({correctVal})</span> ✗
                                                                    </span>
                                                                  );
                                                                }
                                                              }
                                                            });
                                                          })()}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                  {q.type === 'graph' && (
                                                    <div className="mt-2 w-full">
                                                      <GraphQuestionEvaluation
                                                        question={q}
                                                        studentAnswer={answer}
                                                        score={evalScores[q.id]}
                                                        maxPoints={q.points || 1}
                                                      />
                                                    </div>
                                                  )}
                                                  
                                                 {drawing && (
                                                   <div className="mt-3 space-y-2 w-full text-left">
                                                     <div className="flex items-center justify-between gap-4 select-none print-exclude">
                                                       <span className="text-sm font-medium text-muted-foreground">Přiložená kresba:</span>
                                                       <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-full border shadow-sm">
                                                         <span>Velikost náhledu:</span>
                                                         <input 
                                                           type="range"
                                                           min="150"
                                                           max="1200"
                                                           step="50"
                                                           value={teacherPreviewHeights[q.id] || 256}
                                                           onChange={(e) => {
                                                             const val = parseInt(e.target.value);
                                                             setTeacherPreviewHeights(prev => ({ ...prev, [q.id]: val }));
                                                           }}
                                                           className="w-24 sm:w-32 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                                         />
                                                         <span className="text-[10px] font-mono text-primary font-bold">{teacherPreviewHeights[q.id] || 256}px</span>
                                                       </div>
                                                     </div>
                                                     <img 
                                                       src={drawing} 
                                                       className="border rounded-xl max-w-full object-contain bg-white" 
                                                       style={{ maxHeight: `${teacherPreviewHeights[q.id] || 256}px` }} 
                                                     />
                                                   </div>
                                                 )}

                                                 {q.type === 'axis' && (
                                                   <div className="mt-2 w-full">
                                                     <AxisQuestionEvaluation
                                                       question={q}
                                                       studentAnswer={answer}
                                                       score={evalScores[q.id]}
                                                       maxPoints={q.points || 1}
                                                     />
                                                   </div>
                                                 )}


                                                 {q.type === 'number_line' && (


                                                   <div className="mt-2 w-full">


                                                     <NumberLineQuestionEvaluation


                                                       question={q}


                                                       studentAnswer={answer}


                                                       score={evalScores[q.id]}


                                                       maxPoints={q.points || 1}


                                                     />


                                                   </div>


                                                 )}
                                                  {drawing && (
                                                    <div className="mt-3">
                                                      <span className="text-sm font-medium text-muted-foreground block mb-1">Přiložená kresba:</span>
                                                      <img src={drawing} className="border rounded-xl max-w-full max-h-64 object-contain bg-white" />
                                                    </div>
                                                  )}
                                                  {sub.questionFeedback && (sub.questionFeedback instanceof Map ? sub.questionFeedback.get(q.id) : (sub.questionFeedback as Record<string, string>)[q.id]) && (
                                                    <div className="mt-3 p-3 text-xs font-semibold text-indigo-700 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col gap-1 text-left">
                                                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">💡 Vysvětlení AI</span>
                                                      <span className="font-medium text-indigo-900 leading-relaxed">{sub.questionFeedback instanceof Map ? sub.questionFeedback.get(q.id) : (sub.questionFeedback as Record<string, string>)[q.id]}</span>
                                                    </div>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border self-stretch md:self-auto justify-center md:justify-start">
                                                  <span className="text-sm font-bold text-muted-foreground">Body:</span>
                                                  <input 
                                                    type="number"
                                                    min="0"
                                                    max={q.points || 1}
                                                    value={evalScores[q.id] !== undefined ? evalScores[q.id] : 0}
                                                    onChange={(e) => {
                                                      const val = Math.min(q.points || 1, Math.max(0, parseInt(e.target.value) || 0));
                                                      setEvalScores(prev => ({ ...prev, [q.id]: val }));
                                                    }}
                                                    className="w-12 text-center font-bold text-primary border bg-gray-50 rounded p-1"
                                                  />
                                                  <span className="text-sm font-bold text-muted-foreground">/ {q.points || 1}</span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    {sub.mainWorkDrawing && (
                                      <div className="space-y-2">
                                        <label className="text-sm font-bold uppercase text-primary">Vypracovaný dokument</label>
                                        <img src={sub.mainWorkDrawing} className="w-full border rounded-2xl" />
                                      </div>
                                    )}
                                    {/* Výsledky hodnocení */}
                                    {(() => {
                                      const totalMax = assignment.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;
                                      const totalEarned = assignment.questions?.reduce((acc, q) => acc + (evalScores[q.id] || 0), 0) || 0;
                                      const pct = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
                                      
                                      const thresholds = assignment.gradeThresholds || [85, 65, 45, 25];
                                      let suggestedGrade = 5;
                                      if (pct >= (thresholds[0] ?? 85)) suggestedGrade = 1;
                                      else if (pct >= (thresholds[1] ?? 65)) suggestedGrade = 2;
                                      else if (pct >= (thresholds[2] ?? 45)) suggestedGrade = 3;
                                      else if (pct >= (thresholds[3] ?? 25)) suggestedGrade = 4;

                                      if (assignment.isPractice) {
                                        return (
                                          <div className="space-y-6 border-t pt-6">
                                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex justify-between items-center">
                                              <span className="font-bold text-primary">Celkové skóre:</span>
                                              <span className="text-2xl font-black text-primary">{totalEarned} / {totalMax} bodů ({pct} %)</span>
                                            </div>
                                            
                                            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl space-y-3 text-left">
                                              <div className="text-indigo-800 font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
                                                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                                                Neznámkované procvičování vyhodnoceno AI
                                              </div>
                                              <p className="text-sm font-medium text-indigo-950 leading-relaxed">
                                                Tento úkol slouží jako procvičování. Byl automaticky vyhodnocen pomocí AI (Gemini) při odevzdání žákem. Jako učitel jej nemusíte kontrolovat ani známkovat.
                                              </p>
                                              {sub.feedback && (
                                                <div className="mt-3 p-4 bg-white rounded-xl border border-indigo-100">
                                                  <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Vygenerované hodnocení AI:</span>
                                                  <p className="text-sm font-medium text-slate-800 italic leading-relaxed">"{sub.feedback}"</p>
                                                </div>
                                              )}
                                            </div>

                                            {/* Výsledky pro tiskovou verzi */}
                                            <div className="hidden print:block space-y-6 border-t pt-6 mt-6">
                                              <div className="flex justify-between items-center bg-gray-50 p-5 rounded-2xl border">
                                                <span className="font-bold text-lg text-gray-700">Vyhodnocení:</span>
                                                <span className="text-4xl font-black text-primary">Procvičování</span>
                                              </div>
                                              {sub.feedback && (
                                                <div className="space-y-2">
                                                  <span className="font-bold text-sm text-gray-500 uppercase block">Hodnocení AI:</span>
                                                  <p className="p-5 bg-gray-50 rounded-2xl border font-medium text-gray-800 whitespace-pre-wrap leading-relaxed">{sub.feedback}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div className="space-y-6 border-t pt-6">
                                          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex justify-between items-center">
                                            <span className="font-bold text-primary">Celkové skóre:</span>
                                            <span className="text-2xl font-black text-primary">{totalEarned} / {totalMax} bodů ({pct} %)</span>
                                          </div>

                                          <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                              <label className="text-sm font-bold uppercase text-primary">Hodnocení (Známka)</label>
                                              <span className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                                                Návrh: známka {suggestedGrade} ({pct} %)
                                              </span>
                                            </div>
                                            <GradePicker 
                                              selected={evalGrade} 
                                              suggested={suggestedGrade}
                                              onSelect={(v) => {
                                                setEvalGrade(v);
                                                setIsGradeManuallySet(true);
                                              }} 
                                            />
                                          </div>

                                          <div className="space-y-4 pt-4 print-exclude">
                                            <div className="space-y-1.5 text-left bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl">
                                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                💡 Specifické pokyny pro AI slovní hodnocení (nepovinné)
                                              </label>
                                              <Textarea 
                                                placeholder="Např.: Napiš to přátelsky a povzbudivě, zdůrazni co šlo skvěle a v čem má přidat, napiš to ve 3 odrážkách..."
                                                value={aiInstructions}
                                                onChange={(e) => setAiInstructions(e.target.value)}
                                                className="bg-white rounded-xl min-h-[60px] text-sm font-medium border-slate-200 resize-none"
                                                rows={2}
                                              />
                                            </div>
                                            <Button 
                                              type="button"
                                              variant="outline" 
                                              className="w-full text-indigo-700 border-indigo-200 hover:bg-indigo-50 flex items-center justify-center gap-2 rounded-full font-bold h-11"
                                              onClick={() => handleAiGrade(assignment, sub, aiInstructions)}
                                              disabled={isAiGrading}
                                            >
                                              {isAiGrading ? (
                                                <>
                                                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                                  <span>Gemini analyzuje odpovědi a výkresy...</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Sparkles className="w-4 h-4 text-indigo-500" />
                                                  <span>Navrhnout hodnocení pomocí AI (Gemini)</span>
                                                </>
                                              )}
                                            </Button>
                                            <Textarea 
                                              placeholder="Slovní hodnocení..." 
                                              value={evalFeedback}
                                              onChange={(e) => setEvalFeedback(e.target.value)}
                                            />
                                            <div className="flex flex-col sm:flex-row gap-3">
                                              <Button 
                                                className="flex-1 h-12 rounded-full font-bold shadow-md bg-primary hover:bg-primary/95 text-white" 
                                                onClick={() => {
                                                  store.gradeSubmission(sub.id, evalGrade || 0, evalFeedback, evalScores);
                                                  setViewingSubmission(null);
                                                }}
                                              >
                                                Uložit hodnocení v cloudu
                                              </Button>
                                              {store.currentUser?.role === 'admin' && (
                                                <Button 
                                                  variant="destructive" 
                                                  className="h-12 px-6 rounded-full font-bold shadow-md flex items-center gap-2"
                                                  onClick={() => {
                                                    if (confirm("Opravdu chcete smazat známku z tohoto testu? Test se vrátí do neohodnoceného stavu.")) {
                                                      store.gradeSubmission(sub.id, 0, "", {});
                                                      setViewingSubmission(null);
                                                    }
                                                  }}
                                                >
                                                  Odstranit známku
                                                </Button>
                                              )}
                                            </div>
                                          </div>

                                          {/* Výsledky pro tiskovou verzi */}
                                          <div className="hidden print:block space-y-6 border-t pt-6 mt-6">
                                            <div className="flex justify-between items-center bg-gray-50 p-5 rounded-2xl border">
                                              <span className="font-bold text-lg text-gray-700">Výsledná známka:</span>
                                              <span className="text-4xl font-black text-primary">{evalGrade || sub.grade || 'Nehodnoceno'}</span>
                                            </div>
                                            {evalFeedback && (
                                              <div className="space-y-2">
                                                <span className="font-bold text-sm text-gray-500 uppercase block">Slovní hodnocení:</span>
                                                <p className="p-5 bg-gray-50 rounded-2xl border font-medium text-gray-800 whitespace-pre-wrap leading-relaxed">{evalFeedback}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </CardContent>
                                </Card>
                              );
                            })()}
                          </div>
                        ) : (
                          /* === SEZNAM ODEVZDÁNÍ TESTU === */
                          <div className="space-y-4">
                            <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
                              <CardHeader className="bg-primary/5 border-b px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <ClipboardList className="w-5 h-5 text-primary" />
                                  <div>
                                    <CardTitle className="text-xl font-headline text-primary">{a.title}</CardTitle>
                                    <CardDescription className="text-sm mt-0.5">
                                      {classroom ? `Třída: ${classroom.name}` : ''}{creator ? ` · Učitel: ${creator.name}` : ''}
                                      {a.startTime ? ` · Od: ${formatDateTime(a.startTime)}` : ''}
                                      {a.endTime ? ` · Do: ${formatDateTime(a.endTime)}` : ''}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="p-0">
                                {assignmentSubmissions.length === 0 ? (
                                  <div className="p-8 text-center text-muted-foreground">
                                    <span className="text-3xl block mb-2">📭</span>
                                    <p className="font-medium">Zatím žádná odevzdání</p>
                                  </div>
                                ) : (
                                  <div className="divide-y">
                                    {assignmentSubmissions.map(s => {
                                      const student = store.users.find(u => u.id === s.studentId);
                                      const totalMax = a.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;
                                      let earned = 0;
                                      if (s.questionScores) {
                                        Object.values(s.questionScores).forEach(val => { earned += val as number; });
                                      }
                                      const pct = totalMax > 0 ? Math.round((earned / totalMax) * 100) : 0;
                                      return (
                                        <div
                                          key={s.id}
                                          onClick={() => {
                                            setEvalScores(s.questionScores ? { ...s.questionScores as Record<string, number> } : {});
                                            setEvalGrade(s.grade);
                                            setEvalFeedback(s.feedback || '');
                                            setIsGradeManuallySet(!!s.grade);
                                            setViewingSubmission(s.id);
                                          }}
                                          className="p-5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-all"
                                        >
                                          <div>
                                            <p className="font-bold text-gray-800">{student?.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{student?.username}</p>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <Badge variant={a.isPractice ? "outline" : (s.grade ? "default" : (earned > 0 ? "outline" : "secondary"))} className={`font-bold ${a.isPractice ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-50" : ""}`}>
                                              {a.isPractice
                                                ? `Procvičování (${earned}/${totalMax}b · ${pct}%)`
                                                : s.grade
                                                  ? `Známka: ${s.grade} (${earned}/${totalMax}b · ${pct}%)`
                                                  : earned > 0
                                                    ? `Body: ${earned}/${totalMax} (${pct}%) · Neohodnoceno`
                                                    : 'Neopraveno'}
                                            </Badge>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    /* === TABULKA VŠECH TESTŮ === */
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-headline font-bold text-gray-800">Všechny zadané práce</h3>
                        <p className="text-muted-foreground text-sm">Klikněte na test pro zobrazení odevzdaných prací žáků.</p>
                      </div>

                      {/* Unified Search, Filter and Sort Bar */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
                          <div className="relative flex-1">
                            <Input 
                              placeholder="🔍 Hledat podle názvu úkolu..." 
                              value={adminSearchFilter} 
                              onChange={e => setAdminSearchFilter(e.target.value)} 
                              className="bg-white h-10 pl-3 rounded-xl"
                            />
                          </div>
                          <div className="w-full sm:w-64">
                            <select 
                              value={adminSchoolFilter} 
                              onChange={e => setAdminSchoolFilter(e.target.value)}
                              className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="all">🏫 Všechny školy</option>
                              {schools.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                          <select 
                            value={adminSortBy} 
                            onChange={e => setAdminSortBy(e.target.value as any)}
                            className="flex h-10 rounded-xl border border-input bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="default">↕️ Výchozí řazení</option>
                            <option value="name">🔤 Podle názvu úkolu</option>
                            <option value="school">🏫 Podle školy</option>
                          </select>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-white border border-input"
                            onClick={() => setAdminSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            title={adminSortOrder === 'asc' ? 'Vzestupně' : 'Sestupně'}
                          >
                            {adminSortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="p-4 font-bold text-gray-700 text-sm">Název úkolu</th>
                              <th className="p-4 font-bold text-gray-700 text-sm">Učitel (Tvůrce)</th>
                              <th className="p-4 font-bold text-gray-700 text-sm">Škola</th>
                              <th className="p-4 font-bold text-gray-700 text-sm">Určeno pro třídu</th>
                              <th className="p-4 font-bold text-gray-700 text-sm">Počet otázek</th>
                              <th className="p-4 font-bold text-gray-700 text-sm">Odevzdání</th>
                              <th className="p-4 font-bold text-gray-700 text-sm">Akce</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {assignments.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-6 text-center text-muted-foreground">V systému nebyly vytvořeny žádné úkoly.</td>
                              </tr>
                            ) : (
                              assignments.map(a => {
                                const creator = teachers.find(t => t.id === a.teacherId);
                                const classroom = classrooms.find(c => c.id === a.classId);
                                const subCount = submissions.filter(s => s.assignmentId === a.id).length;
                                return (
                                  <tr
                                    key={a.id}
                                    className="hover:bg-primary/5 cursor-pointer transition-colors"
                                    onClick={(e) => {
                                      if ((e.target as HTMLElement).closest('button')) return;
                                      setAdminViewingAssignmentId(a.id);
                                      setViewingSubmission(null);
                                    }}
                                  >
                                    <td className="p-4 font-bold text-gray-800">
                                      <div className="flex items-center gap-2">
                                        <ClipboardList className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="hover:text-primary transition-colors">{a.title}</span>
                                      </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                      {creator ? creator.name : <span className="text-xs text-muted-foreground italic">Legacy/Systém</span>}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 font-semibold">
                                      {schools.find(sc => sc.id === a.schoolId)?.name || 'Bez školy'}
                                    </td>
                                    <td className="p-4">
                                      {classroom ? (
                                        <Badge variant="secondary" className="font-semibold">{classroom.name}</Badge>
                                      ) : (
                                        <span className="text-xs text-muted-foreground italic">Legacy třída</span>
                                      )}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 font-semibold">{a.questions?.length || 0}</td>
                                    <td className="p-4">
                                      <Badge variant="outline" className="font-bold text-primary bg-primary/5">{subCount} odevzdání</Badge>
                                    </td>
                                    <td className="p-4">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => setDeleteTarget({ type: 'assignment', id: a.id, name: a.title })}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {adminTab === 'schools' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-headline font-bold text-gray-800">Správa škol</h3>
                      <p className="text-muted-foreground text-sm">Vytváření a správa školních organizací a jejich zvacích kódů.</p>
                    </div>
                  </div>

                  {/* Formulář pro novou školu */}
                  <Card className="border shadow-sm bg-slate-50/50 p-6 rounded-2xl">
                    <form onSubmit={handleCreateSchool} className="grid md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-2">
                        <Label className="font-bold">Název školy</Label>
                        <Input placeholder="např. Gymnázium Dobříš" value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)} className="bg-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Zvací kód (invite code)</Label>
                        <Input placeholder="např. gymdobris" value={newSchoolInviteCode} onChange={e => setNewSchoolInviteCode(e.target.value)} className="bg-white font-mono text-primary font-bold animate-pulse" />
                      </div>
                      <Button type="submit" className="h-10 font-bold shadow-md">Vytvořit školu</Button>
                    </form>
                  </Card>

                  {/* Seznam škol */}
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="p-4 font-bold text-gray-700 text-sm">Název školy</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Zvací kód</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Licence</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Expirace</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Třídy</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Učitelé (limit)</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Žáci</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">AI Fond</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Akce</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {isLoadingSchools ? (
                          <tr>
                            <td colSpan={9} className="p-6 text-center text-muted-foreground">
                              <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Načítám školy...
                              </span>
                            </td>
                          </tr>
                        ) : schools.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-6 text-center text-muted-foreground">Žádné školy nebyly vytvořeny.</td>
                          </tr>
                        ) : (
                          schools.map(s => {
                            const daysLeft = s.licenseExpiresAt ? Math.max(0, Math.ceil((new Date(s.licenseExpiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : 0;
                            const isExpired = s.licenseExpiresAt ? new Date(s.licenseExpiresAt) <= new Date() : false;

                            return (
                              <tr key={s.id} className="hover:bg-gray-50/50">
                                <td className="p-4 font-bold text-primary flex items-center gap-1.5">
                                  {s.name}
                                  {s.licenseType === 'school' && !isExpired && (
                                    <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                                  )}
                                </td>
                                <td className="p-4 font-mono text-sm font-bold text-indigo-600">{s.inviteCode}</td>
                                <td className="p-4">
                                  {s.licenseType === 'school' ? (
                                    isExpired ? (
                                      <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200/50 px-2 py-0.5 rounded-full w-max flex items-center gap-1">
                                        Školní (exspirovala)
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200/50 px-2 py-0.5 rounded-full w-max flex items-center gap-1">
                                        <Crown className="w-3 h-3 fill-amber-500 text-amber-500" /> Školní Licence
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full w-max">
                                      Bez licence (Free)
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-sm font-medium">
                                  {s.licenseType === 'school' && s.licenseExpiresAt ? (
                                    isExpired ? (
                                      <span className="text-red-600 font-bold">Expirovalo</span>
                                    ) : (
                                      <div className="flex flex-col">
                                        <span className="text-gray-800 font-bold">{new Date(s.licenseExpiresAt).toLocaleDateString('cs-CZ')}</span>
                                        <span className="text-[10px] text-muted-foreground">zbývá {daysLeft} dní</span>
                                      </div>
                                    )
                                  ) : (
                                    <span className="text-muted-foreground italic text-xs">Není</span>
                                  )}
                                </td>
                                <td className="p-4 text-sm font-semibold">{s.classCount}</td>
                                <td className="p-4 text-sm font-semibold text-slate-700">
                                  {s.teacherCount} <span className="text-slate-400 font-normal">/ {s.maxTeachersCount || 10}</span>
                                </td>
                                <td className="p-4 text-sm font-semibold">{s.studentCount}</td>
                                <td className="p-4 text-sm font-mono font-bold text-indigo-950">
                                  {s.licenseType === 'school' ? (
                                    <span>{s.aiCreditsPool ?? 0} <span className="text-slate-400 font-normal">/ {s.aiCreditsPoolMax ?? 0}</span></span>
                                  ) : (
                                    <span className="text-muted-foreground font-normal italic">—</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 px-2 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1.5 font-bold"
                                      onClick={() => {
                                        setSelectedSchoolForLicense(s);
                                        setEditSchoolLicenseType(s.licenseType || 'free');
                                        setEditSchoolLicenseExpiresAt(s.licenseExpiresAt ? new Date(s.licenseExpiresAt).toISOString().split('T')[0] : '');
                                        setEditSchoolMaxTeachers(s.maxTeachersCount || 10);
                                        setEditSchoolCreditsPool(s.aiCreditsPool || 0);
                                        setEditSchoolCreditsPoolMax(s.aiCreditsPoolMax || 0);
                                        const currentAdmin = store.users.find(u => u.role === 'teacher' && u.schoolId === s.id && u.isSchoolAdmin);
                                        setEditSchoolAdminId(currentAdmin?.id || '');
                                        setIsSchoolLicenseModalOpen(true);
                                      }}
                                    >
                                      <Key className="w-3.5 h-3.5" /> Licence
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-center"
                                      onClick={() => handleDeleteSchool(s.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminTab === 'school_admins' && (
                <div className="space-y-6 animate-fade-in text-slate-800">
                  <div>
                    <h3 className="text-2xl font-headline font-bold text-gray-800">Správa správců škol (Ředitelé)</h3>
                    <p className="text-muted-foreground text-sm">Přehled a správa učitelů s právy správce pro jednotlivé školy.</p>
                  </div>

                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="p-4 font-bold text-gray-700 text-sm">Správce (Učitel)</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Škola</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Zvací kód</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">AI Fond školy</th>
                          <th className="p-4 font-bold text-gray-700 text-sm text-center">Akce</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(() => {
                          const schoolAdmins = store.users.filter(u => u.role === 'teacher' && u.isSchoolAdmin);
                          if (schoolAdmins.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-muted-foreground">V systému zatím nejsou žádní správci škol.</td>
                              </tr>
                            );
                          }
                          return schoolAdmins.map(admin => {
                            const school = schools.find(s => s.id === admin.schoolId);
                            return (
                              <tr key={admin.id} className="hover:bg-gray-50/50">
                                <td className="p-4">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800">{admin.name}</span>
                                    <span className="text-xs text-muted-foreground">@{admin.username} · {admin.email || 'Bez e-mailu'}</span>
                                  </div>
                                </td>
                                <td className="p-4 font-semibold text-primary">
                                  {school ? school.name : <span className="text-muted-foreground italic">Nepřiřazeno</span>}
                                </td>
                                <td className="p-4 font-mono text-sm font-bold text-indigo-650">
                                  {school ? school.inviteCode : '-'}
                                </td>
                                <td className="p-4 font-semibold text-slate-700">
                                  {school ? (
                                    <div className="flex flex-col gap-1">
                                      <span className="font-mono text-sm">
                                        {school.aiCreditsPool ?? 0} / {school.aiCreditsPoolMax ?? 0} kr.
                                      </span>
                                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden border">
                                        <div 
                                          className="bg-indigo-600 h-full rounded-full"
                                          style={{ 
                                            width: `${school.aiCreditsPoolMax ? Math.min(100, Math.round(((school.aiCreditsPool ?? 0) / school.aiCreditsPoolMax) * 100)) : 0}%` 
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex justify-center gap-2">
                                    {school && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 rounded-xl font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
                                          onClick={() => {
                                            setSelectedSchoolForLicense(school);
                                            setEditSchoolLicenseType(school.licenseType || 'free');
                                            setEditSchoolLicenseExpiresAt(school.licenseExpiresAt ? new Date(school.licenseExpiresAt).toISOString().split('T')[0] : '');
                                            setEditSchoolMaxTeachers(school.maxTeachersCount || 10);
                                            setEditSchoolCreditsPool(school.aiCreditsPool || 0);
                                            setEditSchoolCreditsPoolMax(school.aiCreditsPoolMax || 0);
                                            setEditSchoolAdminId(admin.id);
                                            setIsSchoolLicenseModalOpen(true);
                                          }}
                                        >
                                          <Settings className="w-3.5 h-3.5" /> Spravovat školu
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                                          onClick={() => {
                                            const amountStr = prompt("Zadejte počet kreditů pro navýšení fondu školy:");
                                            if (amountStr) {
                                              const amount = Number(amountStr);
                                              if (amount > 0) {
                                                fetch('/api/schools', {
                                                  method: 'PUT',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({
                                                    id: school.id,
                                                    aiCreditsPool: (school.aiCreditsPool || 0) + amount,
                                                    aiCreditsPoolMax: (school.aiCreditsPoolMax || 0) + amount
                                                  })
                                                }).then(res => res.json()).then(data => {
                                                  if (data.success) {
                                                    toast({ title: "Úspěch", description: "Fond školy byl úspěšně navýšen." });
                                                    fetchSchools();
                                                    store.refresh();
                                                  } else {
                                                    toast({ title: "Chyba", description: data.error, variant: "destructive" });
                                                  }
                                                });
                                              }
                                            }
                                          }}
                                        >
                                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Navýšit fond
                                        </Button>
                                      </>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 rounded-xl text-red-650 hover:text-red-750 hover:bg-red-50 font-bold flex items-center gap-1"
                                      onClick={() => {
                                        if (confirm(`Opravdu chcete zrušit práva správce pro ${admin.name}?`)) {
                                          store.toggleSchoolAdmin(admin.id, false);
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Zrušit správce
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminTab === 'feedback' && (
                <div className="space-y-6 animate-fade-in text-slate-800">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-headline font-bold text-gray-800">Zpětná vazba od učitelů</h3>
                      <p className="text-muted-foreground text-sm">Přehled, vyřizování a odpovědi na podněty od učitelů.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(!store.feedbacks || store.feedbacks.length === 0) ? (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <span className="text-3xl">📭</span>
                        <p className="text-slate-500 font-bold mt-2">Zatím nebyly doručeny žádné zprávy.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {store.feedbacks.map((f: any) => {
                          const school = schools.find(s => s.id === f.schoolId)?.name || 'Neznámá škola';
                          return (
                            <Card key={f.id} className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                              <CardContent className="p-6 space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-900">{f.teacherName}</span>
                                      <span className="text-xs text-slate-500 font-medium">({f.teacherEmail})</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                                      <span>🏫 {school}</span>
                                      <span>•</span>
                                      <span>🕒 {new Date(f.createdAt).toLocaleDateString('cs-CZ')} {new Date(f.createdAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                      f.status === 'resolved' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {f.status === 'resolved' ? 'Vyřešeno' : 'Čeká na vyřízení'}
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-slate-50/70 border border-slate-100 p-4 rounded-xl text-left">
                                  <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap break-words">{f.content}</p>
                                </div>

                                {f.adminReply && (
                                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-1 text-left">
                                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                                      💬 Vaše odpověď:
                                    </span>
                                    <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap break-words">{f.adminReply}</p>
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                                  <a 
                                    href={`mailto:${f.teacherEmail}?subject=${encodeURIComponent('Reakce na Vaši zpětnou vazbu v iTestu')}&body=${encodeURIComponent(
                                      `Dobrý den,\n\nreaguji na Vaši zpětnou vazbu: "${f.content}"\n\n`
                                    )}`}
                                  >
                                    <Button variant="outline" size="sm" className="rounded-xl font-bold h-9">
                                      ✉️ Napsat e-mail
                                    </Button>
                                  </a>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-xl font-bold h-9 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                                    onClick={() => {
                                      setReplyingFeedbackId(f.id);
                                      setAdminReplyText(f.adminReply || '');
                                    }}
                                  >
                                    ✍️ {f.adminReply ? 'Upravit odpověď' : 'Odpovědět'}
                                  </Button>

                                  {f.status === 'pending' && (
                                    <Button 
                                      size="sm" 
                                      className="rounded-xl font-bold h-9 bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => store.updateFeedbackStatus(f.id, 'resolved', f.adminReply)}
                                    >
                                      ✓ Označit jako vyřešené
                                    </Button>
                                  )}

                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="rounded-xl font-bold h-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => store.deleteFeedback(f.id)}
                                  >
                                    🗑️ Smazat
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog pro změnu hesla žáka (pro Administrátora) */}
          <Dialog open={editingStudentId !== null} onOpenChange={(open) => {
            if (!open) {
              setEditingStudentId(null);
              setNewPasswordVal('');
            }
          }}>
            <DialogContent className="rounded-3xl border-none shadow-2xl max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                  <PenTool className="w-6 h-6 text-accent" /> Změna hesla žáka
                </DialogTitle>
                <DialogDescription>
                  {(() => {
                    const studentObj = store.users.find(u => u.id === editingStudentId);
                    return studentObj ? `Zadejte nové přístupové heslo pro žáka ${studentObj.name} (${studentObj.username}).` : 'Zadejte nové přístupové heslo pro vybraného žáka.';
                  })()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Nové heslo</label>
                  <Input
                    type="text"
                    placeholder="Zadejte nové heslo"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    className="rounded-xl h-12"
                    autoFocus
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingStudentId(null);
                    setNewPasswordVal('');
                  }}
                  className="rounded-full"
                >
                  Zrušit
                </Button>
                <Button 
                  onClick={async () => {
                    if (!editingStudentId || !newPasswordVal.trim()) {
                      toast({ title: "Chyba", description: "Heslo nesmí být prázdné.", variant: "destructive" });
                      return;
                    }
                    setIsChangingPassword(true);
                    const success = await store.changeStudentPassword(editingStudentId, newPasswordVal.trim());
                    setIsChangingPassword(false);
                    if (success) {
                      setEditingStudentId(null);
                      setNewPasswordVal('');
                    }
                  }}
                  disabled={isChangingPassword || !newPasswordVal.trim()}
                  className="rounded-full font-bold shadow-md"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ukládám...
                    </>
                  ) : 'Uložit heslo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog pro potvrzení smazání */}
          <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
            <DialogContent className="max-w-md bg-white rounded-3xl border-none shadow-2xl p-6">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-headline font-bold text-red-600 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500 animate-pulse" />
                  Potvrdit smazání
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-sm leading-relaxed">
                  {deleteTarget?.type === 'teacher' && (
                    <>Opravdu chcete smazat učitele <strong className="text-gray-800">"{deleteTarget.name}"</strong>? Tím dojde k jeho trvalému odstranění. Všechny jeho spravované třídy, žáci a úkoly budou bezpečně zachovány a uvolněny pro ostatní učitele.</>
                  )}
                  {deleteTarget?.type === 'classroom' && (
                    <>Opravdu chcete smazat třídu <strong className="text-gray-800">"{deleteTarget.name}"</strong>? Tím dojde k <strong>odstranění všech žáků, jejich úkolů a odevzdaných prací</strong> v této třídě! Tato akce je nevratná.</>
                  )}
                  {deleteTarget?.type === 'student' && (
                    <>Opravdu chcete smazat žáka <strong className="text-gray-800">"{deleteTarget.name}"</strong>? Tím dojde k <strong>odstranění všech jeho odevzdaných prací</strong>! Tato akce je nevratná.</>
                  )}
                  {deleteTarget?.type === 'assignment' && (
                    <>Opravdu chcete smazat úkol <strong className="text-gray-800">"{deleteTarget.name}"</strong>? Tím dojde k <strong>odstranění všech odevzdaných prací</strong> spojených s tímto úkolem! Tato akce je nevratná.</>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-6 flex justify-end gap-3">
                <Button variant="outline" className="rounded-full font-bold px-4" onClick={() => setDeleteTarget(null)}>
                  Zrušit
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full font-bold px-5" 
                  onClick={() => {
                    if (deleteTarget) {
                      if (deleteTarget.type === 'teacher') store.deleteTeacher(deleteTarget.id);
                      if (deleteTarget.type === 'classroom') store.deleteClassroom(deleteTarget.id);
                      if (deleteTarget.type === 'student') store.deleteStudent(deleteTarget.id);
                      if (deleteTarget.type === 'assignment') store.deleteAssignment(deleteTarget.id);
                      setDeleteTarget(null);
                    }
                  }}
                >
                  Smazat
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog pro přejmenování třídy */}
          <Dialog open={renameTarget !== null} onOpenChange={(open) => { if (!open) setRenameTarget(null); }}>
            <DialogContent className="max-w-md bg-white rounded-3xl border-none shadow-2xl p-6">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-headline font-bold text-primary flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-accent animate-pulse" />
                  Přejmenovat třídu
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-sm leading-relaxed">
                  Zadejte nový název pro třídu <strong className="text-gray-800">"{renameTarget?.name}"</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="renameInput" className="font-bold text-gray-700">Nový název třídy</Label>
                  <Input 
                    id="renameInput"
                    placeholder="Např. 8.A Matematika"
                    value={newClassNameVal}
                    onChange={(e) => setNewClassNameVal(e.target.value)}
                    className="rounded-xl h-12"
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter className="flex justify-end gap-3">
                <Button variant="outline" className="rounded-full font-bold px-4" onClick={() => setRenameTarget(null)}>
                  Zrušit
                </Button>
                <Button 
                  disabled={!newClassNameVal.trim() || newClassNameVal === renameTarget?.name}
                  className="bg-primary hover:bg-primary/95 text-white rounded-full font-bold px-5" 
                  onClick={async () => {
                    if (renameTarget && newClassNameVal.trim()) {
                      const success = await store.renameClassroom(renameTarget.id, newClassNameVal.trim());
                      if (success) {
                        setRenameTarget(null);
                      }
                    }
                  }}
                >
                  Uložit změny
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {renderProfileModal()}
          {renderSchoolLicenseModal()}

          {/* Dialog pro odpověď na zpětnou vazbu */}
          <Dialog open={replyingFeedbackId !== null} onOpenChange={(open) => { if (!open) setReplyingFeedbackId(null); }}>
            <DialogContent className="max-w-md bg-white rounded-3xl border-none shadow-2xl p-6 text-slate-800">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-headline font-bold text-indigo-700 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Odpovědět učiteli
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-sm leading-relaxed">
                  Zde napište odpověď, která se zobrazí učiteli v jeho profilu u této zprávy.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="replyInputAdmin" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Text odpovědi</Label>
                  <Textarea 
                    id="replyInputAdmin"
                    placeholder="Např. Děkujeme za podnět, funkci pro CSV import jsme vylepšili..."
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    className="rounded-xl min-h-[120px] resize-none font-medium border-slate-200 focus-visible:ring-indigo-500"
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter className="flex justify-end gap-3 pt-2">
                <Button variant="outline" className="rounded-xl font-bold px-4 border-slate-200 hover:bg-slate-50 text-slate-700" onClick={() => setReplyingFeedbackId(null)}>
                  Zrušit
                </Button>
                <Button 
                  disabled={!adminReplyText.trim()}
                  className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold px-5" 
                  onClick={async () => {
                    if (replyingFeedbackId) {
                      const success = await store.updateFeedbackStatus(replyingFeedbackId, 'resolved', adminReplyText.trim());
                      if (success) {
                        setReplyingFeedbackId(null);
                        setAdminReplyText('');
                      }
                    }
                  }}
                >
                  Uložit a odeslat
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {renderGradebookDialog()}
        </main>
      </div>
    );
  }

  if (currentUser.role === 'admin' || currentUser.role === 'teacher') {
    const teacherClasses = currentUser.role === 'admin' 
      ? store.classes 
      : store.classes.filter(c => c.teacherId === currentUser.id);
    const selectedClass = store.classes.find(c => c.id === selectedClassId);
    const unfilteredTemplates = store.assignments.filter(a => a.isPublicTemplate === true);
    const publicTemplates = unfilteredTemplates.filter(a => {
      if (templateSelectedSubject !== 'Vše') {
        const sub = a.subject || 'Matematika';
        if (sub !== templateSelectedSubject) return false;
      }
      if (templateSearchQuery.trim()) {
        const query = templateSearchQuery.toLowerCase();
        const titleMatch = a.title?.toLowerCase().includes(query);
        const descMatch = a.description?.toLowerCase().includes(query);
        const creator = store.users.find(u => u.id === a.teacherId);
        const authorMatch = creator?.name?.toLowerCase().includes(query) || false;
        if (!titleMatch && !descMatch && !authorMatch) return false;
      }
      return true;
    });

    const now = new Date();
    const isPremium = !!(currentUser.isPremium && (!currentUser.premiumExpiresAt || new Date(currentUser.premiumExpiresAt) > now));
    
    // Výpočet zbývajících dnů zkušební doby
    const createdTime = currentUser.createdAt ? new Date(currentUser.createdAt).getTime() : Date.now();
    const trialDurationMs = 90 * 24 * 60 * 60 * 1000;
    const timeSinceCreation = Date.now() - createdTime;
    const daysLeft = Math.max(0, Math.ceil((trialDurationMs - timeSinceCreation) / (24 * 60 * 60 * 1000)));
    const isTrialExpired = !isPremium && (timeSinceCreation > trialDurationMs);
    const premiumDaysLeft = currentUser.premiumExpiresAt ? Math.max(0, Math.ceil((new Date(currentUser.premiumExpiresAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0;

    if (currentUser.role === 'teacher' && isTrialExpired) {
      return (
        <div className="min-h-screen flex flex-col bg-background">
          <Navbar 
            user={currentUser} 
            onLogout={() => store.logout()} 
            onUpgradeClick={() => setIsUpgradeModalOpen(true)} 
            onProfileClick={() => setIsProfileModalOpen(true)}
            showPortalLink={true}
            onPortalClick={() => {
              setTeacherMode('hub');
              setAiPedagogHistory([]);
              setAiPedagogContext('');
              setAiPedagogFileName('');
            }}
          />
          <div className="flex-1 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl space-y-6 text-center animate-scale-up animate-fade-in">
              <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-3xl">
                🔒
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-headline font-black text-gray-800">Platnost zkušební verze vypršela</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vaše 3měsíční zkušební doba pro iTest Cloud vypršela. Pro pokračování v používání platformy, vytváření tříd a správu žáků si prosím aktivujte Prémiové předplatné.
                </p>
              </div>
              
              <div className="border-t border-b py-4 space-y-3">
                <div className="flex items-center gap-3 text-left bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50">
                  <span className="text-xl">🚀</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Nulová omezení</p>
                    <p className="text-xs text-muted-foreground">Neomezený počet tříd, žáků a zadání.</p>
                  </div>
                </div>
              </div>
 
              <div className="grid gap-3">
                <Button 
                  onClick={() => {
                    setPaymentDetails({ amount: 99, type: 'monthly' });
                    setIsUpgradeModalOpen(true);
                  }}
                  className="w-full rounded-2xl py-6 font-bold shadow-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex justify-between px-6 border-none"
                >
                  <span>Měsíční tarif (200 kr./měsíc)</span>
                  <span>99 Kč / měsíc</span>
                </Button>
                <Button 
                  onClick={() => {
                    setPaymentDetails({ amount: 999, type: 'yearly' });
                    setIsUpgradeModalOpen(true);
                  }}
                  className="w-full rounded-2xl py-6 font-bold shadow-md bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white flex justify-between px-6 border-none"
                >
                  <span>Roční tarif (400 kr./měsíc, Ušetříte 16%)</span>
                  <span>999 Kč / rok</span>
                </Button>
              </div>
            </div>
          </div>
          {renderProfileModal()}
        </div>
      );
    }

    const renderPortalView = () => {
      return (
        <>
          
          {/* Banner o předplatném */}
          <div className="max-w-7xl w-full mx-auto px-4 md:px-8 mt-6">
            {isPremium ? (
              <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-indigo-500/10 border border-amber-200/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100/80 p-2 rounded-xl text-amber-600 shrink-0">
                    <Crown className="w-5 h-5 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                      Prémiový účet aktivní <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">PREMIUM ({currentUser.premiumType === 'yearly' ? 'Roční' : currentUser.premiumType === 'school' ? 'Školní' : currentUser.premiumType === 'trial' ? 'Zkušební' : 'Měsíční'})</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentUser.premiumType === 'monthly' ? (
                        <>
                          Limity aktivní: max. 8 tříd, max. 100 žáků celkem. Placená verze vyprší za <span className="font-bold text-indigo-700">{premiumDaysLeft} dní</span> (platnost do: {currentUser.premiumExpiresAt ? new Date(currentUser.premiumExpiresAt).toLocaleDateString('cs-CZ') : 'neomezeně'}).
                        </>
                      ) : (
                        <>
                          Všechny limity jsou zrušeny. Placená verze vyprší za <span className="font-bold text-indigo-700">{premiumDaysLeft} dní</span> (platnost do: {currentUser.premiumExpiresAt ? new Date(currentUser.premiumExpiresAt).toLocaleDateString('cs-CZ') : 'neomezeně'}).
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-indigo-50/50 via-indigo-600/5 to-purple-50/5 border border-indigo-200/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100/80 p-2 rounded-xl text-indigo-600 shrink-0">
                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-indigo-950">
                      Používáte zkušební verzi iTest Cloud
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Zkušební doba končí za <span className="font-bold text-indigo-700">{daysLeft} dní</span>. Omezení: max. 2 třídy a 20 žáků na třídu. AI Kredity: <span className="font-bold text-indigo-700">{currentUser.aiCredits !== undefined ? currentUser.aiCredits : 30} / {currentUser.aiCreditsMax || 30}</span>.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold py-2 px-4 shadow-sm border-none"
                >
                  Upgradovat na Premium
                </Button>
              </div>
            )}
          </div>

          <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center space-y-12">
            <div className="text-center max-w-2xl space-y-4">
              <h1 className="text-5xl font-headline font-bold text-primary tracking-tight leading-tight">
                Digitální asistent pedagoga
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed">
                Vítejte v cloudovém prostředí iTest. Vyberte si nástroj, se kterým chcete pracovat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              {/* iTest Cloud Card */}
              <div 
                onClick={() => setTeacherMode('itest')}
                className="group cursor-pointer rounded-3xl bg-white border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-8 space-y-6">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-9 h-9 text-indigo-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-headline font-bold text-slate-800 group-hover:text-primary transition-colors">
                      iTest Cloud
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Kompletní prostředí pro správu školních tříd, vytváření a zadávání testů, automatické vyhodnocení, sledování klasifikace a tisk PDF.
                    </p>
                  </div>
                  <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-50">
                    <li className="flex items-center gap-2">✔ Správa a zakládání školních tříd</li>
                    <li className="flex items-center gap-2">✔ Banka sdílených testových šablon</li>
                    <li className="flex items-center gap-2">✔ Sledování odevzdaných prací a známek</li>
                  </ul>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center group-hover:bg-indigo-50/50 transition-colors">
                  <span className="text-xs font-bold text-indigo-700">Vstoupit do nástěnky</span>
                  <ChevronRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* AI Pedagog Card */}
              <div 
                onClick={() => setTeacherMode('ai-pedagog')}
                className="group cursor-pointer rounded-3xl bg-white border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-8 space-y-6">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform relative">
                    <Sparkles className="w-9 h-9 text-indigo-600" />
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500"></span>
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-headline font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      AI Pedagog
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Inteligentní AI asistent pro učitele. Pomůže Vám psát odpovědi rodičům, tvořit reakce na školní inspekci (ČŠI), vytvářet provozní řády učeben z PDF nebo řešit kázňské prohřešky.
                    </p>
                  </div>
                  <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-50">
                    <li className="flex items-center gap-2">✨ Rychlá tvorba diplomatických odpovědí rodičům</li>
                    <li className="flex items-center gap-2">✨ Generování provozních řádů a dokumentů</li>
                    <li className="flex items-center gap-2">✨ Možnost nahrávat maily, PDF a obrázky jako kontext</li>
                  </ul>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center group-hover:bg-indigo-50/50 transition-colors">
                  <span className="text-xs font-bold text-indigo-700">Spustit AI asistenta</span>
                  <ChevronRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </main>
        </>
      );
    };

    const renderAiPedagogView = () => {
      const presets = [
        {
          title: "✉️ Odpověď rodičům",
          text: "Napiš diplomatickou a konstruktivní odpověď rodičům žáka ohledně zhoršeného prospěchu a zhoršené známky v testu. Navrhni řešení, doučování a termín konzultačních hodin."
        },
        {
          title: "🛡️ Reakce na ČŠI",
          text: "Zformuluj profesionální vyjádření školy pro Českou školní inspekci (ČŠI) reagující na zjištěné nedostatky ve výuce cizích jazyků a navrhni nápravná opatření."
        },
        {
          title: "📐 Řád odborné učebny",
          text: "Vytvoř přehledný a bezpečný provozní řád pro odbornou učebnu (IT / Fyzika / Chemie) pro žáky a vyučující."
        },
        {
          title: "⚠️ Kázeňský prohřešek",
          text: "Navrhni zápis a metodický postup pro řešení kázňského prohřešku žáka (např. používání telefonu/AI při testu, záškoláctví, nevhodné chování)."
        }
      ];

      return (
        <>

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 flex flex-col lg:flex-row gap-6 animate-fade-in text-slate-800">
            {/* Left Sidebar (Settings & Context) */}
            <div className="w-full lg:w-72 shrink-0 space-y-6">
              {/* Presets and Custom Templates */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-headline font-bold text-lg text-primary flex items-center gap-1.5">
                  <BookOpen className="w-5 h-5 text-indigo-600" /> Šablony a rychlé volby
                </h3>
                
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Výchozí šablony</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {presets.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAiPedagogMessage(p.text)}
                        className="w-full text-left text-xs bg-slate-50 hover:bg-indigo-50/50 hover:text-indigo-700 p-3 rounded-2xl font-semibold border transition-all text-slate-700 active:scale-[0.98]"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Context / File Upload */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-headline font-bold text-lg text-primary flex items-center gap-1.5">
                  <Upload className="w-5 h-5 text-indigo-600" /> Kontext k dotazu
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sem nahrajte e-mail, PDF nebo obrázek dokumentu, který má AI asistent analyzovat.
                </p>

                {/* Upload Area */}
                <div 
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition-all bg-slate-50/50 hover:bg-slate-50 cursor-pointer relative"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleContextFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input
                    type="file"
                    accept=".txt,.pdf,image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleContextFileUpload(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Klikněte nebo přetáhněte soubor</p>
                  <p className="text-[10px] text-slate-400 mt-1">Podpora PDF, TXT a obrázků</p>
                </div>

                {aiPedagogFileName && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200 text-emerald-800 font-bold">
                    <span className="truncate flex-1">📎 {aiPedagogFileName}</span>
                    <button 
                      onClick={() => {
                        setAiPedagogContext('');
                        setAiPedagogFileName('');
                      }}
                      className="text-emerald-750 hover:text-red-650 ml-2"
                    >
                      Zrušit
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="contextPaste" className="text-xs font-bold text-slate-500">Nebo vložte text ručně:</label>
                  <textarea
                    id="contextPaste"
                    placeholder="Sem vložte např. e-mail od rodiče nebo pasáž ze ŠVP..."
                    value={aiPedagogContext}
                    onChange={(e) => setAiPedagogContext(e.target.value)}
                    className="w-full h-24 p-3 rounded-2xl text-xs font-medium border border-slate-200 resize-none outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                  />
                  {aiPedagogContext && (
                    <button 
                      onClick={() => setAiPedagogContext('')} 
                      className="text-[10px] text-red-650 font-bold hover:underline"
                    >
                      Vyčistit text
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Chat & Output Panel */}
            <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[calc(100vh-140px)]">
              {/* Top info bar */}
              <div className="border-b px-6 py-4 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h2 className="font-headline font-bold text-lg text-primary flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-indigo-600" /> AI Pedagogický Asistent
                  </h2>
                  <p className="text-xs text-muted-foreground">ChatGPT přizpůsobený pro učitele a české školství.</p>
                </div>
                {aiPedagogHistory.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full text-xs font-bold text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm("Opravdu chcete vyčistit chat?")) {
                        setAiPedagogHistory([]);
                      }
                    }}
                  >
                    Vyčistit chat
                  </Button>
                )}
              </div>

              {/* Chat Message History */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/20 flex flex-col">
                {aiPedagogHistory.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto my-auto py-12">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <Sparkles className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-headline font-bold text-lg text-slate-800">O čem chcete diskutovat?</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Zadejte vlastní dotaz, vyberte si z hotových šablon v levém panelu, nebo nahrajte e-mail od rodiče či inspektora a nechte AI asistent vypracovat odpověď.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1">
                    {aiPedagogHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`max-w-[80%] rounded-3xl p-5 shadow-sm space-y-3 ${
                          msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold opacity-60">
                              {msg.role === 'user' ? 'Vy (Učitel)' : 'AI Pedagog'}
                            </span>
                          </div>
                          
                          <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {msg.content}
                          </div>

                          {msg.role === 'assistant' && (
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] font-bold text-indigo-750 hover:bg-indigo-50 rounded-lg"
                                onClick={() => navigator.clipboard.writeText(msg.content).then(() => toast({ title: "Kopírováno", description: "Text byl zkopírován do schránky." }))}
                              >
                                Kopírovat text
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] font-bold text-indigo-750 hover:bg-indigo-50 rounded-lg flex items-center gap-1"
                                onClick={() => handleExportToPdf(msg.content)}
                              >
                                <Download className="w-3 h-3" /> PDF Export
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isAiPedagogGenerating && (
                      <div className="flex justify-start animate-pulse">
                        <div className="bg-white border rounded-3xl rounded-bl-none p-5 shadow-sm flex items-center gap-3">
                          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-bold text-slate-500">AI pedagog formuluje odpověď...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Input Field */}
              <div className="border-t p-4 bg-white space-y-3">
                <div className="flex gap-2">
                  <textarea
                    placeholder="Zadejte dotaz na AI pedagoga..."
                    value={aiPedagogMessage}
                    onChange={(e) => setAiPedagogMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAiPedagogMessage();
                      }
                    }}
                    disabled={isAiPedagogGenerating}
                    className="flex-1 min-h-[48px] max-h-24 p-3 rounded-2xl border border-slate-200 resize-none outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-medium text-sm leading-relaxed"
                  />
                  <Button
                    onClick={() => handleSendAiPedagogMessage()}
                    disabled={isAiPedagogGenerating || !aiPedagogMessage.trim()}
                    className="bg-indigo-650 hover:bg-indigo-750 text-white rounded-2xl h-12 w-12 px-0 flex items-center justify-center shrink-0 active:scale-95 transition-all border-none"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </Button>
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                  <span>Stisknutím klávesy Enter zprávu odešlete</span>
                  {aiPedagogMessage.trim() && (
                    <button 
                      onClick={() => setIsSavingPromptModalOpen(true)}
                      className="text-indigo-650 hover:underline font-bold"
                    >
                      ★ Uložit jako šablonu
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar (Minulé & Uložené promty) */}
            <div className="w-full lg:w-72 shrink-0 space-y-6">
              {/* Minulé promty */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-headline font-bold text-sm text-primary flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-655" /> Minulé promty
                  </h3>
                  {pastPrompts.length > 0 && (
                    <button 
                      onClick={handleClearPastPrompts}
                      className="text-[10px] text-red-655 hover:underline font-bold"
                    >
                      Vyčistit
                    </button>
                  )}
                </div>
                
                {pastPrompts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Žádné předchozí dotazy.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {pastPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setAiPedagogMessage(prompt);
                          toast({ title: "Prompt načten", description: "Text byl zkopírován do pole pro psaní." });
                        }}
                        className="w-full text-left text-xs bg-slate-50 hover:bg-indigo-50/50 hover:text-indigo-700 p-2.5 rounded-xl border transition-all text-slate-700 active:scale-[0.98] truncate block"
                        title={prompt}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Uložené šablony */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-headline font-bold text-sm text-primary flex items-center gap-1.5 border-b pb-2">
                  <Bookmark className="w-4 h-4 text-indigo-655" /> Uložené šablony
                </h3>
                
                {aiPedagogSavedPrompts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Žádné uložené šablony.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {aiPedagogSavedPrompts.map((p) => (
                      <div key={p._id} className="group flex justify-between items-center text-xs bg-indigo-50/20 p-2.5 rounded-2xl border border-indigo-100/30 font-medium text-slate-700">
                        <button
                          onClick={() => {
                            setAiPedagogMessage(p.content);
                            toast({ title: "Šablona načtena", description: "Text byl zkopírován do pole pro psaní." });
                          }}
                          className="text-left font-bold truncate flex-1 hover:text-indigo-700"
                          title={p.content}
                        >
                          {p.title}
                        </button>
                        <button
                          onClick={() => handleDeletePromptTemplate(p._id)}
                          className="text-slate-400 hover:text-red-655 ml-2 shrink-0 transition-colors"
                          title="Smazat šablonu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Dialog pro uložení šablony */}
          <Dialog open={isSavingPromptModalOpen} onOpenChange={setIsSavingPromptModalOpen}>
            <DialogContent className="bg-white border rounded-3xl p-6 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-headline text-xl font-bold text-primary">Uložit jako šablonu</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">Uložte si tento prompt, abyste jej mohl kdykoliv znovu vyvolat jedním kliknutím.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-3">
                <div className="space-y-1">
                  <label htmlFor="promptTitle" className="text-xs font-bold text-slate-500">Název šablony</label>
                  <Input 
                    id="promptTitle"
                    placeholder="Např. Reakce na e-mail o známce"
                    value={newPromptTitle}
                    onChange={(e) => setNewPromptTitle(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter className="flex justify-end gap-3 pt-2">
                <Button variant="outline" className="rounded-xl font-bold border-slate-200" onClick={() => setIsSavingPromptModalOpen(false)}>
                  Zrušit
                </Button>
                <Button className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold border-none shadow-sm" disabled={!newPromptTitle.trim()} onClick={handleSavePromptTemplate}>
                  Uložit šablonu
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );
    };

    const predefinedSubjects = [
      'Matematika',
      'Český jazyk',
      'Anglický jazyk',
      'Fyzika',
      'Chemie',
      'Dějepis',
      'Zeměpis',
      'Přírodopis',
      'Informatika',
      'Jiný'
    ];

    const classStudents = store.users.filter(u => u.role === 'student' && u.classId === selectedClassId);
    const subjectAssignments = store.assignments.filter(a =>
      a.classId === selectedClassId &&
      !a.isDraft &&
      (selectedTeacherSubject === 'Jiný' ? (!a.subject || a.subject === 'Jiný') : (a.subject === selectedTeacherSubject))
    );

    const presets = [
      {
        title: "⚖️ Školský zákon",
        text: "Pomoz mi najít informace ve školském zákoně týkající se: [zde popište situaci, např. klasifikace na konci pololetí, omlouvání zameškaných hodin, práva a povinnosti žáků/rodičů]. Vysvětli mi, jaké povinnosti má škola a jaká jsou práva učitele."
      },
      {
        title: "📅 Pracovní doba",
        text: "Jak je podle zákona o pedagogických pracovnících upravena přímá a nepřímá pedagogická činnost, práce přesčas a dohledy nad žáky během přestávek a školních akcí?"
      },
      {
        title: "✉️ Odpověď rodičům",
        text: "Napiš diplomatickou a konstruktivní odpověď rodičům žáka ohledně zhoršeného prospěchu a zhoršené známky v testu. Navrhni řešení, doučování a termín konzultačních hodin."
      },
      {
        title: "🛡️ Reakce na ČŠI",
        text: "Zformuluj profesionální vyjádření školy pro Českou školní inspekci (ČŠI) reagující na zjištěné nedostatky ve výuce cizích jazyků a navrhni nápravná opatření."
      },
      {
        title: "📐 Řád učebny",
        text: "Vytvoř přehledný a bezpečný provozní řád pro odbornou učebnu (IT / Fyzika / Chemie) pro žáky a vyučující."
      },
      {
        title: "⚠️ Kázeňský prohřešek",
        text: "Navrhni zápis a metodický postup pro řešení kázňského prohřešku žáka (např. používání telefonu/AI při testu, záškoláctví, nevhodné chování)."
      }
    ];

    const wrapperBg = teacherMode === 'ai-pedagog' ? 'bg-[#EFF3F7]' : 'bg-background';

    return (
      <div className={`min-h-screen flex flex-col text-slate-800 ${wrapperBg}`}>
        <Navbar 
          user={currentUser} 
          onLogout={() => store.logout()} 
          onUpgradeClick={() => setIsUpgradeModalOpen(true)} 
          onProfileClick={() => setIsProfileModalOpen(true)}
          showPortalLink={true}
          onPortalClick={() => {
            setTeacherMode('hub');
            setAiPedagogHistory([]);
            setAiPedagogContext('');
            setAiPedagogFileName('');
          }}
        />

        {teacherMode === 'itest' && (
          <>
            {/* Banner o předplatném */}
            <div className="max-w-7xl w-full mx-auto px-4 md:px-6 mt-4">
              {isPremium ? (
                <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-indigo-500/10 border border-amber-200/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100/80 p-2 rounded-xl text-amber-600 shrink-0">
                      <Crown className="w-5 h-5 fill-amber-500 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                        Prémiový účet aktivní <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">PREMIUM ({currentUser.premiumType === 'yearly' ? 'Roční' : currentUser.premiumType === 'school' ? 'Školní' : currentUser.premiumType === 'trial' ? 'Zkušební' : 'Měsíční'})</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentUser.premiumType === 'monthly' ? (
                          <>
                            Limity aktivní: max. 8 tříd, max. 100 žáků celkem. Placená verze vyprší za <span className="font-bold text-indigo-700">{premiumDaysLeft} dní</span> (platnost do: {currentUser.premiumExpiresAt ? new Date(currentUser.premiumExpiresAt).toLocaleDateString('cs-CZ') : 'neomezeně'}).
                          </>
                        ) : (
                          <>
                            Všechny limity jsou zrušeny. Placená verze vyprší za <span className="font-bold text-indigo-700">{premiumDaysLeft} dní</span> (platnost do: {currentUser.premiumExpiresAt ? new Date(currentUser.premiumExpiresAt).toLocaleDateString('cs-CZ') : 'neomezeně'}).
                          </>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium flex flex-wrap gap-x-3 gap-y-1">
                        <span>Škola: <span className="font-bold text-slate-700">{schools.find(s => s.id === currentUser.schoolId)?.name || 'Načítání...'}</span></span>
                        <span>Zvací kód: <span className="font-mono bg-white border px-1.5 py-0.2 rounded font-bold text-indigo-700">{schools.find(s => s.id === currentUser.schoolId)?.inviteCode || '...'}</span></span>
                        <span>AI Kredity: <span className="font-bold text-indigo-700">{currentUser.aiCredits !== undefined ? currentUser.aiCredits : 30} / {currentUser.aiCreditsMax || 30} {currentUser.aiExtraCredits ? `(+${currentUser.aiExtraCredits} extra)` : ''}</span></span>
                        {currentUser.aiCreditsResetDate && (
                          <span>Obnovení: <span className="font-bold text-indigo-700">{new Date(currentUser.aiCreditsResetDate).toLocaleDateString('cs-CZ')}</span></span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      setPaymentDetails({ amount: 25, type: 'credits', credits: 50 });
                      setIsUpgradeModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold py-2 px-4 shadow-sm border-none shrink-0 flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white text-white" /> Dokoupit 50 kr. (25 Kč)
                  </Button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-indigo-50/50 via-indigo-600/5 to-purple-50/5 border border-indigo-200/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100/80 p-2 rounded-xl text-indigo-600 shrink-0">
                      <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-950">
                        Používáte zkušební verzi iTest Cloud
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Zkušební doba končí za <span className="font-bold text-indigo-700">{daysLeft} dní</span>. Omezení: max. 2 třídy a 20 žáků na třídu. AI Kredity: <span className="font-bold text-indigo-700">{currentUser.aiCredits !== undefined ? currentUser.aiCredits : 30} / {currentUser.aiCreditsMax || 30} {currentUser.aiExtraCredits ? `(+${currentUser.aiExtraCredits} extra)` : ''}</span>.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">
                        Škola: <span className="font-bold text-slate-700">{schools.find(s => s.id === currentUser.schoolId)?.name || 'Načítání...'}</span> · Zvací kód školy: <span className="font-mono bg-white border px-1.5 py-0.2 rounded font-bold text-indigo-700">{schools.find(s => s.id === currentUser.schoolId)?.inviteCode || '...'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto shrink-0">
                    <Button 
                      onClick={() => {
                        setPaymentDetails({ amount: 25, type: 'credits', credits: 50 });
                        setIsUpgradeModalOpen(true);
                      }}
                      variant="outline"
                      className="bg-white hover:bg-slate-50 border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold py-2 px-4 shadow-sm flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" /> Dokoupit 50 kr. (25 Kč)
                    </Button>
                    <Button 
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold py-2 px-4 shadow-sm border-none"
                    >
                      Upgradovat na Premium
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Main workspace */}
            <main className="flex-1 w-full mx-auto px-4 py-4 md:px-6 overflow-hidden flex flex-col gap-6 min-h-[600px]">
              
              {/* Right panel: iTest Dashboard */}
              <div className="w-full flex-1 flex flex-col bg-white rounded-3xl border border-slate-200/60 shadow-lg overflow-y-auto p-4 md:p-6 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight flex items-center gap-2">
                {selectedClass ? (
                  <>
                    <span>{selectedClass.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5"
                      onClick={() => {
                        setRenameTarget({ id: selectedClass.id, name: selectedClass.name });
                        setNewClassNameVal(selectedClass.name);
                      }}
                      title="Přejmenovat třídu"
                    >
                      <Edit3 className="w-4.5 h-4.5" />
                    </Button>
                  </>
                ) : (
                  'Nástěnka učitele'
                )}
              </h1>
              <p className="text-muted-foreground">
                {selectedClass ? 'Správa úkolů a výsledků v cloudu.' : 'Spravujte své třídy, žáky a cloudové materiály.'}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedClassId && (
                <Button variant="outline" className="rounded-full" onClick={() => { setSelectedClassId(null); setActiveTab('classes'); }}>
                  Zpět na přehled tříd
                </Button>
              )}
              {activeTab === 'classes' && !selectedClassId && (
                <>
                  <Dialog open={isImportingCSV} onOpenChange={(open) => {
                    setIsImportingCSV(open);
                    if (!open) {
                      setCsvClassName('');
                      setCsvFile(null);
                      setCsvParsingError(null);
                      setCsvImportProgress('');
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-full shadow-sm bg-white border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                        <Upload className="w-4 h-4 mr-2 text-accent" /> Importovat z CSV
                      </Button>
                    </DialogTrigger>
                    <DialogContent aria-describedby={undefined} className="sm:max-w-md bg-white border rounded-3xl p-6 shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary font-headline text-2xl font-bold">
                          <Upload className="w-6 h-6 text-accent" /> Importovat z CSV
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                          Rychle vytvořte celou třídu a hromadně zaregistrujte žáky pomocí nahraného CSV souboru.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="csvClassName" className="font-bold text-gray-700">Název nové třídy</Label>
                          <Input 
                            id="csvClassName" 
                            placeholder="Např. 8.A Matematika" 
                            value={csvClassName} 
                            onChange={(e) => setCsvClassName(e.target.value)} 
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="csvFile" className="font-bold text-gray-700">CSV soubor se žáky</Label>
                          <Input 
                            id="csvFile" 
                            type="file" 
                            accept=".csv" 
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files.length > 0) {
                                setCsvFile(files[0]);
                              }
                            }}
                            className="file:bg-primary/5 file:text-primary file:border-none file:px-3 file:py-1 file:rounded-lg file:font-semibold"
                          />
                          <div className="text-[11px] text-muted-foreground bg-gray-50 p-3 rounded-2xl border space-y-1.5 leading-relaxed">
                            <p className="font-bold text-gray-700 text-xs">Struktura sloupců v CSV souboru:</p>
                            <p>Záhlaví by mělo obsahovat: <code className="bg-gray-200/80 px-1.5 py-0.5 rounded font-mono text-[10px]">Jméno;Uživatelské jméno;Heslo</code></p>
                            <p>• Jako oddělovač je podporován středník (<code className="font-bold font-mono">;</code>) i čárka (<code className="font-bold font-mono">,</code>).</p>
                            <p>• Sloupce s loginem a heslem jsou nepovinné (pokud chybí, login se automaticky vytvoří ze jména a výchozí heslo bude <code className="font-mono">123456</code>).</p>
                          </div>
                        </div>

                        {csvParsingError && (
                          <div className="p-3.5 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold border border-red-100 animate-pulse">
                            ⚠️ {csvParsingError}
                          </div>
                        )}

                        {csvImportProgress && (
                          <div className="p-3.5 bg-primary/5 text-primary rounded-2xl text-xs font-bold border border-primary/10 flex items-center gap-3 justify-center">
                            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            {csvImportProgress}
                          </div>
                        )}
                      </div>

                      <DialogFooter>
                        <Button 
                          onClick={handleImportCSV} 
                          disabled={!csvClassName.trim() || !csvFile || !!csvImportProgress}
                          className="w-full rounded-xl py-5 font-bold shadow-md bg-primary hover:bg-primary/95 text-white"
                        >
                          Zahájit import třídy a žáků
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isAddingClass} onOpenChange={(open) => {
                    setIsAddingClass(open);
                    if (!open) {
                      setClassActionType('create');
                      setNewClassName('');
                      setSelectedExistingClassId('');
                      setClassSearch('');
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="rounded-full shadow-md">
                        <Plus className="w-4 h-4 mr-2" /> Nová třída
                      </Button>
                    </DialogTrigger>
                    <DialogContent aria-describedby={undefined}>
                      <DialogHeader>
                        <DialogTitle>Přidat třídu</DialogTitle>
                      </DialogHeader>
                      
                      <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg mb-4">
                        <button 
                          type="button" 
                          className={`py-2 text-sm font-medium rounded-md transition-all ${classActionType === 'create' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500'}`}
                          onClick={() => setClassActionType('create')}
                        >Vytvořit novou</button>
                        <button 
                          type="button" 
                          className={`py-2 text-sm font-medium rounded-md transition-all ${classActionType === 'select' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500'}`}
                          onClick={() => setClassActionType('select')}
                        >Vybrat existující</button>
                      </div>

                      {classActionType === 'create' ? (
                        <div className="py-4">
                          <Input placeholder="Např. Matematika 8.A" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
                        </div>
                      ) : (
                        <div className="py-4 space-y-2">
                          <Label className="text-sm text-muted-foreground">Vyberte třídu z databáze:</Label>
                          <Input 
                            placeholder="🔍 Vyhledat třídu..." 
                            value={classSearch} 
                            onChange={(e) => setClassSearch(e.target.value)} 
                            className="mb-2"
                          />
                          {(() => {
                            const availableClasses = store.classes.filter(c => c.teacherId !== currentUser.id);
                            if (availableClasses.length === 0) {
                              return <p className="text-sm text-amber-600 font-semibold py-2">Žádné další třídy nebyly v systému nalezeny.</p>;
                            }
                            const filtered = availableClasses.filter(c => c.name.toLowerCase().includes(classSearch.toLowerCase()));
                            if (filtered.length === 0) {
                              return <p className="text-sm text-amber-600 font-semibold py-2">Žádná třída neodpovídá vyhledávání.</p>;
                            }
                            return (
                              <select
                                value={selectedExistingClassId}
                                onChange={(e) => setSelectedExistingClassId(e.target.value)}
                                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              >
                                <option value="">-- Vyberte třídu ({filtered.length}) --</option>
                                {filtered.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            );
                          })()}
                        </div>
                      )}

                      <DialogFooter>
                        {classActionType === 'create' ? (
                          <Button onClick={handleAddClass} disabled={!newClassName.trim()}>Vytvořit</Button>
                        ) : (
                          <Button 
                            onClick={() => {
                              if (selectedExistingClassId) {
                                store.assignClass(selectedExistingClassId);
                                setIsAddingClass(false);
                                setSelectedExistingClassId('');
                              }
                            }} 
                            disabled={!selectedExistingClassId}
                          >Přidat třídu</Button>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/50 border shadow-sm p-1">
              {currentUser.isSchoolAdmin && (
                <TabsTrigger value="school-admin" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md px-6 border border-indigo-100 flex items-center gap-1.5 font-bold text-indigo-700">
                  <School className="w-3.5 h-3.5" /> Správa školy
                </TabsTrigger>
              )}
              <TabsTrigger value="classes" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md px-6">Třídy</TabsTrigger>
              <TabsTrigger value="templates" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md px-6">Banka úloh (Šablony)</TabsTrigger>
              <TabsTrigger value="assignments" disabled={!selectedClassId} className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md px-6">Zadané práce</TabsTrigger>
              <TabsTrigger value="students" disabled={!selectedClassId} className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md px-6">Žáci</TabsTrigger>
              <TabsTrigger value="submissions" disabled={!selectedClassId} className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md px-6">Odevzdáno</TabsTrigger>
              <TabsTrigger value="grades" disabled={!selectedClassId} className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md px-6">Známky</TabsTrigger>
            </TabsList>

            <TabsContent value="classes" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacherClasses.map(c => {
                const classStudentsCount = store.users.filter(u => u.classId === c.id).length;
                return (
                  <Card key={c.id} className={`cursor-pointer transition-all hover:shadow-xl group border-none ${selectedClassId === c.id ? 'ring-2 ring-primary bg-primary/5' : 'bg-white'}`} onClick={() => { setSelectedClassId(c.id); setActiveTab('assignments'); }}>
                    <div className="h-2 bg-accent/20 w-full" />
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <div>
                        <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors">{c.name}</CardTitle>
                        {c.joinCode && (
                          <p className="text-xs font-semibold text-slate-500/80 mt-1">
                            Kód třídy: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-primary font-bold">{c.joinCode}</span>
                          </p>
                        )}
                      </div>
                      <Users className="w-6 h-6 text-accent opacity-40" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                          {classStudentsCount} {classStudentsCount === 1 ? 'Žák' : (classStudentsCount > 1 && classStudentsCount < 5 ? 'Žáci' : 'Žáků')}
                        </Badge>
                        <Button variant="ghost" size="sm" className="rounded-full" onClick={(e) => {
                          e.stopPropagation();
                          setTargetClassId(c.id);
                          setIsAddingStudent(true);
                        }}>Přidat žáka</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div>
                  <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                    Banka sdílených úkolů
                  </h2>
                  <p className="text-sm text-muted-foreground">Veřejné šablony testů sdílené ostatními učiteli.</p>
                </div>
              </div>

              {unfilteredTemplates.length > 0 && (
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Vyhledat v šablonách (název, popis, autor)..."
                      value={templateSearchQuery}
                      onChange={(e) => setTemplateSearchQuery(e.target.value)}
                      className="pl-9 rounded-2xl h-10 border-slate-200"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 font-sans">
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Předmět:</span>
                    <select
                      value={templateSelectedSubject}
                      onChange={(e) => setTemplateSelectedSubject(e.target.value)}
                      className="flex h-10 rounded-2xl border border-slate-200 bg-white px-3 py-1 text-sm font-semibold focus:outline-none w-full sm:w-48 shadow-sm"
                    >
                      <option value="Vše">Všechny předměty</option>
                      <option value="Matematika">Matematika</option>
                      <option value="Český jazyk">Český jazyk</option>
                      <option value="Anglický jazyk">Anglický jazyk</option>
                      <option value="Fyzika">Fyzika</option>
                      <option value="Chemie">Chemie</option>
                      <option value="Dějepis">Dějepis</option>
                      <option value="Zeměpis">Zeměpis</option>
                      <option value="Přírodopis">Přírodopis</option>
                      <option value="Informatika">Informatika</option>
                      <option value="Jiný">Jiný</option>
                    </select>
                  </div>
                </div>
              )}

              {unfilteredTemplates.length === 0 ? (
                <Card className="border-none shadow-md bg-white p-12 text-center text-muted-foreground rounded-3xl border border-slate-100">
                  <span className="text-4xl block mb-3">📁</span>
                  <p className="font-semibold text-lg text-slate-800">Žádné veřejné šablony k dispozici</p>
                  <p className="text-sm text-slate-500 mt-1">Můžete vytvořit vlastní test a označit jej jako veřejnou šablonu.</p>
                </Card>
              ) : publicTemplates.length === 0 ? (
                <Card className="border-none shadow-md bg-white p-12 text-center text-muted-foreground rounded-3xl border border-slate-100 animate-fade-in">
                  <span className="text-4xl block mb-3">🔍</span>
                  <p className="font-semibold text-lg text-slate-800">Nebyly nalezeny žádné šablony</p>
                  <p className="text-sm text-slate-500 mt-1">Zkuste změnit klíčová slova vyhledávání nebo zvolit jiný předmět.</p>
                  <Button
                    variant="outline"
                    className="mt-4 rounded-2xl font-bold px-5 border-slate-200"
                    onClick={() => {
                      setTemplateSearchQuery('');
                      setTemplateSelectedSubject('Vše');
                    }}
                  >
                    Resetovat filtry
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {publicTemplates.map(a => {
                    const creator = store.users.find(u => u.id === a.teacherId);
                    const isOwnTemplate = a.teacherId === currentUser.id;
                    return (
                      <Card key={a.id} className="border-none shadow-lg bg-white flex flex-col justify-between hover:shadow-xl transition-all rounded-3xl overflow-hidden border border-slate-100">
                        <CardHeader className="pb-3 bg-slate-50/50 border-b">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 font-semibold text-xs rounded-full px-2.5 py-0.5 border border-indigo-100">
                              {a.subject || 'Matematika'}
                            </Badge>
                            {isOwnTemplate && (
                              <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/20 font-bold text-[10px] rounded-full">
                                Moje šablona
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="font-headline text-lg text-slate-800 line-clamp-2 mt-1">{a.title}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1 min-h-[40px] text-xs text-slate-500">{a.description || 'Bez popisu'}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4 pt-4 text-xs text-slate-500 space-y-2 flex-grow">
                          <div className="flex justify-between border-b pb-1.5 border-slate-100">
                            <span>Počet úloh:</span>
                            <span className="font-bold text-slate-700">{a.questions?.length || 0}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1.5 border-slate-100">
                            <span>Časový limit:</span>
                            <span className="font-bold text-slate-700">{a.timeLimit ? `${a.timeLimit} minut` : 'Bez limitu'}</span>
                          </div>
                          {creator && (
                            <div className="flex justify-between">
                              <span>Autor:</span>
                              <span className="font-semibold text-slate-700 truncate max-w-[150px]">{creator.name}</span>
                            </div>
                          )}
                        </CardContent>
                        <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
                          <Button 
                            size="sm"
                            className="font-bold text-xs rounded-full flex items-center gap-1.5 shadow-sm px-4 h-9"
                            onClick={() => {
                              setSelectedTemplateForCopy(a);
                              setTemplateCopyClassId(teacherClasses[0]?.id || '');
                              setTemplateCopyStartTime('');
                              setTemplateCopyEndTime('');
                              setTemplateCopyAssignType('all');
                              setTemplateCopySelectedStudentIds([]);
                            }}
                          >
                            <Plus className="w-3.5 h-3.5" /> Použít šablonu
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Zbytek obsahu Tabs zůstává zachován */}
            <TabsContent value="assignments">
              {viewingAssignment ? (
                <div className="space-y-4">
                  <Button variant="ghost" className="rounded-full" onClick={() => setViewingAssignment(null)}>← Zpět</Button>
                  {(() => {
                    const a = store.assignments.find(x => x.id === viewingAssignment);
                    if (!a) return null;
                    return (
                      <Card className="border-none shadow-xl bg-white p-8">
                                                <h2 className="text-3xl font-headline font-bold text-primary flex items-center gap-3">
                                                  {a.title}
                                                  {a.isDraft && (
                                                    <span className="text-sm font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">💾 KONCEPT</span>
                                                  )}
                                                </h2>
                        <p className="text-muted-foreground mt-2 text-lg">{a.description}</p>

                        {/* Banner pro koncept */}
                        {a.isDraft && (
                          <div className="mt-4 flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                            <div className="flex-1">
                              <p className="font-bold text-amber-800 text-sm">Tento úkol je uložen jako koncept</p>
                              <p className="text-xs text-amber-600 mt-0.5">Žáci ho zatím nevidí. Kliknutím na „Publikovat" ho zveřejníte.</p>
                            </div>
                            <Button
                              size="sm"
                              className="font-bold bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                              onClick={() => store.updateAssignment(a.id, { isDraft: false })}
                            >
                              🚀 Publikovat
                            </Button>
                          </div>
                        )}

                        {/* Assignment Details & Settings */}
                        <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 mt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-primary uppercase tracking-wider">⚙️ Nastavení úkolu</h3>
                            <div className="flex gap-2">
                              <a
                                href={`/print/${a.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-bold text-gray-500 hover:text-primary flex items-center gap-1.5 rounded-full bg-white"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Tisk do PDF
                                </Button>
                              </a>
                              {!isEditingSettings && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs font-bold text-primary flex items-center gap-1.5 rounded-full"
                                    onClick={() => handleStartEditSettings(a)}
                                  >
                                    ✏️ Upravit nastavení
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs font-bold text-indigo-750 border-indigo-250 hover:bg-indigo-50 bg-indigo-50/20 flex items-center gap-1.5 rounded-full"
                                    onClick={() => {
                                      setEditingAssignmentId(a.id);
                                      setViewingAssignment(null);
                                    }}
                                  >
                                    📝 Upravit test / otázky
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs font-bold text-emerald-700 border-emerald-250 hover:bg-emerald-50 bg-emerald-50/20 flex items-center gap-1.5 rounded-full"
                                    onClick={() => handleGenerateVariantB(a)}
                                    disabled={isGeneratingVariant}
                                  >
                                    {isGeneratingVariant ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                                        <span>Generuji variantu B...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>💡 Generovat variantu B</span>
                                      </>
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {!isEditingSettings ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-1">
                                <span className="font-semibold text-gray-500 block text-xs uppercase">Třída a zacílení:</span>
                                <p className="font-bold text-slate-800">
                                  {store.classes.find(c => c.id === a.classId)?.name || a.classId}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {a.studentIds && a.studentIds.length > 0
                                    ? `Cíleno na vybrané žáky (${a.studentIds.length} žáků)`
                                    : 'Cíleno na celou třídu'}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <span className="font-semibold text-gray-500 block text-xs uppercase">Časová dostupnost:</span>
                                <p className="font-bold text-slate-800">
                                  {a.startTime ? `Od: ${formatDateTime(a.startTime)}` : 'Ihned dostupné'}
                                </p>
                                <p className="font-bold text-slate-800">
                                  {a.endTime ? `Do: ${formatDateTime(a.endTime)}` : 'Bez uzávěrky'}
                                </p>
                                {a.timeLimit ? (
                                  <p className="font-bold text-slate-850">⏱️ Limit: {a.timeLimit} minut</p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">⏱️ Bez časového limitu</p>
                                )}
                                {a.isPublicTemplate && (
                                  <p className="text-xs font-bold text-indigo-600">🌐 Veřejná šablona</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4 pt-2">

                              <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">🎯 Zacílení žáků:</label>
                                <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 h-10">
                                  <button
                                    type="button"
                                    onClick={() => setEditAssignType('all')}
                                    className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${editAssignType === 'all' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-slate-50'}`}
                                  >
                                    Celá třída
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditAssignType('specific')}
                                    className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${editAssignType === 'specific' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-slate-50'}`}
                                  >
                                    Vybraní žáci
                                  </button>
                                </div>
                              </div>

                              {editAssignType === 'specific' && (
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-gray-500 uppercase">Výběr žáků:</label>
                                  <div className="border rounded-xl bg-white p-3 max-h-36 overflow-y-auto space-y-1.5">
                                    {(() => {
                                      const activeStudents = store.users.filter(u => u.role === 'student' && u.classId === a.classId);
                                      if (activeStudents.length === 0) {
                                        return <p className="text-xs text-muted-foreground italic text-center py-2">Ve třídě nejsou žádní žáci.</p>;
                                      }
                                      return activeStudents.map(s => {
                                        const isChecked = editSelectedStudentIds.includes(s.id);
                                        return (
                                          <label key={s.id} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => {
                                                if (isChecked) {
                                                  setEditSelectedStudentIds(prev => prev.filter(id => id !== s.id));
                                                } else {
                                                  setEditSelectedStudentIds(prev => [...prev, s.id]);
                                                }
                                              }}
                                              className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                                            />
                                            <span>{s.name} <span className="text-gray-400">({s.username})</span></span>
                                          </label>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-gray-500 uppercase">Zahájení (od kdy):</label>
                                  <Input 
                                    type="datetime-local" 
                                    value={editStartTime} 
                                    onChange={e => setEditStartTime(e.target.value)}
                                    className="h-10 text-sm"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-gray-500 uppercase">Uzávěrka (do kdy):</label>
                                  <Input 
                                    type="datetime-local" 
                                    value={editEndTime} 
                                    onChange={e => setEditEndTime(e.target.value)}
                                    className="h-10 text-sm"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-gray-500 uppercase">Délka testu (v minutách, 0 = bez limitu):</label>
                                  <Input 
                                    type="number"
                                    min="0"
                                    value={editTimeLimit} 
                                    onChange={e => setEditTimeLimit(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="h-10 text-sm"
                                  />
                                </div>
                                <div className="flex items-center gap-2 pt-2 col-span-1 md:col-span-2">
                                  <input 
                                    type="checkbox" 
                                    id="editIsPublicTemplate"
                                    checked={editIsPublicTemplate} 
                                    onChange={e => setEditIsPublicTemplate(e.target.checked)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                  />
                                  <label htmlFor="editIsPublicTemplate" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                                    Povolit jako veřejnou šablonu pro ostatní učitele
                                  </label>
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end pt-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setIsEditingSettings(false)}
                                >
                                  Zrušit
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="font-bold"
                                  onClick={async () => {
                                    const success = await store.updateAssignment(a.id, {
                                      startTime: editStartTime || undefined,
                                      endTime: editEndTime || undefined,
                                      studentIds: editAssignType === 'specific' ? editSelectedStudentIds : [],
                                      isPublicTemplate: editIsPublicTemplate,
                                      timeLimit: editTimeLimit
                                    });
                                    if (success) {
                                      setIsEditingSettings(false);
                                    }
                                  }}
                                >
                                  Uložit změny v cloudu
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {!a.isDraft && (
                          <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-105 mt-4 space-y-4 print-exclude">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                              <div className="bg-white p-2.5 rounded-xl border border-slate-150 shadow-sm shrink-0">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/?test=' + a.id : '')}`}
                                  alt="QR kód pro vstup do testu"
                                  className="w-[120px] h-[120px]"
                                />
                              </div>
                              <div className="space-y-2 text-center sm:text-left flex-1">
                                <h3 className="font-bold text-sm text-indigo-700 uppercase tracking-wider">🔗 Vstup do testu přes odkaz / QR kód</h3>
                                <p className="text-xs text-indigo-900/80 leading-relaxed">
                                  Ukažte tento QR kód žákům nebo jim pošlete přímý odkaz. Po načtení kódu nebo kliknutí na odkaz a přihlášení se žákovi automaticky otevře tento test.
                                </p>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    readOnly
                                    value={typeof window !== 'undefined' ? `${window.location.origin}/?test=${a.id}` : ''}
                                    className="bg-white border text-xs px-3 py-1.5 rounded-lg font-mono text-gray-650 flex-1 focus:outline-none"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50 bg-white"
                                    onClick={() => {
                                      if (typeof window !== 'undefined') {
                                        navigator.clipboard.writeText(`${window.location.origin}/?test=${a.id}`);
                                        toast({ title: "Odkaz zkopírován", description: "Odkaz na test byl uložen do schránky." });
                                      }
                                    }}
                                  >
                                    Kopírovat
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100 mt-4 space-y-3 print-exclude">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-emerald-700 uppercase tracking-wider">📦 Hromadný export prací</h3>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-full flex items-center gap-1.5"
                              onClick={() => downloadAllSubmissionsZip(a.id)}
                            >
                              📥 Stáhnout ZIP s PDF
                            </Button>
                          </div>
                          <p className="text-xs text-emerald-600/80">Stáhněte si vypracované a opravené testy všech žáků v jednom ZIP archivu.</p>
                        </div>

                        <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100 mt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-blue-700 uppercase tracking-wider">📤 Poslat jako kopii do jiné třídy</h3>
                            {!isSendingCopy && (
                              <Button variant="outline" size="sm"
                                className="h-8 text-xs font-bold text-blue-700 border-blue-200 hover:bg-blue-50 rounded-full"
                                onClick={() => handleStartSendCopy(a)}>
                                + Poslat kopii
                              </Button>
                            )}
                          </div>
                          {isSendingCopy ? (
                            <div className="space-y-4 pt-1">
                              <p className="text-xs text-blue-600/80">Vytvoří se <strong>nová nezávislá kopie</strong> testu s vlastním časovým limitem. Původní test zůstane beze změny.</p>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">Cílová třída:</label>
                                <select value={copyTargetClassId} onChange={e => { setCopyTargetClassId(e.target.value); setCopySelectedStudentIds([]); }}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                                  <option value="">— Vyberte třídu —</option>
                                  {store.classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}{c.id === a.classId ? ' (stejná třída — nový ročník)' : ''}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">Zacílení žáků:</label>
                                <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 h-10">
                                  <button type="button" onClick={() => setCopyAssignType('all')}
                                    className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${copyAssignType === 'all' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-slate-50'}`}>Celá třída</button>
                                  <button type="button" onClick={() => setCopyAssignType('specific')}
                                    className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${copyAssignType === 'specific' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-slate-50'}`}>Vybraní žáci</button>
                                </div>
                              </div>
                              {copyAssignType === 'specific' && copyTargetClassId && (
                                <div className="border rounded-xl bg-white p-3 max-h-32 overflow-y-auto space-y-1.5">
                                  {store.users.filter(u => u.role === 'student' && u.classId === copyTargetClassId).map(s => {
                                    const isCopyChecked = copySelectedStudentIds.includes(s.id);
                                    return (
                                      <label key={s.id} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                        <input type="checkbox" checked={isCopyChecked}
                                          onChange={() => { if (isCopyChecked) setCopySelectedStudentIds(prev => prev.filter(id => id !== s.id)); else setCopySelectedStudentIds(prev => [...prev, s.id]); }}
                                          className="rounded border-gray-300 text-primary h-3.5 w-3.5" />
                                        <span>{s.name} <span className="text-gray-400">({s.username})</span></span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-gray-500 uppercase">Zahájení (od kdy):</label>
                                  <Input type="datetime-local" value={copyStartTime} onChange={e => setCopyStartTime(e.target.value)} className="h-10 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-gray-500 uppercase">Uzávěrka (do kdy):</label>
                                  <Input type="datetime-local" value={copyEndTime} onChange={e => setCopyEndTime(e.target.value)} className="h-10 text-sm" />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end pt-1">
                                <Button variant="ghost" size="sm" onClick={() => setIsSendingCopy(false)}>Zrušit</Button>
                                <Button size="sm" className="font-bold bg-blue-600 hover:bg-blue-700 text-white" disabled={!copyTargetClassId}
                                  onClick={() => {
                                    if (!copyTargetClassId) return;
                                    store.addAssignment({
                                      title: a.title, description: a.description,
                                      classId: copyTargetClassId, teacherId: a.teacherId,
                                      subject: a.subject || 'Jiný', questions: a.questions,
                                      dueDate: copyEndTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                      fileUri: a.fileUri,
                                      startTime: copyStartTime || undefined,
                                      endTime: copyEndTime || undefined,
                                      studentIds: copyAssignType === 'specific' ? copySelectedStudentIds : []
                                    });
                                    setIsSendingCopy(false);
                                  }}>
                                  Vytvořit kopii pro {store.classes.find(c => c.id === copyTargetClassId)?.name || '...'}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs text-blue-500/70">Kopie testu umožňuje nastavit jiný časový limit pro každou třídu zvlášť. Lze použít i pro stejnou třídu — např. příští rok.</p>
                              <Button
                                variant="outline" size="sm"
                                className="w-full h-9 text-xs font-bold text-gray-600 border-gray-200 hover:bg-gray-50"
                                onClick={() => {
                                  store.addAssignment({
                                    title: `${a.title} (kopie)`,
                                    description: a.description,
                                    classId: a.classId,
                                    teacherId: a.teacherId,
                                    subject: a.subject || 'Jiný',
                                    questions: a.questions,
                                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                    fileUri: a.fileUri,
                                    studentIds: [],
                                    isDraft: true,
                                  });
                                }}
                              >
                                📋 Duplikovat jako koncept (stejná třída)
                              </Button>

                              <Button
                                variant="outline" size="sm"
                                disabled={isGeneratingAlternative}
                                className="w-full h-9 text-xs font-bold text-violet-700 border-violet-250 hover:bg-violet-50 bg-violet-50/30 flex items-center justify-center gap-1.5"
                                onClick={async () => {
                                  setIsGeneratingAlternative(true);
                                  try {
                                    const res = await fetch('/api/ai', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        action: 'generateAlternative',
                                        questions: a.questions
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.error) {
                                      toast({ title: "Chyba generování", description: data.error, variant: "destructive" });
                                    } else if (data.questions) {
                                      store.addAssignment({
                                        title: `${a.title} - Skupina B`,
                                        description: a.description,
                                        classId: a.classId,
                                        teacherId: a.teacherId,
                                        subject: a.subject || 'Jiný',
                                        questions: data.questions,
                                        dueDate: a.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                        fileUri: a.fileUri,
                                        studentIds: a.studentIds || [],
                                        isDraft: true,
                                      });
                                      toast({ title: "Skupina B vytvořena", description: `Byla vygenerována nová verze testu a uložena jako koncept.`, variant: "default" });
                                    }
                                  } catch (err: any) {
                                    console.error(err);
                                    toast({ title: "Chyba", description: "Nepodařilo se komunikovat s AI serverem.", variant: "destructive" });
                                  } finally {
                                    setIsGeneratingAlternative(false);
                                  }
                                }}
                              >
                                {isGeneratingAlternative ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-750" />
                                    Generuji skupinu B...
                                  </>
                                ) : (
                                  <>✨ Generovat Skupinu B (AI)</>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>

                        {a.questions && a.questions.length > 0 && (
                          <div className="mt-8">
                            <h3 className="font-semibold text-xl mb-4">Otázky v testu:</h3>
                            <div className="space-y-3">
                              {a.questions.map(q => (
                                <div key={q.id} className="p-4 bg-gray-50 rounded-lg flex flex-col gap-2 border w-full">
                                  <div className="flex justify-between items-center w-full">
                                    <span className="font-medium">{q.text}</span>
                                    <Badge variant="outline">
                                      {q.type === 'short_answer' ? 'Krátká odpověď' : 
                                       q.type === 'long_answer' ? 'Dlouhá odpověď' : 
                                       q.type === 'multiple_choice' ? 'Výběr z možností' : 
                                       q.type === 'axis' ? 'Osa X/Y' : 
                                       q.type === 'number_line' ? 'Číselná osa' : q.type === 'true_false' ? 'Ano / Ne' : 
                                       q.type === 'drawing' ? 'Kresba' :
                                               q.type === 'graph' ? 'Graf' :
                                               q.type === 'cloze' ? 'Doplňovačka' :
                                               q.type === 'audio' ? 'Poslech / Diktát' : q.type}
                                    </Badge>
                                  </div>
                                  {q.type === 'cloze' && (
                                    <div className="p-3 bg-white rounded-xl border border-slate-200 leading-relaxed text-slate-800 font-medium text-sm mt-1 select-none w-full">
                                      {(() => {
                                        const parts = parseClozeText(q.clozeText || q.text || '');
                                        return parts.map((part, i) => {
                                          if (part.type === 'text') {
                                            return <span key={i}>{part.text}</span>;
                                          } else if (part.type === 'dropdown') {
                                            const sortedOptions = [...(part.options || [])].sort((a, b) => a.localeCompare(b));
                                            return (
                                              <select
                                                key={i}
                                                disabled
                                                className="mx-1 h-7 rounded bg-slate-50 border border-slate-300 px-1 text-xs font-bold text-indigo-750 inline-block align-middle"
                                              >
                                                <option>{part.correctAnswer} (správně)</option>
                                                {sortedOptions.filter(opt => opt !== part.correctAnswer).map((opt, optIdx) => (
                                                  <option key={optIdx}>{opt}</option>
                                                ))}
                                              </select>
                                            );
                                          } else {
                                            return (
                                              <input
                                                key={i}
                                                type="text"
                                                disabled
                                                value={part.correctAnswer || ''}
                                                style={{ width: `${Math.max(4, (part.correctAnswer || '').length + 1)}ch` }}
                                                className="mx-1 h-7 rounded bg-green-50 border border-green-300 px-1 text-xs font-bold text-green-700 text-center inline-block align-middle"
                                              />
                                            );
                                          }
                                        });
                                      })()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {a.fileUri && (
                           <div className="mt-8">
                              <h3 className="font-semibold text-xl mb-4">Připojený dokument / Nákres:</h3>
                              <img src={a.fileUri} className="w-full max-w-3xl border shadow-sm rounded-xl" />
                           </div>
                        )}
                      </Card>
                    );
                  })()}
                </div>
              ) : isCreatingAssignment ? (
                <div className="space-y-4">
                  <Button variant="ghost" className="rounded-full" onClick={() => { setIsCreatingAssignment(false); setGeneratedQuestions(null); }}>← Zpět</Button>
                  <AssignmentCreator 
                    classId={selectedClassId!} 
                    students={store.users.filter(u => u.role === 'student' && u.classId === selectedClassId)}
                    classes={store.classes}
                    allStudents={store.users}
                    initialQuestions={generatedQuestions || undefined}
                    onSave={(a) => {
                      store.addAssignment(a);
                      setIsCreatingAssignment(false);
                      setGeneratedQuestions(null);
                    }} 
                  />
                </div>
              ) : editingAssignmentId ? (
                <div className="space-y-4">
                  <Button variant="ghost" className="rounded-full" onClick={() => setEditingAssignmentId(null)}>← Zpět</Button>
                  {(() => {
                    const targetAss = store.assignments.find(a => a.id === editingAssignmentId);
                    if (!targetAss) return null;
                    const hasSubmissions = store.submissions.some(s => s.assignmentId === targetAss.id && s.submittedAt !== "");
                    return (
                      <div className="space-y-4">
                        {hasSubmissions && (
                          <div className="bg-amber-50 border border-amber-250 rounded-2xl p-4 text-left">
                            <h4 className="font-bold text-amber-800 text-sm flex items-center gap-1.5 select-none">
                              ⚠️ Pozor: Žáci již začali test vypracovávat nebo jej odevzdali
                            </h4>
                            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                              Tento test již obsahuje odevzdané studentské práce. Přidávání, odebírání nebo úprava stávajících otázek může narušit již odeslané odpovědi a ovlivnit jejich hodnocení.
                            </p>
                          </div>
                        )}
                        <AssignmentCreator 
                          classId={selectedClassId!} 
                          students={store.users.filter(u => u.role === 'student' && u.classId === selectedClassId)}
                          classes={store.classes}
                          allStudents={store.users}
                          initialAssignment={targetAss}
                          onSave={(updatedFields) => {
                            store.updateAssignment(targetAss.id, updatedFields);
                            setEditingAssignmentId(null);
                          }} 
                        />
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-headline font-black text-gray-800">Zadané práce</h3>
                      <p className="text-sm text-muted-foreground">Přehled a správa všech zadaných úkolů pro tuto třídu.</p>
                    </div>
                    <Button className="rounded-full shadow-md" onClick={() => setIsCreatingAssignment(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Vytvořit práci
                    </Button>
                  </div>

                  {/* Split columns for Teacher assignments */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                    {/* LEVÝ SLOUPEC: TESTY (ZNÁMKOVANÉ) */}
                    <div className="space-y-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100/80 shadow-sm flex flex-col">
                      <div className="border-b pb-4 flex items-center gap-3">
                        <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
                          <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-headline font-bold text-primary">Známkované testy</h2>
                          <p className="text-xs text-muted-foreground">Práce, které známkujete vy nebo vyžadují ruční kontrolu.</p>
                        </div>
                      </div>

                      <div className="grid gap-3 flex-1 align-content-start">
                        {(() => {
                          const graded = store.assignments.filter(
                            a => a.classId === selectedClassId && (a.teacherId === currentUser.id || !a.teacherId) && !a.isPractice
                          );

                          if (graded.length === 0) {
                            return (
                              <Card className="border-none shadow-xs bg-white p-6 text-center">
                                <p className="text-xs text-muted-foreground">Zatím nebyly zadány žádné známkované testy.</p>
                              </Card>
                            );
                          }

                          return graded.map(a => (
                            <Card key={a.id} className={`hover:border-primary cursor-pointer transition-all border-none shadow-sm ${a.isDraft ? 'bg-amber-50/40 border border-amber-200' : 'bg-white'}`} onClick={() => setViewingAssignment(a.id)}>
                              <CardContent className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                  <ClipboardList className={`w-5 h-5 ${a.isDraft ? 'text-amber-500' : 'text-primary'}`} />
                                  <div>
                                    <h4 className="font-bold text-base text-gray-800">{a.title}</h4>
                                    {a.isDraft && <span className="text-[10px] font-bold text-amber-600 block">💾 Koncept — neuveřejněno</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <a
                                    href={`/print/${a.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-primary rounded-full w-8 h-8">
                                      <Printer className="w-4 h-4" />
                                    </Button>
                                  </a>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8" 
                                    onClick={(e) => {
                                      if (confirm(`Opravdu chcete smazat úkol "${a.title}"? Tím smažete i všechny odevzdané práce žáků.`)) {
                                        store.deleteAssignment(a.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <ChevronRight className="w-5 h-5 text-gray-300 cursor-pointer" onClick={() => setViewingAssignment(a.id)} />
                                </div>
                              </CardContent>
                            </Card>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* PRAVÝ SLOUPEC: PROCVIČOVÁNÍ (NEZNÁMKOVANÉ) */}
                    <div className="space-y-6 bg-indigo-50/20 p-6 rounded-3xl border border-indigo-100/50 shadow-sm flex flex-col">
                      <div className="border-b pb-4 flex items-center gap-3">
                        <div className="bg-indigo-600/10 p-2.5 rounded-2xl text-indigo-750">
                          <Sparkles className="w-6 h-6 text-indigo-650 animate-pulse" />
                        </div>
                        <div>
                          <h2 className="text-xl font-headline font-bold text-indigo-950">Neznámkované procvičování</h2>
                          <p className="text-xs text-indigo-600/80">Procvičování automaticky opravované a vysvětlované AI.</p>
                        </div>
                      </div>

                      <div className="grid gap-3 flex-1 align-content-start">
                        {(() => {
                          const practice = store.assignments.filter(
                            a => a.classId === selectedClassId && (a.teacherId === currentUser.id || !a.teacherId) && a.isPractice
                          );

                          if (practice.length === 0) {
                            return (
                              <Card className="border-none shadow-xs bg-white p-6 text-center">
                                <p className="text-xs text-muted-foreground">Zatím nebylo zadáno žádné procvičování.</p>
                              </Card>
                            );
                          }

                          return practice.map(a => (
                            <Card key={a.id} className={`hover:border-indigo-400 cursor-pointer transition-all border-none shadow-sm ${a.isDraft ? 'bg-amber-50/40 border border-amber-200' : 'bg-white'}`} onClick={() => setViewingAssignment(a.id)}>
                              <CardContent className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                  <Sparkles className={`w-5 h-5 ${a.isDraft ? 'text-amber-500' : 'text-indigo-650'}`} />
                                  <div>
                                    <h4 className="font-bold text-base text-gray-800">{a.title}</h4>
                                    {a.isDraft && <span className="text-[10px] font-bold text-amber-600 block">💾 Koncept — neuveřejněno</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <a
                                    href={`/print/${a.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-indigo-650 rounded-full w-8 h-8">
                                      <Printer className="w-4 h-4" />
                                    </Button>
                                  </a>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8" 
                                    onClick={(e) => {
                                      if (confirm(`Opravdu chcete smazat úkol "${a.title}"? Tím smažete i všechny odevzdané práce žáků.`)) {
                                        store.deleteAssignment(a.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <ChevronRight className="w-5 h-5 text-gray-300 cursor-pointer" onClick={() => setViewingAssignment(a.id)} />
                                </div>
                              </CardContent>
                            </Card>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
              <div className="flex justify-end">
                <Button className="rounded-full shadow-md animate-fade-in" onClick={() => {
                  setTargetClassId(selectedClassId);
                  setIsAddingStudent(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Zapsat žáka
                </Button>
              </div>
              <Card className="border-none shadow-xl rounded-3xl">
                <CardContent className="p-8">
                  <div className="divide-y">
                    {(() => {
                      const classStudents = store.users.filter(u => u.classId === selectedClassId);
                      if (classStudents.length === 0) {
                        return <p className="text-muted-foreground text-center py-6 font-medium">Tato třída zatím nemá žádné žáky.</p>;
                      }
                      return classStudents.map(student => (
                        <div key={student.id} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <GraduationCap className="w-5 h-5 text-accent animate-pulse" />
                            <div>
                              <p className="font-bold text-gray-800 text-lg">{student.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">ID: {student.id}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-xs text-muted-foreground bg-gray-50 px-3 py-1.5 rounded-xl border font-mono">
                              Login: <span className="font-bold text-gray-700">{student.username}</span>
                            </div>
                            <div className="text-xs text-muted-foreground bg-gray-50 px-3 py-1.5 rounded-xl border font-mono flex items-center gap-2">
                              Heslo: <span className="font-bold text-primary">{student.password || 'Nenastaveno'}</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-full text-xs font-bold gap-1 px-3"
                              onClick={() => {
                                setEditingStudentId(student.id);
                                setNewPasswordVal(student.password || '');
                              }}
                            >
                              <PenTool className="w-3.5 h-3.5" /> Změnit heslo
                            </Button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions">
              {viewingSubmission ? (
                <div className="space-y-6">
                  <Button variant="ghost" className="rounded-full" onClick={() => setViewingSubmission(null)}>← Zpět na žáky</Button>
                  {(() => {
                    const sub = store.submissions.find(s => s.id === viewingSubmission);
                    const assignment = store.assignments.find(a => a.id === sub?.assignmentId);
                    const student = store.users.find(u => u.id === sub?.studentId);
                    if (!sub || !assignment || !student) return null;
                    return (
                      <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                        <CardHeader className="bg-white border-b p-8 flex flex-row items-center justify-between gap-4">
                          <div>
                            <CardTitle className="font-headline text-3xl text-primary">{assignment.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                              <span>Odevzdal: {student.name}</span>
                              {assignment.antiCheat && (
                                <Badge variant="outline" className={`text-[10px] flex items-center gap-1 font-bold ${
                                  sub.tabFocusLostCount && sub.tabFocusLostCount > 0 
                                    ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  <Shield className="w-3 h-3" />
                                  Režim celé obrazovky: {sub.tabFocusLostCount && sub.tabFocusLostCount > 0 
                                    ? `Narušen (${sub.tabFocusLostCount}x)` 
                                    : 'V pořádku'}
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              className="rounded-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 flex items-center gap-1.5 h-10 shadow-sm"
                              onClick={() => {
                                if (confirm("Opravdu chcete smazat toto odevzdání? Žák bude moci test vypracovat a odevzdat znovu.")) {
                                  store.deleteSubmission(sub.id);
                                  setViewingSubmission(null);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" /> Smazat práci (Reset)
                            </Button>
                            <a
                              href={`/print/submission/${sub.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button 
                                className="rounded-full shadow-md bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                              >
                                🖨️ Tisk / Uložit PDF
                              </Button>
                            </a>
                          </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                          {assignment.questions && assignment.questions.length > 0 && (
                            <div className="space-y-4">
                              <label className="text-sm font-bold uppercase text-primary">Odpovědi na otázky</label>
                              <div className="space-y-4">
                                {assignment.questions.map((q, index) => {
                                  const answer = sub.answers?.[q.id];
                                  const drawing = sub.questionDrawings?.[q.id];
                                  return (
                                    <div key={q.id} className="p-4 bg-gray-50 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                      <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start mb-2">
                                          <p className="font-semibold">{index + 1}. {q.text}</p>
                                          <Badge variant="outline">
                                             {q.type === 'short_answer' ? 'Krátká odpověď' : 
                                              q.type === 'long_answer' ? 'Dlouhá odpověď' : 
                                              q.type === 'multiple_choice' ? 'Výběr z možností' : 
                                              q.type === 'axis' ? 'Osa X/Y' : 
                                              q.type === 'number_line' ? 'Číselná osa' : q.type === 'true_false' ? 'Ano / Ne' : 
                                              q.type === 'drawing' ? 'Kresba' :
                                               q.type === 'graph' ? 'Graf' :
                                               q.type === 'cloze' ? 'Doplňovačka' :
                                               q.type === 'audio' ? 'Poslech / Diktát' : q.type}
                                           </Badge>
                                        </div>
                                        
                                        {q.type !== 'drawing' && q.type !== 'graph' && q.type !== 'axis' && q.type !== 'number_line' && q.type !== 'cloze' && q.type !== 'audio' && (
                                          <div className="mt-2">
                                            <span className="text-sm font-medium text-muted-foreground mr-2">Odpověď:</span>
                                            {answer === undefined || answer === null || answer === '' ? (
                                              <span className="italic text-gray-400">Neodpovězeno</span>
                                            ) : q.type === 'multiple_choice' ? (
                                               <span className="font-bold">{String.fromCharCode(65 + Number(answer))}. {q.options?.[Number(answer)]}</span>
                                             )  : q.type === 'true_false' ? (
                                              <span className="font-bold">{answer ? '✓ Ano' : '✗ Ne'}</span>
                                            ) : (
                                              <span className="font-bold whitespace-pre-wrap">{String(answer)}</span>
                                            )}
                                          </div>
                                        )}

                                        {q.type === 'audio' && (
                                                    <div className="mt-2 space-y-2">
                                                      <div className="bg-slate-100 p-2.5 rounded-lg border text-xs">
                                                        <span className="font-bold text-slate-700 block mb-1">Zadání diktátu (učitel):</span>
                                                        {q.audioText && <p className="italic text-slate-600 mb-1">"{q.audioText}"</p>}
                                                        {q.audioUri && <audio src={q.audioUri} controls className="h-8 w-full max-w-xs mt-1" />}
                                                      </div>
                                                      <div>
                                                        <span className="text-sm font-medium text-slate-700 mr-2">Odpověď studenta:</span>
                                                        {answer ? (
                                                          <span className="font-semibold text-slate-800 bg-white px-2 py-1 border rounded">{String(answer)}</span>
                                                        ) : (
                                                          <span className="italic text-gray-400">Neodpovězeno</span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}

                                                  {q.type === 'cloze' && (
                                          <div className="mt-2 text-left">
                                            <span className="text-sm font-medium text-muted-foreground block mb-1">Odpověď (doplňovačka):</span>
                                            {answer === undefined || answer === null || Object.keys(answer).length === 0 ? (
                                              <span className="italic text-gray-400">Neodpovězeno</span>
                                            ) : (
                                              <div className="p-3 bg-white rounded-xl border border-slate-200 leading-relaxed text-slate-800 font-medium text-sm inline-block">
                                                {(() => {
                                                  const parts = parseClozeText(q.clozeText || q.text || '');
                                                  const given = answer && typeof answer === 'object' ? answer : {};
                                                  return parts.map((part, idx) => {
                                                    if (part.type === 'text') {
                                                      return <span key={idx}>{part.text}</span>;
                                                    } else {
                                                      const studentVal = String(given[part.index!] || '').trim();
                                                      const correctVal = String(part.correctAnswer || '').trim();
                                                      const isPartCorrect = studentVal.toLowerCase() === correctVal.toLowerCase();

                                                      if (!studentVal) {
                                                        return (
                                                          <span
                                                            key={idx}
                                                            className="mx-1 px-1.5 py-0.5 rounded bg-yellow-50 border border-yellow-300 text-yellow-700 text-xs font-bold"
                                                          >
                                                            [chybí, správně: {correctVal}]
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
                                                            <span className="line-through opacity-70">{studentVal}</span>
                                                            <span className="text-green-700 font-bold ml-1">({correctVal})</span> ✗
                                                          </span>
                                                        );
                                                      }
                                                    }
                                                  });
                                                })()}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {q.type === 'graph' && (
                                          <div className="mt-2 w-full">
                                            <GraphQuestionEvaluation
                                              question={q}
                                              studentAnswer={answer}
                                              score={evalScores[q.id]}
                                              maxPoints={q.points || 1}
                                            />
                                          </div>
                                        )}

                                                 {q.type === 'axis' && (
                                                   <div className="mt-2 w-full">
                                                     <AxisQuestionEvaluation
                                                       question={q}
                                                       studentAnswer={answer}
                                                       score={evalScores[q.id]}
                                                       maxPoints={q.points || 1}
                                                     />
                                                   </div>
                                                 )}


                                                 {q.type === 'number_line' && (


                                                   <div className="mt-2 w-full">


                                                     <NumberLineQuestionEvaluation


                                                       question={q}


                                                       studentAnswer={answer}


                                                       score={evalScores[q.id]}


                                                       maxPoints={q.points || 1}


                                                     />


                                                   </div>


                                                 )}

                                        {drawing && (
                                          <div className="mt-3 space-y-2 w-full text-left">
                                            <div className="flex items-center justify-between gap-4 select-none print-exclude">
                                              <span className="text-sm font-medium text-muted-foreground">Přiložená kresba:</span>
                                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-full border shadow-sm">
                                                <span>Velikost náhledu:</span>
                                                <input 
                                                  type="range"
                                                  min="150"
                                                  max="1200"
                                                  step="50"
                                                  value={teacherPreviewHeights[q.id] || 256}
                                                  onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    setTeacherPreviewHeights(prev => ({ ...prev, [q.id]: val }));
                                                  }}
                                                  className="w-24 sm:w-32 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                                />
                                                <span className="text-[10px] font-mono text-primary font-bold">{teacherPreviewHeights[q.id] || 256}px</span>
                                              </div>
                                            </div>
                                            <img 
                                              src={drawing} 
                                              className="border rounded-xl max-w-full object-contain bg-white" 
                                              style={{ maxHeight: `${teacherPreviewHeights[q.id] || 256}px` }} 
                                            />
                                          </div>
                                        )}
                                        {sub.questionFeedback && (sub.questionFeedback instanceof Map ? sub.questionFeedback.get(q.id) : (sub.questionFeedback as Record<string, string>)[q.id]) && (
                                          <div className="mt-3 p-3 text-xs font-semibold text-indigo-700 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col gap-1 text-left">
                                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">💡 Vysvětlení AI</span>
                                            <span className="font-medium text-indigo-900 leading-relaxed">{sub.questionFeedback instanceof Map ? sub.questionFeedback.get(q.id) : (sub.questionFeedback as Record<string, string>)[q.id]}</span>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border self-stretch md:self-auto justify-center md:justify-start">
                                        <span className="text-sm font-bold text-muted-foreground">Body:</span>
                                        <input 
                                          type="number"
                                          min="0"
                                          max={q.points || 1}
                                          value={evalScores[q.id] !== undefined ? evalScores[q.id] : 0}
                                          onChange={(e) => {
                                            const val = Math.min(q.points || 1, Math.max(0, parseInt(e.target.value) || 0));
                                            setEvalScores(prev => ({ ...prev, [q.id]: val }));
                                          }}
                                          className="w-12 text-center font-bold text-primary border bg-gray-50 rounded p-1"
                                        />
                                        <span className="text-sm font-bold text-muted-foreground">/ {q.points || 1}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {sub.mainWorkDrawing && (
                            <div className="space-y-2 text-left">
                              <div className="flex items-center justify-between gap-4 select-none print-exclude">
                                <label className="text-sm font-bold uppercase text-primary">Vypracovaný dokument</label>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-full border shadow-sm">
                                  <span>Velikost náhledu:</span>
                                  <input 
                                    type="range"
                                    min="300"
                                    max="2000"
                                    step="50"
                                    value={teacherPreviewHeights['main_work'] || 600}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      setTeacherPreviewHeights(prev => ({ ...prev, 'main_work': val }));
                                    }}
                                    className="w-24 sm:w-32 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                  />
                                  <span className="text-[10px] font-mono text-primary font-bold">{teacherPreviewHeights['main_work'] || 600}px</span>
                                </div>
                              </div>
                              <img 
                                src={sub.mainWorkDrawing} 
                                className="w-full border rounded-2xl object-contain bg-white" 
                                style={{ maxHeight: `${teacherPreviewHeights['main_work'] || 600}px` }} 
                              />
                            </div>
                          )}

                          {(() => {
                            const totalMax = assignment.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;
                            const totalEarned = assignment.questions?.reduce((acc, q) => acc + (evalScores[q.id] || 0), 0) || 0;
                            const pct = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
                            
                            const thresholds = assignment.gradeThresholds || [85, 65, 45, 25];
                            let suggestedGrade = 5;
                            if (pct >= (thresholds[0] ?? 85)) suggestedGrade = 1;
                            else if (pct >= (thresholds[1] ?? 65)) suggestedGrade = 2;
                            else if (pct >= (thresholds[2] ?? 45)) suggestedGrade = 3;
                            else if (pct >= (thresholds[3] ?? 25)) suggestedGrade = 4;

                            if (assignment.isPractice) {
                              return (
                                <div className="space-y-6 border-t pt-6">
                                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex justify-between items-center">
                                    <span className="font-bold text-primary">Celkové skóre:</span>
                                    <span className="text-2xl font-black text-primary">{totalEarned} / {totalMax} bodů ({pct} %)</span>
                                  </div>
                                  
                                  <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl space-y-3 text-left">
                                    <div className="text-indigo-800 font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
                                      <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                                      Neznámkované procvičování vyhodnoceno AI
                                    </div>
                                    <p className="text-sm font-medium text-indigo-950 leading-relaxed">
                                      Tento úkol slouží jako procvičování. Byl automaticky vyhodnocen pomocí AI (Gemini) při odevzdání žákem. Jako učitel jej nemusíte kontrolovat ani známkovat.
                                    </p>
                                    {sub.feedback && (
                                      <div className="mt-3 p-4 bg-white rounded-xl border border-indigo-100">
                                        <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Vygenerované hodnocení AI:</span>
                                        <p className="text-sm font-medium text-slate-800 italic leading-relaxed">"{sub.feedback}"</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Výsledky pro tiskovou verzi */}
                                  <div className="hidden print:block space-y-6 border-t pt-6 mt-6">
                                    <div className="flex justify-between items-center bg-gray-50 p-5 rounded-2xl border">
                                      <span className="font-bold text-lg text-gray-700">Vyhodnocení:</span>
                                      <span className="text-4xl font-black text-primary">Procvičování</span>
                                    </div>
                                    {sub.feedback && (
                                      <div className="space-y-2">
                                        <span className="font-bold text-sm text-gray-500 uppercase block">Hodnocení AI:</span>
                                        <p className="p-5 bg-gray-50 rounded-2xl border font-medium text-gray-800 whitespace-pre-wrap leading-relaxed">{sub.feedback}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-6">
                                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex justify-between items-center animate-fade-in">
                                  <span className="font-bold text-primary">Celkové skóre:</span>
                                  <span className="text-2xl font-black text-primary">{totalEarned} / {totalMax} bodů ({pct} %)</span>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between items-end">
                                    <label className="text-sm font-bold uppercase text-primary">Hodnocení (Známka)</label>
                                    <span className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                                      Návrh: známka {suggestedGrade} ({pct} %)
                                    </span>
                                  </div>
                                  <GradePicker 
                                    selected={evalGrade} 
                                    suggested={suggestedGrade}
                                    onSelect={(v) => {
                                      setEvalGrade(v);
                                      setIsGradeManuallySet(true);
                                    }} 
                                  />
                                </div>
                              </div>
                            );
                          })()}

                          <div className="space-y-4 pt-4 print-exclude">
                            <div className="space-y-1.5 text-left bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                💡 Specifické pokyny pro AI slovní hodnocení (nepovinné)
                              </label>
                              <Textarea 
                                placeholder="Např.: Napiš to přátelsky a povzbudivě, zdůrazni co šlo skvěle a v čem má přidat, napiš to ve 3 odrážkách..."
                                value={aiInstructions}
                                onChange={(e) => setAiInstructions(e.target.value)}
                                className="bg-white rounded-xl min-h-[60px] text-sm font-medium border-slate-200 resize-none"
                                rows={2}
                              />
                            </div>
                            <Button 
                              type="button"
                              variant="outline" 
                              className="w-full text-indigo-700 border-indigo-200 hover:bg-indigo-50 flex items-center justify-center gap-2 rounded-full font-bold h-11"
                              onClick={() => handleAiGrade(assignment, sub, aiInstructions)}
                              disabled={isAiGrading}
                            >
                              {isAiGrading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                  <span>Gemini analyzuje odpovědi a výkresy...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 text-indigo-500" />
                                  <span>Navrhnout hodnocení pomocí AI (Gemini)</span>
                                </>
                              )}
                            </Button>
                            <Textarea 
                                placeholder="Slovní hodnocení..." 
                                value={evalFeedback}
                                onChange={(e) => setEvalFeedback(e.target.value)}
                            />
                            <Button className="w-full h-12 rounded-full font-bold shadow-md" onClick={() => {
                              store.gradeSubmission(sub.id, evalGrade || 0, evalFeedback, evalScores);
                              setViewingSubmission(null);
                            }}>Uložit hodnocení v cloudu</Button>
                          </div>

                          {/* Výsledky pro tiskovou verzi */}
                          <div className="hidden print:block space-y-6 border-t pt-6 mt-6">
                            <div className="flex justify-between items-center bg-gray-50 p-5 rounded-2xl border">
                              <span className="font-bold text-lg text-gray-700">Výsledná známka:</span>
                              <span className="text-4xl font-black text-primary">{evalGrade || sub.grade || 'Nehodnoceno'}</span>
                            </div>
                            {evalFeedback && (
                              <div className="space-y-2">
                                <span className="font-bold text-sm text-gray-500 uppercase block">Slovní hodnocení:</span>
                                <p className="p-5 bg-gray-50 rounded-2xl border font-medium text-gray-800 whitespace-pre-wrap leading-relaxed">{evalFeedback}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              ) : viewingAssignmentSubs ? (() => {
                // === SEZNAM ŽÁKŮ PRO ZVOLENÝ TEST ===
                const selAssignment = store.assignments.find(a => a.id === viewingAssignmentSubs);
                if (!selAssignment) return null;

                // Všichni žáci, pro které je test určen
                const classStudents = store.users.filter(u => {
                  if (u.role !== 'student') return false;
                  if (selAssignment.studentIds && selAssignment.studentIds.length > 0) {
                    return selAssignment.studentIds.includes(u.id);
                  }
                  return u.classId === selectedClassId;
                });

                const assignmentSubmissions = store.submissions.filter(s => s.assignmentId === selAssignment.id);
                const totalMax = selAssignment.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;

                let totalEarnedOfAll = 0;
                let totalMaxOfAll = 0;
                let gradedSubmissionsCount = 0;
                let sumGrades = 0;
                const gradeCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

                assignmentSubmissions.forEach(sub => {
                  let earned = 0;
                  if (sub.questionScores) {
                    Object.values(sub.questionScores).forEach(v => { earned += v as number; });
                  }
                  totalEarnedOfAll += earned;
                  totalMaxOfAll += totalMax;
                  if (sub.grade) {
                    sumGrades += sub.grade;
                    gradedSubmissionsCount++;
                    const g = Math.round(sub.grade);
                    if (g >= 1 && g <= 5) {
                      gradeCounts[g as 1 | 2 | 3 | 4 | 5]++;
                    }
                  }
                });

                const avgSuccessPct = totalMaxOfAll > 0 ? Math.round((totalEarnedOfAll / totalMaxOfAll) * 100) : 0;
                const avgGrade = gradedSubmissionsCount > 0 ? (sumGrades / gradedSubmissionsCount).toFixed(1) : '-';
                const maxGradeCount = Math.max(...Object.values(gradeCounts), 1);

                const questionStats = (selAssignment.questions || []).map(q => {
                  const maxPoints = q.points || 1;
                  let correctCount = 0;
                  assignmentSubmissions.forEach(sub => {
                    const score = sub.questionScores?.[q.id] || 0;
                    if (score >= maxPoints) {
                      correctCount++;
                    }
                  });
                  const pct = assignmentSubmissions.length > 0 ? Math.round((correctCount / assignmentSubmissions.length) * 100) : 0;
                  return {
                    id: q.id,
                    text: q.text,
                    pct: pct,
                    correctCount,
                    totalCount: assignmentSubmissions.length
                  };
                });

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <Button variant="ghost" className="rounded-full w-fit" onClick={() => { setViewingAssignmentSubs(null); }}>← Zpět na testy</Button>
                      
                      <div className="flex items-center gap-2 print-exclude">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-9 text-xs font-bold text-red-700 border-red-200 hover:bg-red-50 rounded-full flex items-center gap-1.5"
                          onClick={() => {
                            setMonitorAssignmentId(selAssignment.id);
                          }}
                        >
                          <Activity className="w-4 h-4 text-red-500 animate-pulse" /> Sledovat test (Live)
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-9 text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-full flex items-center gap-1.5"
                          onClick={() => downloadAllSubmissionsZip(selAssignment.id)}
                        >
                          📥 Stáhnout ZIP s PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-9 text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50 rounded-full flex items-center gap-1.5"
                          onClick={() => downloadCsvResults(selAssignment.id)}
                        >
                          <Download className="w-4 h-4" /> Exportovat výsledky (CSV)
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* LEVÝ SLOUPEC: Seznam odevzdaných prací */}
                      <div className="lg:col-span-2">
                        <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
                          <CardHeader className="bg-primary/5 border-b px-6 py-4">
                            <CardTitle className="text-xl font-headline text-primary">{selAssignment.title}</CardTitle>
                            <CardDescription>
                              {selAssignment.subject && `${selAssignment.subject} · `}
                              {classStudents.length} žáků celkem
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="divide-y">
                              {classStudents.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                  <span className="text-3xl block mb-2">👤</span>
                                  <p className="font-medium">Žádní žáci v této třídě</p>
                                </div>
                              ) : (
                                classStudents.map(student => {
                                  const sub = store.submissions.find(s => s.assignmentId === selAssignment.id && s.studentId === student.id);
                                  const earned = sub?.questionScores ? Object.values(sub.questionScores).reduce((acc: number, v: any) => acc + (v as number), 0) : 0;
                                  const pct = totalMax > 0 ? Math.round((earned / totalMax) * 100) : 0;

                                  return (
                                    <div
                                      key={student.id}
                                      className={`p-5 flex items-center justify-between transition-all ${sub ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-60'}`}
                                      onClick={() => {
                                        if (!sub) return;
                                        setEvalScores(sub.questionScores ? { ...(sub.questionScores as Record<string, number>) } : {});
                                        setEvalGrade(sub.grade);
                                        setEvalFeedback(sub.feedback || '');
                                        setIsGradeManuallySet(!!sub.grade);
                                        setViewingSubmission(sub.id);
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sub ? (sub.submittedAt ? 'bg-green-500' : 'bg-amber-400') : 'bg-gray-300'}`} />
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-800">{student.name}</p>
                                            <button
                                              type="button"
                                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                                                sub?.customTimeLimit
                                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 shadow-sm'
                                                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                              }`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingStudentTime({
                                                  studentId: student.id,
                                                  studentName: student.name,
                                                  assignmentId: selAssignment.id,
                                                  currentLimit: selAssignment.timeLimit || 0,
                                                  customLimit: sub?.customTimeLimit || null
                                                });
                                                setCustomTimeVal(sub?.customTimeLimit ? String(sub.customTimeLimit) : '');
                                              }}
                                              title="Nastavit individuální časový limit (IVP/PP)"
                                            >
                                              ⏱️ {sub?.customTimeLimit ? `${sub.customTimeLimit} min (IVP)` : `${selAssignment.timeLimit || 0} min`}
                                            </button>
                                          </div>
                                          <p className="text-xs text-muted-foreground">{student.username}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {sub ? (
                                          <>
                                            <Badge variant={!selAssignment.isPractice && sub.grade ? "default" : earned > 0 ? "outline" : "secondary"} className="font-bold">
                                              {sub.submittedAt === "" ? 'Rozpracováno' : (
                                                selAssignment.isPractice
                                                  ? `Procvičování (${earned}/${totalMax}b · ${pct}%)`
                                                  : (sub.grade
                                                      ? `Zn: ${sub.grade} (${earned}/${totalMax}b · ${pct}%)`
                                                      : earned > 0
                                                        ? `Body: ${earned}/${totalMax} (${pct}%)`
                                                        : 'Neopraveno')
                                              )}
                                            </Badge>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                          </>
                                        ) : (
                                          <Badge variant="secondary" className="text-gray-400">Neodevzdáno</Badge>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* PRAVÝ SLOUPEC: Analýza úspěšnosti */}
                      <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-white">
                          <CardHeader className="bg-primary/5 border-b px-6 py-4">
                            <CardTitle className="text-lg font-headline text-primary flex items-center gap-2">
                              <Activity className="w-5 h-5 text-indigo-600" />
                              Analýza výsledků
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-6">
                            {assignmentSubmissions.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <span className="text-2xl block mb-2">📊</span>
                                <p className="text-sm font-medium">Zatím žádný student neodevzdal test.</p>
                              </div>
                            ) : (
                              <>
                                {/* Rychlé statistiky */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Průměrná známka</span>
                                    <p className="text-3xl font-bold mt-1 text-slate-800">{avgGrade}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">z {gradedSubmissionsCount} ohodnocených</p>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Průměrná úspěšnost</span>
                                    <p className="text-3xl font-bold mt-1 text-slate-800">{avgSuccessPct}%</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">z max. {totalMax} bodů</p>
                                  </div>
                                </div>

                                {(() => {
                                  const failedQuestions = questionStats
                                    .map((stat, idx) => ({ ...stat, idx: idx + 1 }))
                                    .filter(stat => stat.pct < 50);
                                  
                                  if (failedQuestions.length === 0) return null;

                                  return (
                                    <div className="bg-rose-50 border border-rose-150 rounded-xl p-4 text-xs text-rose-950 shadow-sm space-y-1.5 mt-2">
                                      <p className="font-bold flex items-center gap-1.5 text-rose-800">
                                        <span>⚠️ Doporučení k procvičení</span>
                                      </p>
                                      <p className="text-rose-900/90 leading-relaxed">
                                        Následující otázky měly úspěšnost pod 50 % a dělaly žákům největší potíže:
                                      </p>
                                      <ul className="list-disc pl-4 space-y-1 text-rose-900/90 font-semibold">
                                        {failedQuestions.map(q => (
                                          <li key={q.id}>
                                            Otázka č. {q.idx} (úspěšnost {q.pct}%) – neuspělo {100 - q.pct}% žáků.
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  );
                                })()}

                                {/* Rozložení známek */}
                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rozložení známek</h4>
                                  <div className="flex justify-between items-end gap-2 pt-2 h-32 px-2 border-b pb-1">
                                    {([1, 2, 3, 4, 5] as const).map(grade => {
                                      const count = gradeCounts[grade];
                                      const pct = Math.max(5, (count / maxGradeCount) * 100);
                                      const barColors = {
                                        1: 'bg-emerald-500 hover:bg-emerald-600',
                                        2: 'bg-teal-500 hover:bg-teal-600',
                                        3: 'bg-amber-400 hover:bg-amber-500',
                                        4: 'bg-orange-500 hover:bg-orange-600',
                                        5: 'bg-rose-500 hover:bg-rose-600'
                                      };
                                      return (
                                        <div key={grade} className="flex flex-col items-center gap-1 flex-1">
                                          <span className="text-[10px] font-bold text-slate-600">{count}x</span>
                                          <div className="w-full bg-slate-50 rounded-t-md h-20 flex items-end">
                                            <div 
                                              className={`w-full rounded-t-md transition-all duration-500 ${barColors[grade]}`} 
                                              style={{ height: `${pct}%` }} 
                                            />
                                          </div>
                                          <span className="text-xs font-bold mt-1 text-slate-700">{grade}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Analýza otázek */}
                                <div className="space-y-3">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Úspěšnost otázek</h4>
                                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                                    {questionStats.map((stat, idx) => (
                                      <div key={stat.id} className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium">
                                          <span className="text-slate-700 truncate max-w-[170px]">{idx + 1}. {stat.text || `Otázka ${idx + 1}`}</span>
                                          <span className="text-slate-600 font-bold shrink-0">{stat.pct}% ({stat.correctCount}/{stat.totalCount})</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                              stat.pct >= 80 ? 'bg-emerald-500' :
                                              stat.pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                            }`}
                                            style={{ width: `${stat.pct}%` }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                // === SEZNAM TESTŮ ===
                <div className="space-y-3">
                  {store.assignments.filter(a => a.classId === selectedClassId).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <span className="text-4xl block mb-3">📋</span>
                      <p className="font-medium">Žádné testy pro tuto třídu</p>
                    </div>
                  ) : (
                    store.assignments
                      .filter(a => a.classId === selectedClassId)
                      .map(a => {
                        const classStudents = store.users.filter(u => {
                          if (u.role !== 'student') return false;
                          if (a.studentIds && a.studentIds.length > 0) return a.studentIds.includes(u.id);
                          return u.classId === selectedClassId;
                        });
                        const subs = store.submissions.filter(s => s.assignmentId === a.id);
                        const submittedCount = subs.length;
                        const totalCount = classStudents.length;
                        const gradedCount = subs.filter(s => s.grade).length;

                        return (
                          <div
                            key={a.id}
                            onClick={() => setViewingAssignmentSubs(a.id)}
                            className="p-5 bg-white shadow-sm rounded-2xl flex items-center justify-between hover:shadow-md cursor-pointer transition-all border border-transparent hover:border-primary/20"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 truncate">{a.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {a.subject && `${a.subject} · `}
                                {a.endTime ? `Do: ${formatDateTime(a.endTime)}` : 'Bez termínu'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-bold text-primary">{submittedCount} / {totalCount}</p>
                                <p className="text-[10px] text-muted-foreground">odevzdáno</p>
                              </div>
                              {gradedCount > 0 && (
                                <Badge variant="default" className="font-bold text-xs">{gradedCount} ohodnoceno</Badge>
                              )}
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="grades" className="space-y-6">
              {/* Horizontal Subject Folders */}
              <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-100 animate-fade-in">
                {predefinedSubjects.map(subj => {
                  const isActive = selectedTeacherSubject === subj;
                  
                  // Compute count of published assignments in this subject for badges!
                  const count = store.assignments.filter(a =>
                    a.classId === selectedClassId &&
                    !a.isDraft &&
                    (subj === 'Jiný' ? (!a.subject || a.subject === 'Jiný') : (a.subject === subj))
                  ).length;

                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setSelectedTeacherSubject(subj)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 border ${
                        isActive
                          ? 'bg-primary border-primary text-white font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{subj}</span>
                      {count > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Grades grid table card */}
              <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white animate-fade-in">
                <CardHeader className="bg-slate-50/50 border-b p-6">
                  <CardTitle className="text-xl font-headline font-bold text-slate-800 flex items-center gap-2">
                    📊 Přehled klasifikace třídy — {selectedTeacherSubject}
                  </CardTitle>
                  <CardDescription>
                    Klikněte na jméno žáka pro zobrazení celé jeho žákovské knížky, nebo na „Opravit“ pro rychlé ohodnocení testu.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {classStudents.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <span className="text-3xl block mb-2">👤</span>
                      <p className="font-medium">Tato třída nemá žádné zapsané žáky.</p>
                    </div>
                  ) : subjectAssignments.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      <span className="text-3xl block mb-2">📭</span>
                      <p className="font-medium">V předmětu {selectedTeacherSubject} zatím nebyly vytvořeny žádné publikované testy.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-slate-50/50 border-b text-slate-700 text-xs uppercase tracking-wider font-bold">
                            <th className="p-4 font-extrabold w-64">Celé jméno žáka</th>
                            {subjectAssignments.map(a => (
                              <th key={a.id} className="p-4 font-extrabold max-w-[200px] truncate text-center" title={a.title}>
                                {a.title}
                              </th>
                            ))}
                            <th className="p-4 font-extrabold text-center w-24">Průměr</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                          {classStudents.map(student => {
                            // Calculate averages specifically for selected subject assignments
                            const studentSubmissions = store.submissions.filter(s =>
                              s.studentId === student.id &&
                              s.grade !== undefined &&
                              s.grade !== null &&
                              subjectAssignments.some(a => a.id === s.assignmentId)
                            );
                            const sum = studentSubmissions.reduce((acc, s) => acc + (s.grade || 0), 0);
                            const avg = studentSubmissions.length > 0 ? (sum / studentSubmissions.length) : null;

                            return (
                              <tr key={student.id} className="hover:bg-slate-50/30 transition-colors">
                                {/* Student name is clickable and opens their Gradebook! */}
                                <td 
                                  className="p-4 font-bold text-slate-800 hover:text-primary cursor-pointer flex items-center gap-2 group"
                                  onClick={() => {
                                    setSelectedGradebookStudent(student);
                                    setSelectedGradebookSubject(selectedTeacherSubject);
                                    setGradebookViewMode('child');
                                  }}
                                  title="Otevřít žákovskou knížku žáka"
                                >
                                  <GraduationCap className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
                                  <span className="group-hover:underline">{student.name}</span>
                                </td>

                                {/* Individual assignment grades */}
                                {subjectAssignments.map(a => {
                                  const sub = store.submissions.find(s => s.assignmentId === a.id && s.studentId === student.id);
                                  
                                  let earned = 0;
                                  if (sub?.questionScores) {
                                    Object.values(sub.questionScores).forEach(val => { earned += val as number; });
                                  }
                                  const totalMax = a.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;
                                  const pct = totalMax > 0 ? Math.round((earned / totalMax) * 100) : 0;

                                  return (
                                    <td key={a.id} className="p-4 text-center">
                                      {sub ? (
                                        a.isPractice ? (
                                          <Badge variant="outline" className="font-extrabold text-xs px-2.5 py-1 bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs" title={`Procvičování (${earned}/${totalMax} bodů · ${pct}%)`}>
                                            ${pct}%
                                          </Badge>
                                        ) : sub.grade ? (
                                          <Badge className="font-extrabold text-xs px-2.5 py-1 bg-primary hover:bg-primary shadow-sm">
                                            {sub.grade}
                                          </Badge>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              // Instantly jump to grading submission!
                                              setEvalScores(sub.questionScores ? { ...sub.questionScores as Record<string, number> } : {});
                                              setEvalGrade(sub.grade);
                                              setEvalFeedback(sub.feedback || '');
                                              setIsGradeManuallySet(!!sub.grade);
                                              setViewingSubmission(sub.id);
                                              
                                              setActiveTab('submissions');
                                            }}
                                            className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded-lg hover:bg-amber-100 hover:text-amber-800 transition-colors shadow-sm animate-pulse"
                                            title={`Odevzdáno bez známky (${earned}/${totalMax} bodů · ${pct}%). Kliknutím opravíte.`}
                                          >
                                            Opravit ✍️
                                          </button>
                                        )
                                      ) : (
                                        <span className="text-slate-300 font-medium">-</span>
                                      )}
                                    </td>
                                  );
                                })}

                                {/* Subject Average */}
                                <td className="p-4 text-center">
                                  {avg !== null ? (
                                    <span className="font-black text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                                      {avg.toFixed(2).replace('.', ',')}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-xs">--</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="school-admin" className="space-y-6">
              {store.currentSchool ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-200 bg-indigo-500/30 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-400/20">
                        Školní Správa
                      </span>
                      <h3 className="text-3xl font-headline font-bold mt-2">{store.currentSchool.name}</h3>
                      <p className="text-indigo-200/80 text-sm mt-1">
                        Zvací kód pro učitele: <span className="font-mono bg-white/10 px-2 py-0.5 rounded font-bold text-white select-all">{store.currentSchool.inviteCode}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl">
                      <School className="w-8 h-8 text-indigo-300" />
                      <div className="flex flex-col">
                        <span className="text-xs text-indigo-200 font-semibold">Licenční program</span>
                        <span className="text-sm font-bold text-white">Školní Licence Premium</span>
                      </div>
                    </div>
                  </div>

                  {/* Statistiky školy */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border shadow-md bg-white p-6 rounded-3xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-4">
                          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> Celoškolní AI Kredity
                          </CardTitle>
                          <span className="text-2xl font-black text-indigo-950 font-mono">
                            {store.currentSchool.aiCreditsPool ?? 0} <span className="text-sm text-slate-400 font-bold">/ {store.currentSchool.aiCreditsPoolMax ?? 0} kr.</span>
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs font-medium leading-relaxed mb-4">
                          Tento fond je sdílen všemi učiteli školy. Jako správce z něj můžete přidělovat kredity jednotlivým učitelům.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border">
                          <div 
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${store.currentSchool.aiCreditsPoolMax ? Math.min(100, Math.round(((store.currentSchool.aiCreditsPool ?? 0) / store.currentSchool.aiCreditsPoolMax) * 100)) : 0}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>Spotřebováno</span>
                          <span>Zbývá {store.currentSchool.aiCreditsPoolMax ? Math.round(((store.currentSchool.aiCreditsPool ?? 0) / store.currentSchool.aiCreditsPoolMax) * 100) : 0}%</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="border shadow-md bg-white p-6 rounded-3xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-4">
                          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" /> Registrovaní učitelé
                          </CardTitle>
                          <span className="text-2xl font-black text-indigo-950 font-mono">
                            {store.users.filter(u => u.role === 'teacher' && u.schoolId === store.currentSchool?.id).length} <span className="text-sm text-slate-400 font-bold">/ {store.currentSchool.maxTeachersCount || 10}</span>
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs font-medium leading-relaxed mb-4">
                          Každý učitel, který se registruje pod vaším zvacím kódem, získá automaticky přístup ke všem výhodám Školní licence Premium.
                        </p>
                      </div>

                      <div className="text-xs text-muted-foreground bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center gap-2 font-medium">
                        <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>
                          Licence platná do: <strong>{store.currentSchool.licenseExpiresAt ? new Date(store.currentSchool.licenseExpiresAt).toLocaleDateString('cs-CZ') : 'Nespecifikováno'}</strong>
                        </span>
                      </div>
                    </Card>
                  </div>

                  {/* Seznam učitelů naší školy */}
                  <Card className="border shadow-md bg-white rounded-3xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                      <CardTitle className="text-xl font-headline font-bold text-slate-800 flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-accent" /> Seznam učitelů školy
                      </CardTitle>
                      <CardDescription>
                        Učitelé registrovaní pod touto školou. Můžete jim přidělovat AI kredity nebo je ze školy odebrat.
                      </CardDescription>
                    </CardHeader>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-slate-100">
                            <th className="p-4 font-bold text-slate-700 text-sm">Učitel</th>
                            <th className="p-4 font-bold text-slate-700 text-sm">Uživatelské jméno</th>
                            <th className="p-4 font-bold text-slate-700 text-sm">Stav kreditů</th>
                            <th className="p-4 font-bold text-slate-700 text-sm">Přidělit z fondu školy</th>
                            <th className="p-4 font-bold text-slate-700 text-sm text-center">Akce</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            const mySchoolTeachers = store.users.filter(u => u.role === 'teacher' && u.schoolId === store.currentSchool?.id);
                            if (mySchoolTeachers.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={5} className="p-6 text-center text-muted-foreground italic">
                                    Na této škole zatím nejsou žádní další registrovaní učitelé.
                                  </td>
                                </tr>
                              );
                            }
                            return mySchoolTeachers.map(t => (
                              <tr key={t.id} className="hover:bg-slate-50/30">
                                <td className="p-4 flex items-center gap-2 flex-wrap">
                                  <GraduationCap className="w-4 h-4 text-accent shrink-0" />
                                  <span className="font-bold text-slate-800">{t.name}</span>
                                  {t.isSchoolAdmin && (
                                    <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-250 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                      Správce
                                    </span>
                                  )}
                                  {t.id === currentUser.id && (
                                    <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border px-1.5 py-0.5 rounded-full shrink-0">
                                      Vy
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-sm text-slate-600 font-mono">{t.username}</td>
                                <td className="p-4">
                                  <div className="text-[10px] font-semibold text-indigo-950 font-mono bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg w-max flex flex-col shrink-0">
                                    <span>AI: {t.aiCredits !== undefined ? t.aiCredits : 30} / {t.aiCreditsMax || 30}</span>
                                    {t.aiExtraCredits ? <span className="text-[9px] text-indigo-600 font-bold font-sans">+{t.aiExtraCredits} extra</span> : null}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      type="button"
                                      className="h-7 text-[10px] px-2 rounded-xl font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                      onClick={() => {
                                        if ((store.currentSchool?.aiCreditsPool ?? 0) < 50) {
                                          toast({ title: "Nedostatek kreditů", description: "Ve školním fondu není dostatek kreditů.", variant: "destructive" });
                                          return;
                                        }
                                        store.allocateSchoolCredits(t.id, 50);
                                      }}
                                    >
                                      +50
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      type="button"
                                      className="h-7 text-[10px] px-2 rounded-xl font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                      onClick={() => {
                                        if ((store.currentSchool?.aiCreditsPool ?? 0) < 100) {
                                          toast({ title: "Nedostatek kreditů", description: "Ve školním fondu není dostatek kreditů.", variant: "destructive" });
                                          return;
                                        }
                                        store.allocateSchoolCredits(t.id, 100);
                                      }}
                                    >
                                      +100
                                    </Button>
                                    
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        placeholder="Vlastní"
                                        value={schoolCustomCredits[t.id] ?? ''}
                                        onChange={e => setSchoolCustomCredits(prev => ({ ...prev, [t.id]: e.target.value }))}
                                        className="h-7 w-16 text-[10px] px-1.5 bg-white rounded-lg border border-slate-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        type="button"
                                        className="h-7 text-[10px] px-2 rounded-xl font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                        onClick={() => {
                                          const amount = parseInt(schoolCustomCredits[t.id] || '0');
                                          if (amount > 0) {
                                            if ((store.currentSchool?.aiCreditsPool ?? 0) < amount) {
                                              toast({ title: "Nedostatek kreditů", description: "Ve školním fondu není dostatek kreditů.", variant: "destructive" });
                                              return;
                                            }
                                            store.allocateSchoolCredits(t.id, amount);
                                            setSchoolCustomCredits(prev => ({ ...prev, [t.id]: '' }));
                                          } else {
                                            toast({ title: "Chyba", description: "Zadejte platné kladné číslo.", variant: "destructive" });
                                          }
                                        }}
                                      >
                                        Přidat
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  {t.id === currentUser.id ? (
                                    <span className="text-xs text-muted-foreground italic bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                                      Nelze odebrat
                                    </span>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      type="button"
                                      className="h-8 px-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold flex items-center gap-1 mx-auto"
                                      onClick={() => {
                                        if (confirm(`Opravdu chcete odebrat učitele ${t.name} ze školy? Tímto ztratí přístup k licencovaným funkcím školy.`)) {
                                          store.removeTeacherFromSchool(t.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Odebrat ze školy
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Zadání a testy učitelů školy */}
                  <Card className="border shadow-md bg-white rounded-3xl overflow-hidden mt-6">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                      <CardTitle className="text-xl font-headline font-bold text-slate-800 flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-indigo-650" /> Zadání a testy učitelů školy
                      </CardTitle>
                      <CardDescription>
                        Přehled všech vytvořených testů, konceptů a šablon učitelů vaší školy. Jako správce je můžete kontrolovat a případně odstraňovat.
                      </CardDescription>
                    </CardHeader>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-slate-100">
                            <th className="p-4 font-bold text-slate-700 text-sm">Učitel (Autor)</th>
                            <th className="p-4 font-bold text-slate-700 text-sm">Název testu / zadání</th>
                            <th className="p-4 font-bold text-slate-700 text-sm">Předmět</th>
                            <th className="p-4 font-bold text-slate-700 text-sm">Třída</th>
                            <th className="p-4 font-bold text-slate-700 text-sm">Stav / Typ</th>
                            <th className="p-4 font-bold text-slate-700 text-sm text-center">Akce</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            const mySchoolAssignments = store.assignments.filter(a => a.schoolId === store.currentSchool?.id);
                            if (mySchoolAssignments.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="p-6 text-center text-muted-foreground italic">
                                    Na této škole zatím nebyla vytvořena žádná zadání ani testy.
                                  </td>
                                </tr>
                              );
                            }
                            return mySchoolAssignments.map(a => {
                              const author = store.users.find(u => u.id === a.teacherId);
                              const cls = store.classes.find(c => c.id === a.classId);
                              return (
                                <tr key={a.id} className="hover:bg-slate-50/30">
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="font-semibold text-slate-705">{author?.name || 'Neznámý'}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 font-bold text-slate-800">{a.title}</td>
                                  <td className="p-4 text-sm text-slate-600">
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                      {a.subject || 'Matematika'}
                                    </Badge>
                                  </td>
                                  <td className="p-4 text-sm text-slate-600 font-semibold">
                                    {a.isPublicTemplate ? (
                                      <span className="text-indigo-650 italic">Šablona (veřejná)</span>
                                    ) : (
                                      cls?.name || '—'
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <div className="flex flex-wrap gap-1.5">
                                      {a.isPractice ? (
                                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] rounded-full uppercase tracking-wider">
                                          Procvičování
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold text-[9px] rounded-full uppercase tracking-wider">
                                          Test k oznámkování
                                        </Badge>
                                      )}
                                      {a.isDraft ? (
                                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border border-amber-200/50 font-bold text-[9px] rounded-full uppercase tracking-wider">
                                          Koncept
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[9px] rounded-full uppercase tracking-wider">
                                          Publikováno
                                        </Badge>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {/* Náhled zadání */}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        type="button"
                                        title="Zobrazit otázky a zadání"
                                        className="h-8 px-2.5 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1"
                                        onClick={() => {
                                          setSelectedClassId(a.classId || '');
                                          setActiveTab('assignments');
                                          setViewingAssignment(a.id);
                                        }}
                                      >
                                        <BookOpen className="w-3.5 h-3.5" /> Náhled
                                      </Button>

                                      {/* Výsledky žáků */}
                                      {!a.isDraft && a.classId && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          type="button"
                                          title="Zobrazit odevzdané práce a známky"
                                          className="h-8 px-2.5 rounded-xl border-indigo-150 hover:bg-indigo-50/50 text-indigo-700 font-bold text-xs flex items-center gap-1"
                                          onClick={() => {
                                            setSelectedClassId(a.classId);
                                            setActiveTab('submissions');
                                            setViewingAssignmentSubs(a.id);
                                          }}
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" /> Výsledky
                                        </Button>
                                      )}

                                      {/* Tisk / PDF */}
                                      <a
                                        href={`/print/${a.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Tisk zadání"
                                      >
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          type="button"
                                          className="h-8 w-8 p-0 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
                                        >
                                          <Printer className="w-3.5 h-3.5" />
                                        </Button>
                                      </a>

                                      {/* Odstranit */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        type="button"
                                        title="Smazat zadání"
                                        className="h-8 w-8 p-0 rounded-xl text-red-650 hover:text-red-700 hover:bg-red-50 flex items-center justify-center"
                                        onClick={() => {
                                          if (confirm(`Opravdu chcete smazat úkol "${a.title}" vytvořený učitelem ${author?.name || ''}? Tím smažete i všechny odevzdané práce žáků.`)) {
                                            store.deleteAssignment(a.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-100 rounded-3xl shadow-sm text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <h4 className="text-lg font-bold text-slate-800">Načítání informací o škole...</h4>
                  <p className="text-slate-500 text-sm mt-1">Pokud načítání trvá příliš dlouho, zkontrolujte, zda jste přiřazeni ke škole.</p>
                </div>
              )}
            </TabsContent>

          </Tabs>

          <AddTeacherDialog
            isAddingTeacher={isAddingTeacher}
            setIsAddingTeacher={setIsAddingTeacher}
            schools={schools}
            onTeacherAdded={(newTeacher: any) => store.addTeacher(newTeacher)}
          />

          <Dialog open={isAddingStudent} onOpenChange={(open) => {
            setIsAddingStudent(open);
            if (!open) {
              setStudentActionType('create');
              setNewStudentName('');
              setNewStudentUsername('');
              setNewStudentPassword('');
              setSelectedExistingStudentId('');
              setStudentSearch('');
              setCsvFile(null);
              setCsvParsingError(null);
              setCsvImportProgress('');
            }
          }}>
            <DialogContent aria-describedby={undefined} className="rounded-3xl border-none shadow-2xl max-w-md bg-white">
              <DialogHeader><DialogTitle className="text-2xl font-headline font-bold text-primary">Zapsat žáka</DialogTitle></DialogHeader>
              
              {store.currentUser?.role === 'admin' && (
                <div className="space-y-1.5 mb-4">
                  <Label className="font-bold text-gray-700">Cílová třída</Label>
                  <select
                    value={targetClassId || ''}
                    onChange={(e) => setTargetClassId(e.target.value || null)}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">-- Vyberte cílovou třídu --</option>
                    {store.classes.map(c => {
                      const schoolName = schools.find(s => s.id === c.schoolId)?.name || 'Bez školy';
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} ({schoolName})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-1 bg-gray-100 rounded-lg mb-4 p-1">
                <button 
                  type="button" 
                  className={`py-2 text-xs font-semibold rounded-md transition-all ${studentActionType === 'create' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                  onClick={() => setStudentActionType('create')}
                >Vytvořit</button>
                <button 
                  type="button" 
                  className={`py-2 text-xs font-semibold rounded-md transition-all ${studentActionType === 'select' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                  onClick={() => setStudentActionType('select')}
                >Přiřadit</button>
                <button 
                  type="button" 
                  className={`py-2 text-xs font-semibold rounded-md transition-all ${studentActionType === 'csv' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                  onClick={() => setStudentActionType('csv')}
                >Z CSV</button>
              </div>

              {studentActionType === 'create' ? (
                <div className="space-y-4 py-4">
                  <Input placeholder="Jméno žáka" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                  <Input placeholder="Login" value={newStudentUsername} onChange={(e) => setNewStudentUsername(e.target.value)} />
                  <Input type="password" placeholder="Heslo" value={newStudentPassword} onChange={(e) => setNewStudentPassword(e.target.value)} />
                </div>
              ) : studentActionType === 'select' ? (
                <div className="py-4 space-y-2">
                  <Label className="text-sm text-muted-foreground">Vyberte žáka ze systému:</Label>
                  <Input 
                    placeholder="🔍 Vyhledat žáka podle jména nebo loginu..." 
                    value={studentSearch} 
                    onChange={(e) => setStudentSearch(e.target.value)} 
                    className="mb-2"
                  />
                  {(() => {
                    if (store.currentUser?.role === 'admin' && !targetClassId) {
                      return <p className="text-sm text-amber-600 font-semibold py-2">Pro výběr žáků nejprve zvolte cílovou třídu nahoře.</p>;
                    }
                    const availableStudents = store.users.filter(u => u.role === 'student' && u.classId !== targetClassId);
                    if (availableStudents.length === 0) {
                      return <p className="text-sm text-amber-600 font-semibold py-2">Žádní další žáci nebyli v systému nalezeni.</p>;
                    }
                    const filtered = availableStudents.filter(u => 
                      u.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      u.username.toLowerCase().includes(studentSearch.toLowerCase())
                    );
                    if (filtered.length === 0) {
                      return <p className="text-sm text-amber-600 font-semibold py-2">Žádný žák neodpovídá vyhledávání.</p>;
                    }
                    return (
                      <select
                        value={selectedExistingStudentId}
                        onChange={(e) => setSelectedExistingStudentId(e.target.value)}
                        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">-- Vyberte žáka ({filtered.length}) --</option>
                        {filtered.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="existingCsvFile" className="font-bold text-gray-700">CSV soubor se žáky</Label>
                    <Input 
                      id="existingCsvFile" 
                      type="file" 
                      accept=".csv" 
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          setCsvFile(files[0]);
                        }
                      }}
                      className="file:bg-primary/5 file:text-primary file:border-none file:px-3 file:py-1 file:rounded-lg file:font-semibold cursor-pointer"
                    />
                    <div className="text-[11px] text-muted-foreground bg-gray-50 p-3.5 rounded-2xl border space-y-1.5 leading-relaxed">
                      <p className="font-bold text-gray-700 text-xs">Struktura sloupců v CSV souboru:</p>
                      <p>Záhlaví: <code className="bg-gray-200/85 px-1.5 py-0.5 rounded font-mono text-[10px] text-primary">Jméno;Uživatelské jméno;Heslo</code></p>
                      <p>• Jako oddělovač je podporován středník (<code className="font-bold font-mono">;</code>) i čárka (<code className="font-bold font-mono">,</code>).</p>
                    </div>
                  </div>

                  {csvParsingError && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100 animate-pulse">
                      ⚠️ {csvParsingError}
                    </div>
                  )}

                  {csvImportProgress && (
                    <div className="p-3 bg-primary/5 text-primary rounded-xl text-xs font-bold border border-primary/10 flex items-center gap-2.5 justify-center">
                      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      {csvImportProgress}
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                {studentActionType === 'create' ? (
                  <Button onClick={handleAddStudent} disabled={!(targetClassId || selectedClassId)}>Vytvořit</Button>
                ) : studentActionType === 'select' ? (
                  <Button 
                    onClick={() => {
                      const classId = targetClassId || selectedClassId;
                      if (selectedExistingStudentId && classId) {
                        store.assignStudent(selectedExistingStudentId, classId);
                        setIsAddingStudent(false);
                        setSelectedExistingStudentId('');
                      }
                    }} 
                    disabled={!selectedExistingStudentId || !(targetClassId || selectedClassId)}
                  >Přiřadit žáka</Button>
                ) : (
                  <Button
                    onClick={handleImportCSVToExisting}
                    disabled={!csvFile || !!csvImportProgress || !(targetClassId || selectedClassId)}
                    className="w-full"
                  >
                    Importovat žáky z CSV
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog pro individuální úpravu času žáka */}
          <Dialog open={editingStudentTime !== null} onOpenChange={(open) => {
            if (!open) {
              setEditingStudentTime(null);
              setCustomTimeVal('');
            }
          }}>
            <DialogContent className="rounded-3xl border-none shadow-2xl max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                  ⏱️ Individuální úprava času
                </DialogTitle>
                <DialogDescription>
                  Upravte časový limit pro žáka <span className="font-bold text-slate-800">{editingStudentTime?.studentName}</span>.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="bg-slate-50 p-4 rounded-2xl border text-sm space-y-1">
                  <p className="text-slate-500">Výchozí čas testu: <span className="font-bold text-slate-700">{editingStudentTime?.currentLimit} minut</span></p>
                  <p className="text-slate-500">
                    Aktivní limit: <span className="font-bold text-indigo-700">
                      {editingStudentTime?.customLimit !== null ? `${editingStudentTime?.customLimit} minut (Individuální)` : 'Výchozí limit testu'}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-gray-700">Nový časový limit (v minutách)</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    placeholder="Např. 30" 
                    value={customTimeVal} 
                    onChange={(e) => setCustomTimeVal(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rychlé volby</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="text-xs" 
                      onClick={() => {
                        const base = editingStudentTime?.currentLimit || 0;
                        setCustomTimeVal(String(Math.round(base * 1.25)));
                      }}
                    >
                      +25% času (IVP)
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="text-xs" 
                      onClick={() => {
                        const base = editingStudentTime?.currentLimit || 0;
                        setCustomTimeVal(String(Math.round(base * 1.50)));
                      }}
                    >
                      +50% času (PP)
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="text-xs" 
                      onClick={() => {
                        const base = editingStudentTime?.currentLimit || 0;
                        setCustomTimeVal(String(base + 10));
                      }}
                    >
                      Přidat 10 minut
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50" 
                      onClick={() => {
                        setCustomTimeVal('');
                      }}
                    >
                      Resetovat na výchozí
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button variant="ghost" onClick={() => setEditingStudentTime(null)}>Zrušit</Button>
                <Button 
                  onClick={async () => {
                    if (!editingStudentTime) return;
                    const val = customTimeVal.trim();
                    const newLimit = val === '' ? null : parseInt(val, 10);
                    if (newLimit !== null && (isNaN(newLimit) || newLimit <= 0)) {
                      toast({ title: "Chyba", description: "Zadejte platný počet minut.", variant: "destructive" });
                      return;
                    }
                    const ok = await store.setCustomTimeLimit(
                      editingStudentTime.assignmentId,
                      editingStudentTime.studentId,
                      newLimit,
                      store.currentUser?.schoolId || ''
                    );
                    if (ok) {
                      setEditingStudentTime(null);
                      setCustomTimeVal('');
                    }
                  }}
                >
                  Uložit nastavení
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>


          {/* Dialog pro změnu hesla žáka */}
          <Dialog open={editingStudentId !== null} onOpenChange={(open) => {
            if (!open) {
              setEditingStudentId(null);
              setNewPasswordVal('');
            }
          }}>
            <DialogContent className="rounded-3xl border-none shadow-2xl max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                  <PenTool className="w-6 h-6 text-accent" /> Změna hesla žáka
                </DialogTitle>
                <DialogDescription>
                  {(() => {
                    const studentObj = store.users.find(u => u.id === editingStudentId);
                    return studentObj ? `Zadejte nové přístupové heslo pro žáka ${studentObj.name} (${studentObj.username}).` : 'Zadejte nové přístupové heslo pro vybraného žáka.';
                  })()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Nové heslo</label>
                  <Input
                    type="text"
                    placeholder="Zadejte nové heslo"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    className="rounded-xl h-12"
                    autoFocus
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingStudentId(null);
                    setNewPasswordVal('');
                  }}
                  className="rounded-full"
                >
                  Zrušit
                </Button>
                <Button 
                  onClick={async () => {
                    if (!editingStudentId || !newPasswordVal.trim()) {
                      toast({ title: "Chyba", description: "Heslo nesmí být prázdné.", variant: "destructive" });
                      return;
                    }
                    setIsChangingPassword(true);
                    const success = await store.changeStudentPassword(editingStudentId, newPasswordVal.trim());
                    setIsChangingPassword(false);
                    if (success) {
                      setEditingStudentId(null);
                      setNewPasswordVal('');
                    }
                  }}
                  disabled={isChangingPassword || !newPasswordVal.trim()}
                  className="rounded-full font-bold shadow-md"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ukládám...
                    </>
                  ) : 'Uložit heslo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog pro přejmenování třídy */}
          <Dialog open={renameTarget !== null} onOpenChange={(open) => { if (!open) setRenameTarget(null); }}>
            <DialogContent className="max-w-md bg-white rounded-3xl border-none shadow-2xl p-6">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-headline font-bold text-primary flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-accent animate-pulse" />
                  Přejmenovat třídu
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-sm leading-relaxed">
                  Zadejte nový název pro třídu <strong className="text-gray-800">"{renameTarget?.name}"</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="renameInputTeacher" className="font-bold text-gray-700">Nový název třídy</Label>
                  <Input 
                    id="renameInputTeacher"
                    placeholder="Např. 8.A Matematika"
                    value={newClassNameVal}
                    onChange={(e) => setNewClassNameVal(e.target.value)}
                    className="rounded-xl h-12"
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter className="flex justify-end gap-3">
                <Button variant="outline" className="rounded-full font-bold px-4" onClick={() => setRenameTarget(null)}>
                  Zrušit
                </Button>
                <Button 
                  disabled={!newClassNameVal.trim() || newClassNameVal === renameTarget?.name}
                  className="bg-primary hover:bg-primary/95 text-white rounded-full font-bold px-5" 
                  onClick={async () => {
                    if (renameTarget && newClassNameVal.trim()) {
                      const success = await store.renameClassroom(renameTarget.id, newClassNameVal.trim());
                      if (success) {
                        setRenameTarget(null);
                      }
                    }
                  }}
                >
                  Uložit změny
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog pro aktivaci Premium (UpgradeModal) */}
          <Dialog open={isUpgradeModalOpen} onOpenChange={(open) => {
            setIsUpgradeModalOpen(open);
            if (!open) setPaymentDetails(null);
          }}>
            <DialogContent className="max-w-4xl bg-white rounded-3xl border-none shadow-2xl p-6">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-headline font-black text-indigo-700 flex items-center gap-2">
                  <Crown className="w-6 h-6 text-amber-500 fill-amber-500 animate-bounce" />
                  {paymentDetails ? 'Platební QR Kód' : 'Aktivovat iTest Cloud Premium'}
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-sm leading-relaxed">
                  {paymentDetails 
                    ? 'Naskenujte QR kód ve své bankovní aplikaci nebo použijte platební údaje níže.'
                    : 'Získejte přístup ke všem funkcím iTest Cloud bez jakýchkoliv omezení. Vytvářejte neomezeně tříd a studentů.'}
                </DialogDescription>
              </DialogHeader>
              
              {paymentDetails ? (
                <div className="space-y-6 py-4 flex flex-col items-center">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col items-center">
                    <img 
                      src={`https://api.paylibo.com/paylibo/generator/czech/image?accountNumber=1667425028&bankCode=3030&amount=${paymentDetails.amount}&currency=CZK&message=${encodeURIComponent(
                        paymentDetails.type === 'credits'
                          ? `Kredity: ${currentUser.name} (${currentUser.username})`
                          : `${currentUser.name} - ${schools.find(s => s.id === currentUser.schoolId)?.name || 'Skola'}`
                      )}`} 
                      alt="Platební QR Kód" 
                      className="w-56 h-56 object-contain rounded-xl shadow-inner bg-white border border-slate-200"
                    />
                    <span className="text-[10px] text-muted-foreground mt-2 uppercase font-black tracking-wider">Česká QR Platba</span>
                  </div>

                  <div className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-xs space-y-2.5">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500 font-semibold">Číslo účtu:</span>
                      <span className="font-bold text-slate-800">1667425028 / 3030 (Air Bank)</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-slate-500 font-semibold">Částka:</span>
                      <span className="font-black text-indigo-700">{paymentDetails.amount} Kč</span>
                    </div>
                    <div className="flex flex-col border-b pb-2 gap-1">
                      <span className="text-slate-500 font-semibold">Zpráva pro příjemce (Poznámka):</span>
                      <span className="font-bold text-slate-800 bg-white border border-slate-200 p-2 rounded-lg text-center break-all select-all font-mono">
                        {paymentDetails.type === 'credits'
                          ? `Kredity: ${currentUser.name} (${currentUser.username})`
                          : `${currentUser.name} - ${schools.find(s => s.id === currentUser.schoolId)?.name || 'iTest Škola'}`}
                      </span>
                    </div>
                    <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-100/60 leading-relaxed text-[11px] font-medium flex gap-2">
                      <span>⚠️</span>
                      <span>Pro spárování platby prosím uveďte výše zobrazenou poznámku přesně tak, jak je uvedena.</span>
                    </div>
                  </div>

                  <div className="w-full flex gap-3 mt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-2xl py-5 font-bold border-slate-200 hover:bg-slate-50" 
                      onClick={() => setPaymentDetails(null)}
                    >
                      Zpět
                    </Button>
                    <Button 
                      onClick={async () => {
                        const note = paymentDetails.type === 'credits'
                          ? `Kredity: ${currentUser.name} (${currentUser.username})`
                          : `${currentUser.name} - ${schools.find(s => s.id === currentUser.schoolId)?.name || 'iTest Škola'}`;
                        const amountText = paymentDetails.type === 'credits'
                          ? `dobití 50 AI kreditů (25 Kč)`
                          : `aktivaci ${paymentDetails.type === 'monthly' ? 'Měsíčního' : 'Ročního'} předplatného (${paymentDetails.amount} Kč)`;
                        
                        const msgContent = `[ŽÁDOST O PLATBU] Uživatel potvrdil odeslání platby na bankovní účet pro ${amountText}. Zpráva pro příjemce platby: "${note}". Prosím o ověření a připsání.`;

                        try {
                          await fetch('/api/feedback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content: msgContent })
                          });
                        } catch (e) {
                          console.error("Failed to notify admin:", e);
                        }

                        toast({ 
                          title: paymentDetails.type === 'credits' ? "Žádost o kredity odeslána" : "Žádost o předplatné odeslána", 
                          description: paymentDetails.type === 'credits'
                            ? "Administrátor připíše 50 AI kreditů na váš účet po ověření platby (25 Kč) na bankovním účtu."
                            : "Administrátor aktivuje Premium verzi vašeho účtu po ověření platby na bankovním účtu." 
                        });

                        setPaymentDetails(null);
                        setIsUpgradeModalOpen(false);
                      }}
                      className="flex-1 rounded-2xl py-5 font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white border-none"
                    >
                      Potvrdit odeslání platby
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-4 gap-4 py-4">
                    {/* Monthly card */}
                    <div className="bg-gradient-to-b from-indigo-50/40 to-slate-50 border border-indigo-200 hover:border-indigo-400 rounded-3xl p-5 flex flex-col justify-between transition-all hover:shadow-md">
                      <div>
                        <h3 className="font-bold text-lg text-slate-850">Měsíční tarif</h3>
                        <p className="text-xs text-muted-foreground mt-1">Flexibilní předplatné na každý měsíc.</p>
                        <div className="mt-4 flex items-baseline">
                          <span className="text-3xl font-black text-indigo-700">99 Kč</span>
                          <span className="text-xs text-muted-foreground ml-1">/ měsíc</span>
                        </div>
                        <ul className="text-xs space-y-2 mt-5 text-slate-600 font-medium">
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> <strong>200 AI kreditů</strong> / měsíc
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Maximálně <strong>8 tříd</strong>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Maximálně <strong>100 žáků</strong> celkem
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Hromadné stahování výsledků
                          </li>
                        </ul>
                      </div>
                      <Button 
                        onClick={() => setPaymentDetails({ amount: 99, type: 'monthly' })}
                        className="w-full mt-6 rounded-2xl py-5 font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white border-none"
                      >
                        Aktivovat měsíčně
                      </Button>
                    </div>

                    {/* Yearly card */}
                    <div className="bg-gradient-to-b from-indigo-50/50 to-purple-50/5 border-2 border-indigo-500 rounded-3xl p-5 flex flex-col justify-between relative shadow-sm hover:shadow-md transition-all">
                      <span className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                        UŠETŘÍTE 16%
                      </span>
                      <div>
                        <h3 className="font-bold text-lg text-indigo-950 flex items-center gap-1">
                          Roční tarif <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                        </h3>
                        <p className="text-xs text-indigo-900/60 mt-1">Nejvýhodnější volba pro učitele.</p>
                        <div className="mt-4 flex items-baseline">
                          <span className="text-3xl font-black text-indigo-700">999 Kč</span>
                          <span className="text-xs text-muted-foreground ml-1">/ rok</span>
                        </div>
                        <ul className="text-xs space-y-2 mt-5 text-indigo-900 font-medium">
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 animate-pulse" /> <strong>400 AI kreditů</strong> / měsíc
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 animate-pulse" /> Neomezeně tříd
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 animate-pulse" /> Neomezeně žáků a testů
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Hromadné stahování výsledků
                          </li>
                        </ul>
                      </div>
                      <Button 
                        onClick={() => setPaymentDetails({ amount: 999, type: 'yearly' })}
                        className="w-full mt-6 rounded-2xl py-5 font-bold shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none"
                      >
                        Aktivovat ročně
                      </Button>
                    </div>

                    {/* Buy Credits card */}
                    <div className="bg-slate-50 border border-indigo-200 rounded-3xl p-5 flex flex-col justify-between transition-all hover:border-indigo-400 hover:shadow-md">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-1">
                          Dokoupit kredity <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">Jednorázové navýšení limitu bez expirace.</p>
                        <div className="mt-4 flex items-baseline">
                          <span className="text-3xl font-black text-indigo-700">25 Kč</span>
                          <span className="text-xs text-muted-foreground ml-1">/ 50 ks</span>
                        </div>
                        <ul className="text-xs space-y-2 mt-5 text-slate-600 font-medium">
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> <strong>50 AI kreditů</strong> jednorázově
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Kredity nikdy neexpirují
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Lze koupit opakovaně
                          </li>
                        </ul>
                      </div>
                      <Button 
                        onClick={() => setPaymentDetails({ amount: 25, type: 'credits', credits: 50 })}
                        className="w-full mt-6 rounded-2xl py-5 font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white border-none flex items-center justify-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" /> Dokoupit 50 ks
                      </Button>
                    </div>

                    {/* School card */}
                    <div className="bg-gradient-to-b from-violet-50/50 to-indigo-50/50 border border-violet-300 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="space-y-4">
                        <h3 className="font-bold text-lg text-violet-950 flex items-center gap-1">
                          Školní licence 🏫
                        </h3>
                        <p className="text-xs text-violet-900/60 mt-1">Pro celé školy se sdíleným AI fondem. Lze financovat z <strong>šablon MŠMT (OP JAK)</strong>.</p>
                        
                        <div className="space-y-2.5">
                          {/* Tarif Malá škola */}
                          <div className="bg-white/90 border border-violet-150 p-2.5 rounded-2xl flex flex-col gap-0.5 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-black text-violet-900">Malá škola / Třída</span>
                              <span className="text-[11px] font-bold text-violet-700">4 900 Kč / r.</span>
                            </div>
                            <p className="text-[9px] text-slate-500 font-medium">Do 5 učitelů · 2 500 AI kr. / rok</p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-1 h-6 text-[9px] font-bold border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg w-full"
                              onClick={() => {
                                setSelectedSchoolTier('small');
                                setIsCustomSchoolModalOpen(true);
                              }}
                            >
                              Vybrat tarif
                            </Button>
                          </div>

                          {/* Tarif Střední škola */}
                          <div className="bg-white/90 border border-indigo-200 p-2.5 rounded-2xl flex flex-col gap-0.5 shadow-sm ring-1 ring-indigo-150/30">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-black text-indigo-900 flex items-center gap-0.5">
                                Střední škola <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                              </span>
                              <span className="text-[11px] font-bold text-indigo-700">9 900 Kč / r.</span>
                            </div>
                            <p className="text-[9px] text-slate-500 font-medium">Do 20 učitelů · 10 000 AI kr. / rok</p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-1 h-6 text-[9px] font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg w-full"
                              onClick={() => {
                                setSelectedSchoolTier('medium');
                                setIsCustomSchoolModalOpen(true);
                              }}
                            >
                              Vybrat tarif
                            </Button>
                          </div>

                          {/* Tarif Velká škola */}
                          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white p-2.5 rounded-2xl flex flex-col gap-0.5 shadow-md">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-black tracking-tight">Celoškolní licence</span>
                              <span className="text-[11px] font-bold">14 900 Kč / r.</span>
                            </div>
                            <p className="text-[9px] text-violet-100 font-medium">Neomezeně učitelů · 20 000 AI kr.</p>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="mt-1 h-6 text-[9px] font-bold bg-white text-indigo-700 hover:bg-slate-100 border-none rounded-lg w-full"
                              onClick={() => {
                                setSelectedSchoolTier('large');
                                setIsCustomSchoolModalOpen(true);
                              }}
                            >
                              Vybrat tarif
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" className="w-full rounded-2xl font-bold py-5" onClick={() => setIsUpgradeModalOpen(false)}>
                      Zavřít
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog pro poptávku balíčku na míru pro školy */}
          <Dialog open={isCustomSchoolModalOpen} onOpenChange={setIsCustomSchoolModalOpen}>
            <DialogContent className="max-w-md bg-white rounded-3xl border-none shadow-2xl p-6 text-slate-800">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-headline font-black text-indigo-700 flex items-center gap-2">
                  <School className="w-6 h-6 text-violet-600" />
                  {selectedSchoolTier === 'small' ? 'Licence Malá škola / Třída' :
                   selectedSchoolTier === 'medium' ? 'Licence Střední škola' :
                   selectedSchoolTier === 'large' ? 'Celoškolní licence' :
                   'Balíček na míru pro školy'}
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-sm leading-relaxed">
                  {selectedSchoolTier ? (
                    <span>Máte zájem o vybraný licenční tarif? Pošlete nám poptávku a my Vám vystavíme fakturu a aktivujeme licenci.</span>
                  ) : (
                    <span>Máte zájem o licencování celé školy, více učitelů nebo o individuální navýšení kreditů? Kontaktujte nás a my Vám připravíme nabídku na míru.</span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-4 space-y-3.5 text-xs text-violet-900 my-4">
                <div className="flex justify-between border-b border-violet-200/50 pb-2">
                  <span className="font-semibold text-violet-700">Kontaktní e-mail:</span>
                  <a href="mailto:info@itests.cz" className="font-bold text-violet-900 hover:underline">info@itests.cz</a>
                </div>
                {selectedSchoolTier && (
                  <div className="flex justify-between border-b border-violet-200/50 pb-2">
                    <span className="font-semibold text-violet-700">Zvolený tarif:</span>
                    <span className="font-bold text-violet-900">
                      {selectedSchoolTier === 'small' ? 'Malá škola (4 900 Kč/rok)' :
                       selectedSchoolTier === 'medium' ? 'Střední škola (9 900 Kč/rok)' :
                       'Celoškolní licence (14 900 Kč/rok)'}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-1 leading-relaxed">
                  <span className="font-semibold text-violet-700">Co uvést do poptávky:</span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] mt-1 font-medium pl-1">
                    <li>Název a adresa školy</li>
                    <li>Orientační počet učitelů (licencí)</li>
                    <li>Orientační počet žáků</li>
                    <li>Fakturační údaje (IČO)</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-2xl py-5 font-bold border-slate-200 hover:bg-slate-50" 
                  onClick={() => setIsCustomSchoolModalOpen(false)}
                >
                  Zavřít
                </Button>
                <a 
                  href={`mailto:info@itests.cz?subject=${encodeURIComponent(
                    selectedSchoolTier === 'small' ? 'Poptávka licence Malá škola / Třída - iTest Cloud' :
                    selectedSchoolTier === 'medium' ? 'Poptávka licence Střední škola - iTest Cloud' :
                    selectedSchoolTier === 'large' ? 'Poptávka Celoškolní licence - iTest Cloud' :
                    'Poptávka balíčku na míru pro školu - iTest Cloud'
                  )}&body=${encodeURIComponent(
                    `Dobrý den,\n\nmám zájem o licenční balíček pro naši školu:\n` +
                    `Zvolený tarif: ${
                      selectedSchoolTier === 'small' ? 'Malá škola / Třída (4 900 Kč/rok, do 5 učitelů)' :
                      selectedSchoolTier === 'medium' ? 'Střední škola (9 900 Kč/rok, do 20 učitelů)' :
                      selectedSchoolTier === 'large' ? 'Celoškolní licence (14 900 Kč/rok, neomezeně)' :
                      'Individuální balíček'
                    }\n\n` +
                    `Název školy: \n` +
                    `Orientační počet učitelů: \n` +
                    `Orientační počet žáků: \n` +
                    `Poznámky / Požadavky: \n\n` +
                    `S pozdravem\n${currentUser.name}`
                  )}`}
                  className="flex-1"
                >
                  <Button 
                    className="w-full rounded-2xl py-5 font-bold shadow-md bg-indigo-600 hover:bg-indigo-700 text-white border-none flex items-center justify-center gap-1.5"
                  >
                    Otevřít e-mail
                  </Button>
                </a>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </main>
      </>
    )}

        {renderProfileModal()}
        {renderGradebookDialog()}
        {renderTemplateCopyDialog()}
      </div>
    );
  }

  if (currentUser.role === 'student') {
    const studentAssignments = store.assignments.filter(a =>
      a.classId === currentUser.classId &&
      (!a.studentIds || a.studentIds.length === 0 || a.studentIds.includes(currentUser.id))
    );
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={currentUser} onLogout={() => store.logout()} />
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 animate-fade-in">
          {selectedAssignmentId ? (
            <div className="space-y-6">
              {timeLeft !== null && (() => {
                const a = store.assignments.find(as => as.id === selectedAssignmentId);
                const sub = store.submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === currentUser.id);
                const limitMins = sub?.customTimeLimit !== undefined && sub?.customTimeLimit !== null
                  ? sub.customTimeLimit
                  : (a?.timeLimit || 0);
                const totalSeconds = limitMins * 60;
                const ratio = totalSeconds > 0 ? (timeLeft / totalSeconds) : 0;
                const pct = Math.max(0, Math.min(100, ratio * 100));
                
                // Určení barev podle zbývajícího času
                let cardBg = "bg-slate-900/90 border-slate-700/50";
                let progressColor = "bg-gradient-to-r from-emerald-400 to-indigo-500";
                let iconColor = "text-emerald-400";
                let isCritical = pct < 20;

                if (pct < 20) {
                  cardBg = "bg-rose-950/95 border-rose-500/50 shadow-rose-950/40 animate-pulse";
                  progressColor = "bg-gradient-to-r from-red-500 to-rose-600";
                  iconColor = "text-rose-500";
                } else if (pct < 50) {
                  cardBg = "bg-slate-900/95 border-amber-500/50 shadow-amber-950/20";
                  progressColor = "bg-gradient-to-r from-amber-400 to-orange-500";
                  iconColor = "text-amber-400";
                }

                return (
                  <div className={`fixed top-4 right-4 z-50 ${cardBg} text-white font-mono px-5 py-3 rounded-2xl shadow-2xl flex flex-col gap-2 border backdrop-blur-md print-exclude transition-all duration-300 w-52`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg bg-white/10 ${isCritical ? 'animate-pulse' : ''}`}>
                        <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-right">
                        <span className="text-[10px] font-bold block uppercase tracking-wider text-slate-400">Zbývající čas</span>
                        <span className="text-xl font-black tracking-tight">{(() => {
                          const mins = Math.floor(timeLeft / 60);
                          const secs = timeLeft % 60;
                          return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                        })()}</span>
                      </div>
                    </div>
                    {/* Vizuální progress bar */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${progressColor} transition-all duration-1000 ease-linear`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
              <Button variant="ghost" className="rounded-full" onClick={() => selectStudentAssignment(null)}>← Zpět</Button>
              {(() => {
                const a = store.assignments.find(as => as.id === selectedAssignmentId);
                const now = new Date();
                const formatter = new Intl.DateTimeFormat('en-US', {
                  timeZone: 'Europe/Prague',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
                const parts = formatter.formatToParts(now);
                const getVal = (type: string) => parts.find(p => p.type === type)?.value || '';
                let hourVal = getVal('hour');
                if (hourVal === '24') hourVal = '00';
                const nowStr = `${getVal('year')}-${getVal('month')}-${getVal('day')}T${hourVal}:${getVal('minute')}`;
                const hasEnded = a && a.endTime ? nowStr > a.endTime : false;
                const submission = store.submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === currentUser.id);
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
                            <h3 className="text-2xl font-bold">Práce byla odevzdána</h3>
                            
                            {(() => {
                              const totalMax = a.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;
                              let earned = 0;
                              if (submission.questionScores) {
                                if (submission.questionScores instanceof Map) {
                                  submission.questionScores.forEach(val => { earned += val; });
                                } else {
                                  Object.values(submission.questionScores).forEach(val => { earned += val as number; });
                                }
                              }
                              const pct = totalMax > 0 ? Math.round((earned / totalMax) * 100) : 0;
                              return (
                                  <div className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/20 mt-4 text-center space-y-4">
                                    {a.isPractice ? (
                                      <div className="text-4xl font-black text-indigo-700 bg-indigo-50/50 border border-indigo-100 px-6 py-3 rounded-2xl inline-block">🏋️ Procvičování</div>
                                    ) : (
                                      <div className="text-4xl font-black text-primary">Známka: {submission.grade || 'Nehodnoceno'}</div>
                                    )}
                                    <div className="text-lg font-bold text-muted-foreground">Celkové body: {earned} / {totalMax} ({pct} %)</div>
                                    
                                    {!a.isPractice && submission.grade && (
                                      <div className="flex flex-wrap gap-4 justify-center pt-2">
                                        {[1, 2, 3, 4, 5].map((g) => {
                                          const isActive = Number(submission.grade) === g;
                                          const emoji = g === 1 ? '🤩' : g === 2 ? '😊' : g === 3 ? '😐' : g === 4 ? '😟' : '😢';
                                          
                                          const activeClass = g === 1 ? 'border-amber-400 bg-amber-50/50 text-amber-600 hover:border-amber-500 shadow-sm'
                                                            : g === 2 ? 'border-green-400 bg-green-50/50 text-green-600 hover:border-green-500 shadow-sm'
                                                            : g === 3 ? 'border-blue-400 bg-blue-50/50 text-blue-600 hover:border-blue-500 shadow-sm'
                                                            : g === 4 ? 'border-orange-400 bg-orange-50/50 text-orange-600 hover:border-orange-500 shadow-sm'
                                                            : 'border-primary bg-primary text-white shadow-lg';
                                          
                                          const textClass = isActive
                                            ? (g === 5 ? 'text-white' : g === 1 ? 'text-amber-700' : g === 2 ? 'text-green-700' : g === 3 ? 'text-blue-700' : 'text-orange-700')
                                            : 'text-muted-foreground';

                                          const badgeBg = g === 1 ? 'bg-amber-400' : g === 2 ? 'bg-green-400' : g === 3 ? 'bg-blue-400' : g === 4 ? 'bg-orange-400' : 'bg-red-500';

                                          return (
                                            <button
                                              key={g}
                                              type="button"
                                              className={`flex flex-col items-center gap-2 p-4 min-w-[80px] rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 relative ${
                                                isActive 
                                                  ? activeClass 
                                                  : 'border-gray-100 bg-white hover:border-primary/20 text-gray-400'
                                              }`}
                                            >
                                              {isActive && (
                                                <span className={`absolute -top-2.5 ${badgeBg} text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm tracking-widest animate-bounce`}>
                                                  Tvoje Známka
                                                </span>
                                              )}
                                              <span className="text-4xl">{emoji}</span>
                                              <span className={`text-sm font-bold uppercase tracking-tighter ${textClass}`}>{g}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {submission.feedback && (
                                      a.isPractice ? (
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
                                      )
                                    )}
                                  </div>
                              );
                            })()}
                          </div>

                          {/* Seznam otázek a vyhodnocení */}
                          {a.questions && a.questions.length > 0 && (
                            <div className="space-y-6">
                              <h3 className="font-headline text-xl font-bold text-primary border-b pb-2">Vyhodnocení jednotlivých otázek</h3>
                              <div className="space-y-4">
                                {a.questions.map((q, index) => {
                                  const answer = submission.answers?.[q.id];
                                  const drawing = submission.questionDrawings?.[q.id];
                                  const maxPoints = q.points || 1;
                                  const score = submission.questionScores 
                                    ? (submission.questionScores instanceof Map 
                                        ? (submission.questionScores.get(q.id) ?? 0) 
                                        : ((submission.questionScores as Record<string, number>)[q.id] ?? 0)
                                      ) 
                                    : 0;
                                  
                                  const isGraded = (submission.grade !== undefined && submission.grade !== null) || (a.isPractice && !!submission.submittedAt);
                                  const isCorrect = isGraded && score === maxPoints;

                                  return (
                                    <div 
                                      key={q.id} 
                                      className={`p-5 rounded-2xl border transition-all ${
                                        !isGraded
                                          ? 'bg-gray-50/50 border-gray-200 text-gray-500'
                                          : isCorrect 
                                            ? 'bg-green-50/30 border-green-200' 
                                            : 'bg-red-50/30 border-red-200 shadow-sm'
                                      }`}
                                    >
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                          <Badge className={`font-bold ${
                                             !isGraded
                                               ? 'bg-gray-400 text-white hover:bg-gray-400'
                                               : isCorrect 
                                                 ? 'bg-green-500 text-white hover:bg-green-500' 
                                                 : 'bg-red-500 text-white hover:bg-red-500'
                                           }`}>
                                            {index + 1}
                                          </Badge>
                                          <p className="font-bold text-lg text-gray-800">{renderRichText(q.text)}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          {isGraded && !isCorrect && (
                                            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold text-xs uppercase px-2.5 py-0.5">
                                              Chyba
                                            </Badge>
                                          )}
                                          <Badge variant="outline" className={`font-bold border px-3 py-1 ${
                                            !isGraded
                                                ? 'bg-gray-100/50 text-gray-600 border-gray-300 hover:bg-gray-100/50'
                                                : isCorrect 
                                                  ? 'bg-green-100/50 text-green-800 border-green-300 hover:bg-green-100/50' 
                                                  : 'bg-red-100/50 text-red-800 border-red-300 hover:bg-red-100/50'
                                          }`}>
                                            {isGraded ? `Body: ${score} / ${maxPoints} b` : `Max. bodů: ${maxPoints} b`}
                                          </Badge>
                                        </div>
                                      </div>

                                      {/* Odpověď */}
                                      {q.type !== 'drawing' && q.type !== 'graph' && q.type !== 'axis' && q.type !== 'number_line' && q.type !== 'matching' && q.type !== 'cloze' && (
                                        <div className="bg-white/80 p-3.5 rounded-xl border border-gray-100 space-y-1">
                                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Moje odpověď:</span>
                                          <div>
                                            {answer === undefined || answer === null || answer === '' ? (
                                              <span className="italic text-gray-400">Neodpovězeno</span>
                                            ) : q.type === 'multiple_choice' ? (
                                               <span className="font-semibold text-gray-800">
                                                 {String.fromCharCode(65 + Number(answer))}. {q.options?.[Number(answer)]}
                                               </span>
                                             )  : q.type === 'true_false' ? (
                                              <span className="font-semibold text-gray-800">
                                                {answer ? '✓ Ano' : '✗ Ne'}
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
                                      {q.type === 'cloze' && (
                                        <div className="bg-white/80 p-3.5 rounded-xl border border-gray-100 space-y-1 text-left">
                                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Moje odpověď:</span>
                                          <div>
                                            {answer === undefined || answer === null || Object.keys(answer).length === 0 ? (
                                              <span className="italic text-gray-400">Neodpovězeno</span>
                                            ) : (
                                              <div className="leading-relaxed text-slate-800 font-medium text-sm text-left mt-1">
                                                {(() => {
                                                  const parts = parseClozeText(q.clozeText || q.text || '');
                                                  const given = answer && typeof answer === 'object' ? answer : {};
                                                  return parts.map((part, idx) => {
                                                    if (part.type === 'text') {
                                                      return <span key={idx}>{part.text}</span>;
                                                    } else {
                                                      const studentVal = String(given[part.index!] || '').trim();
                                                      const correctVal = String(part.correctAnswer || '').trim();
                                                      const isPartCorrect = studentVal.toLowerCase() === correctVal.toLowerCase();

                                                      if (!studentVal) {
                                                        return (
                                                          <span
                                                            key={idx}
                                                            className="mx-1 px-1.5 py-0.5 rounded bg-yellow-50 border border-yellow-300 text-yellow-700 text-xs font-bold"
                                                          >
                                                            [chybí, správně: {correctVal}]
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
                                                            <span className="line-through opacity-70">{studentVal}</span>
                                                            <span className="text-green-700 font-bold ml-1">({correctVal})</span> ✗
                                                          </span>
                                                        );
                                                      }
                                                    }
                                                  });
                                                })()}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Grafické vyhodnocení pro typ graph */}
                                      {q.type === 'graph' && (
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
                                       {q.type === 'axis' && (
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
                                       {q.type === 'number_line' && (
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
                                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Moje přiložená kresba:</span>
                                          <img src={drawing} className="border rounded-lg max-w-full max-h-60 object-contain bg-white" alt="Kresba k otázce" />
                                        </div>
                                      )}

                                      {q.type === 'matching' && (
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
                                      {submission.questionFeedback && (submission.questionFeedback instanceof Map ? submission.questionFeedback.get(q.id) : (submission.questionFeedback as Record<string, string>)[q.id]) && (
                                        <div className="mt-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1 text-left animate-fade-in">
                                          <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                                            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                                            Vysvětlení AI
                                          </div>
                                          <p className="text-sm font-medium text-indigo-900 leading-relaxed">
                                            {submission.questionFeedback instanceof Map ? submission.questionFeedback.get(q.id) : (submission.questionFeedback as Record<string, string>)[q.id]}
                                          </p>
                                        </div>
                                      )}

                                      {/* Trénink chyb v procvičování */}
                                      {a.isPractice && isGraded && !isCorrect && q.numPracticeQuestions !== undefined && q.numPracticeQuestions > 0 && (
                                        <MistakeTrainingWidget
                                          q={q}
                                          index={index}
                                          practiceLoading={practiceLoading}
                                          practiceErrors={practiceErrors}
                                          practiceAiContent={practiceAiContent}
                                          practiceAnswers={practiceAnswers}
                                          practiceChecked={practiceChecked}
                                          setPracticeAnswers={setPracticeAnswers}
                                          setPracticeChecked={setPracticeChecked}
                                          handleLoadAiPractice={handleLoadAiPractice}
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
                              <h3 className="font-headline text-xl font-bold text-primary border-b pb-2">Vypracovaný dokument</h3>
                              <div className="bg-gray-50 p-4 rounded-2xl border">
                                <img src={submission.mainWorkDrawing} className="w-full border rounded-xl bg-white shadow-sm" alt="Vypracovaný dokument" />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : a.antiCheat && !isTestStarted ? (
                        <div className="text-center py-12 px-6 max-w-xl mx-auto space-y-6">
                          <ShieldAlert className="w-20 h-20 text-indigo-600 mx-auto animate-bounce" />
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800">Ochrana proti podvádění aktivována!</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                              Tento test vyžaduje zapnutý **režim celé obrazovky (Fullscreen)**. Během testu neodcházejte z karty ani neopouštějte celou obrazovku. Každé opuštění okna nebo celoobrazovkového režimu bude zaznamenáno jako incident a předáno učiteli. Kopírování a vkládání textu je u tohoto testu zablokováno.
                            </p>
                          </div>
                          
                          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left text-xs text-slate-655 space-y-2 leading-relaxed">
                            <p className="font-bold text-slate-800 text-sm">Pravidla testu:</p>
                            <p>• Test se spustí automaticky po vstupu do celé obrazovky.</p>
                            <p>• Stisknutím klávesy <kbd className="bg-white px-1.5 py-0.5 border rounded shadow-sm font-mono text-[10px] text-gray-700">Esc</kbd> nebo ukončením celé obrazovky se test uzamkne a učitel obdrží varovný záznam.</p>
                            {a.timeLimit && a.timeLimit > 0 ? (
                              <p>• Časový limit pro vypracování je **{a.timeLimit} minut** a začne běžet až po vstupu.</p>
                            ) : null}
                          </div>

                          <Button
                            onClick={() => handleStartAntiCheatTest(a)}
                            className="w-full h-14 rounded-2xl font-bold text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg text-white"
                          >
                            Spustit test a vstoupit do celé obrazovky
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {hasEnded && (
                            <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl flex items-start gap-3 shadow-sm animate-pulse">
                              <span className="text-2xl">⚠️</span>
                              <div>
                                <h4 className="font-bold text-amber-800 text-lg">Vypršel časový limit</h4>
                                <p className="text-sm text-amber-600 font-medium">Tento úkol měl termín odevzdání do {formatDateTime(a.endTime)}. Nyní si ho můžete pouze prohlédnout, ale již nelze odevzdat žádné odpovědi.</p>
                              </div>
                            </div>
                          )}

                          {/* Popis úkolu */}
                          {a.description && (
                            <div className="p-4 bg-gray-50 rounded-xl">
                              <p className="text-muted-foreground whitespace-pre-wrap">{a.description}</p>
                            </div>
                          )}

                          {/* Otázky */}
                          {a.questions && a.questions.length > 0 && (
                            <div className="space-y-6">
                              <h3 className="font-headline text-xl font-bold text-primary">Otázky ({a.questions.length})</h3>
                              {a.questions.map((q, index) => (
                                <div key={q.id} className="p-5 bg-gray-50 rounded-xl border space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="bg-primary/10 text-primary font-bold">{index + 1}</Badge>
                                      <p className="font-semibold text-lg">{renderRichText(q.text)}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] uppercase">
                                      {q.type === 'short_answer' ? 'Krátká odpověď' : 
                                       q.type === 'long_answer' ? 'Dlouhá odpověď' : 
                                       q.type === 'multiple_choice' ? 'Výběr z možností' : 
                                       q.type === 'axis' ? 'Osa X/Y' : 
                                       q.type === 'number_line' ? 'Číselná osa' : q.type === 'true_false' ? 'Ano / Ne' : 
                                       q.type === 'matching' ? 'Přiřazování' : 
                                       q.type === 'drawing' ? 'Kresba' :
                                        q.type === 'cloze' ? 'Doplňovačka' :
                                        q.type === 'audio' ? 'Poslech / Diktát' : q.type}
                                    </Badge>
                                  </div>

                                  {renderAudioControls(q)}

                                  {/* Textový vstup pro všechny typy kromě drawing */}
                                  {q.type === 'short_answer' && (
                                    <Input
                                      placeholder="Vaše odpověď..."
                                      value={studentAnswers[q.id] || ''}
                                      onChange={(e) => setStudentAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                      disabled={hasEnded}
                                    />
                                  )}

                                  {/* Zvukový recorder pro ústní odpověď */}
                                  {q.type === 'audio' && (
                                    <Textarea
                                      placeholder="Napište text diktátu, který jste slyšeli..."
                                      className="min-h-[80px] border-indigo-200 focus-visible:ring-indigo-500"
                                      value={studentAnswers[q.id] || ''}
                                      onChange={(e) => setStudentAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                      disabled={hasEnded}
                                    />
                                  )}

                                  {q.type === 'long_answer' && (
                                    <Textarea
                                      placeholder="Vaše odpověď..."
                                      className="min-h-[100px]"
                                      value={studentAnswers[q.id] || ''}
                                      onChange={(e) => setStudentAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                      disabled={hasEnded}
                                    />
                                  )}

                                  {q.type === 'multiple_choice' && q.options && (
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                       {q.options.map((opt, i) => (
                                         <button
                                           key={i}
                                           type="button"
                                           disabled={hasEnded}
                                           className={`p-3 rounded-lg border text-left transition-all ${
                                             studentAnswers[q.id] === i
                                               ? 'bg-primary text-white border-primary shadow-md'
                                               : 'bg-white hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white'
                                           }`}
                                           onClick={() => !hasEnded && setStudentAnswers(prev => ({ ...prev, [q.id]: i }))}
                                         >
                                           <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                                           {opt}
                                         </button>
                                       ))}
                                     </div>
                                   )}

                                   {/* Osa X/Y solver */}
                                   {q.type === 'axis' && (
                                     <AxisQuestionStudent
                                       question={q}
                                       disabled={hasEnded}
                                       value={studentAnswers[q.id]}
                                       onChange={(val) => setStudentAnswers(prev => ({ ...prev, [q.id]: val }))}
                                     />
                                   )}
                                   {/* Číselná osa solver */}
                                   {q.type === 'number_line' && (
                                     <NumberLineQuestionStudent
                                       question={q}
                                       disabled={hasEnded}
                                       value={studentAnswers[q.id]}
                                       onChange={(val) => setStudentAnswers(prev => ({ ...prev, [q.id]: val }))}
                                     />
                                   )}

                                   {/* Přiřazování solver */}
                                   {q.type === 'matching' && (
                                     <MatchingQuestionStudent
                                       question={q}
                                       disabled={hasEnded}
                                       value={studentAnswers[q.id]}
                                       onChange={(val) => setStudentAnswers(prev => ({ ...prev, [q.id]: val }))}
                                     />
                                   )}

                                  {q.type === 'true_false' && (
                                    <div className="flex gap-3">
                                      <button
                                        type="button"
                                        disabled={hasEnded}
                                        className={`flex-1 p-3 rounded-lg border text-center font-bold transition-all ${
                                          studentAnswers[q.id] === true
                                            ? 'bg-green-500 text-white border-green-500'
                                            : 'bg-white hover:bg-green-50 disabled:opacity-50 disabled:hover:bg-white'
                                        }`}
                                        onClick={() => !hasEnded && setStudentAnswers(prev => ({ ...prev, [q.id]: true }))}
                                      >
                                        ✓ Ano
                                      </button>
                                      <button
                                        type="button"
                                        disabled={hasEnded}
                                        className={`flex-1 p-3 rounded-lg border text-center font-bold transition-all ${
                                          studentAnswers[q.id] === false
                                            ? 'bg-red-500 text-white border-red-500'
                                            : 'bg-white hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-white'
                                        }`}
                                        onClick={() => !hasEnded && setStudentAnswers(prev => ({ ...prev, [q.id]: false }))}
                                      >
                                        ✗ Ne
                                      </button>
                                    </div>
                                  )}

                                  {/* Kresba pro typ drawing — vždy otevřená */}
                                  {q.type === 'drawing' && (
                                    <DrawingPad
                                      compact
                                      disabled={hasEnded}
                                      onSave={(data) => setQuestionDrawings(prev => ({ ...prev, [q.id]: data }))}
                                    />
                                  )}

                                  {/* Grafická otázka student solver */}
                                  {q.type === 'graph' && (
                                    <GraphQuestionStudent
                                      question={q}
                                      disabled={hasEnded}
                                      value={studentAnswers[q.id]}
                                      onChange={(val) => setStudentAnswers(prev => ({ ...prev, [q.id]: val }))}
                                    />
                                  )}

                                  {/* Cloze solver */}
                                  {q.type === 'cloze' && (
                                    <div className="p-4 bg-white rounded-xl border border-slate-150 leading-relaxed text-slate-800 font-medium text-base select-none">
                                      {(() => {
                                        const parts = parseClozeText(q.clozeText || q.text || '');
                                        const currentAns = studentAnswers[q.id] || {};
                                        return parts.map((part, i) => {
                                          if (part.type === 'text') {
                                            return <span key={i} className="whitespace-pre-wrap">{part.text}</span>;
                                          } else if (part.type === 'dropdown') {
                                            const currentVal = currentAns[part.index!] ?? '';
                                            const sortedOptions = [...(part.options || [])].sort((a, b) => a.localeCompare(b));
                                            return (
                                              <select
                                                key={i}
                                                value={currentVal}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setStudentAnswers(prev => ({
                                                    ...prev,
                                                    [q.id]: {
                                                      ...(prev[q.id] || {}),
                                                      [part.index!]: val
                                                    }
                                                  }));
                                                }}
                                                disabled={hasEnded}
                                                className="mx-1 h-8 rounded-lg border border-slate-350 bg-white px-2 text-sm font-bold text-indigo-750 focus:outline-none focus:ring-2 focus:ring-primary inline-block align-middle"
                                              >
                                                <option value="">—</option>
                                                {sortedOptions.map((opt, optIdx) => (
                                                  <option key={optIdx} value={opt}>{opt}</option>
                                                ))}
                                              </select>
                                            );
                                          } else {
                                            const currentVal = currentAns[part.index!] ?? '';
                                            return (
                                              <input
                                                key={i}
                                                type="text"
                                                value={currentVal}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setStudentAnswers(prev => ({
                                                    ...prev,
                                                    [q.id]: {
                                                      ...(prev[q.id] || {}),
                                                      [part.index!]: val
                                                    }
                                                  }));
                                                }}
                                                disabled={hasEnded}
                                                style={{ width: `${Math.max(4, (part.correctAnswer || '').length + 2)}ch` }}
                                                className="mx-1 h-8 rounded-lg border border-slate-350 bg-white px-2 text-sm font-bold text-indigo-750 focus:outline-none focus:ring-2 focus:ring-primary inline-block align-middle text-center"
                                              />
                                            );
                                          }
                                        });
                                      })()}
                                    </div>
                                  )}

                                  {/* Toggle: Dokreslit perem (pro všechny typy kromě drawing a graph) */}
                                  {q.type !== 'drawing' && q.type !== 'graph' && !hasEnded && (
                                    <div className="pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setQuestionDrawingOpen(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                                          questionDrawingOpen[q.id]
                                            ? 'bg-primary/10 text-primary border-primary/30'
                                            : 'text-muted-foreground hover:text-primary hover:border-primary/20 border-transparent'
                                        }`}
                                      >
                                        <PenTool className="w-3 h-3" />
                                        {questionDrawingOpen[q.id] ? 'Skrýt kreslicí plochu' : '✏️ Dokreslit perem'}
                                        {questionDrawings[q.id] && !questionDrawingOpen[q.id] && (
                                          <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" title="Kresba přiložena" />
                                        )}
                                      </button>
                                      {questionDrawingOpen[q.id] && (
                                        <div className="mt-2 animate-fade-in">
                                          <DrawingPad
                                            compact
                                            onSave={(data) => setQuestionDrawings(prev => ({ ...prev, [q.id]: data }))}
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
                              <h3 className="font-headline text-xl font-bold text-primary">Pracovní dokument</h3>
                              <p className="text-sm text-muted-foreground">Piš perem přímo do dokumentu nebo ho nech prázdný.</p>
                              <DrawingPad backgroundImage={a.fileUri} disabled={hasEnded} onSave={setMainWorkDrawing} />
                            </div>
                          ) : null}
                          
                          {!hasEnded && (
                            a.isPractice ? (
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
                              <Button className="w-full h-14 text-xl shadow-lg" onClick={() => {
                                store.submitWork({ assignmentId: selectedAssignmentId, studentId: currentUser.id, answers: studentAnswers, questionDrawings, mainWorkDrawing });
                              }}>Odevzdat v cloudu</Button>
                            )
                          )}
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
                <Button variant="ghost" className="self-start rounded-full" onClick={() => setSelectedSubject(null)}>← Zpět na předměty</Button>
                <div className="flex items-center gap-3 bg-primary/5 p-6 rounded-3xl border border-primary/20">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Předmět</span>
                    <h1 className="text-3xl font-headline font-black text-primary">{selectedSubject}</h1>
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
                      <h2 className="text-xl font-headline font-bold text-primary">Známkované testy</h2>
                      <p className="text-xs text-muted-foreground">Testy vyhodnocované a známkované učitelem.</p>
                    </div>
                  </div>

                  {/* K vypracování (To Do) */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5 px-1">
                      ⏳ K vypracování
                    </h3>
                    {(() => {
                      const pendingTests = studentAssignments.filter(a =>
                        (a.subject === selectedSubject || (selectedSubject === 'Jiný' && !a.subject)) &&
                        !a.isPractice &&
                        !store.submissions.some(s => s.assignmentId === a.id && s.studentId === currentUser.id && s.submittedAt)
                      );

                      if (pendingTests.length === 0) {
                        return (
                          <Card className="border-none shadow-sm bg-white p-6 text-center space-y-2">
                            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                            <h4 className="text-sm font-bold text-gray-800">Vše hotovo!</h4>
                            <p className="text-xs text-muted-foreground">Nemáš žádné testy k vypracování.</p>
                          </Card>
                        );
                      }

                      return (
                        <div className="grid gap-3">
                          {pendingTests.map(a => {
                            const now = new Date();
                            const formatter = new Intl.DateTimeFormat('en-US', {
                              timeZone: 'Europe/Prague',
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            });
                            const parts = formatter.formatToParts(now);
                            const getVal = (type: string) => parts.find(p => p.type === type)?.value || '';
                            let hourVal = getVal('hour');
                            if (hourVal === '24') hourVal = '00';
                            const nowStr = `${getVal('year')}-${getVal('month')}-${getVal('day')}T${hourVal}:${getVal('minute')}`;
                            const hasStarted = !a.startTime || nowStr >= a.startTime;
                            const hasEnded = a.endTime && nowStr > a.endTime;

                            return (
                              <Card 
                                key={a.id} 
                                className={`transition-all border-none bg-white shadow-xs overflow-hidden ${
                                  !hasStarted 
                                    ? 'opacity-60 cursor-not-allowed select-none' 
                                    : 'cursor-pointer hover:shadow-md hover:border-primary'
                                }`}
                                onClick={() => {
                                  if (hasStarted) {
                                    selectStudentAssignment(a.id);
                                  }
                                }}
                              >
                                <div className={`h-1 w-full ${!hasStarted ? 'bg-gray-300' : hasEnded ? 'bg-amber-500' : 'bg-accent/30'}`} />
                                <CardContent className="p-4 flex justify-between items-center">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-base text-gray-800">{a.title}</p>
                                      {!hasStarted && (
                                        <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">🔒 Neaktivní</span>
                                      )}
                                      {hasEnded && (
                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">⌛ Vypršel čas</span>
                                      )}
                                    </div>
                                    {a.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{a.description}</p>
                                    )}
                                    <div className="mt-1.5 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                                      {a.startTime && <span>Od: {formatDateTime(a.startTime)}</span>}
                                      {a.endTime && <span className={hasEnded ? 'text-amber-600 font-bold' : ''}>Do: {formatDateTime(a.endTime)}</span>}
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
                      const completedTests = studentAssignments.filter(a =>
                        (a.subject === selectedSubject || (selectedSubject === 'Jiný' && !a.subject)) &&
                        !a.isPractice &&
                        store.submissions.some(s => s.assignmentId === a.id && s.studentId === currentUser.id && s.submittedAt)
                      );

                      if (completedTests.length === 0) {
                        return (
                          <Card className="border-none shadow-xs bg-white p-6 text-center">
                            <p className="text-xs text-muted-foreground">Zatím žádné odevzdané testy.</p>
                          </Card>
                        );
                      }

                      return (
                        <div className="grid gap-3">
                          {completedTests.map(a => {
                            const sub = store.submissions.find(s => s.assignmentId === a.id && s.studentId === currentUser.id)!;
                            const totalMax = a.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;
                            let earned = 0;
                            if (sub.questionScores) {
                              if (sub.questionScores instanceof Map) {
                                sub.questionScores.forEach(val => { earned += val; });
                              } else {
                                Object.values(sub.questionScores).forEach(val => { earned += val as number; });
                              }
                            }
                            const badgeText = sub.grade ? `Známka: ${sub.grade} (${earned}/${totalMax} b)` : 'Odevzdáno (Neopraveno)';

                            return (
                              <Card 
                                key={a.id} 
                                className="cursor-pointer hover:shadow-md transition-all border-none bg-white shadow-xs overflow-hidden" 
                                onClick={() => selectStudentAssignment(a.id)}
                              >
                                <CardContent className="p-4 flex justify-between items-center">
                                  <div>
                                    <p className="font-bold text-base text-gray-800">{a.title}</p>
                                    <div className="mt-1">
                                      <Badge variant={sub.grade ? "default" : "secondary"} className="text-[10px]">
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
                      <h2 className="text-xl font-headline font-bold text-indigo-900">Neznámkované procvičování</h2>
                      <p className="text-xs text-indigo-600/80">Cvičení s okamžitým vyhodnocením a vysvětlením od AI.</p>
                    </div>
                  </div>

                  {/* K vypracování (To Do) */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-700/70 flex items-center gap-1.5 px-1">
                      ⏳ K vypracování
                    </h3>
                    {(() => {
                      const pendingPractice = studentAssignments.filter(a =>
                        (a.subject === selectedSubject || (selectedSubject === 'Jiný' && !a.subject)) &&
                        a.isPractice &&
                        !store.submissions.some(s => s.assignmentId === a.id && s.studentId === currentUser.id && s.submittedAt)
                      );

                      if (pendingPractice.length === 0) {
                        return (
                          <Card className="border-none shadow-sm bg-white p-6 text-center space-y-2">
                            <CheckCircle2 className="w-10 h-10 text-indigo-500 mx-auto" />
                            <h4 className="text-sm font-bold text-gray-800">Hotovo!</h4>
                            <p className="text-xs text-muted-foreground">Všechna cvičení máš vypracovaná.</p>
                          </Card>
                        );
                      }

                      return (
                        <div className="grid gap-3">
                          {pendingPractice.map(a => {
                            const now = new Date();
                            const formatter = new Intl.DateTimeFormat('en-US', {
                              timeZone: 'Europe/Prague',
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            });
                            const parts = formatter.formatToParts(now);
                            const getVal = (type: string) => parts.find(p => p.type === type)?.value || '';
                            let hourVal = getVal('hour');
                            if (hourVal === '24') hourVal = '00';
                            const nowStr = `${getVal('year')}-${getVal('month')}-${getVal('day')}T${hourVal}:${getVal('minute')}`;
                            const hasStarted = !a.startTime || nowStr >= a.startTime;
                            const hasEnded = a.endTime && nowStr > a.endTime;

                            return (
                              <Card 
                                key={a.id} 
                                className={`transition-all border-none bg-white shadow-xs overflow-hidden ${
                                  !hasStarted 
                                    ? 'opacity-60 cursor-not-allowed select-none' 
                                    : 'cursor-pointer hover:shadow-md hover:border-indigo-450'
                                }`}
                                onClick={() => {
                                  if (hasStarted) {
                                    selectStudentAssignment(a.id);
                                  }
                                }}
                              >
                                <div className={`h-1 w-full ${!hasStarted ? 'bg-gray-300' : hasEnded ? 'bg-amber-500' : 'bg-indigo-400/40'}`} />
                                <CardContent className="p-4 flex justify-between items-center">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-base text-gray-800">{a.title}</p>
                                      {!hasStarted && (
                                        <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">🔒 Neaktivní</span>
                                      )}
                                      {hasEnded && (
                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">⌛ Vypršel čas</span>
                                      )}
                                    </div>
                                    {a.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{a.description}</p>
                                    )}
                                    <div className="mt-1.5 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                                      {a.startTime && <span>Od: {formatDateTime(a.startTime)}</span>}
                                      {a.endTime && <span className={hasEnded ? 'text-amber-600 font-bold' : ''}>Do: {formatDateTime(a.endTime)}</span>}
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
                      const completedPractice = studentAssignments.filter(a =>
                        (a.subject === selectedSubject || (selectedSubject === 'Jiný' && !a.subject)) &&
                        a.isPractice &&
                        store.submissions.some(s => s.assignmentId === a.id && s.studentId === currentUser.id && s.submittedAt)
                      );

                      if (completedPractice.length === 0) {
                        return (
                          <Card className="border-none shadow-xs bg-white p-6 text-center">
                            <p className="text-xs text-muted-foreground">Zatím žádné odevzdané procvičování.</p>
                          </Card>
                        );
                      }

                      return (
                        <div className="grid gap-3">
                          {completedPractice.map(a => {
                            const sub = store.submissions.find(s => s.assignmentId === a.id && s.studentId === currentUser.id)!;
                            const totalMax = a.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;
                            let earned = 0;
                            if (sub.questionScores) {
                              if (sub.questionScores instanceof Map) {
                                sub.questionScores.forEach(val => { earned += val; });
                              } else {
                                Object.values(sub.questionScores).forEach(val => { earned += val as number; });
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
                                    <p className="font-bold text-base text-gray-800">{a.title}</p>
                                    <div className="mt-1">
                                      <Badge variant="outline" className="text-[10px] bg-indigo-50/50 text-indigo-750 border-indigo-200">
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
                  <p className="text-sm text-muted-foreground mt-0.5">Podívej se na své známky a hodnocení ze všech testů.</p>
                </div>
                <Button 
                  className="w-full md:w-auto rounded-xl px-6 h-12 text-sm font-headline font-bold shadow-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center justify-center gap-2"
                  onClick={() => {
                    setSelectedGradebookStudent(currentUser);
                    setSelectedGradebookSubject('Matematika');
                    setGradebookViewMode('child');
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
                    'Matematika',
                    'Český jazyk',
                    'Anglický jazyk',
                    'Fyzika',
                    'Chemie',
                    'Dějepis',
                    'Zeměpis',
                    'Přírodopis',
                    'Informatika',
                    'Jiný'
                  ];

                  return (
                    <div className="space-y-4 animate-fade-in">
                      {predefinedSubjects.map(subjectName => {
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
                              <span className="font-headline text-xl text-primary font-bold">{subjectName}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              {(() => {
                                const pendingCount = studentAssignments.filter(a =>
                                  (a.subject === subjectName || (subjectName === 'Jiný' && !a.subject)) &&
                                  !store.submissions.some(s => s.assignmentId === a.id && s.studentId === currentUser.id)
                                ).length;
                                
                                const completedCount = studentAssignments.filter(a =>
                                  (a.subject === subjectName || (subjectName === 'Jiný' && !a.subject)) &&
                                  store.submissions.some(s => s.assignmentId === a.id && s.studentId === currentUser.id)
                                ).length;
                                
                                if (pendingCount > 0) {
                                  return (
                                    <Badge className="bg-accent text-white font-semibold text-xs px-2.5 py-0.5 animate-pulse">
                                      {pendingCount} k vypracování
                                    </Badge>
                                  );
                                } else if (completedCount > 0) {
                                  return (
                                    <Badge variant="secondary" className="font-semibold text-xs px-2.5 py-0.5">
                                      {completedCount} dokončeno
                                    </Badge>
                                  );
                                } else {
                                  return (
                                    <Badge variant="outline" className="text-muted-foreground font-semibold text-xs px-2.5 py-0.5 border-gray-200">
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

          {/* Fullscreen Warning Modal overlay */}
          {isFullscreenWarningOpen && (
            <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-red-100 shadow-2xl text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-12 h-12 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 font-headline">Opuštěn Fullscreen!</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Během testu jste opustili režim celé obrazovky nebo přepnuli okno. Tento incident byl zaznamenán a nahlášen učiteli.
                  </p>
                </div>
                
                <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl text-left text-xs text-red-800 space-y-1">
                  <p className="font-bold">Zaznamenané incidenty:</p>
                  <p>• Opustili jste celou obrazovku.</p>
                  <p>• Pokračování v testu je možné až po opětovném vstupu do celé obrazovky.</p>
                </div>

                <Button
                  onClick={async () => {
                    try {
                      await document.documentElement.requestFullscreen();
                      setIsFullscreenWarningOpen(false);
                    } catch (err) {
                      console.error("Fullscreen entry error:", err);
                    }
                  }}
                  className="w-full h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg text-white"
                >
                  Vrátit se do celé obrazovky
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return null;
}