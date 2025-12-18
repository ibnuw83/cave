
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// This function now uses the Google AI Studio Text-to-Speech API (Gemini)
// and robustly handles different response types.
export async function POST(req: Request) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    console.error("GEMINI_API_KEY is not set.");
    return NextResponse.json({ error: "Konfigurasi server tidak lengkap." }, { status: 500 });
  }
  
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text } = body;

  if (!text) {
     return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  try {
    // Construct the URL with the API key as a query parameter
    const ttsUrl = `https://generativelanguage.googleapis.com/v1beta/text:synthesizeSpeech?key=${geminiApiKey}`;

    const ttsRes = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "input": { "text": text },
        "voice": { "languageCode": "id-ID" },
        "audioConfig": { "audioEncoding": "MP3" }
      }),
    });

    // Handle non-OK responses first
    if (!ttsRes.ok) {
        let errorBody = { error: `TTS API failed with status ${ttsRes.status}`, details: '' };
        try {
            const errorJson = await ttsRes.json();
            errorBody.details = errorJson.error?.message || 'No details provided.';
        } catch (e) {
            errorBody.details = await ttsRes.text();
        }
        console.error("Gemini TTS API Error:", errorBody);
        return NextResponse.json(errorBody, { status: ttsRes.status });
    }

    // Handle successful responses
    const contentType = ttsRes.headers.get('content-type') || '';
    
    // The Gemini TTS API for MP3 returns JSON with base64 audio content.
    if (contentType.includes('application/json')) {
        const jsonResponse = await ttsRes.json();
        if (jsonResponse.audioContent) {
            const audioBuffer = Buffer.from(jsonResponse.audioContent, 'base64');
            return new NextResponse(audioBuffer, {
                status: 200,
                headers: { 
                    'Content-Type': 'audio/mpeg',
                    'Cache-Control': 'no-store' 
                },
            });
        }
    }
    
    // Handle cases where the response might be successful but empty.
    const raw = await ttsRes.text();
    if (!raw.trim()) {
        console.warn('TTS returned empty body with success status.');
        return new NextResponse(null, { status: 204 }); // 204 No Content
    }

    // This case should ideally not be reached if the API behaves as documented.
    console.warn("TTS API returned an unexpected but successful response format.", {contentType, body: raw.substring(0, 200)});
    return NextResponse.json({ error: 'TTS API returned an unexpected response format.' }, { status: 502 });

  } catch (error: any) {
    console.error("Internal error in TTS route:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal pada server.", details: error.message }, { status: 500 });
  }
}
