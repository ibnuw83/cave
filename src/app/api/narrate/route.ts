
import { getSpot } from '@/lib/firestore-admin';
import { narrateSpot } from '@/ai/flows/narrate-spot-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import {NextRequest} from 'next/server';


export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Set timeout to 120 seconds


// This endpoint now returns a complete, playable WAV audio file.
export async function POST(req: NextRequest) {
  try {
    const { spotId } = await req.json();
    if (!spotId) {
      return new Response(JSON.stringify({ error: 'spotId is required' }), { status: 400 });
    }

    const spot = await getSpot(spotId);
    if (!spot) {
      return new Response(JSON.stringify({ error: 'Spot not found' }), { status: 404 });
    }

    // 1. Generate the dramatic narrative from the simple description
    const { narrative } = await narrateSpot({
      title: spot.title,
      description: spot.description,
    });
    
    if (!narrative) {
        return new Response(JSON.stringify({ error: 'Failed to generate narrative' }), { status: 500 });
    }

    // 2. Convert the generated narrative to speech (returns base64 PCM)
    const { media: base64Pcm } = await textToSpeech(narrative);

    if (!base64Pcm) {
        return new Response(JSON.stringify({ error: 'Failed to generate audio' }), { status: 500 });
    }
    
    // 3. Return the base64 audio data directly. The client will handle it.
    // We send it as JSON so the client can easily parse it.
    return new Response(JSON.stringify({ audioContent: base64Pcm }), {
      headers: { 
        'Content-Type': 'application/json',
       },
    });

  } catch (e: any) {
    console.error('Error in narrate route:', e);
    return new Response(JSON.stringify({ error: e.message || 'An unknown error occurred' }), { status: 500 });
  }
}
