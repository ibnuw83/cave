
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/firebase/admin';
import * as admin from 'firebase-admin';

async function verifyAdmin(req: NextRequest) {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) return null;
    try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
        return userDoc.exists && userDoc.data()?.role === 'admin' ? decoded : null;
    } catch (e) {
        return null;
    }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    try {
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
