'use server';

import { initializeAdminApp } from '@/firebase/admin';
import { Location, Spot } from './types';

export async function getLocations(includeInactive = false): Promise<Location[]> {
    const { db } = await initializeAdminApp();
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('locations');

    if (!includeInactive) {
        query = query.where('isActive', '==', true);
    }
    
    const snapshot = await query.get();
    if (snapshot.empty) {
        return [];
    }
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
}

export async function getLocation(id: string): Promise<Location | null> {
    const { db } = await initializeAdminApp();
    const docRef = db.collection('locations').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as Location;
}

export async function getSpots(locationId: string): Promise<Spot[]> {
    const { db } = await initializeAdminApp();
    const spotsRef = db.collection('spots');
    const q = spotsRef.where('locationId', '==', locationId);
    const querySnapshot = await q.get();
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
}
