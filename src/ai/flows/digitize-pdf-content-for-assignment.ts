'use server';
/**
 * @fileOverview A Genkit flow to extract editable text content from a PDF or Image document.
 *
 * - digitizePdfContentForAssignment - A function that handles the document digitization process.
 * - DigitizePdfContentForAssignmentInput - The input type for the digitizePdfContentForAssignment function.
 * - DigitizePdfContentForAssignmentOutput - The return type for the digitizePdfContentForAssignment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const DigitizePdfContentForAssignmentInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A PDF document or Image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DigitizePdfContentForAssignmentInput = z.infer<typeof DigitizePdfContentForAssignmentInputSchema>;

const DigitizePdfContentForAssignmentOutputSchema = z.object({
  extractedText: z.string().optional().describe('The extracted text content from the document.'),
  error: z.string().optional().describe('Error message if the processing failed.'),
});
export type DigitizePdfContentForAssignmentOutput = z.infer<typeof DigitizePdfContentForAssignmentOutputSchema>;

const prompt = ai.definePrompt({
  name: 'digitizePdfContentForAssignmentPrompt',
  input: {schema: DigitizePdfContentForAssignmentInputSchema},
  output: {schema: DigitizePdfContentForAssignmentOutputSchema},
  prompt: `You are an expert OCR and document analysis assistant. 
Extract all text content from the provided document (PDF or Image). 
Preserve the logical structure of the text but return it as a clean, plain, editable text suitable for creating educational assignments.
If there are diagrams or tables, describe their content briefly within the text.

Document: {{media url=fileDataUri}}`,
});

export async function digitizePdfContentForAssignment(
  input: DigitizePdfContentForAssignmentInput
): Promise<DigitizePdfContentForAssignmentOutput> {
  try {
    const {output} = await prompt(input);
    return { extractedText: output?.extractedText };
  } catch (error: any) {
    console.error("Genkit Digitization Error:", error);
    return { error: error.message || 'Failed to digitize document' };
  }
}
