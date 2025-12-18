import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not set." }, { status: 500 });
  }
  
  const { text, voice = 'alloy' } = await req.json();

  if (!text) {
     return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  const r = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1', // tts-1 is cheaper and good enough for this
      voice,          // alloy, echo, fable, onyx, nova, and shimmer
      input: text,
    }),
  });

  if (!r.ok) {
    const msg = await r.text();
    console.error("OpenAI TTS API Error:", msg);
    return NextResponse.json({ error: "Failed to generate audio from OpenAI.", details: msg }, { status: r.status });
  }

  const audioBuffer = Buffer.from(await r.arrayBuffer());
  return new NextResponse(audioBuffer, {
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
  });
}
