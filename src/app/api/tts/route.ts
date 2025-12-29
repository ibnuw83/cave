
import { textToSpeech } from '@/ai/flows/tts-flow';
import {NextRequest} from 'next/server';

export const dynamic = 'force-dynamic';

// This endpoint now directly converts a given text to speech and returns the raw base64 PCM data.
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required for narration' }), { status: 400 });
    }

    // 1. Convert the provided text to speech (returns raw base64 PCM)
    const { media: base64Pcm } = await textToSpeech(text);

    if (!base64Pcm) {
        return new Response(JSON.stringify({ error: 'Failed to generate audio from AI' }), { status: 500 });
    }
    
    // 2. Return the base64 PCM data in a JSON payload.
    return new Response(JSON.stringify({ audioContent: base64Pcm }), {
      headers: { 
        'Content-Type': 'application/json',
       },
    });

  } catch (e: any) {
    console.error('Error in TTS route:', e);
    return new Response(JSON.stringify({ error: e.message || 'An unknown error occurred' }), { status: 500 });
  }
}
