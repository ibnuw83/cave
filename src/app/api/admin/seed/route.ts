
import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import { seedInitialData } from '@/lib/seed-dev-data';
import type { DecodedIdToken } from 'firebase-admin/auth';
import * as admin from 'firebase-admin';

const adminApp = safeGetAdminApp();
const adminAuth = admin.auth(adminApp);
const adminDb = admin.firestore(adminApp);

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

export async function POST(req: NextRequest) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
  
    try {
      await seedInitialData();
      return NextResponse.json({ message: 'Data awal berhasil diisi.' });

    } catch (err: any) {
      console.error('[API/SEED] Error:', err);
      return NextResponse.json({ error: 'Gagal mengisi data.', details: err.message }, { status: 500 });
    }
}
