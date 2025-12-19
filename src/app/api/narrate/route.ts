
import { getSpotAdmin, getUserProfileAdmin } from '@/lib/firebase-admin';
import { narrateSpot } from '@/ai/flows/narrate-spot-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { auth } from 'firebase-admin';
import { cookies } from 'next/headers';
import {NextRequest} from 'next/server';

export const dynamic = 'force-dynamic';

async function verifyProUser(): Promise<boolean> {
   try {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) return false;
    
    const decodedToken = await auth().verifySessionCookie(sessionCookie, true);
    const userProfile = await getUserProfileAdmin(decodedToken.uid);

    return userProfile?.role === 'pro' || userProfile?.role === 'admin';
  } catch (error) {
    return false;
  }
}


// This is the new endpoint that combines narration and TTS.
export async function POST(req: NextRequest) {
  try {
    const isPro = await verifyProUser();
    if (!isPro) {
        return new Response(JSON.stringify({ error: 'This feature is for PRO users only.' }), { status: 403 });
    }

    const { spotId } = await req.json();
    if (!spotId) {
      return new Response(JSON.stringify({ error: 'spotId is required' }), { status: 400 });
    }

    const spot = await getSpotAdmin(spotId);
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

    // 2. Convert the generated narrative to speech
    const { media } = await textToSpeech(narrative);

    if (!media) {
        return new Response(JSON.stringify({ error: 'Failed to generate audio' }), { status: 500 });
    }
    
    // 3. Return the audio file to the client
    const base64Data = media.split(';base64,').pop();
    if (!base64Data) {
        return new Response(JSON.stringify({ error: 'Invalid audio data format' }), { status: 500 });
    }
    const audioBuffer = Buffer.from(base64Data, 'base64');
    
    return new Response(audioBuffer, {
      headers: { 
        'Content-Type': 'audio/wav',
        'Content-Length': String(audioBuffer.length),
       },
    });

  } catch (e: any) {
    console.error('Error in narrate route:', e);
    return new Response(JSON.stringify({ error: e.message || 'An unknown error occurred' }), { status: 500 });
  }
}
