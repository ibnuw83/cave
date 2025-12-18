
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// This function now uses the Google AI Studio Text-to-Speech API (Gemini)
export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    return NextResponse.json({ error: "Konfigurasi server tidak lengkap." }, { status: 500 });
  }
  
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text, voice = 'onyx' } = body; // voice is kept for compatibility but not used by Gemini TTS model

  if (!text) {
     return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/text:synthesizeSpeech', {
      method: 'POST',
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "input": {
          "text": text
        },
        "voice": {
          "languageCode": "id-ID",
          // Other voices can be found in the Gemini API documentation
          // e.g., "name": "id-ID-Standard-A"
        },
        "audioConfig": {
          "audioEncoding": "MP3"
        }
      }),
    });

    if (!r.ok) {
      const msg = await r.json();
      console.error("Gemini TTS API Error:", msg);
      return NextResponse.json({ error: "Failed to generate audio from Gemini.", details: msg }, { status: r.status });
    }

    const responseData = await r.json();
    const audioBuffer = Buffer.from(responseData.audioContent, 'base64');
    
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    });

  } catch (error: any) {
    console.error("Internal error in TTS route:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal pada server.", details: error.message }, { status: 500 });
  }
}
