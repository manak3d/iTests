"use client";

import { useState } from 'react';
import { useITestStore } from '@/hooks/use-itest-store';
import { Navbar } from '@/components/itest/Navbar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Users, ClipboardList, CheckCircle2, ChevronRight, GraduationCap, School, User, PenTool, Type, HelpCircle, FileText } from 'lucide-react';
import { AssignmentCreator } from '@/components/itest/AssignmentCreator';
import { DrawingPad } from '@/components/itest/DrawingPad';
import { GradePicker } from '@/components/itest/GradePicker';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { GRADES } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ITestApp() {
  const store = useITestStore();
  const { toast } = useToast();
  const [authView, setAuthView] = useState<'login' | 'dashboard'>('login');
  const [loginRole, setLoginRole] = useState<'teacher' | 'student'>('teacher');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [targetClassId, setTargetClassId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState('classes');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<string | null>(null);
  
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [questionDrawings, setQuestionDrawings] = useState<Record<string, string>>({});
  const [mainWorkDrawing, setMainWorkDrawing] = useState<string | undefined>();
  const [activeDrawingQuestion, setActiveDrawingQuestion] = useState<string | null>(null);

  if (!store.isLoaded) return <div className="h-svh flex items-center justify-center font-headline text-primary animate-pulse">Načítám iTest...</div>;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (store.login(loginRole, username, password)) {
      setAuthView('dashboard');
    } else {
      toast({
        title: "Přihlášení se nezdařilo",
        description: "Nesprávné uživatelské jméno nebo heslo.",
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

  const handleAddStudent = () => {
    if (newStudentName.trim() && newStudentUsername.trim() && newStudentPassword.trim() && targetClassId) {
      store.addStudent(targetClassId, newStudentName, newStudentUsername, newStudentPassword);
      setNewStudentName('');
      setNewStudentUsername('');
      setNewStudentPassword('');
      setIsAddingStudent(false);
      setTargetClassId(null);
      toast({ title: "Žák přidán", description: `${newStudentName} byl zapsán do třídy.` });
    }
  };

  if (authView === 'login') {
    return (
      <div className="min-h-screen bg-[#EFF3F7] flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden">
          <CardHeader className="text-center space-y-4 bg-primary text-white pb-8">
            <div className="bg-white/20 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg transform -rotate-6">
              <School className="text-white w-8 h-8" />
            </div>
            <div className="space-y-1">
              <CardTitle className="font-headline text-4xl">iTest</CardTitle>
              <CardDescription className="text-white/70">Moderní vzdělávání, jednoduše.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Uživatelské jméno</Label>
                  <Input 
                    placeholder="Uživatelské jméno" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)}
                    className="h-12 border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heslo</Label>
                  <Input 
                    type="password"
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 border-gray-200"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-headline shadow-lg">Vstoupit do iTestu</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentUser = store.currentUser!;

  if (currentUser.role === 'teacher') {
    const teacherClasses = store.classes.filter(c => c.teacherId === currentUser.id);
    const selectedClass = store.classes.find(c => c.id === selectedClassId);

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={currentUser} onLogout={() => { store.logout(); setAuthView('login'); }} />
        
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
                {selectedClass ? `${selectedClass.name}` : 'Nástěnka učitele'}
              </h1>
              <p className="text-muted-foreground">
                {selectedClass ? 'Správa úkolů a sledování pokroku žáků.' : 'Spravujte své třídy, žáky a digitální materiály.'}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedClassId && (
                <Button variant="outline" className="rounded-full" onClick={() => { setSelectedClassId(null); setActiveTab('classes'); }}>
                  Zpět na přehled tříd
                </Button>
              )}
              {activeTab === 'classes' && !selectedClassId && (
                <Dialog open={isAddingClass} onOpenChange={setIsAddingClass}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full shadow-md">
                      <Plus className="w-4 h-4 mr-2" /> Nová třída
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Vytvořit novou třídu</DialogTitle>
                      <DialogDescription>Zadejte název své nové třídy.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input 
                        placeholder="Např. Matematika 8.A" 
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingClass(false)}>Zrušit</Button>
                      <Button onClick={handleAddClass} disabled={!newClassName.trim()}>Vytvořit</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              {selectedClassId && activeTab === 'assignments' && !isCreatingAssignment && (
                <Button className="rounded-full shadow-md" onClick={() => setIsCreatingAssignment(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Vytvořit práci
                </Button>
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
                const classStudents = store.users.filter(u => u.classId === c.id);
                return (
                  <Card 
                    key={c.id} 
                    className={`cursor-pointer transition-all hover:shadow-xl group overflow-hidden border-none ${selectedClassId === c.id ? 'ring-2 ring-primary bg-primary/5 shadow-inner' : 'bg-white'}`} 
                    onClick={() => { 
                      setSelectedClassId(c.id); 
                      setActiveTab('assignments');
                    }}
                  >
                    <div className="h-2 bg-accent/20 w-full" />
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors">{c.name}</CardTitle>
                      <Users className="w-6 h-6 text-accent opacity-40" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                          {classStudents.length} {classStudents.length === 1 ? 'Žák' : (classStudents.length > 1 && classStudents.length < 5 ? 'Žáci' : 'Žáků')}
                        </Badge>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary rounded-full" onClick={(e) => {
                          e.stopPropagation();
                          setTargetClassId(c.id);
                          setIsAddingStudent(true);
                        }}>Přidat žáka</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Dialog open={isAddingStudent} onOpenChange={setIsAddingStudent}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Zapsat žáka do třídy</DialogTitle>
                    <DialogDescription>Vytvořte nový žákovský účet.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Celé jméno žáka</Label>
                      <Input placeholder="Např. Jan Novák" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Uživatelské jméno</Label>
                      <Input placeholder="Např. jan.novak" value={newStudentUsername} onChange={(e) => setNewStudentUsername(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Heslo</Label>
                      <Input type="password" placeholder="••••••••" value={newStudentPassword} onChange={(e) => setNewStudentPassword(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingStudent(false)}>Zrušit</Button>
                    <Button onClick={handleAddStudent} disabled={!newStudentName.trim() || !newStudentUsername.trim() || !newStudentPassword.trim()}>Přidat</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="assignments">
              {isCreatingAssignment ? (
                <div className="space-y-4">
                  <Button variant="ghost" className="rounded-full" onClick={() => setIsCreatingAssignment(false)}>← Zpět na seznam prací</Button>
                  <AssignmentCreator classId={selectedClassId!} onSave={(a) => {
                    store.addAssignment(a);
                    setIsCreatingAssignment(false);
                    toast({ title: "Práce publikována", description: "Žáci ji uvidí na své nástěnce." });
                  }} />
                </div>
              ) : (
                <div className="grid gap-4">
                  {store.assignments.filter(a => a.classId === selectedClassId).map(a => (
                    <Card key={a.id} className="hover:border-primary transition-all border-none shadow-sm group">
                      <CardContent className="p-5 flex justify-between items-center">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <ClipboardList className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xl">{a.title}</h4>
                            <p className="text-sm text-muted-foreground">Odevzdat do: {new Date(a.dueDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {a.fileUri && <Badge variant="secondary" className="bg-accent/10 text-accent gap-1"><FileText className="w-3 h-3"/> S dokumentem</Badge>}
                          <Badge variant="outline" className="rounded-full">{a.questions.length} Úkolů</Badge>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="students">
               <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                 <CardHeader className="bg-primary/5">
                   <CardTitle className="text-2xl font-headline text-primary">Žáci ve třídě</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8">
                   <div className="divide-y divide-gray-50">
                     {store.users.filter(u => u.classId === selectedClassId).map(student => (
                       <div key={student.id} className="py-5 flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                             <GraduationCap className="w-6 h-6" />
                           </div>
                           <div>
                             <p className="font-bold text-lg">{student.name}</p>
                             <p className="text-xs text-muted-foreground">ID: {student.username}</p>
                           </div>
                         </div>
                         <Button variant="outline" size="sm" className="rounded-full text-xs">Výsledky</Button>
                       </div>
                     ))}
                   </div>
                 </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="submissions">
              {viewingSubmission ? (
                <div className="space-y-6">
                  <Button variant="ghost" className="rounded-full" onClick={() => setViewingSubmission(null)}>← Zpět na seznam odevzdání</Button>
                  {(() => {
                    const sub = store.submissions.find(s => s.id === viewingSubmission);
                    const assignment = store.assignments.find(a => a.id === sub?.assignmentId);
                    const student = store.users.find(u => u.id === sub?.studentId);
                    if (!sub || !assignment || !student) return null;
                    return (
                      <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                        <CardHeader className="bg-white border-b p-8">
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="font-headline text-3xl text-primary">{assignment.title}</CardTitle>
                              <CardDescription className="text-lg">Práce žáka: <span className="font-bold text-foreground">{student.name}</span></CardDescription>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="px-4 py-1 rounded-full bg-primary/10 text-primary">Odevzdáno</Badge>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(sub.submittedAt).toLocaleString()}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-12">
                          {sub.mainWorkDrawing && (
                            <div className="space-y-4">
                              <h3 className="font-bold text-xl text-primary flex items-center gap-2"><FileText className="w-5 h-5"/> Vypracovaný dokument</h3>
                              <div className="border-4 border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                <img src={sub.mainWorkDrawing} alt="Vypracovaný dokument" className="w-full h-auto" />
                              </div>
                            </div>
                          )}

                          {assignment.questions.map((q, idx) => (
                            <div key={q.id} className="space-y-4 p-6 bg-gray-50 rounded-2xl border">
                              <h6 className="font-bold text-lg flex gap-3">
                                <span className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">{idx + 1}</span>
                                <span>{q.text}</span>
                              </h6>
                              <div className="ml-11 space-y-4">
                                {sub.answers[q.id] !== undefined && (
                                  <div className="bg-white p-4 rounded-xl shadow-sm">
                                    <span className="text-[10px] font-bold text-primary uppercase block mb-2">Textová odpověď:</span>
                                    <div className="text-lg font-medium">
                                      {typeof sub.answers[q.id] === 'boolean' 
                                        ? (sub.answers[q.id] ? 'Ano / Pravda' : 'Ne / Nepravda') 
                                        : (q.type === 'multiple_choice' ? q.options?.[sub.answers[q.id]] : sub.answers[q.id])
                                      }
                                    </div>
                                  </div>
                                )}
                                {sub.questionDrawings?.[q.id] && (
                                  <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-primary/5">
                                    <span className="text-[10px] font-bold text-primary uppercase block mb-2 flex items-center gap-1">
                                      <PenTool className="w-3 h-3" /> Grafická odpověď / Náčrt:
                                    </span>
                                    <img src={sub.questionDrawings[q.id]} alt="Náčrt žáka" className="w-full max-h-[300px] object-contain rounded-lg bg-gray-50" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          <div className="pt-8 border-t space-y-8">
                            <div className="space-y-4 text-center">
                              <label className="text-sm font-bold text-primary uppercase">Vyberte známku</label>
                              <GradePicker selected={sub.grade} onSelect={(v) => store.gradeSubmission(sub.id, v, sub.feedback || '')} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-sm font-bold text-primary uppercase">Slovní hodnocení</label>
                              <Textarea 
                                placeholder="Napište zpětnou vazbu..." 
                                value={sub.feedback || ''}
                                onChange={(e) => store.gradeSubmission(sub.id, sub.grade || 0, e.target.value)}
                                className="min-h-[120px] bg-white rounded-2xl"
                              />
                            </div>
                            <div className="flex justify-center">
                              <Button className="px-20 h-14 text-xl rounded-full shadow-xl" onClick={() => setViewingSubmission(null)}>Uložit a zavřít</Button>
                            </div>
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
                    return (
                      <div key={s.id} onClick={() => setViewingSubmission(s.id)} className="p-6 bg-white shadow-sm rounded-2xl flex items-center justify-between hover:shadow-lg cursor-pointer transition-all">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                            <GraduationCap className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="font-bold text-xl">{student?.name}</p>
                            <p className="text-sm text-muted-foreground">{assignment?.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          {s.grade ? (
                            <Badge className="bg-primary text-white text-lg px-4 py-1">Známka: {s.grade}</Badge>
                          ) : (
                            <Badge className="bg-yellow-400 text-yellow-900 border-none animate-pulse">K opravě</Badge>
                          )}
                          <ChevronRight className="w-6 h-6 text-gray-200" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  if (currentUser.role === 'student') {
    const studentAssignments = store.assignments.filter(a => a.classId === currentUser.classId);
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={currentUser} onLogout={() => { store.logout(); setAuthView('login'); }} />
        
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-8">
          {selectedAssignmentId ? (
            <div className="space-y-6">
              <Button variant="ghost" className="rounded-full" onClick={() => { setSelectedAssignmentId(null); setAnswers({}); setQuestionDrawings({}); setMainWorkDrawing(undefined); }}>← Zpět na seznam</Button>
              {(() => {
                const assignment = store.assignments.find(a => a.id === selectedAssignmentId);
                const submission = store.submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === currentUser.id);
                if (!assignment) return null;
                
                return (
                  <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-primary text-white p-8 md:p-12 text-center">
                      <CardTitle className="font-headline text-4xl">{assignment.title}</CardTitle>
                      <CardDescription className="text-white/80 text-lg mt-2">{assignment.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 md:p-12 space-y-12 bg-white">
                      {submission ? (
                        <div className="text-center py-12 space-y-8">
                          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
                          <h3 className="text-3xl font-headline font-bold">Odevzdáno!</h3>
                          {submission.grade && (
                            <div className="p-8 bg-primary/5 rounded-3xl border max-w-lg mx-auto">
                              <p className="text-sm font-bold text-primary uppercase mb-4">Tvé hodnocení</p>
                              <div className="flex items-center justify-center gap-6">
                                <span className="text-6xl">{GRADES.find(g => g.value === submission.grade)?.emoji}</span>
                                <div className="text-left">
                                  <span className="text-5xl font-black text-primary">{submission.grade}</span>
                                  <p className="text-muted-foreground font-medium">{GRADES.find(g => g.value === submission.grade)?.label}</p>
                                </div>
                              </div>
                              {submission.feedback && (
                                <p className="mt-6 pt-6 border-t italic text-gray-700 leading-relaxed">"{submission.feedback}"</p>
                              )}
                            </div>
                          )}
                          <Button onClick={() => setSelectedAssignmentId(null)} className="px-12 h-12 rounded-full">Zpět</Button>
                        </div>
                      ) : (
                        <div className="space-y-12">
                          {assignment.fileUri && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xl font-headline font-bold text-primary flex items-center gap-2"><PenTool className="w-5 h-5"/> Vypracuj do dokumentu</h4>
                                <Badge variant="secondary" className="rounded-full">Lze psát perem/prstem</Badge>
                              </div>
                              <DrawingPad 
                                backgroundImage={assignment.fileUri} 
                                onSave={(data) => setMainWorkDrawing(data)} 
                              />
                            </div>
                          )}

                          <div className="space-y-8">
                            <h4 className="text-xl font-headline font-bold text-primary border-b pb-2">Kontrolní otázky</h4>
                            {assignment.questions.map((q, idx) => (
                              <div key={q.id} className="space-y-5">
                                <h5 className="font-bold text-2xl flex gap-4">
                                  <span className="bg-accent/10 text-accent w-10 h-10 rounded-xl flex items-center justify-center font-black">{idx + 1}</span>
                                  <span className="pt-1">{q.text}</span>
                                </h5>
                                
                                <div className="ml-14 space-y-4">
                                  {(q.type === 'short_answer' || q.type === 'long_answer') && (
                                    <div className="space-y-3">
                                      {q.type === 'short_answer' ? (
                                        <Input 
                                          placeholder="Tvá odpověď..." 
                                          className="h-14 text-lg rounded-xl"
                                          onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} 
                                        />
                                      ) : (
                                        <Textarea 
                                          placeholder="Tvá odpověď..." 
                                          className="min-h-[140px] text-lg rounded-xl"
                                          onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} 
                                        />
                                      )}
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-accent flex items-center gap-2 hover:bg-accent/5 rounded-full"
                                        onClick={() => setActiveDrawingQuestion(activeDrawingQuestion === q.id ? null : q.id)}
                                      >
                                        <PenTool className="w-4 h-4" /> 
                                        {activeDrawingQuestion === q.id ? 'Zavřít kreslení' : 'Odpovědět perem / doplnit náčrt'}
                                      </Button>
                                    </div>
                                  )}

                                  {q.type === 'multiple_choice' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {q.options?.map((opt, i) => (
                                        <button 
                                          key={i} 
                                          className={`p-5 rounded-2xl border-2 text-left transition-all ${answers[q.id] === i ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 bg-gray-50/30'}`}
                                          onClick={() => setAnswers({ ...answers, [q.id]: i })}
                                        >
                                          <span className="font-bold text-primary mr-3">{String.fromCharCode(65 + i)}</span>
                                          <span className="font-medium text-lg">{opt}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {q.type === 'true_false' && (
                                    <div className="flex gap-4 max-w-md">
                                      <Button 
                                        variant={answers[q.id] === true ? 'default' : 'outline'} 
                                        className="flex-1 h-14 rounded-xl"
                                        onClick={() => setAnswers({ ...answers, [q.id]: true })}
                                      >Ano / Pravda</Button>
                                      <Button 
                                        variant={answers[q.id] === false ? 'default' : 'outline'} 
                                        className="flex-1 h-14 rounded-xl"
                                        onClick={() => setAnswers({ ...answers, [q.id]: false })}
                                      >Ne / Nepravda</Button>
                                    </div>
                                  )}

                                  {(q.type === 'drawing' || activeDrawingQuestion === q.id) && (
                                    <div className="pt-2 animate-fade-in">
                                      <DrawingPad onSave={(data) => setQuestionDrawings({ ...questionDrawings, [q.id]: data })} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-12 flex justify-center border-t">
                            <Button className="px-24 h-16 text-2xl font-headline rounded-full shadow-2xl" onClick={() => {
                              store.submitWork({
                                assignmentId: selectedAssignmentId!,
                                studentId: currentUser.id,
                                answers,
                                questionDrawings,
                                mainWorkDrawing,
                              });
                              toast({ title: "Odesláno!", description: "Práce byla doručena učiteli." });
                            }}>
                              Odevzdat moji práci
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-8">
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Moje práce</h1>
              <div className="grid gap-6">
                {studentAssignments.map(a => {
                  const submission = store.submissions.find(s => s.assignmentId === a.id && s.studentId === currentUser.id);
                  return (
                    <Card key={a.id} className="cursor-pointer hover:shadow-xl transition-all border-none overflow-hidden" onClick={() => setSelectedAssignmentId(a.id)}>
                      <CardContent className="p-0 flex flex-col md:flex-row items-stretch">
                        <div className={`w-full md:w-20 flex items-center justify-center text-white p-6 ${submission ? 'bg-green-500' : 'bg-primary'}`}>
                          {submission ? <CheckCircle2 className="w-8 h-8" /> : <ClipboardList className="w-8 h-8" />}
                        </div>
                        <div className="p-8 flex-1 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div>
                            <h4 className="text-2xl font-headline font-bold">{a.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">{a.description}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            {submission ? (
                              <Badge className="bg-green-50 text-green-700 border-none font-bold">Odevzdáno</Badge>
                            ) : (
                              <Badge className="bg-accent text-white px-4 py-1.5 animate-pulse">Čeká na tebe</Badge>
                            )}
                            <ChevronRight className="w-8 h-8 text-gray-200" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return null;
}
