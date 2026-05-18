
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileUp, Plus, Trash2, Wand2, Loader2, BookOpen, PenTool } from 'lucide-react';
import { Question, QuestionType, Assignment } from '@/lib/types';
import { digitizePdfContentForAssignment } from '@/ai/flows/digitize-pdf-content-for-assignment';
import { generateQuestionsFromExtractedText } from '@/ai/flows/generate-questions-from-extracted-text';
import { useToast } from '@/hooks/use-toast';

export function AssignmentCreator({ classId, onSave }: { classId: string; onSave: (a: Omit<Assignment, 'id'>) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [fileUri, setFileUri] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const compressImage = (dataUri: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Max dimensions for background documents to save space
        const MAX_WIDTH = 1000;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = dataUri;
    });
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      text: '',
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
        // Compress the image immediately to save localStorage quota
        const compressedUri = await compressImage(rawDataUri);
        setFileUri(compressedUri);
        
        toast({ title: "Zpracovávám dokument", description: "AI čte obsah souboru..." });
        const digitizeResult = await digitizePdfContentForAssignment({ fileDataUri: compressedUri });
        
        if (digitizeResult.error) {
          const isQuota = digitizeResult.error.includes('429') || digitizeResult.error.includes('RESOURCE_EXHAUSTED');
          toast({ 
            title: isQuota ? "AI limit vyčerpán" : "Chyba AI", 
            description: isQuota 
              ? "Dosáhli jste limitu bezplatných požadavků. Dokument byl nahrán, ale text a otázky musíte doplnit ručně."
              : digitizeResult.error,
            variant: "destructive" 
          });
          setIsProcessing(false);
          return;
        }

        if (digitizeResult.extractedText) {
          setDescription(digitizeResult.extractedText);
          
          toast({ title: "Generuji otázky", description: "AI navrhuje testové úlohy z textu..." });
          const aiQuestionsResult = await generateQuestionsFromExtractedText({ extractedText: digitizeResult.extractedText });
          
          if (aiQuestionsResult.error) {
            toast({ 
              title: "Otázky nebyly vygenerovány", 
              description: "Text byl úspěšně extrahován, ale otázky musíte vytvořit ručně.",
              variant: "default" 
            });
          } else if (aiQuestionsResult.questions) {
            const newQs: Question[] = aiQuestionsResult.questions.map((q: any) => ({
              id: Math.random().toString(36).substr(2, 9),
              type: q.type as QuestionType,
              text: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer ?? q.correctAnswerIndex,
            }));
            
            setQuestions(prev => [...prev, ...newQs]);
            toast({ title: "Hotovo!", description: "Práce byla úspěšně vytvořena pomocí AI." });
          }
        }
      } catch (error: any) {
        toast({ 
          title: "Chyba zpracování", 
          description: "Nepodařilo se automaticky zpracovat dokument.",
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
              <span>Nová práce z dokumentu</span>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <label className="cursor-pointer flex-1 md:flex-none">
                <div className="bg-white text-primary px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center hover:bg-gray-100 transition-colors h-10 min-w-[150px]">
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />}
                  Nahrát PDF / Foto
                </div>
                <input type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileUpload} disabled={isProcessing} />
              </label>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-primary uppercase">Název úkolu</label>
            <Input 
              placeholder="Např. Prověrka z historie: Baroko" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="h-12 text-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-primary uppercase">Výchozí text / Instrukce</label>
            <Textarea 
              placeholder="Zde se objeví extrahovaný text z dokumentu (nebo jej zadejte ručně)..." 
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
                  <p className="text-sm font-bold">Originální dokument připojen</p>
                  <p className="text-xs text-muted-foreground">Žáci do něj budou moci přímo psát.</p>
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
        
        {questions.length === 0 && (
          <div className="text-center py-12 bg-white/50 border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground italic">Zatím nebyly přidány žádné otázky.</p>
          </div>
        )}

        <div className="grid gap-4">
          {questions.map((q, index) => (
            <Card key={q.id} className="border-l-4 border-l-accent animate-fade-in group shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                    {q.type === 'drawing' ? 'Kresba / Ruční zápis' : q.type.replace('_', ' ')}
                  </span>
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
            <PenTool className="w-4 h-4 mr-2" /> Náčrt / Pero
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-8 border-t">
        <Button size="lg" className="w-full md:w-auto px-16 h-14 text-xl font-headline" onClick={handleSave} disabled={isProcessing}>
          Publikovat práci
        </Button>
      </div>
    </div>
  );
}
