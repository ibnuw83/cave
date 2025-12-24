
import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import type { Spot } from '@/lib/types';
import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

async function verifyAdmin(req: NextRequest): Promise<DecodedIdToken | null> {
    const adminApp = safeGetAdminApp();
    const adminAuth = admin.auth(adminApp);
    const adminDb = admin.firestore(adminApp);

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


export async function GET(req: NextRequest) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    try {
        const adminApp = safeGetAdminApp();
        const adminDb = admin.firestore(adminApp);
        const spotsRef = adminDb.collection('spots');
        const snapshot = await spotsRef.get();
        const spots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Spot));
        return NextResponse.json(spots);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function POST(req: NextRequest) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    try {
        const adminApp = safeGetAdminApp();
        const adminDb = admin.firestore(adminApp);
        const spotData = await req.json();
        const docRef = await adminDb.collection('spots').add({
            ...spotData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const newSpot = { id: docRef.id, ...spotData };
        return NextResponse.json(newSpot, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
