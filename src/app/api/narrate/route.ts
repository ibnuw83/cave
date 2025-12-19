
import { textToSpeech } from '@/ai/flows/tts-flow';
import {NextRequest} from 'next/server';

export const dynamic = 'force-dynamic';

// This endpoint now directly converts a given text to speech.
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required for narration' }), { status: 400 });
    }

    // Convert the provided text to speech
    const { media } = await textToSpeech(text);

    if (!media) {
        return new Response(JSON.stringify({ error: 'Failed to generate audio' }), { status: 500 });
    }
    
    // Return the audio data URI
    return new Response(JSON.stringify({ audioUrl: media }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('Error in narration route:', e);
    return new Response(JSON.stringify({ error: e.message || 'An unknown error occurred' }), { status: 500 });
  }
}
