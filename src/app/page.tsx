"use client";

import { useState, useEffect } from 'react';
import { useITestStore } from '@/hooks/use-itest-store';
import { Navbar } from '@/components/itest/Navbar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Users, ClipboardList, CheckCircle2, ChevronRight, GraduationCap, School, Loader2, BookOpen, PenTool, Trash2, Upload, LayoutDashboard, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { AssignmentCreator } from '@/components/itest/AssignmentCreator';
import { DrawingPad } from '@/components/itest/DrawingPad';
import { GradePicker } from '@/components/itest/GradePicker';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ITestApp() {
  const store = useITestStore();
  const { toast } = useToast();
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginRole, setLoginRole] = useState<'admin' | 'teacher' | 'student'>('teacher');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [targetClassId, setTargetClassId] = useState<string | null>(null);

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
  const [adminTab, setAdminTab] = useState<'overview' | 'classes' | 'teachers' | 'students' | 'assignments'>('overview');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<string | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [mainWorkDrawing, setMainWorkDrawing] = useState<string | undefined>();
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>({});
  const [questionDrawings, setQuestionDrawings] = useState<Record<string, string>>({});
  const [questionDrawingOpen, setQuestionDrawingOpen] = useState<Record<string, boolean>>({});
  
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

    let suggested = 5;
    if (pct >= 85) suggested = 1;
    else if (pct >= 65) suggested = 2;
    else if (pct >= 45) suggested = 3;
    else if (pct >= 25) suggested = 4;

    if (!isGradeManuallySet) {
      setEvalGrade(suggested);
    }
  }, [evalScores, isGradeManuallySet, viewingSubmission, store.submissions, store.assignments]);

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
                <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-lg">
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
                  <button 
                    type="button" 
                    className={`py-2 text-xs font-bold rounded-md transition-all ${loginRole === 'admin' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                    onClick={() => setLoginRole('admin')}
                  >Admin</button>
                </div>
              )}

              <div className="space-y-4">
                {authMode === 'register' && (
                  <div className="space-y-2">
                    <Label>Vaše jméno</Label>
                    <Input placeholder="Mgr. Jan Novák" value={name} onChange={e => setName(e.target.value)} className="h-12" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Uživatelské jméno</Label>
                  <Input placeholder="ucitel1" value={username} onChange={e => setUsername(e.target.value)} className="h-12" />
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
    const teachers = store.users.filter(u => u.role === 'teacher');
    const students = store.users.filter(u => u.role === 'student');
    const classrooms = store.classes;
    const assignments = store.assignments;
    const submissions = store.submissions;

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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Button variant="outline" className="h-16 rounded-xl font-bold justify-start px-6 gap-3" onClick={() => setAdminTab('teachers')}>
                        <GraduationCap className="w-5 h-5 text-accent" /> Zobrazit učitele →
                      </Button>
                      <Button variant="outline" className="h-16 rounded-xl font-bold justify-start px-6 gap-3" onClick={() => setAdminTab('classes')}>
                        <School className="w-5 h-5 text-green-500" /> Zobrazit třídy →
                      </Button>
                      <Button variant="outline" className="h-16 rounded-xl font-bold justify-start px-6 gap-3" onClick={() => setAdminTab('students')}>
                        <Users className="w-5 h-5 text-indigo-500" /> Zobrazit žáky →
                      </Button>
                      <Button variant="outline" className="h-16 rounded-xl font-bold justify-start px-6 gap-3" onClick={() => setAdminTab('assignments')}>
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

                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="p-4 font-bold text-gray-700 text-sm">Jméno učitele</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Uživatelské jméno</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Spravované třídy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {teachers.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-muted-foreground">V systému zatím nejsou žádní učitelé.</td>
                          </tr>
                        ) : (
                          teachers.map(t => {
                            const managedClasses = classrooms.filter(c => c.teacherId === t.id);
                            return (
                              <tr key={t.id} className="hover:bg-gray-50/50">
                                <td className="p-4 font-bold text-primary flex items-center gap-2">
                                  <GraduationCap className="w-4 h-4 text-accent" /> {t.name}
                                </td>
                                <td className="p-4 text-sm text-gray-600 font-mono">{t.username}</td>
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
                                  <h4 className="font-black text-xl text-gray-800">{c.name}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    Třídní učitel: <span className="font-bold text-gray-700">{classTeacher ? classTeacher.name : 'Nespecifikován'}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-sm font-bold text-gray-700">{classStudents.length} žáků</p>
                                  <p className="text-xs text-muted-foreground">{classAssignments.length} úkolů</p>
                                </div>
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
                                          <div key={a.id} className="p-3 flex justify-between items-center text-sm">
                                            <div className="space-y-0.5">
                                              <p className="font-bold text-gray-800">{a.title}</p>
                                              <p className="text-[10px] text-muted-foreground">Předmět: {a.subject || 'Obecný'}</p>
                                            </div>
                                            <Badge variant="outline" className="font-bold text-primary bg-primary/5">{subCount} odevzdání</Badge>
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
                  <div>
                    <h3 className="text-2xl font-headline font-bold text-gray-800">Seznam Žáků</h3>
                    <p className="text-muted-foreground text-sm">Přehled všech zapsaných žáků ve všech třídách platformy.</p>
                  </div>

                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="p-4 font-bold text-gray-700 text-sm">Celé jméno žáka</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Uživatelské jméno</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Přiřazená třída</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {students.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-muted-foreground">V systému zatím nejsou registrovaní žádní žáci.</td>
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
                                <td className="p-4">
                                  {classroom ? (
                                    <Badge variant="outline" className="font-bold text-green-600 bg-green-50 border-green-150">{classroom.name}</Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">Bez třídy</span>
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

              {adminTab === 'assignments' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-2xl font-headline font-bold text-gray-800">Všechny zadané práce</h3>
                    <p className="text-muted-foreground text-sm">Kompletní přehled všech digitálních úkolů a testů vytvořených učiteli.</p>
                  </div>

                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="p-4 font-bold text-gray-700 text-sm">Název úkolu</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Učitel (Tvůrce)</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Určeno pro třídu</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Počet otázek</th>
                          <th className="p-4 font-bold text-gray-700 text-sm">Odevzdání</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {assignments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-muted-foreground">V systému nebyly vytvořeny žádné úkoly.</td>
                          </tr>
                        ) : (
                          assignments.map(a => {
                            const creator = teachers.find(t => t.id === a.teacherId);
                            const classroom = classrooms.find(c => c.id === a.classId);
                            const subCount = submissions.filter(s => s.assignmentId === a.id).length;

                            return (
                              <tr key={a.id} className="hover:bg-gray-50/50">
                                <td className="p-4 font-bold text-gray-800 flex items-center gap-2">
                                  <ClipboardList className="w-4 h-4 text-amber-500" /> {a.title}
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                  {creator ? creator.name : <span className="text-xs text-muted-foreground italic">Legacy/Systém</span>}
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
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (currentUser.role === 'teacher') {
    const teacherClasses = store.classes.filter(c => c.teacherId === currentUser.id);
    const selectedClass = store.classes.find(c => c.id === selectedClassId);

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={currentUser} onLogout={() => store.logout()} />
        
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
                {selectedClass ? `${selectedClass.name}` : 'Nástěnka učitele'}
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
                        <h2 className="text-3xl font-headline font-bold text-primary">{a.title}</h2>
                        <p className="text-muted-foreground mt-2 text-lg">{a.description}</p>
                        
                        {a.questions && a.questions.length > 0 && (
                          <div className="mt-8">
                            <h3 className="font-semibold text-xl mb-4">Otázky v testu:</h3>
                            <div className="space-y-3">
                              {a.questions.map(q => (
                                <div key={q.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                                  <span className="font-medium">{q.text}</span>
                                  <Badge variant="outline">{q.type}</Badge>
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
                  <AssignmentCreator classId={selectedClassId!} onSave={(a) => {
                    store.addAssignment(a);
                    setIsCreatingAssignment(false);
                  }} />
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="flex justify-end">
                    <Button className="rounded-full shadow-md" onClick={() => setIsCreatingAssignment(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Vytvořit práci
                    </Button>
                  </div>
                  {store.assignments.filter(a => a.classId === selectedClassId && (a.teacherId === currentUser.id || !a.teacherId)).map(a => (
                    <Card key={a.id} className="hover:border-primary cursor-pointer transition-all border-none shadow-sm bg-white" onClick={() => setViewingAssignment(a.id)}>
                      <CardContent className="p-5 flex justify-between items-center">
                        <div className="flex items-center gap-5">
                          <ClipboardList className="w-6 h-6 text-primary" />
                          <h4 className="font-bold text-xl">{a.title}</h4>
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
                        <div key={student.id} className="py-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <GraduationCap className="w-5 h-5 text-accent" />
                            <p className="font-bold">{student.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground bg-gray-50 px-3 py-1 rounded-full border font-mono">Login: {student.username}</p>
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
                  <Button variant="ghost" className="rounded-full" onClick={() => setViewingSubmission(null)}>← Zpět</Button>
                  {(() => {
                    const sub = store.submissions.find(s => s.id === viewingSubmission);
                    const assignment = store.assignments.find(a => a.id === sub?.assignmentId);
                    const student = store.users.find(u => u.id === sub?.studentId);
                    if (!sub || !assignment || !student) return null;
                    return (
                      <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                        <CardHeader className="bg-white border-b p-8">
                           <CardTitle className="font-headline text-3xl text-primary">{assignment.title}</CardTitle>
                           <CardDescription>Odevzdal: {student.name}</CardDescription>
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
                                          <Badge variant="outline">{q.type === 'drawing' ? 'Kresba' : q.type.replace('_', ' ')}</Badge>
                                        </div>
                                        
                                        {q.type !== 'drawing' && (
                                          <div className="mt-2">
                                            <span className="text-sm font-medium text-muted-foreground mr-2">Odpověď:</span>
                                            {answer === undefined || answer === null || answer === '' ? (
                                              <span className="italic text-gray-400">Neodpovězeno</span>
                                            ) : q.type === 'multiple_choice' ? (
                                              <span className="font-bold">{String.fromCharCode(65 + Number(answer))}. {q.options?.[Number(answer)]}</span>
                                            ) : q.type === 'true_false' ? (
                                              <span className="font-bold">{answer ? '✓ Ano' : '✗ Ne'}</span>
                                            ) : (
                                              <span className="font-bold whitespace-pre-wrap">{String(answer)}</span>
                                            )}
                                          </div>
                                        )}

                                        {drawing && (
                                          <div className="mt-3">
                                            <span className="text-sm font-medium text-muted-foreground block mb-1">Přiložená kresba:</span>
                                            <img src={drawing} className="border rounded-xl max-w-full max-h-64 object-contain bg-white" />
                                          </div>
                                        )}
                                      </div>

                                      {/* Points Picker */}
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
                            
                            let suggestedGrade = 5;
                            if (pct >= 85) suggestedGrade = 1;
                            else if (pct >= 65) suggestedGrade = 2;
                            else if (pct >= 45) suggestedGrade = 3;
                            else if (pct >= 25) suggestedGrade = 4;

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

                          <div className="space-y-4 pt-4">
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
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              ) : (
                <div className="grid gap-4">
                  {store.submissions.filter(s => {
                    const a = store.assignments.find(as => as.id === s.assignmentId);
                    return a?.classId === selectedClassId;
                  }).map(s => {
                    const student = store.users.find(u => u.id === s.studentId);
                    const assignment = store.assignments.find(a => a.id === s.assignmentId);
                    
                    const totalMax = assignment?.questions?.reduce((acc, q) => acc + (q.points || 1), 0) || 0;
                    
                    let earned = 0;
                    if (s.questionScores) {
                      if (s.questionScores instanceof Map) {
                        s.questionScores.forEach(val => { earned += val; });
                      } else {
                        Object.values(s.questionScores).forEach(val => { earned += val as number; });
                      }
                    }
                    const pct = totalMax > 0 ? Math.round((earned / totalMax) * 100) : 0;

                    return (
                      <div key={s.id} onClick={() => setViewingSubmission(s.id)} className="p-6 bg-white shadow-sm rounded-2xl flex items-center justify-between hover:shadow-lg cursor-pointer transition-all">
                        <div>
                          <p className="font-bold text-lg">{student?.name}</p>
                          <p className="text-sm text-muted-foreground">{assignment?.title}</p>
                        </div>
                        <Badge variant={s.grade ? "default" : "secondary"}>
                          {s.grade ? `Známka: ${s.grade} (${earned} / ${totalMax} b - ${pct} %)` : 'Neopraveno'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
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
            <DialogContent aria-describedby={undefined}>
              <DialogHeader><DialogTitle>Zapsat žáka</DialogTitle></DialogHeader>
              
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
                  <Button onClick={handleAddStudent}>Vytvořit</Button>
                ) : studentActionType === 'select' ? (
                  <Button 
                    onClick={() => {
                      if (selectedExistingStudentId && targetClassId) {
                        store.assignStudent(selectedExistingStudentId, targetClassId);
                        setIsAddingStudent(false);
                        setSelectedExistingStudentId('');
                      }
                    }} 
                    disabled={!selectedExistingStudentId}
                  >Přiřadit žáka</Button>
                ) : (
                  <Button
                    onClick={handleImportCSVToExisting}
                    disabled={!csvFile || !!csvImportProgress}
                    className="w-full"
                  >
                    Importovat žáky z CSV
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    );
  }

  if (currentUser.role === 'student') {
    const studentAssignments = store.assignments.filter(a => a.classId === currentUser.classId);
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={currentUser} onLogout={() => store.logout()} />
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 animate-fade-in">
          {selectedAssignmentId ? (
            <div className="space-y-6">
              <Button variant="ghost" className="rounded-full" onClick={() => setSelectedAssignmentId(null)}>← Zpět</Button>
              {(() => {
                const a = store.assignments.find(as => as.id === selectedAssignmentId);
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
                                  
                                  const isCorrect = score === maxPoints;

                                  return (
                                    <div 
                                      key={q.id} 
                                      className={`p-5 rounded-2xl border transition-all ${
                                        isCorrect 
                                          ? 'bg-green-50/30 border-green-200' 
                                          : 'bg-red-50/30 border-red-200 shadow-sm'
                                      }`}
                                    >
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                          <Badge className={`font-bold ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {index + 1}
                                          </Badge>
                                          <p className="font-bold text-lg text-gray-800">{q.text}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          {!isCorrect && (
                                            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold text-xs uppercase px-2.5 py-0.5">
                                              Chyba
                                            </Badge>
                                          )}
                                          <Badge variant="outline" className={`font-bold border px-3 py-1 ${
                                            isCorrect 
                                              ? 'bg-green-100/50 text-green-800 border-green-300' 
                                              : 'bg-red-100/50 text-red-800 border-red-300'
                                          }`}>
                                            Body: {score} / {maxPoints} b
                                          </Badge>
                                        </div>
                                      </div>

                                      {/* Odpověď */}
                                      {q.type !== 'drawing' && (
                                        <div className="bg-white/80 p-3.5 rounded-xl border border-gray-100 space-y-1">
                                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Moje odpověď:</span>
                                          <div>
                                            {answer === undefined || answer === null || answer === '' ? (
                                              <span className="italic text-gray-400">Neodpovězeno</span>
                                            ) : q.type === 'multiple_choice' ? (
                                              <span className="font-semibold text-gray-800">
                                                {String.fromCharCode(65 + Number(answer))}. {q.options?.[Number(answer)]}
                                              </span>
                                            ) : q.type === 'true_false' ? (
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
                                    <Badge variant="secondary" className="text-[10px] uppercase">{q.type === 'drawing' ? 'Kresba' : q.type.replace('_', ' ')}</Badge>
                                  </div>

                                  {/* Textový vstup pro všechny typy kromě drawing */}
                                  {q.type === 'short_answer' && (
                                    <Input
                                      placeholder="Vaše odpověď..."
                                      value={studentAnswers[q.id] || ''}
                                      onChange={(e) => setStudentAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    />
                                  )}

                                  {q.type === 'long_answer' && (
                                    <Textarea
                                      placeholder="Vaše odpověď..."
                                      className="min-h-[100px]"
                                      value={studentAnswers[q.id] || ''}
                                      onChange={(e) => setStudentAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    />
                                  )}

                                  {q.type === 'multiple_choice' && q.options && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {q.options.map((opt, i) => (
                                        <button
                                          key={i}
                                          type="button"
                                          className={`p-3 rounded-lg border text-left transition-all ${
                                            studentAnswers[q.id] === i
                                              ? 'bg-primary text-white border-primary shadow-md'
                                              : 'bg-white hover:bg-gray-100'
                                          }`}
                                          onClick={() => setStudentAnswers(prev => ({ ...prev, [q.id]: i }))}
                                        >
                                          <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                                          {opt}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {q.type === 'true_false' && (
                                    <div className="flex gap-3">
                                      <button
                                        type="button"
                                        className={`flex-1 p-3 rounded-lg border text-center font-bold transition-all ${
                                          studentAnswers[q.id] === true
                                            ? 'bg-green-500 text-white border-green-500'
                                            : 'bg-white hover:bg-green-50'
                                        }`}
                                        onClick={() => setStudentAnswers(prev => ({ ...prev, [q.id]: true }))}
                                      >
                                        ✓ Ano
                                      </button>
                                      <button
                                        type="button"
                                        className={`flex-1 p-3 rounded-lg border text-center font-bold transition-all ${
                                          studentAnswers[q.id] === false
                                            ? 'bg-red-500 text-white border-red-500'
                                            : 'bg-white hover:bg-red-50'
                                        }`}
                                        onClick={() => setStudentAnswers(prev => ({ ...prev, [q.id]: false }))}
                                      >
                                        ✗ Ne
                                      </button>
                                    </div>
                                  )}

                                  {/* Kresba pro typ drawing — vždy otevřená */}
                                  {q.type === 'drawing' && (
                                    <DrawingPad
                                      compact
                                      onSave={(data) => setQuestionDrawings(prev => ({ ...prev, [q.id]: data }))}
                                    />
                                  )}

                                  {/* Toggle: Dokreslit perem (pro všechny typy kromě drawing) */}
                                  {q.type !== 'drawing' && (
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
                              <DrawingPad backgroundImage={a.fileUri} onSave={setMainWorkDrawing} />
                            </div>
                          ) : null}
                          <Button className="w-full h-14 text-xl shadow-lg" onClick={() => {
                            store.submitWork({ assignmentId: selectedAssignmentId, studentId: currentUser.id, answers: studentAnswers, questionDrawings, mainWorkDrawing });
                          }}>Odevzdat v cloudu</Button>
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
                      {pending.map(a => (
                        <Card 
                          key={a.id} 
                          className="cursor-pointer hover:shadow-md transition-all border-none bg-white shadow-sm overflow-hidden" 
                          onClick={() => setSelectedAssignmentId(a.id)}
                        >
                          <div className="h-1 bg-accent/30 w-full" />
                          <CardContent className="p-5 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-lg text-gray-800">{a.title}</p>
                              {a.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{a.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-full">Vypracovat úkol</span>
                              <ChevronRight className="w-5 h-5 text-gray-300" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
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
                            onClick={() => setSelectedAssignmentId(a.id)}
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
            <div className="space-y-10">
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
        </main>
      </div>
    );
  }

  return null;
}