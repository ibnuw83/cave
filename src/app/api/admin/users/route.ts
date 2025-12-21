
import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import { cookies } from 'next/headers';
import { createUserAdmin } from '@/lib/firestore-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

async function verifyAdmin(req: NextRequest): Promise<DecodedIdToken | null> {
    const admin = safeGetAdminApp();
    if (!admin) {
      console.warn('[ADMIN API] Admin SDK tidak tersedia');
      return null;
    }
  
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      console.warn('[ADMIN API] Cookie sesi tidak ditemukan.');
      return null;
    }
  
    try {
      const decoded = await admin.auth.verifySessionCookie(sessionCookie, true);
      const userDoc = await admin.db.collection('users').doc(decoded.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'admin') {
        return decoded;
      }
      console.warn(`[ADMIN API] Verifikasi gagal: Pengguna ${decoded.uid} bukan admin.`);
      return null;
    } catch (err) {
      console.warn('[ADMIN API] Gagal verifikasi cookie admin:', err);
      return null;
    }
}

// Handler for POST /api/admin/users
export async function POST(req: NextRequest) {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Akses ditolak: Hanya admin yang diizinkan.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { email, password, displayName, role } = body;

        if (!email || !password || !displayName || !role) {
            return NextResponse.json({ error: 'Field email, password, displayName, dan role diperlukan.' }, { status: 400 });
        }
        
        if (!['free', 'pro1', 'pro2', 'pro3', 'vip', 'admin'].includes(role)) {
            return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
        }

        const userRecord = await createUserAdmin({ email, password, displayName, role });
        
        return NextResponse.json({ uid: userRecord.uid, email: userRecord.email }, { status: 201 });
    } catch (error: any) {
        console.error('[API] Gagal membuat pengguna:', error);
         if (error.code === 'auth/email-already-exists') {
            return NextResponse.json({ error: 'Email ini sudah terdaftar.' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || 'Gagal membuat pengguna baru.' }, { status: 500 });
    }
}
