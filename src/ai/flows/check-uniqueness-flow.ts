
/**
 * @fileOverview An AI flow to check the uniqueness and quality of a text description.
 */

'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CheckUniquenessInputSchema = z.object({
  text: z.string().describe('The text description to be evaluated for uniqueness and quality.'),
});
export type CheckUniquenessInput = z.infer<typeof CheckUniquenessInputSchema>;

const CheckUniquenessOutputSchema = z.object({
  isUnique: z.boolean().describe('True if the text is considered unique, original, and well-written. False if it is generic, contains clichés, or seems plagiarized.'),
  feedback: z.string().describe('Constructive feedback on why the text is or is not unique, with suggestions for improvement if necessary. Keep it concise.'),
});
export type CheckUniquenessOutput = z.infer<typeof CheckUniquenessOutputSchema>;

export async function checkUniqueness(input: CheckUniquenessInput): Promise<CheckUniquenessOutput> {
  return checkUniquenessFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkUniquenessPrompt',
  input: { schema: CheckUniquenessInputSchema },
  output: { schema: CheckUniquenessOutputSchema },
  prompt: `You are an expert content editor and SEO specialist.
Your task is to evaluate the following text for a virtual tour spot description.
The description must be unique, engaging, and high-quality. It should not be generic, full of clichés, or sound like it was copied from Wikipedia.

Evaluate the following text:
---
{{{text}}}
---

- Assess its originality and creativity.
- Determine if it's engaging for a user on a virtual tour.
- Based on your assessment, set 'isUnique' to true or false.
- Provide concise, actionable feedback in the 'feedback' field. If it's good, say why. If it needs improvement, give specific suggestions.`,
});

const checkUniquenessFlow = ai.defineFlow(
  {
    name: 'checkUniquenessFlow',
    inputSchema: CheckUniquenessInputSchema,
    outputSchema: CheckUniquenessOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
