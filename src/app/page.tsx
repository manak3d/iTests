"use client";

import { useState } from 'react';
import { useITestStore } from '@/hooks/use-itest-store';
import { Navbar } from '@/components/itest/Navbar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Users, ClipboardList, CheckCircle2, ChevronRight, GraduationCap, School, Loader2, BookOpen } from 'lucide-react';
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
  
  const [activeTab, setActiveTab] = useState('classes');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<string | null>(null);
  
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [mainWorkDrawing, setMainWorkDrawing] = useState<string | undefined>();

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

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      if (!store.login(loginRole, username, password)) {
        toast({ title: "Přihlášení se nezdařilo", variant: "destructive" });
      }
    } else {
      if (name && username && password) {
        store.register(name, username, password);
        setAuthMode('login');
        toast({ title: "Registrace úspěšná", description: "Nyní se můžete přihlásit." });
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

  const handleAddStudent = () => {
    if (newStudentName.trim() && newStudentUsername.trim() && newStudentPassword.trim() && targetClassId) {
      store.addStudent(targetClassId, newStudentName, newStudentUsername, newStudentPassword);
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
                <Dialog open={isAddingClass} onOpenChange={setIsAddingClass}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full shadow-md">
                      <Plus className="w-4 h-4 mr-2" /> Nová třída
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Vytvořit novou třídu</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Input placeholder="Např. Matematika 8.A" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddClass} disabled={!newClassName.trim()}>Vytvořit</Button>
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
              {isCreatingAssignment ? (
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
                    <Card key={a.id} className="hover:border-primary transition-all border-none shadow-sm bg-white">
                      <CardContent className="p-5 flex justify-between items-center">
                        <div className="flex items-center gap-5">
                          <ClipboardList className="w-6 h-6 text-primary" />
                          <h4 className="font-bold text-xl">{a.title}</h4>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
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
                          {sub.mainWorkDrawing && (
                            <div className="space-y-2">
                              <label className="text-sm font-bold uppercase text-primary">Vypracovaný dokument</label>
                              <img src={sub.mainWorkDrawing} className="w-full border rounded-2xl" />
                            </div>
                          )}
                          <div className="space-y-4">
                            <GradePicker selected={sub.grade} onSelect={(v) => store.gradeSubmission(sub.id, v, sub.feedback || '')} />
                            <Textarea 
                                placeholder="Slovní hodnocení..." 
                                value={sub.feedback || ''}
                                onChange={(e) => store.gradeSubmission(sub.id, sub.grade || 0, e.target.value)}
                            />
                            <Button className="w-full h-12" onClick={() => setViewingSubmission(null)}>Uložit v cloudu</Button>
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
                      <div key={s.id} onClick={() => setViewingSubmission(s.id)} className="p-6 bg-white shadow-sm rounded-2xl flex items-center justify-between hover:shadow-lg cursor-pointer">
                        <div>
                          <p className="font-bold text-lg">{student?.name}</p>
                          <p className="text-sm text-muted-foreground">{assignment?.title}</p>
                        </div>
                        <Badge variant={s.grade ? "default" : "secondary"}>{s.grade ? `Známka: ${s.grade}` : 'Neopraveno'}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Dialog open={isAddingStudent} onOpenChange={setIsAddingStudent}>
            <DialogContent>
              <DialogHeader><DialogTitle>Zapsat žáka</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Jméno žáka" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                <Input placeholder="Login" value={newStudentUsername} onChange={(e) => setNewStudentUsername(e.target.value)} />
                <Input type="password" placeholder="Heslo" value={newStudentPassword} onChange={(e) => setNewStudentPassword(e.target.value)} />
              </div>
              <DialogFooter>
                <Button onClick={handleAddStudent}>Vytvořit</Button>
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
                          {submission.grade && (
                            <div className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/20 mt-4">
                              <div className="text-4xl font-black text-primary">Známka: {submission.grade}</div>
                              {submission.feedback && <p className="mt-4 text-muted-foreground italic">"{submission.feedback}"</p>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {a.fileUri ? (
                            <DrawingPad backgroundImage={a.fileUri} onSave={setMainWorkDrawing} />
                          ) : (
                            <div className="p-12 text-center border-2 border-dashed rounded-3xl text-muted-foreground">Bez vizuálního podkladu.</div>
                          )}
                          <Button className="w-full h-14 text-xl shadow-lg" onClick={() => {
                            store.submitWork({ assignmentId: selectedAssignmentId, studentId: currentUser.id, answers: {}, questionDrawings: {}, mainWorkDrawing });
                          }}>Odevzdat v cloudu</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-3xl font-headline font-bold text-primary">Moje úkoly</h2>
              <div className="grid gap-4">
                {studentAssignments.map(a => {
                  const sub = store.submissions.find(s => s.assignmentId === a.id && s.studentId === currentUser.id);
                  return (
                    <Card key={a.id} className="cursor-pointer hover:shadow-lg transition-all bg-white" onClick={() => setSelectedAssignmentId(a.id)}>
                      <CardContent className="p-6 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-xl">{a.title}</p>
                          {sub && <Badge variant={sub.grade ? "default" : "secondary"} className="mt-1">{sub.grade ? `Známka: ${sub.grade}` : 'Odevzdáno'}</Badge>}
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-300" />
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