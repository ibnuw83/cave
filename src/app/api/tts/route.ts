
import { textToSpeech } from '@/ai/flows/tts-flow';
import {NextRequest} from 'next/server';

export const dynamic = 'force-dynamic';

// This endpoint now directly converts a given text to speech and returns raw audio data.
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
    
    // Convert base64 data URI to a Buffer
    const base64Data = media.split(';base64,').pop();
    if (!base64Data) {
        return new Response(JSON.stringify({ error: 'Invalid audio data format' }), { status: 500 });
    }
    const audioBuffer = Buffer.from(base64Data, 'base64');
    
    // Return the raw audio file as a blob
    return new Response(audioBuffer, {
      headers: { 
        'Content-Type': 'audio/wav',
        'Content-Length': String(audioBuffer.length),
       },
    });

  } catch (e: any) {
    console.error('Error in TTS route:', e);
    return new Response(JSON.stringify({ error: e.message || 'An unknown error occurred' }), { status: 500 });
  }
}
