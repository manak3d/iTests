
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileUp, Plus, Trash2, Wand2, Loader2, BookOpen, PenTool, Camera } from 'lucide-react';
import { Question, QuestionType, Assignment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function AssignmentCreator({ classId, onSave }: { classId: string; onSave: (a: Omit<Assignment, 'id'>) => void }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Matematika');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [fileUri, setFileUri] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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
    onSave({
      title,
      description,
      classId,
      subject,
      questions,
      fileUri,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
                      {q.type === 'drawing' ? 'Kresba' : q.type.replace('_', ' ')}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {q.options?.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">{String.fromCharCode(65 + i)}</div>
                        <Input 
                          placeholder={`Možnost ${i + 1}`} 
                          value={opt} 
                          onChange={e => {
                            const newOpts = [...(q.options || [])];
                            newOpts[i] = e.target.value;
                            updateQuestion(q.id, { options: newOpts });
                          }}
                        />
                      </div>
                    ))}
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
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => addQuestion('true_false')}>
            <Plus className="w-4 h-4 mr-2" /> Ano / Ne
          </Button>
          <Button variant="secondary" size="sm" className="rounded-full bg-accent/10 text-accent hover:bg-accent/20" onClick={() => addQuestion('drawing')}>
            <PenTool className="w-4 h-4 mr-2" /> Kresba
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-8 border-t">
        <Button size="lg" className="w-full md:w-auto px-16 h-14 text-xl font-headline" onClick={handleSave} disabled={isProcessing}>
          Publikovat a uložit v cloudu
        </Button>
      </div>
    </div>
  );
}
