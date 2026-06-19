// @ts-nocheck
import { AddStudentDialog } from '@/components/dashboard/AddStudentDialog';


import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LayoutDashboard, School, Users, Crown, ChevronRight, Check, CheckCircle2, UserPlus, Upload, Trash2, Edit3, Settings, GraduationCap, ClipboardList, MessageSquare, Activity, ChevronUp, ChevronDown, Sparkles, Printer, PenTool, Loader2 } from 'lucide-react';
import { GradePicker } from '@/components/itest/GradePicker';
import { GraphQuestionEvaluation, AxisQuestionEvaluation, NumberLineQuestionEvaluation } from '@/components/itest/GraphQuestion';
import { parseClozeText } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Navbar } from '@/components/itest/Navbar';

export function AdminDashboard(props: any) {
  const {
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
  } = props;

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
                                                       q.type === 'cloze' ? 'Doplňovačka' : q.type}
                                                    </Badge>
                                                  </div>
                                                  {q.type !== 'drawing' && q.type !== 'graph' && q.type !== 'axis' && q.type !== 'number_line' && q.type !== 'cloze' && (
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

                    <AddStudentDialog
            isAddingStudent={isAddingStudent}
            setIsAddingStudent={setIsAddingStudent}
            studentActionType={studentActionType}
            setStudentActionType={setStudentActionType}
            newStudentName={newStudentName}
            setNewStudentName={setNewStudentName}
            newStudentUsername={newStudentUsername}
            setNewStudentUsername={setNewStudentUsername}
            newStudentPassword={newStudentPassword}
            setNewStudentPassword={setNewStudentPassword}
            targetClassId={targetClassId}
            setTargetClassId={setTargetClassId}
            selectedClassId={null} // Admins don't have a single active selectedClassId like teachers do
            studentSearch={studentSearch}
            setStudentSearch={setStudentSearch}
            selectedExistingStudentId={selectedExistingStudentId}
            setSelectedExistingStudentId={setSelectedExistingStudentId}
            csvFile={csvFile}
            setCsvFile={setCsvFile}
            csvParsingError={csvParsingError}
            setCsvParsingError={setCsvParsingError}
            csvImportProgress={csvImportProgress}
            setCsvImportProgress={setCsvImportProgress}
            handleAddStudent={handleAddStudent}
            handleImportCSVToExisting={handleImportCSVToExisting}
            store={store}
            schools={schools}
          />
          {renderGradebookDialog()}
        </main>
      </div>
    );
}
