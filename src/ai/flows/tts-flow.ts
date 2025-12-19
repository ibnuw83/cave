
'use server';
/**
 * @fileoverview Converts text to speech using Google's TTS model.
 * This flow now returns the raw, base64-encoded PCM audio data directly.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

export async function textToSpeech(text: string): Promise<{ media: string }> {
    return ttsFlow(text);
}

const ttsFlow = ai.defineFlow(
  {
    name: 'ttsFlow',
    inputSchema: z.string(),
    outputSchema: z.object({
        media: z.string().describe('The base64 encoded raw PCM audio data.'),
    }),
  },
  async (query) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A good voice for narration
          },
        },
      },
      prompt: query,
    });

    if (!media) {
      throw new Error('No media returned from TTS model');
    }

    // The media.url from the TTS model is already 'data:audio/pcm;base64,....'
    // We just need to extract the base64 part.
    const base64PcmData = media.url.substring(media.url.indexOf(',') + 1);

    return {
      media: base64PcmData,
    };
  }
);
