"use client";

import { useState, useEffect } from 'react';
import { useITestStore } from '@/hooks/use-itest-store';
import { Navbar } from '@/components/itest/Navbar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Users, ClipboardList, CheckCircle2, ChevronRight, GraduationCap, School, Loader2, BookOpen, PenTool, Trash2, Upload, LayoutDashboard, Activity, ChevronUp, ChevronDown, Edit3, UserPlus, Crown, Check, Sparkles } from 'lucide-react';
import { AssignmentCreator } from '@/components/itest/AssignmentCreator';
import { DrawingPad } from '@/components/itest/DrawingPad';
import { GradePicker } from '@/components/itest/GradePicker';
import { GraphQuestionStudent, GraphQuestionEvaluation, AxisQuestionStudent, AxisQuestionEvaluation, NumberLineQuestionStudent, NumberLineQuestionEvaluation } from '@/components/itest/GraphQuestion';
import { Assignment, User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ITestApp() {
  const store = useITestStore();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
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
  const [paymentDetails, setPaymentDetails] = useState<{ amount: number, type: 'monthly' | 'yearly' } | null>(null);
  const [newClassName, setNewClassName] = useState('');

  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [targetClassId, setTargetClassId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
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
  
  const [activeTab, setActiveTab] = useState('classes');
  const [adminTab, setAdminTab] = useState<'overview' | 'classes' | 'teachers' | 'students' | 'assignments' | 'schools'>('schools');
  const [adminSchoolFilter, setAdminSchoolFilter] = useState<string>('all');
  const [adminSearchFilter, setAdminSearchFilter] = useState<string>('');
  const [adminSortBy, setAdminSortBy] = useState<'name' | 'school' | 'default'>('default');
  const [adminSortOrder, setAdminSortOrder] = useState<'asc' | 'desc'>('asc');

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
  };  const downloadAllSubmissionsZip = async (assignmentId: string) => {
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
    const allGradedSubmissions = studentSubmissions.filter(s => s.grade !== undefined && s.grade !== null);
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
      return isCorrectSubject && s.grade !== undefined && s.grade !== null;
    });
    const subjectSum = selectedSubjectGradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
    const subjectAverage = selectedSubjectGradedSubmissions.length > 0 ? (subjectSum / selectedSubjectGradedSubmissions.length) : null;

    // Calculate subject averages for display in the sidebar
    const subjectAverages = predefinedSubjects.reduce((acc, subj) => {
      const graded = studentSubmissions.filter(s => {
        const a = store.assignments.find(as => as.id === s.assignmentId);
        if (!a) return false;
        const isCorrectSubject = subj === 'Jiný' ? (!a.subject || a.subject === 'Jiný') : (a.subject === subj);
        return isCorrectSubject && s.grade !== undefined && s.grade !== null;
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
                                  sub.grade ? (
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
                                    <Badge variant={sub.grade ? "default" : "secondary"} className="font-black text-xs px-2.5 py-1">
                                      {sub.grade ? `Známka: ${sub.grade}` : 'Neohodnoceno'}
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
        if (!inviteCode.trim()) {
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
              inviteCode: inviteCode.trim(),
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
          toast({ title: "Registrace úspěšná", description: "Účet byl vytvořen, můžete se přihlásit." });

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

  if (!store.currentUser) {
    return (
      <div className="min-h-screen bg-[#EFF3F7] flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden animate-fade-in">
          <CardHeader className="text-center space-y-4 bg-primary text-white pb-8">
            <div className="bg-white/20 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg transform -rotate-6">
              <School className="text-white w-8 h-8" />
            </div>
            <div className="space-y-1">
              <CardTitle className="font-headline text-4xl">iTest Cloud</CardTitle>
              <CardDescription className="text-white/70">Moderní vzdělávání v reálném čase.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="flex justify-center gap-4 mb-4">
                <button 
                  type="button" 
                  onClick={() => setAuthMode('login')}
                  className={`text-sm font-bold pb-1 border-b-2 transition-all ${authMode === 'login' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                >Přihlášení</button>
                <button 
                  type="button" 
                  onClick={() => setAuthMode('register')}
                  className={`text-sm font-bold pb-1 border-b-2 transition-all ${authMode === 'register' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                >Registrace učitele</button>
              </div>

              {authMode === 'login' && (
                <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg">
                  <button 
                    type="button" 
                    className={`py-2 text-xs font-bold rounded-md transition-all ${loginRole === 'teacher' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                    onClick={() => setLoginRole('teacher')}
                  >Učitel</button>
                  <button 
                    type="button" 
                    className={`py-2 text-xs font-bold rounded-md transition-all ${loginRole === 'student' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                    onClick={() => setLoginRole('student')}
                  >Student</button>
                </div>
              )}

              <div className="space-y-4">
                {authMode === 'register' && (
                  <>
                    <div className="space-y-2">
                      <Label>Vaše jméno</Label>
                      <Input placeholder="Mgr. Jan Novák" value={name} onChange={e => setName(e.target.value)} className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>Kód školy (zvací kód)</Label>
                      <Input placeholder="např. testskola" value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="h-12" />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Uživatelské jméno</Label>
                  <Input placeholder="jan.novak" value={username} onChange={e => setUsername(e.target.value)} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Heslo</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="h-12" />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-headline shadow-lg">
                {authMode === 'login' ? 'Vstoupit do iTestu' : 'Vytvořit účet'}
              </Button>
            </form>
          </CardContent>
        </Card>
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
        <Navbar user={currentUser} onLogout={() => store.logout()} />

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
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                                <td className="p-4 text-sm text-gray-650 font-semibold">
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
                                  {t.role === 'admin' ? (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <div className="flex flex-col">
                                        {isPremium ? (
                                          <>
                                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200/50 px-2 py-0.5 rounded-full w-max flex items-center gap-1">
                                              <Crown className="w-3 h-3 fill-amber-500 text-amber-500" /> Premium
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

                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className={`h-7 text-[10px] px-2.5 rounded-xl font-bold ${isPremium ? 'border-red-200 text-red-650 hover:bg-red-50 hover:text-red-700' : 'bg-amber-500 hover:bg-amber-600 text-white border-none'}`}
                                        onClick={() => store.toggleUserPremium(t.id, isPremium)}
                                      >
                                        {isPremium ? 'Zrušit Premium' : 'Aktivovat Premium'}
                                      </Button>
                                    </div>
                                  )}
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
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col md:flex-row gap-4 items-center justify-between">
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
                                            {a.isDraft
                                              ? <Badge variant="outline" className="font-bold text-amber-600 bg-amber-50 border-amber-200">Neuveřejněno</Badge>
                                              : <Badge variant="outline" className="font-bold text-primary bg-primary/5">{subCount} odevzdání</Badge>
                                            }
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
                                <td className="p-4 text-sm text-gray-650 font-semibold">
                                  {schools.find(sc => sc.id === s.schoolId)?.name || 'Bez školy'}
                                </td>
                                <td className="p-4">
                                  {classroom ? (
                                    <Badge variant="outline" className="font-bold text-green-600 bg-green-50 border-green-150">{classroom.name}</Badge>
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
                                <Card className="border-none shadow-2xl rounded-3xl overflow-hidden print-container">
                                  <style>{`@media print{body{visibility:hidden!important;background:white!important}.print-container,.print-container *{visibility:visible!important}.print-container{position:absolute!important;left:0!important;top:0!important;width:100%!important;max-width:100%!important;padding:0!important;margin:0!important;box-shadow:none!important;border:none!important}.print-exclude,button,textarea,input,.dialog,[role="dialog"],header,nav{display:none!important;visibility:hidden!important}.print-show{display:block!important;visibility:visible!important}}`}</style>
                                  <CardHeader className="bg-white border-b p-8 flex flex-row items-center justify-between gap-4">
                                    <div>
                                      <CardTitle className="font-headline text-3xl text-primary">{assignment.title}</CardTitle>
                                      <CardDescription>Odevzdal: {student.name}</CardDescription>
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
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col md:flex-row gap-4 items-center justify-between">
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
                                    <td className="p-4 text-sm text-gray-650 font-semibold">
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
          {renderGradebookDialog()}
        </main>
      </div>
    );
  }

  if (currentUser.role === 'teacher') {
    const teacherClasses = store.classes.filter(c => c.teacherId === currentUser.id);
    const selectedClass = store.classes.find(c => c.id === selectedClassId);

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
          <Navbar user={currentUser} onLogout={() => store.logout()} />
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
                  onClick={() => store.activatePremium('monthly')}
                  className="w-full rounded-2xl py-6 font-bold shadow-md bg-indigo-600 hover:bg-indigo-750 text-white flex justify-between px-6 border-none"
                >
                  <span>Měsíční tarif</span>
                  <span>99 Kč / měsíc</span>
                </Button>
                <Button 
                  onClick={() => store.activatePremium('yearly')}
                  className="w-full rounded-2xl py-6 font-bold shadow-md bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white flex justify-between px-6 border-none"
                >
                  <span>Roční tarif (Ušetříte 16%)</span>
                  <span>999 Kč / rok</span>
                </Button>
              </div>
            </div>
          </div>
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
        <Navbar user={currentUser} onLogout={() => store.logout()} />
        
        {/* Banner o předplatném */}
        <div className="max-w-7xl w-full mx-auto px-4 md:px-8 mt-6">
          {isPremium ? (
            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-indigo-500/10 border border-amber-200/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100/80 p-2 rounded-xl text-amber-600">
                  <Crown className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                    Prémiový účet aktivní <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">PREMIUM</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Všechny limity jsou zrušeny. Placená verze vyprší a přepne se do základní verze za <span className="font-bold text-indigo-700">{premiumDaysLeft} dní</span> (platnost do: {currentUser.premiumExpiresAt ? new Date(currentUser.premiumExpiresAt).toLocaleDateString('cs-CZ') : 'neomezeně'}).
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-indigo-500/5 via-indigo-600/5 to-purple-500/5 border border-indigo-200/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100/80 p-2 rounded-xl text-indigo-650 animate-pulse">
                  <Sparkles className="w-5 h-5 text-indigo-650" />
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-950">
                    Používáte zkušební verzi iTest Cloud
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Zkušební doba končí za <span className="font-bold text-indigo-700">{daysLeft} dní</span>. Omezení: max. 2 třídy a 20 žáků na třídu.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-750 hover:to-purple-750 text-white rounded-xl text-xs font-bold py-2 px-4 shadow-sm border-none"
              >
                Upgradovat na Premium
              </Button>
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
                                      studentIds: editAssignType === 'specific' ? editSelectedStudentIds : []
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
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Opravdu chcete smazat úkol "${a.title}"? Tím smažete i všechny odevzdané práce žáků.`)) {
                                store.deleteAssignment(a.id);
                              }
                            }}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                          <ChevronRight className="w-5 h-5 text-gray-300" />
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
                      <Card className="border-none shadow-2xl rounded-3xl overflow-hidden print-container">
                        <style>{`
                          @media print {
                            body {
                              visibility: hidden !important;
                              background: white !important;
                            }
                            .print-container, .print-container * {
                              visibility: visible !important;
                            }
                            .print-container {
                              position: absolute !important;
                              left: 0 !important;
                              top: 0 !important;
                              width: 100% !important;
                              max-width: 100% !important;
                              padding: 0 !important;
                              margin: 0 !important;
                              box-shadow: none !important;
                              border: none !important;
                            }
                            .print-exclude, button, textarea, input, .dialog, [role="dialog"], header, nav {
                              display: none !important;
                              visibility: hidden !important;
                            }
                            .print-show {
                              display: block !important;
                              visibility: visible !important;
                            }
                          }
                        `}</style>
                        <CardHeader className="bg-white border-b p-8 flex flex-row items-center justify-between gap-4">
                          <div>
                            <CardTitle className="font-headline text-3xl text-primary">{assignment.title}</CardTitle>
                            <CardDescription>Odevzdal: {student.name}</CardDescription>
                          </div>
                          <Button 
                            onClick={() => window.print()} 
                            className="print-exclude rounded-full shadow-md bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                          >
                            🖨️ Tisk / Uložit PDF
                          </Button>
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

                return (
                  <div className="space-y-4">
                    <Button variant="ghost" className="rounded-full" onClick={() => { setViewingAssignmentSubs(null); }}>← Zpět na testy</Button>
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
                              const totalMax = selAssignment.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;
                              let earned = 0;
                              if (sub?.questionScores) {
                                if (sub.questionScores instanceof Map) {
                                  sub.questionScores.forEach(v => { earned += v; });
                                } else {
                                  Object.values(sub.questionScores).forEach(v => { earned += v as number; });
                                }
                              }
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
                                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sub ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <div>
                                      <p className="font-bold text-gray-800">{student.name}</p>
                                      <p className="text-xs text-muted-foreground">{student.username}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {sub ? (
                                      <>
                                        <Badge variant={sub.grade ? "default" : earned > 0 ? "outline" : "secondary"} className="font-bold">
                                          {sub.grade
                                            ? `Zn: ${sub.grade} (${earned}/${totalMax}b · ${pct}%)`
                                            : earned > 0
                                              ? `Body: ${earned}/${totalMax} (${pct}%)`
                                              : 'Neopraveno'}
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
                                        sub.grade ? (
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
            <DialogContent className="max-w-xl bg-white rounded-3xl border-none shadow-2xl p-6">
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
                      src={`https://api.paylibo.com/paylibo/generator/czech/image?accountNumber=1667425028&bankCode=3030&amount=${paymentDetails.amount}&currency=CZK&message=${encodeURIComponent(`${currentUser.name} - ${schools.find(s => s.id === currentUser.schoolId)?.name || 'Skola'}`)}`} 
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
                        {currentUser.name} - {schools.find(s => s.id === currentUser.schoolId)?.name || 'iTest Škola'}
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
                      onClick={() => {
                        toast({ 
                          title: "Platba odeslána k ověření", 
                          description: "Administrátor aktivuje Premium verzi vašeho účtu po připsání platby na bankovní účet." 
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
                  <div className="grid md:grid-cols-2 gap-4 py-4">
                    {/* Monthly card */}
                    <div className="bg-slate-50 border border-slate-200/60 hover:border-indigo-400 rounded-3xl p-5 flex flex-col justify-between transition-all hover:shadow-md">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">Měsíční tarif</h3>
                        <p className="text-xs text-muted-foreground mt-1">Flexibilní předplatné na každý měsíc.</p>
                        <div className="mt-4 flex items-baseline">
                          <span className="text-3xl font-black text-indigo-700">99 Kč</span>
                          <span className="text-xs text-muted-foreground ml-1">/ měsíc</span>
                        </div>
                        <ul className="text-xs space-y-2 mt-5 text-slate-600 font-medium">
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Neomezeně tříd
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-650 shrink-0" /> Neomezeně žáků a testů
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-650 shrink-0" /> Hromadné stahování výsledků
                          </li>
                        </ul>
                      </div>
                      <Button 
                        onClick={() => setPaymentDetails({ amount: 99, type: 'monthly' })}
                        className="w-full mt-6 rounded-2xl py-5 font-bold shadow-md bg-indigo-650 hover:bg-indigo-700 text-white border-none"
                      >
                        Aktivovat měsíčně
                      </Button>
                    </div>

                    {/* Yearly card */}
                    <div className="bg-gradient-to-b from-indigo-50/50 to-purple-50/50 border-2 border-indigo-500 rounded-3xl p-5 flex flex-col justify-between relative shadow-sm hover:shadow-md transition-all">
                      <span className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                        UŠETŘÍTE 16%
                      </span>
                      <div>
                        <h3 className="font-bold text-lg text-indigo-950 flex items-center gap-1">
                          Roční tarif <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                        </h3>
                        <p className="text-xs text-indigo-900/60 mt-1">Dlouhodobě nejvýhodnější volba pro školy.</p>
                        <div className="mt-4 flex items-baseline">
                          <span className="text-3xl font-black text-indigo-700">999 Kč</span>
                          <span className="text-xs text-muted-foreground ml-1">/ rok</span>
                        </div>
                        <ul className="text-xs space-y-2 mt-5 text-indigo-900 font-medium">
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 animate-pulse" /> Neomezeně tříd
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 animate-pulse" /> Neomezeně žáků a testů
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 animate-pulse" /> Hromadné stahování výsledků
                          </li>
                        </ul>
                      </div>
                      <Button 
                        onClick={() => setPaymentDetails({ amount: 999, type: 'yearly' })}
                        className="w-full mt-6 rounded-2xl py-5 font-bold shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-750 hover:to-purple-750 text-white border-none"
                      >
                        Aktivovat ročně
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

          {renderGradebookDialog()}
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
                      {submission ? (
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
                                    <div className="text-lg font-bold text-muted-foreground">Celkové body: {earned} / {totalMax} ({pct} %)</div>
                                    
                                    {submission.grade && (
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
                                  
                                  const isGraded = submission.grade !== undefined && submission.grade !== null;
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
                                          <p className="font-bold text-lg text-gray-800">{q.text}</p>
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
                                      {q.type !== 'drawing' && q.type !== 'graph' && q.type !== 'axis' && q.type !== 'number_line' && (
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
                                          <GraphQuestionEvaluation
                                            question={q}
                                            studentAnswer={answer}
                                            score={score}
                                            maxPoints={maxPoints}
                                          />
                                        </div>
                                      )}

                                       {/* Osa X/Y vyhodnocení */}
                                       {q.type === 'axis' && (
                                         <div className="mt-2">
                                           <AxisQuestionEvaluation
                                             question={q}
                                             studentAnswer={answer}
                                             score={score}
                                             maxPoints={maxPoints}
                                           />
                                         </div>
                                       )}
                                       {q.type === 'number_line' && (
                                         <div className="mt-2">
                                           <NumberLineQuestionEvaluation
                                             question={q}
                                             studentAnswer={answer}
                                             score={score}
                                             maxPoints={maxPoints}
                                           />
                                         </div>
                                       )}

                                      {/* Kresba k otázce */}
                                      {drawing && (
                                        <div className="mt-3 bg-white p-3 rounded-xl border">
                                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Moje přiložená kresba:</span>
                                          <img src={drawing} className="border rounded-lg max-w-full max-h-60 object-contain bg-white" alt="Kresba k otázce" />
                                        </div>
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
                                      <p className="font-semibold text-lg">{q.text}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] uppercase">
                                      {q.type === 'short_answer' ? 'Krátká odpověď' : 
                                       q.type === 'long_answer' ? 'Dlouhá odpověď' : 
                                       q.type === 'multiple_choice' ? 'Výběr z možností' : 
                                       q.type === 'axis' ? 'Osa X/Y' : 
                                       q.type === 'number_line' ? 'Číselná osa' : q.type === 'true_false' ? 'Ano / Ne' : 
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
                    !store.submissions.some(s => s.assignmentId === a.id && s.studentId === currentUser.id)
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
                    store.submissions.some(s => s.assignmentId === a.id && s.studentId === currentUser.id)
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
                        
                        let badgeText = sub.grade ? `Známka: ${sub.grade} (${earned}/${totalMax} b)` : 'Odevzdáno (Neopraveno)';

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
                                  <Badge variant={sub.grade ? "default" : "secondary"} className="text-xs">
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