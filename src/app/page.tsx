"use client";

import { useState } from 'react';
import { useITestStore } from '@/hooks/use-itest-store';
import { Navbar } from '@/components/itest/Navbar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Users, ClipboardList, CheckCircle2, ChevronRight, GraduationCap, School, User, PenTool } from 'lucide-react';
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
  
  // UI state for creation dialogs
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [targetClassId, setTargetClassId] = useState<string | null>(null);
  
  // Teacher UI state
  const [activeTab, setActiveTab] = useState('classes');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<string | null>(null);
  
  // Student UI state
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [sketch, setSketch] = useState<string>('');

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
                <p className="text-[10px] text-muted-foreground px-1 italic">Demo Učitel: smith / password</p>
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-headline shadow-lg">Vstoupit do iTestu</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentUser = store.currentUser!;

  // TEACHER DASHBOARD
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
                      <DialogDescription>Zadejte název své nové třídy. Žáky budete moci přidat později.</DialogDescription>
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
              <TabsTrigger value="classes" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all px-6">Třídy</TabsTrigger>
              <TabsTrigger value="assignments" disabled={!selectedClassId} className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all px-6">Zadané práce</TabsTrigger>
              <TabsTrigger value="students" disabled={!selectedClassId} className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all px-6">Žáci</TabsTrigger>
              <TabsTrigger value="submissions" disabled={!selectedClassId} className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all px-6">Odevzdané práce</TabsTrigger>
            </TabsList>

            <TabsContent value="classes" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacherClasses.length === 0 ? (
                <div className="col-span-full py-20 text-center space-y-4 bg-white/50 rounded-2xl border-2 border-dashed">
                  <School className="w-16 h-16 text-muted-foreground mx-auto opacity-10" />
                  <p className="text-muted-foreground font-medium">Zatím nemáte žádné třídy. Začněte vytvořením první.</p>
                </div>
              ) : (
                teacherClasses.map(c => (
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
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none">{c.studentIds.length} Žáků</Badge>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary rounded-full" onClick={(e) => {
                          e.stopPropagation();
                          setTargetClassId(c.id);
                          setIsAddingStudent(true);
                        }}>Přidat žáka</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              <Dialog open={isAddingStudent} onOpenChange={setIsAddingStudent}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Zapsat žáka do třídy</DialogTitle>
                    <DialogDescription>Vytvořte nový žákovský účet pro tuto třídu.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Celé jméno žáka</Label>
                      <Input 
                        placeholder="Např. Jan Novák" 
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Uživatelské jméno (pro přihlášení)</Label>
                      <Input 
                        placeholder="Např. jan.novak" 
                        value={newStudentUsername}
                        onChange={(e) => setNewStudentUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Heslo</Label>
                      <Input 
                        type="password"
                        placeholder="••••••••" 
                        value={newStudentPassword}
                        onChange={(e) => setNewStudentPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingStudent(false)}>Zrušit</Button>
                    <Button 
                      onClick={handleAddStudent} 
                      disabled={!newStudentName.trim() || !newStudentUsername.trim() || !newStudentPassword.trim()}
                    >
                      Přidat do třídy
                    </Button>
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
                    toast({ title: "Práce publikována", description: "Všichni žáci ve třídě ji nyní uvidí." });
                  }} />
                </div>
              ) : (
                <div className="grid gap-4">
                  {store.assignments.filter(a => a.classId === selectedClassId).map(a => (
                    <Card key={a.id} className="hover:border-primary transition-all border-none shadow-sm hover:shadow-md group">
                      <CardContent className="p-5 flex justify-between items-center">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <ClipboardList className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xl group-hover:text-primary transition-colors">{a.title}</h4>
                            <p className="text-sm text-muted-foreground">Odevzdat do: {new Date(a.dueDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="rounded-full">{a.questions.length} Úkolů</Badge>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {store.assignments.filter(a => a.classId === selectedClassId).length === 0 && (
                     <div className="text-center py-24 bg-white/50 border-2 border-dashed rounded-3xl">
                       <p className="text-muted-foreground text-lg">V této třídě zatím nejsou žádné práce.</p>
                       <Button variant="link" onClick={() => setIsCreatingAssignment(true)} className="mt-4 text-primary font-bold">Vytvořte svou první digitální prověrku</Button>
                     </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="students">
               <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                 <CardHeader className="bg-primary/5">
                   <CardTitle className="text-2xl font-headline text-primary">Žáci ve třídě</CardTitle>
                   <CardDescription>Seznam všech studentů zapsaných v {selectedClass?.name}.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-8">
                   <div className="divide-y divide-gray-50">
                     {store.users.filter(u => u.classId === selectedClassId).map(student => (
                       <div key={student.id} className="py-5 flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                             <GraduationCap className="w-6 h-6" />
                           </div>
                           <div>
                             <p className="font-bold text-lg">{student.name}</p>
                             <p className="text-xs text-muted-foreground">ID: {student.username}</p>
                           </div>
                         </div>
                         <Button variant="outline" size="sm" className="rounded-full text-xs">Zobrazit výsledky</Button>
                       </div>
                     ))}
                     {store.users.filter(u => u.classId === selectedClassId).length === 0 && (
                        <p className="text-center py-16 text-muted-foreground italic text-lg opacity-50">Třída je zatím prázdná.</p>
                     )}
                   </div>
                   <Button className="w-full mt-8 rounded-2xl h-14 border-dashed" variant="outline" onClick={() => { setTargetClassId(selectedClassId); setIsAddingStudent(true); }}>
                     <Plus className="w-4 h-4 mr-2" /> Přidat další žáky
                   </Button>
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
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <CardTitle className="font-headline text-3xl text-primary">{assignment.title}</CardTitle>
                              <CardDescription className="text-lg">Práce žáka: <span className="font-bold text-foreground">{student.name}</span></CardDescription>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="mb-2 px-4 py-1 rounded-full bg-primary/10 text-primary border-none">Odevzdáno</Badge>
                              <p className="text-xs text-muted-foreground">{new Date(sub.submittedAt).toLocaleString('cs-CZ')}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-8 md:p-12 space-y-12 bg-white">
                          <div className="space-y-4">
                            <h5 className="font-headline text-2xl text-primary border-b pb-2">Odpovědi na otázky</h5>
                            {assignment.questions.map((q, idx) => (
                              <div key={q.id} className="space-y-3 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <h6 className="font-bold text-lg flex gap-3 items-start">
                                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-sm">{idx + 1}</span>
                                  <span>{q.text}</span>
                                </h6>
                                <div className="ml-11">
                                  <span className="text-[10px] font-bold text-primary/60 uppercase block mb-2">Odpověď žáka:</span>
                                  <div className="text-lg text-gray-800 leading-relaxed font-medium">
                                    {typeof sub.answers[q.id] === 'boolean' 
                                      ? (sub.answers[q.id] ? <Badge className="bg-green-500">Ano / Pravda</Badge> : <Badge variant="destructive">Ne / Nepravda</Badge>) 
                                      : (sub.answers[q.id] || <span className="text-muted-foreground italic">Bez odpovědi</span>)
                                    }
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {sub.drawings?.[0] && (
                            <div className="space-y-4">
                              <h5 className="font-headline text-2xl text-primary border-b pb-2 flex items-center gap-2">
                                <PenTool className="w-6 h-6" /> Kresba a grafické vysvětlení
                              </h5>
                              <div className="p-2 border-4 border-gray-100 rounded-3xl bg-gray-50 shadow-inner overflow-hidden">
                                <img src={sub.drawings[0]} alt="Náčrt žáka" className="w-full h-auto rounded-2xl" />
                              </div>
                            </div>
                          )}

                          <div className="pt-12 border-t space-y-8 bg-primary/5 -mx-8 -mb-8 p-8 md:p-12 rounded-b-3xl">
                            <h5 className="font-headline text-3xl text-primary text-center">Hodnocení a zpětná vazba</h5>
                            
                            <div className="space-y-4">
                              <label className="text-sm font-bold text-primary uppercase tracking-widest text-center block">Vyberte známku</label>
                              <GradePicker 
                                selected={sub.grade} 
                                onSelect={(v) => store.gradeSubmission(sub.id, v, sub.feedback || '')} 
                              />
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-bold text-primary uppercase tracking-widest block">Slovní komentář učitele</label>
                              <Textarea 
                                placeholder="Skvělá práce! Velmi dobře jsi vystihl hlavní myšlenku..." 
                                value={sub.feedback || ''}
                                onChange={(e) => store.gradeSubmission(sub.id, sub.grade || 0, e.target.value)}
                                className="min-h-[120px] bg-white text-lg rounded-2xl shadow-sm border-none"
                              />
                            </div>
                            
                            <div className="flex justify-center pt-4">
                              <Button className="px-20 h-14 text-xl rounded-full shadow-xl" onClick={() => {
                                setViewingSubmission(null);
                                toast({ title: "Hodnocení uloženo", description: "Žák uvidí svůj výsledek okamžitě." });
                              }}>Uložit hodnocení</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="grid gap-4">
                    {store.submissions.filter(s => {
                      const a = store.assignments.find(as => as.id === s.assignmentId);
                      return a?.classId === selectedClassId;
                    }).map(s => {
                      const student = store.users.find(u => u.id === s.studentId);
                      const assignment = store.assignments.find(a => a.id === s.assignmentId);
                      return (
                        <div key={s.id} onClick={() => setViewingSubmission(s.id)} className="p-6 bg-white border-none shadow-sm rounded-2xl flex items-center justify-between hover:shadow-lg hover:scale-[1.01] cursor-pointer transition-all group">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                              <GraduationCap className="w-8 h-8" />
                            </div>
                            <div>
                              <p className="font-bold text-xl group-hover:text-primary transition-colors">{student?.name}</p>
                              <p className="text-sm text-muted-foreground font-medium">{assignment?.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            {s.grade ? (
                              <div className="text-center px-6 border-l border-gray-100 flex items-center gap-3">
                                <span className="text-4xl">{GRADES.find(g => g.value === s.grade)?.emoji}</span>
                                <div className="text-left">
                                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Známka</p>
                                  <p className="text-2xl font-black text-primary">{s.grade}</p>
                                </div>
                              </div>
                            ) : (
                              <Badge className="bg-yellow-400 text-yellow-900 border-none px-4 py-1 font-bold animate-pulse">K opravě</Badge>
                            )}
                            <ChevronRight className="w-6 h-6 text-gray-200 group-hover:text-primary" />
                          </div>
                        </div>
                      );
                    })}
                    {store.submissions.filter(s => {
                      const a = store.assignments.find(as => as.id === s.assignmentId);
                      return a?.classId === selectedClassId;
                    }).length === 0 && (
                      <div className="text-center py-24 bg-white/50 border-2 border-dashed rounded-3xl">
                        <p className="text-muted-foreground italic text-lg">Zatím žádné odevzdané práce k ohodnocení.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  // STUDENT DASHBOARD
  if (currentUser.role === 'student') {
    const studentAssignments = store.assignments.filter(a => a.classId === currentUser.classId);
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={currentUser} onLogout={() => { store.logout(); setAuthView('login'); }} />
        
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-8">
          {selectedAssignmentId ? (
            <div className="space-y-6">
              <Button variant="ghost" className="rounded-full" onClick={() => setSelectedAssignmentId(null)}>← Zpět na seznam prací</Button>
              {(() => {
                const assignment = store.assignments.find(a => a.id === selectedAssignmentId);
                const submission = store.submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === currentUser.id);
                if (!assignment) return null;
                
                return (
                  <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-primary text-white p-8 md:p-12 text-center space-y-4">
                      <CardTitle className="font-headline text-4xl">{assignment.title}</CardTitle>
                      <CardDescription className="text-white/80 text-lg max-w-2xl mx-auto">{assignment.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 md:p-12 space-y-12 bg-white">
                      {submission ? (
                        <div className="text-center py-12 space-y-8 animate-fade-in">
                          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center shadow-inner">
                            <CheckCircle2 className="w-14 h-14" />
                          </div>
                          <div className="space-y-3">
                            <h3 className="text-3xl font-headline font-bold text-gray-900">Práce odevzdána!</h3>
                            <p className="text-muted-foreground text-lg">Učitel tvou práci brzy ohodnotí.</p>
                          </div>
                          
                          {submission.grade && (
                            <div className="p-10 bg-primary/5 rounded-3xl border border-primary/10 shadow-sm max-w-lg mx-auto transform hover:scale-[1.02] transition-transform">
                              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-6">Tvé hodnocení</p>
                              <div className="flex items-center justify-center gap-8">
                                <span className="text-7xl drop-shadow-md">{GRADES.find(g => g.value === submission.grade)?.emoji}</span>
                                <div className="text-left border-l pl-8 border-primary/20">
                                  <span className="text-6xl font-black text-primary">{submission.grade}</span>
                                  <p className="text-muted-foreground font-medium text-lg">{GRADES.find(g => g.value === submission.grade)?.label}</p>
                                </div>
                              </div>
                              {submission.feedback && (
                                <div className="mt-8 pt-8 border-t border-primary/10">
                                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Vyjádření učitele:</p>
                                  <p className="text-lg italic text-gray-700 leading-relaxed">
                                    "{submission.feedback}"
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          <Button onClick={() => setSelectedAssignmentId(null)} className="px-12 h-12 rounded-full mt-4">Zpět k ostatním úkolům</Button>
                        </div>
                      ) : (
                        <div className="space-y-12">
                          {assignment.questions.map((q, idx) => (
                            <div key={q.id} className="space-y-5 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                              <h5 className="font-bold text-2xl flex gap-4 items-start text-gray-900">
                                <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-black">{idx + 1}</span>
                                <span className="pt-1">{q.text}</span>
                              </h5>
                              
                              <div className="ml-14">
                                {q.type === 'short_answer' && (
                                  <Input 
                                    placeholder="Napiš svou odpověď..." 
                                    className="h-14 text-lg border-gray-100 shadow-sm focus:border-primary focus:ring-primary rounded-xl"
                                    onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} 
                                  />
                                )}
                                
                                {q.type === 'long_answer' && (
                                  <Textarea 
                                    placeholder="Zde se rozepiš více..." 
                                    className="min-h-[160px] text-lg border-gray-100 shadow-sm focus:border-primary focus:ring-primary rounded-xl p-4"
                                    onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} 
                                  />
                                )}

                                {q.type === 'multiple_choice' && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {q.options?.map((opt, i) => (
                                      <button 
                                        key={i} 
                                        className={`p-5 rounded-2xl border-2 text-left transition-all ${answers[q.id] === i ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-gray-50 bg-gray-50/30 hover:bg-gray-50 hover:border-gray-200'}`}
                                        onClick={() => setAnswers({ ...answers, [q.id]: i })}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${answers[q.id] === i ? 'bg-primary text-white' : 'bg-white text-primary'}`}>
                                            {String.fromCharCode(65 + i)}
                                          </div>
                                          <span className="font-medium text-lg">{opt}</span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {q.type === 'true_false' && (
                                  <div className="flex gap-4 max-w-md">
                                    <Button 
                                      variant={answers[q.id] === true ? 'default' : 'outline'} 
                                      className="flex-1 h-14 text-lg rounded-xl shadow-sm"
                                      onClick={() => setAnswers({ ...answers, [q.id]: true })}
                                    >Ano / Pravda</Button>
                                    <Button 
                                      variant={answers[q.id] === false ? 'default' : 'outline'} 
                                      className="flex-1 h-14 text-lg rounded-xl shadow-sm"
                                      onClick={() => setAnswers({ ...answers, [q.id]: false })}
                                    >Ne / Nepravda</Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          <div className="pt-10 border-t space-y-6">
                            <h4 className="font-headline text-2xl text-primary flex items-center gap-3">
                              <PenTool className="w-7 h-7 text-accent" /> Grafická příloha / Náčrtník
                            </h4>
                            <p className="text-muted-foreground text-sm">Sem můžeš nakreslit odpověď perem, myší nebo nahrát schéma, které vysvětluje tvé myšlenky.</p>
                            <DrawingPad onSave={setSketch} />
                          </div>

                          <div className="pt-12 flex justify-center">
                            <Button className="w-full md:w-auto px-24 h-16 text-2xl font-headline rounded-full shadow-2xl hover:scale-105 transition-transform" onClick={() => {
                              store.submitWork({
                                assignmentId: selectedAssignmentId!,
                                studentId: currentUser.id,
                                answers,
                                drawings: sketch ? [sketch] : [],
                              });
                              toast({ title: "Odesláno!", description: "Tvá práce byla doručena učiteli." });
                            }}>
                              <ClipboardList className="w-7 h-7 mr-3" /> Odevzdat moji práci
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
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Moje práce a testy</h1>
                  <p className="text-muted-foreground text-lg">Zde najdeš úkoly, které ti zadali tvoji učitelé.</p>
                </div>
              </div>
              
              <div className="grid gap-6">
                {studentAssignments.length === 0 ? (
                  <div className="text-center py-24 bg-white border-none shadow-sm rounded-3xl">
                    <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto opacity-10 mb-4" />
                    <p className="text-muted-foreground text-xl">Zatím ti nebyly zadány žádné práce. Užij si volno!</p>
                  </div>
                ) : (
                  studentAssignments.map(a => {
                    const submission = store.submissions.find(s => s.assignmentId === a.id && s.studentId === currentUser.id);
                    return (
                      <Card key={a.id} className="cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all border-none group overflow-hidden" onClick={() => setSelectedAssignmentId(a.id)}>
                        <CardContent className="p-0 flex flex-col md:flex-row items-stretch">
                          <div className={`w-full md:w-24 flex items-center justify-center text-white p-6 ${submission ? 'bg-green-500' : 'bg-primary shadow-lg'}`}>
                            {submission ? <CheckCircle2 className="w-10 h-10" /> : <ClipboardList className="w-10 h-10" />}
                          </div>
                          <div className="p-8 flex-1 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-1">
                              <h4 className="text-2xl font-headline font-bold group-hover:text-primary transition-colors">{a.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2 max-w-xl">{a.description}</p>
                            </div>
                            <div className="flex items-center gap-5">
                              {submission ? (
                                <div className="flex flex-col items-end">
                                  <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-green-50 text-green-700 border-none font-bold">Odevzdáno</Badge>
                                  {submission.grade && (
                                    <p className="text-xs font-bold text-primary mt-2">Známka: {submission.grade}</p>
                                  )}
                                </div>
                              ) : (
                                <Badge className="bg-accent text-white px-4 py-1.5 rounded-full border-none font-bold animate-pulse">Čeká na tebe</Badge>
                              )}
                              <ChevronRight className="w-8 h-8 text-gray-200 group-hover:text-primary" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return null;
}
