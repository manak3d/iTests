'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const QuestionSchema = z.object({
  id: z.string(),
  type: z.string(),
  text: z.string(),
  points: z.number().optional(),
  correctAnswer: z.any().optional(),
});

const GradeSubmissionInputSchema = z.object({
  questions: z.array(QuestionSchema),
  answers: z.record(z.string(), z.any()),
  questionDrawings: z.record(z.string(), z.string()),
  mainWorkDrawing: z.string().optional(),
  gradeThresholds: z.array(z.number()).optional(), // [85, 65, 45, 25]
  customInstructions: z.string().optional(), // Specifické pokyny pro slovní hodnocení
});
export type GradeSubmissionInput = z.infer<typeof GradeSubmissionInputSchema>;

const GradeSubmissionOutputSchema = z.object({
  questionScores: z.record(z.string(), z.number()).describe('Doporučené body pro každé ID otázky.'),
  questionFeedback: z.record(z.string(), z.string()).describe('Krátká zpětná vazba k jednotlivým otázkám.'),
  suggestedGrade: z.number().int().min(1).max(5).describe('Navržená celková známka od 1 (nejlepší) do 5 (nejhorší).'),
  suggestedFeedback: z.string().describe('Celkové slovní hodnocení studenta v češtině.'),
});
export type GradeSubmissionOutput = z.infer<typeof GradeSubmissionOutputSchema>;

export async function gradeSubmissionFlow(input: GradeSubmissionInput): Promise<GradeSubmissionOutput | { error: string }> {
  try {
    const { questions, answers, questionDrawings, mainWorkDrawing, gradeThresholds, customInstructions } = input;

    let promptText = `Jste přísný, ale spravedlivý učitelský asistent, který opravuje a boduje studentské testy v češtině.
Zhodnoťte odpovědi studenta na základě zadání otázky a případné správné odpovědi.

U každé otázky navrhněte:
- Bodové hodnocení (0 až maximum bodů). Buďte spravedliví. Pokud je odpověď částečně správná, můžete udělit částečné body.
- Krátké zdůvodnění/zpětnou vazbu v češtině (proč byly body strženy nebo pochvalu za správnou odpověď).

Na konci navrhněte celkovou známku (1-5) na základě celkové úspěšnosti a následujících bodových hranic (pokud jsou k dispozici):
Prahové hodnoty úspěšnosti v % pro známky 1, 2, 3, 4: ${gradeThresholds ? JSON.stringify(gradeThresholds) : '[85, 65, 45, 25]'} (pokud student získá např. >=85%, navrhněte 1; >=65% navrhněte 2 atd.)
Přidejte celkové shrnutí a slovní hodnocení testu.

${customInstructions ? `DŮLEŽITÉ POKYNY OD UČITELE PRO SLOVNÍ HODNOCENÍ:
"${customInstructions}"
Při tvorbě celkového slovního hodnocení a tónu zpětné vazby se striktně řiďte těmito pokyny učitele.` : ''}

Zadání otázek a odpovědi studenta:
`;

    questions.forEach((q, idx) => {
      const ans = answers[q.id];
      const maxPts = q.points || 1;
      const correct = q.correctAnswer;
      const hasDrawing = !!questionDrawings[q.id];
      
      promptText += `\nOtázka ${idx + 1} (ID: ${q.id}):
- Typ: ${q.type}
- Text: "${q.text}"
- Maximální body: ${maxPts}
${correct !== undefined && correct !== null ? `- Správná odpověď: ${JSON.stringify(correct)}\n` : ''}- Odpověď studenta: ${ans !== undefined && ans !== null ? JSON.stringify(ans) : 'Neodpovězeno'}
${hasDrawing ? `- K otázce je přiložena kresba (viz připojený obrázek).\n` : ''}`;
    });

    if (mainWorkDrawing) {
      promptText += `\nK celému testu je přiložen hlavní pracovní list (viz připojený obrázek hlavního dokumentu). Zkontrolujte kresby studenta i na něm.`;
    }

    const promptParts: any[] = [{ text: promptText }];

    // Přidání obrázků k otázkám
    Object.entries(questionDrawings).forEach(([qId, dataUri]) => {
      if (dataUri && dataUri.startsWith('data:')) {
        promptParts.push({ text: `\n[Obrázek kresby k otázce s ID: ${qId}]` });
        promptParts.push({ media: { url: dataUri } });
      }
    });

    // Přidání hlavního dokumentu
    if (mainWorkDrawing && mainWorkDrawing.startsWith('data:')) {
      promptParts.push({ text: `\n[Hlavní vypracovaný pracovní list studenta]` });
      promptParts.push({ media: { url: mainWorkDrawing } });
    }

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: promptParts,
      output: { schema: GradeSubmissionOutputSchema }
    });

    if (!output) {
      throw new Error('AI nevrátilo žádný výstup.');
    }

    return output;
  } catch (error: any) {
    console.error("Genkit Grading Error:", error);
    return { error: error.message || 'Nepodařilo se ohodnotit práci pomocí AI' };
  }
}
