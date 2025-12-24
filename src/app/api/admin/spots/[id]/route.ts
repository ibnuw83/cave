
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/firebase/admin';
import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    try {
        const { id } = params;
        const spotData = await req.json();
        const docRef = adminDb.collection('spots').doc(id);
        
        await docRef.update({
            ...spotData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const updatedDoc = await docRef.get();
        return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error: any) {
        console.error(`Error updating spot ${params.id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    try {
        const { id } = params;
        await adminDb.collection('spots').doc(id).delete();
        return NextResponse.json({ message: `Spot ${id} berhasil dihapus.` });
    } catch (error: any) {
        console.error(`Error deleting spot ${params.id}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
