'use server';
/**
 * @fileOverview An AI flow to answer questions about a specific cave spot.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AskAiInputSchema = z.object({
  title: z.string().describe('The title of the cave spot.'),
  description: z.string().describe('The simple description of the cave spot.'),
  question: z.string().describe('The user\'s question about the spot.'),
});
export type AskAiInput = z.infer<typeof AskAiInputSchema>;

const AskAiOutputSchema = z.object({
  answer: z.string().describe('The AI\'s answer to the user\'s question, in Indonesian. The answer should be concise, helpful, and in the persona of an expert cave guide.'),
});
export type AskAiOutput = z.infer<typeof AskAiOutputSchema>;

export async function askAiAboutSpot(input: AskAiInput): Promise<AskAiOutput> {
  return askAiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askAiAboutSpotPrompt',
  input: { schema: AskAiInputSchema },
  output: { schema: AskAiOutputSchema },
  prompt: `You are an expert geologist and passionate tour guide specializing in Indonesian caves.
A user is currently looking at a specific spot in a cave and has a question.
Your task is to answer their question based on the context provided.
Be helpful, concise, and stay in character. The answer must be in Indonesian.

**Spot Context:**
- **Title:** {{{title}}}
- **Description:** {{{description}}}

**User's Question:**
"{{{question}}}"

Now, provide a helpful answer to the user's question.`,
});

const askAiFlow = ai.defineFlow(
  {
    name: 'askAiAboutSpotFlow',
    inputSchema: AskAiInputSchema,
    outputSchema: AskAiOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
