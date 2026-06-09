"use client";

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
import { renderRichText } from '@/lib/utils';
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mId = params.get('monitor');
      if (mId) {
        setMonitorAssignmentId(mId);
      }
    }
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'register-trial'>('login');
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
                               q.type === 'graph' ? 'Graf' : q.type;
                               
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
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 border border-white/10 shrink-0 self-stretch sm:self-auto">
              <div className="text-4xl">{overallEmoji}</div>
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-200 tracking-wider block">Celkový Průměr</span>
                <span className="text-2xl font-black text-white">{overallAverage !== null ? overallAverage.toFixed(2).replace('.', ',') : '--'}</span>
                <span className="text-xs text-indigo-100 block font-medium">{overallText}</span>
              </div>
            </div>
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
                      {avg !== null ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {avg.toFixed(1).replace('.', ',')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-normal italic">--</span>
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
      if (name && username && password) {
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

    if (!targetClassId) {
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
    
    if (targetClassId) {
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
            classroomId: targetClassId
          })
        });

        const data = await studentRes.json();

        if (!studentRes.ok) {
          toast({ title: "Registrace žáka selhala", description: data.error || "Chyba databáze", variant: "destructive" });
          return; // DŮLEŽITÉ: Nepokračujeme dál, abychom nezavřeli modal a nesmazali data učitele
        }

        // Uložení s reálným ID z MongoDB
        store.addStudent(targetClassId, newStudentName, newStudentUsername, newStudentPassword, data.data._id);

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
                  {(authMode === 'register' || authMode === 'register-trial') && (
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-700">Vaše jméno</Label>
                      <Input placeholder="Mgr. Jan Novák" value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  )}
                  {authMode === 'register' && (
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-700">Kód školy (zvací kód)</Label>
                      <Input placeholder="např. testskola" value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Uživatelské jméno</Label>
                    <Input placeholder="jan.novak" value={username} onChange={e => setUsername(e.target.value)} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Heslo</Label>
                    <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl" />
                  </div>
                </div>
                
                <Button type="submit" className="w-full h-12 text-base font-headline font-bold shadow-lg rounded-xl">
                  {authMode === 'login' ? 'Vstoupit do iTestu' : authMode === 'register' ? 'Vytvořit účet' : 'Vytvořit zkušební účet'}
                </Button>
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

    return (
      <div className="min-h-screen flex flex-col bg-[#EFF3F7]">
        <Navbar 
          user={currentUser} 
          onLogout={() => store.logout()} 
          onUpgradeClick={() => setIsUpgradeModalOpen(true)} 
          onProfileClick={() => setIsProfileModalOpen(true)}
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
            <div className="bg-primary/10 border border-primary/20 text-primary font-bold px-4 py-2 rounded-full text-sm">
              Root administrátorský přístup
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <Button variant="outline" className="h-16 rounded-xl font-bold justify-start px-6 gap-3 shadow-sm" onClick={() => setAdminTab('schools')}>
                        <School className="w-5 h-5 text-violet-500" /> Zobrazit školy →
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
                  <div>
                    <h3 className="text-2xl font-headline font-bold text-gray-800">Seznam Učitelů</h3>
                    <p className="text-muted-foreground text-sm">Správa a přehled všech registrovaných učitelských účtů.</p>
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
                                <td className="p-4 font-bold text-primary flex items-center gap-2">
                                  <GraduationCap className="w-4 h-4 text-accent" /> {t.name}
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
                                                       q.type === 'graph' ? 'Graf' : q.type}
                                                    </Badge>
                                                  </div>
                                                  {q.type !== 'drawing' && q.type !== 'graph' && q.type !== 'axis' && q.type !== 'number_line' && (
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
                                                    <div className="mt-3">
                                                      <span className="text-sm font-medium text-muted-foreground block mb-1">Přiložená kresba:</span>
                                                      <img src={drawing} className="border rounded-xl max-w-full max-h-64 object-contain bg-white" />
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
                                            <Badge variant={s.grade ? "default" : earned > 0 ? "outline" : "secondary"} className="font-bold">
                                              {s.grade
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
                          <th className="p-4 font-bold text-gray-700 text-sm">Třídy</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Učitelé</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Žáci</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Akce</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {isLoadingSchools ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-muted-foreground">
                              <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Načítám školy...
                              </span>
                            </td>
                          </tr>
                        ) : schools.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-muted-foreground">Žádné školy nebyly vytvořeny.</td>
                          </tr>
                        ) : (
                          schools.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50/50">
                              <td className="p-4 font-bold text-primary">{s.name}</td>
                              <td className="p-4 font-mono text-sm font-bold text-indigo-600">{s.inviteCode}</td>
                              <td className="p-4 text-sm font-semibold">{s.classCount}</td>
                              <td className="p-4 text-sm font-semibold">{s.teacherCount}</td>
                              <td className="p-4 text-sm font-semibold">{s.studentCount}</td>
                              <td className="p-4">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteSchool(s.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
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

  if (currentUser.role === 'teacher') {
    const teacherClasses = store.classes.filter(c => c.teacherId === currentUser.id);
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

    if (isTrialExpired) {
      return (
        <div className="min-h-screen flex flex-col bg-background">
          <Navbar 
            user={currentUser} 
            onLogout={() => store.logout()} 
            onUpgradeClick={() => setIsUpgradeModalOpen(true)} 
            onProfileClick={() => setIsProfileModalOpen(true)}
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

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar 
          user={currentUser} 
          onLogout={() => store.logout()} 
          onUpgradeClick={() => setIsUpgradeModalOpen(true)} 
          onProfileClick={() => setIsProfileModalOpen(true)}
        />
        
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

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
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
                      <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors">{c.name}</CardTitle>
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
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 text-xs font-bold text-primary flex items-center gap-1.5 rounded-full"
                                  onClick={() => handleStartEditSettings(a)}
                                >
                                  ✏️ Upravit nastavení
                                </Button>
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
                            </div>
                          )}
                        </div>

                        {a.questions && a.questions.length > 0 && (
                          <div className="mt-8">
                            <h3 className="font-semibold text-xl mb-4">Otázky v testu:</h3>
                            <div className="space-y-3">
                              {a.questions.map(q => (
                                <div key={q.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                                  <span className="font-medium">{q.text}</span>
                                  <Badge variant="outline">
                                    {q.type === 'short_answer' ? 'Krátká odpověď' : 
                                     q.type === 'long_answer' ? 'Dlouhá odpověď' : 
                                     q.type === 'multiple_choice' ? 'Výběr z možností' : 
                                     q.type === 'axis' ? 'Osa X/Y' : 
                                     q.type === 'number_line' ? 'Číselná osa' : q.type === 'true_false' ? 'Ano / Ne' : 
                                     q.type === 'drawing' ? 'Kresba' : 
                                     q.type === 'graph' ? 'Graf' : q.type}
                                  </Badge>
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
                  <Button variant="ghost" className="rounded-full" onClick={() => setIsCreatingAssignment(false)}>← Zpět</Button>
                                    <AssignmentCreator 
                    classId={selectedClassId!} 
                    students={store.users.filter(u => u.role === 'student' && u.classId === selectedClassId)}
                    classes={store.classes}
                    allStudents={store.users}
                    onSave={(a) => {
                      store.addAssignment(a);
                      setIsCreatingAssignment(false);
                    }} 
                  />
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="flex justify-end">
                    <Button className="rounded-full shadow-md" onClick={() => setIsCreatingAssignment(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Vytvořit práci
                    </Button>
                  </div>
                  {store.assignments.filter(a => a.classId === selectedClassId && (a.teacherId === currentUser.id || !a.teacherId)).map(a => (
                    <Card key={a.id} className={`hover:border-primary cursor-pointer transition-all border-none shadow-sm ${a.isDraft ? 'bg-amber-50/40 border border-amber-200' : 'bg-white'}`} onClick={() => setViewingAssignment(a.id)}>
                      <CardContent className="p-5 flex justify-between items-center">
                        <div className="flex items-center gap-5">
                          <ClipboardList className={`w-6 h-6 ${a.isDraft ? 'text-amber-500' : 'text-primary'}`} />
                          <div>
                            <h4 className="font-bold text-xl">{a.title}</h4>
                            {a.isDraft && <span className="text-xs font-bold text-amber-600">💾 Koncept — neuveřejněno</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`/print/${a.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-primary rounded-full">
                              <Printer className="w-5 h-5" />
                            </Button>
                          </a>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full" 
                            onClick={(e) => {
                              if (confirm(`Opravdu chcete smazat úkol "${a.title}"? Tím smažete i všechny odevzdané práce žáků.`)) {
                                store.deleteAssignment(a.id);
                              }
                            }}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                          <ChevronRight className="w-5 h-5 text-gray-300 cursor-pointer" onClick={() => setViewingAssignment(a.id)} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                            <CardDescription>Odevzdal: {student.name}</CardDescription>
                          </div>
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
                                              q.type === 'graph' ? 'Graf' : q.type}
                                           </Badge>
                                        </div>
                                        
                                        {q.type !== 'drawing' && q.type !== 'graph' && q.type !== 'axis' && q.type !== 'number_line' && (
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
                                          <div className="mt-3">
                                            <span className="text-sm font-medium text-muted-foreground block mb-1">Přiložená kresba:</span>
                                            <img src={drawing} className="border rounded-xl max-w-full max-h-64 object-contain bg-white" />
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
                          onClick={() => window.open(`/?monitor=${selAssignment.id}`, '_blank')}
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
                                          <p className="font-bold text-gray-800">{student.name}</p>
                                          <p className="text-xs text-muted-foreground">{student.username}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {sub ? (
                                          <>
                                            <Badge variant={!selAssignment.isPractice && sub.grade ? "default" : earned > 0 ? "outline" : "secondary"} className="font-bold">
                                              {sub.submittedAt === "" ? 'Rozpracováno' : (
                                                selAssignment.isPractice
                                                  ? `Body: ${earned}/${totalMax} (${pct}%)`
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

          </Tabs>

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
                  <Button onClick={handleAddStudent} disabled={store.currentUser?.role === 'admin' && !targetClassId}>Vytvořit</Button>
                ) : studentActionType === 'select' ? (
                  <Button 
                    onClick={() => {
                      if (selectedExistingStudentId && targetClassId) {
                        store.assignStudent(selectedExistingStudentId, targetClassId);
                        setIsAddingStudent(false);
                        setSelectedExistingStudentId('');
                      }
                    }} 
                    disabled={!selectedExistingStudentId || !targetClassId}
                  >Přiřadit žáka</Button>
                ) : (
                  <Button
                    onClick={handleImportCSVToExisting}
                    disabled={!csvFile || !!csvImportProgress || (store.currentUser?.role === 'admin' && !targetClassId)}
                    className="w-full"
                  >
                    Importovat žáky z CSV
                  </Button>
                )}
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
                      <div>
                        <h3 className="font-bold text-lg text-violet-950 flex items-center gap-1">
                          Školní licence 🏫
                        </h3>
                        <p className="text-xs text-violet-900/60 mt-1">Pro celé školy a neomezený počet učitelů.</p>
                        <div className="mt-4 flex flex-col">
                          <span className="text-2xl font-black text-violet-700">od 4 999 Kč</span>
                          <span className="text-[10px] text-muted-foreground">/ rok (dle počtu žáků)</span>
                        </div>
                        <ul className="text-xs space-y-2 mt-5 text-violet-900 font-medium">
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" /> Individuální nacenění
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" /> Neomezeně učitelů, tříd i žáků
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" /> Společná správa a fakturace
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" /> Zaškolení a prioritní podpora
                          </li>
                        </ul>
                      </div>
                      <Button 
                        onClick={() => {
                          toast({
                            title: "Poptávka školní licence",
                            description: "Pro individuální nacenění nás kontaktujte na e-mailu: info@itests.cz.",
                          });
                        }}
                        className="w-full mt-6 rounded-2xl py-5 font-bold shadow-md bg-violet-600 hover:bg-violet-700 text-white border-none"
                      >
                        Kontaktovat podporu
                      </Button>
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
                  Balíček na míru pro školy
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-sm leading-relaxed">
                  Máte zájem o licencování celé školy, více učitelů nebo o individuální navýšení kreditů? Kontaktujte nás a my Vám připravíme nabídku na míru.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-4 space-y-3.5 text-xs text-violet-900 my-4">
                <div className="flex justify-between border-b border-violet-200/50 pb-2">
                  <span className="font-semibold text-violet-700">Kontaktní e-mail:</span>
                  <a href="mailto:info@itests.cz" className="font-bold text-violet-900 hover:underline">info@itests.cz</a>
                </div>
                <div className="flex flex-col gap-1 leading-relaxed">
                  <span className="font-semibold text-violet-700">Co uvést do poptávky:</span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] mt-1 font-medium pl-1">
                    <li>Název a adresa školy</li>
                    <li>Orientační počet učitelů (licencí)</li>
                    <li>Orientační počet žáků</li>
                    <li>Požadované funkce / objem AI kreditů</li>
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
                  href={`mailto:info@itests.cz?subject=${encodeURIComponent('Poptávka balíčku na míru pro školu - iTest Cloud')}&body=${encodeURIComponent(
                    `Dobrý den,\n\nmám zájem o přípravu individuální nabídky (balíčku na míru) pro naši školu.\n\n` +
                    `Název školy: \n` +
                    `Orientační počet učitelů: \n` +
                    `Orientační počet žáků: \n` +
                    `Požadavky / poznámky: \n\n` +
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

          {renderProfileModal()}
          {renderGradebookDialog()}
          {renderTemplateCopyDialog()}
        </main>
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
              {timeLeft !== null && (
                <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-red-500 to-indigo-600 text-white font-mono px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-pulse print-exclude">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold block uppercase tracking-wider text-white/80">Zbývající čas</span>
                    <span className="text-2xl font-black">{(() => {
                      const mins = Math.floor(timeLeft / 60);
                      const secs = timeLeft % 60;
                      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    })()}</span>
                  </div>
                </div>
              )}
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
                                    <div className="text-4xl font-black text-primary">Známka: {submission.grade || 'Nehodnoceno'}</div>
                                    {a.isPractice ? (
                                      <div className="text-4xl font-black text-primary">Procvičování</div>
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
                                      <div className="mt-4 p-3 bg-white rounded-xl border border-primary/10 italic text-muted-foreground">
                                        Odpověď učitele: "{submission.feedback}"
                                      </div>
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
                                      {q.type !== 'drawing' && q.type !== 'graph' && q.type !== 'axis' && q.type !== 'number_line' && q.type !== 'matching' && (
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
                                       q.type === 'drawing' ? 'Kresba' : q.type}
                                    </Badge>
                                  </div>

                                  {/* Textový vstup pro všechny typy kromě drawing */}
                                  {q.type === 'short_answer' && (
                                    <Input
                                      placeholder="Vaše odpověď..."
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
                            <Button className="w-full h-14 text-xl shadow-lg" onClick={() => {
                              store.submitWork({ assignmentId: selectedAssignmentId, studentId: currentUser.id, answers: studentAnswers, questionDrawings, mainWorkDrawing });
                            }}>Odevzdat v cloudu</Button>
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

              {/* Section A: Zadané úkoly k vypracování */}
              <div className="space-y-4">
                <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-2 border-b pb-2">
                  <ClipboardList className="w-6 h-6 text-accent" /> Úkoly k vypracování (To Do)
                </h2>
                {(() => {
                  const pending = studentAssignments.filter(a =>
                    (a.subject === selectedSubject || (selectedSubject === 'Jiný' && !a.subject)) &&
                    !store.submissions.some(s => s.assignmentId === a.id && s.studentId === currentUser.id && s.submittedAt)
                  );

                  if (pending.length === 0) {
                    return (
                      <Card className="border-none shadow-sm bg-white p-8 text-center space-y-2">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto animate-pulse" />
                        <h3 className="text-lg font-bold text-gray-800">Skvělé! Všechny úkoly máš hotové.</h3>
                        <p className="text-sm text-muted-foreground">V tomto předmětu nemáš žádné úkoly k odevzdání.</p>
                      </Card>
                    );
                  }

                                    return (
                    <div className="grid gap-4">
                      {pending.map(a => {
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
                            className={`transition-all border-none bg-white shadow-sm overflow-hidden ${
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
                            <CardContent className="p-5 flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-lg text-gray-800">{a.title}</p>
                                  {!hasStarted && (
                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">🔒 Neaktivní</span>
                                  )}
                                  {hasEnded && (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">⌛ Vypršel čas</span>
                                  )}
                                </div>
                                {a.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{a.description}</p>
                                )}
                                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                                  {a.startTime && (
                                    <span>Od: {formatDateTime(a.startTime)}</span>
                                  )}
                                  {a.endTime && (
                                    <span className={hasEnded ? 'text-amber-600 font-bold' : ''}>Do: {formatDateTime(a.endTime)}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!hasStarted ? (
                                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">Začne {formatDateTime(a.startTime)}</span>
                                ) : hasEnded ? (
                                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full flex items-center gap-1">Prohlédnout (vypršelo)</span>
                                ) : (
                                  <span className="text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-full">Vypracovat úkol</span>
                                )}
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Section B: Dokončené a opravené testy */}
              <div className="space-y-4">
                <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-2 border-b pb-2">
                  <CheckCircle2 className="w-6 h-6 text-green-500" /> Dokončené testy (Done)
                </h2>
                {(() => {
                  const completed = studentAssignments.filter(a =>
                    (a.subject === selectedSubject || (selectedSubject === 'Jiný' && !a.subject)) &&
                    store.submissions.some(s => s.assignmentId === a.id && s.studentId === currentUser.id && s.submittedAt)
                  );

                  if (completed.length === 0) {
                    return (
                      <Card className="border-none shadow-sm bg-white p-8 text-center space-y-2">
                        <span className="text-3xl block">💤</span>
                        <h3 className="text-lg font-bold text-gray-800">Žádné dokončené testy</h3>
                        <p className="text-sm text-muted-foreground">V tomto předmětu jsi ještě nevyplnil žádné testy.</p>
                      </Card>
                    );
                  }

                  return (
                    <div className="grid gap-4">
                      {completed.map(a => {
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
                        
                        let badgeText = a.isPractice
                          ? `Procvičování (${earned}/${totalMax} b)`
                          : (sub.grade ? `Známka: ${sub.grade} (${earned}/${totalMax} b)` : 'Odevzdáno (Neopraveno)');

                        return (
                                                    <Card 
                            key={a.id} 
                            className="cursor-pointer hover:shadow-md transition-all border-none bg-white shadow-sm overflow-hidden" 
                            onClick={() => selectStudentAssignment(a.id)}
                          >
                            <CardContent className="p-5 flex justify-between items-center">
                              <div>
                                <p className="font-bold text-lg text-gray-800">{a.title}</p>
                                <div className="mt-1 flex gap-2">
                                  <Badge variant={!a.isPractice && sub.grade ? "default" : "secondary"} className="text-xs">
                                    {badgeText}
                                  </Badge>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-300" />
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()}
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
                  <p className="text-sm text-muted-foreground mt-0.5">Podívej se na své známky, průměry a hodnocení ze všech testů.</p>
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
        </main>
      </div>
    );
  }

  return null;
}