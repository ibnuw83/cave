
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/firebase/admin';
import { createLocation, getLocations, updateLocation } from '@/lib/firestore-admin';

async function verifyAdmin(req: NextRequest) {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) return null;
    try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const userDoc = await (await import('@/firebase/admin')).adminDb.collection('users').doc(decoded.uid).get();
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
        const locations = await getLocations(true); // Get all locations, active and inactive
        return NextResponse.json(locations);
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
        const locationData = await req.json();
        const newLocation = await createLocation(locationData);
        return NextResponse.json(newLocation, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
