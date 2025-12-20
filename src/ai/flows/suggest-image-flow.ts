'use server';
/**
 * @fileOverview An AI flow to suggest a high-quality, cinematic image URL based on a description.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SuggestImageInputSchema = z.object({
  description: z.string().describe('A description of a scene, for which to generate a cinematic and photorealistic image.'),
});
export type SuggestImageInput = z.infer<typeof SuggestImageInputSchema>;

const SuggestImageOutputSchema = z.object({
  imageUrl: z.string().url().describe('A URL to a photorealistic, high-quality, cinematic image that matches the description.'),
});
export type SuggestImageOutput = z.infer<typeof SuggestImageOutputSchema>;

export async function suggestImage(input: SuggestImageInput): Promise<SuggestImageOutput> {
  return suggestImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestImagePrompt',
  input: { schema: SuggestImageInputSchema },
  output: { schema: SuggestImageOutputSchema },
  prompt: `Generate an image that matches the following description.
The image must be photorealistic, cinematic, dramatic, high-quality, and look like it was taken with a professional DSLR camera.
Do not include any people or text in the image.

Description: A dramatic and beautiful view of {{{description}}}

Return the generated image.`,
});

const suggestImageFlow = ai.defineFlow(
  {
    name: 'suggestImageFlow',
    inputSchema: SuggestImageInputSchema,
    outputSchema: SuggestImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `A photorealistic, cinematic, dramatic, high-quality image of: ${input.description}. Shot on a professional DSLR camera. No people, no text.`,
      config: {
        // You can add more specific configurations here if needed
      }
    });

    if (!media?.url) {
      throw new Error('Failed to generate image from AI model.');
    }

    return { imageUrl: media.url };
  }
);
