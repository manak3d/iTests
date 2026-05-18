'use server';
/**
 * @fileOverview A Genkit flow to extract editable text content from a PDF document.
 *
 * - digitizePdfContentForAssignment - A function that handles the PDF digitization process.
 * - DigitizePdfContentForAssignmentInput - The input type for the digitizePdfContentForAssignment function.
 * - DigitizePdfContentForAssignmentOutput - The return type for the digitizePdfContentForAssignment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DigitizePdfContentForAssignmentInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DigitizePdfContentForAssignmentInput = z.infer<typeof DigitizePdfContentForAssignmentInputSchema>;

const DigitizePdfContentForAssignmentOutputSchema = z.object({
  extractedText: z.string().describe('The extracted text content from the PDF.'),
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
  model: 'googleai/gemini-1.5-flash',
  prompt: `Extract all text content from the following PDF document. Provide the text in a plain, editable format suitable for creating assignments.

PDF Document: {{media url=pdfDataUri}}`,
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
