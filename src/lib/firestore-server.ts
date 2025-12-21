
import { safeGetAdminApp } from '@/firebase/admin';
import { Location, Spot } from './types';

// This function now uses safeGetAdminApp to avoid crashing if the Admin SDK isn't initialized.
const getDb = () => {
    const app = safeGetAdminApp();
    if (!app) {
        // This log is important for debugging server-side rendering issues.
        console.warn(`[Firestore Server] Firebase Admin SDK is not available. Server-side data fetching is disabled.`);
    }
    return app?.db;
}

export async function getLocations(includeInactive = false): Promise<Location[]> {
    const db = getDb();
    if (!db) return [];
    
    try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('locations');

        if (!includeInactive) {
            query = query.where('isActive', '==', true);
        }
        
        const snapshot = await query.get();
        if (snapshot.empty) {
            return [];
        }
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
    } catch (error: any) {
        console.error("[Firestore Server] Failed to getLocations:", error.message);
        return [];
    }
}

export async function getLocation(id: string): Promise<Location | null> {
    const db = getDb();
    if (!db) return null;
    
    try {
        const docRef = db.collection('locations').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return null;
        }

        const location = { id: docSnap.id, ...docSnap.data() } as Location;

        // Ensure we don't return inactive locations on server-side fetching either.
        if (!location.isActive) {
            return null;
        }

        return location;
    } catch (error: any) {
        console.error(`[Firestore Server] Failed to getLocation for id ${id}:`, error.message);
        return null;
    }
}

export async function getSpots(locationId: string): Promise<Spot[]> {
    const db = getDb();
    if (!db) return [];

    try {
        const spotsRef = db.collection('spots');
        const q = spotsRef.where('locationId', '==', locationId);
        const querySnapshot = await q.get();
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Spot));
    } catch (error: any) {
        console.error(`[Firestore Server] Failed to getSpots for locationId ${locationId}:`, error.message);
        return [];
    }
}

export async function getSpotClient(id: string): Promise<Spot | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const docRef = db.collection('spots').doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as Spot;
    }
    return null;
  } catch (error: any) {
    console.error(`[Firestore Server] Failed to getSpotClient for id ${id}:`, error.message);
    return null;
  }
}
