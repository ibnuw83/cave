
import { NextRequest, NextResponse } from 'next/server';
import { safeGetAdminApp } from '@/firebase/admin';
import type { Location } from '@/lib/types';
import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

async function verifyAdmin(req: NextRequest): Promise<DecodedIdToken | null> {
  const services = safeGetAdminApp();
  if (!services) return null;

  const { auth, db } = services;

  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  const idToken = authorization.replace('Bearer ', '');

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (userDoc.exists && userDoc.data()?.role === 'admin') {
      return decodedToken;
    }
    return null;
  } catch (err) {
    console.error('[verifyAdmin]', err);
    return null;
  }
}

export async function GET(req: NextRequest) {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
        return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    
    const services = safeGetAdminApp();
    if (!services) return NextResponse.json({ error: 'Admin SDK tidak tersedia.' }, { status: 500 });
    const { db } = services;

    try {
        const locationsRef = db.collection('locations');
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
    
    const services = safeGetAdminApp();
    if (!services) return NextResponse.json({ error: 'Admin SDK tidak tersedia.' }, { status: 500 });
    const { db } = services;

    try {
        const locationData: Omit<Location, 'id' | 'miniMap'> = await req.json();
        
        const dataToSave = {
          ...locationData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          miniMap: { nodes: [], edges: [] }
        };

        const docRef = await db.collection('locations').add(dataToSave);
        const newLocation = { id: docRef.id, ...dataToSave };
        return NextResponse.json(newLocation, { status: 201 });
    } catch (error: any) {
        console.error("Error creating location: ", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
