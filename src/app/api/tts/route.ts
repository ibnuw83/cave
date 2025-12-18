
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return NextResponse.json(
      { error: 'Konfigurasi server tidak lengkap.' },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const { text } = body;
  if (!text || typeof text !== 'string') {
    return NextResponse.json(
      { error: 'Text is required.' },
      { status: 400 }
    );
  }

  try {
    const ttsUrl =
      `https://generativelanguage.googleapis.com/v1beta/text:synthesizeSpeech`;

    const ttsRes = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey, // Kunci API dipindahkan ke header
      },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'id-ID' },
        audioConfig: { audioEncoding: 'MP3' },
      }),
    });

    // ========= HANDLE ERROR FROM GEMINI =========
    if (!ttsRes.ok) {
      let details = '';
      try {
        const errJson = await ttsRes.json();
        details = errJson?.error?.message || JSON.stringify(errJson);
      } catch {
        details = await ttsRes.text();
      }

      console.error('[GEMINI TTS API ERROR]', details);
      return NextResponse.json(
        {
          error: 'TTS API failed',
          details: details || `HTTP ${ttsRes.status}`,
        },
        { status: ttsRes.status }
      );
    }
    
    // ========= HANDLE SUCCESS =========
    const json = await ttsRes.json();

    if (!json?.audioContent) {
      console.warn('TTS API returned success but no audioContent field.');
      return new NextResponse(null, { status: 204 }); // No Content
    }

    // Decode base64 audio dan return sebagai buffer
    const audioBuffer = Buffer.from(json.audioContent, 'base64');

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (err: any) {
    console.error('[INTERNAL TTS API ERROR]', err);
    return NextResponse.json(
      { error: 'Internal TTS server error.', details: err?.message },
      { status: 500 }
    );
  }
}
