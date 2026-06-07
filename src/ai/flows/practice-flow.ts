import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PracticeQuestionSchema = z.object({
  type: z.enum(['short_answer', 'multiple_choice', 'true_false']),
  text: z.string().describe('The generated practice question text in Czech.'),
  options: z.array(z.string()).optional().describe('Options for multiple_choice. Must contain exactly 4 options.'),
  correctAnswer: z.any().describe('The correct answer: index for multiple_choice, boolean for true_false, string for short_answer.'),
  explanation: z.string().describe('Detailed step-by-step explanation of the correct solution in Czech.')
});

const PracticeFlowInputSchema = z.object({
  questionText: z.string(),
  numQuestions: z.number().int().min(1).max(3),
});

const PracticeFlowOutputSchema = z.object({
  theoryExplanation: z.string().describe('Brief explanation in Czech of the concept tested in the original question, pointing out common pitfalls.'),
  questions: z.array(PracticeQuestionSchema).describe('Tailored practice questions.'),
});

export type PracticeFlowInput = z.infer<typeof PracticeFlowInputSchema>;
export type PracticeFlowOutput = z.infer<typeof PracticeFlowOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generatePracticePrompt',
  input: { schema: PracticeFlowInputSchema },
  output: { schema: PracticeFlowOutputSchema },
  prompt: `Jste zkušený učitel matematiky a dalších předmětů. Žák odpověděl chybně na následující otázku:
Otázka: "{{{questionText}}}"

Vaším úkolem je:
1. Poskytnout stručné, přehledné a motivující vysvětlení teorie k tomuto typu úlohy v češtině. Pomozte žákovi pochopit podstatu problému a ukažte, na co si dát pozor.
2. Vygenerovat přesně {{numQuestions}} nových, podobných procvičovacích úloh v češtině. Tyto úlohy by měly přímo procvičovat stejný koncept.
3. Pro každou úlohu poskytněte správnou odpověď a podrobné vysvětlení správného postupu řešení krok za krokem v češtině.

Ujistěte se, že všechny texty, vysvětlení a otázky jsou v češtině.`,
});

export async function practiceFlow(input: PracticeFlowInput): Promise<PracticeFlowOutput | { error: string }> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error('AI nevrátilo žádný výstup.');
    return output;
  } catch (error: any) {
    console.error("Genkit Practice Flow Error:", error);
    return { error: error.message || 'Failed to generate practice content' };
  }
}
