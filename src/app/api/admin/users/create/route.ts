
import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { UserProfile } from '@/lib/types';
import * as admin from 'firebase-admin';

/**
 * Verifies if the request comes from an authenticated admin user.
 * @param req The NextRequest object.
 * @returns A promise that resolves to the admin's DecodedIdToken or null.
 */
async function verifyAdmin(req: NextRequest): Promise<DecodedIdToken | null> {
  const services = safeGetAdminApp();
  if (!services) return null;

  const { auth, db } = services;

  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authorization.replace('Bearer ', '');

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Check for custom admin claim first
    if (decodedToken.role === 'admin') {
      return decodedToken;
    }

    // Fallback: check Firestore role if claim is missing
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (userDoc.exists && userDoc.data()?.role === 'admin') {
      return decodedToken;
    }

    return null;
  } catch (err) {
    console.error('[verifyAdmin] Error verifying token:', err);
    return null;
  }
}

// Handler for POST /api/admin/users/create
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
        const { email, password, displayName, role } = body;

        if (!email || !password || !displayName || !role) {
            return NextResponse.json({ error: 'Field email, password, displayName, dan role diperlukan.' }, { status: 400 });
        }
        
        const validRoles: UserProfile['role'][] = ['free', 'pro1', 'pro2', 'pro3', 'vip', 'admin'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
        }

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName,
            disabled: false, // Explicitly set to false on creation
        });

        const uid = userRecord.uid;
        
        // Set custom claims for role-based access
        await auth.setCustomUserClaims(uid, { role });

        // Create user profile in Firestore
        const userRef = db.collection('users').doc(uid);
        const userProfileData: Omit<UserProfile, 'id' | 'updatedAt'> = {
            displayName,
            email,
            photoURL: null,
            role,
            disabled: false,
        };
        await userRef.set({
            ...userProfileData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        return NextResponse.json({ uid, message: 'Pengguna berhasil dibuat.' });

    } catch (error: any) {
        console.error(`[API] Gagal membuat pengguna:`, error);
        if (error.code === 'auth/email-already-exists') {
            return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || 'Gagal membuat pengguna.' }, { status: 500 });
    }
}
