
import { textToSpeech } from '@/ai/flows/tts-flow';
import {NextRequest} from 'next/server';
import wav from 'wav';

export const dynamic = 'force-dynamic';

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

// This endpoint now directly converts a given text to speech and returns a complete WAV audio file.
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
    
    // 2. Decode base64 and convert PCM to WAV on the server
    const pcmBuffer = Buffer.from(base64Pcm, 'base64');
    const wavBuffer = await toWav(pcmBuffer);
    
    // 3. Return the complete audio file as a blob
    return new Response(wavBuffer, {
      headers: { 
        'Content-Type': 'audio/wav',
        'Content-Length': String(wavBuffer.length),
       },
    });

  } catch (e: any) {
    console.error('Error in TTS route:', e);
    return new Response(JSON.stringify({ error: e.message || 'An unknown error occurred' }), { status: 500 });
  }
}
