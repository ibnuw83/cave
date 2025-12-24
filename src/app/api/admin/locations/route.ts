
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/firebase/admin';
import type { Location } from '@/lib/types';
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

export async function GET(req: NextRequest) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    try {
        const locationsRef = adminDb.collection('locations');
        const querySnapshot = await locationsRef.get();
        const locations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
        return NextResponse.json(locations);
    } catch (error: any) {
        console.error("Error fetching locations: ", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    try {
        const locationData: Omit<Location, 'id' | 'miniMap'> = await req.json();
        
        const dataToSave = {
          ...locationData,
          miniMap: { nodes: [], edges: [] }
        };

        const docRef = await adminDb.collection('locations').add(dataToSave);
        const newLocation = { id: docRef.id, ...dataToSave };
        return NextResponse.json(newLocation, { status: 201 });
    } catch (error: any) {
        console.error("Error creating location: ", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
