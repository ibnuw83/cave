
import { safeGetAdminApp } from '@/firebase/admin';
import { narrateSpot } from '@/ai/flows/narrate-spot-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { NextRequest, NextResponse } from 'next/server';
import type { Spot } from '@/lib/types';


export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Set timeout to 120 seconds

async function getSpotAdmin(spotId: string): Promise<Spot | null> {
  const services = safeGetAdminApp();
  if (!services) {
      console.error("getSpotAdmin failed: Admin SDK not initialized.");
      return null;
  };
  const { db } = services;

  const spotRef = db.collection('spots').doc(spotId);
  const docSnap = await spotRef.get();
  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() } as Spot;
  }
  return null;
}


// This endpoint now returns a complete, playable WAV audio file.
export async function POST(req: NextRequest) {
  try {
    const { spotId } = await req.json();
    if (!spotId) {
      return NextResponse.json({ error: 'spotId is required' }, { status: 400 });
    }

    const spot = await getSpotAdmin(spotId);
    if (!spot) {
      return NextResponse.json({ error: 'Spot not found or server is not configured for admin access.' }, { status: 404 });
    }

    // 1. Generate the dramatic narrative from the simple description
    const { narrative } = await narrateSpot({
      title: spot.title,
      description: spot.description,
    });
    
    if (!narrative) {
        return NextResponse.json({ error: 'Failed to generate narrative' }, { status: 500 });
    }

    // 2. Convert the generated narrative to speech (returns base64 PCM)
    const { media: base64Pcm } = await textToSpeech(narrative);

    if (!base64Pcm) {
        return NextResponse.json({ error: 'Failed to generate audio' }, { status: 500 });
    }
    
    // 3. Return the base64 audio data directly. The client will handle it.
    return NextResponse.json({ audioContent: base64Pcm });

  } catch (e: any) {
    console.error('Error in narrate route:', e);
    // Check if the error is due to unconfigured admin SDK
    if (e.message.includes("Admin SDK")) {
        return NextResponse.json({ error: 'Fitur narasi AI tidak tersedia karena konfigurasi server tidak lengkap.' }, { status: 503 });
    }
    return NextResponse.json({ error: e.message || 'An unknown error occurred' }, { status: 500 });
  }
}
