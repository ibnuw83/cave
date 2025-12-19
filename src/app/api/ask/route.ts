import { getSpotClient } from '@/lib/firestore';
import { askAiAboutSpot } from '@/ai/flows/ask-ai-about-spot-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// This endpoint receives a question about a spot, gets an answer from AI,
// converts it to speech, and returns the raw base64 PCM audio.
export async function POST(req: NextRequest) {
  try {
    const { spotId, question } = await req.json();

    if (!spotId || !question) {
      return new Response(JSON.stringify({ error: 'spotId and question are required' }), { status: 400 });
    }

    const spot = await getSpotClient(spotId);
    if (!spot) {
      return new Response(JSON.stringify({ error: 'Spot not found' }), { status: 404 });
    }

    // 1. Get an answer from the AI
    const { answer } = await askAiAboutSpot({
      title: spot.title,
      description: spot.description,
      question: question,
    });
    
    if (!answer) {
        return new Response(JSON.stringify({ error: 'Failed to get answer from AI' }), { status: 500 });
    }

    // 2. Convert the answer to speech (returns base64 PCM)
    const { media: base64Pcm } = await textToSpeech(answer);

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
    console.error('Error in ask route:', e);
    return new Response(JSON.stringify({ error: e.message || 'An unknown error occurred' }), { status: 500 });
  }
}
