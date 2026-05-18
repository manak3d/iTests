'use server';
/**
 * @fileOverview A Genkit flow to extract editable text content from a PDF or Image document.
 *
 * - digitizePdfContentForAssignment - A function that handles the document digitization process.
 * - DigitizePdfContentForAssignmentInput - The input type for the digitizePdfContentForAssignment function.
 * - DigitizePdfContentForAssignmentOutput - The return type for the digitizePdfContentForAssignment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DigitizePdfContentForAssignmentInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A PDF document or Image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DigitizePdfContentForAssignmentInput = z.infer<typeof DigitizePdfContentForAssignmentInputSchema>;

const DigitizePdfContentForAssignmentOutputSchema = z.object({
  extractedText: z.string().describe('The extracted text content from the document.'),
});
export type DigitizePdfContentForAssignmentOutput = z.infer<typeof DigitizePdfContentForAssignmentOutputSchema>;

export async function digitizePdfContentForAssignment(
  input: DigitizePdfContentForAssignmentInput
): Promise<DigitizePdfContentForAssignmentOutput> {
  return digitizePdfContentForAssignmentFlow(input);
}

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

const digitizePdfContentForAssignmentFlow = ai.defineFlow(
  {
    name: 'digitizePdfContentForAssignmentFlow',
    inputSchema: DigitizePdfContentForAssignmentInputSchema,
    outputSchema: DigitizePdfContentForAssignmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
