"use client";

import { useState, useEffect } from 'react';
import { useITestStore } from '@/hooks/use-itest-store';
import { Navbar } from '@/components/itest/Navbar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Users, ClipboardList, CheckCircle2, ChevronRight, GraduationCap, School, Loader2, BookOpen, PenTool, Trash2 } from 'lucide-react';
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
  const [loginRole, setLoginRole] = useState<'teacher' | 'student'>('teacher');
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

  const [studentActionType, setStudentActionType] = useState<'create' | 'select'>('create');
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState('');

  const [classSearch, setClassSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  
  const [activeTab, setActiveTab] = useState('classes');
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

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentUsername.trim() || !newStudentPassword.trim()) {
      toast({ title: "Chyba", description: "Musíte vyplnit všechna pole (jméno, login i heslo).", variant: "destructive" });
      return;
    }
    
    if (targetClassId) {
      // 1. Uložení do Firebase (původní)
      store.addStudent(targetClassId, newStudentName, newStudentUsername, newStudentPassword);
      
      // 2. Uložení do MongoDB
      try {
        const nameParts = newStudentName.split(' ');
        const firstName = nameParts[0] || 'Neznámé';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Neznámé';

        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName,
            lastName,
            username: newStudentUsername,
            password: newStudentPassword,
            classroomId: targetClassId // Pozn.: Musí se shodovat s formátem ObjectID v MongoDB!
          })
        });
      } catch (error) {
        console.error("Chyba při zápisu žáka do MongoDB:", error);
      }

      setNewStudentName('');
      setNewStudentUsername('');
      setNewStudentPassword('');
      setIsAddingStudent(false);
      setTargetClassId(null);
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
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                  <button 
                    type="button" 
                    className={`py-2 text-sm font-medium rounded-md transition-all ${loginRole === 'teacher' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
                    onClick={() => setLoginRole('teacher')}
                  >Učitel</button>
                  <button 
                    type="button" 
                    className={`py-2 text-sm font-medium rounded-md transition-all ${loginRole === 'student' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
                    onClick={() => setLoginRole('student')}
                  >Student</button>
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
                  {store.assignments.filter(a => a.classId === selectedClassId).map(a => (
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

            <TabsContent value="students">
               <Card className="border-none shadow-xl rounded-3xl">
                 <CardContent className="p-8">
                   <div className="divide-y">
                     {store.users.filter(u => u.classId === selectedClassId).map(student => (
                       <div key={student.id} className="py-5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                           <GraduationCap className="w-5 h-5 text-accent" />
                           <p className="font-bold">{student.name}</p>
                         </div>
                         <p className="text-xs text-muted-foreground">Login: {student.username}</p>
                       </div>
                     ))}
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
            }
          }}>
            <DialogContent aria-describedby={undefined}>
              <DialogHeader><DialogTitle>Zapsat žáka</DialogTitle></DialogHeader>
              
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg mb-4">
                <button 
                  type="button" 
                  className={`py-2 text-sm font-medium rounded-md transition-all ${studentActionType === 'create' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500'}`}
                  onClick={() => setStudentActionType('create')}
                >Vytvořit nového</button>
                <button 
                  type="button" 
                  className={`py-2 text-sm font-medium rounded-md transition-all ${studentActionType === 'select' ? 'bg-white shadow text-primary font-bold' : 'text-gray-500'}`}
                  onClick={() => setStudentActionType('select')}
                >Vybrat existujícího</button>
              </div>

              {studentActionType === 'create' ? (
                <div className="space-y-4 py-4">
                  <Input placeholder="Jméno žáka" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                  <Input placeholder="Login" value={newStudentUsername} onChange={(e) => setNewStudentUsername(e.target.value)} />
                  <Input type="password" placeholder="Heslo" value={newStudentPassword} onChange={(e) => setNewStudentPassword(e.target.value)} />
                </div>
              ) : (
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
              )}

              <DialogFooter>
                {studentActionType === 'create' ? (
                  <Button onClick={handleAddStudent}>Vytvořit</Button>
                ) : (
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
                        <div className="text-center py-12 space-y-4">
                          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                          <h3 className="text-2xl font-bold">Odevzdáno</h3>
                          {submission.grade && (() => {
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
                              <div className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/20 mt-4 text-center">
                                <div className="text-4xl font-black text-primary">Známka: {submission.grade}</div>
                                <div className="text-lg font-bold text-muted-foreground mt-1">Celkové body: {earned} / {totalMax} ({pct} %)</div>
                                {submission.feedback && <p className="mt-4 text-muted-foreground italic">"{submission.feedback}"</p>}
                              </div>
                            );
                          })()}
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
          ) : (
            <div className="space-y-10">
              {/* Sekce 1: Předměty a vyplněné testy */}
              <div className="space-y-6">
                <h2 className="text-3xl font-headline font-bold text-primary flex items-center gap-2 border-b pb-3">
                  <BookOpen className="w-8 h-8 text-accent" /> Moje předměty a vyplněné testy
                </h2>
                {(() => {
                  // Získáme pouze odevzdané úkoly
                  const submittedAssignments = studentAssignments.filter(a =>
                    store.submissions.some(s => s.assignmentId === a.id && s.studentId === currentUser.id)
                  );

                  if (submittedAssignments.length === 0) {
                    return (
                      <Card className="border-none shadow-sm bg-white p-6 text-center text-muted-foreground">
                        Zatím jsi nevyplnil žádné testy.
                      </Card>
                    );
                  }

                  // Seskupíme odevzdané úkoly podle předmětu
                  const grouped = submittedAssignments.reduce<Record<string, typeof submittedAssignments>>((acc, a) => {
                    const subject = a.subject || 'Jiný';
                    if (!acc[subject]) acc[subject] = [];
                    acc[subject].push(a);
                    return acc;
                  }, {});

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(grouped).map(([subjectName, list]) => (
                        <Card key={subjectName} className="border-none shadow-md overflow-hidden bg-white">
                          <CardHeader className="bg-primary/5 border-b pb-4 flex flex-row items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <CardTitle className="font-headline text-xl text-primary font-bold">{subjectName}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 divide-y">
                            {list.map(a => {
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
                                <div 
                                  key={a.id} 
                                  onClick={() => setSelectedAssignmentId(a.id)}
                                  className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg cursor-pointer transition-colors"
                                >
                                  <div className="space-y-1">
                                    <p className="font-bold text-base text-gray-800">{a.title}</p>
                                    <div className="flex gap-2">
                                      <Badge variant={sub.grade ? "default" : "secondary"} className="text-xs">
                                        {badgeText}
                                      </Badge>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-gray-300" />
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Sekce 2: Zadané úkoly k vypracování (To Do) */}
              <div className="space-y-6">
                <h2 className="text-3xl font-headline font-bold text-primary flex items-center gap-2 border-b pb-3">
                  <ClipboardList className="w-8 h-8 text-accent" /> Zadané úkoly k vypracování
                </h2>
                {(() => {
                  const pendingAssignments = studentAssignments.filter(a =>
                    !store.submissions.some(s => s.assignmentId === a.id && s.studentId === currentUser.id)
                  );

                  if (pendingAssignments.length === 0) {
                    return (
                      <Card className="border-none shadow-md bg-white p-8 text-center space-y-3">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto animate-bounce" />
                        <h3 className="text-xl font-bold text-gray-800">Skvělé! Všechny úkoly máš hotové.</h3>
                        <p className="text-muted-foreground">Užívej si volný čas nebo si zopakuj probrané učivo.</p>
                      </Card>
                    );
                  }

                  return (
                    <div className="grid gap-4">
                      {pendingAssignments.map(a => (
                        <Card 
                          key={a.id} 
                          className="cursor-pointer hover:shadow-lg transition-all border-none bg-white shadow-sm overflow-hidden" 
                          onClick={() => setSelectedAssignmentId(a.id)}
                        >
                          <div className="h-1 bg-accent/30 w-full" />
                          <CardContent className="p-6 flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-accent/20 text-accent hover:bg-accent/30 border-none font-bold text-xs uppercase px-2 py-0.5">
                                  {a.subject || 'Jiný'}
                                </Badge>
                              </div>
                              <p className="font-bold text-xl text-gray-800">{a.title}</p>
                              {a.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{a.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-full">Vypracovat úkol</span>
                              <ChevronRight className="w-6 h-6 text-gray-300" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
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