"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileUp, Plus, Trash2, Wand2, Loader2 } from 'lucide-react';
import { Question, QuestionType, Assignment } from '@/lib/types';
import { digitizePdfContentForAssignment } from '@/ai/flows/digitize-pdf-content-for-assignment';
import { generateQuestionsFromExtractedText } from '@/ai/flows/generate-questions-from-extracted-text';
import { useToast } from '@/hooks/use-toast';

export function AssignmentCreator({ classId, onSave }: { classId: string; onSave: (a: Omit<Assignment, 'id'>) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isDigitizing, setIsDigitizing] = useState(false);
  const { toast } = useToast();

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

    setIsDigitizing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUri = event.target?.result as string;
        const result = await digitizePdfContentForAssignment({ pdfDataUri: dataUri });
        setDescription(prev => prev + "\n\nExtracted from PDF:\n" + result.extractedText);
        
        // Optional: Generate questions automatically
        const aiQuestions = await generateQuestionsFromExtractedText({ extractedText: result.extractedText });
        const newQs: Question[] = aiQuestions.questions.map((q: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          type: q.type,
          text: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer ?? q.correctAnswerIndex,
        }));
        setQuestions([...questions, ...newQs]);
        
        toast({ title: "PDF Digitized", description: "Text and questions generated successfully." });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Digitization Failed", variant: "destructive" });
    } finally {
      setIsDigitizing(false);
    }
  };

  const handleSave = () => {
    if (!title) return toast({ title: "Title is required", variant: "destructive" });
    onSave({
      title,
      description,
      classId,
      questions,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md">
        <CardHeader className="bg-primary text-white rounded-t-lg">
          <CardTitle className="font-headline text-2xl flex items-center justify-between">
            <span>Create New Assignment</span>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <Button variant="secondary" size="sm" asChild disabled={isDigitizing}>
                  <span>
                    {isDigitizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />}
                    Upload PDF Digitizer
                  </span>
                </Button>
                <input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} />
              </label>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Title</label>
            <Input placeholder="Enter assignment title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Instructions</label>
            <Textarea 
              placeholder="Provide background info or instructions..." 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-headline text-xl text-primary flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-accent" /> Questions
        </h3>
        
        {questions.map((q, index) => (
          <Card key={q.id} className="border-l-4 border-l-accent animate-fade-in">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase text-accent">{q.type.replace('_', ' ')}</span>
                <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <Input 
                placeholder={`Question ${index + 1}`} 
                value={q.text} 
                onChange={e => updateQuestion(q.id, { text: e.target.value })} 
              />
              {q.type === 'multiple_choice' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {q.options?.map((opt, i) => (
                    <Input 
                      key={i} 
                      placeholder={`Option ${i + 1}`} 
                      value={opt} 
                      onChange={e => {
                        const newOpts = [...(q.options || [])];
                        newOpts[i] = e.target.value;
                        updateQuestion(q.id, { options: newOpts });
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => addQuestion('short_answer')}>
            <Plus className="w-4 h-4 mr-2" /> Short Answer
          </Button>
          <Button variant="outline" size="sm" onClick={() => addQuestion('long_answer')}>
            <Plus className="w-4 h-4 mr-2" /> Long Answer
          </Button>
          <Button variant="outline" size="sm" onClick={() => addQuestion('multiple_choice')}>
            <Plus className="w-4 h-4 mr-2" /> Multiple Choice
          </Button>
          <Button variant="outline" size="sm" onClick={() => addQuestion('true_false')}>
            <Plus className="w-4 h-4 mr-2" /> True/False
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button size="lg" className="w-full md:w-auto px-12" onClick={handleSave}>
          Create Assignment
        </Button>
      </div>
    </div>
  );
}