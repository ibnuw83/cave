import { NextRequest, NextResponse } from 'next/server';
import { suggestImage } from '@/ai/flows/suggest-image-flow';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // Call the Genkit flow to get the image URL
    const result = await suggestImage({ description });

    if (!result.imageUrl) {
        return NextResponse.json({ error: 'Failed to get image suggestion from AI' }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: result.imageUrl });
  } catch (e: any) {
    console.error('Error in suggest-image route:', e);
    return NextResponse.json({ error: e.message || 'An unknown error occurred' }, { status: 500 });
  }
}
