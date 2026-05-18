
"use client";

import { useState } from 'react';
import { useITestStore } from '@/hooks/use-itest-store';
import { Navbar } from '@/components/itest/Navbar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Users, ClipboardList, CheckCircle2, ChevronRight, GraduationCap, School } from 'lucide-react';
import { AssignmentCreator } from '@/components/itest/AssignmentCreator';
import { DrawingPad } from '@/components/itest/DrawingPad';
import { GradePicker } from '@/components/itest/GradePicker';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { GRADES } from '@/lib/types';
import { Label } from '@/components/ui/label';

export default function ITestApp() {
  const store = useITestStore();
  const [authView, setAuthView] = useState<'login' | 'dashboard'>('login');
  const [loginRole, setLoginRole] = useState<'teacher' | 'student'>('teacher');
  const [username, setUsername] = useState('');
  
  // UI state for creation dialogs
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
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

  if (!store.isLoaded) return <div className="h-svh flex items-center justify-center font-headline text-primary animate-pulse">Loading iTest...</div>;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (store.login(loginRole, username)) {
      setAuthView('dashboard');
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
    if (newStudentName.trim() && newStudentUsername.trim() && targetClassId) {
      store.addStudent(targetClassId, newStudentName, newStudentUsername);
      setNewStudentName('');
      setNewStudentUsername('');
      setIsAddingStudent(false);
      setTargetClassId(null);
    }
  };

  if (authView === 'login') {
    return (
      <div className="min-h-screen bg-[#EFF3F7] flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="bg-primary w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg transform -rotate-6">
              <School className="text-white w-8 h-8" />
            </div>
            <div className="space-y-1">
              <CardTitle className="font-headline text-4xl text-primary">iTest</CardTitle>
              <CardDescription className="text-base">Modern Education, Simplified.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                <button 
                  type="button" 
                  className={`py-2 text-sm font-medium rounded-md transition-all ${loginRole === 'teacher' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
                  onClick={() => setLoginRole('teacher')}
                >Teacher</button>
                <button 
                  type="button" 
                  className={`py-2 text-sm font-medium rounded-md transition-all ${loginRole === 'student' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
                  onClick={() => setLoginRole('student')}
                >Student</button>
              </div>
              <div className="space-y-2">
                <Input 
                  placeholder="Username" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  className="h-12 border-gray-200"
                />
                <p className="text-[10px] text-muted-foreground px-1">Demo Teacher: smith | Demo Student: created after login</p>
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-headline">Enter Platform</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = store.currentUser!;

  // TEACHER DASHBOARD
  if (user.role === 'teacher') {
    const teacherClasses = store.classes.filter(c => c.teacherId === user.id);

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={user} onLogout={() => { store.logout(); setAuthView('login'); }} />
        
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold text-primary">Teacher Dashboard</h1>
              <p className="text-muted-foreground">Manage your classes, students, and assignments.</p>
            </div>
            <div className="flex gap-2">
              {selectedClassId && (
                <Button variant="outline" onClick={() => { setSelectedClassId(null); setActiveTab('classes'); }}>
                  Back to Classes
                </Button>
              )}
              {activeTab === 'classes' && !selectedClassId && (
                <Dialog open={isAddingClass} onOpenChange={setIsAddingClass}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" /> New Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Class</DialogTitle>
                      <DialogDescription>Enter a name for your new class. You can add students later.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input 
                        placeholder="e.g. Mathematics 101" 
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingClass(false)}>Cancel</Button>
                      <Button onClick={handleAddClass} disabled={!newClassName.trim()}>Create Class</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              {selectedClassId && activeTab === 'assignments' && !isCreatingAssignment && (
                <Button onClick={() => setIsCreatingAssignment(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Create Assignment
                </Button>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/50 border shadow-sm">
              <TabsTrigger value="classes" className="data-[state=active]:bg-primary data-[state=active]:text-white">Classes</TabsTrigger>
              <TabsTrigger value="assignments" disabled={!selectedClassId} className="data-[state=active]:bg-primary data-[state=active]:text-white">Assignments</TabsTrigger>
              <TabsTrigger value="submissions" disabled={!selectedClassId} className="data-[state=active]:bg-primary data-[state=active]:text-white">Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="classes" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherClasses.length === 0 ? (
                <div className="col-span-full py-20 text-center space-y-4 bg-white/50 rounded-2xl border-2 border-dashed">
                  <School className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                  <p className="text-muted-foreground font-medium">No classes yet. Create your first one to get started.</p>
                </div>
              ) : (
                teacherClasses.map(c => (
                  <Card 
                    key={c.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${selectedClassId === c.id ? 'ring-2 ring-primary bg-primary/5' : ''}`} 
                    onClick={() => { setSelectedClassId(c.id); }}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="font-headline text-xl">{c.name}</CardTitle>
                      <Users className="w-5 h-5 text-accent" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{c.studentIds.length} Students</span>
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          setTargetClassId(c.id);
                          setIsAddingStudent(true);
                        }}>Add Student</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              <Dialog open={isAddingStudent} onOpenChange={setIsAddingStudent}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Student to Class</DialogTitle>
                    <DialogDescription>Create a new student account for this class.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Student Full Name</Label>
                      <Input 
                        placeholder="e.g. John Doe" 
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Username (for login)</Label>
                      <Input 
                        placeholder="e.g. john.doe" 
                        value={newStudentUsername}
                        onChange={(e) => setNewStudentUsername(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingStudent(false)}>Cancel</Button>
                    <Button 
                      onClick={handleAddStudent} 
                      disabled={!newStudentName.trim() || !newStudentUsername.trim()}
                    >
                      Add Student
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="assignments">
              {isCreatingAssignment ? (
                <div className="space-y-4">
                  <Button variant="ghost" onClick={() => setIsCreatingAssignment(false)}>← Back to List</Button>
                  <AssignmentCreator classId={selectedClassId!} onSave={(a) => {
                    store.addAssignment(a);
                    setIsCreatingAssignment(false);
                  }} />
                </div>
              ) : (
                <div className="grid gap-4">
                  {store.assignments.filter(a => a.classId === selectedClassId).map(a => (
                    <Card key={a.id} className="hover:border-primary transition-colors">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-lg">{a.title}</h4>
                          <p className="text-sm text-muted-foreground">Due: {new Date(a.dueDate).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline">{a.questions.length} Questions</Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {store.assignments.filter(a => a.classId === selectedClassId).length === 0 && (
                     <p className="text-center py-10 text-muted-foreground">No assignments for this class.</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="submissions">
              {viewingSubmission ? (
                <div className="space-y-6">
                  <Button variant="ghost" onClick={() => setViewingSubmission(null)}>← Back to Submissions</Button>
                  {(() => {
                    const sub = store.submissions.find(s => s.id === viewingSubmission);
                    const assignment = store.assignments.find(a => a.id === sub?.assignmentId);
                    const student = store.users.find(u => u.id === sub?.studentId);
                    if (!sub || !assignment || !student) return null;
                    return (
                      <Card className="border-none shadow-xl">
                        <CardHeader className="bg-white border-b">
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="font-headline text-2xl text-primary">{assignment.title}</CardTitle>
                              <CardDescription>Submitted by {student.name}</CardDescription>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="mb-1">Submission Date</Badge>
                              <p className="text-xs text-muted-foreground">{new Date(sub.submittedAt).toLocaleString()}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                          {assignment.questions.map((q, idx) => (
                            <div key={q.id} className="space-y-3">
                              <h5 className="font-bold text-lg flex gap-2">
                                <span className="text-accent">{idx + 1}.</span> {q.text}
                              </h5>
                              <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-l-primary">
                                <span className="text-sm font-semibold text-primary/60 uppercase block mb-1">Answer:</span>
                                <p className="text-gray-800 italic">
                                  {typeof sub.answers[q.id] === 'boolean' ? (sub.answers[q.id] ? 'True' : 'False') : sub.answers[q.id] || '(No answer)'}
                                </p>
                              </div>
                            </div>
                          ))}

                          {sub.drawings?.[0] && (
                            <div className="space-y-3">
                              <h5 className="font-bold text-lg">Drawing/Annotation</h5>
                              <div className="p-2 border rounded-xl bg-gray-50">
                                <img src={sub.drawings[0]} alt="Student Sketch" className="max-w-full rounded-lg" />
                              </div>
                            </div>
                          )}

                          <div className="pt-8 border-t space-y-6">
                            <h5 className="font-headline text-2xl text-primary">Grading & Feedback</h5>
                            <GradePicker 
                              selected={sub.grade} 
                              onSelect={(v) => store.gradeSubmission(sub.id, v, sub.feedback || '')} 
                            />
                            <div className="space-y-2">
                              <label className="text-sm font-bold">Verbal Feedback (Optional)</label>
                              <Textarea 
                                placeholder="Well done! You correctly identified the main theme..." 
                                value={sub.feedback || ''}
                                onChange={(e) => store.gradeSubmission(sub.id, sub.grade || 0, e.target.value)}
                              />
                            </div>
                            <Button className="w-full h-12" onClick={() => setViewingSubmission(null)}>Save & Close</Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="grid gap-3">
                    {store.submissions.filter(s => {
                      const a = store.assignments.find(as => as.id === s.assignmentId);
                      return a?.classId === selectedClassId;
                    }).map(s => {
                      const student = store.users.find(u => u.id === s.studentId);
                      const assignment = store.assignments.find(a => a.id === s.assignmentId);
                      return (
                        <div key={s.id} onClick={() => setViewingSubmission(s.id)} className="p-4 bg-white border rounded-xl flex items-center justify-between hover:border-primary cursor-pointer transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                              <GraduationCap />
                            </div>
                            <div>
                              <p className="font-bold">{student?.name}</p>
                              <p className="text-sm text-muted-foreground">{assignment?.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {s.grade ? (
                              <div className="text-center px-4 border-l">
                                <span className="text-2xl">{GRADES.find(g => g.value === s.grade)?.emoji}</span>
                                <p className="text-[10px] font-bold text-primary uppercase">Grade: {s.grade}</p>
                              </div>
                            ) : (
                              <Badge className="bg-yellow-400">Needs Grading</Badge>
                            )}
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                    {store.submissions.filter(s => {
                      const a = store.assignments.find(as => as.id === s.assignmentId);
                      return a?.classId === selectedClassId;
                    }).length === 0 && (
                      <p className="text-center py-20 text-muted-foreground italic">No submissions yet for this class.</p>
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
  if (user.role === 'student') {
    const studentAssignments = store.assignments.filter(a => a.classId === user.classId);
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar user={user} onLogout={() => { store.logout(); setAuthView('login'); }} />
        
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-8">
          {selectedAssignmentId ? (
            <div className="space-y-6">
              <Button variant="ghost" onClick={() => setSelectedAssignmentId(null)}>← Back to Assignments</Button>
              {(() => {
                const assignment = store.assignments.find(a => a.id === selectedAssignmentId);
                const submission = store.submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === user.id);
                if (!assignment) return null;
                
                return (
                  <Card className="border-none shadow-xl">
                    <CardHeader className="bg-primary text-white rounded-t-xl">
                      <CardTitle className="font-headline text-3xl">{assignment.title}</CardTitle>
                      <CardDescription className="text-white/80">{assignment.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-12">
                      {submission ? (
                        <div className="text-center py-10 space-y-6 animate-fade-in">
                          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center">
                            <CheckCircle2 className="w-12 h-12" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-headline font-bold">Work Submitted!</h3>
                            <p className="text-muted-foreground">Your teacher will review it soon.</p>
                          </div>
                          {submission.grade && (
                            <div className="p-6 bg-accent/5 rounded-2xl border border-accent/20">
                              <p className="text-sm font-bold text-accent uppercase tracking-widest mb-2">Grade Received</p>
                              <div className="flex items-center justify-center gap-4">
                                <span className="text-5xl">{GRADES.find(g => g.value === submission.grade)?.emoji}</span>
                                <div className="text-left">
                                  <span className="text-4xl font-headline font-bold text-primary">{submission.grade}</span>
                                  <p className="text-muted-foreground text-sm">{GRADES.find(g => g.value === submission.grade)?.label}</p>
                                </div>
                              </div>
                              {submission.feedback && (
                                <div className="mt-4 pt-4 border-t text-sm italic text-muted-foreground">
                                  "{submission.feedback}"
                                </div>
                              )}
                            </div>
                          )}
                          <Button onClick={() => setSelectedAssignmentId(null)} className="w-full h-12">Close Assignment</Button>
                        </div>
                      ) : (
                        <div className="space-y-10">
                          {assignment.questions.map((q, idx) => (
                            <div key={q.id} className="space-y-4">
                              <h5 className="font-bold text-lg flex gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">{idx + 1}</span>
                                {q.text}
                              </h5>
                              
                              {q.type === 'short_answer' && (
                                <Input placeholder="Type your answer here..." onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} />
                              )}
                              
                              {q.type === 'long_answer' && (
                                <Textarea placeholder="Explain in detail..." className="min-h-[120px]" onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} />
                              )}

                              {q.type === 'multiple_choice' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {q.options?.map((opt, i) => (
                                    <button 
                                      key={i} 
                                      className={`p-4 rounded-xl border-2 text-left transition-all ${answers[q.id] === i ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                                      onClick={() => setAnswers({ ...answers, [q.id]: i })}
                                    >
                                      <span className="font-bold mr-2 text-primary">{String.fromCharCode(65 + i)}.</span> {opt}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {q.type === 'true_false' && (
                                <div className="flex gap-4">
                                  <Button 
                                    variant={answers[q.id] === true ? 'default' : 'outline'} 
                                    className="flex-1 h-12"
                                    onClick={() => setAnswers({ ...answers, [q.id]: true })}
                                  >True</Button>
                                  <Button 
                                    variant={answers[q.id] === false ? 'default' : 'outline'} 
                                    className="flex-1 h-12"
                                    onClick={() => setAnswers({ ...answers, [q.id]: false })}
                                  >False</Button>
                                </div>
                              )}
                            </div>
                          ))}

                          <div className="pt-6 border-t space-y-4">
                            <h4 className="font-headline text-xl text-primary flex items-center gap-2">
                              <Plus className="w-5 h-5 text-accent" /> Sketches & Notes
                            </h4>
                            <DrawingPad onSave={setSketch} />
                          </div>

                          <div className="pt-8 flex justify-center">
                            <Button className="w-full md:w-auto px-20 h-14 text-xl font-headline" onClick={() => {
                              store.submitWork({
                                assignmentId: selectedAssignmentId!,
                                studentId: user.id,
                                answers,
                                drawings: sketch ? [sketch] : [],
                              });
                            }}>
                              <ClipboardList className="w-6 h-6 mr-2" /> Submit My Work
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
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-headline font-bold text-primary">Active Assignments</h1>
                  <p className="text-muted-foreground">Select a task below to start working.</p>
                </div>
              </div>
              
              <div className="grid gap-4">
                {studentAssignments.length === 0 ? (
                  <div className="text-center py-20 bg-white border rounded-2xl">
                    <p className="text-muted-foreground">No assignments have been posted for your class yet.</p>
                  </div>
                ) : (
                  studentAssignments.map(a => {
                    const submission = store.submissions.find(s => s.assignmentId === a.id && s.studentId === user.id);
                    return (
                      <Card key={a.id} className="cursor-pointer hover:shadow-md transition-all border-none" onClick={() => setSelectedAssignmentId(a.id)}>
                        <CardContent className="p-6 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${submission ? 'bg-green-500' : 'bg-primary shadow-lg'}`}>
                              {submission ? <CheckCircle2 className="w-8 h-8" /> : <ClipboardList className="w-8 h-8" />}
                            </div>
                            <div>
                              <h4 className="text-xl font-headline font-bold">{a.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-1">{a.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {submission ? (
                              <Badge variant="secondary" className="px-3 py-1">Submitted</Badge>
                            ) : (
                              <Badge className="bg-accent px-3 py-1">Pending</Badge>
                            )}
                            <ChevronRight className="w-6 h-6 text-gray-300" />
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
