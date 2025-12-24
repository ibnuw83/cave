
import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    try {
        const adminApp = safeGetAdminApp();
        const adminDb = admin.firestore(adminApp);
        const { id } = params;
        const docRef = adminDb.collection('locations').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: 'Lokasi tidak ditemukan.' }, { status: 404 });
        }

        return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
    } catch (error: any) {
        console.error(`Error fetching location ${params.id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    try {
        const adminApp = safeGetAdminApp();
        const adminDb = admin.firestore(adminApp);
        const { id } = params;
        const locationData = await req.json();
        const docRef = adminDb.collection('locations').doc(id);
        
        await docRef.update({
            ...locationData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        const updatedDoc = await docRef.get();
        return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error: any) {
        console.error(`Error updating location ${params.id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    try {
        const adminApp = safeGetAdminApp();
        const adminDb = admin.firestore(adminApp);
        const { id } = params;
        const batch = adminDb.batch();
        const locationRef = adminDb.collection('locations').doc(id);
        
        batch.delete(locationRef);

        const spotsQuery = adminDb.collection('spots').where('locationId', '==', id);
        const spotsSnapshot = await spotsQuery.get();
        spotsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        
        return NextResponse.json({ message: `Lokasi ${id} dan spot-spotnya berhasil dihapus.` });
    } catch (error: any) {
        console.error(`Error deleting location ${params.id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
