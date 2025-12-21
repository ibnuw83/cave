'use server';

import { initializeAdminApp } from '@/firebase/admin';
import { Location, Spot } from './types';

const handleAuthError = (error: any, context: string) => {
    console.error(`[Firestore Server Error] in ${context}:`, error.message);
    if (error.message.includes('Could not refresh access token') || error.code === 'auth/invalid-credential') {
        console.warn(`\n[ACTION REQUIRED] Firebase Admin SDK authentication failed. 
If you are running locally, try authenticating with the gcloud CLI: 
$ gcloud auth application-default login
Then, restart the development server.\n`);
    }
    return null; // Return null or empty array to prevent crash
}

export async function getLocations(includeInactive = false): Promise<Location[]> {
    try {
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
    } catch (error) {
        handleAuthError(error, 'getLocations');
        return [];
    }
}

export async function getLocation(id: string): Promise<Location | null> {
    try {
        const { db } = await initializeAdminApp();
        const docRef = db.collection('locations').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return null;
        }

        return { id: docSnap.id, ...docSnap.data() } as Location;
    } catch (error) {
        handleAuthError(error, `getLocation(id: ${id})`);
        return null;
    }
}

export async function getSpots(locationId: string): Promise<Spot[]> {
    try {
        const { db } = await initializeAdminApp();
        const spotsRef = db.collection('spots');
        const q = spotsRef.where('locationId', '==', locationId);
        const querySnapshot = await q.get();
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
    } catch (error) {
        handleAuthError(error, `getSpots(locationId: ${locationId})`);
        return [];
    }
}
