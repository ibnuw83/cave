
import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { UserProfile } from '@/lib/types';

/**
 * Verifies the user's ID token from the Authorization header.
 * @param req The NextRequest object.
 * @returns A promise that resolves to the user's DecodedIdToken or null.
 */
async function verifyUser(req: NextRequest): Promise<DecodedIdToken | null> {
    const adminApp = safeGetAdminApp();
    const adminAuth = admin.auth(adminApp);
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
      const idToken = authorization.split('Bearer ')[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        return decodedToken;
      } catch (error) {
        console.error("Error verifying token:", error);
        return null;
      }
    }
    return null;
}

// Handler for POST /api/upgrade
export async function POST(req: NextRequest) {
    const decodedToken = await verifyUser(req);
    if (!decodedToken) {
        return NextResponse.json({ error: 'Akses ditolak: Pengguna tidak terautentikasi.' }, { status: 401 });
    }

    try {
        const adminApp = safeGetAdminApp();
        const adminAuth = admin.auth(adminApp);
        const adminDb = admin.firestore(adminApp);
        const body = await req.json();
        const { tierId } = body;

        if (!tierId) {
            return NextResponse.json({ error: 'tierId diperlukan.' }, { status: 400 });
        }
        
        const validRoles: UserProfile['role'][] = ['free', 'pro1', 'pro2', 'pro3', 'vip'];
        if (!validRoles.includes(tierId)) {
            return NextResponse.json({ error: 'Tier ID tidak valid.' }, { status: 400 });
        }

        const userRef = adminDb.collection('users').doc(decodedToken.uid);

        await userRef.update({
            role: tierId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // This is important to ensure the client gets the new role claim quickly.
        // The client must force-refresh its token after this call succeeds.
        await adminAuth.setCustomUserClaims(decodedToken.uid, { role: tierId });

        return NextResponse.json({ message: 'Peran pengguna berhasil diperbarui.' });

    } catch (error: any) {
        console.error(`[API/UPGRADE] Gagal memperbarui peran untuk pengguna ${decodedToken.uid}:`, error);
        return NextResponse.json({ error: error.message || 'Gagal memperbarui peran pengguna.' }, { status: 500 });
    }
}
