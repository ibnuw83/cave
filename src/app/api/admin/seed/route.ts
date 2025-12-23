
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/firebase/admin';
import { seedInitialData } from '@/lib/seed-dev-data';

export async function POST(req: NextRequest) {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }
  
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
          return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
      }

      await seedInitialData();

      return NextResponse.json({ message: 'Data awal berhasil diisi.' });

    } catch (err: any) {
      console.error('[API/SEED] Error:', err);
      return NextResponse.json({ error: 'Gagal memverifikasi sesi atau mengisi data.', details: err.message }, { status: 500 });
    }
}
