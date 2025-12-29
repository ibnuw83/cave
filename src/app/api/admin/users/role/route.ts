
import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { UserProfile } from '@/lib/types';

/**
 * Verifies if the request comes from an authenticated admin user.
 * @param req The NextRequest object.
 * @returns A promise that resolves to the admin's DecodedIdToken or null.
 */
async function verifyAdmin(req: NextRequest): Promise<DecodedIdToken | null> {
  const services = safeGetAdminApp();
  if (!services) return null;

  const { auth } = services;

  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  const idToken = authorization.replace('Bearer ', '');

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Primary check: custom claim is the source of truth for roles.
    if (decodedToken.role === 'admin') {
      return decodedToken;
    }

    return null;
  } catch (err) {
    console.error('[verifyAdmin] Error verifying token:', err);
    return null;
  }
}

// Handler for POST /api/admin/users/role to update a user's role
export async function POST(req: NextRequest) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak: Hanya admin yang diizinkan.' }, { status: 403 });
    }

    const services = safeGetAdminApp();
    if (!services) return NextResponse.json({ error: 'Admin SDK tidak tersedia.' }, { status: 500 });
    const { auth, db } = services;

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

        // Set custom claims for role-based access in Auth
        await auth.setCustomUserClaims(uid, { role: role });

        // Update the role in Firestore as well for client-side queries
        const userRef = db.collection('users').doc(uid);
        await userRef.update({
            role: role,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // This step is important to force clients to re-authenticate and get the new claims.
        // It invalidates all sessions for the user.
        await auth.revokeRefreshTokens(uid);

        return NextResponse.json({ message: `Peran pengguna berhasil diperbarui.` });

    } catch (error: any) {
        console.error(`[API] Gagal memperbarui peran pengguna:`, error);
        return NextResponse.json({ error: error.message || 'Gagal memperbarui peran pengguna.' }, { status: 500 });
    }
}
