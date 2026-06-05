
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileUp, Plus, Trash2, Wand2, Loader2, BookOpen, PenTool, Camera, BarChart4 } from 'lucide-react';
import { Question, QuestionType, Assignment, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { GraphQuestionCreator, AxisQuestionCreator, NumberLineQuestionCreator } from '@/components/itest/GraphQuestion';

import { Class } from '@/lib/types';

export function AssignmentCreator({ 
  classId, 
  students = [], 
  classes = [], 
  allStudents = [],
  onSave 
}: { 
  classId: string; 
  students?: User[]; 
  classes?: Class[]; 
  allStudents?: User[]; 
  onSave: (a: Omit<Assignment, 'id'>) => void 
}) {
  const [targetClassId, setTargetClassId] = useState(classId);

  const activeStudents = allStudents.length > 0 
    ? allStudents.filter(u => u.role === 'student' && u.classId === targetClassId)
    : students;
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Matematika');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [fileUri, setFileUri] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [assignType, setAssignType] = useState<'all' | 'specific'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Grade thresholds state
  const [useCustomThresholds, setUseCustomThresholds] = useState(false);
  const [threshold1, setThreshold1] = useState(85);
  const [threshold2, setThreshold2] = useState(65);
  const [threshold3, setThreshold3] = useState(45);
  const [threshold4, setThreshold4] = useState(25);

  const SUBJECTS = [
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

  const compressImage = (dataUri: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Výrazně snížíme rozlišení pro cloudové úložiště (Firestore limit 1MB)
        const MAX_WIDTH = 900; 
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // JPEG s kvalitou 0.5 zajistí, že dokument zabere cca 100-200 KB
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.src = dataUri;
    });
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      text: '',
      points: 1,
      options: type === 'multiple_choice' ? ['', '', '', ''] : undefined,
      ...(type === 'graph' ? {
        graphType: 'pie',
        graphData: {
          categories: [
            { label: 'Kategorie A', color: '#3B82F6' },
            { label: 'Kategorie B', color: '#10B981' },
            { label: 'Kategorie C', color: '#EF4444' },
          ]
        },
        correctAnswer: [40, 30, 30]
      } : {}),
      ...(type === 'axis' ? {
        correctAnswer: []
      } : {}),
      ...(type === 'number_line' ? {
        graphData: { min: -10, max: 10, step: 1, labelPeriod: 2 },
        correctAnswer: []
      } : {})
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const rawDataUri = event.target?.result as string;
      
      try {
        // Komprese obrazku
        const compressedUri = await compressImage(rawDataUri);
        setFileUri(compressedUri);
        
        toast({ title: "Dokument připraven", description: "Soubor byl úspěšně připojen k úkolu." });
      } catch (error: any) {
        toast({ 
          title: "Chyba cloudu", 
          description: "Nepodařilo se dokument připravit pro nahrání.",
          variant: "destructive" 
        });
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!title) return toast({ title: "Název je povinný", variant: "destructive" });
    
    if (useCustomThresholds) {
      if (threshold1 <= threshold2 || threshold2 <= threshold3 || threshold3 <= threshold4) {
        return toast({
          title: "Neplatné rozmezí známek",
          description: "Hodnoty musí sestupovat (1 > 2 > 3 > 4).",
          variant: "destructive"
        });
      }
    }

    onSave({
      title,
      description,
      classId: targetClassId,
      subject,
      questions,
      fileUri,
      dueDate: endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      studentIds: assignType === 'specific' ? selectedStudentIds : [],
      gradeThresholds: useCustomThresholds ? [threshold1, threshold2, threshold3, threshold4] : undefined,
      isDraft: false,
    });
  };

  const handleSaveDraft = () => {
    if (!title.trim()) {
      return toast({ title: "Chybí název", description: "Zadejte název konceptu.", variant: "destructive" });
    }
    onSave({
      title,
      description,
      classId: targetClassId,
      subject,
      questions,
      fileUri,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      studentIds: assignType === 'specific' ? selectedStudentIds : [],
      gradeThresholds: useCustomThresholds ? [threshold1, threshold2, threshold3, threshold4] : undefined,
      isDraft: true,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-primary text-white">
          <CardTitle className="font-headline text-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              <span>Nová práce v cloudu</span>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <label className="cursor-pointer flex-1 md:flex-none">
                <div className="bg-white text-primary px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center hover:bg-gray-100 transition-colors h-10 min-w-[150px]">
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />}
                  Nahrát soubor
                </div>
                <input type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileUpload} disabled={isProcessing} />
              </label>
              <label className="cursor-pointer flex-1 md:flex-none">
                <div className="bg-white/20 text-white border border-white/40 px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center hover:bg-white/30 transition-colors h-10 min-w-[150px]">
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                  📸 Vyfotit dokument
                </div>
                <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} disabled={isProcessing} />
              </label>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-primary uppercase">Název úkolu</label>
              <Input 
                placeholder="Např. Prověrka z historie" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="h-12 text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-primary uppercase">Předmět</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {SUBJECTS.map(subj => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-primary uppercase">Výchozí text / Instrukce</label>
            <Textarea 
              placeholder="Zde se objeví extrahovaný text (bude uložen v cloudu)..." 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="min-h-[150px] text-base"
            />
          </div>
          {/* Časový limit a zacílení žáků */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80">
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-primary uppercase tracking-wider">⏱️ Časový limit testu</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Od kdy (zahájení):</label>
                  <Input 
                    type="datetime-local" 
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Do kdy (uzávěrka):</label>
                  <Input 
                    type="datetime-local" 
                    value={endTime} 
                    onChange={e => setEndTime(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>

                        <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-200/60 pt-4 md:pt-0 md:pl-6">
              <h4 className="font-bold text-sm text-primary uppercase tracking-wider">🎯 Zacílení žáků</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Cílová třída:</label>
                  <select
                    value={targetClassId}
                    onChange={e => {
                      setTargetClassId(e.target.value);
                      setSelectedStudentIds([]);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {classes.length > 0 ? (
                      classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    ) : (
                      <option value={classId}>{classId}</option>
                    )}
                  </select>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setAssignType('all')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${assignType === 'all' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-slate-50'}`}
                  >
                    Celá třída
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignType('specific')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${assignType === 'specific' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-slate-50'}`}
                  >
                    Vybraní žáci
                  </button>
                </div>

                                 {assignType === 'specific' && (
                  <div className="border rounded-xl bg-white p-3 max-h-32 overflow-y-auto space-y-1.5 animate-fade-in">
                    {activeStudents.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-2">Ve třídě nejsou žádní žáci.</p>
                    ) : (
                      activeStudents.map(s => {
                        const isChecked = selectedStudentIds.includes(s.id);
                        return (
                          <label key={s.id} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedStudentIds(prev => prev.filter(id => id !== s.id));
                                } else {
                                  setSelectedStudentIds(prev => [...prev, s.id]);
                                }
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <span>{s.name} <span className="text-gray-400">({s.username})</span></span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Klasifikace / Hodnocení */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 space-y-4">
            <h4 className="font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-2">
              <span>📊 Klasifikace / Procentuální rozmezí známek</span>
            </h4>
            
            <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 max-w-md">
              <button
                type="button"
                onClick={() => setUseCustomThresholds(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${!useCustomThresholds ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-slate-50'}`}
              >
                Výchozí stupnice (85% · 65% · 45% · 25%)
              </button>
              <button
                type="button"
                onClick={() => setUseCustomThresholds(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${useCustomThresholds ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-slate-50'}`}
              >
                Vlastní stupnice
              </button>
            </div>

            {useCustomThresholds && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-slate-200 animate-fade-in">
                {/* Známka 1 */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-primary block">Známka 1 (Výborně)</span>
                    <span className="text-[10px] text-muted-foreground block font-semibold mt-0.5">Rozmezí: od 100% do</span>
                  </div>
                  <div className="relative mt-3 flex items-center">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={threshold1}
                      onChange={(e) => setThreshold1(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                      className="h-10 text-sm font-bold text-center border-slate-300 focus:border-primary pr-6"
                    />
                    <span className="absolute right-2 text-xs font-bold text-gray-400">%</span>
                  </div>
                </div>

                {/* Známka 2 */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-primary block">Známka 2 (Chvalitebně)</span>
                    <span className="text-[10px] text-muted-foreground block font-semibold mt-0.5">Rozmezí: od {threshold1}% do</span>
                  </div>
                  <div className="relative mt-3 flex items-center">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={threshold2}
                      onChange={(e) => setThreshold2(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                      className="h-10 text-sm font-bold text-center border-slate-300 focus:border-primary pr-6"
                    />
                    <span className="absolute right-2 text-xs font-bold text-gray-400">%</span>
                  </div>
                </div>

                {/* Známka 3 */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-primary block">Známka 3 (Dobře)</span>
                    <span className="text-[10px] text-muted-foreground block font-semibold mt-0.5">Rozmezí: od {threshold2}% do</span>
                  </div>
                  <div className="relative mt-3 flex items-center">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={threshold3}
                      onChange={(e) => setThreshold3(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                      className="h-10 text-sm font-bold text-center border-slate-300 focus:border-primary pr-6"
                    />
                    <span className="absolute right-2 text-xs font-bold text-gray-400">%</span>
                  </div>
                </div>

                {/* Známka 4 */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-primary block">Známka 4 (Dostatečně)</span>
                    <span className="text-[10px] text-muted-foreground block font-semibold mt-0.5">Rozmezí: od {threshold3}% do</span>
                  </div>
                  <div className="relative mt-3 flex items-center">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={threshold4}
                      onChange={(e) => setThreshold4(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                      className="h-10 text-sm font-bold text-center border-slate-300 focus:border-primary pr-6"
                    />
                    <span className="absolute right-2 text-xs font-bold text-gray-400">%</span>
                  </div>
                </div>

                {/* Známka 5 */}
                <div className="bg-slate-100/50 p-3 rounded-xl border border-slate-200/60 flex flex-col justify-between select-none">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block">Známka 5 (Nedostatečně)</span>
                    <span className="text-[10px] text-muted-foreground block font-semibold mt-0.5">Rozmezí: od {threshold4}% do</span>
                  </div>
                  <div className="mt-3 flex items-center justify-center bg-slate-200/50 rounded-md border h-10 border-slate-200">
                    <span className="text-sm font-black text-muted-foreground">0 %</span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-5 text-[10px] text-muted-foreground mt-1 px-1">
                  💡 Mezní hodnoty musí sestupovat: Výborně &gt; Chvalitebně &gt; Dobře &gt; Dostatečně. 
                  Změnou předchozích hodnot se automaticky přepočítají a přizpůsobí začátky dalších rozsahů.
                </div>
              </div>
            )}
          </div>

          {fileUri && (
            <div className="p-4 bg-muted rounded-xl border border-dashed flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg"><BookOpen className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-sm font-bold">Dokument připraven ke sdílení</p>
                  <p className="text-xs text-muted-foreground">Velikost optimalizována pro cloudovou databázi.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFileUri(undefined)} disabled={isProcessing}><Trash2 className="w-4 h-4" /></Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-headline text-xl text-primary flex items-center gap-2 px-1">
          <Wand2 className="w-5 h-5 text-accent" /> Otázky a úkoly
        </h3>
        
        <div className="grid gap-4">
          {questions.map((q, index) => (
            <Card key={q.id} className="border-l-4 border-l-accent animate-fade-in group shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                       {q.type === 'short_answer' ? 'Krátká odp.' : 
                        q.type === 'long_answer' ? 'Dlouhá odp.' : 
                        q.type === 'multiple_choice' ? 'Výběr (A-D)' : 
                        q.type === 'axis' ? 'Osa X/Y' : 
                        q.type === 'number_line' ? 'Číselná osa' : 
                        q.type === 'true_false' ? 'Ano / Ne' : 
                        q.type === 'drawing' ? 'Kresba' : 
                        q.type === 'graph' ? 'Graf' : q.type}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-gray-50 border px-2 py-1 rounded-md">
                      <span className="font-semibold">Body:</span>
                      <input 
                        type="number" 
                        min="1" 
                        max="100" 
                        value={q.points || 1} 
                        onChange={e => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })}
                        className="w-12 h-5 bg-transparent border-none text-center font-bold text-primary focus:outline-none p-0"
                      />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <Input 
                  placeholder={`Zadejte otázku č. ${index + 1}`} 
                  value={q.text} 
                  onChange={e => updateQuestion(q.id, { text: e.target.value })}
                  className="font-medium border-none shadow-none focus-visible:ring-0 text-lg px-0"
                />
                
                {q.type === 'multiple_choice' && (
                  <div className="space-y-3 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options?.map((opt, i) => {
                        const isCorrect = q.correctAnswer === i;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <button
                              type="button"
                              title="Kliknutím označit jako správnou odpověď"
                              onClick={() => {
                                updateQuestion(q.id, { correctAnswer: isCorrect ? undefined : i });
                              }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                                isCorrect
                                  ? 'bg-green-500 text-white shadow-md scale-110 ring-2 ring-green-300'
                                  : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 hover:scale-105'
                              }`}
                            >
                              {String.fromCharCode(65 + i)}
                            </button>
                            <Input
                              placeholder={`Možnost ${i + 1}`}
                              value={opt}
                              onChange={e => {
                                const newOpts = [...(q.options || [])];
                                newOpts[i] = e.target.value;
                                updateQuestion(q.id, { options: newOpts });
                              }}
                              className={isCorrect ? 'border-green-400 focus-visible:ring-green-300' : ''}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                      Kliknutím na písmeno označíte správnou odpověď
                    </p>
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Správná odpověď:</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => updateQuestion(q.id, { correctAnswer: q.correctAnswer === true ? undefined : true })}
                        className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                          q.correctAnswer === true
                            ? 'bg-green-500 border-green-500 text-white shadow-md'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700'
                        }`}
                      >
                        ✓ Ano
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuestion(q.id, { correctAnswer: q.correctAnswer === false ? undefined : false })}
                        className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                          q.correctAnswer === false
                            ? 'bg-red-500 border-red-500 text-white shadow-md'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-700'
                        }`}
                      >
                        ✗ Ne
                      </button>
                    </div>
                    {q.correctAnswer === undefined && (
                      <p className="text-[10px] text-muted-foreground">Kliknutím vyberte správnou odpověď (volitelné)</p>
                    )}
                  </div>
                )}

                {q.type === 'graph' && (
                  <GraphQuestionCreator
                    question={q}
                    onChange={(updates) => updateQuestion(q.id, updates)}
                  />
                )}

                {q.type === 'axis' && (
                  <AxisQuestionCreator
                    question={q}
                    onChange={(updates) => updateQuestion(q.id, updates)}
                  />
                )}

                {q.type === 'number_line' && (
                  <NumberLineQuestionCreator
                    question={q}
                    onChange={(updates) => updateQuestion(q.id, updates)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-4 justify-center">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => addQuestion('short_answer')}>
            <Plus className="w-4 h-4 mr-2" /> Krátká odp.
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => addQuestion('long_answer')}>
            <Plus className="w-4 h-4 mr-2" /> Dlouhá odp.
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => addQuestion('multiple_choice')}>
            <Plus className="w-4 h-4 mr-2" /> Výběr (A-D)
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => addQuestion('axis')}>
            <BarChart4 className="w-4 h-4 mr-2" /> Osa X/Y
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => addQuestion('number_line')}>
            <BarChart4 className="w-4 h-4 mr-2" /> Číselná osa
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => addQuestion('true_false')}>
            <Plus className="w-4 h-4 mr-2" /> Ano / Ne
          </Button>
          <Button variant="secondary" size="sm" className="rounded-full bg-accent/10 text-accent hover:bg-accent/20" onClick={() => addQuestion('drawing')}>
            <PenTool className="w-4 h-4 mr-2" /> Kresba
          </Button>
          <Button variant="secondary" size="sm" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20" onClick={() => addQuestion('graph')}>
            <BarChart4 className="w-4 h-4 mr-2" /> Grafická otázka
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-end gap-3 pt-8 border-t">
        <Button size="lg" variant="outline" className="w-full md:w-auto px-10 h-14 text-lg font-headline text-gray-600 border-gray-300" onClick={handleSaveDraft} disabled={isProcessing}>
          💾 Uložit jako koncept
        </Button>
        <Button size="lg" className="w-full md:w-auto px-16 h-14 text-xl font-headline" onClick={handleSave} disabled={isProcessing}>
          Publikovat a uložit v cloudu
        </Button>
      </div>
    </div>
  );
}
