
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { safeGetAdminApp } from '@/firebase/admin';
import { createUserAdmin, getAllUsersAdmin } from '@/lib/firestore-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Verifies if the request comes from an authenticated admin user.
 * @param req The NextRequest object.
 * @returns A promise that resolves to the admin's DecodedIdToken or null if not an admin.
 */
async function verifyAdmin(req: NextRequest): Promise<DecodedIdToken | null> {
    const admin = safeGetAdminApp();
    if (!admin) {
      console.warn('[ADMIN API] Admin SDK not available.');
      return null;
    }
  
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      return null;
    }
  
    try {
      const decoded = await admin.auth.verifySessionCookie(sessionCookie, true);
      const userDoc = await admin.db.collection('users').doc(decoded.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'admin') {
        return decoded;
      }
      return null;
    } catch (err) {
      console.warn('[ADMIN API] Failed to verify admin cookie:', err);
      return null;
    }
}

// Handler for GET /api/admin/users to fetch all users
export async function GET(req: NextRequest) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak: Hanya admin yang diizinkan.' }, { status: 403 });
    }

    try {
        const users = await getAllUsersAdmin();
        return NextResponse.json(users);
    } catch (error: any) {
        console.error('[API] Gagal mengambil daftar pengguna:', error);
        return NextResponse.json({ error: error.message || 'Gagal mengambil daftar pengguna.' }, { status: 500 });
    }
}


// Handler for POST /api/admin/users
export async function POST(req: NextRequest) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak: Hanya admin yang diizinkan.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { email, password, displayName, role } = body;

        if (!email || !password || !displayName || !role) {
            return NextResponse.json({ error: 'Field email, password, displayName, dan role diperlukan.' }, { status: 400 });
        }
        
        // Allow an admin to create another admin
        if (role === 'admin' && adminUser.email !== 'superadmin@example.com') { // Example of a superadmin check
            // console.log(`Admin creation attempt by: ${adminUser.email}`);
            // return NextResponse.json({ error: 'Anda tidak memiliki izin untuk membuat admin baru.' }, { status: 403 });
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
