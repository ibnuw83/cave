
import { getSpotClient } from '@/lib/firestore-client';
import { narrateSpot } from '@/ai/flows/narrate-spot-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import {NextRequest} from 'next/server';

export const dynamic = 'force-dynamic';

// This endpoint now returns the raw base64 encoded PCM audio data.
export async function POST(req: NextRequest) {
  try {
    const { spotId, language } = await req.json();
    if (!spotId) {
      return new Response(JSON.stringify({ error: 'spotId is required' }), { status: 400 });
    }

    const spot = await getSpotClient(spotId);
    if (!spot) {
      return new Response(JSON.stringify({ error: 'Spot not found' }), { status: 404 });
    }

    // 1. Generate the dramatic narrative from the simple description
    const { narrative } = await narrateSpot({
      title: spot.title,
      description: spot.description,
      language: language || 'en-US', // Default to English if no language is provided
    });
    
    if (!narrative) {
        return new Response(JSON.stringify({ error: 'Failed to generate narrative' }), { status: 500 });
    }

    // 2. Convert the generated narrative to speech (returns base64 PCM)
    const { media: base64Pcm } = await textToSpeech(narrative);

    if (!base64Pcm) {
        return new Response(JSON.stringify({ error: 'Failed to generate audio' }), { status: 500 });
    }
    
    // 3. Return the raw base64 data as a text response to the client
    return new Response(base64Pcm, {
      headers: { 
        'Content-Type': 'text/plain',
       },
    });

  } catch (e: any) {
    console.error('Error in narrate route:', e);
    return new Response(JSON.stringify({ error: e.message || 'An unknown error occurred' }), { status: 500 });
  }
}
