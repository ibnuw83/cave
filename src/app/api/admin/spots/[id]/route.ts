
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
