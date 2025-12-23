
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/firebase/admin';
import type { Spot } from '@/lib/types';
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


export async function GET(req: NextRequest) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    try {
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
