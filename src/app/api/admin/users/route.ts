
import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import { cookies } from 'next/headers';
import { createUserAdmin } from '@/lib/firestore-admin';

async function verifyAdmin(req: NextRequest): Promise<boolean> {
    const admin = safeGetAdminApp();
    if (!admin) return false;

    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) return false;

    try {
        const decodedIdToken = await admin.auth.verifySessionCookie(sessionCookie, true);
        const userDoc = await admin.db.collection('users').doc(decodedIdToken.uid).get();
        return userDoc.exists && userDoc.data()?.role === 'admin';
    } catch (error) {
        return false;
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
