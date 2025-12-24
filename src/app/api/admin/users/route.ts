
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { UserProfile } from '@/lib/types';
import * as admin from 'firebase-admin';

/**
 * Verifies if the request comes from an authenticated admin user.
 * @param req The NextRequest object.
 * @returns A promise that resolves to the admin's DecodedIdToken or null if not an admin.
 */
async function verifyAdmin(req: NextRequest): Promise<DecodedIdToken | null> {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
      const idToken = authorization.split('Bearer ')[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists && userDoc.data()?.role === 'admin') {
            return decodedToken;
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        return null;
      }
    }
    return null;
}

// Handler for GET /api/admin/users to fetch all users
export async function GET(req: NextRequest) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak: Hanya admin yang diizinkan.' }, { status: 403 });
    }

    try {
        const userRecords = await adminAuth.listUsers();
        const usersRef = adminDb.collection('users');
        const usersSnap = await usersRef.get();
        const profiles: Record<string, UserProfile> = {};
        usersSnap.forEach(doc => {
            profiles[doc.id] = doc.data() as UserProfile;
        });

        const users = userRecords.users.map(user => ({
            id: user.uid,
            email: user.email || null,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            role: profiles[user.uid]?.role || 'free',
            disabled: user.disabled,
            updatedAt: profiles[user.uid]?.updatedAt || new Date(user.metadata.lastSignInTime || user.metadata.creationTime),
        }));

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
        
        const validRoles: UserProfile['role'][] = ['free', 'pro1', 'pro2', 'pro3', 'vip', 'admin'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
        }

        const userRecord = await adminAuth.createUser({ email, password, displayName });
        
        await adminDb.collection('users').doc(userRecord.uid).set({
            email,
            displayName,
            role,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        return NextResponse.json({ uid: userRecord.uid, email: userRecord.email }, { status: 201 });
    } catch (error: any) {
        console.error('[API] Gagal membuat pengguna:', error);
         if (error.code === 'auth/email-already-exists') {
            return NextResponse.json({ error: 'Email ini sudah terdaftar.' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || 'Gagal membuat pengguna baru.' }, { status: 500 });
    }
}
