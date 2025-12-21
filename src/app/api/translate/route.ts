
import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/ai/flows/translate-text-flow';
import { getUserFromSession } from '@/lib/auth-server';
import { hasAccess } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromSession(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { text, language, sourceLanguage } = await req.json();

    if (!text || !language) {
      return NextResponse.json(
        { error: 'text and language are required' },
        { status: 400 }
      );
    }

    // 🔒 RBAC: translate hanya untuk PRO ke atas
    if (!hasAccess(user.role, 'pro2')) {
      return NextResponse.json(
        { error: 'Fitur ini hanya untuk pengguna PRO' },
        { status: 403 }
      );
    }

    // 🧠 Batasi panjang teks (hemat biaya AI)
    if (text.length > 1000) {
      return NextResponse.json(
        { error: 'Teks terlalu panjang (maks 1000 karakter)' },
        { status: 413 }
      );
    }

    const result = await translateText({
      text,
      language: language,
      sourceLanguage,
    });

    return NextResponse.json(result);

  } catch (e: any) {
    console.error('[TRANSLATE API ERROR]', e);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}
