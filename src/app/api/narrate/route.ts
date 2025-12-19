// src/app/api/narrate/route.ts
import { narrateSpot } from '@/ai/flows/narrate-spot-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import {NextRequest} from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();

    if (!title || !description) {
      return new Response(JSON.stringify({ error: 'Title and description are required' }), { status: 400 });
    }

    // 1. Generate the narrative script
    const { narrative } = await narrateSpot({ title, description });

    if (!narrative) {
        return new Response(JSON.stringify({ error: 'Failed to generate narrative' }), { status: 500 });
    }

    // 2. Convert the script to speech
    const { media } = await textToSpeech(narrative);

    if (!media) {
        return new Response(JSON.stringify({ error: 'Failed to generate audio' }), { status: 500 });
    }
    
    // 3. Return the audio data URI
    return new Response(JSON.stringify({ audioUrl: media }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('Error in narration route:', e);
    return new Response(JSON.stringify({ error: e.message || 'An unknown error occurred' }), { status: 500 });
  }
}
