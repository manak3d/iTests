"use client";
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { TeacherDashboard } from '@/components/dashboard/TeacherDashboard';
import { TeacherHub } from '@/components/dashboard/TeacherHub';
import { AiPedagogDashboard } from '@/components/dashboard/AiPedagogDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

import { useState, useEffect, useRef } from 'react';
import { useITestStore } from '@/hooks/use-itest-store';
import { Navbar } from '@/components/itest/Navbar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Users, ClipboardList, CheckCircle2, ChevronRight, GraduationCap, School, Loader2, BookOpen, PenTool, Trash2, Upload, LayoutDashboard, Activity, ChevronUp, ChevronDown, Edit3, UserPlus, Crown, Check, Sparkles, Download, Printer, Zap, Settings, MessageSquare, Search } from 'lucide-react';
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
        localStorage.setItem('pendingTestId', testId);
      } else {
        const cached = localStorage.getItem('pendingTestId');
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

  const [schools, setSchools] = useState<any[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolInviteCode, setNewSchoolInviteCode] = useState('');

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
  
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCustomSchoolModalOpen, setIsCustomSchoolModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ amount: number, type: 'monthly' | 'yearly' | 'credits', credits?: number } | null>(null);
  const [newClassName, setNewClassName] = useState('');

  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [targetClassId, setTargetClassId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [editIsPublicTemplate, setEditIsPublicTemplate] = useState(false);
  const [editTimeLimit, setEditTimeLimit] = useState(0);
  const [customCredits, setCustomCredits] = useState<Record<string, string>>({});

  const [selectedTemplateForCopy, setSelectedTemplateForCopy] = useState<Assignment | null>(null);
  const [templateCopyClassId, setTemplateCopyClassId] = useState<string>('');
  const [templateCopyStartTime, setTemplateCopyStartTime] = useState<string>('');
  const [templateCopyEndTime, setTemplateCopyEndTime] = useState<string>('');
  const [templateCopyAssignType, setTemplateCopyAssignType] = useState<'all' | 'specific'>('all');
  const [templateCopySelectedStudentIds, setTemplateCopySelectedStudentIds] = useState<string[]>([]);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const autoSubmitRef = useRef<() => void>(() => {});
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'teacher' | 'classroom' | 'student' | 'assignment';
    id: string;
    name: string;
  } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string, name: string } | null>(null);
  const [newClassNameVal, setNewClassNameVal] = useState('');

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
  const [adminTab, setAdminTab] = useState<'overview' | 'classes' | 'teachers' | 'students' | 'assignments' | 'schools' | 'feedback'>('overview');
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

  useEffect(() => {
    if (store.currentUser && (store.currentUser.role === 'admin' || store.currentUser.role === 'teacher')) {
      fetchSchools();
    }
  }, [store.currentUser, adminTab]);

  const [adminViewingAssignmentId, setAdminViewingAssignmentId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<string | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<string | null>(null);
  const [viewingAssignmentSubs, setViewingAssignmentSubs] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [teacherMode, setTeacherMode] = useState<'hub' | 'itest' | 'ai'>('hub');

  useEffect(() => {
    if (store.currentUser && store.currentUser.role === 'student' && pendingTestId) {
      // Check if this student is assigned/allowed or if the test exists
      const testExists = store.assignments.some(a => a.id === pendingTestId);
      if (testExists) {
        setSelectedAssignmentId(pendingTestId);
        setPendingTestId(null);
        localStorage.removeItem('pendingTestId');
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
        const limitMs = a.timeLimit! * 60 * 1000;
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
  }, [selectedAssignmentId, store.currentUser, store.submissions]);
  
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

    if (id && currentUser && currentUser.role === 'student') {
      const assignment = store.assignments.find(a => a.id === id);
      if (assignment && assignment.timeLimit && assignment.timeLimit > 0) {
        store.startAssignmentTimer(id, currentUser.id, currentUser.schoolId || '');
      }
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
                               q.type === 'cloze' ? 'Doplňovačka' : q.type;
                               
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
          Synchronizace iTest Cloudu...<br/>
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
        onClose={() => window.close()}
      />
    );
  }

  if (!store.currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200/50 to-indigo-50/50 flex items-center justify-center p-4 py-8 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl w-full mx-auto items-stretch">
          
          {/* Levý sloupec - Informace o platformě */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/40 rounded-3xl p-8 flex flex-col justify-between shadow-xl space-y-6">
            <div className="space-y-4">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center shadow-inner">
                <School className="text-primary w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-black text-gray-800 tracking-tight">K čemu iTest slouží?</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  iTest Cloud je moderní platforma pro tvorbu, zadávání a hodnocení interaktivních testů a výkresů v reálném čase.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200/60">
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">📝</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">Interaktivní zadání</p>
                    <p className="text-xs text-slate-500">Vytvářejte digitální testy z matematických grafů, os a geometrie.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">🎨</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">Kreslicí plátno</p>
                    <p className="text-xs text-slate-500">Žáci vypracovávají a kreslí úkoly přímo na svém tabletu, počítači nebo mobilu.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">📊</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">Žákovská knížka</p>
                    <p className="text-xs text-slate-500">Okamžitý přehled výsledků, bodování a známkování s reaktivním rozhraním.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-xl shrink-0">👥</span>
                  <div>
                    <p className="text-sm font-bold text-gray-855">Izolované třídy</p>
                    <p className="text-xs text-slate-500">Každá škola má kompletně oddělená a zabezpečená data a vlastní zvací kódy.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-medium pt-4 border-t border-slate-100">
              © 2026 iTest Cloud. Všechna práva vyhrazena.
            </div>
          </div>

          {/* Prostřední sloupec - Přihlášení / Registrace */}
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white flex flex-col justify-between">
            <CardHeader className="text-center space-y-4 bg-primary text-white pb-6 pt-8 shrink-0">
              <div className="bg-white/20 w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg transform -rotate-6">
                <School className="text-white w-7 h-7" />
              </div>
              <div className="space-y-1">
                <CardTitle className="font-headline text-3xl">iTest Cloud</CardTitle>
                <CardDescription className="text-white/70">Zadávání a hodnocení v cloudu.</CardDescription>
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

          {/* Pravý sloupec - Tarify a ceny */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/40 rounded-3xl p-8 flex flex-col justify-between shadow-xl space-y-6">
            <div className="space-y-4">
              <div className="bg-amber-100/60 w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner">
                💎
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-black text-gray-800 tracking-tight">Předplatné a verze</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Vyzkoušejte platformu na 3 měsíce zdarma a poté se rozhodněte pro verzi, která vám nejlépe vyhovuje.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200/60">
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 space-y-2">
                  <h3 className="text-xs font-black uppercase text-indigo-700 tracking-wider">Zkušební verze (Free trial)</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Každý nový učitel získává po registraci **90 dní zdarma** na plné vyzkoušení platformy.
                  </p>
                  <div className="text-[10px] font-bold text-indigo-900 bg-white border px-2.5 py-0.5 rounded-full w-max">
                    Max. 2 třídy · Max. 20 žáků
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    Premium předplatné <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </h3>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-black text-slate-800">99 Kč / měsíc</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Měsíční platba</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-black text-indigo-700">999 Kč / rok</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Roční platba (-16%)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed border-t pt-2">
                    Měsíční předplatné (99 Kč) nabízí 200 AI kreditů a limit 8 tříd / 100 žáků celkem. Roční předplatné (999 Kč) kompletně ruší limity a nabízí 400 AI kreditů.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-150 space-y-2">
                  <h3 className="text-xs font-black uppercase text-violet-700 tracking-wider flex items-center gap-1">
                    Školní licence 🏫
                  </h3>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-black text-violet-850">od 4 999 Kč / rok</span>
                    <span className="text-[10px] text-violet-600 font-bold uppercase tracking-wider">Individuální</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed border-t pt-2">
                    Individuální cena přizpůsobená velikosti školy a počtu žáků (začíná na **od 4 999 Kč / rok**). Zahrnuje neomezený přístup pro celou školu a všechny její učitele.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 text-amber-800 p-3.5 rounded-2xl border border-amber-100/60 leading-relaxed text-[10px] font-medium flex gap-2">
              <span>💡</span>
              <span>Platba probíhá převodem na účet a Premium je ručně aktivováno administrátorem po ověření připsané částky.</span>
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
        />
      );
    }
    
    if (teacherMode === 'ai') {
      return (
        <AiPedagogDashboard 
          userName={currentUser.name}
          onBack={() => setTeacherMode('hub')}
        />
      );
    }
  }

  if (currentUser.role === 'admin') {
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


    const adminProps = {
      adminTab, setAdminTab,
      schools, teachers, classrooms, students, assignments, submissions,
      store, currentUser,
      adminSearchFilter, setAdminSearchFilter,
      adminSchoolFilter, setAdminSchoolFilter,
      adminSortBy, setAdminSortBy,
      adminSortOrder, setAdminSortOrder,
      expandedSubjects, setExpandedSubjects,
      setRenameTarget, setNewClassNameVal,
      setDeleteTarget,
      targetClassId, setTargetClassId,
      
      // AddStudentDialog Props
      isAddingStudent, setIsAddingStudent,
      studentActionType, setStudentActionType,
      newStudentName, setNewStudentName,
      newStudentUsername, setNewStudentUsername,
      newStudentPassword, setNewStudentPassword,
      selectedExistingStudentId, setSelectedExistingStudentId,
      studentSearch, setStudentSearch,
      csvFile, setCsvFile,
      csvParsingError, setCsvParsingError,
      csvImportProgress, setCsvImportProgress,
      handleAddStudent, handleImportCSVToExisting,

      customCredits, setCustomCredits,
      toast,
      adminViewingAssignmentId, setAdminViewingAssignmentId,
      viewingSubmission, setViewingSubmission,
      downloadAllSubmissionsZip,
      setEditingStudentId, setNewPasswordVal,
      evalScores, setEvalScores,
      evalGrade, setEvalGrade,
      evalFeedback, setEvalFeedback,
      isGradeManuallySet, setIsGradeManuallySet,
      aiInstructions, setAiInstructions,
      isAiGrading, handleAiGrade,
      formatDateTime,
      editingStudentId, newPasswordVal,
      setIsUpgradeModalOpen, setIsProfileModalOpen,
      renderProfileModal, renderGradebookDialog,
      deleteTarget, renameTarget, replyingFeedbackId, setReplyingFeedbackId,
      adminReplyText, setAdminReplyText, newClassNameVal, isChangingPassword, setIsChangingPassword,
      isLoadingSchools, newSchoolName, setNewSchoolName, newSchoolInviteCode, setNewSchoolInviteCode, handleCreateSchool, handleDeleteSchool
    };

    return <AdminDashboard {...adminProps} />;
  }

  if (currentUser.role === 'teacher') {

    const teacherProps = {
      store, currentUser, schools,
      selectedClassId, setSelectedClassId,
      activeTab, setActiveTab,
      templateSearchQuery, setTemplateSearchQuery,
      templateSelectedSubject, setTemplateSelectedSubject,
      isUpgradeModalOpen, setIsUpgradeModalOpen,
      isProfileModalOpen, setIsProfileModalOpen,
      isAddingClass, setIsAddingClass,
      newClassName, setNewClassName,
      isAddingStudent, setIsAddingStudent,
      newStudentName, setNewStudentName,
      newStudentUsername, setNewStudentUsername,
      newStudentPassword, setNewStudentPassword,
      selectedExistingClassId, setSelectedExistingClassId,
      selectedExistingStudentId, setSelectedExistingStudentId,
      classSearch, setClassSearch,
      studentSearch, setStudentSearch,
      isImportingCSV, setIsImportingCSV,
      csvClassName, setCsvClassName,
      isCreatingAssignment, setIsCreatingAssignment,
      viewingSubmission, setViewingSubmission,
      evalScores, setEvalScores,
      evalGrade, setEvalGrade,
      evalFeedback, setEvalFeedback,
      isGradeManuallySet, setIsGradeManuallySet,
      aiInstructions, setAiInstructions,
      isAiGrading, setIsAiGrading,
      handleAiGrade,
      setEditingStudentId, setNewPasswordVal,
      setRenameTarget, setNewClassNameVal,
      setDeleteTarget,
      targetClassId, setTargetClassId,
      formatDateTime,
      renderProfileModal, renderGradebookDialog, renderTemplateCopyDialog,
      downloadAllSubmissionsZip, handleImportCSV, handleImportCSVToExisting,
      isEvaluatingPractice, setIsEvaluatingPractice,
      customCredits, setCustomCredits, toast,
      expandedSubjects, setExpandedSubjects,
      handleStartSendCopy,
      copyTargetClassId, setCopyTargetClassId,
      copyStartTime, setCopyStartTime,
      copyEndTime, setCopyEndTime,
      isSendingCopy, setIsSendingCopy,
      isEditingSettings, setIsEditingSettings,
      editStartTime, setEditStartTime,
      editEndTime, setEditEndTime,
      editIsPublicTemplate, setEditIsPublicTemplate,
      editTimeLimit, setEditTimeLimit,
      handleStartEditSettings,
      editingStudentId, newPasswordVal, isChangingPassword, setIsChangingPassword,
      deleteTarget, renameTarget, newClassNameVal,
      isGeneratingAlternative, setIsGeneratingAlternative,
      setPaymentDetails, paymentDetails,
      selectedTeacherSubject, setSelectedTeacherSubject,
      classActionType, setClassActionType,
      selectedTemplateForCopy, setSelectedTemplateForCopy,
      templateCopyClassId, setTemplateCopyClassId,
      templateCopyStartTime, setTemplateCopyStartTime,
      templateCopyEndTime, setTemplateCopyEndTime,
      templateCopyAssignType, setTemplateCopyAssignType,
      templateCopySelectedStudentIds, setTemplateCopySelectedStudentIds,
      viewingAssignment, setViewingAssignment,
      viewingAssignmentSubs, setViewingAssignmentSubs,
      setSelectedGradebookStudent, setSelectedGradebookSubject, setGradebookViewMode,
      studentActionType, setStudentActionType,
      csvFile, setCsvFile,
      csvParsingError, setCsvParsingError,
      csvImportProgress, setCsvImportProgress,
      isCustomSchoolModalOpen, setIsCustomSchoolModalOpen,
      handleAddClass, handleAddStudent, downloadCsvResults
    };

    return <TeacherDashboard {...teacherProps} />;
  }

  if (currentUser.role === 'student') {

    const studentProps = {
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
    };

    return <StudentDashboard {...studentProps} />;
  }

  return null;
}