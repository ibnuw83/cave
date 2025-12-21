
import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/ai/flows/translate-text-flow';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage, sourceLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: 'text and targetLanguage are required' }, { status: 400 });
    }

    const result = await translateText({ text, language: targetLanguage, sourceLanguage });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('Error in translate route:', e);
    return NextResponse.json({ error: e.message || 'An unknown error occurred' }, { status: 500 });
  }
}
