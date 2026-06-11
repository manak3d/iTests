'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const QuestionSchema = z.object({
  id: z.string().describe('Must match the original question id so we can associate it.'),
  type: z.string().describe('Must match the original question type.'),
  text: z.string().describe('The alternative question text (in Czech) of the same difficulty and type, with different numbers/variables/examples.'),
  options: z.array(z.string()).optional().describe('Updated options (in Czech) if type is multiple_choice or matching.'),
  correctAnswer: z.any().optional().describe('Updated correctAnswer value matching the new text/options.'),
  points: z.number().optional().describe('Should match the original question points.'),
  graphType: z.string().optional(),
  graphData: z.any().optional(),
  clozeText: z.string().optional().describe('The alternative Cloze template text using brackets if type is cloze.')
});

const GenerateAlternativeInputSchema = z.object({
  questionsJson: z.string().describe('Stringified JSON array of original questions to find alternatives for.')
});

const GenerateAlternativeOutputSchema = z.object({
  questions: z.array(QuestionSchema).optional().describe('The generated alternative questions.'),
  error: z.string().optional()
});

const prompt = ai.definePrompt({
  name: 'generateAlternativeQuestionsPrompt',
  input: { schema: GenerateAlternativeInputSchema },
  output: { schema: GenerateAlternativeOutputSchema },
  prompt: `You are an AI assistant specialized in creating parallel versions of educational tests (Group A / Group B).
Your task is to take a list of original test questions and generate a parallel/alternative question for each of them.

For each question in the input:
1. Preserve its "id" and "type" exactly as given.
2. Keep the difficulty level, subject, and topic identical to the original.
3. Change the specific numbers, names, variables, text examples, or multiple choice options so that students cannot simply copy the answers from the original group.
4. Update the "correctAnswer" and "options" fields to correspond to your new question.
5. If the type is "matching", each matching pair is formatted as "Left Part|Right Part" (e.g. "2+3|5"). Make sure to update them correctly.
6. If the type is "cloze", keep the instructions in "text", and generate a parallel/alternative template sentence with similar spelling traps (e.g. i/y, mě/mně) in "clozeText" using the exact same brackets format where the first option is correct.
7. Keep the "points" and "graphType" fields exactly the same as the original.
8. The language of all generated texts, options, and answers must be Czech.

Original Questions:
{{{questionsJson}}}

Please output the array of parallel questions matching the output schema.`,
});

export async function generateAlternativeAssignment(input: { questionsJson: string }): Promise<{ questions?: any[]; error?: string }> {
  try {
    const { output } = await prompt(input);
    return { questions: output?.questions };
  } catch (error: any) {
    console.error("Genkit Alternative Questions Generation Error:", error);
    return { error: error.message || 'Failed to generate alternative questions' };
  }
}
