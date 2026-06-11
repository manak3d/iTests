'use server';
/**
 * @fileOverview A Genkit flow for generating various types of comprehension questions from provided text.
 *
 * - generateQuestionsFromExtractedText - A function that generates comprehension questions.
 * - GenerateQuestionsInput - The input type for the generateQuestionsFromExtractedText function.
 * - GenerateQuestionsOutput - The return type for the generateQuestionsFromExtractedText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ShortAnswerQuestionSchema = z.object({
  type: z.literal('short_answer'),
  questionText: z.string().describe('The short answer question.'),
});

const MultipleChoiceQuestionSchema = z.object({
  type: z.literal('multiple_choice'),
  questionText: z.string().describe('The multiple choice question.'),
  options: z.array(z.string()).describe('An array of possible answer options.'),
  correctAnswerIndex: z.number().int().describe('The 0-based index of the correct option in the options array.'),
});

const TrueFalseQuestionSchema = z.object({
  type: z.literal('true_false'),
  questionText: z.string().describe('The true/false question.'),
  correctAnswer: z.boolean().describe('The correct answer for the true/false question (true or false).'),
});

const MatchingQuestionSchema = z.object({
  type: z.literal('matching'),
  questionText: z.string().describe('The matching question instruction in Czech.'),
  options: z.array(z.string()).describe('An array of matching pairs formatted as "Left Part|Right Part", e.g. "1/2|0.5".'),
});

const ClozeQuestionSchema = z.object({
  type: z.literal('cloze'),
  questionText: z.string().describe('The Cloze question title/instruction, e.g. "Doplňte chybějící slova nebo i/y:".'),
  clozeText: z.string().describe('The Cloze template text using square brackets for answers, e.g., "Když jsem [šel/šly] do lesa, potkal jsem [vlk/medvěd].". Note: First option inside the bracket is the correct one, or a single word if it is an input field.'),
});

const GenerateQuestionsInputSchema = z.object({
  extractedText: z.string().optional().describe('The text extracted from a document, used to generate questions.'),
  topic: z.string().optional().describe('The topic to generate questions from directly.'),
  numMultipleChoice: z.number().optional().describe('Number of multiple choice questions to generate.'),
  numTrueFalse: z.number().optional().describe('Number of true/false questions to generate.'),
  numShortAnswer: z.number().optional().describe('Number of short answer questions to generate.'),
  numCloze: z.number().optional().describe('Number of cloze questions to generate.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(z.union([
    ShortAnswerQuestionSchema,
    MultipleChoiceQuestionSchema,
    TrueFalseQuestionSchema,
    MatchingQuestionSchema,
    ClozeQuestionSchema,
  ])).optional().describe('An array of generated comprehension questions of various types.'),
  error: z.string().optional().describe('Error message if the generation failed.'),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateQuestionsPrompt',
  input: { schema: GenerateQuestionsInputSchema },
  output: { schema: GenerateQuestionsOutputSchema },
  prompt: `You are an AI assistant specialized in creating engaging and diverse comprehension questions for educational purposes.
Based on the provided text or topic, generate a set of questions including short answer, multiple choice, true/false, matching, and cloze (doplňovačky).
Ensure the questions are relevant and cover key information.

The language of all generated questions, options, and answers must be Czech.

Here is the input context:
{{#if extractedText}}
Extracted Text:
{{{extractedText}}}
{{/if}}
{{#if topic}}
Topic / Topics / Keywords / Instructions:
{{{topic}}}
{{/if}}

Please generate exactly the following number of questions for each type if specified:
- Multiple Choice: {{#if numMultipleChoice}}{{numMultipleChoice}}{{else}}at least 1{{/if}}
- True/False: {{#if numTrueFalse}}{{numTrueFalse}}{{else}}at least 1{{/if}}
- Short Answer: {{#if numShortAnswer}}{{numShortAnswer}}{{else}}at least 1{{/if}}
- Cloze (Doplňovačky): {{#if numCloze}}{{numCloze}}{{else}}at least 1{{/if}}

Please output a JSON array of questions, adhering to the following schema for each question type:

Short Answer:
{
  "type": "short_answer",
  "questionText": "..."
}

Multiple Choice:
{
  "type": "multiple_choice",
  "questionText": "...",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswerIndex": 0
}

True/False:
{
  "type": "true_false",
  "questionText": "...",
  "correctAnswer": true
}

Matching (Přiřazování):
{
  "type": "matching",
  "questionText": "Přiřaďte správné dvojice.",
  "options": ["Zlomek 1/2|0.5", "Zlomek 1/4|0.25", "Zlomek 3/4|0.75"]
}

Cloze (Doplňovačka):
{
  "type": "cloze",
  "questionText": "Doplňte chybějící slova nebo i/y:",
  "clozeText": "Na mýtě stál starý m[y/i]livec, který chytal m[y/i]ši. Hlavním městem ČR je [Praha]."
}
Note on Cloze:
- Use dropdown format [correct/incorrect1/incorrect2] (where the first option inside the bracket is the correct one).
- Use input format [correct_word] (single word, no slashes, case-insensitive check).
- You MUST provide the instructions/title in "questionText" and the template text with brackets in "clozeText". Do NOT put the template text in "questionText".

Ensure the questions cover the topic/context comprehensively.`,
});

export async function generateQuestionsFromExtractedText(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  try {
    const { output } = await prompt(input);
    return { questions: output?.questions };
  } catch (error: any) {
    console.error("Genkit Question Generation Error:", error);
    return { error: error.message || 'Failed to generate questions' };
  }
}
