
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_TTS_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_CLOUD_TTS_KEY belum diset' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text } = body;
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'id-ID',
            name: 'id-ID-Wavenet-A',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.95,
            pitch: 0,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('[TTS ERROR]', errText);
      return NextResponse.json(
        { error: 'TTS API error', details: errText },
        { status: res.status }
      );
    }

    const json = await res.json();

    if (!json.audioContent) {
      return NextResponse.json(
        { error: 'TTS sukses tapi audio kosong' },
        { status: 502 }
      );
    }

    const buffer = Buffer.from(json.audioContent, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[INTERNAL TTS ERROR]', err);
    return NextResponse.json(
      { error: 'Internal TTS server error', details: err.message },
      { status: 500 }
    );
  }
}
