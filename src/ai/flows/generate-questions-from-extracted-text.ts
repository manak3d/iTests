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

const GenerateQuestionsInputSchema = z.object({
  extractedText: z.string().optional().describe('The text extracted from a document, used to generate questions.'),
  topic: z.string().optional().describe('The topic to generate questions from directly.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(z.union([
    ShortAnswerQuestionSchema,
    MultipleChoiceQuestionSchema,
    TrueFalseQuestionSchema,
  ])).optional().describe('An array of generated comprehension questions of various types.'),
  error: z.string().optional().describe('Error message if the generation failed.'),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateQuestionsPrompt',
  input: { schema: GenerateQuestionsInputSchema },
  output: { schema: GenerateQuestionsOutputSchema },
  prompt: `You are an AI assistant specialized in creating engaging and diverse comprehension questions for educational purposes.
Based on the provided text or topic, generate a set of questions including short answer, multiple choice, and true/false.
Ensure the questions are relevant and cover key information.

The language of all generated questions, options, and answers must be Czech.

Here is the input context:
{{#if extractedText}}
Extracted Text:
{{{extractedText}}}
{{/if}}
{{#if topic}}
Topic / Topics:
{{{topic}}}
{{/if}}

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

Make sure to provide at least one question of each type if possible, and a variety of questions overall to test comprehension comprehensively.`,
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
