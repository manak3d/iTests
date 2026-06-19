// @ts-nocheck
import { AddStudentDialog } from '@/components/dashboard/AddStudentDialog';



import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutDashboard, School, Users, Crown, ChevronRight, Check, CheckCircle2, UserPlus, Upload, Trash2, Edit3, Settings, GraduationCap, ClipboardList, MessageSquare, Activity, ChevronUp, ChevronDown, Sparkles, Printer, PenTool, Loader2, BookOpen, AlertTriangle, ArrowRight, Play, Copy, Calendar, BrainCircuit, Wand2 } from 'lucide-react';
import { GradePicker } from '@/components/itest/GradePicker';
import { GraphQuestionEvaluation, AxisQuestionEvaluation, NumberLineQuestionEvaluation } from '@/components/itest/GraphQuestion';
import { parseClozeText } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Navbar } from '@/components/itest/Navbar';


export function TeacherDashboard(props: any) {
  const {
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
  } = props;

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
                      <div>
                        <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors">{c.name}</CardTitle>
                        {c.joinCode && (
                          <p className="text-xs font-semibold text-slate-500/80 mt-1">
                            Kód třídy: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-primary font-bold">{c.joinCode}</span>
                          </p>
                        )}
                      </div>
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

                        {!a.isDraft && (
                          <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-105 mt-4 space-y-4 print-exclude">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                              <div className="bg-white p-2.5 rounded-xl border border-slate-150 shadow-sm shrink-0">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/?test=' + a.id : '')}`}
                                  alt="QR kód pro vstup do testu"
                                  className="w-[120px] h-[120px]"
                                />
                              </div>
                              <div className="space-y-2 text-center sm:text-left flex-1">
                                <h3 className="font-bold text-sm text-indigo-700 uppercase tracking-wider">🔗 Vstup do testu přes odkaz / QR kód</h3>
                                <p className="text-xs text-indigo-900/80 leading-relaxed">
                                  Ukažte tento QR kód žákům nebo jim pošlete přímý odkaz. Po načtení kódu nebo kliknutí na odkaz a přihlášení se žákovi automaticky otevře tento test.
                                </p>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    readOnly
                                    value={typeof window !== 'undefined' ? `${window.location.origin}/?test=${a.id}` : ''}
                                    className="bg-white border text-xs px-3 py-1.5 rounded-lg font-mono text-gray-650 flex-1 focus:outline-none"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50 bg-white"
                                    onClick={() => {
                                      if (typeof window !== 'undefined') {
                                        navigator.clipboard.writeText(`${window.location.origin}/?test=${a.id}`);
                                        toast({ title: "Odkaz zkopírován", description: "Odkaz na test byl uložen do schránky." });
                                      }
                                    }}
                                  >
                                    Kopírovat
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

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

                              <Button
                                variant="outline" size="sm"
                                disabled={isGeneratingAlternative}
                                className="w-full h-9 text-xs font-bold text-violet-700 border-violet-250 hover:bg-violet-50 bg-violet-50/30 flex items-center justify-center gap-1.5"
                                onClick={async () => {
                                  setIsGeneratingAlternative(true);
                                  try {
                                    const res = await fetch('/api/ai', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        action: 'generateAlternative',
                                        questions: a.questions
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.error) {
                                      toast({ title: "Chyba generování", description: data.error, variant: "destructive" });
                                    } else if (data.questions) {
                                      store.addAssignment({
                                        title: `${a.title} - Skupina B`,
                                        description: a.description,
                                        classId: a.classId,
                                        teacherId: a.teacherId,
                                        subject: a.subject || 'Jiný',
                                        questions: data.questions,
                                        dueDate: a.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                        fileUri: a.fileUri,
                                        studentIds: a.studentIds || [],
                                        isDraft: true,
                                      });
                                      toast({ title: "Skupina B vytvořena", description: `Byla vygenerována nová verze testu a uložena jako koncept.`, variant: "default" });
                                    }
                                  } catch (err: any) {
                                    console.error(err);
                                    toast({ title: "Chyba", description: "Nepodařilo se komunikovat s AI serverem.", variant: "destructive" });
                                  } finally {
                                    setIsGeneratingAlternative(false);
                                  }
                                }}
                              >
                                {isGeneratingAlternative ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-750" />
                                    Generuji skupinu B...
                                  </>
                                ) : (
                                  <>✨ Generovat Skupinu B (AI)</>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>

                        {a.questions && a.questions.length > 0 && (
                          <div className="mt-8">
                            <h3 className="font-semibold text-xl mb-4">Otázky v testu:</h3>
                            <div className="space-y-3">
                              {a.questions.map(q => (
                                <div key={q.id} className="p-4 bg-gray-50 rounded-lg flex flex-col gap-2 border w-full">
                                  <div className="flex justify-between items-center w-full">
                                    <span className="font-medium">{q.text}</span>
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
                                  {q.type === 'cloze' && (
                                    <div className="p-3 bg-white rounded-xl border border-slate-200 leading-relaxed text-slate-800 font-medium text-sm mt-1 select-none w-full">
                                      {(() => {
                                        const parts = parseClozeText(q.clozeText || q.text || '');
                                        return parts.map((part, i) => {
                                          if (part.type === 'text') {
                                            return <span key={i}>{part.text}</span>;
                                          } else if (part.type === 'dropdown') {
                                            const sortedOptions = [...(part.options || [])].sort((a, b) => a.localeCompare(b));
                                            return (
                                              <select
                                                key={i}
                                                disabled
                                                className="mx-1 h-7 rounded bg-slate-50 border border-slate-300 px-1 text-xs font-bold text-indigo-750 inline-block align-middle"
                                              >
                                                <option>{part.correctAnswer} (správně)</option>
                                                {sortedOptions.filter(opt => opt !== part.correctAnswer).map((opt, optIdx) => (
                                                  <option key={optIdx}>{opt}</option>
                                                ))}
                                              </select>
                                            );
                                          } else {
                                            return (
                                              <input
                                                key={i}
                                                type="text"
                                                disabled
                                                value={part.correctAnswer || ''}
                                                style={{ width: `${Math.max(4, (part.correctAnswer || '').length + 1)}ch` }}
                                                className="mx-1 h-7 rounded bg-green-50 border border-green-300 px-1 text-xs font-bold text-green-700 text-center inline-block align-middle"
                                              />
                                            );
                                          }
                                        });
                                      })()}
                                    </div>
                                  )}
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
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-headline font-black text-gray-800">Zadané práce</h3>
                      <p className="text-sm text-muted-foreground">Přehled a správa všech zadaných úkolů pro tuto třídu.</p>
                    </div>
                    <Button className="rounded-full shadow-md" onClick={() => setIsCreatingAssignment(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Vytvořit práci
                    </Button>
                  </div>

                  {/* Split columns for Teacher assignments */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                    {/* LEVÝ SLOUPEC: TESTY (ZNÁMKOVANÉ) */}
                    <div className="space-y-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100/80 shadow-sm flex flex-col">
                      <div className="border-b pb-4 flex items-center gap-3">
                        <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
                          <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-headline font-bold text-primary">Známkované testy</h2>
                          <p className="text-xs text-muted-foreground">Práce, které známkujete vy nebo vyžadují ruční kontrolu.</p>
                        </div>
                      </div>

                      <div className="grid gap-3 flex-1 align-content-start">
                        {(() => {
                          const graded = store.assignments.filter(
                            a => a.classId === selectedClassId && (a.teacherId === currentUser.id || !a.teacherId) && !a.isPractice
                          );

                          if (graded.length === 0) {
                            return (
                              <Card className="border-none shadow-xs bg-white p-6 text-center">
                                <p className="text-xs text-muted-foreground">Zatím nebyly zadány žádné známkované testy.</p>
                              </Card>
                            );
                          }

                          return graded.map(a => (
                            <Card key={a.id} className={`hover:border-primary cursor-pointer transition-all border-none shadow-sm ${a.isDraft ? 'bg-amber-50/40 border border-amber-200' : 'bg-white'}`} onClick={() => setViewingAssignment(a.id)}>
                              <CardContent className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                  <ClipboardList className={`w-5 h-5 ${a.isDraft ? 'text-amber-500' : 'text-primary'}`} />
                                  <div>
                                    <h4 className="font-bold text-base text-gray-800">{a.title}</h4>
                                    {a.isDraft && <span className="text-[10px] font-bold text-amber-600 block">💾 Koncept — neuveřejněno</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <a
                                    href={`/print/${a.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-primary rounded-full w-8 h-8">
                                      <Printer className="w-4 h-4" />
                                    </Button>
                                  </a>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8" 
                                    onClick={(e) => {
                                      if (confirm(`Opravdu chcete smazat úkol "${a.title}"? Tím smažete i všechny odevzdané práce žáků.`)) {
                                        store.deleteAssignment(a.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <ChevronRight className="w-5 h-5 text-gray-300 cursor-pointer" onClick={() => setViewingAssignment(a.id)} />
                                </div>
                              </CardContent>
                            </Card>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* PRAVÝ SLOUPEC: PROCVIČOVÁNÍ (NEZNÁMKOVANÉ) */}
                    <div className="space-y-6 bg-indigo-50/20 p-6 rounded-3xl border border-indigo-100/50 shadow-sm flex flex-col">
                      <div className="border-b pb-4 flex items-center gap-3">
                        <div className="bg-indigo-600/10 p-2.5 rounded-2xl text-indigo-750">
                          <Sparkles className="w-6 h-6 text-indigo-650 animate-pulse" />
                        </div>
                        <div>
                          <h2 className="text-xl font-headline font-bold text-indigo-950">Neznámkované procvičování</h2>
                          <p className="text-xs text-indigo-600/80">Procvičování automaticky opravované a vysvětlované AI.</p>
                        </div>
                      </div>

                      <div className="grid gap-3 flex-1 align-content-start">
                        {(() => {
                          const practice = store.assignments.filter(
                            a => a.classId === selectedClassId && (a.teacherId === currentUser.id || !a.teacherId) && a.isPractice
                          );

                          if (practice.length === 0) {
                            return (
                              <Card className="border-none shadow-xs bg-white p-6 text-center">
                                <p className="text-xs text-muted-foreground">Zatím nebylo zadáno žádné procvičování.</p>
                              </Card>
                            );
                          }

                          return practice.map(a => (
                            <Card key={a.id} className={`hover:border-indigo-400 cursor-pointer transition-all border-none shadow-sm ${a.isDraft ? 'bg-amber-50/40 border border-amber-200' : 'bg-white'}`} onClick={() => setViewingAssignment(a.id)}>
                              <CardContent className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                  <Sparkles className={`w-5 h-5 ${a.isDraft ? 'text-amber-500' : 'text-indigo-650'}`} />
                                  <div>
                                    <h4 className="font-bold text-base text-gray-800">{a.title}</h4>
                                    {a.isDraft && <span className="text-[10px] font-bold text-amber-600 block">💾 Koncept — neuveřejněno</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <a
                                    href={`/print/${a.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-indigo-650 rounded-full w-8 h-8">
                                      <Printer className="w-4 h-4" />
                                    </Button>
                                  </a>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8" 
                                    onClick={(e) => {
                                      if (confirm(`Opravdu chcete smazat úkol "${a.title}"? Tím smažete i všechny odevzdané práce žáků.`)) {
                                        store.deleteAssignment(a.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <ChevronRight className="w-5 h-5 text-gray-300 cursor-pointer" onClick={() => setViewingAssignment(a.id)} />
                                </div>
                              </CardContent>
                            </Card>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
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
                            <div className="flex flex-col gap-2 mt-2">
                              <CardDescription>Odevzdal: <span className="font-bold text-gray-700">{student.name}</span></CardDescription>
                              {sub.tabFocusLostCount ? (
                                <Badge variant="outline" className="w-fit bg-red-50 text-red-600 border-red-200 font-bold flex items-center gap-1.5 px-3 py-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Podezřelá aktivita: Žák {sub.tabFocusLostCount}x opustil(a) okno!
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="w-fit bg-green-50 text-green-600 border-green-200 font-bold flex items-center gap-1.5 px-3 py-1">
                                  <Check className="w-3.5 h-3.5" />
                                  Při testu žák neopustil okno (Bez podvodu)
                                </Badge>
                              )}
                            </div>
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
                                                  ? `Procvičování (${earned}/${totalMax}b · ${pct}%)`
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

                                {(() => {
                                  const failedQuestions = questionStats
                                    .map((stat, idx) => ({ ...stat, idx: idx + 1 }))
                                    .filter(stat => stat.pct < 50);
                                  
                                  if (failedQuestions.length === 0) return null;

                                  return (
                                    <div className="bg-rose-50 border border-rose-150 rounded-xl p-4 text-xs text-rose-950 shadow-sm space-y-1.5 mt-2">
                                      <p className="font-bold flex items-center gap-1.5 text-rose-800">
                                        <span>⚠️ Doporučení k procvičení</span>
                                      </p>
                                      <p className="text-rose-900/90 leading-relaxed">
                                        Následující otázky měly úspěšnost pod 50 % a dělaly žákům největší potíže:
                                      </p>
                                      <ul className="list-disc pl-4 space-y-1 text-rose-900/90 font-semibold">
                                        {failedQuestions.map(q => (
                                          <li key={q.id}>
                                            Otázka č. {q.idx} (úspěšnost {q.pct}%) – neuspělo {100 - q.pct}% žáků.
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  );
                                })()}

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
            selectedClassId={selectedClassId}
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
