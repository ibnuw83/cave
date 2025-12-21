/**
 * @fileOverview An AI flow to generate a dramatic narrative for a cave spot.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const NarrateSpotInputSchema = z.object({
  title: z.string().describe('The title of the cave spot.'),
  description: z.string().describe('The simple description of the cave spot.'),
});
export type NarrateSpotInput = z.infer<typeof NarrateSpotInputSchema>;

const NarrateSpotOutputSchema = z.object({
  narrative: z.string().describe('A dramatic, atmospheric, and engaging narrative script for the spot, in Indonesian. Make it sound like an expert guide telling a story.'),
});
export type NarrateSpotOutput = z.infer<typeof NarrateSpotOutputSchema>;

export async function narrateSpot(input: NarrateSpotInput): Promise<NarrateSpotOutput> {
  return narrateSpotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'narrateSpotPrompt',
  input: { schema: NarrateSpotInputSchema },
  output: { schema: NarrateSpotOutputSchema },
  prompt: `You are an expert geologist and passionate tour guide specializing in Indonesian caves.
Your task is to transform a simple spot description into a rich, atmospheric, and dramatic narrative script.
The script should be in Indonesian.
Make the user feel like they are standing right there, experiencing the cave's wonders. Use evocative language.

Spot Title: {{{title}}}
Spot Description: {{{description}}}

Now, generate the narrative.`,
});

const narrateSpotFlow = ai.defineFlow(
  {
    name: 'narrateSpotFlow',
    inputSchema: NarrateSpotInputSchema,
    outputSchema: NarrateSpotOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
