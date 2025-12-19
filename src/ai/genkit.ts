'use server';
/**
 * @fileoverview This file exports a singleton Genkit AI instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: ['v1', 'v1beta'],
    }),
  ],
});
