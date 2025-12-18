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
      `https://generativelanguage.googleapis.com/v1beta/text:synthesizeSpeech?key=${geminiApiKey}`;

    const ttsRes = await fetch(ttsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'id-ID' },
        audioConfig: { audioEncoding: 'MP3' },
      }),
    });

    // ========= ERROR DARI GEMINI =========
    if (!ttsRes.ok) {
      let details = '';
      try {
        const errJson = await ttsRes.json();
        details = errJson?.error?.message || '';
      } catch {
        details = await ttsRes.text();
      }

      return NextResponse.json(
        {
          error: 'TTS API failed',
          details: details || `HTTP ${ttsRes.status}`,
        },
        { status: ttsRes.status }
      );
    }

    // ========= SUCCESS =========
    const contentType = ttsRes.headers.get('content-type') || '';

    // Gemini TTS → JSON base64
    if (contentType.includes('application/json')) {
      const json = await ttsRes.json();

      if (!json?.audioContent) {
        return NextResponse.json(
          { error: 'TTS returned empty audio.' },
          { status: 502 }
        );
      }

      const audioBuffer = Buffer.from(json.audioContent, 'base64');

      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'no-store',
        },
      });
    }

    // fallback (should not happen)
    const raw = await ttsRes.text();
    if (!raw.trim()) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(
      { error: 'Unexpected TTS response format.' },
      { status: 502 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Internal TTS server error.', details: err?.message },
      { status: 500 }
    );
  }
}
