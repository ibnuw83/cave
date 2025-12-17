'use server';
/**
 * @fileOverview A Genkit flow that dynamically adjusts the audio ambience of each cave environment using AI.
 *
 * - personalizedCaveAmbience - A function that handles the ambience generation process.
 * - PersonalizedCaveAmbienceInput - The input type for the personalizedCaveAmbience function.
 * - PersonalizedCaveAmbienceOutput - The return type for the personalizedCaveAmbience function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedCaveAmbienceInputSchema = z.object({
  caveName: z.string().describe('The name of the cave.'),
  caveDescription: z.string().describe('A description of the cave environment.'),
  caveCoverImage: z.string().describe('URL of cover image of the cave.'),
});
export type PersonalizedCaveAmbienceInput = z.infer<typeof PersonalizedCaveAmbienceInputSchema>;

const PersonalizedCaveAmbienceOutputSchema = z.object({
  ambienceDescription: z.string().describe('A description of the generated audio ambience.'),
});
export type PersonalizedCaveAmbienceOutput = z.infer<typeof PersonalizedCaveAmbienceOutputSchema>;

export async function personalizedCaveAmbience(input: PersonalizedCaveAmbienceInput): Promise<PersonalizedCaveAmbienceOutput> {
  return personalizedCaveAmbienceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedCaveAmbiencePrompt',
  input: {schema: PersonalizedCaveAmbienceInputSchema},
  output: {schema: PersonalizedCaveAmbienceOutputSchema},
  prompt: `You are an AI expert in generating ambient audio descriptions for cave environments.

  Based on the following cave information, generate a short description of the ideal audio ambience for the cave. Consider sounds related to water, rocks, and the general atmosphere. The description should evoke a sense of immersion and match the cave's characteristics.

  Cave Name: {{{caveName}}}
  Cave Description: {{{caveDescription}}}
  Cave Cover Image: {{caveCoverImage}}

  Provide a detailed description of the ambience, which will be later used to select or generate appropriate audio.
  `,
});

const personalizedCaveAmbienceFlow = ai.defineFlow(
  {
    name: 'personalizedCaveAmbienceFlow',
    inputSchema: PersonalizedCaveAmbienceInputSchema,
    outputSchema: PersonalizedCaveAmbienceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
