
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/firebase/admin';
import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { UserProfile } from '@/lib/types';

/**
 * Verifies if the request comes from an authenticated admin user.
 * @param req The NextRequest object.
 * @returns A promise that resolves to the admin's DecodedIdToken or null.
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

// Handler for POST /api/admin/users/role to update a user's role
export async function POST(req: NextRequest) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak: Hanya admin yang diizinkan.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { uid, role } = body;

        if (!uid || !role) {
            return NextResponse.json({ error: 'Field `uid` dan `role` diperlukan.' }, { status: 400 });
        }
        
        const validRoles: UserProfile['role'][] = ['free', 'pro1', 'pro2', 'pro3', 'vip', 'admin'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
        }
        
        if (uid === adminUser.uid) {
            return NextResponse.json({ error: 'Admin tidak dapat mengubah perannya sendiri.' }, { status: 400 });
        }

        const userRef = adminDb.collection('users').doc(uid);

        await userRef.update({
            role: role,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // This is important to ensure the client gets the new role claim quickly.
        await adminAuth.setCustomUserClaims(uid, { role: role });

        return NextResponse.json({ message: `Peran pengguna berhasil diperbarui.` });

    } catch (error: any) {
        console.error(`[API] Gagal memperbarui peran pengguna:`, error);
        return NextResponse.json({ error: error.message || 'Gagal memperbarui peran pengguna.' }, { status: 500 });
    }
}
