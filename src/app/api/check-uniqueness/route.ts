
import { NextRequest, NextResponse } from 'next/server';
import { checkUniqueness } from '@/ai/flows/check-uniqueness-flow';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const result = await checkUniqueness({ text });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('Error in check-uniqueness route:', e);
    return NextResponse.json({ error: e.message || 'An unknown error occurred' }, { status: 500 });
  }
}
