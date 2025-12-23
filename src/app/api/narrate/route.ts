
import { getSpot } from '@/lib/firestore-admin';
import { narrateSpot } from '@/ai/flows/narrate-spot-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import {NextRequest} from 'next/server';
import wav from 'wav';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Set timeout to 120 seconds

async function toWav(
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const writer = new wav.Writer({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });
  
      let bufs = [] as any[];
      writer.on('error', reject);
      writer.on('data', function (d) {
        bufs.push(d);
      });
      writer.on('end', function () {
        resolve(Buffer.concat(bufs));
      });
  
      writer.write(pcmData);
      writer.end();
    });
}

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
    
    // 3. Convert PCM to WAV on the server
    const pcmBuffer = Buffer.from(base64Pcm, 'base64');
    const wavBuffer = await toWav(pcmBuffer);
    
    // 4. Return the raw audio file as a blob
    return new Response(wavBuffer, {
      headers: { 
        'Content-Type': 'audio/wav',
        'Content-Length': String(wavBuffer.length),
       },
    });

  } catch (e: any) {
    console.error('Error in narrate route:', e);
    return new Response(JSON.stringify({ error: e.message || 'An unknown error occurred' }), { status: 500 });
  }
}
