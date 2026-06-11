
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { parseClozeText } from '@/lib/utils';

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

  // AI Generator state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInputMode, setAiInputMode] = useState<'topic' | 'document'>('topic');
  const [aiTopic, setAiTopic] = useState('');
  const [aiNumMultipleChoice, setAiNumMultipleChoice] = useState('');
  const [aiNumTrueFalse, setAiNumTrueFalse] = useState('');
  const [aiNumShortAnswer, setAiNumShortAnswer] = useState('');
  const [aiNumCloze, setAiNumCloze] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDigitizing, setIsDigitizing] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [selectedGeneratedIds, setSelectedGeneratedIds] = useState<number[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [assignType, setAssignType] = useState<'all' | 'specific'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isPublicTemplate, setIsPublicTemplate] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number>(0);
  const [isPractice, setIsPractice] = useState(false);

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
      text: type === 'cloze' ? 'Doplňte chybějící slova nebo i/y:' : '',
      points: 1,
      options: type === 'multiple_choice' ? ['', '', '', ''] : (type === 'matching' ? ['|', '|', '|'] : undefined),
      correctAnswer: type === 'matching' ? { "0": 0, "1": 1, "2": 2 } : undefined,
      numPracticeQuestions: 0,
      useAiForPractice: false,
      practiceQuestions: [],
      clozeText: type === 'cloze' ? '' : undefined,
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

  const addAiQuestions = (qsToInsert: any[]) => {
    const newQuestions = qsToInsert.map(q => {
      let type: QuestionType = 'short_answer';
      if (q.type === 'multiple_choice') type = 'multiple_choice';
      else if (q.type === 'true_false') type = 'true_false';
      else if (q.type === 'matching') type = 'matching';
      else if (q.type === 'cloze') type = 'cloze';

      return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        text: q.questionText || '',
        clozeText: type === 'cloze' ? (q.clozeText || '') : undefined,
        points: 1,
        options: type === 'matching' ? q.options : (type === 'multiple_choice' ? q.options : undefined),
        correctAnswer: type === 'matching'
          ? (() => {
              const map: Record<string, number> = {};
              q.options?.forEach((_: any, idx: number) => { map[String(idx)] = idx; });
              return map;
            })()
          : (type === 'multiple_choice' ? q.correctAnswerIndex : (type === 'true_false' ? q.correctAnswer : undefined)),
        numPracticeQuestions: 0,
        useAiForPractice: false,
        practiceQuestions: []
      };
    });
    setQuestions([...questions, ...newQuestions]);
    setIsAiModalOpen(false);
    setGeneratedQuestions([]);
    toast({ title: "Otázky přidány", description: `Úspěšně přidáno ${newQuestions.length} otázek do testu.` });
  };

  const handleAiGenerate = async () => {
    setAiError(null);
    let textToUse = '';

    if (aiInputMode === 'document') {
      if (!fileUri) {
        setAiError('Chybí připojený soubor.');
        return;
      }
      setIsDigitizing(true);
      try {
        const digRes = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'digitize', fileDataUri: fileUri })
        });
        const digData = await digRes.json();
        if (!digRes.ok || !digData.success) {
          throw new Error(digData.error || 'Digitalizace selhala.');
        }
        textToUse = digData.extractedText || '';
        setDescription(textToUse); 
      } catch (err: any) {
        setAiError(err.message || 'Nepodařilo se digitalizovat dokument.');
        setIsDigitizing(false);
        return;
      }
      setIsDigitizing(false);
    }

    setIsGenerating(true);
    try {
      const genRes = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          extractedText: aiInputMode === 'document' ? textToUse : undefined,
          topic: aiTopic ? aiTopic : undefined,
          numMultipleChoice: aiNumMultipleChoice ? Number(aiNumMultipleChoice) : undefined,
          numTrueFalse: aiNumTrueFalse ? Number(aiNumTrueFalse) : undefined,
          numShortAnswer: aiNumShortAnswer ? Number(aiNumShortAnswer) : undefined,
          numCloze: aiNumCloze ? Number(aiNumCloze) : undefined
        })
      });
      const genData = await genRes.json();
      if (!genRes.ok || !genData.success) {
        throw new Error(genData.error || 'Generování otázek selhalo.');
      }
      const qs = genData.questions || [];
      if (qs.length === 0) {
        setAiError('Nebyla vygenerována žádná otázka. Zkuste to prosím znovu.');
      } else {
        setGeneratedQuestions(qs);
        setSelectedGeneratedIds(qs.map((_: any, idx: number) => idx));
      }
    } catch (err: any) {
      setAiError(err.message || 'Při generování otázek došlo k chybě.');
    } finally {
      setIsGenerating(false);
    }
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
      isPublicTemplate,
      timeLimit,
      isPractice
    });
  };

  const handleSaveDraft = () => {
    if (!title.trim()) {
      return toast({ title: "Chyba", description: "Zadejte název konceptu.", variant: "destructive" });
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
      isPublicTemplate,
      timeLimit,
      isPractice
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="space-y-2">
              <label className="text-sm font-bold text-primary uppercase">Typ úkolu</label>
              <select
                value={isPractice ? 'practice' : 'test'}
                onChange={e => setIsPractice(e.target.value === 'practice')}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="test">📝 Známkovaný test</option>
                <option value="practice">🏋️ Neznámkované procvičování</option>
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
              <h4 className="font-bold text-sm text-primary uppercase tracking-wider">⏱️ Časový limit a šablona</h4>
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
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Délka testu (v minutách, 0 = bez limitu):</label>
                  <Input 
                    type="number" 
                    min="0"
                    value={timeLimit} 
                    onChange={e => setTimeLimit(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input 
                    type="checkbox" 
                    id="isPublicTemplate"
                    checked={isPublicTemplate} 
                    onChange={e => setIsPublicTemplate(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="isPublicTemplate" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                    Povolit jako veřejnou šablonu pro ostatní učitele
                  </label>
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
          {!isPractice && (
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
          )}

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-1 gap-2 border-b pb-2">
          <h3 className="font-headline text-xl text-primary flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-accent" /> Otázky a úkoly
          </h3>
          <div className="bg-indigo-50 border border-indigo-150 rounded-xl px-3 py-1.5 text-xs text-indigo-700 font-semibold flex items-center gap-1.5 shadow-sm">
            <span>💡 Tip: Svislý zlomek zapíšete jako <strong>[čitatel/jmenovatel]</strong> (např. <code>[3/4]</code>).</span>
          </div>
        </div>
        
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
                        q.type === 'matching' ? 'Přiřazování' : 
                        q.type === 'axis' ? 'Osa X/Y' : 
                        q.type === 'number_line' ? 'Číselná osa' : 
                        q.type === 'true_false' ? 'Ano / Ne' : 
                        q.type === 'drawing' ? 'Kresba' : 
                        q.type === 'graph' ? 'Graf' : 
                        q.type === 'cloze' ? 'Doplňovačka' : q.type}
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

                {q.type === 'matching' && (
                  <div className="space-y-3 mt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Páry pro přiřazení (Levá strana | Pravá strana):</p>
                    <div className="space-y-2">
                      {(q.options || []).map((opt, i) => {
                        const [left, right] = opt.split('|');
                        return (
                          <div key={i} className="flex items-center gap-3 animate-fade-in">
                            <span className="text-xs font-bold text-slate-400 w-5">{i + 1}.</span>
                            <Input
                              placeholder="Levá část (např. 1/2)"
                              value={left || ''}
                              onChange={e => {
                                const newOpts = [...(q.options || [])];
                                const currentRight = (newOpts[i] || '').split('|')[1] || '';
                                newOpts[i] = `${e.target.value}|${currentRight}`;
                                const correctMap: Record<string, number> = {};
                                newOpts.forEach((_, idx) => { correctMap[String(idx)] = idx; });
                                updateQuestion(q.id, { options: newOpts, correctAnswer: correctMap });
                              }}
                              className="flex-1"
                            />
                            <span className="text-slate-400 font-bold">↔</span>
                            <Input
                              placeholder="Pravá část (např. 0,5)"
                              value={right || ''}
                              onChange={e => {
                                const newOpts = [...(q.options || [])];
                                const currentLeft = (newOpts[i] || '').split('|')[0] || '';
                                newOpts[i] = `${currentLeft}|${e.target.value}`;
                                const correctMap: Record<string, number> = {};
                                newOpts.forEach((_, idx) => { correctMap[String(idx)] = idx; });
                                updateQuestion(q.id, { options: newOpts, correctAnswer: correctMap });
                              }}
                              className="flex-1"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                const newOpts = (q.options || []).filter((_, idx) => idx !== i);
                                const correctMap: Record<string, number> = {};
                                newOpts.forEach((_, idx) => { correctMap[String(idx)] = idx; });
                                updateQuestion(q.id, { options: newOpts, correctAnswer: correctMap });
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 rounded-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs font-bold"
                        onClick={() => {
                          const newOpts = [...(q.options || []), '|'];
                          const correctMap: Record<string, number> = {};
                          newOpts.forEach((_, idx) => { correctMap[String(idx)] = idx; });
                          updateQuestion(q.id, { options: newOpts, correctAnswer: correctMap });
                        }}
                      >
                        + Přidat pár
                      </Button>
                    </div>
                  </div>
                )}

                {q.type === 'cloze' && (
                  <div className="space-y-3 mt-4 text-left">
                    <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 text-xs text-indigo-950 leading-relaxed shadow-sm space-y-2">
                      <p className="font-bold flex items-center gap-1">
                        <span>💡 Jak psát doplňovací text?</span>
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-indigo-900/95">
                        <li><strong>Výběr z možností (dropdown)</strong>: Zadejte možnosti oddělené lomítkem v hranatých závorkách, např. <code>[s/z]</code> nebo <code>[mě/mně]</code>. <strong>První možnost je vždy považována za správnou</strong> (žákům se zobrazí v zamíchaném pořadí).</li>
                        <li><strong>Vypisovací pole (input)</strong>: Zadejte pouze jedno slovo bez lomítek v hranatých závorkách, např. <code>[Praha]</code> nebo <code>[vlk]</code>. Žák bude muset slovo přesně vypsat.</li>
                        <li>Příklad: <code>Viděl jsem na mýtě v[y/i]sokého v[y/i]ra. Hlavním městem ČR je [Praha].</code></li>
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Doplňovaný text (šablona):</label>
                      <Textarea
                        placeholder="Zadejte text s doplňovacími poli..."
                        value={q.clozeText || ''}
                        onChange={e => updateQuestion(q.id, { clozeText: e.target.value })}
                        className="min-h-[120px] text-base focus-visible:ring-indigo-500 font-medium"
                      />
                    </div>

                    {q.clozeText && (
                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Náhled doplňovačky pro žáky:</label>
                        <div className="p-4 bg-white rounded-xl border border-slate-200 leading-relaxed text-slate-800 font-medium text-sm">
                          {(() => {
                            const parts = parseClozeText(q.clozeText || '');
                            if (parts.length === 0) {
                              return <span className="italic text-gray-400 text-xs">Text zatím neobsahuje žádné doplňovací závorky.</span>;
                            }
                            return parts.map((part, i) => {
                              if (part.type === 'text') {
                                return <span key={i}>{part.text}</span>;
                              } else if (part.type === 'dropdown') {
                                return (
                                  <select
                                    key={i}
                                    disabled
                                    className="mx-1 h-7 rounded bg-slate-50 border border-slate-300 px-1 text-xs font-bold text-indigo-700"
                                  >
                                    <option>{part.correctAnswer} (správně)</option>
                                    {part.options?.slice(1).map((opt, optIdx) => (
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
                                    className="mx-1 h-7 rounded bg-green-50 border border-green-300 px-1 text-xs font-bold text-green-700 text-center"
                                  />
                                );
                              }
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isPractice && (
                  <div className="mt-4 pt-4 border-t border-dashed border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide">🏋️ Procvičování: Otázky navíc při chybě</h5>
                        <p className="text-[10px] text-muted-foreground">Pokud žák odpoví na tuto otázku špatně, dostane procvičovací úlohy navíc.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">Počet úloh navíc:</span>
                        <select
                          value={q.numPracticeQuestions || 0}
                          onChange={e => updateQuestion(q.id, { numPracticeQuestions: Number(e.target.value) })}
                          className="flex h-8 w-24 rounded-lg border border-input bg-white px-2 py-0.5 text-xs font-bold focus:outline-none"
                        >
                          <option value={0}>0 (vypnuto)</option>
                          <option value={1}>1 úloha</option>
                          <option value={2}>2 úlohy</option>
                          <option value={3}>3 úlohy</option>
                        </select>
                      </div>
                    </div>

                    {(q.numPracticeQuestions || 0) > 0 && (
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-3 animate-fade-in text-left">
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`practice-source-${q.id}`}
                              checked={!q.useAiForPractice}
                              onChange={() => updateQuestion(q.id, { useAiForPractice: false })}
                              className="rounded-full border-gray-300 text-primary h-3.5 w-3.5"
                            />
                            <span>Učitelem předpřipravené úlohy</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`practice-source-${q.id}`}
                              checked={!!q.useAiForPractice}
                              onChange={() => updateQuestion(q.id, { useAiForPractice: true })}
                              className="rounded-full border-gray-300 text-primary h-3.5 w-3.5"
                            />
                            <span>Generovat automaticky pomocí AI</span>
                          </label>
                        </div>

                        {!q.useAiForPractice && (
                          <div className="space-y-3 pt-2">
                            <div className="space-y-2">
                              {(q.practiceQuestions || []).map((pq, pIdx) => (
                                <div key={pq.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-indigo-600">Úloha navíc #{pIdx + 1}</span>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => {
                                        const newPqs = (q.practiceQuestions || []).filter(item => item.id !== pq.id);
                                        updateQuestion(q.id, { practiceQuestions: newPqs });
                                      }}
                                      className="text-red-500 hover:text-red-700 h-6 w-6 rounded-full"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                  <div className="flex gap-2">
                                    <select
                                      value={pq.type}
                                      onChange={e => {
                                        const newPqs = [...(q.practiceQuestions || [])];
                                        const newType = e.target.value as QuestionType;
                                        newPqs[pIdx] = {
                                          ...pq,
                                          type: newType,
                                          options: newType === 'multiple_choice' ? ['', '', '', ''] : undefined,
                                          correctAnswer: undefined
                                        };
                                        updateQuestion(q.id, { practiceQuestions: newPqs });
                                      }}
                                      className="flex h-9 rounded-lg border border-input bg-white px-2 py-1 text-xs font-semibold"
                                    >
                                      <option value="short_answer">Krátká odpověď</option>
                                      <option value="multiple_choice">Výběr z možností</option>
                                      <option value="true_false">Ano / Ne</option>
                                    </select>
                                    <Input
                                      placeholder="Zadání otázky navíc..."
                                      value={pq.text}
                                      onChange={e => {
                                        const newPqs = [...(q.practiceQuestions || [])];
                                        newPqs[pIdx] = { ...pq, text: e.target.value };
                                        updateQuestion(q.id, { practiceQuestions: newPqs });
                                      }}
                                      className="h-9 text-xs"
                                    />
                                    {pq.type === 'short_answer' && (
                                      <div className="flex items-center gap-2 mt-1 pl-1">
                                        <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">Správná odpověď:</span>
                                        <Input
                                          placeholder="Zadejte správnou odpověď..."
                                          value={pq.correctAnswer || ''}
                                          onChange={e => {
                                            const newPqs = [...(q.practiceQuestions || [])];
                                            newPqs[pIdx] = { ...pq, correctAnswer: e.target.value };
                                            updateQuestion(q.id, { practiceQuestions: newPqs });
                                          }}
                                          className="h-8 text-[11px] flex-1"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {pq.type === 'multiple_choice' && (
                                    <div className="grid grid-cols-2 gap-2 mt-2 pl-2">
                                      {(pq.options || []).map((pOpt, pOptIdx) => {
                                        const isCorrect = pq.correctAnswer === pOptIdx;
                                        return (
                                          <div key={pOptIdx} className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newPqs = [...(q.practiceQuestions || [])];
                                                newPqs[pIdx] = { ...pq, correctAnswer: isCorrect ? undefined : pOptIdx };
                                                updateQuestion(q.id, { practiceQuestions: newPqs });
                                              }}
                                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isCorrect ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                                            >
                                              {String.fromCharCode(65 + pOptIdx)}
                                            </button>
                                            <Input
                                              placeholder={`Možnost ${pOptIdx + 1}`}
                                              value={pOpt}
                                              onChange={e => {
                                                const newPqs = [...(q.practiceQuestions || [])];
                                                const newOpts = [...(pq.options || [])];
                                                newOpts[pOptIdx] = e.target.value;
                                                newPqs[pIdx] = { ...pq, options: newOpts };
                                                updateQuestion(q.id, { practiceQuestions: newPqs });
                                              }}
                                              className="h-8 text-[11px]"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {pq.type === 'true_false' && (
                                    <div className="flex gap-2 mt-2 pl-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newPqs = [...(q.practiceQuestions || [])];
                                          newPqs[pIdx] = { ...pq, correctAnswer: pq.correctAnswer === true ? undefined : true };
                                          updateQuestion(q.id, { practiceQuestions: newPqs });
                                        }}
                                        className={`flex-1 py-1 rounded-lg text-xs font-semibold border ${pq.correctAnswer === true ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600'}`}
                                      >✓ Ano</button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newPqs = [...(q.practiceQuestions || [])];
                                          newPqs[pIdx] = { ...pq, correctAnswer: pq.correctAnswer === false ? undefined : false };
                                          updateQuestion(q.id, { practiceQuestions: newPqs });
                                        }}
                                        className={`flex-1 py-1 rounded-lg text-xs font-semibold border ${pq.correctAnswer === false ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600'}`}
                                      >✗ Ne</button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {(q.practiceQuestions || []).length < (q.numPracticeQuestions || 0) && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs"
                                onClick={() => {
                                  const newPqs = [...(q.practiceQuestions || []), {
                                    id: Math.random().toString(36).substr(2, 9),
                                    type: 'short_answer' as QuestionType,
                                    text: '',
                                    points: 0
                                  }];
                                  updateQuestion(q.id, { practiceQuestions: newPqs });
                                }}
                              >
                                + Přidat otázku navíc
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => addQuestion('matching')}>
            <Plus className="w-4 h-4 mr-2" /> Přiřazování
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
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => addQuestion('cloze')}>
            <Plus className="w-4 h-4 mr-2" /> Doplňovačka
          </Button>
          <Button variant="secondary" size="sm" className="rounded-full bg-accent/10 text-accent hover:bg-accent/20" onClick={() => addQuestion('drawing')}>
            <PenTool className="w-4 h-4 mr-2" /> Kresba
          </Button>
          <Button variant="secondary" size="sm" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20" onClick={() => addQuestion('graph')}>
            <BarChart4 className="w-4 h-4 mr-2" /> Grafická otázka
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-md hover:opacity-95" 
            onClick={() => {
              setGeneratedQuestions([]);
              setSelectedGeneratedIds([]);
              setAiTopic('');
              setAiNumMultipleChoice('');
              setAiNumTrueFalse('');
              setAiNumShortAnswer('');
              setAiError(null);
              setIsAiModalOpen(true);
            }}
          >
            <Wand2 className="w-4 h-4 mr-2" /> Generovat pomocí AI
          </Button>
        </div>
      </div>

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border-none shadow-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-violet-600 animate-pulse" />
              <span>AI Generátor Otázek</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Vytvořte sadu testových otázek během několika sekund za použití umělé inteligence Gemini.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            {/* Input Mode Tabs */}
            <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setAiInputMode('topic')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  aiInputMode === 'topic' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:bg-white/50'
                }`}
              >
                📝 Z tématu
              </button>
              <button
                type="button"
                onClick={() => setAiInputMode('document')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  aiInputMode === 'document' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:bg-white/50'
                }`}
              >
                📸 Z vyfoceného textu / souboru
              </button>
            </div>

            {/* TAB 1: TOPIC */}
            {aiInputMode === 'topic' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Téma, oblast učiva nebo klíčová slova
                  </label>
                  <Textarea
                    placeholder="Např. Pythagorova věta, bitva u Stalingradu, fotosyntéza, vyjmenovaná slova..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="min-h-[100px] text-base rounded-xl focus-visible:ring-violet-500"
                  />
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-50 p-2 rounded-xl border border-slate-200 mt-1">
                    <span>💡 Tip: Můžete zadávat i témata obsahující zlomky, např. <code>vytvoř příklady se zlomky jako [3/4] nebo [1/2]</code>.</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                    Počet otázek jednotlivých typů (nepovinné)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Výběr z možností</span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="např. 3"
                        value={aiNumMultipleChoice}
                        onChange={(e) => setAiNumMultipleChoice(e.target.value)}
                        className="rounded-xl text-sm text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pravda / Nepravda</span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="např. 2"
                        value={aiNumTrueFalse}
                        onChange={(e) => setAiNumTrueFalse(e.target.value)}
                        className="rounded-xl text-sm text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Krátká odpověď</span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="např. 1"
                        value={aiNumShortAnswer}
                        onChange={(e) => setAiNumShortAnswer(e.target.value)}
                        className="rounded-xl text-sm text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Doplňovačka</span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="např. 2"
                        value={aiNumCloze}
                        onChange={(e) => setAiNumCloze(e.target.value)}
                        className="rounded-xl text-sm text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DOCUMENT */}
            {aiInputMode === 'document' && (
              <div className="space-y-4">
                {fileUri ? (
                  <div className="bg-slate-50 p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-20 h-20 bg-gray-200 border rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img src={fileUri} alt="Dokument" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <p className="text-sm font-bold text-gray-800">Připojený dokument k úkolu</p>
                      <p className="text-xs text-gray-400">Tento soubor/fotka bude odeslán do AI k OCR přepisu a tvorbě otázek.</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFileUri(undefined)}
                      className="text-destructive hover:bg-destructive/5 rounded-lg border-dashed flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Odebrat
                    </Button>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50">
                    <div className="p-3 bg-violet-50 rounded-full text-violet-600">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-700">Žádaný dokument nebyl vyfocen ani nahrán</p>
                      <p className="text-xs text-gray-400 max-w-sm">Pro vygenerování otázek z dokumentu jej nejprve vyfoťte mobilem nebo nahrajte na hlavní kartě nebo zde.</p>
                    </div>
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <div className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-gray-50 transition-colors h-10">
                          <FileUp className="w-4 h-4 mr-2 text-gray-500" /> Nahrát soubor
                        </div>
                        <input type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileUpload} />
                      </label>
                      <label className="cursor-pointer">
                        <div className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center hover:bg-gray-50 transition-colors h-10">
                          <Camera className="w-4 h-4 mr-2 text-gray-500" /> Vyfotit mobilním
                        </div>
                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
                      </label>
                    </div>
                  </div>
                )}

                {/* Upřesnění tématu / instrukce k dokumentu */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <span>💡 Upřesnění tématu / instrukce k dokumentu (nepovinné)</span>
                  </label>
                  <Textarea
                    placeholder="Např. zaměř se pouze na zlomky, vytvoř spíše těžší příklady, přidej více slovních úloh..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="min-h-[80px] text-sm rounded-xl focus-visible:ring-violet-500"
                  />
                </div>
              </div>
            )}

            {/* ERROR DISPLAY */}
            {aiError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span>⚠️ {aiError}</span>
              </div>
            )}

            {/* PREVIEW OF GENERATED QUESTIONS */}
            {generatedQuestions.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Vygenerované otázky ({generatedQuestions.length}):
                </label>
                <div className="space-y-3 max-h-[300px] overflow-y-auto border rounded-xl p-3 bg-slate-50/50">
                  {generatedQuestions.map((q, idx) => {
                    const isSelected = selectedGeneratedIds.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border bg-white transition-all flex items-start gap-3 ${
                          isSelected ? 'border-violet-500 shadow-sm ring-1 ring-violet-500/30' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedGeneratedIds(prev => prev.filter(id => id !== idx));
                            } else {
                              setSelectedGeneratedIds(prev => [...prev, idx]);
                            }
                          }}
                          className="mt-1 rounded text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-100 text-violet-700">
                              {q.type === 'short_answer' ? 'Krátká odpověď' :
                               q.type === 'multiple_choice' ? 'Výběr z možností' :
                               q.type === 'true_false' ? 'Ano/Ne' :
                               q.type === 'cloze' ? 'Doplňovačka' : q.type}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-800">{q.questionText}</p>
                          {q.type === 'multiple_choice' && q.options && (
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              {q.options.map((opt: string, oIdx: number) => (
                                <div
                                  key={oIdx}
                                  className={`text-xs p-1.5 rounded-lg border font-medium ${
                                    q.correctAnswerIndex === oIdx
                                      ? 'bg-green-50 border-green-200 text-green-700 font-bold'
                                      : 'bg-gray-50 border-gray-100 text-gray-500'
                                  }`}
                                >
                                  <span className="font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.type === 'true_false' && (
                            <p className="text-xs font-semibold text-gray-500">
                              Správná odpověď: <span className="font-bold text-violet-600">{q.correctAnswer ? 'Ano' : 'Ne'}</span>
                            </p>
                          )}
                          {q.type === 'cloze' && q.clozeText && (
                            <p className="text-xs font-semibold text-gray-500 italic bg-gray-50 border p-2 rounded-lg">
                              Šablona: <span className="font-medium text-slate-700">{q.clozeText}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            {generatedQuestions.length > 0 ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedQuestions([]);
                    setSelectedGeneratedIds([]);
                  }}
                  className="rounded-xl"
                >
                  Zrušit a začít znovu
                </Button>
                <Button
                  onClick={() => {
                    const qsToInsert = generatedQuestions.filter((_, idx) => selectedGeneratedIds.includes(idx));
                    addAiQuestions(qsToInsert);
                  }}
                  disabled={selectedGeneratedIds.length === 0}
                  className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold px-6"
                >
                  Přidat vybrané ({selectedGeneratedIds.length}) do testu
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setIsAiModalOpen(false)}
                  className="rounded-xl"
                >
                  Zavřít
                </Button>
                <Button
                  onClick={handleAiGenerate}
                  disabled={
                    isGenerating ||
                    isDigitizing ||
                    (aiInputMode === 'topic' && !aiTopic.trim()) ||
                    (aiInputMode === 'document' && !fileUri)
                  }
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl font-bold px-8 shadow-md"
                >
                  {isGenerating || isDigitizing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isDigitizing ? 'Přepisování textu...' : 'Generování otázek...'}
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Vygenerovat otázky
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
